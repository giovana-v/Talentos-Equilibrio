document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'talentosColaboradores';
  const initialCollaborators = [
    { id: 'c-1', name: 'Ana Silva', gender: 'Feminino', sector: 'Marketing', role: 'Analista', tenure: 2 },
    { id: 'c-2', name: 'Beatriz Oliveira', gender: 'Feminino', sector: 'Tecnologia', role: 'Desenvolvedora', tenure: 1 },
    { id: 'c-3', name: 'Carlos Souza', gender: 'Masculino', sector: 'Vendas', role: 'Analista', tenure: 3 },
    { id: 'c-4', name: 'Fernanda Lima', gender: 'Feminino', sector: 'Financeiro', role: 'Assistente', tenure: 4 },
    { id: 'c-5', name: 'Gabriel Santos', gender: 'Masculino', sector: 'Tecnologia', role: 'Desenvolvedor', tenure: 2 },
    { id: 'c-6', name: 'Juliana Costa', gender: 'Feminino', sector: 'RH', role: 'Coordenadora de RH', tenure: 5 },
    { id: 'c-7', name: 'Rafael Martins', gender: 'Masculino', sector: 'Vendas', role: 'Executivo de contas', tenure: 3 },
    { id: 'c-8', name: 'Mariana Alves', gender: 'Feminino', sector: 'Tecnologia', role: 'Analista de dados', tenure: 2 },
    { id: 'c-9', name: 'Lucas Ferreira', gender: 'Masculino', sector: 'Financeiro', role: 'Analista financeiro', tenure: 4 },
    { id: 'c-10', name: 'Patrícia Mendes', gender: 'Feminino', sector: 'Vendas', role: 'Supervisora de vendas', tenure: 6 },
    { id: 'c-11', name: 'Thiago Rocha', gender: 'Masculino', sector: 'Marketing', role: 'Designer', tenure: 1 },
    { id: 'c-12', name: 'Camila Ribeiro', gender: 'Feminino', sector: 'Operações', role: 'Analista de operações', tenure: 3 },
    { id: 'c-13', name: 'Eduardo Nunes', gender: 'Masculino', sector: 'Tecnologia', role: 'Desenvolvedor', tenure: 5 },
    { id: 'c-14', name: 'Larissa Gomes', gender: 'Feminino', sector: 'Financeiro', role: 'Especialista', tenure: 7 },
    { id: 'c-15', name: 'Bruno Carvalho', gender: 'Masculino', sector: 'Vendas', role: 'Analista', tenure: 2 },
    { id: 'c-16', name: 'Renata Dias', gender: 'Feminino', sector: 'Marketing', role: 'Gerente de marketing', tenure: 8 },
    { id: 'c-17', name: 'Felipe Barros', gender: 'Masculino', sector: 'Operações', role: 'Coordenador', tenure: 6 },
    { id: 'c-18', name: 'Isabela Freitas', gender: 'Feminino', sector: 'RH', role: 'Analista de RH', tenure: 2 },
    { id: 'c-19', name: 'André Lima', gender: 'Masculino', sector: 'Financeiro', role: 'Assistente', tenure: 1 },
    { id: 'c-adriel', name: 'Adriel Banner', gender: 'Masculino', sector: 'Vendas', role: 'Analista', tenure: 2 },
    { id: 'rh-nicole', name: 'Nicole', gender: 'Feminino', sector: 'RH', role: 'Analista de RH', tenure: 4 }
  ];

  function addDemoEmployees(firstNames, gender, amount, startingId) {
    const surnames = ['Almeida', 'Azevedo', 'Barbosa', 'Batista', 'Campos', 'Cardoso', 'Castro', 'Cavalcanti', 'Cunha', 'Farias', 'Gonçalves', 'Lopes', 'Machado', 'Monteiro', 'Moraes', 'Moreira', 'Nascimento', 'Pereira', 'Ramos', 'Rezende', 'Santana', 'Teixeira', 'Vieira', 'Xavier'];
    const sectors = ['Vendas', 'Tecnologia', 'Marketing', 'Financeiro', 'RH', 'Operações'];
    const roles = gender === 'Feminino'
      ? ['Analista', 'Assistente', 'Especialista', 'Coordenadora', 'Consultora', 'Desenvolvedora', 'Executiva de contas']
      : ['Analista', 'Assistente', 'Especialista', 'Coordenador', 'Consultor', 'Desenvolvedor', 'Executivo de contas'];
    const existingNames = new Set(initialCollaborators.map((person) => person.name.toLocaleLowerCase('pt-BR')));
    let added = 0;

    for (const firstName of firstNames) {
      for (const surname of surnames) {
        if (added >= amount) return;
        const name = `${firstName} ${surname}`;
        if (existingNames.has(name.toLocaleLowerCase('pt-BR'))) continue;
        existingNames.add(name.toLocaleLowerCase('pt-BR'));
        initialCollaborators.push({
          id: `c-${startingId + added}`,
          name,
          gender,
          sector: sectors[(startingId + added) % sectors.length],
          role: roles[(startingId + added) % roles.length],
          tenure: (startingId + added) % 10
        });
        added += 1;
      }
    }
  }

  addDemoEmployees(['Aline', 'Amanda', 'Bianca', 'Bruna', 'Carolina', 'Cecília', 'Daniela', 'Elisa', 'Emília', 'Estela', 'Flávia', 'Helena', 'Isadora', 'Júlia', 'Letícia', 'Luana', 'Manuela', 'Natália', 'Paula', 'Raquel'], 'Feminino', 101, 1000);
  addDemoEmployees(['Alexandre', 'Antônio', 'Caio', 'Danilo', 'Diego', 'Douglas', 'Enzo', 'Gustavo', 'Heitor', 'Igor', 'João', 'Leonardo', 'Marcelo', 'Matheus', 'Murilo', 'Otávio', 'Pedro', 'Rodrigo', 'Samuel', 'Vinícius'], 'Masculino', 134, 2000);

  const listElement = document.getElementById('collaborators-list');
  const countElement = document.getElementById('collaborators-count');
  const searchInput = document.getElementById('search-colaboradores');
  const sectorFilter = document.getElementById('filter-sector');
  const roleFilter = document.getElementById('filter-role');
  const genderFilter = document.getElementById('filter-gender');
  const dialog = document.getElementById('collaborator-dialog');
  const form = document.getElementById('collaborator-form');
  const feedback = document.getElementById('collaborator-feedback');

  const storedCollaborators = Storage.getItem(STORAGE_KEY);
  let collaborators = Array.isArray(storedCollaborators) ? storedCollaborators : [];
  let normalizedSectorNames = false;
  collaborators.forEach((person) => {
    if (person.sector === 'Recursos Humanos') {
      person.sector = 'RH';
      normalizedSectorNames = true;
    }
  });
  const collaboratorIds = new Set(collaborators.map((person) => person.id));
  const newSeedRecords = initialCollaborators.filter((person) => !collaboratorIds.has(person.id));
  if (!storedCollaborators || newSeedRecords.length || normalizedSectorNames) {
    collaborators = [...collaborators, ...newSeedRecords];
    Storage.setItem(STORAGE_KEY, collaborators);
  }

  function makeInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
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
    addCell(row, `${person.tenure} ${person.tenure === 1 ? 'ano' : 'anos'}`);

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
    const person = {
      id: globalThis.crypto?.randomUUID?.() || `c-${Date.now()}`,
      name: String(formData.get('name')).trim(),
      gender: String(formData.get('gender')),
      sector: String(formData.get('sector')).trim(),
      role: String(formData.get('role')).trim(),
      tenure: Number(formData.get('tenure'))
    };

    if (!person.name || !person.gender || !person.sector || !person.role || !Number.isFinite(person.tenure)) {
      feedback.textContent = 'Preencha os campos para salvar o cadastro.';
      feedback.hidden = false;
      return;
    }

    collaborators.push(person);
    if (!Storage.setItem(STORAGE_KEY, collaborators)) {
      collaborators.pop();
      feedback.textContent = 'Não foi possível salvar neste navegador. Verifique o espaço disponível e tente novamente.';
      feedback.hidden = false;
      return;
    }
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
