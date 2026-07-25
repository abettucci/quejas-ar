import type { Industry, PostType } from "./constants";

export type PostStatus = "pending_moderation" | "published" | "rejected";
export type Sentiment = "negative" | "positive" | "neutral";

export type Profile = {
  id: string;
  alias: string;
  trust_score: number;
  phone_verified: boolean;
  is_moderator: boolean;
  created_at: string;
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  industry: Industry;
  is_legitimate: boolean;
  instagram: string | null;
  website: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  company_id: string | null;
  type: PostType;
  title: string;
  body: string;
  evidence_urls: string[];
  sentiment: Sentiment | null;
  status: PostStatus;
  upvotes: number;
  downvotes: number;
  created_at: string;
};

export type PostWithRelations = Post & {
  profile: Pick<Profile, "alias" | "trust_score"> | null;
  company: Pick<Company, "name" | "slug" | "industry" | "is_legitimate"> | null;
};

export type Vote = {
  user_id: string;
  post_id: string;
  value: 1 | -1;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
