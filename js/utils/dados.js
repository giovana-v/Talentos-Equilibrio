// Fonte única dos dados do protótipo: colaboradores, promoções, desligamentos e benefícios (localStorage).
// Na primeira carga gera dados de demonstração coerentes com o plano de carreira e migra registros do formato antigo.
const Dados = (() => {
  const CHAVES = {
    colaboradores: 'talentosColaboradores',
    promocoes: 'talentosPromocoes',
    desligamentos: 'talentosDesligamentos',
    beneficios: 'talentosBeneficios',
    versao: 'talentosDadosVersao'
  };
  const VERSAO = 2;

  // Parâmetros dos dados fictícios. As disparidades são propositais: servem para que os
  // indicadores de equidade tenham algo a mostrar na demonstração.
  const DEMO = {
    fatorTempoPromocaoMulheres: 1.4,
    expoenteQuantidadePromocoes: 1.1,
    posicaoSalarialMulheres: 0.6,
    anosMinimosLiderancaMulheres: 6,
    anosMinimosGerenciaMulheres: 9,
    anosMinimosGerenciaHomens: 7,
    anosMinimosLiderancaHomens: 2,
    anosParaSeniorMulheres: 6,
    anosParaSeniorHomens: 5,
    anosParaPlenoMulheres: 3,
    anosParaPlenoHomens: 2,
    taxaDesligamentoMulheres: { Tecnologia: 0.17, Marketing: 0.14, Financeiro: 0.1, Vendas: 0.07, RH: 0.05, Operações: 0.08 },
    fatorDesligamentoHomens: 0.7
  };

  const MULTIPLICADOR_SETOR = { Tecnologia: 1.08, Financeiro: 1.05, Vendas: 1, Marketing: 0.98, RH: 0.96, Operações: 0.95 };
  const SETORES_PADRAO = ['Vendas', 'Tecnologia', 'Marketing', 'Financeiro', 'RH', 'Operações'];

  const BENEFICIOS_PADRAO = [
    { id: 'bn-saude', nome: 'Plano de saúde', descricao: 'Cobertura médica nacional, com coparticipação reduzida.', icone: 'heart' },
    { id: 'bn-refeicao', nome: 'Vale-refeição', descricao: 'R$ 38,00 por dia útil, em cartão.', icone: 'food' },
    { id: 'bn-transporte', nome: 'Vale-transporte', descricao: 'Conforme o trajeto entre casa e trabalho.', icone: 'bus' },
    { id: 'bn-educacao', nome: 'Auxílio educação', descricao: 'Reembolso de até 70% em cursos e certificações.', icone: 'book' },
    { id: 'bn-plr', nome: 'Participação nos resultados', descricao: 'Pagamento anual conforme as metas da empresa.', icone: 'wallet' },
    { id: 'bn-vida', nome: 'Seguro de vida', descricao: 'Cobertura em grupo, sem custo para o colaborador.', icone: 'shield' }
  ];

  // Dados específicos das contas de demonstração (mantidos da versão anterior do protótipo).
  const PERFIS_FIXOS = {
    'c-adriel': {
      email: 'adriel@talentos.com',
      salary: 5200,
      beneficiosIds: ['bn-saude', 'bn-refeicao', 'bn-transporte', 'bn-educacao'],
      projects: [
        { nome: 'Expansão da carteira de clientes', papel: 'Analista responsável', mesesInicio: 7, mesesFim: null, status: 'Em andamento', resultado: 'Meta parcial: 14 novos clientes no semestre.' },
        { nome: 'Implantação do CRM comercial', papel: 'Usuário-chave', mesesInicio: 16, mesesFim: 9, status: 'Concluído', resultado: 'CRM adotado por 100% do time de vendas.' }
      ]
    },
    'c-1': {
      salary: 5800,
      beneficiosIds: ['bn-saude', 'bn-refeicao', 'bn-transporte'],
      projects: [
        { nome: 'Campanha de posicionamento da marca', papel: 'Analista de conteúdo', mesesInicio: 10, mesesFim: 4, status: 'Concluído', resultado: 'Alcance 32% acima da meta.' },
        { nome: 'Calendário de conteúdo digital', papel: 'Responsável', mesesInicio: 3, mesesFim: null, status: 'Em andamento', resultado: 'Publicações semanais em andamento.' }
      ]
    },
    'rh-nicole': {
      email: 'nicole@talentos.com',
      salary: 6800,
      beneficiosIds: ['bn-saude', 'bn-refeicao', 'bn-educacao'],
      projects: [
        { nome: 'Programa de desenvolvimento de lideranças', papel: 'Facilitadora', mesesInicio: 8, mesesFim: null, status: 'Em andamento', resultado: 'Duas turmas concluídas.' },
        { nome: 'Pesquisa de clima organizacional', papel: 'Coordenação da pesquisa', mesesInicio: 14, mesesFim: 10, status: 'Concluído', resultado: 'Participação de 87% dos colaboradores.' }
      ]
    }
  };

  const PROJETOS_POR_SETOR = {
    Vendas: ['Expansão da carteira de clientes', 'Implantação do CRM comercial', 'Campanha de fim de ano', 'Programa de indicação de clientes'],
    Tecnologia: ['Migração para a nuvem', 'Redesenho do portal do cliente', 'Automação de testes', 'Painel de indicadores internos'],
    Marketing: ['Campanha de posicionamento da marca', 'Calendário de conteúdo digital', 'Pesquisa de percepção de marca', 'Renovação do site institucional'],
    Financeiro: ['Revisão do orçamento anual', 'Automação de conciliações', 'Painel de fluxo de caixa', 'Política de compras'],
    RH: ['Programa de desenvolvimento de lideranças', 'Pesquisa de clima organizacional', 'Revisão do plano de cargos', 'Programa de integração'],
    Operações: ['Mapeamento de processos', 'Redução de desperdícios', 'Renegociação com fornecedores', 'Padronização de rotinas']
  };
  const RESULTADOS = ['Entrega concluída dentro do prazo.', 'Redução de 18% no tempo de execução.', 'Meta superada em 12%.', 'Processo adotado por toda a área.', 'Aprovado pela diretoria.'];

  let cache = { colaboradores: null, promocoes: null, desligamentos: null, beneficios: null };

  /* Sementes no formato antigo (a migração completa os demais campos) */
  function sementesLegadas() {
    const lista = [
      { id: 'c-1', name: 'Ana Silva', gender: 'Feminino', sector: 'Marketing', role: 'Analista', tenure: 2 },
      { id: 'c-2', name: 'Beatriz Oliveira', gender: 'Feminino', sector: 'Tecnologia', role: 'Desenvolvedora', tenure: 1 },
      { id: 'c-3', name: 'Carlos Souza', gender: 'Masculino', sector: 'Vendas', role: 'Analista', tenure: 3 },
      { id: 'c-4', name: 'Fernanda Lima', gender: 'Feminino', sector: 'Financeiro', role: 'Assistente', tenure: 4 },
      { id: 'c-5', name: 'Gabriel Santos', gender: 'Masculino', sector: 'Tecnologia', role: 'Desenvolvedor', tenure: 2 },
      { id: 'c-6', name: 'Juliana Costa', gender: 'Feminino', sector: 'RH', role: 'Coordenadora de RH', tenure: 5 },
      { id: 'c-7', name: 'Rafael Martins', gender: 'Masculino', sector: 'Vendas', role: 'Executivo de contas', tenure: 3 },
      { id: 'c-8', name: 'Mariana Alves', gender: 'Feminino', sector: 'Tecnologia', role: 'Analista de dados', tenure: 2 },
      { id: 'c-9', name: 'Lucas Ferreira', gender: 'Masculino', sector: 'Financeiro', role: 'Analista financeiro', tenure: 4 },
      { id: 'c-10', name: 'Patrícia Mendes', gender: 'Feminino', sector: 'Vendas', role: 'Supervisora de vendas', tenure: 6 },
      { id: 'c-11', name: 'Thiago Rocha', gender: 'Masculino', sector: 'Marketing', role: 'Designer', tenure: 1 },
      { id: 'c-12', name: 'Camila Ribeiro', gender: 'Feminino', sector: 'Operações', role: 'Analista de operações', tenure: 3 },
      { id: 'c-13', name: 'Eduardo Nunes', gender: 'Masculino', sector: 'Tecnologia', role: 'Desenvolvedor', tenure: 5 },
      { id: 'c-14', name: 'Larissa Gomes', gender: 'Feminino', sector: 'Financeiro', role: 'Especialista', tenure: 7 },
      { id: 'c-15', name: 'Bruno Carvalho', gender: 'Masculino', sector: 'Vendas', role: 'Analista', tenure: 2 },
      { id: 'c-16', name: 'Renata Dias', gender: 'Feminino', sector: 'Marketing', role: 'Gerente de marketing', tenure: 8 },
      { id: 'c-17', name: 'Felipe Barros', gender: 'Masculino', sector: 'Operações', role: 'Coordenador', tenure: 6 },
      { id: 'c-18', name: 'Isabela Freitas', gender: 'Feminino', sector: 'RH', role: 'Analista de RH', tenure: 2 },
      { id: 'c-19', name: 'André Lima', gender: 'Masculino', sector: 'Financeiro', role: 'Assistente', tenure: 1 },
      { id: 'c-adriel', name: 'Adriel Banner', gender: 'Masculino', sector: 'Vendas', role: 'Analista', tenure: 2 },
      { id: 'rh-nicole', name: 'Nicole', gender: 'Feminino', sector: 'RH', role: 'Analista de RH', tenure: 4 }
    ];

    function gerar(nomes, genero, quantidade, inicio) {
      const sobrenomes = ['Almeida', 'Azevedo', 'Barbosa', 'Batista', 'Campos', 'Cardoso', 'Castro', 'Cavalcanti', 'Cunha', 'Farias', 'Gonçalves', 'Lopes', 'Machado', 'Monteiro', 'Moraes', 'Moreira', 'Nascimento', 'Pereira', 'Ramos', 'Rezende', 'Santana', 'Teixeira', 'Vieira', 'Xavier'];
      const cargos = genero === 'Feminino'
        ? ['Analista', 'Assistente', 'Especialista', 'Coordenadora', 'Consultora', 'Desenvolvedora', 'Executiva de contas']
        : ['Analista', 'Assistente', 'Especialista', 'Coordenador', 'Consultor', 'Desenvolvedor', 'Executivo de contas'];
      const existentes = new Set(lista.map((pessoa) => pessoa.name.toLocaleLowerCase('pt-BR')));
      let adicionados = 0;
      for (const nome of nomes) {
        for (const sobrenome of sobrenomes) {
          if (adicionados >= quantidade) return;
          const completo = `${nome} ${sobrenome}`;
          if (existentes.has(completo.toLocaleLowerCase('pt-BR'))) continue;
          existentes.add(completo.toLocaleLowerCase('pt-BR'));
          lista.push({
            id: `c-${inicio + adicionados}`,
            name: completo,
            gender: genero,
            sector: SETORES_PADRAO[(inicio + adicionados) % SETORES_PADRAO.length],
            role: cargos[(inicio + adicionados) % cargos.length],
            tenure: (inicio + adicionados) % 10
          });
          adicionados += 1;
        }
      }
    }

    gerar(['Aline', 'Amanda', 'Bianca', 'Bruna', 'Carolina', 'Cecília', 'Daniela', 'Elisa', 'Emília', 'Estela', 'Flávia', 'Helena', 'Isadora', 'Júlia', 'Letícia', 'Luana', 'Manuela', 'Natália', 'Paula', 'Raquel'], 'Feminino', 101, 1000);
    gerar(['Alexandre', 'Antônio', 'Caio', 'Danilo', 'Diego', 'Douglas', 'Enzo', 'Gustavo', 'Heitor', 'Igor', 'João', 'Leonardo', 'Marcelo', 'Matheus', 'Murilo', 'Otávio', 'Pedro', 'Rodrigo', 'Samuel', 'Vinícius'], 'Masculino', 134, 2000);
    return lista;
  }

  /* Persistência com cache */
  function ler(chave, secao) {
    if (!cache[secao]) {
      const salvo = Storage.getItem(chave);
      cache[secao] = Array.isArray(salvo) ? salvo : [];
    }
    return cache[secao];
  }

  function gravar(chave, secao, lista) {
    if (!Storage.setItem(chave, lista)) return false;
    cache[secao] = lista;
    return true;
  }

  function colaboradores() {
    const lista = ler(CHAVES.colaboradores, 'colaboradores');
    lista.forEach((pessoa) => {
      const cargo = Plano.cargo(pessoa.cargoId);
      if (cargo) pessoa.role = cargo.nome;
    });
    return lista;
  }

  function promocoes() { return ler(CHAVES.promocoes, 'promocoes'); }
  function desligamentos() { return ler(CHAVES.desligamentos, 'desligamentos'); }
  function beneficios() { return ler(CHAVES.beneficios, 'beneficios'); }
  function colaborador(id) { return colaboradores().find((pessoa) => pessoa.id === id) || null; }
  function recarregar() { cache = { colaboradores: null, promocoes: null, desligamentos: null, beneficios: null }; }

  function salvarColaboradores(lista) { return gravar(CHAVES.colaboradores, 'colaboradores', lista); }
  function salvarBeneficios(lista) { return gravar(CHAVES.beneficios, 'beneficios', lista); }

  function colaboradorDaSessao(sessao) {
    if (!sessao) return null;
    const lista = colaboradores();
    return lista.find((pessoa) => pessoa.email === sessao.email) || (sessao.role === 'user' ? colaborador('c-adriel') : colaborador('rh-nicole'));
  }

  /* Tempo */
  function mesesDeCasa(pessoa, ate = new Date()) {
    if (pessoa.hireDate) return Math.max(0, Helpers.monthsBetween(pessoa.hireDate, ate));
    return Math.max(0, (Number(pessoa.tenure) || 0) * 12 + (Number(pessoa.tenureMonths) || 0));
  }

  function mesesNoCargo(pessoa, ate = new Date()) {
    return Math.max(0, Helpers.monthsBetween(pessoa.cargoDesde || pessoa.hireDate, ate));
  }

  /* Mapeamento do cargo antigo (texto livre) para o plano atual */
  function chaveDoCargoLegado(pessoa) {
    const texto = Helpers.normalize(pessoa.role);
    const anos = (Number(pessoa.tenure) || 0) + (Number(pessoa.tenureMonths) || 0) / 12;
    const mulher = pessoa.gender === 'Feminino';
    if (/diretor/.test(texto)) return 'diretoria';
    if (/gerente|gerencia/.test(texto)) return 'gerencia';
    if (/coordena|supervis|lider/.test(texto)) {
      if (anos >= (mulher ? DEMO.anosMinimosGerenciaMulheres : DEMO.anosMinimosGerenciaHomens)) return 'gerencia';
      const minimo = mulher ? DEMO.anosMinimosLiderancaMulheres : DEMO.anosMinimosLiderancaHomens;
      if (anos >= minimo) return 'coordenacao';
      return anos >= 3 ? 'senior' : 'pleno';
    }
    if (/especialista/.test(texto)) return anos >= 2 ? 'especialista' : 'pleno';
    if (/estagi/.test(texto)) return 'estagiario';
    if (/assistente/.test(texto)) return anos < 1 ? 'estagiario' : 'junior';
    if (anos >= (mulher ? DEMO.anosParaSeniorMulheres : DEMO.anosParaSeniorHomens)) return 'senior';
    if (anos >= (mulher ? DEMO.anosParaPlenoMulheres : DEMO.anosParaPlenoHomens)) return 'pleno';
    return 'junior';
  }

  const CHAVES_PADRAO = ['estagiario', 'junior', 'pleno', 'senior', 'especialista', 'coordenacao', 'gerencia', 'diretoria'];

  function mapearCargo(pessoa) {
    const nome = Helpers.normalize(pessoa.role);
    const lista = Plano.cargosOrdenados();
    const igual = lista.find((cargo) => Helpers.normalize(cargo.nome) === nome);
    if (igual) return igual.id;
    const chave = chaveDoCargoLegado(pessoa);
    if (Plano.cargo(`cg-${chave}`)) return `cg-${chave}`;
    if (!lista.length) return null;
    const posicao = CHAVES_PADRAO.indexOf(chave) / (CHAVES_PADRAO.length - 1);
    return lista[Math.round(posicao * (lista.length - 1))].id;
  }

  /* Geração de histórico (determinística por colaborador) */
  function gerarPromocoes(pessoa, agora) {
    const rand = Helpers.rng(Helpers.hashString(`${pessoa.id}:promocoes`));
    const caminho = Plano.caminhoAte(pessoa.cargoId);
    const meses = Helpers.monthsBetween(pessoa.hireDate, agora);
    const fator = pessoa.gender === 'Feminino' ? DEMO.fatorTempoPromocaoMulheres : 1;
    const reserva = 2 + rand() * 3;

    // Etapas possíveis, de trás para a frente, enquanto couberem no tempo de casa.
    const possiveis = [];
    let total = 0;
    for (let i = caminho.length - 2; i >= 0; i -= 1) {
      const origem = Plano.cargo(caminho[i]);
      const duracao = Math.max(4, (origem.tempoMinimoNoCargoMeses || 12) * (1 + rand() * 0.6) * fator);
      if (total + duracao + reserva > meses) break;
      total += duracao;
      possiveis.push({ de: caminho[i], para: caminho[i + 1], duracao });
    }
    // Nem todos foram promovidos em todas as etapas: parte entrou já em um nível mais alto.
    const quantidade = Math.min(possiveis.length, Math.floor(Math.pow(rand(), DEMO.expoenteQuantidadePromocoes) * (possiveis.length + 1)));
    if (!quantidade) return { promocoes: [], cargoDesde: pessoa.hireDate };

    const etapas = possiveis.slice(0, quantidade).reverse();
    const usado = etapas.reduce((soma, etapa) => soma + etapa.duracao, 0);
    const ultima = reserva + rand() * Math.max(meses - usado - reserva, 0);
    const lista = [];
    let atras = ultima;
    for (let i = etapas.length - 1; i >= 0; i -= 1) {
      lista.unshift({
        id: `pr-${pessoa.id}-${i + 1}`,
        colaboradorId: pessoa.id,
        cargoOrigemId: etapas[i].de,
        cargoDestinoId: etapas[i].para,
        data: Helpers.toISO(Helpers.addMonths(agora, -atras)),
        setor: pessoa.sector
      });
      atras += etapas[i].duracao;
    }
    return { promocoes: lista, cargoDesde: lista[lista.length - 1].data };
  }

  function definirSalario(pessoa, agora) {
    const cargo = Plano.cargo(pessoa.cargoId);
    if (!cargo) return 0;
    const rand = Helpers.rng(Helpers.hashString(`${pessoa.id}:salario`));
    const base = cargo.tempoMinimoNoCargoMeses || 24;
    let posicao = (Math.min(1, mesesNoCargo(pessoa, agora) / (base * 3)) * 0.6 + rand() * 0.4) * 0.9;
    if (pessoa.gender === 'Feminino') posicao *= DEMO.posicaoSalarialMulheres;
    const bruto = (cargo.faixaSalarialMin + posicao * (cargo.faixaSalarialMax - cargo.faixaSalarialMin)) * (MULTIPLICADOR_SETOR[pessoa.sector] || 1);
    const limitado = Math.min(cargo.faixaSalarialMax, Math.max(cargo.faixaSalarialMin, bruto));
    return Math.round(limitado / 50) * 50;
  }

  function historicoSalarial(pessoa, listaPromocoes, agora) {
    const eventos = listaPromocoes
      .filter((promo) => promo.colaboradorId === pessoa.id)
      .map((promo) => ({ data: promo.data, percentual: 0.12, motivo: 'Promoção' }));
    for (let ano = 1; ano <= 3; ano += 1) {
      const data = Helpers.toISO(Helpers.addMonths(pessoa.hireDate, ano * 12));
      const proximaDaPromocao = eventos.some((evento) => Math.abs(Helpers.monthsBetween(evento.data, data)) < 2);
      if (Helpers.parseDate(data) <= agora && !proximaDaPromocao) eventos.push({ data, percentual: 0.05, motivo: 'Reajuste anual' });
    }
    eventos.sort((a, b) => a.data.localeCompare(b.data));
    let valor = pessoa.salary;
    const saida = [];
    for (let i = eventos.length - 1; i >= 0; i -= 1) {
      saida.unshift({ data: eventos[i].data, valor, motivo: eventos[i].motivo });
      valor = Math.round(valor / (1 + eventos[i].percentual) / 10) * 10;
    }
    saida.unshift({ data: pessoa.hireDate, valor, motivo: 'Admissão' });
    return saida;
  }

  function projetosDemonstracao(pessoa, agora) {
    const rand = Helpers.rng(Helpers.hashString(`${pessoa.id}:projetos`));
    const nomes = [...(PROJETOS_POR_SETOR[pessoa.sector] || PROJETOS_POR_SETOR.Operações)];
    const cargo = Plano.cargo(pessoa.cargoId);
    const papeis = cargo && cargo.tipo === 'lideranca' ? ['Líder do projeto', 'Patrocínio', 'Coordenação'] : ['Responsável', 'Colaborador', 'Apoio técnico'];
    const quantidade = 1 + Math.floor(rand() * 3);
    const meses = Helpers.monthsBetween(pessoa.hireDate, agora);
    if (meses < 2) return [];
    return nomes.slice(0, quantidade).map((nome, indice) => {
      const inicio = Math.min(meses - 0.5, 4 + rand() * 22);
      const concluido = indice > 0 || rand() < 0.5;
      const duracao = 3 + rand() * 7;
      const fim = concluido ? Math.max(0, inicio - duracao) : null;
      return {
        id: `pj-${pessoa.id}-${indice + 1}`,
        nome,
        papel: papeis[Math.floor(rand() * papeis.length)],
        inicio: Helpers.toISO(Helpers.addMonths(agora, -Math.max(inicio, 0.5))),
        fim: concluido ? Helpers.toISO(Helpers.addMonths(agora, -fim)) : null,
        status: concluido ? 'Concluído' : 'Em andamento',
        resultado: concluido ? RESULTADOS[Math.floor(rand() * RESULTADOS.length)] : 'Em andamento.'
      };
    });
  }

  function projetosFixos(lista, agora) {
    return lista.map((item, indice) => ({
      id: `pj-fixo-${indice + 1}`,
      nome: item.nome,
      papel: item.papel,
      inicio: Helpers.toISO(Helpers.addMonths(agora, -item.mesesInicio)),
      fim: item.mesesFim === null ? null : Helpers.toISO(Helpers.addMonths(agora, -item.mesesFim)),
      status: item.status,
      resultado: item.resultado
    }));
  }

  /* Migração: completa os campos que faltam em cada colaborador */
  function preencherBase(pessoa, agora) {
    const rand = Helpers.rng(Helpers.hashString(`${pessoa.id}:base`));
    if (!pessoa.hireDate) {
      const meses = (Number(pessoa.tenure) || 0) * 12 + (Number(pessoa.tenureMonths) || 0);
      const admissao = meses > 0
        ? Helpers.addMonths(agora, -meses)
        : Helpers.addMonths(agora, -(0.3 + rand() * 1.5));
      if (meses > 0) admissao.setDate(admissao.getDate() - Math.floor(rand() * 28));
      pessoa.hireDate = Helpers.toISO(admissao);
    }
    if (!Plano.cargo(pessoa.cargoId)) {
      const textoOriginal = pessoa.role;
      pessoa.cargoId = mapearCargo(pessoa);
      const cargo = Plano.cargo(pessoa.cargoId);
      if (cargo && Helpers.normalize(textoOriginal) !== Helpers.normalize(cargo.nome) && !pessoa.funcao) pessoa.funcao = textoOriginal;
      if (cargo) pessoa.role = cargo.nome;
    }
    if (!pessoa.contractType) {
      const cargo = Plano.cargo(pessoa.cargoId);
      if (cargo && /estagi/i.test(Helpers.normalize(cargo.nome))) pessoa.contractType = 'Estágio';
      else if (cargo && cargo.ordem >= 3 && cargo.tipo === 'operacional' && rand() < 0.14) pessoa.contractType = 'PJ';
      else pessoa.contractType = 'CLT';
    }
    if (!pessoa.contractStart) pessoa.contractStart = pessoa.hireDate;
    if (pessoa.contractEnd === undefined) {
      if (pessoa.contractType === 'Estágio') pessoa.contractEnd = Helpers.toISO(Helpers.addMonths(pessoa.hireDate, 12));
      else if (pessoa.contractType === 'PJ') {
        const anos = Math.max(1, Math.ceil(Helpers.monthsBetween(pessoa.hireDate, agora) / 12));
        pessoa.contractEnd = Helpers.toISO(Helpers.addMonths(pessoa.hireDate, anos * 12));
      } else pessoa.contractEnd = null;
    }
    if (pessoa.beneficiosIds === undefined) {
      if (pessoa.contractType === 'PJ') pessoa.beneficiosIds = [];
      else if (pessoa.contractType === 'Estágio') pessoa.beneficiosIds = ['bn-transporte', 'bn-educacao'];
      else pessoa.beneficiosIds = null;
    }
    const fixo = PERFIS_FIXOS[pessoa.id];
    if (fixo && fixo.email && !pessoa.email) pessoa.email = fixo.email;
    if (fixo && fixo.beneficiosIds && pessoa.contractType === 'CLT') pessoa.beneficiosIds = fixo.beneficiosIds;
  }

  function atribuirGestores(lista) {
    const porId = new Map(lista.map((pessoa) => [pessoa.id, pessoa]));
    const ordemDe = (pessoa) => (Plano.cargo(pessoa.cargoId) || { ordem: 0 }).ordem;
    const lideres = lista.filter((pessoa) => (Plano.cargo(pessoa.cargoId) || {}).tipo === 'lideranca');
    lista.forEach((pessoa) => {
      if (pessoa.managerId !== undefined) return;
      const acima = lideres.filter((lider) => lider.sector === pessoa.sector && ordemDe(lider) > ordemDe(pessoa));
      if (!acima.length) { pessoa.managerId = null; return; }
      const menor = Math.min(...acima.map(ordemDe));
      const candidatos = acima.filter((lider) => ordemDe(lider) === menor).sort((a, b) => a.id.localeCompare(b.id));
      pessoa.managerId = candidatos[Helpers.hashString(`${pessoa.id}:gestor`) % candidatos.length].id;
    });
    return porId;
  }

  function migrarLista(lista, agora) {
    const salvas = Storage.getItem(CHAVES.promocoes);
    const gerarHistorico = !Array.isArray(salvas);
    const listaPromocoes = gerarHistorico ? [] : salvas;
    const geradas = new Set();

    lista.forEach((pessoa) => preencherBase(pessoa, agora));
    if (gerarHistorico) {
      lista.forEach((pessoa) => {
        const historico = gerarPromocoes(pessoa, agora);
        listaPromocoes.push(...historico.promocoes);
        pessoa.cargoDesde = historico.cargoDesde;
        geradas.add(pessoa.id);
      });
    }
    lista.forEach((pessoa) => {
      if (!pessoa.cargoDesde) pessoa.cargoDesde = pessoa.hireDate;
      if (pessoa.salary === undefined) {
        const fixo = PERFIS_FIXOS[pessoa.id];
        pessoa.salary = fixo ? fixo.salary : definirSalario(pessoa, agora);
        pessoa.salaryHistory = historicoSalarial(pessoa, listaPromocoes, agora);
      }
    });
    atribuirGestores(lista);
    lista.forEach((pessoa) => {
      if (Array.isArray(pessoa.projects)) return;
      const fixo = PERFIS_FIXOS[pessoa.id];
      pessoa.projects = fixo ? projetosFixos(fixo.projects, agora) : projetosDemonstracao(pessoa, agora);
    });
    return { listaPromocoes, gerarHistorico };
  }

  function gerarDesligamentos(lista, agora) {
    const registros = [];
    SETORES_PADRAO.forEach((setor) => {
      ['Feminino', 'Masculino'].forEach((genero) => {
        const grupo = lista.filter((pessoa) => pessoa.sector === setor && pessoa.gender === genero);
        const taxa = (DEMO.taxaDesligamentoMulheres[setor] || 0.08) * (genero === 'Feminino' ? 1 : DEMO.fatorDesligamentoHomens);
        const rand = Helpers.rng(Helpers.hashString(`${setor}:${genero}:deslig`));
        [[0, 12, 1], [12, 24, 0.8]].forEach(([de, ate, peso]) => {
          const quantidade = Math.round(grupo.length * taxa * peso);
          for (let i = 0; i < quantidade; i += 1) {
            const cargo = grupo.length ? Plano.cargo(grupo[Math.floor(rand() * grupo.length)].cargoId) : null;
            registros.push({
              id: `dl-${setor}-${genero[0]}-${de}-${i + 1}`,
              gender: genero,
              sector: setor,
              cargoId: cargo ? cargo.id : null,
              data: Helpers.toISO(Helpers.addMonths(agora, -(de + 0.3 + rand() * (ate - de - 0.6))))
            });
          }
        });
      });
    });
    return registros;
  }

  /* Inicialização */
  function precisaMigrar(pessoa) {
    return !pessoa.cargoId || !pessoa.hireDate || pessoa.salary === undefined || pessoa.managerId === undefined || !Array.isArray(pessoa.projects);
  }

  function init() {
    Plano.get();
    const agora = new Date();
    const versao = Number(Storage.getItem(CHAVES.versao)) || 1;
    const salvos = Storage.getItem(CHAVES.colaboradores);
    let lista = Array.isArray(salvos) ? salvos : null;
    let alterou = false;

    if (!lista) {
      lista = sementesLegadas();
      Storage.removeItem(CHAVES.promocoes);
      Storage.removeItem(CHAVES.desligamentos);
      alterou = true;
    } else if (versao < VERSAO) {
      const ids = new Set(lista.map((pessoa) => pessoa.id));
      sementesLegadas().filter((semente) => !ids.has(semente.id)).forEach((semente) => lista.push(semente));
      lista.forEach((pessoa) => { if (pessoa.sector === 'Recursos Humanos') pessoa.sector = 'RH'; });
      alterou = true;
    }

    let promos = null;
    if (lista.some(precisaMigrar)) {
      const migracao = migrarLista(lista, agora);
      if (migracao.gerarHistorico) {
        promos = migracao.listaPromocoes;
        gravar(CHAVES.promocoes, 'promocoes', promos);
      }
      alterou = true;
    }
    if (alterou) gravar(CHAVES.colaboradores, 'colaboradores', lista);
    if (!promos) {
      const salvas = Storage.getItem(CHAVES.promocoes);
      promos = Array.isArray(salvas) ? salvas : [];
      if (!Array.isArray(salvas)) gravar(CHAVES.promocoes, 'promocoes', promos);
    }

    let saidas = Storage.getItem(CHAVES.desligamentos);
    if (!Array.isArray(saidas)) {
      saidas = gerarDesligamentos(lista, agora);
      gravar(CHAVES.desligamentos, 'desligamentos', saidas);
    }
    let listaBeneficios = Storage.getItem(CHAVES.beneficios);
    if (!Array.isArray(listaBeneficios)) {
      listaBeneficios = JSON.parse(JSON.stringify(BENEFICIOS_PADRAO));
      gravar(CHAVES.beneficios, 'beneficios', listaBeneficios);
    }
    if (versao < VERSAO) Storage.setItem(CHAVES.versao, VERSAO);

    // Mantém os dados em memória mesmo que o navegador bloqueie o armazenamento local.
    cache = { colaboradores: lista, promocoes: promos, desligamentos: saidas, beneficios: listaBeneficios };
  }

  /* Alterações de colaboradores */
  function gestoresPossiveis(pessoa) {
    const cargo = Plano.cargo(pessoa.cargoId);
    const ordem = cargo ? cargo.ordem : 0;
    return colaboradores()
      .filter((outro) => {
        const cargoOutro = Plano.cargo(outro.cargoId);
        return outro.id !== pessoa.id && outro.sector === pessoa.sector && cargoOutro && cargoOutro.ordem > ordem;
      })
      .sort((a, b) => Plano.cargo(b.cargoId).ordem - Plano.cargo(a.cargoId).ordem || a.name.localeCompare(b.name, 'pt-BR'));
  }

  function corrigirGestor(pessoa) {
    const gestor = pessoa.managerId ? colaborador(pessoa.managerId) : null;
    const ordemGestor = gestor && Plano.cargo(gestor.cargoId) ? Plano.cargo(gestor.cargoId).ordem : 0;
    const ordemPessoa = Plano.cargo(pessoa.cargoId) ? Plano.cargo(pessoa.cargoId).ordem : 0;
    if (gestor && ordemGestor > ordemPessoa) return;
    const candidatos = gestoresPossiveis(pessoa);
    if (!candidatos.length) { pessoa.managerId = null; return; }
    const menor = Math.min(...candidatos.map((item) => Plano.cargo(item.cargoId).ordem));
    const proximos = candidatos.filter((item) => Plano.cargo(item.cargoId).ordem === menor);
    pessoa.managerId = proximos[Helpers.hashString(`${pessoa.id}:gestor`) % proximos.length].id;
  }

  function adicionarColaborador(dados) {
    const cargo = Plano.cargo(dados.cargoId);
    if (!cargo) return { ok: false, erros: ['Escolha um cargo do plano de carreira.'] };
    const admissao = Helpers.toISO(Helpers.addMonths(new Date(), -Math.max(0, Number(dados.anosDeCasa) || 0) * 12));
    const salario = Number(dados.salario) > 0 ? Number(dados.salario) : cargo.faixaSalarialMin;
    const pessoa = {
      id: Helpers.uid('c'),
      name: dados.name,
      gender: dados.gender,
      sector: dados.sector,
      role: cargo.nome,
      cargoId: cargo.id,
      tenure: Math.max(0, Number(dados.anosDeCasa) || 0),
      hireDate: admissao,
      cargoDesde: admissao,
      salary: salario,
      salaryHistory: [{ data: admissao, valor: salario, motivo: 'Admissão' }],
      contractType: 'CLT',
      contractStart: admissao,
      contractEnd: null,
      beneficiosIds: null,
      managerId: null,
      projects: []
    };
    const lista = [...colaboradores(), pessoa];
    corrigirGestor(pessoa);
    if (!salvarColaboradores(lista)) return { ok: false, erros: ['Não foi possível salvar neste navegador. Verifique o espaço disponível e tente novamente.'] };
    return { ok: true, colaborador: pessoa };
  }

  function atualizarColaborador(id, alteracoes) {
    const lista = colaboradores().map((pessoa) => (pessoa.id === id ? { ...pessoa, ...alteracoes } : pessoa));
    if (!salvarColaboradores(lista)) return { ok: false, erros: ['Não foi possível salvar neste navegador.'] };
    return { ok: true, colaborador: colaborador(id) };
  }

  function adicionarProjeto(id, projeto) {
    const pessoa = colaborador(id);
    if (!pessoa) return { ok: false, erros: ['Colaborador não encontrado.'] };
    if (!projeto.nome) return { ok: false, erros: ['Informe o nome do projeto.'] };
    if (!Helpers.isValidDate(projeto.inicio)) return { ok: false, erros: ['Informe a data de início do projeto.'] };
    if (projeto.fim && Helpers.parseDate(projeto.fim) < Helpers.parseDate(projeto.inicio)) return { ok: false, erros: ['O fim do projeto não pode ser anterior ao início.'] };
    return atualizarColaborador(id, { projects: [...(pessoa.projects || []), { ...projeto, id: Helpers.uid('pj') }] });
  }

  function removerProjeto(id, projetoId) {
    const pessoa = colaborador(id);
    if (!pessoa) return { ok: false, erros: ['Colaborador não encontrado.'] };
    return atualizarColaborador(id, { projects: (pessoa.projects || []).filter((projeto) => projeto.id !== projetoId) });
  }

  function registrarPromocao({ colaboradorId, cargoDestinoId, data, novoSalario }) {
    const pessoa = colaborador(colaboradorId);
    const destino = Plano.cargo(cargoDestinoId);
    const erros = [];
    if (!pessoa) erros.push('Colaborador não encontrado.');
    if (!destino) erros.push('Escolha o cargo de destino.');
    if (pessoa && destino && destino.id === pessoa.cargoId) erros.push('O cargo de destino precisa ser diferente do cargo atual.');
    if (!Helpers.isValidDate(data)) erros.push('Informe a data da promoção.');
    if (pessoa && Helpers.isValidDate(data)) {
      if (Helpers.toISO(data) > Helpers.toISO(new Date())) erros.push('A data da promoção não pode estar no futuro.');
      if (Helpers.toISO(data) < Helpers.toISO(pessoa.cargoDesde || pessoa.hireDate)) erros.push('A data da promoção não pode ser anterior à entrada no cargo atual.');
    }
    const salario = novoSalario === '' || novoSalario === undefined || novoSalario === null ? null : Number(novoSalario);
    if (salario !== null && (!Number.isFinite(salario) || salario <= 0)) erros.push('Informe um salário válido ou deixe o campo em branco.');
    if (erros.length) return { ok: false, erros };

    const registro = {
      id: Helpers.uid('pr'),
      colaboradorId: pessoa.id,
      cargoOrigemId: pessoa.cargoId,
      cargoDestinoId: destino.id,
      data,
      setor: pessoa.sector
    };
    const anteriores = promocoes();
    if (!gravar(CHAVES.promocoes, 'promocoes', [...anteriores, registro])) return { ok: false, erros: ['Não foi possível salvar a promoção neste navegador.'] };

    const atualizada = { ...pessoa, cargoId: destino.id, role: destino.nome, cargoDesde: data };
    if (salario !== null) {
      atualizada.salary = salario;
      atualizada.salaryHistory = [...(pessoa.salaryHistory || []), { data, valor: salario, motivo: 'Promoção' }];
    }
    corrigirGestor(atualizada);
    const lista = colaboradores().map((item) => (item.id === pessoa.id ? atualizada : item));
    if (!salvarColaboradores(lista)) {
      gravar(CHAVES.promocoes, 'promocoes', anteriores);
      return { ok: false, erros: ['Não foi possível salvar o colaborador neste navegador.'] };
    }
    return { ok: true, promocao: registro, colaborador: atualizada };
  }

  function promocoesDe(colaboradorId) {
    return promocoes().filter((promo) => promo.colaboradorId === colaboradorId).sort((a, b) => a.data.localeCompare(b.data));
  }

  /* Alterações no plano refletidas nos dados */
  function migrarCargo(deId, paraId) {
    const destino = Plano.cargo(paraId);
    if (!destino) return false;
    const lista = colaboradores().map((pessoa) => (pessoa.cargoId === deId ? { ...pessoa, cargoId: paraId, role: destino.nome } : pessoa));
    const historico = promocoes().map((promo) => ({
      ...promo,
      cargoOrigemId: promo.cargoOrigemId === deId ? paraId : promo.cargoOrigemId,
      cargoDestinoId: promo.cargoDestinoId === deId ? paraId : promo.cargoDestinoId
    }));
    const anteriores = promocoes();
    if (!gravar(CHAVES.promocoes, 'promocoes', historico)) return false;
    if (!salvarColaboradores(lista)) {
      gravar(CHAVES.promocoes, 'promocoes', anteriores);
      return false;
    }
    return true;
  }

  // Após restaurar ou importar um plano: leva quem ficou em cargo inexistente para o cargo mais parecido.
  function reconciliarCargos() {
    let realocados = 0;
    const lista = colaboradores().map((pessoa) => {
      if (Plano.cargo(pessoa.cargoId)) return pessoa;
      const copia = { ...pessoa, cargoId: undefined, role: pessoa.funcao || pessoa.role };
      const novo = mapearCargo(copia);
      realocados += 1;
      return { ...pessoa, cargoId: novo, role: novo ? Plano.cargo(novo).nome : pessoa.role };
    });
    if (realocados) salvarColaboradores(lista);
    return realocados;
  }

  /* Consultas */
  function organograma(id) {
    const todos = colaboradores();
    const pessoa = todos.find((item) => item.id === id);
    if (!pessoa) return null;
    const ordenar = (lista) => lista.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const gestor = pessoa.managerId ? todos.find((item) => item.id === pessoa.managerId) || null : null;
    const superior = gestor && gestor.managerId ? todos.find((item) => item.id === gestor.managerId) || null : null;
    const pares = ordenar(todos.filter((item) => item.id !== pessoa.id && (gestor
      ? item.managerId === gestor.id
      : !item.managerId && item.sector === pessoa.sector)));
    const subordinados = ordenar(todos.filter((item) => item.managerId === pessoa.id));
    return { pessoa, gestor, superior, pares, subordinados };
  }

  function beneficiosDoColaborador(pessoa) {
    const todos = beneficios();
    if (pessoa.beneficiosIds === null || pessoa.beneficiosIds === undefined) return todos;
    return todos.filter((beneficio) => pessoa.beneficiosIds.includes(beneficio.id));
  }

  function setores() {
    return [...new Set(colaboradores().map((pessoa) => pessoa.sector).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  init();

  return {
    init, recarregar, DEMO,
    colaboradores, colaborador, colaboradorDaSessao, salvarColaboradores, adicionarColaborador, atualizarColaborador,
    adicionarProjeto, removerProjeto,
    promocoes, promocoesDe, registrarPromocao, desligamentos,
    beneficios, salvarBeneficios, beneficiosDoColaborador,
    migrarCargo, reconciliarCargos, organograma, gestoresPossiveis, setores,
    mesesDeCasa, mesesNoCargo
  };
})();
