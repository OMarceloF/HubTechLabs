// editarDiario.js

// ===========================================
//            FUNÇÕES AUXILIARES
// ===========================================

/**
 * Exibe / oculta o menu “Editar Perfil” ao clicar na foto.
 */
function toggleMudarPerfil() {
  const mudarPerfil = document.getElementById("mudarPerfil");
  if (mudarPerfil.style.display === "flex") {
    mudarPerfil.style.display = "none";
  } else {
    mudarPerfil.style.display = "flex";
  }
}

// Fecha o menu “Editar Perfil” ao clicar fora.
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

/**
 * Formata uma data ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ) para DD/MM/YYYY.
 */
function formatarDataParaDDMMYYYY(dataISO) {
  const d = new Date(dataISO);
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const ano = d.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Exibe uma mensagem de feedback (temporária) abaixo da tabela de alunos.
 */
function exibirMensagem(texto, isError = false) {
  const msgDiv = document.getElementById("mensagem-feedback");
  msgDiv.textContent = texto;
  msgDiv.classList.remove("hidden");
  msgDiv.classList.toggle("erro", isError);
  setTimeout(() => {
    msgDiv.classList.add("hidden");
  }, 3000);
}

// ===========================================
//    Carrega o “nomeUsuario” no localStorage
// ===========================================
async function obterNomeUsuario() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token não encontrado.");
    }
    // Como era na Vercel
    const resp = await fetch("https://hub-orcin.vercel.app/usuario-logado", {
      //Como era localmente
      // const resp = await fetch("http://localhost:3000/usuario-logado", {
      headers: { Authorization: token }
    });
    if (!resp.ok) throw new Error("Falha ao buscar usuário logado.");
    const dados = await resp.json(); // { email, name, photo, tipo }
    localStorage.setItem("nomeUsuario", dados.name);
    localStorage.setItem("tipoUsuario", dados.tipo);
  } catch (err) {
    console.error("Erro em obterNomeUsuario():", err);
  }
}

// ===========================================
//    Funções de “Coordenador” <→> Instrutor
// ===========================================
/**
 * Se o usuário for Coordenador, carrega a lista de instrutores vinculados a ele.
 * Depois que selecionar um instrutor, carrega as turmas.
 */
