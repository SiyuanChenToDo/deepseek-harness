// Independent contract test of DSH PTC subcall identity (Discussion #9677).
// This is a reproducer of the current ID-generation formula, NOT an end-to-end
// integration test of DSH core/tools or a production fix.
import test from 'node:test';
import assert from 'node:assert/strict';

function legacyIds(callId, size) {
  let dispatches = 0;
  return Array.from({ length: size }, () => `${callId}:ptc:${++dispatches}`);
}

test('repeated provider call ID collides across execute invocations', () => {
  const a = legacyIds('tool-1', 2);
  const b = legacyIds('tool-1', 2);
  assert.deepEqual(a, b);
  assert.equal(new Set([...a, ...b]).size, 2);
});

test('independent prefix produces distinct child identifiers', () => {
  assert.notDeepEqual(legacyIds('tool-a', 2), legacyIds('tool-b', 2));
});

test('unique IDs must remain unique across a persisted-session restart', () => {
  const priorSession = legacyIds('tool-1', 1);
  const restoredSession = legacyIds('tool-1', 1);
  assert.deepEqual(priorSession, restoredSession);
});
