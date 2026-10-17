/**
 * Allocate PTC child-call ordinals without reading historical Session events.
 *
 * Session.seq is the durable event-log watermark. Every dispatched child
 * records a start event, so a restored session's seq exceeds the ordinals
 * previously allocated and logged by that session. A per-live-Session counter
 * also reserves ordinals across overlapping run_code executions.
 *
 * This prevents collisions within one Session. It does not repair already
 * corrupted logs or coordinate distinct live Session objects writing the
 * same underlying log concurrently.
 */
const nextOrdinals = new WeakMap<object, number>()

export function nextPtcDispatchOrdinal(session: object, persistedSeq: number): number {
  const durable = Number.isSafeInteger(persistedSeq) && persistedSeq >= 0 ? persistedSeq : 0
  const floor = Math.max(durable, nextOrdinals.get(session) ?? 0)
  if (floor >= Number.MAX_SAFE_INTEGER) throw new RangeError('PTC sub-call ordinal exhausted')
  const next = floor + 1
  nextOrdinals.set(session, next)
  return next
}
