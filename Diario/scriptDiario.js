function ajustarDataParaLocal(dateString) {
  const date = new Date(dateString + "T00:00:00"); // Garante meia-noite no local
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Ajusta o fuso horário
  return date.toISOString().split("T")[0]; // Retorna no formato YYYY-MM-DD
}

async function obterNomeUsuario() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado");
    //🚭Como era na Vercel
    const res = await fetch("https://hub-orcin.vercel.app/usuario-logado", {
      //🚭Como é localmente
      // const res = await fetch("http://localhost:3000/usuario-logado", {
      headers: { Authorization: token }
    });
    if (!res.ok) throw new Error("Não foi possível obter usuário");
    const { name } = await res.json();
    localStorage.setItem("nomeUsuario", name);
  } catch (e) {
    console.error("obterNomeUsuario():", e);
  }
}



async function carregarTurmas() {
  try {
    // 1) Pega turmas + instrutor + unidade_id + alunos

    // 🚭Como era na Vercel
    const resDados = await fetch("https://hub-orcin.vercel.app/dados");
    // 🚭Como é localmente
    // const resDados = await fetch("http://localhost:3000/dados");

    if (!resDados.ok) throw new Error("Erro ao buscar turmas");
    const turmasObj = await resDados.json();
    // turmasObj: { "Turma A": { instrutor, unidade_id, alunos: [...] }, ... }

    // 2) Pega unidades para ler o flag `competencias`

    // 🚭Como era na Vercel
    const resUnidades = await fetch("https://hub-orcin.vercel.app/listar-unidades");
    // 🚭Como é localmente
    // const resUnidades = await fetch("http://localhost:3000/listar-unidades");

    if (!resUnidades.ok) throw new Error("Erro ao buscar unidades");
    const unidadesArr = await resUnidades.json();
    // unidadesArr: [ { id, unidade, escola, cidade, coordenador, competencias }, … ]

    // 3) Mapeia unidade_id → competencias
    const competenciasMap = new Map(
      unidadesArr.map(u => [u.id.toString(), u.competencias])
    );

    // 4) Filtra e monta o dropdown
    const nomeUsuario = localStorage.getItem("nomeUsuario");
    if (!nomeUsuario) throw new Error("Nome do usuário não encontrado");

    const select = document.getElementById("turma-select");
    select.innerHTML = "";

    // opção padrão
    const defOpt = document.createElement("option");
    defOpt.value = "";
    defOpt.textContent = "Escolha sua turma";
    defOpt.disabled = true;
    defOpt.selected = true;
    select.appendChild(defOpt);

    // Cria o Map global de turmas
    window.turmasMap = new Map();

    Object.entries(turmasObj)
      .filter(([nome, t]) => t.instrutor === nomeUsuario)
      .forEach(([nome, t]) => {
        const compFlag = competenciasMap.get(String(t.unidade_id)) || 0;
        // adiciona option com data-mode
        const opt = document.createElement("option");
        opt.value = nome;
        opt.textContent = nome;
        opt.dataset.mode = compFlag;  // "0" ou "1"
        select.appendChild(opt);
        // guarda no map
        window.turmasMap.set(nome, {
          instrutor: t.instrutor,
          unidade_id: t.unidade_id,
          alunos: t.alunos,
          competencias: compFlag
        });
      });
  } catch (err) {
    console.error("carregarTurmas():", err);
  }
}

function obterListaDeAlunos(turmaSelecionada) {
  const t = window.turmasMap.get(turmaSelecionada);
  return t?.alunos || [];
}


