// AES-256-GCM helpers (Web Crypto). Key comes from TOKEN_ENCRYPTION_KEY.
async function key(secret: string, usage: KeyUsage[]) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, usage);
}

export async function encryptSecret(plain: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(secret, ["encrypt"]), new TextEncoder().encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return "v1:" + btoa(String.fromCharCode(...out));
}

export async function decryptSecret(enc: string, secret: string): Promise<string> {
  const bytes = Uint8Array.from(atob(enc.replace(/^v1:/, "")), (c) => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, await key(secret, ["decrypt"]), bytes.slice(12));
  return new TextDecoder().decode(pt);
}
