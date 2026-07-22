/** BR-028 / UI-UX-SPEC §6.4: a client-generated key that stays the same across
 *  retries of the same logical action, so the backend can dedupe a resend.
 *  Phase 2 (mock) threads it through the mutation call; Phase 3 attaches it as
 *  the 'Idempotency-Key' request header on the real POST. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
