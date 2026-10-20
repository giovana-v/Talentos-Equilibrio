document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  const feedback = document.getElementById('login-feedback');
  const forgotPassword = document.getElementById('forgot-password');

  const savedEmail = Storage.getItem('rememberedEmail');
  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberCheckbox.checked = true;
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const session = Auth.login(email, password);

    if (!session) {
      feedback.textContent = 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
      feedback.hidden = false;
      passwordInput.focus();
      return;
    }

    if (rememberCheckbox.checked) {
      Storage.setItem('rememberedEmail', email);
    } else {
      Storage.removeItem('rememberedEmail');
    }

    window.location.href = 'pages/dashboard.html';
  });

  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener('input', () => {
      feedback.hidden = true;
    });
  });

  forgotPassword.addEventListener('click', () => {
    feedback.textContent = 'A recuperação automática ainda não está disponível. Entre em contato com o RH.';
    feedback.hidden = false;
  });
});
