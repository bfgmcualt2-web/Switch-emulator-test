import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalSwitchRuntime, createInputState, mergeGamepadInput } from '../src/emulatorCore.js';

test('runtime starts with a playable demo state', () => {
  const runtime = new LocalSwitchRuntime();
  const snapshot = runtime.snapshot();

  assert.equal(snapshot.lives, 3);
  assert.equal(snapshot.score, 0);
  assert.equal(snapshot.sparks.length, 12);
  assert.equal(snapshot.gameOver, false);
});

test('player movement updates position using local input', () => {
  const runtime = new LocalSwitchRuntime();
  const before = runtime.snapshot().player.x;

  runtime.update({ ...createInputState(), right: true }, 0.25);

  assert.ok(runtime.snapshot().player.x > before);
});

test('staged cartridges keep metadata only', () => {
  const runtime = new LocalSwitchRuntime();
  const metadata = runtime.loadCartridge({ name: 'homebrew.nro', size: 4096, type: '' });

  assert.deepEqual(Object.keys(metadata).sort(), ['loadedAt', 'name', 'size', 'type']);
  assert.equal(metadata.name, 'homebrew.nro');
  assert.equal(metadata.size, 4096);
});

test('gamepad input can drive the demo core', () => {
  const input = createInputState();
  const [pad] = [{ axes: [0.8, 0], buttons: [{ pressed: true }] }];
  const merged = mergeGamepadInput(input, [pad]);

  assert.equal(merged.right, true);
  assert.equal(merged.jump, true);
});
