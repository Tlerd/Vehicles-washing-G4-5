/** Single source of truth for Vietnamese phone validation/normalization
 *  (bug #4: previously duplicated ad hoc across call sites). Accepts local
 *  "0xxxxxxxxx" or already-E.164 "+84xxxxxxxxx", validates against the
 *  mobile prefixes used by BR-001-era booking forms. */
const VN_MOBILE_LOCAL_RE = /^0[35789][0-9]{8}$/;
const VN_MOBILE_E164_RE = /^\+84[35789][0-9]{8}$/;

export function isValidVnPhone(input: string): boolean {
  const trimmed = input.trim();
  return VN_MOBILE_LOCAL_RE.test(trimmed) || VN_MOBILE_E164_RE.test(trimmed);
}

/** Returns E.164 ("+84xxxxxxxxx") or null if the input isn't a valid VN mobile. */
export function toE164(input: string): string | null {
  const trimmed = input.trim();
  if (VN_MOBILE_E164_RE.test(trimmed)) return trimmed;
  if (VN_MOBILE_LOCAL_RE.test(trimmed)) return `+84${trimmed.slice(1)}`;
  return null;
}
