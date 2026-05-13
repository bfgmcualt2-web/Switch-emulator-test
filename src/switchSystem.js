const SAFE_PACKAGE_TYPES = new Set(['homebrew', 'wasm-core', 'demo']);

function createService(name, status = 'stubbed') {
  return {
    name,
    status,
    ticks: 0,
    lastTickMs: 0
  };
}

export class VirtualSwitchSystem {
  constructor({ model = 'HAC-001-web' } = {}) {
    this.model = model;
    this.powerState = 'off';
    this.loadedPackage = null;
    this.frame = 0;
    this.services = {
      cpu: createService('ARMv8 CPU scheduler'),
      gpu: createService('NVN-like GPU command bridge'),
      audio: createService('Audio renderer'),
      hid: createService('Joy-Con/Gamepad HID'),
      filesystem: createService('Sandboxed virtual filesystem'),
      kernel: createService('Horizon-style service registry')
    };
  }

  powerOn() {
    this.powerState = 'home-menu';
    return this.snapshot();
  }

  powerOff() {
    this.powerState = 'off';
    this.loadedPackage = null;
    return this.snapshot();
  }

  reset() {
    this.frame = 0;
    for (const service of Object.values(this.services)) {
      service.ticks = 0;
      service.lastTickMs = 0;
    }
    this.powerState = this.loadedPackage ? 'running' : 'home-menu';
    return this.snapshot();
  }

  stagePackage({ name, size = 0, type = 'homebrew' }) {
    if (!SAFE_PACKAGE_TYPES.has(type)) {
      throw new Error(`Unsupported package type: ${type}. Only legal homebrew/demo packages are accepted.`);
    }

    this.loadedPackage = {
      name,
      size,
      type,
      stagedAt: new Date().toISOString()
    };
    this.powerState = 'running';
    return this.snapshot();
  }

  rejectProtectedContent(fileName) {
    throw new Error(
      `${fileName} cannot be booted by this scaffold because it does not include firmware, keys, decryption, or copy-protection bypass support.`
    );
  }

  tick(deltaMs = 16.67) {
    if (this.powerState === 'off') {
      return this.snapshot();
    }

    this.frame += 1;
    for (const service of Object.values(this.services)) {
      service.ticks += 1;
      service.lastTickMs = deltaMs;
    }
    return this.snapshot();
  }

  snapshot() {
    return {
      model: this.model,
      powerState: this.powerState,
      frame: this.frame,
      loadedPackage: this.loadedPackage ? { ...this.loadedPackage } : null,
      services: Object.fromEntries(
        Object.entries(this.services).map(([key, service]) => [key, { ...service }])
      )
    };
  }
}
