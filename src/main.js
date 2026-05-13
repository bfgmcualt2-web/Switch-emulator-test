import { LocalSwitchRuntime, createInputState, mergeGamepadInput } from './emulatorCore.js';
import { WasmCoreAdapter } from './wasmCoreAdapter.js';
import { VirtualSwitchSystem } from './switchSystem.js';

const canvas = document.querySelector('#game-screen');
const ctx = canvas.getContext('2d');
const statusEl = document.querySelector('#runtime-status');
const fpsEl = document.querySelector('#fps-counter');
const startButton = document.querySelector('#start-button');
const romInput = document.querySelector('#rom-input');
const coreInput = document.querySelector('#core-input');
const input = createInputState();
const runtime = new LocalSwitchRuntime({ width: canvas.width, height: canvas.height });
const switchSystem = new VirtualSwitchSystem();
switchSystem.powerOn();
const wasmCore = new WasmCoreAdapter({ logger: (message) => {
  statusEl.textContent = message;
} });

const keyMap = new Map([
  ['ArrowUp', 'up'],
  ['KeyW', 'up'],
  ['ArrowDown', 'down'],
  ['KeyS', 'down'],
  ['ArrowLeft', 'left'],
  ['KeyA', 'left'],
  ['ArrowRight', 'right'],
  ['KeyD', 'right'],
  ['Space', 'jump'],
  ['Enter', 'jump'],
  ['ShiftLeft', 'boost'],
  ['ShiftRight', 'boost']
]);

function setInput(code, active) {
  const mapped = keyMap.get(code) || code;
  if (Object.hasOwn(input, mapped)) {
    input[mapped] = active;
  }
}

window.addEventListener('keydown', (event) => {
  if (keyMap.has(event.code)) {
    event.preventDefault();
    setInput(event.code, true);
  }
});

window.addEventListener('keyup', (event) => {
  if (keyMap.has(event.code)) {
    event.preventDefault();
    setInput(event.code, false);
  }
});

for (const button of document.querySelectorAll('[data-key]')) {
  const code = button.dataset.key;
  const activate = (event) => {
    event.preventDefault();
    setInput(code, true);
  };
  const deactivate = (event) => {
    event.preventDefault();
    setInput(code, false);
  };
  button.addEventListener('pointerdown', activate);
  button.addEventListener('pointerup', deactivate);
  button.addEventListener('pointercancel', deactivate);
  button.addEventListener('pointerleave', deactivate);
}

startButton.addEventListener('click', () => {
  runtime.reset();
  switchSystem.reset();
  wasmCore.reset();
  statusEl.textContent = wasmCore.ready ? 'WASM core reset. Running locally on this device.' : 'Demo core reset. Running locally on this device.';
});

romInput.addEventListener('change', () => {
  const [file] = romInput.files;
  if (!file) return;
  const cartridge = runtime.loadCartridge(file);
  switchSystem.stagePackage({ name: file.name, size: file.size, type: 'homebrew' });
  const loadMode = wasmCore.canLoadCartridge() ? 'ready for the loaded WASM core' : 'staged locally for a compatible legal core';
  statusEl.textContent = `${cartridge.name} ${loadMode} (${Math.round(cartridge.size / 1024).toLocaleString()} KB).`;
});

coreInput.addEventListener('change', async () => {
  const [file] = coreInput.files;
  if (!file) return;

  try {
    statusEl.textContent = `Loading ${file.name} locally…`;
    const metadata = await wasmCore.loadCore(file);
    switchSystem.stagePackage({ name: file.name, size: file.size, type: 'wasm-core' });
    statusEl.textContent = `${metadata.coreName} loaded with exports: ${metadata.exports.join(', ') || 'none'}.`;
  } catch (error) {
    statusEl.textContent = error.message;
  }
});

function drawBackground(snapshot) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#16213e');
  gradient.addColorStop(0.58, '#0f3460');
  gradient.addColorStop(1, '#111827');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-snapshot.camera * 0.25, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let i = 0; i < 26; i += 1) {
    ctx.beginPath();
    ctx.arc(70 + i * 92, 70 + Math.sin(i) * 34, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, snapshot.world.floor, canvas.width, canvas.height - snapshot.world.floor);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, snapshot.world.floor, canvas.width, 8);
}

function drawEntity(rect, color, camera, radius = 8) {
  ctx.fillStyle = color;
  const x = rect.x - camera;
  ctx.beginPath();
  ctx.roundRect(x, rect.y, rect.w, rect.h, radius);
  ctx.fill();
}

function render(snapshot) {
  drawBackground(snapshot);

  for (const spark of snapshot.sparks) {
    if (spark.taken) continue;
    ctx.save();
    ctx.translate(spark.x - snapshot.camera + spark.w / 2, spark.y + spark.h / 2);
    ctx.rotate(snapshot.time * 4);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-spark.w / 2, -spark.h / 2, spark.w, spark.h);
    ctx.restore();
  }

  for (const drone of snapshot.drones) {
    drawEntity(drone, '#ef4444', snapshot.camera, 12);
    ctx.fillStyle = '#fecaca';
    ctx.fillRect(drone.x - snapshot.camera + 10, drone.y + 8, 8, 8);
    ctx.fillRect(drone.x - snapshot.camera + 25, drone.y + 8, 8, 8);
  }

  const playerColor = snapshot.player.invulnerableFor > 0 && Math.floor(snapshot.time * 18) % 2 === 0 ? '#93c5fd' : '#22d3ee';
  drawEntity(snapshot.player, playerColor, snapshot.camera, 10);
  ctx.fillStyle = '#082f49';
  ctx.fillRect(snapshot.player.x - snapshot.camera + 9, snapshot.player.y + 12, 6, 6);
  ctx.fillRect(snapshot.player.x - snapshot.camera + 22, snapshot.player.y + 12, 6, 6);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fillRect(18, 18, 360, 92);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText(`Score ${snapshot.score}`, 34, 52);
  ctx.fillText(`Lives ${snapshot.lives}`, 210, 52);
  ctx.font = '500 17px system-ui, sans-serif';
  ctx.fillText(snapshot.message, 34, 86);

  if (snapshot.gameOver) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(snapshot.message, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '500 22px system-ui, sans-serif';
    ctx.fillText('Press Start / Reset to play again.', canvas.width / 2, canvas.height / 2 + 34);
    ctx.textAlign = 'start';
  }
}

let previous = performance.now();
let frames = 0;
let fpsTimer = previous;

function frame(now) {
  const padInput = mergeGamepadInput(input, navigator.getGamepads?.() || []);
  wasmCore.runFrame();
  switchSystem.tick(now - previous);
  const snapshot = runtime.update(padInput, (now - previous) / 1000);
  previous = now;
  render(snapshot);

  frames += 1;
  if (now - fpsTimer > 1000) {
    fpsEl.textContent = `${frames} FPS`;
    frames = 0;
    fpsTimer = now;
  }
  statusEl.textContent ||= 'Demo core running locally on this device.';
  requestAnimationFrame(frame);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    statusEl.textContent = 'Offline cache unavailable, but the emulator still runs locally.';
  });
}

statusEl.textContent = 'Demo core running locally on this device.';
requestAnimationFrame(frame);
