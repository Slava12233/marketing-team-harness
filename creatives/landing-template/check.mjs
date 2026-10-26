#!/usr/bin/env node
// check.mjs: validates this landing page before a deploy. Node 18+, no dependencies; reads files, changes nothing.
// Usage: node creatives/<flight>/landing/check.mjs
// Exit 0 = no hard error (yellow lines may remain: the Owner decides on them); exit 2 = a hard error to fix first.
//
// Hard errors: a double-brace placeholder left in a used value; pixel.id not numeric and not "none"; a link that is
// not absolute https; an unknown cta.type, consent.mode, dir or conversion event; a malformed number or colour;
// empty consent wording while a pixel needs consent; a third-party script in the HTML; a text path the HTML uses
// that page.config.js lacks; a missing legal page.
// Yellow (never blocks): the legal pages still carry the DRAFT banner; consent.mode "not-required"; site.url empty.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const errors = [];
const warnings = [];
const notes = [];
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

const CTA_TYPES = { whatsapp: "whatsapp", phone: "phone", "instant-form": "instantForm", booking: "booking", "form-post": "form" };
const CONSENT_MODES = ["required", "not-required"];
const EVENTS = ["Lead", "Contact", "Schedule", "CompleteRegistration", "SubmitApplication", "StartTrial", "Subscribe", "FindLocation"];
const DRAFT_MARK = "DRAFT: your lawyer must review and replace this text";

function loadConfig() {
  const file = join(HERE, "page.config.js");
  if (!existsSync(file)) {
    console.log(paint(31, "ERROR page.config.js not found next to check.mjs"));
    process.exit(2);
  }
  const sandbox = { window: {} };
  try {
    vm.runInNewContext(readFileSync(file, "utf8"), sandbox, { filename: "page.config.js", timeout: 1000 });
  } catch (e) {
    console.log(paint(31, `ERROR page.config.js does not run: ${e.message}`));
    process.exit(2);
  }
  const c = sandbox.window.PAGE_CONFIG;
  if (!c || typeof c !== "object") {
    console.log(paint(31, "ERROR page.config.js does not set window.PAGE_CONFIG"));
    process.exit(2);
  }
  return c;
}

const C = loadConfig();
const blank = (v) => v == null || String(v).trim() === "";
const ctaKey = CTA_TYPES[C.cta && C.cta.type];
const pixelId = String((C.pixel && C.pixel.id) ?? "");
const pixelOn = /^\d+$/.test(pixelId);
const consentMode = C.consent && C.consent.mode;
const consentNeeded = pixelOn && consentMode !== "not-required";

// 1. Placeholders, in every value the page uses (unused CTA blocks and, without a consent bar, its wording are skipped).
const skip = new Set(Object.values(CTA_TYPES).filter((k) => k !== ctaKey).map((k) => `cta.${k}`));
if (!consentNeeded) ["consent.text", "consent.accept", "consent.decline", "footer.cookieSettingsLabel"].forEach((p) => skip.add(p));
const placeholders = [];
(function walk(v, path) {
  if (skip.has(path)) return;
  if (typeof v === "string") {
    if (v.includes("{{")) placeholders.push(`${path} = ${v}`);
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, `${path}.${i}`));
  } else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  }
})(C, "");
if (placeholders.length) {
  errors.push(`${placeholders.length} placeholder(s) left in page.config.js:`);
  placeholders.slice(0, 15).forEach((p) => errors.push(`  ${p}`));
  if (placeholders.length > 15) errors.push(`  ... and ${placeholders.length - 15} more`);
}
const filled = (v) => !blank(v) && !String(v).includes("{{");

// 2. Language, direction, colours.
if (filled(C.lang) && !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(C.lang)) errors.push(`lang "${C.lang}" is not a language code such as "en" or "fr"`);
if (filled(C.dir) && !["ltr", "rtl"].includes(C.dir)) errors.push(`dir "${C.dir}" must be "ltr" or "rtl"`);
for (const [k, v] of Object.entries(C.brand || {})) {
  if (k === "fontFamily" || !filled(v)) continue;
  if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v)) errors.push(`brand.${k} "${v}" is not a #hex colour`);
}

