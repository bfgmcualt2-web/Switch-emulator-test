# Switch-emulator-testwork

A static, client-only web prototype for an iPad-friendly Switch emulator shell.

## What is included

- A responsive Switch-style web UI that can be installed as a PWA.
- A playable offline demo core rendered to `<canvas>`.
- Keyboard, touch, and Gamepad API input support.
- A local file staging flow for legal homebrew/ROM files.
- A legal WebAssembly core plug-in boundary for homebrew emulator cores.
- A Horizon-style Switch system scaffold with power, HID, CPU/GPU/audio, filesystem, and kernel service boundaries.
- A service worker that caches the shell so it can run without a server after first load.
- A GitHub Pages workflow that tests and publishes the static site automatically.

## Important limitation

This repository does **not** contain Nintendo firmware, keys, proprietary code, decryption logic, or
a full Nintendo Switch emulator core. Playing commercial Switch games in a browser requires a large
WebAssembly emulation core and legally supplied game/firmware material. The current app proves the
local runtime, input, rendering, and file-loading boundaries with a playable built-in game.


## Legal core support

The app can load a `.wasm` file as a **legal homebrew emulator core** from the browser file picker.
The core is instantiated locally on the device and is never uploaded. A compatible experimental core
should export at least `memory`; optional exports named `init`, `reset`, `runFrame`, and
`loadCartridge` are detected by the adapter.

This project intentionally does not include code to decrypt commercial Nintendo content, extract or
use console keys, bypass copy protection, or download copyrighted games. The included system scaffold
models the shape of a Switch-like console runtime, but a real Nintendo Switch emulator still requires
substantial CPU, GPU, audio, kernel, filesystem, and firmware work supplied lawfully. If you own dumped
games, you still need a lawful emulator core and must comply with applicable law and platform terms.

## Run locally

```bash
npm test
npm start
```

Then open <http://localhost:4173>.


## Publish the code to GitHub

This workspace does not include a configured GitHub remote by default. After creating a GitHub
repository, publish the committed code with one of these commands from the repo root:

```bash
npm run github:publish -- git@github.com:YOUR-USERNAME/Switch-emulator-test.git main
# or
npm run github:publish -- https://github.com/YOUR-USERNAME/Switch-emulator-test.git main
```

If you use the GitHub CLI and are already authenticated, the helper can also create a private repo
and push the current branch for you:

```bash
npm run github:publish -- --create YOUR-USERNAME/Switch-emulator-test main
```

After the push finishes, enable GitHub Pages with the steps below.

## Run on GitHub Pages

This project is ready to run from GitHub Pages because every browser asset uses relative paths and
is served directly from the repository root.

1. Push this repository to GitHub.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main`, `master`, or `work`, or manually run the **Deploy static site to GitHub Pages** workflow.
5. Open the URL shown by the workflow or the Pages settings screen. It will usually look like:

```text
https://YOUR-USERNAME.github.io/Switch-emulator-test/
```

The workflow runs `npm test`, uploads the static repository files, and deploys them to Pages. The
included `.nojekyll` file makes GitHub Pages serve the app as plain static files without Jekyll
processing.

## iPad use

After the GitHub Pages URL opens in Safari on iPad, use **Share → Add to Home Screen** to launch it
like a standalone app. The service worker caches the shell after the first successful load, so the
built-in demo can keep opening from the iPad without a server connection.
