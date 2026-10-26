// ads.js: the single data file of a flight's preview site. index.html (the Facebook-frame feed) and plan.html
// (the team presentation of the plan) both read it, so a copy change here changes both pages.
// Keep it in step with the copy table of the flight's plan file (plans/<date>-<flight>-plan.md): the plan is the
// source of truth; edit the plan first, then this file, then redeploy.
//
// SCHEMA
//
// window.ADS_META = {
//   pageName:   "Example Page",          // the Facebook Page name shown above every ad (from config/accounts.md)
//   avatar:     "media/logo.svg",        // the Page picture, a file in media/ (optional; a letter disc otherwise)
//   dir:        "ltr",                   // "ltr" or "rtl": the language direction of the ads (config/brand.md)
//   lang:       "en",                    // the BCP 47 language of the ads, for <html lang>
//   title:      "Flight 1 preview",      // the page title and header line
//   cta:        "Learn more",            // the default button text, as Meta shows it in the ads' language
//   linkCaption:"example.com",           // the small caption over the headline (a domain, or "Form on Facebook")
//   accent:     null,                    // optional colour for chips and plan accents; null keeps the neutral one
//   labels: {                            // optional: the preview chrome in the ads' language (English defaults)
//     sponsored: "Sponsored", seeMore: "See more", like: "Like", comment: "Comment", share: "Share",
//     feed: "Feed", stories: "Stories", all: "All", image: "Image", video: "Video", theme: "Dark or light"
//   },
//   footnote:   ""                       // optional line under the feed
// };
//
// window.SETS  = [ { id: "1", label: "Ad set 1 · <angle>", intro: "One line shown when the chip is chosen." } ];
// window.ROLES = { launch: "Launch", bench: "Bench", pool: "Pool" };   // role id -> badge text
//
// window.ADS = [ {
//   n:           1,                      // the fixed number (creatives/README.md): never changes, never reused
//   id:          "S01",                  // the creative id from the file name CREATIVE_<id>_<slug>_<ratio>
//   name:        "question-card",        // short name (the slug)
//   set:         "1",                    // the cell / ad set: a SETS id
//   role:        "launch",               // a ROLES id (optional)
//   status:      "planned",              // planned | gated | built-paused | active | paused | retired
//   adId:        null,                   // the Meta ad id once built (from the plan), else null
//   note:        "",                     // one short line for the team (open rulings, gate status)
//   primary:     "Primary text as it will run.",
//   headline:    "Headline",
//   description: "Description",
//   cta:         null,                   // this ad's button text when it differs from ADS_META.cta
//   media: {                             // the files are compressed copies in media/, never the upload masters
//     type:  "image",                    // image | video | cover (a 1200x628 lead-form cover)
//     src:   "media/S01_4x5.jpg",        // 4:5 image, or the 4:5 video
//     poster:"media/S01_4x5.jpg",        // video only: the poster frame
//     tall:  "media/S01_9x16.jpg",       // optional 9:16 file for the Stories view
//     tallPoster: null                   // optional poster for a 9:16 video
//   },
//   video: null                          // optional: a video twin of an image ad, same shape as media
// } ];
//
// window.PLAN = {                        // read by plan.html; every number comes from the plan file, never invented
//   title: "", subtitle: "", objective: "",
//   dates:   { start: null, end: null },                 // ISO dates
//   budget:  { daily: null, cap: null, currency: null }, // from the plan; currency from config/accounts.md
//   lines:   [],                                         // the short plan box shown on index.html
//   flow:    [ { title: "Sees the ad", text: "..." } ],   // the path from the feed to the result
//   audience:[ "Geo ...", "Age ...", "Language ..." ],
//   timeline:[ { date: "2026-01-01", label: "Launch" } ],
//   rules:   [ { when: "Cost per result above X for 3 days", then: "Pause the ad" } ],
//   owners:  [ { owner: "Owner", items: ["Gives the go"] } ],
//   forecast:{ cpm: null, ctr: null, cvr: null, sources: "" } // optional calculator defaults with their sources
// };
//
// The empty example below renders an empty feed with a hint. Replace it per flight.

window.ADS_META = {
  pageName: "",
  avatar: null,
  dir: "ltr",
  lang: "en",
  title: "Ads preview",
  cta: "Learn more",
  linkCaption: "",
  accent: null,
  labels: {},
  footnote: "",
};
window.SETS = [];
window.ROLES = {};
window.ADS = [];
window.PLAN = {
  title: "",
  subtitle: "",
  objective: "",
  dates: { start: null, end: null },
  budget: { daily: null, cap: null, currency: null },
  lines: [],
  flow: [],
  audience: [],
  timeline: [],
  rules: [],
  owners: [],
  forecast: { cpm: null, ctr: null, cvr: null, sources: "" },
};
