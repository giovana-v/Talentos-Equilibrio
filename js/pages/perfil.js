document.addEventListener('DOMContentLoaded', () => {
  const { el, formatCurrency, formatDate, formatDuration, formatNumber } = Helpers;
  const session = Auth.getSession();
  const isAdmin = Boolean(session) && session.role === 'admin';
  const ownRecord = Dados.colaboradorDaSessao(session);
  const requestedId = Helpers.queryParam('colaborador');
  // O colaborador só enxerga o próprio registro; o parâmetro da URL vale apenas para o RH.
  const personId = (isAdmin && requestedId && Dados.colaborador(requestedId))
    ? requestedId
    : (ownRecord ? ownRecord.id : (Dados.colaboradores()[0] || {}).id);
  const isOwnProfile = Boolean(ownRecord) && personId === ownRecord.id;
  const status = document.getElementById('profile-status');
  let person = Dados.colaborador(personId);

  if (!person) {
    document.getElementById('profile-name').textContent = 'Perfil não encontrado';
    return;
  }

  const backLink = document.getElementById('profile-back-link');
  if (!isAdmin || isOwnProfile) {
    backLink.href = 'dashboard.html';
    backLink.setAttribute('aria-label', 'Voltar ao dashboard');
  }

  const infoItem = (label, value) => el('div', {}, el('dt', { text: label }), el('dd', { text: value }));

  function renderIdentity() {
    const cargo = Plano.cargo(person.cargoId);
    document.getElementById('profile-page-title').textContent = isOwnProfile
      ? 'Meu perfil'
      : person.gender === 'Feminino' ? 'Perfil da colaboradora' : 'Perfil do colaborador';
    document.getElementById('profile-name').textContent = person.name;
    const badge = document.getElementById('profile-gender');
    badge.textContent = person.gender;
    badge.classList.toggle('is-masculino', person.gender === 'Masculino');
    document.getElementById('profile-role-line').textContent = `${person.sector} · ${cargo ? cargo.nome : 'Sem cargo no plano'}${person.funcao ? ` (${person.funcao})` : ''}`;
    document.getElementById('profile-email').textContent = person.email || `${Helpers.normalize(person.name).replace(/\s+/g, '.')}@empresa.com`;
    document.getElementById('profile-tenure').textContent = `Tempo de casa: ${formatDuration(Dados.mesesDeCasa(person))}`;
    document.getElementById('profile-sector').textContent = `Setor: ${person.sector}`;
    document.getElementById('profile-avatar').textContent = Helpers.initials(person.name);
  }

  function renderContract() {
    const end = person.contractEnd;
    const ended = end && end < Helpers.toISO(new Date());
    document.getElementById('contract-details').replaceChildren(
      infoItem('Tipo de contrato', person.contractType || 'Não informado'),
      infoItem('Data de início', formatDate(person.contractStart || person.hireDate)),
      infoItem('Data de término', end ? formatDate(end) : 'Sem data de término'),
      infoItem('Situação', end ? (ended ? 'Encerrado' : 'Vigente, com data de término') : 'Vigente, prazo indeterminado'));
  }

  function renderPay() {
    const cargo = Plano.cargo(person.cargoId);
    const salary = Number(person.salary);
    document.getElementById('pay-salary').textContent = formatCurrency(salary);
    document.getElementById('pay-range').textContent = cargo ? `${formatCurrency(cargo.faixaSalarialMin)} a ${formatCurrency(cargo.faixaSalarialMax)}` : 'Não informada';

    const bar = document.getElementById('pay-progress');
    const position = document.getElementById('pay-position');
    if (cargo && salary > 0 && cargo.faixaSalarialMax > cargo.faixaSalarialMin) {
      const raw = ((salary - cargo.faixaSalarialMin) / (cargo.faixaSalarialMax - cargo.faixaSalarialMin)) * 100;
      const pct = Math.min(100, Math.max(0, raw));
      const text = salary < cargo.faixaSalarialMin
        ? 'Salário abaixo da faixa do cargo.'
        : salary > cargo.faixaSalarialMax
          ? 'Salário acima da faixa do cargo.'
          : `Posição na faixa: ${formatNumber(pct, 0)}% entre o piso e o teto do cargo.`;
      document.getElementById('pay-progress-bar').style.width = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(Math.round(pct)));
      bar.setAttribute('aria-valuetext', text);
      position.textContent = text;
    } else {
      document.getElementById('pay-progress-bar').style.width = '0%';
      bar.setAttribute('aria-valuenow', '0');
      bar.setAttribute('aria-valuetext', 'Posição na faixa indisponível');
      position.textContent = 'Posição na faixa indisponível.';
    }

    const history = [...(person.salaryHistory || [])].sort((a, b) => a.data.localeCompare(b.data));
    const rows = history.map((entry, index) => {
      const previous = index ? history[index - 1].valor : null;
      const change = previous ? ((entry.valor - previous) / previous) * 100 : null;
      return [formatDate(entry.data), entry.motivo, formatCurrency(entry.valor), change === null ? '—' : `${change >= 0 ? '+' : '−'}${Helpers.formatPercent(Math.abs(change))}`];
    }).reverse();
    document.getElementById('pay-history').replaceChildren(rows.length
      ? Charts.tabela({ descricao: 'Histórico de reajustes salariais, do mais recente ao mais antigo', colunas: ['Data', 'Motivo', 'Valor', 'Variação'], linhas: rows })
      : el('p', { class: 'muted-text', text: 'Nenhum reajuste registrado.' }));
  }

  function renderBenefits() {
    const benefits = Dados.beneficiosDoColaborador(person);
    document.getElementById('profile-benefits').replaceChildren(...(benefits.length
      ? benefits.map((benefit) => el('li', {},
        el('span', { class: 'benefit-icon' }, Helpers.icon(benefit.icone)),
        el('div', {}, el('strong', { text: benefit.nome }), el('span', { text: benefit.descricao }))))
      : [el('li', { class: 'is-empty' }, el('span', { text: 'Nenhum benefício aplicável a este tipo de contrato.' }))]));
  }

  function personNode(other, { highlight = false } = {}) {
    const cargo = Plano.cargo(other.cargoId);
    const label = isAdmin && !highlight
      ? el('a', { href: `perfil.html?colaborador=${encodeURIComponent(other.id)}`, text: other.name })
      : el('strong', { text: other.name });
    return el('span', { class: 'org-person' }, label, el('small', { text: cargo ? cargo.nome : 'Sem cargo' }),
      highlight ? el('span', { class: 'visually-hidden', text: ' (esta pessoa)' }) : null);
  }

  function renderOrg() {
    const org = Dados.organograma(person.id);
    const maxPeers = 6;
    const maxReports = 8;
    const reports = org.subordinados.slice(0, maxReports).map((other) => el('li', {}, personNode(other)));
    if (org.subordinados.length > maxReports) reports.push(el('li', { class: 'org-more', text: `+ ${org.subordinados.length - maxReports} subordinados` }));
    const self = el('li', { class: 'is-self', 'aria-current': 'true' }, personNode(person, { highlight: true }),
      reports.length ? el('ul', {}, reports) : null);
    const peers = org.pares.slice(0, maxPeers).map((other) => el('li', {}, personNode(other)));
    if (org.pares.length > maxPeers) peers.push(el('li', { class: 'org-more', text: `+ ${org.pares.length - maxPeers} colegas` }));
    const level = el('ul', {}, self, peers);

    let tree;
    if (org.gestor) {
      const manager = el('li', {}, personNode(org.gestor), level);
      tree = org.superior ? el('ul', { class: 'org-tree' }, el('li', { class: 'org-above' }, personNode(org.superior), el('ul', {}, manager))) : el('ul', { class: 'org-tree' }, manager);
    } else {
      tree = el('ul', { class: 'org-tree' }, self, peers);
    }
    document.getElementById('profile-org-chart').replaceChildren(tree);
  }

  function renderProjects() {
    const projects = [...(person.projects || [])].sort((a, b) => b.inicio.localeCompare(a.inicio));
    const target = document.getElementById('profile-projects');
    if (!projects.length) {
      target.replaceChildren(el('p', { class: 'muted-text', text: 'Nenhum projeto cadastrado.' }));
      return;
    }
    const header = ['Projeto', 'Papel', 'Período', 'Status', 'Resultado'];
    if (isAdmin) header.push('Ações');
    target.replaceChildren(el('table', { class: 'data-table' },
      el('caption', { class: 'visually-hidden', text: 'Projetos em que a pessoa participou' }),
      el('thead', {}, el('tr', {}, header.map((title) => el('th', { scope: 'col', text: title })))),
      el('tbody', {}, projects.map((project) => el('tr', {},
        el('th', { scope: 'row', text: project.nome }),
        el('td', { text: project.papel || '—' }),
        el('td', { text: `${formatDate(project.inicio)} – ${project.fim ? formatDate(project.fim) : 'atual'}` }),
        el('td', { text: project.status }),
        el('td', { text: project.resultado || '—' }),
        isAdmin ? el('td', {}, el('button', {
          class: 'button button-link',
          type: 'button',
          'aria-label': `Remover projeto ${project.nome}`,
          text: 'Remover',
          onClick: () => removeProject(project)
        })) : null)))));
  }

  function renderHistory() {
    const promotions = Dados.promocoesDe(person.id);
    const nameOf = (id) => (Plano.cargo(id) ? Plano.cargo(id).nome : 'Cargo removido');
    const firstCargo = promotions.length ? nameOf(promotions[0].cargoOrigemId) : (person.role || 'Colaborador');
    const entries = [{ title: 'Contratação', date: formatDate(person.hireDate), description: `${firstCargo} de ${person.sector}`, state: 'is-complete' }];
    promotions.forEach((promotion) => entries.push({
      title: `Promoção — ${nameOf(promotion.cargoDestinoId)}`,
      date: formatDate(promotion.data),
      description: `${nameOf(promotion.cargoOrigemId)} → ${nameOf(promotion.cargoDestinoId)}`,
      state: 'is-complete'
    }));
    entries.push({
      title: 'Atual',
      date: `Desde ${formatDate(person.cargoDesde || person.hireDate)}`,
      description: `${person.role} · ${person.sector} · há ${formatDuration(Dados.mesesNoCargo(person))} no cargo`,
      state: 'is-current'
    });
    document.getElementById('career-history').replaceChildren(...entries.map((entry) => el('li', { class: entry.state },
      el('strong', { text: entry.title }), el('span', { text: entry.date }), el('small', { text: entry.description }))));
  }

  function renderJourney() {
    const cargo = Plano.cargo(person.cargoId);
    Jornada.render(document.getElementById('journey-content'), { cargoId: person.cargoId, mesesNoCargo: Dados.mesesNoCargo(person) });
    const label = document.getElementById('journey-progress-label');
    if (!cargo) { label.textContent = ''; return; }
    const steps = Plano.cargosDaTrilha(cargo.trilhaId).filter((item) => item.ativo || item.id === cargo.id);
    label.textContent = `Nível ${steps.findIndex((item) => item.id === cargo.id) + 1} de ${steps.length}`;
  }

  function renderAll() {
    person = Dados.colaborador(personId);
    renderIdentity();
    renderContract();
    renderPay();
    renderBenefits();
    renderOrg();
    renderProjects();
    renderHistory();
    renderJourney();
  }

  /* Ações do RH */
  function showErrors(box, errors) {
    box.replaceChildren(errors.length === 1 ? el('p', { text: errors[0] }) : el('ul', {}, errors.map((error) => el('li', { text: error }))));
    box.hidden = false;
  }

  function setupDialog(id) {
    const dialog = Helpers.prepareDialog(document.getElementById(id));
    dialog.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    return dialog;
  }

  async function removeProject(project) {
    const confirmed = await Helpers.confirmDialog({ title: 'Remover projeto', message: `Remover "${project.nome}" do perfil de ${person.name}?`, confirmLabel: 'Remover', danger: true });
    if (!confirmed) return;
    const result = Dados.removerProjeto(person.id, project.id);
    renderAll();
    Helpers.announce(status, result.ok ? 'Projeto removido.' : result.erros[0], result.ok ? 'success' : 'error');
  }

  renderAll();
  if (isAdmin) setupAdminActions();

  function setupAdminActions() {
    const today = Helpers.toISO(new Date());

    /* Registrar promoção */
    const promotionDialog = setupDialog('promotion-dialog');
    const promotionForm = document.getElementById('promotion-form');
    const promotionError = document.getElementById('promotion-error');

    function updateSalaryHint() {
      const target = Plano.cargo(promotionForm.elements.destino.value);
      document.getElementById('promotion-salary-hint').textContent = target
        ? `Faixa de ${target.nome}: ${formatCurrency(target.faixaSalarialMin)} a ${formatCurrency(target.faixaSalarialMax)}. Em branco mantém o salário atual.`
        : 'Opcional. Em branco mantém o salário atual.';
    }

    document.getElementById('open-promotion').addEventListener('click', () => {
      const current = Plano.cargo(person.cargoId);
      const next = Plano.proximos(person.cargoId).filter((cargo) => cargo.ativo);
      const others = Plano.cargosOrdenados().filter((cargo) => cargo.ativo && cargo.id !== person.cargoId && !next.some((item) => item.id === cargo.id));
      const select = promotionForm.elements.destino;
      select.replaceChildren(new Option('Selecione', ''));
      const group = (label, list) => {
        if (!list.length) return;
        const optgroup = el('optgroup', { label });
        list.forEach((cargo) => optgroup.append(new Option(Plano.rotulo(cargo), cargo.id)));
        select.append(optgroup);
      };
      group('Próximos cargos do plano', next);
      group('Outros cargos', others);
      promotionForm.elements.data.value = today;
      promotionForm.elements.data.max = today;
      promotionForm.elements.data.min = person.cargoDesde || person.hireDate;
      promotionForm.elements.salario.value = '';
      promotionError.hidden = true;
      document.getElementById('promotion-dialog-text').textContent = `${person.name} está em ${current ? current.nome : 'cargo sem plano'} desde ${formatDate(person.cargoDesde || person.hireDate)}.`;
      updateSalaryHint();
      promotionDialog.showModal();
      select.focus();
    });
    promotionForm.elements.destino.addEventListener('change', updateSalaryHint);
    promotionForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const before = person.role;
      const result = Dados.registrarPromocao({
        colaboradorId: person.id,
        cargoDestinoId: promotionForm.elements.destino.value,
        data: promotionForm.elements.data.value,
        novoSalario: promotionForm.elements.salario.value
      });
      if (!result.ok) { showErrors(promotionError, result.erros); return; }
      promotionDialog.close();
      renderAll();
      Helpers.announce(status, `Promoção registrada: ${before} → ${person.role}. Histórico, mapa de promoções e indicadores foram atualizados.`, 'success');
    });

    /* Editar dados profissionais */
    const professionalDialog = setupDialog('professional-dialog');
    const professionalForm = document.getElementById('professional-form');
    const professionalError = document.getElementById('professional-error');

    document.getElementById('open-professional-edit').addEventListener('click', () => {
      const f = professionalForm.elements;
      f.salary.value = person.salary || '';
      f.motivo.value = 'Reajuste';
      f.dataSalario.value = today;
      f.dataSalario.max = today;
      f.funcao.value = person.funcao || '';
      f.contractType.value = person.contractType || 'CLT';
      f.contractStart.value = person.contractStart || person.hireDate || '';
      f.contractEnd.value = person.contractEnd || '';
      const managers = Dados.gestoresPossiveis(person);
      const current = person.managerId ? Dados.colaborador(person.managerId) : null;
      if (current && !managers.some((item) => item.id === current.id)) managers.unshift(current);
      f.managerId.replaceChildren(new Option('Sem gestor (topo da área)', ''), ...managers.map((item) => new Option(`${item.name} · ${item.role}`, item.id)));
      f.managerId.value = person.managerId || '';
      professionalError.hidden = true;
      professionalDialog.showModal();
      f.salary.focus();
    });
    professionalForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const f = professionalForm.elements;
      const errors = [];
      const salary = f.salary.value === '' ? null : Number(f.salary.value);
      if (salary !== null && (!Number.isFinite(salary) || salary < 0)) errors.push('Informe um salário válido.');
      if (f.contractStart.value && f.contractEnd.value && f.contractEnd.value < f.contractStart.value) errors.push('O término do contrato não pode ser anterior ao início.');
      const salaryChanged = salary !== null && salary !== Number(person.salary);
      if (salaryChanged && !Helpers.isValidDate(f.dataSalario.value)) errors.push('Informe a data da alteração salarial.');
      if (errors.length) { showErrors(professionalError, errors); return; }

      const changes = {
        funcao: f.funcao.value.trim(),
        contractType: f.contractType.value,
        contractStart: f.contractStart.value || person.hireDate,
        contractEnd: f.contractEnd.value || null,
        managerId: f.managerId.value || null
      };
      if (!changes.funcao) changes.funcao = undefined;
      if (salaryChanged) {
        changes.salary = salary;
        changes.salaryHistory = [...(person.salaryHistory || []), { data: f.dataSalario.value, valor: salary, motivo: f.motivo.value }];
      }
      if (changes.contractType !== person.contractType) {
        changes.beneficiosIds = changes.contractType === 'PJ' ? [] : changes.contractType === 'Estágio' ? ['bn-transporte', 'bn-educacao'] : null;
      }
      const result = Dados.atualizarColaborador(person.id, changes);
      if (!result.ok) { showErrors(professionalError, result.erros); return; }
      professionalDialog.close();
      renderAll();
      Helpers.announce(status, 'Dados profissionais atualizados.', 'success');
    });

    /* Adicionar projeto */
    const projectDialog = setupDialog('project-dialog');
    const projectForm = document.getElementById('project-form');
    const projectError = document.getElementById('project-error');
    document.getElementById('open-project-form').addEventListener('click', () => {
      projectForm.reset();
      projectError.hidden = true;
      projectDialog.showModal();
      projectForm.elements.nome.focus();
    });
    projectForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const f = projectForm.elements;
      const result = Dados.adicionarProjeto(person.id, {
        nome: f.nome.value.trim(),
        papel: f.papel.value.trim(),
        status: f.status.value,
        inicio: f.inicio.value,
        fim: f.fim.value || null,
        resultado: f.resultado.value.trim()
      });
      if (!result.ok) { showErrors(projectError, result.erros); return; }
      projectDialog.close();
      renderAll();
      Helpers.announce(status, 'Projeto adicionado.', 'success');
    });
  }
});
