// Indicadores calculados a partir dos colaboradores, do plano de carreira e das promoções.
// Todas as telas (dashboard, relatórios, visão geral, mapa de promoções) usam estas funções.
const Analytics = (() => {
  const MIN_AMOSTRA = 3;
  const FEMININO = 'Feminino';
  const MASCULINO = 'Masculino';

  /* Períodos */
  function janela(valor = 'ultimos12', agora = new Date()) {
    const ano = /^\d{4}$/.test(valor) ? Number(valor) : null;
    const inicio = ano ? new Date(ano, 0, 1, 0, 0, 0) : new Date(agora.getFullYear(), agora.getMonth() - 11, 1, 0, 0, 0);
    const fim = ano ? new Date(ano, 11, 31, 23, 59, 59) : new Date(agora.getTime());
    const meses = Array.from({ length: 12 }, (_, indice) => {
      const data = new Date(inicio.getFullYear(), inicio.getMonth() + indice, 1);
      return {
        ano: data.getFullYear(),
        mes: data.getMonth(),
        chave: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`,
        rotulo: `${Helpers.MESES_CURTOS[data.getMonth()]}/${data.getFullYear()}`,
        rotuloLongo: Helpers.formatMonthYear(data, true)
      };
    });
    return {
      valor: ano ? String(ano) : 'ultimos12',
      rotulo: ano ? String(ano) : 'Últimos 12 meses',
      inicio,
      fim,
      meses,
      anterior: () => ({ inicio: Helpers.addMonths(inicio, -12), fim: Helpers.addMonths(fim, -12) })
    };
  }

  function opcoesDePeriodo() {
    const anos = new Set([new Date().getFullYear()]);
    Dados.promocoes().forEach((promo) => anos.add(Number(promo.data.slice(0, 4))));
    return [
      { valor: 'ultimos12', rotulo: 'Últimos 12 meses' },
      ...[...anos].sort((a, b) => b - a).map((ano) => ({ valor: String(ano), rotulo: String(ano) }))
    ];
  }

  function dentro(dataISO, periodo) {
    return dataISO >= Helpers.toISO(periodo.inicio) && dataISO <= Helpers.toISO(periodo.fim);
  }

  /* Pessoas */
  function pessoas(filtros = {}) {
    const agora = new Date();
    return Dados.colaboradores()
      .map((pessoa) => {
        const cargo = Plano.cargo(pessoa.cargoId);
        return {
          ...pessoa,
          cargo,
          cargoNome: cargo ? cargo.nome : 'Sem cargo',
          ordem: cargo ? cargo.ordem : 0,
          tipo: cargo ? cargo.tipo : 'operacional',
          mesesCasa: Dados.mesesDeCasa(pessoa, agora),
          mesesNoCargo: Dados.mesesNoCargo(pessoa, agora)
        };
      })
      .filter((pessoa) => (!filtros.setor || pessoa.sector === filtros.setor)
        && (!filtros.cargoId || pessoa.cargoId === filtros.cargoId)
        && (!filtros.tipo || pessoa.tipo === filtros.tipo));
  }

  const mulheres = (lista) => lista.filter((pessoa) => pessoa.gender === FEMININO);
  const homens = (lista) => lista.filter((pessoa) => pessoa.gender === MASCULINO);

  function estatisticas(lista) {
    const n = lista.length;
    const pequena = n < MIN_AMOSTRA;
    const salarios = lista.map((pessoa) => pessoa.salary).filter((valor) => valor > 0);
    return {
      n,
      pequena,
      tempoCasaMeses: pequena ? null : Helpers.mean(lista.map((pessoa) => pessoa.mesesCasa)),
      tempoNoCargoMeses: pequena ? null : Helpers.mean(lista.map((pessoa) => pessoa.mesesNoCargo)),
      salarioMedio: pequena || !salarios.length ? null : Helpers.mean(salarios),
      salarioMediana: pequena || !salarios.length ? null : Helpers.median(salarios)
    };
  }

  function diferenca(mulher, homem) {
    if (mulher === null || homem === null || !homem) return null;
    return ((mulher - homem) / homem) * 100;
  }

  /* Visão geral: níveis do plano × gênero */
  function niveis(filtros = {}) {
    const lista = pessoas(filtros);
    const filtrado = Boolean(filtros.setor || filtros.cargoId || filtros.tipo);
    const totalF = mulheres(lista).length;
    const totalM = homens(lista).length;
    const linhas = Plano.cargosOrdenados()
      .filter((cargo) => (!filtros.cargoId || cargo.id === filtros.cargoId) && (!filtros.tipo || cargo.tipo === filtros.tipo))
      .map((cargo) => {
        const doCargo = lista.filter((pessoa) => pessoa.cargoId === cargo.id);
        return { cargo, nome: Plano.rotulo(cargo), lista: doCargo };
      })
      .filter((linha) => linha.lista.length || (!filtrado && linha.cargo.ativo));
    const semCargo = lista.filter((pessoa) => !pessoa.cargo);
    if (semCargo.length) linhas.push({ cargo: null, nome: 'Sem cargo', lista: semCargo });

    return linhas.map((linha) => {
      const F = estatisticas(mulheres(linha.lista));
      const M = estatisticas(homens(linha.lista));
      const total = linha.lista.length;
      return {
        cargo: linha.cargo,
        nome: linha.nome,
        total,
        F,
        M,
        pctDoGeneroF: totalF ? (F.n / totalF) * 100 : null,
        pctDoGeneroM: totalM ? (M.n / totalM) * 100 : null,
        pctMulheresNoNivel: total >= MIN_AMOSTRA ? (F.n / total) * 100 : null,
        difSalarioMedio: diferenca(F.salarioMedio, M.salarioMedio),
        difSalarioMediana: diferenca(F.salarioMediana, M.salarioMediana)
      };
    });
  }

  function resumo(filtros = {}) {
    const lista = pessoas(filtros);
    const F = mulheres(lista);
    const M = homens(lista);
    const lideres = lista.filter((pessoa) => pessoa.tipo === 'lideranca');
    const salarioF = estatisticas(F);
    const salarioM = estatisticas(M);
    return {
      total: lista.length,
      mulheres: F.length,
      homens: M.length,
      outros: lista.length - F.length - M.length,
      pctMulheres: lista.length ? (F.length / lista.length) * 100 : null,
      lideres: lideres.length,
      lideresMulheres: mulheres(lideres).length,
      pctMulheresNaLideranca: lideres.length ? (mulheres(lideres).length / lideres.length) * 100 : null,
      salarioMedio: { F: salarioF.salarioMedio, M: salarioM.salarioMedio, dif: diferenca(salarioF.salarioMedio, salarioM.salarioMedio) },
      salarioMediana: { F: salarioF.salarioMediana, M: salarioM.salarioMediana, dif: diferenca(salarioF.salarioMediana, salarioM.salarioMediana) }
    };
  }

  /* Tempo até a promoção (a partir do registro de promoções) */
  function intervalosDePromocao(ids) {
    const porPessoa = new Map();
    Dados.promocoes()
      .filter((promo) => ids.has(promo.colaboradorId))
      .sort((a, b) => a.data.localeCompare(b.data))
      .forEach((promo) => {
        if (!porPessoa.has(promo.colaboradorId)) porPessoa.set(promo.colaboradorId, []);
        porPessoa.get(promo.colaboradorId).push(promo);
      });
    const intervalos = [];
    porPessoa.forEach((lista, id) => {
      const pessoa = Dados.colaborador(id);
      if (!pessoa) return;
      let anterior = pessoa.hireDate;
      lista.forEach((promo) => {
        intervalos.push({ genero: pessoa.gender, cargoOrigemId: promo.cargoOrigemId, meses: Math.max(0, Helpers.monthsBetween(anterior, promo.data)) });
        anterior = promo.data;
      });
    });
    return intervalos;
  }

  function resumoIntervalos(lista) {
    return { n: lista.length, pequena: lista.length < MIN_AMOSTRA, mediaMeses: lista.length < MIN_AMOSTRA ? null : Helpers.mean(lista.map((item) => item.meses)) };
  }

  function tempoAtePromocao(filtros = {}) {
    const ids = new Set(pessoas(filtros).map((pessoa) => pessoa.id));
    const intervalos = intervalosDePromocao(ids);
    const doGenero = (genero, lista) => lista.filter((item) => item.genero === genero);
    const porCargo = Plano.cargosOrdenados()
      .map((cargo) => {
        const lista = intervalos.filter((item) => item.cargoOrigemId === cargo.id);
        return { cargo, nome: Plano.rotulo(cargo), F: resumoIntervalos(doGenero(FEMININO, lista)), M: resumoIntervalos(doGenero(MASCULINO, lista)), total: lista.length };
      })
      .filter((linha) => linha.total);
    const F = resumoIntervalos(doGenero(FEMININO, intervalos));
    const M = resumoIntervalos(doGenero(MASCULINO, intervalos));
    return { F, M, porCargo, diferencaMeses: F.mediaMeses !== null && M.mediaMeses !== null ? F.mediaMeses - M.mediaMeses : null };
  }

  /* Funil e uso do plano */
  function funil(filtros = {}) {
    const linhas = niveis(filtros).map((linha) => ({ nome: linha.nome, mulheres: linha.F.n, homens: linha.M.n, total: linha.total }));
    return { linhas, maximo: Math.max(1, ...linhas.map((linha) => linha.total)) };
  }

  function gargalos() {
    const lista = pessoas();
    return Plano.cargosOrdenados()
      .filter((cargo) => cargo.tempoMinimoNoCargoMeses > 0 && cargo.proximosCargosIds.length)
      .map((cargo) => {
        const doCargo = lista.filter((pessoa) => pessoa.cargoId === cargo.id);
        if (doCargo.length < MIN_AMOSTRA) return null;
        const media = Helpers.mean(doCargo.map((pessoa) => pessoa.mesesNoCargo));
        const elegiveis = doCargo.filter((pessoa) => pessoa.mesesNoCargo >= cargo.tempoMinimoNoCargoMeses).length;
        return {
          cargo,
          nome: Plano.rotulo(cargo),
          pessoas: doCargo.length,
          mediaMeses: media,
          minimoMeses: cargo.tempoMinimoNoCargoMeses,
          razao: media / cargo.tempoMinimoNoCargoMeses,
          elegiveis,
          pctElegiveis: (elegiveis / doCargo.length) * 100
        };
      })
      .filter((item) => item && item.razao > 1)
      .sort((a, b) => b.razao - a.razao);
  }

  /* Taxas de promoção e desistência */
  function quadroEm(genero, ate) {
    const limite = Helpers.toISO(ate);
    return Dados.colaboradores().filter((pessoa) => pessoa.gender === genero && pessoa.hireDate <= limite).length;
  }

  function taxasNaJanela(periodo, setor) {
    const fim = periodo.fim > new Date() ? new Date() : periodo.fim;
    const promos = Dados.promocoes().filter((promo) => dentro(promo.data, periodo) && (!setor || promo.setor === setor));
    const saidas = Dados.desligamentos().filter((saida) => dentro(saida.data, periodo) && (!setor || saida.sector === setor));
    const resultado = {};
    [FEMININO, MASCULINO].forEach((genero) => {
      const quadro = Dados.colaboradores().filter((pessoa) => pessoa.gender === genero && pessoa.hireDate <= Helpers.toISO(fim) && (!setor || pessoa.sector === setor)).length;
      const promovidos = new Set(promos.filter((promo) => (Dados.colaborador(promo.colaboradorId) || {}).gender === genero).map((promo) => promo.colaboradorId)).size;
      const desligados = saidas.filter((saida) => saida.gender === genero).length;
      resultado[genero === FEMININO ? 'F' : 'M'] = {
        quadro,
        promovidos,
        desligados,
        promocao: quadro ? (promovidos / quadro) * 100 : null,
        desistencia: quadro + desligados ? (desligados / (quadro + desligados)) * 100 : null
      };
    });
    return resultado;
  }

  function taxas(periodoValor = 'ultimos12', setor = '') {
    const periodo = janela(periodoValor);
    const atual = taxasNaJanela(periodo, setor);
    const anterior = taxasNaJanela(periodo.anterior(), setor);
    const variacao = (chave, genero) => (atual[genero][chave] !== null && anterior[genero][chave] !== null ? atual[genero][chave] - anterior[genero][chave] : null);
    return {
      periodo,
      atual,
      anterior,
      variacao: {
        promocaoF: variacao('promocao', 'F'),
        desistenciaF: variacao('desistencia', 'F')
      }
    };
  }

  /* Setores */
  function indicadoresPorSetor(periodoValor = 'ultimos12') {
    const periodo = janela(periodoValor);
    return Dados.setores().map((setor) => {
      const lista = pessoas({ setor });
      const F = mulheres(lista);
      const lideres = lista.filter((pessoa) => pessoa.tipo === 'lideranca');
      const lideresF = mulheres(lideres);
      const taxa = taxasNaJanela(periodo, setor).F;
      return {
        setor,
        total: lista.length,
        mulheres: F.length,
        pctMulheresQuadro: lista.length >= MIN_AMOSTRA ? (F.length / lista.length) * 100 : null,
        lideres: lideres.length,
        pctMulheresLideranca: lideres.length >= MIN_AMOSTRA ? (lideresF.length / lideres.length) * 100 : null,
        lacunaLideranca: lista.length >= MIN_AMOSTRA && lideres.length >= MIN_AMOSTRA ? (F.length / lista.length - lideresF.length / lideres.length) * 100 : null,
        desistenciaF: taxa.quadro >= MIN_AMOSTRA ? taxa.desistencia : null
      };
    });
  }

  function setoresComMaiorDiferenca(limite = 3) {
    return indicadoresPorSetor()
      .filter((item) => item.lacunaLideranca !== null && item.lacunaLideranca > 0)
      .sort((a, b) => b.lacunaLideranca - a.lacunaLideranca)
      .slice(0, limite);
  }

  /* Mapa mensal de promoções */
  function mapaPromocoes({ periodo = 'ultimos12', setor = '' } = {}) {
    const janelaAtual = janela(periodo);
    const itens = Dados.promocoes()
      .filter((promo) => dentro(promo.data, janelaAtual) && (!setor || promo.setor === setor))
      .map((promo) => {
        const pessoa = Dados.colaborador(promo.colaboradorId);
        const destino = Plano.cargo(promo.cargoDestinoId);
        return {
          ...promo,
          pessoa,
          nome: pessoa ? pessoa.name : 'Colaborador removido',
          genero: pessoa ? pessoa.gender : '',
          origemNome: Plano.cargo(promo.cargoOrigemId) ? Plano.cargo(promo.cargoOrigemId).nome : 'Cargo removido',
          destinoNome: destino ? destino.nome : 'Cargo removido',
          tipoDestino: destino ? destino.tipo : 'operacional'
        };
      })
      .sort((a, b) => a.data.localeCompare(b.data));

    const categorias = [
      { chave: 'total', rotulo: 'Total', corresponde: () => true },
      { chave: 'F', rotulo: 'Mulheres', corresponde: (item) => item.genero === FEMININO },
      { chave: 'M', rotulo: 'Homens', corresponde: (item) => item.genero === MASCULINO },
      { chave: 'lideranca', rotulo: 'Para liderança', corresponde: (item) => item.tipoDestino === 'lideranca' },
      { chave: 'operacional', rotulo: 'Para operacional', corresponde: (item) => item.tipoDestino === 'operacional' }
    ];
    const linhas = categorias.map((categoria) => {
      const celulas = janelaAtual.meses.map((mes) => {
        const doMes = itens.filter((item) => item.data.slice(0, 7) === mes.chave && categoria.corresponde(item));
        return { mes, n: doMes.length, itens: doMes };
      });
      return {
        chave: categoria.chave,
        rotulo: categoria.rotulo,
        celulas,
        maximo: Math.max(0, ...celulas.map((celula) => celula.n)),
        total: celulas.reduce((soma, celula) => soma + celula.n, 0)
      };
    });
    return { janela: janelaAtual, setor, linhas, total: itens.length };
  }

  /* Descobertas textuais calculadas a partir dos dados */
  function descobertas(periodoValor = 'ultimos12') {
    const lista = [];
    const porSetor = indicadoresPorSetor(periodoValor).filter((item) => item.desistenciaF !== null);
    if (porSetor.length) {
      const maior = [...porSetor].sort((a, b) => b.desistenciaF - a.desistenciaF)[0];
      lista.push({ icone: 'chart', titulo: `Maior desistência no setor de ${maior.setor}`, texto: `${Helpers.formatPercent(maior.desistenciaF)} das mulheres deixaram a empresa no período.` });
    }
    const geral = resumo();
    if (geral.pctMulheresNaLideranca !== null) {
      lista.push({
        icone: 'user',
        titulo: 'Representatividade feminina na liderança',
        texto: `Mulheres ocupam ${Helpers.formatPercent(geral.pctMulheresNaLideranca)} dos cargos de liderança e são ${Helpers.formatPercent(geral.pctMulheres)} do quadro.`
      });
    }
    const tempo = tempoAtePromocao();
    if (tempo.diferencaMeses !== null) {
      const maisLento = tempo.diferencaMeses > 0;
      lista.push({
        icone: 'clock',
        titulo: maisLento ? 'Promoção leva mais tempo' : 'Promoção não é mais lenta para as mulheres',
        texto: maisLento
          ? `Em média, ${Helpers.formatNumber(Math.abs(tempo.diferencaMeses) / 12, 1)} ano(s) a mais que para os homens.`
          : `Em média, as mulheres levam ${Helpers.formatNumber(Math.abs(tempo.diferencaMeses) / 12, 1)} ano(s) a menos que os homens.`
      });
    }
    if (geral.salarioMedio.dif !== null) {
      lista.push({
        icone: 'money',
        titulo: geral.salarioMedio.dif < 0 ? 'Salário médio menor para mulheres' : 'Salário médio das mulheres não é menor',
        texto: `Diferença bruta de ${Helpers.formatPercent(Math.abs(geral.salarioMedio.dif))} no salário médio, sem separar por nível.`
      });
    }
    return lista;
  }

  return {
    MIN_AMOSTRA, janela, opcoesDePeriodo, dentro,
    pessoas, estatisticas, diferenca, niveis, resumo, tempoAtePromocao, funil, gargalos,
    taxas, indicadoresPorSetor, setoresComMaiorDiferenca, mapaPromocoes, descobertas
  };
})();
