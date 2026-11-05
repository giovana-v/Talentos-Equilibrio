document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.getSession();
  if (!session) return;

  if (session.role === 'user') initializeEmployeeDashboard(session);
  if (session.role === 'admin') initializeAdminDashboard();

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
  Navbar.init({ notificacoes: notifications, chaveLidas: `talentosNotificacoesLidas:${session.role}` });
});

/* Dashboard do RH: tudo é calculado por Analytics a partir dos colaboradores, do plano e das promoções. */
function initializeAdminDashboard() {
  const { el, formatNumber, formatPercent, plural } = Helpers;

  function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  }

  function renderChange(selector, delta, { higherIsWorse }) {
    const element = document.querySelector(selector);
    if (!element) return;
    element.className = 'metric-change';
    if (delta === null) {
      element.textContent = 'Sem dados do período anterior';
      return;
    }
    if (Math.abs(delta) < 0.05) {
      element.textContent = 'Sem variação vs. 12 meses anteriores';
      return;
    }
    const increase = delta > 0;
    const adverse = higherIsWorse ? increase : !increase;
    element.classList.add(adverse ? (increase ? 'is-up' : 'is-down') : 'is-good');
    element.replaceChildren(
      el('span', { 'aria-hidden': 'true', text: increase ? '↑' : '↓' }),
      el('span', { class: 'visually-hidden', text: increase ? ' Alta de ' : ' Queda de ' }),
      ` ${formatNumber(Math.abs(delta), 1)} p.p. vs. 12 meses anteriores`
    );
  }

  function renderMetrics() {
    const summary = Analytics.resumo();
    const rates = Analytics.taxas('ultimos12');
    setText('[data-metric="total"]', formatNumber(summary.total));
    const parts = [`${plural(summary.mulheres, 'mulher', 'mulheres')} (${formatPercent(summary.pctMulheres || 0)})`, plural(summary.homens, 'homem', 'homens')];
    if (summary.outros) parts.push(`${plural(summary.outros, 'pessoa', 'pessoas')} de outro gênero`);
    setText('[data-metric-note="total"]', parts.join(' · '));

    setText('[data-metric="lideranca"]', formatNumber(summary.lideresMulheres));
    setText('[data-metric-note="lideranca"]', summary.lideres
      ? `(${formatPercent(summary.pctMulheresNaLideranca)} do total de líderes)`
      : 'Nenhum cargo de liderança ocupado');

    const women = rates.atual.F;
    setText('[data-metric="promocao"]', women.promocao === null ? '—' : formatPercent(women.promocao));
    renderChange('[data-metric-note="promocao"]', rates.variacao.promocaoF, { higherIsWorse: false });
    setText('[data-metric="desistencia"]', women.desistencia === null ? '—' : formatPercent(women.desistencia));
    renderChange('[data-metric-note="desistencia"]', rates.variacao.desistenciaF, { higherIsWorse: true });
  }

  function renderFunnel() {
    const target = document.getElementById('career-funnel');
    target.replaceChildren(Charts.funilCarreira({ id: 'career-funnel-chart', titulo: 'Funil de carreira — mulheres e homens por cargo', ...Analytics.funil() }));
  }

  function renderPromotionTime() {
    const time = Analytics.tempoAtePromocao();
    ['F', 'M'].forEach((key) => {
      const group = time[key];
      setText(`[data-promotion-time="${key}"]`, group.pequena ? 'amostra pequena' : Helpers.formatYears(group.mediaMeses));
    });
  }

  function renderSectorGaps() {
    const list = document.querySelector('[data-sector-gaps]');
    const gaps = Analytics.setoresComMaiorDiferenca(3);
    list.replaceChildren(...(gaps.length
      ? gaps.map((item) => el('li', {},
        el('span', { text: item.setor }),
        el('strong', {}, el('span', { 'aria-hidden': 'true', text: '↗' }), ` ${formatNumber(item.lacunaLideranca, 1)} p.p.`)))
      : [el('li', {}, el('span', { class: 'muted-text', text: 'Nenhuma diferença identificada (ou amostra pequena).' }))]));
  }

  function initHeatmap() {
    const sectorSelect = document.getElementById('heatmap-sector');
    const periodSelect = document.getElementById('heatmap-period');
    const container = document.getElementById('promotion-heatmap');
    Dados.setores().forEach((sector) => sectorSelect.add(new Option(sector, sector)));
    Analytics.opcoesDePeriodo().forEach((option) => periodSelect.add(new Option(option.rotulo, option.valor)));
    const draw = () => PromotionHeatmap.render(container, Analytics.mapaPromocoes({ periodo: periodSelect.value, setor: sectorSelect.value }), { linkParaPerfil: true });
    sectorSelect.addEventListener('change', draw);
    periodSelect.addEventListener('change', draw);
    draw();
  }

  function renderPlanUsage() {
    const summary = Analytics.resumo();
    const levels = Analytics.niveis();
    const signed = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value), 1)} p.p.`;
    document.getElementById('plan-usage-table').replaceChildren(Charts.tabela({
      descricao: 'Pessoas por cargo do plano, percentual de mulheres, diferença para o percentual de mulheres no quadro e diferença salarial média',
      colunas: ['Cargo', 'Pessoas', '% de mulheres', 'Diferença vs. quadro', 'Salário médio (M vs. H)'],
      linhas: levels.map((level) => [
        level.nome,
        formatNumber(level.total),
        level.pctMulheresNoNivel === null ? (level.total ? 'amostra pequena' : '—') : formatPercent(level.pctMulheresNoNivel),
        level.pctMulheresNoNivel === null || summary.pctMulheres === null ? '—' : signed(level.pctMulheresNoNivel - summary.pctMulheres),
        level.difSalarioMedio === null ? (level.total ? 'amostra pequena' : '—') : `${level.difSalarioMedio > 0 ? '+' : '−'}${formatPercent(Math.abs(level.difSalarioMedio))}`
      ])
    }));

    const list = document.getElementById('plan-bottlenecks');
    const bottlenecks = Analytics.gargalos().slice(0, 5);
    list.replaceChildren(...(bottlenecks.length
      ? bottlenecks.map((item) => el('li', {},
        el('strong', { text: item.nome }),
        el('span', { text: `Média de ${Helpers.formatDuration(item.mediaMeses)} no cargo (mínimo ${Helpers.formatDuration(item.minimoMeses)}). ${formatPercent(item.pctElegiveis, 0)} das pessoas já cumpriram o tempo mínimo.` })))
      : [el('li', {}, el('span', { class: 'muted-text', text: 'Nenhum gargalo identificado.' }))]));
  }

  renderMetrics();
  renderFunnel();
  renderPromotionTime();
  renderSectorGaps();
  initHeatmap();
  renderPlanUsage();
}

function initializeEmployeeDashboard(session) {
  const profileKey = `talentosPerfil:${session.email}`;
  const goalsKey = `talentosMetas:${session.email}`;
  const profileForm = document.querySelector('[data-employee-profile-form]');
  const goalsList = document.querySelector('[data-employee-goals]');
  if (!profileForm || !goalsList) return;

  const savedProfile = Storage.getItem(profileKey) || {};
  const employee = Dados.colaboradorDaSessao(session);
  profileForm.elements.name.value = savedProfile.name || session.name;
  profileForm.elements.phone.value = savedProfile.phone || '';
  profileForm.elements.bio.value = savedProfile.bio || '';

  if (employee) {
    const cargo = Plano.cargo(employee.cargoId);
    const steps = cargo ? Plano.cargosDaTrilha(cargo.trilhaId).filter((item) => item.ativo || item.id === cargo.id) : [];
    document.querySelector('[data-employee-role]').textContent = employee.role;
    document.querySelector('[data-employee-sector]').textContent = employee.sector;
    document.querySelector('[data-employee-tenure]').textContent = Helpers.formatDuration(Dados.mesesDeCasa(employee));
    document.querySelector('[data-employee-stage]').textContent = cargo
      ? `Nível ${steps.findIndex((item) => item.id === cargo.id) + 1} de ${steps.length}`
      : 'Sem cargo no plano';
  }

  function updateEmployeeName(name) {
    document.querySelectorAll('[data-auth-name]').forEach((element) => { element.textContent = name; });
    document.querySelectorAll('[data-auth-initials]').forEach((element) => { element.textContent = Helpers.initials(name); });
    document.querySelector('[data-auth-user-menu]')?.setAttribute('aria-label', `Perfil de ${name}`);
    if (employee) Dados.atualizarColaborador(employee.id, { name });
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
