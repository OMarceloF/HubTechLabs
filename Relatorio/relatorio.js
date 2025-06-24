// ============================================================
// relatorio.js 
// ============================================================

// Variáveis globais
let windowTurmas = {};        // Armazena dados de turmas vindos de /dados
let usuarioTipo = "";         // “Aluno”, “Instrutor” ou “Coordenador”
let usuarioNome = "";         // Nome do usuário logado

// Objeto para armazenar instâncias de gráficos para cada canvas
const chartInstances = {};

// -------------------------------
// FUNÇÕES AUXILIARES DE CARREGAMENTO DE DADOS
// -------------------------------

// 1) Carrega todas as turmas (nome, instrutor, unidade_id, alunos)
async function carregarTurmas(instrutorFiltrado = null) {
  try {
    //Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/dados");
    // Como é localmente
    // const response = await fetch("http://localhost:3000/dados");
    if (!response.ok) throw new Error("Erro ao buscar as turmas");
    const turmasData = await response.json();
    windowTurmas = turmasData;

    let filtroInstrutor = null;
    if (usuarioTipo === "Coordenador" && instrutorFiltrado) {
      filtroInstrutor = instrutorFiltrado;
    } else if (usuarioTipo === "Instrutor") {
      filtroInstrutor = usuarioNome;
    }

    let turmasFiltradas = Object.keys(turmasData);
    if (filtroInstrutor) {
      turmasFiltradas = turmasFiltradas.filter(
        (nomeTurma) => turmasData[nomeTurma].instrutor === filtroInstrutor
      );
    }

    const selectAluno = document.getElementById("turma-select-aluno");
    const selectTurma = document.getElementById("turma-select-turma");

    function povoarSelectTurmas(selectElement) {
      selectElement.innerHTML =
        '<option value="" disabled selected>Escolha uma turma</option>';
      turmasFiltradas
        .sort((a, b) => a.localeCompare(b))
        .forEach((nomeTurma) => {
          const opt = document.createElement("option");
          opt.value = nomeTurma;
          opt.textContent = nomeTurma;
          selectElement.appendChild(opt);
        });
      selectElement.disabled = turmasFiltradas.length === 0;
    }

    if (selectAluno) povoarSelectTurmas(selectAluno);
    if (selectTurma) povoarSelectTurmas(selectTurma);
  } catch (err) {
    console.error("Erro em carregarTurmas:", err);
  }
}

// 2) Carrega todas as unidades, mas filtra se usuário for Instrutor ou Coordenador
async function carregarUnidades() {
  try {
    // Como era na Vercel
    const resp = await fetch("https://hub-orcin.vercel.app/listar-unidades");
    // Como é localmente
    // const resp = await fetch("http://localhost:3000/listar-unidades");
    if (!resp.ok) throw new Error("Erro ao buscar unidades");
    const unidadesArray = await resp.json();

    let unidadesFiltradas = unidadesArray;
    if (usuarioTipo === "Coordenador") {
      unidadesFiltradas = unidadesArray.filter(
        (u) => u.coordenador === usuarioNome
      );
    } else if (usuarioTipo === "Instrutor") {
      // Como é na Vercel
      const respTurmas = await fetch("https://hub-orcin.vercel.app/listar-turmas");
      // Como é localmente
      // const respTurmas = await fetch("http://localhost:3000/listar-turmas");
      if (!respTurmas.ok) throw new Error("Erro ao buscar turmas");
      const turmasLista = await respTurmas.json();
      const unidadesDoInstrutor = new Set(
        turmasLista
          .filter((t) => t.instrutor === usuarioNome)
          .map((t) => t.unidade_id)
      );
      unidadesFiltradas = unidadesArray.filter((u) =>
        unidadesDoInstrutor.has(u.id)
      );
    }

    const select = document.getElementById("unidade-select");
    if (!select) return;
    select.innerHTML =
      '<option value="" disabled selected>Escolha uma unidade</option>';

    unidadesFiltradas.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.unidade;
      select.appendChild(opt);
    });
    select.disabled = unidadesFiltradas.length === 0;
  } catch (err) {
    console.error("Erro em carregarUnidades:", err);
  }
}

// 3) Carrega mapa turma → flag de competências (0 ou 1)
async function carregarMapaCompetencias() {
  try {
    //Como era na Vercel
    const resp = await fetch("https://hub-orcin.vercel.app/listar-turmas");
    // Como é localmente
    // const resp = await fetch("http://localhost:3000/listar-turmas");
    if (!resp.ok) throw new Error("Erro ao buscar mapa de competências");
    const lista = await resp.json(); // array de objetos { id, nome, instrutor, unidade_id, competencias }
    const mapa = {};
    lista.forEach((t) => {
      mapa[t.nome] = t.competencias; // 0 ou 1
    });
    return mapa;
  } catch (err) {
    console.error("Erro em carregarMapaCompetencias:", err);
    return {};
  }
}

// 4) Converte "YYYY-MM-DD" para objeto Date local sem hora
function criarDataLocal(dateStr) {
  if (!dateStr) return new Date(NaN);
  const [ano, mes, dia] = dateStr.split("-");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

// -------------------------------
// EVENTOS PRINCIPAIS DE CARREGAMENTO E TROCA DE SEÇÃO
// -------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Obter tipo e nome do usuário logado
  try {
    // Como era na Vercel
    const resp = await fetch("https://hub-orcin.vercel.app/usuario-logado", {
      headers: { Authorization: localStorage.getItem("token") || "" },
    });
    // Como é localmente
    // const resp = await fetch("http://localhost:3000/usuario-logado", {
    //   headers: { Authorization: localStorage.getItem("token") || "" },
    // });
    if (!resp.ok) throw new Error("Não autorizado");
    const data = await resp.json();
    usuarioTipo = data.tipo;      // ex: "Instrutor" ou "Coordenador"
    usuarioNome = data.name || "";
  } catch (err) {
    console.error("Erro ao obter usuário logado:", err);
    alert("Você precisa estar logado para acessar esta página.");
    window.location.href = "/Login/login.html";
    return;
  }

  // 2) Mostrar ou esconder seções de "escolha de instrutor" para coordenador
  if (usuarioTipo === "Coordenador") {
    document.getElementById("coordenador-section-aluno").style.display = "flex";
    document.getElementById("coordenador-section-turma").style.display = "flex";
    carregarInstrutoresParaCoordenador();
    carregarInstrutoresParaCoordenadorTurma();
  }

  // 3) Inicialmente, carregar todas as turmas e unidades
  await carregarTurmas();
  await carregarUnidades();

  // 4) Conectar botões de troca de seção
  document
    .getElementById("relatorio-aluno-btn")
    .addEventListener("click", () => {
      document.getElementById("conteinerOpcao").classList.add("hidden");
      document.getElementById("relatorio-turma-container").classList.add("hidden");
      document.getElementById("relatorio-unidade-container").classList.add("hidden");
      document.getElementById("relatorio-aluno-container").classList.remove("hidden");
    });
  document
    .getElementById("relatorio-turma-btn")
    .addEventListener("click", () => {
      document.getElementById("conteinerOpcao").classList.add("hidden");
      document.getElementById("relatorio-aluno-container").classList.add("hidden");
      document.getElementById("relatorio-unidade-container").classList.add("hidden");
      document.getElementById("relatorio-turma-container").classList.remove("hidden");
    });
  document
    .getElementById("relatorio-unidade-btn")
    .addEventListener("click", () => {
      document.getElementById("conteinerOpcao").classList.add("hidden");
      document.getElementById("relatorio-aluno-container").classList.add("hidden");
      document.getElementById("relatorio-turma-container").classList.add("hidden");
      document.getElementById("relatorio-unidade-container").classList.remove("hidden");
    });

  // 5) Ao mudar qualquer input/select, ocultar relatórios já carregados
  document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => {
      /* Limpa mensagens de erro e esconde todas as seções de resultados */
      document.getElementById("msg-erro-aluno").textContent = "";
      document.getElementById("msg-erro-aluno").style.display = "none";
      document.getElementById("notas-aluno-container").classList.add("hidden");
      document.getElementById("competencias-aluno-container").classList.add("hidden");
      document
        .getElementById("exportar-relatorio-notas-aluno")
        .classList.add("hidden");
      document
        .getElementById("exportar-relatorio-competencias-aluno")
        .classList.add("hidden");

      document.getElementById("msg-erro-turma").textContent = "";
      document.getElementById("msg-erro-turma").style.display = "none";
      document.getElementById("notas-turma-container").classList.add("hidden");
      document.getElementById("competencias-turma-container").classList.add("hidden");
      document
        .getElementById("exportar-relatorio-notas-turma")
        .classList.add("hidden");
      document
        .getElementById("exportar-relatorio-competencias-turma")
        .classList.add("hidden");
      document
        .getElementById("exportar-relatorios-individuais-turma-notas")
        .classList.add("hidden");
      document
        .getElementById("exportar-relatorios-individuais-turma-competencias")
        .classList.add("hidden");

      document.getElementById("msg-erro-unidade").textContent = "";
      document.getElementById("msg-erro-unidade").style.display = "none";
      document.getElementById("notas-unidade-container").classList.add("hidden");
      document.getElementById("competencias-unidade-container").classList.add("hidden");
      document
        .getElementById("exportar-relatorio-notas-unidade")
        .classList.add("hidden");
      document
        .getElementById("exportar-relatorio-competencias-unidade")
        .classList.add("hidden");
    });
  });

  // 6) Eventos de formulário
  document
    .getElementById("carregar-relatorio-aluno")
    .addEventListener("click", gerarRelatorioAluno);
  document
    .getElementById("gerar-relatorio-turma")
    .addEventListener("click", gerarRelatorioTurma);
  document
    .getElementById("gerar-relatorio-unidade")
    .addEventListener("click", gerarRelatorioUnidade);

  // 7) Export buttons
  document
    .getElementById("exportar-relatorio-notas-aluno")
    .addEventListener("click", exportarRelatorioNotasAluno);
  document
    .getElementById("exportar-relatorio-competencias-aluno")
    .addEventListener("click", exportarRelatorioCompetenciasAluno);
  document
    .getElementById("exportar-relatorio-notas-turma")
    .addEventListener("click", exportarRelatorioNotasTurma);
  document
    .getElementById("exportar-relatorio-competencias-turma")
    .addEventListener("click", exportarRelatorioCompetenciasTurma);
  document
    .getElementById("exportar-relatorio-notas-unidade")
    .addEventListener("click", exportarRelatorioNotasUnidade);
  document
    .getElementById("exportar-relatorio-competencias-unidade")
    .addEventListener("click", exportarRelatorioCompetenciasUnidade);

  // 8) Quando selecionam uma turma para “Aluno”, carregar lista de alunos no select
  document
    .getElementById("turma-select-aluno")
    .addEventListener("change", async function () {
      const turmaNome = this.value;
      const alunoSelect = document.getElementById("aluno-select-aluno");
      alunoSelect.innerHTML =
        '<option value="" disabled selected>Escolha um aluno</option>';

      const alunos = windowTurmas[turmaNome]?.alunos || [];
      if (alunos.length === 0) {
        alunoSelect.innerHTML = "<option disabled>Nenhum aluno encontrado</option>";
        alunoSelect.disabled = true;
        return;
      }
      alunos.sort((a, b) => a.localeCompare(b)).forEach((aluno) => {
        const opt = document.createElement("option");
        opt.value = aluno;
        opt.textContent = aluno;
        alunoSelect.appendChild(opt);
      });
      alunoSelect.disabled = false;
    });

  // 9) Quando selecionam instrutor (Aluno) recarregar turmas filtradas
  document
    .getElementById("instrutor-select-aluno")
    .addEventListener("change", async function () {
      const instr = this.value;
      await carregarTurmas(instr);
      const alunoSelect = document.getElementById("aluno-select-aluno");
      alunoSelect.innerHTML =
        '<option value="" disabled selected>Escolha um aluno</option>';
      alunoSelect.disabled = true;
    });

  // 10) Quando selecionam instrutor (Turma) recarregar turmas filtradas
  document
    .getElementById("instrutor-select-turma")
    .addEventListener("change", async function () {
      const instr = this.value;
      await carregarTurmas(instr);
    });
});

// -------------------------------
// FUNÇÃO: Carregar Instrutores para Coordenador (Aluno)
// -------------------------------
async function carregarInstrutoresParaCoordenador() {
  try {
    const resp = await fetch(
      // Como era na Vercel
      "https://hub-orcin.vercel.app/instrutores-por-coordenador?coordenador=" +
      // Como é localmente
      // "http://localhost:3000/instrutores-por-coordenador?coordenador=" +
      encodeURIComponent(usuarioNome)
    );
    if (!resp.ok) throw new Error("Erro ao buscar instrutores");
    const instrutores = await resp.json(); // array de { name, id }
    const select = document.getElementById("instrutor-select-aluno");
    select.innerHTML =
      '<option value="" disabled selected>Escolha um instrutor</option>';
    instrutores.forEach((ins) => {
      const opt = document.createElement("option");
      opt.value = ins.name;
      opt.textContent = ins.name;
      select.appendChild(opt);
    });
    select.disabled = instrutores.length === 0;
  } catch (err) {
    console.error("Erro em carregarInstrutoresParaCoordenador:", err);
  }
}

