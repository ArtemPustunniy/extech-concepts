// Концепт 01: общая логика + итог заявки в стиле «наряд на ремонт».
ETS.init();

ETS.initLeadForm(document.querySelector('#request form'), {
  summary: function (d) {
    var parts = [d.machine];
    if (d.unit) parts.push(d.unit.toLowerCase());
    parts.push(d.place === 'Нужен выезд' ? 'нужен выезд' : 'привезут на базу');
    return d.name.trim() + ', ' + d.phone + ' — ' + parts.join(', ') + '. Специалист свяжется в рабочее время.';
  }
});
