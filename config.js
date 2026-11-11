/* 데일리보카 설정 파일 — 이 파일만 고치면 됩니다 */

// 1) 구글 Apps Script를 '웹 앱'으로 배포한 뒤 받은 주소를 따옴표 안에 붙여넣으세요.
window.WN_URL = 'https://script.google.com/macros/s/AKfycbxFdWbjp32WVN9Q8FfHIdXYSagbePYxfbFWombtbAB4DkHT27asKAj7_1Y6lgB9iUcJ/exec';

// 2) 선생님 이름 (주소 끝에 ?t=1 을 붙여 열면 이 이름으로 기록됩니다)
window.TEACHER_NAME = '선생님';

// 3) 비밀번호 — Apps Script 코드(Code.gs)의 PIN과 똑같이 맞춰 주세요.
window.WN_PIN = '6900';

// 4) 단계별 색 (포인트색, 보조색)
window.LEVEL_COLORS = {
  B: ['#4c5fd5', '#ffb547'],   // 인디고 + 오렌지
  H: ['#e0517a', '#ffc94d'],   // 베리 + 옐로
  M: ['#7b4fd8', '#5fd3f3']    // 퍼플 + 스카이
};

/* ↓ 고치지 마세요 ---------------------------------------------- */

/* 디자인 테마 */
(function () {
  var lv = ((document.title || '').match(/데일리보카\s*([A-Z])/) || [])[1] || 'B';
  var c = window.LEVEL_COLORS[lv] || window.LEVEL_COLORS.B;
  var h = c[0].replace('#', '');
  var rgb = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }).join(',');
  document.write(
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">' +
    '<link rel="stylesheet" href="theme.css">' +
    '<style>:root{--acc:' + c[0] + ';--acc2:' + c[1] + ';--accSoft:rgba(' + rgb + ',.12)}' +
    '#vcgate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;' +
      'background:var(--navy,#1d2340);font-family:inherit}' +
    '#vcgate .vcbox{width:100%;max-width:400px;background:var(--card,#fff);color:var(--ink,#1d2340);border-radius:26px;padding:26px 22px;' +
      'box-shadow:0 20px 50px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:12px}' +
    '#vcgate .vck{font-size:11px;letter-spacing:.22em;font-weight:800;color:var(--acc)}' +
    '#vcgate .vct{font-size:24px;font-weight:800;margin:-6px 0 6px;letter-spacing:-.02em}' +
    '#vcgate label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:700;color:var(--sub,#666)}' +
    '#vcgate input{font:inherit;font-size:18px;font-weight:600;padding:13px 14px;border:2px solid var(--line,#ddd);border-radius:16px;' +
      'background:var(--bg,#fff);color:var(--ink,#111)}' +
    '#vcgate input:focus{outline:none;border-color:var(--acc)}' +
    '#vcgate .vcnote{margin:0;font-size:13px;line-height:1.5;color:var(--sub,#666);background:var(--accSoft);padding:10px 12px;border-radius:12px}' +
    '#vcgate button{font:inherit;font-size:17px;font-weight:800;padding:14px;border:0;border-radius:999px;background:var(--acc);color:#fff;cursor:pointer}' +
    '#vcgate button:disabled{opacity:.5}' +
    '#vcm{margin:0;min-height:20px;font-size:14px;font-weight:700;color:var(--ng,#d6453d)}' +
    '#vcwho{position:absolute;top:14px;right:max(14px,calc(50% - 326px));z-index:5;font:inherit;font-size:12px;font-weight:700;' +
      'color:#fff;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:5px 11px;cursor:pointer}' +
    '</style>'
  );
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', '#1d2340');
})();

