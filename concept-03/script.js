// Концепт 03: интерактивный чертёж — позиции узлов с описанием и расчётом по узлу.
(function () {
  ETS.init();

  // Общие сведения об узлах и типовых признаках неисправности — не данные о компании.
  var UNITS = {
    engine: {
      pos: 1,
      title: 'Двигатель внутреннего сгорания',
      text: 'Силовая установка машины: от него работают гидронасос и все системы.',
      signs: 'тяжёлый пуск, дым, потеря мощности, перегрев.',
      value: 'Двигатель'
    },
    pump: {
      pos: 2,
      title: 'Гидравлический насос',
      text: 'Создаёт давление в гидросистеме — от него зависят сила и скорость рабочих движений.',
      signs: 'медленная работа стрелы и рукояти, шум, нагрев масла.',
      value: 'Гидравлический насос'
    },
    valve: {
      pos: 3,
      title: 'Гидрораспределитель',
      text: 'Направляет поток масла к цилиндрам и гидромоторам по командам оператора.',
      signs: 'рывки, не работает одна из секций, оборудование опускается само.',
      value: 'Гидрораспределитель'
    },
    drive: {
      pos: 4,
      title: 'Редуктор хода',
      text: 'Передаёт усилие гидромотора на гусеницу и отвечает за движение машины.',
      signs: 'гул при движении, течь масла, машину уводит в сторону.',
      value: 'Редуктор хода'
    }
  };

  var card = document.querySelector('.unit-card');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.pos'));
  var selected = 'pump';

  function select(key) {
    selected = key;
    var u = UNITS[key];
    card.querySelector('[data-unit-pos]').textContent = u.pos;
    card.querySelector('[data-unit-title]').textContent = u.title;
    card.querySelector('[data-unit-text]').textContent = u.text;
    card.querySelector('[data-unit-signs]').textContent = u.signs;
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-unit') === key ? 'true' : 'false'); });
  }

  buttons.forEach(function (b) {
    b.setAttribute('aria-label', 'Позиция ' + UNITS[b.getAttribute('data-unit')].pos + ': ' + UNITS[b.getAttribute('data-unit')].title);
    b.addEventListener('click', function () { select(b.getAttribute('data-unit')); });
  });

  card.querySelector('[data-unit-cta]').addEventListener('click', function (e) {
    e.preventDefault();
    ETS.prefill({ unit: UNITS[selected].value });
  });

  ETS.initLeadForm(document.querySelector('#request form'), {
    summary: function (d) {
      var what = [d.machine];
      if (d.unit) what.push(d.unit.toLowerCase());
      if (d.brand && d.brand.trim()) what.push(d.brand.trim());
      return d.name.trim() + ', ' + d.phone + ' — ' + what.join(', ') + '; ' + d.place.toLowerCase() + '.';
    }
  });

  select('pump');
})();
