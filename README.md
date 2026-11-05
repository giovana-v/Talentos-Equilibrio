# Talentos em Equilíbrio

Sistema web para o RH acompanhar a jornada de carreira das mulheres na empresa,
identificar barreiras e apoiar decisões por um ambiente mais justo e inclusivo.

Projeto construído apenas com **HTML, CSS e JavaScript** (sem back-end, sem
bibliotecas externas). Os dados são de demonstração e ficam no navegador
(`localStorage` e `sessionStorage`).

> **Demonstração:** as credenciais mostradas na tela de login são públicas e
> estão embutidas no JavaScript. Não use dados pessoais ou senhas reais neste
> protótipo; a autenticação não protege dados em um servidor.

---

## Como usar

1. Abra o projeto em um editor (ex.: VS Code).
2. **Abra o `index.html` direto no navegador.** Nada é carregado com `fetch`, então
   **não é necessário servidor local**.
3. Entre com uma das contas de demonstração:
   - **RH:** `nicole@talentos.com` / `Admin@123`
   - **Colaborador:** `adriel@talentos.com` / `Usuario@123`

Limpar os dados do site no navegador reinicia tudo (os dados de demonstração são
gerados de novo na próxima abertura).

---

## Telas do sistema

| Tela                | Arquivo                       | Acesso      | Descrição |
|---------------------|-------------------------------|-------------|-----------|
| Login               | `index.html`                  | Todos       | Acesso ao sistema. |
| Dashboard           | `pages/dashboard.html`        | RH / Colab. | RH: indicadores, funil por cargo, **mapa mensal de promoções** e painel de uso do plano. Colaborador: perfil, metas e notícias. |
| Colaboradores       | `pages/colaboradores.html`    | RH          | Lista com busca/filtros e cadastro (cargo vem do plano; salário opcional). |
| Perfil / Jornada    | `pages/perfil.html`           | RH / Colab. | Contrato, remuneração, benefícios, organograma, projetos, histórico de cargos e jornada no plano. O RH também registra promoções e edita os dados. |
| Carreira geral      | `pages/carreira-geral.html`   | RH          | Comparação **mulheres × homens** por nível: distribuição, tempo de empresa, salário (média e mediana) e tempo até a promoção. |
| Plano de carreira   | `pages/plano-carreira.html`   | RH          | Editor (CRUD) de trilhas e cargos, exportar/importar JSON, restaurar modelo padrão e simulação para candidato externo. |
| Cargo               | `pages/cargo.html?id=...`     | RH / Colab. | Descrição, requisitos, faixa, benefícios e trilha. O RH vê também quem ocupa o cargo (com % por gênero). O colaborador só abre cargos da própria trilha e não vê dados de outras pessoas. |
| Relatórios          | `pages/relatorios.html`       | RH          | Liderança e desistência por setor, funil das mulheres, descobertas e mapa de promoções, com filtros de setor e período. |
| Configurações       | `pages/configuracoes.html`    | RH          | Preferências, segurança, notificações e **benefícios da empresa**. |

Telas restritas redirecionam o colaborador para o Dashboard com o aviso
"Esta área está disponível apenas para administradores." (`js/utils/auth.js`).

---

## Modelo de dados

Tudo é salvo em `localStorage` por `js/utils/storage.js`. Há **uma única fonte de
dados**: os indicadores nunca são digitados no HTML, sempre calculados a partir
de colaboradores, plano e promoções.

### Plano de carreira (chave `planoCarreira`) — `js/utils/plano.js`

```
{ trilhas: [Trilha], cargos: [Cargo] }

Trilha: { id, nome, setor ("Todos" ou um setor), descricao, ativa }

Cargo:  { id, trilhaId, nome, ordem, tipo ("operacional" | "lideranca"),
          faixaSalarialMin, faixaSalarialMax, tempoMinimoNoCargoMeses,
          requisitos: { competencias[], formacao, experiencia },
          responsabilidades[], beneficios[],
          proximosCargosIds[],   // mais de um = carreira ramificada (em Y)
          ativo }
```

Regras: nome obrigatório, faixa mínima ≤ máxima, sem ciclos entre próximos
cargos. Excluir um cargo com colaboradores (ou histórico de promoções) é
**bloqueado** até migrá-los para outro cargo. O modelo padrão é Estagiário →
Júnior → Pleno → Sênior → (Especialista | Coordenação) → Gerência → Diretoria.

### Colaboradores (`talentosColaboradores`) — `js/utils/dados.js`

```
{ id, name, gender, sector,
  cargoId,            // referência ao plano
  role,               // nome do cargo (mantido em sincronia com o plano)
  funcao,             // título livre do cargo antigo (opcional)
  hireDate, cargoDesde,
  salary, salaryHistory: [{ data, valor, motivo }],
  contractType, contractStart, contractEnd,
  beneficiosIds,      // null = todos os benefícios da empresa
  managerId,          // gestor direto (base do organograma)
  projects: [{ id, nome, papel, inicio, fim, status, resultado }] }
```

