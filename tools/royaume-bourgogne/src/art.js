/* Royaume de Bourgogne — art.js
   Original pixel art drawn in code (no assets), the village scene, UI icons and synthesized SFX.
   Exposes window.ART and window.SFX (see SPEC section 4). Plain JS, no dependencies. */
(function () {
  'use strict';

  var TILE = 16, W = 480, H = 288;
  var ART = window.ART = {};
  var SFX = window.SFX = {};
  ART.TILE = TILE; ART.W = W; ART.H = H;

  /* =====================================================================
     1. Utilities
     ===================================================================== */
  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  function g2(c) { var x = c.getContext('2d'); x.imageSmoothingEnabled = false; return x; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  var _rgb = {};
  function rgb(hex) {
    var r = _rgb[hex]; if (r) return r;
    var h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    r = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    _rgb[hex] = r; return r;
  }
  function hx(r, g, b) {
    function p(v) { v = clamp(Math.round(v), 0, 255).toString(16); return v.length < 2 ? '0' + v : v; }
    return '#' + p(r) + p(g) + p(b);
  }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hx(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
  function desat(c, amt) {
    var A = rgb(c), l = A[0] * 0.3 + A[1] * 0.55 + A[2] * 0.15;
    return hx(lerp(A[0], l * 0.96, amt), lerp(A[1], l * 0.99, amt), lerp(A[2], l * 1.06, amt));
  }
  function rgba(c, a) { var A = rgb(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  function hashStr(s) {
    s = String(s); var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return h >>> 0;
  }
  function h2(x, y, s) {
    var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 7, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y, sc, s) {
    var gx = x / sc, gy = y / sc, x0 = Math.floor(gx), y0 = Math.floor(gy);
    var fx = gx - x0, fy = gy - y0; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = h2(x0, y0, s), b = h2(x0 + 1, y0, s), c = h2(x0, y0 + 1, s), d = h2(x0 + 1, y0 + 1, s);
    var top = a + (b - a) * fx, bot = c + (d - c) * fx;
    return top + (bot - top) * fy;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bay(x, y) { return (BAYER[((y & 3) << 2) + (x & 3)] + 0.5) / 16; }

  function R(c, x, y, w, h, col) { if (w <= 0 || h <= 0) return; c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function P(c, x, y, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function ellipse(c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    var y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (var y = y0; y < y1; y++) {
      var dy = (y + 0.5 - cy) / ry; if (dy * dy > 1) continue;
      var hw = rx * Math.sqrt(1 - dy * dy), xa = Math.round(cx - hw), xb = Math.round(cx + hw);
      if (xb > xa) c.fillRect(xa, y, xb - xa, 1);
    }
  }
  function shadow(c, cx, cy, rx, ry, a) {
    a = a == null ? 0.26 : a;
    ellipse(c, cx, cy, rx, ry, 'rgba(38,22,10,' + (a * 0.55).toFixed(3) + ')');
    ellipse(c, cx, cy, rx * 0.74, ry * 0.72, 'rgba(38,22,10,' + (a * 0.6).toFixed(3) + ')');
  }
  /* paint a shape defined by an inside(x,y) predicate (pixel coords), with outline */
  function paintShape(c, x0, y0, x1, y1, inside, color, outline) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1);
    for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++) {
      if (!inside(x, y)) continue;
      var col;
      if (outline && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1))) col = outline;
      else col = color(x, y);
      if (col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
    }
  }

  /* =====================================================================
     2. Palette
     ===================================================================== */
  var OUT = '#3b1f0b';
  var C = {
    out: OUT, out2: '#4f2c12',
    g0: '#2f5f22', g1: '#3E7A2C', g2: '#4c8c31', g3: '#5A9E3A', g4: '#68ac43', g5: '#78B84A', g6: '#9ccf5e', g7: '#c2e07e',
    p0: '#6e5232', p1: '#A88550', p2: '#C9A66B', p3: '#e0c48e', p4: '#bd9a60', p5: '#d4b47c',
    w0: '#5B2E0F', w1: '#8A4B22', w2: '#B5652B', w3: '#d68a45', w4: '#e9ad6a',
    s0: '#46403a', s1: '#5E574D', s2: '#8C8478', s3: '#B0A898', s4: '#d2cbbd', s5: '#e8e2d4',
    r0: '#5e1d14', r1: '#8E2E1E', r2: '#B3402A', r3: '#d4613f', r4: '#ea8a5e',
    sl0: '#232c52', sl1: '#2f3f72', sl2: '#41599a', sl3: '#5d7cc0', sl4: '#90ade6',
    b0: '#2d5f8f', b1: '#4A8FC7', b2: '#7cb6e0', b3: '#b5dcf2',
    y0: '#a8691a', y1: '#D99A1E', y2: '#F2C14E', y3: '#fbe58e', y4: '#fff6c8',
    h0: '#8f1f24', h1: '#D93A3A', h2: '#f06e5e',
    pa0: '#c99a52', pa1: '#E8B86D', pa2: '#F7D9A1', pa3: '#fff0c8',
    pl0: '#b8a47c', pl1: '#d9c79a', pl2: '#eadcb4', pl3: '#f8efd6',
    m0: '#3f4654', m1: '#6b7487', m2: '#a3acbd', m3: '#e3e8f0',
    glass: '#2b2f4a', glass2: '#46507e', lit: '#ffd56b', lit2: '#fff3b8'
  };
  var CH_RAMPS = [ // tent / banner colors by chapter: [dark, base, light]
    ['#5e5a56', '#8a8580', '#b9b4ad'],
    ['#2b4a8c', '#3f68b8', '#76a0e6'],
    ['#2a6a34', '#3f9a4a', '#72c878'],
    ['#4f2d73', '#7346a3', '#a07ad2'],
    ['#a86f0e', '#e0a526', '#f8d870']
  ];
  var STONE_FACE = { tones: ['#9a9284', '#a39b8c', '#928a7d', '#a8a091'], hi: '#c4bcac', sh: '#7a7266', mortar: '#5E574D', bh: 4, minW: 5, maxW: 9 };
  var STONE_LIGHT = { tones: ['#b8b0a0', '#c2baa9', '#b1a999', '#bdb5a5'], hi: '#ddd6c6', sh: '#958d80', mortar: '#6f675b', bh: 4, minW: 5, maxW: 9 };

  /* =====================================================================
     3. Sprite helpers
     ===================================================================== */
  function addOutline(src, col) {
    var w = src.width, h = src.height, c = mk(w + 2, h + 2), x = g2(c);
    x.drawImage(src, 1, 1);
    var img = x.getImageData(0, 0, w + 2, h + 2), d = img.data, cw = w + 2, ch = h + 2;
    var a = new Uint8Array(cw * ch), i;
    for (i = 0; i < cw * ch; i++) a[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    var oc = rgb(col || OUT);
    for (i = 0; i < cw * ch; i++) {
      if (a[i]) continue;
      var px = i % cw, py = (i / cw) | 0;
      if ((px > 0 && a[i - 1]) || (px < cw - 1 && a[i + 1]) || (py > 0 && a[i - cw]) || (py < ch - 1 && a[i + cw])) {
        d[i * 4] = oc[0]; d[i * 4 + 1] = oc[1]; d[i * 4 + 2] = oc[2]; d[i * 4 + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  function fromMap(rows, pal, outline) {
    var h = rows.length, w = 0, i;
    for (i = 0; i < h; i++) w = Math.max(w, rows[i].length);
    var c = mk(w, h), x = g2(c), img = x.createImageData(w, h), d = img.data;
    for (var yy = 0; yy < h; yy++) {
      var row = rows[yy];
      for (var xx = 0; xx < row.length; xx++) {
        var k = row.charAt(xx); if (k === '.' || k === ' ') continue;
        var col = pal[k]; if (!col) continue;
        var q = rgb(col), p = (yy * w + xx) * 4;
        d[p] = q[0]; d[p + 1] = q[1]; d[p + 2] = q[2]; d[p + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return outline === false ? c : addOutline(c, typeof outline === 'string' ? outline : OUT);
  }
  function flipX(src) { var c = mk(src.width, src.height), x = g2(c); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; }
  function silhouette(src, col) { var c = mk(src.width, src.height), x = g2(c); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
  function ring(src, col) { // 1px outline ring around a sprite's silhouette (for hover/highlight)
    var s = silhouette(src, col), c = mk(src.width + 2, src.height + 2), x = g2(c);
    x.drawImage(s, 0, 1); x.drawImage(s, 2, 1); x.drawImage(s, 1, 0); x.drawImage(s, 1, 2);
    x.globalCompositeOperation = 'destination-out'; x.drawImage(src, 1, 1);
    return c;
  }
  function recolor(src, map) {
    var c = mk(src.width, src.height), x = g2(c); x.drawImage(src, 0, 0);
    var img = x.getImageData(0, 0, c.width, c.height), d = img.data, keys = Object.keys(map), from = keys.map(rgb), to = keys.map(function (k) { return rgb(map[k]); });
    for (var i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      for (var k = 0; k < from.length; k++) if (d[i] === from[k][0] && d[i + 1] === from[k][1] && d[i + 2] === from[k][2]) { d[i] = to[k][0]; d[i + 1] = to[k][1]; d[i + 2] = to[k][2]; break; }
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  function desatCanvas(src, amt) {
    var c = mk(src.width, src.height), x = g2(c); x.drawImage(src, 0, 0);
    var img = x.getImageData(0, 0, c.width, c.height), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var l = d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15;
      d[i] = lerp(d[i], l * 0.95, amt); d[i + 1] = lerp(d[i + 1], l, amt); d[i + 2] = lerp(d[i + 2], l * 1.08, amt);
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  /* tiny 3x5 pixel font (digits, +, x) */
  var FONT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['110', '010', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '011', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'], '+': ['000', '010', '111', '010', '000'], 'x': ['000', '101', '010', '101', '000']
  };
  function textW(s) { return s.length * 4 - 1; }
  function drawText(c, s, x, y, col) {
    c.fillStyle = col;
    for (var i = 0; i < s.length; i++) {
      var g = FONT[s.charAt(i)]; if (!g) continue;
      for (var r = 0; r < 5; r++) for (var q = 0; q < 3; q++) if (g[r].charAt(q) === '1') c.fillRect(Math.round(x) + i * 4 + q, Math.round(y) + r, 1, 1);
    }
  }

  /* =====================================================================
     4. Character sprites (authored as fills; outline added automatically)
     ===================================================================== */
  var HERO_PAL = { o: OUT, L: '#f6876c', R: '#d93a3a', r: '#9c2328', H: '#f2f5fa', M: '#b4bdcc', m: '#7a849c', n: '#535b70', S: '#f7c9a0', s: '#e2a57e', E: '#2a1608', p: '#f2948a', B: '#4a74c4', b: '#2f4f94', G: '#f2c14e', g: '#c98d1e', k: '#7a4220', K: '#4a2a14', W: '#f2f5fa', w: '#9aa3b5' };
  var HERO_TOP = [
    '.........LLr..',
    '........LRRr..',
    '.......RRr....',
    '....HMMRrm....',
    '...HMMMMMMm...',
    '..HMMMMMMMMm..',
    '..Moooooooom..',
    '..MoSSSSSSom..',
    '..MoSESSESom..',
    '..moSpSSpSom..',
    '...mmmmmmmm...',
    '..HMBBBBBBMm..',
    '.HMoBBGGBBoMm.',
    '.MmoBGGGGBomm.',
    '.MmobBGGBbomm.',
    '.SsobBGGBbosS.',
    '...kkkGGkkkgGg',
    '...bBBBBBBb.W.',
    '...bBbBBbBb.W.'
  ];
  var HERO_LEGS = {
    idle: ['....Mm..Mm..W.', '....Mm..Mm..W.', '...KKk..KKk.w.'],
    a: ['....Mm..Mm..W.', '...KKk..Mm..W.', '........KKk.w.'],
    c: ['....Mm..Mm..W.', '....Mm..KKk.W.', '...KKk......w.']
  };
  var GOB_PAL = [null,
    { o: OUT, L: '#d6ec8a', G: '#a6cf4e', g: '#759a2e', d: '#4f6e1e', Y: '#ffe45c', W: '#f6ecd2', m: '#5b1d12', k: '#8A4B22', j: '#b5652b', K: '#5B2E0F', H: '#e3e8f0', M: '#a3acbd', n: '#5f6879' },
    { o: OUT, L: '#c9e07a', G: '#97be44', g: '#698c2a', d: '#47641c', Y: '#ffd84a', W: '#f6ecd2', m: '#5b1d12', k: '#7a4a26', j: '#a36a3a', K: '#4f2c12', H: '#eef2f8', M: '#a3acbd', n: '#5f6879' },
    { o: OUT, L: '#a3a860', G: '#7b8340', g: '#56602c', d: '#3a421c', Y: '#ffb02e', W: '#f6ecd2', m: '#4a120c', C: '#f2c14e', c: '#c98d1e', r: '#d93a3a', R: '#a3302a', F: '#efe4cc', f: '#bfae90', v: '#5a3218', V: '#7d4a26', b: '#3a2010', w: '#b5703a', k: '#7a4220', K: '#4a2a14', H: '#d8dde6' }
  ];
  var GOB_MAP = [null, [
    '..............',
    '..............',
    '.....LGGg.....',
    '....LGGGGg....',
    'L..LGGGGGGg..g',
    'LGGGYoGGoYGggg',
    '.gGGGGGGGGGgg.',
    '...GmWmmWmg...',
    '....gGGGGg..H.',
    '..GgkkjjkkgGH.',
    '..GgkkkkkkgGn.',
    '..LG.KKKK.GL..',
    '....GG..GG....',
    '...gg....gg...'
  ], [
    '.............H',
    '.....nMMn....H',
    '....nMHHMn...k',
    '...nMMMMMMn..k',
    'L.nnnnnnnnnn.k',
    'LGGGYoGGoYGggk',
    '.gGGGGGGGGGg.k',
    '...GmWmmWmg..k',
    '....gGGGGg...k',
    '..MnkkjjkknMGk',
    '..GgkMMMMkgGGk',
    '..LG.KKKK.G..k',
    '....GG..GG...k',
    '...gg....gg..k'
  ], [
    '......C.CC.C......',
    '......CCrrCC......',
    '.....cCCCCCCc..ww.',
    '....LGGGGGGGGgwwHw',
    '.L..GddGGGGddGwwww',
    '.LGGGYoGGGGoYGgHww',
    '..gGGGGGGGGGGg.kk.',
    '....GmWmmmmWmG.k..',
    '....gGGGGGGGGg.k..',
    '...RFfFfFfFfFfRk..',
    '..RGGvVVVVVvGGLk..',
    '..RLGvbbCCbbvGLk..',
    '..R..vVVVVVVv..k..',
    '..R..vVvVVvVv..k..',
    '.....GG....GG..k..',
    '....ggg....ggg.K..'
  ]];
  var PIGEON_PAL = { W: '#e4e6ee', w: '#b4b8c6', g: '#8b91a3', n: '#6aa58f', b: '#e3a04a', e: '#2a1608', f: '#d0573c' };
  var PIGEON_MAPS = {
    sit: ['.WW....', 'beW....', '.nWWWw.', '..WWggg', '...f.f.'],
    peck: ['.......', '...WWw.', '.nWWggg', 'beWw...', '...f.f.'],
    flap: ['...gg..', '.WW.gg.', 'beWWWg.', '.nWWggg', '...f.f.'],
    fly1: ['...gg....', '....gg...', '.WW.gWg..', 'beWWWWWww', '..wWWWw..'],
    fly2: ['.........', '.WW......', 'beWWWWWww', '..wWgWw..', '...gg....', '..gg.....']
  };

  var SPR = null; // built lazily
  function buildSprites() {
    if (SPR) return SPR;
    SPR = {};
    // hero frames: idle (4) and walk (4), each 16x24
    function heroFrame(legs, bodyDy) {
      var rows = HERO_TOP.slice(), lg = HERO_LEGS[legs];
      var c0 = fromMap(rows.concat(lg), HERO_PAL, false);
      // compose with body bob: legs stay, upper body shifts by bodyDy
      var c = mk(14, 22 + 1), x = g2(c);
      x.drawImage(c0, 0, 19, 14, 3, 0, 20, 14, 3);
      x.drawImage(c0, 0, 0, 14, 19, 0, 1 + bodyDy, 14, 19);
      return addOutline(c);
    }
    SPR.heroIdle = [heroFrame('idle', 0), heroFrame('idle', 0), heroFrame('idle', 1), heroFrame('idle', 1)];
    SPR.heroWalk = [heroFrame('a', 0), heroFrame('idle', -1), heroFrame('c', 0), heroFrame('idle', -1)];
    SPR.heroIdleL = SPR.heroIdle.map(flipX); SPR.heroWalkL = SPR.heroWalk.map(flipX);
    SPR.heroWhite = silhouette(SPR.heroIdle[0], '#fff6c8');
    // goblins: frame 0 = stand, frame 1 = hop (arms up a bit: same sprite, drawn higher)
    SPR.gob = [null];
    for (var t = 1; t <= 3; t++) {
      var s = fromMap(GOB_MAP[t], GOB_PAL[t]);
      SPR.gob.push({ R: s, L: flipX(s), ringR: ring(s, '#fff3b0'), ringL: ring(flipX(s), '#fff3b0'), white: silhouette(s, '#ffffff'), whiteL: silhouette(flipX(s), '#ffffff') });
    }
    SPR.pigeon = {};
    Object.keys(PIGEON_MAPS).forEach(function (k) { var s = fromMap(PIGEON_MAPS[k], PIGEON_PAL); SPR.pigeon[k] = s; SPR.pigeon[k + 'R'] = flipX(s); });
    // torch flames (3 frames, 5x8)
    SPR.flame = [0, 1, 2].map(function (f) {
      var c = mk(5, 8), x = g2(c);
      var shapes = [
        ['..x..', '.xx..', '.xfx.', 'xxffx', 'xfFfx', 'xfFfx', '.xFx.', '..X..'],
        ['...x.', '..xx.', '.xfx.', '.xffx', 'xfFfx', 'xfFFx', '.xFx.', '..X..'],
        ['.x...', '.xx..', '.xfx.', 'xffx.', 'xfFfx', 'xFFfx', '.xFx.', '..X..']
      ][f];
      var pal = { x: '#ff8a2a', f: '#ffd25a', F: '#fff4c2', X: '#c9441c' };
      for (var yy = 0; yy < 8; yy++) for (var xx = 0; xx < 5; xx++) { var k = shapes[yy].charAt(xx); if (pal[k]) P(x, xx, yy, pal[k]); }
      return c;
    });
    // coins (spin frames, 5x5)
    SPR.coin = [5, 3, 1, 3].map(function (w, i) {
      var c = mk(5, 5), x = g2(c);
      var x0 = Math.floor((5 - w) / 2);
      R(x, x0, 1, w, 3, C.y2); R(x, x0 + (w > 1 ? 1 : 0), 0, Math.max(1, w - 2), 1, C.y2); R(x, x0 + (w > 1 ? 1 : 0), 4, Math.max(1, w - 2), 1, C.y1);
      if (w > 2) { P(x, x0, 1, C.y4); P(x, x0 + 1, 1, C.y3); R(x, x0 + w - 1, 2, 1, 2, C.y1); }
      if (i === 2) { R(x, 2, 0, 1, 5, C.y3); }
      return c;
    });
    SPR.glow = {};
    return SPR;
  }

  /* stepped pixel glow for the light layer */
  function glowSprite(r, col) {
    var key = r + col; if (SPR.glow[key]) return SPR.glow[key];
    var s = r * 2, c = mk(s, s), x = g2(c), A = rgb(col);
    var img = x.createImageData(s, s), d = img.data;
    for (var y = 0; y < s; y++) for (var xx = 0; xx < s; xx++) {
      var dx = (xx + 0.5 - r) / r, dy = (y + 0.5 - r) / r, dd = Math.sqrt(dx * dx + dy * dy);
      if (dd >= 1) continue;
      var a = Math.pow(1 - dd, 1.6) + (bay(xx, y) - 0.5) * 0.18;
      var q = a > 0.62 ? 1 : a > 0.38 ? 0.62 : a > 0.18 ? 0.36 : a > 0.05 ? 0.16 : 0;
      var p = (y * s + xx) * 4; d[p] = A[0]; d[p + 1] = A[1]; d[p + 2] = A[2]; d[p + 3] = Math.round(q * 255);
    }
    x.putImageData(img, 0, 0);
    SPR.glow[key] = c; return c;
  }

  /* =====================================================================
     5. Background: terrain
     ===================================================================== */
  var PATH_RECTS = [ // x0,y0,x1,y1,radius
    [230, 112, 250, 289, 3],
    [178, 122, 302, 172, 12],
    [106, 140, 126, 172, 4],
    [106, 160, 232, 172, 4],
    [248, 160, 386, 172, 4],
    [366, 136, 386, 172, 4],
    [306, 116, 336, 130, 5]
  ];
  function inRoundRect(x, y, r) {
    var x0 = r[0], y0 = r[1], x1 = r[2], y1 = r[3], rad = r[4];
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return -1;
    var cx = clamp(x + 0.5, x0 + rad, x1 - rad), cy = clamp(y + 0.5, y0 + rad, y1 - rad);
    var dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy);
    if (d > rad) return -1;
    var edge = Math.min(x + 0.5 - x0, x1 - x - 0.5, y + 0.5 - y0, y1 - y - 0.5, rad - d + 0.5);
    return edge;
  }
  function buildPathMask() {
    var m = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var best = -1;
      for (var i = 0; i < PATH_RECTS.length; i++) { var e = inRoundRect(x, y, PATH_RECTS[i]); if (e > best) best = e; }
      if (best < 0) continue;
      if (best < 1.5 && h2(x, y, 91) < 0.45) continue; // ragged edge
      m[y * W + x] = 1;
    }
    return m;
  }
  var DIRT_SPOTS = null;
  function dirtField(x, y) {
    if (y < 222) return 0;
    if (!DIRT_SPOTS) {
      DIRT_SPOTS = [];
      DIRT_SPOTS.push([LAYOUT.campfire.x, LAYOUT.campfire.y, 18, 10], [462, 248, 16, 9], [240, 232, 30, 10]);
    }
    var g = clamp(1 - (Math.abs(x + 0.5 - 240) - 16) / 12, 0, 1) * clamp((y - 224) / 8, 0, 1);
    for (var i = 0; i < DIRT_SPOTS.length; i++) {
      var d = DIRT_SPOTS[i], dx = (x + 0.5 - d[0]) / d[2], dy = (y + 0.5 - d[1]) / d[3], v = 1.25 - Math.sqrt(dx * dx + dy * dy) * 0.9;
      if (v > g) g = v;
    }
    return clamp(g, 0, 1);
  }
  function paintTerrain(c, pathM) {
    var img = c.createImageData(W, H), d = img.data;
    var GIN = ['#4f9034', '#5A9E3A', '#66a941', '#74b648'].map(rgb);
    var GOUT = ['#376f31', '#407c37', '#4a893d', '#569646'].map(rgb);
    var DIRT = ['#7d5f3a', '#916f46', '#a27e52', '#b48f60'].map(rgb);
    var COB = { mortar: rgb('#7a5d3a'), hi: rgb('#e6cc98'), a: rgb('#cdab70'), b: rgb('#c29f64'), c: rgb('#d4b67e'), sh: rgb('#a8854f'), edge: rgb('#6e5232') };
    // cobble rows
    var rows = {};
    function row(r) {
      if (rows[r]) return rows[r];
      var start = new Int16Array(W + 12), idx = new Int16Array(W), wv = [], st = [];
      var x = -Math.floor(h2(r, 3, 17) * 7), k = 0;
      while (x < W) { var w = 4 + Math.floor(h2(r, k, 23) * 4); st.push(x); wv.push(w); for (var q = Math.max(0, x); q < Math.min(W, x + w); q++) idx[q] = k; x += w; k++; }
      rows[r] = { st: st, w: wv, idx: idx }; return rows[r];
    }
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x, col, bz = bay(x, y);
        if (pathM[i]) {
          var r = Math.floor(y / 5), ly = y - r * 5, rw = row(r), k = rw.idx[x], lx = x - rw.st[k], sw = rw.w[k];
          if (!pathM[i - W] || !pathM[i - 1]) col = COB.edge;
          else if (ly === 4 || lx === 0) col = COB.mortar;
          else {
            var tv = h2(k, r, 33); col = tv < 0.33 ? COB.a : tv < 0.66 ? COB.b : COB.c;
            if ((lx === 1 || lx === sw - 1) && (ly === 0 || ly === 3)) col = COB.mortar;
            else if (ly === 0) col = COB.hi;
            else if (ly === 3 || lx === sw - 1) col = COB.sh;
            if (h2(k, r, 41) < 0.05) col = DIRT[1];
          }
        } else {
          var dv = dirtField(x, y) + (vnoise(x, y, 7, 7) - 0.5) * 0.5 + (bz - 0.5) * 0.16;
          if (dv > 0.5) {
            var n2 = vnoise(x, y, 7, 8) + (bz - 0.5) * 0.3;
            col = DIRT[n2 < 0.28 ? 0 : n2 < 0.55 ? 1 : n2 < 0.82 ? 2 : 3];
          } else {
            var inside = x >= 62 && x < 418 && y >= 48 && y < 206;
            var n = 0.62 * vnoise(x, y, 44, 1) + 0.38 * vnoise(x, y, 13, 2) + (bz - 0.5) * 0.09;
            var G = inside ? GIN : GOUT;
            col = G[n < 0.33 ? 0 : n < 0.6 ? 1 : n < 0.78 ? 2 : 3];
          }
        }
        var p = i * 4; d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
  }
  function grassTuft(c, x, y, wild) {
    P(c, x + 1, y, C.g6); P(c, x + 3, y, C.g6);
    P(c, x, y + 1, C.g1); P(c, x + 2, y + 1, wild ? C.g6 : C.g5); P(c, x + 4, y + 1, C.g1);
    R(c, x + 1, y + 2, 3, 1, C.g1);
  }
  var FLOWER_COLS = [['#f6f2e6', '#f2c14e'], ['#f7d84a', '#c98d1e'], ['#f29ac0', '#fff3b0'], ['#8fb6ea', '#fff3b0'], ['#e2574c', '#f7d84a']];
  function flower(c, x, y, k) {
    var fc = FLOWER_COLS[k % FLOWER_COLS.length];
    P(c, x, y + 2, C.g1); P(c, x + 1, y + 3, C.g1);
    P(c, x + 1, y, fc[0]); P(c, x, y + 1, fc[0]); P(c, x + 2, y + 1, fc[0]); P(c, x + 1, y + 2, fc[0]); P(c, x + 1, y + 1, fc[1]);
  }
  function decorateGrass(c, pathM, blocked) {
    for (var ty = 0; ty < 18; ty++) for (var tx = 0; tx < 30; tx++) {
      for (var n = 0; n < 2; n++) {
        var r = h2(tx, ty, 50 + n), px = tx * 16 + 2 + Math.floor(h2(tx, ty, 60 + n) * 11), py = ty * 16 + 2 + Math.floor(h2(tx, ty, 70 + n) * 11);
        var i = py * W + px;
        if (pathM[i] || pathM[i + 4] || pathM[i + W * 3] || dirtField(px, py) > 0.2 || blocked(px, py)) continue;
        var inside = px >= 62 && px < 418 && py >= 48 && py < 206;
        if (r < (inside ? 0.26 : 0.4)) grassTuft(c, px, py, !inside);
        else if (r < (inside ? 0.34 : 0.46)) { var k = Math.floor(h2(tx, ty, 80) * 5); flower(c, px, py, k); if (h2(tx, ty, 81) < 0.6) flower(c, px + 3, py + 2, k); }
        else if (r < 0.48 && !inside) { P(c, px, py, C.s3); P(c, px + 1, py, C.s2); P(c, px, py - 1, C.s4); }
      }
    }
    // pebbles on dirt
    for (var k2 = 0; k2 < 90; k2++) {
      var x = Math.floor(h2(k2, 1, 99) * W), y = 236 + Math.floor(h2(k2, 2, 99) * 50);
      if (dirtField(x, y) > 0.6 && !pathM[y * W + x]) { P(c, x, y, C.p2); P(c, x + 1, y, C.p0); }
    }
  }

  /* =====================================================================
     6. Background: structures
     ===================================================================== */
  function bricks(c, x, y, w, h, o, seed) {
    R(c, x, y, w, h, o.mortar);
    var rnd = rng(seed || 1), bh = o.bh || 4;
    for (var yy = 0; yy < h; yy += bh) {
      var xx = -Math.floor(rnd() * o.maxW);
      while (xx < w) {
        var bw = o.minW + Math.floor(rnd() * (o.maxW - o.minW + 1));
        var x0 = Math.max(0, xx), x1 = Math.min(w, xx + bw - 1), y1 = Math.min(h, yy + bh - 1);
        if (x1 > x0 && y1 > yy) {
          R(c, x + x0, y + yy, x1 - x0, y1 - yy, o.tones[Math.floor(rnd() * o.tones.length)]);
          R(c, x + x0, y + yy, x1 - x0, 1, o.hi);
          if (y1 - yy >= 3) R(c, x + x0 + 1, y + y1 - 1, x1 - x0 - 1, 1, o.sh);
          if (rnd() < 0.12 && x1 - x0 > 3) P(c, x + x0 + 1 + Math.floor(rnd() * (x1 - x0 - 2)), y + yy + 1, o.sh);
        }
        xx += bw;
      }
    }
  }
  function moss(c, x, y, w, seed) {
    var r = rng(seed);
    for (var i = 0; i < w; i++) if (r() < 0.45) { P(c, x + i, y, r() < 0.5 ? C.g1 : C.g2); if (r() < 0.4) P(c, x + i, y - 1, C.g2); }
  }
  /* merlon row on a horizontal wall */
  function merlons(c, x0, x1, y, h, light) {
    for (var x = x0; x < x1 - 3; x += 7) {
      R(c, x - 1, y - 1, 6, h + 1, OUT);
      R(c, x, y, 4, h, light ? C.s4 : C.s3);
      R(c, x, y, 4, 1, C.s5);
      R(c, x + 3, y + 1, 1, h - 1, C.s2);
    }
  }
  function hWallNorth(c, x0, x1, top) {
    // far merlons, walkway, inner front face
    R(c, x0, top + 2, x1 - x0, 6, '#7f776a');
    for (var x = x0 + 1; x < x1 - 3; x += 7) { R(c, x - 1, top - 1, 6, 6, '#4a3f35'); R(c, x, top, 4, 5, C.s3); R(c, x, top, 4, 1, C.s5); R(c, x + 3, top + 1, 1, 4, C.s2); }
    R(c, x0, top + 5, x1 - x0, 4, C.s4); R(c, x0, top + 5, x1 - x0, 1, C.s5);
    R(c, x0, top + 9, x1 - x0, 1, OUT);
    bricks(c, x0, top + 10, x1 - x0, 13, STONE_FACE, 11);
    moss(c, x0, top + 22, x1 - x0, 12);
    R(c, x0, top + 23, x1 - x0, 1, OUT);
    R(c, x0, top + 24, x1 - x0, 2, 'rgba(38,22,10,0.28)');
  }
  function hWallSouth(c, x0, x1, top, seed) {
    R(c, x0, top, x1 - x0, 7, '#857d70'); R(c, x0, top, x1 - x0, 1, OUT);
    for (var x = x0 + 2; x < x1 - 3; x += 7) { R(c, x - 1, top + 1, 6, 7, '#4a3f35'); R(c, x, top + 2, 4, 6, C.s3); R(c, x, top + 2, 4, 1, C.s5); R(c, x + 3, top + 3, 1, 5, C.s2); }
    R(c, x0, top + 7, x1 - x0, 2, C.s4); R(c, x0, top + 7, x1 - x0, 1, C.s5);
    R(c, x0, top + 9, x1 - x0, 1, OUT);
    bricks(c, x0, top + 10, x1 - x0, 15, STONE_FACE, seed || 21);
    moss(c, x0, top + 24, x1 - x0, 22);
    R(c, x0, top + 25, x1 - x0, 1, OUT);
    R(c, x0, top + 26, x1 - x0, 2, 'rgba(38,22,10,0.3)');
  }
  function vWall(c, x, y0, y1, outerLeft) {
    // walkway strip seen from above with merlons on the outer edge
    R(c, x - 1, y0, 14, y1 - y0, OUT);
    R(c, x, y0, 12, y1 - y0, C.s3);
    for (var y = y0; y < y1; y += 4) { R(c, x + 3, y, 6, 3, h2(x, y, 5) < 0.5 ? C.s4 : '#c4bcae'); }
    var mx = outerLeft ? x : x + 8;
    for (var yy = y0 + 2; yy < y1 - 3; yy += 7) { R(c, mx - (outerLeft ? 1 : 0), yy - 1, 5, 6, OUT); R(c, mx, yy, 4, 4, C.s4); R(c, mx, yy, 4, 1, C.s5); R(c, mx, yy + 3, 4, 1, C.s2); }
    var ix = outerLeft ? x + 10 : x;
    R(c, ix, y0, 2, y1 - y0, C.s2);
    R(c, x + 12, y0, 3, y1 - y0, 'rgba(38,22,10,0.26)');
  }
  function squareTower(c, cx, top, faceH, w) {
    var x0 = cx - w / 2, th = 16;
    shadow(c, cx + 4, top + th + faceH + 1, w / 2 + 3, 4, 0.3);
    R(c, x0 - 1, top - 1, w + 2, th + faceH + 2, OUT);
    R(c, x0, top, w, th, C.s4);
    R(c, x0 + 3, top + 3, w - 6, th - 5, '#8f877a'); R(c, x0 + 3, top + 3, w - 6, 1, '#6f675b');
    for (var fy = top + 4; fy < top + th - 2; fy += 3) for (var fx0 = x0 + 3 + ((fy - top) % 2) * 2; fx0 < x0 + w - 4; fx0 += 4) R(c, fx0, fy, 3, 2, h2(fx0, fy, 4) < 0.5 ? '#a39b8c' : '#9a9284');
    for (var x = x0; x < x0 + w - 2; x += 6) { R(c, x, top, 3, 3, C.s5); }
    for (var y = top + 5; y < top + th - 2; y += 5) { R(c, x0, y, 2, 2, C.s5); R(c, x0 + w - 2, y, 2, 2, C.s3); }
    R(c, x0, top + th - 1, w, 1, OUT);
    bricks(c, x0, top + th, w, faceH, STONE_FACE, cx + top);
    R(c, x0 + w - 3, top + th, 3, faceH, 'rgba(38,22,10,0.18)');
    // arrow slit
    R(c, cx - 1, top + th + 4, 2, 6, '#2b2420');
    moss(c, x0, top + th + faceH - 1, w, cx);
  }
  function wallTorch(c, x, y) { // bracket in bg; flame drawn dynamically at (x-2, y-8)
    R(c, x - 1, y, 3, 1, OUT); R(c, x, y - 2, 1, 6, C.w0); R(c, x - 1, y - 3, 3, 2, C.m1); P(c, x, y - 3, C.m0);
  }

  /* --- cone / cylinder painters --- */
  function cone(c, cx, tip, base, Rr, ry, ramp, o) {
    o = o || {};
    var rowH = o.rowH || 4, cols = o.cols || 8;
    function inside(x, y) {
      var px = x + 0.5 - cx, py = y + 0.5, t = (py - tip) / (base - tip);
      if (t < 0) return false;
      if (py <= base) return Math.abs(px) <= Rr * t + 0.3;
      var u = px / Rr, v = (py - base) / ry; return u * u + v * v <= 1;
    }
    paintShape(c, cx - Rr - 2, tip - 1, cx + Rr + 2, base + ry + 2, inside, function (x, y) {
      var px = x + 0.5 - cx, py = y + 0.5, t = clamp((py - tip) / (base - tip), 0.02, 1);
      var hw = Rr * t, u = clamp(px / hw, -1, 1);
      var curve = ry * Math.sqrt(Math.max(0, 1 - u * u)) * t;
      var rc = (py - tip) - curve * (o.flat ? 0.3 : 1);
      var band = Math.floor(rc / rowH), inb = rc - band * rowH;
      var ang = Math.asin(u), ci = (ang / Math.PI + 0.5) * cols * (0.35 + 0.65 * t) + (band & 1) * 0.5, cf = ci - Math.floor(ci);
      var l = 0.62 - u * 0.48 + (bay(x, y) - 0.5) * 0.14;
      if (o.stripes) { var sIdx = Math.floor((ang / Math.PI + 0.5) * cols); return (sIdx & 1) ? o.stripes[l < 0.35 ? 0 : l < 0.75 ? 1 : 2] : ramp[l < 0.35 ? 1 : l < 0.75 ? 2 : 3]; }
      var idx = l < 0.3 ? 1 : l < 0.58 ? 2 : l < 0.86 ? 3 : 4;
      if (inb > rowH - 1.2) idx = Math.max(1, idx - 2);
      else if (cf < 0.1) idx = Math.max(1, idx - 1);
      else if (inb < 1 && cf > 0.2 && cf < 0.55) idx = Math.min(4, idx + 1);
      return ramp[idx];
    }, ramp[0]);
  }
  function cylinder(c, cx, top, bottom, Rr, ry, colorFn, outline) {
    function inside(x, y) {
      var px = x + 0.5 - cx, py = y + 0.5, u = px / Rr;
      if (Math.abs(u) > 1 || py < top) return false;
      return py <= bottom + ry * Math.sqrt(1 - u * u);
    }
    paintShape(c, cx - Rr - 1, top, cx + Rr + 1, bottom + ry + 1, inside, function (x, y) {
      var px = x + 0.5 - cx, u = clamp(px / Rr, -1, 1), v = y + 0.5 - top - ry * Math.sqrt(1 - u * u) * 0.0;
      return colorFn(x, y, u, v);
    }, outline);
  }
  function stoneCyl(ramp, Rr, seed) {
    return function (x, y, u, v) {
      var curv = Math.sqrt(1 - u * u) * 3;
      var vv = v + curv, band = Math.floor(vv / 4), inb = vv - band * 4;
      var ang = Math.asin(u), n = 7, ci = (ang / Math.PI + 0.5) * n + (band & 1) * 0.5 + h2(band, 1, seed) * 0.3, cf = ci - Math.floor(ci);
      var wpx = Rr * Math.cos(ang) * Math.PI / n;
      var l = 0.6 - u * 0.5 + (h2(Math.floor(ci), band, seed) - 0.5) * 0.22 + (bay(x, y) - 0.5) * 0.1;
      var idx = l < 0.28 ? 1 : l < 0.55 ? 2 : l < 0.82 ? 3 : 4;
      if (inb > 3 || cf * wpx < 0.9) return ramp[Math.max(0, idx - 2)];
      if (inb < 1) return ramp[Math.min(4, idx + 1)];
      return ramp[idx];
    };
  }
  var STONE_RAMP = ['#4a433a', '#7a7266', '#9a9284', '#b5ad9d', '#d6cfbf'];
  var STONE_RAMP_L = ['#4a433a', '#8f877a', '#aea697', '#c8c0b0', '#e4ddcd'];
  var SLATE = [C.sl0, C.sl1, C.sl2, C.sl3, C.sl4];
  var TERRA = ['#4a1f10', '#7a3b1e', '#a3542a', '#c8743c', '#e39a5c'];

  function tileRoof(c, x0, y0, x1, y1, ramp, inside, seed) {
    inside = inside || function () { return true; };
    var ins = function (x, y) { return x >= x0 && x < x1 && y >= y0 && y < y1 && inside(x, y); };
    paintShape(c, x0, y0, x1, y1, ins, function (x, y) {
      var ry = y - y0, band = Math.floor(ry / 5), inb = ry - band * 5;
      var off = (band & 1) * 3, lx = (x - x0 + off) % 6;
      var l = 0.6 + (h2(Math.floor((x - x0 + off) / 6), band, seed) - 0.5) * 0.3 - (x - x0) / (x1 - x0) * 0.25;
      var idx = l < 0.4 ? 1 : l < 0.62 ? 2 : 3;
      if (inb === 4) return ramp[lx === 2 || lx === 3 ? idx - 1 : 0];
      if (inb === 3 && (lx === 0 || lx === 5)) return ramp[idx - 1];
      if (lx === 0) return ramp[Math.max(1, idx - 1)];
      if (inb === 0 && lx < 3) return ramp[Math.min(4, idx + 1)];
      return ramp[idx];
    }, ramp[0]);
  }

  function archWindow(c, x, y, w, h, wins, kind) {
    // stone frame + dark glass; registers window for night glow
    R(c, x - 1, y + 2, w + 2, h - 1, OUT);
    ellipse(c, x + w / 2, y + w / 2 + 0.5, w / 2 + 1, w / 2 + 1, OUT);
    R(c, x, y + w / 2, w, h - w / 2 - 1, C.glass);
    ellipse(c, x + w / 2, y + w / 2 + 0.5, w / 2, w / 2, C.glass);
    R(c, x, y + h - 2, w, 1, C.s4);
    P(c, x + 1, y + w / 2, C.glass2); P(c, x + 1, y + w / 2 + 1, C.glass2);
    if (wins) wins.push({ x: x, y: y, w: w, h: h - 1, arch: true, mull: kind === 'cross' });
    if (kind === 'cross') { R(c, x + Math.floor(w / 2), y + 1, 1, h - 2, OUT); }
  }
  function sqWindow(c, x, y, w, h, wins) {
    R(c, x - 2, y - 2, w + 4, h + 4, OUT);
    R(c, x - 1, y - 1, w + 2, h + 2, C.w1); R(c, x - 1, y - 1, w + 2, 1, C.w2);
    R(c, x, y, w, h, C.glass);
    R(c, x + 1, y + 1, 2, 1, C.glass2); P(c, x + 1, y + 2, C.glass2);
    R(c, x + Math.floor(w / 2), y, 1, h, C.w0); R(c, x, y + Math.floor(h / 2), w, 1, C.w0);
    if (wins) wins.push({ x: x, y: y, w: w, h: h, mull: true });
  }
  function banner(c, x, y, w, h, dark) {
    // vertical hanging banner blue with gold chevron, swallowtail bottom
    R(c, x - 2, y - 2, w + 4, 2, C.w0); R(c, x - 3, y - 2, 1, 2, C.y2); R(c, x + w + 2, y - 2, 1, 2, C.y2);
    for (var yy = 0; yy < h; yy++) {
      var tail = yy > h - 4 ? (yy - (h - 4)) : 0;
      for (var xx = 0; xx < w; xx++) {
        var mid = Math.abs(xx + 0.5 - w / 2);
        if (tail && mid < tail) continue;
        var col = xx === 0 ? '#6f97e0' : xx === w - 1 ? '#2b4a8c' : '#3f68b8';
        var band = (yy - Math.round(mid * 0.9));
        if (band === 3 || band === 4 || band === 9 || band === 10) col = xx === w - 1 ? C.y1 : C.y2;
        if (yy === 0) col = '#2b4a8c';
        P(c, x + xx, y + yy, col);
      }
    }
    // outline
    R(c, x - 1, y, 1, h - 1, OUT); R(c, x + w, y, 1, h - 1, OUT);
  }

  var LAYOUT = {
    castle: { x: 168, y: 0, w: 144, h: 124 },
    tavern: { x: 62, y: 40, w: 110, h: 102 },
    board: { x: 134, y: 132, w: 32, h: 30 },
    dovecote: { x: 350, y: 18, w: 54, h: 126 },
    chest: { x: 316, y: 100 },
    lectern: { x: 80, y: 148 },
    heroHome: { x: 270, y: 156 },
    campfire: { x: 20, y: 276 },
    more: { x: 462, y: 280 },
    court: { x0: 84, y0: 126, x1: 400, y1: 198 }
  };

  function drawCastle(c, wins, torches) {
    var cx = 240;
    shadow(c, cx + 6, 120, 76, 8, 0.32);
    // keep roof (slate, trapezoid)
    tileRoof(c, 204, 14, 277, 40, SLATE, function (x, y) { var t = (y - 14) / 26; return x >= lerp(222, 204, t) && x < lerp(259, 277, t); }, 5);
    R(c, 221, 13, 39, 2, OUT); R(c, 222, 14, 37, 1, C.sl4);
    for (var ry = 15; ry < 40; ry++) { var rt = (ry - 14) / 26; R(c, Math.round(lerp(222, 204, rt)) + 1, ry, 3, 1, 'rgba(180,200,255,0.18)'); R(c, Math.round(lerp(259, 277, rt)) - 9, ry, 8, 1, 'rgba(10,10,40,0.2)'); }
    [224, 249].forEach(function (dx0) {
      R(c, dx0 - 1, 23, 9, 11, OUT); R(c, dx0, 24, 7, 9, C.s4); R(c, dx0, 24, 7, 1, C.s5);
      R(c, dx0 + 2, 26, 3, 6, C.glass); P(c, dx0 + 2, 26, C.glass2); wins.push({ x: dx0 + 2, y: 26, w: 3, h: 6 });
      for (var i = 0; i < 4; i++) { R(c, dx0 - 1 + i, 22 - i, 9 - i * 2, 1, i ? C.sl3 : C.sl1); P(c, dx0 - 2 + i, 22 - i, OUT); P(c, dx0 + 7 - i + 1, 22 - i, OUT); }
      P(c, dx0 + 3, 18, OUT);
    });
    // flag pole (flag drawn dynamically)
    R(c, 239, 0, 2, 14, C.w0); P(c, 239, 0, C.y3); P(c, 240, 0, C.y2);
    // keep body
    var kx0 = 198, kx1 = 282, kt = 36, kb = 116;
    R(c, kx0 - 1, kt - 1, kx1 - kx0 + 2, kb - kt + 2, OUT);
    bricks(c, kx0, kt + 6, kx1 - kx0, kb - kt - 6, STONE_LIGHT, 31);
    R(c, kx1 - 6, kt + 6, 6, kb - kt - 6, 'rgba(38,22,10,0.14)');
    // parapet + merlons
    R(c, kx0, kt, kx1 - kx0, 6, C.s4); R(c, kx0, kt, kx1 - kx0, 1, C.s5); R(c, kx0, kt + 5, kx1 - kx0, 1, OUT);
    merlons(c, kx0 + 1, kx1, kt - 5, 5, true);
    // string course
    R(c, kx0, kt + 30, kx1 - kx0, 2, C.s4); R(c, kx0, kt + 32, kx1 - kx0, 1, C.s2);
    // windows
    archWindow(c, 213, 46, 6, 11, wins); archWindow(c, 261, 46, 6, 11, wins);
    // oculus over door
    ellipse(c, 240, 56, 7, 7, OUT); ellipse(c, 240, 56, 6, 6, C.s4); ellipse(c, 240, 56, 4.5, 4.5, OUT); ellipse(c, 240, 56, 3.5, 3.5, '#3a3a66');
    R(c, 239, 52, 2, 8, '#6e4a8a'); R(c, 236, 55, 8, 2, '#6e4a8a'); P(c, 238, 54, '#8fb6ea'); P(c, 242, 58, '#d96a5a');
    wins.push({ x: 237, y: 53, w: 6, h: 6, round: true });
    // banners
    banner(c, 207, 72, 8, 22); banner(c, 265, 72, 8, 22);
    // coat of arms above door
    R(c, 235, 70, 10, 9, OUT); R(c, 236, 71, 8, 6, '#3f68b8'); R(c, 237, 77, 6, 1, '#3f68b8'); R(c, 238, 78, 4, 1, '#3f68b8');
    R(c, 236, 73, 8, 2, C.y2); R(c, 239, 71, 2, 7, C.y2);
    // door arch
    var dx = 229, dw = 22, dt = 84;
    R(c, dx - 3, dt + 8, dw + 6, kb - dt - 8, OUT);
    ellipse(c, cx, dt + 11, dw / 2 + 3, 12, OUT);
    ellipse(c, cx, dt + 11, dw / 2 + 2, 11, C.s4);
    R(c, dx - 2, dt + 11, dw + 4, kb - dt - 11, C.s4);
    for (var a = 0; a < 7; a++) { var ang = Math.PI + a * Math.PI / 6; P(c, cx + Math.cos(ang) * 12, dt + 11 + Math.sin(ang) * 11, C.s2); }
    ellipse(c, cx, dt + 11, dw / 2, 9.5, OUT);
    R(c, dx, dt + 11, dw, kb - dt - 11, OUT);
    ellipse(c, cx, dt + 11.5, dw / 2 - 1, 8.5, C.w1);
    R(c, dx + 1, dt + 11, dw - 2, kb - dt - 11, C.w1);
    for (var px = dx + 1; px < dx + dw - 1; px += 4) { R(c, px, dt + 4, 1, kb - dt - 4, C.w0); R(c, px + 1, dt + 6, 1, kb - dt - 7, C.w2); }
    R(c, cx, dt + 3, 1, kb - dt - 3, OUT);
    R(c, dx + 1, dt + 14, dw - 2, 2, C.m1); R(c, dx + 1, dt + 24, dw - 2, 2, C.m1); R(c, dx + 1, dt + 14, dw - 2, 1, C.m2); R(c, dx + 1, dt + 24, dw - 2, 1, C.m2);
    P(c, cx - 3, dt + 19, C.y2); P(c, cx + 3, dt + 19, C.y2); P(c, cx - 3, dt + 20, C.y1); P(c, cx + 3, dt + 20, C.y1);
    // steps
    R(c, dx - 5, kb, dw + 10, 4, C.s4); R(c, dx - 5, kb, dw + 10, 1, C.s5); R(c, dx - 5, kb + 3, dw + 10, 1, C.s2);
    R(c, dx - 7, kb + 4, dw + 14, 3, C.s3); R(c, dx - 7, kb + 4, dw + 14, 1, C.s4); R(c, dx - 7, kb + 7, dw + 14, 1, OUT);
    R(c, dx - 6, kb - 1, 1, 5, OUT); R(c, dx + dw + 5, kb - 1, 1, 5, OUT);
    // wall torches beside door
    wallTorch(c, 222, 96); wallTorch(c, 258, 96);
    torches.push({ x: 222, y: 96 }, { x: 258, y: 96 });
    // towers
    [186, 294].forEach(function (tx, i) {
      cylinder(c, tx, 52, 116, 13, 3, stoneCyl(STONE_RAMP_L, 13, 40 + i), OUT);
      // tower windows
      archWindow(c, tx - 2, 66, 4, 9, wins);
      archWindow(c, tx - 2, 92, 4, 8, wins);
      // eave shadow
      R(c, tx - 12, 53, 24, 2, 'rgba(38,22,10,0.25)');
      cone(c, tx, 6, 48, 17, 5, SLATE, { rowH: 4, cols: 9 });
      P(c, tx, 4, C.y3); R(c, tx - 1, 5, 2, 2, C.y2); P(c, tx, 2, C.w0); P(c, tx, 3, C.w0);
      R(c, tx + 1, 1, 4, 2, i ? C.y2 : '#3f68b8'); P(c, tx + 5, 1, i ? C.y1 : '#2b4a8c');
    });
    // flower beds at base
    [[176, 118], [296, 118]].forEach(function (p, i) {
      ellipse(c, p[0] + 4, p[1] + 3, 9, 3.5, '#3f7b2d');
      for (var k = 0; k < 6; k++) flower(c, p[0] - 3 + k * 2.5, p[1] + (k % 2), i * 2 + k);
    });
  }

  function drawTavern(c, wins, torches, smoke) {
    var x0 = 70, x1 = 166, rt = 62, wt = 100, wb = 140;
    shadow(c, 122, wb + 1, 56, 6, 0.32);
    // chimney (behind roof top)
    R(c, 145, 44, 12, 26, OUT); bricks(c, 146, 45, 10, 24, STONE_FACE, 77); R(c, 144, 44, 14, 3, C.s4); R(c, 144, 43, 14, 1, OUT); R(c, 144, 47, 14, 1, OUT);
    smoke.push({ x: 151, y: 42 });
    // roof
    tileRoof(c, x0 - 5, rt, x1 + 5, wt + 2, [C.r0, C.r1, C.r2, C.r3, C.r4], null, 9);
    R(c, x0 - 5, rt - 2, x1 - x0 + 10, 4, C.r1); R(c, x0 - 5, rt - 2, x1 - x0 + 10, 1, C.r3); R(c, x0 - 6, rt - 3, x1 - x0 + 12, 1, OUT);
    R(c, x0 - 6, rt - 2, 1, wt - rt + 4, OUT); R(c, x1 + 5, rt - 2, 1, wt - rt + 4, OUT);
    // dormer
    var dx = 110;
    R(c, dx - 1, 72, 18, 16, OUT); R(c, dx, 74, 16, 13, C.pl2); R(c, dx, 74, 1, 13, C.w0); R(c, dx + 15, 74, 1, 13, C.w0);
    sqWindow(c, dx + 4, 77, 8, 7, wins);
    for (var i = 0; i < 6; i++) { R(c, dx - 3 + i, 72 - i, 22 - i * 2, 1, i === 0 ? C.r1 : C.r2); }
    R(c, dx - 4, 72, 24, 1, OUT); for (var j = 0; j < 7; j++) { P(c, dx - 4 + j, 72 - j, OUT); P(c, dx + 19 - j, 72 - j, OUT); }
    // eave line + shadow on wall
    R(c, x0 - 5, wt + 2, x1 - x0 + 10, 1, OUT);
    // front wall
    R(c, x0 - 1, wt + 3, x1 - x0 + 2, wb - wt - 3, OUT);
    R(c, x0, wt + 3, x1 - x0, wb - wt - 4, C.pl2);
    var rr = rng(5);
    for (var k = 0; k < 140; k++) P(c, x0 + Math.floor(rr() * (x1 - x0)), wt + 3 + Math.floor(rr() * (wb - wt - 6)), rr() < 0.5 ? C.pl1 : C.pl3);
    R(c, x0, wt + 3, x1 - x0, 3, 'rgba(60,30,10,0.25)');
    // timber frame
    var beam = function (x, y, w, h) { R(c, x, y, w, h, C.w0); if (w > h) R(c, x, y, w, 1, C.w1); else R(c, x, y, 1, h, C.w1); };
    beam(x0, wt + 3, 3, wb - wt - 4); beam(x1 - 3, wt + 3, 3, wb - wt - 4);
    beam(x0, wt + 3, x1 - x0, 2); beam(x0, 120, x1 - x0, 2);
    beam(102, wt + 3, 3, 34); beam(131, wt + 3, 3, 34);
    for (var d = 0; d < 14; d++) { P(c, 76 + d, 120 - Math.round(d * 1.2), C.w0); P(c, 160 - d, 120 - Math.round(d * 1.2), C.w0); P(c, 77 + d, 120 - Math.round(d * 1.2), C.w1); }
    // stone foundation
    bricks(c, x0, 132, x1 - x0, 7, STONE_FACE, 88);
    R(c, x0, 131, x1 - x0, 1, OUT);
    // windows with flower boxes
    sqWindow(c, 80, 106, 14, 10, wins); sqWindow(c, 142, 106, 14, 10, wins);
    [[78, 118], [140, 118]].forEach(function (p, n) {
      R(c, p[0] - 1, p[1], 20, 4, OUT); R(c, p[0], p[1] + 1, 18, 2, C.w1); R(c, p[0], p[1] + 1, 18, 1, C.w2);
      for (var f = 0; f < 6; f++) { P(c, p[0] + 1 + f * 3, p[1] - 1, f % 2 ? '#f29ac0' : C.h1); P(c, p[0] + 2 + f * 3, p[1], C.g3); P(c, p[0] + f * 3, p[1], C.g1); }
    });
    // door
    var ddx = 109, ddw = 18;
    R(c, ddx - 2, 112, ddw + 4, 28, OUT);
    ellipse(c, ddx + ddw / 2, 116, ddw / 2 + 2, 6, OUT);
    R(c, ddx, 116, ddw, 23, C.w1); ellipse(c, ddx + ddw / 2, 117, ddw / 2, 5, C.w1);
    for (var q = 0; q < ddw; q += 4) { R(c, ddx + q, 113, 1, 26, C.w0); R(c, ddx + q + 1, 114, 1, 25, C.w2); }
    R(c, ddx, 120, ddw, 1, C.m1); R(c, ddx, 132, ddw, 1, C.m1);
    P(c, ddx + ddw - 4, 126, C.y2); P(c, ddx + ddw - 4, 127, C.y1);
    R(c, ddx - 3, 139, ddw + 6, 2, C.s3); R(c, ddx - 3, 139, ddw + 6, 1, C.s4);
    // sign over door: tankard
    R(c, ddx - 1, 103, ddw + 2, 9, OUT); R(c, ddx, 104, ddw, 7, C.w2); R(c, ddx, 104, ddw, 1, C.w3);
    R(c, ddx + 6, 105, 5, 5, C.y2); R(c, ddx + 6, 105, 5, 1, '#fff6e0'); R(c, ddx + 11, 106, 2, 3, C.y1); R(c, ddx + 6, 109, 5, 1, C.y1);
    // lantern next to door
    wallTorch(c, 104, 124); torches.push({ x: 104, y: 124, lantern: true });
    // barrels
    [[74, 130], [86, 132]].forEach(function (b) {
      shadow(c, b[0] + 5, b[1] + 11, 6, 2, 0.3);
      R(c, b[0], b[1], 10, 11, OUT);
      R(c, b[0] + 1, b[1] + 1, 8, 9, C.w2); R(c, b[0] + 1, b[1] + 1, 2, 9, C.w3); R(c, b[0] + 7, b[1] + 1, 2, 9, C.w1);
      R(c, b[0] + 1, b[1] + 3, 8, 1, C.m1); R(c, b[0] + 1, b[1] + 8, 8, 1, C.m1);
      R(c, b[0] + 2, b[1] + 1, 6, 1, C.w0);
    });
  }

  function drawBoard(c) {
    var x = 136, y = 134;
    shadow(c, x + 13, y + 26, 15, 3, 0.3);
    R(c, x + 2, y + 8, 3, 19, OUT); R(c, x + 21, y + 8, 3, 19, OUT);
    R(c, x + 3, y + 8, 1, 18, C.w1); R(c, x + 22, y + 8, 1, 18, C.w1);
    R(c, x - 1, y + 1, 28, 19, OUT);
    R(c, x, y + 2, 26, 17, C.w1); R(c, x + 1, y + 3, 24, 15, '#9a5a2c');
    for (var i = 0; i < 4; i++) R(c, x + 1, y + 5 + i * 4, 24, 1, '#86491f');
    // little roof
    R(c, x - 3, y - 2, 32, 4, OUT); R(c, x - 2, y - 1, 30, 2, C.r2); R(c, x - 2, y - 1, 30, 1, C.r3);
  }
  function drawBoardNotes(c, n) {
    var x = 136, y = 134;
    var spots = [[3, 4, 6, 6], [11, 5, 5, 7], [18, 4, 6, 6], [5, 11, 5, 6], [12, 12, 6, 5], [19, 11, 5, 6]];
    for (var i = 0; i < Math.min(n, spots.length); i++) {
      var s = spots[i];
      R(c, x + s[0], y + s[1], s[2], s[3], i % 3 === 1 ? C.pa1 : C.pa2);
      R(c, x + s[0] + 1, y + s[1] + 2, s[2] - 2, 1, C.pa0);
      if (s[3] > 5) R(c, x + s[0] + 1, y + s[1] + 4, s[2] - 3, 1, C.pa0);
      P(c, x + s[0] + Math.floor(s[2] / 2), y + s[1], i % 2 ? C.h1 : C.m1);
    }
  }
  function drawLectern(c, x, y) {
    shadow(c, x + 9, y + 27, 10, 3, 0.3);
    R(c, x + 7, y + 10, 4, 17, OUT); R(c, x + 8, y + 10, 2, 16, C.w1); P(c, x + 8, y + 12, C.w2);
    R(c, x + 3, y + 24, 12, 3, OUT); R(c, x + 4, y + 24, 10, 2, C.w1); R(c, x + 4, y + 24, 10, 1, C.w2);
    // slanted top
    R(c, x, y + 4, 18, 8, OUT); R(c, x + 1, y + 5, 16, 6, C.w2); R(c, x + 1, y + 10, 16, 1, C.w0);
    // open book
    R(c, x + 1, y + 1, 16, 7, OUT);
    R(c, x + 2, y + 2, 6, 5, C.pa3); R(c, x + 10, y + 2, 6, 5, C.pa2); R(c, x + 8, y + 2, 2, 5, C.pa0);
    R(c, x + 3, y + 3, 4, 1, '#b39a7a'); R(c, x + 3, y + 5, 3, 1, '#b39a7a'); R(c, x + 11, y + 3, 4, 1, '#b39a7a'); R(c, x + 11, y + 5, 4, 1, '#b39a7a');
    R(c, x + 1, y + 7, 16, 1, C.h0);
    R(c, x + 9, y + 7, 1, 4, C.h1);
    // candle
    R(c, x + 15, y - 3, 2, 4, '#f4ead2'); P(c, x + 15, y - 1, '#d8c8a8');
  }
  function drawWell(c, cx, cy) {
    shadow(c, cx + 2, cy + 8, 13, 4, 0.3);
    // posts + roof
    R(c, cx - 11, cy - 22, 3, 22, OUT); R(c, cx + 8, cy - 22, 3, 22, OUT);
    R(c, cx - 10, cy - 21, 1, 21, C.w1); R(c, cx + 9, cy - 21, 1, 21, C.w1);
    R(c, cx - 9, cy - 16, 18, 2, OUT); R(c, cx - 9, cy - 16, 18, 1, C.w1);
    R(c, cx, cy - 15, 1, 8, '#c9b48a');
    // stone ring
    cylinder(c, cx, cy - 6, cy + 3, 10, 4, stoneCyl(STONE_RAMP, 10, 7), OUT);
    ellipse(c, cx, cy - 6, 10, 4, OUT); ellipse(c, cx, cy - 6, 9, 3.2, C.s4); ellipse(c, cx, cy - 5.5, 6.5, 2.2, '#1f3550'); ellipse(c, cx + 1, cy - 5, 3, 1, C.b0);
    // bucket
    R(c, cx - 2, cy - 9, 5, 4, OUT); R(c, cx - 1, cy - 8, 3, 2, C.w2); R(c, cx - 1, cy - 8, 3, 1, C.m2);
    // roof
    for (var i = 0; i < 7; i++) R(c, cx - 14 + i, cy - 23 - i, 28 - i * 2, 1, i < 1 ? C.r1 : i % 2 ? C.r2 : C.r3);
    R(c, cx - 15, cy - 23, 30, 1, OUT);
    for (var j = 0; j < 8; j++) { P(c, cx - 15 + j, cy - 23 - j, OUT); P(c, cx + 14 - j, cy - 23 - j, OUT); }
    R(c, cx - 8, cy - 31, 16, 1, OUT);
  }
  function treeBlob(c, cx, by, size, seed, dark) {
    // round deciduous tree: trunk + bushy canopy, lit from top-left
    var r = size, top = by - r * 2 - 6, ccy = by - r - 7;
    shadow(c, cx + 3, by, r * 0.9, r * 0.32, 0.32);
    R(c, cx - 3, by - 9, 6, 9, OUT); R(c, cx - 2, by - 9, 4, 8, C.w1); R(c, cx - 2, by - 9, 1, 8, C.w2); R(c, cx + 1, by - 9, 1, 8, C.w0);
    P(c, cx - 4, by - 1, OUT); P(c, cx + 3, by - 1, OUT); P(c, cx - 3, by - 1, C.w1); P(c, cx + 2, by - 1, C.w0);
    var rnd = rng(seed), blobs = [{ x: cx, y: ccy, r: r }];
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + rnd(); blobs.push({ x: cx + Math.cos(a) * r * 0.55, y: ccy + Math.sin(a) * r * 0.5, r: r * (0.5 + rnd() * 0.18) }); }
    var ramp = dark ? ['#1f3d16', '#2c5520', '#3a6e2a', '#4f8a35', '#6aa646'] : ['#244a19', '#356b26', '#4a8a32', '#66a842', '#8cc85a'];
    function inside(x, y) { for (var k = 0; k < blobs.length; k++) { var b = blobs[k], dx = x + 0.5 - b.x, dy = (y + 0.5 - b.y) * 1.08; if (dx * dx + dy * dy <= b.r * b.r) return true; } return false; }
    paintShape(c, cx - r * 1.7, top - 2, cx + r * 1.7, by - 4, inside, function (x, y) {
      var best = null, bd = -1e9;
      for (var k = 0; k < blobs.length; k++) { var b = blobs[k], dx = x + 0.5 - b.x, dy = y + 0.5 - b.y, dd = b.r - Math.sqrt(dx * dx + dy * dy) + (b.y - ccy) * 0.15; if (dd > bd) { bd = dd; best = b; } }
      var nx = (x + 0.5 - best.x) / best.r, ny = (y + 0.5 - best.y) / best.r;
      var gx = (x + 0.5 - cx) / r, gy = (y + 0.5 - ccy) / r;
      var l = 0.55 - nx * 0.28 - ny * 0.32 - gx * 0.12 - gy * 0.2 + (bay(x, y) - 0.5) * 0.2;
      var idx = l < 0.25 ? 1 : l < 0.5 ? 2 : l < 0.72 ? 3 : 4;
      return ramp[idx];
    }, OUT);
    // leaf sparkle
    for (var s = 0; s < 6; s++) { var sx = cx - r * 0.6 + rnd() * r * 0.8, sy = ccy - r * 0.7 + rnd() * r * 0.7; P(c, sx, sy, ramp[4]); }
    if (!dark && h2(seed, 2, 3) < 0.5) for (var f = 0; f < 3; f++) { P(c, cx - r * 0.3 + rnd() * r, ccy + rnd() * r * 0.4, '#e2574c'); }
  }
  function pine(c, cx, by, h, seed) {
    shadow(c, cx + 2, by, 8, 3, 0.3);
    R(c, cx - 2, by - 5, 4, 5, OUT); R(c, cx - 1, by - 5, 2, 4, C.w1);
    var ramp = ['#1f3d16', '#24502a', '#2f6634', '#3f7d3e', '#5a9a52'];
    for (var t = 0; t < 3; t++) {
      var top = by - 4 - h + t * h * 0.28, bot = by - 4 - h * 0.45 + t * h * 0.3, wdt = 5 + t * 3;
      cone(c, cx, top, bot, wdt, 2, ramp, { rowH: 3, cols: 6 });
    }
  }
  function bush(c, cx, by, r, seed, berries) {
    shadow(c, cx + 1, by, r + 1, 2.5, 0.28);
    var ramp = ['#244a19', '#356b26', '#4a8a32', '#66a842', '#8cc85a'];
    var rnd = rng(seed), blobs = [{ x: cx, y: by - r * 0.7, r: r }, { x: cx - r * 0.6, y: by - r * 0.5, r: r * 0.7 }, { x: cx + r * 0.6, y: by - r * 0.5, r: r * 0.7 }];
    function inside(x, y) { for (var k = 0; k < 3; k++) { var b = blobs[k], dx = x + 0.5 - b.x, dy = y + 0.5 - b.y; if (dx * dx + dy * dy <= b.r * b.r) return true; } return false; }
    paintShape(c, cx - r * 2, by - r * 2, cx + r * 2, by + 1, inside, function (x, y) {
      var nx = (x + 0.5 - cx) / r, ny = (y + 0.5 - (by - r)) / r, l = 0.55 - nx * 0.3 - ny * 0.4 + (bay(x, y) - 0.5) * 0.25;
      return ramp[l < 0.3 ? 1 : l < 0.55 ? 2 : l < 0.8 ? 3 : 4];
    }, OUT);
    if (berries) for (var i = 0; i < 4; i++) P(c, cx - r + rnd() * r * 2, by - r * 1.2 + rnd() * r, berries);
  }
  function drawDummy(c, x, by) { // straw training dummy (quintain)
    shadow(c, x + 2, by, 8, 2.5, 0.3);
    R(c, x - 1, by - 22, 3, 22, OUT); R(c, x, by - 21, 1, 21, C.w1);
    R(c, x - 8, by - 17, 17, 3, OUT); R(c, x - 7, by - 16, 15, 1, C.w2);
    ellipse(c, x + 0.5, by - 12, 6, 7, OUT); ellipse(c, x + 0.5, by - 12, 5, 6, '#d9b45a'); ellipse(c, x - 0.5, by - 13, 3, 4, '#ecd08a');
    R(c, x - 4, by - 9, 9, 1, '#a07a3a'); R(c, x - 4, by - 15, 9, 1, '#a07a3a');
    ellipse(c, x + 0.5, by - 22, 4.5, 4.5, OUT); ellipse(c, x + 0.5, by - 22, 3.5, 3.5, '#e2c477'); P(c, x - 1, by - 23, '#3b1f0b'); P(c, x + 2, by - 23, '#3b1f0b');
    ellipse(c, x - 8, by - 13, 4, 4.5, OUT); ellipse(c, x - 8, by - 13, 3, 3.5, '#3f68b8'); ellipse(c, x - 8, by - 13, 1.6, 1.9, C.y2); P(c, x - 9, by - 15, '#76a0e6');
  }
  function hay(c, x, y) {
    shadow(c, x + 6, y + 8, 8, 2, 0.28);
    R(c, x, y - 1, 12, 10, OUT); R(c, x - 1, y, 14, 8, OUT);
    R(c, x, y, 12, 8, '#d9ae52'); R(c, x + 1, y, 10, 3, '#f0cf7a'); R(c, x + 1, y, 10, 1, '#fbe6a6'); R(c, x, y + 6, 12, 2, '#b08436');
    for (var i = 0; i < 12; i += 2) P(c, x + i, y + 4 + (i % 4 ? 1 : 0), '#c49a44');
    R(c, x + 3, y, 1, 8, '#7a4220'); R(c, x + 8, y, 1, 8, '#7a4220');
    P(c, x + 5, y - 2, '#f0cf7a'); P(c, x + 6, y - 3, '#d9ae52'); P(c, x + 10, y - 2, '#f0cf7a'); P(c, x - 2, y + 6, '#d9ae52');
  }
  function benchAt(c, x, y) {
    shadow(c, x + 9, y + 6, 10, 2, 0.26);
    R(c, x - 1, y - 1, 20, 5, OUT); R(c, x, y, 18, 3, C.w2); R(c, x, y, 18, 1, C.w3);
    R(c, x + 1, y + 3, 3, 4, OUT); R(c, x + 14, y + 3, 3, 4, OUT); R(c, x + 2, y + 3, 1, 3, C.w1); R(c, x + 15, y + 3, 1, 3, C.w1);
  }
  function drawDovecote(c, wins, torches) {
    var cx = 376, top = 82, bot = 138;
    shadow(c, cx + 5, bot + 3, 24, 5, 0.32);
    cylinder(c, cx, top, bot, 18, 4, function (x, y, u, v) {
      if (v > 26 && v < 30) { var l2 = 0.6 - u * 0.5; return l2 < 0.3 ? C.pl0 : l2 < 0.7 ? C.pl2 : C.pl3; }
      return stoneCyl(['#4a433a', '#8b7f6a', '#a89a80', '#c3b598', '#ddd0b2'], 18, 3)(x, y, u, v);
    }, OUT);
    R(c, cx - 17, top, 34, 3, 'rgba(38,22,10,0.3)');
    // pigeon holes
    [-11, -4, 3, 10].forEach(function (o) {
      var hx0 = cx + o;
      R(c, hx0, 89, 3, 5, '#2a201a'); P(c, hx0 + 1, 88, '#2a201a');
      R(c, hx0 - 1, 94, 5, 1, C.s5); R(c, hx0 - 1, 95, 5, 1, C.s2);
    });
    // door
    var dx = cx - 6;
    R(c, dx - 1, 122, 14, 18, OUT); ellipse(c, cx + 0.5, 125, 7, 4, OUT);
    R(c, dx, 125, 12, 14, C.w1); ellipse(c, cx + 0.5, 125.5, 6, 3, C.w1);
    for (var q = 0; q < 12; q += 3) R(c, dx + q, 123, 1, 16, C.w0);
    P(c, dx + 9, 131, C.y2);
    wallTorch(c, cx + 12, 124); torches.push({ x: cx + 12, y: 124, lantern: true });
    // small window
    sqWindow(c, cx - 2, 104, 4, 5, wins);
    // roof
    cone(c, cx, 44, 84, 24, 6, TERRA, { rowH: 4, cols: 11 });
    // lantern on top
    R(c, cx - 4, 36, 8, 9, OUT); R(c, cx - 3, 37, 6, 7, C.pl2); R(c, cx - 1, 38, 2, 5, '#2a201a'); R(c, cx + 2, 37, 1, 7, C.pl0);
    cone(c, cx, 28, 37, 6, 2, TERRA, { rowH: 3, cols: 5 });
    // weathervane rooster
    R(c, cx, 20, 1, 8, C.m0); R(c, cx - 2, 19, 5, 2, C.m0); P(c, cx + 2, 18, C.m0); P(c, cx - 2, 18, C.m0); P(c, cx - 3, 20, C.m0);
  }
  function drawGarden(c, x, y, w, h) {
    // tilled soil + pumpkins and cabbages + fence
    R(c, x, y, w, h, '#6b4a2a');
    for (var r = 0; r < h; r += 4) { R(c, x, y + r, w, 2, '#7d5a34'); R(c, x, y + r, w, 1, '#8f6a40'); }
    var rnd = rng(77);
    for (var i = 0; i < 9; i++) {
      var px = x + 5 + i * 9, py = y + 3 + (i % 2) * 9;
      if (i % 3 === 0) { // pumpkin
        R(c, px - 1, py - 1, 8, 7, OUT); R(c, px, py, 6, 5, '#e07a2a'); R(c, px, py, 2, 5, '#f29a44'); R(c, px + 4, py, 2, 5, '#b85a1e'); R(c, px + 3, py, 1, 5, '#b85a1e');
        R(c, px + 2, py - 2, 2, 2, C.g1);
      } else { // cabbage
        R(c, px, py - 1, 6, 6, OUT); R(c, px + 1, py, 4, 4, '#8cc85a'); P(c, px + 1, py, '#c2e07e'); R(c, px + 3, py + 2, 2, 2, '#4a8a32'); P(c, px - 1, py + 2, '#4a8a32'); P(c, px + 6, py + 2, '#4a8a32');
      }
      if (rnd() < 0.5) { P(c, px + 2, py + 9, C.g3); P(c, px + 3, py + 8, C.g5); }
    }
    // fence
    var fy = y - 4;
    R(c, x - 2, fy, w + 4, 1, OUT); R(c, x - 2, fy + 1, w + 4, 1, C.w2); R(c, x - 2, fy + 3, w + 4, 1, C.w1); R(c, x - 2, fy + 4, w + 4, 1, OUT);
    for (var fx = x - 2; fx <= x + w + 2; fx += 8) { R(c, fx - 1, fy - 3, 3, 9, OUT); R(c, fx, fy - 2, 1, 7, C.w2); }
    R(c, x - 2, y + h + 1, w + 4, 1, OUT); R(c, x - 2, y + h, w + 4, 1, C.w1);
    for (var fx2 = x - 2; fx2 <= x + w + 2; fx2 += 8) { R(c, fx2 - 1, y + h - 4, 3, 7, OUT); R(c, fx2, y + h - 3, 1, 5, C.w2); }
    R(c, x - 3, fy, 1, h + 6, OUT); R(c, x + w + 2, fy, 1, h + 6, OUT);
  }
  function drawPond(c, cx, cy, rx, ry) {
    ellipse(c, cx, cy, rx + 2, ry + 2, '#6e5232');
    ellipse(c, cx, cy, rx + 1, ry + 1, C.p1);
    ellipse(c, cx, cy + 0.5, rx, ry, C.b0);
    ellipse(c, cx, cy + 1.5, rx - 1, ry - 1.5, C.b1);
    R(c, cx - rx * 0.5, cy - 1, rx * 0.4, 1, C.b2); R(c, cx + rx * 0.1, cy + 2, rx * 0.35, 1, C.b2); P(c, cx - rx * 0.45, cy - 2, C.b3);
    // lily pads
    [[cx + rx * 0.45, cy - 1], [cx - rx * 0.2, cy + 3]].forEach(function (p, i) { ellipse(c, p[0], p[1], 3, 1.6, '#3f8a3a'); P(c, p[0] + 1, p[1] - 1, C.b1); if (!i) { P(c, p[0] - 1, p[1] - 1, '#f29ac0'); P(c, p[0], p[1] - 1, '#fff0f6'); } });
    // reeds
    [[cx - rx + 1, cy - 2], [cx - rx + 3, cy - 3], [cx + rx - 3, cy - 2]].forEach(function (p) { R(c, p[0], p[1] - 6, 1, 7, C.g1); R(c, p[0], p[1] - 8, 1, 3, C.w0); });
  }
  function drawCampDecor(c) {
    // logs around the fire, a cart and crates at the far right
    var f = LAYOUT.campfire;
    R(c, f.x - 12, f.y - 1, 6, 3, OUT); R(c, f.x - 11, f.y, 4, 1, C.w2);
    R(c, f.x + 7, f.y - 1, 6, 3, OUT); R(c, f.x + 8, f.y, 4, 1, C.w2);
    ellipse(c, f.x, f.y + 1, 6, 2.5, '#4a3a2a'); ellipse(c, f.x, f.y + 1, 4, 1.5, '#2e241c');
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; P(c, f.x + Math.cos(a) * 6, f.y + 1 + Math.sin(a) * 2.5, C.s3); }
    // crates
    [[452, 238], [462, 243]].forEach(function (p) {
      shadow(c, p[0] + 5, p[1] + 10, 6, 2, 0.3);
      R(c, p[0], p[1], 11, 10, OUT); R(c, p[0] + 1, p[1] + 1, 9, 8, C.w2); R(c, p[0] + 1, p[1] + 1, 9, 1, C.w3);
      R(c, p[0] + 1, p[1] + 4, 9, 1, C.w1); R(c, p[0] + 5, p[1] + 1, 1, 8, C.w1);
    });
  }
  function drawGatehouse(c, torches) {
    var top = 186;
    // flanking towers
    squareTower(c, 219, top, 28, 22);
    squareTower(c, 261, top, 28, 22);
    // arch block
    R(c, 229, 201, 22, 29, OUT);
    bricks(c, 230, 202, 20, 27, STONE_FACE, 55);
    // opening
    ellipse(c, 240, 216, 10, 9, OUT); R(c, 230, 216, 20, 14, OUT);
    ellipse(c, 240, 216.5, 9, 8, '#2a2420'); R(c, 231, 216, 18, 14, '#2a2420');
    // road visible through the gate (lit lower part)
    R(c, 232, 222, 16, 8, '#5a4630'); R(c, 233, 224, 14, 6, '#7a5d3a');
    for (var k = 0; k < 4; k++) R(c, 233 + k * 4, 226, 3, 1, '#a8854f');
    // portcullis teeth
    for (var t = 0; t < 5; t++) { R(c, 232 + t * 4, 209, 1, 6, C.m1); P(c, 232 + t * 4, 215, C.m2); }
    R(c, 231, 210, 18, 1, C.m0);
    // opened doors
    R(c, 231, 217, 3, 12, C.w0); R(c, 246, 217, 3, 12, C.w0); R(c, 232, 217, 1, 12, C.w1); R(c, 247, 217, 1, 12, C.w1);
    // keystone
    R(c, 238, 205, 5, 4, OUT); R(c, 239, 205, 3, 3, C.s5);
    // banners on towers
    banner(c, 215, 206, 8, 18); banner(c, 257, 206, 8, 18);
    wallTorch(c, 227, 218); wallTorch(c, 253, 218);
    torches.push({ x: 227, y: 218 }, { x: 253, y: 218 });
  }

  function buildBackground() {
    buildSprites();
    var bg = mk(W, H), c = g2(bg), wins = [], torches = [], smoke = [];
    var pathM = buildPathMask();
    paintTerrain(c, pathM);
    var blocked = function (x, y) {
      // keep grass decals off big structures
      if (y >= 30 && y < 62 && x >= 40 && x < 440) return true;
      if (y >= 184 && y < 232 && x >= 40 && x < 440) return true;
      if ((x >= 44 && x < 68) || (x >= 412 && x < 436)) return y > 20 && y < 232;
      return false;
    };
    decorateGrass(c, pathM, blocked);
    // outer trees (top corners)
    treeBlob(c, 14, 26, 12, 3, true); treeBlob(c, 34, 14, 9, 4, true);
    treeBlob(c, 468, 28, 12, 5, true); treeBlob(c, 446, 14, 9, 6, true);
    // north wall + corner towers
    hWallNorth(c, 48, 432, 34);
    vWall(c, 50, 48, 206, true);
    vWall(c, 418, 48, 206, false);
    squareTower(c, 56, 20, 16, 28);
    squareTower(c, 424, 20, 16, 28);
    // castle (on top of north wall)
    drawCastle(c, wins, torches);
    // tavern & co
    drawTavern(c, wins, torches, smoke);
    drawBoard(c);
    drawLectern(c, LAYOUT.lectern.x, LAYOUT.lectern.y);
    drawDummy(c, 340, 152);
    ellipse(c, 330, 72, 14, 4, '#3f7b2d'); ellipse(c, 330, 71, 13, 3, '#4f9034');
    for (var fb = 0; fb < 9; fb++) flower(c, 318 + fb * 2.8, 69 + (fb % 2) * 2, fb);
    hay(c, 184, 186); hay(c, 196, 190);
    benchAt(c, 268, 184);
    // dovecote
    drawDovecote(c, wins, torches);
    // courtyard decor
    drawWell(c, 204, 146);
    drawGarden(c, 322, 182, 84, 16);
    drawPond(c, 112, 190, 22, 8);
    bush(c, 170, 156, 5, 11, null); bush(c, 312, 152, 5, 12, '#e2574c');
    bush(c, 404, 152, 5, 13, null); bush(c, 72, 172, 5, 14, '#f29ac0');
    treeBlob(c, 162, 200, 9, 21, false);
    treeBlob(c, 300, 200, 10, 22, false);
    treeBlob(c, 80, 204, 8, 23, false);
    treeBlob(c, 400, 204, 8, 24, false);
    // south wall with gatehouse
    hWallSouth(c, 48, 208, 202, 31); hWallSouth(c, 272, 432, 202, 32);
    drawGatehouse(c, torches);
    squareTower(c, 56, 188, 26, 28);
    squareTower(c, 424, 188, 26, 28);
    torches.push({ x: 56, y: 216 }, { x: 424, y: 216 });
    wallTorch(c, 56, 216); wallTorch(c, 424, 216);
    // camp decor
    drawCampDecor(c);
    // lantern posts along the road through the camp
    [[222, 266], [258, 266]].forEach(function (q) {
      shadow(c, q[0] + 1, q[1], 4, 1.5, 0.3);
      R(c, q[0] - 1, q[1] - 16, 3, 16, OUT); R(c, q[0], q[1] - 15, 1, 15, C.w1);
      R(c, q[0] - 3, q[1] - 17, 7, 2, OUT); R(c, q[0] - 3, q[1] - 24, 7, 7, OUT); R(c, q[0] - 2, q[1] - 23, 5, 5, '#5a4a3a'); R(c, q[0] - 1, q[1] - 22, 3, 3, '#8a7a5a');
      R(c, q[0] - 2, q[1] - 26, 5, 2, OUT); P(c, q[0], q[1] - 27, OUT);
      torches.push({ x: q[0], y: q[1] - 17, lantern: true, post: true });
    });
    return { canvas: bg, wins: wins, torches: torches, smoke: smoke };
  }

  /* =====================================================================
     7. Dynamic sprites: tents, chest
     ===================================================================== */
  var _wornCache = null;
  function wornGround() {
    if (_wornCache) return _wornCache;
    var w = 36, h = 16, c = mk(w, h), x = g2(c), D = ['#7d5f3a', '#916f46', '#a27e52', '#b48f60'];
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
      var dx = (xx + 0.5 - w / 2) / (w / 2), dy = (yy + 0.5 - h / 2) / (h / 2), d = Math.sqrt(dx * dx + dy * dy);
      var v = 1.15 - d + (vnoise(xx, yy, 5, 31) - 0.5) * 0.5 + (bay(xx, yy) - 0.5) * 0.25;
      if (v < 0.35) continue;
      var n = vnoise(xx, yy, 4, 32) + (bay(xx, yy) - 0.5) * 0.3;
      P(x, xx, yy, D[n < 0.3 ? 0 : n < 0.55 ? 1 : n < 0.8 ? 2 : 3]);
    }
    P(x, 8, 9, C.p2); P(x, 9, 9, C.p0); P(x, 27, 6, C.p2); P(x, 28, 6, C.p0);
    _wornCache = c; return c;
  }
  var _tentCache = {};
  var CANVAS_RAMP = ['#4a3a24', '#b8a47c', '#d9c79a', '#efe2bf', '#fbf3dc'];
  function tentBody(ch, cold) {
    var key = ch + '|' + (cold ? 1 : 0); if (_tentCache[key]) return _tentCache[key];
    var c = mk(26, 24), x = g2(c), cx = 13, by = 22;
    var ramp = CH_RAMPS[ch].slice(); if (cold) ramp = ramp.map(function (q) { return desat(q, 0.55); });
    var canv = cold ? CANVAS_RAMP.map(function (q) { return desat(q, 0.3); }) : CANVAS_RAMP;
    shadow(x, cx + 2, by, 12, 3, 0.32);
    if (ch === 0) {
      // humble A-frame tent, patched
      paintShape(x, 0, 0, 26, 24, function (px, py) { var t = (py + 0.5 - (by - 14)) / 14; if (t < 0 || py >= by) return false; return Math.abs(px + 0.5 - cx) <= 11 * t; }, function (px, py) {
        var u = (px + 0.5 - cx); var l = u < 0 ? 0.7 : 0.4; l += (bay(px, py) - 0.5) * 0.2;
        if (Math.abs(u) < 0.8) return OUT;
        if ((px === 7 && py > 14 && py < 18) || (px === 18 && py > 12 && py < 15)) return '#8a7a62';
        return l > 0.55 ? '#cfc4ae' : '#a89f8e';
      }, OUT);
      // door
      paintShape(x, 0, 0, 26, 24, function (px, py) { var t = (py + 0.5 - (by - 7)) / 7; if (t < 0 || py >= by) return false; return Math.abs(px + 0.5 - cx) <= 3.5 * t; }, function () { return '#2b2018'; }, null);
      R(x, cx - 6, by - 1, 12, 1, '#6e604e');
    } else {
      // pavilion: striped wall + cone roof with valance
      cylinder(x, cx, by - 9, by - 1, 10, 1.5, function (px, py, u) {
        var sIdx = Math.floor((Math.asin(u) / Math.PI + 0.5) * 6);
        var l = 0.62 - u * 0.45 + (bay(px, py) - 0.5) * 0.12;
        var r2 = (sIdx & 1) ? ramp : [canv[1], canv[2], canv[3]];
        return r2[l < 0.38 ? 0 : l < 0.74 ? 1 : 2];
      }, OUT);
      // door
      R(x, cx - 3, by - 8, 6, 8, OUT); R(x, cx - 2, by - 7, 4, 7, '#2b2018'); P(x, cx - 3, by - 7, canv[3]); P(x, cx + 2, by - 7, canv[1]);
      cone(x, cx, by - 21, by - 10, 12, 2.5, [OUT, canv[1], canv[2], canv[3], canv[4]], { stripes: ramp, cols: 8 });
      // valance scallops
      for (var i = -11; i <= 10; i += 3) { var vy = by - 10 + Math.round(2.5 * Math.sqrt(Math.max(0, 1 - (i / 12) * (i / 12)))); R(x, cx + i, vy, 2, 2, ramp[0]); P(x, cx + i, vy + 2, OUT); P(x, cx + i + 1, vy + 2, OUT); }
      // gold finial
      P(x, cx, by - 22, ch === 4 ? C.y3 : C.y2);
    }
    _tentCache[key] = c;
    return c;
  }
  function drawBannerOn(c, px, poleTop, ch, hearts, cold, frame, raised) {
    var ramp = CH_RAMPS[ch].slice(); if (cold && !raised) ramp = ramp.map(function (q) { return desat(q, 0.7); });
    var droop = !raised && (cold || hearts < 1.5);
    var drop = raised ? 0 : Math.round((5 - clamp(hearts, 0, 5)) / 5 * 8);
    var y = poleTop + 2 + drop, gold = ch === 4 ? C.y4 : C.y3;
    R(c, px, poleTop, 1, 16, OUT); P(c, px, poleTop - 1, C.y2); P(c, px, poleTop - 2, OUT);
    if (!droop) {
      var widths = [8, 8, 6, 4, 2];
      var wav = [[0, 0, 0, 0, 0], [1, 0, 1, 1, 0], [0, 1, 0, 0, 1]][frame % 3];
      R(c, px + 1, y - 1, widths[0] + wav[0], 1, OUT);
      for (var r = 0; r < 5; r++) {
        var w = widths[r] + wav[r];
        R(c, px + 1, y + r, w, 1, r === 0 ? ramp[2] : r >= 3 ? ramp[0] : ramp[1]);
        P(c, px + 1 + w, y + r, OUT);
      }
      R(c, px + 1, y + 5, 3, 1, OUT);
      P(c, px + 3, y + 1, gold); P(c, px + 3, y + 2, gold); P(c, px + 4, y + 2, gold);
    } else {
      R(c, px + 1, y - 1, 4, 1, OUT);
      var ws = [3, 3, 3, 3, 2, 2, 1];
      for (var k = 0; k < ws.length; k++) { R(c, px + 1, y + k, ws[k], 1, k === 0 ? ramp[2] : ramp[1]); P(c, px + 1 + ws[k], y + k, OUT); }
      R(c, px + 1, y + 1, 1, 6, ramp[0]); P(c, px + 1, y + ws.length, OUT);
    }
  }
  function drawChest(c, x, y, level, t) {
    shadow(c, x + 9, y + 15, 10, 2.5, 0.32);
    if (level <= 0) {
      R(c, x, y + 3, 18, 13, OUT);
      R(c, x + 1, y + 4, 16, 11, C.w2); R(c, x + 1, y + 9, 16, 6, C.w1); R(c, x + 1, y + 4, 16, 1, C.w3);
      R(c, x + 1, y + 1, 16, 4, OUT); R(c, x + 2, y + 2, 14, 3, C.w2); R(c, x + 2, y + 2, 14, 1, C.w3);
      R(c, x + 1, y + 8, 16, 1, OUT);
      R(c, x + 3, y + 2, 2, 13, C.y1); R(c, x + 13, y + 2, 2, 13, C.y1); R(c, x + 3, y + 2, 1, 13, C.y2); R(c, x + 13, y + 2, 1, 13, C.y2);
      R(c, x + 7, y + 7, 4, 4, OUT); R(c, x + 8, y + 8, 2, 2, C.y2);
      return;
    }
    // open lid behind
    R(c, x, y - 4, 18, 8, OUT); R(c, x + 1, y - 3, 16, 6, C.w0); R(c, x + 2, y - 2, 14, 4, '#3d1d08');
    R(c, x + 3, y - 3, 2, 6, C.y1); R(c, x + 13, y - 3, 2, 6, C.y1);
    // gold pile (coins heaped above the rim)
    var fill = [0, 2, 4, 6, 8][clamp(level, 0, 4)];
    for (var i = 0; i < 16; i++) {
      var mid = 1 - Math.abs(i - 7.5) / 8;
      var hh = Math.round(fill * (0.65 + 0.35 * mid) + (level >= 4 ? mid * 3 : 0) + Math.sin(i * 1.7) * 0.6);
      if (hh <= 0) continue;
      R(c, x + 1 + i, y + 6 - hh, 1, hh, C.y2);
      P(c, x + 1 + i, y + 5 - hh, OUT);
      P(c, x + 1 + i, y + 6 - hh, (i % 3 === 1) ? C.y4 : C.y3);
      for (var k = 2; k < hh; k += 2) P(c, x + 1 + i, y + 6 - hh + k, ((i + k) % 4 === 0) ? C.y1 : ((i + k) % 4 === 2 ? C.y3 : C.y2));
    }
    if (level >= 3) { P(c, x + 6, y + 3 - fill + 3, '#7ad0ff'); P(c, x + 11, y + 4 - fill + 3, C.h1); }
    // body
    R(c, x, y + 4, 18, 12, OUT);
    R(c, x + 1, y + 5, 16, 10, C.w1); R(c, x + 1, y + 5, 16, 2, C.w2); R(c, x + 1, y + 5, 16, 1, C.w3);
    R(c, x + 1, y + 10, 16, 1, C.w0);
    R(c, x + 3, y + 5, 2, 10, C.y1); R(c, x + 13, y + 5, 2, 10, C.y1); R(c, x + 3, y + 5, 1, 10, C.y2); R(c, x + 13, y + 5, 1, 10, C.y2);
    R(c, x + 7, y + 6, 4, 4, OUT); R(c, x + 8, y + 7, 2, 2, C.y2);
    if (level >= 4) { // spilled coins
      [[x - 3, y + 13], [x + 18, y + 12], [x + 20, y + 14]].forEach(function (p) { R(c, p[0], p[1], 3, 2, C.y2); P(c, p[0], p[1], C.y3); R(c, p[0], p[1] + 2, 3, 1, OUT); });
    }
  }

  /* =====================================================================
     8. Icons (16x16, crisp)
     ===================================================================== */
  var IP = {
    o: OUT, Y: '#fff3b0', y: '#F2C14E', z: '#D99A1E', Z: '#a8691a',
    R: '#f06e5e', r: '#D93A3A', q: '#8f1f24', e: '#7d5a48', E: '#5a3d30',
    W: '#fffaf0', P: '#F7D9A1', p: '#E8B86D', Q: '#c99a52',
    M: '#eef2f8', m: '#b0b9c9', n: '#76809a', N: '#4f566a',
    K: '#5B2E0F', k: '#8A4B22', j: '#B5652B', J: '#d68a45',
    B: '#7aa2e8', b: '#4a74c4', v: '#2f4f94',
    G: '#a6d96a', g: '#74b843', h: '#4f8a2e',
    S: '#f7c9a0', s: '#e2a57e',
    F: '#fff4c2', f: '#ffd25a', x: '#ff9a2e', X: '#e0531f',
    C: '#e8e2d4', c: '#c4bcac', d: '#9a9284', D: '#6f675b',
    T: '#e07a52', t: '#B3402A', u: '#7e2a1c',
    A: '#c4bfb8', a: '#9a958f', l: '#6e6a66', L: '#f6876c', i: '#2a1608'
  };
  var ICON_MAPS = {
    heart: [
      '..............', '..............',
      '..rrr....rrr..',
      '.rRRrr..rrrrq.',
      '.rRWRrrrrrrrq.',
      '.rRRrrrrrrrrq.',
      '.rrrrrrrrrrrq.',
      '..rrrrrrrrrq..',
      '...rrrrrrrq...',
      '....rrrrrq....',
      '.....rrrq.....',
      '......rq......',
      '..............', '..............'],
    scroll: [
      '..............',
      '..pPPPPPPPPp..',
      '.pPWPPPPPPPPp.',
      '..pQQQQQQQQp..',
      '...PPPPPPPP...',
      '...PQQQQQPP...',
      '...PPPPPPPP...',
      '...PQQQQPPP...',
      '...PPPPPPPP...',
      '...PQQQPPrr...',
      '...PPPPPPrq...',
      '..pPPPPPPPPp..',
      '.pPWPPPPPPPPp.',
      '..pQQQQQQQQp..'],
    sword: [
      '..............',
      '...........MM.',
      '..........Mmn.',
      '.........Mmn..',
      '........Mmn...',
      '.......Mmn....',
      '..yz..Mmn.....',
      '..zyzMmn......',
      '...zyzn.......',
      '....kyzz......',
      '...kK.zy......',
      '..kK..........',
      '.yz...........',
      '.zz...........'],
    pigeon: [
      '..............',
      '..............',
      '...WW.........',
      '..WiWW........',
      '.LLWWn........',
      '....nWWW......',
      '...nWWWWWWm...',
      '...WWWWmmmmm..',
      '...WWWWWmmNNN.',
      '....WWWWWmNNNN',
      '.....mmmmm..NN',
      '......L..L....',
      '..............', '..............'],
    chest: [
      '..............',
      '..............',
      '...kkkkkkkk...',
      '..kjJjjjjjjk..',
      '.kjyJjjjjyjjk.',
      '.kjyjjjjjyjjk.',
      '.zzyzzzzzyzzz.',
      '.KkykkYYkykkK.',
      '.Kkykkyzkykk..',
      '.Kkykkkkkykkk.',
      '.KkykkkkkykkK.',
      '.KKzKKKKKzKKK.',
      '..............', '..............'],
    book: [
      '..............',
      '..qrrrrrrrrW..',
      '..qRrrrrrrrPW.',
      '..qRryyyyrrPW.',
      '..qRryrryrrPW.',
      '..qrryyyyrrPW.',
      '..qrrryyrrrPW.',
      '..qrrryyrrrPW.',
      '..qrrrrrrrrPW.',
      '..qrrrrrrrrPW.',
      '..qrrrrrrrrPW.',
      '..qqqqqqqqqPW.',
      '...WPWPWPWPW..',
      '..............'],
    flame: [
      '......x.......',
      '......xx......',
      '.....xxfx.....',
      '.....xffx..x..',
      '....xxfFfx.x..',
      '...xxffFfxxx..',
      '...xffFFFfx...',
      '..xxfFFFFfxx..',
      '..xffFFFFFfx..',
      '..xffFFFFFfx..',
      '..XxfFFFFfxX..',
      '...XxffffxX...',
      '....XXxxXX....',
      '..............'],
    star: [
      '......yy......',
      '......Yy......',
      '.....YYyz.....',
      '.....YYyz.....',
      'yyyyyYYyyyyyyz',
      '.zyYYYYyyyyzz.',
      '..zyYYyyyyzz..',
      '...zyyyyyzz...',
      '...yYyyyyyz...',
      '..yYyyzzyyyz..',
      '..yYyz..zyyz..',
      '.yYz......zyz.',
      '.yz........zz.',
      '..............'],
    shield: [
      '..............',
      '.zzzzzzzzzzzz.',
      '.zBbbbyybbbvz.',
      '.zBbbbyybbbvz.',
      '.zbbbbyybbbvz.',
      '.zyyyyyyyyyyz.',
      '.zyyyyyyyyyyz.',
      '.zbbbbyybbbvz.',
      '..zbbbyybbvz..',
      '..zbbbyybbvz..',
      '...zbbyybvz...',
      '....zbyyvz....',
      '.....zyyz.....',
      '......zz......'],
    quill: [
      '...........WM.',
      '..........WWMm',
      '.........WWMmm',
      '........WWMmm.',
      '.......WWMmm..',
      '......WWMmm...',
      '.....WWMmm....',
      '.....WMmm.....',
      '....WMmm......',
      '....Mmm.......',
      '...nmm........',
      '...N..........',
      '..N...........',
      '.i............'],
    hourglass: [
      '.jjjjjjjjjjjj.',
      '.KkkkkkkkkkkK.',
      '..k.CCCCCC.k..',
      '..kCyyyyyyCk..',
      '..k.CyyyyC.k..',
      '..k..CyyC..k..',
      '..k...yC...k..',
      '..k...Cy...k..',
      '..k..C.yC..k..',
      '..k.C.yyyC.k..',
      '..kCyyyyyyCk..',
      '.KkkkkkkkkkkK.',
      '.jjjjjjjjjjjj.',
      '..............'],
    castle: [
      '..Bv......Bv..',
      '.BBbv....BBbv.',
      'BBbbvv..BBbbvv',
      '.CccD.y..CccD.',
      '.CccDcDcDCccD.',
      '.CcdDCCCDCcdD.',
      '.CccDCcdDCccD.',
      '.CccDCKKDCccD.',
      '.CccDKkkKCccD.',
      '.CcdDKkkKCcdD.',
      '.CccDKkkKCccD.',
      '.DDDDDDDDDDDD.',
      '..............', '..............'],
    tavern: [
      '.......cc.....',
      '......tcc.....',
      '.....tTTt.....',
      '....tTTTTt....',
      '...tTTttTTt...',
      '..tTTTTTTTTt..',
      '.tTTTTTTTTTTt.',
      'uuuuuuuuuuuuuu',
      '.KPPPPKPPPPPK.',
      '.KPbbPKPPkkPK.',
      '.KPbbPKPPkkPK.',
      '.KPPPPKPPkjPK.',
      '.KKKKKKKKkkKK.',
      '..............'],
    crown: [
      '..............',
      '..............',
      '.y....yy....y.',
      '.yy..yYYy..yy.',
      '.yYy.yYYy.yYy.',
      '.yYyyyYyyyyYy.',
      '.yyyyyyyyyyyz.',
      '.yRRyyBByyRRz.',
      '.yrryybvyyrrz.',
      '.zyyyyyyyyyzz.',
      '.zzzzzzzzzzzz.',
      '..............', '..............', '..............'],
    sound_on: [
      '..............', '..............', '..............',
      '......Nm......',
      '.....Nmm......',
      '.NNNNmmm......',
      '.NmmmmMm......',
      '.NmmmmMm......',
      '.NmmmmMm......',
      '.NNNNmmm......',
      '.....Nmm......',
      '......Nm......',
      '..............', '..............'],
    banner: [
      '.ykkkkkkkkkky.',
      '...Bbbbbbbv...',
      '...Bbbbbbbv...',
      '...BbbYybbv...',
      '...BbYyyzbv...',
      '...BbbYzbbv...',
      '...Bbbbbbbv...',
      '...Bbbbbbbv...',
      '...Bbbbbbbv...',
      '...Bbbbbbbv...',
      '...Bbb..bbv...',
      '...Bb....bv...',
      '...B......v...',
      '..............']
  };
  var _iconBase = {};
  function iconBase(name) {
    if (_iconBase[name]) return _iconBase[name];
    buildSprites();
    var c = null, m;
    if (name === 'heart') c = fromMap(ICON_MAPS.heart, IP);
    else if (name === 'heart_half' || name === 'heart_empty') {
      // Lost loyalty reads as an EMPTY heart: dark outline, parchment-tan inside (a solid dark heart looked full).
      var HM = ICON_MAPS.heart;
      var filled = function (r, i) { return r >= 0 && r < HM.length && i >= 0 && i < HM[r].length && HM[r].charAt(i) !== '.'; };
      m = HM.map(function (row, r) {
        var out = '';
        for (var i = 0; i < row.length; i++) {
          var k = row.charAt(i);
          if (k !== '.' && (name === 'heart_empty' || i >= 7)) {
            var edge = !filled(r - 1, i) || !filled(r + 1, i) || !filled(r, i - 1) || !filled(r, i + 1);
            k = edge ? 'E' : 'p';
          }
          out += k;
        }
        return out;
      });
      c = fromMap(m, IP);
    } else if (name === 'coin') {
      var cc = mk(14, 14), x = g2(cc);
      ellipse(x, 7, 7, 6, 6, C.y1); ellipse(x, 6.5, 6.5, 5.3, 5.3, C.y2);
      ellipse(x, 7, 7, 3.6, 3.6, C.y1); ellipse(x, 6.6, 6.6, 3, 3, C.y2);
      R(x, 6, 4, 2, 6, C.y1); R(x, 6, 4, 1, 6, C.y3);
      P(x, 3, 4, C.y4); P(x, 4, 3, C.y4); P(x, 3, 5, C.y3); P(x, 5, 2, C.y3);
      R(x, 9, 11, 2, 1, C.y0); P(x, 11, 9, C.y0); P(x, 11, 10, C.y0);
      c = addOutline(cc);
    } else if (name === 'goblin1' || name === 'goblin2') {
      c = fromMap(GOB_MAP[name === 'goblin1' ? 1 : 2], GOB_PAL[name === 'goblin1' ? 1 : 2]);
    } else if (name === 'goblin3') {
      m = GOB_MAP[3].slice(0, 14).map(function (row) { var s = row.slice(1, 15); return s.slice(0, 13).replace(/[wHkK]/g, '.') + '.'; });
      c = fromMap(m, GOB_PAL[3]);
    } else if (name === 'hero') {
      c = fromMap(HERO_TOP.slice(0, 14), HERO_PAL);
    } else if (/^banner[0-4]$/.test(name)) {
      var ch = +name.charAt(6), rp = CH_RAMPS[ch];
      c = fromMap(ICON_MAPS.banner, Object.assign({}, IP, { B: rp[2], b: rp[1], v: rp[0], Y: ch === 4 ? '#fff6c8' : '#fbe58e', y: ch === 4 ? '#fff3b0' : '#F2C14E', z: ch === 4 ? '#F2C14E' : '#D99A1E' }));
    } else if (name === 'pigeon') {
      c = fromMap(ICON_MAPS.pigeon, { W: '#eceef4', m: '#a9aebd', N: '#6b7180', n: '#6aa58f', L: '#e3a04a', i: '#2a1608' });
    } else if (name === 'sound_on' || name === 'sound_off') {
      c = fromMap(ICON_MAPS.sound_on, IP); var sx = g2(c), pts = [];
      if (name === 'sound_on') {
        [3, 6].forEach(function (r) { for (var a = -0.95; a <= 0.95; a += 0.06) pts.push([Math.round(8 + Math.cos(a) * r), Math.round(8.5 + Math.sin(a) * r)]); });
      } else {
        for (var k = 0; k < 5; k++) { pts.push([10 + k, 6 + k]); pts.push([14 - k, 6 + k]); }
      }
      pts.forEach(function (q) { R(sx, q[0] - 1, q[1], 3, 1, OUT); R(sx, q[0], q[1] - 1, 1, 3, OUT); });
      pts.forEach(function (q) { P(sx, q[0], q[1], name === 'sound_on' ? '#cfe0ff' : '#f06e5e'); });
    } else if (name === 'refresh') {
      var rc = mk(14, 14), rx = g2(rc);
      var arc = function (a0, a1) { for (var a = a0; a <= a1; a += 0.03) { R(rx, Math.round(7 + Math.cos(a) * 4.6 - 1), Math.round(7 + Math.sin(a) * 4.6 - 1), 2, 2, '#4a74c4'); } };
      arc(Math.PI * 1.08, Math.PI * 1.8); arc(Math.PI * 0.08, Math.PI * 0.8);
      R(rx, 9, 4, 5, 1, '#4a74c4'); R(rx, 10, 5, 3, 1, '#4a74c4'); P(rx, 11, 6, '#4a74c4');
      R(rx, 0, 9, 5, 1, '#4a74c4'); R(rx, 1, 8, 3, 1, '#4a74c4'); P(rx, 2, 7, '#4a74c4');
      for (var a2 = Math.PI * 1.15; a2 <= Math.PI * 1.6; a2 += 0.05) P(rx, Math.round(7 + Math.cos(a2) * 5), Math.round(7 + Math.sin(a2) * 5), '#9fc0f2');
      c = addOutline(rc);
    } else if (ICON_MAPS[name]) c = fromMap(ICON_MAPS[name], IP);
    if (!c) { c = mk(16, 16); }
    // normalize to 16x16
    if (c.width !== 16 || c.height !== 16) { var n = mk(16, 16), nx = g2(n); nx.drawImage(c, Math.floor((16 - c.width) / 2), Math.floor((16 - c.height) / 2)); c = n; }
    _iconBase[name] = c;
    return c;
  }
  ART.ICONS = ['coin', 'heart', 'heart_half', 'heart_empty', 'scroll', 'sword', 'pigeon', 'chest', 'book', 'goblin1', 'goblin2', 'goblin3', 'banner0', 'banner1', 'banner2', 'banner3', 'banner4', 'flame', 'star', 'shield', 'quill', 'hourglass', 'castle', 'tavern', 'hero', 'sound_on', 'sound_off', 'refresh', 'crown'];
  ART.icon = function (name, scale) {
    scale = Math.max(1, Math.round(scale || 2));
    var base = iconBase(String(name)), c = mk(16 * scale, 16 * scale), x = g2(c);
    x.drawImage(base, 0, 0, 16 * scale, 16 * scale);
    c.style.imageRendering = 'pixelated';
    c.style.width = (16 * scale) + 'px'; c.style.height = (16 * scale) + 'px';
    return c;
  };
  var _iconURL = {};
  ART.iconURL = function (name, scale) {
    scale = Math.max(1, Math.round(scale || 2));
    var k = name + '@' + scale;
    if (!_iconURL[k]) { try { _iconURL[k] = ART.icon(name, scale).toDataURL('image/png'); } catch (e) { _iconURL[k] = ''; } }
    return _iconURL[k];
  };

  /* =====================================================================
     9. Scene
     ===================================================================== */
  var GOB_SLOTS = (function () {
    var s = [], x, y, i;
    for (x = 80; x <= 144; x += 16) s.push([x, 31, 'top']);
    [336, 352, 400].forEach(function (q) { s.push([q, 31, 'top']); });
    for (x = 56; x <= 152; x += 16) s.push([x, 17, 'top']);
    for (x = 328; x <= 424; x += 16) s.push([x, 17, 'top']);
    for (i = 0; i < 9; i++) { s.push([12, 60 + i * 19, 'left']); s.push([468, 60 + i * 19, 'right']); }
    for (i = 0; i < 8; i++) { s.push([31, 70 + i * 19, 'left']); s.push([449, 70 + i * 19, 'right']); }
    s.push([203, 240, 'gate']); s.push([277, 240, 'gate']);
    return s;
  })();
  var TENT_SLOTS = (function () {
    var s = [];
    for (var k = 0; k < 6; k++) {
      s.push([180 - 28 * k, 252]); s.push([300 + 28 * k, 252]);
      s.push([194 - 28 * k, 281]); s.push([286 + 28 * k, 281]);
    }
    return s;
  })();

  function normModel(m) {
    m = m || {};
    var out = { quests: [], goblins: [], more: 0, treasure: 0, boardBadge: 0, chronicleBadge: 0, notes: 0, heroLevel: 0, siege: false };
    var qs = Array.isArray(m.quests) ? m.quests : [];
    out.quests = qs.filter(function (q) { return q && q.id != null; }).map(function (q) {
      var ch = q.chapter != null ? +q.chapter : 0; if (!(ch >= 0 && ch <= 4)) ch = 0;
      var hearts = q.hearts != null ? +q.hearts : 5; if (!isFinite(hearts)) hearts = 5;
      return { id: String(q.id), chapter: Math.round(ch), hearts: clamp(hearts, 0, 5), cold: !!q.cold, planned: !!(q.planned || q.relancePlanned || q.nextActivityDay || q.nextActivity) };
    });
    var more = m.questsMore != null ? +m.questsMore : m.moreQuests != null ? +m.moreQuests : 0;
    if (out.quests.length > 24) { more = Math.max(more, 0) + out.quests.length - 24; out.quests = out.quests.slice(0, 24); }
    out.more = isFinite(more) ? Math.max(0, Math.round(more)) : 0;
    var gs = Array.isArray(m.goblins) ? m.goblins : (m.missives && Array.isArray(m.missives.overdue) ? m.missives.overdue : []);
    out.goblins = gs.filter(function (g) { return g && g.id != null; }).map(function (g) {
      var t = +g.tier; if (!(t >= 1 && t <= 3)) { var d = +g.daysOverdue || 1; t = d >= 30 ? 3 : d >= 7 ? 2 : 1; }
      return { id: String(g.id), tier: t };
    });
    var lvl = m.treasureLevel != null ? m.treasureLevel : m.treasureFill; // treasureFill: LOGIC.toSceneModel
    if (lvl == null && m.treasure && typeof m.treasure === 'object') lvl = m.treasure.level;
    if (lvl == null) {
      var pct = m.treasurePct != null ? m.treasurePct : (m.season && m.season.pct != null ? m.season.pct : null);
      if (pct != null) { pct = +pct || 0; lvl = pct <= 0 ? 0 : pct < 1 / 3 ? 1 : pct < 2 / 3 ? 2 : pct < 1 ? 3 : 4; }
    }
    out.treasure = clamp(Math.round(+lvl || 0), 0, 4);
    function num(v) { if (Array.isArray(v)) return v.length; v = +v; return isFinite(v) ? Math.max(0, Math.round(v)) : 0; }
    var bd = m.badges && typeof m.badges === 'object' ? m.badges : {}; // badges.{board,chronicle}: LOGIC.toSceneModel
    var bb = m.boardBadge != null ? m.boardBadge : bd.board != null ? bd.board : m.missivesToday != null ? m.missivesToday : (m.counts && m.counts.missivesToday != null ? m.counts.missivesToday : (m.missives && m.missives.today ? m.missives.today : 0));
    out.boardBadge = num(bb);
    var cb = m.chronicleBadge != null ? m.chronicleBadge : bd.chronicle != null ? bd.chronicle : m.reconquestsDue != null ? m.reconquestsDue : 0;
    out.chronicleBadge = num(cb);
    var notes = m.boardNotes != null ? num(m.boardNotes) : out.boardBadge + Math.min(3, out.goblins.length) + (m.missives && m.missives.upcoming ? Math.min(2, m.missives.upcoming.length) : 0);
    out.notes = clamp(notes, 0, 6);
    out.heroLevel = num(m.heroLevel != null ? m.heroLevel : (m.hero && m.hero.level));
    out.siege = !!(m.siegeActive != null ? m.siegeActive : (m.siege && m.siege.active));
    return out;
  }

  function reducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }

  ART.createScene = function (canvas, handlers) {
    handlers = handlers || {};
    buildSprites();
    var BG = buildBackground();
    var ctx = canvas.getContext('2d');
    var frame = mk(W, H), f = g2(frame);
    var light = mk(W, H), lc = g2(light);
    var model = normModel(null);
    var goblins = [], tents = [], moreSign = null, boxes = [];
    var hidden = {}; // id -> {until, kind}
    var hover = null, hl = null;
    var hour = 12, tod = todParams(12);
    var fx = [];
    var raf = 0, lastDraw = 0, destroyed = false, dirty = true;
    var t0 = performance.now();
    var hero = { x: LAYOUT.heroHome.x, y: LAYOUT.heroHome.y, walk: null, face: 1, idleAt: 0 };
    var pendingSelect = null;
    var fit = handlers.fit || 'auto';
    var listeners = [];
    var fireflies = [];
    for (var i = 0; i < 10; i++) fireflies.push({ x: 80 + h2(i, 1, 5) * 320, y: 120 + h2(i, 2, 5) * 150, p: h2(i, 3, 5) * 6.28 });

    canvas.style.imageRendering = 'pixelated';
    if (!canvas.style.touchAction) canvas.style.touchAction = 'manipulation';

    /* ---- layout ---- */
    function layout() {
      // tents
      tents = model.quests.map(function (q, i) {
        var s = TENT_SLOTS[i]; if (!s) return null;
        return { q: q, x: s[0], y: s[1], ph: hashStr(q.id) % 1000 };
      }).filter(Boolean);
      moreSign = model.more > 0 ? { n: model.more, x: LAYOUT.more.x, y: LAYOUT.more.y } : null;
      // goblins: deterministic slot by id hash, linear probe
      var used = {}, list = model.goblins.slice(0, 40).map(function (g) { return { g: g, h: hashStr(g.id) }; });
      list.sort(function (a, b) { return a.h - b.h || (a.g.id < b.g.id ? -1 : 1); });
      goblins = list.map(function (it) {
        var n = GOB_SLOTS.length, k = it.h % n, tries = 0;
        while (used[k] && tries < n) { k = (k + 7) % n; tries++; }
        used[k] = 1;
        var s = GOB_SLOTS[k], jx = ((it.h >>> 8) % 5) - 2, jy = ((it.h >>> 12) % 3) - 1;
        var face = s[2] === 'right' ? -1 : s[2] === 'left' ? 1 : (s[0] < 240 ? 1 : -1);
        return { id: it.g.id, tier: it.g.tier, x: s[0] + jx, y: s[1] + jy, side: s[2], face: face, ph: (it.h >>> 4) % 1000 };
      });
      dirty = true;
    }
    function rebuildBoxes() {
      boxes = [];
      goblins.forEach(function (g) {
        if (isHidden(g.id)) return;
        var s = SPR.gob[g.tier].R; boxes.push({ kind: 'goblin', id: g.id, x: g.x - s.width / 2 - 2, y: g.y - s.height - 2, w: s.width + 4, h: s.height + 4, pri: 3 });
      });
      tents.forEach(function (t) { if (isHidden(t.q.id)) return; boxes.push({ kind: 'quest', id: t.q.id, x: t.x - 13, y: t.y - 38, w: 26, h: 40, pri: 2 }); });
      if (moreSign) boxes.push({ kind: 'camp_more', x: moreSign.x - 10, y: moreSign.y - 18, w: 20, h: 20, pri: 3 });
      boxes.push({ kind: 'hero', x: hero.x - 9, y: hero.y - 26, w: 18, h: 28, pri: 4 });
      boxes.push({ kind: 'treasure', x: LAYOUT.chest.x - 4, y: LAYOUT.chest.y - 8, w: 26, h: 28, pri: 3 });
      boxes.push({ kind: 'chronicle', x: LAYOUT.lectern.x - 3, y: LAYOUT.lectern.y - 6, w: 24, h: 36, pri: 3 });
      boxes.push({ kind: 'board', x: LAYOUT.board.x, y: LAYOUT.board.y, w: LAYOUT.board.w, h: LAYOUT.board.h, pri: 2 });
      boxes.push({ kind: 'board', x: LAYOUT.tavern.x, y: LAYOUT.tavern.y, w: LAYOUT.tavern.w, h: LAYOUT.tavern.h, pri: 0, big: true });
      boxes.push({ kind: 'dovecote', x: LAYOUT.dovecote.x, y: LAYOUT.dovecote.y, w: LAYOUT.dovecote.w, h: LAYOUT.dovecote.h, pri: 0 });
      boxes.push({ kind: 'castle', x: LAYOUT.castle.x, y: LAYOUT.castle.y, w: LAYOUT.castle.w, h: LAYOUT.castle.h, pri: 0 });
    }
    function isHidden(id) {
      var h = hidden[id]; if (!h) return false;
      if (h.until && performance.now() > h.until) { delete hidden[id]; return false; }
      return true;
    }
    function hit(x, y) {
      var best = null;
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (x < b.x || y < b.y || x >= b.x + b.w || y >= b.y + b.h) continue;
        if (!best || b.pri > best.pri || (b.pri === best.pri && b.w * b.h < best.w * best.h)) best = b;
      }
      return best;
    }
    function targetOf(b) { if (!b) return null; var t = { kind: b.kind }; if (b.id != null) t.id = b.id; return t; }
    function sameT(a, b) { return (!a && !b) || (a && b && a.kind === b.kind && a.id === b.id); }
    function boxFor(t) {
      if (!t) return null;
      for (var i = 0; i < boxes.length; i++) { var b = boxes[i]; if (b.kind === t.kind && (t.id == null || b.id === String(t.id)) && !b.big) return b; }
      return null;
    }

    /* ---- time of day ---- */
    function todParams(h) {
      h = ((+h % 24) + 24) % 24;
      var KEYS = [ // hour, tint rgb (multiply), light
        [0, [86, 98, 168], 1], [5.6, [86, 98, 168], 1], [6.4, [255, 214, 196], 0.25], [7.2, [255, 255, 255], 0],
        [17.7, [255, 255, 255], 0], [18.4, [255, 206, 150], 0.35], [19.6, [236, 168, 132], 0.55], [20.4, [86, 98, 168], 1], [24, [86, 98, 168], 1]
      ];
      for (var i = 0; i < KEYS.length - 1; i++) {
        var a = KEYS[i], b = KEYS[i + 1];
        if (h >= a[0] && h <= b[0]) {
          var t = (h - a[0]) / Math.max(1e-6, b[0] - a[0]);
          var tint = [lerp(a[1][0], b[1][0], t), lerp(a[1][1], b[1][1], t), lerp(a[1][2], b[1][2], t)];
          var lt = lerp(a[2], b[2], t);
          return { tint: tint, light: lt, night: lt > 0.8, dusk: lt > 0.1 && lt <= 0.8, day: lt <= 0.1 };
        }
      }
      return { tint: [255, 255, 255], light: 0, day: true };
    }

    /* ---- drawing dynamic layer ---- */
    function anim(t) { return reducedMotion() ? 0 : t; }
    function drawGoblin(c, g, t, extra) {
      var set = SPR.gob[g.tier], s = g.face < 0 ? set.L : set.R;
      var at = anim(t), hop = 0;
      var ph = (at + g.ph * 7) % 1100;
      if (at && ph < 220) hop = ph < 110 ? -1 : -2;
      var x = Math.round(g.x - s.width / 2 + (extra && extra.dx || 0)), y = Math.round(g.y - s.height + hop + (extra && extra.dy || 0));
      shadow(c, g.x + (extra && extra.dx || 0), g.y, s.width * 0.36, 2.2, 0.3);
      if (extra && extra.alpha != null) c.globalAlpha = extra.alpha;
      c.drawImage(s, x, y);
      if (extra && extra.flash) { c.globalAlpha = extra.flash; c.drawImage(g.face < 0 ? set.whiteL : set.white, x, y); }
      c.globalAlpha = 1;
      return { x: x, y: y, s: s };
    }
    function drawTent(c, tn, t, opt) {
      opt = opt || {};
      var q = tn.q, body = tentBody(q.chapter, q.cold), at = anim(t);
      var bx = Math.round(tn.x - 13), by = Math.round(tn.y - 22);
      if (opt.squash != null) {
        var sh = Math.max(1, Math.round(24 * opt.squash));
        c.globalAlpha = opt.alpha != null ? opt.alpha : 1;
        c.drawImage(body, 0, 0, 26, 24, bx - Math.round((1 - opt.squash) * 3), by + 24 - sh, 26 + Math.round((1 - opt.squash) * 6), sh);
        c.globalAlpha = 1;
        return;
      }
      if (opt.alpha != null) c.globalAlpha = opt.alpha;
      c.drawImage(body, bx, by);
      var frameN = Math.floor((at + tn.ph * 3) / 260) % 3;
      var hearts = opt.hearts != null ? opt.hearts : q.hearts;
      var chap = opt.chapter != null ? opt.chapter : q.chapter;
      var poleX = Math.round(tn.x), topY = Math.round(tn.y) - 37;
      if (q.chapter === 0) topY = Math.round(tn.y) - 29;
      drawBannerOn(c, poleX, topY + (opt.lift || 0), chap, hearts, opt.raised ? false : q.cold, frameN, opt.raised);
      if (q.planned && !opt.raised) {
        var bob = at && ((at + tn.ph * 5) % 2600) < 300 ? 1 : 0;
        var pg = SPR.pigeon[(bob ? 'peck' : 'sit') + 'R'];
        c.drawImage(pg, Math.round(tn.x - 15), Math.round(tn.y - (q.chapter === 0 ? 11 : 14)) - pg.height + 4);
      }
      c.globalAlpha = 1;
    }
    function heroSprite(t) {
      var at = anim(t);
      if (hero.walk) { var fr = Math.floor(Math.max(0, t - hero.walk.t0) / 90) % 4; return (hero.face < 0 ? SPR.heroWalkL : SPR.heroWalk)[fr]; }
      var idx = at ? Math.floor(at / 420) % 4 : 0;
      return (hero.face < 0 ? SPR.heroIdleL : SPR.heroIdle)[idx];
    }
    function drawHero(c, t) {
      var s = heroSprite(t);
      shadow(c, hero.x, hero.y, 7, 2.5, 0.32);
      c.drawImage(s, Math.round(hero.x - s.width / 2), Math.round(hero.y - s.height + 1));
      return s;
    }
    function drawFlag(c, t) {
      var at = anim(t), fr = Math.floor(at / 160) % 4;
      for (var xx = 0; xx < 12; xx++) {
        var wave = at ? Math.round(Math.sin(xx * 0.7 - fr * 1.57) * 1) : 0;
        var hgt = 7 - Math.floor(xx / 4);
        for (var yy = 0; yy < hgt; yy++) {
          var col = (yy === 2 || yy === 3) ? C.y2 : (xx + yy) % 5 === 0 ? '#5a82d0' : '#3f68b8';
          if (yy === hgt - 1 && hgt > 2) col = '#2b4a8c';
          P(c, 241 + xx, 1 + yy + wave + Math.floor(xx / 8), col);
        }
        P(c, 241 + xx, 0 + wave + Math.floor(xx / 8), OUT);
        P(c, 241 + xx, 1 + hgt + wave + Math.floor(xx / 8), OUT);
      }
    }
    function drawPigeons(c, t, sleeping) {
      var at = anim(t), spots = [[358, 82, 1], [389, 83, -1], [371, 33, 1], [380, 92, -1]];
      spots.forEach(function (p, i) {
        var cyc = (at + i * 977) % 4200, st = 'sit';
        if (!sleeping && at) { if (cyc < 260) st = 'peck'; else if (cyc > 3900) st = 'flap'; }
        var s = SPR.pigeon[st + (p[2] < 0 ? 'R' : '')];
        var hop = st === 'flap' ? -2 : 0;
        c.drawImage(s, p[0] - 4, p[1] - s.height + 2 + hop);
      });
    }
    function drawSmoke(c, t) {
      var at = anim(t);
      BG.smoke.forEach(function (s) {
        for (var i = 0; i < 4; i++) {
          var p = at ? ((at / 2600 + i / 4) % 1) : i / 4;
          var x = s.x + Math.sin(p * 5 + i) * 2 + p * 8, y = s.y - p * 26, r = 1.5 + p * 3;
          ellipse(c, x, y, r, r * 0.85, 'rgba(235,228,214,' + (0.55 * (1 - p)).toFixed(2) + ')');
        }
      });
    }
    function drawCampfire(c, t, lit) {
      var f = LAYOUT.campfire, at = anim(t);
      var fr = Math.floor(at / 110) % 3, fl = SPR.flame[fr];
      c.drawImage(fl, f.x - 4, f.y - 8); c.drawImage(SPR.flame[(fr + 1) % 3], f.x - 1, f.y - 9);
      if (at) { var sp = (at / 700) % 1; P(c, f.x + Math.sin(at / 300) * 3, f.y - 10 - sp * 12, sp < 0.7 ? '#ffd25a' : '#ff8a2a'); }
    }
    function drawMoreSign(c, s) {
      shadow(c, s.x, s.y, 8, 2, 0.3);
      R(c, s.x - 1, s.y - 16, 3, 16, OUT); R(c, s.x, s.y - 15, 1, 15, C.w1);
      var txt = '+' + (s.n > 99 ? 99 : s.n), tw = textW(txt);
      var bw = tw + 6;
      R(c, s.x - bw / 2 - 1, s.y - 19, bw + 2, 10, OUT); R(c, s.x - bw / 2, s.y - 18, bw, 8, C.w2); R(c, s.x - bw / 2, s.y - 18, bw, 1, C.w3);
      drawText(c, txt, s.x - tw / 2, s.y - 17, OUT);
    }
    function drawBadge(c, x, y, n, t) {
      if (!n) return;
      var txt = n > 9 ? '9+' : String(n), tw = textW(txt), w = Math.max(9, tw + 4), bob = anim(t) ? Math.round(Math.sin(anim(t) / 300) * 0.6) : 0;
      y += bob;
      R(c, x - 1, y, w + 2, 9, OUT); R(c, x, y - 1, w, 11, OUT);
      R(c, x, y, w, 9, C.h1); R(c, x + 1, y, w - 2, 1, C.h2); R(c, x, y + 8, w, 1, C.h0);
      drawText(c, txt.replace('+', '+'), x + Math.round((w - tw) / 2), y + 2, '#fff8ec');
    }
    function drawArrow(c, x, y, t, col) {
      var b = anim(t) ? Math.round(Math.sin(anim(t) / 160) * 1.5) : 0;
      y += b;
      R(c, x - 4, y - 1, 9, 1, OUT); R(c, x - 5, y - 1, 1, 1, OUT);
      for (var i = 0; i < 5; i++) { R(c, x - 4 + i, y + i, 9 - i * 2, 1, i === 0 ? '#fff6c8' : col); P(c, x - 5 + i, y + i, OUT); P(c, x + 5 - i, y + i, OUT); }
      P(c, x, y + 5, OUT);
    }

    function drawDynamic(c, t) {
      var at = anim(t), now = performance.now();
      // board notes + lectern candle + chest
      drawBoardNotes(c, model.notes);
      drawChest(c, LAYOUT.chest.x, LAYOUT.chest.y, model.treasure, t);
      if (model.treasure >= 2 && at) {
        var sp = Math.floor(at / 140) % 24;
        if (sp < 4) { var sx = LAYOUT.chest.x + 3 + (Math.floor(at / 3360) * 7) % 13, sy = LAYOUT.chest.y + 2; P(c, sx, sy - 1, '#fff'); P(c, sx - 1, sy, '#fff'); P(c, sx + 1, sy, '#fff'); P(c, sx, sy + 1, '#fff'); P(c, sx, sy, C.y4); }
      }
      drawFlag(c, t);
      drawSmoke(c, t);
      drawPigeons(c, t, tod.light > 0.8);
      // worn ground under tents (decals), then y-sorted actors
      var worn = wornGround();
      tents.forEach(function (tn) { if (!isHidden(tn.q.id)) c.drawImage(worn, Math.round(tn.x - 18), Math.round(tn.y - 10)); });
      var list = [];
      tents.forEach(function (tn) { if (!isHidden(tn.q.id) && !tn.fx) list.push({ y: tn.y, d: function () { drawTent(c, tn, t); } }); });
      goblins.forEach(function (g) { if (!isHidden(g.id) && !g.fx) list.push({ y: g.y, d: function () { drawGoblin(c, g, t); } }); });
      if (moreSign) list.push({ y: moreSign.y, d: function () { drawMoreSign(c, moreSign); } });
      list.push({ y: hero.y, d: function () { drawHero(c, t); } });
      fx.forEach(function (e) { if (e.drawActor) list.push({ y: e.y || 0, d: function () { e.drawActor(c, t); } }); });
      list.sort(function (a, b) { return a.y - b.y; });
      list.forEach(function (it) { it.d(); });
      // torches flames (lit at dusk / night)
      if (tod.light > 0.15) {
        BG.torches.forEach(function (tc, i) {
          var fr = Math.floor((at + i * 131) / 120) % 3;
          if (tc.post) { R(c, tc.x - 2, tc.y - 6, 5, 5, '#ffd56b'); R(c, tc.x - 1, tc.y - 5, 3, 3, '#fff4c2'); }
          else if (tc.lantern) { R(c, tc.x - 2, tc.y - 7, 5, 6, OUT); R(c, tc.x - 1, tc.y - 6, 3, 4, '#ffd56b'); P(c, tc.x, tc.y - 5, '#fff4c2'); }
          else c.drawImage(SPR.flame[fr], tc.x - 2, tc.y - 10);
        });
        drawCampfire(c, t, true);
      } else {
        drawCampfire(c, t, false);
      }
      if (at && tod.light < 0.3) { // butterflies by day
        for (var b = 0; b < 3; b++) {
          var bt = at / 1000 + b * 3.1, bx = [150, 330, 420][b] + Math.sin(bt * 0.7) * 22 + Math.sin(bt * 1.9) * 5, by = [200, 196, 120][b] + Math.cos(bt * 0.9) * 10;
          var flap = Math.floor(at / 120 + b) % 2;
          var bc = ['#fff6e0', '#f7d84a', '#f29ac0'][b];
          if (flap) { P(c, bx - 1, by, bc); P(c, bx + 1, by, bc); } else { P(c, bx - 1, by - 1, bc); P(c, bx + 1, by - 1, bc); }
          P(c, bx, by, OUT);
        }
      }
    }
    function applyTint(c) {
      var t = tod.tint;
      if (t[0] > 252 && t[1] > 252 && t[2] > 252) return;
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = 'rgb(' + Math.round(t[0]) + ',' + Math.round(t[1]) + ',' + Math.round(t[2]) + ')';
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      if (tod.light > 0.5) { // vignette
        var a = (tod.light - 0.5) * 0.5;
        c.fillStyle = 'rgba(10,12,40,' + (a * 0.5).toFixed(3) + ')';
        c.fillRect(0, 0, W, 3); c.fillRect(0, H - 3, W, 3); c.fillRect(0, 0, 3, H); c.fillRect(W - 3, 0, 3, H);
      }
    }
    function drawLights(c, t) {
      var L = tod.light; if (L <= 0.05) return;
      var at = anim(t);
      lc.globalCompositeOperation = 'source-over';
      lc.clearRect(0, 0, W, H);
      lc.globalCompositeOperation = 'lighter';
      var gTorch = glowSprite(26, '#ff9a3c'), gWin = glowSprite(14, '#ffc75a'), gFire = glowSprite(40, '#ff8a2a'), gSmall = glowSprite(6, '#e8ff7a');
      BG.torches.forEach(function (tc, i) {
        var fl = at ? 0.82 + 0.18 * Math.sin(at / 90 + i * 1.7) * Math.sin(at / 233 + i) : 0.9;
        lc.globalAlpha = clamp(L * fl * 0.55, 0, 1);
        lc.drawImage(gTorch, tc.x - 26, tc.y - 32);
      });
      lc.globalAlpha = L * 0.5;
      BG.wins.forEach(function (w) { lc.drawImage(gWin, w.x + w.w / 2 - 14, w.y + w.h / 2 - 14); });
      var ff = at ? 0.85 + 0.15 * Math.sin(at / 70) : 0.9;
      lc.globalAlpha = L * 0.6 * ff;
      lc.drawImage(gFire, LAYOUT.campfire.x - 40, LAYOUT.campfire.y - 46);
      lc.globalAlpha = L * 0.45;
      lc.drawImage(glowSprite(10, '#ffd27a'), LAYOUT.lectern.x + 16 - 10, LAYOUT.lectern.y - 5 - 10);
      if (L > 0.6 && at) {
        fireflies.forEach(function (fy, i) {
          var x = fy.x + Math.sin(at / 1300 + fy.p) * 16, y = fy.y + Math.cos(at / 1700 + fy.p * 2) * 9;
          var on = (Math.sin(at / 400 + fy.p * 3) + 1) / 2;
          lc.globalAlpha = L * on * 0.7; lc.drawImage(gSmall, x - 6, y - 6);
          fy.cx = x; fy.cy = y; fy.on = on;
        });
      }
      lc.globalAlpha = 1;
      lc.globalCompositeOperation = 'source-over';
      // lit windows (bright fill)
      c.globalAlpha = clamp(L * 1.1, 0, 1);
      BG.wins.forEach(function (w) {
        if (w.round) { ellipse(c, w.x + 3, w.y + 3, 3.5, 3.5, C.lit); P(c, w.x + 2, w.y + 2, C.lit2); return; }
        if (w.arch) { ellipse(c, w.x + w.w / 2, w.y + w.w / 2 + 0.5, w.w / 2, w.w / 2, C.lit); R(c, w.x, w.y + w.w / 2, w.w, w.h - w.w / 2 - 1, C.lit); R(c, w.x, w.y + w.w / 2, 1, 2, C.lit2); return; }
        R(c, w.x, w.y, w.w, w.h, C.lit); R(c, w.x, w.y, Math.ceil(w.w / 2), 1, C.lit2);
        if (w.mull) { R(c, w.x + Math.floor(w.w / 2), w.y, 1, w.h, C.w0); R(c, w.x, w.y + Math.floor(w.h / 2), w.w, 1, C.w0); }
      });
      c.globalAlpha = 1;
      // add light layer
      c.globalCompositeOperation = 'lighter';
      c.drawImage(light, 0, 0);
      c.globalCompositeOperation = 'source-over';
      // fireflies + goblin eyes
      if (L > 0.6) {
        fireflies.forEach(function (fy) { if (fy.on > 0.3 && fy.cx) P(c, fy.cx, fy.cy, '#f4ff9a'); });
        goblins.forEach(function (g) {
          if (isHidden(g.id) || g.fx) return;
          var s = SPR.gob[g.tier].R, ox = Math.round(g.x - s.width / 2);
          var ph = (at + g.ph * 7) % 1100, hop = at && ph < 220 ? (ph < 110 ? -1 : -2) : 0;
          var oy = Math.round(g.y - s.height + hop), ey = g.tier === 3 ? 6 : g.tier === 2 ? 6 : 6;
          var ex = g.tier === 3 ? [6, 13] : [5, 10];
          if (g.face < 0) ex = [s.width - 1 - ex[1], s.width - 1 - ex[0]];
          var blink = at && ((at + g.ph * 13) % 3000) < 120;
          if (!blink) { P(c, ox + ex[0], oy + ey, '#fff27a'); P(c, ox + ex[1], oy + ey, '#fff27a'); }
        });
      }
    }
    function drawOverlays(c, t) {
      // badges
      drawBadge(c, LAYOUT.board.x + 22, LAYOUT.board.y - 6, model.boardBadge, t);
      drawBadge(c, LAYOUT.lectern.x + 17, LAYOUT.lectern.y - 6, model.chronicleBadge, t);
      // hover + highlight
      [hover, hl].forEach(function (tg, i) {
        if (!tg) return;
        var b = boxFor(tg); if (!b) return;
        if (i === 0 && sameT(hover, hl)) return;
        var cx = Math.round(b.x + b.w / 2), y = Math.round(b.y) - 4;
        if (tg.kind === 'goblin') {
          var g = findGob(tg.id); if (g && !isHidden(g.id)) { var s = SPR.gob[g.tier], rg = g.face < 0 ? s.ringL : s.ringR; c.drawImage(rg, Math.round(g.x - s.R.width / 2) - 1, Math.round(g.y - s.R.height) - 1); }
        }
        if (tg.kind === 'castle') y = 6;
        if (tg.kind === 'dovecote') y = 14;
        if (tg.kind === 'board' && b.big) y = 44;
        drawArrow(c, cx, Math.max(2, y - 6), t, i === 1 ? C.y2 : '#fff0c8');
      });
    }
    function findGob(id) { for (var i = 0; i < goblins.length; i++) if (goblins[i].id === String(id)) return goblins[i]; return null; }
    function findTent(id) { for (var i = 0; i < tents.length; i++) if (tents[i].q.id === String(id)) return tents[i]; return null; }

    /* ---- hero walking ---- */
    var WALK_TARGETS = { castle: [240, 132], board: [150, 176], dovecote: [372, 164], treasure: [322, 132], chronicle: [100, 180], hero: null };
    function walkTo(tx, ty, dur, cb) {
      var t = performance.now();
      hero.face = tx < hero.x ? -1 : 1;
      hero.walk = { t0: t, dur: dur, sx: hero.x, sy: hero.y, tx: tx, ty: ty, cb: cb };
      dirty = true;
    }
    function updateHero(t) {
      if (hero.walk) {
        var w = hero.walk, p = clamp((t - w.t0) / w.dur, 0, 1);
        hero.x = lerp(w.sx, w.tx, p); hero.y = lerp(w.sy, w.ty, p);
        if (p >= 1) { hero.walk = null; hero.idleAt = t; if (w.cb) w.cb(); }
      } else if (Math.abs(hero.x - LAYOUT.heroHome.x) + Math.abs(hero.y - LAYOUT.heroHome.y) > 1 && t - hero.idleAt > 4500 && !reducedMotion()) {
        var d = Math.hypot(LAYOUT.heroHome.x - hero.x, LAYOUT.heroHome.y - hero.y);
        walkTo(LAYOUT.heroHome.x, LAYOUT.heroHome.y, d / 0.035, null);
      }
    }
    function select(b) {
      var tgt = targetOf(b);
      var fire = function () { try { if (handlers.onSelect) handlers.onSelect(tgt); } catch (e) { setTimeout(function () { throw e; }); } };
      if (pendingSelect) { clearTimeout(pendingSelect); pendingSelect = null; }
      if (reducedMotion() || b.kind === 'hero' || document.hidden) { fire(); return; }
      var dest = WALK_TARGETS[b.kind];
      var tx, ty;
      if (dest) { tx = dest[0]; ty = dest[1]; } else { tx = b.x + b.w / 2; ty = b.y + b.h; }
      var dx = tx - hero.x, dy = ty - hero.y, d = Math.hypot(dx, dy);
      var maxD = 44; if (d > maxD) { tx = hero.x + dx / d * maxD; ty = hero.y + dy / d * maxD; d = maxD; }
      tx = clamp(tx, LAYOUT.court.x0, LAYOUT.court.x1); ty = clamp(ty, LAYOUT.court.y0, LAYOUT.court.y1);
      d = Math.hypot(tx - hero.x, ty - hero.y);
      if (d < 3) { fire(); return; }
      var dur = clamp(d / 0.13, 120, 380);
      walkTo(tx, ty, dur, null);
      pendingSelect = setTimeout(function () { pendingSelect = null; fire(); }, dur + 10);
    }

    /* ---- effects ---- */
    function addFx(e) {
      return new Promise(function (resolve) {
        e.t0 = performance.now(); e.resolve = resolve; e.done = false;
        e.safety = setTimeout(function () { finishFx(e); }, e.dur + 800);
        fx.push(e); dirty = true; kick();
      });
    }
    function finishFx(e) {
      if (e.done) return; e.done = true;
      clearTimeout(e.safety);
      try { if (e.end) e.end(); } catch (er) { /* ignore */ }
      var i = fx.indexOf(e); if (i >= 0) fx.splice(i, 1);
      dirty = true;
      e.resolve();
    }
    function hideId(id, kind) { hidden[String(id)] = { kind: kind, until: performance.now() + 120000 }; rebuildBoxes(); }
    function puff(c, x, y, p, n, col) {
      var base = col || '#f4efe4', shade = col ? mix(col, '#5a4630', 0.35) : '#bfb5a4';
      var a = p < 0.65 ? 1 : clamp((1 - p) / 0.35, 0, 1);
      c.globalAlpha = a;
      for (var i = 0; i < n; i++) {
        var ang = i / n * Math.PI * 2 + 0.4, r = 3 + easeOut(p) * 11;
        var px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r * 0.6 - p * 5, rr = (1 - p) * 3.6 + 1.2;
        ellipse(c, px + 0.5, py + 1, rr, rr, shade); ellipse(c, px, py, rr, rr, base);
        P(c, px - rr * 0.4, py - rr * 0.4, '#ffffff');
      }
      if (p < 0.5) { var cr = (0.5 - p) * 12 + 1; ellipse(c, x, y - p * 4 + 1, cr, cr * 0.8, shade); ellipse(c, x, y - p * 4, cr, cr * 0.8, '#ffffff'); }
      c.globalAlpha = 1;
    }
    function sparkle(c, x, y, s, col) {
      P(c, x, y, '#ffffff');
      for (var i = 1; i <= s; i++) { P(c, x - i, y, col); P(c, x + i, y, col); P(c, x, y - i, col); P(c, x, y + i, col); }
    }
    function bezier(a, b, cpt, t) { var u = 1 - t; return [u * u * a[0] + 2 * u * t * cpt[0] + t * t * b[0], u * u * a[1] + 2 * u * t * cpt[1] + t * t * b[1]]; }
    function coinFlight(from, n, delayStep) {
      var chest = [LAYOUT.chest.x + 9, LAYOUT.chest.y + 2];
      var coins = [];
      for (var i = 0; i < n; i++) {
        var a = h2(i, 7, 3) * Math.PI * 2, r = 4 + h2(i, 8, 3) * 10;
        var s = [from[0] + Math.cos(a) * r, from[1] + Math.sin(a) * r * 0.5];
        coins.push({ s: s, c: [(s[0] + chest[0]) / 2 + (h2(i, 9, 3) - 0.5) * 30, Math.min(s[1], chest[1]) - 30 - h2(i, 10, 3) * 25], d: i * delayStep });
      }
      return { coins: coins, chest: chest };
    }
    function drawCoins(c, cf, el, flightMs) {
      var arrived = 0;
      cf.coins.forEach(function (co, i) {
        var p = (el - co.d) / flightMs; if (p < 0) return;
        if (p >= 1) { arrived++; if (p < 1.3) sparkle(c, cf.chest[0] + (i % 5) - 2, cf.chest[1] - 3, 2, C.y3); return; }
        var pt = bezier(co.s, cf.chest, co.c, easeInOut(p));
        c.drawImage(SPR.coin[Math.floor(el / 70 + i) % 4], Math.round(pt[0] - 2), Math.round(pt[1] - 2));
      });
      return arrived;
    }
    var EFFECTS = {
      missiveSent: function (pl) {
        var g = pl && pl.goblinId != null ? findGob(pl.goblinId) : null;
        if (g && isHidden(g.id)) g = null;
        var start = [376, 40], tgt = g ? [g.x, g.y - 10] : [500, -30];
        var ctrl = g ? [(start[0] + tgt[0]) / 2, Math.max(4, Math.min(start[1], tgt[1]) - 44)] : [430, 6];
        var hitAt = g ? 0.62 : 2, dur = g ? 1500 : 1100;
        var e = { dur: dur, y: 999 };
        e.draw = function (c, t) {
          var el = t - e.t0, p = clamp(el / dur, 0, 1);
          var flyP = g ? Math.min(1, p / hitAt) : p;
          var pt;
          if (g && p > hitAt) { var q = (p - hitAt) / (1 - hitAt); pt = bezier(tgt, [tgt[0] < 240 ? -40 : 520, -30], [tgt[0], Math.max(0, tgt[1] - 30)], easeInOut(q)); }
          else pt = bezier(start, tgt, ctrl, easeInOut(flyP));
          var goingRight = (g && p > hitAt) ? tgt[0] >= 240 : tgt[0] > start[0];
          var s = SPR.pigeon[(Math.floor(el / 90) % 2 ? 'fly1' : 'fly2') + (goingRight ? 'R' : '')];
          c.drawImage(s, Math.round(pt[0] - s.width / 2), Math.round(pt[1] - s.height / 2));
          if (!(g && p > hitAt)) { R(c, Math.round(pt[0] - 1), Math.round(pt[1] + 3), 3, 2, C.pa2); P(c, Math.round(pt[0]), Math.round(pt[1] + 4), C.h1); }
          if (g && p > hitAt) { var q2 = (p - hitAt) / (1 - hitAt); if (q2 < 0.6) puff(c, g.x, g.y - 8, q2 / 0.6, 8); if (q2 < 0.3) sparkle(c, g.x, g.y - 10, 4, C.y3); }
          if (g && !g.fx && p > hitAt) { g.fx = true; hideId(g.id, 'goblin'); }
        };
        e.end = function () { if (g) { hideId(g.id, 'goblin'); g.fx = false; } };
        return e;
      },
      goblinSlain: function (pl) {
        var g = pl && findGob(pl.id); if (!g) return null;
        var e = { dur: 900, y: g.y };
        g.fx = true;
        e.drawActor = function (c, t) {
          var el = t - e.t0;
          if (el < 360) drawGoblin(c, g, t, { flash: el > 120 && el < 300 ? 0.9 : 0, dx: el > 120 ? Math.round(Math.sin(el / 20) * 1) : 0 });
        };
        e.draw = function (c, t) {
          var el = t - e.t0;
          if (el < 300) { // sword slash crescent sweeping across the goblin
            var p = el / 300, cx = g.x, cy = g.y - 9, a0 = -2.7, a1 = a0 + 3.4 * Math.min(1, p * 1.7), tail = Math.max(a0, a1 - 2.2);
            for (var a = tail; a <= a1; a += 0.06) {
              var k = (a - tail) / Math.max(0.01, a1 - tail), th = 1 + Math.round(k * 2);
              for (var r = 11 - th; r <= 11; r++) P(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, r === 11 ? '#ffffff' : (k > 0.6 ? '#fff6c8' : '#cfe0ff'));
            }
            if (p > 0.3 && p < 0.8) sparkle(c, Math.round(cx + Math.cos(a1) * 11), Math.round(cy + Math.sin(a1) * 9), 3, '#fff3b0');
          }
          if (el > 300) { var q = clamp((el - 300) / 560, 0, 1); puff(c, g.x, g.y - 6, q, 9); if (q < 0.4) { sparkle(c, g.x - 7, g.y - 14, 2, C.y3); sparkle(c, g.x + 6, g.y - 4, 2, C.y3); } }
          if (el > 330 && !e.hid) { e.hid = true; hideId(g.id, 'goblin'); }
        };
        e.end = function () { hideId(g.id, 'goblin'); g.fx = false; };
        return e;
      },
      goblinRetreat: function (pl) {
        var g = pl && findGob(pl.id); if (!g) return null;
        var dir = g.side === 'left' ? [-1, 0] : g.side === 'right' ? [1, 0] : g.side === 'top' ? [0, -1] : [g.x < 240 ? -1 : 1, 0.3];
        var e = { dur: 1300, y: g.y };
        g.fx = true;
        e.drawActor = function (c, t) {
          var el = t - e.t0, p = clamp(el / e.dur, 0, 1);
          var dist = 70 * easeOut(p);
          var save = g.face; g.face = dir[0] < 0 ? -1 : dir[0] > 0 ? 1 : g.face;
          drawGoblin(c, g, t, { dx: dir[0] * dist, dy: dir[1] * dist + (Math.floor(el / 110) % 2 ? -1 : 0), alpha: clamp(1.4 - p * 1.4, 0, 1) });
          g.face = save;
          if (p < 0.5 && Math.floor(el / 140) % 2) P(c, g.x + dir[0] * dist - dir[0] * 7, g.y - 1, rgba('#d9c7a0', 0.8));
        };
        e.end = function () { hideId(g.id, 'goblin'); g.fx = false; };
        return e;
      },
      coinBurst: function (pl) {
        var src = pl && pl.from ? pl.from : [240, 150];
        var cf = coinFlight(src, 14, 45), e = { dur: 1400 };
        e.draw = function (c, t) {
          var el = t - e.t0;
          if (el < 200) { var q = el / 200; for (var i = 0; i < 8; i++) { var a = i / 8 * 6.283; sparkle(c, src[0] + Math.cos(a) * q * 12, src[1] + Math.sin(a) * q * 7, 1, C.y2); } }
          drawCoins(c, cf, el, 650);
          if (el > 700) { var b = Math.floor(el / 60) % 2; if (b) sparkle(c, LAYOUT.chest.x + 9, LAYOUT.chest.y - 6, 3, C.y3); }
        };
        return e;
      },
      levelUp: function () {
        var e = { dur: 1500 };
        e.draw = function (c, t) {
          var el = t - e.t0, p = clamp(el / e.dur, 0, 1), cx = hero.x, cy = hero.y - 11;
          // light column
          var a = Math.sin(p * Math.PI) * 0.45;
          R(c, cx - 6, 0, 12, cy + 12, rgba('#fff3b0', a * 0.35)); R(c, cx - 3, 0, 6, cy + 12, rgba('#fff3b0', a * 0.5));
          for (var i = 0; i < 12; i++) {
            var ang = i / 12 * Math.PI * 2 + p * 3, r = 4 + easeOut(p) * 24;
            var x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.75;
            if (p < 0.9) sparkle(c, Math.round(x), Math.round(y), i % 2 ? 1 : 2, i % 3 ? C.y2 : '#ffffff');
          }
          if (el < 600 && Math.floor(el / 80) % 2) c.drawImage(SPR.heroWhite, Math.round(hero.x - 8), Math.round(hero.y - 23));
        };
        return e;
      },
      questWon: function (pl) {
        var tn = pl && findTent(pl.id), ghost = false;
        if (!tn) { ghost = true; tn = { q: { id: String(pl && pl.id), chapter: 4, hearts: 5, cold: false, planned: false }, x: 240, y: 262, ph: 0 }; }
        var e = { dur: 2000, y: tn.y };
        tn.fx = true;
        var cf = coinFlight([tn.x, tn.y - 14], 12, 50);
        e.drawActor = function (c, t) {
          var el = t - e.t0, p = clamp(el / e.dur, 0, 1);
          var alpha = ghost ? clamp(Math.min(el / 200, (e.dur - el) / 300), 0, 1) : clamp((e.dur - el) / 300, 0, 1);
          drawTent(c, tn, t, { raised: true, chapter: el > 350 ? 4 : tn.q.chapter, lift: -Math.round(clamp(el / 350, 0, 1) * 3), alpha: alpha });
        };
        e.draw = function (c, t) {
          var el = t - e.t0;
          if (el > 300 && el < 700) for (var i = 0; i < 6; i++) { var a = i / 6 * 6.283 + el / 200; sparkle(c, tn.x + Math.cos(a) * 10, tn.y - 30 + Math.sin(a) * 5, 1, C.y3); }
          if (el > 450) drawCoins(c, cf, el - 450, 700);
        };
        e.end = function () { tn.fx = false; if (!ghost) hideId(tn.q.id, 'quest'); };
        return e;
      },
      questLost: function (pl) {
        var tn = pl && findTent(pl.id), ghost = false;
        if (!tn) { ghost = true; tn = { q: { id: String(pl && pl.id), chapter: 1, hearts: 1, cold: true, planned: false }, x: 240, y: 262, ph: 0 }; }
        var e = { dur: 1600, y: tn.y };
        tn.fx = true;
        e.drawActor = function (c, t) {
          var el = t - e.t0;
          if (el < 300) { drawTent(c, tn, t, { alpha: ghost ? el / 300 : 1, dx: 0 }); return; }
          var p = clamp((el - 300) / 500, 0, 1), sq = 1 - easeOut(p) * 0.7 + (p < 1 ? Math.sin(p * 18) * 0.04 : 0);
          var fade = clamp((e.dur - el) / 400, 0, 1);
          drawTent(c, tn, t, { squash: sq, alpha: fade });
        };
        e.draw = function (c, t) {
          var el = t - e.t0;
          if (el > 450 && el < 1200) { var q = (el - 450) / 750; puff(c, tn.x - 8, tn.y - 2, q, 5, '#cbb48a'); puff(c, tn.x + 8, tn.y - 1, q, 5, '#cbb48a'); }
        };
        e.end = function () { tn.fx = false; if (!ghost) hideId(tn.q.id, 'quest'); };
        return e;
      },
      siegeLifted: function () {
        var e = { dur: 3600 }, rockets = [], conf = [];
        var cols = [C.y2, '#ff6b5a', '#7aa2e8', '#8de08a', '#ffffff', '#f29ac0'];
        for (var i = 0; i < 9; i++) rockets.push({ x: 50 + ((i * 0.37 + h2(i, 1, 9) * 0.2) % 1) * 380, sy: 220, ey: 26 + h2(i, 2, 9) * 70, d: i * 260, col: cols[i % cols.length] });
        for (var k = 0; k < 46; k++) conf.push({ x: h2(k, 3, 9) * W, d: h2(k, 4, 9) * 1200, v: 0.05 + h2(k, 5, 9) * 0.05, col: cols[k % cols.length], w: h2(k, 6, 9) * 6.28 });
        e.draw = function (c, t) {
          var el = t - e.t0;
          rockets.forEach(function (r) {
            var q = (el - r.d) / 500; if (q < 0) return;
            if (q < 1) { var y = lerp(r.sy, r.ey, easeOut(q)); P(c, r.x, y, '#fff3b0'); P(c, r.x, y + 1, '#ff9a2e'); P(c, r.x, y + 2, rgba('#ff9a2e', 0.5)); return; }
            var b = (el - r.d - 500) / 1100; if (b > 1) return;
            if (b < 0.12) { ellipse(c, r.x, r.ey, 7, 7, rgba('#fff6c8', 1 - b * 8)); sparkle(c, r.x, r.ey, 5, '#ffffff'); }
            for (var j = 0; j < 20; j++) {
              var a = j / 20 * Math.PI * 2 + (j % 2) * 0.1, rr = easeOut(b) * (j % 2 ? 36 : 28);
              var x = r.x + Math.cos(a) * rr, y = r.ey + Math.sin(a) * rr + b * b * 14;
              var col = b > 0.65 && j % 3 === 0 ? '#ffffff' : r.col;
              c.globalAlpha = clamp((1 - b) * 2.5, 0, 1);
              var sz = b < 0.75 ? 2 : 1;
              R(c, x, y, sz, sz, col);
              var rr2 = easeOut(Math.max(0, b - 0.08)) * (j % 2 ? 36 : 28);
              P(c, r.x + Math.cos(a) * rr2, r.ey + Math.sin(a) * rr2 + b * b * 10, rgba(col, 0.5));
              c.globalAlpha = 1;
            }
          });
          conf.forEach(function (cf) {
            var q = el - 600 - cf.d; if (q < 0) return;
            var y = -4 + q * cf.v, x = cf.x + Math.sin(q / 300 + cf.w) * 6;
            if (y > H) return;
            R(c, x, y, Math.floor(q / 150 + cf.w) % 2 ? 2 : 1, 2, cf.col);
          });
        };
        return e;
      }
    };

    /* ---- main loop ---- */
    function render(t) {
      updateHero(t);
      if (boxes.length === 0 || hero.walk) rebuildBoxes();
      f.globalCompositeOperation = 'source-over'; f.globalAlpha = 1;
      f.drawImage(BG.canvas, 0, 0);
      drawDynamic(f, t);
      applyTint(f);
      drawLights(f, t);
      fx.slice().forEach(function (e) {
        if (e.draw) e.draw(f, t);
        if (t - e.t0 >= e.dur) finishFx(e);
      });
      drawOverlays(f, t);
      if (canvas.width && canvas.height) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      }
      dirty = false;
    }
    function loop(now) {
      raf = 0;
      if (destroyed) return;
      if (document.hidden) return; // resumes on visibilitychange
      var idle = reducedMotion() && !fx.length && !hero.walk && !dirty;
      if (!idle && now - lastDraw >= 48) { lastDraw = now; render(performance.now()); }
      raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf && !destroyed && !document.hidden) raf = requestAnimationFrame(loop); }
    function onVis() {
      if (document.hidden) {
        fx.slice().forEach(finishFx); // never leave a promise hanging while hidden
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      } else { dirty = true; kick(); }
    }

    /* ---- input ---- */
    function toLogical(e) {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    }
    function onMove(e) {
      var p = toLogical(e); if (!p) return;
      var b = hit(p.x, p.y), t = targetOf(b);
      if (!sameT(t, hover)) {
        hover = t; canvas.style.cursor = t ? 'pointer' : '';
        dirty = true;
        try { if (handlers.onHover) handlers.onHover(t); } catch (er) { setTimeout(function () { throw er; }); }
      }
    }
    function onLeave() {
      if (hover) { hover = null; canvas.style.cursor = ''; dirty = true; try { if (handlers.onHover) handlers.onHover(null); } catch (er) { /* */ } }
    }
    // Fingers are wide and targets are ~15 CSS px on a phone: a touch that misses picks the nearest
    // small target within a few logical pixels.
    var TAP_SLOP = 8;
    function coarse(e) {
      if (e && e.pointerType) return e.pointerType === 'touch' || e.pointerType === 'pen';
      try { return window.matchMedia('(pointer: coarse)').matches; } catch (er) { return false; }
    }
    function hitNear(x, y, r) {
      var best = null, bd = Infinity;
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (b.big || !b.pri) continue;
        var dx = Math.max(b.x - x, 0, x - (b.x + b.w)), dy = Math.max(b.y - y, 0, y - (b.y + b.h));
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d <= r && (d < bd || (d === bd && best && b.pri > best.pri))) { best = b; bd = d; }
      }
      return best;
    }
    function onClick(e) {
      var p = toLogical(e); if (!p) return;
      var b = hit(p.x, p.y);
      if (!b && coarse(e)) b = hitNear(p.x, p.y, TAP_SLOP);
      if (!b) return;
      select(b);
    }
    function on(el, ev, fn, opt) { el.addEventListener(ev, fn, opt); listeners.push([el, ev, fn, opt]); }
    on(canvas, 'pointermove', onMove);
    on(canvas, 'pointerleave', onLeave);
    on(canvas, 'click', onClick);
    on(document, 'visibilitychange', onVis);

    /* ---- sizing ---- */
    var lastCss = 0, ro = null;
    function resize() {
      var parent = canvas.parentElement, cw = 0;
      if (parent) {
        var cs = window.getComputedStyle(parent);
        cw = parent.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      }
      if (!cw || cw < 10) cw = canvas.clientWidth || W;
      var sc = cw / W;
      if (fit !== 'fill' && sc >= 2) sc = Math.floor(sc);
      var cssW = Math.max(1, Math.floor(W * sc)), cssH = Math.max(1, Math.floor(H * sc));
      if (fit !== 'none') { canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px'; }
      var dpr = window.devicePixelRatio || 1;
      var rw = fit === 'none' ? (canvas.clientWidth || cssW) : cssW, rh = fit === 'none' ? (canvas.clientHeight || cssH) : cssH;
      var bw = Math.max(W, Math.round(rw * dpr)), bh = Math.max(H, Math.round(rh * dpr));
      // keep the backing store an integer multiple of the logical size when possible (crisper pixels)
      var k = Math.max(1, Math.round(bw / W)); if (Math.abs(k * W - bw) <= W * 0.25) { bw = k * W; bh = k * H; }
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      lastCss = cssW;
      dirty = true;
      render(performance.now());
    }
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      ro = new ResizeObserver(function () {
        var parent = canvas.parentElement; if (!parent) return;
        var w = parent.clientWidth; if (Math.abs(w - (ro._w || 0)) < 1) return; ro._w = w; resize();
      });
      try { ro.observe(canvas.parentElement); } catch (e) { ro = null; }
    }

    /* ---- public API ---- */
    var scene = {
      setModel: function (m) {
        model = normModel(m);
        // forget hidden ids that are gone from the model
        var ids = {}; model.goblins.forEach(function (g) { ids[g.id] = 1; }); model.quests.forEach(function (q) { ids[q.id] = 1; });
        Object.keys(hidden).forEach(function (k) { if (!ids[k]) delete hidden[k]; });
        layout(); rebuildBoxes(); kick();
        if (hl && !boxFor(hl)) { /* keep highlight request; it may reappear */ }
      },
      play: function (name, payload) {
        var maker = EFFECTS[name];
        if (!maker || destroyed) return Promise.resolve();
        if (reducedMotion() || document.hidden) {
          // instant end state
          if ((name === 'goblinSlain' || name === 'goblinRetreat') && payload && payload.id != null) hideId(payload.id, 'goblin');
          if (name === 'missiveSent' && payload && payload.goblinId != null) hideId(payload.goblinId, 'goblin');
          if ((name === 'questWon' || name === 'questLost') && payload && findTent(payload.id)) hideId(payload.id, 'quest');
          dirty = true; kick();
          return Promise.resolve();
        }
        var e = null;
        try { e = maker(payload || {}); } catch (er) { e = null; }
        if (!e) return Promise.resolve();
        return addFx(e);
      },
      setTimeOfDay: function (h) {
        h = +h; if (!isFinite(h)) return;
        hour = h; tod = todParams(h); dirty = true; kick();
      },
      highlight: function (t) { hl = t ? { kind: t.kind, id: t.id != null ? String(t.id) : undefined } : null; dirty = true; kick(); },
      resize: resize,
      destroy: function () {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf); raf = 0;
        if (pendingSelect) clearTimeout(pendingSelect);
        fx.slice().forEach(finishFx);
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        if (ro) { try { ro.disconnect(); } catch (e) { /* */ } }
      }
    };
    scene._debugState = function () { return { goblins: goblins.map(function (g) { return { id: g.id, x: g.x, y: g.y, tier: g.tier }; }), tents: tents.map(function (t) { return { id: t.q.id, x: t.x, y: t.y }; }), hero: { x: hero.x, y: hero.y } }; };
    layout(); rebuildBoxes();
    resize();
    kick();
    return scene;
  };

  /* =====================================================================
     10. SFX — synthesized with WebAudio
     ===================================================================== */
  var actx = null, master = null, noiseBuf = null;
  SFX.muted = false;
  function ensureCtx() {
    if (actx) return actx;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try {
      actx = new AC();
      master = actx.createGain(); master.gain.value = 0.22; master.connect(actx.destination);
      var len = Math.floor(actx.sampleRate * 1.0); noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
      var d = noiseBuf.getChannelData(0), seed = 12345;
      for (var i = 0; i < len; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = seed / 0x3fffffff - 1; }
    } catch (e) { actx = null; }
    return actx;
  }
  SFX.unlock = function () {
    var a = ensureCtx();
    if (a && a.state === 'suspended') { try { var p = a.resume(); if (p && p.catch) p.catch(function () { }); } catch (e) { /* */ } }
  };
  SFX.setMuted = function (b) { SFX.muted = !!b; };
  function env(g, t, vol, a, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(t, type, f0, f1, dur, vol, att) {
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, vol, att || 0.005, dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(t, dur, vol, ftype, f0, f1, q) {
    var s = actx.createBufferSource(), fl = actx.createBiquadFilter(), g = actx.createGain();
    s.buffer = noiseBuf; fl.type = ftype || 'bandpass'; fl.frequency.setValueAtTime(f0, t);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    fl.Q.value = q || 1; env(g, t, vol, 0.004, dur);
    s.connect(fl); fl.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  var SOUNDS = {
    click: function (t) { tone(t, 'square', 880, 660, 0.05, 0.18); },
    sword: function (t) { noise(t, 0.18, 0.5, 'bandpass', 5000, 900, 2); tone(t, 'sawtooth', 1400, 260, 0.16, 0.12); tone(t + 0.02, 'triangle', 2200, 1800, 0.09, 0.08); },
    coin: function (t) { tone(t, 'square', 988, 988, 0.07, 0.16); tone(t + 0.075, 'square', 1319, 1319, 0.28, 0.16); },
    pigeon: function (t) { for (var i = 0; i < 7; i++) noise(t + i * 0.055, 0.045, 0.32 - i * 0.03, 'bandpass', 1300 + (i % 2) * 400, 900, 1.4); tone(t + 0.42, 'sine', 420, 360, 0.18, 0.06, 0.04); },
    levelup: function (t) { [523, 659, 784, 1047, 1319].forEach(function (fq, i) { tone(t + i * 0.075, 'square', fq, fq, 0.12, 0.12); tone(t + i * 0.075, 'triangle', fq * 2, fq * 2, 0.1, 0.05); }); },
    goblin: function (t) { var o = tone(t, 'sawtooth', 620, 480, 0.22, 0.12); o.frequency.linearRampToValueAtTime(940, t + 0.08); o.frequency.linearRampToValueAtTime(520, t + 0.2); tone(t + 0.12, 'square', 780, 600, 0.08, 0.05); },
    page: function (t) { noise(t, 0.2, 0.25, 'highpass', 1800, 5200, 0.7); },
    error: function (t) { tone(t, 'sine', 140, 55, 0.25, 0.35, 0.004); noise(t, 0.08, 0.2, 'lowpass', 400, 120, 0.8); },
    fanfare: function (t) {
      var notes = [[392, 0, 0.12], [523, 0.13, 0.12], [659, 0.26, 0.12], [784, 0.39, 0.42]];
      notes.forEach(function (n) { tone(t + n[1], 'square', n[0], n[0], n[2], 0.13); tone(t + n[1], 'triangle', n[0] / 2, n[0] / 2, n[2], 0.1); });
      [523, 659, 784].forEach(function (fq) { tone(t + 0.39, 'triangle', fq, fq, 0.5, 0.06, 0.02); });
    },
    scribe: function (t) { [0, 0.09, 0.15, 0.26, 0.33].forEach(function (d, i) { noise(t + d, 0.05 + (i % 2) * 0.03, 0.22, 'highpass', 3200 + i * 300, 5200, 0.9); }); }
  };
  SFX.play = function (name) {
    if (SFX.muted) return;
    var fn = SOUNDS[name]; if (!fn) return;
    // never create the AudioContext before a user gesture (avoids autoplay warnings); SFX.unlock() does it
    if (!actx) { try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; } catch (e) { /* */ } }
    var a = ensureCtx(); if (!a) return;
    try {
      if (a.state === 'suspended') { var p = a.resume(); if (p && p.catch) p.catch(function () { }); }
      fn(a.currentTime + 0.01);
    } catch (e) { /* audio is best effort */ }
  };

  /* debug hooks for the preview page (not part of the contract) */
  ART._debug = { sprites: function () { return buildSprites(); }, tentBody: tentBody, normModel: normModel };
})();
