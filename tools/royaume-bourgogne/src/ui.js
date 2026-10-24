/* Royaume de Bourgogne — ui.js
 * Page controller: HUD, panels, toasts, celebrations, siege, scribe, boot sequence.
 * Uses only window.ART / window.SFX / window.LOGIC / window.DATA (SPEC section 4) and exposes window.UI.
 * Plain JavaScript, no dependencies. All French copy lives in COPY below.
 */
(function () {
  'use strict';

  // ===========================================================================
  // COPY — every string the page shows. Medieval framing, punchy, vouvoiement.
  // ===========================================================================
  var COPY = {
    loading: 'Le héraut apporte les nouvelles…',
    loadingAgain: 'Le héraut repart aux nouvelles…',
    demo: 'Démo — ouvrez cette page dans claude.ai avec HubSpot connecté pour jouer avec vos vraies données.',
    tod: { day: 'Jour', dusk: 'Crépuscule', night: 'Nuit' },
    canvas: function (m) {
      if (!m) return 'Le village de Bourgogne vu du ciel.';
      return 'Le village de Bourgogne : ' + pl(m.counts.goblins, 'gobelin', 'gobelins') + ' aux portes, ' +
        pl(m.counts.openQuests, 'quête', 'quêtes') + ' au camp, coffre rempli à ' + pct(m.season.pct) + '.';
    },
    sound: { label: 'Effets sonores', on: 'Couper le son', off: 'Activer le son' },
    refresh: { label: 'Rafraîchir les nouvelles', done: 'Nouvelles fraîches du héraut.' },
    toolbar: {
      board: function (n) { return 'Tableau de la taverne' + (n ? ', ' + pl(n, 'missive', 'missives') + ' à traiter' : ''); },
      quests: function (n) { return 'Quêtes\u00A0: journal, ' + (n == null ? 'hors ligne' : pl(n, 'quête ouverte', 'quêtes ouvertes')); },
      chronicle: function (n) { return 'Chronique\u00A0: Livre des Défaites' + (n ? ', ' + pl(n, 'reconquête due', 'reconquêtes dues') : ''); }
    },
    hud: {
      seasonK: function (month) { return 'Saison · ' + month; },
      daysLeft: function (n) { return n <= 1 ? 'dernier jour' : n + ' j restants'; },
      daysLeftShort: function (n) { return n <= 1 ? 'dernier j.' : n + ' j'; },
      goal: function (gold, goal, p) { return money(gold) + ' / ' + money(goal) + ' · ' + p; },
      streak: function (n) { return n > 1 ? 'jours parfaits' : 'jour parfait'; },
      perfectOn: 'Journée parfaite',
      perfectOff: 'Pas encore parfaite',
      weekend: 'Repos\u00A0: c’est le week-end',
      offline: 'Hors ligne',
      unknown: '—',
      level: function (n) { return 'Niveau ' + n; }
    },
    orders: {
      count: function (n) { return n ? n + ' à traiter' : ''; },
      empty: 'Rien d’urgent. Le royaume respire.',
      noData: 'Pas de nouvelles de HubSpot pour l’instant.',
      sent: 'Envoyée',
      sentAria: function (s) { return 'Envoyée\u00A0: marquer ' + quote(s) + ' comme envoyée'; },
      later: '+2 j',
      laterAria: function (s) { return '+2 j\u00A0: reporter de 2 jours ' + quote(s); },
      all: function (n) { return 'Tout le tableau (' + n + ')'; },
      waiting: function (n) { return pl(n, 'missive', 'missives') + ' en attente'; },
      siege: function (d, n) { return 'Grand Nettoyage\u00A0: ' + d + '/' + n + (d ? '. Reprendre' : '. À l’assaut'); }
    },
    goblinLine: function (t) {
      t = t || [0, 0, 0];
      if (t[2]) return t[2] === 1 ? 'Un chef gobelin campe devant les portes depuis plus d’un mois.' : t[2] + ' chefs gobelins campent devant les portes depuis plus d’un mois.';
      if (t[1]) return t[1] === 1 ? 'Un gobelin guerrier rôde depuis plus d’une semaine.' : t[1] + ' gobelins guerriers rôdent depuis plus d’une semaine.';
      if (t[0]) return t[0] === 1 ? 'Un gobelin grogne aux portes. Rien de grave. Pour l’instant.' : t[0] + ' gobelins grognent aux portes. Rien de grave. Pour l’instant.';
      return 'Aucun gobelin aux portes.';
    },
    tiers: ['Missive', 'Gobelin', 'Gobelin guerrier', 'Chef gobelin'],
    tiersShort: ['', 'Gobelin', 'Guerrier', 'Chef'],
    tierFilters: ['Tous', 'Gobelins', 'Guerriers', 'Chefs'],
    types: { TODO: 'À faire', CALL: 'Appel', EMAIL: 'E-mail', LINKED_IN: 'LinkedIn' },
    priorities: { HIGH: 'Priorité haute', MEDIUM: 'Priorité moyenne', LOW: 'Priorité basse' },
    urgent: 'Haute',
    due: {
      late: function (n) { return 'En retard de ' + pl(n, 'jour', 'jours'); },
      lateShort: function (n) { return n + ' j de retard'; },
      today: 'Pour aujourd’hui',
      todayShort: 'Aujourd’hui',
      upcoming: function (rel) { return 'Prévue ' + rel; },
      none: 'Sans échéance',
      waiting: 'En attente de réponse'
    },
    panels: {
      board: { title: 'Tableau de la taverne', icon: 'tavern' },
      missive: { title: 'Missive royale', icon: 'scroll' },
      scribe: { title: 'Le Scribe', icon: 'quill' },
      quests: { title: 'Journal des quêtes', icon: 'banner4' },
      quest: { title: 'Quête', icon: 'banner3' },
      treasure: { title: 'Trésor', icon: 'chest' },
      chronicle: { title: 'Livre des Défaites', icon: 'book' },
      hero: { title: 'Héros', icon: 'crown' },
      siege: { title: 'Grand Nettoyage', icon: 'shield' }
    },
    board: {
      tabs: { today: 'Du jour', goblins: 'Gobelins', upcoming: 'À venir', waiting: 'En attente' },
      tabsLabel: 'Missives par catégorie',
      filterLabel: 'Filtrer par rang de gobelin',
      empty: {
        today: 'Aucune missive pour aujourd’hui. La taverne est calme.',
        goblins: 'Aucun gobelin aux portes. Profitez-en.',
        goblinsTier: 'Aucun gobelin de ce rang.',
        upcoming: 'Rien de prévu sur les 14 prochains jours.',
        waiting: 'Personne ne vous fait attendre.'
      },
      todayLead: function (n) { return n ? (n === 1 ? 'Une missive attend son pigeon aujourd’hui.' : n + ' missives attendent leur pigeon aujourd’hui.') : ''; },
      upcomingLead: 'Les 14 prochains jours. Rien ne presse, tout se prépare.',
      waitingLead: 'Ces missives attendent une réponse. Pas de gobelin tant qu’elles patientent.',
      siegeStart: 'Défendre le village',
      siegeResume: function (d, n) { return 'Reprendre le Grand Nettoyage (' + d + '/' + n + ')'; }
    },
    missive: {
      scribe: 'Rédiger avec le scribe',
      sent: 'Missive envoyée',
      later: 'Reporter',
      laterDays: function (n) { return '+' + n + ' j'; },
      laterAria: function (n, day) { return '+' + n + ' j\u00A0: reporter de ' + n + ' jours, au ' + shortDay(day); },
      slay: 'Abattre',
      slayQuestion: 'Abattre sans rien envoyer\u00A0? La tâche sera close dans HubSpot. Réservé aux relances mortes.',
      slayYes: 'Oui, abattre',
      slayNo: 'Garder',
      noBody: 'Aucun détail dans HubSpot.',
      hubspot: 'Ouvrir dans HubSpot',
      gone: 'Cette missive a déjà quitté le tableau.',
      back: 'Retour au tableau'
    },
    toast: {
      sentGoblin: 'Missive envoyée. Un gobelin de moins.',
      sent: function (xp) { return 'Missive envoyée. +' + xp + ' XP de Relance.'; },
      undo: 'Annuler',
      undone: 'Missive rappelée. Le pigeon fait demi-tour.',
      postponed: function (day, goblin) { return 'Reportée au ' + shortDay(day) + '.' + (goblin ? ' Le gobelin recule.' : ''); },
      slain: 'Gobelin abattu. Une relance morte de moins. +5 XP.',
      slainPlain: 'Missive abattue. +5 XP.',
      forgot: 'Quête oubliée. Brutal, mais libérateur.',
      reconquest: 'Reconquête marquée lancée. Rien n’est parti d’ici\u00A0: à vous d’envoyer.',
      draft: 'Brouillon créé dans Gmail.',
      saveFailed: function (c) { return (c.title ? c.title + '. ' : '') + c.text; },
      copied: 'Copié. À coller où vous voulez.',
      copyFallback: 'Texte sélectionné : copiez-le avec Ctrl+C (Cmd+C sur Mac).'
    },
    scribe: {
      gathering: 'Le scribe rassemble les parchemins…',
      writing: 'Le scribe trempe sa plume…',
      stop: 'Stop',
      stopped: 'Plume arrêtée. Rien n’est perdu, relancez quand vous voulez.',
      intentLabel: 'Intention (facultatif)',
      intentPlaceholder: 'relance devis, proposer janvier',
      write: 'Rédiger',
      rewrite: 'Réécrire',
      subject: 'Objet',
      body: 'Message',
      gmail: 'Créer le brouillon Gmail',
      gmailDone: 'Brouillon créé ✓',
      gmailAgain: 'Créer un nouveau brouillon',
      gmailAgainNote: 'Le premier brouillon reste dans Gmail.',
      copy: 'Copier',
      openDraft: 'Ouvrir le brouillon dans Gmail',
      draftDone: 'Brouillon prêt dans Gmail. Relisez, puis envoyez-le de là-bas.',
      draftNoLink: 'Brouillon créé dans Gmail. Ouvrez vos brouillons pour le relire et l’envoyer.',
      draftDemo: 'Brouillon fictif créé (démo). Rien n’est parti.',
      noEmail: 'Ce contact n’a pas d’e-mail dans HubSpot. Copiez la missive et envoyez-la à la main.',
      noGmail: 'Gmail n’est pas branché ici. Copiez la missive et envoyez-la à la main.',
      replyIn: function (s) { return 'Réponse dans le fil Gmail ' + quote(s) + '.'; },
      to: function (s) { return 'Pour\u00A0: ' + s; },
      ctxTitle: 'Ce que sait le scribe',
      ctxContact: 'Contact',
      ctxDeal: 'Quête liée',
      ctxNotes: 'Notes HubSpot',
      ctxEmails: 'E-mails consignés',
      ctxGmail: 'Dernier fil Gmail',
      ctxLost: 'La défaite',
      ctxNone: 'Aucun contact associé à cette missive.',
      noDeal: 'Aucune quête associée.',
      thin: 'Contexte mince : le scribe restera bref. Donnez-lui une intention.',
      voice: 'Ton sobre, vouvoiement, pas de prix. Relisez : rien ne part sans vous.',
      sentAfter: 'Missive envoyée',
      reconquestDone: 'Marquer la reconquête lancée',
      reconquestLaunched: 'Reconquête lancée.',
      off: 'Le scribe n’est pas disponible ici. Écrivez la missive vous-même.',
      greeting: function (first) { return 'Bonjour' + (first ? ' ' + first : '') + ','; },
      sum: {
        notes: function (n) { return pl(n, 'note', 'notes'); },
        emails: function (n) { return pl(n, 'e-mail', 'e-mails'); },
        gmail: function (n) { return 'fil Gmail (' + pl(n, 'message', 'messages') + ')'; },
        nothing: 'pas d’historique'
      },
      reconquestSubject: function (name) { return 'Reconquête\u00A0: ' + name; }
    },
    quests: {
      empty: 'Aucune quête ouverte. Le camp est vide. Allez prospecter.',
      groupNote: function (n, sum) { return pl(n, 'quête', 'quêtes') + (sum ? ' · ' + money(sum) : ''); },
      silent: function (n) { return n === 0 ? 'nouvelles aujourd’hui' : n + ' j sans nouvelles'; },
      cold: 'Refroidie',
      planned: function (day) { return 'Relance le ' + shortDay(day); },
      noAmount: 'Montant à définir',
      lead: function (cold, open) { return pl(open, 'quête ouverte', 'quêtes ouvertes') + (cold ? ', dont ' + cold + ' qui ' + (cold > 1 ? 'refroidissent' : 'refroidit') + '.' : '. Toutes tiennent.'); }
    },
    quest: {
      coldLead: function (n) { return 'Cette quête refroidit : ' + n + ' jours sans nouvelles.'; },
      warmLead: function (n) { return n === 0 ? 'Des nouvelles aujourd’hui. Ça tient.' : 'Dernières nouvelles il y a ' + pl(n, 'jour', 'jours') + '. Ça tient.'; },
      amount: 'Montant',
      loyalty: 'Loyauté',
      silent: 'Sans nouvelles',
      threshold: 'Seuil du chapitre',
      days: function (n) { return pl(n, 'jour', 'jours'); },
      planned: function (day) { return 'Relance planifiée le ' + longDay(day) + '. Le pigeon est prêt.'; },
      rule: function (t) { return 'Au-delà de ' + t + ' jours sans contact, la quête refroidit et les cœurs tombent.'; },
      gone: 'Cette quête a quitté le camp.'
    },
    chapters: ['Chapitre 0 — «\u00A0La Rumeur\u00A0»', 'Chapitre I — «\u00A0L’Audience\u00A0»', 'Chapitre II — «\u00A0La Reconnaissance\u00A0»', 'Chapitre III — «\u00A0La Joute\u00A0»', 'Chapitre IV — «\u00A0Le Sceau\u00A0»'],
    treasure: {
      of: function (goal) { return 'sur ' + money(goal); },
      remaining: function (n) { return 'Encore ' + money(n) + ' pour l’objectif de saison.'; },
      reached: 'Objectif atteint. Le coffre déborde.',
      daysLeft: function (n) { return n <= 1 ? 'Dernier jour de la saison.' : n + ' jours restants dans la saison.'; },
      season: 'Or de la saison',
      goal: 'Objectif',
      allTime: 'Trésor de toujours',
      wonCount: 'Quêtes accomplies',
      list: 'Quêtes accomplies cette saison',
      empty: 'Pas encore d’or cette saison. Ça viendra.',
      closed: function (day) { return 'Close le ' + shortDay(day); }
    },
    chronicle: {
      lead: 'Chaque défaite consignée, avec sa raison. Et une reconquête 120 jours plus tard.',
      empty: 'Aucune défaite consignée. Pour l’instant.',
      lost: function (day) { return 'Perdue le ' + shortDay(day); },
      noReason: 'Raison non consignée.',
      reconquestOn: function (day) { return 'Reconquête le ' + shortDay(day); },
      reconquestDue: function (day) { return 'Reconquête possible depuis le ' + shortDay(day); },
      launch: 'Lancer la reconquête',
      forget: 'Oublier',
      launched: 'Reconquête lancée',
      dismissed: 'Oubliée',
      dueHead: 'Reconquêtes dues',
      allHead: 'Toutes les défaites'
    },
    hero: {
      skills: 'Compétences',
      names: { relance: 'Relance', closing: 'Closing', prospection: 'Prospection' },
      hints: {
        relance: '+20 par missive, +10 si à l’heure, +50 par journée parfaite.',
        closing: '+50 par quête gagnée, plus 1 par tranche de 20 €. +10 par défaite expliquée.',
        prospection: '+25 par quête ouverte.'
      },
      toNext: function (n, lv) { return n + ' XP avant le niveau ' + lv; },
      max: 'Niveau maximum. Respect.',
      xp: function (n) { return n + ' XP'; },
      titles: 'Titres',
      streakHead: 'Série',
      streak: function (n) { return n ? n + ' ' + (n > 1 ? 'journées parfaites d’affilée.' : 'journée parfaite. Le début d’une série.') : 'Aucune série en cours. Une journée parfaite suffit pour commencer.'; },
      perfectToday: 'Journée parfaite aujourd’hui. Bien joué, Messire.',
      notYet: 'Pas encore parfaite\u00A0: envoyez les missives du jour.',
      notYetAction: 'Pas encore parfaite\u00A0: une action suffit (envoyer, reporter, abattre).',
      weekend: 'Week-end : la série ne craint rien.',
      calendar: function (month) { return 'Journées parfaites · ' + month; },
      legendPerfect: 'parfaite',
      legendToday: 'aujourd’hui',
      partial: 'Historique incomplet\u00A0: votre XP de Relance est peut-être sous-estimée.',
      rule: 'Une journée parfaite\u00A0: toutes les missives du jour traitées et au moins une action. Les week-ends ne cassent pas la série.'
    },
    siege: {
      banner: function (n) { return 'Messire, ' + pl(n, 'gobelin assiège', 'gobelins assiègent') + ' vos murailles. Aïe.'; },
      go: 'Défendre le village',
      later: 'Plus tard',
      progress: function (d, n) { return d + ' / ' + n + ' gobelins repoussés'; },
      remaining: function (n) { return pl(n, 'gobelin restant', 'gobelins restants'); },
      lead: 'Un gobelin à la fois, le plus ancien d’abord. Envoyez, reportez ou abattez.',
      send: 'Envoyer',
      skip: 'Passer',
      done: 'Plus un gobelin aux portes. Le siège est levé.',
      close: 'Retour au village'
    },
    cel: {
      ok: 'Continuer',
      wonTitle: 'Quête accomplie\u00A0!',
      won: function (amount) { return 'Quête accomplie\u00A0: +' + money(amount) + '.'; },
      wonSeason: function (gold, goal) { return 'Trésor de saison\u00A0: ' + money(gold) + ' sur ' + money(goal) + '.'; },
      lostTitle: 'Quête échouée',
      lostLine: 'Brutal, mais libérateur.',
      lostReason: function (r) { return 'Raison\u00A0: ' + r; },
      lostNoReason: 'Raison non consignée dans HubSpot.',
      lostReconquest: function (day) { return 'Reconquête prévue le ' + longDay(day) + '.'; },
      levelTitle: 'Montée en grade\u00A0!',
      level: function (n) { return 'Niveau ' + n + '.'; },
      levelTitleNew: function (t) { return 'Nouveau titre\u00A0: ' + t + '.'; },
      levelSame: function (t) { return 'Toujours ' + t + ', mais plus solide.'; },
      siegeTitle: 'Siège levé\u00A0!',
      siege: 'Plus un gobelin aux portes.',
      siegeXp: '+500 XP de Relance. Les murailles tiennent.',
      introTitle: 'Bienvenue, Messire',
      intro: [
        'Vos affaires HubSpot campent devant la porte : ce sont vos quêtes.',
        'Vos relances arrivent par pigeon au Tableau de la taverne.',
        'Une relance en retard devient un gobelin. Plus elle traîne, plus il grossit.',
        'Une quête gagnée remplit le coffre. Objectif de saison\u00A0: 15\u00A0000\u00A0€.'
      ],
      introOk: 'En selle'
    },
    errors: {
      generic: { title: 'Grain de sable', text: 'Quelque chose a coincé. Réessayez dans un instant.', action: 'retry' },
      permissions: 'Ouvrir les autorisations',
      permissionsFail: 'Le panneau ne s’est pas ouvert. Passez par le menu Autorisations de l’artefact dans claude.ai.',
      retry: 'Réessayer',
      section: { hubspot: 'HubSpot', gmail: 'Gmail' }
    },
    back: 'Retour',
    close: 'Fermer'
  };

  // ===========================================================================
  // Small helpers
  // ===========================================================================
  var TZ = 'Europe/Paris';
  var WD_BOX = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
  var WD_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  var WD_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MO_BOX = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  var MO_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var MO_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MO_TITLE = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var TITLES = [[3, 5, 'Écuyer'], [6, 9, 'Chevalier'], [10, 13, 'Chevalier banneret'], [14, 17, 'Baron'], [18, 21, 'Vicomte'], [22, 25, 'Comte'], [26, 29, 'Marquis'], [30, 30, 'Duc de Bourgogne']];
  var DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  var NBSP = ' ';

  function noop() { }
  function $(id) { return document.getElementById(id); }
  function pl(n, one, many) { return n + ' ' + (n === 1 || n === -1 ? one : many); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function cap(p, ms) { return Promise.race([Promise.resolve(p).catch(noop), wait(ms)]); }

  var NF = (function () { try { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }); } catch (e) { return null; } })();
  function money(n) {
    var v = Math.round(Number(n) || 0);
    var s = NF ? NF.format(v) : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    // fr-FR groups with a narrow no-break space, which all but vanishes beside the Tiny5 digits.
    return s.replace(/[\u202F\u00A0 ]/g, NBSP) + NBSP + '€';
  }
  function frNum(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function pct(p) { return Math.round(Math.max(0, Number(p) || 0) * 100) + NBSP + '%'; }
  function quote(s) { return '«' + NBSP + s + NBSP + '»'; }
  function frTypo(s) {
    return String(s == null ? '' : s).replace(/'/g, '’').replace(/« /g, '«' + NBSP).replace(/ ([»:!?;])/g, NBSP + '$1');
  }

  function dayParts(day) {
    var m = DAY_RE.exec(String(day || '').slice(0, 10));
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    return { y: y, mo: mo, d: d, wd: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
  }
  function dateBox(day) { var p = dayParts(day); return p ? WD_BOX[p.wd] + ' ' + p.d + ' ' + MO_BOX[p.mo - 1] : ''; }
  function shortDay(day) { var p = dayParts(day); return p ? WD_SHORT[p.wd] + ' ' + p.d + ' ' + MO_SHORT[p.mo - 1] : ''; }
  function longDay(day) {
    var p = dayParts(day); if (!p) return '';
    var t = todayDay();
    var same = t && t.slice(0, 4) === String(p.y);
    return WD_LONG[p.wd] + ' ' + (p.d === 1 ? '1er' : p.d) + ' ' + MO_LONG[p.mo - 1] + (same ? '' : ' ' + p.y);
  }
  function addDays(day, n) {
    var p = dayParts(day); if (!p) return day;
    return new Date(Date.UTC(p.y, p.mo - 1, p.d + n)).toISOString().slice(0, 10);
  }
  function ownDaysBetween(a, b) {
    var pa = dayParts(a), pb = dayParts(b); if (!pa || !pb) return NaN;
    return Math.round((Date.UTC(pb.y, pb.mo - 1, pb.d) - Date.UTC(pa.y, pa.mo - 1, pa.d)) / 86400000);
  }
  function daysBetween(a, b) {
    try { var r = window.LOGIC.daysBetween(a, b); if (typeof r === 'number' && !isNaN(r)) return r; } catch (e) { /* fall back */ }
    return ownDaysBetween(a, b);
  }
  var PDF = null;
  function parisParts(d) {
    try {
      if (!PDF) PDF = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      var o = {};
      PDF.formatToParts(d).forEach(function (p) { o[p.type] = p.value; });
      return { day: o.year + '-' + o.month + '-' + o.day, hh: +o.hour % 24, mm: +o.minute };
    } catch (e) {
      return { day: d.toISOString().slice(0, 10), hh: d.getHours(), mm: d.getMinutes() };
    }
  }
  function parisDay(d) { try { var r = window.LOGIC.parisDay(d); if (r) return r; } catch (e) { /* */ } return parisParts(d).day; }
  function parisHour(d) {
    try { var r = window.LOGIC.parisHour(d); if (typeof r === 'number' && !isNaN(r)) return r; } catch (e) { /* */ }
    var p = parisParts(d); return p.hh + p.mm / 60;
  }
  function clockText(d) { var p = parisParts(d); return (p.hh < 10 ? '0' : '') + p.hh + ':' + (p.mm < 10 ? '0' : '') + p.mm; }
  function todayDay() { return U.model && U.model.today ? U.model.today : parisDay(new Date()); }
  function relDay(day) {
    var n = daysBetween(todayDay(), day);
    if (n === 0) return 'aujourd’hui';
    if (n === 1) return 'demain';
    if (n === -1) return 'hier';
    if (n > 1) return 'le ' + shortDay(day);
    return 'il y a ' + (-n) + ' jours';
  }
  function titleFor(level) {
    try { var t = window.LOGIC.heroTitle(level); if (t) return t; } catch (e) { /* */ }
    for (var i = 0; i < TITLES.length; i++) if (level >= TITLES[i][0] && level <= TITLES[i][1]) return TITLES[i][2];
    return TITLES[0][2];
  }
  function clientOf(name) {
    var s = String(name || '');
    var i = s.search(/\s[-–—]\s/);
    return (i > 0 ? s.slice(0, i) : s).trim();
  }
  function restOf(name) {
    var s = String(name || '');
    var m = /\s[-–—]\s(.*)$/.exec(s);
    return m ? m[1].trim() : '';
  }
  function excerpt(s, n) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
  }
  function plainText(s) {
    s = String(s == null ? '' : s);
    if (!/<[a-z!/][^>]*>|&[a-z#0-9]+;/i.test(s)) return s.trim();
    try {
      var doc = new DOMParser().parseFromString(s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n'), 'text/html');
      return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
    } catch (e) { return s.replace(/<[^>]+>/g, ' ').trim(); }
  }
  function isTyping(el) {
    if (!el || el === document.body) return false;
    var t = (el.tagName || '').toLowerCase();
    return t === 'input' || t === 'textarea' || t === 'select' || el.isContentEditable;
  }

  // DOM builder: h(tag, attrs, ...children)
  function h(tag, a) {
    var el = document.createElement(tag);
    if (a) {
      for (var k in a) {
        if (!Object.prototype.hasOwnProperty.call(a, k)) continue;
        var v = a[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'hidden') el.hidden = true;
        else if (k === 'disabled') el.disabled = true;
        else if (k === 'value') el.value = v;
        else if (k === 'style') el.setAttribute('style', v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

  // ---------- pixel icons (ART.iconURL, painted as crisp backgrounds) ----------
  function iconURL(name, px) {
    try {
      if (!window.ART || typeof window.ART.iconURL !== 'function') return '';
      var dpr = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
      var scale = Math.max(1, Math.min(8, Math.round(px / 16 * dpr)));
      return window.ART.iconURL(name, scale) || '';
    } catch (e) { return ''; }
  }
  function paintIcon(el, name) {
    if (!el) return;
    var px = parseFloat(el.style.getPropertyValue('--s')) || 32;
    var url = iconURL(name, px);
    el.style.backgroundImage = url ? 'url("' + url + '")' : '';
    el.setAttribute('data-icon', name);
  }
  function icon(name, px, cls) {
    var s = h('span', { class: 'ico' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' });
    s.style.setProperty('--s', (px || 32) + 'px');
    paintIcon(s, name);
    return s;
  }
  function paintStaticIcons(root) {
    var list = root.querySelectorAll('.ico[data-icon]');
    for (var i = 0; i < list.length; i++) paintIcon(list[i], list[i].getAttribute('data-icon'));
  }

  function sfx(name) { try { if (window.SFX) window.SFX.play(name); } catch (e) { /* audio is optional */ } }
  function play(effect, payload) {
    try { return U.scene ? Promise.resolve(U.scene.play(effect, payload || {})).catch(noop) : Promise.resolve(); } catch (e) { return Promise.resolve(); }
  }
  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  function setBusy(btn, on) {
    if (!btn) return;
    btn.classList.toggle('is-busy', !!on);
    if (on) { btn.setAttribute('aria-busy', 'true'); btn.disabled = true; }
    else { btn.removeAttribute('aria-busy'); btn.disabled = false; }
  }

  // ===========================================================================
  // App state
  // ===========================================================================
  var U = {
    info: null, state: null, savedJson: null, raw: null, model: null, scene: null,
    booted: false, booting: false, loadingP: null, queuedOpts: null, writing: false, saveErrShown: false,
    hubspotError: null, rawOk: false, scribeOff: false, lastLevel: null, pendingEvents: [],
    siegeLater: false, siegeSkip: {}
  };

  function can(k) { return !(U.info && U.info.can && U.info.can[k] === false); }
  function scribeAvailable() { return !U.scribeOff && can('scribe') && !!window.DATA && typeof window.DATA.draftMissive === 'function'; }
  function allMissives(m) {
    m = m || U.model; if (!m || !m.missives) return [];
    var L = m.missives;
    return [].concat(L.today || [], L.overdue || [], L.upcoming || [], L.waiting || [], L.later || []);
  }
  function findMissive(id) {
    var list = allMissives();
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i];
    return null;
  }
  function findQuest(id) {
    var q = (U.model && U.model.quests) || [];
    for (var i = 0; i < q.length; i++) if (String(q[i].id) === String(id)) return q[i];
    return null;
  }
  function findChronicle(dealId) {
    var c = (U.model && U.model.chronicle) || [];
    for (var i = 0; i < c.length; i++) if (c[i].deal && String(c[i].deal.id) === String(dealId)) return c[i];
    return null;
  }
  function toDoCount(m) { return m ? (m.missives.today || []).length + (m.missives.overdue || []).length : 0; }

  // ===========================================================================
  // Errors
  // ===========================================================================
  function errCopy(err) {
    var c = null;
    try { c = window.LOGIC.errorCopy(err); } catch (e) { c = null; }
    if (!c || (!c.silent && !c.title && !c.text)) c = COPY.errors.generic;
    if (c.title || c.text) c = Object.assign({}, c, { title: frTypo(c.title), text: frTypo(c.text) });
    return c;
  }
  function errorBlock(err, opts) {
    opts = opts || {};
    var c = errCopy(err);
    if (c.silent) return null;
    var actions = h('div', { class: 'rb-err-actions' });
    if (c.action === 'permissions') {
      actions.appendChild(h('button', { type: 'button', class: 'wbtn wbtn--sm', onclick: function (ev) { openPermissions(ev.currentTarget); } }, COPY.errors.permissions));
    }
    if (typeof opts.retry === 'function' && (c.action === 'retry' || opts.alwaysRetry)) {
      actions.appendChild(h('button', { type: 'button', class: 'wbtn wbtn--sm', onclick: function (ev) { opts.retry(ev.currentTarget); } }, COPY.errors.retry));
    }
    return h('div', { class: 'rb-err' + (opts.inline ? ' rb-err--inline' : ''), role: 'alert' },
      icon(opts.icon || 'goblin1', 32),
      h('strong', { text: (opts.prefix ? opts.prefix + ' · ' : '') + (c.title || COPY.errors.generic.title) }),
      h('p', { text: c.text || COPY.errors.generic.text }),
      actions.childNodes.length ? actions : null);
  }
  function showError(slot, err, opts) {
    if (!slot) return;
    clear(slot);
    var b = errorBlock(err, opts);
    if (b) slot.appendChild(b);
  }
  async function openPermissions(btn) {
    setBusy(btn, true);
    try {
      var perms = null;
      if (window.claude && typeof window.claude.use === 'function') perms = await window.claude.use('permissions');
      if (!perms || typeof perms.manage !== 'function') throw { code: 'permissions_unavailable' };
      await perms.manage();
      setBusy(btn, false);
      reload({ observe: true });
    } catch (e) {
      setBusy(btn, false);
      toast(COPY.errors.permissionsFail, { error: true, icon: 'shield' });
    }
  }

  // ===========================================================================
  // Persistence (one write at a time is handled by DATA.saveState)
  // ===========================================================================
  function persist() {
    if (!U.state || !window.DATA) return;
    var json;
    try { json = JSON.stringify(U.state); } catch (e) { return; }
    if (json === U.savedJson) return;
    U.savedJson = json;
    try {
      Promise.resolve(window.DATA.saveState(U.state)).then(reportSaveError, function () { /* DATA keeps a local fallback */ });
    } catch (e) { /* ignore */ }
  }
  // A save the db refused (quota full, access revoked…) is told once per visit; transient ones retry on the next change.
  function reportSaveError() {
    if (U.saveErrShown || !window.DATA || typeof window.DATA.status !== 'function') return;
    var st = null;
    try { st = window.DATA.status(); } catch (e) { return; }
    var err = st && st.lastSaveError;
    if (!err) return;
    var c = errCopy(err);
    if (c.silent || c.action === 'retry') return;
    U.saveErrShown = true;
    toast(COPY.toast.saveFailed(c), { error: true, icon: 'book' });
  }

  // ===========================================================================
  // Load / rebuild
  // ===========================================================================
  // Placeholder while HubSpot is unreachable: the model shows the stored siege, never a fake « 0 gobelin » win.
  function emptyRaw() { return { deals: [], openTasks: [], completedTasks: [], fetchedAt: new Date().toISOString(), placeholder: true }; }

  function reload(opts) {
    opts = opts || {};
    if (U.loadingP) {
      // Queue ONE follow-up reload that keeps every option asked meanwhile (a Refresh must still run observe).
      var q = U.queuedOpts || {};
      U.queuedOpts = { observe: !!(q.observe || opts.observe), manual: !!(q.manual || opts.manual) };
      return U.loadingP;
    }
    U.loadingP = (async function () {
      setRefreshing(true);
      var raw = null;
      try {
        raw = await window.DATA.loadAll();
        U.raw = raw || emptyRaw();
        U.rawOk = !!raw;
        U.hubspotError = null;
      } catch (e) {
        U.hubspotError = e;
        if (!U.raw) U.raw = emptyRaw();
      }
      var events = [];
      var now = new Date();
      if (opts.observe && raw) {
        try {
          var r = window.LOGIC.observe(raw, U.state, now);
          if (r && r.state) U.state = r.state;
          events = (r && r.events) || [];
        } catch (e) { events = []; }
      }
      rebuild(now, events);
      renderHubspotError();
      setRefreshing(false);
      if (opts.manual && !U.hubspotError) toast(COPY.refresh.done, { icon: 'pigeon' });
    })();
    var p = U.loadingP;
    p.then(function () {
      U.loadingP = null;
      if (U.queuedOpts) { var q = U.queuedOpts; U.queuedOpts = null; reload(q); }
    });
    return p;
  }

  function rebuild(now, events) {
    if (!window.LOGIC || !U.state) return;
    events = (events || []).slice();
    var model;
    try { model = window.LOGIC.buildModel(U.raw || emptyRaw(), U.state, now); } catch (e) { return; }
    var before = U.state.siege || {};
    var st2 = U.state;
    // Only real HubSpot data may move the siege: an empty placeholder (HubSpot down) has 0 goblins
    // and would otherwise "win" a running siege (+500 XP, fanfare) by mistake.
    if (U.rawOk) { try { st2 = window.LOGIC.checkSiege(model, U.state, now) || U.state; } catch (e) { st2 = U.state; } }
    var after = st2.siege || {};
    if (!before.completedAt && after.completedAt) events.push({ type: 'siege' });
    if (after.startedAt && !before.startedAt) U.siegeLater = false;
    U.state = st2;
    U.model = model;
    // Level-ups only compare complete data (no placeholder, no failed XP history) so a reconnect never fakes one.
    var fullData = U.rawOk && !(U.raw && U.raw.partial && U.raw.partial.completedTasksError);
    if (fullData && model.hero && typeof model.hero.level === 'number') {
      if (U.lastLevel != null && model.hero.level > U.lastLevel) {
        events.push({ type: 'level', level: model.hero.level, title: model.hero.title, prevTitle: titleFor(U.lastLevel) });
      }
      U.lastLevel = model.hero.level;
    }
    renderAll();
    persist();
    if (events.length) {
      if (U.booted) celebrate(events);
      else U.pendingEvents = U.pendingEvents.concat(events);
    }
  }

  function setRefreshing(on) {
    ['rb-refresh', 'rb-strip-refresh'].forEach(function (id) {
      var b = $(id); if (!b) return;
      b.classList.toggle('is-busy', !!on);
      if (on) b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy');
    });
  }

  // ===========================================================================
  // Rendering — HUD, orders, toolbar, scene
  // ===========================================================================
  function todOf(h) { return h >= 20 || h < 6 ? 'night' : h >= 18 ? 'dusk' : 'day'; }

  function renderClock(now) {
    var day = parisDay(now);
    var t = clockText(now);
    var hr = parisHour(now);
    var tod = todOf(hr);
    $('rb-date').textContent = dateBox(day);
    $('rb-time').textContent = t;
    $('rb-strip-date').textContent = dateBox(day);
    $('rb-strip-time').textContent = t;
    $('rb-tod').textContent = COPY.tod[tod];
    $('rb').setAttribute('data-tod', tod);
    document.documentElement.setAttribute('data-rb-tod', tod);
    if (U.scene) { try { U.scene.setTimeOfDay(hr); } catch (e) { /* */ } }
  }

  function renderAll() {
    var m = U.model; if (!m) return;
    renderClock(new Date());
    renderHud(m);
    renderOrders(m);
    renderCounts(m);
    renderSiegeBanner();
    if (U.scene) {
      try { U.scene.setModel(window.LOGIC.toSceneModel(m)); } catch (e) { /* scene keeps its last model */ }
    }
    $('rb-canvas').setAttribute('aria-label', COPY.canvas(U.rawOk ? m : null));
    if (P.stack.length) refreshPanel();
  }

  function renderHud(m) {
    var s = m.season || {};
    // No HubSpot data yet (placeholder): show unknowns, never zeros or a demoted hero dressed up as facts.
    var off = !U.rawOk;
    var p = off ? 0 : Math.max(0, Number(s.pct) || 0);
    $('rb').classList.toggle('is-offline', off);
    $('rb-gold').textContent = off ? COPY.hud.unknown : money(s.gold);
    $('rb-strip-gold').textContent = off ? COPY.hud.unknown : money(s.gold);
    $('rb-season-month').textContent = COPY.hud.seasonK(s.monthLabel || '');
    $('rb-season-name').textContent = s.name ? quote(frTypo(s.name)) : '';
    $('rb-season-left').textContent = COPY.hud.daysLeft(s.daysLeft);
    $('rb-season-fill').style.width = Math.min(100, p * 100) + '%';
    var bar = $('rb-season-bar');
    bar.setAttribute('aria-valuenow', String(Math.round(Math.min(1, p) * 100)));
    bar.setAttribute('aria-valuetext', off ? COPY.hud.offline : money(s.gold) + ' sur ' + money(s.goal));
    bar.classList.toggle('bar--over', p >= 1);
    $('rb-season-foot').textContent = off ? COPY.hud.unknown + ' / ' + money(s.goal) : COPY.hud.goal(s.gold, s.goal, pct(p));
    $('rb-strip-season').textContent = frTypo(s.name || '');
    $('rb-strip-bar').style.width = Math.min(100, p * 100) + '%';
    $('rb-strip-left').textContent = (off ? COPY.hud.unknown : pct(p)) + ' · ' + COPY.hud.daysLeftShort(s.daysLeft);

    var hero = m.hero || {};
    $('rb-hero-name').textContent = hero.name || 'Sire Julian de Bourgogne';
    $('rb-hero-title').textContent = off ? COPY.hud.offline : hero.title || '';
    var lv = $('rb-hero-level');
    lv.textContent = off ? COPY.hud.unknown : String(hero.level || 3);
    lv.setAttribute('aria-label', off ? COPY.hud.offline : COPY.hud.level(hero.level || 3));
    var sk = $('rb-skills');
    clear(sk);
    ['relance', 'closing', 'prospection'].forEach(function (k) {
      var info = (hero.skills && hero.skills[k]) || { level: 1, xp: 0, floor: 0, next: 100 };
      sk.appendChild(h('li', { class: 'skill' },
        h('span', { class: 'skill-name', text: COPY.hero.names[k] }),
        pips(off ? { level: 0, xp: 0, floor: 0, next: null } : info),
        h('span', { class: 'skill-lv num', text: off ? COPY.hud.unknown : String(info.level) })));
    });
    $('rb-streak-n').textContent = String(hero.streak || 0);
    $('rb-streak-label').textContent = COPY.hud.streak(hero.streak || 0);
    var perf = $('rb-perfect');
    var weekend = isWeekend(m.today);
    perf.classList.toggle('is-off', off || !hero.perfectToday);
    $('rb-perfect-label').textContent = off ? COPY.hud.offline : hero.perfectToday ? COPY.hud.perfectOn : weekend ? COPY.hud.weekend : COPY.hud.perfectOff;
  }
  function isWeekend(day) { var p = dayParts(day); return !!p && (p.wd === 0 || p.wd === 6); }

  function pips(info) {
    var wrap = h('span', { class: 'pips', role: 'img', 'aria-label': info.level ? 'Niveau ' + info.level + ' sur 10' : COPY.hud.offline });
    var part = info.next != null && info.next > info.floor ? (info.xp - info.floor) / (info.next - info.floor) : 0;
    for (var i = 1; i <= 10; i++) {
      var cls = 'pip' + (i <= info.level ? ' on' : (i === info.level + 1 && part > 0 ? ' part' : ''));
      var pip = h('span', { class: cls });
      if (i === info.level + 1 && part > 0) pip.style.setProperty('--p', Math.round(part * 100) + '%');
      wrap.appendChild(pip);
    }
    return wrap;
  }

  function dueText(m) {
    if (m.status === 'WAITING') return COPY.due.waiting;
    if (m.daysOverdue > 0) return COPY.due.late(m.daysOverdue);
    if (!m.dueDay) return COPY.due.none;
    if (m.dueDay === todayDay()) return COPY.due.today;
    return COPY.due.upcoming(relDay(m.dueDay));
  }
  function missiveIcon(m) {
    if (m.status === 'WAITING') return 'hourglass';
    if (m.tier > 0) return 'goblin' + Math.min(3, m.tier);
    if (m.dueDay && m.dueDay > todayDay()) return 'pigeon';
    return 'scroll';
  }

  function renderOrders(m) {
    var list = $('rb-orders');
    var had = list.contains(document.activeElement) ? document.activeElement : null;
    var hadIndex = had ? Array.prototype.indexOf.call(list.querySelectorAll('button'), had) : -1;
    clear(list);
    var today = m.missives.today || [], over = m.missives.overdue || [];
    var items = today.concat(over.slice(0, 3));
    var total = today.length + over.length;
    $('rb-orders-count').textContent = COPY.orders.count(total);
    $('rb-orders-line').textContent = over.length ? COPY.goblinLine(m.counts.goblinsByTier) : '';
    if (!items.length) {
      list.appendChild(h('li', null, h('p', { class: 'empty', text: U.hubspotError && !(U.raw && U.raw.openTasks && U.raw.openTasks.length) ? COPY.orders.noData : COPY.orders.empty })));
    }
    items.forEach(function (mi) {
      var meta = mi.tier > 0
        ? [h('span', { class: 'late', text: COPY.due.lateShort(mi.daysOverdue) }), ' · ' + COPY.tiersShort[mi.tier]]
        : [COPY.due.todayShort, mi.type && COPY.types[mi.type] ? ' · ' + COPY.types[mi.type] : ''];
      var li = h('li', { class: 'order' },
        h('button', {
          type: 'button', class: 'order-main',
          onclick: function () { openPanel('missive', { id: mi.id }); },
          onmouseenter: function () { highlight(mi); },
          onmouseleave: function () { highlight(null); },
          onfocus: function () { highlight(mi); },
          onblur: function () { highlight(null); }
        },
          icon(missiveIcon(mi), 28),
          h('span', { class: 'order-subj', text: mi.subject })),
        h('div', { class: 'order-foot' },
        h('span', { class: 'order-meta' }, meta),
        h('div', { class: 'order-actions' },
          h('button', {
            type: 'button', class: 'wbtn wbtn--gold wbtn--sm', 'aria-label': COPY.orders.sentAria(mi.subject),
            onclick: function (ev) { doWrite('sent', mi, { btn: ev.currentTarget }); }
          }, h('span', { text: COPY.orders.sent })),
          h('button', {
            type: 'button', class: 'wbtn wbtn--sm', 'aria-label': COPY.orders.laterAria(mi.subject),
            onclick: function (ev) { doWrite('postponed', mi, { btn: ev.currentTarget, days: 2 }); }
          }, h('span', { text: COPY.orders.later })))));
      list.appendChild(li);
    });
    var foot = $('rb-orders-foot');
    clear(foot);
    if (total > 0 || (m.missives.upcoming || []).length) {
      foot.appendChild(h('button', { type: 'button', class: 'linkbtn', onclick: function () { openPanel('board', { tab: today.length ? 'today' : 'goblins' }); } }, COPY.orders.all(total)));
    }
    if ((m.missives.waiting || []).length) {
      foot.appendChild(h('button', { type: 'button', class: 'linkbtn', onclick: function () { openPanel('board', { tab: 'waiting' }); } }, COPY.orders.waiting(m.missives.waiting.length)));
    }
    if (m.siege && m.siege.active && m.counts.goblins > 0) {
      foot.appendChild(h('button', { type: 'button', class: 'linkbtn', onclick: function () { openPanel('siege'); } }, COPY.orders.siege(m.siege.defeated || 0, m.siege.initialCount || m.counts.goblins)));
    }
    if (had) {
      var btns = list.querySelectorAll('button');
      var target = btns[Math.min(Math.max(0, hadIndex), btns.length - 1)] || foot.querySelector('button');
      if (target) target.focus();
    }
  }

  function highlight(mi) {
    if (!U.scene) return;
    try { U.scene.highlight(mi && mi.tier > 0 ? { kind: 'goblin', id: String(mi.id) } : null); } catch (e) { /* */ }
  }

  function renderCounts(m) {
    var off = !U.rawOk;
    var todo = off ? 0 : toDoCount(m);
    var q = off ? 0 : m.counts.openQuests || 0;
    var rq = off ? 0 : (m.reconquestsDue || []).length;
    setText('[data-count="board"]', off ? '?' : todo ? String(todo) : '');
    setText('[data-count="quests"]', off ? '?' : String(q));
    setBadge('[data-badge="chronicle"]', rq);
    setBadge('[data-badge="chronicle-m"]', rq);
    setBadge('[data-badge="board"]', todo);
    setBadge('[data-badge="quests"]', q);
    var labels = { board: COPY.toolbar.board(todo), quests: COPY.toolbar.quests(off ? null : q), chronicle: COPY.toolbar.chronicle(rq) };
    Object.keys(labels).forEach(function (k) {
      var els = document.querySelectorAll('[data-open="' + k + '"]');
      for (var i = 0; i < els.length; i++) els[i].setAttribute('aria-label', labels[k]);
    });
  }
  function setText(sel, t) { var els = document.querySelectorAll(sel); for (var i = 0; i < els.length; i++) els[i].textContent = t; }
  function setBadge(sel, n) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) { els[i].textContent = n > 99 ? '99+' : String(n); els[i].hidden = !n; }
  }

  function renderSiegeBanner() {
    var m = U.model, el = $('rb-siege');
    var show = !!(U.booted && m && m.siege && m.siege.active && m.counts.goblins > 0 && !U.siegeLater && !CQ.showing && !CQ.queue.length);
    if (show) $('rb-siege-text').textContent = COPY.siege.banner(m.counts.goblins);
    el.hidden = !show;
  }

  function renderHubspotError() {
    var slot = $('rb-hubspot-error');
    if (!U.hubspotError) { clear(slot); return; }
    showError(slot, U.hubspotError, { prefix: COPY.errors.section.hubspot, icon: 'goblin2', alwaysRetry: true, retry: function (btn) { setBusy(btn, true); reload({ observe: true, manual: true }); } });
  }

  // ===========================================================================
  // Dialog stack: focus trap, Esc, inert page, focus restore
  // ===========================================================================
  var dialogs = [];
  function pushDialog(root, box) {
    if (dialogs.some(function (d) { return d.root === root; })) return;
    dialogs.push({ root: root, box: box, restore: document.activeElement });
    root.hidden = false;
    syncInert();
  }
  function popDialog(root) {
    var i = -1;
    dialogs.forEach(function (d, j) { if (d.root === root) i = j; });
    if (i < 0) return;
    var d = dialogs.splice(i, 1)[0];
    root.hidden = true;
    syncInert();
    restoreFocus(d.restore);
  }
  function syncInert() {
    var page = $('rb-page');
    setInert(page, dialogs.length > 0);
    $('rb').classList.toggle('has-dialog', dialogs.length > 0);
    dialogs.forEach(function (d, i) { setInert(d.root, i < dialogs.length - 1); });
  }
  function setInert(el, on) {
    try { el.inert = !!on; } catch (e) { /* */ }
    if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
  }
  function visible(el) { return !!(el && el.getClientRects && el.getClientRects().length); }
  function restoreFocus(el) {
    if (dialogs.length) { var top = dialogs[dialogs.length - 1]; focusInto(top.box); return; }
    if (!el || el === document.body || el === document.documentElement) {
      if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') document.activeElement.blur();
      return;
    }
    if (el.isConnected && typeof el.focus === 'function' && visible(el) && !el.closest('[inert]')) { el.focus(); return; }
    var fb = document.querySelector('.rb-toolbar .tb, .rb-bottomnav .bn');
    var cands = document.querySelectorAll('.rb-toolbar .tb, .rb-bottomnav .bn');
    for (var i = 0; i < cands.length; i++) if (visible(cands[i])) { fb = cands[i]; break; }
    if (fb && visible(fb)) fb.focus();
  }
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  function focusables(root) {
    if (!root) return [];
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (el) { return visible(el) && !el.closest('[hidden]') && !el.closest('[inert]'); });
  }
  function focusInto(box) {
    var t = box.querySelector('[data-autofocus]');
    if (t && visible(t)) { t.focus(); return; }
    var title = box.querySelector('h2[tabindex="-1"]');
    if (title) { title.focus(); return; }
    var f = focusables(box);
    (f[0] || box).focus();
  }
  function trapTab(e) {
    var top = dialogs[dialogs.length - 1];
    var nodes = focusables(top.box).concat(focusables($('rb-toasts')));
    e.preventDefault();
    if (!nodes.length) { top.box.focus(); return; }
    var idx = nodes.indexOf(document.activeElement);
    var next;
    if (idx < 0) {
      // focus on a non-tabbable spot (title / dialog): go to first or last
      next = e.shiftKey ? nodes[nodes.length - 1] : nodes[0];
      var title = top.box.querySelector('h2[tabindex="-1"]');
      if (!e.shiftKey && document.activeElement === title) next = nodes[0];
    } else {
      next = nodes[(idx + (e.shiftKey ? -1 : 1) + nodes.length) % nodes.length];
    }
    next.focus();
  }
  function closeTopDialog() {
    var top = dialogs[dialogs.length - 1];
    if (!top) return;
    if (top.root === $('rb-celebrate')) { closeCelebration(); return; }
    if (top.root === $('rb-modal')) {
      var e = topEntry();
      if (e && typeof e.onEscape === 'function' && e.onEscape()) return;
      closePanel();
    }
  }

  // ===========================================================================
  // Panels
  // ===========================================================================
  var P = { stack: [] };
  function topEntry() { return P.stack[P.stack.length - 1] || null; }
  function teardown(e) { if (e && typeof e.cleanup === 'function') { try { e.cleanup(); } catch (x) { /* */ } e.cleanup = null; } }

  function openPanel(name, params, push) {
    if (!PANELS[name] || !U.model) return;
    var wasOpen = dialogs.some(function (d) { return d.root === $('rb-modal'); });
    if (push && P.stack.length) {
      topEntry().scroll = $('rb-modal-body').scrollTop;
    } else {
      P.stack.forEach(teardown);
      P.stack = [];
    }
    P.stack.push({ name: name, params: params || {}, scroll: 0 });
    if (!wasOpen) pushDialog($('rb-modal'), $('rb-dialog'));
    renderPanel(true, false);
    sfx('page');
  }
  function backPanel() {
    if (P.stack.length <= 1) { closePanel(); return; }
    teardown(P.stack.pop());
    renderPanel(true, true);
  }
  function closePanel() {
    P.stack.forEach(teardown);
    P.stack = [];
    highlight(null);
    popDialog($('rb-modal'));
  }
  // After a write that removed the missive: drop missive/scribe/quest entries, land on the list below.
  function popAfterWrite() {
    while (P.stack.length && /^(missive|scribe)$/.test(topEntry().name)) teardown(P.stack.pop());
    if (!P.stack.length) { closePanel(); return; }
    renderPanel(true, true);
  }
  function renderPanel(focusTitle, restoreScroll) {
    var e = topEntry(); if (!e) return;
    var def = PANELS[e.name];
    e.onEscape = null;
    var title = typeof def.title === 'function' ? def.title(e) : def.title;
    $('rb-modal-title').textContent = title;
    paintIcon($('rb-modal-icon'), typeof def.icon === 'function' ? def.icon(e) : def.icon);
    $('rb-back').hidden = P.stack.length < 2;
    var body = $('rb-modal-body');
    clear(body);
    highlight(null);
    def.render(body, e);
    body.scrollTop = restoreScroll ? (e.scroll || 0) : 0;
    if (focusTitle) {
      var auto = body.querySelector('[data-autofocus]');
      if (auto && visible(auto)) auto.focus(); else $('rb-modal-title').focus();
    }
  }
  function refreshPanel() {
    var e = topEntry(); if (!e) return;
    var def = PANELS[e.name];
    if (def.live === false) { if (typeof def.update === 'function') def.update(e); return; }
    var body = $('rb-modal-body');
    var st = body.scrollTop;
    var ae = document.activeElement;
    var fk = ae && body.contains(ae) ? ae.getAttribute('data-fk') : null;
    var hadFocus = ae && body.contains(ae);
    clear(body);
    e.onEscape = null; // a render that no longer shows the confirm must let Esc close the panel again
    def.render(body, e);
    body.scrollTop = st;
    if (fk) { var f = body.querySelector('[data-fk="' + fk + '"]'); if (f) { f.focus(); return; } }
    if (hadFocus) $('rb-modal-title').focus();
  }

  // ---------- panel helpers ----------
  function chip(text, cls, iconName) { return h('span', { class: 'chip' + (cls ? ' ' + cls : '') }, iconName ? icon(iconName, 16) : null, text); }
  function hsLink(url) { return url ? h('a', { class: 'hs-link', href: url, target: '_blank', rel: 'noopener' }, COPY.missive.hubspot) : null; }
  function errSlot() { return h('div', { class: 'rb-alert-slot', 'aria-live': 'polite' }); }
  // A write error stays on its panel entry so a data refresh (re-render) does not wipe it.
  function showWriteError(slot, e, id) {
    var we = e.params.writeError;
    if (we && String(we.id) === String(id)) showError(slot, we.err, { inline: true, icon: 'goblin1' });
  }
  function empty(text) { return h('p', { class: 'empty', text: text }); }
  function heartsEl(n) {
    n = Math.max(0, Math.min(5, Number(n) || 0));
    var wrap = h('span', { class: 'hearts', role: 'img', 'aria-label': 'Loyauté : ' + frNum(n) + ' sur 5' });
    for (var i = 0; i < 5; i++) {
      var v = n - i;
      wrap.appendChild(icon(v >= 1 ? 'heart' : v >= 0.5 ? 'heart_half' : 'heart_empty', 16));
    }
    return wrap;
  }
  function chapterLabel(q) { return q.chapterLabel ? frTypo(q.chapterLabel) : COPY.chapters[q.chapter] || COPY.chapters[0]; }
  function missiveChips(m) {
    var out = [];
    if (m.status === 'WAITING') out.push(chip(COPY.due.waiting, 'chip--muted', 'hourglass'));
    if (m.daysOverdue > 0 && m.status !== 'WAITING') out.push(chip(COPY.due.late(m.daysOverdue), 'chip--late'));
    else if (m.dueDay === todayDay()) out.push(chip(COPY.due.today, 'chip--today'));
    else if (m.status !== 'WAITING') out.push(chip(dueText(m)));
    if (m.tier > 0) out.push(chip(COPY.tiers[m.tier], null, 'goblin' + Math.min(3, m.tier)));
    if (m.type && COPY.types[m.type]) out.push(chip(COPY.types[m.type]));
    if (m.priority && COPY.priorities[m.priority]) out.push(chip(COPY.priorities[m.priority], m.priority === 'HIGH' ? null : 'chip--muted'));
    return h('div', { class: 'chips' }, out);
  }

  var PANELS = {};

  // ---------- Tableau de la taverne ----------
  PANELS.board = {
    title: COPY.panels.board.title, icon: COPY.panels.board.icon,
    render: function (body, e) {
      var m = U.model, L = m.missives;
      var lists = { today: L.today || [], goblins: L.overdue || [], upcoming: L.upcoming || [], waiting: L.waiting || [] };
      var tab = e.params.tab || (lists.today.length ? 'today' : lists.goblins.length ? 'goblins' : 'today');
      e.params.tab = tab;
      var keys = ['today', 'goblins', 'upcoming', 'waiting'];
      var tablist = h('div', { class: 'tabs', role: 'tablist', 'aria-label': COPY.board.tabsLabel });
      keys.forEach(function (k) {
        tablist.appendChild(h('button', {
          type: 'button', class: 'tab', role: 'tab', id: 'rb-tab-' + k, 'data-fk': 'tab-' + k,
          'aria-selected': String(k === tab), 'aria-controls': 'rb-tabpanel', tabindex: k === tab ? '0' : '-1',
          onclick: function () { e.params.tab = k; refreshPanel(); var t = $('rb-tab-' + k); if (t) t.focus(); },
          onkeydown: function (ev) {
            var i = keys.indexOf(k), j = -1;
            if (ev.key === 'ArrowRight') j = (i + 1) % keys.length;
            else if (ev.key === 'ArrowLeft') j = (i - 1 + keys.length) % keys.length;
            else if (ev.key === 'Home') j = 0;
            else if (ev.key === 'End') j = keys.length - 1;
            if (j < 0) return;
            ev.preventDefault();
            e.params.tab = keys[j]; refreshPanel();
            var t = $('rb-tab-' + keys[j]); if (t) t.focus();
          }
        }, COPY.board.tabs[k], h('span', { class: 'tab-n num', text: String(lists[k].length) })));
      });
      var panel = h('div', { class: 'p-stack', role: 'tabpanel', id: 'rb-tabpanel', 'aria-labelledby': 'rb-tab-' + tab });
      body.appendChild(h('div', { class: 'p-stack' }, tablist, panel));

      var rows = lists[tab];
      if (tab === 'today' && rows.length) panel.appendChild(h('p', { class: 'p-note', text: COPY.board.todayLead(rows.length) }));
      if (tab === 'upcoming' && rows.length) panel.appendChild(h('p', { class: 'p-note', text: COPY.board.upcomingLead }));
      if (tab === 'waiting' && rows.length) panel.appendChild(h('p', { class: 'p-note', text: COPY.board.waitingLead }));
      if (tab === 'goblins') {
        var tier = e.params.tier || 0;
        var byTier = m.counts.goblinsByTier || [0, 0, 0];
        if (rows.length) panel.appendChild(h('p', { class: 'p-lead', text: COPY.goblinLine(byTier) }));
        if (m.siege && rows.length && (m.siege.active || rows.length >= 10)) {
          panel.appendChild(h('div', { class: 'p-row' }, h('button', {
            type: 'button', class: 'wbtn wbtn--gold', onclick: function () { openPanel('siege', {}, true); }
          }, icon('sword', 20), h('span', { text: m.siege.active && m.siege.defeated ? COPY.board.siegeResume(m.siege.defeated, m.siege.initialCount) : COPY.board.siegeStart }))));
        }
        if (rows.length) {
          var filters = h('div', { class: 'chips', role: 'group', 'aria-label': COPY.board.filterLabel });
          [0, 1, 2, 3].forEach(function (t) {
            var n = t === 0 ? rows.length : byTier[t - 1] || 0;
            filters.appendChild(h('button', {
              type: 'button', class: 'filter', 'aria-pressed': String(tier === t), 'data-fk': 'tier-' + t,
              onclick: function () { e.params.tier = t; refreshPanel(); }
            }, t ? icon('goblin' + t, 20) : null, COPY.tierFilters[t] + ' ', h('span', { class: 'num', text: '(' + n + ')' })));
          });
          panel.appendChild(filters);
        }
        if (tier) rows = rows.filter(function (r) { return r.tier === tier; });
        if (!rows.length && lists.goblins.length) { panel.appendChild(empty(COPY.board.empty.goblinsTier)); return; }
      }
      if (!rows.length) { panel.appendChild(empty(COPY.board.empty[tab])); return; }
      var ul = h('ul', { class: 'rows' });
      rows.forEach(function (mi) {
        var sub = [dueText(mi)];
        if (mi.tier > 0) sub.push(COPY.tiers[mi.tier]);
        if (mi.type && COPY.types[mi.type]) sub.push(COPY.types[mi.type]);
        ul.appendChild(h('li', null, h('button', {
          type: 'button', class: 'row', 'data-fk': 'm-' + mi.id,
          onclick: function () { openPanel('missive', { id: mi.id }, true); }
        },
          icon(missiveIcon(mi), 32),
          h('span', { class: 'row-main' },
            h('span', { class: 'row-title', text: mi.subject }),
            h('span', { class: 'row-sub', text: sub.join(' · ') })),
          h('span', { class: 'row-side' },
            mi.priority === 'HIGH' ? chip(COPY.urgent, 'chip--late') : null,
            h('span', { class: 'row-go', 'aria-hidden': 'true', text: '›' })))));
      });
      panel.appendChild(ul);
    }
  };

  // ---------- Missive detail ----------
  PANELS.missive = {
    title: COPY.panels.missive.title,
    icon: function (e) { var m = findMissive(e.params.id) || e.params.missive; return m ? missiveIcon(m) : 'scroll'; },
    render: function (body, e) {
      var m = findMissive(e.params.id);
      if (!m) {
        body.appendChild(h('div', { class: 'p-stack' }, empty(COPY.missive.gone),
          h('div', { class: 'p-actions' }, h('button', { type: 'button', class: 'wbtn', onclick: backPanel }, P.stack.length > 1 ? COPY.back : COPY.close))));
        return;
      }
      e.params.missive = m;
      highlight(m);
      var slot = errSlot();
      showWriteError(slot, e, m.id);
      var reporter = h('div', { class: 'reporter', id: 'rb-reporter', hidden: !e.params.reporter });
      [2, 7, 14].forEach(function (n) {
        var day = addDays(todayDay(), n);
        reporter.appendChild(h('button', {
          type: 'button', class: 'wbtn wbtn--parch wbtn--sm', 'data-fk': 'later-' + n, 'aria-label': COPY.missive.laterAria(n, day), title: shortDay(day),
          onclick: function (ev) { doWrite('postponed', m, { btn: ev.currentTarget, days: n, errSlot: slot, entry: e, after: popAfterWrite }); }
        }, h('span', { text: COPY.missive.laterDays(n) })));
      });
      var confirmBox = null;
      if (e.params.confirm) {
        confirmBox = h('div', { class: 'confirm', role: 'group', 'aria-labelledby': 'rb-confirm-q' },
          h('p', { id: 'rb-confirm-q', text: COPY.missive.slayQuestion }),
          h('div', { class: 'p-row' },
            h('button', {
              type: 'button', class: 'wbtn wbtn--red', 'data-autofocus': '', 'data-fk': 'slay-yes',
              onclick: function (ev) { doWrite('slain', m, { btn: ev.currentTarget, errSlot: slot, entry: e, after: popAfterWrite }); }
            }, icon('sword', 20), h('span', { text: COPY.missive.slayYes })),
            h('button', { type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 'slay-no', onclick: function () { e.params.confirm = false; refreshPanel(); var b = document.querySelector('[data-fk="slay"]'); if (b) b.focus(); } }, COPY.missive.slayNo)));
        e.onEscape = function () { e.params.confirm = false; refreshPanel(); var b = document.querySelector('[data-fk="slay"]'); if (b) b.focus(); return true; };
      }
      var actions = h('div', { class: 'p-actions' },
        h('button', {
          type: 'button', class: 'wbtn wbtn--gold', 'data-fk': 'sent',
          onclick: function (ev) { doWrite('sent', m, { btn: ev.currentTarget, errSlot: slot, entry: e, after: popAfterWrite }); }
        }, icon('pigeon', 20), h('span', { text: COPY.missive.sent })),
        scribeAvailable() ? h('button', {
          type: 'button', class: 'wbtn', 'data-fk': 'scribe',
          onclick: function () { openPanel('scribe', { missive: m, missiveId: m.id }, true); }
        }, icon('quill', 20), h('span', { text: COPY.missive.scribe })) : null);
      var minor = h('div', { class: 'p-actions p-actions--minor' },
        h('button', {
          type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 'later', 'aria-expanded': String(!!e.params.reporter), 'aria-controls': 'rb-reporter',
          onclick: function () { e.params.reporter = !e.params.reporter; refreshPanel(); }
        }, icon('hourglass', 20), h('span', { text: COPY.missive.later + (e.params.reporter ? ' ▴' : ' ▾') })),
        h('button', {
          type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 'slay', 'aria-expanded': String(!!e.params.confirm),
          onclick: function () { e.params.confirm = true; refreshPanel(); }
        }, icon('sword', 20), h('span', { text: COPY.missive.slay })));
      var text = plainText(m.body);
      body.appendChild(h('div', { class: 'p-stack' },
        missiveChips(m),
        h('h3', { class: 'm-subject', text: m.subject }),
        h('div', { class: 'inset' }, text ? h('p', { class: 'read', text: text }) : h('p', { class: 'p-note', text: COPY.missive.noBody })),
        m.url ? h('div', null, hsLink(m.url)) : null,
        slot,
        actions,
        minor,
        reporter,
        confirmBox));
    }
  };

  // ---------- Journal des quêtes ----------
  PANELS.quests = {
    title: COPY.panels.quests.title, icon: COPY.panels.quests.icon,
    render: function (body) {
      var qs = U.model.quests || [];
      if (!qs.length) { body.appendChild(empty(COPY.quests.empty)); return; }
      var wrap = h('div', { class: 'p-stack' }, h('p', { class: 'p-lead', text: COPY.quests.lead(U.model.counts.coldQuests || 0, qs.length) }));
      for (var c = 4; c >= 0; c--) {
        var group = qs.filter(function (q) { return q.chapter === c; });
        if (!group.length) continue;
        var sum = group.reduce(function (s, q) { return s + (Number(q.amount) || 0); }, 0);
        var ul = h('ul', { class: 'rows' });
        group.forEach(function (q) { ul.appendChild(questRow(q)); });
        wrap.appendChild(h('section', { class: 'chapter', 'aria-label': chapterLabel(group[0]) },
          h('div', { class: 'chapter-head' }, icon('banner' + c, 24), h('h3', { text: chapterLabel(group[0]) }), h('span', { class: 'p-note num', text: COPY.quests.groupNote(group.length, sum) })),
          ul));
      }
      body.appendChild(wrap);
    }
  };
  function questRow(q) {
    var name = q.client || clientOf(q.name);
    var rest = restOf(q.name);
    var meta = h('span', { class: 'p-row', style: 'gap:8px' },
      heartsEl(q.hearts),
      h('span', { class: 'row-sub num', text: COPY.quests.silent(q.daysSinceContact || 0) }),
      q.cold ? chip(COPY.quests.cold, 'chip--cold') : null,
      q.nextActivityDay ? chip(COPY.quests.planned(q.nextActivityDay), null, 'pigeon') : null);
    return h('li', { class: 'row' + (q.cold ? ' row--cold' : '') },
      icon('banner' + q.chapter, 32),
      h('span', { class: 'row-main' },
        h('button', { type: 'button', class: 'linkbtn', style: 'font-size:var(--fs-2);text-align:left', 'data-fk': 'q-' + q.id, onclick: function () { openPanel('quest', { id: q.id }, true); } }, name),
        rest ? h('span', { class: 'row-sub', text: rest }) : null,
        meta),
      h('span', { class: 'row-side' },
        h('span', { class: 'row-amount num', text: q.amount ? money(q.amount) : '—' }),
        hsLink(q.url)));
  }

  // ---------- Quest detail ----------
  PANELS.quest = {
    title: COPY.panels.quest.title,
    icon: function (e) { var q = findQuest(e.params.id); return 'banner' + (q ? q.chapter : 0); },
    render: function (body, e) {
      var q = findQuest(e.params.id);
      if (!q) { body.appendChild(empty(COPY.quest.gone)); return; }
      body.appendChild(h('div', { class: 'p-stack' },
        h('div', { class: 'chips' },
          chip(chapterLabel(q), null, 'banner' + q.chapter),
          q.cold ? chip(COPY.quests.cold, 'chip--cold') : null,
          q.nextActivityDay ? chip(COPY.quests.planned(q.nextActivityDay), null, 'pigeon') : null),
        h('h3', { class: 'm-subject', text: q.name }),
        h('p', { class: 'p-lead', text: q.cold ? COPY.quest.coldLead(q.daysSinceContact) : COPY.quest.warmLead(q.daysSinceContact || 0) }),
        h('div', { class: 'stat-grid' },
          stat(COPY.quest.amount, q.amount ? money(q.amount) : COPY.quests.noAmount),
          h('div', { class: 'stat' }, h('span', { class: 'stat-k', text: COPY.quest.loyalty }), h('span', { class: 'stat-v' }, heartsEl(q.hearts))),
          stat(COPY.quest.silent, COPY.quest.days(q.daysSinceContact || 0)),
          stat(COPY.quest.threshold, COPY.quest.days(q.threshold || 0))),
        q.nextActivityDay ? h('div', { class: 'p-line' }, icon('pigeon', 24), h('span', { text: COPY.quest.planned(q.nextActivityDay) })) : null,
        h('p', { class: 'p-note', text: COPY.quest.rule(q.threshold || 0) }),
        q.url ? h('div', null, hsLink(q.url)) : null));
    }
  };
  function stat(k, v) { return h('div', { class: 'stat' }, h('span', { class: 'stat-k', text: k }), h('span', { class: 'stat-v num', text: v })); }

  // ---------- Trésor ----------
  PANELS.treasure = {
    title: COPY.panels.treasure.title, icon: COPY.panels.treasure.icon,
    render: function (body) {
      var s = U.model.season || {};
      var p = Math.max(0, Number(s.pct) || 0);
      var won = s.won || [];
      var bar = h('div', { class: 'bar' + (p >= 1 ? ' bar--over' : ''), role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(Math.min(1, p) * 100)), 'aria-label': COPY.treasure.season },
        h('span', { class: 'bar-fill', style: 'width:' + Math.min(100, p * 100) + '%' }));
      var ul = h('ul', { class: 'rows' });
      won.forEach(function (d) {
        var day = d.closeDate ? parisDay(new Date(d.closeDate)) : null;
        ul.appendChild(h('li', { class: 'row' },
          icon('coin', 28),
          h('span', { class: 'row-main' },
            h('span', { class: 'row-title', text: clientOf(d.name) }),
            h('span', { class: 'row-sub', text: [restOf(d.name), day ? COPY.treasure.closed(day) : ''].filter(Boolean).join(' · ') })),
          h('span', { class: 'row-side' }, h('span', { class: 'row-amount num', text: money(d.amount) }), hsLink(d.url))));
      });
      body.appendChild(h('div', { class: 'p-stack' },
        h('div', { class: 'treasure-top' }, icon('chest', 64),
          h('div', null,
            h('div', { class: 'treasure-gold num', text: money(s.gold) }),
            h('div', { class: 'p-note num', text: COPY.treasure.of(s.goal) + ' · ' + (s.monthLabel || '') + ' ' + (s.name ? quote(frTypo(s.name)) : '') }))),
        bar,
        h('p', { class: 'p-lead', text: (s.gold >= s.goal ? COPY.treasure.reached : COPY.treasure.remaining(Math.max(0, s.goal - s.gold))) + ' ' + COPY.treasure.daysLeft(s.daysLeft) }),
        h('div', { class: 'stat-grid' },
          stat(COPY.treasure.season, money(s.gold)),
          stat(COPY.treasure.goal, money(s.goal)),
          stat(COPY.treasure.allTime, money(U.model.treasureAllTime)),
          stat(COPY.treasure.wonCount, String(won.length))),
        h('h3', { class: 'p-h', text: COPY.treasure.list }),
        won.length ? ul : empty(COPY.treasure.empty)));
    }
  };

  // ---------- Livre des Défaites ----------
  PANELS.chronicle = {
    title: COPY.panels.chronicle.title, icon: COPY.panels.chronicle.icon,
    render: function (body) {
      var list = (U.model.chronicle || []).slice();
      if (!list.length) { body.appendChild(h('div', { class: 'p-stack' }, h('p', { class: 'p-note', text: COPY.chronicle.lead }), empty(COPY.chronicle.empty))); return; }
      var due = list.filter(function (c) { return c.reconquestDue; });
      var rest = list.filter(function (c) { return !c.reconquestDue; });
      var wrap = h('div', { class: 'p-stack' }, h('p', { class: 'p-note', text: COPY.chronicle.lead }));
      if (due.length) {
        wrap.appendChild(h('h3', { class: 'p-h', text: COPY.chronicle.dueHead }));
        due.forEach(function (c) { wrap.appendChild(lostCard(c)); });
        if (rest.length) wrap.appendChild(h('h3', { class: 'p-h', text: COPY.chronicle.allHead }));
      }
      rest.forEach(function (c) { wrap.appendChild(lostCard(c)); });
      body.appendChild(wrap);
    }
  };
  function lostCard(c) {
    var d = c.deal || {};
    var state = c.reconquestState;
    var actions = null;
    if (c.reconquestDue) {
      actions = h('div', { class: 'p-actions' },
        h('button', {
          type: 'button', class: 'wbtn wbtn--gold', 'data-fk': 'rq-' + d.id,
          onclick: function () { openPanel('scribe', { entry: c, dealId: d.id }, true); }
        }, icon('quill', 20), h('span', { text: COPY.chronicle.launch })),
        h('button', { type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 'rf-' + d.id, onclick: function () { markReconquest(c, 'dismissed'); } }, COPY.chronicle.forget));
    }
    return h('article', { class: 'lost' + (c.reconquestDue ? ' lost--due' : '') },
      h('div', { class: 'lost-top' },
        h('span', { class: 'row-title', text: d.name || '' }),
        h('span', { class: 'p-note num', text: c.lostDay ? COPY.chronicle.lost(c.lostDay) : '' })),
      h('p', { class: 'lost-reason', text: c.reason ? quote(c.reason) : COPY.chronicle.noReason }),
      h('div', { class: 'chips' },
        c.reconquestDay ? chip(c.reconquestDue ? COPY.chronicle.reconquestDue(c.reconquestDay) : COPY.chronicle.reconquestOn(c.reconquestDay), c.reconquestDue ? 'chip--today' : 'chip--muted', 'hourglass') : null,
        state === 'launched' ? chip(COPY.chronicle.launched, 'chip--ok', 'pigeon') : null,
        state === 'dismissed' ? chip(COPY.chronicle.dismissed, 'chip--muted') : null,
        d.amount ? chip(money(d.amount), 'chip--muted') : null),
      d.url ? h('div', null, hsLink(d.url)) : null,
      actions);
  }
  function markReconquest(entry, status, quiet) {
    var id = String(entry.deal.id);
    var st = U.state;
    try { st = window.LOGIC.recordAction(U.state, { type: 'reconquest', id: id, day: todayDay(), status: status }); } catch (e) { st = U.state; }
    if (!st.reconquests || st.reconquests[id] !== status) {
      var rq = {}; Object.keys(st.reconquests || {}).forEach(function (k) { rq[k] = st.reconquests[k]; });
      rq[id] = status;
      st = Object.assign({}, st, { reconquests: rq });
    }
    U.state = st;
    persist();
    rebuild(new Date(), []);
    if (!quiet) toast(status === 'dismissed' ? COPY.toast.forgot : COPY.toast.reconquest, { icon: status === 'dismissed' ? 'book' : 'pigeon' });
    sfx(status === 'dismissed' ? 'page' : 'pigeon');
  }

  // ---------- Héros ----------
  PANELS.hero = {
    title: COPY.panels.hero.title, icon: COPY.panels.hero.icon,
    render: function (body) {
      var m = U.model, hero = m.hero || {};
      var cards = h('div', { class: 'p-stack' });
      ['relance', 'closing', 'prospection'].forEach(function (k) {
        var info = (hero.skills && hero.skills[k]) || { level: 1, xp: 0, floor: 0, next: 100 };
        var part = info.next != null && info.next > info.floor ? (info.xp - info.floor) / (info.next - info.floor) : 1;
        cards.appendChild(h('div', { class: 'skill-card' },
          h('span', { class: 'skill-card-name', text: COPY.hero.names[k] }),
          h('span', { class: 'skill-card-lv num', text: COPY.hud.level(info.level) }),
          h('div', { class: 'bar bar--green', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(part * 100)), 'aria-label': COPY.hero.names[k] },
            h('span', { class: 'bar-fill', style: 'width:' + Math.round(Math.max(0, Math.min(1, part)) * 100) + '%' })),
          h('p', { class: 'p-note num', style: 'color:var(--ink);font-weight:600', text: COPY.hero.xp(info.xp) + ' · ' + (info.next == null ? COPY.hero.max : COPY.hero.toNext(info.next - info.xp, info.level + 1)) }),
          h('p', { class: 'p-note', text: COPY.hero.hints[k] })));
      });
      var ladder = h('ul', { class: 'ladder' });
      TITLES.forEach(function (t) {
        var now = hero.level >= t[0] && hero.level <= t[1];
        var past = hero.level > t[1];
        ladder.appendChild(h('li', { class: now ? 'is-now' : past ? 'is-past' : '' },
          h('span', { text: t[2] }), h('span', { class: 'num', text: t[0] === t[1] ? String(t[0]) : t[0] + '–' + t[1] })));
      });
      var weekend = isWeekend(m.today);
      body.appendChild(h('div', { class: 'p-stack' },
        h('div', { class: 'hero-top' },
          h('span', { class: 'hud-portrait' }, icon('hero', 64)),
          h('div', null,
            h('h3', { class: 'hero-name', text: hero.name || 'Sire Julian de Bourgogne' }),
            h('p', { class: 'hero-title', text: (hero.title || '') + ' · ' + COPY.hud.level(hero.level || 3) }))),
        U.raw && U.raw.partial && U.raw.partial.completedTasks ? h('p', { class: 'p-note', text: COPY.hero.partial }) : null,
        h('h3', { class: 'p-h', text: COPY.hero.skills }),
        cards,
        h('h3', { class: 'p-h', text: COPY.hero.streakHead }),
        h('div', { class: 'p-line' }, icon('flame', 24), h('span', { class: 'p-lead', text: COPY.hero.streak(hero.streak || 0) })),
        h('div', { class: 'p-line' }, icon('star', 24, hero.perfectToday ? '' : 'is-dim'), h('span', { text: hero.perfectToday ? COPY.hero.perfectToday : weekend ? COPY.hero.weekend : (m.missives.today || []).length ? COPY.hero.notYet : COPY.hero.notYetAction })),
        calendar(m),
        h('p', { class: 'p-note', text: COPY.hero.rule }),
        h('h3', { class: 'p-h', text: COPY.hero.titles }),
        ladder));
    }
  };
  function calendar(m) {
    var today = m.today, p = dayParts(today);
    if (!p) return null;
    var set = {};
    ((U.state && U.state.perfectDays) || []).forEach(function (d) { set[d] = 1; });
    ((m.hero && m.hero.perfectDays) || []).forEach(function (d) { set[d] = 1; });
    if (m.hero && m.hero.perfectToday) set[today] = 1;
    var first = p.y + '-' + (p.mo < 10 ? '0' : '') + p.mo + '-01';
    var fw = (dayParts(first).wd + 6) % 7; // Monday = 0
    var dim = new Date(Date.UTC(p.y, p.mo, 0)).getUTCDate();
    var grid = h('div', { class: 'cal', role: 'list', 'aria-label': COPY.hero.calendar(MO_TITLE[p.mo - 1]) });
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (x) { grid.appendChild(h('span', { class: 'cal-h', 'aria-hidden': 'true', text: x })); });
    for (var i = 0; i < fw; i++) grid.appendChild(h('span', { 'aria-hidden': 'true' }));
    for (var d = 1; d <= dim; d++) {
      var day = p.y + '-' + (p.mo < 10 ? '0' : '') + p.mo + '-' + (d < 10 ? '0' : '') + d;
      var wd = dayParts(day).wd;
      var perfect = !!set[day];
      var cls = 'cal-d num' + (wd === 0 || wd === 6 ? ' is-we' : '') + (day > today ? ' is-future' : '') + (perfect ? ' is-perfect' : '') + (day === today ? ' is-today' : '');
      grid.appendChild(h('span', { class: cls, role: 'listitem', 'aria-label': d + ' ' + MO_LONG[p.mo - 1] + (perfect ? ', ' + COPY.hero.legendPerfect : '') + (day === today ? ', ' + COPY.hero.legendToday : '') },
        String(d), perfect ? icon('star', 12) : null));
    }
    return h('div', { class: 'p-stack', style: 'gap:8px' },
      h('h3', { class: 'p-h', text: COPY.hero.calendar(MO_TITLE[p.mo - 1]) }),
      grid);
  }

  // ---------- Siège (Grand Nettoyage) ----------
  PANELS.siege = {
    title: COPY.panels.siege.title, icon: COPY.panels.siege.icon,
    render: function (body, e) {
      var m = U.model, s = m.siege || {};
      var list = m.missives.overdue || [];
      var initial = Math.max(s.initialCount || 0, list.length + (s.defeated || 0), 1);
      var defeated = Math.max(0, initial - list.length);
      var p = defeated / initial;
      var progress = h('div', { class: 'siege-progress' },
        h('div', { class: 'p-row' },
          h('span', { class: 'p-lead num', text: COPY.siege.progress(defeated, initial) }),
          h('span', { class: 'p-note num', text: COPY.siege.remaining(list.length) })),
        h('div', { class: 'bar bar--green', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(initial), 'aria-valuenow': String(defeated), 'aria-label': COPY.siege.progress(defeated, initial) },
          h('span', { class: 'bar-fill', style: 'width:' + Math.round(p * 100) + '%' })));
      if (!list.length) {
        body.appendChild(h('div', { class: 'p-stack' }, progress, empty(COPY.siege.done),
          h('div', { class: 'p-actions' }, h('button', { type: 'button', class: 'wbtn wbtn--gold', 'data-autofocus': '', onclick: closePanel }, COPY.siege.close))));
        return;
      }
      var g = null;
      for (var i = 0; i < list.length; i++) if (!U.siegeSkip[list[i].id]) { g = list[i]; break; }
      if (!g) { U.siegeSkip = {}; g = list[0]; }
      e.params.current = g.id;
      highlight(g);
      var slot = errSlot();
      showWriteError(slot, e, g.id);
      var text = plainText(g.body);
      var reporter = h('div', { class: 'reporter', id: 'rb-siege-reporter', hidden: !e.params.reporter });
      [2, 7, 14].forEach(function (n) {
        var day = addDays(todayDay(), n);
        reporter.appendChild(h('button', {
          type: 'button', class: 'wbtn wbtn--parch wbtn--sm', 'data-fk': 's-later-' + n, 'aria-label': COPY.missive.laterAria(n, day), title: shortDay(day),
          onclick: function (ev) { doWrite('postponed', g, { btn: ev.currentTarget, days: n, errSlot: slot, entry: e, after: siegeNext(e) }); }
        }, h('span', { text: COPY.missive.laterDays(n) })));
      });
      var confirmBox = null;
      if (e.params.confirm === g.id) {
        confirmBox = h('div', { class: 'confirm', role: 'group', 'aria-labelledby': 'rb-sconfirm-q' },
          h('p', { id: 'rb-sconfirm-q', text: COPY.missive.slayQuestion }),
          h('div', { class: 'p-row' },
            h('button', {
              type: 'button', class: 'wbtn wbtn--red', 'data-fk': 's-slay-yes', 'data-autofocus': '',
              onclick: function (ev) { doWrite('slain', g, { btn: ev.currentTarget, errSlot: slot, entry: e, after: siegeNext(e) }); }
            }, icon('sword', 20), h('span', { text: COPY.missive.slayYes })),
            h('button', { type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 's-slay-no', onclick: function () { e.params.confirm = null; refreshPanel(); } }, COPY.missive.slayNo)));
        e.onEscape = function () { e.params.confirm = null; refreshPanel(); return true; };
      }
      var sendBtn = scribeAvailable()
        ? h('button', { type: 'button', class: 'wbtn wbtn--gold', 'data-fk': 's-send', onclick: function () { openPanel('scribe', { missive: g, missiveId: g.id, fromSiege: true }, true); } }, icon('quill', 20), h('span', { text: COPY.siege.send }))
        : h('button', { type: 'button', class: 'wbtn wbtn--gold', 'data-fk': 's-send', onclick: function (ev) { doWrite('sent', g, { btn: ev.currentTarget, errSlot: slot, entry: e, after: siegeNext(e) }); } }, icon('pigeon', 20), h('span', { text: COPY.missive.sent }));
      body.appendChild(h('div', { class: 'p-stack' },
        h('p', { class: 'p-note', text: COPY.siege.lead }),
        progress,
        h('article', { class: 'siege-card', 'aria-labelledby': 'rb-siege-subj' },
          h('div', { class: 'siege-card-top' }, icon('goblin' + Math.max(1, Math.min(3, g.tier || 1)), 48),
            h('div', { class: 'chips' }, chip(COPY.tiers[g.tier || 1]), chip(COPY.due.late(g.daysOverdue), 'chip--late'))),
          h('h3', { class: 'm-subject', id: 'rb-siege-subj', text: g.subject }),
          text ? h('p', { class: 'read', text: excerpt(text, 320) }) : h('p', { class: 'p-note', text: COPY.missive.noBody }),
          g.url ? h('div', null, hsLink(g.url)) : null,
          slot,
          h('div', { class: 'p-actions' },
            sendBtn,
            h('button', { type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 's-later', 'aria-expanded': String(!!e.params.reporter), 'aria-controls': 'rb-siege-reporter', onclick: function () { e.params.reporter = !e.params.reporter; refreshPanel(); } }, icon('hourglass', 20), h('span', { text: COPY.missive.later + (e.params.reporter ? ' ▴' : ' ▾') })),
            h('button', { type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 's-slay', onclick: function () { e.params.confirm = g.id; refreshPanel(); } }, icon('sword', 20), h('span', { text: COPY.missive.slay })),
            h('button', { type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 's-skip', onclick: function () { U.siegeSkip[g.id] = 1; e.params.reporter = false; e.params.confirm = null; refreshPanel(); sfx('click'); var b = document.querySelector('[data-fk="s-send"]'); if (b) b.focus(); } }, COPY.siege.skip)),
          reporter,
          confirmBox)));
    }
  };
  function siegeNext(e) {
    return function () {
      e.params.reporter = false; e.params.confirm = null;
      while (P.stack.length && topEntry().name !== 'siege') teardown(P.stack.pop());
      if (!P.stack.length) { closePanel(); return; }
      renderPanel(false, true);
      var b = document.querySelector('[data-fk="s-send"]') || $('rb-modal-title');
      if (b) b.focus();
    };
  }

  // ---------- Le Scribe ----------
  PANELS.scribe = {
    title: COPY.panels.scribe.title, icon: COPY.panels.scribe.icon, live: false,
    update: function () { /* keeps its own state; data refreshes do not touch a draft in progress */ },
    render: function (body, e) {
      var S = e.scribe;
      if (!S) {
        S = e.scribe = {
          phase: 'context', ctx: null, ctxError: null, intent: '', draft: null, streamText: '',
          error: null, gmailError: null, gmailSig: null, note: '', gmail: null, ctl: null, gen: 0, subject: '', body: '', copyFallback: false, dead: false
        };
        e.cleanup = function () { S.dead = true; if (S.ctl) { try { S.ctl.abort(); } catch (x) { /* */ } } };
        startContext(S, e);
      }
      S.root = body;
      drawScribe(S, e);
    }
  };

  function scribeTask(e) { return e.params.missive || (e.params.missiveId ? findMissive(e.params.missiveId) : null); }

  async function startContext(S, e) {
    S.phase = 'context';
    try {
      var ctx;
      var D = window.DATA;
      if (e.params.entry) {
        if (typeof D.getReconquestContext === 'function') ctx = await D.getReconquestContext(e.params.entry);
        else ctx = await D.getMissiveContext(reconquestTask(e.params.entry));
      } else {
        ctx = await D.getMissiveContext(scribeTask(e));
      }
      if (S.dead) return;
      S.ctx = ctx || {};
    } catch (err) {
      if (S.dead) return;
      S.ctxError = err;
      S.ctx = { task: scribeTask(e), contact: null, deal: null, notes: [], emails: [], gmail: null, errors: [] };
    }
    S.phase = 'compose';
    if (topEntry() === e) drawScribe(S, e, 'intent');
  }
  function reconquestTask(entry) {
    var d = entry.deal || {};
    return {
      id: null, subject: COPY.scribe.reconquestSubject(d.name || ''), body: entry.reason ? COPY.cel.lostReason(entry.reason) : '',
      status: 'NOT_STARTED', dueDay: todayDay(), daysOverdue: 0, tier: 0, type: 'EMAIL', priority: null, url: d.url || null, dealId: d.id
    };
  }

  function replySubject(s) { s = String(s || '').trim(); return /^re\s*:/i.test(s) ? s : 'Re: ' + s; }
  function draftTarget(S) {
    var ctx = S.ctx || {}, d = S.draft || {};
    var email = (ctx.contact && ctx.contact.email) || (Array.isArray(d.to) ? d.to[0] : d.to) || '';
    var gm = ctx.gmail && ctx.gmail.lastMessageId ? ctx.gmail : null;
    return { email: String(email || '').trim(), replyTo: d.replyToMessageId || (gm ? gm.lastMessageId : null), thread: gm ? gm.subject : null };
  }

  // Extract a (possibly unfinished) JSON string field from streamed text.
  function partialField(text, key) {
    var re = new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)');
    var m = re.exec(String(text || ''));
    return m ? unescapeJson(m[1]) : null;
  }
  function unescapeJson(s) {
    var out = '', i = 0;
    while (i < s.length) {
      var ch = s.charAt(i);
      if (ch !== '\\') { out += ch; i++; continue; }
      var n = s.charAt(i + 1);
      if (!n) break;
      if (n === 'u') {
        var hex = s.substr(i + 2, 4);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) { out += String.fromCharCode(parseInt(hex, 16)); i += 6; continue; }
        break;
      }
      out += n === 'n' ? '\n' : n === 't' ? '\t' : (n === 'r' || n === 'b' || n === 'f') ? '' : n;
      i += 2;
    }
    return out;
  }

  function drawScribe(S, e, focusKey) {
    var body = S.root;
    if (!body || topEntry() !== e) return;
    var keepScroll = body.scrollTop;
    clear(body);
    var task = scribeTask(e);
    var entry = e.params.entry;
    var ctx = S.ctx || {};
    var wrap = h('div', { class: 'p-stack' });

    // target
    var head = entry
      ? [h('div', { class: 'chips' }, chip(COPY.chronicle.launch, 'chip--today', 'book')), h('h3', { class: 'm-subject', text: (entry.deal && entry.deal.name) || '' })]
      : task ? [missiveChips(task), h('h3', { class: 'm-subject', text: task.subject })] : [];
    add(wrap, head);
    if (ctx.contact && ctx.contact.name) wrap.appendChild(h('p', { class: 'p-note', text: COPY.scribe.to(ctx.contact.name + (ctx.contact.company ? ' · ' + ctx.contact.company : '')) }));

    if (S.phase === 'context') {
      wrap.appendChild(h('div', { class: 'inset stream-state', role: 'status' }, icon('hourglass', 24, 'rb-hourglass'), COPY.scribe.gathering));
      body.appendChild(wrap);
      return;
    }

    wrap.appendChild(contextDetails(S, e));
    if (S.ctxError) wrap.appendChild(errorBlock(S.ctxError, { inline: true, icon: 'scroll' }));
    (ctx.errors || []).forEach(function (er) {
      var server = er.section === 'gmail' ? 'Gmail' : 'HubSpot';
      var b = errorBlock({ code: er.code, server: server, message: er.message, source: 'mcp' }, { inline: true, prefix: COPY.errors.section[er.section] || server, icon: 'pigeon' });
      if (b) wrap.appendChild(b);
    });
    var thin = !(ctx.notes && ctx.notes.length) && !(ctx.emails && ctx.emails.length) && !ctx.gmail;

    var off = !scribeAvailable();
    // No scribe here: open the parchment for a hand-written missive (Gmail draft / Copier still work).
    if (off && S.phase === 'compose') {
      S.phase = 'edit';
      if (!S.body) S.body = COPY.scribe.greeting(ctx.contact && ctx.contact.firstname) + '\n\n\n\nJulian\nThe French Bot';
      if (focusKey === 'intent' || focusKey === 'write') focusKey = 'body';
    }
    // intent + write
    var intent = h('input', {
      type: 'text', class: 'field field--ui', id: 'rb-intent', autocomplete: 'off', maxlength: '160',
      placeholder: COPY.scribe.intentPlaceholder, value: S.intent, 'data-fk': 'intent',
      disabled: S.phase === 'writing' || off,
      oninput: function (ev) { S.intent = ev.target.value; },
      onkeydown: function (ev) { if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); if (S.phase !== 'writing' && !off) runDraft(S, e, S.phase === 'edit'); } }
    });
    var writeBtn = h('button', {
      type: 'button', class: 'wbtn' + (S.phase === 'edit' ? ' wbtn--parch' : ' wbtn--gold'), 'data-fk': 'write',
      disabled: S.phase === 'writing' || off,
      onclick: function () { runDraft(S, e, S.phase === 'edit'); }
    }, icon('quill', 20), h('span', { text: S.phase === 'edit' ? COPY.scribe.rewrite : COPY.scribe.write }));
    wrap.appendChild(h('div', { class: 'intent-row' },
      h('div', null, h('label', { class: 'field-label', for: 'rb-intent', text: COPY.scribe.intentLabel }), intent),
      writeBtn));
    if (off) wrap.appendChild(h('p', { class: 'reason', text: COPY.scribe.off }));
    else if (thin && S.phase === 'compose') wrap.appendChild(h('p', { class: 'p-note', text: COPY.scribe.thin }));
    if (S.note) wrap.appendChild(h('p', { class: 'p-note', role: 'status', text: S.note }));
    var slot = errSlot();
    // Scribe (sample) errors only: « Réessayer » asks the scribe again. Gmail errors render under the Gmail button.
    if (S.error) { var eb = errorBlock(S.error, { inline: true, icon: 'quill', retry: function () { runDraft(S, e, true); } }); if (eb) slot.appendChild(eb); }
    wrap.appendChild(slot);

    if (S.phase === 'writing') {
      var subjEl = h('span', { class: 'stream-subject' });
      var bodyEl = h('span');
      S.streamSubject = subjEl; S.streamBody = bodyEl;
      wrap.appendChild(h('div', { class: 'p-row', style: 'justify-content:space-between' },
        h('span', { class: 'stream-state', role: 'status' }, icon('quill', 24), COPY.scribe.writing),
        h('button', { type: 'button', class: 'wbtn wbtn--red', 'data-fk': 'stop', 'data-autofocus': '', onclick: function () { if (S.ctl) { try { S.ctl.abort(); } catch (x) { /* */ } } } }, COPY.scribe.stop)));
      wrap.appendChild(h('div', { class: 'stream', 'aria-live': 'off' }, subjEl, bodyEl, h('span', { class: 'quill-cursor', 'aria-hidden': 'true' })));
      updateStream(S);
    }

    if (S.phase === 'edit') {
      var t = draftTarget(S);
      var subjectIn = h('input', { type: 'text', class: 'field', id: 'rb-subject', value: S.subject, 'data-fk': 'subject', oninput: function (ev) { S.subject = ev.target.value; syncGmailBtn(S); } });
      var bodyIn = h('textarea', { class: 'field', id: 'rb-body', rows: '12', 'data-fk': 'body', oninput: function (ev) { S.body = ev.target.value; syncGmailBtn(S); } });
      bodyIn.value = S.body;
      wrap.appendChild(h('div', null, h('label', { class: 'field-label', for: 'rb-subject', text: COPY.scribe.subject }), subjectIn,
        t.thread ? h('p', { class: 'p-note', style: 'margin-top:6px', text: COPY.scribe.replyIn(t.thread) }) : null));
      wrap.appendChild(h('div', null, h('label', { class: 'field-label', for: 'rb-body', text: COPY.scribe.body }), bodyIn));
      wrap.appendChild(h('p', { class: 'p-note', text: COPY.scribe.voice }));

      var reason = !t.email ? COPY.scribe.noEmail : !can('gmail') ? COPY.scribe.noGmail : '';
      S.gmailReason = reason;
      // After a draft is created the button rests (« Brouillon créé ✓ ») until the text changes: no duplicate drafts.
      var gmailBtn = h('button', {
        type: 'button', class: 'wbtn' + (S.gmail ? ' wbtn--parch' : ' wbtn--gold'), 'data-fk': 'gmail',
        disabled: !!reason || gmailDup(S), 'aria-describedby': reason ? 'rb-gmail-reason' : S.gmail && !gmailDup(S) ? 'rb-gmail-again' : null,
        onclick: function (ev) { if (!gmailDup(S)) makeGmailDraft(S, e, ev.currentTarget); }
      }, icon('pigeon', 20), h('span', { class: 'gmail-label', text: gmailLabel(S) }));
      S.gmailBtn = gmailBtn;
      var copyBtn = h('button', { type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 'copy', onclick: function () { copyDraft(S, e); } }, icon('scroll', 20), h('span', { text: COPY.scribe.copy }));
      wrap.appendChild(h('div', { class: 'p-actions' }, gmailBtn, copyBtn));
      if (reason) wrap.appendChild(h('p', { class: 'reason', id: 'rb-gmail-reason', text: reason }));
      var again = h('p', { class: 'p-note', id: 'rb-gmail-again', text: COPY.scribe.gmailAgainNote, hidden: !(S.gmail && !gmailDup(S)) });
      S.gmailAgainEl = again;
      wrap.appendChild(again);
      if (S.gmailError) {
        var ge = errorBlock(S.gmailError, { inline: true, icon: 'pigeon', prefix: COPY.errors.section.gmail });
        if (ge) wrap.appendChild(ge);
      }
      if (S.copyFallback) {
        var ta = h('textarea', { class: 'field copy-fallback', readonly: true, 'aria-label': COPY.scribe.copy, 'data-fk': 'copy-fallback' });
        ta.value = (S.subject ? S.subject + '\n\n' : '') + S.body;
        wrap.appendChild(ta);
        S.copyArea = ta;
      }
      if (S.gmail) {
        var demo = !!(S.gmail.demo || (U.info && U.info.mode === 'demo'));
        wrap.appendChild(h('div', { class: 'ok-block', role: 'status' },
          icon('pigeon', 28),
          h('p', { text: demo ? COPY.scribe.draftDemo : S.gmail.viewUrl ? COPY.scribe.draftDone : COPY.scribe.draftNoLink }),
          S.gmail.viewUrl ? h('a', { class: 'p-link', href: S.gmail.viewUrl, target: '_blank', rel: 'noopener', 'data-fk': 'open-draft' }, COPY.scribe.openDraft + ' ↗') : null));
      }
    }

    // finishing move
    if (S.phase !== 'writing') {
      var fin = h('div', { class: 'p-actions' });
      var finSlot = errSlot();
      if (task && !entry) {
        fin.appendChild(h('button', {
          type: 'button', class: 'wbtn' + (S.gmail ? ' wbtn--gold' : ' wbtn--parch'), 'data-fk': 'done',
          onclick: function (ev) { doWrite('sent', task, { btn: ev.currentTarget, errSlot: finSlot, after: e.params.fromSiege ? siegeAfterScribe : popAfterWrite }); }
        }, icon('pigeon', 20), h('span', { text: COPY.scribe.sentAfter })));
      } else if (entry) {
        var launched = U.state && U.state.reconquests && U.state.reconquests[String(entry.deal.id)] === 'launched';
        if (launched) fin.appendChild(chip(COPY.scribe.reconquestLaunched, 'chip--ok', 'pigeon'));
        else fin.appendChild(h('button', { type: 'button', class: 'wbtn wbtn--parch', 'data-fk': 'done', onclick: function () { markReconquest(entry, 'launched'); backPanel(); } }, icon('book', 20), h('span', { text: COPY.scribe.reconquestDone })));
      }
      wrap.appendChild(h('hr', { class: 'p-sep' }));
      wrap.appendChild(finSlot);
      wrap.appendChild(fin);
    }
    body.appendChild(wrap);
    body.scrollTop = keepScroll;
    if (focusKey) {
      var f = body.querySelector('[data-fk="' + focusKey + '"]');
      if (f && !f.disabled) f.focus();
    }
  }
  function siegeAfterScribe() {
    while (P.stack.length && topEntry().name !== 'siege') teardown(P.stack.pop());
    if (!P.stack.length) { closePanel(); return; }
    renderPanel(false, true);
    var b = document.querySelector('[data-fk="s-send"]') || $('rb-modal-title');
    if (b) b.focus();
  }

  function gmailSig(S) { return String(S.subject || '') + '\u0000' + String(S.body || ''); }
  function gmailDup(S) { return !!(S.gmail && S.gmailSig === gmailSig(S)); }
  function gmailLabel(S) { return gmailDup(S) ? COPY.scribe.gmailDone : S.gmail ? COPY.scribe.gmailAgain : COPY.scribe.gmail; }
  function syncGmailBtn(S) {
    var b = S.gmailBtn;
    if (!b || !b.isConnected || b.classList.contains('is-busy')) return;
    var dup = gmailDup(S);
    b.disabled = !!S.gmailReason || dup;
    var l = b.querySelector('.gmail-label');
    if (l) l.textContent = gmailLabel(S);
    var showAgain = !!(S.gmail && !dup);
    if (S.gmailAgainEl) S.gmailAgainEl.hidden = !showAgain;
    if (!S.gmailReason) { if (showAgain) b.setAttribute('aria-describedby', 'rb-gmail-again'); else b.removeAttribute('aria-describedby'); }
  }

  function contextDetails(S, e) {
    var ctx = S.ctx || {};
    var parts = [];
    if (ctx.contact && ctx.contact.name) parts.push(ctx.contact.name);
    var n = (ctx.notes || []).length, em = (ctx.emails || []).length, gm = ctx.gmail ? (ctx.gmail.messages || []).length : 0;
    if (n) parts.push(COPY.scribe.sum.notes(n));
    if (em) parts.push(COPY.scribe.sum.emails(em));
    if (ctx.gmail) parts.push(COPY.scribe.sum.gmail(gm));
    if (!n && !em && !ctx.gmail) parts.push(COPY.scribe.sum.nothing);
    var inner = h('div', { class: 'scribe-ctx-body' });
    var c = ctx.contact;
    inner.appendChild(h('div', { class: 'ctx-block' }, h('h4', { text: COPY.scribe.ctxContact }),
      c ? h('p', null, [c.name, c.jobtitle, c.company].filter(Boolean).join(' · '), c.email ? h('br') : null, c.email || null) : h('p', { text: COPY.scribe.ctxNone })));
    var d = ctx.deal;
    inner.appendChild(h('div', { class: 'ctx-block' }, h('h4', { text: COPY.scribe.ctxDeal }),
      h('p', { text: d ? [d.name, d.amount ? money(d.amount) : ''].filter(Boolean).join(' · ') : COPY.scribe.noDeal })));
    var entry = e.params.entry;
    if (entry) {
      inner.appendChild(h('div', { class: 'ctx-block' }, h('h4', { text: COPY.scribe.ctxLost }),
        h('p', { text: [entry.lostDay ? COPY.chronicle.lost(entry.lostDay) : '', entry.reason ? COPY.cel.lostReason(entry.reason) : COPY.chronicle.noReason].filter(Boolean).join(' · ') })));
    }
    if (n) {
      inner.appendChild(h('div', { class: 'ctx-block' }, h('h4', { text: COPY.scribe.ctxNotes }),
        h('ul', null, ctx.notes.map(function (x) { return h('li', null, x.day ? h('span', { class: 'ctx-day', text: shortDay(x.day) }) : null, excerpt(x.text, 320)); }))));
    }
    if (em) {
      inner.appendChild(h('div', { class: 'ctx-block' }, h('h4', { text: COPY.scribe.ctxEmails }),
        h('ul', null, ctx.emails.map(function (x) { return h('li', null, x.day ? h('span', { class: 'ctx-day', text: shortDay(x.day) }) : null, (x.subject ? x.subject + ' — ' : '') + excerpt(x.text, 240)); }))));
    }
    if (ctx.gmail) {
      inner.appendChild(h('div', { class: 'ctx-block' }, h('h4', { text: COPY.scribe.ctxGmail + (ctx.gmail.subject ? ' · ' + ctx.gmail.subject : '') }),
        h('ul', null, (ctx.gmail.messages || []).map(function (x) { return h('li', null, x.day ? h('span', { class: 'ctx-day', text: shortDay(x.day) }) : null, (x.from ? x.from + ' : ' : '') + excerpt(x.text, 240)); }))));
    }
    var det = h('details', { class: 'scribe-ctx inset' }, h('summary', { 'data-fk': 'ctx' }, icon('book', 24), h('span', null, h('span', { text: COPY.scribe.ctxTitle }), h('br'), h('span', { class: 'scribe-ctx-sum', text: parts.join(' · ') }))), inner);
    if (S.ctxOpen) det.open = true;
    det.addEventListener('toggle', function () { S.ctxOpen = det.open; });
    return det;
  }

  function updateStream(S) {
    if (!S.streamBody) return;
    var subj = partialField(S.streamText, 'subject');
    var bod = partialField(S.streamText, 'body');
    S.streamSubject.textContent = subj || '';
    S.streamSubject.hidden = !subj;
    S.streamBody.textContent = bod != null ? bod : (subj ? '' : '…');
  }

  async function runDraft(S, e, rewrite) {
    if (S.phase === 'writing' || !scribeAvailable()) return;
    var prevPhase = S.phase;
    S.error = null; S.note = ''; S.streamText = ''; S.copyFallback = false;
    S.phase = 'writing';
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    S.ctl = ctl;
    var gen = ++S.gen;
    drawScribe(S, e, 'stop');
    sfx('scribe');
    try {
      var opts = {
        onText: function (u) {
          if (S.dead || gen !== S.gen) return;
          S.streamText = typeof u === 'string' ? u : (u && typeof u.text === 'string' ? u.text : S.streamText + ((u && u.delta) || ''));
          updateStream(S);
        },
        signal: ctl ? ctl.signal : undefined
      };
      // Only the panel's first call may be answered from the platform cache: a retry after a bad answer,
      // a « Réessayer » or a « Réécrire » must reach the scribe, not replay the same reply.
      if (rewrite || gen > 1) opts.cache = false;
      var d = await window.DATA.draftMissive(S.ctx, String(S.intent || '').trim(), opts);
      if (S.dead || gen !== S.gen) return;
      if (!d || !String(d.body || '').trim()) throw { code: 'empty_completion', source: 'sample', server: null, message: '' };
      S.draft = d;
      var t = draftTarget(S);
      S.subject = t.thread ? replySubject(t.thread) : String(d.subject || '');
      S.body = String(d.body || '');
      S.gmail = null; S.gmailSig = null; S.gmailError = null;
      S.phase = 'edit';
      S.ctl = null;
      drawScribe(S, e, 'subject');
      sfx('page');
    } catch (err) {
      if (S.dead || gen !== S.gen) return;
      S.ctl = null;
      var c = errCopy(err);
      if (err && err.code === 'cancelled') {
        S.note = COPY.scribe.stopped;
      } else {
        if (c.hide) U.scribeOff = true;
        S.error = err;
        sfx('error');
      }
      S.phase = S.body ? 'edit' : (prevPhase === 'edit' ? 'edit' : 'compose');
      if (S.phase === 'edit' && !S.body) S.phase = 'compose';
      drawScribe(S, e, 'write');
    }
  }

  async function makeGmailDraft(S, e, btn) {
    var t = draftTarget(S);
    if (!t.email || S.gmailBusy) return;
    S.gmailError = null;
    S.gmailBusy = true;
    setBusy(btn, true);
    try {
      var args = { to: [t.email], subject: S.subject, body: S.body };
      if (t.replyTo) args.replyToMessageId = t.replyTo;
      var sig = gmailSig(S);
      var res = await window.DATA.createGmailDraft(args);
      S.gmailBusy = false;
      if (S.dead) return;
      S.gmail = res || {};
      S.gmailSig = sig;
      sfx('pigeon'); // the panel confirms in place (ok-block): no toast over the sheet
      if (e.params.entry) markReconquest(e.params.entry, 'launched', true);
    } catch (err) {
      S.gmailBusy = false;
      if (S.dead) return;
      S.gmailError = err;
      sfx('error');
    }
    setBusy(btn, false);
    drawScribe(S, e, S.gmail ? (S.gmail.viewUrl ? 'open-draft' : 'done') : 'gmail');
  }

  function copyDraft(S, e) {
    var text = (S.subject ? S.subject + '\n\n' : '') + S.body;
    function ok() { toast(COPY.toast.copied, { icon: 'scroll' }); }
    function fallback() {
      S.copyFallback = true;
      drawScribe(S, e);
      var ta = S.copyArea;
      if (ta) { ta.focus(); ta.select(); try { ta.setSelectionRange(0, ta.value.length); } catch (x) { /* */ } }
      toast(COPY.toast.copyFallback, { icon: 'scroll' });
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') navigator.clipboard.writeText(text).then(ok, fallback);
      else fallback();
    } catch (err) { fallback(); }
  }

  // ===========================================================================
  // Writes: spinner → await DATA → effect + SFX + toast → reload → rebuild
  // ===========================================================================
  async function doWrite(kind, m, opts) {
    opts = opts || {};
    if (U.writing || !m) return false;
    U.writing = true;
    var btn = opts.btn;
    var orders = $('rb-orders');
    var fromOrders = !!(btn && orders.contains(btn));
    var orderIndex = -1;
    if (fromOrders) { var li = btn.closest('li'); orderIndex = Array.prototype.indexOf.call(orders.children, li); }
    setBusy(btn, true);
    if (opts.errSlot) clear(opts.errSlot);
    if (opts.entry) opts.entry.params.writeError = null;
    var day = todayDay();
    var target = kind === 'postponed' ? addDays(day, opts.days || 2) : null;
    try {
      if (kind === 'postponed') await window.DATA.rescheduleTask(m.id, target);
      else await window.DATA.completeTask(m.id);
    } catch (err) {
      U.writing = false;
      setBusy(btn, false);
      sfx('error');
      var c = errCopy(err);
      if (opts.entry) opts.entry.params.writeError = { id: m.id, err: err };
      if (opts.errSlot) showError(opts.errSlot, err, { inline: true, icon: 'goblin1' });
      else if (!c.silent) toast((c.title ? c.title + '. ' : '') + c.text, c.action === 'permissions' ? { error: true, icon: 'shield', action: { label: COPY.errors.permissions, run: function (b) { openPermissions(b); } } } : { error: true, icon: 'goblin1' });
      // HubSpot may have applied the write anyway (timeout, 5xx): re-read so the board shows the truth.
      if (c.ambiguous) reload();
      return false;
    }
    try { U.state = window.LOGIC.recordAction(U.state, { type: kind, id: String(m.id), day: day, at: new Date().toISOString() }); } catch (e) { /* keep state */ }
    persist();
    // Nothing but this missive under the modal: close it now so the village effect is visible.
    if (opts.after === popAfterWrite && P.stack.length && P.stack.every(function (x) { return /^(missive|scribe)$/.test(x.name); })) {
      setBusy(btn, false);
      closePanel();
      opts.after = null;
    }
    var goblin = m.tier > 0;
    var fx;
    if (kind === 'sent') {
      sfx('pigeon');
      fx = play('missiveSent', goblin ? { goblinId: String(m.id) } : {});
      var xp = 20 + (m.dueDay && m.dueDay >= day ? 10 : 0);
      var tt = toast(goblin ? COPY.toast.sentGoblin : COPY.toast.sent(xp), { icon: 'pigeon', action: { label: COPY.toast.undo, run: function (b) { undoSent(m, b); } } });
      // The clicked button is gone: put the keyboard on « Annuler » so the 8 s undo is reachable.
      var ae = document.activeElement;
      if (fromOrders || !ae || ae === document.body || ae === btn) tt.focusAction();
    } else if (kind === 'slain') {
      sfx('sword');
      fx = goblin ? play('goblinSlain', { id: String(m.id) }) : Promise.resolve();
      toast(goblin ? COPY.toast.slain : COPY.toast.slainPlain, { icon: 'sword' });
    } else {
      sfx('page');
      fx = goblin ? play('goblinRetreat', { id: String(m.id) }) : Promise.resolve();
      toast(COPY.toast.postponed(target, goblin), { icon: 'hourglass' });
    }
    await Promise.all([cap(fx, 1800), reload()]);
    U.writing = false;
    setBusy(btn, false);
    if (typeof opts.after === 'function') opts.after();
    // Quick action without a toast to land on: keep the keyboard in « Ordres du jour » (next order, else the title).
    var a2 = document.activeElement;
    if (fromOrders && !dialogs.length && (!a2 || a2 === document.body || !a2.isConnected)) {
      var items = orders.querySelectorAll('.order-main');
      var next = items[Math.min(Math.max(0, orderIndex), items.length - 1)];
      (next || $('rb-orders-title')).focus();
    }
    return true;
  }

  async function undoSent(m, btn) {
    setBusy(btn, true);
    try {
      await window.DATA.reopenTask(m.id);
    } catch (err) {
      setBusy(btn, false);
      var c = errCopy(err);
      toast((c.title ? c.title + '. ' : '') + c.text, { error: true, icon: 'goblin1' });
      return;
    }
    var wasWon = !!(U.state && U.state.siege && U.state.siege.completedAt);
    try { U.state = window.LOGIC.recordAction(U.state, { type: 'undo', id: String(m.id), day: todayDay() }); } catch (e) { /* SPEC-only logic: nothing to undo in state */ }
    if (wasWon && !(U.state.siege && U.state.siege.completedAt)) CQ.queue = CQ.queue.filter(function (ev) { return ev.type !== 'siege'; });
    persist();
    sfx('page');
    toast(COPY.toast.undone, { icon: 'pigeon' });
    reload();
  }

  // ===========================================================================
  // Toasts
  // ===========================================================================
  function toast(text, opts) {
    opts = opts || {};
    var wrap = $('rb-toasts');
    var el = h('div', { class: 'toast pbox' + (opts.error ? ' toast--error' : '') });
    if (opts.icon) el.appendChild(icon(opts.icon, 24));
    el.appendChild(h('span', { class: 'toast-text', text: text }));
    var dur = opts.action ? 8000 : opts.error ? 7000 : 4200;
    var timer = null, remaining = dur, started = 0, paused = false, bar = null, actionBtn = null;
    function run() { started = Date.now(); clearTimeout(timer); timer = setTimeout(dismiss, remaining); if (bar) bar.style.animationPlayState = 'running'; }
    // The countdown stops while the pointer or the keyboard is on the toast (WCAG 2.2.1), and resumes after.
    function pause() {
      if (paused || !el.isConnected) return;
      paused = true; clearTimeout(timer);
      remaining = Math.max(1500, remaining - (Date.now() - started));
      if (bar) bar.style.animationPlayState = 'paused';
    }
    function resume() { if (!paused || !el.isConnected) return; paused = false; run(); }
    function dismiss() {
      clearTimeout(timer);
      if (!el.isConnected) return;
      var hadFocus = el.contains(document.activeElement);
      el.classList.add('is-leaving');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        if (hadFocus) restoreFocus($('rb-orders-title'));
      }, reducedMotion() ? 0 : 200);
    }
    if (opts.action) {
      actionBtn = h('button', {
        type: 'button', class: 'wbtn wbtn--parch wbtn--sm',
        onclick: function (ev) { var b = ev.currentTarget; clearTimeout(timer); paused = true; opts.action.run(b); setTimeout(dismiss, 400); }
      }, h('span', { text: opts.action.label }));
      el.appendChild(actionBtn);
      bar = h('span', { class: 'toast-timer', 'aria-hidden': 'true' });
      bar.style.animationDuration = dur + 'ms';
      el.appendChild(bar);
    }
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', function () { if (!el.contains(document.activeElement)) resume(); });
    el.addEventListener('focusin', pause);
    el.addEventListener('focusout', function (ev) { if (!el.contains(ev.relatedTarget) && !el.matches(':hover')) resume(); });
    el.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' || ev.key === 'Esc') { ev.preventDefault(); ev.stopPropagation(); dismiss(); }
    });
    wrap.appendChild(el);
    while (wrap.children.length > 3) wrap.removeChild(wrap.firstChild);
    run();
    return {
      dismiss: dismiss,
      focusAction: function () { if (actionBtn && actionBtn.isConnected) actionBtn.focus(); }
    };
  }

  // ===========================================================================
  // Celebrations (won / lost / level-up / siege lifted / first-visit intro)
  // ===========================================================================
  var CQ = { queue: [], showing: null };
  function celebrate(list) {
    CQ.queue = CQ.queue.concat(list || []);
    renderSiegeBanner();
    nextCelebration();
  }
  function nextCelebration() {
    if (CQ.showing) return;
    var ev = CQ.queue.shift();
    if (!ev) { renderSiegeBanner(); return; }
    CQ.showing = ev;
    var fx = celebrationEffect(ev);
    var delay = reducedMotion() ? 0 : ev.type === 'intro' ? 0 : 900;
    cap(fx, delay).then(function () {
      if (CQ.showing !== ev) return;
      renderCelebration(ev);
      pushDialog($('rb-celebrate'), $('rb-cel'));
      $('rb-cel-ok').focus();
    });
  }
  function closeCelebration() {
    var ev = CQ.showing;
    if (!ev) return;
    CQ.showing = null;
    popDialog($('rb-celebrate'));
    if (ev.type === 'intro' && U.state) {
      U.state = Object.assign({}, U.state, { seenIntro: true });
      persist();
    }
    nextCelebration();
  }
  function celebrationEffect(ev) {
    var id = ev.deal && ev.deal.id != null ? String(ev.deal.id) : undefined;
    if (ev.type === 'won') { sfx('fanfare'); setTimeout(function () { sfx('coin'); }, 450); return play('questWon', { id: id }).then(function () { return play('coinBurst', {}); }); }
    if (ev.type === 'lost') { sfx('page'); return play('questLost', { id: id }); }
    if (ev.type === 'level') { sfx('levelup'); return play('levelUp', {}); }
    if (ev.type === 'siege') { sfx('fanfare'); return play('siegeLifted', {}); }
    sfx('page');
    return Promise.resolve();
  }
  function renderCelebration(ev) {
    var box = $('rb-cel'), text = $('rb-cel-text'), big = $('rb-cel-big');
    clear(text);
    big.hidden = true;
    big.removeAttribute('aria-label');
    box.classList.toggle('rb-cel--lost', ev.type === 'lost');
    var ok = COPY.cel.ok, iconName = 'star', title = '';
    function line(t, strong) { text.appendChild(h('p', { class: strong ? 'strong' : null, text: t })); }
    if (ev.type === 'won') {
      var amount = ev.amount != null ? ev.amount : (ev.deal && ev.deal.amount) || 0;
      title = COPY.cel.wonTitle; iconName = 'coin';
      big.hidden = false; big.textContent = '+' + money(amount);
      big.setAttribute('aria-label', COPY.cel.won(amount));
      if (ev.deal && ev.deal.name) { line(clientOf(ev.deal.name), true); if (restOf(ev.deal.name)) line(restOf(ev.deal.name)); }
      if (U.model && U.model.season) line(COPY.cel.wonSeason(U.model.season.gold, U.model.season.goal));
    } else if (ev.type === 'lost') {
      var d = ev.deal || {};
      var lostDay = ev.lostDay || (d.closeDate ? parisDay(new Date(d.closeDate)) : todayDay());
      var rqDays = (window.LOGIC && window.LOGIC.CONFIG && window.LOGIC.CONFIG.reconquestDays) || 120;
      var rq = ev.reconquestDay || addDays(lostDay, rqDays);
      var reason = ev.reason || d.lostReason;
      title = COPY.cel.lostTitle; iconName = 'book';
      if (d.name) line(d.name, true);
      line(reason ? COPY.cel.lostReason(reason) : COPY.cel.lostNoReason);
      line(COPY.cel.lostReconquest(rq));
      line(COPY.cel.lostLine, true);
    } else if (ev.type === 'level') {
      title = COPY.cel.levelTitle; iconName = 'crown';
      big.hidden = false; big.textContent = COPY.cel.level(ev.level);
      line(ev.title && ev.title !== ev.prevTitle ? COPY.cel.levelTitleNew(ev.title) : COPY.cel.levelSame(ev.title || titleFor(ev.level)), true);
    } else if (ev.type === 'siege') {
      title = COPY.cel.siegeTitle; iconName = 'shield';
      line(COPY.cel.siege, true);
      line(COPY.cel.siegeXp);
    } else {
      title = COPY.cel.introTitle; iconName = 'castle'; ok = COPY.cel.introOk;
      COPY.cel.intro.forEach(function (t) { line(t); });
    }
    $('rb-cel-title').textContent = title;
    paintIcon($('rb-cel-icon'), iconName);
    $('rb-cel-ok').textContent = ok;
  }

  // ===========================================================================
  // Scene wiring
  // ===========================================================================
  function onSceneSelect(t) {
    if (!t || !U.model || dialogs.length) return;
    sfx('click');
    switch (t.kind) {
      case 'castle': case 'hero': openPanel('hero'); break;
      case 'board': openPanel('board', { tab: 'today' }); break;
      case 'dovecote': openPanel('board', { tab: (U.model.missives.today || []).length ? 'today' : 'goblins' }); break;
      case 'treasure': openPanel('treasure'); break;
      case 'chronicle': openPanel('chronicle'); break;
      case 'quest': openPanel(t.id != null && findQuest(t.id) ? 'quest' : 'quests', { id: t.id }); break;
      case 'goblin': if (t.id != null && findMissive(t.id)) openPanel('missive', { id: t.id }); else openPanel('board', { tab: 'goblins' }); break;
      case 'camp_more': openPanel('quests'); break;
      default: break;
    }
  }
  function onSceneHover(t) {
    var cap = $('rb-caption');
    var text = t ? hoverText(t) : '';
    cap.textContent = text;
    cap.hidden = !text;
  }
  function hoverText(t) {
    var m = U.model;
    switch (t.kind) {
      case 'castle': return 'Château · Héros';
      case 'hero': return (m && m.hero ? m.hero.name : 'Sire Julian') + ' · Héros';
      case 'board': return 'Tableau de la taverne' + (m ? ' · ' + pl((m.missives.today || []).length, 'missive du jour', 'missives du jour') : '');
      case 'dovecote': return 'Pigeonnier' + (m ? ' · ' + toDoCount(m) + ' à envoyer' : '');
      case 'treasure': return 'Coffre au trésor' + (m ? ' · ' + money(m.season.gold) : '');
      case 'chronicle': return 'Livre des Défaites' + (m && (m.reconquestsDue || []).length ? ' · ' + pl(m.reconquestsDue.length, 'reconquête due', 'reconquêtes dues') : '');
      case 'quest': { var q = findQuest(t.id); return q ? (q.client || clientOf(q.name)) + ' · ' + chapterLabel(q) + (q.cold ? ' · refroidie' : '') : 'Quête'; }
      case 'goblin': { var g = findMissive(t.id); return g ? COPY.tiers[g.tier || 1] + ' · ' + excerpt(g.subject, 48) + ' (' + g.daysOverdue + ' j)' : 'Gobelin'; }
      case 'camp_more': return 'Le camp · toutes les quêtes';
      default: return '';
    }
  }

  // ===========================================================================
  // Static wiring, keyboard, sound, clock
  // ===========================================================================
  function applyMuted() {
    var muted = !!(U.state && U.state.muted);
    try { if (window.SFX) window.SFX.setMuted(muted); } catch (e) { /* */ }
    ['rb-sound', 'rb-strip-sound'].forEach(function (id) {
      var b = $(id); if (!b) return;
      b.setAttribute('aria-pressed', String(!muted));
      b.setAttribute('aria-label', COPY.sound.label);
      b.title = muted ? COPY.sound.off : COPY.sound.on;
      paintIcon(b.querySelector('.ico'), muted ? 'sound_off' : 'sound_on');
    });
  }
  function toggleMute() {
    if (!U.state) return;
    U.state = Object.assign({}, U.state, { muted: !U.state.muted });
    applyMuted();
    persist();
    if (!U.state.muted) sfx('click');
  }

  function unlockAudio() {
    try { if (window.SFX) window.SFX.unlock(); } catch (e) { /* */ }
    window.removeEventListener('pointerdown', unlockAudio, true);
    window.removeEventListener('keydown', unlockAudio, true);
  }

  function wireStatic() {
    window.addEventListener('pointerdown', unlockAudio, true);
    window.addEventListener('keydown', unlockAudio, true);
    document.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest('[data-open]') : null;
      if (t && !t.closest('[inert]')) openPanel(t.getAttribute('data-open'));
    });
    $('rb-sound').addEventListener('click', toggleMute);
    $('rb-strip-sound').addEventListener('click', toggleMute);
    $('rb-refresh').addEventListener('click', function () { if (U.booted) reload({ observe: true, manual: true }); });
    $('rb-strip-refresh').addEventListener('click', function () { if (U.booted) reload({ observe: true, manual: true }); });
    $('rb-close').addEventListener('click', closePanel);
    $('rb-back').addEventListener('click', backPanel);
    $('rb-modal').addEventListener('click', function (ev) { if (ev.target && ev.target.getAttribute('data-dismiss') === 'modal') closePanel(); });
    $('rb-cel-ok').addEventListener('click', closeCelebration);
    $('rb-siege-go').addEventListener('click', function () { openPanel('siege'); });
    $('rb-siege-later').addEventListener('click', function () { U.siegeLater = true; renderSiegeBanner(); restoreFocus($('rb-orders-title')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (dialogs.length) { e.preventDefault(); closeTopDialog(); }
        return;
      }
      if (e.key === 'Tab' && dialogs.length) { trapTab(e); return; }
      if (dialogs.length || e.ctrlKey || e.metaKey || e.altKey || e.repeat || isTyping(e.target) || !U.model) return;
      var k = String(e.key || '').toLowerCase();
      if (k === 't') { e.preventDefault(); openPanel('board'); }
      else if (k === 'q') { e.preventDefault(); openPanel('quests'); }
      else if (k === 'h') { e.preventDefault(); openPanel('hero'); }
    });
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (U.scene) { try { U.scene.resize(); } catch (e) { /* */ } } }, 120);
    });
  }

  function tick() {
    var now = new Date();
    renderClock(now);
    if (U.model && U.booted && parisDay(now) !== U.model.today) {
      rebuild(now, []);           // the day moves at once (yesterday's in-game actions still hide stale reads)
      reload({ observe: true });  // then fresh HubSpot data: tasks done or created overnight, deals closed
    }
  }
  function startClock() {
    var ms = 60000 - (Date.now() % 60000) + 40;
    setTimeout(function () { tick(); setInterval(tick, 60000); }, ms);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  }

  // ===========================================================================
  // Boot: scene first, then DATA.init → loadState → loadAll → observe → model → siege → render → save → celebrations
  // ===========================================================================
  async function boot() {
    if (U.booting) return;
    U.booting = true;
    var root = $('rb');
    if (!root) return;
    paintStaticIcons(root);
    $('rb-loading-text').textContent = COPY.loading;
    $('rb-ribbon-text').textContent = COPY.demo;
    wireStatic();
    var now = new Date();
    renderClock(now);
    try {
      if (window.ART && typeof window.ART.createScene === 'function') {
        U.scene = window.ART.createScene($('rb-canvas'), { onSelect: onSceneSelect, onHover: onSceneHover });
        U.scene.setTimeOfDay(parisHour(now));
      }
    } catch (e) { U.scene = null; }
    startClock();
    if (!window.DATA || !window.LOGIC) { $('rb-loading').hidden = true; return; }

    var info = null;
    try { info = await window.DATA.init(); } catch (e) { info = null; }
    U.info = info || { mode: 'demo', can: {} };
    $('rb-ribbon').hidden = U.info.mode !== 'demo';

    var st = null;
    try { st = await window.DATA.loadState(); } catch (e) { st = null; }
    if (!st) { try { st = window.LOGIC.emptyState(); } catch (e) { st = { v: 1, lastSeen: null, perfectDays: [], actions: {}, todayDoneIds: { day: null, ids: [] }, abattus: [], siege: { startedAt: null, initialCount: 0, completedAt: null }, reconquests: {}, muted: false, seenIntro: false }; } }
    U.state = st;
    try { U.savedJson = JSON.stringify(st); } catch (e) { U.savedJson = null; }
    applyMuted();

    await reload({ observe: true });
    $('rb-loading').hidden = true;
    U.booted = true;
    var evs = [];
    if (U.state && !U.state.seenIntro) evs.push({ type: 'intro' });
    evs = evs.concat(U.pendingEvents);
    U.pendingEvents = [];
    if (evs.length) celebrate(evs); else renderSiegeBanner();
  }

  // Debug / test surface (namespaced).
  window.UI = {
    COPY: COPY,
    open: function (name, params) { openPanel(name, params); },
    close: closePanel,
    toast: toast,
    reload: function () { return reload({ observe: true, manual: true }); },
    celebrate: function (list) { celebrate(list); },
    get model() { return U.model; },
    get state() { return U.state; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
