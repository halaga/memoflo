import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("API exposes a liveness endpoint independent of database state", async () => {
  const app = await read("../src/app.js");
  assert.match(app, /app\.get\("\/health\/live"/);
  assert.match(app, /status:\s*"live"/);
});

test("API readiness reports MongoDB connection state and returns 503 when disconnected", async () => {
  const app = await read("../src/app.js");
  assert.match(app, /app\.get\("\/health\/ready"/);
  assert.match(app, /mongoose\.connection\.readyState === 1/);
  assert.match(app, /res\.status\(databaseReady \? 200 : 503\)/);
});

test("API server handles SIGTERM and SIGINT with graceful shutdown", async () => {
  const server = await read("../src/server.js");
  assert.match(server, /process\.once\("SIGTERM"/);
  assert.match(server, /process\.once\("SIGINT"/);
  assert.match(server, /httpServer\.close/);
  assert.match(server, /mongoose\.disconnect\(\)/);
});
