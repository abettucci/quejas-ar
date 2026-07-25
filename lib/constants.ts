export const INDUSTRIES = [
  { value: "insurance", label: "Seguros" },
  { value: "bank", label: "Bancos" },
  { value: "telco", label: "Telefonía" },
  { value: "isp", label: "Internet" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "scam", label: "Página trucha" },
] as const;

export const POST_TYPES = [
  { value: "complaint", label: "Reclamo", description: "Mal servicio o problema sin resolver con una empresa real" },
  { value: "experience", label: "Experiencia / Truco", description: "Cómo lograste un buen resultado o un consejo útil" },
  { value: "scam_report", label: "Denuncia de página trucha", description: "Reportar Instagram, web o cuenta que estafa" },
] as const;

export const POINTS = {
  COMPLAINT_PUBLISHED: 10,
  EXPERIENCE_PUBLISHED: 5,
  SCAM_REPORT_PUBLISHED: 15,
  UPVOTE_RECEIVED: 1,
  COMMENT_POSTED: 2,
} as const;

export const TRUST_THRESHOLD_AUTO_PUBLISH = 3;
export const MAX_POSTS_PER_DAY = 3;
export type Industry = (typeof INDUSTRIES)[number]["value"];
export type PostType = (typeof POST_TYPES)[number]["value"];
