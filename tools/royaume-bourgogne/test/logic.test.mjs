// Royaume de Bourgogne - logic.js test suite.
// Run: node test/logic.test.mjs   (loads src/logic.js in a vm context with a minimal window)
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src', 'logic.js');
const CODE = fs.readFileSync(SRC, 'utf8');

function load(extra = {}) {
  const sb = { console, setTimeout, clearTimeout, ...extra };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(CODE, sb, { filename: 'logic.js' });
  return sb;
}
const J = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const eq = (a, b, msg) => assert.deepStrictEqual(J(a), b, msg);

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const FORBIDDEN_WORDS = ['écosystème', 'synergies', 'paradigme', 'disruptif', 'innovant'];
const FORBIDDEN_PHRASES = ['je me permets de revenir vers vous', "n'hésitez pas", "dans l'attente de votre retour"];
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const CHAT_INSIGHTS = { userIntent: 'Jeu de suivi commercial : lecture des deals et des tâches', satisfaction: 'NEUTRAL' };
const CALENDLY = 'https://calendly.com/thefrenchbot-coaching/30min';

// ---------------------------------------------------------------- fixtures
function mkTask(L, id, dueDay, extra = {}) {
  return { id: String(id), subject: 'Tâche ' + id, body: null, status: 'NOT_STARTED', dueAt: dueDay ? L.parisDateAt(dueDay, 8, 0).toISOString() : null, type: 'EMAIL', priority: 'MEDIUM', url: null, ...extra };
}
function mkDeal(id, extra = {}) {
  return { id: String(id), name: 'Client ' + id + ' - Projet', stage: 'contractsent', amount: 1000, closeDate: null, createDate: '2026-01-01T09:00:00Z', lastContact: null, nextActivity: null, lostReason: null, url: null, ...extra };
}
function raw(extra = {}) { return { deals: [], openTasks: [], completedTasks: [], fetchedAt: '2026-10-20T08:00:00Z', ...extra }; }

function fakeMcp(handler, servers = ['HubSpot', 'Gmail']) {
  const calls = [];
  return {
    calls,
    listTools: async () => ({ servers: servers.map((s) => ({ server: s, authStatus: 'connected', tools: [] })) }),
    callTool: async (server, tool, input, opts) => {
      calls.push({ server, tool, input: J(input), opts: J(opts) });
      return handler(server, tool, input, calls.length);
    },
  };
}
function live(caps) {
  const sb = load();
  sb.claude = { use: async (name) => (caps[name] === undefined ? null : caps[name]) };
  const sleeps = [];
  sb.DATA._env.sleep = async (ms) => { sleeps.push(ms); };
  sb.DATA._env.random = () => 0.5;
  return { sb, DATA: sb.DATA, LOGIC: sb.LOGIC, sleeps };
}
function fakeStorage({ throwing = false } = {}) {
  const map = new Map();
  return {
    map,
    getItem(k) { if (throwing) throw new Error('blocked'); return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { if (throwing) throw new Error('blocked'); map.set(k, String(v)); },
  };
}
function fakeDb() {
  const docs = new Map();
  const writes = [];
  const reads = [];
  const ctl = { hold: null, getError: null, setError: null };
  return {
    docs, writes, reads, ctl,
    doc(p) {
      return {
        path: p,
        get: async () => {
          reads.push(p);
          if (ctl.getError) throw ctl.getError;
          return { exists: docs.has(p), data: () => (docs.has(p) ? J(docs.get(p)) : undefined) };
        },
        set: async (d) => {
          if (ctl.setError) throw ctl.setError;
          writes.push({ path: p, data: J(d) });
          if (ctl.hold) await ctl.hold;
          docs.set(p, J(d));
        },
      };
    },
  };
}

// ==================================================================== calendar
test('parisDateAt is DST-correct (January UTC+1, July UTC+2, both transition days)', () => {
  const L = load().LOGIC;
  assert.equal(L.parisDateAt('2026-01-15', 8, 0).toISOString(), '2026-01-15T07:00:00.000Z');
  assert.equal(L.parisDateAt('2026-07-15', 8, 0).toISOString(), '2026-07-15T06:00:00.000Z');
  assert.equal(L.parisDateAt('2026-03-29', 8, 0).toISOString(), '2026-03-29T06:00:00.000Z');
  assert.equal(L.parisDateAt('2026-03-28', 23, 30).toISOString(), '2026-03-28T22:30:00.000Z');
  assert.equal(L.parisDateAt('2026-10-25', 8, 0).toISOString(), '2026-10-25T07:00:00.000Z');
  assert.equal(L.parisDateAt('2026-10-24', 8, 0).toISOString(), '2026-10-24T06:00:00.000Z');
  assert.equal(L.parisDateAt('2026-07-15', 0, 0).toISOString(), '2026-07-14T22:00:00.000Z');
  assert.equal(L.parisDateAt('pas une date', 8, 0), null);
});

test('parisDay near midnight UTC (winter and summer) and parisHour', () => {
  const L = load().LOGIC;
  assert.equal(L.parisDay('2026-01-15T22:59:00Z'), '2026-01-15');
  assert.equal(L.parisDay('2026-01-15T23:00:00Z'), '2026-01-16');
  assert.equal(L.parisDay('2026-07-15T21:59:59Z'), '2026-07-15');
  assert.equal(L.parisDay('2026-07-15T22:00:00Z'), '2026-07-16');
  assert.equal(L.parisDay(new Date('2026-12-31T23:30:00Z')), '2027-01-01');
  assert.equal(L.parisDay(Date.parse('2026-07-15T22:30:00Z')), '2026-07-16');
  assert.equal(L.parisDay('1784152800000'), L.parisDay(new Date(1784152800000)));
  assert.equal(L.parisDay('2026-10-20'), '2026-10-20');
  assert.equal(L.parisDay(null), null);
  assert.equal(L.parisDay('garbage'), null);
  assert.equal(L.parisHour('2026-07-15T06:30:00Z'), 8.5);
  assert.equal(L.parisHour('2026-01-15T06:30:00Z'), 7.5);
  assert.equal(L.parisHour('2026-01-15T23:15:00Z'), 0.25);
});

test('daysBetween counts Paris calendar days (incl. across DST) and addDays', () => {
  const L = load().LOGIC;
  assert.equal(L.daysBetween('2026-10-20', '2026-10-27'), 7);
  assert.equal(L.daysBetween('2026-10-27', '2026-10-20'), -7);
  assert.equal(L.daysBetween('2026-10-24', '2026-10-26'), 2);
  assert.equal(L.daysBetween('2026-03-28', '2026-03-30'), 2);
  assert.equal(L.daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.equal(L.daysBetween('2026-02-28', '2026-03-01'), 1);
  assert.equal(L.daysBetween('2026-01-15T23:30:00Z', '2026-01-16'), 0);
  assert.equal(L.addDays('2026-10-20', 120), '2027-02-17');
  assert.equal(L.addDays('2026-10-20', -1), '2026-10-19');
  assert.equal(L.isWeekday('2026-10-20'), true);
  assert.equal(L.isWeekday('2026-10-18'), false);
});

// ==================================================================== goblins & missives
test('goblin tiers at boundaries 1/6/7/29/30; today/upcoming/later lists', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-20T10:00:00Z');
  const today = '2026-10-20';
  const tasks = [
    mkTask(L, 'a', L.addDays(today, -1)), mkTask(L, 'b', L.addDays(today, -6)), mkTask(L, 'c', L.addDays(today, -7)),
    mkTask(L, 'd', L.addDays(today, -29)), mkTask(L, 'e', L.addDays(today, -30)), mkTask(L, 'f', today),
    mkTask(L, 'g', L.addDays(today, 14)), mkTask(L, 'h', L.addDays(today, 15)), mkTask(L, 'i', null),
    { ...mkTask(L, 'j', null), dueAt: '2026-10-19T21:30:00Z' }, // 23:30 Paris yesterday
    { ...mkTask(L, 'k', today), status: 'COMPLETED' },
  ];
  const m = L.buildModel(raw({ openTasks: tasks }), L.emptyState(), now);
  const tier = Object.fromEntries(m.missives.overdue.map((x) => [x.id, [x.daysOverdue, x.tier]]));
  eq(tier, { a: [1, 1], b: [6, 1], c: [7, 2], d: [29, 2], e: [30, 3], j: [1, 1] });
  eq(m.missives.overdue.map((x) => x.id), ['e', 'd', 'c', 'b', 'a', 'j'], 'oldest first');
  eq(m.missives.today.map((x) => x.id), ['f']);
  assert.equal(m.missives.today[0].tier, 0);
  eq(m.missives.upcoming.map((x) => x.id), ['g']);
  eq(m.missives.later.map((x) => x.id).sort(), ['h', 'i']);
  eq(m.counts.goblinsByTier, [3, 2, 1]);
  assert.equal(m.counts.goblins, 6);
  assert.equal(m.counts.missivesToday, 1);
  assert.equal(L.tierFor(0), 0);
});

test('WAITING tasks are never goblins and get their own list', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-20T10:00:00Z');
  const tasks = [
    { ...mkTask(L, 'w1', '2026-09-01'), status: 'WAITING' },
    { ...mkTask(L, 'w2', '2026-10-20'), status: 'WAITING' },
    mkTask(L, 'g1', '2026-10-10'),
  ];
  const m = L.buildModel(raw({ openTasks: tasks }), L.emptyState(), now);
  eq(m.missives.waiting.map((x) => x.id), ['w1', 'w2']);
  assert.equal(m.missives.waiting[0].tier, 0);
  eq(m.missives.overdue.map((x) => x.id), ['g1']);
  assert.equal(m.counts.goblins, 1);
  assert.equal(m.counts.missivesToday, 0);
  assert.equal(m.counts.waiting, 2);
});

