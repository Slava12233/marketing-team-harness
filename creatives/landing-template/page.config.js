/* page.config.js: the only file you edit to make the landing page (a plain script; no build step).
 *
 * Every value in double braces is a placeholder. Fill it from the company's config files (named on each line), then run
 *   node creatives/<flight>/landing/check.mjs
 * which fails (exit 2) while any placeholder is left. Copy follows the landing-page-build skill:
 * - the H1 repeats the ad's promise (the flight plan's copy table), in the ad's language;
 * - every claim comes from config/claims.md (allowed claims); no forbidden word; no line that still needs clearance;
 * - the harness never writes consent or legal wording. consent.text / accept / decline are the only consent-adjacent
 *   strings and are marked "lawyer to confirm" in the plan file; cta.form.notice is the company's shipped notice,
 *   quoted verbatim by id from config/claims.md; legal/*.html stay DRAFT until the Owner's lawyer replaces them.
 * Text is inserted as plain text (never as HTML), so markup in a string shows as typed.
 */
window.PAGE_CONFIG = {
  lang: "{{PAGE_LANG}}",                 // BCP 47 code of the page's language, e.g. "en", "fr", "he" (config/brand.md)
  dir: "{{PAGE_DIR}}",                   // "ltr" or "rtl", from the languages table in config/brand.md

  site: {
    title: "{{PAGE_TITLE}}",             // browser tab title: the product name and the promise, short (config/product.md)
    description: "{{PAGE_DESCRIPTION}}", // meta description, one sentence (config/product.md)
    companyName: "{{COMPANY_NAME}}",     // header and footer (config/company.md)
    logo: "",                            // optional: a file inside this folder, e.g. "assets/logo.svg"; "" shows the name as text
    url: "{{PAGE_URL_OR_EMPTY}}"         // the page's final absolute https URL; "" until the first deploy, then fill it
  },

  // Colours as #hex from config/brand.md; they become CSS variables (styles.css). Keep text on background at 4.5:1 or more.
  brand: {
    primary: "{{COLOUR_PRIMARY_HEX}}",       // buttons and links
    onPrimary: "{{COLOUR_ON_PRIMARY_HEX}}",  // text on a button
    background: "{{COLOUR_BACKGROUND_HEX}}", // page background
    surface: "{{COLOUR_SURFACE_HEX}}",       // cards, FAQ rows, consent bar
    text: "{{COLOUR_TEXT_HEX}}",             // body text
    muted: "{{COLOUR_MUTED_HEX}}",           // secondary text (still 4.5:1 on the background)
    fontFamily: ""                           // optional CSS font stack; "" = system fonts (index.html explains Google Fonts)
  },

  hero: {
    h1: "{{HERO_H1}}",                   // the ad's promise, as the flight plan's copy table writes it (message match)
    sub: "{{HERO_SUB}}",                 // one or two sentences: what it is and for whom (config/product.md, config/audiences.md)
    ctaLabel: "{{HERO_CTA_LABEL}}",      // the button: the funnel's ask, e.g. "Message us on WhatsApp"
    ctaNote: "{{HERO_CTA_NOTE_OR_EMPTY}}" // optional line under the button (what happens after the click); "" hides it
  },

  benefits: {                            // three cards; every claim from config/claims.md "Allowed claims", figures with source and date
    heading: "{{BENEFITS_HEADING}}",
    items: [
      { title: "{{BENEFIT_1_TITLE}}", body: "{{BENEFIT_1_BODY}}" },
      { title: "{{BENEFIT_2_TITLE}}", body: "{{BENEFIT_2_BODY}}" },
      { title: "{{BENEFIT_3_TITLE}}", body: "{{BENEFIT_3_BODY}}" }
    ]
  },

  steps: {                               // how it works, three steps, from config/product.md "What it does"
    heading: "{{STEPS_HEADING}}",
    items: [
      { title: "{{STEP_1_TITLE}}", body: "{{STEP_1_BODY}}" },
      { title: "{{STEP_2_TITLE}}", body: "{{STEP_2_BODY}}" },
      { title: "{{STEP_3_TITLE}}", body: "{{STEP_3_BODY}}" }
    ]
  },

  faq: {                                 // four questions: the audience's top objections; answers never go past config/product.md
    heading: "{{FAQ_HEADING}}",
    items: [
      { q: "{{FAQ_1_Q}}", a: "{{FAQ_1_A}}" },
      { q: "{{FAQ_2_Q}}", a: "{{FAQ_2_A}}" },
      { q: "{{FAQ_3_Q}}", a: "{{FAQ_3_A}}" },
      { q: "{{FAQ_4_Q}}", a: "{{FAQ_4_A}}" }
    ]
  },

  closing: {
    heading: "{{CLOSING_HEADING}}",      // the promise again, in other words
    sub: "{{CLOSING_SUB}}",
    ctaLabel: "{{CLOSING_CTA_LABEL}}"    // usually the hero's label
  },

  footer: {
    legalLines: [                        // the company's legal lines as the company states them (config/company.md): entity, address, registration
      "{{LEGAL_LINE_1}}",
      "{{LEGAL_LINE_2}}"
    ],
    privacyLabel: "{{PRIVACY_LINK_LABEL}}",               // e.g. "Privacy policy"
    cookiesLabel: "{{COOKIES_LINK_LABEL}}",               // e.g. "Cookie policy" (also the link in the consent bar)
    cookieSettingsLabel: "{{COOKIE_SETTINGS_LINK_LABEL}}" // e.g. "Cookie settings": reopens the consent bar to change the choice
  },

  // "" = the bundled DRAFT pages in legal/ (they stay DRAFT until the Owner's lawyer replaces them).
  // Or the company's own published policy pages as absolute https URLs.
  legal: {
    privacyUrl: "",
    cookiesUrl: ""
  },

  // The one call to action. type is one of: "whatsapp", "phone", "instant-form", "booking", "form-post".
  // Fill the block of the type you use; the other blocks are ignored (check.mjs skips them).
  // The ref and utm_* parameters the ad link carries are read from this page's URL and passed on (see attribution).
  cta: {
    type: "{{CTA_TYPE}}",
    whatsapp: {
      number: "{{WHATSAPP_NUMBER}}",     // international format, digits only, no + and no leading zero (wa.me/<number>); config/accounts.md
      text: "{{WHATSAPP_PREFILLED_TEXT}}", // the message the visitor's WhatsApp opens with
      refInText: true                    // WhatsApp ignores URL parameters, so the ad's ref is appended to the message as "(ref: ...)"
    },
    phone: {
      number: "{{PHONE_NUMBER}}"         // "+" and digits (tel: link). A call carries no ref: count calls by the CTA event only
    },
    instantForm: {
      url: "{{INSTANT_FORM_URL}}"        // absolute https link to the Meta instant form; leads land where config/accounts.md lead_delivery says
    },
    booking: {
      url: "{{BOOKING_URL}}"             // absolute https link to the company's booking page; ref and utm_* are appended
    },
    form: {
      // A static site cannot store a form. The POST goes to an endpoint the company owns and controls (its CRM, its server),
      // which stores the row and answers with its own thank-you page. Never a third-party form service the company has not chosen.
      action: "{{FORM_POST_URL}}",       // absolute https URL of that endpoint
      submitLabel: "{{FORM_SUBMIT_LABEL}}",
      notice: "{{FORM_NOTICE_VERBATIM}}", // the company's shipped notice for this form, quoted verbatim (its id in config/claims.md); never written here
      fields: [                          // only what the follow-up needs; name = the key the endpoint receives
        { name: "name", label: "{{FORM_NAME_LABEL}}", type: "text", autocomplete: "name", required: true },
        { name: "phone", label: "{{FORM_PHONE_LABEL}}", type: "tel", autocomplete: "tel", required: true }
      ]
    }
  },

  attribution: {
    // Read from this page's URL (the ad link's parameters) and appended to the CTA link, or sent as hidden form fields.
    params: ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
  },

  pixel: {
    id: "{{PIXEL_ID}}",                  // the Meta pixel (dataset) id from config/accounts.md, digits only; or "none" for no tracker at all
    conversionEvent: "{{CONVERSION_EVENT}}" // standard event fired once on the CTA click (or form submit): "Lead", "Contact", "Schedule", ...
  },

  consent: {
    mode: "{{CONSENT_MODE}}",            // "required" (nothing loads before Accept) or "not-required" (only on the Owner's lawyer's written word)
    text: "{{CONSENT_SENTENCE}}",        // lawyer to confirm: the one sentence that names the Meta pixel and what it is for
    accept: "{{CONSENT_ACCEPT}}",        // lawyer to confirm: e.g. "Accept"
    decline: "{{CONSENT_DECLINE}}",      // lawyer to confirm: e.g. "Decline"
    storageKey: "landing-consent-v1"     // where the choice is remembered (localStorage); bump the suffix when the sentence changes, to ask again
  }
};