// -------------------------------
// FUNÇÃO: Carregar Instrutores para Coordenador (Turma)
// -------------------------------
async function carregarInstrutoresParaCoordenadorTurma() {
  try {
    const resp = await fetch(
      // Como era na Vercel
      "https://hub-orcin.vercel.app/instrutores-por-coordenador?coordenador=" +
      // Como é localmente
      // "http://localhost:3000/instrutores-por-coordenador?coordenador=" +
      encodeURIComponent(usuarioNome)
    );
    if (!resp.ok) throw new Error("Erro ao buscar instrutores");
    const instrutores = await resp.json();
    const select = document.getElementById("instrutor-select-turma");
    select.innerHTML =
      '<option value="" disabled selected>Escolha um instrutor</option>';
    instrutores.forEach((ins) => {
      const opt = document.createElement("option");
      opt.value = ins.name;
      opt.textContent = ins.name;
      select.appendChild(opt);
    });
    select.disabled = instrutores.length === 0;
  } catch (err) {
    console.error("Erro em carregarInstrutoresParaCoordenadorTurma:", err);
  }
}

// -------------------------------
// FUNÇÃO: Relatório por Aluno
// -------------------------------
async function gerarRelatorioAluno() {
  const turmaNome = document.getElementById("turma-select-aluno").value?.trim();
  const alunoNome = document.getElementById("aluno-select-aluno").value?.trim();
  const dataInicio = document.getElementById("data-inicio-aluno").value;
  const dataFim = document.getElementById("data-fim-aluno").value;

  const msgErro = document.getElementById("msg-erro-aluno");
  msgErro.textContent = "";
  msgErro.style.display = "none";

  if (!turmaNome || !alunoNome) {
    alert("Selecione uma turma e um aluno para gerar o relatório.");
    return;
  }

  const mapaComp = await carregarMapaCompetencias();
  const isCompetencias = mapaComp[turmaNome] === 1;

  document.getElementById("notas-aluno-container").classList.add("hidden");
  document.getElementById("competencias-aluno-container").classList.add("hidden");
  document
    .getElementById("exportar-relatorio-notas-aluno")
    .classList.add("hidden");
  document
    .getElementById("exportar-relatorio-competencias-aluno")
    .classList.add("hidden");

  // ============================
  // MODO COMPETÊNCIAS (Aluno)
  // ============================
  if (isCompetencias) {
    try {
      // Como era na Vercel
      const resp = await fetch("https://hub-orcin.vercel.app/dados-competencias");
      // Como é localmente
      // const resp = await fetch("http://localhost:3000/dados-competencias");
      if (!resp.ok) throw new Error("Erro ao buscar dados de competências");
      const todosDadosComp = await resp.json();
      const registrosTurma = todosDadosComp[turmaNome] || [];

      // Filtrar por aluno e intervalo de datas, já ordenando cronologicamente
      const registrosFiltrados = registrosTurma
        .filter((r) => r.aluno === alunoNome)
        .sort((a, b) => new Date(a.data) - new Date(b.data))
        .filter((r) => {
          const dt = criarDataLocal(r.data.split("T")[0]);
          if (dataInicio && dt < criarDataLocal(dataInicio)) return false;
          if (dataFim && dt > criarDataLocal(dataFim)) return false;
          return true;
        });

      if (registrosFiltrados.length === 0) {
        msgErro.textContent =
          "Nenhuma competência registrada para este aluno no período selecionado.";
        msgErro.style.display = "block";
        return;
      }

      // 1) Calcular médias gerais por competência
      const soma = {
        concentracao: 0,
        comprometimento: 0,
        proatividade: 0,
        criatividade: 0,
        trabalho_em_equipe: 0,
        inteligencia_emocional: 0,
        capacidade_avaliacao_decisao: 0,
        flexibilidade_cognitiva: 0,
        raciocinio_logico: 0,
        objetividade: 0,
        conclusao_atividades: 0,
        organizacao: 0,
        planejamento: 0,
        solucao_atividade: 0,
        motivacao: 0,
      };
      registrosFiltrados.forEach((r) => {
        soma.concentracao += Number(r.concentracao || 0);
        soma.comprometimento += Number(r.comprometimento || 0);
        soma.proatividade += Number(r.proatividade || 0);
        soma.criatividade += Number(r.criatividade || 0);
        soma.trabalho_em_equipe += Number(r.trabalho_em_equipe || 0);
        soma.inteligencia_emocional += Number(r.inteligencia_emocional || 0);
        soma.capacidade_avaliacao_decisao += Number(r.capacidade_avaliacao_decisao || 0);
        soma.flexibilidade_cognitiva += Number(r.flexibilidade_cognitiva || 0);
        soma.raciocinio_logico += Number(r.raciocinio_logico || 0);
        soma.objetividade += Number(r.objetividade || 0);
        soma.conclusao_atividades += Number(r.conclusao_atividades || 0);
        soma.organizacao += Number(r.organizacao || 0);
        soma.planejamento += Number(r.planejamento || 0);
        soma.solucao_atividade += Number(r.solucao_atividade || 0);
        soma.motivacao += Number(r.motivacao || 0);
      });

      const count = registrosFiltrados.length;
      const medias = {};
      Object.keys(soma).forEach((key) => {
        medias[key] = (soma[key] / count).toFixed(1);
      });

      // Preencher tabela de médias (no DOM)
      const tbodyCompAluno = document.querySelector(
        "#tabela-competencias-aluno tbody"
      );
      tbodyCompAluno.innerHTML = "";
      Object.entries(medias).forEach(([competencia, valor]) => {
        const tr = document.createElement("tr");
        // Ajusta o texto para exibir o nome da competência de forma mais amigável
        const nomeLegivel = competencia.replace(/_/g, " ").replace(
          /\b\w/g,
          (l) => l.toUpperCase()
        );
        tr.innerHTML = `<td>${nomeLegivel}</td><td>${valor}</td>`;
        tbodyCompAluno.appendChild(tr);
      });

      // Cálculo da média geral das 15 competências
      const somaMedias = Object.values(medias).reduce(
        (acc, v) => acc + parseFloat(v),
        0
      );
      const mediaGeral = (somaMedias / 15).toFixed(1);
      // Adiciona linha “Média Geral”
      const trGeral = document.createElement("tr");
      trGeral.innerHTML = `<td><strong>Média Geral</strong></td><td><strong>${mediaGeral}</strong></td>`;
      tbodyCompAluno.appendChild(trGeral);

      // 2) Preparar dados para gráficos de evolução (por data)
      const labelsDatas = registrosFiltrados.map((r) => {
        const d = criarDataLocal(r.data.split("T")[0]);
        return `${String(d.getDate()).padStart(2, "0")}/${String(
          d.getMonth() + 1
        ).padStart(2, "0")}/${d.getFullYear()}`;
      });

      // Montar arrays de valores para cada competência
      const valoresConcentracao = registrosFiltrados.map((r) =>
        Number(r.concentracao)
      );
      const valoresComprometimento = registrosFiltrados.map((r) =>
        Number(r.comprometimento)
      );
      const valoresProatividade = registrosFiltrados.map((r) =>
        Number(r.proatividade)
      );
      const valoresCriatividade = registrosFiltrados.map((r) =>
        Number(r.criatividade)
      );
      const valoresTrabalhoEquipe = registrosFiltrados.map((r) =>
        Number(r.trabalho_em_equipe)
      );
      const valoresIntelEmocional = registrosFiltrados.map((r) =>
        Number(r.inteligencia_emocional)
      );
      const valoresCapAvalDecisao = registrosFiltrados.map((r) =>
        Number(r.capacidade_avaliacao_decisao)
      );
      const valoresFlexibilidade = registrosFiltrados.map((r) =>
        Number(r.flexibilidade_cognitiva)
      );
      const valoresRaciocinio = registrosFiltrados.map((r) =>
        Number(r.raciocinio_logico)
      );
      const valoresObjetividade = registrosFiltrados.map((r) =>
        Number(r.objetividade)
      );
      const valoresConclusao = registrosFiltrados.map((r) =>
        Number(r.conclusao_atividades)
      );
      const valoresOrganizacao = registrosFiltrados.map((r) =>
        Number(r.organizacao)
      );
      const valoresPlanejamento = registrosFiltrados.map((r) =>
        Number(r.planejamento)
      );
      const valoresSolucao = registrosFiltrados.map((r) =>
        Number(r.solucao_atividade)
      );
      const valoresMotivacao = registrosFiltrados.map((r) =>
        Number(r.motivacao)
      );

      // 3) Função para criar gráfico de linha e destruí-lo se já exista
      function criarGraficoLinha(
        canvasId,
        labelGrafico,
        dataLabels,
        dataValores
      ) {
        const ctx = document.getElementById(canvasId).getContext("2d");
        // Se já existir instância nesse canvas, destrua antes
        if (chartInstances[canvasId]) {
          chartInstances[canvasId].destroy();
        }
        chartInstances[canvasId] = new Chart(ctx, {
          type: "line",
          data: {
            labels: dataLabels,
            datasets: [
              {
                label: labelGrafico,
                data: dataValores,
                fill: false,
                borderColor: "rgba(0, 142, 237, 0.7)",
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: "rgba(0, 142, 237, 0.7)",
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                suggestedMax: 10,
              },
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 0,
                },
              },
            },
          },
        });
      }

      // Criar um gráfico de linha para cada competência
      criarGraficoLinha(
        "chart-concentracao",
        "Concentração",
        labelsDatas,
        valoresConcentracao
      );
      criarGraficoLinha(
        "chart-comprometimento",
        "Comprometimento",
        labelsDatas,
        valoresComprometimento
      );
      criarGraficoLinha(
        "chart-proatividade",
        "Proatividade",
        labelsDatas,
        valoresProatividade
      );
      criarGraficoLinha(
        "chart-criatividade",
        "Criatividade",
        labelsDatas,
        valoresCriatividade
      );
      criarGraficoLinha(
        "chart-trabalho_em_equipe",
        "Trabalho em Equipe",
        labelsDatas,
        valoresTrabalhoEquipe
      );
      criarGraficoLinha(
        "chart-inteligencia_emocional",
        "Inteligência Emocional",
        labelsDatas,
        valoresIntelEmocional
      );
      criarGraficoLinha(
        "chart-capacidade_avaliacao_decisao",
        "Capacidade de Avaliação e Decisão",
        labelsDatas,
        valoresCapAvalDecisao
      );
      criarGraficoLinha(
        "chart-flexibilidade_cognitiva",
        "Flexibilidade Cognitiva",
        labelsDatas,
        valoresFlexibilidade
      );
      criarGraficoLinha(
        "chart-raciocinio_logico",
        "Raciocínio Lógico",
        labelsDatas,
        valoresRaciocinio
      );
      criarGraficoLinha(
        "chart-objetividade",
        "Objetividade",
        labelsDatas,
        valoresObjetividade
      );
      criarGraficoLinha(
        "chart-conclusao_atividades",
        "Conclusão de Atividades",
        labelsDatas,
        valoresConclusao
      );
      criarGraficoLinha(
        "chart-organizacao",
        "Organização",
        labelsDatas,
        valoresOrganizacao
      );
      criarGraficoLinha(
        "chart-planejamento",
        "Planejamento",
        labelsDatas,
        valoresPlanejamento
      );
      criarGraficoLinha(
        "chart-solucao_atividade",
        "Solução de Atividade",
        labelsDatas,
        valoresSolucao
      );
      criarGraficoLinha(
        "chart-motivacao",
        "Motivação",
        labelsDatas,
        valoresMotivacao
      );

      document
        .getElementById("competencias-aluno-container")
        .classList.remove("hidden");
      document
        .getElementById("exportar-relatorio-competencias-aluno")
        .classList.remove("hidden");
      return;
    } catch (err) {
      console.error("Erro ao gerar relatório de competências do aluno:", err);
      msgErro.textContent =
        "Não foi possível gerar o relatório de competências do aluno.";
      msgErro.style.display = "block";
      return;
    }
  }

  // ============================
  // MODO NOTAS (Aluno) – permanece igual
  // ============================
  try {
    const [notasRes, presencasRes] = await Promise.all([
      // Como era na Vercel
      fetch("https://hub-orcin.vercel.app/notasavaliacoes"),
      fetch("https://hub-orcin.vercel.app/dados-presenca"),
      // Como é localmente
      // fetch("http://localhost:3000/notasavaliacoes"),
      // fetch("http://localhost:3000/dados-presenca"),
    ]);
    if (!notasRes.ok || !presencasRes.ok) throw new Error("Erro ao buscar dados");

    const notasData = await notasRes.json();
    const presencaData = await presencasRes.json();

    const notasAluno = (notasData[turmaNome] || []).filter(
      (n) => n.aluno === alunoNome
    );
    const presencasAluno = (presencaData[turmaNome] || [])
      .filter((p) => p.aluno === alunoNome)
      .filter((p) => {
        const dt = criarDataLocal(p.data.split("T")[0]);
        if (dataInicio && dt < criarDataLocal(dataInicio)) return false;
        if (dataFim && dt > criarDataLocal(dataFim)) return false;
        return true;
      });

    if (!notasAluno.length && !presencasAluno.length) {
      msgErro.textContent =
        "Nenhuma nota ou presença registrada para o aluno selecionado no período.";
      msgErro.style.display = "block";
      return;
    }

    msgErro.style.display = "none";

    const labelsDatas = presencasAluno.map((aula) => {
      const dt = criarDataLocal(aula.data.split("T")[0]);
      return `${String(dt.getDate()).padStart(2, "0")}/${String(
        dt.getMonth() + 1
      ).padStart(2, "0")}/${dt.getFullYear()}`;
    });
    const notasPorAula = presencasAluno.map((aula) =>
      parseFloat(aula.nota) || 0
    );
    const presencasBinarizadas = presencasAluno.map((aula) =>
      aula.presenca === "Presente" ? 1 : 0
    );

    // 1) Gráfico de notas em avaliações
    const ctxNotas = document
      .getElementById("grafico-notas-aluno")
      .getContext("2d");
    if (chartInstances["graficoNotasAluno"])
      chartInstances["graficoNotasAluno"].destroy();
    chartInstances["graficoNotasAluno"] = new Chart(ctxNotas, {
      type: "bar",
      data: {
        labels: notasAluno.map((_, idx) => `Avaliação ${idx + 1}`),
        datasets: [
          {
            label: "Notas das Avaliações",
            data: notasAluno.map((n) => Number(n.nota)),
            backgroundColor: "rgba(0, 142, 237, 0.7)",
            borderColor: "#36a2eb",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 10 },
        },
      },
    });

    // 2) Gráfico de presença por aula
    const ctxPresenca = document
      .getElementById("grafico-presenca-aluno")
      .getContext("2d");
    if (chartInstances["graficoPresencaAulaAluno"])
      chartInstances["graficoPresencaAulaAluno"].destroy();
    chartInstances["graficoPresencaAulaAluno"] = new Chart(ctxPresenca, {
      type: "bar",
      data: {
        labels: labelsDatas,
        datasets: [
          {
            label: "Presença (1=Presente, 0=Ausente)",
            data: presencasBinarizadas.map(() => 1),
            backgroundColor: presencasBinarizadas.map((p) =>
              p === 1 ? "rgb(0, 123, 255)" : "rgb(255, 0, 55)"
            ),
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: "Datas das Aulas" },
            ticks: { maxRotation: 45, minRotation: 0 },
          },
          y: {
            min: 0,
            max: 1,
            ticks: { display: false },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) =>
                presencasBinarizadas[ctx.dataIndex] === 1 ? "Presente" : "Ausente",
            },
          },
        },
      },
    });

    // 3) Gráfico de notas por aula
    const ctxDesempenho = document
      .getElementById("grafico-desempenho-aula-aluno")
      .getContext("2d");
    if (chartInstances["graficoDesempenhoAulaAluno"])
      chartInstances["graficoDesempenhoAulaAluno"].destroy();
    chartInstances["graficoDesempenhoAulaAluno"] = new Chart(ctxDesempenho, {
      type: "bar",
      data: {
        labels: labelsDatas,
        datasets: [
          {
            label: `Notas por Aula de ${alunoNome}`,
            data: notasPorAula,
            backgroundColor: "rgba(0, 142, 237, 0.7)",
            borderColor: "#36a2eb",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 10 },
        },
      },
    });

    document.getElementById("notas-aluno-container").classList.remove("hidden");
    document
      .getElementById("exportar-relatorio-notas-aluno")
      .classList.remove("hidden");
  } catch (err) {
    console.error("Erro ao buscar dados (Notas):", err);
    msgErro.textContent = "Erro ao carregar os dados do aluno.";
    msgErro.style.display = "block";
  }
}