// ==================================================================== quests & loyalty
test('hearts formula and cold flag for every stage; lastContact vs createDate; planned relance', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-20T10:00:00Z');
  const today = '2026-10-20';
  const stages = [['contractsent', 5, 4, 2.5], ['presentationscheduled', 7, 3, 3], ['qualifiedtobuy', 14, 2, 3], ['appointmentscheduled', 21, 1, 3], [null, 21, 0, 3], ['weirdstage', 21, 0, 3]];
  const deals = [];
  for (const [stage, T] of stages) {
    for (const d of [Math.floor(T / 2), T, T + 1, 2 * T, 3 * T]) {
      deals.push(mkDeal(`${stage}|${d}`, { stage, lastContact: L.parisDateAt(L.addDays(today, -d), 9, 0).toISOString(), createDate: '2025-01-01T09:00:00Z' }));
    }
  }
  const m = L.buildModel(raw({ deals }), L.emptyState(), now);
  const q = Object.fromEntries(m.quests.map((x) => [x.id, x]));
  for (const [stage, T, chapter, heartsAfter] of stages) {
    const k = (d) => q[`${stage}|${d}`];
    assert.equal(k(Math.floor(T / 2)).hearts, 5, `${stage} half`);
    assert.equal(k(Math.floor(T / 2)).cold, false);
    assert.equal(k(T).hearts, 3.5, `${stage} at threshold`);
    assert.equal(k(T).cold, false, `${stage} not cold at threshold`);
    assert.equal(k(T + 1).cold, true, `${stage} cold after threshold`);
    assert.equal(k(T + 1).hearts, heartsAfter, `${stage} T+1`);
    assert.equal(k(2 * T).hearts, 0);
    assert.equal(k(3 * T).hearts, 0);
    assert.equal(k(T).threshold, T);
    assert.equal(k(T).chapter, chapter);
    assert.equal(k(T).daysSinceContact, T);
  }
  assert.equal(L.hearts(4, 7), 5, 'rounded to nearest half');
  assert.equal(L.hearts(9, 14), 4.5);
  // ordering: chapter desc, then cold first
  assert.equal(m.quests[0].chapter, 4);
  assert.equal(m.quests[0].cold, true);
  assert.equal(m.quests[m.quests.length - 1].chapter, 0);

  const m2 = L.buildModel(raw({ deals: [
    mkDeal('n1', { stage: 'qualifiedtobuy', createDate: '2026-10-18T09:00:00Z', lastContact: null }),
    mkDeal('n2', { stage: 'qualifiedtobuy', createDate: '2026-10-17T09:00:00Z', lastContact: '2026-09-01T09:00:00Z' }),
    mkDeal('n3', { name: 'Fromagerie Test — Formation', stage: 'contractsent', lastContact: '2026-10-19T09:00:00Z', nextActivity: '2026-10-25T08:00:00Z' }),
    mkDeal('n4', { name: 'Sans séparateur', stage: 'contractsent', lastContact: '2026-10-19T09:00:00Z', nextActivity: '2026-10-01T08:00:00Z' }),
    mkDeal('won', { stage: 'closedwon' }), mkDeal('lost', { stage: 'closedlost' }),
  ] }), L.emptyState(), now);
  const q2 = Object.fromEntries(m2.quests.map((x) => [x.id, x]));
  assert.equal(q2.n1.daysSinceContact, 2, 'null lastContact uses createDate');
  assert.equal(q2.n2.daysSinceContact, 3, 'max(lastContact, createDate)');
  assert.equal(q2.n3.client, 'Fromagerie Test');
  assert.equal(q2.n3.nextActivityDay, '2026-10-25');
  assert.equal(q2.n3.planned, true);
  assert.equal(q2.n4.client, 'Sans séparateur');
  assert.equal(q2.n4.nextActivityDay, null, 'past next activity is not a planned relance');
  assert.equal(m2.counts.openQuests, 4, 'won/lost are not quests');
  assert.equal(q2.n3.chapterLabel, 'Chapitre IV — « Le Sceau »');
});

// ==================================================================== levels
test('levelFromXp boundaries and heroTitle ladder', () => {
  const L = load().LOGIC;
  const lv = (x) => { const r = L.levelFromXp(x); return [r.level, r.floor, r.next]; };
  eq(lv(0), [1, 0, 100]);
  eq(lv(-50), [1, 0, 100]);
  eq(lv(99), [1, 0, 100]);
  eq(lv(100), [2, 100, 380]);
  eq(lv(379), [2, 100, 380]);
  eq(lv(380), [3, 380, 770]);
  eq(lv(6899), [8, 4800, 6900]);
  eq(lv(6900), [9, 6900, 10000]);
  eq(lv(9999), [9, 6900, 10000]);
  eq(lv(10000), [10, 10000, null]);
  eq(lv(15000), [10, 10000, null]);
  eq(lv(999999), [10, 10000, null]);
  assert.equal(L.levelFromXp(150).xp, 150);
  const titles = { 3: 'Écuyer', 5: 'Écuyer', 6: 'Chevalier', 9: 'Chevalier', 10: 'Chevalier banneret', 13: 'Chevalier banneret', 14: 'Baron', 17: 'Baron', 18: 'Vicomte', 21: 'Vicomte', 22: 'Comte', 25: 'Comte', 26: 'Marquis', 29: 'Marquis', 30: 'Duc de Bourgogne' };
  for (const [lvl, t] of Object.entries(titles)) assert.equal(L.heroTitle(Number(lvl)), t, `level ${lvl}`);
});

test('XP totals on a crafted dataset (on-time bonus, abattus, perfect days, siege bonus, closing, prospection)', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-21T10:00:00Z'); // Wednesday
  const completedTasks = [
    { id: 'c1', dueAt: '2026-10-05T06:00:00Z', completedAt: '2026-10-05T21:30:00Z' }, // 23:30 Paris same day -> on time (30)
    { id: 'c2', dueAt: '2026-10-05T06:00:00Z', completedAt: '2026-10-05T22:30:00Z' }, // 00:30 Paris next day -> late (20)
    { id: 'c3', dueAt: '2026-10-01T06:00:00Z', completedAt: '2026-09-30T08:00:00Z' }, // abattu -> 5
    { id: 'c4', dueAt: '2026-10-02T06:00:00Z', completedAt: null }, // 20
    { id: 'c5', dueAt: null, completedAt: '2026-10-02T08:00:00Z' }, // 20
    { id: 'c1', dueAt: '2026-10-05T06:00:00Z', completedAt: '2026-10-05T21:30:00Z' }, // duplicate ignored
  ];
  const deals = [
    mkDeal('w1', { stage: 'closedwon', amount: 3200 }), mkDeal('w2', { stage: 'closedwon', amount: null }), mkDeal('w3', { stage: 'closedwon', amount: 1010 }),
    mkDeal('l1', { stage: 'closedlost', lostReason: 'Budget' }), mkDeal('l2', { stage: 'closedlost', lostReason: null }), mkDeal('l3', { stage: 'closedlost', lostReason: '   ' }),
    mkDeal('o1', { stage: 'qualifiedtobuy' }),
  ];
  const state = { ...L.emptyState(), abattus: ['c3'], perfectDays: ['2026-10-18', '2026-10-19', '2026-10-20'],
    siege: { startedAt: '2026-10-01T08:00:00Z', initialCount: 11, completedAt: '2026-10-10T08:00:00Z', bonusAwarded: true } };
  const m = L.buildModel(raw({ deals, completedTasks }), state, now);
  // 30 + 20 + 5 + 20 + 20 = 95 ; perfect days Mon+Tue = 100 (Sunday ignored) ; siege 500
  assert.equal(m.hero.skills.relance.xp, 695);
  assert.equal(m.hero.skills.relance.level, 3);
  // 210 + 50 + 101 + 10 = 371
  assert.equal(m.hero.skills.closing.xp, 371);
  assert.equal(m.hero.skills.closing.level, 2);
  assert.equal(m.hero.skills.prospection.xp, 175);
  assert.equal(m.hero.level, 7);
  assert.equal(m.hero.title, 'Chevalier');
  eq([m.hero.stats.completed, m.hero.stats.onTime, m.hero.stats.slain, m.hero.stats.lostWithReason], [4, 1, 1, 1]);
  assert.equal(m.hero.name, 'Sire Julian de Bourgogne');
});

test('tasks handled in-game today: hidden from stale reads and counted once (virtual XP)', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-20T10:00:00Z');
  const today = '2026-10-20';
  let st = L.emptyState();
  st = L.recordAction(st, { type: 'sent', id: 't1', day: today });
  st = L.recordAction(st, { type: 'slain', id: 't2', day: today });
  st = L.recordAction(st, { type: 'postponed', id: 't3', day: today });
  st = L.recordAction(st, { type: 'postponed', id: 't4', day: today });
  const tasks = [mkTask(L, 't1', today), mkTask(L, 't2', '2026-10-01'), mkTask(L, 't3', '2026-10-15'), mkTask(L, 't4', '2026-10-27'), mkTask(L, 't5', '2026-10-15')];
  const m = L.buildModel(raw({ openTasks: tasks }), st, now);
  eq(m.missives.overdue.map((x) => x.id), ['t5']);
  eq(m.missives.today.map((x) => x.id), []);
  eq(m.missives.upcoming.map((x) => x.id), ['t4'], 'fresh postponed task stays visible at its new date');
  // t1 sent on time (+30), t2 slain (+5); today perfect (no missive due today left, 4 actions) -> +50
  assert.equal(m.hero.perfectToday, true);
  assert.equal(m.hero.skills.relance.xp, 85);
  // once HubSpot reflects the completion, no double count
  const m2 = L.buildModel(raw({ openTasks: [tasks[4]], completedTasks: [{ id: 't1', dueAt: tasks[0].dueAt, completedAt: '2026-10-20T09:00:00Z' }, { id: 't2', dueAt: tasks[1].dueAt, completedAt: '2026-10-20T09:01:00Z' }] }), st, now);
  assert.equal(m2.hero.skills.relance.xp, 85);
});

// ==================================================================== season & treasure
test('season gold counts only won deals closed in the current Paris month', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-20T10:00:00Z');
  const deals = [
    mkDeal('a', { stage: 'closedwon', amount: 1000, closeDate: '2026-09-30T22:30:00Z' }), // Oct 1st 00:30 Paris
    mkDeal('b', { stage: 'closedwon', amount: 2000, closeDate: '2026-09-30T21:59:00Z' }), // Sep 30 23:59 Paris
    mkDeal('c', { stage: 'closedwon', amount: 4000, closeDate: '2025-10-15T10:00:00Z' }), // last year
    mkDeal('d', { stage: 'closedwon', amount: 8000, closeDate: '2026-10-31T23:30:00Z' }), // Nov 1st Paris
    mkDeal('e', { stage: 'closedwon', amount: 500, closeDate: '2026-10-19T08:00:00Z' }),
    mkDeal('f', { stage: 'closedlost', amount: 9999, closeDate: '2026-10-19T08:00:00Z' }),
    mkDeal('g', { stage: 'contractsent', amount: 9999, closeDate: '2026-10-19T08:00:00Z' }),
  ];
  const m = L.buildModel(raw({ deals }), L.emptyState(), now);
  assert.equal(m.season.gold, 1500);
  eq(m.season.won.map((d) => d.id), ['e', 'a']);
  assert.equal(m.season.key, '2026-10');
  assert.equal(m.season.name, 'Les Pressoirs');
  assert.equal(m.season.monthLabel, 'Octobre');
  assert.equal(m.season.goal, 15000);
  assert.equal(m.season.pct, 0.1);
  assert.equal(m.season.daysLeft, 12);
  assert.equal(m.treasureAllTime, 15500);
  const jan = L.buildModel(raw({ deals }), L.emptyState(), new Date('2027-01-05T10:00:00Z'));
  assert.equal(jan.season.name, 'Le Grand Froid');
  assert.equal(jan.season.gold, 0);
  assert.equal(jan.season.daysLeft, 27);
  eq(L.CONFIG.seasons.length, 12);
});

