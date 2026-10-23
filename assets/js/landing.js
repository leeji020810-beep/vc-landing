/* VC성형외과 시술 랜딩 — 화면 동작과 상담 접수 */
(function () {
  'use strict';
  var root = document.querySelector('.lf');
  if (!root) return;
  var proc = root.getAttribute('data-proc') || 'eye';
  var CFG = window.VC_CONFIG || {};
  var $ = function (sel, el) { return (el || root).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };
  var show = function (el, on) { if (el) el.hidden = !on; };

  /* ---------- 자가 체크: 2개 이상 선택 시 상담 버튼 ---------- */
  var checks = $$('.chk');
  var checkCta = $('[data-if="checkCta"]');
  checks.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var svg = btn.querySelector('.chk-i svg');
      if (svg) svg.setAttribute('stroke', on ? '#EDE2D6' : '#49403A');
      var n = checks.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).length;
      show(checkCta, n >= 2);
    });
  });

  /* ---------- FAQ: 한 번에 하나만 열림 ---------- */
  var faqBtns = $$('.fq');
  function setFaq(openIdx) {
    faqBtns.forEach(function (b, i) {
      var open = i === openIdx;
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      $$('[data-if="f.open:' + i + '"]').forEach(function (el) { show(el, open); });
      $$('[data-if="f.closed:' + i + '"]').forEach(function (el) { show(el, !open); });
    });
  }
  faqBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { setFaq(b.getAttribute('aria-expanded') === 'true' ? -1 : i); });
  });

  /* ---------- 상담 폼 ---------- */
  var form = $('form.form');
  if (!form) return;
  var nameEl = $('#' + proc + '-name');
  var phoneEl = $('#' + proc + '-phone');
  var fieldsets = $$('.fs', form);
  var concernBox = fieldsets[0], timeBox = fieldsets[1];
  var agreeEl = $('.agree input', form);
  var termsBtn = $('.terms-btn', form);
  var termsEl = $('[data-if="showTerms"]', form);
  var submitBtn = $('.submit', form);
  var hp = $('input[name="website"]', form);
  var err = {
    name: $('[data-if="hasErrName"]', form), phone: $('[data-if="hasErrPhone"]', form),
    concern: $('[data-if="hasErrConcern"]', form), time: $('[data-if="hasErrTime"]', form),
    agree: $('[data-if="hasErrAgree"]', form)
  };
  var st = {
    offline: $('[data-if="statusReady"]', form), invalid: $('[data-if="statusError"]', form),
    done: $('[data-if="statusDone"]', form), failed: $('[data-if="statusFailed"]', form)
  };
  function setStatus(key) { Object.keys(st).forEach(function (k) { show(st[k], k === key); }); }
  function setErr(key, msg, input) {
    var el = err[key]; if (!el) return;
    el.textContent = msg || ''; show(el, !!msg);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function fmtPhone(raw) {
    var v = String(raw || '').replace(/\D/g, '').slice(0, 11);
    if (v.length < 4) return v;
    if (v.length < 8) return v.slice(0, 3) + '-' + v.slice(3);
    return v.slice(0, 3) + '-' + v.slice(3, v.length - 4) + '-' + v.slice(v.length - 4);
  }
  phoneEl.addEventListener('input', function () { phoneEl.value = fmtPhone(phoneEl.value); setErr('phone', '', phoneEl); });
  nameEl.addEventListener('input', function () { setErr('name', '', nameEl); });

  $$('.chip input', form).forEach(function (inp) {
    inp.addEventListener('change', function () {
      if (inp.type === 'radio') {
        $$('input[name="' + inp.name + '"]', form).forEach(function (r) { r.parentElement.classList.toggle('on', r.checked); });
        setErr('time', '');
      } else {
        inp.parentElement.classList.toggle('on', inp.checked);
        setErr('concern', '');
      }
    });
  });
  agreeEl.addEventListener('change', function () { setErr('agree', '', agreeEl); });
  termsBtn.addEventListener('click', function () {
    var open = termsEl.hidden;
    show(termsEl, open);
    termsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    termsBtn.textContent = open ? '전문 닫기' : '전문 보기';
  });

  function values() {
    return {
      name: nameEl.value.trim(),
      phone: phoneEl.value.replace(/\D/g, ''),
      concerns: $$('input[type="checkbox"]', concernBox).filter(function (c) { return c.checked; }).map(function (c) { return c.value; }),
      time: ($$('input[type="radio"]', timeBox).filter(function (r) { return r.checked; })[0] || {}).value || '',
      agree: agreeEl.checked
    };
  }
  function validate(v) {
    var ok = true;
    if (!v.name) { setErr('name', '이름을 입력해주세요.', nameEl); ok = false; }
    else if (v.name.length < 2) { setErr('name', '이름을 2자 이상 입력해주세요.', nameEl); ok = false; }
    else setErr('name', '', nameEl);
    if (!v.phone) { setErr('phone', '연락처를 입력해주세요.', phoneEl); ok = false; }
    else if (!/^01[016789]\d{7,8}$/.test(v.phone)) { setErr('phone', '휴대전화 번호를 정확히 입력해주세요. (예: 010-1234-5678)', phoneEl); ok = false; }
    else setErr('phone', '', phoneEl);
    if (!v.concerns.length) { setErr('concern', '고민을 하나 이상 선택해주세요.'); ok = false; } else setErr('concern', '');
    if (!v.time) { setErr('time', '연락받기 편한 시간을 선택해주세요.'); ok = false; } else setErr('time', '');
    if (!v.agree) { setErr('agree', '개인정보 수집·이용에 동의해주셔야 상담 신청이 가능합니다.', agreeEl); ok = false; } else setErr('agree', '', agreeEl);
    return ok;
  }
  function meta() {
    var q = {};
    try { new URLSearchParams(location.search).forEach(function (val, key) { if (/^(utm_|fbclid$)/.test(key)) q[key] = val; }); } catch (e) {}
    return {
      procedure: proc,
      procedureName: proc === 'arm' ? '팔 지방흡입' : '눈밑지방재배치',
      consentText: termsEl ? termsEl.textContent : '',
      consentAt: new Date().toISOString(),
      page: location.origin + location.pathname,
      tracking: q
    };
  }

  /* 전송 어댑터 1: 병원 접수 시스템(HTTPS endpoint) */
  function sendEndpoint(payload) {
    var map = CFG.fieldMap || {};
    var body = {};
    Object.keys(payload).forEach(function (k) { body[map[k] || k] = payload[k]; });
    Object.keys(CFG.extra || {}).forEach(function (k) { body[k] = CFG.extra[k]; });
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, CFG.timeoutMs || 15000) : null;
    var opts = { method: 'POST', signal: ctrl ? ctrl.signal : undefined, headers: {} };
    if (CFG.method === 'form') {
      var fd = new URLSearchParams();
      Object.keys(body).forEach(function (k) { var v = body[k]; fd.append(k, typeof v === 'object' ? (Array.isArray(v) ? v.join(', ') : JSON.stringify(v)) : String(v)); });
      opts.body = fd; opts.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    } else {
      opts.body = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json';
    }
    return fetch(CFG.endpoint, opts).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('http_' + res.status);
      if (CFG.successCheck !== 'json-ok') return true;
      return res.json().then(function (j) { if (j && (j.ok === true || j.success === true)) return true; throw new Error('not_ok'); });
    });
  }
  /* 전송 어댑터 2: claude.ai 검토용 페이지(artifact 저장소) */
  function sendReviewStore(payload) {
    var c = window.claude;
    return Promise.all([c.use('db'), c.use('user')]).then(function (r) {
      var db = r[0], user = r[1];
      if (!db || !user) throw new Error('store_unavailable');
      return user.id().then(function (uid) {
        if (!uid) throw new Error('no_viewer');
        // 검토용 저장소: consultations/<검토자 id> 문서 아래 entries 에 1건씩 저장
        return db.collection('consultations/' + uid + '/entries').add(payload).then(function (ref) {
          return db.doc('consultations/' + uid).set({ lastSubmittedAt: payload.consentAt, lastProcedure: payload.procedure }).then(function () { return ref; }, function () { return ref; });
        });
      });
    });
  }
  function transport() {
    if (CFG.endpoint) return sendEndpoint;
    if (window.claude && typeof window.claude.use === 'function') return sendReviewStore;
    return null;
  }

  var sending = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    if (hp && hp.value) return; // 자동 입력 봇
    var v = values();
    if (!validate(v)) { setStatus('invalid'); var first = $$('[aria-invalid="true"]', form)[0]; if (first) first.focus(); return; }
    var send = transport();
    if (!send) { setStatus('offline'); return; }
    var payload = Object.assign({ name: v.name, phone: v.phone, concerns: v.concerns, contactTime: v.time, privacyConsent: true }, meta());
    sending = true; submitBtn.disabled = true; submitBtn.setAttribute('aria-busy', 'true');
    setStatus(null);
    send(payload).then(function () {
      setStatus('done');
      form.reset();
      $$('.chip', form).forEach(function (l) { l.classList.remove('on'); });
      try { if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: payload.procedureName }); } catch (x) {}
    }).catch(function () {
      setStatus('failed');
    }).then(function () {
      sending = false; submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy');
    });
  });
})();
