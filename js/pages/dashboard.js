document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.getSession();
  if (!session) return;

  if (session.role === 'user') initializeEmployeeDashboard(session);

  if (session.role === 'admin') {
    const collaborators = Storage.getItem('talentosColaboradores');
    if (Array.isArray(collaborators) && collaborators.length) {
      const women = collaborators.filter((person) => person.gender === 'Feminino').length;
      const men = collaborators.filter((person) => person.gender === 'Masculino').length;
      const other = collaborators.length - women - men;
      const totalElement = document.querySelector('[data-dashboard-total]');
      const genderSummary = document.querySelector('[data-dashboard-gender-counts]');
      if (totalElement) totalElement.textContent = collaborators.length.toLocaleString('pt-BR');
      if (genderSummary) {
        const womenShare = collaborators.length ? (women / collaborators.length) * 100 : 0;
        const parts = [`${women} ${women === 1 ? 'mulher' : 'mulheres'} (${womenShare.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)`, `${men} ${men === 1 ? 'homem' : 'homens'}`];
        if (other) parts.push(`${other} ${other === 1 ? 'pessoa' : 'pessoas'} de outro gênero`);
        genderSummary.textContent = parts.join(' · ');
      }
    }
  }

  const notifications = session.role === 'admin'
    ? [
        { id: 'promotion-review', title: 'Revisão de promoção próxima', body: 'Beatriz Oliveira tem acompanhamento de carreira previsto para 30/10/2026.', date: '30 out 2026', href: 'perfil.html?colaborador=c-2' },
        { id: 'tenure-milestone', title: 'Marco de tempo de casa', body: 'Fernanda Lima completa 5 anos na empresa em 12/11/2026.', date: '12 nov 2026', href: 'perfil.html?colaborador=c-4' },
        { id: 'equity-report', title: 'Acompanhamento de equidade', body: 'Confira os indicadores de liderança e progressão no relatório de RH.', date: 'Relatórios', href: 'relatorios.html' }
      ]
    : [
        { id: 'career-checkin', title: 'Acompanhe sua jornada', body: 'Revise seu perfil e converse com o RH sobre seus próximos objetivos de carreira.', date: 'Jornada de carreira', href: 'perfil.html' },
        { id: 'development-plan', title: 'Plano de desenvolvimento', body: 'Registre aprendizados e resultados para apoiar sua próxima conversa de desenvolvimento.', date: 'Dica de carreira', href: 'perfil.html' }
      ];

  const readKey = `talentosNotificacoesLidas:${session.role}`;
  const list = document.querySelector('[data-notification-list]');
  const count = document.querySelector('[data-notification-count]');
  const dot = document.querySelector('[data-notification-dot]');
  const markReadButton = document.querySelector('[data-mark-notifications-read]');
  const notificationToggle = document.querySelector('[data-notifications-toggle]');
  const profileToggle = document.querySelector('[data-auth-user-menu]');
  const notificationsPopover = document.getElementById('notifications-popover');
  const profilePopover = document.getElementById('profile-popover');

  function readIds() {
    try { return new Set(Storage.getItem(readKey) || []); }
    catch { return new Set(); }
  }

  let read = readIds();

  function updateNotificationState() {
    const unreadCount = notifications.filter((item) => !read.has(item.id)).length;
    count.textContent = `${unreadCount} ${unreadCount === 1 ? 'nova' : 'novas'}`;
    dot.hidden = unreadCount === 0;
    markReadButton.disabled = unreadCount === 0;
    notificationToggle.setAttribute('aria-label', unreadCount ? `Notificações, ${unreadCount} não lidas` : 'Notificações, todas lidas');
    list.replaceChildren();
    notifications.forEach((item) => {
      const row = document.createElement('li');
      const link = document.createElement('a');
      const heading = document.createElement('strong');
      const body = document.createElement('span');
      const date = document.createElement('small');
      const isUnread = !read.has(item.id);
      row.className = `notification-item${isUnread ? ' is-unread' : ''}`;
      link.href = item.href;
      link.dataset.notificationId = item.id;
      heading.textContent = item.title;
      body.textContent = item.body;
      date.textContent = item.date;
      link.append(heading, body, date);
      row.append(link);
      list.append(row);
    });
  }

  function setPopover(openPopover, closedPopover, toggle) {
    const opening = openPopover.hidden;
    openPopover.hidden = !opening;
    closedPopover.hidden = true;
    toggle.setAttribute('aria-expanded', String(opening));
    const closedToggle = toggle === notificationToggle ? profileToggle : notificationToggle;
    closedToggle.setAttribute('aria-expanded', 'false');
  }

  notificationToggle.addEventListener('click', () => setPopover(notificationsPopover, profilePopover, notificationToggle));
  profileToggle.addEventListener('click', () => setPopover(profilePopover, notificationsPopover, profileToggle));
  document.querySelector('[data-mark-notifications-read]').addEventListener('click', () => {
    read = new Set(notifications.map((item) => item.id));
    try { Storage.setItem(readKey, [...read]); } catch { /* interface remains usable in private browsing */ }
    updateNotificationState();
  });
  list.addEventListener('click', (event) => {
    const link = event.target.closest('[data-notification-id]');
    if (!link) return;
    read.add(link.dataset.notificationId);
    try { Storage.setItem(readKey, [...read]); } catch { /* navigation still works without storage */ }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.popover-wrap')) {
      notificationsPopover.hidden = true;
      profilePopover.hidden = true;
      notificationToggle.setAttribute('aria-expanded', 'false');
      profileToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    notificationsPopover.hidden = true;
    profilePopover.hidden = true;
    notificationToggle.setAttribute('aria-expanded', 'false');
    profileToggle.setAttribute('aria-expanded', 'false');
  });

  updateNotificationState();
});

