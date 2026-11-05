(() => {
  const SETTINGS_KEY = 'talentosConfiguracoes';
  const fields = [...document.querySelectorAll('[data-settings-field]')];
  const tabs = [...document.querySelectorAll('[data-settings-tab]')];
  const panels = [...document.querySelectorAll('[data-settings-panel]')];
  const status = document.querySelector('[data-save-status]');
  const photoInput = document.querySelector('[data-photo-input]');
  const photoPreview = document.querySelector('[data-photo-preview]');
  const profileName = document.querySelector('[data-profile-name]');
  const profileRole = document.querySelector('[data-profile-role]');
  let photoData = '';

  function readSettings() {
    try { return Storage.getItem(SETTINGS_KEY) || {}; }
    catch { return {}; }
  }

  function setPhoto(value) {
    photoData = value || '';
    if (photoData) {
      photoPreview.replaceChildren();
      const image = document.createElement('img');
      image.src = photoData;
      image.alt = 'Foto de perfil';
      photoPreview.append(image);
    } else {
      const session = Auth.getSession();
      photoPreview.textContent = session?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'N';
    }
  }

  function loadSettings() {
    const saved = readSettings();
    fields.forEach((field) => {
      if (Object.hasOwn(saved, field.dataset.settingsField)) {
        if (field.type === 'checkbox') field.checked = Boolean(saved[field.dataset.settingsField]);
        else field.value = saved[field.dataset.settingsField];
      }
    });
    setPhoto(saved.photo || '');
  }

  function showTab(name, moveFocus = false) {
    tabs.forEach((tab) => {
      const active = tab.dataset.settingsTab === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && moveFocus) tab.focus();
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.settingsPanel !== name; });
  }

  function saveSettings() {
    const saved = {};
    fields.forEach((field) => {
      saved[field.dataset.settingsField] = field.type === 'checkbox' ? field.checked : field.value;
    });
    saved.photo = photoData;
    try {
      if (!Storage.setItem(SETTINGS_KEY, saved)) throw new Error('Armazenamento indisponível');
      status.textContent = 'Alterações salvas neste navegador.';
      status.className = 'settings-save-status is-success';
    } catch {
      status.textContent = 'Não foi possível salvar. Tente uma imagem menor.';
      status.className = 'settings-save-status is-error';
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showTab(tab.dataset.settingsTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
        (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
      showTab(tabs[next].dataset.settingsTab, true);
    });
  });
  document.querySelector('[data-save]').addEventListener('click', saveSettings);
  document.querySelector('[data-cancel]').addEventListener('click', () => {
    loadSettings();
    status.textContent = 'Alterações descartadas.';
    status.className = 'settings-save-status';
  });
  photoInput.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      status.textContent = 'Escolha uma imagem de até 2 MB.';
      status.className = 'settings-save-status is-error';
      photoInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => setPhoto(reader.result));
    reader.readAsDataURL(file);
  });
  document.querySelector('[data-delete-photo]').addEventListener('click', () => {
    setPhoto('');
    photoInput.value = '';
  });

  const session = Auth.getSession();
  if (session) {
    const role = session.role === 'admin' ? 'RH' : 'Colaborador';
    profileName.textContent = session.name;
    profileRole.textContent = role;
    document.querySelector('[data-account-name]').textContent = session.name;
    document.querySelector('[data-account-email]').textContent = session.email;
    document.querySelector('[data-account-role]').textContent = role;
  }
  loadSettings();

  /* Benefícios da empresa: a lista é usada no perfil de cada colaborador */
  const benefitList = document.getElementById('benefit-list');
  const benefitForm = document.getElementById('benefit-form');
  const benefitError = document.getElementById('benefit-error');
  const benefitStatus = document.getElementById('benefit-status');
  const benefitCancel = document.getElementById('benefit-cancel');
  let editingBenefit = null;

  function renderBenefits() {
    const benefits = Dados.beneficios();
    benefitList.replaceChildren(...(benefits.length
      ? benefits.map((benefit) => Helpers.el('li', {},
        Helpers.el('span', { class: 'benefit-icon' }, Helpers.icon(benefit.icone)),
        Helpers.el('div', {}, Helpers.el('strong', { text: benefit.nome }), Helpers.el('span', { text: benefit.descricao })),
        Helpers.el('div', { class: 'row-actions' },
          Helpers.el('button', { class: 'button button-link', type: 'button', 'aria-label': `Editar o benefício ${benefit.nome}`, text: 'Editar', onClick: () => startBenefitEdit(benefit) }),
          Helpers.el('button', { class: 'button button-link', type: 'button', 'aria-label': `Remover o benefício ${benefit.nome}`, text: 'Remover', onClick: () => removeBenefit(benefit) }))))
      : [Helpers.el('li', { class: 'muted-text', text: 'Nenhum benefício cadastrado.' })]));
  }

  function resetBenefitForm() {
    editingBenefit = null;
    benefitForm.reset();
    benefitError.hidden = true;
    benefitCancel.hidden = true;
    document.getElementById('benefit-form-title').textContent = 'Novo benefício';
  }

  function startBenefitEdit(benefit) {
    editingBenefit = benefit.id;
    benefitForm.elements.nome.value = benefit.nome;
    benefitForm.elements.icone.value = benefit.icone;
    benefitForm.elements.descricao.value = benefit.descricao;
    benefitCancel.hidden = false;
    benefitError.hidden = true;
    document.getElementById('benefit-form-title').textContent = `Editar benefício: ${benefit.nome}`;
    benefitForm.elements.nome.focus();
  }

  async function removeBenefit(benefit) {
    const confirmed = await Helpers.confirmDialog({ title: 'Remover benefício', message: `Remover “${benefit.nome}” da lista da empresa? Ele deixa de aparecer nos perfis.`, confirmLabel: 'Remover', danger: true });
    if (!confirmed) return;
    const ok = Dados.salvarBeneficios(Dados.beneficios().filter((item) => item.id !== benefit.id));
    renderBenefits();
    if (editingBenefit === benefit.id) resetBenefitForm();
    Helpers.announce(benefitStatus, ok ? 'Benefício removido.' : 'Não foi possível salvar neste navegador.', ok ? 'success' : 'error');
  }

  benefitForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nome = benefitForm.elements.nome.value.trim();
    if (!nome) {
      benefitError.textContent = 'Informe o nome do benefício.';
      benefitError.hidden = false;
      return;
    }
    const data = { nome, icone: benefitForm.elements.icone.value, descricao: benefitForm.elements.descricao.value.trim() };
    const current = Dados.beneficios();
    const next = editingBenefit
      ? current.map((item) => (item.id === editingBenefit ? { ...item, ...data } : item))
      : [...current, { id: Helpers.uid('bn'), ...data }];
    const ok = Dados.salvarBeneficios(next);
    if (!ok) {
      benefitError.textContent = 'Não foi possível salvar neste navegador.';
      benefitError.hidden = false;
      return;
    }
    const wasEditing = Boolean(editingBenefit);
    resetBenefitForm();
    renderBenefits();
    Helpers.announce(benefitStatus, wasEditing ? 'Benefício atualizado.' : 'Benefício adicionado.', 'success');
  });
  benefitCancel.addEventListener('click', resetBenefitForm);
  renderBenefits();
})();
