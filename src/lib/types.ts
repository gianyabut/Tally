export type Role = "admin" | "manager" | "hr" | "staff";

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type Membership = {
  id: string;
  user_id: string;
  team_id: string;
  role: Role;
  joined_at: string;
};

export type YearSettings = {
  id: string;
  user_id: string;
  year: number;
  vl_credits: number;
  sl_credits: number;
  il_carryover: number;
};

/** The current fiscal year the app operates on (v1 is single-year: 2026). */
export const FISCAL_YEAR = 2026;
