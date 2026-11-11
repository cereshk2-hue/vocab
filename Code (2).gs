/**
 * 데일리보카 오답관리 — 구글 시트용 Apps Script
 * 학생은 앱에서 이름 + 숫자 4자리 코드로 들어옵니다. 처음 쓰는 이름은 자동으로 등록돼요.
 * 학생 코드를 잊었을 때: '학생' 탭에서 그 학생 줄의 코드를 지우면 다음에 새 코드로 다시 등록돼요.
 * 이용을 막고 싶을 때: '학생' 탭 D열(차단)에 아무 글자나 적으세요.
 */

const PIN = '6900';          // config.js 의 WN_PIN 과 같게
const TEACHER = '선생님';     // config.js 의 TEACHER_NAME 과 같게
const BOARD_KEY = '0f1EHaRDM57z';   // 선생님 보드 열쇠 (보드 주소의 #k= 뒤와 같게)

const SH_STU = '학생';
const SH_HW = '숙제기록';
const SH_WRONG = '오답단어';
const HEAD_STU = ['이름', '코드', '처음 등록', '차단', '최근 접속'];
const HEAD_HW = ['최근 기록', '이름', '레벨', '일차', '점수', '완료일'];
const HEAD_WRONG = ['시각', '이름', '레벨', '단어', '뜻', '문제ID'];
const SH_NOTE = '오답노트';
const HEAD_NOTE = ['이름', '레벨', '남은 오답', '졸업(누적)', '7일 졸업', '별표', '최근 복습', '업데이트', '데이터(수정 금지)'];

/* 오답노트 기록 합치기: 문제마다 더 나중에 바뀐 쪽을 남김 */
function nmerge_(A, B) {
  A = A || {}; A.w = A.w || {}; A.r = A.r || {};
  ['w', 'r'].forEach(function (s) {
    const b = (B && B[s]) || {};
    Object.keys(b).forEach(function (k) {
      const a = A[s][k], x = b[k];
      if (!Array.isArray(x)) return;
      const ta = a ? a[a.length - 1] : -1, tb = x[x.length - 1];
      if (tb > ta) A[s][k] = x;
    });
  });
  return A;
}
function nsum_(M) {
  const t7 = Math.floor(Date.now() / 1000) - 7 * 86400, old = Math.floor(Date.now() / 1000) - 45 * 86400;
  let left = 0, grad = 0, g7 = 0, star = 0, last = 0;
  Object.keys(M.w).forEach(function (k) {
    const e = M.w[k];
    if (e[0] === 'w') { left++; if (e[1] > 0 && e[2] > last) last = e[2]; }
    else { grad++; if (e[2] >= t7) g7++; if (e[2] > last && e[2] > 1) last = e[2]; }
  });
  Object.keys(M.r).forEach(function (k) { if (M.r[k][0] === 1) star++; });
  return { left: left, grad: grad, g7: g7, star: star, last: last ? last * 1000 : 0 };
}
function nrow_(sh, name, level) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const v = sh.getRange(2, 1, last - 1, 2).getValues();
  for (let i = 0; i < v.length; i++) if (norm_(v[i][0]) === name && String(v[i][1]) === level) return i + 2;
  return -1;
}

/** 처음 한 번 실행: 시트 3개와 머리글을 만듭니다 */
function setup() {
  const ss = SpreadsheetApp.getActive();
  make_(ss, SH_STU, HEAD_STU);
  make_(ss, SH_HW, HEAD_HW);
  make_(ss, SH_WRONG, HEAD_WRONG);
  make_(ss, SH_NOTE, HEAD_NOTE);
  ss.getSheetByName(SH_STU).getRange('B:B').setNumberFormat('@');
  const old = ss.getSheetByName('학생명단');
  if (old && old.getLastRow() <= 1 && ss.getSheets().length > 1) ss.deleteSheet(old);
  const s1 = ss.getSheetByName('시트1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
}

function make_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#e8eafc');
    sh.setFrozenRows(1);
  }
  return sh;
}

