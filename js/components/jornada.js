// Visão somente leitura do plano de carreira de uma trilha, a partir de um cargo (real ou simulado).
const Jornada = (() => {
  const { el } = Helpers;

  function faixaSalarial(cargo) {
    return `${Helpers.formatCurrency(cargo.faixaSalarialMin)} a ${Helpers.formatCurrency(cargo.faixaSalarialMax)}`;
  }

  function tipoRotulo(cargo) {
    return el('span', { class: `type-badge is-${cargo.tipo}`, text: Plano.TIPOS[cargo.tipo] });
  }

  function lista(itens, vazio) {
    return itens.length
      ? el('ul', { class: 'plain-list' }, itens.map((item) => el('li', { text: item })))
      : el('p', { class: 'muted-text', text: vazio });
  }

  function requisitos(cargo) {
    const { competencias, formacao, experiencia } = cargo.requisitos;
    return el('dl', { class: 'requirements' },
      el('div', {}, el('dt', { text: 'Competências' }), el('dd', {}, lista(competencias, 'Não informadas.'))),
      el('div', {}, el('dt', { text: 'Formação' }), el('dd', { text: formacao || 'Não informada.' })),
      el('div', {}, el('dt', { text: 'Experiência' }), el('dd', { text: experiencia || 'Não informada.' })));
  }

  function textoElegibilidade(cargo, proximos, mesesNoCargo, simulacao) {
    const minimo = cargo.tempoMinimoNoCargoMeses;
    if (!proximos.length) return { texto: 'Este é o último nível desta trilha.', elegivel: false, pct: 100 };
    if (simulacao) return { texto: `Tempo mínimo neste cargo para avançar: ${Helpers.formatDuration(minimo)}.`, elegivel: false, pct: 0 };
    if (!minimo || mesesNoCargo >= minimo) {
      return { texto: `Elegível agora: o tempo mínimo de ${Helpers.formatDuration(minimo)} neste cargo já foi cumprido.`, elegivel: true, pct: 100 };
    }
    return {
      texto: `Faltam ${Helpers.formatDuration(minimo - mesesNoCargo)} para a elegibilidade (mínimo de ${Helpers.formatDuration(minimo)} neste cargo; atualmente ${Helpers.formatDuration(mesesNoCargo)}).`,
      elegivel: false,
      pct: Math.min(100, (mesesNoCargo / minimo) * 100)
    };
  }

  function render(container, { cargoId, mesesNoCargo = 0, simulacao = false }) {
    const cargo = Plano.cargo(cargoId);
    if (!cargo) {
      container.replaceChildren(el('p', { class: 'muted-text', text: 'Nenhum cargo do plano de carreira está associado a este perfil.' }));
      return;
    }
    const trilha = Plano.trilha(cargo.trilhaId);
    const proximos = Plano.proximos(cargoId).filter((item) => item.ativo);
    const caminho = Plano.caminhoAte(cargoId);
    const elegibilidade = textoElegibilidade(cargo, proximos, mesesNoCargo, simulacao);

    const cartaoAtual = el('article', { class: 'journey-current' },
      el('p', { class: 'eyebrow', text: simulacao ? 'Cargo de entrada' : 'Onde você está' }),
      el('h3', {}, el('a', { href: `cargo.html?id=${encodeURIComponent(cargo.id)}`, text: cargo.nome }), ' ', tipoRotulo(cargo)),
      el('p', { class: 'muted-text', text: `Faixa salarial: ${faixaSalarial(cargo)}` }),
      el('div', {
        class: 'progress',
        role: 'progressbar',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': String(Math.round(elegibilidade.pct)),
        'aria-label': 'Progresso até o tempo mínimo no cargo',
        'aria-valuetext': elegibilidade.texto
      }, el('i', { style: `width:${elegibilidade.pct}%` })),
      el('p', { class: `eligibility${elegibilidade.elegivel ? ' is-eligible' : ''}`, text: elegibilidade.texto }));

    const proximosCartoes = proximos.length
      ? el('ul', { class: 'journey-next' }, proximos.map((proximo) => el('li', {},
        el('article', { class: 'next-card' },
          el('h4', {}, el('a', { href: `cargo.html?id=${encodeURIComponent(proximo.id)}`, text: proximo.nome }), ' ', tipoRotulo(proximo)),
          el('p', { class: 'muted-text', text: `Faixa salarial: ${faixaSalarial(proximo)}` }),
          requisitos(proximo),
          el('p', { class: `eligibility${elegibilidade.elegivel ? ' is-eligible' : ''}`, text: elegibilidade.elegivel ? 'Tempo mínimo cumprido.' : (simulacao ? `Tempo mínimo no cargo atual: ${Helpers.formatDuration(cargo.tempoMinimoNoCargoMeses)}.` : `Faltam ${Helpers.formatDuration(Math.max(0, cargo.tempoMinimoNoCargoMeses - mesesNoCargo))} para a elegibilidade.`) })))))
      : el('p', { class: 'muted-text', text: 'Não há próximos cargos definidos para este nível.' });

    const etapas = Plano.cargosDaTrilha(cargo.trilhaId).filter((item) => item.ativo || item.id === cargoId);
    const indiceAtual = caminho.indexOf(cargoId);
    const linhaDoTempo = el('ol', { class: 'track-steps' }, etapas.map((etapa) => {
      const noCaminho = caminho.indexOf(etapa.id);
      let estado = '';
      let leitor = '';
      if (etapa.id === cargoId) { estado = 'is-current'; leitor = ' (cargo atual)'; }
      else if (noCaminho >= 0 && noCaminho < indiceAtual) { estado = 'is-complete'; leitor = ' (etapa anterior do caminho)'; }
      else if (proximos.some((proximo) => proximo.id === etapa.id)) { estado = 'is-next'; leitor = ' (próximo cargo possível)'; }
      return el('li', { class: estado, 'aria-current': etapa.id === cargoId ? 'step' : null },
        el('a', { href: `cargo.html?id=${encodeURIComponent(etapa.id)}` }, etapa.nome, el('span', { class: 'visually-hidden', text: leitor })),
        el('small', { text: faixaSalarial(etapa) }));
    }));

    container.replaceChildren(
      el('p', { class: 'track-name' }, el('strong', { text: trilha ? trilha.nome : 'Trilha' }), trilha && trilha.descricao ? ` — ${trilha.descricao}` : ''),
      cartaoAtual,
      el('h3', { class: 'section-subtitle', text: 'Próximos cargos possíveis' }),
      proximosCartoes,
      el('h3', { class: 'section-subtitle', text: 'Etapas da trilha' }),
      linhaDoTempo);
  }

  return { render, faixaSalarial, requisitos, tipoRotulo, lista };
})();
