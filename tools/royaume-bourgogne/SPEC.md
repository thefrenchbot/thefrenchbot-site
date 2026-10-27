# Royaume de Bourgogne — game spec (contract for every builder)

Working dir: `/tmp/claude-0/-home-user-thefrenchbot-site/e41991dd-4857-5abf-8ef0-a2593ad11d7d/scratchpad/royaume`
(below: `$W`). Everything you write goes there. Do NOT touch the git repo at /home/user/thefrenchbot-site.

## 1. What it is

A private claude.ai **Artifact** (one HTML page) that turns Julian Luneau's HubSpot follow-ups into a
**medieval RPG in pixel art**, visually in the spirit of Stardew Valley (warm, cozy, top-down 16px tiles,
wooden/parchment UI boxes, date + gold counter boxes top-right). Julian runs "The French Bot" (AI training
for French SMBs), based in Dijon → the hero is **Sire Julian de Bourgogne**.

Legal: all pixel art must be ORIGINAL (drawn by us in code). Never copy Stardew sprites, never write the word
"Stardew" anywhere in the page.

Usage: desktop morning ritual (15 min) AND mobile in the claude.ai app. Must work at 400px wide and at 1440px.

### Core metaphor (decided by the user — do not change)

| HubSpot | In game |
|---|---|
| Open deal | **Quête principale** shown as a camp tent with a banner. Pipeline stage = chapter. |
| Deal stage `appointmentscheduled` | Chapitre I — « L'Audience » |
| `qualifiedtobuy` | Chapitre II — « La Reconnaissance » |
| `presentationscheduled` | Chapitre III — « La Joute » |
| `contractsent` | Chapitre IV — « Le Sceau » |
| deal with empty stage | Chapitre 0 — « La Rumeur » (à qualifier) |
| `closedwon` | Quête accomplie → **gold** (real € amount) into the treasure chest, coin burst, fanfare |
| `closedlost` | Quête échouée → written in the **Livre des Défaites** (chronicle) with the lost reason, AND a **Quête de reconquête** auto-scheduled 120 days after the loss date |
| Open task (relance) | **Missive royale** (sent by carrier pigeon from the dovecote) listed on the **Tableau de la taverne** |
| Task due today | Missive du jour |
| Task overdue (due before today, status ≠ COMPLETED and ≠ WAITING) | **Gobelin** besieging the village walls. Tier by days overdue: 1–6 → Gobelin (tier 1), 7–29 → Gobelin guerrier (tier 2), ≥30 → Chef gobelin (tier 3) |
| Task status WAITING | Missive « en attente de réponse » — not a goblin, shown in its own small list |
| Deal not contacted for too long | **Loyauté** (hearts 0–5) drops, tent banner fades/droops, "refroidie" |

Loyalty thresholds (days without contact) by stage: contractsent 5, presentationscheduled 7,
qualifiedtobuy 14, appointmentscheduled 21, empty stage 21.
`daysSinceContact` = whole Paris days between today and `max(lastContact, createDate)` (lastContact may be null).
hearts = 5 when days ≤ threshold/2; linear down to 0 at 2×threshold; round to nearest 0.5. `cold = days > threshold`.
If the deal has a `nextActivity` in the future, show a small pigeon "relance planifiée" marker (decay still applies).

### Actions that WRITE to HubSpot (user decided — nothing else writes)
1. **Envoyer la missive** → task `hs_task_status = "COMPLETED"`. +XP. Toast offers « Annuler » for 8 s → sets it back to `"NOT_STARTED"`.
2. **Reporter** (+2 / +7 / +14 days from today) → task property **`hs_timestamp`** set to that day at 08:00 Europe/Paris, as an ISO UTC string. Goblin retreats (no XP).
3. **Abattre le gobelin** → `hs_task_status = "COMPLETED"` without sending anything (for dead/obsolete relances). Needs an in-page confirm step (never `confirm()`). Small XP (5). Recorded in state `abattus` so XP history counts it as 5 not 20.

Deals are READ-ONLY in the game (won/lost happen in HubSpot; the game detects changes and celebrates).
Reconquest quests are in-game only (stored in db), no HubSpot write.

