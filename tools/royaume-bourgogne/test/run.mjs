// Royaume de Bourgogne — integration harness (SPEC section 5).
//   node test/run.mjs            build royaume.html, then run demo + live suites
//   node test/run.mjs --no-build reuse the current royaume.html
// Modes: demo (window.claude.use → null, asynchronously) and live (fake mcp/sample/db/user/permissions
// with FICTIONAL data in the HubSpot/Gmail payload shapes of SPEC §3; every call is recorded).
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const { chromium } = pw;
const { installFakeClaude } = require('./fake-claude.js');

const TEST = dirname(fileURLToPath(import.meta.url));
const W = dirname(TEST);
const SHOTS = join(W, 'shots');
const TMP = join(W, 'tmp-integrator');
mkdirSync(SHOTS, { recursive: true });
mkdirSync(TMP, { recursive: true });

if (!process.argv.includes('--no-build')) execFileSync(process.execPath, [join(W, 'build.mjs')], { stdio: 'inherit' });
const body = readFileSync(join(W, 'royaume.html'), 'utf8');
const PAGE = join(TMP, 'page.html');
writeFileSync(PAGE, '<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + body + '</body></html>');
const URL = 'file://' + PAGE;

// Paris times. 2026-10-21 is CEST (UTC+2); +7 days (2026-10-28) is after the DST switch (UTC+1).
const DAY = new Date('2026-10-21T09:12:00+02:00');
const NIGHT = new Date('2026-10-21T22:00:00+02:00');
const CI = { userIntent: 'Jeu de suivi commercial : lecture des deals et des tâches', satisfaction: 'NEUTRAL' };
const DEAL_PROPS = ['dealname', 'dealstage', 'amount', 'closedate', 'createdate', 'notes_last_contacted', 'notes_next_activity_date', 'closed_lost_reason'];
const OPEN_PROPS = ['hs_task_subject', 'hs_task_body', 'hs_task_status', 'hs_timestamp', 'hs_task_type', 'hs_task_priority'];
const DONE_PROPS = ['hs_timestamp', 'hs_task_completion_date'];

// Stored state of a returning player: 9007 was at "contractsent" and 9008 at "presentationscheduled"
// on the last visit; both closed since → one won and one lost celebration.
const SEED = {
  v: 1,
  lastSeen: { 9001: 'contractsent', 9002: 'presentationscheduled', 9003: 'qualifiedtobuy', 9004: 'appointmentscheduled', 9005: '', 9006: 'contractsent', 9007: 'contractsent', 9008: 'presentationscheduled', 9009: 'closedwon', 9010: 'closedlost', 9011: 'qualifiedtobuy', 9012: 'presentationscheduled' },
  observedAt: '2026-10-17T07:00:00.000Z',
  perfectDays: ['2026-10-14', '2026-10-15'], actions: { '2026-10-15': 3 },
  todayDoneIds: { day: null, ids: [] }, abattus: [], siege: { startedAt: null, initialCount: 0, completedAt: null },
  reconquests: {}, muted: true, seenIntro: true
};

// ---------------------------------------------------------------------------------------------
const results = [];
const issues = { demo: [], live: [] };
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: ok ? '' : detail });
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (ok || detail === undefined ? '' : '  → ' + (typeof detail === 'string' ? detail : JSON.stringify(detail))));
  return !!ok;
}
function sameJson(a, b) { return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b)); }
function sortKeys(x) {
  if (Array.isArray(x)) return x.map(sortKeys);
  if (x && typeof x === 'object') return Object.keys(x).sort().reduce((o, k) => (o[k] = sortKeys(x[k]), o), {});
  return x;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(browser, opts) {
  const mode = opts.mode;
  const ctx = await browser.newContext({
    viewport: opts.vp, deviceScaleFactor: opts.dpr || 1, ignoreHTTPSErrors: true,
    hasTouch: !!opts.mobile, isMobile: !!opts.mobile, reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const page = await ctx.newPage();
  const bucket = issues[mode === 'demo' ? 'demo' : 'live'];
  const tag = opts.tag;
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') bucket.push(`[${tag}] console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => bucket.push(`[${tag}] pageerror: ${e.message}`));
  page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) bucket.push(`[${tag}] requestfailed: ${r.url()}`); });
  await page.clock.setFixedTime(opts.time || DAY);
  await page.addInitScript(installFakeClaude, Object.assign({ mode, baseDay: '2026-10-21' }, opts.cfg || {}));
  if (opts.capture) await page.addInitScript(captureScene);
  await page.goto(URL, { waitUntil: opts.waitUntil || 'load' });
  return { ctx, page };
}
async function waitBooted(page) {
  await page.waitForFunction(() => window.UI && window.UI.model && document.getElementById('rb-loading').hidden, null, { timeout: 20000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
}
// Collects every celebration in the queue (they appear after a short scene effect), clicking « Continuer ».
async function drainCelebrations(page, maxWait = 2500) {
  const seen = [];
  for (let i = 0; i < 6; i++) {
    const appeared = await page.waitForFunction(() => !document.getElementById('rb-celebrate').hidden, null, { timeout: maxWait }).then(() => true, () => false);
    if (!appeared) break;
    await sleep(250);
    seen.push(await page.evaluate(() => ({ title: document.getElementById('rb-cel-title').textContent, big: document.getElementById('rb-cel-big').hidden ? '' : document.getElementById('rb-cel-big').textContent, text: document.getElementById('rb-cel-text').textContent })));
    await page.click('#rb-cel-ok');
    await sleep(300);
  }
  return seen;
}
const fake = (page, fn) => page.evaluate(fn);
// Test-only instrumentation: keep a handle on the scene that ui.js creates (window.__scene).
function captureScene() {
  let art;
  Object.defineProperty(window, 'ART', {
    configurable: true, enumerable: true,
    get() { return art; },
    set(v) {
      art = v;
      let cs;
      Object.defineProperty(v, 'createScene', {
        configurable: true, enumerable: true,
        get() { return cs && function () { const s = cs.apply(this, arguments); window.__scene = s; return s; }; },
        set(f) { cs = f; }
      });
    }
  });
}
async function calls(page) { return page.evaluate(() => window.__fake.calls.map((c) => ({ server: c.server, tool: c.tool, input: c.input, options: c.options, seq: c.seq, ok: c.ok, error: c.error }))); }
async function waitCall(page, pred, after = -1, timeout = 8000) {
  const t0 = Date.now();
  for (;;) {
    const cs = await calls(page);
    const hit = cs.find((c) => c.seq > after && pred(c));
    if (hit) return hit;
    if (Date.now() - t0 > timeout) return null;
    await sleep(100);
  }
}
async function lastSeq(page) { return page.evaluate(() => window.__fake.calls.length - 1); }
// After a write the UI plays the effect, then re-fetches (DATA.loadAll) and rebuilds. Wait for that reload.
async function waitReload(page, after) {
  const deal = await waitCall(page, (c) => c.tool === 'search_crm_objects' && c.input.objectType === 'DEAL', after, 10000);
  await page.waitForFunction(() => !document.querySelector('.rb-toolbar .is-busy, #rb-refresh.is-busy, [aria-busy="true"]'), null, { timeout: 10000 }).catch(() => {});
  await sleep(2000); // effect cap (1.8 s) + rebuild
  return !!deal;
}
async function waitToastsGone(page, timeout = 9500) {
  await page.waitForFunction(() => !document.querySelector('#rb-toasts .toast'), null, { timeout }).catch(() => {});
}
async function overflow(page) {
  return page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, bw: document.body.scrollWidth }));
}
const manageOf = (c) => c.input && c.input.updateRequest && c.input.updateRequest.objects && c.input.updateRequest.objects[0];
async function openMissive(page, id) {
  await page.evaluate(() => window.UI.close());
  await sleep(150);
  await page.keyboard.press('t');
  await page.waitForSelector('#rb-tab-goblins');
  await page.click('#rb-tab-goblins');
  await page.click(`[data-fk="m-${id}"]`);
  await page.waitForSelector('[data-fk="sent"]');
}