function norm_(s) { return String(s == null ? '' : s).replace(/\s+/g, ''); }
function code_(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 이름·코드 확인. reg=true 면 처음 보는 이름을 등록 */
function auth_(ss, name, code, reg) {
  if (name === norm_(TEACHER) && code === 'T') return { ok: true };
  if (!/^[가-힣]{2,10}$/.test(name)) return { ok: false, err: 'name' };
  code = code_(code);
  if (code.length !== 4) return { ok: false, err: 'code' };
  const sh = make_(ss, SH_STU, HEAD_STU);
  const last = sh.getLastRow();
  const v = last >= 2 ? sh.getRange(2, 1, last - 1, 4).getValues() : [];
  for (let i = 0; i < v.length; i++) {
    if (norm_(v[i][0]) !== name) continue;
    const row = i + 2;
    if (String(v[i][3]).trim()) return { ok: false, err: 'blocked' };
    const saved = code_(v[i][1]);
    if (!saved) {                       // 선생님이 코드를 지운 경우 → 새 코드로 등록
      if (!reg) return { ok: false, err: 'code' };
      sh.getRange(row, 2).setValue(code);
      sh.getRange(row, 5).setValue(new Date());
      return { ok: true, isNew: true };
    }
    if (saved !== code) return { ok: false, err: 'code' };
    if (reg) sh.getRange(row, 5).setValue(new Date());
    return { ok: true };
  }
  if (!reg) return { ok: false, err: 'code' };
  const now = new Date();
  sh.appendRow([name, "'" + code, now, '', now]);
  return { ok: true, isNew: true };
}

function rows_(ss, name, n) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, n).getValues();
}
function t_(d) { return d instanceof Date ? d.getTime() : (d ? new Date(d).getTime() || 0 : 0); }

function boardData_() {
  const ss = SpreadsheetApp.getActive();
  const stu = rows_(ss, SH_STU, 5).filter(function (r) { return norm_(r[0]); }).map(function (r) {
    return { name: norm_(r[0]), code: code_(r[1]), first: t_(r[2]), blocked: !!String(r[3]).trim(), last: t_(r[4]) };
  });
  const hw = rows_(ss, SH_HW, 6).filter(function (r) { return norm_(r[1]); }).map(function (r) {
    return { t: t_(r[0]), name: norm_(r[1]), level: String(r[2]), day: Number(r[3]), score: String(r[4]), done: t_(r[5]) };
  });
  let wr = rows_(ss, SH_WRONG, 6).filter(function (r) { return norm_(r[1]); });
  if (wr.length > 5000) wr = wr.slice(-5000);
  wr = wr.map(function (r) {
    return { t: t_(r[0]), name: norm_(r[1]), level: String(r[2]), w: String(r[3]), m: String(r[4]), q: String(r[5]) };
  });
  const notes = rows_(ss, SH_NOTE, 9).filter(function (r) { return norm_(r[0]); }).map(function (r) {
    let sm = { left: Number(r[2]) || 0, grad: Number(r[3]) || 0, g7: Number(r[4]) || 0, star: Number(r[5]) || 0, last: t_(r[6]) };
    try { const M = nmerge_({ w: {}, r: {} }, JSON.parse(r[8] || '{}')); sm = nsum_(M); } catch (err) {}
    return { name: norm_(r[0]), level: String(r[1]), left: sm.left, grad: sm.grad, g7: sm.g7, star: sm.star, last: sm.last, t: t_(r[7]) };
  });
  return { ok: true, at: Date.now(), students: stu, hw: hw, wrong: wr, notes: notes, sheet: ss.getUrl() };
}

