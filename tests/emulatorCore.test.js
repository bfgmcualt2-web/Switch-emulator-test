import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalSwitchRuntime, createInputState, mergeGamepadInput } from '../src/emulatorCore.js';
import { WasmCoreAdapter } from '../src/wasmCoreAdapter.js';
import { VirtualSwitchSystem } from '../src/switchSystem.js';

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

test('WASM core adapter rejects non-wasm files', async () => {
  const adapter = new WasmCoreAdapter();

  await assert.rejects(
    () => adapter.loadCore({ name: 'game.nsp', arrayBuffer: async () => new ArrayBuffer(0) }),
    /legal homebrew WebAssembly core/
  );
});

test('WASM core adapter reports unloaded metadata', () => {
  const adapter = new WasmCoreAdapter();

  assert.deepEqual(adapter.metadata(), { ready: false, coreName: null, exports: [] });
  assert.equal(adapter.canLoadCartridge(), false);
});


test('virtual Switch system powers on and ticks services', () => {
  const system = new VirtualSwitchSystem();

  system.powerOn();
  const snapshot = system.tick(16);

  assert.equal(snapshot.powerState, 'home-menu');
  assert.equal(snapshot.frame, 1);
  assert.equal(snapshot.services.cpu.ticks, 1);
  assert.equal(snapshot.services.gpu.lastTickMs, 16);
});

test('virtual Switch system stages only safe package types', () => {
  const system = new VirtualSwitchSystem();

  const snapshot = system.stagePackage({ name: 'homebrew.nro', size: 1024, type: 'homebrew' });

  assert.equal(snapshot.powerState, 'running');
  assert.equal(snapshot.loadedPackage.name, 'homebrew.nro');
  assert.throws(() => system.stagePackage({ name: 'protected.nsp', type: 'protected' }), /Only legal homebrew/);
});

test('virtual Switch system explicitly rejects protected content booting', () => {
  const system = new VirtualSwitchSystem();

  assert.throws(() => system.rejectProtectedContent('dump.xci'), /does not include firmware, keys, decryption/);
});
