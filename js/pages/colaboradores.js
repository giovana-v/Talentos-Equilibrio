document.addEventListener('DOMContentLoaded', () => {
  const listElement = document.getElementById('collaborators-list');
  const countElement = document.getElementById('collaborators-count');
  const searchInput = document.getElementById('search-colaboradores');
  const sectorFilter = document.getElementById('filter-sector');
  const roleFilter = document.getElementById('filter-role');
  const genderFilter = document.getElementById('filter-gender');
  const dialog = document.getElementById('collaborator-dialog');
  const form = document.getElementById('collaborator-form');
  const feedback = document.getElementById('collaborator-feedback');
  const sectorOptions = document.getElementById('sector-options');

  // Os dados (incluindo a migração do formato antigo) são mantidos por Dados.
  let collaborators = Dados.colaboradores();

  function makeInitials(name) {
    return Helpers.initials(name);
  }

  function addCell(row, value, className = '') {
    const cell = document.createElement('td');
    if (className) cell.className = className;
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
  }

  function createRow(person) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const nameWrapper = document.createElement('span');
    const avatar = document.createElement('span');
    const name = document.createElement('span');

    nameWrapper.className = 'collaborator-name';
    avatar.className = 'collaborator-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = makeInitials(person.name);
    name.textContent = person.name;
    nameWrapper.append(avatar, name);
    nameCell.appendChild(nameWrapper);
    row.appendChild(nameCell);

    const genderCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `gender-badge ${person.gender.toLowerCase()}`;
    badge.textContent = person.gender;
    genderCell.appendChild(badge);
    row.appendChild(genderCell);

    addCell(row, person.sector);
    addCell(row, person.role);
    addCell(row, Helpers.formatDuration(Dados.mesesDeCasa(person)));

    const actionCell = document.createElement('td');
    const actionLink = document.createElement('a');
    actionLink.className = 'row-action';
    actionLink.href = `perfil.html?colaborador=${encodeURIComponent(person.id)}`;
    actionLink.setAttribute('aria-label', `Ver jornada de ${person.name}`);
    actionLink.title = 'Ver jornada';
    actionLink.textContent = '···';
    actionCell.appendChild(actionLink);
    row.appendChild(actionCell);

    return row;
  }

  function updateFilterOptions(select, values, placeholder) {
    const currentValue = select.value;
    select.replaceChildren(new Option(placeholder, ''));
    [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach((value) => {
      select.add(new Option(value, value));
    });
    select.value = values.includes(currentValue) ? currentValue : '';
  }

  function refreshFilters() {
    updateFilterOptions(sectorFilter, collaborators.map((person) => person.sector), 'Todos os setores');
    updateFilterOptions(roleFilter, collaborators.map((person) => person.role), 'Todos os cargos');
    sectorOptions.replaceChildren(...Dados.setores().map((sector) => new Option(sector, sector)));
  }

  function refreshPlanOptions() {
    const select = form.elements.cargoId;
    select.replaceChildren(new Option('Selecione', ''));
    Plano.cargosOrdenados().filter((cargo) => cargo.ativo).forEach((cargo) => select.add(new Option(Plano.rotulo(cargo), cargo.id)));
  }

  function renderCollaborators() {
    const query = searchInput.value.trim().toLocaleLowerCase('pt-BR');
    const filtered = collaborators.filter((person) => {
      const searchable = `${person.name} ${person.sector} ${person.role}`.toLocaleLowerCase('pt-BR');
      return searchable.includes(query)
        && (!sectorFilter.value || person.sector === sectorFilter.value)
        && (!roleFilter.value || person.role === roleFilter.value)
        && (!genderFilter.value || person.gender === genderFilter.value);
    });

    listElement.replaceChildren();
    if (filtered.length === 0) {
      const row = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.className = 'table-empty';
      emptyCell.colSpan = 6;
      emptyCell.textContent = 'Nenhum colaborador encontrado com esses filtros.';
      row.appendChild(emptyCell);
      listElement.appendChild(row);
    } else {
      filtered.forEach((person) => listElement.appendChild(createRow(person)));
    }

    countElement.textContent = `${filtered.length} ${filtered.length === 1 ? 'colaborador' : 'colaboradores'}`;
  }

  function openDialog() {
    feedback.hidden = true;
    form.reset();
    refreshPlanOptions();
    dialog.showModal();
    form.elements.name.focus();
  }

  document.getElementById('open-collaborator-form').addEventListener('click', openDialog);
  document.getElementById('close-collaborator-form').addEventListener('click', () => dialog.close());
  document.getElementById('cancel-collaborator-form').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const input = {
      name: String(formData.get('name')).trim(),
      gender: String(formData.get('gender')),
      sector: String(formData.get('sector')).trim(),
      cargoId: String(formData.get('cargoId')),
      anosDeCasa: Number(formData.get('tenure')),
      salario: formData.get('salary') === '' ? null : Number(formData.get('salary'))
    };

    if (!input.name || !input.gender || !input.sector || !input.cargoId || !Number.isFinite(input.anosDeCasa)) {
      feedback.textContent = 'Preencha os campos para salvar o cadastro.';
      feedback.hidden = false;
      return;
    }
    if (input.salario !== null && (!Number.isFinite(input.salario) || input.salario < 0)) {
      feedback.textContent = 'Informe um salário válido ou deixe o campo em branco.';
      feedback.hidden = false;
      return;
    }

    const result = Dados.adicionarColaborador(input);
    if (!result.ok) {
      feedback.textContent = result.erros[0];
      feedback.hidden = false;
      return;
    }
    collaborators = Dados.colaboradores();
    searchInput.value = '';
    sectorFilter.value = '';
    roleFilter.value = '';
    genderFilter.value = '';
    refreshFilters();
    renderCollaborators();
    dialog.close();
  });

  [searchInput, sectorFilter, roleFilter, genderFilter].forEach((control) => {
    control.addEventListener('input', renderCollaborators);
    control.addEventListener('change', renderCollaborators);
  });

  refreshFilters();
  renderCollaborators();
});
