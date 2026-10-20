# Talentos em Equilíbrio

Sistema web para RH acompanhar a jornada de carreira das mulheres na empresa,
identificar barreiras e apoiar decisões por um ambiente mais justo e inclusivo.

Projeto construído apenas com **HTML, CSS e JavaScript** (sem back-end). Os
dados demonstrativos são definidos nos scripts e salvos no armazenamento local
do navegador (`localStorage` e `sessionStorage`). Os arquivos em `data/` estão
vazios e não são carregados pela aplicação.

> **Demonstração:** as credenciais mostradas na tela de login são públicas e
> estão embutidas no JavaScript. Não use dados pessoais ou senhas reais neste
> protótipo; a autenticação não protege dados em um servidor.

---

## Telas do sistema

| Tela                | Arquivo                      | Descrição                                            |
|---------------------|------------------------------|------------------------------------------------------|
| Login               | `index.html`                 | Acesso ao sistema (porta de entrada).                |
| Dashboard RH        | `pages/dashboard.html`       | Visão geral: métricas, funil de carreira, promoções. |
| Colaboradores       | `pages/colaboradores.html`   | Lista com busca e filtros por setor/cargo/gênero.    |
| Perfil / Jornada    | `pages/perfil.html`          | Perfil da colaboradora + histórico e linha do tempo. |
| Relatórios          | `pages/relatorios.html`      | Comparativos por setor e principais descobertas.     |
| Configurações       | `pages/configuracoes.html`   | Ajustes do sistema.                                  |

---

## Estrutura de pastas

```
TCC-Nick/
│
├── index.html                  # Tela de Login (ponto de entrada)
│
├── pages/                      # Demais telas do sistema
│   ├── dashboard.html          # Dashboard RH
│   ├── colaboradores.html      # Lista de colaboradores
│   ├── perfil.html             # Perfil + Jornada de Carreira
│   ├── relatorios.html         # Relatórios e Análises
│   └── configuracoes.html      # Configurações
│
├── css/                        # Todos os estilos
│   ├── variables.css           # Cores (tons de roxo), fontes, espaçamentos
│   ├── base.css                # Reset e estilos globais (body, tipografia)
│   ├── layout.css              # Estrutura geral (sidebar + área de conteúdo)
│   │
│   ├── components/             # Estilos de elementos reutilizáveis
│   │   ├── sidebar.css         # Menu lateral
│   │   ├── navbar.css          # Barra superior (notificações, usuário)
│   │   ├── cards.css           # Cartões de métricas
│   │   ├── table.css           # Tabela de colaboradores
│   │   ├── charts.css          # Gráficos (funil, barras)
│   │   ├── forms.css           # Campos de formulário e filtros
│   │   └── buttons.css         # Botões
│   │
│   └── pages/                  # Estilos específicos de cada tela
│       ├── login.css
│       ├── dashboard.css
│       ├── colaboradores.css
│       ├── perfil.css
│       ├── relatorios.css
│       └── configuracoes.css
│
├── js/                         # Toda a lógica (JavaScript)
│   ├── main.js                 # Inicialização geral do site
│   │
│   ├── components/             # Comportamento de elementos reutilizáveis
│   │   ├── sidebar.js          # Navegação lateral
│   │   ├── navbar.js           # Menu do usuário, notificações
│   │   └── charts.js           # Desenho/atualização dos gráficos
│   │
│   ├── pages/                  # Lógica específica de cada tela
│   │   ├── login.js            # Validação do formulário de login
│   │   ├── dashboard.js        # Carrega e exibe métricas
│   │   ├── colaboradores.js    # Busca, filtros e listagem
│   │   ├── perfil.js           # Monta histórico e linha do tempo
│   │   └── relatorios.js       # Monta gráficos e descobertas
│   │
│   └── utils/                  # Funções auxiliares
│       ├── helpers.js          # Formatação, cálculos, utilidades
│       └── storage.js          # Acesso ao localStorage (ex.: "lembrar-me")
│
├── data/                       # Reservado para dados de exemplo (não utilizado)
│   ├── colaboradores.json
│   └── metricas.json
│
├── assets/                     # Arquivos estáticos
│   ├── images/                 # Logo, ilustrações, fotos/avatares
│   ├── icons/                  # Ícones (SVG)
│   └── fonts/                  # Fontes (caso não use CDN)
│
└── README.md                   # Este arquivo
```

---

## Lógica da organização

- **`index.html` na raiz** é o login, por convenção de ponto de entrada; as
  outras telas ficam em `pages/`.
- **CSS e JS divididos em `components/` e `pages/`**: o que se repete em várias
  telas (sidebar, cards, tabela, gráficos) fica em `components/`; o que é
  exclusivo de uma tela fica em `pages/`. Isso evita repetição e facilita a
  manutenção.
- **Dados de demonstração**: os registros de colaboradores são montados em
  `js/pages/colaboradores.js`; preferências, metas e alterações de perfil ficam
  no armazenamento local do navegador. Limpar os dados do site reinicia essas
  informações locais.
- **`utils/`** guarda funções que servem a várias telas (formatação, cálculos,
  acesso ao armazenamento local).
- **`assets/`** separa imagens, ícones e fontes do código.

---

## Como usar

1. Abra o projeto em um editor (ex.: VS Code).
2. Rode com um servidor local (ex.: extensão **Live Server**).
   > Um servidor local é necessário porque o `fetch` dos arquivos JSON não
   > funciona abrindo o HTML direto pelo navegador (`file://`).
3. Comece pela tela de login (`index.html`).

---

## Convenções sugeridas

- Nomes de arquivos e pastas em **minúsculas**, sem acentos e sem espaços.
- Uma folha de estilo e um script por tela, sempre com o mesmo nome da página.
- Cores e fontes centralizadas em `css/variables.css` (não repetir valores fixos
  espalhados pelo código).