// ==================================================================== perfect day & streak
test('streak skips weekends, today counts only once perfect, a missed weekday breaks it', () => {
  const L = load().LOGIC;
  const days = ['2026-10-15', '2026-10-16', '2026-10-19', '2026-10-20']; // Thu Fri | Mon Tue ; Wed 14 missed
  assert.equal(L.streak(days, '2026-10-21', false), 4, 'today (Wed) not perfect yet does not break');
  assert.equal(L.streak(days, '2026-10-21', true), 5);
  assert.equal(L.streak(['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-16'], '2026-10-19', false), 2, 'Wed 14 missed breaks');
  assert.equal(L.streak(['2026-10-15', '2026-10-16'], '2026-10-18', true), 2, 'Sunday today');
  assert.equal(L.streak(['2026-10-19'], '2026-10-21', false), 0, 'yesterday (Tue) missed');
  assert.equal(L.streak([], '2026-10-21', false), 0);

  const now = new Date('2026-10-21T15:00:00Z');
  let st = { ...L.emptyState(), perfectDays: days.slice(), actions: { '2026-10-21': 1 } };
  const m = L.buildModel(raw({ openTasks: [mkTask(L, 'up', '2026-10-23')] }), st, now);
  assert.equal(m.hero.perfectToday, true);
  assert.equal(m.hero.streak, 5);
  eq(m.hero.perfectDays, [...days, '2026-10-21']);
  const st2 = L.checkSiege(m, st, now);
  eq(st2.perfectDays, [...days, '2026-10-21'], 'checkSiege persists today');
  const m3 = L.buildModel(raw({ openTasks: [mkTask(L, 'due', '2026-10-21')] }), st2, now);
  assert.equal(m3.hero.perfectToday, false, 'a missive due today is still open');
  assert.equal(m3.hero.streak, 4);
  eq(L.checkSiege(m3, st2, now).perfectDays, days, 'today removed again (not over yet)');
  const noAction = L.buildModel(raw({}), { ...L.emptyState(), actions: {} }, now);
  assert.equal(noAction.hero.perfectToday, false, 'needs at least one action');
  const weekend = L.buildModel(raw({}), { ...L.emptyState(), actions: { '2026-10-24': 3 } }, new Date('2026-10-24T12:00:00Z'));
  assert.equal(weekend.hero.perfectToday, false, 'weekends are never perfect days');
});

// ==================================================================== siege
test('siege: start at >= 10 goblins, progress, completion with +500 exactly once', () => {
  const L = load().LOGIC;
  const t0 = new Date('2026-10-20T08:00:00Z');
  const overdue = (n) => Array.from({ length: n }, (_, i) => mkTask(L, 'g' + i, L.addDays('2026-10-20', -(i + 1))));

  const fresh = L.emptyState();
  const m9 = L.buildModel(raw({ openTasks: overdue(9) }), fresh, t0);
  assert.equal(m9.siege.active, false);
  assert.equal(L.checkSiege(m9, fresh, t0), fresh, 'no change -> same object');

  const m10 = L.buildModel(raw({ openTasks: overdue(10) }), fresh, t0);
  assert.equal(m10.siege.active, true);
  assert.equal(m10.siege.eligible, true);
  let st = L.checkSiege(m10, fresh, t0);
  eq(st.siege, { startedAt: '2026-10-20T08:00:00.000Z', initialCount: 10, completedAt: null, bonusAwarded: false });
  assert.notEqual(st, fresh);

  const t1 = new Date('2026-10-20T09:00:00Z');
  const m3 = L.buildModel(raw({ openTasks: overdue(3) }), st, t1);
  eq([m3.siege.active, m3.siege.total, m3.siege.initialCount, m3.siege.defeated], [true, 3, 10, 7]);
  assert.equal(L.checkSiege(m3, st, t1), st);

  const m12 = L.buildModel(raw({ openTasks: overdue(12) }), st, t1);
  st = L.checkSiege(m12, st, t1);
  assert.equal(st.siege.initialCount, 12, 'initialCount never below current goblins');

  const base = L.buildModel(raw({}), L.emptyState(), t1).hero.skills.relance.xp;
  const t2 = new Date('2026-10-20T10:00:00Z');
  const m0 = L.buildModel(raw({}), st, t2);
  assert.equal(m0.siege.won, true);
  assert.equal(m0.siege.active, false);
  assert.equal(m0.hero.skills.relance.xp, base + 500, 'bonus visible in the same build');
  st = L.checkSiege(m0, st, t2);
  eq(st.siege, { startedAt: '2026-10-20T08:00:00.000Z', initialCount: 12, completedAt: '2026-10-20T10:00:00.000Z', bonusAwarded: true });
  assert.equal(L.checkSiege(L.buildModel(raw({}), st, t2), st, t2), st, 'idempotent');

  const m15 = L.buildModel(raw({ openTasks: overdue(15) }), st, t2);
  assert.equal(m15.siege.active, false, 'never restarts once won');
  assert.equal(m15.siege.eligible, false);
  assert.equal(L.checkSiege(m15, st, t2).siege.completedAt, '2026-10-20T10:00:00.000Z');
  assert.equal(L.buildModel(raw({}), st, t2).hero.skills.relance.xp, base + 500, '+500 only once');
});

// ==================================================================== observe & chronicle
test('observe: first run stores baseline without events, then detects won/lost', () => {
  const L = load().LOGIC;
  const t0 = new Date('2026-10-10T08:00:00Z');
  const d1 = mkDeal('d1', { stage: 'contractsent', amount: 3200 });
  const d2 = mkDeal('d2', { stage: 'presentationscheduled' });
  const d3 = mkDeal('d3', { stage: 'closedwon', closeDate: '2026-09-01T10:00:00Z' });
  let r1 = L.observe(raw({ deals: [d1, d2, d3] }), L.emptyState(), t0);
  eq(r1.events, []);
  eq(r1.state.lastSeen, { d1: 'contractsent', d2: 'presentationscheduled', d3: 'closedwon' });
  assert.equal(r1.state.observedAt, '2026-10-10T08:00:00.000Z');
  const first = L.observe(raw({ deals: [d1, d2, d3] }), null, t0);
  eq(first.events, [], 'null state = first run');

  const again = L.observe(raw({ deals: [d1, d2, d3] }), r1.state, new Date('2026-10-11T08:00:00Z'));
  eq(again.events, []);
  assert.equal(again.state, r1.state, 'unchanged baseline -> same object');

  const t2 = new Date('2026-10-20T08:00:00Z');
  const won = { ...d1, stage: 'closedwon', closeDate: '2026-10-19T09:00:00Z' };
  const lost = { ...d2, stage: 'closedlost', closeDate: '2026-10-18T09:00:00Z', lostReason: 'Pas le bon moment' };
  const r2 = L.observe(raw({ deals: [won, lost, d3] }), r1.state, t2);
  eq(r2.events.map((e) => [e.type, e.deal.id]), [['lost', 'd2'], ['won', 'd1']]);
  const lostEv = r2.events[0];
  eq([lostEv.lostDay, lostEv.reconquestDay, lostEv.reason], ['2026-10-18', '2027-02-15', 'Pas le bon moment']);
  assert.equal(r2.events[1].amount, 3200);
  eq(r2.state.lastSeen, { d1: 'closedwon', d2: 'closedlost', d3: 'closedwon' });

  const t3 = new Date('2026-10-22T08:00:00Z');
  const fresh = mkDeal('d4', { stage: 'closedwon', closeDate: '2026-10-21T09:00:00Z', createDate: '2026-10-21T08:00:00Z' });
  const old = mkDeal('d5', { stage: 'closedwon', closeDate: '2025-01-01T09:00:00Z', createDate: '2024-12-01T08:00:00Z' });
  const r3 = L.observe(raw({ deals: [won, lost, d3, fresh, old] }), r2.state, t3);
  eq(r3.events.map((e) => e.deal.id), ['d4'], 'unknown deal closed after last baseline only');

  const many = Array.from({ length: 700 }, (_, i) => mkDeal('m' + i, { stage: i % 2 ? 'closedwon' : 'contractsent', closeDate: '2026-01-01T00:00:00Z' }));
  const big = L.observe(raw({ deals: many }), L.emptyState(), t3);
  assert.equal(Object.keys(big.state.lastSeen).length, 500, 'lastSeen bounded to 500');
  assert.equal(Object.values(big.state.lastSeen).filter((s) => s === 'contractsent').length, 350, 'open deals kept first');
});

test('chronicle: reconquest day = loss day + 120, due flag, launched/dismissed', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-20T10:00:00Z');
  const deals = [
    mkDeal('L1', { stage: 'closedlost', closeDate: '2026-06-17T10:00:00Z', lostReason: 'Budget gelé' }),
    mkDeal('L2', { stage: 'closedlost', closeDate: '2026-09-30T10:00:00Z', lostReason: null }),
  ];
  let st = L.emptyState();
  let m = L.buildModel(raw({ deals }), st, now);
  const c = Object.fromEntries(m.chronicle.map((x) => [x.deal.id, x]));
  eq([c.L1.lostDay, c.L1.reconquestDay, c.L1.reconquestDue, c.L1.reason], ['2026-06-17', '2026-10-15', true, 'Budget gelé']);
  eq([c.L2.lostDay, c.L2.reconquestDay, c.L2.reconquestDue], ['2026-09-30', '2027-01-28', false]);
  eq(m.reconquestsDue.map((x) => x.deal.id), ['L1']);
  assert.equal(m.counts.reconquestsDue, 1);
  st = L.recordAction(st, { type: 'reconquest', id: 'L1', day: '2026-10-20' });
  m = L.buildModel(raw({ deals }), st, now);
  eq(m.reconquestsDue, []);
  assert.equal(m.chronicle.find((x) => x.deal.id === 'L1').reconquestState, 'launched');
  st = L.recordAction(st, { type: 'reconquest', id: 'L1', status: 'dismissed' });
  assert.equal(st.reconquests.L1, 'dismissed');
});

// ==================================================================== recordAction & state
test('recordAction is pure, tracks actions/todayDoneIds/abattus, supports undo', () => {
  const L = load().LOGIC;
  const s0 = L.emptyState();
  const snap = J(s0);
  const s1 = L.recordAction(s0, { type: 'sent', id: 't1', day: '2026-10-20' });
  eq(s0, snap, 'input untouched');
  eq(s1.actions, { '2026-10-20': 1 });
  eq(s1.todayDoneIds, { day: '2026-10-20', ids: ['t1'], kinds: { t1: 'sent' } });
  const s2 = L.recordAction(s1, { type: 'slain', id: 't2', day: '2026-10-20' });
  eq(s2.abattus, ['t2']);
  const s3 = L.recordAction(s2, { type: 'postponed', id: 777, day: '2026-10-20' });
  eq(s3.actions, { '2026-10-20': 3 });
  eq(s3.todayDoneIds.ids, ['t1', 't2', '777']);
  const s4 = L.recordAction(s3, { type: 'undo', id: 't2', day: '2026-10-20' });
  eq([s4.actions, s4.abattus, s4.todayDoneIds.ids], [{ '2026-10-20': 2 }, [], ['t1', '777']]);
  const s5 = L.recordAction(s4, { type: 'sent', id: 't9', day: '2026-10-21' });
  eq(s5.todayDoneIds, { day: '2026-10-21', ids: ['t9'], kinds: { t9: 'sent' } });
  eq(s5.actions, { '2026-10-20': 2, '2026-10-21': 1 });
  assert.throws(() => L.recordAction(s0, { type: 'sent', id: 'x' }), /day/);
  assert.throws(() => L.recordAction(s0, { type: 'nope', id: 'x', day: '2026-10-20' }), /inconnu/);
});

