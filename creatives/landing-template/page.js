/* page.js: fills the page from page.config.js and wires the call to action. A plain script, no framework.
 *
 * - Every element with data-text="<path>" gets that config string as plain text (never HTML); an empty string hides it.
 * - data-list="<path>" renders an array of strings as list items; data-src="<path>" sets an image source.
 * - The CTA (every [data-cta] link) is built from cta.type:
 *     whatsapp     https://wa.me/<number>?text=<prefilled text>   (the ad's ref goes into the text: WhatsApp drops URL parameters)
 *     phone        tel:<number>                                    (a call carries no ref)
 *     instant-form the Meta instant-form link, with ref and utm_* appended
 *     booking      the company's booking link, with ref and utm_* appended
 *     form-post    the buttons scroll to a form that POSTs to the company's own endpoint, with ref and utm_* as hidden fields.
 *                  A static site cannot store a form: the endpoint (cta.form.action) stores it, never this site.
 * - attribution.params (ref, utm_*) are read from this page's URL, so the ad's attribution survives the page.
 * - The conversion event (pixel.conversionEvent) fires once on the CTA click or form submit, and only if the
 *   pixel was loaded after consent (pixel.js does nothing otherwise).
 * - Finally it starts the consent bar (consent.js).
 */
(function () {
  "use strict";

  var C = window.PAGE_CONFIG;
  if (!C) {
    if (window.console) console.error("page.config.js did not load");
    return;
  }

  function get(path) {
    return String(path).split(".").reduce(function (obj, k) {
      return obj == null ? undefined : obj[k];
    }, C);
  }

  function isBlank(v) { return v == null || String(v).trim() === ""; }

  var root = document.documentElement;

  // 1. Language, direction, title, description, canonical URL.
  if (!isBlank(C.lang)) root.setAttribute("lang", C.lang);
  if (C.dir === "rtl" || C.dir === "ltr") root.setAttribute("dir", C.dir);
  var site = C.site || {};
  var isLegalPage = !!document.querySelector("[data-legal-page]");
  if (!isBlank(site.title) && !isLegalPage) document.title = site.title;
  var desc = document.querySelector('meta[name="description"]');
  if (desc && !isBlank(site.description) && !isLegalPage) desc.setAttribute("content", site.description);
  if (!isBlank(site.url) && !isLegalPage && /^https:\/\//i.test(site.url)) {
    var canon = document.createElement("link");
    canon.rel = "canonical";
    canon.href = site.url;
    document.head.appendChild(canon);
  }

  // 2. Brand colours and font as CSS variables (styles.css holds the fallbacks).
  var brand = C.brand || {};
  var vars = {
    primary: "--color-primary",
    onPrimary: "--color-on-primary",
    background: "--color-bg",
    surface: "--color-surface",
    text: "--color-text",
    muted: "--color-muted"
  };
  Object.keys(vars).forEach(function (k) {
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(brand[k] || ""))) root.style.setProperty(vars[k], brand[k]);
  });
  if (!isBlank(brand.fontFamily)) root.style.setProperty("--font-body", brand.fontFamily);

  // 3. Texts, lists, images.
  Array.prototype.forEach.call(document.querySelectorAll("[data-text]"), function (el) {
    var v = get(el.getAttribute("data-text"));
    if (typeof v !== "string") {
      if (window.console) console.warn("page.config.js has no text at " + el.getAttribute("data-text"));
      return;
    }
    el.textContent = v;
    if (isBlank(v)) el.hidden = true;
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-list]"), function (el) {
    var arr = get(el.getAttribute("data-list"));
    if (!Array.isArray(arr)) return;
    arr.forEach(function (line) {
      if (isBlank(line)) return;
      var li = document.createElement("li");
      li.textContent = String(line);
      el.appendChild(li);
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("img[data-src]"), function (img) {
    var src = get(img.getAttribute("data-src"));
    if (isBlank(src)) return;
    // On a legal page the files sit one folder up.
    img.src = (isLegalPage ? "../" : "") + src;
    img.alt = site.companyName || "";
    img.hidden = false;
  });

  // 4. Legal links: the company's own published pages when page.config.js names them, else the bundled DRAFT pages.
  var legal = C.legal || {};
  Array.prototype.forEach.call(document.querySelectorAll("a[data-legal]"), function (a) {
    var url = legal[a.getAttribute("data-legal") + "Url"];
    if (!isBlank(url)) a.href = url;
  });

  // 5. Attribution: ref and utm_* from this page's URL.
  function attribution() {
    var out = [];
    var params = (C.attribution && C.attribution.params) || [];
    var q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { return out; }
    params.forEach(function (name) {
      var v = q.get(name);
      if (isBlank(v)) return;
      v = String(v).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 150);
      out.push([name, v]);
    });
    return out;
  }

  function withParams(base, pairs) {
    try {
      var u = new URL(base);
      pairs.forEach(function (p) { u.searchParams.set(p[0], p[1]); });
      return u.toString();
    } catch (e) {
      if (window.console) console.error("CTA link is not an absolute URL: " + base);
      return null;
    }
  }

  // 6. The CTA.
  var cta = C.cta || {};
  var pairs = attribution();

  function ctaHref() {
    switch (cta.type) {
      case "whatsapp": {
        var w = cta.whatsapp || {};
        var number = String(w.number || "").replace(/\D/g, "");
        var text = String(w.text || "");
        var ref = pairs.filter(function (p) { return p[0] === "ref"; })[0];
        if (w.refInText && ref) text += " (ref: " + ref[1] + ")";
        return "https://wa.me/" + number + (text ? "?text=" + encodeURIComponent(text) : "");
      }
      case "phone":
        return "tel:" + String((cta.phone || {}).number || "").replace(/[^\d+]/g, "");
      case "instant-form":
        return withParams((cta.instantForm || {}).url, pairs);
      case "booking":
        return withParams((cta.booking || {}).url, pairs);
      case "form-post":
        return "#lead-form";
      default:
        if (window.console) console.error("Unknown cta.type: " + cta.type);
        return null;
    }
  }

  function fireConversion() {
    var ev = C.pixel && C.pixel.conversionEvent;
    if (window.PagePixel) window.PagePixel.track(ev);
  }

  var href = ctaHref();
  var ctaLinks = document.querySelectorAll("a[data-cta]");
  Array.prototype.forEach.call(ctaLinks, function (a) {
    if (!href) { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); return; }
    a.href = href;
    if (/^https:\/\//i.test(href)) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    // For form-post the button only scrolls to the form: the conversion fires on submit instead.
    if (cta.type !== "form-post") a.addEventListener("click", fireConversion);
  });

  // 7. The form (cta.type "form-post" only).
  var form = document.getElementById("lead-form");
  if (form && cta.type === "form-post") {
    var f = cta.form || {};
    // The closing section shows the form instead of its button; the hero button scrolls here.
    Array.prototype.forEach.call(document.querySelectorAll(".closing a[data-cta]"), function (a) { a.hidden = true; });
    form.action = f.action || "";
    form.method = "post";
    var box = form.querySelector(".fields");
    (f.fields || []).forEach(function (field, i) {
      var id = "f-" + i + "-" + String(field.name || "").replace(/[^a-z0-9_-]/gi, "");
      var wrap = document.createElement("div");
      wrap.className = "field";
      var label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = field.label || field.name;
      var input = document.createElement("input");
      input.id = id;
      input.name = field.name;
      input.type = ["text", "tel", "email"].indexOf(field.type) >= 0 ? field.type : "text";
      if (field.autocomplete) input.autocomplete = field.autocomplete;
      if (field.required) input.required = true;
      wrap.appendChild(label);
      wrap.appendChild(input);
      box.appendChild(wrap);
    });
    pairs.forEach(function (p) {
      var h = document.createElement("input");
      h.type = "hidden";
      h.name = p[0];
      h.value = p[1];
      form.appendChild(h);
    });
    form.hidden = false;
    var sent = false;
    form.addEventListener("submit", function (e) {
      if (sent) return;
      // The browser has validated the fields. Fire the event, give the beacon a moment, then post.
      e.preventDefault();
      sent = true;
      fireConversion();
      window.setTimeout(function () { form.submit(); }, 300);
    });
  }

  // 8. Consent last, once the bar's text is in place.
  if (window.PageConsent) window.PageConsent.init();
})();
