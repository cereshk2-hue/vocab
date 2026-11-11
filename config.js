/* 데일리보카 설정 파일 — 이 파일만 고치면 됩니다 */

// 1) 구글 Apps Script를 '웹 앱'으로 배포한 뒤 받은 주소를 따옴표 안에 붙여넣으세요.
//    예: 'https://script.google.com/macros/s/AKfy.../exec'
window.WN_URL = '';

// 2) 선생님 이름 (주소 끝에 ?t=1 을 붙여 열면 이 이름으로 기록됩니다)
window.TEACHER_NAME = '선생님';

// 3) 비밀번호 — Apps Script 코드(Code.gs)의 PIN과 똑같이 맞춰 주세요.
window.WN_PIN = '6900';

/* ↓ 고치지 마세요: 주소가 비어 있으면 기록 없이(학생 기기에만 저장) 동작합니다 */
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