// ---------------------------------------------------------------------------------------------
async function demoSuite(browser) {
  console.log('\n== DEMO mode (window.claude.use → null)');
  let { ctx, page } = await newPage(browser, { mode: 'demo', tag: 'demo-desktop', vp: { width: 1440, height: 900 } });
  await waitBooted(page);
  const cel = await drainCelebrations(page);
  check('demo: first visit shows the intro (« Bienvenue »)', cel.some((c) => /Bienvenue/i.test(c.title)), cel);
  check('demo: demo ribbon visible with SPEC copy', await page.evaluate(() => !document.getElementById('rb-ribbon').hidden && /Démo — ouvrez cette page dans claude\.ai avec HubSpot connecté/.test(document.getElementById('rb-ribbon').textContent)));
  const dm = await page.evaluate(() => ({ goblins: window.UI.model.counts.goblins, quests: window.UI.model.quests.length, gold: window.UI.model.season.gold }));
  check('demo: demo model has goblins, quests and season gold', dm.goblins >= 10 && dm.quests > 5 && dm.gold > 0, dm);
  check('demo: siege banner shown after the intro', await page.evaluate(() => !document.getElementById('rb-siege').hidden && /gobelins assiègent vos murailles\. Aïe\./.test(document.getElementById('rb-siege-text').textContent)));
  await sleep(400);
  await page.screenshot({ path: join(SHOTS, 'demo-desktop.png') });
  // A demo write + scribe still work (in-memory).
  await page.keyboard.press('t');
  await page.waitForSelector('#rb-tab-goblins');
  await page.click('#rb-tab-goblins');
  await page.click('#rb-tabpanel .row >> nth=0');
  await page.click('[data-fk="sent"]');
  await sleep(3000);
  check('demo: « Missive envoyée » lowers the goblin count', (await page.evaluate(() => window.UI.model.counts.goblins)) === dm.goblins - 1);
  await ctx.close();

  ({ ctx, page } = await newPage(browser, { mode: 'demo', tag: 'demo-mobile', vp: { width: 390, height: 844 }, dpr: 2, mobile: true }));
  await waitBooted(page);
  await drainCelebrations(page);
  let o = await overflow(page);
  check('demo: no horizontal overflow at 390px (main view)', o.sw <= o.iw, o);
  await page.click('.rb-bottomnav [data-open="board"]');
  await sleep(400);
  o = await overflow(page);
  check('demo: no horizontal overflow at 390px (Tableau open)', o.sw <= o.iw, o);
  await ctx.close();
}

