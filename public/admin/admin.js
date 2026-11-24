(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    openSwitch: $('openSwitch'), openState: $('openState'),
    testSwitch: $('testSwitch'), testState: $('testState'), testAlert: $('testAlert'),
    msg: $('closedMessage'), saveMsg: $('saveMessage'), counter: $('msgCounter'),
    meta: $('meta'), loadError: $('loadError'), toast: $('toast')
  };
  var current = null;

  function api(method, body) {
    return fetch('/api/admin/settings', {
      method: method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.error || ('伺服器回應 ' + r.status));
        return data;
      });
    });
  }

  function render(data) {
    current = data.settings;
    var s = current;
    el.openSwitch.setAttribute('aria-checked', String(s.open));
    el.openState.textContent = s.open ? '開放中：大家可以領受經文' : '已關閉：沒抽過的人會看到下方文字';
    el.openState.className = 'state' + (s.open ? ' is-on' : '');

    el.testSwitch.setAttribute('aria-checked', String(s.testMode));
    el.testState.textContent = s.testMode ? '開啟中：每次都重新抽' : '關閉：一台裝置只抽一次';
    el.testState.className = 'state' + (s.testMode ? ' is-danger' : '');
    el.testAlert.hidden = !s.testMode;

    if (document.activeElement !== el.msg) el.msg.value = s.closedMessage || '';
    updateCounter();

    [el.openSwitch, el.testSwitch, el.msg].forEach(function (x) { x.disabled = false; });
    el.saveMsg.disabled = el.msg.value.trim() === (s.closedMessage || '');

    var when = s.updatedAt ? new Date(s.updatedAt).toLocaleString('zh-TW', { hour12: false }) : '尚未修改過';
    el.meta.textContent = '最後修改：' + when + (s.updatedBy ? '（' + s.updatedBy + '）' : '') + '　目前登入：' + (data.user || '');
  }

  function updateCounter() { el.counter.textContent = el.msg.value.length + ' / 200'; }

  function save(patch, okMsg, btn) {
    if (btn) btn.disabled = true;
    return api('PUT', patch).then(function (data) {
      render(data);
      toast(okMsg);
    }).catch(function (err) {
      toast('沒有存成功：' + err.message, true);
      if (btn) btn.disabled = false;
    });
  }

  el.openSwitch.addEventListener('click', function () {
    var next = !current.open;
    save({ open: next }, next ? '已開放前台，約 30～60 秒內生效' : '已關閉前台，約 30～60 秒內生效', el.openSwitch);
  });

  el.testSwitch.addEventListener('click', function () {
    var next = !current.testMode;
    save({ testMode: next }, next ? '測試模式已開啟' : '測試模式已關閉，之後的抽取都會保存', el.testSwitch);
  });

  el.msg.addEventListener('input', function () {
    updateCounter();
    el.saveMsg.disabled = !current || el.msg.value.trim() === (current.closedMessage || '');
  });

  el.saveMsg.addEventListener('click', function () {
    save({ closedMessage: el.msg.value }, '關閉文字已儲存', el.saveMsg);
  });

  var toastTimer = 0;
  function toast(msg, isError) {
    el.toast.textContent = msg;
    el.toast.classList.toggle('is-error', !!isError);
    el.toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('is-shown'); }, 3200);
  }

  api('GET').then(render).catch(function (err) {
    el.loadError.hidden = false;
    el.loadError.textContent = '讀不到設定：' + err.message;
    el.openState.textContent = el.testState.textContent = '無法讀取';
  });
})();
