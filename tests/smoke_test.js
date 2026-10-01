// Smoke test for index.html: executes the page's real inline script against a
// minimal DOM stub and checks the rendered state against independently
// computed expectations. Run: node tests/smoke_test.js
"use strict";
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ---- minimal DOM stub ----
const els = {};
function el(id) {
  if (!els[id]) {
    els[id] = {
      id,
      textContent: "",
      innerHTML: "",
      style: {},
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      getAttribute(k) { return this.attrs[k]; },
    };
  }
  return els[id];
}
const document = {
  getElementById: el,
  querySelector(sel) {
    if (sel === ".hour-ticks") return el("hour-ticks");
    return el(sel);
  },
};
const window = {};
global.document = document;
global.window = window;
global.Intl = Intl;

// Execute the page's actual script (render() runs once immediately).
new Function("document", "window", "setInterval", script)(document, window, () => 0);

// ---- independent expectations from the same wall-clock ----
const now = new Date();
const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
const expectOff = utcMin >= 16 * 60;
const bj = new Date(now.getTime() + 8 * 3600000);
const pad = (n) => (n < 10 ? "0" : "") + n;

let fail = 0;
function check(name, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) fail++;
  console.log((ok ? "PASS" : "FAIL"), name, "| got:", JSON.stringify(String(actual)), "| want:", JSON.stringify(String(expected)));
}

check("data-state", el("app").attrs["data-state"], expectOff ? "offpeak" : "peak");
check("stateWord", el("stateWord").textContent, expectOff ? "OFF-PEAK" : "PEAK");
check("coefVal", el("coefVal").textContent, expectOff ? "0.8×" : "1.0×");
check("coefLabel", el("coefLabel").textContent, expectOff ? "night discount" : "standard rate");
check("countLabel", el("countLabel").textContent, expectOff ? "Discount ends in" : "Discount starts in");

// countdown format + consistency with the next boundary
const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(el("countdown").textContent);
check("countdown format", !!m, true);
if (m) {
  const secsLeft = +m[1] * 3600 + +m[2] * 60 + +m[3];
  const boundaryH = expectOff ? 24 : 16; // next boundary in UTC hours
  const trueLeft = (boundaryH * 60 - utcMin) * 60 - now.getUTCSeconds();
  check("countdown seconds (±2s)", Math.abs(secsLeft - trueLeft) <= 2, true);
}
check("countNote", el("countNote").textContent, expectOff ? "at Beijing 08:00 · UTC 00:00" : "at Beijing 00:00 · UTC 16:00");

check("tUTC (minute granularity)", el("tUTC").textContent.slice(0, 5), pad(now.getUTCHours()) + ":" + pad(now.getUTCMinutes()));
check("tBJ (minute granularity)", el("tBJ").textContent.slice(0, 5), pad(bj.getUTCHours()) + ":" + pad(bj.getUTCMinutes()));
check("tLocal matches local clock", el("tLocal").textContent.slice(0, 5), pad(now.getHours()) + ":" + pad(now.getMinutes()));

const leftPct = parseFloat(el("nowLine").style.left);
const wantPct = (bj.getUTCHours() * 60 + bj.getUTCMinutes()) / 1440 * 100;
check("now marker position (±0.1%)", Math.abs(leftPct - wantPct) <= 0.1, true);
check("hour ticks rendered", (el("hour-ticks").innerHTML.match(/<i>/g) || []).length, 24);
check("header clock populated", el("headerClock").textContent.length > 10, true);

console.log(fail === 0 ? "\nALL PASS" : "\n" + fail + " FAILURE(S)");
process.exit(fail === 0 ? 0 : 1);
