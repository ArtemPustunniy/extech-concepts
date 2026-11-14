/*
 * Общая логика трёх концептов «ЭксТехСервис».
 * Дизайн у каждого концепта свой; здесь только поведение:
 * контакты-заглушки, кнопки звонка, статус графика работы, форма предварительного расчёта.
 * Обычный скрипт (не модуль), чтобы страницы открывались и с диска, без сервера.
 */
window.ETS = (function () {
  'use strict';

  // Клиент пока не передал телефон, почту и ссылку на MAX.
  // Когда передаст — достаточно вписать значения сюда: кнопки станут рабочими ссылками.
  var CONTACTS = { phone: null, email: null, max: null };

  var PLACEHOLDER = {
    phone: '+7 (···) ···-··-··',
    email: 'почта — уточнить у клиента',
    max: 'MAX — уточнить у клиента'
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- контакты ---------- */

  function contactHref(type) {
    var v = CONTACTS[type];
    if (!v) return null;
    if (type === 'phone') return 'tel:' + v.replace(/[^\d+]/g, '');
    if (type === 'email') return 'mailto:' + v;
    return v; // MAX — прямая ссылка на чат
  }

  function applyContacts(root) {
    $$('[data-contact]', root).forEach(function (el) {
      var type = el.getAttribute('data-contact');
      var value = CONTACTS[type];
      el.textContent = value || PLACEHOLDER[type];
      el.classList.toggle('is-placeholder', !value);
      if (!value) el.setAttribute('title', 'Данные не предоставлены — уточнить у клиента');
    });
    $$('[data-contact-link]', root).forEach(function (el) {
      var type = el.getAttribute('data-contact-link');
      var href = contactHref(type);
      if (href) {
        el.setAttribute('href', href);
        return;
      }
      el.setAttribute('href', '#request');
      el.addEventListener('click', function (e) {
        e.preventDefault();
        showNotice(type);
      });
    });
  }

  var NOTICE_TEXT = {
    phone: 'Номер телефона клиент ещё не передал — он появится здесь перед запуском сайта. Пока можно оставить заявку на расчёт.',
    email: 'Адрес почты клиент ещё не передал. Пока можно оставить заявку через форму.',
    max: 'Ссылку на MAX клиент ещё не передал. Пока можно оставить заявку через форму.'
  };

  function showNotice(type) {
    var old = $('.ets-notice');
    if (old) old.remove();
    var box = document.createElement('div');
    box.className = 'ets-notice';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Контакт уточняется');
    box.innerHTML =
      '<div class="ets-notice__box">' +
      '<p class="ets-notice__title">Контакт уточняется</p>' +
      '<p class="ets-notice__text"></p>' +
      '<div class="ets-notice__actions">' +
      '<a class="ets-notice__primary" href="#request">Оставить заявку</a>' +
      '<button type="button" class="ets-notice__close">Закрыть</button>' +
      '</div></div>';
    $('.ets-notice__text', box).textContent = NOTICE_TEXT[type] || NOTICE_TEXT.phone;
    document.body.appendChild(box);
    var close = function () { box.remove(); document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    $('.ets-notice__close', box).addEventListener('click', close);
    $('.ets-notice__primary', box).addEventListener('click', function (e) {
      e.preventDefault();
      close();
      goToForm();
    });
    $('.ets-notice__primary', box).focus();
  }

  function goToForm() {
    var form = $('#request');
    if (!form) return;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var first = $('input:not([type=hidden]), select, textarea', form);
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 450);
  }

  /* ---------- график работы: Пн–Пт 09:00–18:00, Сыктывкар (UTC+3) ---------- */

  function scheduleStatus() {
    var now = new Date();
    var local = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
    var day = local.getDay(); // 0 — вс
    var minutes = local.getHours() * 60 + local.getMinutes();
    var workday = day >= 1 && day <= 5;
    if (workday && minutes >= 540 && minutes < 1080) {
      return { open: true, text: 'Сейчас открыто · до 18:00', short: 'Открыто до 18:00' };
    }
    var next, nextShort;
    if (workday && minutes < 540) { next = 'сегодня в 09:00'; nextShort = 'до 09:00'; }
    else if (day >= 1 && day <= 4) { next = 'завтра в 09:00'; nextShort = 'до завтра 09:00'; }
    else { next = 'в понедельник в 09:00'; nextShort = 'до пн 09:00'; }
    return { open: false, text: 'Сейчас закрыто · откроемся ' + next, short: 'Закрыто ' + nextShort };
  }

  // data-schedule-status="short" — компактный вариант для шапки
  function applySchedule(root) {
    var status = scheduleStatus();
    $$('[data-schedule-status]', root).forEach(function (el) {
      el.textContent = el.getAttribute('data-schedule-status') === 'short' ? status.short : status.text;
      el.setAttribute('data-open', status.open ? 'true' : 'false');
    });
  }

  /* ---------- форма предварительного расчёта ---------- */

  function phoneDigits(value) {
    var d = value.replace(/\D/g, '');
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    return d;
  }

  function formatPhone(value) {
    var d = value.replace(/\D/g, '');
    if (d[0] === '8' || d[0] === '7') d = d.slice(1);
    d = d.slice(0, 10);
    if (!d) return '';
    var out = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) out += ') ' + d.slice(3, 6);
    if (d.length >= 6) out += '-' + d.slice(6, 8);
    if (d.length >= 8) out += '-' + d.slice(8, 10);
    return out;
  }

  var RULES = {
    name: function (v) {
      return v.trim().length >= 2 ? '' : 'Как к вам обращаться? Нужно хотя бы 2 буквы.';
    },
    phone: function (v) {
      return phoneDigits(v).length === 10 ? '' : 'Укажите телефон полностью: +7 и 10 цифр.';
    },
    choice: function (v) {
      return v ? '' : 'Выберите вариант из списка.';
    },
    consent: function (_, el) {
      return el.checked ? '' : 'Без согласия на обработку данных заявку не отправить.';
    }
  };

  function setError(form, name, message) {
    var field = form.elements[name];
    var box = $('[data-error-for="' + name + '"]', form);
    if (box) box.textContent = message;
    var nodes = field && field.length && !field.tagName ? Array.prototype.slice.call(field) : [field];
    nodes.forEach(function (n) {
      if (!n || !n.setAttribute) return;
      if (message) n.setAttribute('aria-invalid', 'true');
      else n.removeAttribute('aria-invalid');
    });
  }

  function validateField(form, el) {
    var rule = RULES[el.getAttribute('data-rule')];
    if (!rule) return true;
    var message = rule(el.value || '', el);
    setError(form, el.name, message);
    return !message;
  }

  /**
   * opts.summary(data) — текст итога заявки для экрана успеха;
   * opts.onReset() — что сделать после «Новая заявка».
   */
  function initLeadForm(form, opts) {
    opts = opts || {};
    var fields = $$('[data-rule]', form);

    $$('input[data-rule="phone"]', form).forEach(function (input) {
      input.addEventListener('input', function () {
        input.value = formatPhone(input.value);
      });
    });

    // Не ругаемся раньше времени: при уходе с поля проверяем, только если в нём что-то вводили
    // или уже была попытка отправить форму. После ошибки поле перепроверяется на каждый ввод.
    var attempted = false;
    fields.forEach(function (el) {
      var touched = false;
      var evt = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'blur';
      el.addEventListener('input', function () {
        touched = true;
        if (el.getAttribute('aria-invalid') === 'true') validateField(form, el);
      });
      el.addEventListener(evt, function () {
        if (touched || attempted || evt === 'change') validateField(form, el);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      attempted = true;
      var firstBad = null;
      fields.forEach(function (el) {
        if (!validateField(form, el) && !firstBad) firstBad = el;
      });
      if (firstBad) {
        firstBad.focus();
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      var success = $('[data-success]', form.parentNode) || $('[data-success]');
      var summary = $('[data-summary]', success);
      if (summary && opts.summary) summary.textContent = opts.summary(data);
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });

    var again = $('[data-again]', form.parentNode);
    if (again) {
      again.addEventListener('click', function () {
        attempted = false;
        form.reset();
        fields.forEach(function (el) { setError(form, el.name, ''); });
        form.hidden = false;
        $('[data-success]', form.parentNode).hidden = true;
        if (opts.onReset) opts.onReset();
        var first = $('input, select', form);
        if (first) first.focus();
      });
    }
  }

  /** Заполнить форму значениями и перейти к ней: кнопки «Рассчитать этот узел» и т. п. */
  function prefill(values) {
    var form = $('#request form') || $('form#request') || $('#request');
    if (!form || !form.elements) return goToForm();
    Object.keys(values).forEach(function (name) {
      var field = form.elements[name];
      if (field) field.value = values[name];
    });
    goToForm();
  }

  function bindPrefill(root) {
    $$('[data-prefill]', root).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        prefill(JSON.parse(el.getAttribute('data-prefill')));
      });
    });
  }

  function init() {
    applyContacts(document);
    applySchedule(document);
    bindPrefill(document);
  }

  return {
    CONTACTS: CONTACTS,
    init: init,
    initLeadForm: initLeadForm,
    prefill: prefill,
    goToForm: goToForm,
    scheduleStatus: scheduleStatus
  };
})();