test('state normalization: merges missing fields, bounds lists, keeps unknown UI keys', () => {
  const L = load().LOGIC;
  const st = L.normalizeState({ v: 1, abattus: Array.from({ length: 2500 }, (_, i) => 'a' + i), muted: true, uiTab: 'quests',
    perfectDays: Array.from({ length: 260 }, (_, i) => L.addDays('2025-01-01', i)), siege: { completedAt: '2026-01-01T00:00:00Z' } });
  assert.equal(st.abattus.length, 2000);
  assert.equal(st.abattus[0], 'a500');
  assert.equal(st.perfectDays.length, 200);
  assert.equal(st.lastSeen, null);
  eq(st.todayDoneIds, { day: null, ids: [], kinds: {} });
  eq(st.reconquests, {});
  assert.equal(st.muted, true);
  assert.equal(st.seenIntro, false);
  assert.equal(st.uiTab, 'quests');
  eq(st.siege, { startedAt: null, initialCount: 0, completedAt: '2026-01-01T00:00:00Z', bonusAwarded: true });
  eq(L.normalizeState(null), J(L.emptyState()));
  assert.ok(JSON.stringify(L.compactState(st)).length < 256 * 1024);
});

// ==================================================================== DATA live: loadAll
function hubspotHandler({ dealsTotal = 250, failCompleted = null } = {}) {
  return (server, tool, input) => {
    assert.equal(server, 'HubSpot');
    assert.equal(tool, 'search_crm_objects');
    const tpl = 'https://app.hubspot.com/contacts/42/record/0-3/{id}';
    if (input.objectType === 'DEAL') {
      const off = input.offset || 0;
      const n = Math.max(0, Math.min(200, dealsTotal - off));
      const results = Array.from({ length: n }, (_, k) => {
        const i = off + k + 1;
        return { id: i, displayName: 'D' + i, properties: { dealname: 'Client ' + i + ' - Projet', dealstage: i % 2 ? 'contractsent' : '', amount: i % 2 ? '3200' : '', closedate: '', createdate: '2026-01-01T10:00:00Z', notes_last_contacted: '2026-10-01T10:00:00Z', notes_next_activity_date: '', closed_lost_reason: '' } };
      });
      return { payload: { results, total: dealsTotal, offset: off + n, urlTemplate: tpl } };
    }
    if (input.objectType === 'TASK' && input.filterGroups[0].filters[0].operator === 'NEQ') {
      return { payload: { results: [
        { id: 9001, properties: { hs_task_subject: 'Relance devis', hs_task_body: '<p>Bonjour&nbsp;! Devis D-1 &amp; co</p>', hs_task_status: 'NOT_STARTED', hs_timestamp: '2026-10-19T06:00:00Z', hs_task_type: 'EMAIL', hs_task_priority: '' } },
        { id: 9002, properties: { hs_task_subject: '', hs_task_body: '', hs_task_status: 'WAITING', hs_timestamp: '2026-10-25T06:00:00Z', hs_task_type: 'CALL' } },
      ], total: 2, offset: 2, urlTemplate: 'https://app.hubspot.com/tasks/42/view/all/task/{id}' } };
    }
    if (input.objectType === 'TASK') {
      if (failCompleted) throw failCompleted;
      return { payload: { results: [{ id: 8001, properties: { hs_timestamp: '2026-10-01T06:00:00Z', hs_task_completion_date: '2026-10-01T15:00:00Z' } }], total: 1, offset: 1 } };
    }
    throw new Error('unexpected ' + JSON.stringify(input));
  };
}

test('loadAll (live): exact HubSpot inputs, paging with offset, normalization, urlTemplate', async () => {
  const mcp = fakeMcp(hubspotHandler());
  const { DATA } = live({ mcp });
  const init = await DATA.init();
  eq(init, { mode: 'live', can: { hubspot: true, gmail: true, scribe: false, db: false }, storage: 'memory' });
  const r = await DATA.loadAll();
  const deals = mcp.calls.filter((c) => c.input.objectType === 'DEAL');
  assert.equal(deals.length, 2);
  const dealProps = ['dealname', 'dealstage', 'amount', 'closedate', 'createdate', 'notes_last_contacted', 'notes_next_activity_date', 'closed_lost_reason'];
  eq(deals[0].input, { objectType: 'DEAL', properties: dealProps, limit: 200, chatInsights: CHAT_INSIGHTS });
  eq(deals[1].input, { objectType: 'DEAL', properties: dealProps, limit: 200, offset: 200, chatInsights: CHAT_INSIGHTS });
  const open = mcp.calls.find((c) => c.input.objectType === 'TASK' && c.input.filterGroups[0].filters[0].operator === 'NEQ');
  eq(open.input, { objectType: 'TASK', properties: ['hs_task_subject', 'hs_task_body', 'hs_task_status', 'hs_timestamp', 'hs_task_type', 'hs_task_priority'], limit: 200,
    filterGroups: [{ filters: [{ propertyName: 'hs_task_status', operator: 'NEQ', value: 'COMPLETED' }] }],
    sorts: [{ propertyName: 'hs_timestamp', direction: 'ASCENDING' }], chatInsights: CHAT_INSIGHTS });
  const done = mcp.calls.find((c) => c.input.objectType === 'TASK' && c.input.filterGroups[0].filters[0].operator === 'EQ');
  eq(done.input, { objectType: 'TASK', properties: ['hs_timestamp', 'hs_task_completion_date'], limit: 200,
    filterGroups: [{ filters: [{ propertyName: 'hs_task_status', operator: 'EQ', value: 'COMPLETED' }] }],
    sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }], chatInsights: CHAT_INSIGHTS });
  for (const c of mcp.calls) eq(c.opts, { cache: false });
  assert.equal(mcp.calls.length, 4);

  assert.equal(r.deals.length, 250);
  eq(r.deals[0], { id: '1', name: 'Client 1 - Projet', stage: 'contractsent', amount: 3200, closeDate: null, createDate: '2026-01-01T10:00:00Z', lastContact: '2026-10-01T10:00:00Z', nextActivity: null, lostReason: null, url: 'https://app.hubspot.com/contacts/42/record/0-3/1' });
  eq([r.deals[1].stage, r.deals[1].amount], [null, null]);
  eq(r.openTasks[0], { id: '9001', subject: 'Relance devis', body: 'Bonjour ! Devis D-1 & co', status: 'NOT_STARTED', dueAt: '2026-10-19T06:00:00Z', type: 'EMAIL', priority: null, url: 'https://app.hubspot.com/tasks/42/view/all/task/9001' });
  eq([r.openTasks[1].subject, r.openTasks[1].body, r.openTasks[1].status, r.openTasks[1].priority], [null, null, 'WAITING', null]);
  eq(r.completedTasks, [{ id: '8001', dueAt: '2026-10-01T06:00:00Z', completedAt: '2026-10-01T15:00:00Z' }]);
  assert.equal(r.partial, undefined);
  assert.ok(typeof r.fetchedAt === 'string');
});

test('loadAll (live): 6-page cap marks partial; completed-tasks failure is contained', async () => {
  const mcp = fakeMcp(hubspotHandler({ dealsTotal: 5000, failCompleted: { code: 'tool_error', server: 'HubSpot', message: 'boom' } }));
  const { DATA } = live({ mcp });
  const r = await DATA.loadAll();
  const deals = mcp.calls.filter((c) => c.input.objectType === 'DEAL');
  assert.equal(deals.length, 6);
  assert.ok(!('offset' in deals[0].input), 'first page has no offset');
  eq(deals.map((c) => c.input.offset ?? null), [null, 200, 400, 600, 800, 1000]);
  assert.equal(r.deals.length, 1200);
  assert.equal(r.partial.deals, true);
  assert.equal(r.partial.completedTasks, true);
  eq(r.completedTasks, []);
  assert.equal(r.partial.completedTasksError.code, 'tool_error');
});

// ==================================================================== DATA live: writes
test('completeTask / reopenTask / rescheduleTask send the exact manage_crm_objects payload (08:00 Paris, DST)', async () => {
  const mcp = fakeMcp(() => ({ payload: { ok: true } }));
  const { DATA } = live({ mcp });
  await DATA.completeTask('123');
  await DATA.reopenTask({ id: '123' });
  const w = await DATA.rescheduleTask('123', '2027-01-12');
  const s = await DATA.rescheduleTask(123, '2027-07-12');
  assert.equal(w.dueAt, '2027-01-12T07:00:00.000Z');
  assert.equal(s.dueAt, '2027-07-12T06:00:00.000Z');
  const obj = (props) => ({ confirmationStatus: 'CONFIRMED', updateRequest: { objects: [{ objectType: 'tasks', objectId: 123, properties: props }] } });
  eq(mcp.calls.map((c) => [c.server, c.tool, c.input, c.opts]), [
    ['HubSpot', 'manage_crm_objects', obj({ hs_task_status: 'COMPLETED' }), { cache: false }],
    ['HubSpot', 'manage_crm_objects', obj({ hs_task_status: 'NOT_STARTED' }), { cache: false }],
    ['HubSpot', 'manage_crm_objects', obj({ hs_timestamp: '2027-01-12T07:00:00.000Z' }), { cache: false }],
    ['HubSpot', 'manage_crm_objects', obj({ hs_timestamp: '2027-07-12T06:00:00.000Z' }), { cache: false }],
  ]);
  assert.equal(typeof mcp.calls[0].input.updateRequest.objects[0].objectId, 'number');
});

