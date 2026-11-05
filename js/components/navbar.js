// Menus do cabeçalho: notificações (com marcação de lidas) e menu do usuário.
const Navbar = (() => {
  function init({ notificacoes, chaveLidas }) {
    const lista = document.querySelector('[data-notification-list]');
    const contador = document.querySelector('[data-notification-count]');
    const ponto = document.querySelector('[data-notification-dot]');
    const marcarLidas = document.querySelector('[data-mark-notifications-read]');
    const botaoNotificacoes = document.querySelector('[data-notifications-toggle]');
    const botaoPerfil = document.querySelector('[data-auth-user-menu]');
    const painelNotificacoes = document.getElementById('notifications-popover');
    const painelPerfil = document.getElementById('profile-popover');
    if (!lista || !botaoNotificacoes || !botaoPerfil || !painelNotificacoes || !painelPerfil) return;

    let lidas = new Set(Storage.getItem(chaveLidas) || []);

    function atualizar() {
      const naoLidas = notificacoes.filter((item) => !lidas.has(item.id)).length;
      contador.textContent = `${naoLidas} ${naoLidas === 1 ? 'nova' : 'novas'}`;
      ponto.hidden = naoLidas === 0;
      marcarLidas.disabled = naoLidas === 0;
      botaoNotificacoes.setAttribute('aria-label', naoLidas ? `Notificações, ${naoLidas} não lidas` : 'Notificações, todas lidas');
      lista.replaceChildren();
      notificacoes.forEach((item) => {
        const linha = document.createElement('li');
        const link = document.createElement('a');
        const titulo = document.createElement('strong');
        const corpo = document.createElement('span');
        const data = document.createElement('small');
        linha.className = `notification-item${lidas.has(item.id) ? '' : ' is-unread'}`;
        link.href = item.href;
        link.dataset.notificationId = item.id;
        titulo.textContent = item.title;
        corpo.textContent = item.body;
        data.textContent = item.date;
        link.append(titulo, corpo, data);
        linha.append(link);
        lista.append(linha);
      });
    }

    function fecharTodos() {
      painelNotificacoes.hidden = true;
      painelPerfil.hidden = true;
      botaoNotificacoes.setAttribute('aria-expanded', 'false');
      botaoPerfil.setAttribute('aria-expanded', 'false');
    }

    function alternar(painelAberto, painelFechado, botao, outroBotao) {
      const abrindo = painelAberto.hidden;
      painelAberto.hidden = !abrindo;
      painelFechado.hidden = true;
      botao.setAttribute('aria-expanded', String(abrindo));
      outroBotao.setAttribute('aria-expanded', 'false');
    }

    botaoNotificacoes.addEventListener('click', () => alternar(painelNotificacoes, painelPerfil, botaoNotificacoes, botaoPerfil));
    botaoPerfil.addEventListener('click', () => alternar(painelPerfil, painelNotificacoes, botaoPerfil, botaoNotificacoes));
    marcarLidas.addEventListener('click', () => {
      lidas = new Set(notificacoes.map((item) => item.id));
      Storage.setItem(chaveLidas, [...lidas]);
      atualizar();
    });
    lista.addEventListener('click', (evento) => {
      const link = evento.target.closest('[data-notification-id]');
      if (!link) return;
      lidas.add(link.dataset.notificationId);
      Storage.setItem(chaveLidas, [...lidas]);
    });
    document.addEventListener('click', (evento) => {
      if (!evento.target.closest('.popover-wrap')) fecharTodos();
    });
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') fecharTodos();
    });

    atualizar();
  }

  return { init };
})();
