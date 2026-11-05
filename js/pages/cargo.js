document.addEventListener('DOMContentLoaded', () => {
  const { el, formatDuration, formatNumber, formatPercent } = Helpers;
  const session = Auth.getSession();
  const isAdmin = Boolean(session) && session.role === 'admin';
  const cargo = Plano.cargo(Helpers.queryParam('id'));
  const title = document.getElementById('cargo-title');
  const backLink = document.getElementById('cargo-back-link');

  if (!isAdmin) {
    backLink.href = 'perfil.html';
    backLink.setAttribute('aria-label', 'Voltar à minha jornada');
  }

  if (!cargo) {
    title.textContent = 'Cargo não encontrado';
    document.getElementById('cargo-trilha').textContent = 'Plano de carreira';
    return;
  }

  // O colaborador só consulta cargos da própria trilha.
  if (!isAdmin) {
    const own = Dados.colaboradorDaSessao(session);
    const ownCargo = own ? Plano.cargo(own.cargoId) : null;
    if (!ownCargo || ownCargo.trilhaId !== cargo.trilhaId) {
      Auth.redirectWithNotice('perfil.html', 'Você só pode consultar cargos da sua própria trilha de carreira.');
      return;
    }
  }

  const trilha = Plano.trilha(cargo.trilhaId);
  document.title = `${cargo.nome} | Talentos em Equilíbrio`;
  title.textContent = cargo.nome;
  document.getElementById('cargo-trilha').textContent = `Trilha: ${trilha ? trilha.nome : '—'}`;
  document.getElementById('cargo-content').hidden = false;

  const infoItem = (label, value) => el('div', {}, el('dt', { text: label }), el('dd', {}, value));

  document.getElementById('cargo-summary').replaceChildren(
    infoItem('Tipo', Jornada.tipoRotulo(cargo)),
    infoItem('Faixa salarial', Jornada.faixaSalarial(cargo)),
    infoItem('Tempo mínimo no cargo', cargo.tempoMinimoNoCargoMeses ? formatDuration(cargo.tempoMinimoNoCargoMeses) : 'Não se aplica'),
    infoItem('Situação', cargo.ativo ? 'Ativo' : 'Arquivado'));

  document.getElementById('cargo-responsibilities').replaceChildren(Jornada.lista(cargo.responsabilidades, 'Nenhuma responsabilidade cadastrada.'));
  document.getElementById('cargo-requirements').replaceChildren(Jornada.requisitos(cargo));
  document.getElementById('cargo-benefits').replaceChildren(Jornada.lista(cargo.beneficios, 'Nenhum benefício específico cadastrado.'));

  const links = (list, empty) => (list.length
    ? el('ul', { class: 'plain-list' }, list.map((item) => el('li', {}, el('a', { href: `cargo.html?id=${encodeURIComponent(item.id)}`, text: item.nome }), ' ', Jornada.tipoRotulo(item))))
    : el('p', { class: 'muted-text', text: empty }));
  document.getElementById('cargo-from').replaceChildren(links(Plano.anteriores(cargo.id), 'Este é um cargo de entrada na trilha.'));
  document.getElementById('cargo-to').replaceChildren(links(Plano.proximos(cargo.id).filter((item) => item.ativo), 'Este é o último nível desta trilha.'));

  if (!isAdmin) return;

  /* Visão exclusiva do RH: ocupantes, percentual por gênero e tempo médio no cargo */
  const people = Analytics.pessoas({ cargoId: cargo.id }).sort((a, b) => b.mesesNoCargo - a.mesesNoCargo);
  const women = people.filter((person) => person.gender === 'Feminino').length;
  const men = people.filter((person) => person.gender === 'Masculino').length;
  const others = people.length - women - men;
  const share = (count) => (people.length ? (count / people.length) * 100 : 0);
  const average = people.length >= Analytics.MIN_AMOSTRA ? Helpers.mean(people.map((person) => person.mesesNoCargo)) : null;

  const summary = document.getElementById('occupants-summary');
  if (!people.length) {
    summary.replaceChildren(el('p', { class: 'muted-text', text: 'Ninguém ocupa este cargo no momento.' }));
    document.getElementById('occupants-table').replaceChildren();
    return;
  }
  summary.replaceChildren(
    el('dl', { class: 'info-list occupant-stats' },
      infoItem('Pessoas no cargo', formatNumber(people.length)),
      infoItem('Mulheres', `${formatNumber(women)} (${formatPercent(share(women))})`),
      infoItem('Homens', `${formatNumber(men)} (${formatPercent(share(men))})`),
      infoItem('Tempo médio no cargo', average === null ? 'amostra pequena' : `${formatDuration(average)}${cargo.tempoMinimoNoCargoMeses ? ` (mínimo de ${formatDuration(cargo.tempoMinimoNoCargoMeses)})` : ''}`)),
    el('div', {
      class: 'gender-split',
      role: 'img',
      'aria-label': `Distribuição por gênero: ${formatPercent(share(women))} mulheres, ${formatPercent(share(men))} homens${others ? `, ${formatPercent(share(others))} outros` : ''}.`
    },
    el('i', { class: 'split-women', style: `width:${share(women)}%` }),
    el('i', { class: 'split-men', style: `width:${share(men)}%` }),
    others ? el('i', { class: 'split-other', style: `width:${share(others)}%` }) : null));

  document.getElementById('occupants-table').replaceChildren(el('table', { class: 'data-table' },
    el('caption', { class: 'visually-hidden', text: `Pessoas que ocupam o cargo ${cargo.nome}` }),
    el('thead', {}, el('tr', {}, ['Nome', 'Gênero', 'Setor', 'No cargo desde', 'Tempo no cargo'].map((heading) => el('th', { scope: 'col', text: heading })))),
    el('tbody', {}, people.map((person) => el('tr', {},
      el('th', { scope: 'row' }, el('a', { href: `perfil.html?colaborador=${encodeURIComponent(person.id)}`, text: person.name })),
      el('td', { text: person.gender }),
      el('td', { text: person.sector }),
      el('td', { text: Helpers.formatDate(person.cargoDesde || person.hireDate) }),
      el('td', { text: formatDuration(person.mesesNoCargo) }))))));
});
