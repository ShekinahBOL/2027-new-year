/*
  前台流程：讀取開關 → 首頁／尚未開放／已抽過的經文卡 → 划船 → 下網 → 經文卡
  一台裝置第一次抽到的經文存在 localStorage，之後永遠顯示同一則（測試模式除外）。
*/
(function () {
  'use strict';

  var STORE_KEY = 'deepwater-2027:draw';
  var STATUS_TIMEOUT_MS = 4000;
  var POLL_MS = 20000;
  var DEEP_AT = 0.82;               // 進度到這裡就算抵達水深之處
  var SITE_TITLE = '2026-2027跨年禱告會・進到水深之處';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    stage: $('stage'), ocean: $('ocean'), dawn: $('dawnFlash'), testFlag: $('testFlag'), toast: $('toast'),
    cover: $('screenCover'), sail: $('screenSail'), fishing: $('screenFishing'), result: $('screenResult'), closed: $('screenClosed'),
    start: $('btnStart'),
    stageLabel: $('stageLabel'), fill: $('progressFill'),
    target: $('deepTarget'), surface: $('dragSurface'), boat: $('boat'), halo: $('lanternHalo'),
    oarL: $('oarLeft'), oarR: $('oarRight'), hint: $('sailHint'), hintText: $('hintText'),
    fishingText: $('fishingText'),
    verseText: $('verseText'), verseRef: $('verseRef'),
    save: $('btnSave'), share: $('btnShare'), copy: $('btnCopy'), replay: $('btnReplay'),
    closedMessage: $('closedMessage'),
    modal: $('saveModal'), modalHint: $('saveHint'), modalFrame: $('saveFrame'), modalClose: $('btnCloseModal')
  };

  var state = {
    settings: { open: true, testMode: false, closedMessage: '' },
    screen: null,
    verse: null,          // 目前顯示的經文 { id, ref, text }
    replaying: false,     // 再看一次：航行結束後顯示同一則
    progress: 0,
    dragging: false, startY: 0, startProgress: 0, moved: 0,
    reached: false,
    pollTimer: 0
  };

  /* ───────── 資料 ───────── */

  var versesPromise = null;
  function loadVerses() {
    if (!versesPromise) {
      versesPromise = fetch('/config/verses.json')
        .then(function (r) { if (!r.ok) throw new Error('verses ' + r.status); return r.json(); })
        .then(function (d) { return d.verses; })
        .catch(function (e) { versesPromise = null; throw e; });
    }
    return versesPromise;
  }

  // 讀不到開關時一律視為開放（現場卡住的代價比提早抽更大）
  function fetchStatus() {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, STATUS_TIMEOUT_MS);
    return fetch('/api/status', { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (s) {
        return { open: s.open !== false, testMode: s.testMode === true,
          closedMessage: typeof s.closedMessage === 'string' ? s.closedMessage : '' };
      })
      .catch(function () { return { open: true, testMode: false, closedMessage: '' }; })
      .finally(function () { clearTimeout(timer); });
  }

  function readSaved() {
    try {
      var v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (v && typeof v.id === 'number' && typeof v.text === 'string' && typeof v.ref === 'string') return v;
    } catch (e) { /* 無痕或被封鎖時視為沒抽過 */ }
    return null;
  }

  function writeSaved(v) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ id: v.id, ref: v.ref, text: v.text, at: new Date().toISOString() })); }
    catch (e) { /* 無法保存仍可顯示 */ }
  }

  function randomIndex(n) {
    if (window.crypto && crypto.getRandomValues) {
      var buf = new Uint32Array(1), limit = Math.floor(4294967296 / n) * n;
      do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
      return buf[0] % n;
    }
    return Math.floor(Math.random() * n);
  }

  /* 每則經文有自己的小字型檔，只含那幾十個字 */
  var fontCache = {};
  function verseFamily(id) { return 'Deep Verse ' + id; }
  function loadVerseFont(id) {
    if (fontCache[id]) return fontCache[id];
    var p = Promise.resolve();
    if (window.FontFace && document.fonts) {
      var face = new FontFace(verseFamily(id), 'url(/fonts/v/' + String(id).padStart(3, '0') + '.woff2) format("woff2")', { weight: '600' });
      p = face.load().then(function (f) { document.fonts.add(f); }).catch(function () {});
    }
    fontCache[id] = p;
    return p;
  }

  /* ───────── 畫面 ───────── */

  function show(name) {
    state.screen = name;
    Ocean.scene.screen = name;
    [['cover', el.cover], ['sail', el.sail], ['fishing', el.fishing], ['result', el.result], ['closed', el.closed]]
      .forEach(function (p) { p[1].classList.toggle('is-active', p[0] === name); });
    el.boat.classList.toggle('is-visible', name === 'sail' || name === 'fishing');
    if (name === 'sail') el.boat.classList.remove('is-fading');
    if (name !== 'cover') el.cover.classList.remove('is-entering');
    if (name !== 'closed') stopPolling();
  }

  function applyTestFlag() { el.testFlag.hidden = !state.settings.testMode; }

  function showClosed() {
    el.closedMessage.textContent = state.settings.closedMessage || '禱告會倒數後開放領受經文，請稍候。';
    show('closed');
    startPolling();
  }

  function startPolling() {
    stopPolling();
    state.pollTimer = setTimeout(function () {
      fetchStatus().then(function (s) {
        state.settings = s; applyTestFlag();
        if (s.open) show('cover');
        else { if (s.closedMessage) el.closedMessage.textContent = s.closedMessage; startPolling(); }
      });
    }, POLL_MS + Math.round((Math.random() - 0.5) * 6000));
  }
  function stopPolling() { clearTimeout(state.pollTimer); state.pollTimer = 0; }

  function renderVerse(v) {
    state.verse = v;
    el.verseText.textContent = v.text;
    el.verseRef.textContent = v.ref;
    var len = v.text.length;
    el.verseText.classList.toggle('is-long', len > 60);
    el.verseText.classList.toggle('is-medium', len > 38 && len <= 60);
    var fam = '"' + verseFamily(v.id) + '", var(--font-serif)';
    el.verseText.style.fontFamily = fam;
    el.verseRef.style.fontFamily = fam;
  }

  function swapCaption(text) {
    if (REDUCED) { el.fishingText.textContent = text; return; }
    el.fishingText.style.opacity = '0';
    setTimeout(function () { el.fishingText.textContent = text; el.fishingText.style.opacity = '1'; }, 180);
  }

  // from：光的起點（相對於舞台的座標），經文卡從這一點展開
  function showResult(v, reveal, from) {
    renderVerse(v);
    el.result.classList.remove('is-revealing');
    show('result');
    if (reveal) {
      var card = el.result.querySelector('.blessing-card');
      var cr = card.getBoundingClientRect(), sr = el.stage.getBoundingClientRect();
      var fx = from ? from.x : sr.width / 2, fy = from ? from.y : cr.top - sr.top;
      card.style.setProperty('--rise-x', Math.round(fx - (cr.left - sr.left)) + 'px');
      card.style.setProperty('--rise-y', Math.round(fy - (cr.top - sr.top)) + 'px');
      void el.result.offsetWidth;
      el.result.classList.add('is-revealing');
    }
    Ocean.scene.progress = 1;
  }

  /* ───────── 划船 ───────── */

  function setProgress(val) {
    state.progress = Math.max(0, Math.min(1, val));
    Ocean.scene.progress = state.progress;
    var pct = Math.round(state.progress * 100);
    el.boat.style.bottom = (14 + state.progress * 54) + '%';
    el.halo.style.transform = 'translateX(-50%) scale(' + (1 + state.progress * 0.7) + ')';
    el.fill.style.width = pct + '%';
    el.stageLabel.textContent = pct < 25 ? '淺灘・預備啟航' : pct < 55 ? '近海・憑信前行' : pct < 82 ? '深海・破浪向前' : '水深之處・預備下網';
  }

  var oarPhase = 0;
  function rowOars(step) {
    oarPhase += step * 0.16;
    var deg = Math.sin(oarPhase) * 18;
    el.oarL.setAttribute('transform', 'rotate(' + deg + ' 30 68)');
    el.oarR.setAttribute('transform', 'rotate(' + -deg + ' 66 68)');
  }

  var glideId = 0;
  function glide() {
    if (state.reached) return;
    cancelAnimationFrame(glideId);
    (function step() {
      if (state.reached) return;
      rowOars(3);
      setProgress(state.progress + (REDUCED ? 0.08 : 0.026));
      if (state.progress >= DEEP_AT) reachDeep();
      else glideId = requestAnimationFrame(step);
    })();
  }

  function openSail(replay) {
    cancelAnimationFrame(glideId);
    state.replaying = !!replay;
    state.reached = false; state.dragging = false;
    el.dawn.classList.remove('is-on');
    el.hint.style.opacity = '1';
    el.hintText.textContent = '按住小船往上划（或點一下水深之處）';
    el.fishingText.textContent = '在水深之處下網⋯';
    el.fishingText.style.opacity = '1';
    Ocean.resetFish();
    Ocean.scene.fishingT = -1;
    setProgress(0);
    show('sail');
  }

  function reachDeep() {
    if (state.reached) return;
    state.reached = true; state.dragging = false; Ocean.scene.dragging = false;
    cancelAnimationFrame(glideId);
    setProgress(1);
    el.hint.style.opacity = '0';

    // 抵達水深之處的那一刻抽出經文（再看一次則沿用同一則），並立刻存起來
    var pick = state.replaying && state.verse && !state.settings.testMode
      ? Promise.resolve(state.verse)
      : loadVerses().then(function (list) {
          var p = list[randomIndex(list.length)];
          var v = { id: p.id, ref: p.ref, text: p.text };
          if (!state.settings.testMode) writeSaved(v);
          return v;
        });

    pick.then(function (v) {
      loadVerseFont(v.id);
      show('fishing');
      var texts = [[0.75, '恩典豐盛！魚群正游入網中⋯'], [1.55, '領受神為你預備的新年祝福']];
      texts.forEach(function (pair) { setTimeout(function () { if (state.screen === 'fishing') swapCaption(pair[1]); }, pair[0] * 1000); });
      Ocean.startFishing({
        onFlash: function () { el.dawn.classList.add('is-on'); },
        onReveal: function () {
          var stageRect = el.stage.getBoundingClientRect(), b = el.boat.getBoundingClientRect();
          el.boat.classList.add('is-fading');
          showResult(v, true, { x: b.left + b.width / 2 - stageRect.left, y: b.top + b.height / 2 - stageRect.top });
          if (navigator.vibrate) { try { navigator.vibrate(40); } catch (e) { /* 不支援 */ } }
          setTimeout(function () { el.dawn.classList.remove('is-on'); }, 260);
        }
      });
    }).catch(function () {
      state.reached = false;
      el.hint.style.opacity = '1';
      setProgress(0.6);
      toast('網路不太穩，請再划一次');
    });
  }

  function dragBegin(y) {
    if (state.screen !== 'sail' || state.reached) return;
    cancelAnimationFrame(glideId);
    state.dragging = true; Ocean.scene.dragging = true;
    state.startY = y; state.startProgress = state.progress; state.moved = 0;
  }
  function dragMove(y) {
    if (!state.dragging || state.reached) return;
    var dy = state.startY - y;
    state.moved = Math.max(state.moved, Math.abs(dy));
    var span = Math.max(el.stage.clientHeight * 0.46, 220);
    rowOars(Math.abs(dy) * 0.14 + 1.5);
    setProgress(state.startProgress + dy / span);
    if (state.progress >= DEEP_AT) reachDeep();
  }
  function dragEnd() {
    if (!state.dragging) return;
    state.dragging = false; Ocean.scene.dragging = false;
    el.oarL.removeAttribute('transform'); el.oarR.removeAttribute('transform');
    if (state.reached) return;
    if (state.moved < 8) glide();                     // 只是點一下：自動划過去
    else if (state.progress > 0.1) el.hintText.textContent = '繼續往上划，就快到水深之處了';
  }

  [el.surface, el.boat].forEach(function (t) {
    t.addEventListener('touchstart', function (e) { if (e.touches.length) dragBegin(e.touches[0].clientY); }, { passive: true });
    t.addEventListener('touchmove', function (e) { if (e.touches.length) { e.preventDefault(); dragMove(e.touches[0].clientY); } }, { passive: false });
    t.addEventListener('touchend', dragEnd);
    t.addEventListener('touchcancel', dragEnd);
    t.addEventListener('mousedown', function (e) { dragBegin(e.clientY); });
  });
  window.addEventListener('mousemove', function (e) { if (state.dragging) dragMove(e.clientY); });
  window.addEventListener('mouseup', function () { if (state.dragging) dragEnd(); });
  el.target.addEventListener('click', function () { if (state.screen === 'sail' && !state.reached) glide(); });

  /* ───────── 祝福圖卡（1080×1920） ───────── */

  var logoMark = new Image(); logoMark.src = '/assets/logo-mark.png';
  var logoFull = new Image(); logoFull.src = '/assets/logo-full.png';
  function imgReady(img) {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise(function (res) { img.onload = res; img.onerror = res; });
  }

  var NO_LINE_START = '，。、；：！？」』）〉》．,.;:!?)';
  function wrapCJK(c, text, maxW) {
    var lines = [], cur = '';
    Array.from(text).forEach(function (ch) {
      if (c.measureText(cur + ch).width > maxW && cur) {
        if (NO_LINE_START.indexOf(ch) >= 0) {
          var chars = Array.from(cur), last = chars.pop();
          lines.push(chars.join('')); cur = last + ch;
        } else { lines.push(cur); cur = ch; }
      } else cur += ch;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function buildWallpaper(v) {
    var CW = 1080, CH = 1920;
    var off = document.createElement('canvas'); off.width = CW; off.height = CH;
    var c = off.getContext('2d');
    var serif = '"Deep Serif", "Noto Serif TC", serif';
    var vfont = '"' + verseFamily(v.id) + '", ' + serif;

    return Promise.all([loadVerseFont(v.id), imgReady(logoMark), imgReady(logoFull),
      document.fonts ? document.fonts.load('900 40px "Deep Serif"') : null]).then(function () {
      // 背景：夜海漸層、破曉光、氣泡、海浪（固定種子，每次相同）
      var bg = c.createLinearGradient(0, 0, 0, CH);
      bg.addColorStop(0, '#04152b'); bg.addColorStop(0.52, '#0a2d52'); bg.addColorStop(1, '#15578a');
      c.fillStyle = bg; c.fillRect(0, 0, CW, CH);
      var halo = c.createRadialGradient(CW / 2, CH * 0.5, 30, CW / 2, CH * 0.5, 640);
      halo.addColorStop(0, 'rgba(244,208,63,0.16)'); halo.addColorStop(1, 'rgba(244,208,63,0)');
      c.fillStyle = halo; c.fillRect(0, 0, CW, CH);
      var seed = 7;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (var i = 0; i < 46; i++) {
        c.strokeStyle = 'rgba(185,224,248,' + (0.15 + rnd() * 0.25) + ')'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(110 + rnd() * (CW - 220), 140 + rnd() * (CH - 280), rnd() * 4 + 1.5, 0, 6.283); c.stroke();
      }
      for (var w = 0; w < 4; w++) {
        c.strokeStyle = 'rgba(148,204,240,' + (0.14 - w * 0.025) + ')'; c.lineWidth = 3;
        c.beginPath();
        for (var x = 0; x <= CW; x += 20) { var y = 1700 + w * 38 + Math.sin(x * 0.008 + w) * 16; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
        c.stroke();
      }

      // 金色雙框
      c.strokeStyle = 'rgba(244,208,63,0.6)'; c.lineWidth = 3; roundRect(c, 72, 96, CW - 144, CH - 192, 40); c.stroke();
      c.strokeStyle = 'rgba(244,208,63,0.26)'; c.lineWidth = 1.5; roundRect(c, 94, 118, CW - 188, CH - 236, 30); c.stroke();

      // 教會 logo
      var lw = 420, lh = Math.round(lw * (logoFull.naturalHeight || 189) / (logoFull.naturalWidth || 720));
      c.fillStyle = '#ffffff'; roundRect(c, CW / 2 - lw / 2 - 30, 180, lw + 60, lh + 36, 22); c.fill();
      if (logoFull.naturalWidth) c.drawImage(logoFull, CW / 2 - lw / 2, 198, lw, lh);

      // 標題
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = '#F4D03F'; c.font = '600 36px ' + serif;
      c.fillText('2026-2027跨年禱告會', CW / 2, 400);
      c.fillStyle = '#FFFDF7'; c.font = '900 80px ' + serif;
      c.fillText('進到水深之處', CW / 2, 500);
      c.strokeStyle = 'rgba(244,208,63,0.6)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(CW / 2 - 150, 552); c.lineTo(CW / 2 + 150, 552); c.stroke();
      c.fillStyle = 'rgba(244,208,63,0.75)'; c.font = '600 22px ' + serif; c.fillText('❖', CW / 2, 560);

      // 經文
      var len = v.text.length;
      var fs = len > 60 ? 48 : (len > 38 ? 54 : 62);
      var lhgt = Math.round(fs * 1.75);
      c.font = '600 ' + fs + 'px ' + vfont;
      var lines = wrapCJK(c, v.text, CW - 280);
      var blockH = (lines.length - 1) * lhgt;
      var centerY = 930;
      var yy = centerY - blockH / 2 + fs * 0.35;
      c.fillStyle = '#FFFDF7';
      lines.forEach(function (line) { c.fillText(line, CW / 2, yy); yy += lhgt; });

      // 出處
      var refY = Math.min(centerY + blockH / 2 + 120, 1380);
      c.font = '600 38px ' + vfont;
      var refW = c.measureText(v.ref).width + 90;
      c.fillStyle = 'rgba(244,208,63,0.16)'; c.strokeStyle = 'rgba(244,208,63,0.65)'; c.lineWidth = 2.5;
      roundRect(c, CW / 2 - refW / 2, refY - 38, refW, 76, 38); c.fill(); c.stroke();
      c.fillStyle = '#F4D03F'; c.fillText(v.ref, CW / 2, refY + 13);

      // 底部：標誌與祝福
      var badgeY = 1530;
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(CW / 2, badgeY, 44, 0, 6.283); c.fill();
      if (logoMark.naturalWidth) c.drawImage(logoMark, CW / 2 - 34, badgeY - 34, 68, 68);
      c.fillStyle = 'rgba(255,253,247,0.92)'; c.font = '600 36px ' + serif;
      c.fillText('願神在 2027 新的一年賜福與你', CW / 2, 1628);
      c.fillStyle = 'rgba(244,208,63,0.8)'; c.font = '600 28px ' + serif;
      c.fillText('「把船開到水深之處，下網打魚。」路加福音 5:4', CW / 2, 1690);

      return new Promise(function (res, rej) { off.toBlob(function (b) { b ? res(b) : rej(new Error('toBlob')); }, 'image/png'); });
    });
  }

  var wallCache = null;
  function wallpaperBlob() {
    var v = state.verse;
    if (wallCache && wallCache.id === v.id) return wallCache.p;
    var p = buildWallpaper(v);
    wallCache = { id: v.id, p: p };
    p.catch(function () { wallCache = null; });
    return p;
  }

  function fileName() { return '進到水深之處_' + state.verse.ref.replace(/\s+/g, '') + '.png'; }
  var inApp = /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(navigator.userAgent);

  function onSave() {
    if (!state.verse) return;
    el.save.disabled = true;
    var saveLabel = el.save.lastChild.textContent;
    el.save.lastChild.textContent = ' 產生圖卡中⋯';
    wallpaperBlob().then(function (blob) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.className = 'save-img'; img.alt = '你的新年祝福經文圖卡'; img.src = url;
      el.modalFrame.replaceChildren(img);
      el.modal.hidden = false;
      el.modalClose.focus();
      el.modalHint.innerHTML = inApp
        ? '祝福圖卡已產生！<br>請「長按下方圖片」儲存到相簿'
        : '祝福圖卡已下載！<br>手機上也可以「長按下方圖片」儲存到相簿';
      if (!inApp) {
        var a = document.createElement('a');
        a.href = url; a.download = fileName();
        document.body.appendChild(a); a.click(); a.remove();
      }
    }).catch(function () { toast('圖卡產生失敗，請直接截圖保存'); })
      .finally(function () { el.save.disabled = false; el.save.lastChild.textContent = saveLabel; });
  }
  function closeModal() { el.modal.hidden = true; el.save.focus(); }

  function verseMessage() {
    var v = state.verse;
    return '【' + SITE_TITLE + '】\n「' + v.text + '」\n— ' + v.ref + '\n\n願神在 2027 新的一年賜福與你！';
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); ok ? res() : rej(new Error('copy'));
    });
  }

  function onCopy() {
    if (!state.verse) return;
    copyText(verseMessage()).then(function () { toast('已複製經文，可以貼上分享！'); })
      .catch(function () { toast('無法自動複製，請長按經文選取'); });
  }

  function onShare() {
    if (!state.verse) return;
    var text = verseMessage();
    if (!navigator.share) { onCopy(); return; }
    el.share.disabled = true;
    wallpaperBlob().then(function (blob) {
      var file = new File([blob], fileName(), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text });
      return navigator.share({ title: SITE_TITLE, text: text, url: location.origin });
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;
      return navigator.share({ title: SITE_TITLE, text: text, url: location.origin })
        .catch(function (e2) { if (e2 && e2.name !== 'AbortError') onCopy(); });
    }).finally(function () { el.share.disabled = false; });
  }

  var toastTimer = 0;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('is-shown'); }, 2400);
  }

  /* ───────── 啟動 ───────── */

  function boot() {
    Ocean.init({ stage: el.stage, canvas: el.ocean, boat: el.boat, reduced: REDUCED });
    loadVerses().catch(function () {});

    fetchStatus().then(function (s) {
      state.settings = s;
      applyTestFlag();
      var saved = s.testMode ? null : readSaved();
      if (saved) {
        // 等經文字型（最多 1.2 秒）再展開，避免字型替換時跳動
        var ready = loadVerseFont(saved.id);
        Promise.race([ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(function () { showResult(saved, true); });
        ready.then(function () { setTimeout(wallpaperBlob, 600); });
      } else if (!s.open) {
        showClosed();
      } else {
        if (!REDUCED) el.cover.classList.add('is-entering');
        show('cover');
      }
    });

    el.start.addEventListener('click', function () { openSail(false); });
    el.replay.addEventListener('click', function () { openSail(true); });
    el.save.addEventListener('click', onSave);
    el.copy.addEventListener('click', onCopy);
    el.share.addEventListener('click', onShare);
    el.modalClose.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !el.modal.hidden) closeModal(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
