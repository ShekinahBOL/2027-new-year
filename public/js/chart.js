/*
  海圖引擎：畫出「由岸邊到水深之處」的等深色帶、等深線與水深數字，
  並在上面疊畫航跡、被越過的等深線、漁網與魚群。
  靜態海圖只在尺寸改變時重畫一次，動畫期間才逐格疊畫。
*/
(function () {
  'use strict';

  var THRESHOLDS = [0.14, 0.32, 0.5, 0.68, 0.86];
  var MAX_DEPTH_M = 40;

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // 固定種子的數值雜訊：每個人看到的是同一張海圖
  function makeNoise(seed) {
    var size = 64;
    var lattice = new Float32Array(size * size);
    var s = seed >>> 0;
    for (var i = 0; i < lattice.length; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      lattice[i] = s / 4294967296;
    }
    function smooth(t) { return t * t * (3 - 2 * t); }
    function at(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = smooth(x - xi), yf = smooth(y - yi);
      var x0 = ((xi % size) + size) % size, y0 = ((yi % size) + size) % size;
      var x1 = (x0 + 1) % size, y1 = (y0 + 1) % size;
      var a = lattice[y0 * size + x0], b = lattice[y0 * size + x1];
      var c = lattice[y1 * size + x0], d = lattice[y1 * size + x1];
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    }
    return function (x, y) {
      return at(x, y) * 0.65 + at(x * 2.1 + 17, y * 2.1 + 9) * 0.35;
    };
  }

  var noise = makeNoise(20270101);

  function smoothstep(a, b, x) {
    var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  /*
    水深函數：回傳 -1（陸地）～ 1（最深）
    layout = { w, h, shoreY, deepX, deepY }
  */
  function depthAt(layout, x, y) {
    var nx = x / 120, ny = y / 120;
    var wobble = (noise(nx, ny) - 0.5) * 0.36;
    var shoreLine = layout.shoreY + Math.sin(x / 70) * 10 + (noise(nx * 0.7 + 40, 3) - 0.5) * 36;
    if (y > shoreLine) return -Math.min(1, (y - shoreLine) / 24 + 0.02);
    var t = Math.min(1, Math.max(0, (shoreLine - y) / (shoreLine - layout.deepY - 20)));
    t = Math.pow(t, 0.9);
    // 越接近水深之處那一點越深，形成一個深潭
    var dx = (x - layout.deepX) / layout.w, dy = (y - layout.deepY) / layout.h;
    var basin = Math.exp(-(dx * dx * 6 + dy * dy * 9)) * 0.18;
    var d = t * 0.92 + basin + wobble * (0.3 + 0.7 * t * (1 - t) * 2);
    return Math.max(0.001, Math.min(1, d));
  }

  function bandIndex(d) {
    var i = 0;
    while (i < THRESHOLDS.length && d >= THRESHOLDS[i]) i++;
    return i;
  }

  // 等深線（marching squares），回傳每一個門檻的線段陣列
  function contours(grid, cols, rows, step, ths) {
    var out = ths.map(function () { return []; });
    for (var k = 0; k < ths.length; k++) {
      var th = ths[k], segs = out[k];
      for (var j = 0; j < rows - 1; j++) {
        for (var i = 0; i < cols - 1; i++) {
          var a = grid[j * cols + i], b = grid[j * cols + i + 1];
          var c = grid[(j + 1) * cols + i + 1], d = grid[(j + 1) * cols + i];
          var idx = (a >= th ? 8 : 0) | (b >= th ? 4 : 0) | (c >= th ? 2 : 0) | (d >= th ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var x = i * step, y = j * step;
          var top = [x + step * lerpT(a, b, th), y];
          var right = [x + step, y + step * lerpT(b, c, th)];
          var bottom = [x + step * lerpT(d, c, th), y + step];
          var left = [x, y + step * lerpT(a, d, th)];
          switch (idx) {
            case 1: case 14: segs.push(left, bottom); break;
            case 2: case 13: segs.push(bottom, right); break;
            case 3: case 12: segs.push(left, right); break;
            case 4: case 11: segs.push(top, right); break;
            case 5: segs.push(left, top, bottom, right); break;
            case 6: case 9: segs.push(top, bottom); break;
            case 7: case 8: segs.push(left, top); break;
            case 10: segs.push(left, bottom, top, right); break;
          }
        }
      }
    }
    return out;
  }

  function lerpT(a, b, th) {
    if (a === b) return 0.5;
    return Math.min(1, Math.max(0, (th - a) / (b - a)));
  }

  function strokeSegments(ctx, segs) {
    ctx.beginPath();
    for (var i = 0; i < segs.length; i += 2) {
      ctx.moveTo(segs[i][0], segs[i][1]);
      ctx.lineTo(segs[i + 1][0], segs[i + 1][1]);
    }
    ctx.stroke();
  }

  function palette() {
    return {
      bands: ['--depth-0', '--depth-1', '--depth-2', '--depth-3', '--depth-4', '--depth-5']
        .map(function (n, i) { return hexToRgb(cssVar(n, ['#3d8b96', '#2b6c84', '#1f5270', '#173d5b', '#102c47', '#0a1d33'][i])); }),
      shore: hexToRgb(cssVar('--shore', '#15231f')),
      dawn: hexToRgb(cssVar('--dawn', '#f2b65c')),
      contour: cssVar('--contour', 'rgba(206,230,238,.32)'),
      sounding: cssVar('--sounding', 'rgba(206,230,238,.5)')
    };
  }

  /*
    把整張靜態海圖畫到 ctx 上（螢幕與 1080×1920 圖卡共用）。
    回傳 { contours } 讓動畫可以重畫被越過的等深線。
  */
  function paintChart(ctx, layout, opts) {
    opts = opts || {};
    var w = layout.w, h = layout.h;
    var pal = palette();
    var res = opts.res || 1;           // 色帶取樣解析度（CSS px 為單位）
    var cols = Math.ceil(w / res), rows = Math.ceil(h / res);

    // 1. 色帶（逐點著色）
    var img = ctx.createImageData(cols, rows);
    var px = img.data;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var d = depthAt(layout, x * res, y * res);
        var c = d < 0 ? pal.shore : pal.bands[bandIndex(d)];
        var o = (y * cols + x) * 4;
        px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
      }
    }
    if (res === 1 && !opts.scale) {
      ctx.putImageData(img, 0, 0);
    } else {
      var tmp = document.createElement('canvas');
      tmp.width = cols; tmp.height = rows;
      tmp.getContext('2d').putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, cols, rows, 0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
    }

    // 2. 等深線
    var step = opts.step || 6;
    var gc = Math.ceil(w / step) + 1, gr = Math.ceil(h / step) + 1;
    var grid = new Float32Array(gc * gr);
    for (var j = 0; j < gr; j++) {
      for (var i = 0; i < gc; i++) grid[j * gc + i] = depthAt(layout, i * step, j * step);
    }
    var lines = contours(grid, gc, gr, step, THRESHOLDS);
    ctx.lineCap = 'round';
    ctx.strokeStyle = pal.contour;
    ctx.lineWidth = opts.lineWidth || 1;
    lines.forEach(function (segs) { strokeSegments(ctx, segs); });

    // 岸線（-1 與水的交界）
    var shoreSegs = contours(grid, gc, gr, step, [0])[0];
    ctx.strokeStyle = 'rgba(238,244,245,.7)';
    ctx.lineWidth = (opts.lineWidth || 1) * 2.6;
    strokeSegments(ctx, shoreSegs);

    // 3. 水深數字
    var scale = opts.fontScale || 1;
    ctx.fillStyle = pal.sounding;
    ctx.font = '500 ' + Math.round(11 * scale) + 'px ui-rounded, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var seedS = 7;
    var gap = (opts.gap || 64) * scale;
    var edge = 22 * scale;
    for (var sy = gap * 0.6; sy < h; sy += gap) {
      for (var sx = gap * 0.5; sx < w; sx += gap) {
        seedS = (seedS * 16807) % 2147483647;
        var jx = sx + ((seedS % 1000) / 1000 - 0.5) * gap * 0.7;
        seedS = (seedS * 16807) % 2147483647;
        var jy = sy + ((seedS % 1000) / 1000 - 0.5) * gap * 0.7;
        var dd = depthAt(layout, jx, jy);
        if (dd < 0.04 || seedS % 10 < 4) continue;
        if (jx < edge || jx > w - edge || jy < edge) continue;
        if (opts.avoid && opts.avoid(jx, jy)) continue;
        ctx.fillText(String(Math.max(1, Math.round(dd * MAX_DEPTH_M))), jx, jy);
      }
    }

    // 4. 破曉光：從上緣洗下來的暖光
    var dawn = ctx.createLinearGradient(0, 0, 0, h * 0.26);
    dawn.addColorStop(0, 'rgba(' + pal.dawn.join(',') + ',0.5)');
    dawn.addColorStop(0.4, 'rgba(' + pal.dawn.join(',') + ',0.16)');
    dawn.addColorStop(1, 'rgba(' + pal.dawn.join(',') + ',0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = dawn;
    ctx.fillRect(0, 0, w, h * 0.26);
    ctx.restore();

    if (opts.mark) drawMark(ctx, layout.deepX, layout.deepY, scale, 0.9);

    return { contours: lines };
  }

  // 水深之處的標記：雙圈加上十字
  function drawMark(ctx, mx, my, scale, alpha) {
    var pal = palette();
    {
      var r = 13 * scale;
      ctx.strokeStyle = 'rgba(' + pal.dawn.join(',') + ',' + alpha + ')';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(mx, my, r * 0.45, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx - r * 1.6, my); ctx.lineTo(mx - r * 1.15, my);
      ctx.moveTo(mx + r * 1.15, my); ctx.lineTo(mx + r * 1.6, my);
      ctx.moveTo(mx, my - r * 1.6); ctx.lineTo(mx, my - r * 1.15);
      ctx.moveTo(mx, my + r * 1.15); ctx.lineTo(mx, my + r * 1.6);
      ctx.stroke();
    }
  }

  /* ───────── 螢幕上的海圖 ───────── */
  var canvas, ctx, base, baseCtx, layout, lines, dpr = 1;

  function init(el) {
    canvas = el;
    ctx = canvas.getContext('2d');
    base = document.createElement('canvas');
    baseCtx = base.getContext('2d');
  }

  function setLayout(l) {
    layout = l;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(l.w * dpr);
    canvas.height = Math.round(l.h * dpr);
    base.width = canvas.width;
    base.height = canvas.height;
    baseCtx.setTransform(1, 0, 0, 1, 0, 0);
    // 色帶以 CSS 像素取樣，再放大到實際像素
    baseCtx.scale(dpr, dpr);
    var painted = paintChart(baseCtx, l, { res: 1, scale: dpr !== 1, avoid: l.avoid, gap: l.gap });
    lines = painted.contours;
    draw(null);
  }

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  // 每一格的動態疊畫；scene 為 null 時只畫靜態海圖
  function draw(scene) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(base, 0, 0);
    if (!scene) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var pal = palette();

    if (scene.markAlpha > 0) drawMark(ctx, layout.deepX, layout.deepY, 1, scene.markAlpha);

    // 被越過的等深線亮起來
    (scene.flashes || []).forEach(function (f) {
      if (f.alpha <= 0) return;
      ctx.strokeStyle = rgba(pal.dawn, f.alpha);
      ctx.lineWidth = 2;
      strokeSegments(ctx, lines[f.band]);
    });

    // 航跡
    var wake = scene.wake || [];
    if (wake.length > 1) {
      ctx.lineCap = 'round';
      for (var i = 1; i < wake.length; i++) {
        var a = wake[i - 1], b = wake[i];
        var t = i / wake.length;
        ctx.strokeStyle = 'rgba(238,244,245,' + (0.08 + t * 0.4) + ')';
        ctx.lineWidth = 1 + t * 3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    // 漁網：圓形撒網，菱形網目加上鉛墜網緣
    if (scene.net && scene.net.r > 2 && scene.net.alpha > 0) {
      var n = scene.net, mesh = 13;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.spin);
      ctx.globalAlpha = n.alpha;
      ctx.beginPath();
      ctx.arc(0, 0, n.r, 0, Math.PI * 2);
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(238,244,245,.42)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (var k = -n.r * 2; k <= n.r * 2; k += mesh) {
        ctx.moveTo(k - n.r, -n.r); ctx.lineTo(k + n.r, n.r);
        ctx.moveTo(k + n.r, -n.r); ctx.lineTo(k - n.r, n.r);
      }
      ctx.stroke();
      ctx.restore();
      // 網緣（鉛墜繩）
      ctx.strokeStyle = 'rgba(238,244,245,.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var s2 = 0; s2 <= 48; s2++) {
        var a2 = (s2 / 48) * Math.PI * 2;
        var rr = n.r + Math.sin(a2 * 7 + n.spin * 6) * 2.2;
        if (s2 === 0) ctx.moveTo(Math.cos(a2) * rr, Math.sin(a2) * rr);
        else ctx.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(16,28,40,.95)';
      for (var f2 = 0; f2 < 24; f2++) {
        var a3 = (f2 / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a3) * n.r, Math.sin(a3) * n.r, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 魚群
    (scene.fish || []).forEach(function (f) {
      if (f.alpha <= 0) return;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.heading);
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = f.gold ? rgba(pal.dawn, 1) : 'rgba(238,244,245,.9)';
      ctx.beginPath();
      ctx.moveTo(f.size, 0);
      ctx.quadraticCurveTo(0, -f.size * 0.45, -f.size * 0.8, 0);
      ctx.quadraticCurveTo(0, f.size * 0.45, f.size, 0);
      ctx.moveTo(-f.size * 0.7, 0);
      ctx.lineTo(-f.size * 1.3, -f.size * 0.4);
      ctx.lineTo(-f.size * 1.3, f.size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // 收網時的光
    if (scene.glow && scene.glow.alpha > 0) {
      var g = ctx.createRadialGradient(scene.glow.x, scene.glow.y, 0, scene.glow.x, scene.glow.y, scene.glow.r);
      g.addColorStop(0, rgba(pal.dawn, 0.55 * scene.glow.alpha));
      g.addColorStop(1, rgba(pal.dawn, 0));
      ctx.fillStyle = g;
      ctx.fillRect(scene.glow.x - scene.glow.r, scene.glow.y - scene.glow.r, scene.glow.r * 2, scene.glow.r * 2);
    }
  }

  function depthMetersAt(x, y) {
    if (!layout) return 0;
    var d = depthAt(layout, x, y);
    return d < 0 ? 0 : Math.round(d * MAX_DEPTH_M);
  }

  function bandAt(x, y) {
    if (!layout) return 0;
    var d = depthAt(layout, x, y);
    return d < 0 ? -1 : bandIndex(d);
  }

  window.DeepChart = {
    init: init,
    setLayout: setLayout,
    draw: draw,
    paintChart: paintChart,
    depthMetersAt: depthMetersAt,
    bandAt: bandAt,
    MAX_DEPTH_M: MAX_DEPTH_M
  };
})();