// -------------------------------
// FUNÇÃO: Exportar Relatório de Notas (Aluno) em PDF
// -------------------------------
async function exportarRelatorioNotasAluno() {
  const container = document.getElementById("notas-aluno-container");
  if (!container || container.classList.contains("hidden")) {
    alert("Nenhum dado de notas para exportar.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  let yOffset = 10;

  // pegar e formatar datas
  const dataInicioRaw = document.getElementById("data-inicio-aluno").value || "-";
  const dataFimRaw = document.getElementById("data-fim-aluno").value || "-";
  const dataInicioBR =
    dataInicioRaw !== "-" ? formatarDataBrasileira(new Date(dataInicioRaw)) : "-";
  const dataFimBR =
    dataFimRaw !== "-" ? formatarDataBrasileira(new Date(dataFimRaw)) : "-";
  doc.setFontSize(12);
  doc.text(`Período: ${dataInicioBR} até ${dataFimBR}`, 10, yOffset);
  yOffset += 10;

  // pegar turma e aluno
  const turmaNome = document.getElementById("turma-select-aluno").value.trim();
  const alunoNome = document.getElementById("aluno-select-aluno").value.trim();
  doc.setFontSize(14);
  doc.text(`Relatório de Desempenho - Turma: ${turmaNome}`, 10, yOffset);
  yOffset += 8;
  doc.text(`Aluno: ${alunoNome}`, 10, yOffset);
  yOffset += 10;

  try {
    // buscar dados do backend
    const [turmasResponse, presencaResponse, notasResponse, unidadesResponse] =
      await Promise.all([

        // Como era na Vercel
        fetch("https://hub-orcin.vercel.app/dados"),
        fetch(`http://hub-orcin.vercel.app/dados-presenca?turma=${encodeURIComponent(turmaNome)}`),
        fetch(`http://hub-orcin.vercel.app/notasavaliacoes?turma=${encodeURIComponent(turmaNome)}`),
        fetch("http://hub-orcin.vercel.app/listar-unidades"),

        // Como é localmente
        // fetch("http://localhost:3000/dados"),
        // fetch(`http://localhost:3000/dados-presenca?turma=${encodeURIComponent(turmaNome)}`),
        // fetch(`http://localhost:3000/notasavaliacoes?turma=${encodeURIComponent(turmaNome)}`),
        // fetch("http://localhost:3000/listar-unidades"),

      ]);
    if (
      !turmasResponse.ok ||
      !presencaResponse.ok ||
      !notasResponse.ok ||
      !unidadesResponse.ok
    )
      throw new Error("Erro ao buscar os dados do backend.");

    const turmasData = await turmasResponse.json();
    const presencaData = await presencaResponse.json();
    const notasData = await notasResponse.json();
    const unidadesArray = await unidadesResponse.json();

    // filtrar presenças apenas do aluno e dentro do intervalo
    const todosRegistrosPresenca = Array.isArray(presencaData)
      ? presencaData
      : presencaData[turmaNome] || [];
    const registrosPresenca = todosRegistrosPresenca
      .filter((r) => r.aluno === alunoNome)
      .filter((r) => {
        const dataStr = r.data?.split("T")[0];
        if (!dataStr) return false;
        const dt = new Date(dataStr);
        if (dataInicioRaw !== "-" && dt < new Date(dataInicioRaw)) return false;
        if (dataFimRaw !== "-" && dt > new Date(dataFimRaw)) return false;
        return true;
      });

    // filtrar notas apenas do aluno
    const todosRegistrosNotas = Array.isArray(notasData)
      ? notasData
      : notasData[turmaNome] || [];
    const registrosNotasAluno = todosRegistrosNotas.filter(
      (n) => n.aluno === alunoNome
    );

    // 1) Notas das Avaliações
    if (registrosNotasAluno.length > 0) {
      const tabelaNotasAvaliacao = registrosNotasAluno.map((nota) => [
        nota.nomeAvaliacao,
        nota.nota,
      ]);
      doc.setFontSize(12);
      doc.text("Notas das Avaliações:", 10, yOffset);
      yOffset += 8;
      doc.autoTable({
        startY: yOffset,
        head: [["Avaliação", "Nota"]],
        body: tabelaNotasAvaliacao,
        theme: "grid",
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30 },
        },
        tableWidth: "wrap"
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    // 2) Resumo de Presenças / Faltas
    if (registrosPresenca.length > 0) {
      let totalPresencas = 0;
      let totalFaltas = 0;
      let somaNotasPresenca = 0;
      registrosPresenca.forEach((registro) => {
        if (registro.presenca === "Presente") {
          totalPresencas++;
          somaNotasPresenca += parseFloat(registro.nota) || 0;
        } else {
          totalFaltas++;
        }
      });
      const mediaNotasPresenca =
        somaNotasPresenca / (totalPresencas || 1);

      doc.setFontSize(12);
      doc.text("Resumo do Desempenho:", 10, yOffset);
      yOffset += 8;
      doc.autoTable({
        startY: yOffset,
        head: [["Indicador", "Valor"]],
        body: [
          ["Total de Presenças", totalPresencas],
          ["Total de Faltas", totalFaltas],
          ["Média das Notas nas Aulas Presentes", mediaNotasPresenca.toFixed(2)],
        ],
        theme: "grid",
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30 },
        },
        tableWidth: "wrap"
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    // 3) Detalhamento por data
    if (registrosPresenca.length > 0) {
      const detalhesPresenca = registrosPresenca.map((registro) => {
        const partes = registro.data.split("T")[0].split("-");
        const d = new Date(
          Number(partes[0]),
          Number(partes[1]) - 1,
          Number(partes[2])
        );
        const dataFormatada = formatarDataBrasileira(d);
        return [
          dataFormatada,
          registro.presenca,
          registro.nota,
          registro.conteudoAula || "-",
        ];
      });

      doc.setFontSize(12);
      doc.text("Presenças e Desempenho por Aula:", 10, yOffset);
      yOffset += 8;
      doc.autoTable({
        startY: yOffset,
        head: [["Data", "Presença", "Nota", "Conteúdo da Aula"]],
        body: detalhesPresenca,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 80 },
        },
        tableWidth: "wrap"
      });
    }

    doc.save(`Relatorio_Aluno_${turmaNome}_${alunoNome}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar o PDF:", error);
    alert("Não foi possível gerar o PDF do relatório do aluno.");
  }
}


// -------------------------------
// FUNÇÃO: Exportar Relatório de Competências (Aluno) em PDF
// -------------------------------
async function exportarRelatorioCompetenciasAluno() {
  const turmaNome = document.getElementById("turma-select-aluno").value.trim();
  const alunoNome = document.getElementById("aluno-select-aluno").value.trim();
  const dataInicioRaw = document.getElementById("data-inicio-aluno").value || "-";
  const dataFimRaw = document.getElementById("data-fim-aluno").value || "-";
  if (!turmaNome || !alunoNome) {
    alert("Selecione uma turma e um aluno para exportar.");
    return;
  }

  // Formatar datas para BR
  function formatarBR(s) {
    if (!s || s === "-") return "-";
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  const inicioBR = formatarBR(dataInicioRaw);
  const fimBR = formatarBR(dataFimRaw);

  try {
    // Primeiro, verificar se a turma trabalha em modo competências
    const mapaComp = await carregarMapaCompetencias();
    if (mapaComp[turmaNome] !== 1) {
      alert("Esta turma não está no modo Competências.");
      return;
    }

    // Função auxiliar para criar o PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "mm", "a4");
    const larguraPagina = 210;    // largura A4 em mm
    const margemEsquerda = 14;    // margem esquerda em mm
    let y = 15;                   // posição vertical inicial

    // 1) Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    // Título centralizado
    doc.text(
      "Relatório de Competências - Aluno",
      larguraPagina / 2,
      y,
      { align: "center" }
    );
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Turma: ${turmaNome}`, margemEsquerda, y);
    y += 6;
    doc.text(`Aluno: ${alunoNome}`, margemEsquerda, y);
    y += 6;
    doc.text(`Período: ${inicioBR} até ${fimBR}`, margemEsquerda, y);
    y += 10;

    // 2) Construir a tabela de competências (HTML autoTable)
    //    Aproveitamos a tabela já existente no DOM: #tabela-competencias-aluno
    doc.autoTable({
      html: "#tabela-competencias-aluno",
      startY: y,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fillColor: [176, 215, 124],
        textColor: 0,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 40, halign: "left" },  // coluna 0 um pouco mais larga
        // você pode definir larguras fixas ou percentuais para as demais
      },
      tableWidth: "wrap",            // auto-ajusta para caber na página
      margin: { left: 10, right: 10 }, // margens estreitas
    });

    // Depois que a tabela for desenhada, posicionamos o cursor na última linha
    y = doc.lastAutoTable.finalY + 10;

    // 3) Adicionar nova página apenas para os gráficos
    doc.addPage();
    y = 15; // resetar Y na nova página

    // 4) Inserir título "Gráficos de Evolução" centralizado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(
      "Gráficos de Evolução por Competência",
      larguraPagina / 2,
      y,
      { align: "center" }
    );
    y += 10;

    // 5) Pegar lista de IDs dos canvases (15 gráficos)
    const chartsToExport = [
      "chart-concentracao",
      "chart-comprometimento",
      "chart-proatividade",
      "chart-criatividade",
      "chart-trabalho_em_equipe",
      "chart-inteligencia_emocional",
      "chart-capacidade_avaliacao_decisao",
      "chart-flexibilidade_cognitiva",
      "chart-raciocinio_logico",
      "chart-objetividade",
      "chart-conclusao_atividades",
      "chart-organizacao",
      "chart-planejamento",
      "chart-solucao_atividade",
      "chart-motivacao",
    ];

    // 6) Definir largura fixa para cada gráfico dentro da página (em mm)
    //    Vamos colocar 2 gráficos por linha: cada um com largura ~80mm, com pequena margem interna.
    const larguraGrafico = 80;
    const distanciaEntreGrafico = 10;
    const totalColunasPorLinha = 2; // 2 gráficos por linha
    let colIndex = 0;

    for (let i = 0; i < chartsToExport.length; i++) {
      const canvasId = chartsToExport[i];
      const originalCanvas = document.getElementById(canvasId);
      if (!originalCanvas) continue;

      // 1) Criar um canvas oculto em memória, com maior resolução (multiplicar por 2)
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = originalCanvas.width * 2;
      offscreenCanvas.height = originalCanvas.height * 2;
      const ctxOff = offscreenCanvas.getContext("2d", { willReadFrequently: true });

      // 2) Desenhar o gráfico no canvas oculto (sem animação)
      //    Vamos clonar os dados do Chart original e redesenhar no offscreen
      const chartData = originalCanvas.chartInstance.data;
      const chartOpts = originalCanvas.chartInstance.options;
      const tempChart = new Chart(ctxOff, {
        type: "line",
        data: chartData,
        options: {
          ...chartOpts,
          responsive: false,
          animation: false,
          maintainAspectRatio: false,
        },
      });

      // 3) Extrair a imagem diretamente do offscreenCanvas
      const imgData = offscreenCanvas.toDataURL("image/png");
      const props2 = doc.getImageProperties(imgData);
      const imgHeight = (props2.height * larguraGrafico) / props2.width;
      const x =
        margemEsquerda +
        colIndex * (larguraGrafico + distanciaEntreGrafico);

      if (y + imgHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 15; // reset no topo da nova página
      }

      doc.addImage(imgData, "PNG", x, y, larguraGrafico, imgHeight);

      // 4) Destruir o chart temporário
      tempChart.destroy();
      colIndex++;
      if (colIndex === totalColunasPorLinha) {
        colIndex = 0;
        y += imgHeight + 10; // pula para a próxima linha vertical (10mm de espaçamento)
      }
    }

    // 7) Salvar o PDF com nome padronizado
    doc.save(
      `Competencias_Aluno_${turmaNome.replace(/\s+/g, "_")}_${alunoNome.replace(
        /\s+/g,
        "_"
      )}.pdf`
    );
  } catch (err) {
    console.error("Erro no exportarRelatorioCompetenciasAluno:", err);
    alert("Não foi possível gerar o PDF de competências do aluno.");
  }
}

