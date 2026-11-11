/* 데일리보카 설정 파일 — 이 파일만 고치면 됩니다 */

// 1) 구글 Apps Script를 '웹 앱'으로 배포한 뒤 받은 주소를 따옴표 안에 붙여넣으세요.
window.WN_URL = '';

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
(function () {
  var lv = ((document.title || '').match(/데일리보카\s*([A-Z])/) || [])[1] || 'B';
  var c = window.LEVEL_COLORS[lv] || window.LEVEL_COLORS.B;
  var h = c[0].replace('#', '');
  var rgb = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }).join(',');
  document.write(
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">' +
    '<link rel="stylesheet" href="theme.css">' +
    '<style>:root{--acc:' + c[0] + ';--acc2:' + c[1] + ';--accSoft:rgba(' + rgb + ',.12)}</style>'
  );
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', '#1d2340');
})();

// 주소가 비어 있으면 기록 없이(학생 기기에만 저장) 동작합니다
if (!window.WN_URL) {
  window.WN = {
    gate: function (f) { f(); },
    name: function () { return 'guest'; },
    hw: function () {},
    hwget: function () { return Promise.resolve([]); },
    add: function () {},
    flush: function () {}
  };
}