// Função para salvar os dados de presença e notas com data
async function salvarDados() {
  const turmaSelecionada = document.getElementById("turma-select").value;
  const dataChamada = document.getElementById("data-chamada").value;
  const conteudoAula = document.getElementById("conteudo-aula").value.trim();
  if (!conteudoAula) {
    alert("O campo 'Conteúdo da Aula' está vazio. Por favor, preencha antes de salvar.");
    return;
  }
  const linhas = document.querySelectorAll("#alunos-list tr");

  if (!dataChamada) {
    exibirMensagem("Por favor, selecione a data da chamada.", true);
    return;
  }

  try {
    // Verificar se já existe um diário salvo para essa data e turma
    //🚭Como era na Vercel
    const responseVerificacao = await fetch("https://hub-orcin.vercel.app/dados-presenca");
    //🚭Como é localmente
    // const responseVerificacao = await fetch("http://localhost:3000/dados-presenca");

    if (!responseVerificacao.ok) {
      throw new Error("Erro ao verificar dados de presença existentes");
    }

    const diariosSalvos = await responseVerificacao.json();

    // ✅ Verifica se a turma selecionada está presente no objeto retornado
    if (turmaSelecionada in diariosSalvos) {
      const registrosDaTurma = diariosSalvos[turmaSelecionada];

      if (!Array.isArray(registrosDaTurma)) {
        throw new Error("Os dados da turma não estão no formato esperado!");
      }

      // Converte dataChamada para o mesmo formato da API (YYYY-MM-DD)
      const dataChamadaFormatada = ajustarDataParaLocal(dataChamada);

      // Verifica se já existe um registro com a mesma data
      const diarioExistente = registrosDaTurma.some(
        registro => registro.data.split("T")[0] === dataChamadaFormatada
      );

      if (diarioExistente) {
        exibirMensagem("Já existe um diário salvo para essa turma e data!", true);
        return; // Impede que os dados sejam salvos novamente
      }
    }

    // **Aqui detectamos o modo (notas x competências)**
    const select = document.getElementById("turma-select");
    const mode = select.selectedOptions[0].dataset.mode; // "0" = notas, "1" = competências

    // Prepara o array de 'alunos' conforme o modo
    const CAMPOS = [
      "concentracao", "comprometimento", "proatividade", "criatividade",
      "trabalho_em_equipe", "inteligencia_emocional",
      "capacidade_avaliacao_decisao", "flexibilidade_cognitiva",
      "raciocinio_logico", "objetividade", "conclusao_atividades",
      "organizacao", "planejamento", "solucao_atividade", "motivacao"
    ];

    const payloadAlunos = Array.from(linhas).map(tr => {
      const nome = tr.cells[0].textContent;

      if (mode === "0") {
        const presenca = tr.querySelector(".presenca-check").checked
          ? "Presente"
          : "Ausente";

        // capturamos o valor em string
        const rawNota = tr.querySelector(".nota-select").value;
        // convertemos em número; se ausente, forçamos 0; se vazio e presente, guardamos null
        const notaNumerica = presenca === "Ausente"
          ? 0
          : (rawNota !== "" ? Number(rawNota) : null);

        return {
          nome,
          presenca,
          nota: notaNumerica,
          observacao: tr.querySelector(".observacao-input").value || ""
        };
      } else {
        // **novo**: lê presença e zera se ausente
        const presenca = tr.querySelector(".presenca-check").checked
          ? "Presente"
          : "Ausente";

        const obj = { nome, presenca };
        CAMPOS.forEach(c => {
          let val = Number(tr.querySelector(`input[name="${c}"]`).value) || 0;
          obj[c] = presenca === "Presente" ? val : 0;
        });

        obj.media = (
          CAMPOS.reduce((sum, c) => sum + obj[c], 0) /
          CAMPOS.length
        ).toFixed(2);
        return obj;
      }
    });

    // Se não houver um diário salvo para essa data, continua com o processo
    const dados = {
      turma: turmaSelecionada,
      data: dataChamada,
      conteudoAula: conteudoAula,
      alunos: payloadAlunos
    };
    console.log("🧐 Dados que vão pro servidor:", JSON.stringify(dados, null, 2));

    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/salvar-presenca", {
      //🚭Como é localmente
      // const response = await fetch("http://localhost:3000/salvar-presenca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });


    if (response.ok) {
      // informa o usuário e dá reload
      alert("Chamada realizada e salva!");
      window.location.reload();
    } else {
      // lê o texto bruto da resposta e tenta extrair JSON
      const text = await response.text();
      let errMsg = text;
      try {
        const json = JSON.parse(text);
        errMsg = json.error || json.message || text;
      } catch { }
      console.error("✖ salvar-presenca falhou:", errMsg);
      alert("Falha ao salvar:\n" + errMsg);
    }

  } catch (error) {
    exibirMensagem("Erro ao enviar os dados!", true);
  }
}


function obterListaDeAlunos(turmaSelecionada) {
  const t = window.turmasMap.get(turmaSelecionada);
  return t?.alunos || [];
}


function resetarCampos() {
  document.getElementById("turma-select").value = "";
  document.getElementById("conteudo-aula").value = "";
  document.getElementById("data-chamada").value = "";
  document.getElementById("alunos-container").classList.add("hidden");
  document.getElementById("salvar-btn").classList.add("hidden");
  document.getElementById("turma-selecionada").innerText =
    "Selecione uma turma";
  document.getElementById("turma-selecionada").classList.add("hidden");
}