// 3. Links: every URL the page uses is absolute https, and not an example domain.
function checkUrl(path, v, required) {
  if (!filled(v)) {
    if (required && !String(v ?? "").includes("{{")) errors.push(`${path} is empty`);
    return;
  }
  let u;
  try { u = new URL(v); } catch { errors.push(`${path} "${v}" is not an absolute URL`); return; }
  if (u.protocol !== "https:") errors.push(`${path} "${v}" must start with https://`);
  if (/(^|\.)example\.(com|org|net)$/i.test(u.hostname)) errors.push(`${path} "${v}" still points at an example domain`);
}
checkUrl("site.url", C.site && C.site.url, false);
checkUrl("legal.privacyUrl", C.legal && C.legal.privacyUrl, false);
checkUrl("legal.cookiesUrl", C.legal && C.legal.cookiesUrl, false);
if (C.site && filled(C.site.logo)) {
  if (/^[a-z]+:|^\/\//i.test(C.site.logo)) errors.push(`site.logo "${C.site.logo}" must be a file inside this folder, not a link`);
  else if (!existsSync(join(HERE, C.site.logo))) errors.push(`site.logo "${C.site.logo}" does not exist in this folder`);
}

// 4. The CTA.
const cta = C.cta || {};
if (!ctaKey) {
  if (filled(cta.type)) errors.push(`cta.type "${cta.type}" must be one of: ${Object.keys(CTA_TYPES).join(", ")}`);
} else {
  const b = cta[ctaKey] || {};
  if (cta.type === "whatsapp") {
    if (filled(b.number) && !/^[1-9]\d{6,14}$/.test(String(b.number))) errors.push(`cta.whatsapp.number "${b.number}" must be international digits only (no +, no spaces, no leading zero)`);
    if (blank(b.text)) errors.push("cta.whatsapp.text (the prefilled message) is empty");
  } else if (cta.type === "phone") {
    if (filled(b.number) && !/^\+[1-9]\d{6,14}$/.test(String(b.number).replace(/[\s-]/g, ""))) errors.push(`cta.phone.number "${b.number}" must be + and international digits`);
  } else if (cta.type === "instant-form") {
    checkUrl("cta.instantForm.url", b.url, true);
  } else if (cta.type === "booking") {
    checkUrl("cta.booking.url", b.url, true);
  } else if (cta.type === "form-post") {
    checkUrl("cta.form.action", b.action, true);
    if (blank(b.submitLabel)) errors.push("cta.form.submitLabel is empty");
    if (blank(b.notice)) errors.push("cta.form.notice is empty: quote the company's shipped notice for this form (its id in config/claims.md); without one, use another CTA type");
    const fields = Array.isArray(b.fields) ? b.fields : [];
    if (!fields.length) errors.push("cta.form.fields is empty");
    fields.forEach((f, i) => {
      if (!/^[a-z][a-z0-9_]*$/.test(String(f && f.name))) errors.push(`cta.form.fields.${i}.name "${f && f.name}" must be lower-case letters, digits, _`);
      if (f && f.type && !["text", "tel", "email"].includes(f.type)) errors.push(`cta.form.fields.${i}.type "${f.type}" must be text, tel or email`);
    });
  }
}
const params = (C.attribution && C.attribution.params) || [];
if (!Array.isArray(params) || params.some((p) => !/^[a-z][a-z0-9_]*$/.test(String(p)))) errors.push("attribution.params must be a list of parameter names such as ref, utm_source");
else if (!params.includes("ref")) warnings.push("attribution.params does not include ref: the ad's ref will not reach the CTA");

// 5. Pixel and consent.
if (!pixelId.includes("{{")) {
  if (pixelId === "none") notes.push('pixel.id is "none": the page loads no tracker; results are counted where the CTA lands');
  else if (!pixelOn) errors.push(`pixel.id "${pixelId}" must be the numeric pixel (dataset) id or "none"`);
}
const ev = C.pixel && C.pixel.conversionEvent;
if (pixelOn && filled(ev) && !EVENTS.includes(ev)) errors.push(`pixel.conversionEvent "${ev}" must be a standard event: ${EVENTS.join(", ")}`);
if (pixelOn && blank(ev)) errors.push("pixel.conversionEvent is empty");
if (filled(consentMode) && !CONSENT_MODES.includes(consentMode)) errors.push(`consent.mode "${consentMode}" must be "required" or "not-required"`);
if (consentNeeded) {
  for (const k of ["text", "accept", "decline"]) if (blank(C.consent && C.consent[k])) errors.push(`consent.${k} is empty (the Owner's lawyer confirms this wording)`);
}
if (pixelOn && consentMode === "not-required") warnings.push('consent.mode is "not-required": the pixel loads without asking. Only on the Owner\'s lawyer\'s written word, recorded in config/claims.md and the plan file');

// 6. The HTML: no third-party script, every text path present in page.config.js, the legal pages.
function readHtml(rel) {
  const file = join(HERE, rel);
  return existsSync(file) ? readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "") : null;
}
const getPath = (path) => String(path).split(".").reduce((o, k) => (o == null ? undefined : o[k]), C);
const htmlFiles = ["index.html", "legal/privacy.html", "legal/cookies.html"];
for (const rel of htmlFiles) {
  const html = readHtml(rel);
  if (html == null) {
    const own = rel.includes("privacy") ? C.legal && C.legal.privacyUrl : rel.includes("cookies") ? C.legal && C.legal.cookiesUrl : "";
    if (rel === "index.html" || blank(own)) errors.push(`${rel} is missing`);
    continue;
  }
  for (const m of html.matchAll(/<script\b([^>]*)>/gi)) {
    const src = (m[1].match(/\bsrc\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (!src) errors.push(`${rel}: an inline <script> (the page allows script files from this folder only)`);
    else if (/^(https?:)?\/\//i.test(src)) errors.push(`${rel}: third-party script ${src} (only the pixel may come from outside, loaded by pixel.js after consent)`);
  }
  for (const m of html.matchAll(/data-(?:text|list)="([^"]+)"/g)) {
    if ([...skip].some((p) => m[1] === p || m[1].startsWith(p + "."))) continue;
    if (getPath(m[1]) === undefined) errors.push(`${rel}: data path "${m[1]}" has no value in page.config.js`);
  }
}
const drafts = [];
for (const [rel, own] of [["legal/privacy.html", C.legal && C.legal.privacyUrl], ["legal/cookies.html", C.legal && C.legal.cookiesUrl]]) {
  if (!blank(own)) continue; // the company's own published page is used instead
  const html = readHtml(rel);
  if (html && html.includes(DRAFT_MARK)) drafts.push(rel);
}
if (drafts.length) warnings.push(`legal drafts not yet replaced: ${drafts.join(", ")} (the Owner decides; no ad points here until the Owner acknowledges them)`);
if (C.site && blank(C.site.url)) warnings.push("site.url is empty: fill it with the page's final URL after the first deploy");

// Report.
for (const n of notes) console.log(`note   ${n}`);
for (const w of warnings) console.log(paint(33, `yellow ${w}`));
for (const e of errors) console.log(paint(31, e.startsWith("  ") ? `       ${e.trim()}` : `ERROR  ${e}`));
const hard = errors.filter((e) => !e.startsWith("  ")).length;
if (hard) {
  console.log(paint(31, `check: ${hard} hard error(s); fix them before any deploy`));
  process.exit(2);
}
console.log(paint(32, `check: ok${warnings.length ? ` with ${warnings.length} yellow line(s)` : ""}`));
process.exit(0);