// ---------------------------------------------------------------------------------------------
async function liveSuite(browser) {
  console.log('\n== LIVE mode (fake mcp / sample / db / user)');

  // ---- first frame: slow connectors, the village + loading plate must render before data arrives
  {
    const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-firstframe', vp: { width: 1440, height: 900 }, cfg: { latency: 2500, seedState: SEED }, waitUntil: 'domcontentloaded' });
    await sleep(700);
    const ff = await page.evaluate(() => {
      const c = document.getElementById('rb-canvas');
      let colors = 0, opaque = 0;
      try {
        const g = c.getContext('2d');
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const set = new Set();
        for (let i = 0; i < d.length; i += 4 * 97) { if (d[i + 3] > 0) opaque++; set.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); }
        colors = set.size;
      } catch (e) { colors = -1; }
      const l = document.getElementById('rb-loading');
      return { loading: !l.hidden && getComputedStyle(l).display !== 'none', text: document.getElementById('rb-loading-text').textContent, colors, opaque, booted: !!(window.UI && window.UI.model) };
    });
    check('first frame: loading plate « Le héraut apporte les nouvelles… » visible before data', ff.loading && /Le héraut apporte les nouvelles/.test(ff.text) && !ff.booted, ff);
    check('first frame: village already drawn on the canvas (many colours)', ff.colors > 20 && ff.opaque > 100, ff);
    await page.screenshot({ path: join(TMP, 'first-frame.png') });
    await ctx.close();
  }

  // ---- desktop day: boot, celebrations, siege banner, every write flow
  const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-desktop', vp: { width: 1440, height: 900 }, cfg: { seedState: SEED } });
  await waitBooted(page);
  const boot = await calls(page);
  const searches = boot.filter((c) => c.tool === 'search_crm_objects');
  const dealCalls = searches.filter((c) => c.input.objectType === 'DEAL');
  const openCalls = searches.filter((c) => c.input.objectType === 'TASK' && JSON.stringify(c.input.filterGroups).includes('"NEQ"'));
  const doneCalls = searches.filter((c) => c.input.objectType === 'TASK' && JSON.stringify(c.input.filterGroups).includes('"EQ"'));
  check('boot: DEAL search input exact (properties, limit 200, chatInsights)', dealCalls.length > 0 && sameJson(dealCalls[0].input, { objectType: 'DEAL', properties: DEAL_PROPS, limit: 200, chatInsights: CI }), dealCalls[0] && dealCalls[0].input);
  check('boot: DEAL paging (12 deals, server pages of 10 → offsets [none, 10])', sameJson(dealCalls.map((c) => c.input.offset ?? null), [null, 10]), dealCalls.map((c) => c.input.offset));
  check('boot: open TASK search input exact (NEQ COMPLETED, hs_timestamp ASCENDING)', openCalls.length > 0 && sameJson(openCalls[0].input, {
    objectType: 'TASK', properties: OPEN_PROPS, limit: 200, chatInsights: CI,
    filterGroups: [{ filters: [{ propertyName: 'hs_task_status', operator: 'NEQ', value: 'COMPLETED' }] }],
    sorts: [{ propertyName: 'hs_timestamp', direction: 'ASCENDING' }]
  }), openCalls[0] && openCalls[0].input);
  check('boot: open TASK paging offsets [none, 10]', sameJson(openCalls.map((c) => c.input.offset ?? null), [null, 10]), openCalls.map((c) => c.input.offset));
  check('boot: completed TASK search (EQ COMPLETED, history props) paged [none, 10, 20]', doneCalls.length === 3 &&
    sameJson(doneCalls[0].input.filterGroups, [{ filters: [{ propertyName: 'hs_task_status', operator: 'EQ', value: 'COMPLETED' }] }]) &&
    sameJson(doneCalls[0].input.properties, DONE_PROPS) && sameJson(doneCalls.map((c) => c.input.offset ?? null), [null, 10, 20]), doneCalls.map((c) => c.input));
  check('boot: every search carries the chatInsights object and {cache:false}', searches.every((c) => sameJson(c.input.chatInsights, CI) && c.options && c.options.cache === false));
  check('boot: no writes, no Gmail and no scribe call on load', !boot.some((c) => c.tool !== 'search_crm_objects') && (await fake(page, () => window.__fake.sampleCalls.length)) === 0);
  const m0 = await page.evaluate(() => { const m = window.UI.model; return { goblins: m.counts.goblins, today: m.missives.today.length, waiting: m.missives.waiting.length, quests: m.quests.length, gold: m.season.gold, tiers: m.counts.goblinsByTier, siege: m.siege, mode: window.DATA.status().mode, storage: window.DATA.status().storage }; });
  check('boot: model from fake HubSpot (12 goblins, 2 today, 1 waiting, 8 open quests, 5 300 € season gold)', m0.goblins === 12 && m0.today === 2 && m0.waiting === 1 && m0.quests === 8 && m0.gold === 5300, m0);
  check('boot: live mode with db storage', m0.mode === 'live' && m0.storage === 'db', m0);
  const sm = await page.evaluate(() => window.ART._debug.normModel(window.LOGIC.toSceneModel(window.UI.model)));
  check('scene contract: art reads LOGIC.toSceneModel (12 goblins, 8 tents, chest level 2 for 35 %, board badge 2, chronicle badge 1, siege on, hero level)',
    sm.goblins.length === 12 && sm.quests.length === 8 && sm.treasure === 2 && sm.boardBadge === 2 && sm.chronicleBadge === 1 && sm.siege === true && sm.heroLevel === (await page.evaluate(() => window.UI.model.hero.level)) && sm.quests.filter((q) => q.planned).length === 2,
    { treasure: sm.treasure, boardBadge: sm.boardBadge, chronicleBadge: sm.chronicleBadge, siege: sm.siege, heroLevel: sm.heroLevel, g: sm.goblins.length, q: sm.quests.length, planned: sm.quests.filter((q) => q.planned).length });
  check('boot: no demo ribbon in live mode', await page.evaluate(() => document.getElementById('rb-ribbon').hidden));

  const cel = await drainCelebrations(page);
  const won = cel.find((c) => /Quête accomplie/.test(c.title));
  const lost = cel.find((c) => /Quête échouée/.test(c.title));
  check('celebration: closedwon since lastSeen → « Quête accomplie » with +3 200 €', !!won && /3[\s  ]200/.test(won.big + won.text), cel);
  check('celebration: closedlost → « Quête échouée » with reason, reconquest date and « Brutal, mais libérateur. »', !!lost && /Budget gelé/.test(lost.text) && /Brutal, mais libérateur\./.test(lost.text) && /reconqu/i.test(lost.text), lost);
  const banner = await page.evaluate(() => ({ shown: !document.getElementById('rb-siege').hidden, text: document.getElementById('rb-siege-text').textContent }));
  check('siege: banner « Messire, 12 gobelins assiègent vos murailles. Aïe. » after the celebrations', banner.shown && banner.text === 'Messire, 12 gobelins assiègent vos murailles. Aïe.', banner);
  await sleep(500);
  const db1 = await fake(page, () => { const d = window.__fake.store['data/users/' + window.__fake.uid + '/royaume']; return d && { lastSeen: d.lastSeen, siege: d.siege }; });
  check('db: new baseline saved (lastSeen 9007 → closedwon, 9008 → closedlost) and siege started', db1 && db1.lastSeen['9007'] === 'closedwon' && db1.lastSeen['9008'] === 'closedlost' && !!db1.siege.startedAt && db1.siege.initialCount === 12, db1);
  await page.screenshot({ path: join(SHOTS, 'desktop-day.png') });
  let o = await overflow(page);
  check('desktop: no horizontal overflow at 1440px', o.sw <= o.iw, o);
  const writesIdle0 = await fake(page, () => window.__fake.dbWrites.length);
  await sleep(2500);
  check('db: no writes while idle (render loop never saves)', (await fake(page, () => window.__fake.dbWrites.length)) === writesIdle0);

  // ---- « Missive envoyée » on an overdue task, then « Annuler »
  await openMissive(page, '5003');
  let before = await lastSeq(page);
  await page.click('[data-fk="sent"]');
  const sent = await waitCall(page, (c) => c.tool === 'manage_crm_objects', before);
  check('sent: manage_crm_objects payload exact (CONFIRMED, tasks, numeric id, COMPLETED)', sent && sameJson(sent.input, { confirmationStatus: 'CONFIRMED', updateRequest: { objects: [{ objectType: 'tasks', objectId: 5003, properties: { hs_task_status: 'COMPLETED' } }] } }) && sent.options && sent.options.cache === false, sent && sent.input);
  const undoBtn = page.locator('#rb-toasts button', { hasText: 'Annuler' });
  await undoBtn.waitFor({ timeout: 4000 }).catch(() => {});
  check('sent: toast « Missive envoyée. Un gobelin de moins. » with « Annuler »', (await undoBtn.count()) === 1 && /Missive envoyée\. Un gobelin de moins\./.test(await page.locator('#rb-toasts').textContent()));
  const reloaded = await waitCall(page, (c) => c.tool === 'search_crm_objects' && c.input.objectType === 'TASK', sent ? sent.seq : before, 6000);
  check('sent: data re-fetched after the write (search after manage)', !!reloaded);
  await sleep(300);
  before = await lastSeq(page);
  await undoBtn.click();
  const undo = await waitCall(page, (c) => c.tool === 'manage_crm_objects', before);
  check('undo: « Annuler » sets hs_task_status back to NOT_STARTED', undo && sameJson(manageOf(undo), { objectType: 'tasks', objectId: 5003, properties: { hs_task_status: 'NOT_STARTED' } }), undo && undo.input);
  await waitReload(page, undo ? undo.seq : before);
  check('undo: goblin 5003 is back after the reload', await page.evaluate(() => window.UI.model.missives.overdue.some((m) => m.id === '5003')));

  // ---- Reporter +7 (DST: 2026-10-28 is in winter time → 08:00 Paris = 07:00Z)
  await openMissive(page, '5004');
  await page.click('[data-fk="later"]');
  before = await lastSeq(page);
  await page.click('[data-fk="later-7"]');
  const later = await waitCall(page, (c) => c.tool === 'manage_crm_objects', before);
  check('reporter +7: hs_timestamp = 2026-10-28 08:00 Paris = 2026-10-28T07:00:00.000Z', later && sameJson(manageOf(later), { objectType: 'tasks', objectId: 5004, properties: { hs_timestamp: '2026-10-28T07:00:00.000Z' } }) && later.input.confirmationStatus === 'CONFIRMED', later && later.input);
  await waitReload(page, later ? later.seq : before);
  check('reporter +7: missive 5004 now due 2026-10-28, no longer a goblin', await page.evaluate(() => { const m = window.UI.model.missives; return !m.overdue.some((x) => x.id === '5004') && m.upcoming.some((x) => x.id === '5004' && x.dueDay === '2026-10-28'); }));

  // ---- Abattre with the in-page confirm
  await openMissive(page, '5001');
  await page.click('[data-fk="slay"]');
  await page.waitForSelector('[data-fk="slay-yes"]');
  check('abattre: in-page confirm shown (no window.confirm)', await page.locator('.confirm').isVisible());
  before = await lastSeq(page);
  await page.click('[data-fk="slay-yes"]');
  const slay = await waitCall(page, (c) => c.tool === 'manage_crm_objects', before);
  check('abattre: hs_task_status COMPLETED for 5001', slay && sameJson(manageOf(slay), { objectType: 'tasks', objectId: 5001, properties: { hs_task_status: 'COMPLETED' } }), slay && slay.input);
  await waitReload(page, slay ? slay.seq : before);
  check('abattre: state.abattus contains "5001"', await page.evaluate(() => (window.UI.state.abattus || []).map(String).includes('5001')));
  await sleep(600);
  check('abattre: saved db doc has abattus ["5001"]', await fake(page, () => { const d = window.__fake.store['data/users/' + window.__fake.uid + '/royaume']; return !!d && (d.abattus || []).map(String).includes('5001'); }));

  // ---- Scribe → Gmail draft → Missive envoyée
  await openMissive(page, '5002');
  before = await lastSeq(page);
  await page.click('[data-fk="scribe"]');
  await page.waitForFunction(() => { const b = document.querySelector('[data-fk="write"]'); return b && !b.disabled; }, null, { timeout: 10000 });
  const ctxCalls = (await calls(page)).filter((c) => c.seq > before);
  check('scribe: sample not called before the click', (await fake(page, () => window.__fake.sampleCalls.length)) === 0);
  check('scribe: context gathered (contact via task, deal via contact, notes, Gmail search + get_thread)',
    ctxCalls.some((c) => c.input.objectType === 'CONTACT' && JSON.stringify(c.input.filterGroups) === JSON.stringify([{ associatedWith: [{ objectType: 'tasks', operator: 'EQUAL', objectIdValues: [5002] }] }])) &&
    ctxCalls.some((c) => c.input.objectType === 'DEAL' && JSON.stringify(c.input.filterGroups).includes('"contacts"')) &&
    ctxCalls.some((c) => c.input.objectType === 'NOTE') &&
    ctxCalls.some((c) => c.tool === 'search_threads' && c.input.query === 'from:paul.garnier@imprimerie-ducs.example OR to:paul.garnier@imprimerie-ducs.example' && c.input.pageSize === 3 && c.input.view === 'THREAD_VIEW_MINIMAL') &&
    ctxCalls.some((c) => c.tool === 'get_thread' && c.input.threadId === 'thr-ducs-1' && c.input.messageFormat === 'PLAIN_TEXT'),
    ctxCalls.map((c) => c.tool + ':' + (c.input.objectType || c.input.query || c.input.threadId)));
  await page.fill('#rb-intent', 'proposer une matinée la semaine prochaine');
  await page.click('[data-fk="write"]');
  await page.waitForSelector('#rb-body', { timeout: 10000 });
  const sc = await fake(page, () => window.__fake.sampleCalls);
  check('scribe: sample.json called exactly once, modelTier "default"', sc.length === 1 && sc[0].json && sc[0].modelTier === 'default' && sc[0].hasOnText && sc[0].hasSignal, sc.map((s) => ({ m: s.modelTier, j: s.json })));
  const prompt = sc[0] ? String(sc[0].input) : '';
  check('scribe: prompt is French, carries the rules, the context and the intent', /vouvoiement/.test(prompt) && /CONTEXTE/.test(prompt) && /proposer une matinée la semaine prochaine/.test(prompt) && /D-2026-031/.test(prompt) && /calendly\.com\/thefrenchbot-coaching\/30min/.test(prompt), prompt.slice(0, 300));
  check('scribe: prompt leaks no amount (6200 / 6 200)', !/6[\s  ]?200/.test(prompt));
  const draft = await page.evaluate(() => ({ subject: document.getElementById('rb-subject').value, body: document.getElementById('rb-body').value }));
  check('scribe: editable parchment filled (subject "Re: <thread>", plain body)', draft.subject === 'Re: Devis D-2026-031 · formation IA' && /Bonjour Paul/.test(draft.body) && !/\*\*|^#/m.test(draft.body), draft);
  await page.evaluate(() => { const b = document.getElementById('rb-modal-body'); if (b) b.scrollTop = 0; });
  await waitToastsGone(page);
  await page.evaluate(() => { const s = document.getElementById('rb-subject'); const b = document.getElementById('rb-modal-body'); if (s && b) b.scrollTop = Math.max(0, s.offsetTop - b.offsetTop - 260); });
  await sleep(300);
  await page.screenshot({ path: join(SHOTS, 'scribe.png') });
  before = await lastSeq(page);
  await page.click('[data-fk="gmail"]');
  const cd = await waitCall(page, (c) => c.tool === 'create_draft', before);
  check('gmail: create_draft {to, subject, body, replyToMessageId = latest thread message}', cd && sameJson(cd.input, { to: ['paul.garnier@imprimerie-ducs.example'], subject: draft.subject, body: draft.body, replyToMessageId: 'msg-ducs-c' }), cd && cd.input);
  const link = page.locator('[data-fk="open-draft"]');
  await link.waitFor({ timeout: 4000 }).catch(() => {});
  check('gmail: « Ouvrir le brouillon dans Gmail » link to viewUrl (target _blank)', (await link.count()) === 1 && (await link.getAttribute('href')) === 'https://mail.google.com/mail/u/0/#drafts?compose=r-draft-1' && (await link.getAttribute('target')) === '_blank' && /Ouvrir le brouillon dans Gmail/.test(await link.textContent()));
  before = await lastSeq(page);
  await page.click('[data-fk="done"]');
  const done = await waitCall(page, (c) => c.tool === 'manage_crm_objects', before);
  check('scribe: « Missive envoyée » then completes 5002', done && sameJson(manageOf(done), { objectType: 'tasks', objectId: 5002, properties: { hs_task_status: 'COMPLETED' } }), done && done.input);
  await waitReload(page, done ? done.seq : before);
  check('scribe: only one sample call in the whole flow', (await fake(page, () => window.__fake.sampleCalls.length)) === 1);

  // ---- Siege card flow
  await page.evaluate(() => window.UI.close());
  await sleep(300);
  const siegeShown = await page.evaluate(() => !document.getElementById('rb-siege').hidden);
  if (siegeShown) await page.click('#rb-siege-go'); else await page.evaluate(() => window.UI.open('siege'));
  await page.waitForSelector('#rb-siege-subj', { timeout: 5000 });
  const s1 = await page.evaluate(() => ({ subj: document.getElementById('rb-siege-subj').textContent, prog: (document.querySelector('#rb-modal-body [role="progressbar"]') || {}).getAttribute ? document.querySelector('#rb-modal-body [role="progressbar"]').getAttribute('aria-valuenow') : null, text: document.getElementById('rb-modal-body').textContent, model: window.UI.model.siege, oldest: window.UI.model.missives.overdue[0].subject }));
  check('siege: banner still offered (« Défendre le village ») while goblins remain', siegeShown);
  check('siege: card shows the oldest goblin first with defeated/initialCount progress', s1.subj === s1.oldest && /\b3\s*\/\s*12\b/.test(s1.text), s1);
  await waitToastsGone(page);
  await sleep(400);
  await page.screenshot({ path: join(SHOTS, 'siege.png') });
  await page.click('[data-fk="s-skip"]');
  await sleep(200);
  const s2 = await page.evaluate(() => document.getElementById('rb-siege-subj').textContent);
  check('siege: « Passer » moves to the next goblin', s2 && s2 !== s1.subj, { s1: s1.subj, s2 });
  const target = await page.evaluate((subj) => window.UI.model.missives.overdue.find((m) => m.subject === subj).id, s2);
  await page.click('[data-fk="s-slay"]');
  await page.waitForSelector('[data-fk="s-slay-yes"]');
  before = await lastSeq(page);
  await page.click('[data-fk="s-slay-yes"]');
  const sslay = await waitCall(page, (c) => c.tool === 'manage_crm_objects', before);
  check('siege: Abattre (confirm) completes the shown goblin', sslay && sameJson(manageOf(sslay), { objectType: 'tasks', objectId: Number(target), properties: { hs_task_status: 'COMPLETED' } }), sslay && sslay.input);
  await waitReload(page, sslay ? sslay.seq : before);
  const s3 = await page.evaluate(() => ({ open: !document.getElementById('rb-modal').hidden, text: document.getElementById('rb-modal-body').textContent, defeated: window.UI.model.siege.defeated, goblins: window.UI.model.counts.goblins }));
  check('siege: progress advances (4/12) and the card flow continues', s3.open && /\b4\s*\/\s*12\b/.test(s3.text) && s3.defeated === 4 && s3.goblins === 8, s3);
  check('db: writes never overlapped (one write at a time)', (await fake(page, () => window.__fake.dbOverlaps)) === 0);
  const nWrites = await fake(page, () => window.__fake.dbWrites.length);
  check('db: bounded number of writes for the whole session (< 25)', nWrites > 0 && nWrites < 25, nWrites);
  const allCalls = await calls(page);
  check('mcp: only declared tools were called', allCalls.every((c) => ({ HubSpot: ['search_crm_objects', 'manage_crm_objects'], Gmail: ['search_threads', 'get_thread', 'create_draft'] })[c.server]?.includes(c.tool)));
  check('mcp: every call succeeded against the strict fake', allCalls.every((c) => c.ok), allCalls.filter((c) => !c.ok).map((c) => [c.tool, c.error]));
  await ctx.close();

  // ---- canvas targets: hover caption, click castle / goblin / tent → the right panel opens
  {
    const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-canvas', vp: { width: 1440, height: 900 }, capture: true, cfg: { seedState: SEED } });
    await waitBooted(page);
    await drainCelebrations(page);
    await page.click('#rb-siege-later');
    const geo = await page.evaluate(() => { const r = document.getElementById('rb-canvas').getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 480, sy: r.height / 288 }; });
    const at = (lx, ly) => ({ x: geo.x + lx * geo.s, y: geo.y + ly * geo.sy });
    check('canvas: scaled to the card (integer 2× at 1440px, 16:9.6 ratio)', Math.abs(geo.s - 2) < 0.01 && Math.abs(geo.sy - geo.s) < 0.01, geo);
    const dbg = await page.evaluate(() => window.__scene && window.__scene._debugState());
    check('canvas: scene holds 12 goblins and 8 tents from the live model', dbg && dbg.goblins.length === 12 && dbg.tents.length === 8, dbg && { g: dbg.goblins.length, t: dbg.tents.length });
    let p = at(110, 80);
    await page.mouse.move(p.x, p.y);
    await sleep(200);
    const cap = await page.evaluate(() => { const c = document.getElementById('rb-caption'); return { shown: !c.hidden, text: c.textContent, cursor: getComputedStyle(document.getElementById('rb-canvas')).cursor }; });
    check('canvas: hovering the tavern shows « Tableau de la taverne · 2 missives du jour » with a pointer', cap.shown && cap.text === 'Tableau de la taverne · 2 missives du jour' && cap.cursor === 'pointer', cap);
    p = at(240, 60);
    await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => !document.getElementById('rb-modal').hidden, null, { timeout: 3000 }).catch(() => {});
    check('canvas: clicking the castle opens « Héros » after the short walk', (await page.textContent('#rb-modal-title')) === 'Héros');
    await page.keyboard.press('Escape');
    await sleep(300);
    const g = dbg.goblins.find((x) => x.id === '5001');
    p = at(g.x, g.y - 6);
    await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => !document.getElementById('rb-modal').hidden, null, { timeout: 3000 }).catch(() => {});
    const gm = await page.evaluate(() => ({ title: document.getElementById('rb-modal-title').textContent, subj: (document.querySelector('#rb-modal-body .m-subject') || {}).textContent }));
    check('canvas: clicking chief goblin 5001 opens its missive', gm.title === 'Missive royale' && /Imprimerie des Ducs : devis D-2026-031/.test(gm.subj || ''), gm);
    await page.keyboard.press('Escape');
    await sleep(300);
    const t = dbg.tents.find((x) => x.id === '9001');
    p = at(t.x, t.y - 14);
    await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => !document.getElementById('rb-modal').hidden, null, { timeout: 3000 }).catch(() => {});
    const qt = await page.evaluate(() => ({ title: document.getElementById('rb-modal-title').textContent, body: document.getElementById('rb-modal-body').textContent }));
    check('canvas: clicking the Trois Tilleuls tent opens that quest', qt.title === 'Quête' && /Domaine des Trois Tilleuls/.test(qt.body), qt.title);
    await sleep(400);
    await page.screenshot({ path: join(TMP, 'canvas-quest.png') });
    await page.keyboard.press('Escape');
    await sleep(200);

    // ---- Livre des Défaites → « Lancer la reconquête » → scribe with the lost deal's context → Gmail draft (no thread)
    await page.evaluate(() => window.UI.open('chronicle'));
    await page.waitForSelector('[data-fk="rq-9010"]', { timeout: 3000 });
    check('chronicle: the due reconquest offers « Lancer la reconquête » and « Oublier »', /Lancer la reconquête/.test(await page.textContent('[data-fk="rq-9010"]')) && /Oublier/.test(await page.textContent('[data-fk="rf-9010"]')));
    await sleep(300);
    await page.screenshot({ path: join(TMP, 'chronicle.png') });
    let before = await lastSeq(page);
    await page.click('[data-fk="rq-9010"]');
    await page.waitForFunction(() => { const b = document.querySelector('[data-fk="write"]'); return b && !b.disabled; }, null, { timeout: 10000 });
    const rc = (await calls(page)).filter((c) => c.seq > before);
    check('reconquest: context via the deal (CONTACT associatedWith deals 9010, then notes + Gmail search)',
      rc.some((c) => c.input.objectType === 'CONTACT' && JSON.stringify(c.input.filterGroups) === JSON.stringify([{ associatedWith: [{ objectType: 'deals', operator: 'EQUAL', objectIdValues: [9010] }] }])) &&
      rc.some((c) => c.tool === 'search_threads' && /helene\.roy@hautes-cotes\.example/.test(c.input.query)), rc.map((c) => c.tool + ':' + (c.input.objectType || c.input.query)));
    await page.click('[data-fk="write"]');
    await page.waitForSelector('#rb-body', { timeout: 10000 });
    const rp = await fake(page, () => window.__fake.sampleCalls.map((x) => String(x.input)));
    check('reconquest: one scribe call whose prompt frames a lost deal', rp.length === 1 && /Reprise de contact après une affaire perdue/.test(rp[0]) && /Pas le bon moment/.test(rp[0]), rp.length);
    before = await lastSeq(page);
    await page.click('[data-fk="gmail"]');
    const rcd = await waitCall(page, (c) => c.tool === 'create_draft', before);
    check('reconquest: create_draft to the deal contact, no replyToMessageId without a thread', rcd && sameJson(rcd.input.to, ['helene.roy@hautes-cotes.example']) && !('replyToMessageId' in rcd.input), rcd && rcd.input);
    await sleep(400);
    const rs = await page.evaluate(() => window.UI.state.reconquests);
    check('reconquest: the Gmail draft marks the reconquest « launched » (in-game only, no HubSpot write)', rs['9010'] === 'launched' && !(await calls(page)).some((c) => c.tool === 'manage_crm_objects'), rs);
    // Every panel renders live data without horizontal clipping.
    const clipped = [];
    for (const name of ['board', 'quests', 'treasure', 'chronicle', 'hero', 'siege']) {
      await page.evaluate((n) => { window.UI.close(); window.UI.open(n); }, name);
      await sleep(450);
      const r = await page.evaluate(() => { const b = document.getElementById('rb-modal-body'); return { sw: b.scrollWidth, cw: b.clientWidth, title: document.getElementById('rb-modal-title').textContent }; });
      if (r.sw > r.cw + 1) clipped.push({ name, ...r });
      await page.screenshot({ path: join(TMP, 'panel-' + name + '.png') });
    }
    check('panels: board, quests, treasure, chronicle, hero, siege render without horizontal clipping', clipped.length === 0, clipped);
    await ctx.close();
  }

  // ---- desktop night (22:00 Paris)
  {
    const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-night', vp: { width: 1440, height: 900 }, time: NIGHT, cfg: { seedState: SEED } });
    await waitBooted(page);
    await drainCelebrations(page);
    const n = await page.evaluate(() => ({ tod: document.getElementById('rb').getAttribute('data-tod'), clock: document.getElementById('rb-time').textContent }));
    check('night: data-tod="night" and the clock reads 22:00', n.tod === 'night' && n.clock === '22:00', n);
    await sleep(800);
    await page.screenshot({ path: join(SHOTS, 'desktop-night.png') });
    await ctx.close();
  }

  // ---- mobile 390×844
  {
    const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-mobile', vp: { width: 390, height: 844 }, dpr: 2, mobile: true, cfg: { seedState: SEED } });
    await waitBooted(page);
    await drainCelebrations(page);
    await sleep(500);
    await page.screenshot({ path: join(SHOTS, 'mobile-day.png') });
    o = await overflow(page);
    check('mobile: no horizontal overflow at 390px (main view)', o.sw <= o.iw, o);
    await page.tap('.rb-bottomnav [data-open="board"]');
    await page.waitForSelector('#rb-tab-today');
    await sleep(400);
    await page.screenshot({ path: join(SHOTS, 'mobile-panel.png') });
    o = await overflow(page);
    check('mobile: no horizontal overflow with Tableau open', o.sw <= o.iw, o);
    await page.tap('#rb-tab-goblins');
    await page.tap('[data-fk="m-5002"]');
    await page.waitForSelector('[data-fk="scribe"]');
    await page.tap('[data-fk="scribe"]');
    await page.waitForFunction(() => { const b = document.querySelector('[data-fk="write"]'); return b && !b.disabled; }, null, { timeout: 10000 });
    await page.tap('[data-fk="write"]');
    await page.waitForSelector('#rb-body', { timeout: 10000 });
    await sleep(300);
    o = await overflow(page);
    check('mobile: no horizontal overflow in the scribe with a draft', o.sw <= o.iw, o);
    await page.screenshot({ path: join(TMP, 'mobile-scribe.png') });
    const navRect = await page.evaluate(() => { const r = document.querySelector('.rb-bottomnav').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: window.innerHeight }; });
    check('mobile: bottom nav pinned to the bottom edge', Math.abs(navRect.bottom - navRect.h) <= 1, navRect);
    // Quick action from « Ordres du jour »: the toast must sit above the bottom nav.
    await page.evaluate(() => window.UI.close());
    await sleep(300);
    const before = await lastSeq(page);
    await page.locator('#rb-orders .order-actions .wbtn--gold').first().tap();
    const q = await waitCall(page, (c) => c.tool === 'manage_crm_objects', before);
    await page.waitForSelector('#rb-toasts .toast', { timeout: 4000 }).catch(() => {});
    await sleep(350);
    const tr = await page.evaluate(() => { const t = document.querySelector('#rb-toasts .toast'); const n = document.querySelector('.rb-bottomnav').getBoundingClientRect(); if (!t) return null; const r = t.getBoundingClientRect(); return { toastBottom: r.bottom, toastLeft: r.left, toastRight: r.right, navTop: n.top, w: window.innerWidth }; });
    check('mobile: « Envoyée » quick action writes COMPLETED (today missive 5012)', q && sameJson(manageOf(q), { objectType: 'tasks', objectId: 5012, properties: { hs_task_status: 'COMPLETED' } }), q && q.input);
    check('mobile: toast bottom-centre, above the bottom nav, inside the viewport', tr && tr.toastBottom <= tr.navTop + 1 && tr.toastLeft >= 0 && tr.toastRight <= tr.w, tr);
    await page.screenshot({ path: join(TMP, 'mobile-toast.png') });
    o = await overflow(page);
    check('mobile: no horizontal overflow with a toast shown', o.sw <= o.iw, o);
    await ctx.close();
  }

  // ---- no db capability → localStorage fallback; no sample → scribe hidden
  {
    const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-nodb', vp: { width: 1440, height: 900 }, cfg: { noDb: true, noSample: true } });
    await waitBooted(page);
    await drainCelebrations(page, 1500);
    await sleep(500);
    const st = await page.evaluate(() => { let v = null; try { v = JSON.parse(localStorage.getItem('royaume-bourgogne-state')); } catch (e) { v = 'ERR'; } return { storage: window.DATA.status().storage, saved: v && typeof v === 'object' ? { lastSeen: !!v.lastSeen, seenIntro: v.seenIntro } : v }; });
    check('no db: state falls back to localStorage « royaume-bourgogne-state »', st.storage === 'local' && st.saved && st.saved.lastSeen === true && st.saved.seenIntro === true, st);
    await openMissive(page, '5002');
    check('no sample: missive panel offers no « Rédiger avec le scribe »', (await page.locator('[data-fk="scribe"]').count()) === 0 && (await page.locator('[data-fk="sent"]').count()) === 1);
    await ctx.close();
  }

  // ---- reduced motion: effects resolve instantly, flows still work
  {
    const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-reduced', vp: { width: 1440, height: 900 }, reduced: true, cfg: { seedState: SEED } });
    await waitBooted(page);
    const cel = await drainCelebrations(page, 1500);
    check('reduced motion: celebrations still shown', cel.length === 2, cel.map((c) => c.title));
    await openMissive(page, '5006');
    const before = await lastSeq(page);
    const t0 = Date.now();
    await page.click('[data-fk="sent"]');
    await waitCall(page, (c) => c.tool === 'manage_crm_objects', before);
    await page.waitForFunction(() => !window.UI.model.missives.overdue.some((m) => m.id === '5006'), null, { timeout: 8000 }).catch(() => {});
    check('reduced motion: write → reload completes quickly (< 2.5 s)', Date.now() - t0 < 2500, Date.now() - t0);
    await ctx.close();
  }

  // ---- midnight rollover: the 60 s clock tick switches the Paris day and rebuilds the model
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') issues.live.push('[live-midnight] console.error: ' + m.text()); });
    page.on('pageerror', (e) => issues.live.push('[live-midnight] pageerror: ' + e.message));
    await page.clock.install({ time: new Date('2026-10-21T23:59:20+02:00') });
    await page.addInitScript(installFakeClaude, { mode: 'live', baseDay: '2026-10-21', seedState: SEED });
    await page.goto(URL);
    await waitBooted(page);
    await drainCelebrations(page, 1500);
    const d0 = await page.evaluate(() => ({ today: window.UI.model.today, date: document.getElementById('rb-date').textContent }));
    await page.clock.fastForward(65000);
    await sleep(500);
    const d1 = await page.evaluate(() => ({ today: window.UI.model.today, date: document.getElementById('rb-date').textContent, time: document.getElementById('rb-time').textContent, goblins: window.UI.model.counts.goblins }));
    check('midnight: tick moves the HUD and the model to the new Paris day (goblins re-aged)', d0.today === '2026-10-21' && d1.today === '2026-10-22' && /Jeu\.? 22 Oct/.test(d1.date) && d1.time === '00:00' && d1.goblins === 14, { d0, d1 });
    await ctx.close();
  }

  // ---- needs_reauth: HubSpot section shows the reconnect copy, page does not crash
  {
    const RUNNING = Object.assign({}, SEED, { siege: { startedAt: '2026-10-20T07:00:00.000Z', initialCount: 12, completedAt: null } });
    const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-reauth', vp: { width: 1440, height: 900 }, cfg: { reauth: true, seedState: RUNNING } });
    await waitBooted(page);
    const celR = await drainCelebrations(page, 1500);
    check('needs_reauth: an empty placeholder never wins a running siege (no fanfare, completedAt stays empty)', !celR.length && !(await page.evaluate(() => window.UI.state.siege.completedAt)), { celR, siege: await page.evaluate(() => window.UI.state.siege) });
    const r = await page.evaluate(() => ({ text: document.getElementById('rb-hubspot-error').textContent, visible: !!document.getElementById('rb-hubspot-error').getClientRects().length, ribbon: document.getElementById('rb-ribbon').hidden }));
    check('needs_reauth: HubSpot section says « Reconnectez HubSpot dans claude.ai → Réglages → Connecteurs. »', r.visible && /Reconnectez HubSpot dans claude\.ai → Réglages → Connecteurs\./.test(r.text), r);
    check('needs_reauth: reads were not retried (no retry on non-retryable code)', (await calls(page)).filter((c) => c.tool === 'search_crm_objects' && c.input.objectType === 'DEAL').length === 1);
    await page.screenshot({ path: join(TMP, 'reauth.png') });
    // Reconnect, then « Rafraîchir »: data arrives, the error clears, and no fake level-up is celebrated.
    await fake(page, () => window.__fake.setReauth(false));
    await page.click('#rb-refresh');
    await page.waitForFunction(() => window.UI.model.counts.goblins === 12, null, { timeout: 10000 }).catch(() => {});
    const celR2 = await drainCelebrations(page, 2500);
    const r2 = await page.evaluate(() => ({ err: document.getElementById('rb-hubspot-error').textContent.trim(), goblins: window.UI.model.counts.goblins, siege: window.UI.state.siege }));
    check('reconnect + refresh: data loads, the HubSpot error clears, siege still running', r2.goblins === 12 && !r2.err && !r2.siege.completedAt, r2);
    check('reconnect + refresh: no level-up celebrated for data that was merely missing', !celR2.some((c) => /Montée en grade/.test(c.title)) && celR2.some((c) => /Quête accomplie/.test(c.title)), celR2);
    await ctx.close();
  }

  // ---- write refused (approval_required): inline error + permissions button, panel stays open
  {
    const { ctx, page } = await newPage(browser, { mode: 'live', tag: 'live-approval', vp: { width: 1440, height: 900 }, cfg: { failWrites: true, seedState: Object.assign({}, SEED, { lastSeen: null }) } });
    await waitBooted(page);
    await drainCelebrations(page, 1500);
    await openMissive(page, '5003');
    await page.click('[data-fk="sent"]');
    await page.waitForSelector('.rb-err', { timeout: 5000 }).catch(() => {});
    const e = await page.evaluate(() => ({ open: !document.getElementById('rb-modal').hidden, err: (document.querySelector('#rb-modal-body .rb-err') || {}).textContent || '', goblins: window.UI.model.counts.goblins }));
    check('approval_required on a write: panel stays open with « Autorisation HubSpot refusée » + permissions button, no optimistic change', e.open && /Autorisation HubSpot refusée pour cette page/.test(e.err) && /Ouvrir les autorisations/.test(e.err) && e.goblins === 12, e);
    await page.click('#rb-modal-body .rb-err button');
    await sleep(600);
    check('approval_required: button opens permissions.manage()', (await fake(page, () => window.__fake.permissionsCalls)) === 1);
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------------------------
const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
try {
  await demoSuite(browser);
  await liveSuite(browser);
} catch (e) {
  check('harness ran to completion', false, String(e && e.stack || e));
} finally {
  await browser.close();
}
for (const k of ['demo', 'live']) {
  const errs = issues[k].filter((s) => !/console\.warning/.test(s));
  const warns = issues[k].filter((s) => /console\.warning/.test(s));
  check(`${k}: zero console errors / page errors / failed requests`, errs.length === 0, errs.slice(0, 12));
  if (warns.length) console.log(`  (${k}: ${warns.length} console warning(s))\n    ` + warns.slice(0, 8).join('\n    '));
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
writeFileSync(join(TMP, 'results.json'), JSON.stringify({ results, issues }, null, 2));
process.exit(failed.length ? 1 : 0);
