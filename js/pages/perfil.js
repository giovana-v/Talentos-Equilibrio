document.addEventListener('DOMContentLoaded', () => {
  const collaborators = Storage.getItem('talentosColaboradores') || [
    { id: 'c-1', name: 'Ana Silva', gender: 'Feminino', sector: 'Marketing', role: 'Analista', tenure: 2 },
    { id: 'c-adriel', name: 'Adriel Banner', gender: 'Masculino', sector: 'Vendas', role: 'Analista', tenure: 2 },
    { id: 'rh-nicole', name: 'Nicole', gender: 'Feminino', sector: 'RH', role: 'Analista de RH', tenure: 4 }
  ];
  const session = Auth.getSession();
  const requestedId = new URLSearchParams(window.location.search).get('colaborador');

  const personalProfile = session?.role === 'user'
    ? {
        ...(collaborators.find((collaborator) => collaborator.id === 'c-adriel') || {}),
        ...((Storage.getItem(`talentosPerfil:${session.email}`)) || {}),
        id: 'account',
        name: Storage.getItem(`talentosPerfil:${session.email}`)?.name || session.name,
        email: session.email,
        gender: 'Masculino',
        sector: collaborators.find((collaborator) => collaborator.id === 'c-adriel')?.sector || 'Vendas',
        role: collaborators.find((collaborator) => collaborator.id === 'c-adriel')?.role || 'Analista'
      }
    : {
        id: 'account', name: session?.name || 'Colaborador', email: session?.email || '',
        gender: 'Outro', sector: 'Talentos em Equilíbrio', role: 'Colaborador', tenure: 0, tenureMonths: 0
      };

  const person = session?.role === 'user'
    ? personalProfile
    : collaborators.find((collaborator) => collaborator.id === requestedId) || collaborators[0] || personalProfile;

  const title = document.getElementById('profile-page-title');
  const profileName = document.getElementById('profile-name');
  const profileGender = document.getElementById('profile-gender');
  const profileRole = document.getElementById('profile-role-line');
  const profileEmail = document.getElementById('profile-email');
  const profileTenure = document.getElementById('profile-tenure');
  const profileSector = document.getElementById('profile-sector');
  const historyList = document.getElementById('career-history');
  const stagesList = document.getElementById('journey-stages');
  const progressLabel = document.getElementById('journey-progress-label');

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function tenureInMonths(record) {
    if (Number.isFinite(Number(record.tenureMonths))) return Number(record.tenureMonths);
    return Math.max(0, Number(record.tenure) || 0) * 12;
  }

  function formatTenure(totalMonths) {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years && months) return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
    if (years) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  function currentStageIndex(role, months) {
    const normalizedRole = role.toLocaleLowerCase('pt-BR');
    if (/gerente|gerência|diretor/.test(normalizedRole)) return 3;
    if (/liderança|líder|coordenador|coordenação|sênior|senior|especialista/.test(normalizedRole)) return 2;
    if (/pleno|analista|desenvolvedor/.test(normalizedRole) || months >= 12) return 1;
    return 0;
  }

  function renderHistory(record, months, currentIndex) {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - Math.ceil(months / 12);
    const stages = ['Contratação', 'Promoção — Pleno', 'Liderança', 'Gerência'];
    const initialRole = record.role || 'Colaborador';
    const entries = [
      {
        title: 'Contratação',
        date: `Jan/${startYear}`,
        description: `${initialRole} de ${record.sector}`,
        state: 'is-complete'
      }
    ];

    if (months >= 12) {
      entries.push({
        title: `Progressão — ${stages[currentIndex]}`,
        date: `Jan/${startYear + 1}`,
        description: `${record.role} · ${record.sector}`,
        state: 'is-complete'
      });
    }

    entries.push({
      title: 'Atual',
      date: months ? `Jan/${Math.min(currentYear, startYear + Math.max(1, Math.floor(months / 12)))} – atual` : 'Atual',
      description: `${record.role} · ${record.sector}`,
      state: 'is-current'
    });

    historyList.replaceChildren();
    entries.forEach((entry) => {
      const item = document.createElement('li');
      const heading = document.createElement('strong');
      const date = document.createElement('span');
      const description = document.createElement('small');
      item.className = entry.state;
      heading.textContent = entry.title;
      date.textContent = entry.date;
      description.textContent = entry.description;
      item.append(heading, date, description);
      historyList.appendChild(item);
    });
  }

  function renderJourney(currentIndex, months) {
    const stageLabels = ['Contratação', 'Promoção Pleno', 'Liderança', 'Gerência'];
    const currentYear = new Date().getFullYear();
    const yearsSinceHire = Math.ceil(months / 12);
    const dates = stageLabels.map((_, index) => {
      if (index === 0) return `Jan/${currentYear - yearsSinceHire}`;
      if (index <= currentIndex) return `Jan/${currentYear - yearsSinceHire + index}`;
      return '—';
    });

    stagesList.replaceChildren();
    stageLabels.forEach((label, index) => {
      const stage = document.createElement('li');
      const name = document.createElement('strong');
      const date = document.createElement('span');
      if (index < currentIndex) stage.className = 'is-complete';
      if (index === currentIndex) stage.className = 'is-current';
      name.textContent = label;
      date.textContent = dates[index];
      stage.append(name, date);
      stagesList.appendChild(stage);
    });

    const progress = Math.min(75, currentIndex * 25);
    stagesList.style.setProperty('--progress', `${progress}%`);
    progressLabel.textContent = `Etapa ${currentIndex + 1} de ${stageLabels.length}`;
  }

  const months = tenureInMonths(person);
  const stageIndex = currentStageIndex(person.role, months);
  const isPersonalProfile = person.id === 'account';

  title.textContent = isPersonalProfile
    ? 'Meu perfil'
    : person.gender === 'Feminino'
      ? 'Perfil da colaboradora'
      : 'Perfil do colaborador';
  profileName.textContent = person.name;
  profileGender.textContent = person.gender;
  profileGender.classList.toggle('is-masculino', person.gender === 'Masculino');
  profileRole.textContent = `${person.sector} · ${person.role}`;
  profileEmail.textContent = person.email || `${person.name.toLocaleLowerCase('pt-BR').replace(/\s+/g, '.')}@empresa.com`;
  profileTenure.textContent = `Tempo de casa: ${formatTenure(months)}`;
  profileSector.textContent = `Setor: ${person.sector}`;
  document.getElementById('profile-avatar').textContent = initials(person.name);

  const backLink = document.getElementById('profile-back-link');
  if (session?.role === 'user') {
    backLink.href = 'dashboard.html';
    backLink.setAttribute('aria-label', 'Voltar ao dashboard');
  }

  renderHistory(person, months, stageIndex);
  renderJourney(stageIndex, months);
});