function exibirMensagem(mensagem, isError, callback) {
  const mensagemFeedback = document.getElementById("mensagem-feedback");
  mensagemFeedback.textContent = mensagem;
  mensagemFeedback.classList.remove("hidden");
  mensagemFeedback.classList.toggle("erro", isError);

  setTimeout(() => {
    mensagemFeedback.classList.add("hidden");
    if (callback) {
      callback(); // Chama a função de reset após a mensagem desaparecer
    }
  }, 2000); // 2 segundos
}

function mostrarAlunosSelecionados() {
  const select = document.getElementById("turma-select");
  const turmaSelecionada = select.value;
  const mode = select.selectedOptions[0].dataset.mode; // "0" = notas, "1" = competências
  console.log("modo da turma", turmaSelecionada, "=", mode);
  // Atualiza cabeçalho e mostra container
  document.getElementById("turma-selecionada").innerText = `Turma: ${turmaSelecionada}`;
  document.getElementById("turma-selecionada").classList.remove("hidden");
  document.getElementById("alunos-container").classList.remove("hidden");
  document.getElementById("salvar-btn").classList.remove("hidden");

  // Obtém lista de nomes
  const alunos = obterListaDeAlunos(turmaSelecionada);
  if (alunos.length === 0) {
    alert("Nenhum aluno encontrado para esta turma.");
    return;
  }
  alunos.sort();

  // Monta o formulário correto
  if (mode === "0") {
    montarFormPresenca(alunos);
  } else {
    montarFormCompetencias(alunos);
  }
}

