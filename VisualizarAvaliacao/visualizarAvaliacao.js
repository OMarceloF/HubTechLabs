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

  // Carregar as turmas no dropdown
  async function carregarTurmas() {
    try {
      const response = await fetch("http://localhost:3000/dados");
      if (!response.ok) throw new Error("Erro ao buscar as turmas");
      const turmas = await response.json();

      turmaSelect.innerHTML =
        '<option value="" disabled selected>Escolha uma turma</option>';
      Object.keys(turmas).forEach((nomeTurma) => {
        const option = document.createElement("option");
        option.value = nomeTurma;
        option.textContent = nomeTurma;
        turmaSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar as turmas:", error);
    }
  }

  // Carregar avaliações da turma selecionada
  async function carregarAvaliacoes(turma) {
    try {
      const response = await fetch("http://localhost:3000/avaliacoes");
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
        const responseAvaliacoes = await fetch('http://localhost:3000/avaliacoes');
        const responseNotas = await fetch('http://localhost:3000/notasavaliacoes');
        const avaliacoes = await responseAvaliacoes.json();
        const notasAvaliacao = await responseNotas.json();

        console.log("Avaliações recebidas:", avaliacoes);
        console.log("Notas recebidas:", notasAvaliacao);

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
      const response = await fetch("http://localhost:3000/perfil", {
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
      alert("Erro ao carregar os dados do perfil.");
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