test('reads retry once after 1-3 s (honoring retryAfterMs in full, none beyond the 10 s budget); writes never retry', async () => {
  // read: retryable then success
  {
    let n = 0;
    const base = hubspotHandler({ dealsTotal: 3 });
    const mcp = fakeMcp((srv, tool, input) => {
      if (input.objectType === 'DEAL' && n++ === 0) throw { code: 'server_unavailable', server: 'HubSpot', message: 'down', retryable: true, retryAfterMs: 2500 };
      return base(srv, tool, input);
    });
    const { DATA, sleeps } = live({ mcp });
    const r = await DATA.loadAll();
    assert.equal(r.deals.length, 3);
    eq(sleeps, [2500]);
    assert.equal(mcp.calls.filter((c) => c.input.objectType === 'DEAL').length, 2);
  }
  // default delay is random in [1000, 3000); retryAfterMs is the earliest retry: honoured in full (never shortened)
  {
    let n = 0;
    const base = hubspotHandler({ dealsTotal: 3 });
    const mcp = fakeMcp((srv, tool, input) => {
      if (input.objectType === 'DEAL' && n++ === 0) throw { code: 'upstream_error', server: 'HubSpot', message: 'consent', retryable: true, retryAfterMs: 9000 };
      return base(srv, tool, input);
    });
    const { DATA, sleeps } = live({ mcp });
    await DATA.loadAll();
    eq(sleeps, [9000]);
    // beyond the 10 s budget: no automatic retry, the error goes to the section (manual « Réessayer »)
    let k = 0;
    const slow = fakeMcp((srv, tool, input) => {
      if (input.objectType === 'DEAL' && k++ === 0) throw { code: 'upstream_error', server: 'HubSpot', message: 'consent', retryable: true, retryAfterMs: 20000 };
      return base(srv, tool, input);
    });
    const { DATA: D3, sleeps: s3 } = live({ mcp: slow });
    await assert.rejects(D3.loadAll(), (e) => e.code === 'upstream_error' && e.retryAfterMs === 20000);
    eq(s3, []);
    assert.equal(slow.calls.filter((c) => c.input.objectType === 'DEAL').length, 1);
    const { DATA: D2, sleeps: s2, sb } = live({ mcp: fakeMcp(((k) => (srv, tool, input) => { if (input.objectType === 'DEAL' && k++ === 0) throw { code: 'server_unavailable', server: 'HubSpot', message: 'x', retryable: true }; return base(srv, tool, input); })(0)) });
    sb.DATA._env.random = () => 0.999;
    await D2.loadAll();
    assert.ok(s2[0] >= 1000 && s2[0] < 3000, 'random 1-3 s: ' + s2[0]);
  }
  // read: fails twice -> one retry only, normalized rejection
  {
    const mcp = fakeMcp((srv, tool, input) => { if (input.objectType === 'DEAL') throw { code: 'server_unavailable', server: 'HubSpot', message: 'down', retryable: true }; return hubspotHandler()(srv, tool, input); });
    const { DATA } = live({ mcp });
    await assert.rejects(DATA.loadAll(), (e) => { eq(e, { code: 'server_unavailable', server: 'HubSpot', message: 'down', retryable: true, retryAfterMs: null, source: 'mcp' }); return true; });
    assert.equal(mcp.calls.filter((c) => c.input.objectType === 'DEAL').length, 2);
  }
  // non-retryable read errors: no retry
  for (const err of [{ code: 'needs_reauth', server: 'HubSpot', message: 'auth' }, { code: 'upstream_error', server: 'HubSpot', message: 'x' }]) {
    const mcp = fakeMcp((srv, tool, input) => { if (input.objectType === 'DEAL') throw err; return hubspotHandler()(srv, tool, input); });
    const { DATA, sleeps } = live({ mcp });
    await assert.rejects(DATA.loadAll(), (e) => e.code === err.code);
    assert.equal(mcp.calls.filter((c) => c.input.objectType === 'DEAL').length, 1);
    eq(sleeps, []);
  }
  // write: retryable error is NOT retried
  {
    const mcp = fakeMcp(() => { throw { code: 'server_unavailable', server: 'HubSpot', message: 'timeout', retryable: true, retryAfterMs: 1000 }; });
    const { DATA, sleeps } = live({ mcp });
    await assert.rejects(DATA.completeTask('5'), (e) => e.code === 'server_unavailable' && e.write === true && e.server === 'HubSpot');
    await assert.rejects(DATA.rescheduleTask('5', '2026-11-02'), (e) => e.code === 'server_unavailable');
    assert.equal(mcp.calls.length, 2);
    eq(sleeps, []);
  }
});

// ==================================================================== DATA live: scribe context
function contextHandler({ gmailSearchError = null, getThreadError = null } = {}) {
  const tpl = 'https://app.hubspot.com/x/{id}';
  return (server, tool, input) => {
    if (server === 'HubSpot') {
      const a = input.filterGroups && input.filterGroups[0].associatedWith && input.filterGroups[0].associatedWith[0];
      if (input.objectType === 'CONTACT' && a.objectType === 'tasks') return { payload: { results: [{ id: 901, properties: { firstname: 'Hélène', lastname: 'Testard', email: 'helene@fromagerie-test.example', company: 'Fromagerie Test', jobtitle: 'Gérante' } }], total: 1, urlTemplate: tpl } };
      if (input.objectType === 'DEAL' && a.objectType === 'tasks') return { payload: { results: [], total: 0 } };
      if (input.objectType === 'DEAL' && a.objectType === 'contacts') return { payload: { results: [
        { id: 1, properties: { dealname: 'Ancienne affaire', dealstage: 'closedwon', amount: '100' } },
        { id: 2, properties: { dealname: 'Fromagerie Test - Formation', dealstage: 'contractsent', amount: '3200' } }], total: 2 } };
      if (input.objectType === 'NOTE') return { payload: { results: [
        { id: 11, properties: { hs_note_body: '<p>Ancienne</p>', hs_timestamp: '2026-08-01T10:00:00Z' } },
        { id: 12, properties: { hs_note_body: '<p>Appel&nbsp;: devis D-2026-044 &amp; planning</p><p>Ligne&#32;2 &eacute;t&eacute;</p>', hs_timestamp: '2026-10-12T10:00:00Z' } },
        { id: 13, properties: { hs_note_body: '<div>' + 'x'.repeat(3000) + '</div>', hs_timestamp: '2026-10-01T10:00:00Z' } },
        { id: 14, properties: { hs_note_body: '<p>Moyenne</p>', hs_timestamp: '2026-09-01T10:00:00Z' } }], total: 4 } };
      if (input.objectType === 'EMAIL') throw { code: 'tool_error', server: 'HubSpot', message: 'EMAIL search failed' };
    }
    if (server === 'Gmail' && tool === 'search_threads') {
      if (gmailSearchError) throw gmailSearchError;
      return { payload: { threads: [
        { id: 'th1', messageCount: 5, messages: [{ id: 'm1', date: '2026-09-01T08:00:00Z', sender: 'Julian <j@example.com>', subject: 'Devis formation', snippet: 'preview old' }], viewUrl: 'https://mail.google.com/x' },
        { id: 'th2', messages: [] }] } };
    }
    if (server === 'Gmail' && tool === 'get_thread') {
      if (getThreadError) throw getThreadError;
      return { payload: { id: 'th1', messages: [
        { id: 'm3', date: '2026-10-03T08:00:00Z', sender: 'Julian <j@example.com>', subject: 'Re: Devis formation', plaintext_body: 'Corps trois' },
        { id: 'm1', date: '2026-09-01T08:00:00Z', sender: 'Julian <j@example.com>', subject: 'Devis formation', plaintextBody: 'Corps un' },
        { id: 'm5', date: '2026-10-14T16:00:00Z', sender: { name: 'Hélène Testard', email: 'helene@fromagerie-test.example' }, subject: 'RE: Devis formation', snippet: 'Corps cinq', plaintextBody: '' },
        { id: 'm2', date: '2026-09-15T08:00:00Z', sender: 'x', subject: 'Re: Devis formation', plaintextBody: 'Corps deux' },
        { id: 'm4', date: '2026-10-10T08:00:00Z', sender: 'Hélène Testard <helene@fromagerie-test.example>', subject: 'Re: Devis formation', plaintextBody: 'Corps quatre\n\nLe mar. 3 oct. 2026, Julian a écrit :\n> Corps trois' }] } };
    }
    throw new Error('unexpected ' + server + ' ' + tool + ' ' + JSON.stringify(input));
  };
}
const MISSIVE = { id: '555', subject: 'Relance devis D-2026-044', body: 'Hélène veut deux sessions', status: 'NOT_STARTED', dueAt: '2026-10-15T06:00:00Z', dueDay: '2026-10-15', daysOverdue: 5, tier: 1, type: 'EMAIL', priority: 'HIGH', url: null };

test('getMissiveContext: contact via task, deal via contact (prefer open), notes, Gmail last 3; EMAIL failure contained', async () => {
  const mcp = fakeMcp(contextHandler());
  const { DATA } = live({ mcp });
  const ctx = await DATA.getMissiveContext(MISSIVE);
  const contactCall = mcp.calls.find((c) => c.input.objectType === 'CONTACT');
  eq(contactCall.input, { objectType: 'CONTACT', properties: ['firstname', 'lastname', 'email', 'company', 'jobtitle'], limit: 10,
    filterGroups: [{ associatedWith: [{ objectType: 'tasks', operator: 'EQUAL', objectIdValues: [555] }] }], chatInsights: CHAT_INSIGHTS });
  const noteCall = mcp.calls.find((c) => c.input.objectType === 'NOTE');
  eq(noteCall.input, { objectType: 'NOTE', properties: ['hs_note_body', 'hs_timestamp'], limit: 3,
    filterGroups: [{ associatedWith: [{ objectType: 'contacts', operator: 'EQUAL', objectIdValues: [901] }] }],
    sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }], chatInsights: CHAT_INSIGHTS });
  const emailCall = mcp.calls.find((c) => c.input.objectType === 'EMAIL');
  eq(emailCall.input.properties, ['hs_email_subject', 'hs_email_text', 'hs_email_direction', 'hs_timestamp']);
  assert.equal(emailCall.input.limit, 3);
  eq(mcp.calls.find((c) => c.tool === 'search_threads').input, { query: 'from:helene@fromagerie-test.example OR to:helene@fromagerie-test.example', pageSize: 3, view: 'THREAD_VIEW_MINIMAL' });
  eq(mcp.calls.find((c) => c.tool === 'get_thread').input, { threadId: 'th1', messageFormat: 'PLAIN_TEXT' });

  eq(ctx.task, J(MISSIVE));
  eq(ctx.contact, { id: '901', name: 'Hélène Testard', firstname: 'Hélène', email: 'helene@fromagerie-test.example', company: 'Fromagerie Test', jobtitle: 'Gérante' });
  eq(ctx.deal, { id: '2', name: 'Fromagerie Test - Formation', stage: 'contractsent', amount: 3200 });
  eq(ctx.notes.map((n) => n.day), ['2026-10-12', '2026-10-01', '2026-09-01']);
  assert.equal(ctx.notes[0].text, 'Appel : devis D-2026-044 & planning\nLigne 2 été');
  assert.ok(ctx.notes[1].text.length <= 2500);
  eq(ctx.emails, []);
  eq(ctx.errors, [{ section: 'hubspot', code: 'tool_error', message: 'EMAIL search failed' }]);
  assert.equal(ctx.gmail.threadId, 'th1');
  assert.equal(ctx.gmail.lastMessageId, 'm5');
  assert.equal(ctx.gmail.subject, 'RE: Devis formation');
  eq(ctx.gmail.messages.map((m) => [m.day, m.text]), [['2026-10-03', 'Corps trois'], ['2026-10-10', 'Corps quatre'], ['2026-10-14', 'Corps cinq']]);
  assert.equal(ctx.gmail.messages[2].from, 'Hélène Testard <helene@fromagerie-test.example>');
});

test('getMissiveContext: Gmail failures are captured per section without aborting HubSpot data', async () => {
  {
    const { DATA } = live({ mcp: fakeMcp(contextHandler({ gmailSearchError: { code: 'needs_reauth', server: 'Gmail', message: 'reauth' } })) });
    const ctx = await DATA.getMissiveContext(MISSIVE);
    assert.equal(ctx.gmail, null);
    assert.equal(ctx.notes.length, 3);
    assert.equal(ctx.deal.id, '2');
    eq(ctx.errors.map((e) => [e.section, e.code]).sort(), [['gmail', 'needs_reauth'], ['hubspot', 'tool_error']]);
  }
  {
    const { DATA } = live({ mcp: fakeMcp(contextHandler({ getThreadError: { code: 'tool_error', server: 'Gmail', message: 'nope' } })) });
    const ctx = await DATA.getMissiveContext(MISSIVE);
    assert.equal(ctx.gmail.lastMessageId, 'm1', 'falls back to the search preview');
    eq(ctx.gmail.messages.map((m) => m.text), ['preview old']);
    assert.ok(ctx.errors.some((e) => e.section === 'gmail' && e.code === 'tool_error'));
  }
  {
    // contact lookup itself fails: deal via task still tried, nothing else crashes
    const mcp = fakeMcp((srv, tool, input) => {
      if (input.objectType === 'CONTACT') throw { code: 'server_unavailable', server: 'HubSpot', message: 'down', retryable: true };
      if (input.objectType === 'DEAL') return { payload: { results: [{ id: 7, properties: { dealname: 'Via tâche', dealstage: 'qualifiedtobuy', amount: '' } }], total: 1 } };
      if (input.objectType === 'NOTE') return { payload: { results: [], total: 0 } };
      throw new Error('unexpected');
    });
    const { DATA } = live({ mcp });
    const ctx = await DATA.getMissiveContext(MISSIVE);
    eq([ctx.contact, ctx.deal, ctx.gmail], [null, { id: '7', name: 'Via tâche', stage: 'qualifiedtobuy', amount: null }, null]);
    eq(ctx.errors, [{ section: 'hubspot', code: 'server_unavailable', message: 'down' }]);
    assert.equal(mcp.calls.filter((c) => c.input.objectType === 'CONTACT').length, 2, 'read retried once');
  }
});

