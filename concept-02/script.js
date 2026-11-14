// Концепт 02: мастер «Что сломалось?» — четыре шага, на последнем общая проверка контактов.
(function () {
  ETS.init();

  var wizard = document.querySelector('.wizard');
  var form = wizard.querySelector('form');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.step'));
  var btnBack = form.querySelector('[data-back]');
  var btnNext = form.querySelector('[data-next]');
  var btnSubmit = form.querySelector('[data-submit]');
  var current = 1;

  var STEP_CHECK = {
    1: function () { return form.elements.machine.value ? '' : 'Выберите технику — или «Отдельный агрегат».'; },
    2: function () { return form.elements.unit.value ? '' : 'Выберите узел. Если не уверены — «Не знаю».'; }
  };

  function show(n, focus) {
    current = n;
    steps.forEach(function (s) {
      var on = Number(s.getAttribute('data-step')) === n;
      s.hidden = !on;
      s.classList.toggle('is-active', on);
    });
    wizard.querySelector('[data-step-num]').textContent = n;
    wizard.querySelector('[data-progress]').style.width = (n * 25) + '%';
    btnBack.hidden = n === 1;
    btnNext.hidden = n === 4;
    btnSubmit.hidden = n !== 4;
    if (focus) {
      var first = steps[n - 1].querySelector('input:checked, input, textarea');
      if (first) first.focus({ preventScroll: true });
    }
  }

  function check(n) {
    var rule = STEP_CHECK[n];
    var message = rule ? rule() : '';
    var box = steps[n - 1].querySelector('[data-step-error]');
    if (box) box.textContent = message;
    return !message;
  }

  btnNext.addEventListener('click', function () {
    if (check(current)) show(current + 1, true);
  });
  btnBack.addEventListener('click', function () { show(current - 1, true); });

  // выбор плитки сразу ведёт дальше — меньше кликов на телефоне
  form.addEventListener('change', function (e) {
    var name = e.target.name;
    if ((name === 'machine' && current === 1) || (name === 'unit' && current === 2)) {
      check(current);
      setTimeout(function () { show(current + 1, true); }, 180);
    }
  });

  // Enter на шагах 1–3 — «Дальше», а не отправка
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && current < 4 && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      btnNext.click();
    }
  });

  ETS.initLeadForm(form, {
    summary: function (d) {
      var symptoms = Array.prototype.slice.call(form.querySelectorAll('input[name="symptom"]:checked')).map(function (i) { return i.value.toLowerCase(); });
      var text = d.name.trim() + ', ' + d.phone + ' — ' + d.machine.toLowerCase() + ', ' + d.unit.toLowerCase() + ', ' + d.place.toLowerCase();
      if (symptoms.length) text += '; заметили: ' + symptoms.join(', ');
      return text + '.';
    },
    onReset: function () { show(1, true); }
  });

  // карточки услуг заполняют мастер и переводят к следующему незаполненному шагу
  Array.prototype.slice.call(document.querySelectorAll('[data-pick]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pick = JSON.parse(btn.getAttribute('data-pick'));
      if (!form.hidden) {
        Object.keys(pick).forEach(function (k) { form.elements[k].value = pick[k]; });
        if (pick.unit && !form.elements.machine.value) form.elements.machine.value = 'Отдельный агрегат';
        show(form.elements.unit.value ? 3 : 2, false);
      }
      wizard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  show(1, false);
})();