### AI drafting of relances ("Le Scribe")
On any missive (and on a due reconquest): button « Rédiger avec le scribe ». Optional one-line intent box
(« relance devis, proposer janvier »). Flow:
1. Gather context (`DATA.getMissiveContext`): task subject+body, associated contact (name, company, jobtitle, email),
   associated deal (via task, else via contact; prefer an open deal), last 3 HubSpot notes (HTML → plain text,
   ≤2500 chars each), last 3 HubSpot logged emails if any, latest Gmail thread with that email address
   (last 3 messages, ≤1500 chars each).
2. Call `sample.json(prompt, {modelTier:"default", onText, signal})` → `{subject, body}`. Show a "Le scribe trempe sa plume…" state, a Stop button.
3. Show an editable parchment (subject input + body textarea). Buttons: « Créer le brouillon Gmail », « Réécrire » (new call, `cache:false`), « Copier ».
4. `create_draft` on Gmail: `to:[contact email]`, `subject`, `body` (plain text, no markdown), `replyToMessageId` = id of the latest message of the Gmail thread when one exists (subject then = "Re: " + thread subject unless it already starts with Re:). Show link « Ouvrir le brouillon dans Gmail » (`viewUrl`).
5. Then « Missive envoyée » completes the task (action 1).
No contact email → still draft, but Gmail button disabled with reason; Copier works.

