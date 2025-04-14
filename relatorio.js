function formatarDataParaExibicao(dataISO) {
  if (!dataISO) return "Data inválida";
  const data = new Date(dataISO);
  
  // Ajusta para o horário local
  data.setMinutes(data.getMinutes() + data.getTimezoneOffset());

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0'); // +1 pois os meses começam do 0
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
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
          //🚭Como era na Vercel
            const response = await fetch("https://hub-orcin.vercel.app/perfil",
            //🚭Como é localmente
            //const response = await fetch("http://localhost:3000/perfil",
              {
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
          window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
      }
      } catch (error) {

      }
  }
  verificarAcessoRestrito();

});

async function obterNomeUsuario() {
  try {
      const email = localStorage.getItem("email"); // Obtém o email armazenado
      if (!email) {
          throw new Error("Nenhum email encontrado no localStorage");
      }

      //🚭Como era na Vercel
            const response = await fetch("https://hub-orcin.vercel.app/usuarios");
            //🚭Como é localmente
            //const response = await fetch("http://localhost:3000/usuarios");// Chama a API
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
      //🚭Como era na Vercel
            //const response = await fetch("https://hub-orcin.vercel.app/dados);
            //🚭Como é localmente
            const response = await fetch("http://localhost:3000/dados");// Requisição ao backend
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

// Evento ao selecionar uma turma
document
  .getElementById("turma-select")
  .addEventListener("change", async function () {
    const turmaSelecionada = this.value;
    const alunoSelect = document.getElementById("aluno-select");
    alunoSelect.innerHTML =
      '<option value="" disabled selected>Escolha um aluno</option>';

    try {
      const response = await fetch("/dados");
      if (!response.ok) throw new Error("Erro ao buscar os alunos.");
      const turmas = await response.json();
      const alunos =
        turmas[turmaSelecionada] && turmas[turmaSelecionada].alunos
          ? turmas[turmaSelecionada].alunos
          : [];

      if (alunos.length === 0) {
        alunoSelect.innerHTML =
          "<option disabled>Nenhum aluno encontrado</option>";
        alunoSelect.disabled = true;
        return;
      }

      alunos.sort((a, b) => a.localeCompare(b))

      alunos.forEach((aluno) => {
        const option = document.createElement("option");
        option.value = aluno;
        option.textContent = aluno;
        alunoSelect.appendChild(option);
      });

      alunoSelect.disabled = false;
    } catch (error) {
      console.error("Erro ao carregar os alunos:", error);
    }
  });

// Evento ao selecionar um aluno
// Evento ao selecionar um aluno
document
  .getElementById("aluno-select")
  .addEventListener("change", async function () {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const alunoSelecionado = this.value;

    let mensagemAviso = document.getElementById("msg-erro");
    const graficosContainer = document.getElementById("graficos-aluno-container");
    const botaoRelatorio = document.getElementById("exportar-relatorio");

    try {
      const notasResponse = await fetch("/notasavaliacoes");
      const presencaResponse = await fetch("/dados-presenca");

      if (!notasResponse.ok || !presencaResponse.ok)
        throw new Error("Erro ao buscar dados de notas ou presença.");

      const notasData = await notasResponse.json();
      const presencaData = await presencaResponse.json();

      const notasAluno = notasData[turmaSelecionada]
        ? notasData[turmaSelecionada].filter(
            (avaliacao) => avaliacao.aluno === alunoSelecionado
          ).map((avaliacao) => parseFloat(avaliacao.nota) || 0)
        : [];

      const presencasTurma = presencaData[turmaSelecionada] || [];
      const presencasAluno = presencasTurma.filter(
        (p) => p.aluno === alunoSelecionado
      );

      if (notasAluno.length === 0 && presencasAluno.length === 0) {
        mensagemAviso.textContent = "Nenhuma nota ou presença registrada para o aluno selecionado.";
        mensagemAviso.style.display = "block";

        graficosContainer?.classList.add("hidden");
        botaoRelatorio?.classList.add("hidden");
        return;
      } else {
        mensagemAviso.style.display = "none";
        botaoRelatorio?.classList.remove("hidden");
      }

      const datasAulas = presencasAluno.map((p) => {
        const data = new Date(p.data);
        return `${data.getDate().toString().padStart(2, "0")}/${(
          data.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${data.getFullYear()}`;
      });

      const statusPresencas = presencasAluno.map((p) =>
        p.presenca === "Presente" ? 1 : 0
      );

      criarGraficoNotasAluno(notasAluno);
      criarGraficoPresencaData(datasAulas, statusPresencas);
      criarGraficoNotasTodasAulas(presencasAluno, alunoSelecionado);

      graficosContainer?.classList.remove("hidden");
    } catch (error) {
      console.error("Erro ao carregar os gráficos do aluno:", error);
      mensagemAviso.textContent = "Erro ao carregar os dados do aluno.";
      mensagemAviso.style.display = "block";
      graficosContainer?.classList.add("hidden");
      botaoRelatorio?.classList.add("hidden");
    }
  });

// Função para ocultar e zerar gráficos ao modificar qualquer campo de entrada
document.querySelectorAll("input, select").forEach((element) => {
  element.addEventListener("input", () => {
    const graficosContainer = document.getElementById("graficos-aluno-container");
    const botaoRelatorio = document.getElementById("exportar-relatorio");
    if (graficosContainer && !graficosContainer.classList.contains("hidden")) {
      graficosContainer.classList.add("hidden");
      botaoRelatorio?.classList.add("hidden");
      
      // Zerar gráficos
      if (window.graficoNotasAluno) {
        window.graficoNotasAluno.destroy();
        window.graficoNotasAluno = null;
      }
      if (window.graficoPresencaAula) {
        window.graficoPresencaAula.destroy();
        window.graficoPresencaAula = null;
      }
      if (window.graficoDesempenhoAula) {
        window.graficoDesempenhoAula.destroy();
        window.graficoDesempenhoAula = null;
      }
    }
  });
});






// Função para criar gráfico com todas as notas do aluno (incluindo somaNotasPresenca)
function criarGraficoNotasTodasAulas(presencasAluno, alunoSelecionado) {
  const ctxDesempenhoAula = document
    .getElementById("grafico-desempenho-aula")
    .getContext("2d");

  // const labels = presencasAluno.map((aula) => {
  //   const data = new Date(aula.data);
  //   return `${data.getDate().toString().padStart(2, "0")}/${(
  //     data.getMonth() + 1
  //   )
  //     .toString()
  //     .padStart(2, "0")}/${data.getFullYear()}`;
  // });

  const labels = presencasAluno.map((p) => formatarDataParaExibicao(p.data));

  const notas = presencasAluno.map((aula) => parseFloat(aula.nota) || 0);
  const presencas = presencasAluno.map((aula) =>
    aula.presenca === "Presente" ? 1 : 0
  );
  const cores = presencas.map((p) =>
    p === 1 ? "rgb(0, 123, 255)" : "rgb(255, 0, 55)"
  );

  if (window.graficoDesempenhoAula) window.graficoDesempenhoAula.destroy();

  window.graficoDesempenhoAula = new Chart(ctxDesempenhoAula, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Notas de ${alunoSelecionado} nas Aulas`,
          data: notas,
          backgroundColor: "rgba(0, 142, 237, 0.7)",
          borderColor: "#36a2eb",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 5 },
      },
    },
  });
}

// Função para criar gráfico de presença por data
function criarGraficoPresencaData(labels, presencas) {
  const ctxPresencaAula = document
    .getElementById("grafico-presenca-aula")
    .getContext("2d");

  // Configura as cores com base no status de presença
  const cores = presencas.map((p) =>
    p === 1 ? "rgb(0, 123, 255)" : "rgb(255, 0, 55)"
  );

  if (window.graficoPresencaAula) window.graficoPresencaAula.destroy();

  window.graficoPresencaAula = new Chart(ctxPresencaAula, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Presença e Ausência",
          data: presencas.map(() => 1), // Todas as barras terão o mesmo valor (1)
          backgroundColor: cores, // Define as cores para cada barra
          borderColor: cores,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Datas das Aulas",
          },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          min: 0,
          max: 1, // Mantém o eixo Y de 0 a 1
          ticks: {
            display: false, // Remove os números do eixo Y, já que todas as barras têm o mesmo tamanho
          },
        },
      },
      plugins: {
        legend: {
          display: true, // Mostra o rótulo da legenda
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              context.raw === 1
                ? context.dataset.backgroundColor[context.dataIndex] ===
                  "rgb(0, 123, 255)"
                  ? "Presente"
                  : "Ausente"
                : "",
          },
        },
      },
    },
  });
}

// Função para criar gráfico de notas do aluno
function criarGraficoNotasAluno(notas) {
  if (window.graficoNotasAluno) window.graficoNotasAluno.destroy();
  const ctxNotasAluno = document
    .getElementById("grafico-notas-aluno")
    .getContext("2d");

  window.graficoNotasAluno = new Chart(ctxNotasAluno, {
    type: "bar",
    data: {
      labels: notas.map((_, index) => `Prova ${index + 1}`),
      datasets: [
        {
          label: "Notas das Avaliações",
          data: notas,
          backgroundColor: "rgb(0, 142, 237)",
          borderColor: "#36a2eb",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 5 },
      },
    },
  });
}

// Função para exportar relatório em PDF
async function exportarRelatorioPDF() {
  const turmaNome = document.getElementById("turma-select").value.trim();
  const alunoSelecionado = document.getElementById("aluno-select").value.trim();

  if (!turmaNome || !alunoSelecionado) {
    alert("Selecione uma turma e um aluno para exportar o relatório.");
    return;
  }

  const doc = new jspdf.jsPDF("p", "mm", "a4");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Relatório de Desempenho - Turma: ${turmaNome}`, 10, 20);
  doc.setFontSize(14);
  doc.text(`Aluno: ${alunoSelecionado}`, 10, 30);

  let yOffset = 40;

  try {
    // **Buscar dados diretamente do backend**
    const [presencaResponse, notasResponse] = await Promise.all([
      fetch(
        `/dados-presenca?turma=${encodeURIComponent(
          turmaNome
        )}&aluno=${encodeURIComponent(alunoSelecionado)}`
      ),
      fetch(
        `/notasavaliacoes?turma=${encodeURIComponent(
          turmaNome
        )}&aluno=${encodeURIComponent(alunoSelecionado)}`
      ),
    ]);

    if (!presencaResponse.ok || !notasResponse.ok) {
      throw new Error("Erro ao buscar os dados do backend.");
    }

    const presencaData = await presencaResponse.json();
    const notasData = await notasResponse.json();

    // **Filtrar registros válidos**
    const registrosFiltradosPresenca =
      presencaData[turmaNome]?.filter(
        (registro) => registro.aluno === alunoSelecionado
      ) || [];
    const registrosFiltradosNotas =
      notasData[turmaNome]?.filter(
        (registro) => registro.aluno === alunoSelecionado
      ) || [];

    if (registrosFiltradosPresenca.length === 0) {
      alert("Nenhum registro de presença encontrado para esse aluno.");
    }

    if (registrosFiltradosNotas.length === 0) {
      alert("Nenhum registro de notas encontrado para esse aluno.");
    }

    // **Tabela de Notas das Avaliações**
    if (registrosFiltradosNotas.length > 0) {
      doc.setFontSize(12);
      doc.text("Notas das Avaliações:", 10, yOffset);
      yOffset += 10;

      const tabelaNotasAvaliacao = registrosFiltradosNotas.map((nota) => [
        nota.nomeAvaliacao,
        nota.nota,
      ]);

      doc.autoTable({
        startY: yOffset,
        head: [["Avaliação", "Nota"]],
        body: tabelaNotasAvaliacao,
        theme: "grid",
      });

      yOffset = doc.previousAutoTable.finalY + 10;
    }

    // **Tabela de Resumo de Presenças**
    if (registrosFiltradosPresenca.length > 0) {
      let totalPresencas = 0;
      let totalFaltas = 0;
      let somaNotasAulasPresentes = 0;

      registrosFiltradosPresenca.forEach((registro) => {
        if (registro.presenca === "Presente") {
          totalPresencas++;
          somaNotasAulasPresentes += parseFloat(registro.nota) || 0;
        } else {
          totalFaltas++;
        }
      });

      const mediaNotasAulasPresentes =
        somaNotasAulasPresentes / (totalPresencas || 1);

      doc.setFontSize(12);
      doc.text("Resumo do Desempenho:", 10, yOffset);
      yOffset += 10;

      doc.autoTable({
        startY: yOffset,
        head: [["Indicador", "Valor"]],
        body: [
          ["Total de Presenças", totalPresencas],
          ["Total de Faltas", totalFaltas],
          [
            "Média das Notas nas Aulas Presentes",
            mediaNotasAulasPresentes.toFixed(2),
          ],
        ],
        theme: "grid",
      });

      yOffset = doc.previousAutoTable.finalY + 10;
    }

    // **Tabela de Presenças e Notas por Aula**
    if (registrosFiltradosPresenca.length > 0) {
      const tabelaPresencaDesempenho = registrosFiltradosPresenca.map(
        (registro) => [
            formatarDataParaExibicao(registro.data),
            registro.presenca,
            registro.nota || "-",
        ]
      );

      doc.setFontSize(12);
      doc.text("Presenças e Desempenho por Aula:", 10, yOffset);
      yOffset += 10;

      doc.autoTable({
        startY: yOffset,
        head: [["Data", "Presença", "Nota"]],
        body: tabelaPresencaDesempenho,
        theme: "grid",
      });

      yOffset = doc.previousAutoTable.finalY + 10;
    }

    // **Incluir gráficos no PDF**
    const graficoNotasCanvas = document.getElementById("grafico-notas-aluno");
    const graficoPresencaCanvas = document.getElementById(
      "grafico-presenca-aula"
    );
    const graficoDesempenhoCanvas = document.getElementById(
      "grafico-desempenho-aula"
    );

    if (graficoNotasCanvas) {
      const graficoNotasImg = graficoNotasCanvas.toDataURL("image/png", 1.0);
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Gráfico de Notas das Avaliações:", 10, 20);
      doc.addImage(graficoNotasImg, "PNG", 10, 30, 190, 90);
    }

    if (graficoPresencaCanvas) {
      const graficoPresencaImg = graficoPresencaCanvas.toDataURL(
        "image/png",
        1.0
      );
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Gráfico de Presenças:", 10, 20);
      doc.addImage(graficoPresencaImg, "PNG", 10, 30, 190, 90);
    }

    if (graficoDesempenhoCanvas) {
      const graficoDesempenhoImg = graficoDesempenhoCanvas.toDataURL(
        "image/png",
        1.0
      );
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Gráfico de Desempenho por Aula:", 10, 20);
      doc.addImage(graficoDesempenhoImg, "PNG", 10, 30, 190, 90);
    }

    // Tabela de observações
    if (registrosFiltradosPresenca.length > 0) {
      doc.addPage();
      const tabelaPresencaDesempenho = registrosFiltradosPresenca.map(
        (registro) => [
          new Date(registro.data).toLocaleDateString("pt-BR"),
          registro.observacao || "-",
        ]
      );

      doc.setFontSize(14);
      doc.text("Observações por Aula:", 10, 20);

      doc.autoTable({
        startY: 30, // Define que a tabela começa 5mm abaixo do texto
        head: [["Data", "Observação"]],
        body: tabelaPresencaDesempenho,
        theme: "grid",
      });
    }

    // **Salvar PDF**
    doc.save(`Relatorio_Turma_${turmaNome}_${alunoSelecionado}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar o relatório:", error);
  }
}

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

// Adiciona evento de clique no botão de exportação
document
  .getElementById("exportar-relatorio")
  .addEventListener("click", exportarRelatorioPDF);

// Carregar as turmas ao abrir a página
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



