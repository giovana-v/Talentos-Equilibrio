// Plano de carreira da empresa: trilhas e cargos editáveis, salvos em localStorage ("planoCarreira").
const Plano = (() => {
  const KEY = 'planoCarreira';
  const TIPOS = { operacional: 'Operacional', lideranca: 'Liderança' };
  let cache = null;

  function cargoPadrao(id, ordem, nome, tipo, faixa, tempoMinimo, requisitos, responsabilidades, beneficios, proximos) {
    return {
      id: `cg-${id}`,
      trilhaId: 'tr-geral',
      nome,
      ordem,
      tipo,
      faixaSalarialMin: faixa[0],
      faixaSalarialMax: faixa[1],
      tempoMinimoNoCargoMeses: tempoMinimo,
      requisitos: { competencias: requisitos[0], formacao: requisitos[1], experiencia: requisitos[2] },
      responsabilidades,
      beneficios,
      proximosCargosIds: proximos.map((next) => `cg-${next}`),
      ativo: true
    };
  }

  function planoPadrao() {
    return {
      versao: 1,
      trilhas: [{
        id: 'tr-geral',
        nome: 'Trilha geral',
        setor: 'Todos',
        descricao: 'Plano de carreira padrão, válido para todos os setores. Do estágio à diretoria, com uma bifurcação em Y após o nível Sênior.',
        ativa: true
      }],
      cargos: [
        cargoPadrao('estagiario', 1, 'Estagiário', 'operacional', [1800, 2600], 6,
          [['Vontade de aprender', 'Comunicação', 'Organização'], 'Cursando ensino superior', 'Não exigida'],
          ['Apoiar as rotinas da área', 'Registrar e organizar informações', 'Aprender com a equipe'],
          ['Bolsa-auxílio', 'Auxílio-transporte', 'Recesso remunerado'], ['junior']),
        cargoPadrao('junior', 2, 'Júnior', 'operacional', [3200, 4800], 18,
          [['Execução de tarefas com orientação', 'Domínio das ferramentas da área'], 'Ensino superior completo ou em andamento', 'Até 2 anos'],
          ['Executar tarefas definidas pela liderança', 'Registrar resultados', 'Buscar feedback com frequência'],
          ['Plano de saúde', 'Vale-refeição', 'Vale-transporte'], ['pleno']),
        cargoPadrao('pleno', 3, 'Pleno', 'operacional', [5000, 7800], 24,
          [['Autonomia na execução', 'Resolução de problemas', 'Trabalho em equipe'], 'Ensino superior completo', 'De 2 a 5 anos'],
          ['Conduzir entregas com autonomia', 'Apoiar a evolução de pessoas júnior', 'Propor melhorias nos processos'],
          ['Plano de saúde', 'Vale-refeição', 'Auxílio educação'], ['senior']),
        cargoPadrao('senior', 4, 'Sênior', 'operacional', [8000, 12000], 30,
          [['Visão de negócio', 'Mentoria', 'Tomada de decisão'], 'Ensino superior completo; pós-graduação desejável', 'Mais de 5 anos'],
          ['Liderar projetos complexos', 'Mentorar pessoas da equipe', 'Influenciar decisões técnicas e de negócio'],
          ['Plano de saúde', 'Participação nos resultados', 'Auxílio educação'], ['especialista', 'coordenacao']),
        cargoPadrao('especialista', 5, 'Especialista', 'operacional', [9000, 14000], 36,
          [['Referência técnica na área', 'Comunicação com públicos diversos', 'Pesquisa e inovação'], 'Pós-graduação ou certificações reconhecidas', 'Mais de 7 anos'],
          ['Definir padrões técnicos da área', 'Resolver problemas de alta complexidade', 'Apoiar a formação de especialistas'],
          ['Plano de saúde', 'Participação nos resultados', 'Auxílio educação'], []),
        cargoPadrao('coordenacao', 6, 'Coordenação', 'lideranca', [11000, 16000], 24,
          [['Gestão de pessoas', 'Planejamento', 'Comunicação e feedback'], 'Ensino superior completo; formação em liderança desejável', 'Experiência prévia como Sênior'],
          ['Coordenar a rotina e as entregas da equipe', 'Conduzir ciclos de feedback e desenvolvimento', 'Garantir metas e indicadores'],
          ['Plano de saúde', 'Participação nos resultados', 'Auxílio educação'], ['gerencia']),
        cargoPadrao('gerencia', 7, 'Gerência', 'lideranca', [15000, 22000], 36,
          [['Gestão estratégica', 'Gestão orçamentária', 'Liderança de lideranças'], 'Pós-graduação ou MBA desejável', 'Experiência prévia em coordenação'],
          ['Definir o planejamento da área', 'Responder pelos resultados e pelo orçamento', 'Formar e acompanhar novas lideranças'],
          ['Plano de saúde', 'Participação nos resultados', 'Seguro de vida'], ['diretoria']),
        cargoPadrao('diretoria', 8, 'Diretoria', 'lideranca', [22000, 38000], 0,
          [['Visão estratégica', 'Influência executiva', 'Cultura e propósito'], 'Pós-graduação ou MBA', 'Experiência prévia em gerência'],
          ['Definir a direção estratégica da empresa', 'Representar a área perante o conselho', 'Zelar pela cultura organizacional'],
          ['Plano de saúde', 'Participação nos resultados', 'Seguro de vida'], [])
      ]
    };
  }

  /* Normalização e leitura */
  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function normalizarCargo(cargo) {
    const requisitos = cargo.requisitos || {};
    return {
      id: String(cargo.id),
      trilhaId: String(cargo.trilhaId),
      nome: String(cargo.nome || '').trim(),
      ordem: toNumber(cargo.ordem),
      tipo: cargo.tipo === 'lideranca' ? 'lideranca' : 'operacional',
      faixaSalarialMin: toNumber(cargo.faixaSalarialMin),
      faixaSalarialMax: toNumber(cargo.faixaSalarialMax),
      tempoMinimoNoCargoMeses: Math.max(0, Math.round(toNumber(cargo.tempoMinimoNoCargoMeses))),
      requisitos: {
        competencias: Helpers.splitLines(requisitos.competencias),
        formacao: String(requisitos.formacao || '').trim(),
        experiencia: String(requisitos.experiencia || '').trim()
      },
      responsabilidades: Helpers.splitLines(cargo.responsabilidades),
      beneficios: Helpers.splitLines(cargo.beneficios),
      proximosCargosIds: Array.isArray(cargo.proximosCargosIds) ? [...new Set(cargo.proximosCargosIds.map(String))] : [],
      ativo: cargo.ativo !== false
    };
  }

  function normalizarTrilha(trilha) {
    return {
      id: String(trilha.id),
      nome: String(trilha.nome || '').trim(),
      setor: String(trilha.setor || 'Todos').trim() || 'Todos',
      descricao: String(trilha.descricao || '').trim(),
      ativa: trilha.ativa !== false
    };
  }

  function normalizar(plano) {
    return {
      versao: 1,
      trilhas: plano.trilhas.map(normalizarTrilha),
      cargos: plano.cargos.map(normalizarCargo)
    };
  }

  function carregar() {
    if (cache) return cache;
    const salvo = Storage.getItem(KEY);
    if (salvo && Array.isArray(salvo.trilhas) && Array.isArray(salvo.cargos)) {
      cache = normalizar(salvo);
    } else {
      cache = planoPadrao();
      Storage.setItem(KEY, cache);
    }
    return cache;
  }

  function clonar() {
    return JSON.parse(JSON.stringify(carregar()));
  }

  function persistir(draft) {
    if (!Storage.setItem(KEY, draft)) return false;
    cache = draft;
    return true;
  }

  const porOrdem = (a, b) => a.ordem - b.ordem;

  function trilhas() { return carregar().trilhas; }
  function cargos() { return carregar().cargos; }
  function trilha(id) { return trilhas().find((item) => item.id === id) || null; }
  function cargo(id) { return cargos().find((item) => item.id === id) || null; }

  function cargosDaTrilha(trilhaId, plano = carregar()) {
    return plano.cargos.filter((item) => item.trilhaId === trilhaId).sort(porOrdem);
  }

  function cargosOrdenados() {
    const ordemTrilha = new Map(trilhas().map((item, index) => [item.id, index]));
    return [...cargos()].sort((a, b) => (ordemTrilha.get(a.trilhaId) - ordemTrilha.get(b.trilhaId)) || porOrdem(a, b));
  }

  function proximos(cargoId) {
    const atual = cargo(cargoId);
    if (!atual) return [];
    return atual.proximosCargosIds.map(cargo).filter(Boolean).sort(porOrdem);
  }

  function anteriores(cargoId) {
    return cargos().filter((item) => item.proximosCargosIds.includes(cargoId)).sort(porOrdem);
  }

  // Caminho (ids) da entrada da trilha até o cargo, seguindo o predecessor mais próximo.
  function caminhoAte(cargoId) {
    const caminho = [cargoId];
    const visto = new Set(caminho);
    let atual = cargoId;
    for (;;) {
      const anterior = anteriores(atual).filter((item) => !visto.has(item.id)).pop();
      if (!anterior) break;
      caminho.unshift(anterior.id);
      visto.add(anterior.id);
      atual = anterior.id;
    }
    return caminho;
  }

  function rotulo(cargoOuId) {
    const item = typeof cargoOuId === 'string' ? cargo(cargoOuId) : cargoOuId;
    if (!item) return 'Cargo removido';
    const varias = trilhas().length > 1;
    const origem = varias ? trilha(item.trilhaId) : null;
    return origem ? `${item.nome} (${origem.nome})` : item.nome;
  }

  /* Validações */
  function temCiclo(listaCargos) {
    const arestas = new Map(listaCargos.map((item) => [item.id, item.proximosCargosIds]));
    const estado = new Map();
    function visitar(id) {
      if (estado.get(id) === 'fim') return false;
      if (estado.get(id) === 'visitando') return true;
      estado.set(id, 'visitando');
      for (const next of arestas.get(id) || []) {
        if (arestas.has(next) && visitar(next)) return true;
      }
      estado.set(id, 'fim');
      return false;
    }
    return listaCargos.some((item) => visitar(item.id));
  }

  function validarCargo(dados, plano = carregar()) {
    const erros = [];
    if (!dados.nome) erros.push('Informe o nome do cargo.');
    if (!plano.trilhas.some((item) => item.id === dados.trilhaId)) erros.push('Escolha uma trilha válida.');
    if (!Number.isFinite(dados.faixaSalarialMin) || dados.faixaSalarialMin < 0) erros.push('A faixa salarial mínima deve ser um valor válido.');
    if (!Number.isFinite(dados.faixaSalarialMax) || dados.faixaSalarialMax < 0) erros.push('A faixa salarial máxima deve ser um valor válido.');
    if (dados.faixaSalarialMin > dados.faixaSalarialMax) erros.push('A faixa salarial mínima não pode ser maior que a máxima.');
    if (dados.tempoMinimoNoCargoMeses < 0) erros.push('O tempo mínimo no cargo não pode ser negativo.');
    dados.proximosCargosIds.forEach((id) => {
      if (id === dados.id) erros.push('Um cargo não pode ser o próximo de si mesmo.');
      else if (!plano.cargos.some((item) => item.id === id)) erros.push('Um dos próximos cargos não existe mais.');
    });
    const outros = plano.cargos.filter((item) => item.id !== dados.id);
    if (!erros.length && temCiclo([...outros, dados])) erros.push('Os próximos cargos formam um ciclo. Remova a ligação que volta a um cargo anterior.');
    return erros;
  }

  function validarPlano(bruto) {
    if (!bruto || !Array.isArray(bruto.trilhas) || !Array.isArray(bruto.cargos)) {
      return ['O arquivo não tem o formato de um plano de carreira (esperado: trilhas e cargos).'];
    }
    if (!bruto.trilhas.length) return ['O plano precisa ter pelo menos uma trilha.'];
    const plano = normalizar(bruto);
    const erros = [];
    const idsTrilhas = new Set();
    plano.trilhas.forEach((item) => {
      if (!item.id || idsTrilhas.has(item.id)) erros.push(`Trilha com identificador repetido ou vazio: "${item.nome}".`);
      idsTrilhas.add(item.id);
      if (!item.nome) erros.push('Há uma trilha sem nome.');
    });
    const idsCargos = new Set();
    plano.cargos.forEach((item) => {
      if (!item.id || idsCargos.has(item.id)) erros.push(`Cargo com identificador repetido ou vazio: "${item.nome}".`);
      idsCargos.add(item.id);
    });
    plano.cargos.forEach((item) => {
      validarCargo(item, plano).forEach((erro) => erros.push(`${item.nome || item.id}: ${erro}`));
    });
    return [...new Set(erros)];
  }

  /* Uso por colaboradores e histórico (necessário para bloquear exclusões) */
  function usoDoCargo(id) {
    return {
      pessoas: Dados.colaboradores().filter((pessoa) => pessoa.cargoId === id).length,
      promocoes: Dados.promocoes().filter((promo) => promo.cargoOrigemId === id || promo.cargoDestinoId === id).length
    };
  }

  /* Cargos */
  function renumerar(draft, trilhaId) {
    cargosDaTrilha(trilhaId, draft).forEach((item, index) => { item.ordem = index + 1; });
  }

  function falha(erros) {
    return { ok: false, erros: Array.isArray(erros) ? erros : [erros] };
  }

  function salvarCargo(dados) {
    const draft = clonar();
    const existente = dados.id ? draft.cargos.find((item) => item.id === dados.id) : null;
    const candidato = normalizarCargo({ ...(existente || {}), ...dados, id: existente ? existente.id : Helpers.uid('cg') });
    const mudouTrilha = !existente || existente.trilhaId !== candidato.trilhaId;
    if (mudouTrilha) candidato.ordem = cargosDaTrilha(candidato.trilhaId, draft).length + 1;
    const erros = validarCargo(candidato, draft);
    if (erros.length) return falha(erros);
    if (existente) Object.assign(existente, candidato);
    else draft.cargos.push(candidato);
    if (existente && mudouTrilha) renumerar(draft, existente.trilhaId);
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true, cargo: cargo(candidato.id) };
  }

  function duplicarCargo(id) {
    const draft = clonar();
    const original = draft.cargos.find((item) => item.id === id);
    if (!original) return falha('Cargo não encontrado.');
    const copia = { ...JSON.parse(JSON.stringify(original)), id: Helpers.uid('cg'), nome: `${original.nome} (cópia)` };
    copia.ordem = cargosDaTrilha(original.trilhaId, draft).length + 1;
    draft.cargos.push(copia);
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true, cargo: cargo(copia.id) };
  }

  function moverCargo(id, direcao) {
    const draft = clonar();
    const atual = draft.cargos.find((item) => item.id === id);
    if (!atual) return falha('Cargo não encontrado.');
    const lista = cargosDaTrilha(atual.trilhaId, draft);
    const indice = lista.findIndex((item) => item.id === id);
    const alvo = lista[indice + direcao];
    if (!alvo) return { ok: true, movido: false };
    [lista[indice], lista[indice + direcao]] = [alvo, atual];
    lista.forEach((item, index) => { item.ordem = index + 1; });
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true, movido: true };
  }

  function arquivarCargo(id, arquivar = true) {
    const draft = clonar();
    const alvo = draft.cargos.find((item) => item.id === id);
    if (!alvo) return falha('Cargo não encontrado.');
    alvo.ativo = !arquivar;
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true };
  }

  function removerReferencias(draft, ids) {
    draft.cargos.forEach((item) => {
      item.proximosCargosIds = item.proximosCargosIds.filter((next) => !ids.includes(next));
    });
  }

  function excluirCargo(id, migrarParaId) {
    const draft = clonar();
    const alvo = draft.cargos.find((item) => item.id === id);
    if (!alvo) return falha('Cargo não encontrado.');
    const uso = usoDoCargo(id);
    if ((uso.pessoas || uso.promocoes) && !migrarParaId) {
      return { ok: false, bloqueado: true, uso, erros: [`Este cargo tem ${Helpers.plural(uso.pessoas, 'colaborador', 'colaboradores')} e ${Helpers.plural(uso.promocoes, 'registro de promoção', 'registros de promoção')}. Escolha outro cargo para migrá-los antes de excluir.`] };
    }
    if (migrarParaId && (migrarParaId === id || !draft.cargos.some((item) => item.id === migrarParaId))) {
      return falha('Escolha um cargo de destino válido para a migração.');
    }
    draft.cargos = draft.cargos.filter((item) => item.id !== id);
    removerReferencias(draft, [id]);
    renumerar(draft, alvo.trilhaId);
    if (migrarParaId && !Dados.migrarCargo(id, migrarParaId)) return falha('Não foi possível migrar os colaboradores neste navegador.');
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true, migrados: uso.pessoas };
  }

  /* Trilhas */
  function salvarTrilha(dados) {
    const draft = clonar();
    const existente = dados.id ? draft.trilhas.find((item) => item.id === dados.id) : null;
    const candidata = normalizarTrilha({ ...(existente || {}), ...dados, id: existente ? existente.id : Helpers.uid('tr') });
    if (!candidata.nome) return falha('Informe o nome da trilha.');
    if (existente) Object.assign(existente, candidata);
    else draft.trilhas.push(candidata);
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true, trilha: trilha(candidata.id) };
  }

  function duplicarTrilha(id) {
    const draft = clonar();
    const original = draft.trilhas.find((item) => item.id === id);
    if (!original) return falha('Trilha não encontrada.');
    const novaId = Helpers.uid('tr');
    draft.trilhas.push({ ...original, id: novaId, nome: `${original.nome} (cópia)` });
    const mapa = new Map();
    const originais = cargosDaTrilha(id, draft);
    originais.forEach((item) => mapa.set(item.id, Helpers.uid('cg')));
    originais.forEach((item) => {
      draft.cargos.push({
        ...JSON.parse(JSON.stringify(item)),
        id: mapa.get(item.id),
        trilhaId: novaId,
        proximosCargosIds: item.proximosCargosIds.map((next) => mapa.get(next) || next)
      });
    });
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true, trilha: trilha(novaId) };
  }

  function moverTrilha(id, direcao) {
    const draft = clonar();
    const indice = draft.trilhas.findIndex((item) => item.id === id);
    if (indice < 0) return falha('Trilha não encontrada.');
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= draft.trilhas.length) return { ok: true, movido: false };
    [draft.trilhas[indice], draft.trilhas[alvo]] = [draft.trilhas[alvo], draft.trilhas[indice]];
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true, movido: true };
  }

  function arquivarTrilha(id, arquivar = true) {
    const draft = clonar();
    const alvo = draft.trilhas.find((item) => item.id === id);
    if (!alvo) return falha('Trilha não encontrada.');
    alvo.ativa = !arquivar;
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true };
  }

  function excluirTrilha(id) {
    const draft = clonar();
    if (!draft.trilhas.some((item) => item.id === id)) return falha('Trilha não encontrada.');
    if (draft.trilhas.length === 1) return falha('O plano precisa ter pelo menos uma trilha. Crie outra antes de excluir esta.');
    const ids = cargosDaTrilha(id, draft).map((item) => item.id);
    const emUso = ids.filter((cargoId) => {
      const uso = usoDoCargo(cargoId);
      return uso.pessoas || uso.promocoes;
    });
    if (emUso.length) {
      return { ok: false, bloqueado: true, erros: ['Há colaboradores ou promoções ligados aos cargos desta trilha. Migre-os para outra trilha (excluindo cada cargo com migração) ou arquive a trilha.'] };
    }
    draft.trilhas = draft.trilhas.filter((item) => item.id !== id);
    draft.cargos = draft.cargos.filter((item) => item.trilhaId !== id);
    removerReferencias(draft, ids);
    if (!persistir(draft)) return falha('Não foi possível salvar o plano neste navegador.');
    return { ok: true };
  }

  /* Modelo padrão, exportação e importação */
  function restaurarPadrao() {
    if (!persistir(planoPadrao())) return falha('Não foi possível salvar o plano neste navegador.');
    const realocados = Dados.reconciliarCargos();
    return { ok: true, realocados };
  }

  function exportar() {
    return clonar();
  }

  function importar(bruto) {
    const erros = validarPlano(bruto);
    if (erros.length) return falha(erros);
    if (!persistir(normalizar(bruto))) return falha('Não foi possível salvar o plano neste navegador.');
    const realocados = Dados.reconciliarCargos();
    return { ok: true, realocados };
  }

  return {
    TIPOS, get: carregar, trilhas, cargos, trilha, cargo, cargosDaTrilha, cargosOrdenados, proximos, anteriores, caminhoAte, rotulo,
    validarCargo, validarPlano, usoDoCargo,
    salvarCargo, duplicarCargo, moverCargo, arquivarCargo, excluirCargo,
    salvarTrilha, duplicarTrilha, moverTrilha, arquivarTrilha, excluirTrilha,
    restaurarPadrao, exportar, importar, planoPadrao
  };
})();
