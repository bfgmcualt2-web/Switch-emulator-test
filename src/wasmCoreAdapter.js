const REQUIRED_CORE_EXPORTS = ['memory'];
const OPTIONAL_CORE_EXPORTS = ['init', 'loadCartridge', 'runFrame', 'reset'];

function hasExport(instance, exportName) {
  return Object.hasOwn(instance.exports, exportName);
}

export class WasmCoreAdapter {
  constructor({ logger = () => {} } = {}) {
    this.logger = logger;
    this.instance = null;
    this.module = null;
    this.coreName = null;
    this.ready = false;
  }

  async loadCore(file) {
    if (!file || !file.name.endsWith('.wasm')) {
      throw new Error('Select a legal homebrew WebAssembly core ending in .wasm.');
    }

    const bytes = await file.arrayBuffer();
    const imports = {
      env: {
        log: (value) => this.logger(`core log: ${value}`),
        now: () => performance.now()
      }
    };
    const result = await WebAssembly.instantiate(bytes, imports);
    this.module = result.module;
    this.instance = result.instance;
    this.coreName = file.name;
    this.validateCore();

    if (hasExport(this.instance, 'init')) {
      this.instance.exports.init();
    }

    this.ready = true;
    return this.metadata();
  }

  validateCore() {
    for (const exportName of REQUIRED_CORE_EXPORTS) {
      if (!hasExport(this.instance, exportName)) {
        throw new Error(`WASM core is missing required export: ${exportName}`);
      }
    }
  }

  metadata() {
    if (!this.instance) {
      return { ready: false, coreName: null, exports: [] };
    }

    return {
      ready: this.ready,
      coreName: this.coreName,
      exports: Object.keys(this.instance.exports).filter((name) => OPTIONAL_CORE_EXPORTS.includes(name) || REQUIRED_CORE_EXPORTS.includes(name))
    };
  }

  canLoadCartridge() {
    return Boolean(this.ready && hasExport(this.instance, 'loadCartridge'));
  }

  reset() {
    if (this.ready && hasExport(this.instance, 'reset')) {
      this.instance.exports.reset();
    }
  }

  runFrame() {
    if (this.ready && hasExport(this.instance, 'runFrame')) {
      this.instance.exports.runFrame();
    }
  }
}