// ==================================================================== scribe
const CTX = {
  task: MISSIVE,
  contact: { id: '901', name: 'Hélène Testard', firstname: 'Hélène', email: 'helene@fromagerie-test.example', company: 'Fromagerie Test', jobtitle: 'Gérante' },
  deal: { id: '2', name: 'Fromagerie Test - Formation', stage: 'contractsent', amount: 4200 },
  notes: [{ day: '2026-10-12', text: 'Appel : devis D-2026-044, deux sessions plutôt que trois.' }],
  emails: [{ day: '2026-10-02', direction: 'INCOMING_EMAIL', subject: 'Question planning', text: 'Le samedi est compliqué.' }],
  gmail: { threadId: 'th1', subject: 'Devis formation', lastMessageId: 'm5', messages: [{ day: '2026-10-14', from: 'Hélène', text: 'Je reviens vers vous la semaine prochaine.' }] },
  errors: [],
};

test('buildDraftPrompt: every email voice rule, compact labelled context, date, intent, JSON-only, no medieval tone, no price', () => {
  const L = load().LOGIC;
  const p = L.buildDraftPrompt(CTX, 'relance devis, proposer janvier', new Date('2026-10-20T08:00:00Z'));
  for (const s of ['Français', 'vouvoiement', '60 à 120 mots', 'Phrases courtes', 'élément concret', 'Exactement une prochaine étape', CALENDLY,
    '« Julian » puis « The French Bot »', 'emoji', 'markdown', 'Aucun prix', 'tarif', 'le devis', "N'invente aucun fait", 'reste court et honnête',
    'AUCUN ton médiéval', 'Réponds uniquement avec un objet JSON {"subject": string, "body": string}', '\\n',
    'mardi 20 octobre 2026', '2026-10-20', '« relance devis, proposer janvier »', 'Hélène Testard', 'Gérante', 'Fromagerie Test',
    'devis envoyé', '5 jours de retard', 'D-2026-044', '[Notes HubSpot', '[Dernier fil Gmail', '[E-mails enregistrés dans HubSpot]', 'reçu', '[Contact]', '[Affaire]']) {
    assert.ok(p.includes(s), 'prompt should contain: ' + s);
  }
  for (const s of [...FORBIDDEN_PHRASES, ...FORBIDDEN_WORDS]) assert.ok(p.includes(s), 'prompt must list forbidden: ' + s);
  assert.ok(!/4\s?200/.test(p), 'deal amount must not leak into the prompt');
  const bare = L.buildDraftPrompt({ task: null, contact: null, deal: null, notes: [], emails: [], gmail: null, errors: [{ section: 'gmail', code: 'needs_reauth', message: '' }] }, '', new Date('2026-10-20T08:00:00Z'));
  assert.ok(bare.includes('Aucune intention précisée'));
  assert.ok(bare.includes('[Sources indisponibles] Gmail'));
  const rq = L.buildDraftPrompt({ ...CTX, task: null, reconquest: { dealId: '2', name: 'X', lostDay: '2026-06-17', reason: 'Budget gelé' } }, '', new Date('2026-10-20T08:00:00Z'));
  assert.ok(rq.includes('perdue le 2026-06-17') && rq.includes('Budget gelé'));
});

test('draftMissive: sample.json options, validation, markdown cleanup, Gmail reply subject', async () => {
  let seen = null;
  let reply = { subject: '**Suivi** du devis', body: '## Bonjour Hélène,\n\n**Merci** pour votre *retour*.\n\n\n\n* point un\n- point deux\n\nJulian\nThe French Bot' };
  const sample = Object.assign(async () => ({ text: '' }), { json: async (prompt, opts) => { seen = { prompt, opts }; if (reply instanceof Error) throw reply; if (reply && reply.code) throw reply; return reply; } });
  const { DATA } = live({ mcp: fakeMcp(() => ({ payload: {} })), sample });
  const ctl = new AbortController();
  const onText = () => {};
  const d = await DATA.draftMissive(CTX, 'proposer janvier', { onText, signal: ctl.signal });
  assert.equal(seen.opts.modelTier, 'default');
  assert.equal(seen.opts.onText, onText);
  assert.equal(seen.opts.signal, ctl.signal);
  assert.ok(!('cache' in seen.opts));
  assert.ok(seen.prompt.includes('« proposer janvier »'));
  eq(d, { subject: 'Re: Devis formation', body: 'Bonjour Hélène,\n\nMerci pour votre retour.\n\n- point un\n- point deux\n\nJulian\nThe French Bot', to: ['helene@fromagerie-test.example'], replyToMessageId: 'm5', isReply: true });

  await DATA.draftMissive(CTX, '', { cache: false });
  assert.equal(seen.opts.cache, false, 'Réécrire = cache:false');

  const already = await DATA.draftMissive({ ...CTX, gmail: { ...CTX.gmail, subject: 'RE: Devis formation' } }, '', {});
  assert.equal(already.subject, 'RE: Devis formation');
  const noThread = await DATA.draftMissive({ ...CTX, gmail: null }, '', {});
  eq([noThread.subject, noThread.replyToMessageId, noThread.isReply], ['Suivi du devis', null, false]);
  const noEmail = await DATA.draftMissive({ ...CTX, contact: { ...CTX.contact, email: null }, gmail: null }, '', {});
  eq(noEmail.to, []);

  for (const bad of [{ subject: 'x' }, { subject: '  ', body: 'y' }, { subject: 'x', body: 3 }, null, ['a']]) {
    reply = bad;
    await assert.rejects(DATA.draftMissive(CTX, '', {}), (e) => e.code === 'invalid_json' && e.source === 'sample');
  }
  reply = { code: 'rate_limited', message: 'slow down' };
  await assert.rejects(DATA.draftMissive(CTX, '', {}), (e) => {
    assert.equal(e.code, 'rate_limited');
    assert.equal(load().LOGIC.errorCopy(e).text, 'Le scribe est épuisé, réessayez dans un moment.');
    return true;
  });

  const L = load().LOGIC;
  assert.equal(L.replySubject('Devis'), 'Re: Devis');
  assert.equal(L.replySubject('Re: Devis'), 'Re: Devis');
  assert.equal(L.replySubject('RE: Devis'), 'RE: Devis');
  assert.equal(L.replySubject('re : Devis'), 're : Devis');
  assert.equal(L.replySubject(''), null);
  eq(L.cleanDraft({ subject: '"Objet"', body: 'Voir [le lien](https://calendly.com/x) 🙂\n\n\n\nFin' }), { subject: 'Objet', body: 'Voir le lien : https://calendly.com/x\n\nFin' });
});

test('createGmailDraft: exact create_draft input, reply id, no-email guard, write not retried', async () => {
  const mcp = fakeMcp(() => ({ payload: { id: 'dr1', threadId: 'th1', viewUrl: 'https://mail.google.com/mail/#drafts/dr1' } }));
  const { DATA } = live({ mcp });
  const r = await DATA.createGmailDraft({ to: ['helene@fromagerie-test.example'], subject: 'Re: Devis formation', body: 'Bonjour', replyToMessageId: 'm5' });
  eq(r, { id: 'dr1', threadId: 'th1', viewUrl: 'https://mail.google.com/mail/#drafts/dr1' });
  await DATA.createGmailDraft({ to: 'a@b.example', subject: 'S', body: 'B' });
  eq(mcp.calls.map((c) => [c.server, c.tool, c.input, c.opts]), [
    ['Gmail', 'create_draft', { to: ['helene@fromagerie-test.example'], subject: 'Re: Devis formation', body: 'Bonjour', replyToMessageId: 'm5' }, { cache: false }],
    ['Gmail', 'create_draft', { to: ['a@b.example'], subject: 'S', body: 'B' }, { cache: false }],
  ]);
  await assert.rejects(DATA.createGmailDraft({ to: [], subject: 'S', body: 'B' }), (e) => e.code === 'no_email');
  assert.equal(mcp.calls.length, 2);
  const failing = fakeMcp(() => { throw { code: 'upstream_error', server: 'Gmail', message: 'x', retryable: true, retryAfterMs: 10 }; });
  const { DATA: D2, sleeps } = live({ mcp: failing });
  await assert.rejects(D2.createGmailDraft({ to: ['a@b.example'], subject: 'S', body: 'B' }), (e) => e.code === 'upstream_error' && e.write === true);
  assert.equal(failing.calls.length, 1);
  eq(sleeps, []);
});

