export function normalizeWhatsApp(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\+?[0-9][0-9\s-]{7,18}$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;
  return `+${digits}`;
}

/** Only acknowledge a profile write after one saved row reads back. */
export function requireSavedProfile<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error("Your profile could not be saved. Please try again.");
  return result.data;
}