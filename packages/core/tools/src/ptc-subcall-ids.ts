/**
 * Recover the highest previously persisted sub-dispatch ordinal for a provider
 * call ID. The run_code ordinal alone restarts at 1 on retries and can make
 * Session v4 reject the repeated subCallId during reconstruction.
 *
 * Both the start and settle event refer to one dispatch, so take the maximum
 * (not a count). Ignore unrelated, malformed, and non-safe-integer IDs.
 */
export function previousPtcDispatchOrdinal(
  callId: string,
  events: Iterable<{ type: string; data?: unknown }>,
): number {
  const prefix = `${callId}:ptc:`
  let maximum = 0
  for (const event of events) {
    if (event.type !== 'tool/ptc-dispatch-start' && event.type !== 'tool/ptc-dispatch') continue
    const data = event.data
    if (data === null || typeof data !== 'object') continue
    const id = (data as { subCallId?: unknown }).subCallId
    if (typeof id !== 'string' || !id.startsWith(prefix)) continue
    const suffix = id.slice(prefix.length)
    if (!/^[1-9]\d*$/.test(suffix)) continue
    const ordinal = Number(suffix)
    if (Number.isSafeInteger(ordinal)) maximum = Math.max(maximum, ordinal)
  }
  return maximum
}