// ==================================================================== error copy
test('errorCopy: French copy and the right action for every code family', () => {
  const L = load().LOGIC;
  const c = (e) => L.errorCopy(e);
  assert.equal(c({ code: 'needs_reauth', server: 'HubSpot', message: '' }).text, 'Reconnectez HubSpot dans claude.ai → Réglages → Connecteurs.');
  assert.equal(c({ code: 'server_not_connected', server: 'Gmail' }).text, 'Ajoutez le connecteur Gmail dans claude.ai → Réglages → Connecteurs.');
  assert.equal(c({ code: 'selection_required', server: 'HubSpot' }).text, 'Choisissez quel connecteur HubSpot utiliser (claude.ai vous le propose).');
  for (const code of ['not_in_manifest', 'approval_required']) {
    const r = c({ code, server: 'HubSpot' });
    assert.equal(r.action, 'permissions');
    assert.equal(r.text, 'Autorisation HubSpot refusée pour cette page.');
  }
  for (const code of ['server_unavailable', 'upstream_error']) assert.equal(c({ code, server: 'HubSpot', retryable: true }).action, 'retry');
  assert.equal(c({ code: 'server_unavailable', server: 'HubSpot' }).text, 'HubSpot ne répond plus. Réessayez dans un instant.');
  assert.ok(c({ code: 'tool_error', server: 'HubSpot', message: 'Property hs_x invalid' }).text.includes('Property hs_x invalid'));
  assert.ok(c({ code: 'tool_error', server: 'HubSpot', message: '{"error":{"message":"Bad stage"}}' }).text.includes('Bad stage'));
  assert.equal(c({ code: 'tool_error', server: 'HubSpot', message: '' }).action, null);
  assert.equal(c({ code: 'needs_reauth' }).text, 'Reconnectez le connecteur dans claude.ai → Réglages → Connecteurs.');
  // scribe
  assert.equal(c({ code: 'rate_limited', message: 'x' }).text, 'Le scribe est épuisé, réessayez dans un moment.');
  assert.equal(c({ code: 'invalid_json', message: 'x' }).action, 'retry');
  assert.equal(c({ code: 'not_granted', message: 'x' }).hide, true);
  assert.equal(c({ code: 'sampling_disabled', message: 'x' }).hide, true);
  assert.equal(c({ code: 'empty_completion' }).text, "Le scribe n'a rien trouvé à dire. Donnez-lui une intention.");
  assert.ok(c({ code: 'refused' }).text.length > 0);
  assert.equal(c({ code: 'cancelled' }).silent, true);
  assert.equal(c({ code: 'not_granted', server: 'HubSpot', source: 'mcp' }).hide, undefined);
  // db
  assert.equal(c({ code: 'quota_exceeded', message: 'full' }).title, 'Grimoire plein');
  assert.equal(c({ code: 'unavailable', message: 'x' }).action, 'retry');
  assert.ok(c({ code: 'not_granted', source: 'db' }).text.includes('Sauvegarde indisponible'));
  // custom & generic
  assert.ok(c({ code: 'no_email', server: 'Gmail', source: 'mcp' }).text.includes('e-mail'));
  const g = c(new Error('boom'));
  eq([g.title, g.action], ['Grain de sable', 'retry']);
  // tone
  const all = ['needs_reauth', 'server_not_connected', 'selection_required', 'server_not_found', 'not_in_manifest', 'approval_required', 'blocked_by_policy', 'server_unavailable', 'upstream_error', 'tool_error', 'rate_limited', 'user_changed', 'bad_request']
    .map((code) => c({ code, server: 'HubSpot' }))
    .concat(['not_granted', 'sampling_disabled', 'rate_limited', 'invalid_json', 'refused', 'empty_completion', 'prompt_too_large', 'session_expired', 'upstream_error', 'invalid_request'].map((code) => c({ code, source: 'sample' })))
    .concat(['invalid_argument', 'resource_exhausted', 'quota_exceeded', 'unavailable', 'revoked', 'not_granted'].map((code) => c({ code, source: 'db' })));
  for (const o of all) {
    const t = (o.title + ' ' + o.text).toLowerCase();
    for (const w of FORBIDDEN_WORDS) assert.ok(!t.includes(w), w);
    assert.ok(!EMOJI.test(t));
    assert.ok(o.text.length > 0 && o.title.length > 0);
    assert.ok([null, 'retry', 'permissions'].includes(o.action));
  }
});

// ==================================================================== persistence
test('state: db doc data/users/<uid>/royaume, merge on load, single-flight coalescing save', async () => {
  const db = fakeDb();
  db.docs.set('data/users/u_test/royaume', { v: 1, abattus: ['1'], muted: true });
  const user = { id: async () => 'u_test' };
  const { DATA, LOGIC } = live({ mcp: fakeMcp(() => ({ payload: {} })), db, user, sample: Object.assign(async () => ({}), { json: async () => ({}) }) });
  const init = await DATA.init();
  eq(init.can, { hubspot: true, gmail: true, scribe: true, db: true });
  assert.equal(init.storage, 'db');
  const st = await DATA.loadState();
  eq(st, { ...J(LOGIC.emptyState()), abattus: ['1'], muted: true });
  assert.equal(await DATA.saveState(st), undefined);
  assert.equal(db.writes.length, 0, 'unchanged state is not rewritten');

  let release;
  db.ctl.hold = new Promise((r) => { release = r; });
  const A = { ...st, seenIntro: true };
  const B = { ...st, seenIntro: true, abattus: ['1', '2'] };
  const C = { ...st, seenIntro: true, abattus: ['1', '2', '3'] };
  const pa = DATA.saveState(A);
  await new Promise((r) => setTimeout(r, 5));
  const pb = DATA.saveState(B);
  const pc = DATA.saveState(C);
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(db.writes.length, 1, 'one write at a time');
  db.ctl.hold = null;
  release();
  await Promise.all([pa, pb, pc]);
  assert.equal(db.writes.length, 2, 'B coalesced into C');
  eq(db.writes.map((w) => w.path), ['data/users/u_test/royaume', 'data/users/u_test/royaume']);
  eq(db.writes[1].data.abattus, ['1', '2', '3']);
  eq(J(db.docs.get('data/users/u_test/royaume')).abattus, ['1', '2', '3']);
  await DATA.saveState(C);
  assert.equal(db.writes.length, 2);
});

test('state: localStorage fallback (no uid), throwing storage, db read failure never overwrites the doc', async () => {
  {
    const ls = fakeStorage();
    const { DATA, sb } = live({ mcp: fakeMcp(() => ({ payload: {} })), db: fakeDb(), user: { id: async () => null } });
    sb.localStorage = ls;
    const init = await DATA.init();
    eq([init.storage, init.can.db], ['local', false]);
    const st = { ...sb.LOGIC.emptyState(), muted: true };
    await DATA.saveState(st);
    assert.equal(JSON.parse(ls.map.get('royaume-bourgogne-state')).muted, true);
    assert.equal((await DATA.loadState()).muted, true);
  }
  {
    const { DATA, sb } = live({ mcp: fakeMcp(() => ({ payload: {} })) });
    sb.localStorage = fakeStorage({ throwing: true });
    const init = await DATA.init();
    assert.equal(init.storage, 'memory');
    await DATA.saveState({ ...sb.LOGIC.emptyState(), muted: true });
    assert.equal((await DATA.loadState()).muted, true, 'kept in memory');
  }
  {
    const db = fakeDb();
    db.ctl.getError = { code: 'unavailable', message: 'down' };
    const ls = fakeStorage();
    const { DATA, sb, sleeps } = live({ mcp: fakeMcp(() => ({ payload: {} })), db, user: { id: async () => 'u_x' } });
    sb.localStorage = ls;
    await DATA.init();
    const st = await DATA.loadState();
    eq(st, J(sb.LOGIC.emptyState()));
    assert.equal(db.reads.length, 2, 'db read retried once');
    assert.equal(sleeps.length, 1);
    await DATA.saveState({ ...st, muted: true });
    assert.equal(db.writes.length, 0, 'never overwrite a doc we could not read');
    assert.equal(DATA.status().storage, 'local');
    assert.ok(ls.map.has('royaume-bourgogne-state'));
  }
  {
    const db = fakeDb();
    db.ctl.setError = { code: 'revoked', message: 'gone' };
    const ls = fakeStorage();
    const { DATA, sb } = live({ mcp: fakeMcp(() => ({ payload: {} })), db, user: { id: async () => 'u_y' } });
    sb.localStorage = ls;
    await DATA.init();
    await DATA.loadState();
    await DATA.saveState({ ...sb.LOGIC.emptyState(), muted: true });
    eq([DATA.status().storage, DATA.status().lastSaveError.code], ['local', 'revoked']);
    assert.equal(JSON.parse(ls.map.get('royaume-bourgogne-state')).muted, true);
  }
});

// ==================================================================== demo
test('demo mode: init without window.claude or with null mcp; demo distribution matches the SPEC', async () => {
  {
    const sb = load();
    sb.DATA._env.sleep = async () => {};
    const init = await sb.DATA.init();
    eq(init, { mode: 'demo', can: { hubspot: true, gmail: true, scribe: true, db: false }, storage: 'memory', reason: 'no_claude' });
  }
  const { DATA, LOGIC } = live({});
  const init = await DATA.init();
  eq([init.mode, init.reason], ['demo', 'no_mcp']);
  const now = new Date();
  const r = await DATA.loadAll();
  const m = LOGIC.buildModel(r, LOGIC.emptyState(), now);
  assert.ok(r.deals.length >= 13 && r.deals.length <= 16, 'deals ~14: ' + r.deals.length);
  assert.equal(m.season.won.length, 3, '3 won this month');
  assert.equal(m.chronicle.length, 2);
  assert.equal(m.reconquestsDue.length, 1);
  assert.ok(r.openTasks.length >= 15 && r.openTasks.length <= 18, 'open ~16: ' + r.openTasks.length);
  assert.equal(m.counts.goblins, 12);
  assert.ok(m.counts.goblinsByTier.every((n) => n > 0), 'all three tiers present');
  assert.equal(m.counts.missivesToday, 2);
  assert.equal(m.counts.waiting, 1);
  assert.equal(r.completedTasks.length, 60);
  const ages = r.completedTasks.map((t) => LOGIC.daysBetween(t.completedAt, now));
  assert.ok(ages.every((a) => a >= 1 && a <= 160), 'completed within ~5 months, all in the past');
  assert.ok(Math.max(...ages) > 120);
  assert.ok(m.quests.some((q) => q.cold) && m.quests.some((q) => q.chapter === 0) && m.quests.some((q) => q.planned));
  assert.ok(m.siege.active, 'demo shows the siege');
  for (const d of r.deals) assert.equal(d.url, null);
});

test('demo mode: actions mutate the in-memory copy; context, scribe and Gmail draft are fake but complete', async () => {
  const { DATA, LOGIC } = live({});
  await DATA.init();
  const today = LOGIC.parisDay(new Date());
  await DATA.completeTask('61013');
  let r = await DATA.loadAll();
  assert.ok(!r.openTasks.some((t) => t.id === '61013'));
  assert.ok(r.completedTasks.some((t) => t.id === '61013'));
  await DATA.reopenTask('61013');
  r = await DATA.loadAll();
  assert.equal(r.openTasks.find((t) => t.id === '61013').status, 'NOT_STARTED');
  await DATA.rescheduleTask('61001', LOGIC.addDays(today, 7));
  r = await DATA.loadAll();
  const moved = r.openTasks.find((t) => t.id === '61001');
  assert.equal(moved.dueAt, LOGIC.parisDateAt(LOGIC.addDays(today, 7), 8, 0).toISOString());
  await assert.rejects(DATA.completeTask('nope'), (e) => e.code === 'tool_error');

  const m = LOGIC.buildModel(r, LOGIC.emptyState(), new Date());
  const missive = [...m.missives.overdue, ...m.missives.today].find((x) => x.id === '61009');
  const ctx = await DATA.getMissiveContext(missive);
  eq([ctx.contact.firstname, ctx.deal.id, ctx.notes.length, ctx.errors.length], ['Hélène', '41001', 2, 0]);
  assert.ok(!/&[a-z]+;/.test(ctx.notes[0].text), 'entities decoded');
  assert.ok(ctx.gmail && ctx.gmail.lastMessageId);
  const texts = [];
  const d = await DATA.draftMissive(ctx, 'relance devis', { onText: ({ text }) => texts.push(text) });
  assert.ok(texts.length >= 2, 'streams');
  assert.ok(d.subject.startsWith('Re: '));
  assert.equal(d.replyToMessageId, ctx.gmail.lastMessageId);
  assert.ok(d.body.includes(CALENDLY) && d.body.endsWith('Julian\nThe French Bot'));
  const words = d.body.split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 40 && words <= 120, 'words ' + words);
  const lower = d.body.toLowerCase();
  for (const s of [...FORBIDDEN_PHRASES, ...FORBIDDEN_WORDS]) assert.ok(!lower.includes(s), s);
  const g = await DATA.createGmailDraft({ to: d.to, subject: d.subject, body: d.body, replyToMessageId: d.replyToMessageId });
  eq([g.viewUrl, g.demo], [null, true]);
  const ctl = new AbortController();
  ctl.abort();
  await assert.rejects(DATA.draftMissive(ctx, '', { signal: ctl.signal }), (e) => e.code === 'cancelled');
  const lostEntry = LOGIC.buildModel(r, LOGIC.emptyState(), new Date()).reconquestsDue[0];
  const rctx = await DATA.getReconquestContext(lostEntry);
  assert.ok(rctx.reconquest && rctx.contact && rctx.task === null);
  const rd = await DATA.draftMissive(rctx, '', {});
  assert.ok(rd.body.includes('Bonjour Anaïs'));
  await DATA.saveState({ ...LOGIC.emptyState(), muted: true });
  assert.equal((await DATA.loadState()).muted, true);
});

