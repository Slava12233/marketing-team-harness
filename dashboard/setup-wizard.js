// dashboard/setup-wizard.js: the setup wizard's logic, shipped with the harness and loaded by dashboard/setup.html.
// No dependencies, nothing from the internet. Two pure functions (also run by dashboard/setup-page.test.mjs):
//   SetupWizard.merge(def, data, live, now)  → the view: every chapter and item with its status, the counts, "now"
//   SetupWizard.render(view, S, opts)        → the page body as HTML (S: one language's strings; opts.open, opts.pop)
// def is window.SETUP_DEFAULT (setup-default.js, shipped: chapters, items, strings), data is window.SETUP_DATA
// (setup-data.js, written by setup-page.mjs from the files and the marks), live is window.SETUP_LIVE (setup-live.js,
// written by the bootstrap after every step of the installation). Each may be missing: the page shows what it has.
(function (root) {
  'use strict';
  var LIVE_STALE_MS = 30 * 60 * 1000;   // a live file not updated for 30 minutes belongs to a run that was stopped
  // The bootstrap's items that only show once they did something (a Mac's Homebrew, the Node.js upgrade), and the
  // one that is a later step (the memory routines, registered by /campaign: the vault chapter shows it).
  var LIVE_QUIET = { brew: 1, node_upgrade: 1 }, LIVE_LATER = { routines: 1 };
  // A bootstrap item that also answers an item of the journey (only ever towards done).
  var LIVE_ANSWERS = { app: ['app.desktop'], obsidian: ['obsidian.installed'], obsidian_setup: ['obsidian.vault_opened', 'obsidian.cli'],
    env: ['install.env'], git: ['install.git'], node: ['install.node'], claude: ['install.claude'] };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function fmt(s) { return esc(s == null ? '' : s).replace(/`([^`]+)`/g, '<code dir="ltr">$1</code>'); }
  function cmds(html) { return html.replace(/(^|[\s(])(\/[a-z][a-z-]*)/g, '$1<bdi dir="ltr">$2</bdi>'); }   // /connect stays left to right in RTL
  function tpl(s, v) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return v[k] == null ? '' : v[k]; }); }
  function isDone(s) { return s === 'ok' || s === 'installed'; }

  function liveRunning(live, now) {
    if (!live || live.running !== true) return false;
    var t = Date.parse(live.updated || live.started || '');
    return !isNaN(t) && (now - t) < LIVE_STALE_MS;
  }

  function merge(def, data, live, now) {
    now = now || Date.now();
    var byKey = {}, chapters = [], running = liveRunning(live, now), optional = (def && def.optional) || [];
    if (data && data.chapters) {
      data.chapters.forEach(function (c) { (c.items || []).forEach(function (i) { byKey[i.key] = i.status; }); });
    }
    var source = (data && data.chapters) || (def && def.chapters) || [];
    source.forEach(function (c) {
      var ch = { id: c.id, n: c.n, part: c.part, info: !!c.info, items: [] };
      if (!c.info) {
        (c.items || []).forEach(function (it) {
          var key = typeof it === 'string' ? it : it.key;
          if (!data && optional.indexOf(key) >= 0) return;   // the optional rows show once a file or a mark answers them
          ch.items.push({ key: key, status: byKey[key] || 'todo' });
        });
      }
      chapters.push(ch);
    });
    if (live && live.items) {
      // the bootstrap's own items: they become the Install chapter, ticking as the run goes
      var c1 = chapters.filter(function (c) { return c.id === 'c1'; })[0], liveItems = [];
      Object.keys(live.items).forEach(function (k) {
        var s = live.items[k];
        if (LIVE_LATER[k]) return;
        if (LIVE_QUIET[k] && (s === 'pending' || s === 'skipped')) return;
        var st = isDone(s) ? 'done' : s === 'skipped' ? 'na' : (running && live.current === k) ? 'doing'
          : (s === 'missing' && !running) ? 'owner' : 'todo';
        liveItems.push({ key: 'live.' + k, live: k, liveState: (running && live.current === k) ? 'doing' : s, status: st });
        (LIVE_ANSWERS[k] || []).forEach(function (j) {
          chapters.forEach(function (c) { c.items.forEach(function (i) { if (i.key === j && isDone(s)) i.status = 'done'; }); });
        });
      });
      if (c1) {
        var keep = c1.items.filter(function (i) { return i.key === 'install.mcpjson'; });
        c1.items = liveItems.concat(keep);
        c1.live = true;
      }
    }
    var done = 0, tracked = 0, next = null, parts = {};
    chapters.forEach(function (c) {
      if (c.info) return;
      var d = 0, t = 0, has = {};
      c.items.forEach(function (i) { has[i.status] = 1; if (i.status === 'done') d++; if (i.status !== 'na') t++; });
      c.done = d; c.tracked = t;
      c.status = d === t ? 'done' : has.doing ? 'doing' : has.owner ? 'owner' : 'todo';
      if (!next) {
        var open = c.items.filter(function (i) { return i.status === 'doing' || i.status === 'owner' || i.status === 'todo'; })[0];
        if (open) next = { key: open.key, status: open.status, chapter: c.id, n: c.n };
      }
      done += d; tracked += t;
      parts[c.part] = parts[c.part] || { done: 0, tracked: 0 };
      parts[c.part].done += d; parts[c.part].tracked += t;
    });
    var nowCard;
    if (running && live.current) nowCard = { kind: 'installing', key: 'live.' + live.current, live: live.current, status: 'doing' };
    else if (running) nowCard = { kind: 'checking', status: 'doing' };
    else if (next) nowCard = { kind: 'next', key: next.key, status: next.status, chapter: next.chapter, n: next.n };
    else nowCard = { kind: 'done', status: 'done' };
    var stamps = [data && data.generatedAt, live && live.updated].filter(Boolean).map(function (x) { return Date.parse(x); }).filter(function (x) { return !isNaN(x); });
    return {
      lang: data && data.lang, company: data && data.company, chapters: chapters, done: done, tracked: tracked, parts: parts,
      now: nowCard, running: running, liveSeen: !!live, updated: stamps.length ? new Date(Math.max.apply(null, stamps)).toISOString() : null,
    };
  }

  function label(S, it) { return it.live ? (S.install && S.install[it.live]) || it.live : (S.items && S.items[it.key]) || it.key; }
  function stateText(S, it) { return it.live ? (S.liveStatus && S.liveStatus[it.liveState]) || it.liveState : S.status[it.status]; }
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function render(v, S, opts) {
    opts = opts || {};
    var open = opts.open || {}, pop = opts.pop || {}, hinted = new RegExp(opts.hinted || '^(obsidian|app|chrome|keys)\\.');
    var pct = v.tracked ? Math.round(100 * v.done / v.tracked) : 0, h = '', part = '';
    function hintFor(it) {
      if (it.live) return '';
      var show = it.status === 'owner' || (it.status === 'todo' && hinted.test(it.key));
      return show && S.hints && S.hints[it.key] ? S.hints[it.key] : '';
    }
    h += '<header class="top"><div class="ring" style="--p:' + pct + '" role="img" aria-label="' + esc(tpl(S.progress, v)) + '"><span>' + pct + '%</span></div>';
    h += '<div class="heading"><h1>' + esc(S.title) + '</h1><p class="company">' + esc(v.company || S.defaultCompany) + ' · ' + esc(tpl(S.progress, v)) + '</p></div>';
    h += '<div class="langs">';
    ['en', 'he'].forEach(function (l) {
      h += '<button type="button" data-lang="' + l + '" lang="' + l + '" aria-pressed="' + (l === S.code) + '">' + esc(S.langName[l]) + '</button>';
    });
    h += '</div></header>';

    var n = v.now, what = '', who = '';
    if (n.kind === 'installing') { what = tpl(S.installing, { item: label(S, n) }); who = S.installNote; }
    else if (n.kind === 'checking') { what = S.checking; who = S.installNote; }
    else if (n.kind === 'done') { what = S.allSet; }
    else {
      var it = { key: n.key, status: n.status, live: n.key.indexOf('live.') === 0 ? n.key.slice(5) : null, liveState: 'missing' };
      what = label(S, it);
      if (n.status === 'owner') who = S.yourClick + (hintFor(it) ? ': ' + hintFor(it) : (it.live ? ': ' + S.installStopped : ''));
      else if (n.status === 'doing') who = S.wizard;
      else who = tpl(S.chapterN, { n: n.n }) + ' · ' + (S.chapters[n.chapter] || '') + (hintFor(it) ? ' · ' + hintFor(it) : '');
    }
    h += '<section class="now k-' + n.kind + ' st-' + n.status + '" aria-live="polite"><span class="now-icon" aria-hidden="true"></span>' +
      '<div><p class="eyebrow">' + esc(S.now) + '</p><p class="what">' + fmt(what) + '</p>' + (who ? '<p class="who">' + fmt(who) + '</p>' : '') + '</div></section>';

    h += '<nav class="parts">';
    ['A', 'B'].forEach(function (p) {
      var q = v.parts[p] || { done: 0, tracked: 0 }, pp = q.tracked ? Math.round(100 * q.done / q.tracked) : 0;
      h += '<div class="pbar"><span class="plabel">' + cmds(esc(S.parts[p].split(':')[0])) + '</span><span class="track"><span style="width:' + pp + '%"></span></span>' +
        '<span class="pcount">' + q.done + '/' + q.tracked + '</span></div>';
    });
    h += '</nav>';

    v.chapters.forEach(function (c) {
      if (!c.info && !c.items.length) return;   // a chapter with nothing to show (a platform this company does not use)
      if (c.part !== part) { part = c.part; h += '<h2 class="part">' + cmds(fmt(S.parts[part])) + '</h2>'; }
      var isOpen = open[c.id] != null ? open[c.id]
        : c.info ? (c.id === 'c0' ? v.done === 0 : v.now.kind === 'done')
        : (c.status === 'owner' || c.status === 'doing' || (c.live && v.running) || c.items.some(function (i) { return i.key === v.now.key; }));
      var head = '<span class="num">' + esc(c.n) + '</span><span class="title">' + fmt(S.chapters[c.id]) + '</span>';
      if (c.info) {
        h += '<section class="chapter info' + (isOpen ? ' open' : '') + '"><button type="button" class="chead" data-toggle="' + c.id + '" aria-expanded="' + isOpen + '">' +
          '<span class="cbox info-box" aria-hidden="true">i</span>' + head + '<span class="chev" aria-hidden="true"></span></button><ul class="lines">';
        (S.info[c.id] || []).forEach(function (l) { h += '<li>' + fmt(l) + '</li>'; });
        h += '</ul></section>';
        return;
      }
      h += '<section class="chapter st-' + c.status + (isOpen ? ' open' : '') + (c.live ? ' live' : '') + '"><button type="button" class="chead" data-toggle="' + c.id +
        '" aria-expanded="' + isOpen + '"><span class="cbox st-' + c.status + '" role="img" aria-label="' + esc(S.status[c.status]) + '">' + CHECK + '</span>' + head +
        (c.tracked ? '<span class="cnt">' + c.done + '/' + c.tracked + '</span>' : '') + '<span class="chev" aria-hidden="true"></span></button>';
      if (c.live && v.running) h += '<p class="live-note"><span class="dot" aria-hidden="true"></span>' + fmt(S.installNote) + '</p>';
      h += '<ul class="items">';
      c.items.forEach(function (it) {
        var hint = hintFor(it);
        h += '<li class="item st-' + it.status + (pop[it.key] ? ' pop' : '') + '" data-key="' + esc(it.key) + '"><span class="box" aria-hidden="true">' + CHECK + '</span>' +
          '<span class="text"><span class="label">' + fmt(label(S, it)) + '</span><span class="st">' + esc(stateText(S, it)) + '</span>' +
          (hint ? '<span class="hint">' + fmt(hint) + '</span>' : '') + '</span></li>';
      });
      h += '</ul></section>';
    });

    var when = v.updated || '';
    try { if (when) when = new Date(when).toLocaleString(S.locale, { dateStyle: 'medium', timeStyle: 'medium' }); } catch (e) { /* keep ISO */ }
    h += '<footer><p>' + (when ? esc(S.lastUpdate) + ' ' + esc(when) : esc(S.waiting)) + '</p><p>' + esc(S.reload) + '</p><p>' + fmt(S.byHand) + '</p></footer>';
    return h;
  }

  // Which items turned done since the previous view (they get the tick animation).
  function popped(prev, v) {
    var out = {}, any = false;
    if (!prev) return out;
    v.chapters.forEach(function (c) { c.items.forEach(function (i) { if (i.status === 'done' && prev[i.key] && prev[i.key] !== 'done') { out[i.key] = 1; any = true; } }); });
    return any ? out : {};
  }
  function statuses(v) {
    var m = {};
    v.chapters.forEach(function (c) { c.items.forEach(function (i) { m[i.key] = i.status; }); });
    return m;
  }

  root.SetupWizard = { merge: merge, render: render, popped: popped, statuses: statuses };
})(typeof window !== 'undefined' ? window : globalThis);
