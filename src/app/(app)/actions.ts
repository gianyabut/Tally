"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deriveBalances, availableFor } from "@/lib/ledger/balances";
import type { Entry } from "@/lib/ledger/types";

const PROOF_BUCKET = "proofs";

type Result = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  return { supabase, user };
}

async function uploadProof(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entryId: string,
  file: File,
): Promise<Result> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "proof";
  const path = `${userId}/${entryId}/${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { ok: false, error: upErr.message };

  // One proof per entry — upsert the row.
  const { error: rowErr } = await supabase.from("proofs").upsert(
    {
      entry_id: entryId,
      user_id: userId,
      file_path: path,
      file_name: safeName,
      size_bytes: file.size,
    },
    { onConflict: "entry_id" },
  );
  if (rowErr) return { ok: false, error: rowErr.message };
  return { ok: true };
}

/** Log holiday work: create the holiday_work entry, then attach its proof. */
export async function logHolidayWork(formData: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();

  const holidayId = String(formData.get("holidayId") ?? "");
  const portion = String(formData.get("portion") ?? "full") as "full" | "half";
  const creditAs = String(formData.get("creditAs") ?? "il") as "il" | "ot";
  const file = formData.get("proof");

  if (!holidayId) return { ok: false, error: "Pick a holiday" };
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Attach a proof image first — it's required" };

  const { data: holiday } = await supabase
    .from("holidays")
    .select("id,date")
    .eq("id", holidayId)
    .maybeSingle();
  if (!holiday) return { ok: false, error: "Holiday not found" };

  const amount = portion === "full" ? 1 : 0.5;
  const year = parseInt(holiday.date.slice(0, 4), 10);

  const { data: entry, error: entryErr } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      date_start: holiday.date,
      date_end: holiday.date,
      year,
      kind: "holiday_work",
      portion,
      credit_as: creditAs,
      amount,
      holiday_id: holidayId,
    })
    .select("id")
    .single();
  if (entryErr || !entry)
    return { ok: false, error: entryErr?.message ?? "Could not save entry" };

  const up = await uploadProof(supabase, user.id, entry.id, file);
  if (!up.ok) {
    // Roll back the entry so we don't leave it pending on a failed upload.
    await supabase.from("entries").delete().eq("id", entry.id);
    return up;
  }

  revalidatePath("/ledger");
  return { ok: true };
}

/** File a leave, blocking if it exceeds the available balance for its source. */
export async function fileLeave(input: {
  source: "vl" | "sl" | "il" | "unpaid";
  days: number;
  startDate: string; // yyyy-mm-dd
  note: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();

  const days = Math.max(0.5, input.days);
  const year = parseInt(input.startDate.slice(0, 4), 10);

  // Recompute balances server-side; never trust the client's math.
  const [{ data: ys }, { data: rows }] = await Promise.all([
    supabase
      .from("year_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("year", year)
      .maybeSingle(),
    supabase
      .from("entries")
      .select("*, proof:proofs(id,file_path,file_name,size_bytes)")
      .eq("user_id", user.id)
      .eq("year", year),
  ]);
  if (!ys) return { ok: false, error: "No credits set for this year" };

  const entries: Entry[] = (rows ?? []).map((r: Record<string, unknown>) => {
    const arr = (r.proof as Entry["proof"][] | null) ?? [];
    return {
      ...(r as unknown as Omit<Entry, "proof">),
      proof: arr[0] ?? null,
    };
  });
  const balances = deriveBalances(entries, ys);

  if (input.source !== "unpaid" && availableFor(input.source, balances) < days)
    return { ok: false, error: `Not enough ${input.source.toUpperCase()}` };

  // End date = start + (days rounded up − 1) calendar days.
  const start = new Date(input.startDate + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + Math.max(0, Math.ceil(days) - 1));

  const kind =
    input.source === "il"
      ? "il_spend"
      : input.source === "unpaid"
        ? "unpaid"
        : input.source; // vl | sl

  const { error } = await supabase.from("entries").insert({
    user_id: user.id,
    date_start: input.startDate,
    date_end: end.toISOString().slice(0, 10),
    year,
    kind,
    amount: -days,
    note: input.note.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/ledger");
  return { ok: true };
}

/** Attach (or replace) the proof on an existing pending holiday-work entry. */
export async function attachProof(formData: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const entryId = String(formData.get("entryId") ?? "");
  const file = formData.get("proof");
  if (!entryId) return { ok: false, error: "Missing entry" };
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Choose an image" };

  const { data: entry } = await supabase
    .from("entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!entry) return { ok: false, error: "Entry not found" };

  const up = await uploadProof(supabase, user.id, entryId, file);
  if (!up.ok) return up;

  revalidatePath("/ledger");
  return { ok: true };
}

/** Remove a proof (reverts a holiday-work entry to pending). */
export async function removeProof(entryId: string): Promise<Result> {
  const { supabase, user } = await requireUser();

  const { data: proof } = await supabase
    .from("proofs")
    .select("file_path")
    .eq("entry_id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (proof?.file_path) {
    await supabase.storage.from(PROOF_BUCKET).remove([proof.file_path]);
  }
  const { error } = await supabase
    .from("proofs")
    .delete()
    .eq("entry_id", entryId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/ledger");
  return { ok: true };
}

/** Signed URL for viewing a private proof image. */
export async function getProofUrl(filePath: string): Promise<string | null> {
  const { supabase } = await requireUser();
  const { data } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(filePath, 60 * 10);
  return data?.signedUrl ?? null;
}