// ==================================================================== purity & hygiene
test('pure functions never read the clock (Date.now / new Date() trapped)', () => {
  const sb = load();
  const L = sb.LOGIC;
  const now = new Date('2026-10-20T08:00:00Z');
  const r = L.demoRaw(now);
  vm.runInContext(`
    var __RealDate = Date;
    Date = new Proxy(__RealDate, {
      construct: function (t, args) { if (!args.length) throw new Error('new Date() in pure code'); return Reflect.construct(t, args); },
      apply: function () { throw new Error('Date() in pure code'); },
      get: function (t, p) { if (p === 'now') return function () { throw new Error('Date.now() in pure code'); }; return Reflect.get(t, p); }
    });`, sb);
  assert.throws(() => vm.runInContext('Date.now()', sb), /pure code/);
  let st = L.observe(r, L.emptyState(), now).state;
  st = L.recordAction(st, { type: 'sent', id: '61013', day: '2026-10-20' });
  const m = L.buildModel(r, st, now);
  st = L.checkSiege(m, st, now);
  L.toSceneModel(m);
  L.buildDraftPrompt({ task: m.missives.today[0] || null, contact: null, deal: null, notes: [], emails: [], gmail: null, errors: [] }, 'x', now);
  L.levelFromXp(1234);
  L.errorCopy({ code: 'needs_reauth', server: 'HubSpot' });
  eq(J(L.demoRaw(now)), J(r), 'demoRaw deterministic for a given now');
  L.fmt.dateBox(now);
});

test('toSceneModel shape', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-20T19:00:00Z');
  const m = L.buildModel(L.demoRaw(now), L.emptyState(), now);
  const s = L.toSceneModel(m);
  assert.equal(s.hour, 21);
  assert.equal(s.quests.length, 9);
  assert.equal(s.questsExtra, 0);
  eq(Object.keys(s.quests[0]).sort(), ['chapter', 'client', 'cold', 'hearts', 'id', 'name', 'planned']);
  assert.equal(s.goblins.length, 12);
  eq(Object.keys(s.goblins[0]).sort(), ['daysOverdue', 'id', 'tier']);
  eq(s.badges, { board: 2, dovecote: 14, chronicle: 1 });
  assert.equal(s.treasureFill, 3); // 10 400 / 15 000
  assert.equal(s.siegeActive, true);
  eq(L.toSceneModel(L.buildModel({}, L.emptyState(), now)).quests, []);
  assert.equal(L.toSceneModel(L.buildModel({}, L.emptyState(), now)).treasureFill, 0);
  assert.equal(L.fmt.dateBox(now), 'Mar. 20 Oct');
  assert.equal(L.fmt.clock(now), '21:00');
  assert.equal(L.fmt.euros(3200), '3 200 €');
});

test('source hygiene: no Stardew, no banned phrases, no blocking dialogs, forbidden words only inside the scribe rule list', () => {
  assert.ok(!/stardew/i.test(CODE));
  assert.ok(!/Automatisation oui|anti-blabla/i.test(CODE));
  assert.ok(!/\b(alert|confirm|prompt)\s*\(/.test(CODE.replace(/buildDraftPrompt\s*\(/g, '')));
  assert.ok(!/window\.open|Date\.now\(/.test(CODE));
  const lines = CODE.split('\n').filter((l) => FORBIDDEN_WORDS.some((w) => l.toLowerCase().includes(w)));
  assert.equal(lines.length, 1, 'only the prompt line: ' + lines.join(' | '));
  assert.ok(lines[0].includes('Mots interdits'));
  const L = load().LOGIC;
  const demo = JSON.stringify(L._demoWorld(new Date('2026-10-20T08:00:00Z'))).toLowerCase();
  for (const w of [...FORBIDDEN_WORDS, ...FORBIDDEN_PHRASES]) assert.ok(!demo.includes(w), w);
  assert.ok(!EMOJI.test(demo));
});

// ==================================================================== review fixes (regressions)
test('stale read across the Paris midnight: yesterday\'s in-game sends stay hidden only for a read taken right after them', () => {
  const L = load().LOGIC;
  const t = mkTask(L, 't1', '2026-10-20');
  let st = L.recordAction(L.emptyState(), { type: 'sent', id: 't1', day: '2026-10-21', at: '2026-10-21T21:57:00.000Z' });
  assert.equal(st.todayDoneIds.at, '2026-10-21T21:57:00.000Z');
  const after = new Date('2026-10-21T22:02:00Z'); // 00:02 Paris, 22 Oct
  // the read was taken 3 s after the send (search-index lag): t1 must not come back as a goblin
  eq(L.buildModel(raw({ openTasks: [t], fetchedAt: '2026-10-21T21:57:03.000Z' }), st, after).missives.overdue.map((m) => m.id), []);
  // a read taken minutes later is fresh: a still-open task is real
  eq(L.buildModel(raw({ openTasks: [t], fetchedAt: '2026-10-21T22:01:00.000Z' }), st, after).missives.overdue.map((m) => m.id), ['t1']);
  // the stamp survives a save/load round trip
  st = L.normalizeState(J(L.compactState(st)));
  assert.equal(st.todayDoneIds.at, '2026-10-21T21:57:00.000Z');
});

test('siege: « Annuler » on the send that won it reopens the siege and takes back the +500', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-21T10:00:00Z');
  let st = L.normalizeState({ siege: { startedAt: '2026-10-20T08:00:00Z', initialCount: 10, completedAt: null } });
  st = L.recordAction(st, { type: 'sent', id: 'L0', day: '2026-10-21' });
  st = L.checkSiege(L.buildModel(raw({}), st, now), st, now);
  eq([!!st.siege.completedAt, st.siege.completedBy], [true, 'L0']);
  st = L.normalizeState(J(L.compactState(st)));
  assert.equal(st.siege.completedBy, 'L0', 'kept across saves');
  st = L.recordAction(st, { type: 'undo', id: 'L0', day: '2026-10-21' });
  const m = L.buildModel(raw({ openTasks: [mkTask(L, 'L0', '2026-10-19')] }), st, now);
  eq([m.siege.won, m.siege.active, m.counts.goblins, m.hero.stats.siegeBonus], [false, true, 1, false]);
  // an undo of another task leaves a won siege alone
  let s2 = L.normalizeState({ siege: { startedAt: '2026-10-20T08:00:00Z', initialCount: 10, completedAt: '2026-10-21T09:00:00Z', completedBy: 'X' } });
  s2 = L.recordAction(s2, { type: 'undo', id: 'Y', day: '2026-10-21' });
  assert.equal(s2.siege.completedAt, '2026-10-21T09:00:00Z');
});

test('placeholder raw (HubSpot down) never projects a siege win; lost deal without closeDate keeps one reconquest date', () => {
  const L = load().LOGIC;
  const now = new Date('2026-10-21T10:00:00Z');
  const running = L.normalizeState({ siege: { startedAt: '2026-10-20T08:00:00Z', initialCount: 12, completedAt: null } });
  const m = L.buildModel({ deals: [], openTasks: [], completedTasks: [], fetchedAt: now.toISOString(), placeholder: true }, running, now);
  eq([m.siege.won, m.siege.active, m.hero.skills.relance.xp, m.placeholder], [false, true, 0, true]);
  assert.equal(L.checkSiege(m, running, now), running, 'checkSiege learns nothing from a placeholder');
  let st = L.observe(raw({ deals: [mkDeal('9', { stage: 'contractsent' })] }), L.emptyState(), now).state;
  const lost = mkDeal('9', { stage: 'closedlost', closeDate: null, lostReason: 'Pas le moment' });
  const r = L.observe(raw({ deals: [lost] }), st, now);
  eq(r.state.lostDays, { 9: '2026-10-21' });
  const c = L.buildModel(raw({ deals: [lost] }), L.normalizeState(J(L.compactState(r.state))), new Date('2027-02-18T10:00:00Z')).chronicle[0];
  eq([c.lostDay, c.reconquestDay, c.reconquestDue], ['2026-10-21', r.events[0].reconquestDay, true]);
});

test('errorCopy: an unconfirmed write never invites a blind retry', () => {
  const L = load().LOGIC;
  const g = L.errorCopy({ code: 'server_unavailable', server: 'Gmail', retryable: true, write: true });
  eq([g.action, g.ambiguous], [null, true]);
  assert.ok(/brouillon existe peut-être/.test(g.text));
  const h = L.errorCopy(L.normalizeError({ code: 'upstream_error', server: 'HubSpot', write: true }));
  eq([h.action, h.ambiguous], [null, true]);
  assert.equal(L.errorCopy({ code: 'server_unavailable', server: 'HubSpot' }).action, 'retry', 'reads still offer « Réessayer »');
});

test('state: a local copy saved while db writes failed wins over the older db doc on the next load', async () => {
  const db = fakeDb();
  db.docs.set('data/users/u_test/royaume', { v: 1, abattus: ['1'], savedAt: '2026-10-20T08:00:00.000Z' });
  const ls = fakeStorage();
  ls.setItem('royaume-bourgogne-state', JSON.stringify({ v: 1, abattus: ['1', '2'], savedAt: '2026-10-21T08:00:00.000Z' }));
  const { DATA, sb } = live({ mcp: fakeMcp(() => ({ payload: {} })), db, user: { id: async () => 'u_test' } });
  sb.localStorage = ls;
  const st = await DATA.loadState();
  eq(st.abattus, ['1', '2']);
  assert.equal('savedAt' in st, false, 'the stamp stays out of the game state');
  // and an older local copy loses to the db doc
  ls.setItem('royaume-bourgogne-state', JSON.stringify({ v: 1, abattus: [], savedAt: '2026-10-19T08:00:00.000Z' }));
  const { DATA: D2, sb: sb2 } = live({ mcp: fakeMcp(() => ({ payload: {} })), db, user: { id: async () => 'u_test' } });
  sb2.localStorage = ls;
  eq((await D2.loadState()).abattus, ['1']);
  // writes carry the stamp
  await D2.saveState({ ...(await D2.loadState()), muted: true });
  assert.ok(typeof db.writes[db.writes.length - 1].data.savedAt === 'string');
});

// ---------------------------------------------------------------- runner
let failed = 0;
const t0 = Date.now();
for (const t of tests) {
  try {
    await t.fn();
    console.log('ok   ' + t.name);
  } catch (e) {
    failed++;
    console.log('FAIL ' + t.name + '\n     ' + String((e && e.stack) || e).split('\n').slice(0, 6).join('\n     '));
  }
}
console.log(`\n${tests.length - failed}/${tests.length} tests passed in ${Date.now() - t0} ms`);
process.exit(failed ? 1 : 0);