### Outros registros

| Chave | Conteúdo |
|-------|----------|
| `talentosPromocoes` | `{ id, colaboradorId, cargoOrigemId, cargoDestinoId, data, setor }` |
| `talentosDesligamentos` | `{ id, gender, sector, cargoId, data }` (base da taxa de desistência) |
| `talentosBeneficios` | `{ id, nome, descricao, icone }` (editável em Configurações) |
| `talentosDadosVersao` | Versão do esquema, usada pela migração |

### Migração

Na primeira carga com dados do formato antigo, `Dados.init()` completa cada
colaborador: mapeia o cargo antigo (texto livre) para um cargo do plano padrão,
guarda o texto original em `funcao`, calcula `hireDate`, salário, contrato,
gestor e projetos, e gera o histórico de promoções. A migração é idempotente.

### Cálculos e regra de amostra

`js/utils/analytics.js` concentra todos os cálculos. **Grupos com menos de 3
pessoas exibem "amostra pequena"** em vez de média ou percentual. Taxas:

- **Promoção** = mulheres promovidas na janela ÷ mulheres no quadro.
- **Desistência** = desligamentos ÷ (quadro + desligamentos).
- **Tempo até a promoção** = tempo entre a admissão (ou a promoção anterior) e cada promoção.
- Diferenças percentuais são sempre **mulheres em relação a homens**.

> Os dados fictícios incluem **disparidades propositais** (mulheres levam mais
> tempo para ser promovidas, têm salário um pouco menor dentro da faixa e menos
> presença na liderança) para que os indicadores de equidade tenham o que
> mostrar. Os parâmetros ficam em `Dados.DEMO` (`js/utils/dados.js`).

---

## Estrutura de pastas

```
TCC-Nick/
├── index.html                  # Login
├── pages/                      # Telas autenticadas (ver tabela acima)
│   ├── dashboard.html  colaboradores.html  perfil.html
│   ├── carreira-geral.html  plano-carreira.html  cargo.html
│   └── relatorios.html  configuracoes.html
│
├── css/
│   ├── variables.css           # Paleta vinho/bordô com dourado, espaçamentos
│   ├── base.css                # Reset e importação dos componentes
│   ├── layout.css              # Estrutura (sidebar + conteúdo)
│   ├── components/             # sidebar, navbar, cards, table, charts, forms, buttons
│   └── pages/                  # Um arquivo por tela
│
├── js/
│   ├── utils/
│   │   ├── storage.js          # Acesso ao localStorage
│   │   ├── auth.js             # Sessão, perfis RH/colaborador e proteção de páginas
│   │   ├── helpers.js          # DOM (el), formatação, datas, diálogos, arquivos
│   │   ├── plano.js            # Plano de carreira: modelo, CRUD, validações, import/export
│   │   ├── dados.js            # Colaboradores, promoções, benefícios, migração, dados de demonstração
│   │   └── analytics.js        # Todos os indicadores calculados
│   ├── components/
│   │   ├── sidebar.js          # Menu lateral (renderizado a partir de data-sidebar)
│   │   ├── navbar.js           # Notificações e menu do usuário
│   │   ├── charts.js           # Barras, funis e tabelas alternativas acessíveis
│   │   ├── heatmap.js          # Mapa mensal de promoções
│   │   └── jornada.js          # Visão somente leitura do plano (perfil e simulação)
│   └── pages/                  # Um script por tela
│
├── assets/images/              # Ilustração do login
├── data/                       # Reservado (vazio, não utilizado)
└── README.md
```

Ordem de carregamento nas páginas internas (scripts no fim do `<body>`):
`storage → helpers → plano → dados → analytics → componentes → script da página`.
`auth.js` fica no `<head>`; ele protege a página e chama `Sidebar.render()`.

---

## Acessibilidade

Link "pular para o conteúdo", rótulos ARIA, mensagens em regiões `aria-live`,
navegação por teclado nos botões de reordenar, nas abas e no mapa de promoções
(setas, Home e End), diálogos nativos `<dialog>`, e cada gráfico tem descrição
textual e uma tabela alternativa ("Ver dados em tabela"). O mapa de promoções é
uma tabela real: a cor reforça o número, que aparece sempre na célula.

---

## Convenções

- Nomes de arquivos e pastas em **minúsculas**, sem acentos e sem espaços.
- Uma folha de estilo e um script por tela, com o mesmo nome da página.
- Cores e fontes centralizadas em `css/variables.css`.
- Nenhum número de indicador é escrito à mão: use `Analytics`.
