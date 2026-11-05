document.addEventListener('DOMContentLoaded', () => {
  const { el, formatNumber, formatPercent, formatCurrency } = Helpers;
  const sectorFilter = document.getElementById('filter-setor');
  const cargoFilter = document.getElementById('filter-cargo');
  const typeFilter = document.getElementById('filter-tipo');
  const status = document.getElementById('overview-status');

  Dados.setores().forEach((sector) => sectorFilter.add(new Option(sector, sector)));
  Plano.cargosOrdenados().forEach((cargo) => cargoFilter.add(new Option(`${Plano.rotulo(cargo)}${cargo.ativo ? '' : ' (arquivado)'}`, cargo.id)));

  const SMALL = 'amostra pequena';
  const years = (months) => `${formatNumber(months / 12, 1)} anos`;
  const signedPercent = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatPercent(Math.abs(value))}`;

  // Texto de uma célula de grupo: vazio, amostra pequena ou o valor formatado.
  function cell(group, value, format) {
    if (!group.n) return '—';
    if (group.pequena || value === null) return SMALL;
    return format(value);
  }

  function values(rows, key, field) {
    return rows.map((row) => (row[key].pequena || !row[key].n ? null : row[key][field]));
  }

  function filters() {
    return { setor: sectorFilter.value, cargoId: cargoFilter.value, tipo: typeFilter.value };
  }

  function seriesFor(rows, field, divisor = 1) {
    return [
      { nome: 'Mulheres', classe: 'women', valores: values(rows, 'F', field).map((value) => (value === null ? null : value / divisor)), ns: rows.map((row) => row.F.n) },
      { nome: 'Homens', classe: 'men', valores: values(rows, 'M', field).map((value) => (value === null ? null : value / divisor)), ns: rows.map((row) => row.M.n) }
    ];
  }

  function summaryCard(icon, title, value, note) {
    return el('article', { class: 'metric-card' },
      el('div', { class: 'metric-icon' }, Helpers.icon(icon)),
      el('div', { class: 'metric-content' }, el('h2', { text: title }), el('strong', { class: 'metric-value', text: value }), el('p', { text: note })));
  }

  function renderSummary(filter, promotion) {
    const summary = Analytics.resumo(filter);
    const gap = summary.salarioMedio.dif;
    document.getElementById('overview-summary').replaceChildren(
      summaryCard('users', 'Pessoas no filtro', formatNumber(summary.total), `${Helpers.plural(summary.mulheres, 'mulher', 'mulheres')} · ${Helpers.plural(summary.homens, 'homem', 'homens')}`),
      summaryCard('user', 'Mulheres na liderança', summary.lideres ? formatPercent(summary.pctMulheresNaLideranca) : '—', summary.lideres ? `${summary.lideresMulheres} de ${summary.lideres} cargos de liderança` : 'Sem cargos de liderança no filtro'),
      summaryCard('clock', 'Tempo até a promoção (M × H)', promotion.F.pequena || promotion.M.pequena ? SMALL : `${years(promotion.F.mediaMeses)} × ${years(promotion.M.mediaMeses)}`, 'Mulheres × homens'),
      summaryCard('money', 'Diferença no salário médio', gap === null ? SMALL : signedPercent(gap), gap === null ? 'Menos de 3 pessoas em um dos grupos' : 'Mulheres em relação a homens (bruta, sem separar por nível)'));
  }

  function renderDistribution(rows) {
    document.getElementById('chart-distribution').replaceChildren(Charts.barrasAgrupadas({
      id: 'distribution-chart',
      titulo: 'Pessoas por nível e gênero',
      descricao: 'Quantidade de mulheres e homens em cada nível do plano de carreira.',
      categorias: rows.map((row) => row.nome),
      series: [
        { nome: 'Mulheres', classe: 'women', valores: rows.map((row) => row.F.n) },
        { nome: 'Homens', classe: 'men', valores: rows.map((row) => row.M.n) }
      ]
    }));
    document.getElementById('table-distribution').replaceChildren(Charts.tabela({
      descricao: 'Quantidade e percentual de mulheres e homens por nível do plano de carreira',
      colunas: ['Nível', 'Mulheres', '% das mulheres', 'Homens', '% dos homens', '% de mulheres no nível'],
      linhas: rows.map((row) => [
        row.nome,
        formatNumber(row.F.n),
        row.pctDoGeneroF === null ? '—' : formatPercent(row.pctDoGeneroF),
        formatNumber(row.M.n),
        row.pctDoGeneroM === null ? '—' : formatPercent(row.pctDoGeneroM),
        row.pctMulheresNoNivel === null ? (row.total ? SMALL : '—') : formatPercent(row.pctMulheresNoNivel)
      ])
    }));
  }

  function renderTenure(rows) {
    document.getElementById('chart-tenure').replaceChildren(Charts.barrasAgrupadas({
      id: 'tenure-chart',
      titulo: 'Tempo médio de empresa (anos)',
      descricao: 'Tempo médio de empresa, em anos, por nível e gênero.',
      categorias: rows.map((row) => row.nome),
      series: seriesFor(rows, 'tempoCasaMeses', 12),
      formatar: (value) => `${formatNumber(value, 1)} anos`
    }));
  }

  function renderSalary(rows) {
    const money = (value) => formatCurrency(value);
    document.getElementById('chart-salary-mean').replaceChildren(Charts.barrasAgrupadas({
      id: 'salary-mean-chart',
      titulo: 'Salário médio',
      descricao: 'Salário médio por nível e gênero.',
      categorias: rows.map((row) => row.nome),
      series: seriesFor(rows, 'salarioMedio'),
      formatar: money
    }));
    document.getElementById('chart-salary-median').replaceChildren(Charts.barrasAgrupadas({
      id: 'salary-median-chart',
      titulo: 'Salário mediano',
      descricao: 'Salário mediano por nível e gênero.',
      categorias: rows.map((row) => row.nome),
      series: seriesFor(rows, 'salarioMediana'),
      formatar: money
    }));
    document.getElementById('table-salary').replaceChildren(Charts.tabela({
      descricao: 'Salário médio e mediano de mulheres e homens por nível, com a diferença percentual entre eles',
      colunas: ['Nível', 'Média (mulheres)', 'Média (homens)', 'Diferença na média', 'Mediana (mulheres)', 'Mediana (homens)', 'Diferença na mediana'],
      linhas: rows.map((row) => [
        row.nome,
        cell(row.F, row.F.salarioMedio, money),
        cell(row.M, row.M.salarioMedio, money),
        row.difSalarioMedio === null ? (row.total ? SMALL : '—') : signedPercent(row.difSalarioMedio),
        cell(row.F, row.F.salarioMediana, money),
        cell(row.M, row.M.salarioMediana, money),
        row.difSalarioMediana === null ? (row.total ? SMALL : '—') : signedPercent(row.difSalarioMediana)
      ])
    }));
  }

  function renderPromotion(promotion) {
    const stat = (label, group) => el('div', { class: 'promotion-stat' },
      el('span', { class: 'mini-icon', 'aria-hidden': 'true' }, Helpers.icon('calendar')),
      el('div', {}, el('span', { text: label }), el('strong', { text: group.pequena ? SMALL : years(group.mediaMeses) }), el('small', { text: `${Helpers.plural(group.n, 'promoção', 'promoções')} analisadas` })));
    const difference = promotion.diferencaMeses === null
      ? el('p', { class: 'muted-text', text: 'Sem amostra suficiente para comparar os grupos.' })
      : el('p', { class: 'muted-text', text: promotion.diferencaMeses > 0
        ? `As mulheres levam em média ${years(Math.abs(promotion.diferencaMeses))} a mais que os homens até cada promoção.`
        : `As mulheres levam em média ${years(Math.abs(promotion.diferencaMeses))} a menos que os homens até cada promoção.` });
    document.getElementById('promotion-summary').replaceChildren(stat('Mulheres', promotion.F), stat('Homens', promotion.M), difference);

    const rows = promotion.porCargo;
    document.getElementById('chart-promotion').replaceChildren(rows.length
      ? Charts.barrasAgrupadas({
        id: 'promotion-chart',
        titulo: 'Tempo até a promoção, por cargo de origem (anos)',
        descricao: 'Tempo médio até a promoção para quem saiu de cada cargo, por gênero.',
        categorias: rows.map((row) => row.nome),
        series: [
          { nome: 'Mulheres', classe: 'women', valores: rows.map((row) => (row.F.pequena ? null : row.F.mediaMeses / 12)), ns: rows.map((row) => row.F.n) },
          { nome: 'Homens', classe: 'men', valores: rows.map((row) => (row.M.pequena ? null : row.M.mediaMeses / 12)), ns: rows.map((row) => row.M.n) }
        ],
        formatar: (value) => `${formatNumber(value, 1)} anos`
      })
      : el('p', { class: 'chart-empty', text: 'Nenhuma promoção registrada para este filtro.' }));
  }

  function render() {
    const filter = filters();
    const rows = Analytics.niveis(filter);
    const promotion = Analytics.tempoAtePromocao(filter);
    renderSummary(filter, promotion);
    renderDistribution(rows);
    renderTenure(rows);
    renderSalary(rows);
    renderPromotion(promotion);
    const total = Analytics.pessoas(filter).length;
    Helpers.announce(status, `${Helpers.plural(total, 'colaborador', 'colaboradores')} no filtro atual.`);
  }

  [sectorFilter, cargoFilter, typeFilter].forEach((control) => control.addEventListener('change', render));
  document.getElementById('clear-filters').addEventListener('click', () => {
    sectorFilter.value = '';
    cargoFilter.value = '';
    typeFilter.value = '';
    render();
  });
  document.getElementById('overview-filters').addEventListener('submit', (event) => event.preventDefault());

  render();
});
