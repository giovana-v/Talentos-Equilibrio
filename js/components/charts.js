// Gráficos em HTML/CSS com descrição textual e tabela alternativa para leitores de tela.
const Charts = (() => {
  const { el } = Helpers;
  const SERIES_PADRAO = [
    { nome: 'Mulheres', classe: 'women' },
    { nome: 'Homens', classe: 'men' }
  ];

  function legenda(series) {
    return el('div', { class: 'chart-legend', 'aria-hidden': 'true' },
      series.map((serie) => el('span', {}, el('i', { class: `legend-dot ${serie.classe}-dot` }), serie.nome)));
  }

  function tabela({ descricao, colunas, linhas }) {
    return el('div', { class: 'table-scroll' },
      el('table', { class: 'data-table' },
        el('caption', { class: 'visually-hidden', text: descricao }),
        el('thead', {}, el('tr', {}, colunas.map((coluna) => el('th', { scope: 'col', text: coluna })))),
        el('tbody', {}, linhas.map((linha) => el('tr', {},
          el('th', { scope: 'row', text: linha[0] }),
          linha.slice(1).map((celula) => el('td', { text: celula })))))));
  }

  // Barras agrupadas por categoria (ex.: nível do plano), uma barra por série (ex.: gênero).
  // Valores nulos significam "amostra pequena" e aparecem como texto, sem barra.
  function barrasAgrupadas({ id, titulo, descricao, categorias, series = SERIES_PADRAO.map((serie) => ({ ...serie })), formatar = (valor) => Helpers.formatNumber(valor), vazio = 'sem dados' }) {
    const numeros = series.flatMap((serie) => serie.valores).filter((valor) => Number.isFinite(valor));
    const maximo = Math.max(1, ...numeros);
    const texto = (valor, serie, indice) => {
      if (Number.isFinite(valor)) return formatar(valor);
      return serie.ns && serie.ns[indice] === 0 ? vazio : 'amostra pequena';
    };
    const resumo = categorias
      .map((categoria, indice) => `${categoria}: ${series.map((serie) => `${serie.nome} ${texto(serie.valores[indice], serie, indice)}`).join(', ')}.`)
      .join(' ');

    const corpo = el('div', { class: 'bars-body', 'aria-hidden': 'true' },
      categorias.map((categoria, indice) => el('div', { class: 'bars-row' },
        el('span', { class: 'bars-label', text: categoria }),
        el('div', { class: 'bars-group' }, series.map((serie) => {
          const valor = serie.valores[indice];
          const numero = Number.isFinite(valor);
          return el('div', { class: 'bars-line' },
            el('div', { class: 'bar-track' }, numero ? el('i', { class: `bar-${serie.classe}`, style: `--bar-size:${Math.max(2, (valor / maximo) * 100)}%` }) : null),
            el('span', { class: `bars-value${numero ? '' : ' is-muted'}`, text: texto(valor, serie, indice) }));
        })))));

    const detalhes = el('details', { class: 'chart-table' },
      el('summary', { text: 'Ver dados em tabela' }),
      tabela({
        descricao: `Tabela com os dados do gráfico: ${titulo}`,
        colunas: ['Categoria', ...series.map((serie) => serie.nome)],
        linhas: categorias.map((categoria, indice) => [categoria, ...series.map((serie) => texto(serie.valores[indice], serie, indice))])
      }));

    return el('figure', { class: 'bars-chart', id, 'aria-labelledby': `${id}-titulo`, 'aria-describedby': `${id}-descricao` },
      el('h3', { class: 'chart-title', id: `${id}-titulo`, text: titulo }),
      el('figcaption', { class: 'visually-hidden', id: `${id}-descricao`, text: `${descricao} ${resumo}` }),
      legenda(series),
      corpo,
      detalhes);
  }

  // Funil de carreira mulheres × homens (uma linha por cargo do plano).
  function funilCarreira({ id, titulo, linhas, maximo }) {
    const descricao = linhas.map((linha) => `${linha.nome}: ${Helpers.plural(linha.mulheres, 'mulher', 'mulheres')} e ${Helpers.plural(linha.homens, 'homem', 'homens')}.`).join(' ');
    const corpo = linhas.length
      ? linhas.map((linha) => el('div', {
        class: 'career-row',
        style: `--bar-total:${Math.max(4, (linha.total / maximo) * 100)}%; --women-share:${linha.total ? (linha.mulheres / linha.total) * 100 : 0}%`
      },
      el('span', { class: 'career-stage', text: linha.nome }),
      el('div', { class: 'career-track', 'aria-hidden': 'true' },
        el('span', { class: 'women-bar', text: linha.mulheres || '' }),
        el('span', { class: 'men-bar' })),
      el('span', { class: 'career-total', text: Helpers.formatNumber(linha.total) })))
      : [el('p', { class: 'chart-empty', text: 'Nenhum colaborador encontrado para este filtro.' })];
    return el('figure', { class: 'career-chart', id, 'aria-labelledby': titulo ? `${id}-titulo` : null, 'aria-describedby': `${id}-descricao` },
      titulo ? el('span', { class: 'visually-hidden', id: `${id}-titulo`, text: titulo }) : null,
      el('figcaption', { class: 'visually-hidden', id: `${id}-descricao`, text: descricao || 'Sem dados.' }),
      corpo);
  }

  // Funil das etapas (mulheres por cargo), largura proporcional ao maior grupo.
  function funilMulheres({ id, titulo, linhas }) {
    const maximo = Math.max(1, ...linhas.map((linha) => linha.mulheres));
    const descricao = linhas.map((linha) => `${linha.nome}: ${Helpers.plural(linha.mulheres, 'mulher', 'mulheres')}.`).join(' ');
    return el('figure', { class: 'funnel-chart', id, 'aria-labelledby': `${id}-titulo`, 'aria-describedby': `${id}-descricao` },
      el('span', { class: 'visually-hidden', id: `${id}-titulo`, text: titulo }),
      el('figcaption', { class: 'visually-hidden', id: `${id}-descricao`, text: descricao || 'Sem dados.' }),
      el('ol', { class: 'funnel-levels' }, linhas.map((linha, indice) => el('li', {},
        el('span', { class: 'funnel-shape is-dynamic', 'aria-hidden': 'true', style: `--funnel-width:${Math.max(16, (linha.mulheres / maximo) * 100)}%; --funnel-opacity:${Math.max(0.4, 1 - indice * 0.09)}` }),
        el('strong', {}, linha.nome, el('small', { text: ` · ${Helpers.formatNumber(linha.mulheres)}` }))))));
  }

  // Barras simples (uma série) com rótulo, usadas para taxas por setor.
  function barrasSimples({ id, titulo, descricao, itens, formatar = (valor) => Helpers.formatPercent(valor), maximo }) {
    const topo = maximo || Math.max(1, ...itens.map((item) => (Number.isFinite(item.valor) ? item.valor : 0)));
    const texto = (item) => (Number.isFinite(item.valor) ? formatar(item.valor) : 'amostra pequena');
    return el('figure', { class: 'bars-chart bars-simple', id, 'aria-labelledby': `${id}-titulo`, 'aria-describedby': `${id}-descricao` },
      el('span', { class: 'visually-hidden', id: `${id}-titulo`, text: titulo }),
      el('figcaption', { class: 'visually-hidden', id: `${id}-descricao`, text: `${descricao} ${itens.map((item) => `${item.rotulo}: ${texto(item)}.`).join(' ')}` }),
      el('div', { class: 'bars-body', 'aria-hidden': 'true' }, itens.map((item) => el('div', { class: 'bars-row', dataset: { sector: item.rotulo } },
        el('span', { class: 'bars-label', text: item.rotulo }),
        el('div', { class: 'bars-line' },
          el('div', { class: 'bar-track' }, Number.isFinite(item.valor) ? el('i', { class: 'bar-women', style: `--bar-size:${Math.max(2, (item.valor / topo) * 100)}%` }) : null),
          el('span', { class: `bars-value${Number.isFinite(item.valor) ? '' : ' is-muted'}`, text: texto(item) }))))),
      el('details', { class: 'chart-table' },
        el('summary', { text: 'Ver dados em tabela' }),
        tabela({ descricao: `Tabela com os dados do gráfico: ${titulo}`, colunas: ['Setor', 'Valor'], linhas: itens.map((item) => [item.rotulo, texto(item)]) })));
  }

  return { SERIES_PADRAO, legenda, tabela, barrasAgrupadas, funilCarreira, funilMulheres, barrasSimples };
})();
