document.addEventListener("DOMContentLoaded", () => {
  const turmaSelect = document.getElementById("turma-select");
  const avaliacaoSelect = document.getElementById("avaliacao-select");
  const avaliacoesContainer = document.getElementById("avaliacoes-container");

  // Função para formatar a data para o formato dd/mm/yyyy
  function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
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
            console.log("Nome do usuário salvo no localStorage:", usuarioEncontrado.name);
        } else {
            console.warn("Usuário não encontrado");
        }
    } catch (error) {
        console.error("Erro ao obter nome do usuário:", error);
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
        console.error("Erro ao carregar as turmas:", error);
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

  // Carregar avaliações da turma selecionada
  async function carregarAvaliacoes(turma) {
    try {
      const response = await fetch("https://hub-orcin.vercel.app/avaliacoes");
      const avaliacoes = await response.json();

      // Filtra as avaliações pela turma selecionada
      const avaliacoesFiltradas = avaliacoes.filter(
        (avaliacao) => avaliacao.turma === turma
      );

      avaliacaoSelect.innerHTML =
        '<option value="">Selecione uma avaliação</option>';

      if (avaliacoesFiltradas.length === 0) {
        alert(`Nenhuma avaliação encontrada para a turma "${turma}".`);
        return;
      }

      // Preenche as opções de avaliação no dropdown
      avaliacoesFiltradas.forEach((avaliacao) => {
        const option = document.createElement("option");
        const dataFormatada = formatarData(avaliacao.data_avaliacao);
        option.value = avaliacao.nome_avaliacao;
        option.textContent = `${avaliacao.nome_avaliacao} - ${dataFormatada}`;
        avaliacaoSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar as avaliações:", error);
    }
  }

  // Exibir avaliação e suas notas
  async function exibirAvaliacao(turma, avaliacaoNome) {
    try {
        // Requisição para pegar as avaliações
        const responseAvaliacoes = await fetch('https://hub-orcin.vercel.app/avaliacoes');
        const responseNotas = await fetch('https://hub-orcin.vercel.app/notasavaliacoes');
        const avaliacoes = await responseAvaliacoes.json();
        const notasAvaliacao = await responseNotas.json();


        // Encontra a avaliação específica para a turma e nome da avaliação
        const avaliacao = avaliacoes.find(a => a.turma === turma && a.nome_avaliacao === avaliacaoNome);
        console.log("Avaliação encontrada:", avaliacao);

        // Verifica se as notas estão no formato esperado
        const notas = notasAvaliacao[turma]?.filter(n => n.nomeAvaliacao === avaliacaoNome) || [];

        if (!avaliacao || notas.length === 0) {
            avaliacoesContainer.innerHTML = "<p>Avaliação não encontrada ou sem notas.</p>";
            return;
        }

        const tabelaHeader = document.getElementById("tabela-header");
        const tabelaBody = document.getElementById("tabela-notas").querySelector("tbody");

        // Limpa a tabela e oculta o cabeçalho por padrão
        tabelaBody.innerHTML = "";
        tabelaHeader.style.display = "none";

        // Exibe o cabeçalho da tabela
        tabelaHeader.style.display = "table-header-group";

        // Remover duplicatas de alunos, considerando apenas a primeira nota
        const alunosComNotas = [];
        notas.forEach(nota => {
            // Verifica se o aluno já foi adicionado
            if (!alunosComNotas.some(aluno => aluno.aluno === nota.aluno)) {
                alunosComNotas.push(nota);  // Adiciona o aluno com sua primeira nota
            }
        });

        alunosComNotas.sort((a, b) => a.aluno.localeCompare(b.aluno))

        // Popula a tabela com os dados das notas
        alunosComNotas.forEach(nota => {
            const tr = document.createElement("tr");
            const tdAluno = document.createElement("td");
            const tdNota = document.createElement("td");

            tdAluno.textContent = nota.aluno;
            tdNota.textContent = nota.nota === "Não Avaliado" ? "Não Avaliado" : parseFloat(nota.nota).toFixed(1);

            tr.appendChild(tdAluno);
            tr.appendChild(tdNota);
            tabelaBody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao exibir a avaliação:", error);
    }
}


  // Quando a turma for alterada
  turmaSelect.addEventListener("change", () => {
    const turma = turmaSelect.value;
    if (turma) carregarAvaliacoes(turma);
  });

  // Quando a avaliação for alterada
  avaliacaoSelect.addEventListener("change", () => {
    const turma = turmaSelect.value;
    const avaliacao = avaliacaoSelect.value;
    if (turma && avaliacao) exibirAvaliacao(turma, avaliacao);
  });

  // Função para obter o token do cookie
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

  // Carregar o perfil do usuário logado
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
      console.error("Erro ao carregar perfil:", error);
    
    }
  }

  carregarPerfil(); // Carrega o perfil ao carregar a página

  carregarTurmas(); // Carrega as turmas
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
      console.log("Alunos carregados:", alunos);
  });
};
