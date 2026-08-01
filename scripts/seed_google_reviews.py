"""
seed_google_reviews.py
======================
Pobla la base de quejas-ar con empresas y posts basados en reseñas negativas
de Google Maps en CABA.

Optimización: arranca con una lista curada de empresas (desde tuquejasuma.com
+ seed.sql conocidas) en lugar de una búsqueda geográfica masiva.
Flujo por empresa: máximo 2 API calls (Text Search + Place Details).

Uso:
    python seed_google_reviews.py              # inserta en Supabase
    python seed_google_reviews.py --dry-run    # solo imprime, no inserta

Variables de entorno (.env o export):
    GOOGLE_PLACES_API_KEY
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
"""

import argparse
import json
import os
import re
import sys
import time
import uuid
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"
CACHE_FILE = Path(__file__).parent / "cache" / "places_cache.json"
SEED_BOT_ID = "00000000-0000-0000-0000-000000000001"

SCAM_KW = [
    "estafa", "fraude", "trucho", "trucha", "robo", "robaron",
    "timador", "tima", "engaño", "engañan", "me robaron", "fraude",
]
COMPLAINT_KW = [
    "pésimo", "pesimo", "horrible", "no recomiendo", "no responden",
    "no funciona", "no funciono", "problema", "problemas", "nunca",
    "mentira", "tardaron", "tardó", "tardo", "muy malo", "muy mala",
    "no devuelven", "no atienden", "malísimo", "malisimo", "desastre",
    "basura", "vergüenza", "verguenza",
]

