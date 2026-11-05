document.addEventListener('DOMContentLoaded', () => {
  const { el, formatPercent } = Helpers;
  const sectorFilter = document.getElementById('report-sector-filter');
  const periodFilter = document.getElementById('report-period');
  const status = document.getElementById('report-status');

  Dados.setores().forEach((sector) => sectorFilter.add(new Option(sector, sector)));
  Analytics.opcoesDePeriodo().forEach((option) => periodFilter.add(new Option(option.rotulo, option.valor)));

  function renderCharts(sector, period) {
    const sectors = Analytics.indicadoresPorSetor(period).filter((item) => !sector || item.setor === sector);
    const where = sector ? `no setor ${sector}` : 'por setor';

    document.getElementById('leadership-chart-slot').replaceChildren(Charts.barrasSimples({
      id: 'leadership-chart',
      titulo: `Percentual de mulheres em cargos de liderança ${where}`,
      descricao: 'Percentual dos cargos de liderança ocupados por mulheres.',
      itens: sectors.map((item) => ({ rotulo: item.setor, valor: item.pctMulheresLideranca }))
    }));
    document.getElementById('attrition-chart-slot').replaceChildren(Charts.barrasSimples({
      id: 'attrition-chart',
      titulo: `Taxa de desistência de mulheres ${where}`,
      descricao: `Mulheres que deixaram a empresa no período (${periodFilter.selectedOptions[0].textContent}).`,
      itens: sectors.map((item) => ({ rotulo: item.setor, valor: item.desistenciaF }))
    }));
  }

  function renderFunnel(sector) {
    const funnel = Analytics.funil({ setor: sector });
    document.getElementById('funnel-chart-slot').replaceChildren(Charts.funilMulheres({
      id: 'funnel-chart',
      titulo: `Mulheres em cada cargo do plano${sector ? `, setor ${sector}` : ''}`,
      linhas: funnel.linhas
    }));

    const levels = Analytics.niveis({ setor: sector }).filter((level) => level.pctMulheresNoNivel !== null);
    const note = document.getElementById('funnel-note');
    if (levels.length >= 2) {
      const first = levels[0];
      const last = levels[levels.length - 1];
      note.textContent = `Mulheres são ${formatPercent(first.pctMulheresNoNivel)} do nível ${first.nome} e ${formatPercent(last.pctMulheresNoNivel)} do nível ${last.nome} (níveis com pelo menos ${Analytics.MIN_AMOSTRA} pessoas).`;
    } else {
      note.textContent = 'Amostra pequena para comparar a representatividade entre os níveis.';
    }
  }

  function renderFindings(period) {
    const findings = Analytics.descobertas(period);
    document.getElementById('findings-list').replaceChildren(...(findings.length
      ? findings.map((item) => el('li', {},
        el('span', { class: 'finding-icon', 'aria-hidden': 'true' }, Helpers.icon(item.icone)),
        el('p', {}, el('strong', { text: item.titulo }), el('span', { text: item.texto }))))
      : [el('li', {}, el('p', {}, el('span', { text: 'Ainda não há dados suficientes para gerar descobertas.' })))]));
  }

  function renderHeatmap(sector, period) {
    const data = Analytics.mapaPromocoes({ periodo: period, setor: sector });
    PromotionHeatmap.render(document.getElementById('promotion-heatmap'), data, { linkParaPerfil: true });
    document.getElementById('heatmap-subtitle').textContent = `${data.janela.rotulo}${sector ? ` · setor ${sector}` : ' · todos os setores'}.`;
  }

  function render() {
    const sector = sectorFilter.value;
    const period = periodFilter.value;
    renderCharts(sector, period);
    renderFunnel(sector);
    renderFindings(period);
    renderHeatmap(sector, period);
    status.textContent = `Relatórios atualizados: ${sector || 'todos os setores'}, ${periodFilter.selectedOptions[0].textContent}.`;
  }

  sectorFilter.addEventListener('change', render);
  periodFilter.addEventListener('change', render);
  render();
  status.textContent = '';
});
