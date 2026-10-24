/* Royaume de Bourgogne - logic.js
 * window.LOGIC : pure game rules, deterministic given `now` (never reads the clock).
 * window.DATA  : runtime data layer (claude.ai capabilities, with an in-memory demo fallback).
 * Plain JavaScript, no dependencies. Page source holds no real client data.
 */
(function (root) {
  'use strict';

  // ===========================================================================
  // Constants
  // ===========================================================================
  var TZ = 'Europe/Paris';
  var DAY_MS = 86400000;
  var DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  var CALENDLY = 'https://calendly.com/thefrenchbot-coaching/30min';
  var XP_THRESHOLDS = [0, 100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];
  var THRESHOLDS = {
    contractsent: 5, presentationscheduled: 7, qualifiedtobuy: 14, appointmentscheduled: 21, '': 21
  };
  var STAGE_CHAPTER = { appointmentscheduled: 1, qualifiedtobuy: 2, presentationscheduled: 3, contractsent: 4 };
  var CHAPTERS = [
    { index: 0, stage: null, numeral: '0', title: 'La Rumeur', label: 'Chapitre 0 — « La Rumeur »', hint: 'à qualifier' },
    { index: 1, stage: 'appointmentscheduled', numeral: 'I', title: "L'Audience", label: "Chapitre I — « L'Audience »", hint: 'rendez-vous planifié' },
    { index: 2, stage: 'qualifiedtobuy', numeral: 'II', title: 'La Reconnaissance', label: 'Chapitre II — « La Reconnaissance »', hint: 'besoin qualifié' },
    { index: 3, stage: 'presentationscheduled', numeral: 'III', title: 'La Joute', label: 'Chapitre III — « La Joute »', hint: 'présentation planifiée' },
    { index: 4, stage: 'contractsent', numeral: 'IV', title: 'Le Sceau', label: 'Chapitre IV — « Le Sceau »', hint: 'devis envoyé' }
  ];
  var SEASONS = ['Le Grand Froid', 'La Chandeleur', 'Les Semailles', 'Le Renouveau', 'Le Mai fleuri', 'La Saint-Jean',
    'Les Moissons', 'Le Plein Été', 'Les Vendanges', 'Les Pressoirs', 'La Saint-Martin', "L'Avent"];
  var MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var MONTHS_LOWER = MONTHS.map(function (m) { return m.toLowerCase(); });
  var MONTHS_SHORT = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  var WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var WEEKDAYS_SHORT = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
  var TITLES = [
    { min: 0, max: 5, title: 'Écuyer' },
    { min: 6, max: 9, title: 'Chevalier' },
    { min: 10, max: 13, title: 'Chevalier banneret' },
    { min: 14, max: 17, title: 'Baron' },
    { min: 18, max: 21, title: 'Vicomte' },
    { min: 22, max: 25, title: 'Comte' },
    { min: 26, max: 29, title: 'Marquis' },
    { min: 30, max: 30, title: 'Duc de Bourgogne' }
  ];
  var STAGE_PLAIN = {
    '': 'à qualifier', appointmentscheduled: 'rendez-vous planifié', qualifiedtobuy: 'besoin qualifié',
    presentationscheduled: 'présentation planifiée', contractsent: 'devis envoyé', closedwon: 'gagnée', closedlost: 'perdue'
  };
  var LIMITS = { perfectDays: 200, abattus: 2000, lastSeen: 500, actionsDays: 400, doneIds: 500, reconquests: 500, lostDays: 500 };
  // A read fetched this soon after the last in-game action may still list the task as open (search-index lag).
  var STALE_READ_MS = 120000;
  // Longest wait the page accepts before ONE automatic read retry; a longer retryAfterMs goes to the manual « Réessayer ».
  var RETRY_BUDGET_MS = 10000;

  var CONFIG = {
    heroName: 'Sire Julian de Bourgogne',
    goal: 15000,
    tz: TZ,
    thresholds: THRESHOLDS,
    chapters: CHAPTERS,
    reconquestDays: 120,
    siegeMin: 10,
    calendly: CALENDLY,
    seasons: SEASONS,
    months: MONTHS,
    xpThresholds: XP_THRESHOLDS,
    titles: TITLES,
    upcomingDays: 14,
    maxTentsDrawn: 24,
    xp: { task: 20, onTime: 10, slain: 5, siege: 500, perfectDay: 50, wonBase: 50, wonDivisor: 20, lostHonesty: 10, deal: 25 },
    storageKey: 'royaume-bourgogne-state',
    limits: LIMITS
  };

  // ===========================================================================
  // Small helpers
  // ===========================================================================
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function isObj(x) { return x != null && typeof x === 'object' && !Array.isArray(x); }
  function isDateObj(x) { return Object.prototype.toString.call(x) === '[object Date]'; }
  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function str(x) { return x == null ? '' : String(x); }
  function num(x) {
    if (typeof x === 'number') return isFinite(x) ? x : null;
    if (typeof x === 'string' && x.trim() !== '') { var n = parseFloat(x.replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : null; }
    return null;
  }
  function uniqStrings(list) {
    var seen = {}, out = [];
    (list || []).forEach(function (v) {
      if (v == null) return;
      var s = String(v);
      if (!s || seen[s]) return;
      seen[s] = 1; out.push(s);
    });
    return out;
  }
  function truncate(s, n) {
    s = str(s);
    if (s.length <= n) return s;
    return s.slice(0, Math.max(0, n - 1)).replace(/\s+\S*$/, '') + '…';
  }

  // ===========================================================================
  // Europe/Paris calendar math (Intl based, DST-correct)
  // ===========================================================================
  var partsFormatter = null;
  function getPartsFormatter() {
    if (!partsFormatter) {
      partsFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
      });
    }
    return partsFormatter;
  }
  function parisParts(date) {
    var parts = getPartsFormatter().formatToParts(date), o = {};
    for (var i = 0; i < parts.length; i++) o[parts[i].type] = parts[i].value;
    var h = parseInt(o.hour, 10);
    if (h === 24) h = 0;
    return { y: parseInt(o.year, 10), m: parseInt(o.month, 10), d: parseInt(o.day, 10), h: h, mi: parseInt(o.minute, 10), s: parseInt(o.second, 10) };
  }
  // Paris wall-clock minus UTC (ms) at instant t.
  function parisOffsetMs(t) {
    var p = parisParts(new Date(t));
    var wall = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
    return wall - Math.floor(t / 1000) * 1000;
  }
  function parisDateAt(day, hh, mm) {
    var m = DAY_RE.exec(str(day).trim());
    if (!m) return null;
    var naive = Date.UTC(+m[1], +m[2] - 1, +m[3], hh || 0, mm || 0, 0);
    var t = naive - parisOffsetMs(naive);
    t = naive - parisOffsetMs(t);
    return new Date(t);
  }
  // Accepts Date (any realm), epoch ms, ISO string, epoch-ms string, or a bare "YYYY-MM-DD" (= that Paris day, noon).
  function toDate(x) {
    if (x == null || x === '') return null;
    if (isDateObj(x)) { var t = x.getTime(); return isNaN(t) ? null : new Date(t); }
    if (typeof x === 'number') return isFinite(x) ? new Date(x) : null;
    if (typeof x === 'string') {
      var s = x.trim();
      if (!s) return null;
      if (/^\d{11,}$/.test(s)) return new Date(Number(s));
      if (DAY_RE.test(s)) return parisDateAt(s, 12, 0);
      var d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  function toIso(x) { var d = toDate(x); return d ? d.toISOString() : null; }
  function parisDay(x) {
    if (typeof x === 'string' && DAY_RE.test(x.trim())) return x.trim();
    var d = toDate(x);
    if (!d) return null;
    var p = parisParts(d);
    return p.y + '-' + pad2(p.m) + '-' + pad2(p.d);
  }
  function parisHour(x) {
    var d = toDate(x);
    if (!d) return 0;
    var p = parisParts(d);
    return p.h + p.mi / 60 + p.s / 3600;
  }
  function dayNum(day) {
    var m = DAY_RE.exec(str(day));
    return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS) : NaN;
  }
  function dayFromNum(n) {
    var d = new Date(n * DAY_MS);
    return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }
  // Whole Paris calendar days from dayA to dayB (positive when B is later).
  function daysBetween(dayA, dayB) {
    var a = dayNum(parisDay(dayA)), b = dayNum(parisDay(dayB));
    return (isNaN(a) || isNaN(b)) ? NaN : b - a;
  }
  function addDays(day, n) {
    var d = dayNum(parisDay(day));
    return isNaN(d) ? null : dayFromNum(d + (n || 0));
  }
  function weekdayOf(day) { var d = dayNum(parisDay(day)); return isNaN(d) ? -1 : new Date(d * DAY_MS).getUTCDay(); }
  function isWeekday(day) { var w = weekdayOf(day); return w >= 1 && w <= 5; }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function laterIso(a, b) {
    var da = toDate(a), db = toDate(b);
    if (da && db) return da.getTime() >= db.getTime() ? a : b;
    return da ? a : (db ? b : null);
  }

  // ===========================================================================
  // French formatting helpers (for the UI; all pure)
  // ===========================================================================
  function euros(n) {
    var v = Math.round(num(n) || 0);
    var sign = v < 0 ? '-' : '';
    return sign + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
  }
  function longDay(day) {
    var d = parisDay(day);
    if (!d) return '';
    var m = DAY_RE.exec(d);
    return WEEKDAYS[weekdayOf(d)] + ' ' + (+m[3]) + ' ' + MONTHS_LOWER[+m[2] - 1] + ' ' + m[1];
  }
  function shortDay(day) {
    var d = parisDay(day);
    if (!d) return '';
    var m = DAY_RE.exec(d);
    return (+m[3]) + ' ' + MONTHS_SHORT[+m[2] - 1];
  }
  function dateBox(now) {
    var d = parisDay(now);
    if (!d) return '';
    var m = DAY_RE.exec(d);
    return WEEKDAYS_SHORT[weekdayOf(d)] + ' ' + (+m[3]) + ' ' + MONTHS_SHORT[+m[2] - 1];
  }
  function clock(now) {
    var d = toDate(now);
    if (!d) return '';
    var p = parisParts(d);
    return pad2(p.h) + ':' + pad2(p.mi);
  }
  function relDay(day, today) {
    var n = daysBetween(today, day);
    if (isNaN(n)) return '';
    if (n === 0) return "aujourd'hui";
    if (n === 1) return 'demain';
    if (n === -1) return 'hier';
    return n > 0 ? 'dans ' + n + ' jours' : 'il y a ' + (-n) + ' jours';
  }

  // ===========================================================================
  // Text helpers (HTML notes, email bodies, scribe output)
  // ===========================================================================
  var ENTITIES = {
    nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
    agrave: 'à', acirc: 'â', auml: 'ä', ccedil: 'ç', icirc: 'î', iuml: 'ï', ocirc: 'ô', ouml: 'ö', ugrave: 'ù',
    ucirc: 'û', uuml: 'ü', yuml: 'ÿ', oelig: 'œ', aelig: 'æ', Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Agrave: 'À',
    Acirc: 'Â', Ccedil: 'Ç', Ocirc: 'Ô', OElig: 'Œ', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', ldquo: '“',
    rdquo: '”', hellip: '…', ndash: '–', mdash: '—', euro: '€', deg: '°', middot: '·', bull: '•', copy: '©',
    reg: '®', trade: '™', times: '×', shy: ''
  };
  function decodeEntities(s) {
    return str(s).replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, function (all, e) {
      if (e[0] === '#') {
        var code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        if (!isFinite(code) || code <= 0 || code > 0x10FFFF) return all;
        try { return String.fromCodePoint(code); } catch (err) { return all; }
      }
      return hasOwn(ENTITIES, e) ? ENTITIES[e] : all;
    });
  }
  function htmlToText(html) {
    var s = str(html);
    if (!s) return '';
    s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<li[^>]*>/gi, '\n- ');
    s = s.replace(/<\/(p|div|li|ul|ol|h[1-6]|tr|blockquote|section|article)>/gi, '\n');
    s = s.replace(/<[^>]+>/g, '');
    s = decodeEntities(s);
    s = s.replace(/ /g, ' ').replace(/\r\n?/g, '\n');
    s = s.split('\n').map(function (l) { return l.replace(/[ \t]+/g, ' ').trim(); }).join('\n');
    return s.replace(/\n{3,}/g, '\n\n').trim();
  }
  function oneLine(s) { return str(s).replace(/\s+/g, ' ').trim(); }
  // Plain-text email body: drop quoted history, normalise whitespace.
  function mailText(s) {
    var t = str(s).replace(/\r\n?/g, '\n');
    var cut = t.search(/\n[^\n]{0,20}(Le |On )[^\n]{4,200}(a écrit|wrote)\s*:/);
    if (cut > 0) t = t.slice(0, cut);
    t = t.split('\n').filter(function (l) { return !/^\s*>/.test(l); }).join('\n');
    return oneLine(t);
  }
  var EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
  function cleanText(s) {
    var t = str(s).replace(/\r\n?/g, '\n');
    t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, function (all, label, url) {
      return label.trim() === url ? url : label.trim() + ' : ' + url;
    });
    t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '');
    t = t.replace(/^[ \t]{0,3}>[ \t]?/gm, '');
    t = t.replace(/^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gm, '');
    t = t.replace(/^([ \t]*)[*+•][ \t]+/gm, '$1- ');
    t = t.replace(/\*\*|__|`+/g, '');
    t = t.replace(/(^|[\s(«"'])\*(\S(?:[^*\n]*\S)?)\*(?=[\s).,;:!?»"']|$)/gm, '$1$2');
    t = t.replace(EMOJI_RE, '');
    t = t.split('\n').map(function (l) { return l.replace(/[ \t]+$/, ''); }).join('\n');
    t = t.replace(/\n{3,}/g, '\n\n');
    return t.trim();
  }
  function cleanSubject(s) {
    var t = oneLine(cleanText(s));
    t = t.replace(/^["'«“\s]+|["'»”\s]+$/g, '').trim();
    return t;
  }
  function cleanDraft(d) {
    d = d || {};
    return { subject: cleanSubject(d.subject), body: cleanText(d.body) };
  }
  function replySubject(subject) {
    var s = oneLine(subject);
    if (!s) return null;
    return /^re\s*:/i.test(s) ? s : 'Re: ' + s;
  }
  // Exact create_draft fields for a scribe draft: reply to the latest Gmail message when a thread exists.
  function gmailDraftInput(context, draft) {
    var c = context || {}, d = draft || {};
    var email = c.contact && c.contact.email ? String(c.contact.email).trim() : '';
    var out = { to: email ? [email] : [], subject: cleanSubject(d.subject), body: str(d.body) };
    var g = c.gmail;
    if (g && g.lastMessageId) {
      out.replyToMessageId = String(g.lastMessageId);
      var rs = replySubject(g.subject);
      if (rs) out.subject = rs;
    }
    return out;
  }

  // ===========================================================================
  // Levels, titles, stages
  // ===========================================================================
  // Level = 1-based index of the highest cumulative threshold <= xp, capped at 10.
  // (0..99 -> 1, 100..379 -> 2, ..., 6900..9999 -> 9, >= 10000 -> 10.)
  function levelFromXp(xp) {
    var x = Math.max(0, Math.round(num(xp) || 0));
    var idx = 0;
    for (var i = 0; i < XP_THRESHOLDS.length; i++) if (XP_THRESHOLDS[i] <= x) idx = i;
    var level = Math.min(10, idx + 1);
    var floor = XP_THRESHOLDS[level - 1];
    var next = level < 10 ? XP_THRESHOLDS[level] : null;
    return {
      level: level, xp: x, floor: floor, next: next,
      pct: next == null ? 1 : Math.max(0, Math.min(1, (x - floor) / (next - floor))),
      toNext: next == null ? 0 : next - x
    };
  }
  function heroTitle(level) {
    var l = Math.round(num(level) || 0);
    for (var i = TITLES.length - 1; i >= 0; i--) if (l >= TITLES[i].min) return TITLES[i].title;
    return TITLES[0].title;
  }
  function chapterOf(stage) {
    var s = str(stage);
    return hasOwn(STAGE_CHAPTER, s) ? STAGE_CHAPTER[s] : 0;
  }
  function thresholdOf(stage) {
    var s = str(stage);
    return hasOwn(THRESHOLDS, s) ? THRESHOLDS[s] : THRESHOLDS[''];
  }
  function hearts(days, threshold) {
    var d = Math.max(0, num(days) || 0), T = num(threshold) || THRESHOLDS[''];
    if (d <= T / 2) return 5;
    if (d >= 2 * T) return 0;
    var x = 5 * (2 * T - d) / (1.5 * T);
    return Math.max(0, Math.min(5, Math.round(x * 2) / 2));
  }
  function tierFor(daysOverdue) {
    var d = num(daysOverdue) || 0;
    if (d >= 30) return 3;
    if (d >= 7) return 2;
    if (d >= 1) return 1;
    return 0;
  }
  function clientOf(name) {
    var s = str(name), idx = -1;
    [' - ', ' — ', ' – '].forEach(function (sep) {
      var i = s.indexOf(sep);
      if (i > 0 && (idx < 0 || i < idx)) idx = i;
    });
    return (idx > 0 ? s.slice(0, idx) : s).trim();
  }

  // ===========================================================================
  // State
  // ===========================================================================
  function emptyState() {
    return {
      v: 1,
      lastSeen: null,
      observedAt: null,
      perfectDays: [],
      actions: {},
      todayDoneIds: { day: null, ids: [], kinds: {} },
      abattus: [],
      siege: { startedAt: null, initialCount: 0, completedAt: null, bonusAwarded: false },
      reconquests: {},
      muted: false,
      seenIntro: false
    };
  }
  var KNOWN_KEYS = { v: 1, lastSeen: 1, observedAt: 1, perfectDays: 1, actions: 1, todayDoneIds: 1, abattus: 1, siege: 1, reconquests: 1, lostDays: 1, muted: 1, seenIntro: 1, savedAt: 1 };
  function pruneActions(actions) {
    var keys = Object.keys(actions).filter(function (k) { return DAY_RE.test(k); }).sort();
    var out = {};
    keys.slice(-LIMITS.actionsDays).forEach(function (k) {
      var n = Math.floor(num(actions[k]) || 0);
      if (n > 0) out[k] = n;
    });
    return out;
  }
  // Merge any stored object onto emptyState(), type-checking every field and bounding lists.
  // Unknown top-level keys (UI prefs) are kept as-is. Always returns fresh objects for known fields.
  function normalizeState(input) {
    var s = emptyState();
    if (!isObj(input)) return s;
    Object.keys(input).forEach(function (k) { if (!hasOwn(KNOWN_KEYS, k)) s[k] = input[k]; });
    if (isObj(input.lastSeen)) {
      s.lastSeen = {};
      Object.keys(input.lastSeen).slice(0, LIMITS.lastSeen).forEach(function (k) {
        var v = input.lastSeen[k];
        s.lastSeen[k] = v == null ? '' : String(v);
      });
    }
    if (typeof input.observedAt === 'string' && toDate(input.observedAt)) s.observedAt = input.observedAt;
    if (Array.isArray(input.perfectDays)) {
      s.perfectDays = uniqStrings(input.perfectDays).filter(function (d) { return DAY_RE.test(d); }).sort().slice(-LIMITS.perfectDays);
    }
    if (isObj(input.actions)) s.actions = pruneActions(input.actions);
    if (isObj(input.todayDoneIds)) {
      var t = input.todayDoneIds;
      s.todayDoneIds.day = typeof t.day === 'string' && DAY_RE.test(t.day) ? t.day : null;
      s.todayDoneIds.ids = uniqStrings(Array.isArray(t.ids) ? t.ids : []).slice(-LIMITS.doneIds);
      var kinds = isObj(t.kinds) ? t.kinds : {};
      s.todayDoneIds.ids.forEach(function (id) {
        var k = kinds[id];
        if (k === 'sent' || k === 'slain' || k === 'postponed') s.todayDoneIds.kinds[id] = k;
      });
      // Time of the last in-game action (optional): guards stale reads across the Paris midnight.
      if (typeof t.at === 'string' && toDate(t.at)) s.todayDoneIds.at = t.at;
    }
    if (Array.isArray(input.abattus)) s.abattus = uniqStrings(input.abattus).slice(-LIMITS.abattus);
    if (isObj(input.siege)) {
      var g = input.siege;
      s.siege.startedAt = typeof g.startedAt === 'string' ? g.startedAt : null;
      s.siege.initialCount = Math.max(0, Math.floor(num(g.initialCount) || 0));
      s.siege.completedAt = typeof g.completedAt === 'string' ? g.completedAt : null;
      s.siege.bonusAwarded = g.bonusAwarded === true || (!!s.siege.completedAt && g.bonusAwarded !== false);
      // Task whose in-game action ended the siege (optional): an « Annuler » on it reopens the siege.
      if (s.siege.completedAt && typeof g.completedBy === 'string' && g.completedBy) s.siege.completedBy = g.completedBy;
    }
    if (isObj(input.reconquests)) {
      Object.keys(input.reconquests).slice(-LIMITS.reconquests).forEach(function (k) {
        var v = input.reconquests[k];
        if (v === 'launched' || v === 'dismissed') s.reconquests[k] = v;
      });
    }
    // Loss day observed for lost deals that have no closeDate in HubSpot (so the chronicle can schedule the reconquest).
    if (isObj(input.lostDays)) {
      var lk = Object.keys(input.lostDays).filter(function (k) { return DAY_RE.test(str(input.lostDays[k])); });
      if (lk.length) {
        s.lostDays = {};
        lk.slice(-LIMITS.lostDays).forEach(function (k) { s.lostDays[k] = input.lostDays[k]; });
      }
    }
    s.muted = input.muted === true;
    s.seenIntro = input.seenIntro === true;
    return s;
  }
  // Plain JSON copy, bounded for the 256 KiB db doc.
  function compactState(state) { return clone(normalizeState(state)); }

  // recordAction(state, {type, id, day, status?}) -> NEW state.
  //   type: "sent" | "slain" | "postponed" | "reconquest" | "undo"
  //   day : "YYYY-MM-DD" Paris day of the action (required except for "reconquest")
  //   "reconquest": status "launched" (default) or "dismissed".
  //   "undo": the task was reopened (Annuler): forgets that day's action on this id.
  function recordAction(state, action) {
    if (!action || !action.type) throw new TypeError('recordAction: type requis');
    var s = normalizeState(state);
    var type = action.type;
    var id = action.id != null && action.id !== '' ? String(action.id) : null;
    var day = action.day ? parisDay(action.day) : null;
    if (type === 'sent' || type === 'slain' || type === 'postponed') {
      if (!day) throw new TypeError('recordAction: day requis');
      s.actions[day] = (s.actions[day] || 0) + 1;
      if (s.todayDoneIds.day !== day) s.todayDoneIds = { day: day, ids: [], kinds: {} };
      var at = action.at ? toIso(action.at) : null;
      if (at) s.todayDoneIds.at = at;
      if (id) {
        // Most recent action last (checkSiege reads the last id as the one that ended a siege).
        s.todayDoneIds.ids = s.todayDoneIds.ids.filter(function (x) { return x !== id; });
        s.todayDoneIds.ids.push(id);
        s.todayDoneIds.kinds[id] = type;
        if (type === 'slain') {
          s.abattus = s.abattus.filter(function (x) { return x !== id; });
          s.abattus.push(id);
          if (s.abattus.length > LIMITS.abattus) s.abattus = s.abattus.slice(-LIMITS.abattus);
        } else if (type === 'sent') {
          s.abattus = s.abattus.filter(function (x) { return x !== id; });
        }
      }
    } else if (type === 'undo') {
      if (!day) throw new TypeError('recordAction: day requis');
      if (id) {
        if (s.todayDoneIds.day === day && s.todayDoneIds.ids.indexOf(id) >= 0) {
          s.todayDoneIds.ids = s.todayDoneIds.ids.filter(function (x) { return x !== id; });
          delete s.todayDoneIds.kinds[id];
          var n = (s.actions[day] || 0) - 1;
          if (n > 0) s.actions[day] = n; else delete s.actions[day];
        }
        s.abattus = s.abattus.filter(function (x) { return x !== id; });
        // « Annuler » on the send that won the siege: the goblin is back, so is the siege (and the +500 goes).
        if (s.siege.completedBy === id && s.siege.completedAt && parisDay(s.siege.completedAt) === day) {
          s.siege.completedAt = null;
          s.siege.bonusAwarded = false;
          delete s.siege.completedBy;
        }
      }
    } else if (type === 'reconquest') {
      if (!id) throw new TypeError('recordAction: id requis');
      s.reconquests[id] = action.status === 'dismissed' ? 'dismissed' : 'launched';
    } else {
      throw new TypeError('recordAction: type inconnu « ' + type + ' »');
    }
    s.actions = pruneActions(s.actions);
    return s;
  }

  // ===========================================================================
  // Game model
  // ===========================================================================
  // Ids acted on in-game that a read may still list as open. Today's always; the previous day's too
  // while the data was fetched within STALE_READ_MS of the last action (page left open past midnight).
  function doneKinds(st, today, fetchedAt) {
    var out = {};
    var t = st.todayDoneIds;
    if (!t || !t.day) return out;
    var fresh = t.day === today;
    if (!fresh && t.day < today && t.at) {
      var at = toDate(t.at), f = toDate(fetchedAt);
      fresh = !!(at && f && f.getTime() < at.getTime() + STALE_READ_MS);
    }
    if (fresh) t.ids.forEach(function (id) { out[id] = t.kinds[id] || 'sent'; });
    return out;
  }
  function lastDoneId(st, today) {
    var t = st.todayDoneIds;
    return t && t.day === today && t.ids.length ? t.ids[t.ids.length - 1] : null;
  }
  function siegeNext(siege, goblins, nowIso, lastId) {
    var s = {
      startedAt: siege && siege.startedAt || null,
      initialCount: Math.max(0, Math.floor(num(siege && siege.initialCount) || 0)),
      completedAt: siege && siege.completedAt || null,
      bonusAwarded: !!(siege && siege.bonusAwarded)
    };
    if (s.completedAt) {
      if (siege && siege.completedBy) s.completedBy = siege.completedBy;
      return s;
    }
    if (!s.startedAt) {
      if (goblins >= CONFIG.siegeMin) { s.startedAt = nowIso; s.initialCount = goblins; }
      return s;
    }
    if (goblins > s.initialCount) s.initialCount = goblins;
    if (goblins <= 0) {
      s.completedAt = nowIso; s.bonusAwarded = true;
      if (lastId) s.completedBy = String(lastId);
    }
    return s;
  }
  function streak(perfectDays, today, perfectToday) {
    var set = {};
    (perfectDays || []).forEach(function (d) { set[d] = 1; });
    if (perfectToday === undefined) perfectToday = !!set[today];
    var n = 0;
    if (isWeekday(today) && perfectToday) n++;
    var d = addDays(today, -1);
    for (var i = 0; i < 1500 && d; i++) {
      if (isWeekday(d)) {
        if (set[d]) n++; else break;
      }
      d = addDays(d, -1);
    }
    return n;
  }
  function byDueAsc(a, b) {
    var ta = a.dueAt ? (toDate(a.dueAt) || { getTime: function () { return Infinity; } }).getTime() : Infinity;
    var tb = b.dueAt ? (toDate(b.dueAt) || { getTime: function () { return Infinity; } }).getTime() : Infinity;
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }
  function timeOf(iso) { var d = toDate(iso); return d ? d.getTime() : -Infinity; }

  function questOf(d, today) {
    var stage = d.stage || null;
    var chapter = chapterOf(stage);
    var threshold = thresholdOf(stage);
    var ref = laterIso(d.lastContact, d.createDate);
    var days = ref ? Math.max(0, daysBetween(parisDay(ref), today) || 0) : 0;
    var next = d.nextActivity ? parisDay(d.nextActivity) : null;
    if (next && next < today) next = null;
    var name = str(d.name) || 'Quête sans nom';
    return {
      id: String(d.id), name: name, client: clientOf(name), amount: num(d.amount), stage: stage,
      chapter: chapter, chapterLabel: CHAPTERS[chapter].label, daysSinceContact: days, threshold: threshold,
      hearts: hearts(days, threshold), cold: days > threshold, nextActivityDay: next, planned: !!next,
      lastContactDay: d.lastContact ? parisDay(d.lastContact) : null, url: d.url || null
    };
  }

  // buildModel(raw, state, now) -> GameModel (pure).
  function buildModel(raw, state, now) {
    var nowD = toDate(now);
    if (!nowD) throw new TypeError('buildModel: now invalide');
    var nowIso = nowD.toISOString();
    var st = normalizeState(state);
    raw = raw || {};
    var deals = Array.isArray(raw.deals) ? raw.deals.filter(function (d) { return d && d.id != null; }) : [];
    var openTasks = Array.isArray(raw.openTasks) ? raw.openTasks.filter(function (t) { return t && t.id != null; }) : [];
    var completed = Array.isArray(raw.completedTasks) ? raw.completedTasks.filter(function (t) { return t && t.id != null; }) : [];
    var today = parisDay(nowD);
    var hour = parisHour(nowD);
    var done = doneKinds(st, today, raw.fetchedAt);

    // --- deals -> quests / won / lost
    var dealSeen = {}, quests = [], wonAll = [], lostAll = [];
    deals.forEach(function (d) {
      var id = String(d.id);
      if (dealSeen[id]) return;
      dealSeen[id] = 1;
      if (d.stage === 'closedwon') wonAll.push(d);
      else if (d.stage === 'closedlost') lostAll.push(d);
      else quests.push(questOf(d, today));
    });
    quests.sort(function (a, b) {
      if (a.chapter !== b.chapter) return b.chapter - a.chapter;
      if (a.cold !== b.cold) return a.cold ? -1 : 1;
      if (a.hearts !== b.hearts) return a.hearts - b.hearts;
      return a.name.localeCompare(b.name, 'fr');
    });

    // --- tasks -> missives
    var lists = { today: [], overdue: [], upcoming: [], waiting: [], later: [] };
    var horizon = addDays(today, CONFIG.upcomingDays);
    var openById = {};
    openTasks.forEach(function (t) {
      var id = String(t.id);
      if (openById[id]) return;
      openById[id] = t;
      var status = t.status || 'NOT_STARTED';
      if (status === 'COMPLETED') return;
      var dueDay = t.dueAt ? parisDay(t.dueAt) : null;
      var k = done[id];
      if (k === 'sent' || k === 'slain') return;
      if (k === 'postponed' && dueDay && dueDay <= today) return; // stale read just after a reschedule
      var waiting = status === 'WAITING';
      var daysOverdue = dueDay && dueDay < today ? daysBetween(dueDay, today) : 0;
      var m = {
        id: id, subject: str(t.subject) || 'Missive sans objet', body: t.body || null, status: status,
        dueAt: t.dueAt || null, dueDay: dueDay, daysOverdue: daysOverdue, tier: waiting ? 0 : tierFor(daysOverdue),
        type: t.type || null, priority: t.priority || null, url: t.url || null
      };
      if (waiting) lists.waiting.push(m);
      else if (!dueDay) lists.later.push(m);
      else if (dueDay < today) lists.overdue.push(m);
      else if (dueDay === today) lists.today.push(m);
      else if (dueDay <= horizon) lists.upcoming.push(m);
      else lists.later.push(m);
    });
    Object.keys(lists).forEach(function (k) { lists[k].sort(byDueAsc); });
    var byTier = [0, 0, 0];
    lists.overdue.forEach(function (m) { if (m.tier >= 1) byTier[m.tier - 1]++; });

    // --- season & treasure
    var key = today.slice(0, 7);
    var y = +today.slice(0, 4), mo = +today.slice(5, 7), dom = +today.slice(8, 10);
    var dim = daysInMonth(y, mo);
    var seasonWon = wonAll.filter(function (d) { var cd = parisDay(d.closeDate); return cd && cd.slice(0, 7) === key; })
      .sort(function (a, b) { return timeOf(b.closeDate) - timeOf(a.closeDate); });
    var gold = seasonWon.reduce(function (s, d) { return s + (num(d.amount) || 0); }, 0);
    var treasureAllTime = wonAll.reduce(function (s, d) { return s + (num(d.amount) || 0); }, 0);
    var season = {
      key: key, name: SEASONS[mo - 1], monthLabel: MONTHS[mo - 1], year: y, goal: CONFIG.goal, gold: gold,
      pct: gold / CONFIG.goal, daysLeft: dim - dom + 1, dayOfMonth: dom, daysInMonth: dim, won: seasonWon
    };

    // --- chronicle (lost deals) & reconquests
    var lostDays = st.lostDays || {};
    var chronicle = lostAll.map(function (d) {
      var lostDay = d.closeDate ? parisDay(d.closeDate) : (lostDays[String(d.id)] || null);
      var rDay = lostDay ? addDays(lostDay, CONFIG.reconquestDays) : null;
      var rState = st.reconquests[String(d.id)] || null;
      return {
        deal: d, lostDay: lostDay, reason: d.lostReason ? String(d.lostReason) : null, reconquestDay: rDay,
        reconquestDue: !!(rDay && rDay <= today && !rState), reconquestState: rState
      };
    }).sort(function (a, b) { return (b.lostDay || '').localeCompare(a.lostDay || ''); });
    var reconquestsDue = chronicle.filter(function (c) { return c.reconquestDue; })
      .sort(function (a, b) { return a.reconquestDay.localeCompare(b.reconquestDay); });

    // --- siege (effective state, identical to what checkSiege will persist). A placeholder raw
    // (HubSpot unreachable, no data) shows the stored siege as is: its 0 goblins prove nothing.
    var goblins = lists.overdue.length;
    var sg = raw.placeholder ? st.siege : siegeNext(st.siege, goblins, nowIso, lastDoneId(st, today));

    // --- perfect days & streak
    var actionsToday = st.actions[today] || 0;
    var perfectToday = isWeekday(today) && lists.today.length === 0 && actionsToday >= 1;
    var pset = {};
    st.perfectDays.forEach(function (d) { if (d < today && isWeekday(d)) pset[d] = 1; });
    if (perfectToday) pset[today] = 1;
    var perfectDays = Object.keys(pset).sort().slice(-LIMITS.perfectDays);
    var heroStreak = streak(perfectDays, today, perfectToday);

    // --- XP
    var X = CONFIG.xp;
    var abattus = {};
    st.abattus.forEach(function (id) { abattus[id] = 1; });
    var relance = 0, nCompleted = 0, nOnTime = 0, nSlain = 0;
    var completedById = {};
    completed.forEach(function (c) { completedById[String(c.id)] = c; });
    Object.keys(completedById).forEach(function (id) {
      var c = completedById[id];
      if (abattus[id]) { relance += X.slain; nSlain++; return; }
      relance += X.task; nCompleted++;
      var cd = c.completedAt ? parisDay(c.completedAt) : null, dd = c.dueAt ? parisDay(c.dueAt) : null;
      if (cd && dd && cd <= dd) { relance += X.onTime; nOnTime++; }
    });
    // Completed in-game today but not yet visible in HubSpot's search index.
    Object.keys(done).forEach(function (id) {
      var k = done[id];
      if ((k !== 'sent' && k !== 'slain') || completedById[id]) return;
      if (k === 'slain' || abattus[id]) { relance += X.slain; nSlain++; return; }
      relance += X.task; nCompleted++;
      var t = openById[id], dd = t && t.dueAt ? parisDay(t.dueAt) : null;
      if (dd && today <= dd) { relance += X.onTime; nOnTime++; }
    });
    relance += X.perfectDay * perfectDays.length;
    if (sg.bonusAwarded) relance += X.siege;
    var closing = 0, lostWithReason = 0;
    wonAll.forEach(function (d) { closing += X.wonBase + Math.round((num(d.amount) || 0) / X.wonDivisor); });
    lostAll.forEach(function (d) { if (str(d.lostReason).trim()) { closing += X.lostHonesty; lostWithReason++; } });
    var prospection = X.deal * Object.keys(dealSeen).length;
    var skills = { relance: levelFromXp(relance), closing: levelFromXp(closing), prospection: levelFromXp(prospection) };
    var heroLevel = skills.relance.level + skills.closing.level + skills.prospection.level;

    var coldQuests = quests.filter(function (q) { return q.cold; }).length;
    return {
      now: nowIso,
      today: today,
      hour: hour,
      weekday: weekdayOf(today),
      isWeekday: isWeekday(today),
      hero: {
        name: CONFIG.heroName, level: heroLevel, title: heroTitle(heroLevel), skills: skills,
        streak: heroStreak, perfectToday: perfectToday, perfectDays: perfectDays, actionsToday: actionsToday,
        stats: {
          completed: nCompleted, onTime: nOnTime, slain: nSlain, won: wonAll.length, lost: lostAll.length,
          lostWithReason: lostWithReason, dealsCreated: Object.keys(dealSeen).length, perfectDays: perfectDays.length,
          siegeBonus: !!sg.bonusAwarded
        }
      },
      season: season,
      treasureAllTime: treasureAllTime,
      quests: quests,
      missives: lists,
      chronicle: chronicle,
      reconquestsDue: reconquestsDue,
      siege: {
        active: !!sg.startedAt && !sg.completedAt,
        eligible: !sg.completedAt && goblins >= CONFIG.siegeMin,
        total: goblins,
        initialCount: sg.initialCount,
        defeated: Math.max(0, sg.initialCount - goblins),
        startedAt: sg.startedAt,
        completedAt: sg.completedAt,
        won: !!sg.completedAt
      },
      counts: {
        goblins: goblins, goblinsByTier: byTier, missivesToday: lists.today.length, coldQuests: coldQuests,
        openQuests: quests.length, waiting: lists.waiting.length, upcoming: lists.upcoming.length,
        reconquestsDue: reconquestsDue.length
      },
      fetchedAt: raw.fetchedAt || null,
      partial: raw.partial || null,
      placeholder: !!raw.placeholder
    };
  }

  // SceneModel consumed by ART scene.setModel().
  function toSceneModel(model) {
    var m = model || {};
    var quests = (m.quests || []).map(function (q) {
      return { id: q.id, chapter: q.chapter, hearts: q.hearts, cold: q.cold, planned: q.planned, name: q.name, client: q.client };
    });
    var goblins = ((m.missives && m.missives.overdue) || []).map(function (g) {
      return { id: g.id, tier: g.tier, daysOverdue: g.daysOverdue };
    });
    var pct = m.season ? m.season.pct : 0;
    var fill = !(pct > 0) ? 0 : pct >= 1 ? 4 : pct >= 2 / 3 ? 3 : pct >= 1 / 3 ? 2 : 1;
    var c = m.counts || {};
    return {
      hour: m.hour || 0,
      today: m.today || null,
      quests: quests,
      questsExtra: Math.max(0, quests.length - CONFIG.maxTentsDrawn),
      goblins: goblins,
      badges: {
        board: c.missivesToday || 0,
        dovecote: (c.missivesToday || 0) + (c.goblins || 0),
        chronicle: c.reconquestsDue || 0
      },
      treasureFill: fill,
      siegeActive: !!(m.siege && m.siege.active),
      heroLevel: m.hero ? m.hero.level : 3,
      heroTitle: m.hero ? m.hero.title : heroTitle(3)
    };
  }

  // observe(raw, state, now) -> { events, state }. First run: baseline only, no events.
  // Returns the SAME state object when nothing changed.
  function baselineMap(deals) {
    var open = [], closed = [];
    deals.forEach(function (d) {
      if (!d || d.id == null) return;
      (d.stage === 'closedwon' || d.stage === 'closedlost' ? closed : open).push(d);
    });
    closed.sort(function (a, b) { return timeOf(b.closeDate) - timeOf(a.closeDate); });
    var map = {};
    open.concat(closed).slice(0, LIMITS.lastSeen).forEach(function (d) { map[String(d.id)] = d.stage || ''; });
    return map;
  }
  function sameMap(a, b) {
    var ka = Object.keys(a || {}), kb = Object.keys(b || {});
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) if (!hasOwn(b, ka[i]) || a[ka[i]] !== b[ka[i]]) return false;
    return true;
  }
  function observe(raw, state, now) {
    var nowD = toDate(now);
    if (!nowD) throw new TypeError('observe: now invalide');
    var nowIso = nowD.toISOString();
    var st = normalizeState(state);
    var deals = raw && Array.isArray(raw.deals) ? raw.deals.filter(function (d) { return d && d.id != null; }) : [];
    var map = baselineMap(deals);
    if (st.lastSeen == null) {
      st.lastSeen = map;
      st.observedAt = nowIso;
      return { events: [], state: st };
    }
    var prev = st.lastSeen;
    var since = st.observedAt ? toDate(st.observedAt) : null;
    var events = [];
    var lostDaysChanged = false;
    deals.forEach(function (d) {
      var id = String(d.id), stage = d.stage || '';
      if (stage !== 'closedwon' && stage !== 'closedlost') return;
      var isNew;
      if (hasOwn(prev, id)) isNew = prev[id] !== stage;
      else {
        var cd = toDate(d.closeDate), cr = toDate(d.createDate);
        isNew = !!(since && ((cd && cd.getTime() >= since.getTime()) || (cr && cr.getTime() >= since.getTime())));
      }
      if (!isNew) return;
      if (stage === 'closedwon') {
        events.push({ type: 'won', deal: d, amount: num(d.amount) || 0 });
      } else {
        var lostDay = d.closeDate ? parisDay(d.closeDate) : parisDay(nowD);
        if (!d.closeDate) {
          // No closeDate in HubSpot: remember the day we saw the loss so the chronicle schedules the same reconquest.
          var ld = {};
          Object.keys(st.lostDays || {}).forEach(function (k) { if (k !== id) ld[k] = st.lostDays[k]; });
          ld[id] = lostDay;
          var keys = Object.keys(ld);
          st.lostDays = {};
          keys.slice(-LIMITS.lostDays).forEach(function (k) { st.lostDays[k] = ld[k]; });
          lostDaysChanged = true;
        }
        events.push({ type: 'lost', deal: d, lostDay: lostDay, reason: d.lostReason || null, reconquestDay: addDays(lostDay, CONFIG.reconquestDays) });
      }
    });
    events.sort(function (a, b) { return timeOf(a.deal.closeDate) - timeOf(b.deal.closeDate); });
    if (sameMap(prev, map) && !lostDaysChanged) return { events: events, state: isObj(state) ? state : st };
    st.lastSeen = map;
    st.observedAt = nowIso;
    return { events: events, state: st };
  }

  // checkSiege(model, state, now) -> State. Starts the siege (>= siegeMin goblins, never completed before),
  // keeps initialCount >= current goblins, completes it at 0 goblins (bonusAwarded -> +500 Relance XP once).
  // Also persists today's perfect-day status (model.hero.perfectDays) into state.perfectDays.
  // Returns the SAME state object when nothing changed.
  function checkSiege(model, state, now) {
    var nowD = toDate(now) || (model && toDate(model.now));
    if (!nowD) throw new TypeError('checkSiege: now invalide');
    var st = normalizeState(state);
    if (model && model.placeholder) return state; // no HubSpot data: nothing to learn about the siege or the day
    var goblins = model && model.counts ? (num(model.counts.goblins) || 0) : 0;
    var next = siegeNext(st.siege, goblins, nowD.toISOString(), lastDoneId(st, parisDay(nowD)));
    var changed = JSON.stringify(next) !== JSON.stringify(st.siege);
    st.siege = next;
    var pd = model && model.hero && Array.isArray(model.hero.perfectDays) ? model.hero.perfectDays : null;
    if (pd && JSON.stringify(pd) !== JSON.stringify(st.perfectDays)) { st.perfectDays = pd.slice(-LIMITS.perfectDays); changed = true; }
    if (!changed && isObj(state)) {
      // Unchanged only if the input was already normalized-equal.
      if (JSON.stringify(normalizeState(state)) === JSON.stringify(st)) return state;
    }
    return st;
  }

  // ===========================================================================
  // Scribe prompt
  // ===========================================================================
  function stagePlain(stage) { var s = str(stage); return hasOwn(STAGE_PLAIN, s) ? STAGE_PLAIN[s] : s; }
  function buildDraftPrompt(context, intent, now) {
    var c = context || {};
    var nowD = toDate(now);
    var today = nowD ? parisDay(nowD) : null;
    var L = [];
    L.push("Tu rédiges un e-mail pour Julian, fondateur de The French Bot (formations et accompagnement à l'IA pour les TPE et PME françaises, basé à Dijon). C'est un vrai e-mail professionnel, destiné à un vrai client ou prospect.");
    if (today) L.push('Date du jour : ' + longDay(today) + ' (' + today + ').');
    L.push('');
    L.push('RÈGLES (toutes obligatoires)');
    L.push('- Français, vouvoiement du début à la fin.');
    L.push('- Corps de 60 à 120 mots. Phrases courtes.');
    L.push("- Cite un élément concret tiré du contexte : le dernier appel ou échange, la référence du devis, une phrase dite par le client.");
    L.push("- Exactement une prochaine étape, claire. Si un échange est utile, propose un créneau de 30 minutes avec ce lien : " + CALENDLY);
    L.push('- Signe sur deux lignes à la fin : « Julian » puis « The French Bot ».');
    L.push("- Ton direct, chaleureux et sobre. AUCUN ton médiéval ni vocabulaire de jeu (pas de quête, missive, royaume, chevalier, gobelin, messire) : c'est un e-mail réel à un client.");
    L.push("- Formules interdites : « je me permets de revenir vers vous », « n'hésitez pas », « dans l'attente de votre retour ».");
    L.push('- Mots interdits : écosystème, synergies, paradigme, disruptif, innovant.');
    L.push("- Pas d'emoji. Pas de markdown (ni **, ni #, ni liste à puces) : texte brut uniquement.");
    L.push("- Aucun prix, montant, tarif ou nom de pack. Pour parler de l'offre, écris « le devis » et cite sa référence si elle figure dans le contexte.");
    L.push("- N'invente aucun fait : aucune date, aucun chiffre, aucun rendez-vous, aucun propos absent du contexte. Si le contexte est mince, reste court et honnête.");
    L.push('- Objet court (moins de 70 caractères).');
    L.push('');
    L.push('CONTEXTE');
    var t = c.task;
    if (t) {
      L.push('[Relance à écrire (tâche HubSpot)]');
      L.push('- Objet de la tâche : ' + oneLine(t.subject || '(sans objet)'));
      var dueDay = t.dueDay || (t.dueAt ? parisDay(t.dueAt) : null);
      if (dueDay && today) {
        var late = daysBetween(dueDay, today);
        L.push('- Échéance : ' + dueDay + (late > 0 ? ' (' + late + ' jour' + (late > 1 ? 's' : '') + ' de retard)' : late === 0 ? " (aujourd'hui)" : ''));
      }
      if (t.body) L.push('- Notes de la tâche : ' + truncate(oneLine(htmlToText(t.body)), 1500));
    }
    if (c.reconquest) {
      var r = c.reconquest;
      L.push('[Reprise de contact après une affaire perdue]');
      if (r.lostDay) L.push('- Affaire perdue le ' + r.lostDay + '.');
      L.push('- Raison donnée : ' + (r.reason ? oneLine(r.reason) : 'non précisée'));
      L.push("- But : reprendre contact simplement, quelques mois après, sans revenir lourdement sur le refus.");
    }
    if (c.contact) {
      var ct = c.contact;
      L.push('[Contact]');
      L.push('- Nom : ' + (oneLine(ct.name) || '(inconnu)'));
      if (ct.jobtitle) L.push('- Poste : ' + oneLine(ct.jobtitle));
      if (ct.company) L.push('- Entreprise : ' + oneLine(ct.company));
      if (ct.email) L.push('- E-mail : ' + oneLine(ct.email));
    } else {
      L.push('[Contact] inconnu : commence par « Bonjour, ».');
    }
    if (c.deal) {
      L.push('[Affaire]');
      L.push('- Nom : ' + oneLine(c.deal.name));
      L.push('- Étape : ' + stagePlain(c.deal.stage));
    }
    if (c.notes && c.notes.length) {
      L.push('[Notes HubSpot, de la plus récente à la plus ancienne]');
      c.notes.forEach(function (n) { L.push('- ' + (n.day || '?') + ' : ' + truncate(oneLine(n.text), 2500)); });
    }
    if (c.emails && c.emails.length) {
      L.push('[E-mails enregistrés dans HubSpot]');
      c.emails.forEach(function (e) {
        var dir = /INCOMING/i.test(str(e.direction)) ? 'reçu' : e.direction ? 'envoyé' : '';
        L.push('- ' + (e.day || '?') + (dir ? ', ' + dir : '') + (e.subject ? ', objet « ' + oneLine(e.subject) + ' »' : '') + ' : ' + truncate(oneLine(e.text), 1500));
      });
    }
    if (c.gmail && c.gmail.messages && c.gmail.messages.length) {
      L.push('[Dernier fil Gmail avec ce contact' + (c.gmail.subject ? ', objet « ' + oneLine(c.gmail.subject) + ' »' : '') + ']');
      c.gmail.messages.forEach(function (m) { L.push('- ' + (m.day || '?') + ', de ' + (oneLine(m.from) || '?') + ' : ' + truncate(oneLine(m.text), 1500)); });
    }
    var missing = [];
    (c.errors || []).forEach(function (e) { var n = e.section === 'gmail' ? 'Gmail' : 'HubSpot'; if (missing.indexOf(n) < 0) missing.push(n); });
    if (missing.length) L.push('[Sources indisponibles] ' + missing.join(', ') + " : n'en déduis rien.");
    L.push('');
    L.push("[Intention de Julian]");
    var it = oneLine(intent);
    L.push(it ? '« ' + it + ' »' : "Aucune intention précisée : choisis la prochaine étape la plus logique d'après le contexte.");
    L.push('');
    L.push('Réponds uniquement avec un objet JSON {"subject": string, "body": string}, sans texte avant ni après. Dans "body", sépare les lignes avec \\n.');
    return L.join('\n');
  }

  // ===========================================================================
  // Errors
  // ===========================================================================
  var GM_NAME = 'Gmail';
  var SAMPLE_ONLY = ['invalid_json', 'refused', 'empty_completion', 'prompt_too_large', 'session_expired', 'sampling_disabled',
    'images_unavailable', 'tools_unavailable', 'image_rejected', 'not_declared', 'invalid_request', 'queue_overflow'];
  var DB_ONLY = ['invalid_argument', 'resource_exhausted', 'quota_exceeded', 'unavailable', 'revoked'];
  var MCP_ONLY = ['needs_reauth', 'server_not_connected', 'selection_required', 'server_not_found', 'server_unavailable',
    'not_in_manifest', 'blocked_by_policy', 'self_only', 'approval_required', 'tool_error', 'bad_request', 'consent_required', 'user_changed'];
  function errorSource(e) {
    if (e.source) return e.source;
    if (SAMPLE_ONLY.indexOf(e.code) >= 0) return 'sample';
    if (DB_ONLY.indexOf(e.code) >= 0) return 'db';
    if (MCP_ONLY.indexOf(e.code) >= 0 || e.server) return 'mcp';
    return 'sample'; // shared codes (not_granted, rate_limited, upstream_error...) without a server come from the scribe
  }
  function cap1(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  // -> { code, server, message, retryable, retryAfterMs, source }
  function normalizeError(e, server, source) {
    if (e && typeof e === 'object' && typeof e.code === 'string') {
      var out = {
        code: e.code,
        server: e.server || server || null,
        message: typeof e.message === 'string' ? e.message : '',
        retryable: e.retryable === true,
        retryAfterMs: typeof e.retryAfterMs === 'number' && isFinite(e.retryAfterMs) ? e.retryAfterMs : null,
        source: e.source || source || null
      };
      if (typeof e.text === 'string') out.text = e.text;
      if (e.section) out.section = e.section;
      if (e.write === true) out.write = true;
      return out;
    }
    return {
      code: 'unknown', server: server || null, message: e && e.message ? String(e.message) : str(e),
      retryable: false, retryAfterMs: null, source: source || null
    };
  }
  function toolMessage(msg) {
    var m = str(msg).trim();
    if (/^[[{]/.test(m)) {
      try {
        var j = JSON.parse(m);
        var cand = j && (typeof j.message === 'string' ? j.message
          : j.error && typeof j.error === 'object' && typeof j.error.message === 'string' ? j.error.message
          : typeof j.error === 'string' ? j.error : '');
        if (cand && cand.trim()) m = cand.trim();
      } catch (err) { /* keep raw */ }
    }
    return truncate(oneLine(m), 240);
  }
  // errorCopy(err) -> { title, text, action: "permissions"|"retry"|null, silent?, hide? }
  function errorCopy(err) {
    var e = normalizeError(err);
    var code = e.code;
    var src = errorSource(e);
    var S = e.server || 'le connecteur';
    var Sc = cap1(S);
    function c(title, text, action, extra) {
      var o = { title: title, text: text, action: action || null };
      if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      return o;
    }
    if (code === 'cancelled') return c('', '', null, { silent: true });
    if (code === 'no_email') return c('Pas d’adresse', "Ce contact n'a pas d'e-mail dans HubSpot. Copiez la missive et envoyez-la à la main.", null);
    if (code === 'permissions_unavailable') return c('Panneau fermé', "Ouvrez le menu Autorisations de l'artefact dans claude.ai.", null);
    if (src === 'sample') {
      switch (code) {
        case 'not_granted': return c('Scribe congédié', "Le scribe n'a pas la permission d'écrire ici. Autorisez Claude pour cette page.", null, { hide: true });
        case 'sampling_disabled': return c('Scribe absent', "Le scribe n'est pas disponible pour ce compte.", null, { hide: true });
        case 'not_declared': case 'capability_disabled': case 'capability_removed':
          return c('Scribe absent', "Le scribe n'est pas disponible dans cette vue.", null, { hide: true });
        case 'rate_limited': return c('Scribe épuisé', 'Le scribe est épuisé, réessayez dans un moment.', null);
        case 'invalid_json': return c('Plume qui accroche', 'Le scribe a bafouillé. Réessayez.', 'retry');
        case 'refused': return c('Le scribe refuse', 'Le scribe refuse cette missive. Reformulez votre intention.', null);
        case 'empty_completion': return c('Page blanche', "Le scribe n'a rien trouvé à dire. Donnez-lui une intention.", null);
        case 'prompt_too_large': return c('Trop de parchemins', 'Le contexte est trop long pour le scribe. Raccourcissez votre intention.', null);
        case 'session_expired': return c('Session expirée', 'Reconnectez-vous à claude.ai, puis réessayez.', null);
        case 'upstream_error': return c('Plume brisée', 'Le scribe a lâché sa plume en route. Réessayez.', 'retry');
        default: return c('Grain de sable', 'Le scribe a coincé. Réessayez dans un instant.', 'retry');
      }
    }
    if (src === 'db') {
      switch (code) {
        case 'quota_exceeded': return c('Grimoire plein', 'La sauvegarde est pleine. Votre progression reste sur cet appareil.', null);
        case 'resource_exhausted': return c('Trop d’écritures', 'Trop de sauvegardes d’un coup. Patientez un instant.', 'retry');
        case 'unavailable': return c('Grimoire fermé', 'Sauvegarde momentanément impossible. Réessayez.', 'retry');
        case 'revoked': return c('Accès retiré', "L'accès à la sauvegarde a été retiré. Votre progression reste sur cet appareil.", null);
        case 'invalid_argument': return c('Sauvegarde refusée', 'Sauvegarde refusée pour ce compte. Votre progression reste sur cet appareil.', null);
        default: return c('Sauvegarde indisponible', 'Sauvegarde indisponible ici. Votre progression reste sur cet appareil.', null);
      }
    }
    switch (code) {
      case 'needs_reauth': return c('Sceau expiré', 'Reconnectez ' + S + ' dans claude.ai → Réglages → Connecteurs.', null);
      case 'server_not_connected': return c('Messager introuvable', 'Ajoutez le connecteur ' + S + ' dans claude.ai → Réglages → Connecteurs.', null);
      case 'selection_required': return c('Deux messagers', 'Choisissez quel connecteur ' + S + ' utiliser (claude.ai vous le propose).', null);
      case 'server_not_found': return c('Messager disparu', 'Le connecteur ' + S + " n'existe plus. Ajoutez-le à nouveau dans claude.ai → Réglages → Connecteurs.", null);
      case 'not_in_manifest': case 'approval_required':
        return c('Porte close', 'Autorisation ' + S + ' refusée pour cette page.', 'permissions');
      case 'consent_required':
        return c('Porte close', 'Autorisation ' + S + ' refusée pour cette page. Réessayez pour la redemander.', 'retry');
      case 'blocked_by_policy': return c('Interdit', 'Votre organisation bloque cet outil ' + S + '. Voyez avec votre administrateur claude.ai.', null);
      case 'server_unavailable': case 'upstream_error':
        // Ambiguous for a write: the tool may have run. Never invite a blind second click.
        if (e.write) {
          return S === GM_NAME
            ? c('Pigeon sans réponse', 'Gmail n’a pas confirmé : le brouillon existe peut-être. Vérifiez vos brouillons avant de recommencer.', null, { ambiguous: true })
            : c('Pigeon sans réponse', Sc + ' n’a pas confirmé. Le tableau est relu : vérifiez la missive avant de recommencer.', null, { ambiguous: true });
        }
        return c('Pigeon égaré', Sc + ' ne répond plus. Réessayez dans un instant.', 'retry');
      case 'rate_limited': return c('Trop de pigeons', 'Trop de requêtes d’un coup. Patientez un instant, puis réessayez.', 'retry');
      case 'tool_error': {
        var msg = toolMessage(e.message);
        return c('Refus de ' + S, msg ? Sc + ' a refusé : ' + msg : Sc + " a refusé l'opération.", null);
      }
      case 'not_granted': case 'capability_disabled': case 'capability_removed':
        return c('Connecteurs absents', 'Les connecteurs ne sont pas disponibles dans cette vue. Ouvrez la page dans claude.ai.', null);
      case 'user_changed': return c('Compte changé', 'Le compte connecté a changé. Rechargez la page.', null);
      default: return c('Grain de sable', 'Quelque chose a coincé. Réessayez dans un instant.', 'retry');
    }
  }

  // ===========================================================================
  // Demo world (FICTIONAL Burgundy businesses and people; dates relative to now)
  // ===========================================================================
  var DEMO_CONTACTS = [
    ['51001', 'Hélène', 'Marchais', 'Fromagerie Saint-Vorles', 'Gérante', 'helene.marchais@fromagerie-saint-vorles.example'],
    ['51002', 'Bertrand', 'Joly-Vasseur', 'Domaine des Trois Combes', 'Directeur commercial', 'b.jolyvasseur@trois-combes.example'],
    ['51003', 'Claire', 'Duvernois', 'Atelier Moutarde & Cie', 'Responsable marketing', 'claire@atelier-moutarde.example'],
    ['51004', 'Mathieu', 'Perrichon', 'Brasserie de la Combe Noire', 'Cofondateur', 'mathieu@combe-noire.example'],
    ['51005', 'Sophie', 'Lantier', 'Cabinet Ravenel & Associés', 'Associée', 's.lantier@ravenel-associes.example'],
    ['51006', 'Antoine', 'Bréchard', 'Menuiserie Arnoux-Lavalle', 'Gérant', 'antoine.brechard@arnoux-lavalle.example'],
    ['51007', 'Margaux', 'Fenouillet', 'Biscuiterie Lormeau', 'Directrice', 'margaux@biscuiterie-lormeau.example'],
    ['51008', 'Paul-Henri', 'Vauchelle', 'Hôtel des Trois Tilleuls', 'Directeur', 'direction@trois-tilleuls.example'],
    ['51009', 'Inès', 'Caradec', 'Pépinières Vauthrin', 'Responsable commerciale', null],
    ['51010', 'Lucien', 'Garnotte', 'Cave Bressac-Moreau', 'Caviste', 'lucien@bressac-moreau.example'],
    ['51011', 'Odile', 'Maraval', 'Transports Galmiche-Ferrand', 'Responsable RH', 'o.maraval@galmiche-ferrand.example'],
    ['51012', 'Thibault', 'Ranvier', "Librairie La Plume d'Argent", 'Libraire', 'thibault@plume-argent.example'],
    ['51013', 'Anaïs', 'Gourmelon', 'Garage Thévenot-Raillard', 'Assistante de direction', 'a.gourmelon@thevenot-raillard.example'],
    ['51014', 'Rémi', 'Castagnède', 'Chocolaterie Bellenot', 'Fondateur', 'remi@chocolaterie-bellenot.example'],
    ['51015', 'Jeanne', 'Morvillier', 'Domaine Champeaux-Rivière', 'Responsable œnotourisme', 'jeanne@champeaux-riviere.example']
  ];
  // [id, name, stage, amount, createOff, lastContactOff, nextOff, contactId, close ('m-N' = this month, N days back, clamped;
  //  'prev' = previous month; number = day offset), lostReason]
  var DEMO_DEALS = [
    ['41001', 'Fromagerie Saint-Vorles - Formation IA équipe de vente', 'contractsent', 4200, -62, -9, null, '51001'],
    ['41002', 'Domaine des Trois Combes - Atelier IA boutique et export', 'contractsent', 6800, -40, -2, 3, '51002'],
    ['41003', 'Atelier Moutarde & Cie - Accompagnement IA marketing', 'presentationscheduled', 3500, -35, -5, null, '51003'],
    ['41004', 'Brasserie de la Combe Noire - Audit flash IA', 'presentationscheduled', 1900, -80, -12, null, '51004'],
    ['41005', 'Cabinet Ravenel & Associés - Formation Claude pour les collaborateurs', 'qualifiedtobuy', 5400, -21, -6, 8, '51005'],
    ['41006', "Menuiserie Arnoux-Lavalle - IA pour les devis et l'administratif", 'qualifiedtobuy', 2800, -50, -19, null, '51006'],
    ['41007', 'Biscuiterie Lormeau - Session découverte IA', 'appointmentscheduled', 1200, -26, -3, 1, '51007'],
    ['41008', 'Hôtel des Trois Tilleuls - Formation IA accueil et réservations', '', null, -4, null, null, '51008'],
    ['41009', 'Pépinières Vauthrin - Atelier IA catalogue en ligne', 'appointmentscheduled', 2200, -70, -30, null, '51009'],
    ['41010', 'Cave Bressac-Moreau - Atelier IA fiches produits', 'closedwon', 3200, -55, -1, null, '51010', 'm-1'],
    ['41011', 'Transports Galmiche-Ferrand - Formation IA RH', 'closedwon', 4800, -90, -4, null, '51011', 'm-4'],
    ['41012', "Librairie La Plume d'Argent - Accompagnement IA newsletter", 'closedwon', 2400, -48, -9, null, '51012', 'm-9'],
    ['41013', 'Domaine Champeaux-Rivière - Formation IA œnotourisme', 'closedwon', 6500, -100, -40, null, '51015', 'prev'],
    ['41014', 'Garage Thévenot-Raillard - Formation IA atelier', 'closedlost', 3000, -170, -125, null, '51013', -125, "Budget gelé jusqu'au printemps"],
    ['41015', 'Chocolaterie Bellenot - Atelier IA réseaux sociaux', 'closedlost', 1600, -75, -20, null, '51014', -20, 'A préféré former son équipe en interne']
  ];
  // [id, subject, body, status, dueOff, hour, type, priority, contactId, dealId]
  var DEMO_TASKS = [
    ['61001', 'Relancer la Brasserie de la Combe Noire : audit flash jamais planifié', "<p>Mathieu voulait d'abord finir la saison des bières de Noël. Proposer deux dates en janvier.</p>", 'NOT_STARTED', -64, 9, 'EMAIL', 'HIGH', '51004', '41004'],
    ['61002', 'Envoyer le récapitulatif de la démo aux Pépinières Vauthrin', '<p>Démo du catalogue faite en visio. Inès attend le récap écrit pour sa direction.</p>', 'NOT_STARTED', -45, 10, 'EMAIL', 'MEDIUM', '51009', '41009'],
    ['61003', 'Relance devis D-2026-031 : Menuiserie Arnoux-Lavalle', '<p>Devis envoyé, pas de retour. Antoine hésitait entre l&#39;atelier collectif et le coaching.</p>', 'IN_PROGRESS', -31, 9, 'EMAIL', 'HIGH', '51006', '41006'],
    ['61004', "Proposer une date d'atelier à la Biscuiterie Lormeau", '<p>Margaux préfère les lundis matin, hors période de fêtes.</p>', 'NOT_STARTED', -25, 14, 'EMAIL', 'MEDIUM', '51007', '41007'],
    ['61005', 'Rappeler le Cabinet Ravenel : nombre de collaborateurs à former', "<p>Sophie doit confirmer l'effectif : 8 ou 12 personnes.</p>", 'NOT_STARTED', -17, 11, 'CALL', 'MEDIUM', '51005', '41005'],
    ['61006', 'Relancer la Fromagerie Saint-Vorles : signature de la convention', '<p>Convention de formation envoyée, signature en attente.</p>', 'NOT_STARTED', -12, 9, 'EMAIL', 'HIGH', '51001', '41001'],
    ['61007', 'LinkedIn : remercier Anaïs Gourmelon pour la recommandation', '', 'NOT_STARTED', -8, 17, 'LINKED_IN', 'LOW', '51013', null],
    ['61008', "Envoyer le programme détaillé à l'Atelier Moutarde & Cie", '<p>Claire veut le déroulé heure par heure pour le présenter à son associé.</p>', 'NOT_STARTED', -6, 10, 'EMAIL', 'MEDIUM', '51003', '41003'],
    ['61009', 'Relance devis D-2026-044 : Fromagerie Saint-Vorles', '<p>Hélène a demandé une version en deux sessions au lieu de trois.</p>', 'NOT_STARTED', -5, 9, 'EMAIL', 'HIGH', '51001', '41001'],
    ['61010', "Appeler l'Hôtel des Trois Tilleuls pour qualifier le besoin", "<p>Demande entrante via le site : former l'équipe d'accueil.</p>", 'NOT_STARTED', -3, 15, 'CALL', 'MEDIUM', '51008', '41008'],
    ['61011', 'Confirmer la session découverte avec la Biscuiterie Lormeau', '', 'NOT_STARTED', -2, 9, 'EMAIL', 'LOW', '51007', '41007'],
    ['61012', "Envoyer les supports de l'atelier à la Cave Bressac-Moreau", "<p>Atelier fait la semaine dernière. Joindre les modèles de fiches produits.</p>", 'NOT_STARTED', -1, 18, 'EMAIL', 'MEDIUM', '51010', '41010'],
    ['61013', 'Relancer le Domaine des Trois Combes : retour sur la proposition', '<p>Bertrand devait en parler à sa sœur, cogérante du domaine.</p>', 'NOT_STARTED', 0, 10, 'EMAIL', 'HIGH', '51002', '41002'],
    ['61014', 'Appeler Claire Duvernois pour préparer la présentation', '', 'NOT_STARTED', 0, 15, 'CALL', 'MEDIUM', '51003', '41003'],
    ['61015', 'En attente du bon de commande : Cabinet Ravenel', '<p>Bon de commande promis par leur comptable.</p>', 'WAITING', -4, 9, 'TODO', 'LOW', '51005', '41005'],
    ['61016', "Préparer l'atelier du Domaine Champeaux-Rivière", "<p>Lister les cas d'usage œnotourisme évoqués au dernier appel.</p>", 'NOT_STARTED', 3, 9, 'TODO', 'MEDIUM', '51015', '41013'],
    ['61017', "Point à 30 jours avec la Librairie La Plume d'Argent", '', 'NOT_STARTED', 9, 11, 'CALL', 'LOW', '51012', '41012']
  ];
  var DEMO_NOTES = {
    '51001': [[-9, '<p>Appel avec H&eacute;l&egrave;ne : elle veut former les 6 vendeuses avant les f&ecirc;tes.</p><p>Point de blocage : le planning du samedi. R&eacute;f&eacute;rence devis D-2026-044.</p>'],
      [-30, '<p>Premier rendez-vous &agrave; la fromagerie. Int&eacute;r&ecirc;t fort pour les fiches produits et les r&eacute;ponses aux avis clients.</p>']],
    '51002': [[-2, '<p>Bertrand a aim&eacute; la proposition. Il doit en parler &agrave; sa s&oelig;ur, cog&eacute;rante, avant de valider.</p>']],
    '51003': [[-5, '<div>Claire : &laquo;&nbsp;on veut gagner du temps sur les posts et la newsletter&nbsp;&raquo;. Pr&eacute;sentation &agrave; caler avec son associ&eacute;.</div>']],
    '51004': [[-70, '<p>Mathieu int&eacute;ress&eacute; par un audit flash, mais pas avant la fin de la saison de No&euml;l.</p>']],
    '51006': [[-33, '<p>Antoine perd ses soir&eacute;es sur les devis.<br>H&eacute;site entre l&#39;atelier collectif et le coaching individuel.</p>']],
    '51013': [[-125, '<p>Refus : budget gel&eacute; jusqu&#39;au printemps. Garder le contact.</p>']]
  };
  // [contactId, subject, messages: [offDays, hour, fromMe, text]]
  var DEMO_THREADS = [
    ['51001', 'Devis D-2026-044 : formation IA équipe de vente', [
      [-20, 10, true, 'Bonjour Hélène, voici le devis D-2026-044 pour la formation de votre équipe de vente. Julian'],
      [-15, 18, false, "Bonjour Julian, merci. Pourrait-on prévoir deux sessions au lieu de trois ? Le samedi est compliqué pour nous. Hélène"],
      [-14, 9, true, "Bonjour Hélène, c'est possible. Je vous renvoie une version ajustée cette semaine. Julian"]]],
    ['51002', 'Proposition atelier IA boutique et export', [
      [-6, 11, true, 'Bonjour Bertrand, comme convenu, voici la proposition pour l’atelier boutique et export. Julian'],
      [-2, 17, false, "Bonjour Julian, la proposition me plaît. J'en parle à ma sœur et je reviens vers vous. Bertrand"]]],
    ['51013', 'Formation IA atelier', [
      [-130, 9, true, 'Bonjour Anaïs, avez-vous pu présenter le programme à la direction ? Julian'],
      [-125, 16, false, 'Bonjour Julian, le budget formation est gelé jusqu’au printemps. Nous reprendrons contact. Anaïs']]]
  ];

  function demoWorld(now) {
    var nowD = toDate(now);
    if (!nowD) throw new TypeError('demoRaw: now invalide');
    var today = parisDay(nowD);
    var monthStart = today.slice(0, 8) + '01';
    function at(off, hh, mm) { return parisDateAt(addDays(today, off), hh, mm || 0).toISOString(); }
    function clampNow(iso) { return toDate(iso).getTime() > nowD.getTime() ? nowD.toISOString() : iso; }
    var contacts = {};
    DEMO_CONTACTS.forEach(function (c) {
      contacts[c[0]] = { id: c[0], firstname: c[1], lastname: c[2], name: c[1] + ' ' + c[2], company: c[3], jobtitle: c[4], email: c[5] };
    });
    var dealContact = {};
    var deals = DEMO_DEALS.map(function (d) {
      var close = null;
      if (d[8] != null) {
        if (typeof d[8] === 'number') close = at(d[8], 11);
        else if (d[8] === 'prev') close = parisDateAt(addDays(monthStart, -12), 11, 0).toISOString();
        else {
          var back = parseInt(d[8].slice(2), 10), cd = addDays(today, -back);
          if (cd < monthStart) cd = monthStart;
          close = clampNow(parisDateAt(cd, 11, 0).toISOString());
        }
      }
      dealContact[d[0]] = d[7];
      return {
        id: d[0], name: d[1], stage: d[2] || null, amount: d[3], closeDate: close, createDate: at(d[4], 9, 30),
        lastContact: d[5] == null ? null : clampNow(at(d[5], 16)), nextActivity: d[6] == null ? null : at(d[6], 10),
        lostReason: d[9] || null, url: null
      };
    });
    var links = {};
    var openTasks = DEMO_TASKS.map(function (t) {
      links[t[0]] = { contactId: t[8], dealId: t[9] };
      return {
        id: t[0], subject: t[1], body: htmlToText(t[2]) || null, status: t[3], dueAt: at(t[4], t[5]),
        type: t[6], priority: t[7], url: null
      };
    });
    var completedTasks = [];
    var seed = 20261;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 60; i++) {
      var dueOff = -(2 + Math.floor(i * 148 / 60));
      var r1 = rnd(), r2 = rnd(), r3 = rnd();
      var compOff = r1 < 0.28 ? dueOff + 1 + Math.floor(r2 * 5) : dueOff - (r2 < 0.25 ? 1 : 0);
      if (compOff > -1) compOff = -1;
      completedTasks.push({ id: String(70001 + i), dueAt: at(dueOff, 9), completedAt: at(compOff, 8 + Math.floor(r3 * 10), 15) });
    }
    var notes = {};
    Object.keys(DEMO_NOTES).forEach(function (cid) {
      notes[cid] = DEMO_NOTES[cid].map(function (n) { return { hs_note_body: n[1], hs_timestamp: at(n[0], 17) }; });
    });
    var threads = {};
    DEMO_THREADS.forEach(function (th, ti) {
      var c = contacts[th[0]];
      threads[th[0]] = {
        id: 'demo-thread-' + (ti + 1), subject: th[1],
        messages: th[2].map(function (m, mi) {
          return {
            id: 'demo-msg-' + (ti + 1) + '-' + (mi + 1), date: at(m[0], m[1]),
            sender: m[2] ? 'Julian <julian@thefrenchbot.example>' : c.name + ' <' + c.email + '>',
            subject: (mi ? 'Re: ' : '') + th[1], plaintextBody: m[3]
          };
        })
      };
    });
    return {
      raw: { deals: deals, openTasks: openTasks, completedTasks: completedTasks, fetchedAt: nowD.toISOString() },
      contacts: contacts, links: links, dealContact: dealContact, notes: notes, threads: threads
    };
  }
  function demoRaw(now) { return clone(demoWorld(now).raw); }

  // One concrete element per fictional contact, written to the client (vous).
  var DEMO_HOOKS = {
    '51001': 'Vous souhaitiez former vos six vendeuses avant les fêtes, avec une version du devis D-2026-044 en deux sessions.',
    '51002': 'Vous deviez présenter la proposition à votre sœur, cogérante du domaine.',
    '51003': 'Vous vouliez gagner du temps sur les posts et la newsletter.',
    '51004': "Vous préfériez attendre la fin de la saison de Noël pour lancer l'audit flash.",
    '51006': "Vous hésitiez entre l'atelier collectif et le coaching individuel.",
    '51013': "Le budget formation était gelé jusqu'au printemps."
  };
  // Canned demo draft (fictional; obeys the email voice rules).
  function demoDraft(context, intent) {
    var c = context || {};
    var first = c.contact && c.contact.firstname;
    var hook = c.contact && DEMO_HOOKS[c.contact.id];
    var about = c.task ? c.task.subject : c.deal ? c.deal.name : '';
    var opener = hook || (about ? 'Je reprends le fil au sujet de « ' + truncate(about, 80) + ' ».' : 'Je reprends le fil de notre dernier échange.');
    var middle = c.reconquest
      ? "Quelques mois ont passé : où en est votre réflexion sur l'IA dans votre équipe ?"
      : 'Le plus simple : un échange de 30 minutes pour caler ensemble la suite et repartir avec un plan clair pour votre équipe.';
    var body = [
      first ? 'Bonjour ' + first + ',' : 'Bonjour,',
      '',
      opener,
      '',
      middle + ' Choisissez le créneau qui vous arrange ici : ' + CALENDLY,
      '',
      'Bonne journée,',
      '',
      'Julian',
      'The French Bot'
    ].join('\n');
    var client = c.contact && c.contact.company ? c.contact.company : clientOf(about) || 'votre projet';
    var subj = c.reconquest ? 'Des nouvelles de votre projet IA' : 'Suite à notre échange : ' + truncate(client, 40);
    return { subject: subj, body: body };
  }

  // ===========================================================================
  // LOGIC namespace
  // ===========================================================================
  var LOGIC = {
    CONFIG: CONFIG,
    parisDay: parisDay,
    parisHour: parisHour,
    parisDateAt: parisDateAt,
    daysBetween: daysBetween,
    addDays: addDays,
    isWeekday: isWeekday,
    weekdayOf: weekdayOf,
    toDate: toDate,
    toIso: toIso,
    levelFromXp: levelFromXp,
    heroTitle: heroTitle,
    chapterOf: chapterOf,
    thresholdOf: thresholdOf,
    hearts: hearts,
    tierFor: tierFor,
    clientOf: clientOf,
    streak: streak,
    emptyState: emptyState,
    normalizeState: normalizeState,
    compactState: compactState,
    buildModel: buildModel,
    toSceneModel: toSceneModel,
    recordAction: recordAction,
    observe: observe,
    checkSiege: checkSiege,
    buildDraftPrompt: buildDraftPrompt,
    errorCopy: errorCopy,
    normalizeError: normalizeError,
    demoRaw: demoRaw,
    htmlToText: htmlToText,
    cleanDraft: cleanDraft,
    replySubject: replySubject,
    gmailDraftInput: gmailDraftInput,
    fmt: { euros: euros, longDay: longDay, shortDay: shortDay, dateBox: dateBox, clock: clock, relDay: relDay },
    _demoWorld: demoWorld,
    _demoDraft: demoDraft
  };

  // ===========================================================================
  // DATA: runtime data layer
  // ===========================================================================
  var HS = 'HubSpot', GM = 'Gmail';
  var CHAT_INSIGHTS = { userIntent: 'Jeu de suivi commercial : lecture des deals et des tâches', satisfaction: 'NEUTRAL' };
  var DEAL_PROPS = ['dealname', 'dealstage', 'amount', 'closedate', 'createdate', 'notes_last_contacted', 'notes_next_activity_date', 'closed_lost_reason'];
  var OPEN_TASK_PROPS = ['hs_task_subject', 'hs_task_body', 'hs_task_status', 'hs_timestamp', 'hs_task_type', 'hs_task_priority'];
  var DONE_TASK_PROPS = ['hs_timestamp', 'hs_task_completion_date'];
  var CONTACT_PROPS = ['firstname', 'lastname', 'email', 'company', 'jobtitle'];
  var CTX_DEAL_PROPS = ['dealname', 'dealstage', 'amount', 'closedate'];
  var NOTE_PROPS = ['hs_note_body', 'hs_timestamp'];
  var EMAIL_PROPS = ['hs_email_subject', 'hs_email_text', 'hs_email_direction', 'hs_timestamp'];
  var MAX_PAGES = 6;
  var TERMINAL_DB = ['not_granted', 'capability_disabled', 'capability_removed', 'revoked', 'invalid_argument', 'transform_error'];

  function makeData() {
    var env = {
      sleep: function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); },
      random: function () { return Math.random(); },
      now: function () { return new Date(); },
      storage: function () { try { return root.localStorage || null; } catch (e) { return null; } }
    };
    var S;
    function reset() {
      S = {
        initP: null, mode: null, reason: null, mcp: null, sample: null, db: null, user: null, uid: null,
        can: { hubspot: false, gmail: false, scribe: false, db: false }, store: 'memory',
        world: null, stash: {}, memState: null, draftN: 0,
        saving: null, pending: null, waiters: [], lastSavedJson: null, lastSaveError: null
      };
    }
    reset();

    // ---------- capability access ----------
    async function useCap(name) {
      try {
        var c = root.claude;
        if (!c || typeof c.use !== 'function') return null;
        var v = await c.use(name);
        return v || null;
      } catch (e) { return null; }
    }
    function localOk() {
      try {
        var ls = env.storage();
        if (!ls) return false;
        ls.getItem(CONFIG.storageKey);
        return true;
      } catch (e) { return false; }
    }
    function readLocal() {
      try {
        var ls = env.storage();
        var v = ls && ls.getItem(CONFIG.storageKey);
        return v ? JSON.parse(v) : null;
      } catch (e) { return null; }
    }
    function writeLocal(json) {
      try {
        var ls = env.storage();
        if (!ls) return false;
        ls.setItem(CONFIG.storageKey, json);
        return true;
      } catch (e) { return false; }
    }

    function init() {
      if (S.initP) return S.initP;
      S.initP = (async function () {
        var hasClaude = false;
        try { hasClaude = !!(root.claude && typeof root.claude.use === 'function'); } catch (e) { hasClaude = false; }
        if (hasClaude) {
          var caps = await Promise.all([useCap('mcp'), useCap('sample'), useCap('db'), useCap('user')]);
          S.mcp = caps[0]; S.sample = caps[1]; S.db = caps[2]; S.user = caps[3];
          if (S.user && typeof S.user.id === 'function') {
            try { S.uid = await S.user.id(); } catch (e) { S.uid = null; }
          }
        }
        if (!S.mcp) {
          S.mode = 'demo';
          S.reason = hasClaude ? 'no_mcp' : 'no_claude';
          S.world = demoWorld(env.now());
          S.store = 'memory';
          S.can = { hubspot: true, gmail: true, scribe: true, db: false };
        } else {
          S.mode = 'live';
          var hub = true, gm = true;
          try {
            var lt = await S.mcp.listTools();
            if (lt && Array.isArray(lt.servers)) {
              var names = lt.servers.map(function (s) { return s && s.server; });
              hub = names.indexOf(HS) >= 0;
              gm = names.indexOf(GM) >= 0;
            }
          } catch (e) { /* unknown: let the calls decide */ }
          S.store = S.db && typeof S.db.doc === 'function' && S.uid ? 'db' : localOk() ? 'local' : 'memory';
          S.can = {
            hubspot: hub, gmail: gm,
            scribe: !!(S.sample && typeof S.sample.json === 'function'),
            db: S.store === 'db'
          };
        }
        var out = { mode: S.mode, can: { hubspot: S.can.hubspot, gmail: S.can.gmail, scribe: S.can.scribe, db: S.can.db }, storage: S.store };
        if (S.reason) out.reason = S.reason;
        return out;
      })();
      return S.initP;
    }

    // ---------- MCP plumbing ----------
    function payloadOf(result, server) {
      var p = result ? result.payload : undefined;
      if (p == null && result && Array.isArray(result.content)) {
        var tb = result.content.filter(function (b) { return b && b.type === 'text'; })[0];
        if (tb) { try { p = JSON.parse(tb.text); } catch (e) { p = null; } }
      }
      if (p == null || typeof p !== 'object') {
        throw { code: 'upstream_error', server: server, message: 'Réponse inattendue de ' + server, retryable: false, retryAfterMs: null, source: 'mcp' };
      }
      return p;
    }
    async function readTool(server, tool, input) {
      try {
        return payloadOf(await S.mcp.callTool(server, tool, input, { cache: false }), server);
      } catch (e) {
        var n = normalizeError(e, server, 'mcp');
        if (n.code === 'cancelled' || !(n.code === 'server_unavailable' || n.retryable)) throw n;
        // retryAfterMs is the earliest sensible retry: honour it in full. Beyond the page's budget,
        // no automatic retry: the section error offers « Réessayer » (e.g. a consent prompt still open).
        if (n.retryAfterMs && n.retryAfterMs > RETRY_BUDGET_MS) throw n;
        var delay = 1000 + Math.floor(env.random() * 2000);
        if (n.retryAfterMs) delay = Math.max(delay, n.retryAfterMs);
        await env.sleep(delay);
        try {
          return payloadOf(await S.mcp.callTool(server, tool, input, { cache: false }), server);
        } catch (e2) { throw normalizeError(e2, server, 'mcp'); }
      }
    }
    async function writeTool(server, tool, input) {
      try {
        var r = await S.mcp.callTool(server, tool, input, { cache: false });
        return r && r.payload !== undefined ? r.payload : null;
      } catch (e) {
        var n = normalizeError(e, server, 'mcp');
        n.write = true;
        throw n;
      }
    }
    function propsOf(r) { return r && isObj(r.properties) ? r.properties : {}; }
    function sval(p, k) { var v = p[k]; if (v == null) return null; var s = String(v).trim(); return s === '' ? null : s; }
    function dval(p, k) { var v = sval(p, k); if (!v) return null; if (/^\d{11,}$/.test(v)) return new Date(Number(v)).toISOString(); return v; }
    function urlOf(template, id) { return template && typeof template === 'string' ? template.split('{id}').join(String(id)) : null; }

    async function searchAll(objectType, properties, filterGroups, sorts) {
      var items = [], total = null, offset = null, pages = 0, capped = false, lastOffset = null;
      for (;;) {
        var input = { objectType: objectType, properties: properties.slice(), limit: 200 };
        if (filterGroups) input.filterGroups = clone(filterGroups);
        if (sorts) input.sorts = clone(sorts);
        if (offset != null) input.offset = offset;
        input.chatInsights = clone(CHAT_INSIGHTS);
        var p = await readTool(HS, 'search_crm_objects', input);
        pages++;
        var res = Array.isArray(p.results) ? p.results : [];
        res.forEach(function (r) { items.push({ r: r, tpl: p.urlTemplate || null }); });
        var t = num(p.total);
        total = t == null ? items.length : t;
        if (items.length >= total || res.length === 0) break;
        if (pages >= MAX_PAGES) { capped = true; break; }
        var nextOffset = p.offset != null ? p.offset : items.length;
        if (lastOffset != null && nextOffset === lastOffset) { capped = true; break; }
        lastOffset = offset = nextOffset;
      }
      return { items: items, total: total, capped: capped };
    }
    function normDeal(it) {
      var r = it.r, p = propsOf(r);
      return {
        id: String(r.id), name: sval(p, 'dealname') || (r.displayName ? String(r.displayName) : 'Quête sans nom'),
        stage: sval(p, 'dealstage'), amount: num(sval(p, 'amount')), closeDate: dval(p, 'closedate'),
        createDate: dval(p, 'createdate'), lastContact: dval(p, 'notes_last_contacted'),
        nextActivity: dval(p, 'notes_next_activity_date'), lostReason: sval(p, 'closed_lost_reason'), url: urlOf(it.tpl, r.id)
      };
    }
    function normOpenTask(it) {
      var r = it.r, p = propsOf(r);
      var body = sval(p, 'hs_task_body');
      return {
        id: String(r.id), subject: sval(p, 'hs_task_subject') || (r.displayName ? String(r.displayName) : null),
        body: body ? (htmlToText(body) || null) : null, status: sval(p, 'hs_task_status') || 'NOT_STARTED',
        dueAt: dval(p, 'hs_timestamp'), type: sval(p, 'hs_task_type'), priority: sval(p, 'hs_task_priority'), url: urlOf(it.tpl, r.id)
      };
    }
    function normDoneTask(it) {
      var r = it.r, p = propsOf(r);
      return { id: String(r.id), dueAt: dval(p, 'hs_timestamp'), completedAt: dval(p, 'hs_task_completion_date') };
    }

    async function loadAll() {
      await init();
      if (S.mode === 'demo') {
        await env.sleep(300);
        var raw = clone(S.world.raw);
        raw.fetchedAt = env.now().toISOString();
        return raw;
      }
      var res = await Promise.all([
        searchAll('DEAL', DEAL_PROPS, null, null),
        searchAll('TASK', OPEN_TASK_PROPS,
          [{ filters: [{ propertyName: 'hs_task_status', operator: 'NEQ', value: 'COMPLETED' }] }],
          [{ propertyName: 'hs_timestamp', direction: 'ASCENDING' }]),
        searchAll('TASK', DONE_TASK_PROPS,
          [{ filters: [{ propertyName: 'hs_task_status', operator: 'EQ', value: 'COMPLETED' }] }],
          [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }]).catch(function (e) { return { error: normalizeError(e, HS, 'mcp') }; })
      ]);
      var out = {
        deals: res[0].items.map(normDeal),
        openTasks: res[1].items.map(normOpenTask).filter(function (t) { return t.status !== 'COMPLETED'; }),
        completedTasks: res[2].error ? [] : res[2].items.map(normDoneTask),
        fetchedAt: env.now().toISOString()
      };
      var partial = {};
      if (res[2].error || res[2].capped) partial.completedTasks = true;
      if (res[0].capped) partial.deals = true;
      if (res[1].capped) partial.openTasks = true;
      if (res[2].error) partial.completedTasksError = res[2].error;
      if (Object.keys(partial).length) out.partial = partial;
      return out;
    }

    // ---------- writes (never auto-retried) ----------
    function taskIdOf(t) { return t != null && typeof t === 'object' ? String(t.id) : String(t); }
    async function demoTaskWrite(id, props) {
      await env.sleep(250);
      var raw = S.world.raw;
      var idx = -1;
      raw.openTasks.forEach(function (t, i) { if (t.id === id) idx = i; });
      if (props.hs_task_status === 'COMPLETED') {
        if (idx < 0) throw { code: 'tool_error', server: HS, message: 'Tâche introuvable (démo).', retryable: false, retryAfterMs: null, source: 'mcp' };
        var t = raw.openTasks.splice(idx, 1)[0];
        S.stash[id] = t;
        raw.completedTasks = raw.completedTasks.filter(function (c) { return c.id !== id; });
        raw.completedTasks.unshift({ id: id, dueAt: t.dueAt, completedAt: env.now().toISOString() });
      } else if (props.hs_task_status) {
        if (idx >= 0) raw.openTasks[idx].status = props.hs_task_status;
        else if (S.stash[id]) {
          var back = S.stash[id];
          delete S.stash[id];
          back.status = props.hs_task_status;
          raw.openTasks.push(back);
          raw.completedTasks = raw.completedTasks.filter(function (c) { return c.id !== id; });
        } else throw { code: 'tool_error', server: HS, message: 'Tâche introuvable (démo).', retryable: false, retryAfterMs: null, source: 'mcp' };
      }
      if (props.hs_timestamp) {
        if (idx < 0) throw { code: 'tool_error', server: HS, message: 'Tâche introuvable (démo).', retryable: false, retryAfterMs: null, source: 'mcp' };
        raw.openTasks[idx].dueAt = props.hs_timestamp;
      }
      return { ok: true, demo: true };
    }
    async function updateTask(t, props) {
      await init();
      var id = taskIdOf(t);
      if (S.mode === 'demo') return demoTaskWrite(id, props);
      var oid = Number(id);
      if (!isFinite(oid)) throw { code: 'bad_request', server: HS, message: 'Identifiant de tâche invalide', retryable: false, retryAfterMs: null, source: 'mcp' };
      var input = {
        confirmationStatus: 'CONFIRMED',
        updateRequest: { objects: [{ objectType: 'tasks', objectId: oid, properties: props }] }
      };
      var payload = await writeTool(HS, 'manage_crm_objects', input);
      return { ok: true, payload: payload };
    }
    function completeTask(t) { return updateTask(t, { hs_task_status: 'COMPLETED' }); }
    function reopenTask(t) { return updateTask(t, { hs_task_status: 'NOT_STARTED' }); }
    async function rescheduleTask(t, day) {
      var d = parisDateAt(day, 8, 0);
      if (!d) throw { code: 'bad_request', server: HS, message: 'Date de report invalide', retryable: false, retryAfterMs: null, source: 'mcp' };
      var iso = d.toISOString();
      var r = await updateTask(t, { hs_timestamp: iso });
      r.dueAt = iso;
      return r;
    }

    // ---------- scribe context ----------
    function assocInput(objectType, props, assocType, id, limit, sorts) {
      var input = {
        objectType: objectType, properties: props.slice(), limit: limit || 10,
        filterGroups: [{ associatedWith: [{ objectType: assocType, operator: 'EQUAL', objectIdValues: [Number(id)] }] }]
      };
      if (sorts) input.sorts = sorts;
      input.chatInsights = clone(CHAT_INSIGHTS);
      return input;
    }
    function contactFrom(r) {
      if (!r) return null;
      var p = propsOf(r);
      var first = sval(p, 'firstname'), last = sval(p, 'lastname'), email = sval(p, 'email');
      var name = [first, last].filter(Boolean).join(' ') || (r.displayName ? String(r.displayName) : '') || email || '';
      return { id: String(r.id), name: name, firstname: first, email: email, company: sval(p, 'company'), jobtitle: sval(p, 'jobtitle') };
    }
    function dealFrom(r) {
      var p = propsOf(r);
      return { id: String(r.id), name: sval(p, 'dealname') || (r.displayName ? String(r.displayName) : ''), stage: sval(p, 'dealstage'), amount: num(sval(p, 'amount')) };
    }
    function pickDeal(results) {
      var ds = (results || []).map(dealFrom);
      var open = ds.filter(function (d) { return d.stage !== 'closedwon' && d.stage !== 'closedlost'; });
      return open[0] || ds[0] || null;
    }
    function notesFrom(results) {
      return (results || []).map(function (r) {
        var p = propsOf(r);
        return { ts: dval(p, 'hs_timestamp'), text: truncate(htmlToText(sval(p, 'hs_note_body') || ''), 2500) };
      }).filter(function (n) { return n.text; })
        .sort(function (a, b) { return timeOf(b.ts) - timeOf(a.ts); }).slice(0, 3)
        .map(function (n) { return { day: n.ts ? parisDay(n.ts) : null, text: n.text }; });
    }
    function emailsFrom(results) {
      return (results || []).map(function (r) {
        var p = propsOf(r);
        return { ts: dval(p, 'hs_timestamp'), direction: sval(p, 'hs_email_direction'), subject: sval(p, 'hs_email_subject'), text: truncate(mailText(htmlToText(sval(p, 'hs_email_text') || '')), 1500) };
      }).sort(function (a, b) { return timeOf(b.ts) - timeOf(a.ts); }).slice(0, 3)
        .map(function (e) { return { day: e.ts ? parisDay(e.ts) : null, direction: e.direction, subject: e.subject, text: e.text }; });
    }
    function msgBody(m) {
      var cands = [m.plaintextBody, m.plaintext_body, m.snippet];
      for (var i = 0; i < cands.length; i++) if (typeof cands[i] === 'string' && cands[i].trim()) return cands[i];
      return '';
    }
    function senderOf(s) {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object') return s.name && s.email ? s.name + ' <' + s.email + '>' : str(s.name || s.email);
      return '';
    }
    function gmailFrom(th, msgs) {
      var list = (msgs || []).filter(Boolean).map(function (m, i) { var d = toDate(m.date); return { m: m, i: i, t: d ? d.getTime() : null }; });
      if (!list.length) return null;
      list.sort(function (a, b) {
        if (a.t != null && b.t != null && a.t !== b.t) return a.t - b.t;
        return a.i - b.i;
      });
      var latest = list[list.length - 1].m;
      return {
        threadId: th && th.id != null ? String(th.id) : null,
        subject: latest.subject || list[0].m.subject || (th && th.subject) || null,
        lastMessageId: latest.id != null ? String(latest.id) : null,
        messages: list.slice(-3).map(function (x) {
          return { day: x.t != null ? parisDay(new Date(x.t)) : null, from: senderOf(x.m.sender), text: truncate(mailText(msgBody(x.m)), 1500) };
        }),
        viewUrl: th && th.viewUrl || null
      };
    }
    async function gmailFetch(email, onErr) {
      var p = await readTool(GM, 'search_threads', { query: 'from:' + email + ' OR to:' + email, pageSize: 3, view: 'THREAD_VIEW_MINIMAL' });
      var threads = Array.isArray(p.threads) ? p.threads : [];
      if (!threads.length) return null;
      var th = threads[0];
      var msgs = Array.isArray(th.messages) ? th.messages : [];
      try {
        var full = await readTool(GM, 'get_thread', { threadId: th.id, messageFormat: 'PLAIN_TEXT' });
        if (full && Array.isArray(full.messages) && full.messages.length) msgs = full.messages;
      } catch (e) { onErr('gmail', GM, e); }
      return gmailFrom(th, msgs);
    }
    async function gatherLive(task, dealHint, reconquest) {
      var ctx = { task: task || null, contact: null, deal: null, notes: [], emails: [], gmail: null, errors: [] };
      if (reconquest) ctx.reconquest = reconquest;
      function onErr(section, server, e) {
        var n = normalizeError(e, server, 'mcp');
        ctx.errors.push({ section: section, code: n.code, message: n.message });
      }
      function search(input) { return readTool(HS, 'search_crm_objects', input).then(function (p) { return Array.isArray(p.results) ? p.results : []; }); }
      var taskId = task && task.id != null ? String(task.id) : null;
      var contactP = Promise.resolve(null), dealP = Promise.resolve(null);
      if (taskId) {
        contactP = search(assocInput('CONTACT', CONTACT_PROPS, 'tasks', taskId)).then(function (rs) { return contactFrom(rs[0]); }, function (e) { onErr('hubspot', HS, e); return null; });
        dealP = search(assocInput('DEAL', CTX_DEAL_PROPS, 'tasks', taskId)).then(pickDeal, function (e) { onErr('hubspot', HS, e); return null; });
      } else if (dealHint) {
        contactP = search(assocInput('CONTACT', CONTACT_PROPS, 'deals', dealHint.id)).then(function (rs) { return contactFrom(rs[0]); }, function (e) { onErr('hubspot', HS, e); return null; });
        dealP = Promise.resolve({ id: String(dealHint.id), name: str(dealHint.name), stage: dealHint.stage || null, amount: num(dealHint.amount) });
      }
      var first = await Promise.all([contactP, dealP]);
      ctx.contact = first[0];
      ctx.deal = first[1];
      var jobs = [];
      if (!ctx.deal && ctx.contact) {
        jobs.push(search(assocInput('DEAL', CTX_DEAL_PROPS, 'contacts', ctx.contact.id)).then(function (rs) { ctx.deal = pickDeal(rs); }, function (e) { onErr('hubspot', HS, e); }));
      }
      var noteTarget = ctx.contact ? ['contacts', ctx.contact.id] : ctx.deal ? ['deals', ctx.deal.id] : null;
      if (noteTarget) {
        jobs.push(search(assocInput('NOTE', NOTE_PROPS, noteTarget[0], noteTarget[1], 3, [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }]))
          .then(function (rs) { ctx.notes = notesFrom(rs); }, function (e) { onErr('hubspot', HS, e); }));
      }
      if (ctx.contact) {
        jobs.push(search(assocInput('EMAIL', EMAIL_PROPS, 'contacts', ctx.contact.id, 3, [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }]))
          .then(function (rs) { ctx.emails = emailsFrom(rs); }, function (e) { onErr('hubspot', HS, e); }));
      }
      if (ctx.contact && ctx.contact.email) {
        jobs.push(gmailFetch(ctx.contact.email, onErr).then(function (g) { ctx.gmail = g; }, function (e) { onErr('gmail', GM, e); }));
      }
      await Promise.all(jobs);
      return ctx;
    }
    async function gatherDemo(task, dealHint, reconquest) {
      await env.sleep(400);
      var w = S.world;
      var ctx = { task: task || null, contact: null, deal: null, notes: [], emails: [], gmail: null, errors: [] };
      if (reconquest) ctx.reconquest = reconquest;
      var link = task && w.links[String(task.id)] || null;
      var contactId = link ? link.contactId : dealHint ? w.dealContact[String(dealHint.id)] : null;
      var dealId = link ? link.dealId : dealHint ? String(dealHint.id) : null;
      var c = contactId && w.contacts[contactId];
      if (c) ctx.contact = { id: c.id, name: c.name, firstname: c.firstname, email: c.email, company: c.company, jobtitle: c.jobtitle };
      if (!dealId && contactId) Object.keys(w.dealContact).forEach(function (did) { if (!dealId && w.dealContact[did] === contactId) dealId = did; });
      var d = dealId && w.raw.deals.filter(function (x) { return x.id === dealId; })[0];
      if (d) ctx.deal = { id: d.id, name: d.name, stage: d.stage, amount: d.amount };
      if (contactId && w.notes[contactId]) {
        ctx.notes = notesFrom(w.notes[contactId].map(function (n, i) { return { id: i, properties: n }; }));
      }
      if (contactId && w.threads[contactId]) {
        var th = w.threads[contactId];
        ctx.gmail = gmailFrom(th, th.messages);
      }
      return ctx;
    }
    async function getMissiveContext(task) {
      await init();
      return S.mode === 'demo' ? gatherDemo(task, null, null) : gatherLive(task, null, null);
    }
    // Reconquest flow: pass a chronicle entry ({deal, lostDay, reason, ...}) or a Raw deal.
    async function getReconquestContext(entry) {
      await init();
      var deal = entry && entry.deal ? entry.deal : entry;
      if (!deal || deal.id == null) throw { code: 'bad_request', server: HS, message: 'Affaire inconnue', retryable: false, retryAfterMs: null, source: 'mcp' };
      var lostDay = entry && entry.lostDay || (deal.closeDate ? parisDay(deal.closeDate) : null);
      var rq = { dealId: String(deal.id), name: str(deal.name), lostDay: lostDay, reason: (entry && entry.reason) || deal.lostReason || null };
      return S.mode === 'demo' ? gatherDemo(null, deal, rq) : gatherLive(null, deal, rq);
    }

    // ---------- scribe ----------
    function invalidJson(msg, text) {
      var e = { code: 'invalid_json', server: null, message: msg, retryable: false, retryAfterMs: null, source: 'sample' };
      if (text != null) e.text = text;
      return e;
    }
    function finishDraft(context, out) {
      if (!out || typeof out !== 'object' || typeof out.subject !== 'string' || typeof out.body !== 'string' || !out.subject.trim() || !out.body.trim()) {
        throw invalidJson('Réponse du scribe incomplète (subject/body attendus).');
      }
      var d = cleanDraft(out);
      if (!d.subject || !d.body) throw invalidJson('Réponse du scribe vide après nettoyage.');
      var g = gmailDraftInput(context, d);
      return { subject: g.subject, body: d.body, to: g.to, replyToMessageId: g.replyToMessageId || null, isReply: !!g.replyToMessageId };
    }
    async function draftMissive(context, intent, opts) {
      opts = opts || {};
      await init();
      if (S.mode === 'demo') {
        var canned = demoDraft(context, intent);
        var text = JSON.stringify(canned);
        var shown = '';
        var chunks = 5;
        await env.sleep(500);
        for (var i = 1; i <= chunks; i++) {
          if (opts.signal && opts.signal.aborted) throw { code: 'cancelled', message: 'Arrêté', text: shown, source: 'sample', server: null, retryable: false, retryAfterMs: null };
          var next = text.slice(0, Math.ceil(text.length * i / chunks));
          var delta = next.slice(shown.length);
          shown = next;
          if (delta && typeof opts.onText === 'function') { try { opts.onText({ text: shown, delta: delta }); } catch (e) { /* ignore */ } }
          await env.sleep(180);
        }
        if (opts.signal && opts.signal.aborted) throw { code: 'cancelled', message: 'Arrêté', text: shown, source: 'sample', server: null, retryable: false, retryAfterMs: null };
        return finishDraft(context, canned);
      }
      if (!S.sample || typeof S.sample.json !== 'function') {
        throw { code: 'not_granted', server: null, message: 'Scribe indisponible', retryable: false, retryAfterMs: null, source: 'sample' };
      }
      var prompt = buildDraftPrompt(context, intent, env.now());
      var o = { modelTier: 'default' };
      if (typeof opts.onText === 'function') o.onText = opts.onText;
      if (opts.signal) o.signal = opts.signal;
      if (opts.cache === false) o.cache = false;
      var out;
      try { out = await S.sample.json(prompt, o); } catch (e) { throw normalizeError(e, null, 'sample'); }
      return finishDraft(context, out);
    }
    async function createGmailDraft(args) {
      await init();
      var a = args || {};
      var to = (Array.isArray(a.to) ? a.to : a.to ? [a.to] : []).map(function (x) { return str(x).trim(); }).filter(Boolean);
      if (!to.length) throw { code: 'no_email', server: GM, message: 'Aucune adresse e-mail', retryable: false, retryAfterMs: null, source: 'mcp' };
      var input = { to: to, subject: str(a.subject), body: str(a.body) };
      if (a.replyToMessageId) input.replyToMessageId = String(a.replyToMessageId);
      if (S.mode === 'demo') {
        await env.sleep(400);
        S.draftN++;
        return { id: 'demo-draft-' + S.draftN, threadId: null, viewUrl: null, demo: true };
      }
      var p = await writeTool(GM, 'create_draft', input);
      var view = p && (p.viewUrl || p.view_url);
      return { id: p && p.id != null ? String(p.id) : null, threadId: p && p.threadId != null ? String(p.threadId) : null, viewUrl: typeof view === 'string' && /^https:\/\//.test(view) ? view : null };
    }
    async function openPermissions() {
      var p = await useCap('permissions');
      if (!p || typeof p.manage !== 'function') throw { code: 'permissions_unavailable', server: null, message: 'Panneau indisponible', retryable: false, retryAfterMs: null, source: 'mcp' };
      try { await p.manage(); } catch (e) {
        throw { code: 'permissions_unavailable', server: null, message: e && e.message ? String(e.message) : 'Panneau indisponible', retryable: false, retryAfterMs: null, source: 'mcp' };
      }
    }

    // ---------- state persistence ----------
    function docRef() { return S.db.doc('data/users/' + S.uid + '/royaume'); }
    async function dbOnce(fn) {
      try { return await fn(); } catch (e) {
        var n = normalizeError(e, null, 'db');
        if (n.code !== 'unavailable') throw n;
        await env.sleep(300 + Math.floor(env.random() * 700));
        try { return await fn(); } catch (e2) { throw normalizeError(e2, null, 'db'); }
      }
    }
    function dbFailed(n, always) {
      S.lastSaveError = n;
      if (always || TERMINAL_DB.indexOf(n.code) >= 0 || n.code === 'unknown') {
        S.store = localOk() ? 'local' : 'memory';
        S.can.db = false;
      }
    }
    async function loadState() {
      await init();
      if (S.mode === 'demo') return normalizeState(S.memState);
      if (S.store === 'db') {
        try {
          var snap = await dbOnce(function () { return docRef().get(); });
          var local = readLocal();
          if (snap && snap.exists) {
            var data = typeof snap.data === 'function' ? snap.data() : isObj(snap.data) ? snap.data : null;
            // A local copy saved later (db writes were failing then) wins: that progress lives only on this device.
            if (isObj(local) && typeof local.savedAt === 'string' && (!isObj(data) || typeof data.savedAt !== 'string' || local.savedAt > data.savedAt)) {
              return normalizeState(local);
            }
            var st = normalizeState(data);
            S.lastSavedJson = JSON.stringify(compactState(st));
            return st;
          }
          return normalizeState(local);
        } catch (e) {
          // Could not read the saved doc: never overwrite it this session (it may hold progress we did not see).
          dbFailed(normalizeError(e, null, 'db'), true);
          return normalizeState(readLocal() || S.memState);
        }
      }
      if (S.store === 'local') return normalizeState(readLocal());
      return normalizeState(S.memState);
    }
    async function writeState(snap, json) {
      if (S.mode === 'demo' || S.store === 'memory') { S.memState = snap; return; }
      // savedAt lets loadState pick the newer of the db doc and the local copy.
      var stamped = Object.assign({}, snap, { savedAt: env.now().toISOString() });
      var sjson = JSON.stringify(stamped);
      if (S.store === 'db') {
        try {
          await dbOnce(function () { return docRef().set(stamped); });
          writeLocal(sjson);
          return;
        } catch (e) {
          var n = normalizeError(e, null, 'db');
          dbFailed(n);
          if (!writeLocal(sjson)) S.memState = snap;
          throw n;
        }
      }
      if (!writeLocal(sjson)) { S.memState = snap; S.store = 'memory'; }
    }
    function runSave(snap, json) {
      S.saving = writeState(snap, json).then(function () {
        S.lastSavedJson = json;
        S.lastSaveError = null;
      }, function (e) {
        S.lastSaveError = normalizeError(e, null, 'db');
      }).then(function () {
        S.saving = null;
        if (S.pending) {
          var p = S.pending, ws = S.waiters;
          S.pending = null;
          S.waiters = [];
          var next = p.json === S.lastSavedJson ? Promise.resolve() : runSave(p.snap, p.json);
          next.then(function () { ws.forEach(function (w) { w(); }); });
        }
      });
      return S.saving;
    }
    // Single-flight: one write at a time; calls made during a write coalesce into ONE follow-up write
    // of the latest state. Resolves when that state is stored (never rejects; see DATA.status()).
    async function saveState(state) {
      await init();
      var snap = compactState(state);
      var json = JSON.stringify(snap);
      if (S.saving) {
        S.pending = { snap: snap, json: json };
        return new Promise(function (resolve) { S.waiters.push(resolve); });
      }
      if (json === S.lastSavedJson) return;
      return runSave(snap, json);
    }
    function status() {
      return { mode: S.mode, reason: S.reason, storage: S.store, can: clone(S.can), lastSaveError: S.lastSaveError };
    }

    return {
      init: init,
      loadAll: loadAll,
      completeTask: completeTask,
      reopenTask: reopenTask,
      rescheduleTask: rescheduleTask,
      getMissiveContext: getMissiveContext,
      getReconquestContext: getReconquestContext,
      draftMissive: draftMissive,
      createGmailDraft: createGmailDraft,
      openPermissions: openPermissions,
      loadState: loadState,
      saveState: saveState,
      status: status,
      _env: env,
      _reset: reset
    };
  }

  root.LOGIC = LOGIC;
  root.DATA = makeData();
})(typeof window !== 'undefined' ? window : this);