**Email voice rules (real clients — NO medieval tone in the email!)**: French, vouvoiement, 60–120 words, short
sentences, cite one concrete element from the context (last call, devis reference, something they said), exactly
one clear next step (often a 30-min slot: https://calendly.com/thefrenchbot-coaching/30min), sign « Julian » then
« The French Bot ». Forbidden: "je me permets de revenir vers vous", "n'hésitez pas", "dans l'attente de votre
retour", "écosystème", "synergies", "paradigme", "disruptif", "innovant", emojis, markdown, any price or pack
tariff (refer to "le devis" by its reference if present), invented facts. If context is thin, stay short and
honest. Output JSON only: `{"subject": "...", "body": "..."}` (body with \n line breaks).

### Progression
- **Or / Trésor de saison** = sum of `amount` of `closedwon` deals whose closeDate falls in the current Paris month. Shown top-right like a gold counter, in **€** with a coin icon. Season goal **15 000 €**. Also all-time treasure.
- **Saisons** = calendar months. Names: Janvier « Le Grand Froid », Février « La Chandeleur », Mars « Les Semailles », Avril « Le Renouveau », Mai « Le Mai fleuri », Juin « La Saint-Jean », Juillet « Les Moissons », Août « Le Plein Été », Septembre « Les Vendanges », Octobre « Les Pressoirs », Novembre « La Saint-Martin », Décembre « L'Avent ». Show days left in season.
- **Compétences** (Stardew-like, levels 1–10 each, XP thresholds cumulative `[0,100,380,770,1300,2150,3300,4800,6900,10000,15000]` → level = highest index whose threshold ≤ xp, capped at 10):
  - **Relance**: +20 per completed task (from HubSpot history), +10 bonus if completed on time (completedAt ≤ end of due day, Paris), 5 instead of 20 if the task id is in `state.abattus`; +500 once when the Grand Nettoyage siege is won; +50 per perfect day.
  - **Closing**: per won deal 50 + round(amount/20); +10 per lost deal that has a non-empty lost reason (honesty).
  - **Prospection**: +25 per deal created (all deals, any stage).
  - Hero level = sum of the 3 skill levels (3..30). Titles by hero level: 3–5 Écuyer, 6–9 Chevalier, 10–13 Chevalier banneret, 14–17 Baron, 18–21 Vicomte, 22–25 Comte, 26–29 Marquis, 30 Duc de Bourgogne.
- **Journée parfaite**: on a Paris weekday, all missives due that day are done AND at least one action (sent/slain/postponed) happened that day. Streak = consecutive perfect weekdays (weekends never break it; today counts only once it is perfect; a weekday that is not perfect breaks it once it is over).
- **Grand Nettoyage (siège)**: if overdue goblins ≥ 10 and `state.siege.completedAt` is empty → on load a banner « Messire, N gobelins assiègent vos murailles. Aïe. » with « Défendre le village ». Siege mode = one card at a time, oldest goblin first: subject, days overdue, body excerpt, buttons Envoyer (opens scribe flow) / Reporter (+2/+7/+14) / Abattre (confirm) / Passer. Progress bar `defeated / initialCount`. When overdue count reaches 0 → siege won: +500 Relance XP, fanfare, `state.siege.completedAt` set. Resumable any time.
- **Célébrations**: compare current deals to `state.lastSeen` ({dealId: stage}). New `closedwon` since last visit → "Quête accomplie !" modal (+X €, coin burst, fanfare). New `closedlost` → "Quête échouée" modal showing reason + reconquest date (« Brutal, mais libérateur. »). First ever load: no celebrations, just store the baseline.

### Copy tone in the UI
Medieval framing + Julian's punchy voice: short sentences, addresses "Messire" with vous. Human markers allowed:
« Aïe. », « Arf. », « Et non. », « Brutal, mais libérateur. ». No corporate jargon, no naive wonder, no emoji in long
text. NEVER use the phrases "Automatisation oui, abdication non" or "anti-blabla". Forbidden words anywhere:
écosystème, synergies, paradigme, disruptif, innovant.
Examples: « Missive envoyée. Un gobelin de moins. » · « 3 gobelins guerriers rôdent depuis plus d'une semaine. » ·
« Quête accomplie : +3 200 €. » · « Cette quête refroidit : 12 jours sans nouvelles. » · « Le scribe n'a rien trouvé
à dire. Donnez-lui une intention. » · Errors say what to do: « HubSpot ne répond plus. Reconnectez-le dans
claude.ai → Réglages → Connecteurs. »

## 2. Visual direction

- One committed look (single theme, no dark-mode blocks), but **time of day follows real Paris time**: day palette
  6h–18h, golden dusk 18h–20h, night 20h–6h (dark blue tint, torches & windows glow). That is the page's one bold idea.
- Palette (warm, natural, cozy): grass greens (#5A9E3A, #78B84A, #3E7A2C), cobblestone/path beige (#C9A66B, #A88550),
  wood browns (#8A4B22, #B5652B, #5B2E0F), stone greys with a warm bias (#8C8478, #B0A898, #5E574D), roof red
  (#B3402A, #8E2E1E), water blue (#4A8FC7), parchment UI (#F7D9A1 fill, #E8B86D shade, #5B2E0F border,
  #D9823B inner bevel), text dark brown (#3B1F0B), gold (#F2C14E, #D99A1E), heart red (#D93A3A).
- UI boxes look like the reference game's menus: parchment fill, thick dark-brown 3–4px border, an inner lighter
  bevel line, slightly rounded pixel corners (use `border-image` or layered box-shadows, no blur shadows),
  wooden buttons with a 2px darker bottom edge that depresses on :active.
- Fonts (Google Fonts, the only allowed font host):
  `Jacquarda Bastarda 9` (pixel blackletter) for big titles only (panel titles, "Quête accomplie !"),
  `Pixelify Sans` for UI labels, numbers, buttons, `Alegreya` for long reading text (email drafts, notes).
  Always with fallbacks (`"Pixelify Sans", ui-monospace, monospace`, `Alegreya, Georgia, serif`).
- Canvas pixel art: logical resolution 480×288 (30×18 tiles of 16px), drawn with `imageSmoothingEnabled=false`,
  CSS `image-rendering: pixelated`, scaled to container width (integer scale when ≥ 2× fits, otherwise fractional).
- Respect `prefers-reduced-motion` (no idle bobbing, effects become instant fades).

### Village layout (logical tile coords, 30×18)
- Stone **wall** ring around the village core roughly x 3..26, y 2..13 with a gate at the bottom-center. Goblins
  stand OUTSIDE the wall (left, right, top bands, and around the gate), deterministic positions from a hash of the
  task id, never overlapping buildings.
- **Castle/keep** top-center inside walls (castle = hero home; click → Héros panel).
- **Taverne** with a **quest board** in front, left side (click → Tableau). Badge = missives du jour count.
- **Pigeonnier (dovecote)** right side (click → Tableau too, filtered on "à envoyer"); pigeons idle on roof.
- **Coffre au trésor** next to the castle; fill level 0–4 from season gold % (click → Trésor).
- **Lutrin + Livre des Défaites** near the tavern (click → Chronique). Badge = reconquests due.
- **Camp of quests** outside the gate, bottom band y 14..17: one tent per open deal (max 24 drawn, extra counted
  on a sign "+N"), tent banner color by chapter (0 grey, I blue, II green, III purple, IV gold), banner height
  shows loyalty (droops + desaturates when cold), tiny 3-letter label is NOT needed in canvas (names live in UI).
  Click → quest detail.
- Hero knight sprite stands in the courtyard; idle animation; walks a few tiles toward a clicked target
  before the panel opens (≤ 400ms, skipped with reduced motion).
- Decoration: trees, bushes, flowers, a well, cobblestone paths, fences, torches (lit at dusk/night).

## 3. Runtime platform facts (authoritative — read these)

The page runs inside claude.ai's artifact viewer. `window.claude.use(name)` resolves a capability namespace or
`null` (later, never synchronously; `null` after ~10 s in a non-viewer frame). Never read `window.claude.db` etc.
Type definitions (READ the ones you use):
`/tmp/claude-0/bundled-skills/2.1.305/c1ae18fec1853e9591cd86e39f1e888e/artifact-capabilities/0.2.87/{claude,mcp,sample,db,user,permissions}.d.ts`

Declared capabilities (the publisher passes these; the page code must match):
```
{ mcp: { servers: [
    { server: "HubSpot", tools: ["search_crm_objects", "manage_crm_objects"] },
    { server: "Gmail",   tools: ["search_threads", "get_thread", "create_draft"] } ] },
  sample: {}, db: {}, user: {} }
```
- `mcp.callTool(server, tool, input, {cache:false})` → resolves `{payload, content, ...}`; read `result.payload`
  (already-parsed JSON). Rejects with `{code, server, message, retryable, retryAfterMs}`. Codes and the right UX:
  `needs_reauth` → "Reconnectez {server} dans claude.ai → Réglages → Connecteurs"; `server_not_connected` →
  "Ajoutez le connecteur {server} dans claude.ai → Réglages → Connecteurs"; `selection_required` → "Choisissez
  quel connecteur {server} utiliser (claude.ai vous le propose)"; `not_in_manifest` / `approval_required` →
  "Autorisation {server} refusée pour cette page" + a button calling `permissions.manage()` (built-in capability:
  `await claude.use("permissions")`… NOTE: permissions is built in — read permissions.d.ts for the exact access);
  `server_unavailable` / retryable `upstream_error` → ONE retry for READS only after 1–3 s random delay, honoring
  `retryAfterMs`; never auto-retry writes; `tool_error` → show message; anything else → generic. Contain each
  failure to its section; never one catch-all banner for everything.
- `sample` (a function): `sample.json(prompt, {modelTier:"default", onText, signal})`. First call asks the viewer's
  consent. Errors `{code, message, text?}`: `not_granted`/`sampling_disabled` → hide scribe; `rate_limited` →
  "Le scribe est épuisé, réessayez dans un moment"; `invalid_json` → offer "Réessayer"; `cancelled` → silent.
  Never retry from code. Call only on click.
- `db`: per-viewer private doc at `db.doc("data/users/" + uid + "/royaume")` where `uid = await (await claude.use("user")).id()`.
  One write at a time (queue), only on real state change (user action / new baseline), never in render loops.
  Doc ≤ 256 KiB: keep lists bounded (perfectDays ≤ 200, abattus ≤ 2000, lastSeen ≤ 500 deals).
  If db or uid unavailable → fall back to `localStorage` key `royaume-bourgogne-state` wrapped in try/catch.
- No `alert/confirm/prompt`. No `window.open` (use `<a href target=_blank rel=noopener>`). No downloads.
- Page source must contain **no real client data**. Live data arrives at runtime only.
- Scripts inline only (no CDN libs needed). Fonts via Google Fonts `<link>`.

### HubSpot connector (`server: "HubSpot"`) — observed shapes
`search_crm_objects` input:
```
{ objectType: "DEAL"|"TASK"|"CONTACT"|"NOTE"|"EMAIL",
  properties: [...], limit: 200, offset?: number,
  filterGroups?: [{ filters?: [{propertyName, operator:"EQ"|"NEQ"|"GT"|"LT"|..., value}],
                    associatedWith?: [{objectType:"tasks"|"contacts"|"deals", operator:"EQUAL", objectIdValues:[<number>]}] }],
  sorts?: [{propertyName, direction:"ASCENDING"|"DESCENDING"}],
  chatInsights: { userIntent: "Jeu de suivi commercial : lecture des deals et des tâches", satisfaction: "NEUTRAL" } }
```
payload: `{ results: [{ id: <number>, properties: {<name>: <string>, ...}, displayName }], total: <number>, offset: <number>, urlTemplate: "https://app.hubspot.com/...{id}..." }`
All property values are STRINGS (amount "3200", dates ISO "2026-10-19T07:00:00Z", empty string "" for unset; a
property may also be absent). Paging: repeat with `offset: payload.offset` while collected < total (cap 6 pages).
Record links: `urlTemplate.replace("{id}", id)`.

- Deals: properties `dealname, dealstage, amount, closedate, createdate, notes_last_contacted, notes_next_activity_date, closed_lost_reason`. Single pipeline "default". Stage ids: appointmentscheduled, qualifiedtobuy, presentationscheduled, contractsent, closedwon, closedlost (or empty).
- Open tasks: filter `hs_task_status NEQ COMPLETED`, sort `hs_timestamp ASCENDING`, properties `hs_task_subject, hs_task_body, hs_task_status, hs_timestamp, hs_task_type, hs_task_priority`. Status values: NOT_STARTED, IN_PROGRESS, WAITING, COMPLETED. Type: TODO, CALL, EMAIL, LINKED_IN. Priority: NONE, LOW, MEDIUM, HIGH. `hs_timestamp` = due date-time.
- Completed tasks (for XP history): filter `hs_task_status EQ COMPLETED`, properties `hs_timestamp, hs_task_completion_date`.
- Task → contact: CONTACT search with `associatedWith:[{objectType:"tasks",operator:"EQUAL",objectIdValues:[taskId]}]`, properties `firstname, lastname, email, company, jobtitle`. Task → deal: same with objectType DEAL (often empty; then DEAL associatedWith contacts).
- Notes: NOTE associatedWith contacts (and/or deals), properties `hs_note_body, hs_timestamp`, sort hs_timestamp DESC, limit 3. `hs_note_body` is HTML → strip tags, decode entities.
- Logged emails: EMAIL associatedWith contacts, properties `hs_email_subject, hs_email_text, hs_email_direction, hs_timestamp`, limit 3 (often 0 results).

`manage_crm_objects` input (the in-game click IS the user's confirmation):
```
{ confirmationStatus: "CONFIRMED",
  updateRequest: { objects: [ { objectType: "tasks", objectId: <number>, properties: { hs_task_status: "COMPLETED" } } ] } }
```
Reschedule: `properties: { hs_timestamp: "2026-10-27T07:00:00.000Z" }` (08:00 Paris that day; compute the UTC offset
properly for DST — do not hardcode +1/+2).

### Gmail connector (`server: "Gmail"`) — observed shapes
- `search_threads` `{query: "from:EMAIL OR to:EMAIL", pageSize: 3, view: "THREAD_VIEW_MINIMAL"}` → payload
  `{ threads: [{ id, messageCount, messages:[{id, date, sender, toRecipients:[...], subject, snippet, labelIds}], viewUrl }] }`
  (`{}` when none). Most recent thread first. Previews hold only the ~5 OLDEST messages → call get_thread.
- `get_thread` `{threadId, messageFormat: "PLAIN_TEXT"}` → `{ id, messages:[{ id, date, sender, toRecipients, subject, snippet, plaintextBody? }] }`
  — read the body defensively: `m.plaintextBody ?? m.plaintext_body ?? m.snippet ?? ""`. Take the last 3 messages by date.
- `create_draft` `{ to:[email], subject, body, replyToMessageId? }` → payload `{ id, threadId?, viewUrl }`.

## 4. Code architecture (single file, plain JS, no build step, no frameworks)

Final page = `$W/royaume.html`, content WITHOUT doctype/html/head/body tags (the publisher wraps it), in this order:
`<title>Royaume de Bourgogne</title>`, `<meta name="claude:viewport-fit-sides" content="cover">`, Google Fonts
`<link>`s, `<style>` (from `ui.css`), body markup (from `ui.html`), then `<script>` blocks: `art.js`, `logic.js`, `ui.js`.
Side gutter: `padding-left: max(16px, env(safe-area-inset-left, 0px))` and the right equivalent on the outer wrapper
(keep `:root` top/bottom padding from the skeleton; size with `height:100%` not `100vh`).

Builders write separate source files in `$W/src/`; the integrator concatenates. All globals are namespaced below.

### `art.js` → `window.ART`, `window.SFX` (owner: Art builder)
```
ART.TILE = 16; ART.W = 480; ART.H = 288
ART.icon(name, scale=2) → HTMLCanvasElement     // UI icons
ART.iconURL(name, scale=2) → string (data: URL, cached)
  icon names: coin, heart, heart_half, heart_empty, scroll, sword, pigeon, chest, book, goblin1, goblin2, goblin3,
              banner0, banner1, banner2, banner3, banner4, flame, star, shield, quill, hourglass, castle, tavern,
              hero, sound_on, sound_off, refresh, crown
ART.createScene(canvas, { onSelect(target), onHover(target|null) }) → scene
  target = { kind: "castle"|"board"|"dovecote"|"treasure"|"chronicle"|"quest"|"goblin"|"camp_more"|"hero", id?: string }
scene.setModel(sceneModel)        // re-layout & redraw; cheap to call often
scene.play(effect, payload)       // returns a Promise resolved when the effect ends
  effects: "missiveSent" {goblinId?} (pigeon flies off the dovecote; if goblinId, that goblin is hit & vanishes),
           "goblinSlain" {id}, "goblinRetreat" {id} (walks off-screen), "coinBurst" {}, "levelUp" {},
           "questWon" {id}, "questLost" {id}, "siegeLifted" {}
scene.setTimeOfDay(hour)          // 0..24 float, Paris time
scene.highlight(target|null)
scene.resize()                    // call on container resize
scene.destroy()
SFX.unlock()  // call from first user gesture (creates AudioContext)
SFX.play(name) // "click","sword","coin","pigeon","levelup","goblin","page","error","fanfare","scribe"
SFX.setMuted(bool); SFX.muted (boolean)
```
SFX are synthesized with WebAudio (no audio files). Sound effects only, no music (user decision).
Scene must render a pleasant village even with an empty model (0 quests, 0 goblins).

### `logic.js` → `window.LOGIC`, `window.DATA` (owner: Logic builder)
```
LOGIC.CONFIG = { heroName, goal:15000, tz:"Europe/Paris", thresholds, chapters, reconquestDays:120, siegeMin:10,
                 calendly:"https://calendly.com/thefrenchbot-coaching/30min", seasons:[...12 names] }
LOGIC.parisDay(dateOrIso) → "YYYY-MM-DD"
LOGIC.parisHour(date) → float
LOGIC.parisDateAt(dayString, hh, mm) → Date   // DST-correct
LOGIC.daysBetween(dayA, dayB) → int           // Paris calendar days
LOGIC.levelFromXp(xp) → {level, xp, floor, next}  // next = null at level 10
LOGIC.heroTitle(level) → string
LOGIC.emptyState() → State
LOGIC.buildModel(raw, state, now: Date) → GameModel
LOGIC.toSceneModel(model) → SceneModel
LOGIC.recordAction(state, {type:"sent"|"slain"|"postponed"|"reconquest", id, day}) → State (pure, returns new object)
LOGIC.observe(raw, state, now) → { events: [{type:"won"|"lost", deal}], state }  // updates lastSeen baseline; first run → no events
LOGIC.checkSiege(model, state, now) → State   // sets startedAt/initialCount when siege begins, completedAt (+ bonus flag) when goblins reach 0
LOGIC.buildDraftPrompt(context, intent, now) → string
LOGIC.errorCopy(err) → { title, text, action?: "permissions"|"retry"|null }
LOGIC.demoRaw(now) → Raw   // FICTIONAL demo data (invented Burgundy companies), dates relative to now; ~14 deals incl. 3 won this month,
                           // 2 lost (one with due reconquest), ~16 open tasks of which ~12 overdue across all 3 tiers, 2 today, 1 WAITING,
                           // ~60 completed tasks spread over 5 months
DATA = {
  init() → Promise<{ mode: "live"|"demo", reason?: string, can: { hubspot:boolean, gmail:boolean, scribe:boolean, db:boolean } }>
           // live when use("mcp") is non-null; demo otherwise (preview / outside viewer)
  loadAll() → Promise<Raw>          // live: HubSpot searches; demo: LOGIC.demoRaw
  completeTask(id), reopenTask(id), rescheduleTask(id, dayString)   // demo mode: mutate in-memory demo data
  getMissiveContext(task) → Promise<Context>
  draftMissive(context, intent, { onText, signal }) → Promise<{subject, body}>   // demo: canned fictional draft after a short fake delay
  createGmailDraft({ to, subject, body, replyToMessageId }) → Promise<{ id, viewUrl }>  // demo: fake
  loadState() → Promise<State>; saveState(state) → Promise<void> (single-flight queue, coalesces)
}
```
`Raw`:
```
{ deals: [{ id:string, name, stage:string|null, amount:number|null, closeDate:string|null(ISO), createDate:string|null,
            lastContact:string|null, nextActivity:string|null, lostReason:string|null, url:string|null }],
  openTasks: [{ id:string, subject, body, status, dueAt:string|null, type, priority, url:string|null }],
  completedTasks: [{ id:string, dueAt:string|null, completedAt:string|null }],
  fetchedAt: ISO, partial?: { completedTasks?: true } }
```
`State` (persisted):
```
{ v:1, lastSeen:{[dealId]:stage} | null, perfectDays:["YYYY-MM-DD"], actions:{ ["YYYY-MM-DD"]: number },
  todayDoneIds: { day, ids:[] }, abattus:[taskId], siege:{ startedAt:null|ISO, initialCount:0, completedAt:null|ISO },
  reconquests:{ [dealId]: "launched"|"dismissed" }, muted:false, seenIntro:false }
```
`GameModel`:
```
{ now, today, hour,
  hero: { name, level, title, skills:{ relance:LevelInfo, closing:LevelInfo, prospection:LevelInfo }, streak, perfectToday },
  season: { key:"YYYY-MM", name, monthLabel, goal, gold, pct (0..1+), daysLeft, won:[deal] },
  treasureAllTime,
  quests: [Quest sorted by chapter desc then cold first],     // open deals (stage not closedwon/closedlost)
  missives: { today:[Missive], overdue:[Missive oldest first], upcoming:[Missive next 14 days], waiting:[Missive] },
  chronicle: [{ deal, lostDay, reason, reconquestDay, reconquestDue:boolean, reconquestState }],
  reconquestsDue: [...],
  siege: { active, total, initialCount, defeated },
  counts: { goblins, goblinsByTier:[t1,t2,t3], missivesToday, coldQuests, openQuests }
}
Quest = { id, name, client (text before " - "/" — " in name, trimmed), amount, stage, chapter (0..4), chapterLabel,
          daysSinceContact, threshold, hearts, cold, nextActivityDay|null, url }
Missive = { id, subject, body, status, dueDay, daysOverdue, tier (0 when not overdue), type, priority, url }
```
`Context` (for the scribe):
```
{ task: Missive, contact: {id, name, firstname, email, company, jobtitle}|null, deal: {id, name, stage, amount}|null,
  notes: [{ day, text }], emails: [{ day, direction, subject, text }],
  gmail: { threadId, subject, lastMessageId, messages: [{ day, from, text }] } | null,
  errors: [{ section:"hubspot"|"gmail", code, message }] }
```

### `ui.html` + `ui.css` + `ui.js` (owner: UI builder)
Layout:
- Desktop ≥ 900px: left = scene card (canvas, 16:9.6 ratio) with a small top-left "Royaume de Bourgogne" pixel
  title plate; right column (300–340px) = HUD: date box (« Mar. 20 Oct » + Paris time HH:MM ticking each minute),
  gold box (season gold €), season box (name + progress bar to 15 000 € + days left), hero card (portrait icon, name,
  title, level, 3 skill bars with level numbers, streak flame + count, perfect-day check), a compact "Ordres du jour"
  list (missives du jour + top 3 goblins) with quick actions. Bottom toolbar under the scene: Tableau (count),
  Quêtes (count), Trésor, Chronique (badge), Héros, sound toggle, refresh.
- Mobile < 900px: compact HUD strip on top (date · gold · season mini-bar), scene full width, then "Ordres du jour"
  list, and a fixed bottom nav (Tableau, Quêtes, Trésor, Chronique, Héros) with safe-area bottom inset.
- Panels = Stardew-style parchment modal over the scene (desktop: centered, max 720px wide, max-height 86%, inner
  scroll; mobile: full-screen sheet with a close button and a sticky header). Esc closes, focus is trapped & restored.
  Panels: **Tableau de la taverne** (tabs: Du jour / Gobelins (with tier filter chips) / À venir / En attente),
  **Missive** detail (subject, due, tier, body, HubSpot link, actions: Rédiger avec le scribe / Missive envoyée /
  Reporter ▾ +2 +7 +14 / Abattre (in-page confirm) ), **Scribe** (context summary collapsible, intent input, streaming
  state, editable subject/body, Créer le brouillon Gmail / Réécrire / Copier, then Missive envoyée),
  **Journal des quêtes** (grouped by chapter IV→0, each row: client, amount €, hearts, days since contact, cold badge,
  planned-relance pigeon, link HubSpot), **Trésor** (season gold vs goal, list of won deals this season, all-time
  total), **Livre des Défaites** (lost deals: name, day, reason, reconquest day; due ones get « Lancer la reconquête »
  → scribe flow with that deal's context, and « Oublier »), **Héros** (skills detail with XP to next level, titles
  ladder, streak, perfect days calendar of the current month), **Siège** (Grand Nettoyage card flow).
- Toasts bottom-center (above mobile nav), Stardew-like little parchment with icon; with optional action button
  (« Annuler »). Celebration modal for won/lost/level-up/siege-lifted.
- Status ribbon when `mode==="demo"`: « Démo — ouvrez cette page dans claude.ai avec HubSpot connecté pour jouer
  avec vos vraies données. » Errors per section (HubSpot block, Gmail block, scribe block) with the right copy.
- First frame (before data): the village renders immediately with a "Le héraut apporte les nouvelles…" loading
  plate; never an empty white page.
- Boot sequence: render scene empty → DATA.init → DATA.loadState → DATA.loadAll → LOGIC.observe (events) →
  LOGIC.buildModel → LOGIC.checkSiege → render everything → save state if changed → show celebrations queue →
  siege banner if active. Clock tick each 60 s: update time-of-day + date (rebuild model when the Paris day changes).
  Refresh button reloads data (and re-runs observe).
- Every action: optimistic UI is NOT allowed for writes — show a spinner on the button, await DATA, then play the
  effect (`scene.play`) + SFX + toast, then re-fetch tasks (`DATA.loadAll()`) and rebuild the model. On failure:
  restore, show error copy in that panel.
- Accessibility: all canvas targets are ALSO reachable via the HTML UI (toolbar/nav/lists); buttons are real
  `<button>`s with labels; visible focus ring (gold); `aria-live="polite"` region for toasts.
- Keyboard shortcuts on desktop: T (Tableau), Q (Quêtes), H (Héros), Esc.

## 5. Testing harness (integrator)
Local test page = `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>` + royaume.html + `</body></html>`.
Mock `window.claude` injected BEFORE page scripts (Playwright `addInitScript`):
- demo test: `window.claude = { use: async () => null }`.
- live test: fake `mcp` (callTool answering search_crm_objects/manage_crm_objects/search_threads/get_thread/create_draft
  with FICTIONAL data in the exact shapes above), fake `sample` function with `.json`, fake `db` (in-memory doc
  store with doc().get/set/update), fake `user` with `id()`.
Run with Node Playwright (`require('playwright')`, chromium from PLAYWRIGHT_BROWSERS_PATH, or
`executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` if needed). Screenshots at 1440×900 and
390×844, day and night (mock the clock with `page.clock` or by overriding Date if needed). Zero console errors.
