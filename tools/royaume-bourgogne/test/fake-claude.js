// Fake claude.ai runtime for the Royaume de Bourgogne test harness (SPEC section 5).
// Injected with page.addInitScript(installFakeClaude, cfg) BEFORE any page script runs.
// Everything below is FICTIONAL test data (invented Burgundy companies, *.example addresses).
// It must stay self-contained: Playwright serializes this function's source into the page.
/* eslint-disable no-var */
function installFakeClaude(cfg) {
  cfg = cfg || {};
  var mode = cfg.mode || 'demo';
  if (mode === 'demo') {
    // Demo: the viewer answers every capability with null, asynchronously.
    window.claude = Object.freeze({ use: function () { return new Promise(function (r) { setTimeout(function () { r(null); }, 20); }); } });
    return;
  }

  var F = window.__fake = {
    calls: [], sampleCalls: [], dbWrites: [], dbOverlaps: 0, permissionsCalls: 0, useCalls: [],
    store: {}, latency: cfg.latency || 40
  };
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rej(code, server, message, extra) {
    var e = { code: code, server: server, message: message };
    if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
    return Promise.reject(e);
  }

  // ---------- dates (relative to the test's Paris day) ----------
  var B = cfg.baseDay ? cfg.baseDay.split('-').map(Number) : [2026, 10, 21];
  function iso(offDays, hh, mm) { return new Date(Date.UTC(B[0], B[1] - 1, B[2] + offDays, hh == null ? 7 : hh, mm || 0)).toISOString(); }
  function isoNoMs(offDays, hh, mm) { return iso(offDays, hh, mm).replace('.000Z', 'Z'); }

  // ---------- HubSpot world ----------
  var PORTAL = 'https://app.hubspot.com/contacts/40400404/record/';
  var TPL = { DEAL: PORTAL + '0-3/{id}', TASK: PORTAL + '0-27/{id}', CONTACT: PORTAL + '0-1/{id}', NOTE: PORTAL + '0-46/{id}', EMAIL: PORTAL + '0-49/{id}' };
  function deal(id, name, stage, amount, created, lastContact, next, close, reason) {
    return { id: id, displayName: name, properties: {
      dealname: name, dealstage: stage, amount: amount, createdate: created, notes_last_contacted: lastContact,
      notes_next_activity_date: next, closedate: close, closed_lost_reason: reason, hs_object_id: String(id) } };
  }
  var deals = [
    deal(9001, 'Domaine des Trois Tilleuls - Formation IA équipe', 'contractsent', '4800', iso(-40), iso(-3, 9), iso(2, 8), iso(20), ''),
    deal(9002, 'Fromagerie du Val d\'Ouche — Atelier Claude', 'presentationscheduled', '2600', iso(-35), iso(-12, 14), '', iso(30), ''),
    deal(9003, 'Cabinet Morvan Conseil - Accompagnement', 'qualifiedtobuy', '3500', iso(-25), iso(-5, 10), '', '', ''),
    deal(9004, 'Brasserie de la Côte - Audit IA', 'appointmentscheduled', '1200', iso(-60), iso(-30, 15), '', '', ''),
    deal(9005, 'Menuiserie Vauban - Atelier prompts', '', '', iso(-10), '', '', '', ''),
    deal(9006, 'Imprimerie des Ducs - Formation', 'contractsent', '6200', iso(-50), iso(-9, 11), '', iso(10), ''),
    deal(9007, 'Atelier Saint-Bénigne — Pack équipe', 'closedwon', '3200', iso(-45), iso(-1, 9), '', iso(-1, 13), ''),
    deal(9008, 'Transports Chalonnais - IA logistique', 'closedlost', '5400', iso(-70), iso(-2, 9), '', iso(-2, 16), 'Budget gelé jusqu\'en 2027'),
    deal(9009, 'Pâtisserie Montchapet - Formation', 'closedwon', '2100', iso(-80), iso(-16, 9), '', iso(-16, 12), ''),
    deal(9010, 'Vignobles des Hautes-Côtes - Atelier', 'closedlost', '2400', iso(-200), iso(-154, 9), '', iso(-154, 12), 'Pas le bon moment'),
    deal(9011, 'Coopérative du Châtillonnais - IA', 'qualifiedtobuy', '1800', iso(-8), iso(-1, 16), iso(5, 9), '', ''),
    deal(9012, 'Agence Beaune Numérique - Formation Claude', 'presentationscheduled', '2900', iso(-20), iso(-4, 9), '', '', '')
  ];
  // Unset properties: some are "" (as HubSpot sends), one is absent altogether.
  delete deals[4].properties.notes_last_contacted;

  function task(id, subject, body, status, dueIso, type, prio) {
    return { id: id, displayName: subject, properties: {
      hs_task_subject: subject, hs_task_body: body, hs_task_status: status, hs_timestamp: dueIso,
      hs_task_type: type || 'TODO', hs_task_priority: prio || 'NONE', hs_task_completion_date: '', hs_object_id: String(id) } };
  }
  var tasks = [
    task(5001, 'Relancer Imprimerie des Ducs : devis D-2026-031', '<p>Paul attend l&#39;accord de son associé sur le devis <b>D-2026-031</b>.</p>', 'NOT_STARTED', iso(-35, 6), 'EMAIL', 'HIGH'),
    task(5002, 'Relance Paul Garnier — planning des sessions', '<p>Proposer deux dates pour la première session.<br>Il préfère les matinées.</p>', 'NOT_STARTED', iso(-31, 6), 'EMAIL', 'MEDIUM'),
    task(5003, 'Rappeler la Brasserie de la Côte', 'Faire le point sur l&#39;audit après leur salon.', 'NOT_STARTED', iso(-20, 6), 'CALL', 'LOW'),
    task(5004, 'Envoyer le compte rendu à Cabinet Morvan', 'Compte rendu du rendez-vous de découverte.', 'NOT_STARTED', iso(-14, 6), 'EMAIL', 'NONE'),
    task(5005, 'Relancer la Fromagerie du Val d\'Ouche', '', 'NOT_STARTED', iso(-9, 6), 'EMAIL', 'MEDIUM'),
    task(5006, 'Message LinkedIn à Agence Beaune Numérique', 'Remercier pour la démo.', 'NOT_STARTED', iso(-7, 6), 'LINKED_IN', 'NONE'),
    task(5007, 'Préparer la proposition Coopérative', 'Deux options de format.', 'NOT_STARTED', iso(-5, 6), 'TODO', 'NONE'),
    task(5008, 'Relancer Menuiserie Vauban', 'Qualifier le besoin réel.', 'NOT_STARTED', iso(-3, 6), 'EMAIL', 'NONE'),
    task(5009, 'Rappeler le Domaine des Trois Tilleuls', 'Valider la date de signature.', 'NOT_STARTED', iso(-2, 6), 'CALL', 'HIGH'),
    task(5010, 'Envoyer le support de l\'atelier', '', 'NOT_STARTED', iso(-1, 6), 'EMAIL', 'NONE'),
    task(5011, 'Relancer Transports Chalonnais (dossier clos ?)', '', 'NOT_STARTED', iso(-4, 6), 'EMAIL', 'NONE'),
    task(5017, 'Finaliser le programme pour la Brasserie', 'Version courte demandée.', 'IN_PROGRESS', iso(-12, 6), 'TODO', 'MEDIUM'),
    task(5012, 'Envoyer le programme à la Fromagerie', 'Programme détaillé sur deux demi-journées.', 'NOT_STARTED', iso(0, 6), 'EMAIL', 'HIGH'),
    task(5013, 'Appeler le Cabinet Morvan', '', 'NOT_STARTED', iso(0, 13), 'CALL', 'NONE'),
    task(5014, 'Attendre retour Domaine des Trois Tilleuls', 'Ils consultent leur comptable.', 'WAITING', iso(-6, 6), 'EMAIL', 'NONE'),
    task(5015, 'Relance Coopérative du Châtillonnais', '', 'NOT_STARTED', iso(3, 6), 'EMAIL', 'NONE'),
    task(5016, 'Point trimestriel Pâtisserie Montchapet', '', 'NOT_STARTED', iso(10, 6), 'CALL', 'LOW')
  ];
  // Completed history (25 tasks over ~3 months) → 3 pages at the fake server's page size.
  for (var i = 0; i < 25; i++) {
    var due = -3 - i * 3;
    var t = task(4000 + i, 'Relance archivée ' + (i + 1), '', 'COMPLETED', iso(due, 6), 'EMAIL', 'NONE');
    t.properties.hs_task_completion_date = iso(due + (i % 4 === 0 ? 1 : 0), i % 2 ? 9 : 15);
    tasks.push(t);
  }

  var contacts = {
    7001: { id: 7001, displayName: 'Claire Bernard', properties: { firstname: 'Claire', lastname: 'Bernard', email: 'claire.bernard@trois-tilleuls.example', company: 'Domaine des Trois Tilleuls', jobtitle: 'Gérante' } },
    7002: { id: 7002, displayName: 'Paul Garnier', properties: { firstname: 'Paul', lastname: 'Garnier', email: 'paul.garnier@imprimerie-ducs.example', company: 'Imprimerie des Ducs', jobtitle: 'Directeur général' } },
    7003: { id: 7003, displayName: 'Sophie Lemaire', properties: { firstname: 'Sophie', lastname: 'Lemaire', email: 'sophie@fromagerie-ouche.example', company: 'Fromagerie du Val d\'Ouche', jobtitle: 'Co-fondatrice' } },
    7004: { id: 7004, displayName: 'Marc Duval', properties: { firstname: 'Marc', lastname: 'Duval', email: '', company: 'Brasserie de la Côte', jobtitle: 'Brasseur' } },
    7005: { id: 7005, displayName: 'Hélène Roy', properties: { firstname: 'Hélène', lastname: 'Roy', email: 'helene.roy@hautes-cotes.example', company: 'Vignobles des Hautes-Côtes', jobtitle: 'Responsable administrative' } }
  };
  var taskContact = { 5001: 7002, 5002: 7002, 5003: 7004, 5005: 7003, 5009: 7001, 5012: 7003, 5014: 7001, 5017: 7004 };
  var taskDeal = { 5001: 9006, 5003: 9004, 5005: 9002, 5009: 9001 }; // 5002 has none → fallback via contact
  var contactDeals = { 7001: [9001], 7002: [9006], 7003: [9002], 7004: [9004], 7005: [9010] };
  var notes = {
    7002: [
      { id: 8101, properties: { hs_note_body: '<p>Appel avec Paul : l&#39;équipe compta veut commencer par Excel et les e-mails clients.</p><p>Devis <b>D-2026-031</b> envoyé.</p>', hs_timestamp: iso(-38, 14) } },
      { id: 8102, properties: { hs_note_body: '<div>Paul : &quot;on signe dès que mon associé rentre de congés&quot;.</div>', hs_timestamp: iso(-33, 10) } }
    ]
  };
  var gmailThreads = {
    'paul.garnier@imprimerie-ducs.example': {
      id: 'thr-ducs-1', messageCount: 3, viewUrl: 'https://mail.google.com/mail/u/0/#all/thr-ducs-1',
      messages: [
        { id: 'msg-ducs-a', date: isoNoMs(-40, 8), sender: 'Julian <julian@thefrenchbot.example>', toRecipients: ['paul.garnier@imprimerie-ducs.example'], subject: 'Devis D-2026-031 · formation IA', snippet: 'Bonjour Paul, voici le devis…', labelIds: ['SENT'] },
        { id: 'msg-ducs-b', date: isoNoMs(-37, 15), sender: 'Paul Garnier <paul.garnier@imprimerie-ducs.example>', toRecipients: ['julian@thefrenchbot.example'], subject: 'Re: Devis D-2026-031 · formation IA', snippet: 'Merci, je le montre à mon associé.', labelIds: ['INBOX'] }
      ]
    }
  };
  var fullThreads = {
    'thr-ducs-1': { id: 'thr-ducs-1', messages: [
      { id: 'msg-ducs-a', date: isoNoMs(-40, 8), sender: 'Julian <julian@thefrenchbot.example>', toRecipients: ['paul.garnier@imprimerie-ducs.example'], subject: 'Devis D-2026-031 · formation IA', snippet: 'Bonjour Paul…', plaintextBody: 'Bonjour Paul,\nVoici le devis D-2026-031 pour la formation de votre équipe.\nJulian' },
      { id: 'msg-ducs-b', date: isoNoMs(-37, 15), sender: 'Paul Garnier <paul.garnier@imprimerie-ducs.example>', toRecipients: ['julian@thefrenchbot.example'], subject: 'Re: Devis D-2026-031 · formation IA', snippet: 'Merci…', plaintextBody: 'Merci Julian, je le montre à mon associé à son retour.\nPaul' },
      { id: 'msg-ducs-c', date: isoNoMs(-30, 9), sender: 'Julian <julian@thefrenchbot.example>', toRecipients: ['paul.garnier@imprimerie-ducs.example'], subject: 'Re: Devis D-2026-031 · formation IA', snippet: 'Bonjour Paul, votre associé…', plaintext_body: 'Bonjour Paul,\nVotre associé a-t-il pu regarder le devis ?\nJulian' }
    ] }
  };
  F.world = { deals: deals, tasks: tasks };
  F.setReauth = function (v) { cfg.reauth = !!v; };

  // ---------- HubSpot search engine ----------
  var PAGE = cfg.pageSize || 10;
  function propFilter(rec, f) {
    var v = rec.properties[f.propertyName];
    v = v == null ? '' : String(v);
    switch (f.operator) {
      case 'EQ': return v === String(f.value);
      case 'NEQ': return v !== String(f.value);
      case 'GT': return v > String(f.value);
      case 'LT': return v < String(f.value);
      case 'HAS_PROPERTY': return v !== '';
      default: return true;
    }
  }
  function assocIds(objectType, a) {
    var id = Number(a.objectIdValues && a.objectIdValues[0]);
    if (objectType === 'CONTACT' && a.objectType === 'tasks') return taskContact[id] ? [taskContact[id]] : [];
    if (objectType === 'DEAL' && a.objectType === 'tasks') return taskDeal[id] ? [taskDeal[id]] : [];
    if (objectType === 'DEAL' && a.objectType === 'contacts') return contactDeals[id] || [];
    if (objectType === 'CONTACT' && a.objectType === 'deals') {
      return Object.keys(contactDeals).filter(function (c) { return contactDeals[c].indexOf(id) >= 0; }).map(Number);
    }
    return null; // handled by the caller (notes/emails)
  }
  function pick(rec, props) {
    var p = { hs_object_id: String(rec.id) };
    (props || []).forEach(function (k) { if (Object.prototype.hasOwnProperty.call(rec.properties, k)) p[k] = rec.properties[k]; });
    return { id: rec.id, properties: p, displayName: rec.displayName || '' };
  }
  function search(input) {
    var type = input.objectType;
    var groups = input.filterGroups || [];
    var pool;
    if (type === 'DEAL') pool = deals;
    else if (type === 'TASK') pool = tasks;
    else if (type === 'CONTACT') pool = Object.keys(contacts).map(function (k) { return contacts[k]; });
    else if (type === 'NOTE') pool = [];
    else if (type === 'EMAIL') pool = [];
    else return rej('tool_error', 'HubSpot', 'Unknown objectType ' + type);
    var g = groups[0];
    if (g && g.associatedWith && g.associatedWith.length) {
      var a = g.associatedWith[0];
      if (a.operator !== 'EQUAL' || !Array.isArray(a.objectIdValues) || typeof a.objectIdValues[0] !== 'number') {
        return rej('tool_error', 'HubSpot', 'associatedWith expects operator EQUAL and numeric objectIdValues');
      }
      if (type === 'NOTE') pool = a.objectType === 'contacts' ? (notes[a.objectIdValues[0]] || []) : [];
      else if (type === 'EMAIL') pool = [];
      else {
        var ids = assocIds(type, a) || [];
        pool = pool.filter(function (r) { return ids.indexOf(Number(r.id)) >= 0; });
      }
    }
    if (g && g.filters) pool = pool.filter(function (r) { return g.filters.every(function (f) { return propFilter(r, f); }); });
    var s = input.sorts && input.sorts[0];
    if (s) {
      pool = pool.slice().sort(function (x, y) {
        var a = String(x.properties[s.propertyName] || ''), b = String(y.properties[s.propertyName] || '');
        return (a < b ? -1 : a > b ? 1 : 0) * (s.direction === 'DESCENDING' ? -1 : 1);
      });
    }
    var off = Number(input.offset || 0);
    var size = Math.min(Number(input.limit || 10), PAGE);
    var page = pool.slice(off, off + size).map(function (r) { return pick(r, input.properties); });
    return Promise.resolve({ results: page, total: pool.length, offset: off + page.length, urlTemplate: TPL[type] });
  }
  function manage(input) {
    var o = input && input.updateRequest && input.updateRequest.objects;
    if (!input || input.confirmationStatus !== 'CONFIRMED' || !Array.isArray(o) || o.length !== 1 ||
        o[0].objectType !== 'tasks' || typeof o[0].objectId !== 'number' || !o[0].properties) {
      return rej('tool_error', 'HubSpot', 'Invalid manage_crm_objects input');
    }
    var rec = tasks.filter(function (t) { return t.id === o[0].objectId; })[0];
    if (!rec) return rej('tool_error', 'HubSpot', 'Task not found');
    var props = o[0].properties;
    Object.keys(props).forEach(function (k) { rec.properties[k] = String(props[k]); });
    if (props.hs_task_status === 'COMPLETED') rec.properties.hs_task_completion_date = new Date().toISOString();
    if (props.hs_task_status && props.hs_task_status !== 'COMPLETED') rec.properties.hs_task_completion_date = '';
    return Promise.resolve({ status: 'COMPLETE', results: [{ id: rec.id, objectType: 'tasks', properties: clone(props) }] });
  }

  // ---------- Gmail ----------
  var draftN = 0;
  function gmail(tool, input) {
    if (tool === 'search_threads') {
      var m = /^from:(\S+) OR to:(\S+)$/.exec(input.query || '');
      if (!m || m[1] !== m[2] || input.pageSize !== 3 || input.view !== 'THREAD_VIEW_MINIMAL') return rej('tool_error', 'Gmail', 'Bad search_threads input');
      var th = gmailThreads[m[1]];
      return Promise.resolve(th ? { threads: [clone(th)] } : {});
    }
    if (tool === 'get_thread') {
      if (input.messageFormat !== 'PLAIN_TEXT') return rej('tool_error', 'Gmail', 'Bad get_thread input');
      var full = fullThreads[input.threadId];
      return full ? Promise.resolve(clone(full)) : rej('tool_error', 'Gmail', 'Thread not found');
    }
    if (tool === 'create_draft') {
      if (!Array.isArray(input.to) || !input.to.length || typeof input.subject !== 'string' || typeof input.body !== 'string') return rej('tool_error', 'Gmail', 'Bad create_draft input');
      draftN++;
      var id = 'r-draft-' + draftN;
      return Promise.resolve({ id: id, threadId: input.replyToMessageId ? 'thr-ducs-1' : 'thr-new-' + draftN, viewUrl: 'https://mail.google.com/mail/u/0/#drafts?compose=' + id });
    }
    return rej('not_in_manifest', 'Gmail', 'Tool not declared');
  }

  // ---------- mcp namespace ----------
  var MANIFEST = { HubSpot: ['search_crm_objects', 'manage_crm_objects'], Gmail: ['search_threads', 'get_thread', 'create_draft'] };
  function callTool(server, tool, input, options) {
    var rec = { server: server, tool: tool, input: clone(input), options: clone(options), t: Date.now(), seq: F.calls.length };
    F.calls.push(rec);
    var lat = F.latency;
    return delay(lat).then(function () {
      if (!MANIFEST[server] || MANIFEST[server].indexOf(tool) < 0) return rej('not_in_manifest', server, 'Not in manifest');
      if (cfg.reauth && server === 'HubSpot') return rej('needs_reauth', 'HubSpot', 'HubSpot token expired');
      if (cfg.failWrites && server === 'HubSpot' && tool === 'manage_crm_objects') return rej('approval_required', 'HubSpot', 'Approval required');
      var p;
      if (server === 'HubSpot') p = tool === 'search_crm_objects' ? search(input || {}) : manage(input);
      else p = gmail(tool, input || {});
      return p.then(function (payload) {
        rec.ok = true;
        return { content: [{ type: 'text', text: JSON.stringify(payload) }], payload: payload };
      }, function (e) { rec.error = e; throw e; });
    });
  }
  var mcp = Object.freeze({
    callTool: callTool,
    listTools: function () {
      return delay(10).then(function () {
        return { servers: Object.keys(MANIFEST).map(function (s) {
          return { server: s, kind: 'connector', authStatus: cfg.reauth && s === 'HubSpot' ? 'needs_reauth' : 'connected',
            tools: MANIFEST[s].map(function (n) { return { name: n, description: '' }; }) };
        }) };
      });
    },
    watchTool: function () { return function () {}; },
    invalidate: function () { return Promise.resolve(); },
    server: function () { return rej('server_not_connected', null, 'not in fake'); },
    describeTool: function () { return rej('bad_request', null, 'no schema in fake'); }
  });

  // ---------- sample (the scribe) ----------
  var DRAFT = {
    subject: 'Devis D-2026-031 : on cale la première session ?',
    body: 'Bonjour Paul,\n\nVotre associé est-il rentré ? Vous m\'aviez dit vouloir commencer par Excel et les e-mails clients.\n\nJe vous propose de caler la première session sur une matinée, comme vous préférez. Choisissez un créneau de 30 minutes ici : https://calendly.com/thefrenchbot-coaching/30min\n\nJulian\nThe French Bot'
  };
  function sampleCore(input, opts, asJson) {
    opts = opts || {};
    F.sampleCalls.push({ input: typeof input === 'string' ? input : clone(input), modelTier: opts.modelTier, cache: opts.cache, hasOnText: typeof opts.onText === 'function', hasSignal: !!opts.signal, json: asJson });
    if (cfg.sampleError) return delay(80).then(function () { throw { code: cfg.sampleError, message: 'fake ' + cfg.sampleError }; });
    var text = JSON.stringify(DRAFT);
    var shown = '';
    var steps = 4;
    var k = 0;
    return new Promise(function (resolve, reject) {
      function abort() { reject({ code: 'cancelled', message: 'aborted', text: shown }); }
      if (opts.signal) { if (opts.signal.aborted) return abort(); opts.signal.addEventListener('abort', abort, { once: true }); }
      function step() {
        if (opts.signal && opts.signal.aborted) return;
        k++;
        var next = text.slice(0, Math.ceil(text.length * k / steps));
        var delta = next.slice(shown.length);
        shown = next;
        if (typeof opts.onText === 'function') opts.onText({ text: shown, delta: delta });
        if (k < steps) setTimeout(step, 120);
        else setTimeout(function () { resolve(asJson ? clone(DRAFT) : { text: text, truncated: false, modelTierApplied: 'default' }); }, 60);
      }
      setTimeout(step, 150);
    });
  }
  var sample = function (input, opts) { return sampleCore(input, opts, false); };
  sample.json = function (input, opts) { return sampleCore(input, opts, true); };
  sample.limits = function () { return Promise.resolve({ maxPromptBytes: 262144 }); };
  Object.freeze(sample);

  // ---------- db (in-memory doc store) ----------
  var UID = 'u-fake-viewer-1';
  F.uid = UID;
  if (cfg.seedState) F.store['data/users/' + UID + '/royaume'] = clone(cfg.seedState);
  var inflight = {};
  function docRef(path) {
    var segs = String(path).split('/');
    if (segs.length % 2 !== 0 || segs.some(function (s) { return !s; })) throw new TypeError('bad document path ' + path);
    function snap() {
      var v = F.store[path];
      return Object.freeze({ id: segs[segs.length - 1], exists: v !== undefined, data: function () { return v === undefined ? undefined : clone(v); }, metadata: { fromCache: false, hasPendingWrites: false } });
    }
    function write(kind, data) {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return Promise.reject({ code: 'invalid_argument', message: 'body must be an object' });
      var json = JSON.stringify(data);
      if (json.length > 256 * 1024) return Promise.reject({ code: 'invalid_argument', message: 'document over 256 KiB' });
      if (inflight[path]) F.dbOverlaps++;
      inflight[path] = (inflight[path] || 0) + 1;
      F.dbWrites.push({ kind: kind, path: path, t: Date.now(), bytes: json.length });
      return delay(60).then(function () {
        inflight[path]--;
        if (kind === 'update') {
          if (F.store[path] === undefined) throw { code: 'invalid_argument', message: 'update on missing doc' };
          F.store[path] = Object.assign({}, F.store[path], clone(data));
        } else F.store[path] = clone(data);
      });
    }
    return Object.freeze({
      id: segs[segs.length - 1], path: path,
      get: function () { return delay(30).then(snap); },
      set: function (d) { return write('set', d); },
      update: function (d) { return write('update', d); },
      delete: function () { delete F.store[path]; return Promise.resolve(); },
      onSnapshot: function (next) { setTimeout(function () { next(snap()); }, 10); return function () {}; }
    });
  }
  var db = Object.freeze({ doc: docRef, collection: function () { throw new TypeError('collections not used by this page'); } });

  var user = Object.freeze({
    id: function () { return delay(15).then(function () { return UID; }); },
    name: function () { return Promise.resolve('Julian'); },
    isOwner: function () { return Promise.resolve(true); },
    canEdit: function () { return Promise.resolve(true); },
    can: function () { return Promise.resolve(true); }
  });
  var permissions = Object.freeze({
    state: function () { return Promise.resolve({ mcp: 'granted', sample: 'granted', db: 'granted', user: 'granted' }); },
    request: function () { return Promise.resolve({}); },
    manage: function () { F.permissionsCalls++; return delay(200); }
  });

  var caps = { mcp: mcp, sample: cfg.noSample ? null : sample, db: cfg.noDb ? null : db, user: user, permissions: permissions };
  window.claude = Object.freeze({
    use: function (name) {
      F.useCalls.push(name);
      // Never synchronous: the viewer answers on a later task.
      return new Promise(function (resolve) { setTimeout(function () { resolve(caps[name] || null); }, 25 + Math.floor(Math.random() * 30)); });
    }
  });
}
if (typeof module !== 'undefined') module.exports = { installFakeClaude: installFakeClaude };
