import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const routerSource = await readFile(
  new URL("../src/router/index.js", import.meta.url),
  "utf8",
);

test("fresh app navigation sends the root route to login, not home", () => {
  assert.match(routerSource, /if \(to\.name === "root"\) \{[\s\S]*?name: "login"/);
  assert.doesNotMatch(routerSource, /return token\s*\?/);
});

test("a stored token cannot bypass login on the first protected deep link", () => {
  assert.match(routerSource, /let isInitialAppNavigation = true/);
  assert.match(routerSource, /if \(isFirstNavigation\) \{[\s\S]*?clearSession\(\)/);
  assert.match(
    routerSource,
    /if \(isFirstNavigation && to\.matched\.some\(\(record\) => record\.meta\.requiresAuth\)\) \{[\s\S]*?name: "login"/
  );
});

test("login route remains accessible when an old token exists", () => {
  assert.doesNotMatch(routerSource, /to\.meta\.guest[\s\S]{0,180}name: "home"/);
});
