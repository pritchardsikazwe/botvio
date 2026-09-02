/**
 * Turns a Supabase Edge Function error (FunctionsHttpError) into a readable
 * message by reading the JSON body the function returned.
 */
export async function readFunctionError(error: any): Promise<{ message: string; code?: string }> {
  const res: Response | undefined = error?.context;
  let body: any = null;
  if (res && typeof res.json === "function") {
    try {
      body = await res.clone().json();
    } catch {
      body = null;
    }
  }
  const code = body?.error_code as string | undefined;
  const status = res?.status;

  if (code === "payment_required" || status === 402) {
    return {
      message: "AI chart analysis is temporarily unavailable (AI credits exhausted). Please try again later.",
      code: "payment_required",
    };
  }
  if (code === "rate_limited" || status === 429) {
    return { message: "Too many requests right now. Please wait a moment and try again.", code: "rate_limited" };
  }
  return { message: body?.error || error?.message || "Could not analyze that chart. Please try again.", code };
}