// Gera o formulário de Presença + Nota + Observação
function montarFormPresenca(alunos) {
  const thead = document.querySelector("#alunos-table thead tr");
  thead.innerHTML = `<th>Nome</th>
    <th>Presença</th>
    <th>Nota</th>
    <th>Observação</th>`;
  const tbody = document.getElementById("alunos-list");
  tbody.innerHTML = "";
  alunos.forEach(nome => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nome}</td>
      <td><label><input type="checkbox" class="presenca-check" checked> Presente
</label></td>
      <td>
        <select class="nota-select">
          <option value="">Nota</option>
          ${[0, 1, 2, 3, 4, 5].map(n => `<option value="${n}">${n}</option>`).join("")}
        </select>
      </td>
      <td><input type="text" class="observacao-input" placeholder="Observação"></td>
    `;
    tbody.appendChild(tr);
  });
}

// Campos de competências
const CAMPOS = [
  "concentracao", "comprometimento", "proatividade", "criatividade",
  "trabalho_em_equipe", "inteligencia_emocional",
  "capacidade_avaliacao_decisao", "flexibilidade_cognitiva",
  "raciocinio_logico", "objetividade", "conclusao_atividades",
  "organizacao", "planejamento", "solucao_atividade", "motivacao"
];
const CAMPOS_LABELS = {
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
  motivacao: "Motivação"
};

// Gera o formulário de competências com sugestão automática
function montarFormCompetencias(alunos) {
  const thead = document.querySelector("#alunos-table thead tr");
  thead.innerHTML =
    `<th>Nome</th>
     <th>Presença</th>
     ${CAMPOS.map(c => `<th>${c.replace(/_/g, " ")}</th>`).join("")}`;

  const tbody = document.getElementById("alunos-list");
  tbody.innerHTML = "";

  alunos.forEach(nome => {
    const tr = document.createElement("tr");
    let cols = `
      <td>${nome}</td>
      <td>
        <label>
          <input type="checkbox" class="presenca-check" checked>
          Presente
        </label>
      </td>`;

    CAMPOS.forEach(c => {
      cols += `<td>
        <input type="number"
               name="${c}"
               min="0" max="10"
               data-aluno="${nome}"
               data-campo="${c}">
      </td>`;
    });

    tr.innerHTML = cols;
    tbody.appendChild(tr);
  });

  ativarSugestoes();
}


// Liga os listeners que fazem as sugestões
// Liga os listeners que fazem as sugestões e já faz clamp 0–10
function ativarSugestoes() {
  const map = {
    concentracao: [
      "inteligencia_emocional",
      "capacidade_avaliacao_decisao",
      "flexibilidade_cognitiva",
      "raciocinio_logico",
      "objetividade"
    ],
    comprometimento: [
      "conclusao_atividades",
      "organizacao",
      "planejamento",
      "solucao_atividade"
    ],
    proatividade: ["motivacao"]
  };

  Object.entries(map).forEach(([origem, alvos]) => {
    document.querySelectorAll(`input[name="${origem}"]`).forEach(input => {
      input.addEventListener("input", e => {
        // 1) pega e clampa o valor
        let v = Number(e.target.value);
        if (isNaN(v)) return;       // se não for número, sai
        v = Math.max(0, Math.min(10, v)); // força entre 0 e 10
        e.target.value = v;         // atualiza o campo de origem

        // 2) joga para os campos-alvo
        const aluno = e.target.dataset.aluno;
        alvos.forEach(c => {
          const tgt = document.querySelector(
            `input[name="${c}"][data-aluno="${aluno}"]`
          );
          if (tgt) tgt.value = v;   // **sempre** sobrescreve
        });
      });
    });
  });
}

document.getElementById("turma-select").addEventListener("change", async () => {
  const turma = document.getElementById("turma-select").value;
  const data = document.getElementById("data-chamada").value;
  const competenciasFlag = window.turmasMap.get(turma)?.competencias || 0;

  // if (turma && data) {
  //   await carregarConteudoAula(turma, data, competenciasFlag);
  // }
});

document.getElementById("data-chamada").addEventListener("change", async () => {
  const turma = document.getElementById("turma-select").value;
  const data = document.getElementById("data-chamada").value;
  const competenciasFlag = window.turmasMap.get(turma)?.competencias || 0;

  // if (turma && data) {
  //   await carregarConteudoAula(turma, data, competenciasFlag);
  // }
});

document.addEventListener("DOMContentLoaded", () => {
  // Pega a foto de usuário logado
  // Função para obter token do cookie
  function getTokenFromCookie() {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key === "token") {
        return value;
      }
    }
    return null;
  }

  const token = localStorage.getItem('token');
  //const token = getTokenFromCookie();

  if (!token) {
    alert("Você precisa estar logado para acessar esta página.");
    window.location.href = "/login.html";
    return;
  }

  // Função para carregar perfil do usuário logado
  async function carregarPerfil() {
    try {
      //🚭Como era na Vercel
      const response = await fetch("https://hub-orcin.vercel.app/perfil",
        //🚭Como é localmente
        // const response = await fetch("http://localhost:3000/perfil",
        {
          headers: { Authorization: token },
        });

      if (!response.ok) {
        throw new Error("Erro ao carregar os dados do perfil");
      }

      const data = await response.json();

      // Atualiza os elementos do HTML com os dados do usuário
      document.getElementById("profile-photo").src =
        data.photo || "/Imagens/perfil.png";
    } catch (error) {
    }
  }

  carregarPerfil();

  function getUserType() {
    return localStorage.getItem("tipoUsuario");
  }

  async function verificarAcessoRestrito() {
    try {
      const tipoUsuario = getUserType();

      if (!tipoUsuario) {

      }

      // Verifica se é um Coordenador e bloqueia o acesso
      if (tipoUsuario === 'Coordenador') {
        window.location.href = "/Err o/erro.html"; // Redireciona para a página de erro
      }
    } catch (error) {

    }
  }
  verificarAcessoRestrito();
});

function toggleMudarPerfil() {
  const mudarPerfil = document.getElementById("mudarPerfil");
  // Alterna entre mostrar e esconder
  if (mudarPerfil.style.display === "none" || !mudarPerfil.style.display) {
    mudarPerfil.style.display = "block"; // Mostra a caixa
    mudarPerfil.style.display = "flex";
  } else {
    mudarPerfil.style.display = "none"; // Esconde a caixa
  }
}

// Fecha a caixa ao clicar fora dela
document.addEventListener("click", (event) => {
  const mudarPerfil = document.getElementById("mudarPerfil");
  const userInfo = document.getElementById("user-info");

  // Verifica se o clique foi fora da caixa ou da imagem
  if (
    mudarPerfil.style.display === "flex" &&
    !mudarPerfil.contains(event.target) &&
    !userInfo.contains(event.target)
  ) {
    mudarPerfil.style.display = "none";
  }
});

// Chamar a função ao carregar a página
window.onload = async function () {
  await obterNomeUsuario();
  await carregarTurmas();

  // Ao mudar a turma, mostra o formulário correto (notas ou competências)
  document
    .getElementById("turma-select")
    .addEventListener("change", mostrarAlunosSelecionados);
};

