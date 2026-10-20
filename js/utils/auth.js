// Autenticação demonstrativa para o protótipo front-end.
const Auth = (() => {
  const SESSION_KEY = 'talentosSession';
  const NOTICE_KEY = 'talentosAuthNotice';
  const users = [
    {
      name: 'Nicole',
      email: 'nicole@talentos.com',
      password: 'Admin@123',
      role: 'admin'
    },
    {
      name: 'Adriel',
      email: 'adriel@talentos.com',
      password: 'Usuario@123',
      role: 'user'
    }
  ];
  const userPages = new Set(['dashboard.html', 'perfil.html']);

  function getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      return session && ['admin', 'user'].includes(session.role) ? session : null;
    } catch {
      return null;
    }
  }

  function login(email, password) {
    const user = users.find((account) =>
      account.email === email.trim().toLowerCase() && account.password === password
    );

    if (!user) return null;

    const session = { name: user.name, email: user.email, role: user.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function canAccess(page, session = getSession()) {
    if (!session) return false;
    return session.role === 'admin' || userPages.has(page);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    const inPagesFolder = window.location.pathname.includes('/pages/');
    window.location.replace(inPagesFolder ? '../index.html' : 'index.html');
  }

  function updateDisplayName(name) {
    const session = getSession();
    const cleanedName = String(name || '').trim();
    if (!session || !cleanedName) return false;
    try {
      session.name = cleanedName;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    } catch {
      return false;
    }
  }

  function protectCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    const session = getSession();
    const isInternalPage = path.includes('/pages/');

    if (isInternalPage && !session) {
      window.location.replace('../index.html');
      return;
    }

    if (isInternalPage && !canAccess(page, session)) {
      sessionStorage.setItem(NOTICE_KEY, 'Esta área está disponível apenas para administradores.');
      window.location.replace('dashboard.html');
      return;
    }

    if (!isInternalPage && session && (page === 'index.html' || page === '')) {
      window.location.replace('pages/dashboard.html');
    }
  }

  function setupPage() {
    const session = getSession();
    if (!session) return;

    document.querySelectorAll('[data-auth-name]').forEach((element) => {
      element.textContent = session.name;
    });
    document.querySelectorAll('[data-auth-role]').forEach((element) => {
      element.textContent = session.role === 'admin' ? 'RH' : 'Colaborador';
    });
    document.querySelectorAll('[data-auth-initials]').forEach((element) => {
      element.textContent = session.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
    });

    const userMenu = document.querySelector('[data-auth-user-menu]');
    if (userMenu) userMenu.setAttribute('aria-label', `Perfil de ${session.name}`);

    if (session.role === 'user') {
      document.querySelectorAll('[data-admin-only]').forEach((element) => {
        element.hidden = true;
      });
      document.querySelectorAll('[data-user-only]').forEach((element) => {
        element.hidden = false;
      });
      const profileLink = document.querySelector('[href="perfil.html"] span');
      if (profileLink) profileLink.textContent = 'Minha jornada';
      const accountProfileLink = document.querySelector('[data-account-profile-link]');
      if (accountProfileLink) {
        accountProfileLink.href = 'perfil.html';
        accountProfileLink.textContent = 'Minha jornada';
      }
      const eyebrow = document.querySelector('[data-dashboard-eyebrow]');
      const title = document.querySelector('[data-dashboard-title]');
      const description = document.querySelector('[data-dashboard-description]');
      if (eyebrow) eyebrow.textContent = 'Seu espaço';
      if (title) title.textContent = 'Minha jornada';
      if (description) description.textContent = 'Acompanhe seu desenvolvimento e sua trajetória profissional.';
    } else {
      document.querySelectorAll('[data-user-only]').forEach((element) => {
        element.hidden = true;
      });
    }

    document.querySelectorAll('.nav-link').forEach((link) => {
      const label = link.querySelector('span')?.textContent.trim();
      if (!label) return;
      link.setAttribute('aria-label', label);
      link.title = label;
    });
    document.querySelectorAll('.sidebar-logout').forEach((link) => {
      link.setAttribute('aria-label', 'Sair');
      link.title = 'Sair';
    });

    document.querySelectorAll('[data-logout]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
      });
    });

    const notice = sessionStorage.getItem(NOTICE_KEY);
    const noticeElement = document.querySelector('[data-auth-notice]');
    if (notice && noticeElement) {
      noticeElement.textContent = notice;
      noticeElement.hidden = false;
      sessionStorage.removeItem(NOTICE_KEY);
    }
  }

  return { login, logout, getSession, canAccess, protectCurrentPage, setupPage, updateDisplayName };
})();

Auth.protectCurrentPage();
document.addEventListener('DOMContentLoaded', Auth.setupPage);