/* 이름 + 학생 코드(숫자 4자리) 로그인, 기록 전송 */
(function (W) {
  var URL_ = W.WN_URL, PIN = W.WN_PIN || '6900';
  if (!URL_) {
    W.WN = { gate: function (f) { f(); }, name: function () { return 'guest'; },
      hw: function () {}, hwget: function () { return Promise.resolve([]); },
      add: function () {}, flush: function () {} };
    return;
  }
  var TM = /[?&]t=1(&|$)/.test(W.location.search); if (TM) W.TEACHER_MODE = true;
  var QK = 'vc_q', HK = 'vc_hq', NK = 'vc_name', CK = 'vc_code';
  function g(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }
  function s(k, v) { try { W.localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { W.localStorage.removeItem(k); } catch (e) {} }
  function jq(k) { try { return JSON.parse(g(k) || '[]'); } catch (e) { return []; } }
  function name() { return TM ? (W.TEACHER_NAME || '선생님') : (g(NK) || ''); }
  function code() { return TM ? 'T' : (g(CK) || ''); }
  function post(b) {
    b.pin = PIN; b.name = b.name || name(); b.code = b.code || code();
    return fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(b), keepalive: true }).then(function (r) { return r.json(); });
  }
  var busy = false, again = false;
  function flush() {
    var n = name(), Q = jq(QK), H = jq(HK);
    if (busy) { again = true; return Promise.resolve(false); }
    if (!n || (!Q.length && !H.length)) return Promise.resolve(false);
    busy = true; var p = Promise.resolve();
    if (Q.length) {
      var items = []; Q.forEach(function (b) { items = items.concat(b); });
      p = p.then(function () { return post({ act: 'add', items: items }).then(function (r) {
        if (r && r.ok) s(QK, JSON.stringify(jq(QK).slice(Q.length))); }); });
    }
    H.forEach(function (h) {
      p = p.then(function () { return post({ act: 'hw', level: h.level, day: h.day, score: h.score }).then(function (r) {
        if (r && r.ok) s(HK, JSON.stringify(jq(HK).filter(function (x) {
          return !(x.level === h.level && x.day === h.day && x.score === h.score); }))); }); });
    });
    return p.then(function () { busy = false; if (again) { again = false; flush(); } return true; },
      function () { busy = false; again = false; return false; });
  }
  function logout() { del(NK); del(CK); W.location.reload(); }

  function chip() {
    if (TM || !name()) return;
    var el = document.createElement('button');
    el.id = 'vcwho'; el.type = 'button';
    el.textContent = name() + ' · 다른 이름';
    el.onclick = function () { if (confirm(name() + ' 학생이 아니면 다른 이름으로 들어갈게요.')) logout(); };
    document.body.appendChild(el);
    var app = document.getElementById('app');
    var sync = function () { el.style.display = (app && app.querySelector(':scope>h1')) ? '' : 'none'; };
    if (app && W.MutationObserver) new MutationObserver(sync).observe(app, { childList: true });
    sync();
  }

  function gate(cb) {
    if (name() && code()) { cb(); chip(); flush(); return; }
    var title = (document.title || '데일리보카');
    var d = document.createElement('div'); d.id = 'vcgate';
    d.innerHTML =
      '<form class="vcbox" autocomplete="off">' +
        '<div class="vck">DAILY VOCA</div><div class="vct">' + title + '</div>' +
        '<label>이름<input id="vcn" placeholder="예: 김민준" maxlength="12"></label>' +
        '<label>학생 코드<input id="vcc" inputmode="numeric" placeholder="숫자 4자리" maxlength="4"></label>' +
        '<p class="vcnote">처음이면 <b>내가 정한 숫자 4자리</b>가 학생 코드가 돼요. 다른 기기에서 들어올 때 필요하니 꼭 기억하세요!</p>' +
        '<button type="submit" id="vcb">시작하기</button><p id="vcm"></p>' +
      '</form>';
    document.body.appendChild(d);
    var f = d.querySelector('form'), b = d.querySelector('#vcb'), m = d.querySelector('#vcm'),
      ni = d.querySelector('#vcn'), ci = d.querySelector('#vcc');
    ni.value = g(NK) || '';
    f.onsubmit = function (e) {
      e.preventDefault();
      var n = (ni.value || '').replace(/\s+/g, ''), c = (ci.value || '').replace(/\D/g, '');
      if (!/^[가-힣]{2,10}$/.test(n)) { m.textContent = '이름은 띄어쓰기 없이 한글로 적어 주세요. 예: 김민준'; ni.focus(); return; }
      if (c.length !== 4) { m.textContent = '학생 코드는 숫자 딱 4자리예요. (지금 ' + c.length + '자리)'; ci.focus(); return; }
      b.disabled = true; m.textContent = '확인 중…';
      post({ act: 'login', name: n, code: c }).then(function (r) {
        if (r && r.ok) { s(NK, n); s(CK, c); d.remove(); cb(); chip(); flush(); return; }
        b.disabled = false;
        m.textContent = (r && r.err === 'code') ? '이 이름은 다른 코드로 이미 등록돼 있어요. 내 코드를 잊었다면 선생님께 물어보세요.'
          : (r && r.err === 'blocked') ? '지금은 이 이름으로 학습할 수 없어요. 선생님께 말씀드려 주세요.'
          : '이름이나 학생 코드를 확인해 주세요.';
      }, function () { b.disabled = false; m.textContent = '연결이 안 됐어요. 인터넷을 확인해 주세요.'; });
    };
    ni.focus();
  }

  W.WN = {
    add: function (items) { if (!items || !items.length) return Promise.resolve(false);
      var Q = jq(QK); Q.push(items); s(QK, JSON.stringify(Q)); return flush(); },
    hw: function (level, day, score) { var H = jq(HK); H.push({ level: level, day: day, score: score });
      s(HK, JSON.stringify(H)); return flush(); },
    hwget: function () { if (!name()) return Promise.resolve([]);
      return post({ act: 'hwget' }).then(function (r) { return (r && r.ok && r.hw) || []; }, function () { return []; }); },
    gate: gate, flush: flush, name: name, logout: logout
  };
  try { W.addEventListener('online', flush); } catch (e) {}
})(window);
