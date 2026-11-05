// Mapa mensal de promoções: tabela acessível em que a cor reforça o número exibido em cada célula.
const PromotionHeatmap = (() => {
  const { el } = Helpers;
  let contador = 0;

  function nivel(n, maximo) {
    if (!n) return 0;
    return 1 + Math.min(4, Math.floor(((n - 1) / Math.max(1, maximo)) * 4.999));
  }

  function textoPromocoes(n) {
    return Helpers.plural(n, 'promoção', 'promoções');
  }

  function descricaoGeral(dados) {
    const base = `Mapa de promoções, ${dados.janela.rotulo}${dados.setor ? `, setor ${dados.setor}` : ''}: ${textoPromocoes(dados.total)} no período.`;
    const partes = dados.linhas
      .filter((linha) => linha.chave !== 'total')
      .map((linha) => `${linha.rotulo}: ${linha.total}`);
    return `${base} ${partes.join('; ')}. Use as setas do teclado para percorrer os meses e Enter para ver quem foi promovido.`;
  }

  function tabelaDeDetalhes(itens, linkParaPerfil) {
    return el('div', { class: 'table-scroll' },
      el('table', { class: 'data-table' },
        el('caption', { class: 'visually-hidden', text: 'Colaboradores promovidos no mês selecionado' }),
        el('thead', {}, el('tr', {}, ['Nome', 'Cargo anterior → novo', 'Gênero', 'Setor', 'Data'].map((titulo) => el('th', { scope: 'col', text: titulo })))),
        el('tbody', {}, itens.map((item) => el('tr', {},
          el('th', { scope: 'row' }, linkParaPerfil && item.pessoa
            ? el('a', { href: `perfil.html?colaborador=${encodeURIComponent(item.colaboradorId)}`, text: item.nome })
            : item.nome),
          el('td', { text: `${item.origemNome} → ${item.destinoNome}` }),
          el('td', { text: item.genero || '—' }),
          el('td', { text: item.setor }),
          el('td', { text: Helpers.formatDate(item.data) }))))));
  }

  function render(container, dados, { linkParaPerfil = false } = {}) {
    contador += 1;
    const id = `heatmap-${contador}`;
    const detalhes = el('section', { class: 'heatmap-details', id: `${id}-detalhes`, 'aria-live': 'polite', tabindex: '-1' },
      el('p', { class: 'heatmap-hint', text: 'Selecione uma célula para ver quem foi promovido naquele mês.' }));
    const botoes = [];
    let selecionado = null;

    function selecionar(botao, linha, celula) {
      if (selecionado) selecionado.setAttribute('aria-pressed', 'false');
      selecionado = botao;
      botao.setAttribute('aria-pressed', 'true');
      detalhes.replaceChildren(
        el('h4', { text: `${linha.rotulo} em ${celula.mes.rotuloLongo}: ${textoPromocoes(celula.n)}` }),
        celula.n
          ? tabelaDeDetalhes(celula.itens, linkParaPerfil)
          : el('p', { class: 'heatmap-hint', text: 'Nenhuma promoção registrada neste mês.' }));
    }

    const cabecalho = el('tr', {},
      el('th', { scope: 'col' }, el('span', { class: 'visually-hidden', text: 'Categoria' })),
      dados.janela.meses.map((mes) => el('th', { scope: 'col', 'aria-label': mes.rotuloLongo, text: mes.rotulo.replace('/', ' ') })),
      el('th', { scope: 'col', text: 'Total' }));

    const corpo = dados.linhas.map((linha, indiceLinha) => {
      botoes[indiceLinha] = [];
      return el('tr', {},
        el('th', { scope: 'row', text: linha.rotulo }),
        linha.celulas.map((celula, indiceColuna) => {
          const botao = el('button', {
            type: 'button',
            class: `heat-cell heat-${nivel(celula.n, linha.maximo)}`,
            'aria-label': `${linha.rotulo}, ${celula.mes.rotuloLongo}: ${textoPromocoes(celula.n)}`,
            'aria-pressed': 'false',
            'aria-controls': detalhes.id,
            tabindex: indiceLinha === 0 && indiceColuna === 0 ? '0' : '-1',
            text: String(celula.n),
            onClick: () => selecionar(botao, linha, celula)
          });
          botao.dataset.linha = indiceLinha;
          botao.dataset.coluna = indiceColuna;
          botoes[indiceLinha][indiceColuna] = botao;
          return el('td', {}, botao);
        }),
        el('td', { class: 'heat-total', text: String(linha.total) }));
    });

    const tabela = el('table', { class: 'heatmap-table', 'aria-describedby': `${id}-descricao` },
      el('caption', { class: 'visually-hidden', text: `Promoções por mês, ${dados.janela.rotulo}${dados.setor ? `, setor ${dados.setor}` : ''}` }),
      el('thead', {}, cabecalho),
      el('tbody', {}, corpo));

    tabela.addEventListener('keydown', (evento) => {
      const alvo = evento.target.closest('.heat-cell');
      if (!alvo || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(evento.key)) return;
      evento.preventDefault();
      let linha = Number(alvo.dataset.linha);
      let coluna = Number(alvo.dataset.coluna);
      const ultimaLinha = botoes.length - 1;
      const ultimaColuna = botoes[0].length - 1;
      if (evento.key === 'ArrowLeft') coluna = Math.max(0, coluna - 1);
      if (evento.key === 'ArrowRight') coluna = Math.min(ultimaColuna, coluna + 1);
      if (evento.key === 'ArrowUp') linha = Math.max(0, linha - 1);
      if (evento.key === 'ArrowDown') linha = Math.min(ultimaLinha, linha + 1);
      if (evento.key === 'Home') coluna = 0;
      if (evento.key === 'End') coluna = ultimaColuna;
      alvo.tabIndex = -1;
      botoes[linha][coluna].tabIndex = 0;
      botoes[linha][coluna].focus();
    });

    const escala = el('div', { class: 'heatmap-legend', 'aria-hidden': 'true' },
      el('span', { text: 'Menos' }),
      [0, 1, 2, 3, 4, 5].map((valor) => el('i', { class: `heat-swatch heat-${valor}` })),
      el('span', { text: 'Mais' }),
      el('small', { text: 'A cor é proporcional ao maior mês de cada linha; o número aparece sempre na célula.' }));

    container.replaceChildren(
      el('p', { class: 'visually-hidden', id: `${id}-descricao`, text: descricaoGeral(dados) }),
      el('div', { class: 'table-scroll heatmap-scroll' }, tabela),
      escala,
      detalhes);
  }

  return { render, nivel };
})();
