import { describe, expect, it } from 'vitest'
import { previousPtcDispatchOrdinal } from '../src/ptc-subcall-ids.ts'

type PtcEvent = { type: string; data?: unknown }
const dispatched = (subCallId: string): PtcEvent =>
  ({ type: 'tool/ptc-dispatch-start', data: { subCallId } })
const settled = (subCallId: string): PtcEvent =>
  ({ type: 'tool/ptc-dispatch', data: { subCallId } })

describe('PTC subcall ID recovery on repeated run_code calls', () => {
  it('starts from zero if the session has no related events', () => {
    expect(previousPtcDispatchOrdinal('outer-call', [])).toBe(0)
    expect(previousPtcDispatchOrdinal('outer-call', [dispatched('other-call:ptc:4')])).toBe(0)
  })

  it('continues after the highest ordinal; start and settle count once', () => {
    const session = [
      dispatched('call-1:ptc:1'),
      settled('call-1:ptc:1'),
      dispatched('call-1:ptc:3'),
      settled('call-1:ptc:2'),
    ]
    expect(previousPtcDispatchOrdinal('call-1', session)).toBe(3)
    const resumedCallId = `call-1:ptc:${previousPtcDispatchOrdinal('call-1', session) + 1}`
    expect(resumedCallId).toBe('call-1:ptc:4')
    expect(session.every((event) => (event.data as { subCallId: string }).subCallId !== resumedCallId)).toBe(true)
  })

  it('recovers from JSON-reloaded persisted events, not process memory', () => {
    const original = [dispatched('repeat:ptc:1'), settled('repeat:ptc:1')]
    const restored = JSON.parse(JSON.stringify(original)) as PtcEvent[]
    expect(previousPtcDispatchOrdinal('repeat', restored)).toBe(1)
    expect(previousPtcDispatchOrdinal('repeat', [...restored, dispatched('repeat:ptc:2')])).toBe(2)
  })

  it('ignores malformed, other-call, and non-safe-integer identifiers', () => {
    expect(previousPtcDispatchOrdinal('a', [
      dispatched('a:ptc:0'),
      dispatched('a:ptc:-1'),
      dispatched('a:ptc:3suffix'),
      dispatched('a:ptc:9007199254740992'),
      dispatched('ab:ptc:99'),
      { type: 'tool/ptc-dispatch-start', data: null },
      { type: 'tool/something-else', data: { subCallId: 'a:ptc:98' } },
      settled('a:ptc:7'),
    ])).toBe(7)
  })
})
