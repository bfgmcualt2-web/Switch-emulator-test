const WORLD = {
  width: 960,
  height: 540,
  gravity: 1800,
  floor: 456
};

const PLAYER_START = Object.freeze({ x: 90, y: WORLD.floor - 42 });

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class LocalSwitchRuntime {
  constructor({ width = WORLD.width, height = WORLD.height } = {}) {
    this.width = width;
    this.height = height;
    this.loadedCartridge = null;
    this.reset();
  }

  reset() {
    this.player = {
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      w: 34,
      h: 42,
      vx: 0,
      vy: 0,
      grounded: true,
      invulnerableFor: 0
    };
    this.camera = 0;
    this.score = 0;
    this.lives = 3;
    this.time = 0;
    this.message = 'Collect all 12 sparks!';
    this.gameOver = false;
    this.sparks = Array.from({ length: 12 }, (_, index) => ({
      x: 180 + index * 118,
      y: 265 + Math.sin(index * 0.75) * 58,
      w: 22,
      h: 22,
      taken: false
    }));
    this.drones = Array.from({ length: 5 }, (_, index) => ({
      x: 360 + index * 245,
      y: WORLD.floor - 34,
      w: 42,
      h: 34,
      origin: 360 + index * 245,
      range: 76 + index * 18,
      speed: 1.1 + index * 0.2
    }));
  }

  loadCartridge(file) {
    this.loadedCartridge = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      loadedAt: new Date().toISOString()
    };
    this.message = `${file.name} staged locally. Add a WASM core to boot real homebrew.`;
    return this.loadedCartridge;
  }

  update(input, deltaSeconds) {
    if (this.gameOver) {
      return this.snapshot();
    }

    const dt = clamp(deltaSeconds, 0, 1 / 30);
    this.time += dt;
    this.player.invulnerableFor = Math.max(0, this.player.invulnerableFor - dt);

    const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const boost = input.boost ? 1.45 : 1;
    this.player.vx = move * 255 * boost;

    if ((input.jump || input.up) && this.player.grounded) {
      this.player.vy = -690;
      this.player.grounded = false;
    }

    this.player.vy += WORLD.gravity * dt;
    this.player.x = clamp(this.player.x + this.player.vx * dt, 20, 1680);
    this.player.y += this.player.vy * dt;

    if (this.player.y >= WORLD.floor - this.player.h) {
      this.player.y = WORLD.floor - this.player.h;
      this.player.vy = 0;
      this.player.grounded = true;
    }

    for (const spark of this.sparks) {
      if (!spark.taken && rectsOverlap(this.player, spark)) {
        spark.taken = true;
        this.score += 100;
        this.message = `Spark ${this.score / 100}/12 collected`;
      }
    }

    for (const drone of this.drones) {
      drone.x = drone.origin + Math.sin(this.time * drone.speed) * drone.range;
      if (this.player.invulnerableFor <= 0 && rectsOverlap(this.player, drone)) {
        this.lives -= 1;
        this.player.invulnerableFor = 1.35;
        this.player.x = Math.max(PLAYER_START.x, this.player.x - 120);
        this.player.vy = -430;
        this.message = this.lives > 0 ? 'Drone hit! Keep going.' : 'Game over. Reset to play again.';
        if (this.lives <= 0) {
          this.gameOver = true;
        }
      }
    }

    if (this.sparks.every((spark) => spark.taken)) {
      this.gameOver = true;
      this.message = 'All sparks collected. Demo complete!';
    }

    this.camera = clamp(this.player.x - 260, 0, 760);
    return this.snapshot();
  }

  snapshot() {
    return {
      width: this.width,
      height: this.height,
      world: WORLD,
      player: { ...this.player },
      sparks: this.sparks.map((spark) => ({ ...spark })),
      drones: this.drones.map((drone) => ({ ...drone })),
      camera: this.camera,
      score: this.score,
      lives: this.lives,
      time: this.time,
      message: this.message,
      gameOver: this.gameOver,
      loadedCartridge: this.loadedCartridge
    };
  }
}

export function createInputState() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    boost: false
  };
}

export function mergeGamepadInput(input, gamepads) {
  const merged = { ...input };
  for (const pad of gamepads) {
    if (!pad) continue;
    const horizontal = pad.axes[0] || 0;
    const vertical = pad.axes[1] || 0;
    merged.left ||= horizontal < -0.35;
    merged.right ||= horizontal > 0.35;
    merged.up ||= vertical < -0.55;
    merged.down ||= vertical > 0.55;
    merged.jump ||= Boolean(pad.buttons[0]?.pressed || pad.buttons[1]?.pressed);
    merged.boost ||= Boolean(pad.buttons[2]?.pressed || pad.buttons[3]?.pressed);
  }
  return merged;
}
