/* pixel.js: the Meta pixel loader. Loads NOTHING by itself.
 *
 * consent.js calls PagePixel.load() only after the visitor clicks Accept (or at once when page.config.js sets
 * consent.mode to "not-required" on the Owner's lawyer's written word). Until then no request goes to Meta:
 * no fbevents.js, no cookie, no beacon. There is deliberately no <noscript> image beacon, because it would fire
 * before consent.
 *
 * What it sends once loaded: fbq('init', pixel.id), one PageView, and pixel.conversionEvent once per page view
 * when the visitor clicks the CTA (or submits the form). With pixel.id "none" it never loads anything.
 * This is Meta's standard base code, unrolled into a file so the page needs no inline script.
 */
(function () {
  "use strict";

  var loaded = false;
  var fired = {};

  function cfg() {
    return (window.PAGE_CONFIG && window.PAGE_CONFIG.pixel) || {};
  }

  // True when page.config.js holds a numeric pixel id (not "none", not a placeholder).
  function enabled() {
    return /^\d+$/.test(String(cfg().id || ""));
  }

  function load() {
    if (loaded || !enabled()) return false;
    loaded = true;
    if (!window.fbq) {
      var n = function () {
        if (n.callMethod) n.callMethod.apply(n, arguments);
        else n.queue.push(arguments);
      };
      window.fbq = n;
      if (!window._fbq) window._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    window.fbq("init", String(cfg().id));
    window.fbq("track", "PageView");
    return true;
  }

  // Fires a standard event once per page view, and only when the pixel was loaded (that is, after consent).
  function track(eventName) {
    if (!loaded || !eventName || fired[eventName]) return false;
    fired[eventName] = true;
    window.fbq("track", eventName);
    return true;
  }

  // Expires the pixel's first-party cookies (_fbp, _fbc) on this host and its parent domains; used on withdrawal.
  function clearCookies() {
    var parts = location.hostname.split(".");
    var names = ["_fbp", "_fbc"];
    for (var i = 0; i < parts.length - 1; i++) {
      var domain = parts.slice(i).join(".");
      names.forEach(function (name) {
        document.cookie = name + "=; Max-Age=0; path=/; domain=" + domain;
        document.cookie = name + "=; Max-Age=0; path=/; domain=." + domain;
      });
    }
    names.forEach(function (name) {
      document.cookie = name + "=; Max-Age=0; path=/";
    });
  }

  window.PagePixel = {
    enabled: enabled,
    load: load,
    track: track,
    clearCookies: clearCookies,
    isLoaded: function () { return loaded; }
  };
})();