# Empresas base (de seed.sql) + extras conocidas en CABA
SEED_COMPANIES = [
    "Banco Nación Argentina",
    "Banco Galicia",
    "Banco Macro",
    "Banco Santander Argentina",
    "Banco BBVA Argentina",
    "Mercado Pago",
    "Ualá",
    "Movistar Argentina",
    "Claro Argentina",
    "Personal Argentina",
    "Telecentro",
    "Fibertel",
    "IPLAN",
    "Federación Patronal Seguros",
    "La Caja Seguros",
    "Sancor Seguros",
    "Swiss Medical Seguros",
    "MercadoLibre",
    "Tiendanube",
    "Falabella Argentina",
    "Garbarino",
    "Fravega",
    # Extras con historial de quejas en CABA
    "Naranja X",
    "BIND Banco Industrial",
    "Banco Supervielle",
    "Banco Hipotecario",
    "Banco Ciudad Buenos Aires",
    "Banco Patagonia",
    "Banco Comafi",
    "Cabify Argentina",
    "Rappi Argentina",
    "PedidosYa Argentina",
    "Despegar Argentina",
    "Despegar.com",
    "Frávega",
    "Musimundo",
    "Ribeiro",
    "Megatone",
    "Easy Argentina",
    "Walmart Argentina",
    "Carrefour Argentina",
    "OSDE",
    "Swiss Medical Medicina Privada",
    "Medifé",
    "Accord Salud",
    "Préstamos Personales Credicoop",
    "Tarjeta Naranja",
    "Visa Argentina",
    "Mastercard Argentina",
    "American Express Argentina",
    "DirectTV Argentina",
    "Cablevisión Argentina",
    "Flow Argentina",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[áàä]", "a", name)
    name = re.sub(r"[éèë]", "e", name)
    name = re.sub(r"[íìï]", "i", name)
    name = re.sub(r"[óòö]", "o", name)
    name = re.sub(r"[úùü]", "u", name)
    name = re.sub(r"ñ", "n", name)
    name = re.sub(r"[^a-z0-9\s-]", "", name)
    name = re.sub(r"[\s]+", "-", name)
    name = re.sub(r"-+", "-", name).strip("-")
    return name


def infer_industry(name: str) -> str:
    n = name.lower()
    if any(k in n for k in ["banco", "pago", "financiero", "crédito", "credito",
                             "hipotecario", "comafi", "patagonia", "supervielle",
                             "galicia", "macro", "bbva", "santander", "nacion",
                             "bind", "naranja", "visa", "mastercard", "amex",
                             "american express", "tarjeta", "prestamo", "credicoop",
                             "uala", "mercado pago"]):
        return "bank"
    if any(k in n for k in ["seguro", "medic", "salud", "osde", "medife",
                             "accord", "swiss medical", "sancor", "patronal",
                             "caja seguros"]):
        return "insurance"
    if any(k in n for k in ["movistar", "claro", "personal", "celular", "telecom"]):
        return "telco"
    if any(k in n for k in ["internet", "fibra", "wifi", "cable", "iplan",
                             "telecentro", "fibertel", "cablevision", "directv", "flow"]):
        return "isp"
    return "ecommerce"


def contains_keywords(text: str, keywords: list[str]) -> bool:
    t = text.lower()
    return any(kw in t for kw in keywords)


def classify_review(text: str, rating: int) -> str | None:
    """Devuelve el tipo de post o None si no aplica."""
    if rating > 2:
        return None
    if contains_keywords(text, SCAM_KW):
        return "scam_report"
    if contains_keywords(text, COMPLAINT_KW):
        return "complaint"
    return None


def load_cache() -> dict:
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache: dict) -> None:
    CACHE_FILE.parent.mkdir(exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# Scraping tuquejasuma.com
# ---------------------------------------------------------------------------

def scrape_tuquejasuma() -> list[str]:
    print("→ Scrapeando tuquejasuma.com/ultimos-reclamos...")
    try:
        resp = requests.get(
            "https://tuquejasuma.com/ultimos-reclamos",
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        names = set()
        # Buscar distintos patrones donde aparece el nombre de la empresa
        for tag in soup.find_all(["h2", "h3", "h4", "strong", "a", "span"]):
            text = tag.get_text(strip=True)
            # Filtrar texto corto o muy largo (probablemente no es nombre de empresa)
            if 3 < len(text) < 60 and not text.startswith("http"):
                # Excluir textos que parecen navegación o UI
                skip = ["reclamo", "último", "ultimo", "ver más", "inicio",
                        "login", "registr", "buscar", "categoría", "empresa"]
                if not any(s in text.lower() for s in skip):
                    names.add(text.strip())

        scraped = list(names)
        print(f"   Encontradas {len(scraped)} empresas potenciales en tuquejasuma.com")
        return scraped
    except Exception as e:
        print(f"   ⚠ No se pudo scrapear tuquejasuma.com: {e}")
        return []


# ---------------------------------------------------------------------------
# Google Places API
# ---------------------------------------------------------------------------

def places_text_search(query: str, api_key: str, cache: dict) -> dict | None:
    cache_key = f"search:{query}"
    if cache_key in cache:
        return cache[cache_key]

    resp = requests.get(
        f"{PLACES_API_BASE}/textsearch/json",
        params={
            "query": query,
            "key": api_key,
            "language": "es",
            "region": "ar",
        },
        timeout=10,
    )
    data = resp.json()
    result = data.get("results", [None])[0]
    cache[cache_key] = result
    save_cache(cache)
    time.sleep(0.3)  # evitar rate limit
    return result


def places_get_details(place_id: str, api_key: str, cache: dict) -> dict | None:
    cache_key = f"details:{place_id}"
    if cache_key in cache:
        return cache[cache_key]

    resp = requests.get(
        f"{PLACES_API_BASE}/details/json",
        params={
            "place_id": place_id,
            "fields": "name,rating,reviews,website",
            "key": api_key,
            "language": "es",
            "reviews_sort": "newest",
        },
        timeout=10,
    )
    data = resp.json()
    result = data.get("result")
    cache[cache_key] = result
    save_cache(cache)
    time.sleep(0.3)
    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(dry_run: bool) -> None:
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not api_key:
        sys.exit("✗ Falta GOOGLE_PLACES_API_KEY")
    if not dry_run and (not supabase_url or not supabase_key):
        sys.exit("✗ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")

    sb = None if dry_run else create_client(supabase_url, supabase_key)

    # --- Seed bot profile ---
    if not dry_run:
        sb.table("profiles").upsert({
            "id": SEED_BOT_ID,
            "alias": "quejas_bot",
            "phone_verified": True,
            "trust_score": 100,
        }, on_conflict="id").execute()
        print("✓ Seed bot profile listo")

    # --- Lista de empresas ---
    scraped = scrape_tuquejasuma()
    all_companies = list({*SEED_COMPANIES, *scraped})
    print(f"→ Total empresas a procesar: {len(all_companies)}\n")

    cache = load_cache()
    inserted_companies = 0
    inserted_posts = 0

    for company_name in all_companies:
        query = f"{company_name} Buenos Aires Argentina"
        print(f"  [{company_name}]")

        place = places_text_search(query, api_key, cache)
        if not place:
            print(f"    ✗ No encontrado en Places")
            continue

        rating = place.get("rating", 5.0)
        place_id = place.get("place_id")
        print(f"    Rating: {rating} | place_id: {place_id}")

        if rating >= 3.5:
            print(f"    → Skip (rating OK, no quejas esperadas)")
            continue

        details = places_get_details(place_id, api_key, cache)
        if not details:
            print(f"    ✗ Sin detalles")
            continue

        reviews = details.get("reviews") or []
        website = details.get("website")
        official_name = details.get("name", company_name)

        slug = slugify(official_name)
        industry = infer_industry(official_name)

        company_row = {
            "name": official_name,
            "slug": slug,
            "industry": industry,
            "is_legitimate": True,
            "website": website,
        }

        posts_for_company = []
        for review in reviews:
            r_rating = review.get("rating", 5)
            r_text = review.get("text", "").strip()
            if not r_text or len(r_text) < 20:
                continue

            post_type = classify_review(r_text, r_rating)
            if not post_type:
                continue

            title = r_text[:80].rstrip() + ("…" if len(r_text) > 80 else "")
            posts_for_company.append({
                "type": post_type,
                "title": title,
                "body": r_text,
                "sentiment": "negative",
                "status": "published",
                "evidence_urls": [],
            })

        if not posts_for_company:
            print(f"    → Sin reviews que clasifiquen")
            continue

        print(f"    ✓ {len(posts_for_company)} posts a insertar ({industry})")

        if dry_run:
            print(f"    [DRY RUN] company: {company_row}")
            for p in posts_for_company:
                print(f"    [DRY RUN] post ({p['type']}): {p['title'][:60]}")
            continue

        # Upsert company
        res = sb.table("companies").upsert(
            company_row, on_conflict="slug"
        ).execute()
        company_id = res.data[0]["id"] if res.data else None

        if not company_id:
            # Si ya existía, buscarlo
            res2 = sb.table("companies").select("id").eq("slug", slug).single().execute()
            company_id = res2.data["id"] if res2.data else None

        if not company_id:
            print(f"    ✗ No se pudo obtener company_id")
            continue

        inserted_companies += 1

        for p in posts_for_company:
            sb.table("posts").insert({
                **p,
                "user_id": SEED_BOT_ID,
                "company_id": company_id,
            }).execute()
            inserted_posts += 1

    print(f"\n{'[DRY RUN] ' if dry_run else ''}Resumen:")
    print(f"  Empresas insertadas: {inserted_companies}")
    print(f"  Posts insertados:    {inserted_posts}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Imprimir sin insertar")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
