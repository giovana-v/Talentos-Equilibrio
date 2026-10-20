document.addEventListener('DOMContentLoaded', () => {
  const sectorFilter = document.getElementById('report-sector-filter');
  const horizontalRows = [...document.querySelectorAll('.horizontal-row')];
  const verticalColumns = [...document.querySelectorAll('.vertical-column')];
  const verticalBars = document.querySelector('.vertical-bars');
  const leadershipChart = document.getElementById('leadership-chart');
  const attritionChart = document.getElementById('attrition-chart');

  function applySectorFilter() {
    const selectedSector = sectorFilter.value;
    const matches = (element) => !selectedSector || element.dataset.sector === selectedSector;

    horizontalRows.forEach((row) => {
      row.hidden = !matches(row);
    });
    verticalColumns.forEach((column) => {
      column.hidden = !matches(column);
    });

    verticalBars.classList.toggle('has-sector-filter', Boolean(selectedSector));
    leadershipChart.setAttribute(
      'aria-label',
      selectedSector
        ? `Percentual de mulheres em cargos de liderança no setor ${selectedSector}`
        : 'Percentual de mulheres em cargos de liderança por setor'
    );
    attritionChart.setAttribute(
      'aria-label',
      selectedSector
        ? `Taxa de desistência de mulheres no setor ${selectedSector}`
        : 'Taxa de desistência de mulheres por setor'
    );
  }

  sectorFilter.addEventListener('change', applySectorFilter);
});