async function carregarInstrutoresParaCoordenador() {
  const nomeCoordenador = localStorage.getItem("nomeUsuario");
  if (!nomeCoordenador) {
    alert("Nome do coordenador não encontrado. Faça login novamente.");
    return;
  }

  try {
    const resp = await fetch(
      //Como era na Vercel
      `https://hub-orcin.vercel.app/instrutores-por-coordenador?coordenador=${encodeURIComponent(
        // Como era localmente
        // `http://localhost:3000/instrutores-por-coordenador?coordenador=${encodeURIComponent(
        nomeCoordenador
      )}`
    );
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || "Erro ao buscar instrutores.");
    }
    const instrutores = await resp.json();
    const selectInstrutores = document.getElementById("instrutores");
    selectInstrutores.innerHTML = "";

    // Opção padrão
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.disabled = true;
    optDefault.selected = true;
    optDefault.textContent = "Selecione um Instrutor";
    selectInstrutores.appendChild(optDefault);

    instrutores.forEach((instrutor) => {
      const opt = document.createElement("option");
      opt.value = instrutor.id; // usaremos o próprio name ao carregar turmas
      opt.textContent = instrutor.name;
      selectInstrutores.appendChild(opt);
    });

    // Habilita o select de instrutores
    selectInstrutores.disabled = false;

    // Quando o coordenador escolher um instrutor, carrega turmas dele
    selectInstrutores.addEventListener("change", async (e) => {
      const nomeInstrutor = e.target.options[e.target.selectedIndex].text;
      await carregarTurmas(nomeInstrutor);
    });
  } catch (err) {
    console.error("Erro em carregarInstrutoresParaCoordenador():", err);
    alert("Falha ao carregar instrutores. Veja console para mais detalhes.");
  }
}

// ===========================================
//            Função carregarTurmas
// ===========================================
/**
 * Busca todas as turmas do servidor (endpoint /listar-turmas),
 * filtra apenas as turmas cujo campo .instrutor === instrutorAlvo,
 * popula o <select id="turma-select"> e preenche window.turmas.
 *
 * @param {string|null} instrutorAlvo (se nulo, usa o próprio “nomeUsuario”)
 */
async function carregarTurmas(instrutorAlvo = null) {
  try {
    // Como era na Vercel
    const resp = await fetch("https://hub-orcin.vercel.app/listar-turmas");
    // Como era localmente
    // const resp = await fetch("http://localhost:3000/listar-turmas");
    if (!resp.ok) throw new Error("Falha ao buscar turmas no servidor.");
    const todasTurmas = await resp.json();

    // Se instrutorAlvo não for passado, usa o nomeUsuario do localStorage
    let alvo = instrutorAlvo;
    if (!alvo) {
      alvo = localStorage.getItem("nomeUsuario");
      if (!alvo) {
        throw new Error("nomeUsuario não encontrado no localStorage.");
      }
    }

    // Filtra apenas turmas cujo instrutor === alvo
    const turmasFiltradas = todasTurmas.filter((t) => t.instrutor === alvo);

    const selectTurma = document.getElementById("turma-select");
    selectTurma.innerHTML = "";

    // Se não houver nenhuma turma, exibe mensagem e bloqueia demais controles
    if (!turmasFiltradas.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.disabled = true;
      opt.selected = true;
      opt.textContent = "Nenhuma turma encontrada";
      selectTurma.appendChild(opt);

      // Desabilita date e botão “Carregar Notas”
      document.getElementById("data-chamada").innerHTML = "";
      document.getElementById("data-chamada").disabled = true;
      document.getElementById("carregar-btn").disabled = true;
      return;
    }

    // Opção padrão
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.disabled = true;
    optDefault.selected = true;
    optDefault.textContent = "Escolha sua turma";
    selectTurma.appendChild(optDefault);

    // Preenche opções e popula window.turmas
    window.turmas = {}; // reset
    turmasFiltradas.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.nome; // usaremos o próprio nome da turma como chave
      opt.textContent = t.nome;
      selectTurma.appendChild(opt);

      window.turmas[t.nome] = {
        id: t.id,
        instrutor: t.instrutor,
        unidade_id: t.unidade_id,
        competencias: t.competencias, // 0 ou 1
        alunos: [] // mais tarde, no carregarNotas ou carregarDatas, se necessário
      };
    });

    // Habilita select de turma
    selectTurma.disabled = false;
    // Garante que date + carregar-btn fiquem bloqueados até selecionar turma
    document.getElementById("data-chamada").disabled = true;
    document.getElementById("carregar-btn").disabled = true;

    // Ao escolher uma turma, vá carregarDatas()
    selectTurma.addEventListener("change", () => {
      carregarDatas();
    });
  } catch (err) {
    console.error("Erro em carregarTurmas():", err);
    alert("Não foi possível carregar turmas. Veja console.");
  }
}

// ===========================================
//              Função carregarDatas
// ===========================================
/**
 * Dado que window.turmas já está populado, pega a turma selecionada,
 * verifica o campo .competencias e busca a rota /dados-presenca ou /dados-competencias.
 * Preenche <select id="data-chamada"> apenas com as datas únicas daquela turma.
 */
async function carregarDatas() {
  const selectTurma = document.getElementById("turma-select");
  const turmaSelecionada = selectTurma.value;
  if (!turmaSelecionada) return;

  try {
    const turmaObj = window.turmas[turmaSelecionada];
    if (!turmaObj) throw new Error("Objeto turma não encontrado em window.turmas.");

    // Decide a URL com base em competencias
    const urlDados = turmaObj.competencias === 1
      // Como era na Vercel
      ? "https://hub-orcin.vercel.app/dados-competencias"
      : "https://hub-orcin.vercel.app/dados-presenca";
    // Como era localmente
    // ? "http://localhost:3000/dados-competencias"
    // : "http://localhost:3000/dados-presenca";

    const resp = await fetch(urlDados);
    if (!resp.ok) throw new Error("Falha ao buscar dados de presenças/competências.");

    const todosDados = await resp.json();
    const registrosDaTurma = todosDados[turmaSelecionada] || [];

    if (!registrosDaTurma.length) {
      alert(`Nenhum registro encontrado para a turma "${turmaSelecionada}".`);
      // Limpa e desabilita o select de data
      const selData = document.getElementById("data-chamada");
      selData.innerHTML = "";
      selData.disabled = true;
      document.getElementById("carregar-btn").disabled = true;
      return;
    }

    // Extrai datas (em formato ISO ou timestamp) e converte para dia único
    const datasUnicas = [
      ...new Set(registrosDaTurma.map((r) => r.data.split("T")[0])),
    ];

    // Preenche <select id="data-chamada">
    const selData = document.getElementById("data-chamada");
    selData.innerHTML = "";
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "Escolha a data";
    optDefault.disabled = true;
    optDefault.selected = true;
    selData.appendChild(optDefault);

    datasUnicas.forEach((dataISO) => {
      const opt = document.createElement("option");
      opt.value = dataISO;
      opt.textContent = formatarDataParaDDMMYYYY(dataISO);
      selData.appendChild(opt);
    });

    selData.disabled = false;
    document.getElementById("carregar-btn").disabled = false;
  } catch (err) {
    console.error("Erro em carregarDatas():", err);
    alert("Não foi possível carregar as datas. Veja console.");
  }
}

// ===========================================
//             Função carregarNotas
// ===========================================
/**
 * Ao clicar em “Carregar Notas”, busca novamente /dados-presenca ou /dados-competencias,
 * filtra pelo par (turmaSelecionada, dataSelecionada) e monta a tabela <thead> + <tbody>.
 * Também exibe o “Conteúdo da Aula” (ou sugestões de competências) no <p>.
 */
async function carregarNotas() {
  try {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const dataSelecionada = document.getElementById("data-chamada").value;
    if (!turmaSelecionada || !dataSelecionada) {
      alert("Selecione turma e data antes de carregar.");
      return;
    }

    const turmaObj = window.turmas[turmaSelecionada];
    if (!turmaObj) throw new Error("Turma não encontrada em window.turmas.");

    // ---------------------------------------------------
    // 1) Descobrir se usa competências ou notas
    // ---------------------------------------------------
    const usarCompetencias = turmaObj.competencias === 1;
    const urlDados = usarCompetencias

      // Como era na Vercel
      ? "https://hub-orcin.vercel.app/dados-competencias"
      : "https://hub-orcin.vercel.app/dados-presenca";
    // Como era localmente
    // ? "http://localhost:3000/dados-competencias"
    // : "http://localhost:3000/dados-presenca";

    // ---------------------------------------------------
    // 2) Buscar os dados apropriados
    // ---------------------------------------------------
    const resp = await fetch(urlDados);
    if (!resp.ok) throw new Error("Falha ao buscar dados de presenças/competências.");

    const todosDados = await resp.json();
    // Filtra apenas os registros desta turma + data (YYYY-MM-DD)
    const registros = (todosDados[turmaSelecionada] || []).filter(
      (r) => r.data.split("T")[0] === dataSelecionada
    );

    if (!registros.length) {
      alert("Nenhum registro encontrado para essa data.");
      return;
    }

    // ---------------------------------------------------
    // 3) Montar o <thead> e <tbody> da tabela
    // ---------------------------------------------------
    const CAMPOS_COMPETENCIAS = [
      "concentracao",
      "comprometimento",
      "proatividade",
      "criatividade",
      "trabalho_em_equipe",
      "inteligencia_emocional",
      "capacidade_avaliacao_decisao",
      "flexibilidade_cognitiva",
      "raciocinio_logico",
      "objetividade",
      "conclusao_atividades",
      "organizacao",
      "planejamento",
      "solucao_atividade",
      "motivacao"
    ];

    // 3.1) Cabeçalho
    const thead = document.getElementById("alunos-thead");
    thead.innerHTML = "";
    const trHead = document.createElement("tr");

    if (usarCompetencias) {
      // Monta colunas de “Competências”
      trHead.innerHTML = `
        <th>Nome</th>
        <th>Presença</th>
        ${CAMPOS_COMPETENCIAS
          .map((campo) => `<th>${campo
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}</th>`)
          .join("")}
      `;
    } else {
      // Modo “Notas”
      trHead.innerHTML = `
        <th>Nome</th>
        <th>Presença</th>
        <th>Nota</th>
        <th>Observações</th>
      `;
    }
    thead.appendChild(trHead);

    // 3.2) Corpo da tabela
    registros.sort((a, b) => a.aluno.localeCompare(b.aluno, "pt-BR"));
    const tbody = document.getElementById("alunos-list");
    tbody.innerHTML = "";

    if (usarCompetencias) {
      registros.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.aluno}</td>
          <td>${r.presenca}</td>
          ${CAMPOS_COMPETENCIAS
            .map((campo) => `
              <td>
                <input 
                  type="number" 
                  name="${campo}" 
                  min="0" 
                  max="10" 
                  step="0.01"
                  value="${r[campo] != null ? Number(r[campo]).toFixed(2) : '0.00'}"
                />
              </td>
            `)
            .join("")}
        `;
        tbody.appendChild(tr);
      });
    } else {
      registros.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.aluno}</td>
          <td>${r.presenca}</td>
          <td>
            <select class="nota-select">
              ${[0, 1, 2, 3, 4, 5]
            .map(
              (n) => `<option value="${n}" ${r.nota != null && Number(r.nota) === n ? "selected" : ""
                }>${n}</option>`
            )
            .join("")}
            </select>
          </td>
          <td>
            <input
              type="text"
              class="observacao-input"
              placeholder="Observação"
              value="${r.observacao || ""}"
            />
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // ---------------------------------------------------
    // 4) Exibir “Conteúdo da Aula” / “Sugestão de Competências”
    // ---------------------------------------------------
    let conteudoAula = "Sem conteúdo registrado para esta data.";

    if (usarCompetencias) {
      // Como já carregamos `r.conteudoAula`, basta mostrar o primeiro não vazio:
      const primeiro = registros.find(
        (r) => r.conteudoAula && r.conteudoAula.trim() !== ""
      );
      if (primeiro) {
        conteudoAula = primeiro.conteudoAula;
      }
    } else {
      // Modo “Notas”: busca via endpoint /conteudo-aula
      try {
        const respConteudo = await fetch(
          // Como era na Vercel
          `https://hub-orcin.vercel.app/conteudo-aula?turma=${encodeURIComponent(
            // Como era localmente
            // `http://localhost:3000/conteudo-aula?turma=${encodeURIComponent(
            turmaSelecionada
          )}&data=${encodeURIComponent(dataSelecionada)}`
        );
        if (respConteudo.ok) {
          const jsonConteudo = await respConteudo.json();
          if (jsonConteudo.conteudoAula) {
            conteudoAula = jsonConteudo.conteudoAula;
          }
        }
      } catch (_) {
        // se der erro, não faz nada — já fica “Sem conteúdo registrado…”
      }
    }

    document.getElementById("campo-conteudo-aula").textContent = conteudoAula;

    // ---------------------------------------------------
    // 5) Desocultar seções que estavam ocultas
    // ---------------------------------------------------
    document.getElementById("conteudo-aula-exibido").classList.remove("hidden");
    document.getElementById("turma-selecionada").classList.remove("hidden");
    document.getElementById("turma-selecionada").innerText = `Turma: ${turmaSelecionada}`;
    document.getElementById("alunos-container").classList.remove("hidden");
    document.getElementById("salvarAlteracoes").classList.remove("hidden");
  } catch (err) {
    console.error("Erro em carregarNotas():", err);
    alert("Não foi possível carregar as notas/competências. Veja console para detalhes.");
  }
}

// ===========================================
//             Função salvarNotas
// ===========================================
/**
 * Recolhe cada linha do <tbody> e monta um array “alunos”
 * com todos os dados (modo notas ou modo competências).
 * Faz POST para o endpoint apropriado: /atualizar-notas ou /atualizar-competencias.
 */
async function salvarNotas() {
  const turmaSelecionada = document.getElementById("turma-select").value;
  const dataSelecionada = document.getElementById("data-chamada").value;
  if (!turmaSelecionada || !dataSelecionada) {
    alert("Selecione turma e data antes de salvar.");
    return;
  }

  const turmaObj = window.turmas[turmaSelecionada];
  if (!turmaObj) {
    alert("Turma inválida.");
    return;
  }

  // Modo “competências”?
  const usarCompetencias = turmaObj.competencias === 1;

  if (usarCompetencias) {
    // ===========================================
    // MODO “COMPETÊNCIAS”
    // ===========================================
    const linhas = document.querySelectorAll("#alunos-list tr");
    if (!linhas.length) {
      alert("Nenhum aluno para salvar.");
      return;
    }

    const CAMPOS_COMPETENCIAS = [
      "concentracao",
      "comprometimento",
      "proatividade",
      "criatividade",
      "trabalho_em_equipe",
      "inteligencia_emocional",
      "capacidade_avaliacao_decisao",
      "flexibilidade_cognitiva",
      "raciocinio_logico",
      "objetividade",
      "conclusao_atividades",
      "organizacao",
      "planejamento",
      "solucao_atividade",
      "motivacao"
    ];

    const competenciasPayload = [];

    linhas.forEach((tr) => {
      const tds = tr.children;
      const nome = tds[0].textContent.trim();
      const presenca = tds[1].textContent.trim();

      // Coleta cada valor de competência
      const valores = {};
      CAMPOS_COMPETENCIAS.forEach((campo) => {
        const inputNumber = tr.querySelector(`input[name="${campo}"]`);
        const valRaw = inputNumber?.value ?? "";
        valores[campo] = valRaw !== "" ? Number(valRaw) : 0;
      });

      competenciasPayload.push({
        aluno: nome,
        presenca,
        ...valores
      });
    });

    // 3) Envia o fetch para /atualizar-competencias
    try {
      // Como era na Vercel
      const response = await fetch("https://hub-orcin.vercel.app/atualizar-competencias", {
        // Como era localmente
        // const response = await fetch("http://localhost:3000/atualizar-competencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turma: turmaSelecionada,
          data: dataSelecionada,
          competencias: competenciasPayload
        })
      });

      if (response.ok) {
        exibirMensagem("Competências atualizadas com sucesso!", false);
        setTimeout(() => carregarNotas(), 1000);
      } else {
        const txt = await response.text();
        throw new Error(txt || "Falha ao salvar competências.");
      }
    } catch (err) {
      console.error("Erro em salvarNotas() [competências]:", err);
      exibirMensagem("Erro ao salvar competências. Veja console para detalhes.", true);
    }

    return;
  }

  // ===========================================
  // MODO “NOTAS”
  // ===========================================
  const linhasNotas = document.querySelectorAll("#alunos-list tr");
  if (!linhasNotas.length) {
    alert("Nenhum aluno para salvar.");
    return;
  }

  const alunosPayload = [];
  linhasNotas.forEach((tr) => {
    const nome = tr.cells[0].textContent.trim();
    const presenca = tr.cells[1].textContent.trim();
    const notaRaw = tr.querySelector(".nota-select")?.value ?? "";
    const observacao = tr.querySelector(".observacao-input")?.value ?? "";

    const notaNum = notaRaw !== "" ? Number(notaRaw) : null;
    alunosPayload.push({
      nome,
      presenca,
      nota: notaNum,
      observacao
    });
  });

  // Envia para /atualizar-notas
  try {
    // Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/atualizar-notas", {
      // Como era localmente
      // const response = await fetch("http://localhost:3000/atualizar-notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: turmaSelecionada,
        data: dataSelecionada,
        alunos: alunosPayload
      })
    });

    if (response.ok) {
      exibirMensagem("Notas atualizadas com sucesso!", false);
      setTimeout(() => carregarNotas(), 1000);
    } else {
      const txt = await response.text();
      throw new Error(txt || "Falha ao salvar alterações.");
    }
  } catch (err) {
    console.error("Erro em salvarNotas() [notas]:", err);
    exibirMensagem("Não foi possível salvar as alterações. Veja console para detalhes.", true);
  }
}

// ===========================================
//          INICIALIZAÇÃO (DOMContentLoaded)
// ===========================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Verifica se há token no localStorage; se não, redireciona para login
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para acessar esta página.");
    window.location.href = "/Login/login.html";
    return;
  }

  // 2) Obter nomeUsuario e tipoUsuario
  await obterNomeUsuario();
  const tipoUsuario = localStorage.getItem("tipoUsuario");
  if (!tipoUsuario) {
    alert("Tipo de usuário não definido. Faça login novamente.");
    window.location.href = "/Login/login.html";
    return;
  }

  // 3) Se for Coordenador, exibe #div-coordenador e carrega instrutores
  if (tipoUsuario === "Coordenador") {
    document.getElementById("div-coordenador").classList.remove("hidden");
    document.getElementById("instrutores").disabled = false;
    await carregarInstrutoresParaCoordenador();
  } else {
    // 3.1) Se não for Coordenador (ou seja, Instrutor), apenas carrega suas próprias turmas
    await carregarTurmas(null);
  }

  // 4) Vincula “Carregar Notas” e “Salvar Alterações”
  document.getElementById("carregar-btn").addEventListener("click", carregarNotas);
  document.getElementById("salvarAlteracoes").addEventListener("click", salvarNotas);

  // 5) Carrega perfil (foto) do usuário logado
  async function carregarPerfil() {
    try {
      // Como era na Vercel
      const resp = await fetch("https://hub-orcin.vercel.app/perfil", {
        // Como era localmente
        // const resp = await fetch("http://localhost:3000/perfil", {
        headers: { Authorization: token }
      });
      if (!resp.ok) throw new Error("Falha ao carregar perfil.");
      const dados = await resp.json();
      // Corrige o caminho para a imagem de perfil:
      document.getElementById("profile-photo").src =
        dados.photo || "./Imagens/perfil.png";
    } catch (err) {
      console.error("Erro em carregarPerfil():", err);
    }
  }
  carregarPerfil();

  // Carrega também a logo (se houver um <img id="logo"> no HTML)
  const logoImg = document.getElementById("logo");
  if (logoImg) {
    // Ajusta o caminho da logo para a pasta correta:
    logoImg.src = "./Imagens/logo.png";
  }
});
