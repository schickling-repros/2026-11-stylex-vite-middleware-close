# StyleX Vite middleware-mode shutdown

Standalone reproduction source: https://github.com/schickling-repros/2026-11-stylex-vite-middleware-close/tree/schickling-assistant/2026-11-17-repro-source

Minimal reproduction of the polling timer in `@stylexjs/unplugin` surviving Vite's middleware-mode `server.close()`.

## Reproduction

With Node.js 22.12+ (or a newer Vite-supported release) and pnpm 12.17.0:

```sh
pnpm install && pnpm repro
```

No app, fixture, HTTP listener, Vitest, or Vite config file is required. Dependency discovery is disabled. The child imports the official `@stylexjs/unplugin/vite` entry point directly, creates a middleware-mode server, and immediately closes it.

## Expected

The child prints `httpServer: null` and `server.close() resolved`, then exits naturally with status 0. The parent reports `PASS`.

## Actual on the affected release

The child prints both messages but remains alive. After two seconds, the parent reports the failure and terminates the child, returning status 1:

```text
httpServer: null
server.close() resolved
FAIL: child is still alive 2 seconds after server.close() resolved.
Child exit: code=null, signal=SIGKILL
```

The parent deadline prevents an indefinite hang; the child has no forced exit, application timer, or timer monkeypatch. Run `node child.mjs` to observe the unbounded natural-exit failure directly (interrupt manually).

## Versions

- `@stylexjs/unplugin`: 0.19.0
- `@stylexjs/stylex`: 0.19.0
- Vite: 8.3.8
- pnpm: 12.17.0
- Exercised Node.js runtime: 24.20.0 (macOS arm64)

The standalone reproduction was exercised on macOS arm64: `server.close()` resolved, but the child remained alive until the parent's two-second post-close deadline terminated it. The runner returned status 1. The installed dependency closure was reused; a fresh install was not exercised.

## Cause and existing report

The published Vite adapter starts a 150ms interval in `configureServer`, but its cleanup only listens to `server.httpServer?.once('close', ...)`. Middleware mode has no HTTP server, so that cleanup never registers.

Existing upstream issue: https://github.com/meta/stylex/issues/1857

An upstream comment reports an unreleased fix that unrefs the timer. This reproduction targets the published 0.19.0 release, not current upstream main; it does not claim that current main still prevents process exit.