// ================================
// FUNÇÃO: Gerar Relatório por Turma
// ================================
async function gerarRelatorioTurma() {
  const turmaNome = document.getElementById("turma-select-turma").value?.trim();
  const dataInicio = document.getElementById("data-inicio-turma").value;
  const dataFim = document.getElementById("data-fim-turma").value;

  const msgErro = document.getElementById("msg-erro-turma");
  msgErro.textContent = "";
  msgErro.style.display = "none";

  if (!turmaNome) {
    alert("Selecione uma turma.");
    return;
  }

  const mapa = await carregarMapaCompetencias();
  const isComp = mapa[turmaNome] === 1;

  // 1) Esconder todos os containers e botões de exportação
  document.getElementById("notas-turma-container").classList.add("hidden");
  document.getElementById("competencias-turma-container").classList.add("hidden");
  document.getElementById("exportar-relatorio-notas-turma").classList.add("hidden");
  document.getElementById("exportar-relatorio-competencias-turma").classList.add("hidden");
  document.getElementById("exportar-relatorios-individuais-turma-notas").classList.add("hidden");
  document.getElementById("exportar-relatorios-individuais-turma-competencias").classList.add("hidden");

  // ============================
  // MODO COMPETÊNCIAS (Turma)
  // ============================
  if (isComp) {
    try {
      // Como era na Vercel
      const resp = await fetch("https://hub-orcin.vercel.app/dados-competencias");
      // Como é localmente
      // const resp = await fetch("http://localhost:3000/dados-competencias");

      if (!resp.ok) throw new Error("Erro ao buscar dados de competências");
      const todosDadosComp = await resp.json();
      const registrosTurma = todosDadosComp[turmaNome] || [];

      const inicio = dataInicio ? criarDataLocal(dataInicio) : null;
      const fim = dataFim ? criarDataLocal(dataFim) : null;
      const registrosPeriodo = registrosTurma.filter((r) => {
        const dt = criarDataLocal(r.data.split("T")[0]);
        if (inicio && dt < inicio) return false;
        if (fim && dt > fim) return false;
        return true;
      });
      if (registrosPeriodo.length === 0) {
        msgErro.textContent = "Nenhum registro de competências para esta turma no período.";
        msgErro.style.display = "block";
        return;
      }

      // Agrupar registros por aluno e calcular médias
      const mapaPorAluno = {};
      registrosPeriodo.forEach((r) => {
        if (!mapaPorAluno[r.aluno]) mapaPorAluno[r.aluno] = [];
        mapaPorAluno[r.aluno].push(r);
      });

      const tbody = document.querySelector("#tabela-competencias-turma tbody");
      tbody.innerHTML = "";

      Object.keys(mapaPorAluno)
        .sort((a, b) => a.localeCompare(b))
        .forEach((alunoNome) => {
          const registrosAluno = mapaPorAluno[alunoNome];
          const soma = {
            concentracao: 0,
            comprometimento: 0,
            proatividade: 0,
            criatividade: 0,
            trabalho_em_equipe: 0,
            inteligencia_emocional: 0,
            capacidade_avaliacao_decisao: 0,
            flexibilidade_cognitiva: 0,
            raciocinio_logico: 0,
            objetividade: 0,
            conclusao_atividades: 0,
            organizacao: 0,
            planejamento: 0,
            solucao_atividade: 0,
            motivacao: 0,
          };
          registrosAluno.forEach((r) => {
            soma.concentracao += Number(r.concentracao || 0);
            soma.comprometimento += Number(r.comprometimento || 0);
            soma.proatividade += Number(r.proatividade || 0);
            soma.criatividade += Number(r.criatividade || 0);
            soma.trabalho_em_equipe += Number(r.trabalho_em_equipe || 0);
            soma.inteligencia_emocional += Number(r.inteligencia_emocional || 0);
            soma.capacidade_avaliacao_decisao += Number(r.capacidade_avaliacao_decisao || 0);
            soma.flexibilidade_cognitiva += Number(r.flexibilidade_cognitiva || 0);
            soma.raciocinio_logico += Number(r.raciocinio_logico || 0);
            soma.objetividade += Number(r.objetividade || 0);
            soma.conclusao_atividades += Number(r.conclusao_atividades || 0);
            soma.organizacao += Number(r.organizacao || 0);
            soma.planejamento += Number(r.planejamento || 0);
            soma.solucao_atividade += Number(r.solucao_atividade || 0);
            soma.motivacao += Number(r.motivacao || 0);
          });
          const count = registrosAluno.length;
          const medias = {};
          Object.keys(soma).forEach((key) => {
            medias[key] = (soma[key] / count).toFixed(1);
          });
          const somaTodas = Object.values(medias).reduce(
            (acc, v) => acc + parseFloat(v),
            0
          );
          const mediaGeral = (somaTodas / 15).toFixed(1);

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${alunoNome}</td>
            <td>${medias.concentracao}</td>
            <td>${medias.comprometimento}</td>
            <td>${medias.proatividade}</td>
            <td>${medias.criatividade}</td>
            <td>${medias.trabalho_em_equipe}</td>
            <td>${medias.inteligencia_emocional}</td>
            <td>${medias.capacidade_avaliacao_decisao}</td>
            <td>${medias.flexibilidade_cognitiva}</td>
            <td>${medias.raciocinio_logico}</td>
            <td>${medias.objetividade}</td>
            <td>${medias.conclusao_atividades}</td>
            <td>${medias.organizacao}</td>
            <td>${medias.planejamento}</td>
            <td>${medias.solucao_atividade}</td>
            <td>${medias.motivacao}</td>
            <td>${mediaGeral}</td>
          `;
          tbody.appendChild(tr);
        });

      // Exibir o container de competências e o botão de exportar PDF de competências
      document.getElementById("competencias-turma-container").classList.remove("hidden");
      document.getElementById("exportar-relatorio-competencias-turma").classList.remove("hidden");
      // Exibir também o botão ZIP de PDFs individuais (Competências)
      document.getElementById("exportar-relatorios-individuais-turma-competencias").classList.remove("hidden");

      return;
    } catch (err) {
      console.error("Erro ao gerar relatório de competências da turma:", err);
      msgErro.textContent = "Não foi possível gerar o relatório de competências da turma.";
      msgErro.style.display = "block";
      return;
    }
  }

  // ============================
  // MODO NOTAS (Turma)
  // ============================
  try {
    const [dadosRes, presencaRes, notasRes] = await Promise.all([
      // Como era na Vercel
      fetch("https://hub-orcin.vercel.app/dados"),
      fetch("https://hub-orcin.vercel.app/dados-presenca"),
      fetch("https://hub-orcin.vercel.app/notasavaliacoes"),
      // Como é localmente
      // fetch("http://localhost:3000/dados"),
      // fetch("http://localhost:3000/dados-presenca"),
      // fetch("http://localhost:3000/notasavaliacoes"),
    ]);
    if (!dadosRes.ok || !presencaRes.ok || !notasRes.ok)
      throw new Error("Erro ao buscar dados");

    const dadosTurmas = await dadosRes.json();
    const presencaData = await presencaRes.json();
    const notasData = await notasRes.json();

    // Exibir o container de notas e o botão de exportar PDF de notas
    document.getElementById("notas-turma-container").classList.remove("hidden");
    document.getElementById("exportar-relatorio-notas-turma").classList.remove("hidden");
    // Exibir também o botão ZIP de PDFs individuais (Notas)
    document.getElementById("exportar-relatorios-individuais-turma-notas").classList.remove("hidden");

    // Montar tabela de resumo
    const tbodyResumo = document.querySelector("#tabela-relatorio-turma tbody");
    tbodyResumo.innerHTML = "";

    const registrosPresencaAll = presencaData[turmaNome] || [];
    const inicio = dataInicio ? criarDataLocal(dataInicio) : null;
    const fim = dataFim ? criarDataLocal(dataFim) : null;
    const registrosFiltradosTodos = registrosPresencaAll.filter((r) => {
      const dt = criarDataLocal(r.data.split("T")[0]);
      if (inicio && dt < inicio) return false;
      if (fim && dt > fim) return false;
      return true;
    });

    const setDatas = new Set();
    registrosFiltradosTodos.forEach((r) => {
      const dataSimples = r.data.split("T")[0];
      setDatas.add(dataSimples);
    });
    const datasOrdenadas = Array.from(setDatas).sort((a, b) => new Date(a) - new Date(b));

    // Cabeçalho detalhado
    const headerRow = document.getElementById("headers-presenca-turma");
    headerRow.innerHTML = "<th>Aluno</th>";
    datasOrdenadas.forEach((d) => {
      const dt = criarDataLocal(d);
      const texto = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
      const th = document.createElement("th");
      th.textContent = texto;
      headerRow.appendChild(th);
    });

    const bodyDetail = document.getElementById("body-presenca-turma");
    bodyDetail.innerHTML = "";

    const alunosLista = dadosTurmas[turmaNome]?.alunos || [];
    alunosLista.sort((a, b) => a.localeCompare(b));

    // Preencher cada linha de alunos, mostrando médias e presença por data
    alunosLista.forEach((aluno) => {
      const registrosAlunoPresenca = registrosFiltradosTodos.filter((r) => r.aluno === aluno);
      const totalAulas = registrosAlunoPresenca.length;
      let totalPresencasAl = 0;
      let somaNotasAulas = 0;
      let totalNotasAulas = 0;

      registrosAlunoPresenca.forEach((r) => {
        if (r.presenca === "Presente") {
          totalPresencasAl++;
          if (r.nota) {
            somaNotasAulas += parseFloat(r.nota);
            totalNotasAulas++;
          }
        }
      });

      const mediaPresenca = totalAulas > 0 ? (totalPresencasAl / totalAulas) * 100 : 0;
      const mediaNotasAulas = totalNotasAulas > 0 ? somaNotasAulas / totalNotasAulas : 0;

      const registrosAvaliacoesAluno = (notasData[turmaNome] || []).filter((n) => n.aluno === aluno);
      const somaNotasAvaliacoes = registrosAvaliacoesAluno.reduce((acc, n) => acc + parseFloat(n.nota), 0);
      const totalAvaliacoes = registrosAvaliacoesAluno.length;
      const mediaAvaliacoes = totalAvaliacoes > 0 ? somaNotasAvaliacoes / totalAvaliacoes : 0;

      // Linha resumo com médias
      const trResumo = document.createElement("tr");
      trResumo.innerHTML = `
        <td>${aluno}</td>
        <td>${isNaN(mediaPresenca) ? "-" : mediaPresenca.toFixed(1) + "%"}</td>
        <td>${isNaN(mediaNotasAulas) ? "-" : mediaNotasAulas.toFixed(2)}</td>
        <td>${isNaN(mediaAvaliacoes) ? "-" : mediaAvaliacoes.toFixed(2)}</td>
      `;
      tbodyResumo.appendChild(trResumo);

      // Linha detalhada de presença por aula
      const trDetail = document.createElement("tr");
      let rowHtml = `<td>${aluno}</td>`;
      datasOrdenadas.forEach((d) => {
        const reg = registrosAlunoPresenca.find((r) => r.data.split("T")[0] === d);
        rowHtml += `<td>${reg ? reg.presenca : "-"}</td>`;
      });
      trDetail.innerHTML = rowHtml;
      bodyDetail.appendChild(trDetail);
    });
  } catch (err) {
    console.error("Erro ao gerar relatório da turma (Notas):", err);
    msgErro.textContent = "Erro ao gerar o relatório da turma em modo Notas.";
    msgErro.style.display = "block";
  }
}

// -------------------------------
// FUNÇÃO AUXILIAR: gera PDF de “Competências” de um aluno e retorna Blob
// -------------------------------
async function gerarPdfCompetenciasAlunoParaZip(turmaNome, alunoNome, dataInicioRaw, dataFimRaw) {
  // Versão modificada para usar diretamente .toDataURL() em offscreenCanvas
  const formatoPDF = async () => {
    function formatarBR(s) {
      if (!s || s === "-") return "-";
      const [y, m, d] = s.split("-");
      return `${d}/${m}/${y}`;
    }
    const inicioBR = dataInicioRaw ? formatarBR(dataInicioRaw) : "-";
    const fimBR = dataFimRaw ? formatarBR(dataFimRaw) : "-";

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const larguraPagina = doc.internal.pageSize.getWidth();
    const margemEsquerda = 14;
    let y = 15;

    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      "Relatório de Competências - Aluno",
      larguraPagina / 2,
      y,
      { align: "center" }
    );
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Turma: ${turmaNome}`, margemEsquerda, y);
    y += 6;
    doc.text(`Aluno: ${alunoNome}`, margemEsquerda, y);
    y += 6;
    doc.text(`Período: ${inicioBR} até ${fimBR}`, margemEsquerda, y);
    y += 10;

    // Buscar registros de competências do aluno

    // Como era na Vercel
    const respDados = await fetch("https://hub-orcin.vercel.app/dados-competencias");
    // Como é localmente
    // const respDados = await fetch("http://localhost:3000/dados-competencias");

    const todosDadosComp = await respDados.json();
    const registrosTurma = todosDadosComp[turmaNome] || [];
    const inicio = dataInicioRaw ? criarDataLocal(dataInicioRaw) : null;
    const fim = dataFimRaw ? criarDataLocal(dataFimRaw) : null;

    // Filtrar registros do aluno no intervalo
    const registrosAluno = registrosTurma
      .filter((r) => r.aluno === alunoNome)
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .filter((r) => {
        const dt = criarDataLocal(r.data.split("T")[0]);
        if (inicio && dt < inicio) return false;
        if (fim && dt > fim) return false;
        return true;
      });

    if (registrosAluno.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor("#c0392b");
      doc.text("Nenhum registro de competências para este aluno no período.", margemEsquerda, y);
      return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
    }

    // 1) Cálculo das médias e preenchimento da tabela HTML temporária (fora da tela)
    const tabelaFake = document.createElement("table");
    tabelaFake.id = "tabela-temp-competencias";
    tabelaFake.style.display = "none";
    tabelaFake.innerHTML = `
      <thead>
        <tr>
          <th>Competência</th>
          <th>Valor Médio</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    document.body.appendChild(tabelaFake);
    const tbodyFake = tabelaFake.querySelector("tbody");

    // Calcular médias por competência
    const soma = {
      concentracao: 0,
      comprometimento: 0,
      proatividade: 0,
      criatividade: 0,
      trabalho_em_equipe: 0,
      inteligencia_emocional: 0,
      capacidade_avaliacao_decisao: 0,
      flexibilidade_cognitiva: 0,
      raciocinio_logico: 0,
      objetividade: 0,
      conclusao_atividades: 0,
      organizacao: 0,
      planejamento: 0,
      solucao_atividade: 0,
      motivacao: 0,
    };
    registrosAluno.forEach((r) => {
      soma.concentracao += Number(r.concentracao || 0);
      soma.comprometimento += Number(r.comprometimento || 0);
      soma.proatividade += Number(r.proatividade || 0);
      soma.criatividade += Number(r.criatividade || 0);
      soma.trabalho_em_equipe += Number(r.trabalho_em_equipe || 0);
      soma.inteligencia_emocional += Number(r.inteligencia_emocional || 0);
      soma.capacidade_avaliacao_decisao += Number(r.capacidade_avaliacao_decisao || 0);
      soma.flexibilidade_cognitiva += Number(r.flexibilidade_cognitiva || 0);
      soma.raciocinio_logico += Number(r.raciocinio_logico || 0);
      soma.objetividade += Number(r.objetividade || 0);
      soma.conclusao_atividades += Number(r.conclusao_atividades || 0);
      soma.organizacao += Number(r.organizacao || 0);
      soma.planejamento += Number(r.planejamento || 0);
      soma.solucao_atividade += Number(r.solucao_atividade || 0);
      soma.motivacao += Number(r.motivacao || 0);
    });
    const count = registrosAluno.length;
    const medias = {};
    Object.keys(soma).forEach((key) => {
      medias[key] = (soma[key] / count).toFixed(1);
    });

    // Preencher linhas da tabelaFake
    Object.entries(medias).forEach(([competencia, valor]) => {
      const tr = document.createElement("tr");
      const nomeLegivel = competencia.replace(/_/g, " ").replace(
        /\b\w/g,
        (l) => l.toUpperCase()
      );
      tr.innerHTML = `<td>${nomeLegivel}</td><td>${valor}</td>`;
      tbodyFake.appendChild(tr);
    });
    // Calcular média geral
    const somaTodas = Object.values(medias).reduce((acc, v) => acc + parseFloat(v), 0);
    const mediaGeral = (somaTodas / 15).toFixed(1);
    const trGeral = document.createElement("tr");
    trGeral.innerHTML = `<td><strong>Média Geral</strong></td><td><strong>${mediaGeral}</strong></td>`;
    tbodyFake.appendChild(trGeral);

    // 2) Usar autoTable para desenhar essa tabelaFake no PDF
    doc.autoTable({
      startY: y,
      html: "#tabela-temp-competencias",
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fillColor: [176, 215, 124],
        textColor: 0,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 80, halign: "left" },
        1: { cellWidth: 30, halign: "center" },
      },
      tableWidth: "wrap",
      margin: { left: margemEsquerda, right: margemEsquerda },
    });

    // Remover tabelaFake do DOM
    document.body.removeChild(tabelaFake);

    // Atualizar posição vertical
    y = doc.lastAutoTable.finalY + 10;

    // 3) Gráficos de evolução (15 canvases)
    doc.addPage();
    y = 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Gráficos de Evolução por Competência", larguraPagina / 2, y, { align: "center" });
    y += 10;

    // ====== Criando offscreenCanvas para cada gráfico ======
    // Extrair labels (datas) e valores para cada competência
    const labelsDatas = registrosAluno.map((r) => {
      const d = criarDataLocal(r.data.split("T")[0]);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    });

    // Montar um objeto com arrays de valores por competência
    const dadosGrafico = {
      concentracao: registrosAluno.map((r) => Number(r.concentracao)),
      comprometimento: registrosAluno.map((r) => Number(r.comprometimento)),
      proatividade: registrosAluno.map((r) => Number(r.proatividade)),
      criatividade: registrosAluno.map((r) => Number(r.criatividade)),
      trabalho_em_equipe: registrosAluno.map((r) => Number(r.trabalho_em_equipe)),
      inteligencia_emocional: registrosAluno.map((r) => Number(r.inteligencia_emocional)),
      capacidade_avaliacao_decisao: registrosAluno.map((r) => Number(r.capacidade_avaliacao_decisao)),
      flexibilidade_cognitiva: registrosAluno.map((r) => Number(r.flexibilidade_cognitiva)),
      raciocinio_logico: registrosAluno.map((r) => Number(r.raciocinio_logico)),
      objetividade: registrosAluno.map((r) => Number(r.objetividade)),
      conclusao_atividades: registrosAluno.map((r) => Number(r.conclusao_atividades)),
      organizacao: registrosAluno.map((r) => Number(r.organizacao)),
      planejamento: registrosAluno.map((r) => Number(r.planejamento)),
      solucao_atividade: registrosAluno.map((r) => Number(r.solucao_atividade)),
      motivacao: registrosAluno.map((r) => Number(r.motivacao)),
    };

    // Rótulos “legíveis” para cada chave
    const rotulos = {
      concentracao: "Concentração",
      comprometimento: "Comprometimento",
      proatividade: "Proatividade",
      criatividade: "Criatividade",
      trabalho_em_equipe: "Trabalho em Equipe",
      inteligencia_emocional: "Inteligência Emocional",
      capacidade_avaliacao_decisao: "Capacidade de Avaliação e Decisão",
      flexibilidade_cognitiva: "Flexibilidade Cognitiva",
      raciocinio_logico: "Raciocínio Lógico",
      objetividade: "Objetividade",
      conclusao_atividades: "Conclusão de Atividades",
      organizacao: "Organização",
      planejamento: "Planejamento",
      solucao_atividade: "Solução de Atividade",
      motivacao: "Motivação",
    };

    const larguraMmPorGrafico = 80;       // mm
    const espacamentoMm = 10;            // mm
    const colMax = 2;                    // 2 gráficos por linha
    let colAtual = 0;

    for (const chave of Object.keys(dadosGrafico)) {
      // 1) Criar um canvas oculto EM MEMÓRIA com alta resolução
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = 400;  // largura em pixels (para boa resolução)
      offscreenCanvas.height = 200; // altura em pixels
      const ctxOff = offscreenCanvas.getContext("2d", { willReadFrequently: true });

      // 2) Desenhar o gráfico no canvas oculto (sem animação)
      const chartTmp = new Chart(ctxOff, {
        type: "line",
        data: {
          labels: labelsDatas,
          datasets: [
            {
              label: rotulos[chave],
              data: dadosGrafico[chave],
              fill: false,
              borderColor: "rgba(0, 142, 237, 0.7)",
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: "rgba(0, 142, 237, 0.7)",
            },
          ],
        },
        options: {
          responsive: false,
          animation: false,
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 10,
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 0,
              },
            },
          },
        },
      });

      // 3) Capturar imagem via toDataURL diretamente
      const imgData2 = offscreenCanvas.toDataURL("image/png");
      const props2 = doc.getImageProperties(imgData2);
      const imgHeight2 = (props2.height * larguraMmPorGrafico) / props2.width;
      const x2 = margemEsquerda + colAtual * (larguraMmPorGrafico + espacamentoMm);

      if (y + imgHeight2 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 15;
      }

      doc.addImage(imgData2, "PNG", x2, y, larguraMmPorGrafico, imgHeight2);

      // 4) Destruir o chart temporário
      chartTmp.destroy();
      colAtual++;
      if (colAtual === colMax) {
        colAtual = 0;
        y += imgHeight2 + 10;
      }
    }

    return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
  };

  return formatoPDF();
}

// -------------------------------
// Função auxiliar: gera PDF de “Notas” de um aluno e retorna Blob
// -------------------------------
async function gerarPdfNotasAlunoParaZip(turmaNome, alunoNome, dataInicioRaw, dataFimRaw) {
  const { jsPDF } = window.jspdf;

  async function formatoPDF() {
    // Formata “YYYY-MM-DD” para “DD/MM/YYYY”
    function formatarBR(s) {
      if (!s || s === "-") return "-";
      const [y, m, d] = s.split("-");
      return `${d}/${m}/${y}`;
    }
    const inicioBR = dataInicioRaw !== "-" ? formatarBR(dataInicioRaw) : "-";
    const fimBR    = dataFimRaw   !== "-" ? formatarBR(dataFimRaw)   : "-";

    const doc = new jsPDF("p", "mm", "a4");
    let yOffset = 10;

    // Cabeçalho
    doc.setFontSize(12);
    doc.text(`Período: ${inicioBR} até ${fimBR}`, 10, yOffset);
    yOffset += 10;
    doc.setFontSize(14);
    doc.text(`Relatório de Desempenho - Turma: ${turmaNome}`, 10, yOffset);
    yOffset += 8;
    doc.text(`Aluno: ${alunoNome}`, 10, yOffset);
    yOffset += 10;

    // Buscar dados do backend
    const [
      turmasResponse,
      presencaResponse,
      notasResponse,
      unidadesResponse,
    ] = await Promise.all([
      fetch("https://hub-orcin.vercel.app/dados"),
      fetch(`https://hub-orcin.vercel.app/dados-presenca?turma=${encodeURIComponent(turmaNome)}`),
      fetch(`https://hub-orcin.vercel.app/notasavaliacoes?turma=${encodeURIComponent(turmaNome)}`),
      fetch("https://hub-orcin.vercel.app/listar-unidades"),
    ]);
    if (
      !turmasResponse.ok ||
      !presencaResponse.ok ||
      !notasResponse.ok ||
      !unidadesResponse.ok
    ) {
      throw new Error("Erro ao buscar os dados do backend.");
    }

    const turmasData   = await turmasResponse.json();
    const presencaData = await presencaResponse.json();
    const notasData    = await notasResponse.json();
    const unidades     = await unidadesResponse.json();

    // Filtrar registros de presença
    const todosPresenca = Array.isArray(presencaData)
      ? presencaData
      : presencaData[turmaNome] || [];
    const registrosPresenca = todosPresenca
      .filter(r => r.aluno === alunoNome)
      .filter(r => {
        const dt = new Date(r.data.split("T")[0]);
        if (dataInicioRaw !== "-" && dt < new Date(dataInicioRaw)) return false;
        if (dataFimRaw    !== "-" && dt > new Date(dataFimRaw))    return false;
        return true;
      });

    // Filtrar registros de notas
    const todasNotas = Array.isArray(notasData)
      ? notasData
      : notasData[turmaNome] || [];
    const registrosNotasAluno = todasNotas.filter(n => n.aluno === alunoNome);

    // 1) Tabela de Notas das Avaliações
    if (registrosNotasAluno.length > 0) {
      const tabelaNotas = registrosNotasAluno.map(n => [n.nomeAvaliacao, n.nota]);
      doc.setFontSize(12);
      doc.text("Notas das Avaliações:", 10, yOffset);
      yOffset += 8;
      doc.autoTable({
        startY: yOffset,
        head: [["Avaliação", "Nota"]],
        body: tabelaNotas,
        theme: "grid",
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30 },
        },
        margin: { left: 10, right: 10 },
        tableWidth: "wrap",
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    // 2) Resumo de Presenças / Faltas
    if (registrosPresenca.length > 0) {
      let totalPresencas = 0, totalFaltas = 0, somaNotas = 0;
      registrosPresenca.forEach(r => {
        if (r.presenca === "Presente") {
          totalPresencas++;
          somaNotas += parseFloat(r.nota) || 0;
        } else {
          totalFaltas++;
        }
      });
      const mediaNotas = somaNotas / (totalPresencas || 1);

      doc.setFontSize(12);
      doc.text("Resumo do Desempenho:", 10, yOffset);
      yOffset += 8;
      doc.autoTable({
        startY: yOffset,
        head: [["Indicador", "Valor"]],
        body: [
          ["Total de Presenças", totalPresencas],
          ["Total de Faltas", totalFaltas],
          ["Média das Notas nas Aulas Presentes", mediaNotas.toFixed(2)],
        ],
        theme: "grid",
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30 },
        },
        margin: { left: 10, right: 10 },
        tableWidth: "wrap",
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }

    // 3) Detalhamento por data
    if (registrosPresenca.length > 0) {
      const detalhes = registrosPresenca.map(r => {
        return [
          formatarBR(r.data.split("T")[0]),
          r.presenca,
          r.nota,
          r.conteudoAula || "-",
        ];
      });
      doc.setFontSize(12);
      doc.text("Presenças e Desempenho por Aula:", 10, yOffset);
      yOffset += 8;
      doc.autoTable({
        startY: yOffset,
        head: [["Data", "Presença", "Nota", "Conteúdo da Aula"]],
        body: detalhes,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 100 },
        },
        margin: { left: 10, right: 10 },
        tableWidth: "wrap",
      });
    }

    return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
  }

  return await formatoPDF();
}


