-- ============================================================================
-- Seed: empresas argentinas con alto volumen de reclamos públicos.
-- Cargar manualmente en Supabase SQL Editor o vía `supabase db reset`.
-- ============================================================================

insert into public.companies (name, slug, industry, is_legitimate) values
  -- Bancos
  ('Banco Nación', 'banco-nacion', 'bank', true),
  ('Banco Galicia', 'banco-galicia', 'bank', true),
  ('Banco Macro', 'banco-macro', 'bank', true),
  ('Banco Santander', 'banco-santander', 'bank', true),
  ('Banco BBVA', 'banco-bbva', 'bank', true),
  ('Mercado Pago', 'mercado-pago', 'bank', true),
  ('Ualá', 'uala', 'bank', true),
  -- Telco
  ('Movistar', 'movistar', 'telco', true),
  ('Claro', 'claro', 'telco', true),
  ('Personal', 'personal', 'telco', true),
  -- ISP
  ('Telecentro', 'telecentro', 'isp', true),
  ('Fibertel', 'fibertel', 'isp', true),
  ('IPLAN', 'iplan', 'isp', true),
  -- Seguros
  ('Federación Patronal', 'federacion-patronal', 'insurance', true),
  ('La Caja', 'la-caja', 'insurance', true),
  ('Sancor Seguros', 'sancor-seguros', 'insurance', true),
  ('Swiss Medical Seguros', 'swiss-medical-seguros', 'insurance', true),
  -- E-commerce
  ('MercadoLibre', 'mercadolibre', 'ecommerce', true),
  ('Tiendanube', 'tiendanube', 'ecommerce', true),
  ('Falabella', 'falabella', 'ecommerce', true),
  ('Garbarino', 'garbarino', 'ecommerce', true),
  ('Frávega', 'fravega', 'ecommerce', true)
on conflict (slug) do nothing;
