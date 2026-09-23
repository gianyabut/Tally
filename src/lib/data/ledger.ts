import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { YearSettings } from "@/lib/types";

export async function getYearSettings(
  year: number,
): Promise<YearSettings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("year_settings")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .maybeSingle();

  return (data as YearSettings | null) ?? null;
}
