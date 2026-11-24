/*
  夜海畫布：海浪、上升的微光氣泡、航跡、魚群、下網與金光。
  app.js 透過 Ocean.scene 告訴畫布目前在哪一幕、航行進度、下網經過的秒數。
*/
(function () {
  'use strict';

  var scene = {
    screen: 'cover',   // cover | sail | fishing | result | closed
    progress: 0,       // 0 ~ 1
    dragging: false,
    fishingT: -1,      // 下網經過秒數；-1 = 不在下網
    boatEl: null
  };

  var stage, canvas, ctx, W = 390, H = 844, dpr = 1;
  var bubbles = [], wakes = [], fish = [], sparks = [];
  var colors = null, reduced = false;

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
  }

  function readColors() {
    colors = {
      topA: cssVar('--sea-top-shallow', '#082644'), topB: cssVar('--sea-top-deep', '#031122'),
      midA: cssVar('--sea-mid-shallow', '#104370'), midB: cssVar('--sea-mid-deep', '#072447'),
      botA: cssVar('--sea-bottom-shallow', '#1e78b5'), botB: cssVar('--sea-bottom-deep', '#0c3663'),
      gold: cssVar('--gold', '#f4d03f')
    };
  }

  function mix(h1, h2, t) {
    var a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t);
    var g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t);
    var bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function resize() {
    var r = stage.getBoundingClientRect();
    W = r.width || 390; H = r.height || 844;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bubbles.length = 0;
    for (var i = 0; i < 42; i++) {
      bubbles.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.4 + 0.9,
        vy: Math.random() * 0.4 + 0.18, phase: Math.random() * 6.28, freq: Math.random() * 0.025 + 0.01 });
    }
  }

  function resetFish() {
    fish.length = 0;
    for (var i = 0; i < 16; i++) {
      fish.push({ angle: (Math.PI * 2 * i) / 16 + Math.random() * 0.35, dist: 95 + Math.random() * 115,
        size: 7 + Math.random() * 4.5, speed: 0.016 + Math.random() * 0.014, wobble: Math.random() * 6.28 });
    }
  }

  function spark(x, y, n) {
    for (var i = 0; i < n; i++) {
      sparks.push({ x: x + (Math.random() - 0.5) * 44, y: y + (Math.random() - 0.5) * 44,
        vx: (Math.random() - 0.5) * 2.2, vy: (Math.random() - 0.85) * 2.6,
        r: Math.random() * 2.4 + 1.1, a: 1, decay: 0.016 + Math.random() * 0.018 });
    }
  }

  function glowFish(x, y, angle, size, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha;
    var g = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 2.2);
    g.addColorStop(0, 'rgba(255,244,184,.95)'); g.addColorStop(0.5, 'rgba(244,208,63,.42)'); g.addColorStop(1, 'rgba(244,208,63,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, size * 2.2, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#FFF9DF';
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.quadraticCurveTo(0, -size * 0.55, -size * 0.9, 0);
    ctx.quadraticCurveTo(0, size * 0.55, size, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, 0); ctx.lineTo(-size * 1.45, -size * 0.45); ctx.lineTo(-size * 1.45, size * 0.45);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // 圓形撒網：菱形網目、網緣鉛墜
  function drawNet(cx, cy, r, alpha, spin) {
    if (r < 4) return;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(spin); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.save(); ctx.clip();
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(244,208,63,.10)'); g.addColorStop(1, 'rgba(244,208,63,.02)');
    ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = 'rgba(252,243,207,.55)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var k = -r * 2; k <= r * 2; k += 15) {
      ctx.moveTo(k - r, -r); ctx.lineTo(k + r, r);
      ctx.moveTo(k + r, -r); ctx.lineTo(k - r, r);
    }
    ctx.stroke(); ctx.restore();
    ctx.strokeStyle = 'rgba(244,208,63,.9)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var s = 0; s <= 60; s++) {
      var a = (s / 60) * 6.283, rr = r + Math.sin(a * 8 + spin * 5) * 2.4;
      if (s === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.stroke();
    ctx.fillStyle = colors.gold;
    for (var w = 0; w < 20; w++) {
      var b = (w / 20) * 6.283;
      ctx.beginPath(); ctx.arc(Math.cos(b) * r, Math.sin(b) * r, 2.6, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  var prevTs = 0;
  var callbacks = { onFlash: null, onReveal: null };
  var flashed = false, revealed = false;

  function boatCenter() {
    var br = scene.boatEl.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    return { x: br.left - sr.left + br.width / 2, y: br.top - sr.top + br.height / 2 };
  }

  function tick(ts) {
    if (!prevTs) prevTs = ts;
    var dt = Math.min((ts - prevTs) / 1000, 0.05);
    prevTs = ts;
    var sec = ts * 0.001;
    var p = scene.screen === 'sail' || scene.screen === 'fishing' ? scene.progress : (scene.screen === 'result' ? 1 : 0.2);

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, mix(colors.topA, colors.topB, p));
    grad.addColorStop(0.55, mix(colors.midA, colors.midB, p));
    grad.addColorStop(1, mix(colors.botA, colors.botB, p));
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // 破曉微光
    var dawn = ctx.createRadialGradient(W * 0.5, H * 0.14, 10, W * 0.5, H * 0.14, W * 0.75);
    dawn.addColorStop(0, 'rgba(244,208,63,' + (0.13 + p * 0.12) + ')');
    dawn.addColorStop(1, 'rgba(244,208,63,0)');
    // 用「變亮」疊加，金光不會和深藍混成橄欖色
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = dawn; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // 海浪
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 7; i++) {
      var wy = (sec * 26 + i * (H / 7)) % H;
      ctx.strokeStyle = 'rgba(148,204,240,' + (0.065 + p * 0.045) + ')';
      ctx.beginPath();
      for (var x = 0; x <= W; x += 16) {
        var off = Math.sin(x * 0.02 + sec * 1.7 + i) * 7;
        if (x === 0) ctx.moveTo(x, wy + off); else ctx.lineTo(x, wy + off);
      }
      ctx.stroke();
    }

    // 氣泡
    ctx.lineWidth = 1;
    bubbles.forEach(function (b) {
      b.phase += b.freq; b.y -= b.vy;
      if (b.y < -12) { b.y = H + 12; b.x = Math.random() * W; }
      var pulse = (Math.sin(b.phase) + 1) * 0.5;
      ctx.strokeStyle = 'rgba(185,224,248,' + (0.16 + pulse * 0.32) + ')';
      ctx.beginPath(); ctx.arc(b.x + Math.sin(b.phase) * 4, b.y, b.r * (0.85 + pulse * 0.25), 0, 6.283); ctx.stroke();
    });

    var showBoat = scene.screen === 'sail' || scene.screen === 'fishing';
    var bc = showBoat ? boatCenter() : { x: W / 2, y: H * 0.3 };

    // 航跡
    if (scene.screen === 'sail' && Math.random() < (scene.dragging ? 0.22 : 0.06)) {
      wakes.push({ x: bc.x + (Math.random() - 0.5) * 14, y: bc.y + 46, rx: 8, ry: 4, a: scene.dragging ? 0.38 : 0.24 });
    }
    for (var w = wakes.length - 1; w >= 0; w--) {
      var wk = wakes[w];
      wk.rx += 1.4; wk.ry += 0.67; wk.y += 0.6; wk.a -= 0.009;
      if (wk.a <= 0) { wakes.splice(w, 1); continue; }
      ctx.strokeStyle = 'rgba(214,234,248,' + wk.a + ')'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(wk.x, wk.y, wk.rx, wk.ry, 0, 0, 6.283); ctx.stroke();
    }

    // 魚群：越深越多光
    if ((scene.screen === 'sail' && scene.progress > 0.3) || scene.screen === 'fishing') {
      var t = scene.fishingT;
      var alpha = scene.screen === 'fishing' ? 0.95 : Math.min((scene.progress - 0.3) / 0.5, 0.85);
      fish.forEach(function (f) {
        f.wobble += 0.08;
        if (scene.screen === 'fishing' && t > 0.7) { f.dist = Math.max(14, f.dist - 80 * dt); f.angle += f.speed * 2.6; }
        else f.angle += f.speed;
        var fx = bc.x + Math.cos(f.angle) * f.dist, fy = bc.y + Math.sin(f.angle) * f.dist * 0.78;
        var fade = scene.screen === 'fishing' && t > 1.6 ? Math.max(0, 1 - (t - 1.6) / 0.3) : 1;
        glowFish(fx, fy, f.angle + Math.PI / 2 + Math.sin(f.wobble) * 0.25, f.size, alpha * fade);
      });
    }

    // 下網（約 2.4 秒）：撒網 → 魚入網 → 收網 → 大魚躍起 → 金光
    if (scene.screen === 'fishing') {
      var ft = scene.fishingT = scene.fishingT + dt;
      var R = Math.min(W * 0.34, 130), netR;
      if (ft < 0.7) netR = R * (1 - Math.pow(1 - ft / 0.7, 3));
      else if (ft < 1.5) netR = R + Math.sin(ft * 10) * 3;
      else netR = Math.max(16, R - (ft - 1.5) * 190);
      // 抵達水深之處：水面上盪開兩圈金色漣漪
      if (!reduced && ft < 1.1) {
        for (var rp = 0; rp < 2; rp++) {
          var rt = (ft - rp * 0.22) / 0.85;
          if (rt <= 0 || rt >= 1) continue;
          ctx.strokeStyle = 'rgba(252,243,207,' + (0.7 * (1 - rt)) + ')';
          ctx.lineWidth = 2 * (1 - rt) + 0.6;
          ctx.beginPath(); ctx.ellipse(bc.x, bc.y + 10, 40 + rt * W * 0.42, (40 + rt * W * 0.42) * 0.42, 0, 0, 6.283); ctx.stroke();
        }
      }
      drawNet(bc.x, bc.y, netR, ft < 1.9 ? 1 : Math.max(0, 1 - (ft - 1.9) / 0.3), ft * 0.3);
      if (ft > 0.7 && ft < 1.5 && Math.random() < 0.55) spark(bc.x, bc.y, 2);
      if (ft >= 1.5) {
        var leap = Math.min((ft - 1.5) / 0.6, 1);
        var ly = bc.y - Math.sin(leap * Math.PI) * 120;
        glowFish(bc.x, ly, -Math.PI / 2, 18 + leap * 14, 1);
        spark(bc.x, ly, 3);
      }
      if (ft >= 1.95 && !flashed) { flashed = true; if (callbacks.onFlash) callbacks.onFlash(); }
      if (ft >= 2.3 && !revealed) { revealed = true; if (callbacks.onReveal) callbacks.onReveal(); }
    }

    for (var s = sparks.length - 1; s >= 0; s--) {
      var sp = sparks[s];
      sp.x += sp.vx; sp.y += sp.vy; sp.a -= sp.decay;
      if (sp.a <= 0) { sparks.splice(s, 1); continue; }
      ctx.globalAlpha = sp.a; ctx.fillStyle = colors.gold;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(tick);
  }

  function startFishing(cb) {
    callbacks = cb || {};
    flashed = false; revealed = false;
    scene.fishingT = 0;
    scene.screen = 'fishing';
  }

  function init(opts) {
    stage = opts.stage; canvas = opts.canvas; scene.boatEl = opts.boat; reduced = !!opts.reduced;
    ctx = canvas.getContext('2d');
    readColors(); resize(); resetFish();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  }

  window.Ocean = { init: init, scene: scene, resetFish: resetFish, startFishing: startFishing, spark: spark };
})();