// -------------------------------
// Helper para formatar “YYYY-MM-DD” → “DD/MM/YYYY”
// -------------------------------
function formatarBR(s) {
  if (!s || s === "-") return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ================================
// Registrar o listener do novo botão
// ================================
document
  .getElementById("exportar-relatorios-individuais-turma-notas")
  .addEventListener("click", exportarRelatoriosIndividuaisTurma);

document
  .getElementById("exportar-relatorios-individuais-turma-competencias")
  .addEventListener("click", exportarRelatoriosIndividuaisTurma);

// -------------------------------
// FUNÇÃO: Exportar Relatório de Notas (Turma) em PDF
// -------------------------------
async function exportarRelatorioNotasTurma() {
  const turmaNome = document.getElementById("turma-select-turma").value.trim();
  const dataInicioRaw = document.getElementById("data-inicio-turma").value || "-";
  const dataFimRaw = document.getElementById("data-fim-turma").value || "-";
  if (!turmaNome) {
    alert("Selecione uma turma para exportar o relatório.");
    return;
  }

  function formatarBR(dataStr) {
    if (!dataStr || dataStr === "-") return "-";
    const [y, m, d] = dataStr.split("-");
    return `${d}/${m}/${y}`;
  }
  const inicioBR = formatarBR(dataInicioRaw);
  const fimBR = formatarBR(dataFimRaw);

  try {
    const [
      turmasResponse,
      presencaResponse,
      notasResponse,
      unidadesResponse,
    ] = await Promise.all([
      // Como era na Vercel
      fetch("https://hub-orcin.vercel.app/dados"),
      fetch(`https://hub-orcin.vercel.app/dados-presenca?turma=${encodeURIComponent(turmaNome)}`),
      fetch(`https://hub-orcin.vercel.app/notasavaliacoes?turma=${encodeURIComponent(turmaNome)}`),
      fetch("https://hub-orcin.vercel.app/listar-unidades"),

      // Como é localmente
      // fetch("http://localhost:3000/dados"),
      // fetch(`http://localhost:3000/dados-presenca?turma=${encodeURIComponent(turmaNome)}`),
      // fetch(`http://localhost:3000/notasavaliacoes?turma=${encodeURIComponent(turmaNome)}`),
      // fetch("http://localhost:3000/listar-unidades"),
    ]);

    if (
      !turmasResponse.ok ||
      !presencaResponse.ok ||
      !notasResponse.ok ||
      !unidadesResponse.ok
    ) {
      throw new Error("Erro ao buscar os dados do backend.");
    }

    const turmasData = await turmasResponse.json();
    const presencaData = await presencaResponse.json();
    const notasData = await notasResponse.json();
    const unidadesArray = await unidadesResponse.json();

    const unidadeId = turmasData[turmaNome]?.unidade_id || "Não disponível";
    const unidadeObj = unidadesArray.find((u) => u.id == unidadeId);
    const nomeUnidade = unidadeObj ? unidadeObj.unidade : "Unidade não encontrada";

    const inicio = dataInicioRaw ? criarDataLocal(dataInicioRaw) : null;
    const fim = dataFimRaw ? criarDataLocal(dataFimRaw) : null;

    const registrosPresencaAlg = (presencaData[turmaNome] || []).filter((r) => {
      const dt = criarDataLocal(r.data.split("T")[0]);
      if (inicio && dt < inicio) return false;
      if (fim && dt > fim) return false;
      return true;
    });

    const dadosAlunos = {};
    registrosPresencaAlg.forEach((alu) => {
      if (!dadosAlunos[alu.aluno]) {
        dadosAlunos[alu.aluno] = {
          totalPresencas: 0,
          totalAulas: 0,
          somaNotasAulas: 0,
          totalNotasAulas: 0,
          somaNotasAvaliacoes: 0,
          totalNotasAvaliacoes: 0,
        };
      }
      if (alu.presenca === "Presente") {
        dadosAlunos[alu.aluno].totalPresencas++;
        if (alu.nota) {
          dadosAlunos[alu.aluno].somaNotasAulas += parseFloat(alu.nota);
          dadosAlunos[alu.aluno].totalNotasAulas++;
        }
      }
      dadosAlunos[alu.aluno].totalAulas++;
    });

    Object.values(notasData[turmaNome] || []).forEach((nota) => {
      if (dadosAlunos[nota.aluno]) {
        dadosAlunos[nota.aluno].somaNotasAvaliacoes +=
          parseFloat(nota.nota) || 0;
        dadosAlunos[nota.aluno].totalNotasAvaliacoes++;
      }
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "mm", "a4"); // paisagem
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 14;
    let yOffset = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Unidade: ${nomeUnidade}`, marginLeft, yOffset);
    yOffset += 8;
    doc.setFontSize(14);
    doc.text(`Relatório de Desempenho da Turma: ${turmaNome}`, marginLeft, yOffset);
    yOffset += 8;
    doc.setFontSize(12);
    doc.text(`Período: ${inicioBR} até ${fimBR}`, marginLeft, yOffset);
    yOffset += 10;

    const tabelaDadosAlunos = Object.keys(dadosAlunos)
      .sort((a, b) => a.localeCompare(b))
      .map((nomeAluno) => {
        const alunoData = dadosAlunos[nomeAluno];
        const mediaPresenca =
          alunoData.totalAulas > 0
            ? (alunoData.totalPresencas / alunoData.totalAulas) * 100
            : 0;
        const mediaNotasAulas =
          alunoData.totalNotasAulas > 0
            ? alunoData.somaNotasAulas / alunoData.totalNotasAulas
            : 0;
        const mediaNotasAvaliacoes =
          alunoData.totalNotasAvaliacoes > 0
            ? alunoData.somaNotasAvaliacoes / alunoData.totalNotasAvaliacoes
            : 0;
        return [
          nomeAluno,
          `${mediaPresenca.toFixed(1)}%`,
          mediaNotasAulas.toFixed(2),
          mediaNotasAvaliacoes.toFixed(2),
        ];
      });

    doc.autoTable({
      startY: yOffset,
      head: [
        [
          "Nome do Aluno",
          "Porcentagem de Presença",
          "Média de Notas nas Aulas",
          "Média nas Avaliações",
        ],
      ],
      body: tabelaDadosAlunos,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [41, 218, 187],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 60, halign: "left" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: 30, halign: "center" },
      },
      tableWidth: "auto",
      margin: { left: marginLeft, right: marginLeft },
    });

    let finalYResumo = doc.lastAutoTable.finalY + 10;
    if (finalYResumo > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      finalYResumo = 15;
    }

    doc.autoTable({
      html: "#tabela-detalhe-presenca-turma",
      startY: finalYResumo,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fillColor: [41, 218, 187],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 50, halign: "left" },
      },
      tableWidth: "auto",
      margin: { left: marginLeft, right: marginLeft },
    });

    doc.save(`Relatorio_Turma_${turmaNome.replace(/\s+/g, "_")}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar o PDF do relatório da turma:", error);
    alert("Não foi possível gerar o PDF da turma.");
  }
}

// -------------------------------
// FUNÇÃO: Exportar Relatório de Competências (Turma) em PDF
// -------------------------------
async function exportarRelatorioCompetenciasTurma() {
  const turmaNome = document.getElementById("turma-select-turma").value.trim();
  const dataInicioRaw =
    document.getElementById("data-inicio-turma").value || "-";
  const dataFimRaw = document.getElementById("data-fim-turma").value || "-";
  if (!turmaNome) {
    alert("Selecione uma turma para exportar o relatório.");
    return;
  }

  function formatarBR(s) {
    if (!s || s === "-") return "-";
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  const inicioBR = formatarBR(dataInicioRaw);
  const fimBR = formatarBR(dataFimRaw);

  try {
    const mapaComp = await carregarMapaCompetencias();
    if (mapaComp[turmaNome] !== 1) {
      alert("Esta turma não está no modo Competências.");
      return;
    }

    // Como era na Vercel
    const resp = await fetch("https://hub-orcin.vercel.app/dados-competencias");
    // Como é localmente
    // const resp = await fetch("http://localhost:3000/dados-competencias");

    if (!resp.ok) throw new Error("Erro ao buscar dados de competências");
    const todosDadosComp = await resp.json();
    const registrosTurma = todosDadosComp[turmaNome] || [];

    const inicio = dataInicioRaw ? criarDataLocal(dataInicioRaw) : null;
    const fim = dataFimRaw ? criarDataLocal(dataFimRaw) : null;
    const registrosPeriodo = registrosTurma.filter((r) => {
      const dt = criarDataLocal(r.data.split("T")[0]);
      if (inicio && dt < inicio) return false;
      if (fim && dt > fim) return false;
      return true;
    });

    if (registrosPeriodo.length === 0) {
      alert("Nenhum dado de competências para esta turma no período.");
      return;
    }

    const mapaPorAluno = {};
    registrosPeriodo.forEach((r) => {
      if (!mapaPorAluno[r.aluno]) mapaPorAluno[r.aluno] = [];
      mapaPorAluno[r.aluno].push(r);
    });

    const header = [
      "Aluno",
      "Concentração",
      "Comprometimento",
      "Proatividade",
      "Criatividade",
      "Trabalho em Equipe",
      "Inteligência Emocional",
      "Capacidade Avaliação-Decisão",
      "Flexibilidade Cognitiva",
      "Raciocínio Lógico",
      "Objetividade",
      "Conclusão Atividades",
      "Organização",
      "Planejamento",
      "Solução Atividade",
      "Motivação",
      "Média Geral",
    ];

    const body = [];
    Object.keys(mapaPorAluno)
      .sort((a, b) => a.localeCompare(b))
      .forEach((alunoNome) => {
        const registrosAluno = mapaPorAluno[alunoNome];
        const soma = {
          concentracao: 0,
          comprometimento: 0,
          proatividade: 0,
          criatividade: 0,
          trabalho_em_equipe: 0,
          inteligencia_emocional: 0,
          capacidade_avaliacao_decisao: 0,
          flexibilidade_cognitiva: 0,
          raciocinio_logico: 0,
          objetividade: 0,
          conclusao_atividades: 0,
          organizacao: 0,
          planejamento: 0,
          solucao_atividade: 0,
          motivacao: 0,
        };
        registrosAluno.forEach((r) => {
          soma.concentracao += Number(r.concentracao || 0);
          soma.comprometimento += Number(r.comprometimento || 0);
          soma.proatividade += Number(r.proatividade || 0);
          soma.criatividade += Number(r.criatividade || 0);
          soma.trabalho_em_equipe += Number(r.trabalho_em_equipe || 0);
          soma.inteligencia_emocional += Number(r.inteligencia_emocional || 0);
          soma.capacidade_avaliacao_decisao += Number(r.capacidade_avaliacao_decisao || 0);
          soma.flexibilidade_cognitiva += Number(r.flexibilidade_cognitiva || 0);
          soma.raciocinio_logico += Number(r.raciocinio_logico || 0);
          soma.objetividade += Number(r.objetividade || 0);
          soma.conclusao_atividades += Number(r.conclusao_atividades || 0);
          soma.organizacao += Number(r.organizacao || 0);
          soma.planejamento += Number(r.planejamento || 0);
          soma.solucao_atividade += Number(r.solucao_atividade || 0);
          soma.motivacao += Number(r.motivacao || 0);
        });
        const count = registrosAluno.length;
        const medias = {};
        Object.keys(soma).forEach((key) => {
          medias[key] = (soma[key] / count).toFixed(1);
        });
        const somaTodas = Object.values(medias).reduce(
          (acc, v) => acc + parseFloat(v),
          0
        );
        const mediaGeral = (somaTodas / 15).toFixed(1);

        body.push([
          alunoNome,
          medias.concentracao,
          medias.comprometimento,
          medias.proatividade,
          medias.criatividade,
          medias.trabalho_em_equipe,
          medias.inteligencia_emocional,
          medias.capacidade_avaliacao_decisao,
          medias.flexibilidade_cognitiva,
          medias.raciocinio_logico,
          medias.objetividade,
          medias.conclusao_atividades,
          medias.organizacao,
          medias.planejamento,
          medias.solucao_atividade,
          medias.motivacao,
          mediaGeral,
        ]);
      });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "mm", "a4"); // 'l' = landscape

    const larguraPagina = doc.internal.pageSize.getWidth(); // ~297mm
    const margemEsquerda = 14;
    let y = 15;

    // 1) Cabeçalho do PDF (turma + período)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      `Relatório de Competências - Turma`,
      larguraPagina / 2,
      y,
      { align: "center" }
    );
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Turma: ${turmaNome}`, margemEsquerda, y);
    y += 6;
    doc.text(`Período: ${inicioBR} até ${fimBR}`, margemEsquerda, y);
    y += 10;

    // 2) Construir a tabela inteira (autoTable) cabeçalho + corpo
    doc.autoTable({
      startY: y,
      head: [header],
      body: body,
      theme: "grid",
      styles: {
        fontSize: 7,        // menor para caber
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fillColor: [176, 215, 124],
        textColor: 0,
        halign: "center",
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 40, halign: "left" }, // coluna “Aluno” mais larga
      },
      tableWidth: "wrap",
      margin: { left: margemEsquerda, right: margemEsquerda },
    });

    // 3) Salvar o PDF
    doc.save(`Competencias_Turma_${turmaNome.replace(/\s+/g, "_")}.pdf`);
  } catch (err) {
    console.error("Erro no exportarRelatorioCompetenciasTurma:", err);
    alert("Não foi possível gerar o PDF de competências da turma.");
  }
}

// -------------------------------
// FUNÇÃO: Relatório por Unidade
// -------------------------------
async function gerarRelatorioUnidade() {
  const unidadeId = document.getElementById("unidade-select").value;
  const dataInicioRaw = document.getElementById("data-inicio-unidade").value;
  const dataFimRaw = document.getElementById("data-fim-unidade").value;
  const msgErro = document.getElementById("msg-erro-unidade");
  msgErro.textContent = "";
  msgErro.style.display = "none";

  if (!unidadeId) {
    alert("Selecione uma unidade.");
    return;
  }

  // 1) Buscar lista de turmas e filtrar pelas que pertencem a esta unidade
  let listaTurmas;
  try {
    // Como era na Vercel
    const respTurmas = await fetch("https://hub-orcin.vercel.app/listar-turmas");
    // Como é localmente
    // const respTurmas = await fetch("http://localhost:3000/listar-turmas");

    if (!respTurmas.ok) throw new Error("Erro ao buscar turmas");
    listaTurmas = await respTurmas.json();
  } catch (err) {
    console.error("Erro ao buscar turmas:", err);
    return;
  }

  const turmasDaUnidade = listaTurmas.filter(
    (t) => String(t.unidade_id) === String(unidadeId)
  );
  if (turmasDaUnidade.length === 0) {
    msgErro.textContent = "Nenhuma turma cadastrada nessa unidade.";
    msgErro.style.display = "block";
    return;
  }

  // 2) Separar turmas em modo "Notas" vs. modo "Competências"
  const turmasNotas = turmasDaUnidade
    .filter((t) => t.competencias === 0)
    .map((t) => t.nome);
  const turmasComp = turmasDaUnidade
    .filter((t) => t.competencias === 1)
    .map((t) => t.nome);

  // Converter strings de data para Date
  const inicio = dataInicioRaw ? criarDataLocal(dataInicioRaw) : null;
  const fim = dataFimRaw ? criarDataLocal(dataFimRaw) : null;

  // ------- MODO NOTAS (Unidade) -------
  if (turmasNotas.length > 0) {
    try {
      const [dadosTurmasRes, presencaRes] = await Promise.all([
        // Como era na Vercel
        fetch("https://hub-orcin.vercel.app/dados"),
        fetch("https://hub-orcin.vercel.app/dados-presenca"),
        // Como é localmente
        // fetch("http://localhost:3000/dados"),
        // fetch("http://localhost:3000/dados-presenca"),
      ]);
      if (!dadosTurmasRes.ok || !presencaRes.ok)
        throw new Error("Erro ao carregar dados");

      const dadosTurmas = await dadosTurmasRes.json();
      const presencaAll = await presencaRes.json();

      // Calcular total de matrículas (soma de alunos de cada turma de notas)
      let totalMatriculas = 0;
      turmasNotas.forEach((nomeTurma) => {
        const alunos = dadosTurmas[nomeTurma]?.alunos || [];
        totalMatriculas += alunos.length;
      });

      // Calcular total de presenças e faltas (filtrando por período)
      let totalPresencas = 0;
      let totalFaltas = 0;
      turmasNotas.forEach((nomeTurma) => {
        const registros = presencaAll[nomeTurma] || [];
        registros.forEach((r) => {
          const dt = criarDataLocal(r.data.split("T")[0]);
          if (inicio && dt < inicio) return;
          if (fim && dt > fim) return;
          if (r.presenca === "Presente") totalPresencas++;
          else totalFaltas++;
        });
      });
      const totalAulas = totalPresencas + totalFaltas;
      const pctPresenca =
        totalAulas > 0 ? ((totalPresencas / totalAulas) * 100).toFixed(1) : "0.0";
      const pctFaltas =
        totalAulas > 0 ? ((totalFaltas / totalAulas) * 100).toFixed(1) : "0.0";

      // Preencher spans de "Notas - Unidade"
      document.getElementById("matriculas-unidade").textContent =
        totalMatriculas;
      document.getElementById("percentual-presenca-unidade").textContent =
        `${pctPresenca}%`;
      document.getElementById("percentual-faltas-unidade").textContent = `${pctFaltas}%`;

      // Gráfico de pizza para Presenças/Faltas (Notas)
      const ctxUniNotas = document
        .getElementById("grafico-unidade-notas")
        .getContext("2d");
      if (chartInstances["graficoUnidadeNotas"])
        chartInstances["graficoUnidadeNotas"].destroy();
      chartInstances["graficoUnidadeNotas"] = new Chart(ctxUniNotas, {
        type: "pie",
        data: {
          labels: ["Presença", "Faltas"],
          datasets: [
            {
              data: [totalPresencas, totalFaltas],
              backgroundColor: ["rgba(0, 142, 237, 0.7)", "rgba(255, 0, 55, 0.7)"],
              borderColor: ["#36a2eb", "#ff0037"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: ({ label, parsed, chart }) => {
                  const total = chart._metasets[0].total;
                  const pct = ((parsed / total) * 100).toFixed(1) + "%";
                  return `${label}: ${pct}`;
                },
              },
            },
            legend: { position: "bottom" },
          },
        },
      });

      // Exibe a seção de "Notas - Unidade" e habilita botão de exportar
      document
        .getElementById("notas-unidade-container")
        .classList.remove("hidden");
      document
        .getElementById("exportar-relatorio-notas-unidade")
        .classList.remove("hidden");
    } catch (err) {
      console.error("Erro ao gerar notas da unidade:", err);
      msgErro.textContent =
        "Não foi possível gerar relatório de notas da unidade.";
      msgErro.style.display = "block";
    }
  }

  // ------- MODO COMPETÊNCIAS (Unidade) -------
  if (turmasComp.length > 0) {
    try {
      // 1) Buscar todos os registros de competências

      // Como era na Vercel
      const respComp = await fetch("https://hub-orcin.vercel.app/dados-competencias");
      // Como é localmente
      // const respComp = await fetch("http://localhost:3000/dados-competencias");

      if (!respComp.ok) throw new Error("Erro ao buscar dados de competências");
      const todosDadosComp = await respComp.json();

      // 2) Para cada turma de competências, filtrar pelo período e computar
      let totalPresencas = 0;
      let totalFaltas = 0;
      let totalAulas = 0;

      turmasComp.forEach((nomeTurma) => {
        const registrosTurma = todosDadosComp[nomeTurma] || [];
        const registrosFiltrados = registrosTurma.filter((r) => {
          const dt = criarDataLocal(r.data.split("T")[0]);
          if (inicio && dt < inicio) return false;
          if (fim && dt > fim) return false;
          return true;
        });
        if (registrosFiltrados.length === 0) return;

        // (a) Calcular número de datas únicas → total de Aulas desta turma
        const datasUnicas = new Set(
          registrosFiltrados.map((r) => r.data.split("T")[0])
        );
        const qtdAulasTurma = datasUnicas.size;
        totalAulas += qtdAulasTurma;

        // (b) Contabilizar presenças/faltas
        registrosFiltrados.forEach((r) => {
          if (r.presenca === "Presente") totalPresencas++;
          else totalFaltas++;
        });
      });

      // 3) Preencher spans de "Competências - Unidade" (totais em números)
      document.getElementById("total-aulas-unidade-comp").textContent =
        totalAulas;
      document.getElementById("total-presencas-unidade-comp").textContent =
        totalPresencas;
      document.getElementById("total-faltas-unidade-comp").textContent =
        totalFaltas;

      // 4) Gráfico de pizza para Presenças/Faltas (Competências)
      const ctxCompUniPres = document
        .getElementById("grafico-unidade-competencias-presenca")
        .getContext("2d");
      if (chartInstances["graficoUnidadeCompPresenca"])
        chartInstances["graficoUnidadeCompPresenca"].destroy();

      chartInstances["graficoUnidadeCompPresenca"] = new Chart(
        ctxCompUniPres,
        {
          type: "pie",
          data: {
            labels: ["Presenças", "Faltas"],
            datasets: [
              {
                data: [totalPresencas, totalFaltas],
                backgroundColor: ["rgba(0, 142, 237, 0.7)", "rgba(255, 0, 55, 0.7)"],
                borderColor: ["#36a2eb", "#ff0037"],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: ({ label, parsed, chart }) => {
                    const total = chart._metasets[0].total;
                    const pct = ((parsed / total) * 100).toFixed(1) + "%";
                    return `${label}: ${pct}`;
                  },
                },
              },
              legend: { position: "bottom" },
            },
          },
        }
      );

      // 5) Exibe a seção de "Competências - Unidade"
      document
        .getElementById("competencias-unidade-container")
        .classList.remove("hidden");

      // 6) **Remove (ou esconde) totalmente a tabela**, pois não queremos mais exibi-la
      const tabelaUniComp = document.getElementById(
        "tabela-competencias-unidade"
      );
      if (tabelaUniComp) {
        tabelaUniComp.style.display = "none";
      }

      // 7) Habilita apenas o botão de exportar o PDF de Competências
      document
        .getElementById("exportar-relatorio-competencias-unidade")
        .classList.remove("hidden");
    } catch (err) {
      console.error("Erro ao gerar competências da unidade:", err);
      msgErro.textContent =
        "Não foi possível gerar relatório de competências da unidade.";
      msgErro.style.display = "block";
    }
  }
}

// -------------------------------
// FUNÇÃO: Exportar Relatório de Notas (Unidade) em PDF
// -------------------------------
async function exportarRelatorioNotasUnidade() {
  const unidadeSelect = document.getElementById("unidade-select");
  const unidadeId = unidadeSelect.value;
  const unidadeNome = unidadeSelect.options[unidadeSelect.selectedIndex].text;
  const inicioRaw =
    document.getElementById("data-inicio-unidade").value || "-";
  const fimRaw = document.getElementById("data-fim-unidade").value || "-";

  function formatarBR(s) {
    if (!s) return "-";
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  const inicioBR = formatarBR(inicioRaw);
  const fimBR = formatarBR(fimRaw);

  const matriculas = document.getElementById("matriculas-unidade").textContent;
  const presenca = document.getElementById("percentual-presenca-unidade").textContent;
  const faltas = document.getElementById("percentual-faltas-unidade").textContent;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  let y = 15;

  doc.setFontSize(16);
  doc.text(`Relatório por Unidade (Notas)`, 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(12);
  doc.text(`Unidade: ${unidadeNome}`, 14, y);
  y += 7;
  doc.text(`Período: ${inicioBR} — ${fimBR}`, 14, y);
  y += 10;

  doc.setFont(undefined, "bold");
  doc.text("Matrículas totais:", 14, y);
  doc.setFont(undefined, "normal");
  doc.text(matriculas, 60, y);
  y += 7;

  doc.setFont(undefined, "bold");
  doc.text("% Presença:", 14, y);
  doc.setFont(undefined, "normal");
  doc.text(presenca, 60, y);
  y += 7;

  doc.setFont(undefined, "bold");
  doc.text("% Faltas:", 14, y);
  doc.setFont(undefined, "normal");
  doc.text(faltas, 60, y);
  y += 12;

  const canvas = document.getElementById("grafico-unidade-notas");
  await html2canvas(canvas, { scale: 2 }).then((c) => {
    const imgData = c.toDataURL("image/png");
    const pdfW = 180;
    const props = doc.getImageProperties(imgData);
    const pdfH = (props.height * pdfW) / props.width;
    doc.addImage(imgData, "PNG", 14, y, pdfW, pdfH);
  });

  doc.save(
    `Relatorio_Unidade_Notas_${unidadeNome}_${inicioBR.replace(
      /\//g,
      ""
    )}-${fimBR.replace(/\//g, "")}.pdf`
  );
}

// -------------------------------
// FUNÇÃO: Exportar Relatório de Competências (Unidade) em PDF
// -------------------------------
async function exportarRelatorioCompetenciasUnidade() {
  const unidadeSelect = document.getElementById("unidade-select");
  const unidadeNome = unidadeSelect.options[unidadeSelect.selectedIndex].text;
  const dataInicioRaw = document.getElementById("data-inicio-unidade").value || "-";
  const dataFimRaw = document.getElementById("data-fim-unidade").value || "-";

  function formatarBR(s) {
    if (!s || s === "-") return "-";
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  const inicioBR = formatarBR(dataInicioRaw);
  const fimBR = formatarBR(dataFimRaw);

  // Valores que você já havia preenchido em gerarRelatorioUnidade():
  const totalAulas = document.getElementById("total-aulas-unidade-comp").textContent;
  const totalPresencas = document.getElementById("total-presencas-unidade-comp").textContent;
  const totalFaltas = document.getElementById("total-faltas-unidade-comp").textContent;

  // 1) Criar PDF em modo paisagem
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "mm", "a4"); // Landscape
  const larguraPag = doc.internal.pageSize.getWidth();   // ≈ 297 mm
  const alturaPag = doc.internal.pageSize.getHeight();  // ≈ 210 mm
  const margemEsq = 14;
  const larguraUtil = larguraPag - margemEsq * 2;         // ≈ 269 mm
  let y = 15;

  // 2) Cabeçalho do PDF
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório por Unidade (Competências)", larguraPag / 2, y, { align: "center" });
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Unidade: ${unidadeNome}`, margemEsq, y);
  y += 7;
  doc.text(`Período: ${inicioBR} — ${fimBR}`, margemEsq, y);
  y += 12;

  // 3) Totais
  doc.setFont("helvetica", "bold");
  doc.text("Total de Aulas:", margemEsq, y);
  doc.setFont("helvetica", "normal");
  doc.text(totalAulas, margemEsq + 60, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Total de Presenças:", margemEsq, y);
  doc.setFont("helvetica", "normal");
  doc.text(totalPresencas, margemEsq + 60, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Total de Faltas:", margemEsq, y);
  doc.setFont("helvetica", "normal");
  doc.text(totalFaltas, margemEsq + 60, y);
  y += 12;

  // 4) Gráfico de pizza (opcional) – diminua o tamanho para caber bem
  const canvasPresComp = document.getElementById("grafico-unidade-competencias-presenca");
  if (canvasPresComp) {
    await html2canvas(canvasPresComp, { scale: 2 }).then((c) => {
      const imgData = c.toDataURL("image/png");
      const imgWidth = 120; // mm
      const props = doc.getImageProperties(imgData);
      const imgHeight = (props.height * imgWidth) / props.width;

      if (y + imgHeight > alturaPag - 15) {
        doc.addPage();
        y = 15;
      }

      const xPos = (larguraPag - imgWidth) / 2;
      doc.addImage(imgData, "PNG", xPos, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    });
  }

  // 5) Insira nova página antes da tabela
  doc.addPage();
  y = 15;

  // 6) AutoTable (usando a table já transposta no DOM)
  doc.autoTable({
    startY: y,
    html: "#tabela-competencias-unidade",
    theme: "grid",
    tableWidth: larguraUtil,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "middle",
      halign: "center",
    },
    headStyles: {
      fillColor: [176, 215, 124],
      textColor: 0,
      fontStyle: "bold",
      valign: "middle",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 60, halign: "left" }, // coluna “Competência” mais larga
    },
    tableWidth: "wrap",
    margin: { left: margemEsq, right: margemEsq },
    pageBreak: "auto",
  });

  // 7) Salvar o PDF
  const nomeArquivo = `Relatorio_Unidade_Competencias_${unidadeNome.replace(
    /\s+/g, "_"
  )}_${inicioBR.replace(/\//g, "")}-${fimBR.replace(/\//g, "")}.pdf`;
  doc.save(nomeArquivo);
}

// -------------------------------
// FUNÇÃO AUXILIAR: Formatar Data para BR
// -------------------------------
function formatarDataBrasileira(data) {
  if (!data || isNaN(data)) return "-";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// -------------------------------
// Função auxiliar: mostra/oculta loading overlay
// -------------------------------
function mostrarLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.remove("hidden");
}
function esconderLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("hidden");
}

// =======================================================================
// FUNÇÃO: Exportar TODOS os PDFs individuais de Aluno (em ZIP) para Turma
// =======================================================================

async function exportarRelatoriosIndividuaisTurma() {
  const turmaNome   = document.getElementById("turma-select-turma").value.trim();
  const dataInicio  = document.getElementById("data-inicio-turma").value;
  const dataFim     = document.getElementById("data-fim-turma").value;

  const btnNotas = document.getElementById("exportar-relatorios-individuais-turma-notas");
  const btnComp  = document.getElementById("exportar-relatorios-individuais-turma-competencias");
  const btnClicked = document.activeElement === btnComp ? btnComp : btnNotas;
  const originalText = btnClicked.innerText;

  // Overlay e botão “Gerando…”
  mostrarLoading();
  btnClicked.disabled = true;
  btnClicked.innerText = "Gerando…";

  // Mapa de competências
  let mapa = {};
  try { mapa = await carregarMapaCompetencias(); }
  catch (e) { console.error(e); }
  const isComp = mapa[turmaNome] === 1;

  // Lista de alunos
  let dadosTurmas = {};
  try {
    const resp = await fetch("https://hub-orcin.vercel.app/dados");
    if (!resp.ok) throw new Error("Erro ao buscar dados de turmas.");
    dadosTurmas = await resp.json();
  } catch (e) {
    console.error(e);
    alert("Não foi possível obter a lista de alunos.");
    btnClicked.disabled = false;
    btnClicked.innerText = originalText;
    esconderLoading();
    return;
  }
  const alunosLista = (dadosTurmas[turmaNome]?.alunos || [])
    .slice().sort((a, b) => a.localeCompare(b));
  if (!alunosLista.length) {
    alert("Não há alunos cadastrados nesta turma.");
    btnClicked.disabled = false;
    btnClicked.innerText = originalText;
    esconderLoading();
    return;
  }

  // Seleciona gerador de PDF
  const gerarPdfParaAluno = isComp
    ? aluno => gerarPdfCompetenciasAlunoParaZip(turmaNome, aluno, dataInicio, dataFim)
    : aluno => gerarPdfNotasAlunoParaZip(turmaNome, aluno, dataInicio, dataFim);

  // Gera todos os PDFs em paralelo, mas não falha tudo se um der erro
  const resultados = await Promise.allSettled(
    alunosLista.map(aluno => gerarPdfParaAluno(aluno).then(blob => ({ aluno, blob })))
  );

  // Filtra somente os que deram certo
  const blobs = resultados
    .filter(r => r.status === "fulfilled")
    .map(r => r.value.blob);

  if (!blobs.length) {
    alert("Nenhum PDF foi gerado.");
    btnClicked.disabled = false;
    btnClicked.innerText = originalText;
    esconderLoading();
    return;
  }

  // Monta e baixa o ZIP
  const zip = new JSZip();
  alunosLista.forEach((aluno, i) => {
    if (i < blobs.length) {
      const nomeSeguro = aluno.replace(/\s+/g, "_");
      zip.file(`${nomeSeguro}.pdf`, blobs[i]);
    }
  });
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `Relatorios_Turma_${turmaNome.replace(/\s+/g, "_")}.zip`);

  // Restaura estado
  btnClicked.disabled = false;
  btnClicked.innerText = originalText;
  esconderLoading();
}

// -------------------------------
// FUNÇÃO: Toggle Mostrar/Esconder “Mudar Perfil”
// -------------------------------
function toggleMudarPerfil() {
  const mudarPerfil = document.getElementById("mudarPerfil");
  if (!mudarPerfil) return;
  if (mudarPerfil.style.display === "flex") {
    mudarPerfil.style.display = "none";
  } else {
    mudarPerfil.style.display = "flex";
  }
}
document.addEventListener("click", (event) => {
  const mudarPerfil = document.getElementById("mudarPerfil");
  const userInfo = document.getElementById("user-info");
  if (
    mudarPerfil.style.display === "flex" &&
    !mudarPerfil.contains(event.target) &&
    !userInfo.contains(event.target)
  ) {
    mudarPerfil.style.display = "none";
  }
});
