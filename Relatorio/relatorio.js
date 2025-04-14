async function carregarTurmas(instrutorFiltrado = null) {
  try {
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/dados"); 
    //🚭Como é localmente
    //const response = await fetch("http://localhost:3000/dados");
    if (!response.ok) throw new Error("Erro ao buscar as turmas");

    const turmas = await response.json();
    const tipoUsuario = localStorage.getItem("tipoUsuario");
    const nomeUsuario = localStorage.getItem("nomeUsuario");

    // Verifica se é coordenador e se um instrutor foi passado
    const filtroInstrutor = tipoUsuario === "Coordenador" && instrutorFiltrado
      ? instrutorFiltrado
      : nomeUsuario;

    const turmasFiltradas = Object.entries(turmas)
      .filter(([_, turma]) => turma.instrutor === filtroInstrutor)
      .map(([nomeTurma]) => nomeTurma);

    const turmaSelects = ["turma-select", "turma-turma-select"].map(id =>
      document.getElementById(id)
    );

    turmaSelects.forEach(select => {
      select.innerHTML = '<option value="" disabled selected>Escolha uma turma</option>';
      turmasFiltradas.forEach(nomeTurma => {
        const option = document.createElement("option");
        option.value = nomeTurma;
        option.textContent = nomeTurma;
        select.appendChild(option);
      });
    });
  } catch (error) {
    console.error("Erro ao carregar turmas:", error);
  }
}


