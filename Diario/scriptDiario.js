function ajustarDataParaLocal(dateString) {
  const date = new Date(dateString + "T00:00:00"); // Garante meia-noite no local
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Ajusta o fuso horário
  return date.toISOString().split("T")[0]; // Retorna no formato YYYY-MM-DD
}

async function obterNomeUsuario() {
  try {
      const email = localStorage.getItem("email"); // Obtém o email armazenado
      if (!email) {
          throw new Error("Nenhum email encontrado no localStorage");
      }

      const response = await fetch("https://hub-orcin.vercel.app/usuarios"); // Chama a API
      if (!response.ok) {
          throw new Error("Erro ao buscar usuários");
      }

      const usuarios = await response.json(); // Converte a resposta em JSON
      
      // Filtra o usuário correspondente ao email armazenado
      const usuarioEncontrado = usuarios.find(usuario => usuario.email === email);
      
      if (usuarioEncontrado) {
          localStorage.setItem("nomeUsuario", usuarioEncontrado.name); // Salva o nome no localStorage
      } else {
      }
  } catch (error) {
  }
}


async function carregarTurmas() {
  try {
      const response = await fetch("https://hub-orcin.vercel.app/dados"); // Requisição ao backend
      if (!response.ok) {
          throw new Error("Erro ao buscar as turmas");
      }
      const turmas = await response.json(); // Dados das turmas

      const nomeUsuario = localStorage.getItem("nomeUsuario"); // Obtém o nome do instrutor
      if (!nomeUsuario) {
          throw new Error("Nome do usuário não encontrado no localStorage");
      }

      // Filtra turmas onde o instrutor seja o usuário logado
      const turmasFiltradas = Object.fromEntries(
          Object.entries(turmas).filter(([_, turma]) => turma.instrutor === nomeUsuario)
      );

      const selectElement = document.getElementById("turma-select");
      selectElement.innerHTML = ""; // Limpa opções anteriores

      // Adiciona a opção inicial
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Escolha sua turma";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      selectElement.appendChild(defaultOption);

      // Preenche o dropdown com as turmas filtradas
      for (const nomeTurma in turmasFiltradas) {
          const option = document.createElement("option");
          option.value = nomeTurma;
          option.textContent = nomeTurma;
          selectElement.appendChild(option);
      }

      // Armazena os dados das turmas globalmente
      window.turmas = turmasFiltradas;
      window.presencaDados = [];
  } catch (error) {
  }
}

function obterListaDeAlunos(turmaSelecionada) {
  const turma = window.turmas[turmaSelecionada]; // Acesse diretamente a turma pela chave "nome"
  if (turma && turma.alunos) {
      return turma.alunos;
  } else {
      return [];
  }
}

// Função para salvar os dados de presença e notas com data
// Função para salvar os dados de presença e notas com data
async function salvarDados() {
  const turmaSelecionada = document.getElementById("turma-select").value;
  const dataChamada = document.getElementById("data-chamada").value;
  const alunos = document.querySelectorAll("#alunos-list tr");

  if (!dataChamada) {
    exibirMensagem("Por favor, selecione a data da chamada.", true);
    return;
  }

  try {
    // Verificar se já existe um diário salvo para essa data e turma
    const responseVerificacao = await fetch("https://hub-orcin.vercel.app/dados-presenca");
    
    if (!responseVerificacao.ok) {
      throw new Error("Erro ao verificar dados de presença existentes");
    }

    const diariosSalvos = await responseVerificacao.json();

    // ✅ Verifica se a turma selecionada está presente no objeto retornado
    if (!(turmaSelecionada in diariosSalvos)) {
    } else {
      const registrosDaTurma = diariosSalvos[turmaSelecionada]; // Pega os registros da turma

      if (!Array.isArray(registrosDaTurma)) {
        throw new Error("Os dados da turma não estão no formato esperado!");
      }

      // Converte dataChamada para o mesmo formato da API (YYYY-MM-DD)
      const dataChamadaFormatada = ajustarDataParaLocal(dataChamada);

      // Verifica se já existe um registro com a mesma data
      const diarioExistente = registrosDaTurma.some(
        (registro) => registro.data.split("T")[0] === dataChamadaFormatada
      );

      if (diarioExistente) {
        exibirMensagem("Já existe um diário salvo para essa turma e data!", true);
        return; // Impede que os dados sejam salvos novamente
      }
    }

    // Se não houver um diário salvo para essa data, continua com o processo
    const dados = {
      turma: turmaSelecionada,
      data: dataChamada,
      alunos: Array.from(alunos).map((aluno) => ({
        nome: aluno.querySelector("td:first-child").textContent,
        presenca: aluno.querySelector(".presenca-check").checked
          ? "Presente"
          : "Ausente",
        nota: aluno.querySelector(".nota-select").value,
        observacao: aluno.querySelector(".observacao-input").value || "", // Captura a observação
      })),
    };

    const response = await fetch("https://hub-orcin.vercel.app/salvar-presenca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      exibirMensagem("Chamada salva com sucesso!", false, () => resetarCampos());
    } else {
      exibirMensagem("Erro ao salvar os dados!", true);
    }
  } catch (error) {
    exibirMensagem("Erro ao enviar os dados!", true);
  }
}





function obterListaDeAlunos(turmaSelecionada) {
  const turma = window.turmas[turmaSelecionada]; // Acesse diretamente a turma pela chave "nome"
  if (turma && turma.alunos) {
    return turma.alunos;
  } else {
    return [];
  }
}

function resetarCampos() {
  document.getElementById("turma-select").value = "";
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
  const turmaSelecionada = document.getElementById("turma-select").value;
  const alunosList = document.getElementById("alunos-list");
  alunosList.innerHTML = ""; // Limpa a lista de alunos

  document.getElementById(
    "turma-selecionada"
  ).innerText = `Turma: ${turmaSelecionada}`;
  document.getElementById("turma-selecionada").classList.remove("hidden");
  document.getElementById("alunos-container").classList.remove("hidden");
  document.getElementById("salvar-btn").classList.remove("hidden");

  const alunos = obterListaDeAlunos(turmaSelecionada);

  if (alunos.length === 0) {
    alert("Nenhum aluno encontrado para esta turma.");
    return;
  }

  alunos.sort();

  alunos.forEach((aluno) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${aluno}</td>
            <td>
                <label>
                    <input type="checkbox" class="presenca-check"> Presente
                </label>
            </td>
            <td>
                <select class="nota-select">
                    <option value="0">Nota</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </td>
                        <td>
                <input type="text" class="observacao-input" placeholder="Digite uma observação">
            </td>
        `;
    alunosList.appendChild(row);
  });
}

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

    const token = getTokenFromCookie();
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "/Login/login.html";
        return;
    }

    // Função para carregar perfil do usuário logado
    async function carregarPerfil() {
        try {
        const response = await fetch("https://hub-orcin.vercel.app/perfil", {
            headers: { Authorization: token },
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar os dados do perfil");
        }

        const data = await response.json();

        // Atualiza os elementos do HTML com os dados do usuário
        document.getElementById("profile-photo").src =
            data.photo || "/projeto/Imagens/perfil.png";
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
window.onload = async function() {
  await obterNomeUsuario();
  await carregarTurmas(); // Mantendo a função original

  // Adiciona evento de mudança para atualizar os alunos ao selecionar a turma
  document.getElementById("turma-select").addEventListener("change", () => {
      const turmaSelecionada = document.getElementById("turma-select").value;
      const alunos = obterListaDeAlunos(turmaSelecionada);
  });
};
