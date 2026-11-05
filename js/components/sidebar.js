// Menu lateral compartilhado. Cada página declara <aside data-sidebar data-active="arquivo.html">.
const Sidebar = (() => {
  const ITENS = [
    { href: 'dashboard.html', rotulo: 'Dashboard', admin: false, icone: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"></path>' },
    { href: 'colaboradores.html', rotulo: 'Colaboradores', admin: true, icone: '<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20zM17 5a3.5 3.5 0 0 1 0 6.8M18 14a5.5 5.5 0 0 1 3.5 5.1V20h-3"></path>' },
    { href: 'perfil.html', rotulo: 'Jornada de carreira', admin: false, icone: '<circle cx="6" cy="18" r="2.5"></circle><circle cx="18" cy="6" r="2.5"></circle><circle cx="18" cy="18" r="2.5"></circle><path d="M8.5 18H12a6 6 0 0 0 6-6V8.5M16.5 18H15a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4h.5"></path>' },
    { href: 'carreira-geral.html', rotulo: 'Carreira geral', admin: true, icone: '<path d="M7 7h13l-3-3M17 17H4l3 3"></path>' },
    { href: 'plano-carreira.html', rotulo: 'Plano de carreira', admin: true, icone: '<path d="M3 21h5v-5h5v-5h5V6h3"></path><path d="M18 3v3M21 6h-3"></path>' },
    { href: 'relatorios.html', rotulo: 'Relatórios', admin: true, icone: '<path d="M4 20V5M4 20h17M8 16v-4M13 16V8M18 16V4"></path>' },
    { href: 'configuracoes.html', rotulo: 'Configurações', admin: true, icone: '<circle cx="12" cy="12" r="3"></circle><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.5-2.6L7 15a8 8 0 0 1 0-2l-1.5-1.1L7 9.3l1.7.7a8 8 0 0 1 1.7-1l.3-1.8h3l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.5 2.6L19.4 13a8 8 0 0 1 0 2z" transform="translate(-1 -1)"></path>' }
  ];

  function svg(conteudo) {
    const icone = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icone.setAttribute('viewBox', '0 0 24 24');
    icone.setAttribute('aria-hidden', 'true');
    icone.innerHTML = conteudo;
    return icone;
  }

  function render() {
    const lateral = document.querySelector('[data-sidebar]');
    if (!lateral || lateral.dataset.rendered) return;
    const ativo = lateral.dataset.active;
    const { el } = Helpers;

    const marca = el('a', { class: 'brand', href: 'dashboard.html', 'aria-label': 'Talentos em Equilíbrio, início' },
      svg('<circle cx="12" cy="8" r="5.5"></circle><path d="M12 13.5V23M8 19h8"></path>'),
      el('span', {}, 'Talentos em', el('br'), 'Equilíbrio'));
    marca.firstChild.setAttribute('class', 'brand-symbol');
    marca.firstChild.setAttribute('fill', 'none');
    marca.firstChild.setAttribute('stroke', 'currentColor');
    marca.firstChild.setAttribute('stroke-width', '1.8');
    marca.firstChild.setAttribute('stroke-linecap', 'round');
    marca.firstChild.setAttribute('stroke-linejoin', 'round');

    const navegacao = el('nav', { class: 'side-nav', 'aria-label': 'Navegação principal' }, ITENS.map((item) => {
      const link = el('a', {
        class: `nav-link${item.href === ativo ? ' is-active' : ''}`,
        href: item.href,
        'aria-current': item.href === ativo ? 'page' : null,
        'data-admin-only': item.admin ? '' : null
      }, svg(item.icone), el('span', { text: item.rotulo }));
      return link;
    }));

    const sair = el('a', { class: 'sidebar-logout', href: '../index.html', 'data-logout': '' },
      svg('<path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"></path>'),
      el('span', { text: 'Sair' }));

    lateral.replaceChildren(marca, navegacao, sair);
    lateral.dataset.rendered = 'true';
  }

  return { render };
})();