function doGet() {
  return out_({ ok: true, msg: '데일리보카 오답관리 연결됨' });
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, err: 'bad json' }); }
  if (!b || b.pin !== PIN) return out_({ ok: false, err: 'pin' });

  // 선생님 보드: 학생·숙제·오답 전체 데이터
  if (b.act === 'board') {
    if (b.key !== BOARD_KEY) return out_({ ok: false, err: 'key' });
    return out_(boardData_());
  }

  const name = norm_(b.name);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    const a = auth_(ss, name, String(b.code || ''), b.act === 'login');
    if (!a.ok) return out_(a);
    if (b.act === 'login') return out_(a);

    const now = new Date();

    // 틀린 단어 기록
    if (b.act === 'add') {
      const sh = make_(ss, SH_WRONG, HEAD_WRONG);
      const rows = (b.items || []).map(function (it) {
        const q = String(it.q || '');              // 예: 'b:3-7'  → 레벨 B, 3일 7번
        const lv = (q.split(':')[0] || '').toUpperCase();
        return [now, name, lv, it.w || '', it.m || '', q.split(':')[1] || q];
      });
      if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
      return out_({ ok: true });
    }

    // 숙제 점수 기록 (같은 학생·레벨·일차는 한 줄로 덮어쓰기)
    if (b.act === 'hw') {
      const sh = make_(ss, SH_HW, HEAD_HW);
      const level = String(b.level || ''), day = Number(b.day), score = String(b.score || '');
      const last = sh.getLastRow();
      let row = -1, old = '';
      if (last >= 2) {
        const v = sh.getRange(2, 1, last - 1, 5).getValues();
        for (let i = 0; i < v.length; i++) {
          if (norm_(v[i][1]) === name && String(v[i][2]) === level && Number(v[i][3]) === day) {
            row = i + 2; old = String(v[i][4]); break;
          }
        }
      }
      const done = score !== '진행중';
      if (row < 0) {
        sh.appendRow([now, name, level, day, "'" + score, done ? now : '']);
      } else if (done || old === '' || old === '진행중') {
        sh.getRange(row, 1, 1, 6).setValues([[now, name, level, day, "'" + score, done ? now : '']]);
      }
      return out_({ ok: true });
    }

    // 오답노트·별표 불러오기 / 저장하기 (기기 간 이어보기)
    if (b.act === 'nget' || b.act === 'nput') {
      const level = String(b.level || '').toUpperCase().slice(0, 3);
      const sh = make_(ss, SH_NOTE, HEAD_NOTE);
      const row = nrow_(sh, name, level);
      let M = { w: {}, r: {} };
      if (row > 0) { try { M = nmerge_(M, JSON.parse(sh.getRange(row, 9).getValue() || '{}')); } catch (err) {} }
      if (b.act === 'nget') return out_({ ok: true, map: M });
      M = nmerge_(M, b.map || {});
      // 45일 지난 졸업 기록은 정리 (용량 관리)
      const old = Math.floor(Date.now() / 1000) - 45 * 86400;
      Object.keys(M.w).forEach(function (k) { if (M.w[k][0] === 'g' && M.w[k][2] < old) delete M.w[k]; });
      const sm = nsum_(M);
      const vals = [name, level, sm.left, sm.grad, sm.g7, sm.star, sm.last ? new Date(sm.last) : '', now, JSON.stringify(M)];
      if (row > 0) sh.getRange(row, 1, 1, vals.length).setValues([vals]);
      else sh.appendRow(vals);
      return out_({ ok: true });
    }

    // 다른 기기에서 열었을 때 완료한 날 불러오기
    if (b.act === 'hwget') {
      const sh = ss.getSheetByName(SH_HW);
      const hw = [];
      if (sh && sh.getLastRow() >= 2) {
        sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues().forEach(function (r) {
          if (norm_(r[1]) === name) hw.push({ level: String(r[2]), day: Number(r[3]), score: String(r[4]) });
        });
      }
      return out_({ ok: true, hw: hw });
    }

    return out_({ ok: false, err: 'act' });
  } finally {
    lock.releaseLock();
  }
}
