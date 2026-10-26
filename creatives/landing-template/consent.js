/* consent.js: the consent bar (markup at the end of index.html). Started by page.js: PageConsent.init().
 *
 * - consent.mode "required" (the default): the bar shows until the visitor chooses. Accept → the choice is
 *   remembered in localStorage and pixel.js loads. Decline → the choice is remembered and nothing loads, ever,
 *   on this device until the visitor changes it. The two buttons are equal; nothing is pre-selected; the bar
 *   does not block the page.
 * - "Cookie settings" in the footer reopens the bar. Declining after an earlier Accept expires the pixel's
 *   cookies and reloads the page so the pixel is gone.
 * - consent.mode "not-required" (only on the Owner's lawyer's written word): no bar, the pixel loads at once.
 * - pixel.id "none": no bar and no settings link, because nothing on the page needs consent.
 * When localStorage is blocked (some private windows), the choice lasts for this page view only.
 * The wording of the bar is never written by the harness (page.config.js: consent.text / accept / decline).
 */
(function () {
  "use strict";

  var ACCEPTED = "accepted";
  var DECLINED = "declined";

  function conf() {
    return (window.PAGE_CONFIG && window.PAGE_CONFIG.consent) || {};
  }

  function key() {
    return conf().storageKey || "landing-consent-v1";
  }

  function read() {
    try { return window.localStorage.getItem(key()); } catch (e) { return null; }
  }

  function write(value) {
    try { window.localStorage.setItem(key(), value); } catch (e) { /* storage blocked: this view only */ }
  }

  function bar() { return document.getElementById("consent-bar"); }

  function show() {
    var el = bar();
    if (!el) return;
    el.hidden = false;
    document.body.classList.add("has-consent-bar");
  }

  function hide() {
    var el = bar();
    if (!el) return;
    el.hidden = true;
    document.body.classList.remove("has-consent-bar");
  }

  function accept() {
    write(ACCEPTED);
    hide();
    window.PagePixel.load();
  }

  function decline() {
    var wasLoaded = window.PagePixel.isLoaded();
    write(DECLINED);
    hide();
    if (wasLoaded) {
      // Withdrawal: the pixel script cannot be unloaded from a running page, so expire its cookies and reload.
      window.PagePixel.clearCookies();
      window.location.reload();
    }
  }

  function init() {
    var settings = document.getElementById("consent-settings");
    if (!window.PagePixel || !window.PagePixel.enabled()) {
      hide();
      return; // no pixel configured: nothing to consent to
    }
    if (conf().mode === "not-required") {
      hide();
      window.PagePixel.load();
      return;
    }
    // Any other mode value is treated as "required" (the safe default); check.mjs rejects unknown values.
    var accBtn = document.getElementById("consent-accept");
    var decBtn = document.getElementById("consent-decline");
    if (accBtn) accBtn.addEventListener("click", accept);
    if (decBtn) decBtn.addEventListener("click", decline);
    if (settings) {
      settings.hidden = false;
      settings.addEventListener("click", show);
    }
    var choice = read();
    if (choice === ACCEPTED) window.PagePixel.load();
    else if (choice !== DECLINED) show();
  }

  window.PageConsent = { init: init, show: show };
})();
