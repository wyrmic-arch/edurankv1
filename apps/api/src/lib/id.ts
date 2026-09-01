const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function shortId(len = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export function uuid(): string {
  return crypto.randomUUID();
}

const REFERRAL_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function referralCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let out = "";
  for (let i = 0; i < 6; i++) out += REFERRAL_ALPHABET[bytes[i]! % REFERRAL_ALPHABET.length];
  return out;
}
