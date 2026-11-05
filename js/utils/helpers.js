// Funções auxiliares compartilhadas pelas páginas (DOM, formatação, datas e arquivos).
const Helpers = (() => {
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const DIAS_POR_MES = 30.4375;

  // Ícones de traço simples (viewBox 24x24). Os caminhos são constantes do projeto.
  const ICONES = {
    heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z'],
    food: ['M4 3v8a3 3 0 0 0 3 3v7M7 3v6M10 3v8a3 3 0 0 1-3 3M17 3c-2 2-3 4-3 7s1 4 3 4v7'],
    bus: ['M5 4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 11h16M7 17v3M17 17v3M8 14h.01M16 14h.01'],
    book: ['M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7'],
    gift: ['M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H8a2.5 2.5 0 1 1 0-5c3 0 4 5 4 5zM12 7h4a2.5 2.5 0 1 0 0-5c-3 0-4 5-4 5z'],
    wallet: ['M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2'],
    shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
    star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z'],
    users: ['M3 20v-1.5a6 6 0 0 1 12 0V20zM9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM17 5.5a3 3 0 0 1 0 5.8M17.5 14a5 5 0 0 1 3.5 4.9V20h-2.5'],
    user: ['M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21v-2a8 8 0 0 1 16 0v2z'],
    clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'],
    money: ['M12 2v20M17 6.5C16 5 14.5 4.5 12 4.5c-3 0-4.5 1.3-4.5 3.2 0 4.6 9.5 2 9.5 7 0 2-1.8 3.3-5 3.3-2.5 0-4.5-.8-5.5-2.5'],
    chart: ['m3 17 6-6 4 4 8-9M15 6h6v6'],
    calendar: ['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 10h18']
  };

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key === 'style') node.setAttribute('style', value);
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === 'value' || key === 'checked' || key === 'selected') node[key] = value;
      else node.setAttribute(key, value === true ? '' : String(value));
    });
    append(node, children);
    return node;
  }

  function append(node, children) {
    children.flat(Infinity).forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = (ICONES[name] || ICONES.star).map((path) => `<path d="${path}"></path>`).join('');
    return svg;
  }

  /* Números e textos */
  function formatNumber(value, digits = 0) {
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function formatPercent(value, digits = 1) {
    return `${formatNumber(value, digits)}%`;
  }

  function formatCurrency(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(number);
  }

  function plural(count, singular, pluralForm) {
    return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
  }

  function formatDuration(totalMonths) {
    const months = Math.max(0, Math.round(totalMonths));
    const years = Math.floor(months / 12);
    const rest = months % 12;
    if (years && rest) return `${plural(years, 'ano', 'anos')} e ${plural(rest, 'mês', 'meses')}`;
    if (years) return plural(years, 'ano', 'anos');
    return plural(rest, 'mês', 'meses');
  }

  function formatYears(totalMonths) {
    const years = Math.round((totalMonths / 12) * 10) / 10;
    return `${formatNumber(years, 1)} ${years === 1 ? 'ano' : 'anos'}`;
  }

  function initials(name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function normalize(text) {
    return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function splitLines(value) {
    const lines = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
    return lines.map((line) => String(line).trim()).filter(Boolean);
  }

  /* Datas (sempre ISO AAAA-MM-DD no armazenamento) */
  function parseDate(value) {
    if (value instanceof Date) return new Date(value.getTime());
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
    return new Date(value);
  }

  function isValidDate(value) {
    return !Number.isNaN(parseDate(value).getTime());
  }

  function toISO(date) {
    const d = parseDate(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  function addMonths(date, amount) {
    const d = parseDate(date);
    const whole = Math.trunc(amount);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + whole);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    const days = Math.round((amount - whole) * DIAS_POR_MES);
    if (days) d.setDate(d.getDate() + days);
    return d;
  }

  function monthsBetween(from, to = new Date()) {
    return (parseDate(to) - parseDate(from)) / (1000 * 60 * 60 * 24 * DIAS_POR_MES);
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = parseDate(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  }

  function formatMonthYear(value, long = false) {
    const d = parseDate(value);
    return long ? `${MESES[d.getMonth()]} de ${d.getFullYear()}` : `${MESES_CURTOS[d.getMonth()]}/${d.getFullYear()}`;
  }

  /* Estatística */
  function numbers(list) {
    return list.map(Number).filter(Number.isFinite);
  }

  function mean(list) {
    const values = numbers(list);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }

  function median(list) {
    const values = numbers(list).sort((a, b) => a - b);
    if (!values.length) return null;
    const middle = Math.floor(values.length / 2);
    return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  }

  /* Aleatoriedade determinística (dados de demonstração reproduzíveis) */
  function hashString(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function rng(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0')}`;
  }

  /* Interface */
  function announce(node, message, kind) {
    if (!node) return;
    node.textContent = message;
    node.classList.remove('is-success', 'is-error');
    if (kind === 'success') node.classList.add('is-success');
    if (kind === 'error') node.classList.add('is-error');
  }

  function prepareDialog(dialog) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
    return new Promise((resolve) => {
      const dialog = el('dialog', { class: 'app-dialog app-dialog-small', 'aria-labelledby': 'confirm-dialog-title' });
      const confirmButton = el('button', { class: `button ${danger ? 'button-danger' : 'button-primary'}`, type: 'submit', value: 'ok' }, confirmLabel);
      const form = el('form', { method: 'dialog' },
        el('h2', { id: 'confirm-dialog-title', text: title }),
        el('p', { class: 'dialog-text', text: message }),
        el('div', { class: 'form-actions' },
          el('button', { class: 'button button-secondary', type: 'submit', value: 'cancel' }, 'Cancelar'),
          confirmButton));
      dialog.append(form);
      document.body.append(dialog);
      prepareDialog(dialog);
      dialog.addEventListener('close', () => {
        const confirmed = dialog.returnValue === 'ok';
        dialog.remove();
        resolve(confirmed);
      });
      dialog.showModal();
      confirmButton.focus();
    });
  }

  /* Arquivos */
  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = el('a', { href: url, download: filename });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function readJSONFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        try { resolve(JSON.parse(reader.result)); } catch { reject(new Error('O arquivo não é um JSON válido.')); }
      });
      reader.addEventListener('error', () => reject(new Error('Não foi possível ler o arquivo.')));
      reader.readAsText(file);
    });
  }

  function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  return {
    MESES, MESES_CURTOS, el, append, icon,
    formatNumber, formatPercent, formatCurrency, plural, formatDuration, formatYears, initials, normalize, splitLines,
    parseDate, isValidDate, toISO, addMonths, monthsBetween, formatDate, formatMonthYear,
    mean, median, hashString, rng, uid,
    announce, prepareDialog, confirmDialog, downloadJSON, readJSONFile, queryParam
  };
})();