function initializeEmployeeDashboard(session) {
  const profileKey = `talentosPerfil:${session.email}`;
  const goalsKey = `talentosMetas:${session.email}`;
  const collaboratorsKey = 'talentosColaboradores';
  const profileForm = document.querySelector('[data-employee-profile-form]');
  const goalsList = document.querySelector('[data-employee-goals]');
  if (!profileForm || !goalsList) return;

  const savedProfile = Storage.getItem(profileKey) || {};
  const collaborators = Storage.getItem(collaboratorsKey) || [];
  const employee = collaborators.find((person) => person.id === 'c-adriel') || {
    id: 'c-adriel', name: session.name, gender: 'Masculino', sector: 'Vendas', role: 'Analista', tenure: 2
  };
  profileForm.elements.name.value = savedProfile.name || session.name;
  profileForm.elements.phone.value = savedProfile.phone || '';
  profileForm.elements.bio.value = savedProfile.bio || '';

  const years = Number(employee.tenure) || 0;
  const months = Number(employee.tenureMonths) || 0;
  document.querySelector('[data-employee-role]').textContent = employee.role;
  document.querySelector('[data-employee-sector]').textContent = employee.sector;
  document.querySelector('[data-employee-tenure]').textContent = [
    years ? `${years} ${years === 1 ? 'ano' : 'anos'}` : '',
    months ? `${months} ${months === 1 ? 'mês' : 'meses'}` : ''
  ].filter(Boolean).join(' e ') || 'Recém-chegado(a)';
  document.querySelector('[data-employee-stage]').textContent = /gerente|diretor/i.test(employee.role)
    ? 'Gerência'
    : /coordena|lider|sênior|senior|especialista/i.test(employee.role) ? 'Liderança' : 'Pleno';

  function updateEmployeeName(name) {
    document.querySelectorAll('[data-auth-name]').forEach((element) => { element.textContent = name; });
    const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    document.querySelectorAll('[data-auth-initials]').forEach((element) => { element.textContent = initials; });
    document.querySelector('[data-auth-user-menu]')?.setAttribute('aria-label', `Perfil de ${name}`);
    const nextCollaborators = collaborators.map((person) => person.id === employee.id ? { ...person, name } : person);
    Storage.setItem(collaboratorsKey, nextCollaborators);
  }

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('[data-profile-save-status]');
    const nextProfile = {
      ...savedProfile,
      name: profileForm.elements.name.value.trim(),
      phone: profileForm.elements.phone.value.trim(),
      bio: profileForm.elements.bio.value.trim()
    };
    if (!nextProfile.name) {
      status.textContent = 'Informe seu nome para salvar o perfil.';
      return;
    }
    if (!Storage.setItem(profileKey, nextProfile) || !Auth.updateDisplayName(nextProfile.name)) {
      status.textContent = 'Não foi possível salvar agora. Tente novamente.';
      return;
    }
    Object.assign(savedProfile, nextProfile);
    updateEmployeeName(nextProfile.name);
    status.textContent = 'Perfil atualizado neste navegador.';
  });

  const defaultGoals = [
    { id: 'goal-feedback', text: 'Agendar uma conversa de desenvolvimento com a liderança', done: false },
    { id: 'goal-course', text: 'Concluir um curso relacionado à minha área', done: false },
    { id: 'goal-results', text: 'Registrar resultados importantes do trimestre', done: true }
  ];
  let goals = Storage.getItem(goalsKey);
  if (!Array.isArray(goals)) {
    goals = defaultGoals;
    Storage.setItem(goalsKey, goals);
  }
  const goalStatus = document.querySelector('[data-goal-status]');

  function renderGoals() {
    goalsList.replaceChildren();
    goals.forEach((goal) => {
      const item = document.createElement('li');
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      const text = document.createElement('span');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(goal.done);
      checkbox.setAttribute('aria-label', `${goal.done ? 'Reabrir' : 'Concluir'} meta: ${goal.text}`);
      text.textContent = goal.text;
      if (goal.done) item.classList.add('is-complete');
      label.append(checkbox, text);
      item.append(label);
      checkbox.addEventListener('change', () => {
        const previous = goal.done;
        goal.done = checkbox.checked;
        if (!Storage.setItem(goalsKey, goals)) {
          goal.done = previous;
          checkbox.checked = previous;
          goalStatus.textContent = 'Não foi possível salvar a meta neste navegador.';
          return;
        }
        item.classList.toggle('is-complete', goal.done);
        checkbox.setAttribute('aria-label', `${goal.done ? 'Reabrir' : 'Concluir'} meta: ${goal.text}`);
        goalStatus.textContent = 'Meta atualizada.';
      });
      goalsList.append(item);
    });
  }

  document.querySelector('[data-employee-goal-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.goal;
    const text = input.value.trim();
    if (!text) return;
    goals.push({ id: `goal-${Date.now()}`, text, done: false });
    if (!Storage.setItem(goalsKey, goals)) {
      goals.pop();
      goalStatus.textContent = 'Não foi possível adicionar a meta neste navegador.';
      return;
    }
    input.value = '';
    goalStatus.textContent = 'Meta adicionada.';
    renderGoals();
  });

  renderGoals();
}