document.addEventListener("DOMContentLoaded", () => {

  const conteinerOpcao = document.getElementById("conteinerOpcao");
  const relatorioAlunoContainer = document.getElementById("relatorio-aluno-container");
  const conteinerTurma = document.getElementById("conteinerTurma");
  const relatorioTurmaContainer = document.getElementById("relatorio-turma-container");

  relatorioAlunoContainer.classList.add("hidden");
  conteinerTurma.classList.add("hidden");

  document.getElementById("relatorio-aluno-btn").addEventListener("click", () => {
    relatorioAlunoContainer.classList.remove("hidden");
    conteinerTurma.classList.add("hidden");
    conteinerOpcao.classList.add("hidden");
  });

  document.getElementById("relatorio-turma-btn").addEventListener("click", () => {
    conteinerTurma.classList.remove("hidden");
    relatorioAlunoContainer.classList.add("hidden");
    conteinerOpcao.classList.add("hidden");
  });



  async function gerarRelatorioTurma() {
    const turmaSelecionada = document.getElementById("turma-turma-select").value;
    if (!turmaSelecionada) {
        alert("Selecione uma turma!");
        return;
    }

    try {
        const [presencaResponse, notasResponse] = await Promise.all([
            fetch("/dados-presenca"),
            fetch("/notasavaliacoes")
        ]);

        if (!presencaResponse.ok || !notasResponse.ok) {
            throw new Error("Erro ao buscar dados");
        }

        const presencaData = await presencaResponse.json();
        const notasData = await notasResponse.json();

        const alunos = presencaData[turmaSelecionada] || [];

        if (alunos.length === 0) {
            alert("Nenhum dado encontrado para essa turma!");
            return;
        }

        // Criando um objeto para armazenar os dados por aluno
        const dadosAlunos = {};

        // let totalPresencas = 0;

        alunos.forEach(aluno => {
            if (!dadosAlunos[aluno.aluno]) {
                dadosAlunos[aluno.aluno] = {
                    totalPresencas: 0,
                    totalAulas: 0,
                    somaNotasAulas: 0,
                    totalNotasAulas: 0,
                    somaNotasAvaliacoes: 0,
                    totalNotasAvaliacoes: 0,
                    somaNotasAulasPresentes: 0
                };
            }

            // Contabiliza presença
            if (aluno.presenca === "Presente") {
                dadosAlunos[aluno.aluno].totalPresencas++;
                dadosAlunos[aluno.aluno].somaNotasAulasPresentes += parseFloat(aluno.nota) || 0;
                
                // Soma apenas notas das aulas em que o aluno esteve presente
                if (aluno.nota) {
                    dadosAlunos[aluno.aluno].somaNotasAulas += parseFloat(aluno.nota);
                    dadosAlunos[aluno.aluno].totalNotasAulas++;
                }
            }

            dadosAlunos[aluno.aluno].totalAulas++;
        });

        // registrosFiltradosPresenca.forEach((registro) => {
        //   if (registro.presenca === "Presente") {
        //     totalPresencas++;
        //     somaNotasAulasPresentes += parseFloat(registro.nota) || 0;
        //   } else {
        //     totalFaltas++;
        //   }
        // });

        // Processa as notas das avaliações
        if (notasData[turmaSelecionada]) {
            notasData[turmaSelecionada].forEach(nota => {
                if (dadosAlunos[nota.aluno]) {
                    dadosAlunos[nota.aluno].somaNotasAvaliacoes += parseFloat(nota.nota) || 0;
                    dadosAlunos[nota.aluno].totalNotasAvaliacoes++;
                }
            });
          }

        // Limpa a tabela antes de preenchê-la
        const tabelaBody = document.querySelector("#tabela-relatorio-turma tbody");
        tabelaBody.innerHTML = "";

        Object.keys(dadosAlunos).forEach(nomeAluno => {
            const alunoData = dadosAlunos[nomeAluno];

            const mediaPresenca = alunoData.totalAulas > 0 ? (alunoData.totalPresencas / alunoData.totalAulas) * 100 : 0;
            const mediaNotasAulas = alunoData.totalNotasAulas > 0 ? (alunoData.somaNotasAulas / alunoData.totalPresencas) : 0;
            const mediaNotasAvaliacoes = alunoData.totalNotasAvaliacoes > 0 ? (alunoData.somaNotasAvaliacoes / alunoData.totalNotasAvaliacoes) : 0;

            const row = tabelaBody.insertRow();
            row.insertCell(0).textContent = nomeAluno;
            row.insertCell(1).textContent = `${mediaPresenca.toFixed(1)}%`;
            row.insertCell(2).textContent = mediaNotasAulas.toFixed(2);
            row.insertCell(3).textContent = mediaNotasAvaliacoes.toFixed(2);
        });

        relatorioTurmaContainer.classList.remove("hidden");

    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
    }
}



  document.getElementById("gerar-relatorio-turma").addEventListener("click", gerarRelatorioTurma);

  carregarTurmas();

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
    //if (tipoUsuario === 'Coordenador') {
      //  window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
    //}
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
   //const response = await fetch("http://localhost:3000/usuarios");
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
    data.setDate(data.getDate() + 1); // Ajuste para corrigir a exibição errada
    return `${data.getDate().toString().padStart(2, "0")}/${(data.getMonth() + 1).toString().padStart(2, "0")}/${data.getFullYear()}`;
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

  const labels = presencasAluno.map((aula) => {
    if (!aula.data) return "Data Inválida"; // Caso a data esteja vazia
  
    const data = new Date(aula.data);
    
    if (isNaN(data.getTime())) {
      console.error("Erro ao processar data:", aula.data);
      return "Data Inválida";
    }
  
    data.setDate(data.getDate() + 1); // Ajuste para corrigir o problema de deslocamento
  
    return `${data.getDate().toString().padStart(2, "0")}/${(data.getMonth() + 1).toString().padStart(2, "0")}/${data.getFullYear()}`;
  });  

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
// Função para exportar relatório em PDF do aluno
async function exportarRelatorioPDF() {
  const turmaNome = document.getElementById("turma-select").value.trim();
  const alunoSelecionado = document.getElementById("aluno-select").value.trim();

  if (!turmaNome || !alunoSelecionado) {
      alert("Selecione uma turma e um aluno para exportar o relatório.");
      return;
  }

  try {
      // Buscar os dados necessários
      const [turmasResponse, presencaResponse, notasResponse, unidadesResponse] = await Promise.all([
          fetch("/dados"),  // Agora retorna unidade_id corretamente
          fetch(`/dados-presenca?turma=${encodeURIComponent(turmaNome)}&aluno=${encodeURIComponent(alunoSelecionado)}`),
          fetch(`/notasavaliacoes?turma=${encodeURIComponent(turmaNome)}&aluno=${encodeURIComponent(alunoSelecionado)}`),
          fetch("/unidades")  // Nova requisição para buscar os nomes das unidades
      ]);

      if (!turmasResponse.ok || !presencaResponse.ok || !notasResponse.ok || !unidadesResponse.ok) {
          throw new Error("Erro ao buscar os dados do backend.");
      }

      const turmasData = await turmasResponse.json();
      const presencaData = await presencaResponse.json();
      const notasData = await notasResponse.json();
      const unidadesData = await unidadesResponse.json(); // Agora temos um mapeamento id -> unidade

      // Obter `unidade_id` da turma
      const unidadeId = turmasData[turmaNome]?.unidade_id || "Não disponível";

      // Obter o nome da unidade correspondente ao `unidade_id`
      const nomeUnidade = unidadesData[unidadeId] || "Unidade não encontrada";

      const registrosFiltradosPresenca = presencaData[turmaNome]?.filter(
          (registro) => registro.aluno === alunoSelecionado
      ) || [];

      const registrosFiltradosNotas = notasData[turmaNome]?.filter(
          (registro) => registro.aluno === alunoSelecionado
      ) || [];

      if (registrosFiltradosPresenca.length === 0) {
          alert("Nenhum registro de presença encontrado para esse aluno.");
      }

      /* Condição para ausência de notas para o Aluno
      if (registrosFiltradosNotas.length === 0) {
          alert("Nenhum registro de notas encontrado para esse aluno.");
      }*/

      const doc = new jspdf.jsPDF("p", "mm", "a4");
      doc.setFont("helvetica", "bold");

      // Adicionando o nome da unidade no topo do relatório
      doc.setFontSize(16);
      doc.text(`Unidade: ${nomeUnidade}`, 10, 10);

      doc.setFontSize(14);
      doc.text(`Relatório de Desempenho - Turma: ${turmaNome}`, 10, 20);
      doc.setFontSize(14);
      doc.text(`Aluno: ${alunoSelecionado}`, 10, 30);

      let yOffset = 40;

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

          const mediaNotasAulasPresentes = somaNotasAulasPresentes / (totalPresencas || 1);

          doc.setFontSize(12);
          doc.text("Resumo do Desempenho:", 10, yOffset);
          yOffset += 10;

          doc.autoTable({
              startY: yOffset,
              head: [["Indicador", "Valor"]],
              body: [
                  ["Total de Presenças", totalPresencas],
                  ["Total de Faltas", totalFaltas],
                  ["Média das Notas nas Aulas Presentes", mediaNotasAulasPresentes.toFixed(2)],
              ],
              theme: "grid",
          });

          yOffset = doc.previousAutoTable.finalY + 10;
      }

      // **Tabela de Presenças e Notas por Aula**
      if (registrosFiltradosPresenca.length > 0) {
          const tabelaPresencaDesempenho = registrosFiltradosPresenca.map((registro) => {
              if (!registro.data) return ["Data Inválida", registro.presenca, registro.nota, registro.conteudoAula || "-"];

              const data = new Date(registro.data);

              if (isNaN(data.getTime())) {
                  console.error("Erro ao processar data para PDF:", registro.data);
                  return ["Data Inválida", registro.presenca, registro.nota,registro.conteudoAula || "-"];
              }

              data.setDate(data.getDate() + 1);

              const dataFormatada = `${data.getDate().toString().padStart(2, "0")}/${(data.getMonth() + 1).toString().padStart(2, "0")}/${data.getFullYear()}`;

              return [dataFormatada, registro.presenca, registro.nota, registro.conteudoAula || "-"];
          });

          doc.setFontSize(12);
          doc.text("Presenças e Desempenho por Aula:", 10, yOffset);
          yOffset += 10;

          doc.autoTable({
              startY: yOffset,
              head: [["Data", "Presença", "Nota", "Conteúdo da Aula"]],
              body: tabelaPresencaDesempenho,
              theme: "grid",
          });

          yOffset = doc.previousAutoTable.finalY + 10;
      }

      // **Salvar PDF**
      doc.save(`Relatorio_Turma_${turmaNome}_${alunoSelecionado}.pdf`);
  } catch (error) {
      console.error("Erro ao gerar o relatório:", error);
  }
}

// Atualizar o evento do botão para incluir essa versão corrigida
document.getElementById("exportar-relatorio").addEventListener("click", exportarRelatorioPDF);


// Função para exportar relatório em PDF
async function exportarRelatorioTurmaPDF() {
  const turmaNome = document.getElementById("turma-turma-select").value.trim();

  if (!turmaNome) {
      alert("Selecione uma turma para exportar o relatório.");
      return;
  }

  try {
      const [turmasResponse, presencaResponse, notasResponse, unidadesResponse] = await Promise.all([
          fetch("/dados"),
          fetch(`/dados-presenca?turma=${encodeURIComponent(turmaNome)}`),
          fetch(`/notasavaliacoes?turma=${encodeURIComponent(turmaNome)}`),
          fetch("/unidades")
      ]);

      if (!turmasResponse.ok || !presencaResponse.ok || !notasResponse.ok || !unidadesResponse.ok) {
          throw new Error("Erro ao buscar os dados do backend.");
      }

      const turmasData = await turmasResponse.json();
      const presencaData = await presencaResponse.json();
      const notasData = await notasResponse.json();
      const unidadesData = await unidadesResponse.json();

      const unidadeId = turmasData[turmaNome]?.unidade_id || "Não disponível";
      const nomeUnidade = unidadesData[unidadeId] || "Unidade não encontrada";

      const alunosPresenca = presencaData[turmaNome] || [];
      const alunosNotas = notasData[turmaNome] || [];

      const doc = new jspdf.jsPDF("p", "mm", "a4");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Unidade: ${nomeUnidade}`, 10, 10);
      doc.setFontSize(14);
      doc.text(`Relatório de Desempenho da Turma: ${turmaNome}`, 10, 20);

      let yOffset = 40;

      const dadosAlunos = {};

      alunosPresenca.forEach(aluno => {
          if (!dadosAlunos[aluno.aluno]) {
              dadosAlunos[aluno.aluno] = {
                  totalPresencas: 0,
                  totalAulas: 0,
                  somaNotasAulas: 0,
                  totalNotasAulas: 0,
                  somaNotasAvaliacoes: 0,
                  totalNotasAvaliacoes: 0
              };
          }

          if (aluno.presenca === "Presente") {
              dadosAlunos[aluno.aluno].totalPresencas++;
              if (aluno.nota) {
                  dadosAlunos[aluno.aluno].somaNotasAulas += parseFloat(aluno.nota);
                  dadosAlunos[aluno.aluno].totalNotasAulas++;
              }
          }
          dadosAlunos[aluno.aluno].totalAulas++;
      });

      alunosNotas.forEach(nota => {
          if (dadosAlunos[nota.aluno]) {
              dadosAlunos[nota.aluno].somaNotasAvaliacoes += parseFloat(nota.nota) || 0;
              dadosAlunos[nota.aluno].totalNotasAvaliacoes++;
          }
      });

      doc.setFontSize(12);
      doc.text("Informações Gerais da Turma:", 10, yOffset);
      yOffset += 10;

      const tabelaDadosAlunos = Object.keys(dadosAlunos).map(nomeAluno => {
          const alunoData = dadosAlunos[nomeAluno];
          const mediaPresenca = alunoData.totalAulas > 0 ? (alunoData.totalPresencas / alunoData.totalAulas) * 100 : "-";
          const mediaNotasAulas = alunoData.totalNotasAulas > 0 ? (alunoData.somaNotasAulas / alunoData.totalPresencas) : "-";
          const mediaNotasAvaliacoes = alunoData.totalNotasAvaliacoes > 0 ? (alunoData.somaNotasAvaliacoes / alunoData.totalNotasAvaliacoes) : "-";

          return [
              nomeAluno,
              `${mediaPresenca === "-" ? "-" : mediaPresenca.toFixed(1)}%`,
              mediaNotasAulas === "-" ? "-" : mediaNotasAulas.toFixed(2),
              mediaNotasAvaliacoes === "-" ? "-" : mediaNotasAvaliacoes.toFixed(2)
          ];
      });

      doc.autoTable({
          startY: yOffset,
          head: [["Nome do Aluno", "Porcentagem de Presença", "Média de Notas nas Aulas Presentes", "Média nas Avaliações"]],
          body: tabelaDadosAlunos,
          theme: "grid"
      });

      doc.save(`Relatorio_Turma_${turmaNome}.pdf`);
  } catch (error) {
      console.error("Erro ao gerar o relatório:", error);
  }
}



// Atualizar o evento do botão para incluir essa versão corrigida
document.getElementById("exportar-relatorio-turma").addEventListener("click", exportarRelatorioTurmaPDF);

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

async function carregarInstrutoresParaCoordenador() {
  try {
    const nomeCoordenador = localStorage.getItem("nomeUsuario");
     //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/usuarios"); 
    //🚭Como é localmente
    //const response = await fetch("http://localhost:3000/usuarios");
    const usuarios = await response.json();

    const instrutores = usuarios.filter(
      (u) => u.coordenador === nomeCoordenador && u.tipo === "Instrutor"
    );

    const select = document.getElementById("instrutor-select");
    select.innerHTML = '<option value="" disabled selected>Escolha um instrutor</option>';

    instrutores.forEach((instrutor) => {
      const option = document.createElement("option");
      option.value = instrutor.name;
      option.textContent = instrutor.name;
      select.appendChild(option);
    });

    document.getElementById("coordenador-section").style.display = "block";
  } catch (error) {
    console.error("Erro ao carregar instrutores (Aluno):", error);
  }
}

async function carregarInstrutoresParaCoordenadorTurma() {
  try {
    const nomeCoordenador = localStorage.getItem("nomeUsuario");
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/usuarios"); 
    //🚭Como é localmente
    //const response = await fetch("http://localhost:3000/usuarios");
    const usuarios = await response.json();

    const instrutores = usuarios.filter(
      (u) => u.coordenador === nomeCoordenador && u.tipo === "Instrutor"
    );

    const select = document.getElementById("instrutor-select-turma");
    select.innerHTML = '<option value="" disabled selected>Escolha um instrutor</option>';

    instrutores.forEach((instrutor) => {
      const option = document.createElement("option");
      option.value = instrutor.name;
      option.textContent = instrutor.name;
      select.appendChild(option);
    });

    document.getElementById("coordenador-section-turma").style.display = "block";
  } catch (error) {
    console.error("Erro ao carregar instrutores (Turma):", error);
  }
}
window.onload = async function () {
  await obterNomeUsuario();

  const tipoUsuario = localStorage.getItem("tipoUsuario");

  if (tipoUsuario === "Coordenador") {
    await carregarInstrutoresParaCoordenador();         // Mostra seção por Aluno
    await carregarInstrutoresParaCoordenadorTurma();    // Mostra seção por Turma
  }

  await carregarTurmas();

  document.getElementById("turma-select").addEventListener("change", () => {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const alunos = obterListaDeAlunos(turmaSelecionada);
    console.log("Alunos carregados:", alunos);
  });
};

// Relatório por aluno
document.getElementById("instrutor-select").addEventListener("change", async function () {
  const instrutorSelecionado = this.value;
  await carregarTurmas(instrutorSelecionado);
});

// Relatório por turma
document.getElementById("instrutor-select-turma").addEventListener("change", async function () {
  const instrutorSelecionado = this.value;
  await carregarTurmas(instrutorSelecionado);
});


