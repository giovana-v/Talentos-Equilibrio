document.addEventListener('DOMContentLoaded', () => {
  const { el } = Helpers;
  const status = document.getElementById('plan-status');
  const errorsBox = document.getElementById('plan-errors');
  const tracksTable = document.getElementById('tracks-table');
  const cargosTable = document.getElementById('cargos-table');
  const trackSelect = document.getElementById('cargo-track-select');
  const simTrack = document.getElementById('sim-track');
  const simCargo = document.getElementById('sim-cargo');
  let selectedTrack = (Plano.trilhas()[0] || {}).id;

  /* Mensagens */
  function showErrors(box, errors) {
    box.replaceChildren(errors.length === 1 ? el('p', { text: errors[0] }) : el('ul', {}, errors.map((error) => el('li', { text: error }))));
    box.hidden = false;
  }

  function report(result, successMessage) {
    if (result.ok) {
      errorsBox.hidden = true;
      Helpers.announce(status, successMessage, 'success');
      return true;
    }
    showErrors(errorsBox, result.erros);
    Helpers.announce(status, 'Não foi possível concluir a ação. Veja os detalhes abaixo.', 'error');
    return false;
  }

  /* Tabelas */
  function actionButton(label, text, action, id, { disabled = false, icon = false } = {}) {
    return el('button', {
      class: icon ? 'button button-icon' : 'button button-link',
      type: 'button',
      'aria-label': label,
      title: label,
      disabled,
      dataset: { action, id },
      text
    });
  }

  function badge(text, className = '') {
    return el('span', { class: `type-badge ${className}`.trim(), text });
  }

  function renderTracks() {
    const tracks = Plano.trilhas();
    tracksTable.replaceChildren(el('table', { class: 'data-table plan-table' },
      el('caption', { class: 'visually-hidden', text: 'Trilhas do plano de carreira' }),
      el('thead', {}, el('tr', {}, ['Ordem', 'Trilha', 'Setor', 'Cargos', 'Situação', 'Ações'].map((title) => el('th', { scope: 'col', text: title })))),
      el('tbody', {}, tracks.map((track, index) => el('tr', { class: track.id === selectedTrack ? 'is-selected' : '', 'aria-current': track.id === selectedTrack ? 'true' : null },
        el('td', { class: 'is-number', text: String(index + 1) }),
        el('th', { scope: 'row' },
          el('button', { class: 'button button-link track-link', type: 'button', dataset: { action: 'select', id: track.id }, 'aria-label': `Ver cargos da trilha ${track.nome}`, text: track.nome }),
          track.descricao ? el('small', { class: 'row-note', text: track.descricao }) : null),
        el('td', { text: track.setor }),
        el('td', { class: 'is-number', text: String(Plano.cargosDaTrilha(track.id).length) }),
        el('td', {}, badge(track.ativa ? 'Ativa' : 'Arquivada', track.ativa ? '' : 'is-lideranca')),
        el('td', {}, el('div', { class: 'row-actions' },
          actionButton(`Mover a trilha ${track.nome} para cima`, '↑', 'up', track.id, { disabled: index === 0, icon: true }),
          actionButton(`Mover a trilha ${track.nome} para baixo`, '↓', 'down', track.id, { disabled: index === tracks.length - 1, icon: true }),
          actionButton(`Editar a trilha ${track.nome}`, 'Editar', 'edit', track.id),
          actionButton(`Duplicar a trilha ${track.nome}`, 'Duplicar', 'duplicate', track.id),
          actionButton(`${track.ativa ? 'Arquivar' : 'Reativar'} a trilha ${track.nome}`, track.ativa ? 'Arquivar' : 'Reativar', 'archive', track.id),
          actionButton(`Excluir a trilha ${track.nome}`, 'Excluir', 'delete', track.id))))))));
  }

  function renderCargos() {
    const track = Plano.trilha(selectedTrack);
    const cargos = track ? Plano.cargosDaTrilha(track.id) : [];
    document.getElementById('cargos-subtitle').textContent = track
      ? `${Helpers.plural(cargos.length, 'cargo', 'cargos')} na trilha “${track.nome}”.`
      : 'Crie uma trilha para começar.';
    document.getElementById('new-cargo').disabled = !track;
    if (!cargos.length) {
      cargosTable.replaceChildren(el('p', { class: 'muted-text plan-empty', text: 'Esta trilha ainda não tem cargos. Use “Novo cargo” para criar o primeiro.' }));
      return;
    }
    cargosTable.replaceChildren(el('table', { class: 'data-table plan-table' },
      el('caption', { class: 'visually-hidden', text: `Cargos da trilha ${track.nome}, em ordem de carreira` }),
      el('thead', {}, el('tr', {}, ['Ordem', 'Cargo', 'Faixa salarial', 'Tempo mínimo', 'Próximos cargos', 'Pessoas', 'Ações'].map((title) => el('th', { scope: 'col', text: title })))),
      el('tbody', {}, cargos.map((cargo, index) => {
        const next = cargo.proximosCargosIds.map(Plano.cargo).filter(Boolean);
        return el('tr', { class: cargo.ativo ? '' : 'is-archived' },
          el('td', { class: 'is-number', text: String(cargo.ordem) }),
          el('th', { scope: 'row' },
            el('a', { href: `cargo.html?id=${encodeURIComponent(cargo.id)}`, text: cargo.nome }), ' ',
            badge(Plano.TIPOS[cargo.tipo], cargo.tipo === 'lideranca' ? 'is-lideranca' : ''),
            cargo.ativo ? null : [' ', badge('Arquivado', 'is-lideranca')]),
          el('td', { text: Jornada.faixaSalarial(cargo) }),
          el('td', { text: cargo.tempoMinimoNoCargoMeses ? Helpers.formatDuration(cargo.tempoMinimoNoCargoMeses) : '—' }),
          el('td', { text: next.length ? next.map((item) => item.nome).join(', ') : 'Nenhum (fim da trilha)' }),
          el('td', { class: 'is-number', text: String(Plano.usoDoCargo(cargo.id).pessoas) }),
          el('td', {}, el('div', { class: 'row-actions' },
            actionButton(`Mover o cargo ${cargo.nome} para cima`, '↑', 'cargo-up', cargo.id, { disabled: index === 0, icon: true }),
            actionButton(`Mover o cargo ${cargo.nome} para baixo`, '↓', 'cargo-down', cargo.id, { disabled: index === cargos.length - 1, icon: true }),
            actionButton(`Editar o cargo ${cargo.nome}`, 'Editar', 'cargo-edit', cargo.id),
            actionButton(`Duplicar o cargo ${cargo.nome}`, 'Duplicar', 'cargo-duplicate', cargo.id),
            actionButton(`${cargo.ativo ? 'Arquivar' : 'Reativar'} o cargo ${cargo.nome}`, cargo.ativo ? 'Arquivar' : 'Reativar', 'cargo-archive', cargo.id),
            actionButton(`Excluir o cargo ${cargo.nome}`, 'Excluir', 'cargo-delete', cargo.id))));
      }))));
  }

  function fillTrackSelect(select, selected) {
    select.replaceChildren(...Plano.trilhas().map((track) => new Option(track.nome, track.id)));
    select.value = Plano.trilha(selected) ? selected : ((Plano.trilhas()[0] || {}).id || '');
  }

  function renderSimulation() {
    fillTrackSelect(simTrack, simTrack.value);
    const options = Plano.cargosDaTrilha(simTrack.value).filter((cargo) => cargo.ativo);
    const previous = simCargo.value;
    simCargo.replaceChildren(...options.map((cargo) => new Option(cargo.nome, cargo.id)));
    simCargo.value = options.some((cargo) => cargo.id === previous) ? previous : (options[0] || {}).id || '';
    const target = document.getElementById('simulation-content');
    if (!simCargo.value) {
      target.replaceChildren(el('p', { class: 'muted-text', text: 'Crie um cargo ativo na trilha escolhida para simular a carreira.' }));
      return;
    }
    Jornada.render(target, { cargoId: simCargo.value, mesesNoCargo: 0, simulacao: true });
  }

  function renderAll() {
    if (!Plano.trilha(selectedTrack)) selectedTrack = (Plano.trilhas()[0] || {}).id;
    renderTracks();
    fillTrackSelect(trackSelect, selectedTrack);
    renderCargos();
    renderSimulation();
  }

  function restoreFocus(selector, fallbackSelector) {
    const target = document.querySelector(`${selector}:not(:disabled)`) || document.querySelector(`${fallbackSelector}:not(:disabled)`);
    if (target) target.focus();
  }

  /* Diálogos */
  function setupDialog(id) {
    const dialog = Helpers.prepareDialog(document.getElementById(id));
    dialog.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    return dialog;
  }

  const trackDialog = setupDialog('track-dialog');
  const trackForm = document.getElementById('track-form');
  const trackError = document.getElementById('track-error');

  function openTrackDialog(track) {
    const f = trackForm.elements;
    trackForm.dataset.id = track ? track.id : '';
    document.getElementById('track-dialog-title').textContent = track ? 'Editar trilha' : 'Nova trilha';
    const sectors = ['Todos', ...Dados.setores()];
    if (track && !sectors.includes(track.setor)) sectors.push(track.setor);
    f.setor.replaceChildren(...sectors.map((sector) => new Option(sector, sector)));
    f.nome.value = track ? track.nome : '';
    f.setor.value = track ? track.setor : 'Todos';
    f.descricao.value = track ? track.descricao : '';
    f.ativa.checked = track ? track.ativa : true;
    trackError.hidden = true;
    trackDialog.showModal();
    f.nome.focus();
  }

  trackForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const f = trackForm.elements;
    const result = Plano.salvarTrilha({
      id: trackForm.dataset.id || undefined,
      nome: f.nome.value.trim(),
      setor: f.setor.value,
      descricao: f.descricao.value.trim(),
      ativa: f.ativa.checked
    });
    if (!result.ok) { showErrors(trackError, result.erros); return; }
    trackDialog.close();
    if (!trackForm.dataset.id) selectedTrack = result.trilha.id;
    renderAll();
    report(result, `Trilha “${result.trilha.nome}” salva.`);
  });

  const cargoDialog = setupDialog('cargo-dialog');
  const cargoForm = document.getElementById('cargo-form');
  const cargoError = document.getElementById('cargo-error');

  function openCargoDialog(cargo) {
    const f = cargoForm.elements;
    cargoForm.dataset.id = cargo ? cargo.id : '';
    document.getElementById('cargo-dialog-title').textContent = cargo ? 'Editar cargo' : 'Novo cargo';
    f.trilhaId.replaceChildren(...Plano.trilhas().map((track) => new Option(track.nome, track.id)));
    f.trilhaId.value = cargo ? cargo.trilhaId : selectedTrack;
    f.nome.value = cargo ? cargo.nome : '';
    f.tipo.value = cargo ? cargo.tipo : 'operacional';
    f.faixaSalarialMin.value = cargo ? cargo.faixaSalarialMin : '';
    f.faixaSalarialMax.value = cargo ? cargo.faixaSalarialMax : '';
    f.tempoMinimoNoCargoMeses.value = cargo ? cargo.tempoMinimoNoCargoMeses : 12;
    f.ativo.checked = cargo ? cargo.ativo : true;
    f.competencias.value = cargo ? cargo.requisitos.competencias.join('\n') : '';
    f.formacao.value = cargo ? cargo.requisitos.formacao : '';
    f.experiencia.value = cargo ? cargo.requisitos.experiencia : '';
    f.responsabilidades.value = cargo ? cargo.responsabilidades.join('\n') : '';
    f.beneficios.value = cargo ? cargo.beneficios.join('\n') : '';
    const list = document.getElementById('next-cargos-list');
    const others = Plano.cargosOrdenados().filter((item) => !cargo || item.id !== cargo.id);
    list.replaceChildren(...(others.length
      ? others.map((item, index) => el('li', {}, el('label', { class: 'check-field' },
        el('input', { type: 'checkbox', name: 'proximos', value: item.id, id: `next-${index}`, checked: Boolean(cargo) && cargo.proximosCargosIds.includes(item.id) }),
        `${Plano.rotulo(item)}${item.ativo ? '' : ' (arquivado)'}`)))
      : [el('li', { class: 'muted-text', text: 'Ainda não há outros cargos no plano.' })]));
    cargoError.hidden = true;
    cargoDialog.showModal();
    f.nome.focus();
  }

  cargoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const f = cargoForm.elements;
    if (f.faixaSalarialMin.value === '' || f.faixaSalarialMax.value === '' || f.tempoMinimoNoCargoMeses.value === '') {
      showErrors(cargoError, ['Informe a faixa salarial (mínimo e máximo) e o tempo mínimo no cargo.']);
      return;
    }
    const result = Plano.salvarCargo({
      id: cargoForm.dataset.id || undefined,
      nome: f.nome.value.trim(),
      trilhaId: f.trilhaId.value,
      tipo: f.tipo.value,
      faixaSalarialMin: Number(f.faixaSalarialMin.value),
      faixaSalarialMax: Number(f.faixaSalarialMax.value),
      tempoMinimoNoCargoMeses: Number(f.tempoMinimoNoCargoMeses.value),
      requisitos: { competencias: f.competencias.value, formacao: f.formacao.value, experiencia: f.experiencia.value },
      responsabilidades: f.responsabilidades.value,
      beneficios: f.beneficios.value,
      proximosCargosIds: [...cargoForm.querySelectorAll('input[name="proximos"]:checked')].map((input) => input.value),
      ativo: f.ativo.checked
    });
    if (!result.ok) { showErrors(cargoError, result.erros); return; }
    cargoDialog.close();
    selectedTrack = result.cargo.trilhaId;
    renderAll();
    report(result, `Cargo “${result.cargo.nome}” salvo.`);
  });

  const migrateDialog = setupDialog('migrate-dialog');
  const migrateForm = document.getElementById('migrate-form');
  const migrateError = document.getElementById('migrate-error');

  function openMigrateDialog(cargo, usage) {
    migrateForm.dataset.id = cargo.id;
    document.getElementById('migrate-text').textContent = `O cargo “${cargo.nome}” tem ${Helpers.plural(usage.pessoas, 'colaborador', 'colaboradores')} e ${Helpers.plural(usage.promocoes, 'registro de promoção', 'registros de promoção')}. A exclusão está bloqueada até que eles sejam migrados para outro cargo.`;
    const options = Plano.cargosOrdenados().filter((item) => item.id !== cargo.id);
    migrateForm.elements.destino.replaceChildren(new Option('Selecione', ''), ...options.map((item) => new Option(`${Plano.rotulo(item)}${item.ativo ? '' : ' (arquivado)'}`, item.id)));
    migrateError.hidden = true;
    migrateDialog.showModal();
    migrateForm.elements.destino.focus();
  }

  migrateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!migrateForm.elements.destino.value) { showErrors(migrateError, ['Escolha o cargo de destino.']); return; }
    const cargo = Plano.cargo(migrateForm.dataset.id);
    const result = Plano.excluirCargo(migrateForm.dataset.id, migrateForm.elements.destino.value);
    if (!result.ok) { showErrors(migrateError, result.erros); return; }
    migrateDialog.close();
    renderAll();
    report(result, `Cargo “${cargo.nome}” excluído. ${Helpers.plural(result.migrados, 'colaborador migrado', 'colaboradores migrados')}.`);
  });

  /* Ações das tabelas */
  async function handleTrackAction(action, id) {
    const track = Plano.trilha(id);
    if (!track) return;
    if (action === 'select') { selectedTrack = id; renderAll(); return; }
    if (action === 'edit') { openTrackDialog(track); return; }
    if (action === 'up' || action === 'down') {
      const result = Plano.moverTrilha(id, action === 'up' ? -1 : 1);
      renderAll();
      if (report(result, `Trilha “${track.nome}” movida para a posição ${Plano.trilhas().findIndex((item) => item.id === id) + 1}.`)) {
        restoreFocus(`#tracks-table [data-action="${action}"][data-id="${id}"]`, `#tracks-table [data-action="${action === 'up' ? 'down' : 'up'}"][data-id="${id}"]`);
      }
      return;
    }
    if (action === 'duplicate') {
      const result = Plano.duplicarTrilha(id);
      if (result.ok) selectedTrack = result.trilha.id;
      renderAll();
      report(result, `Trilha duplicada como “${result.ok ? result.trilha.nome : ''}”.`);
      return;
    }
    if (action === 'archive') {
      const result = Plano.arquivarTrilha(id, track.ativa);
      renderAll();
      report(result, `Trilha “${track.nome}” ${track.ativa ? 'arquivada' : 'reativada'}.`);
      return;
    }
    if (action === 'delete') {
      const confirmed = await Helpers.confirmDialog({ title: 'Excluir trilha', message: `Excluir a trilha “${track.nome}” e todos os seus cargos? Esta ação não pode ser desfeita.`, confirmLabel: 'Excluir', danger: true });
      if (!confirmed) return;
      const result = Plano.excluirTrilha(id);
      renderAll();
      report(result, `Trilha “${track.nome}” excluída.`);
    }
  }

  async function handleCargoAction(action, id) {
    const cargo = Plano.cargo(id);
    if (!cargo) return;
    if (action === 'cargo-edit') { openCargoDialog(cargo); return; }
    if (action === 'cargo-up' || action === 'cargo-down') {
      const result = Plano.moverCargo(id, action === 'cargo-up' ? -1 : 1);
      renderAll();
      if (report(result, `Cargo “${cargo.nome}” movido para a posição ${Plano.cargo(id).ordem}.`)) {
        const opposite = action === 'cargo-up' ? 'cargo-down' : 'cargo-up';
        restoreFocus(`#cargos-table [data-action="${action}"][data-id="${id}"]`, `#cargos-table [data-action="${opposite}"][data-id="${id}"]`);
      }
      return;
    }
    if (action === 'cargo-duplicate') {
      const result = Plano.duplicarCargo(id);
      renderAll();
      report(result, `Cargo duplicado como “${result.ok ? result.cargo.nome : ''}”.`);
      return;
    }
    if (action === 'cargo-archive') {
      const result = Plano.arquivarCargo(id, cargo.ativo);
      renderAll();
      report(result, `Cargo “${cargo.nome}” ${cargo.ativo ? 'arquivado' : 'reativado'}.`);
      return;
    }
    if (action === 'cargo-delete') {
      const usage = Plano.usoDoCargo(id);
      if (usage.pessoas || usage.promocoes) { openMigrateDialog(cargo, usage); return; }
      const confirmed = await Helpers.confirmDialog({ title: 'Excluir cargo', message: `Excluir o cargo “${cargo.nome}”? Esta ação não pode ser desfeita.`, confirmLabel: 'Excluir', danger: true });
      if (!confirmed) return;
      const result = Plano.excluirCargo(id);
      renderAll();
      report(result, `Cargo “${cargo.nome}” excluído.`);
    }
  }

  tracksTable.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled) handleTrackAction(button.dataset.action, button.dataset.id);
  });
  cargosTable.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled) handleCargoAction(button.dataset.action, button.dataset.id);
  });

  trackSelect.addEventListener('change', () => { selectedTrack = trackSelect.value; renderAll(); });
  simTrack.addEventListener('change', renderSimulation);
  simCargo.addEventListener('change', renderSimulation);
  document.getElementById('new-track').addEventListener('click', () => openTrackDialog(null));
  document.getElementById('new-cargo').addEventListener('click', () => openCargoDialog(null));

  /* Modelo padrão, exportação e importação */
  document.getElementById('restore-default').addEventListener('click', async () => {
    const confirmed = await Helpers.confirmDialog({
      title: 'Restaurar modelo padrão',
      message: 'O plano atual será substituído pelo modelo padrão (Estagiário → Júnior → Pleno → Sênior → Coordenação → Gerência → Diretoria). Colaboradores em cargos que deixarem de existir serão realocados para o cargo mais parecido.',
      confirmLabel: 'Restaurar',
      danger: true
    });
    if (!confirmed) return;
    const result = Plano.restaurarPadrao();
    selectedTrack = (Plano.trilhas()[0] || {}).id;
    renderAll();
    report(result, `Modelo padrão restaurado.${result.realocados ? ` ${Helpers.plural(result.realocados, 'colaborador realocado', 'colaboradores realocados')}.` : ''}`);
  });

  document.getElementById('export-plan').addEventListener('click', () => {
    Helpers.downloadJSON('plano-de-carreira.json', Plano.exportar());
    errorsBox.hidden = true;
    Helpers.announce(status, 'Plano exportado para o arquivo plano-de-carreira.json.', 'success');
  });

  document.getElementById('import-plan').addEventListener('change', async (event) => {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const result = Plano.importar(await Helpers.readJSONFile(file));
      selectedTrack = (Plano.trilhas()[0] || {}).id;
      renderAll();
      report(result, `Plano importado de ${file.name}.${result.realocados ? ` ${Helpers.plural(result.realocados, 'colaborador realocado', 'colaboradores realocados')}.` : ''}`);
    } catch (error) {
      report({ ok: false, erros: [error.message] });
    }
    input.value = '';
  });

  renderAll();
});
