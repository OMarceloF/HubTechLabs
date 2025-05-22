let presencasAlunoGlobal = [];
let notasAlunoGlobal = [];
let alunoSelecionadoGlobal = "";

document.getElementById("aluno-select").addEventListener("change", async function () {
  const turmaSelecionada = document.getElementById("turma-select").value;
  const alunoSelecionado = this.value;

  alunoSelecionadoGlobal = alunoSelecionado;

  const msgErro = document.getElementById("msg-erro");
  const btnExportar = document.getElementById("exportar-relatorio");

  try {
    const [notasRes, presencasRes] = await Promise.all([
      fetch("/notasavaliacoes"),
      fetch("/dados-presenca")
    ]);

    if (!notasRes.ok || !presencasRes.ok) throw new Error("Erro ao buscar dados.");

    const notasData = await notasRes.json();
    const presencaData = await presencasRes.json();

    notasAlunoGlobal = notasData[turmaSelecionada]?.filter(n => n.aluno === alunoSelecionado) || [];
    presencasAlunoGlobal = presencaData[turmaSelecionada]?.filter(p => p.aluno === alunoSelecionado) || [];

    if (!notasAlunoGlobal.length && !presencasAlunoGlobal.length) {
      msgErro.textContent = "Nenhuma nota ou presença registrada para o aluno selecionado.";
      msgErro.style.display = "block";
      btnExportar?.classList.add("hidden");
    } else {
      msgErro.style.display = "none";
      btnExportar?.classList.remove("hidden");
    }

    // NÃO mostra os gráficos ainda

  } catch (err) {
    console.error("Erro ao buscar dados:", err);
    msgErro.textContent = "Erro ao carregar os dados do aluno.";
    msgErro.style.display = "block";
  }
});

async function carregarTurmas(instrutorFiltrado = null) {
  try {
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/dados"); 
    //🚭Como é localmente
    // const response = await fetch("http://localhost:3000/dados");
    if (!response.ok) throw new Error("Erro ao buscar as turmas");

    const turmas = await response.json();
    window.turmas = turmas;
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
function criarDataLocal(dateStr) {
  if (!dateStr) return new Date(NaN);
  // Remover hora se presente
  const base = dateStr.split("T")[0]; // mantém apenas o YYYY-MM-DD
  const [ano, mes, dia] = base.split("-");
  return new Date(ano, mes - 1, dia);
}


function gerarRelatorioTurma() {
  const turmaNome = document.getElementById("turma-turma-select").value.trim();
  const dataInicio = document.getElementById("data-inicio-turma").value;
  const dataFim = document.getElementById("data-fim-turma").value;

  if (!turmaNome) {
    alert("Selecione uma turma.");
    return;
  }

  // carrega dados
  Promise.all([
    fetch("/dados").then(r => r.json()),
    fetch("/dados-presenca").then(r => r.json()),
    fetch("/notasavaliacoes").then(r => r.json())
  ])
    .then(([turmasData, presencaData, notasData]) => {
      const alunosPresenca = presencaData[turmaNome] || [];
      const alunosNotas = notasData[turmaNome] || [];

      const inicio = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim) : null;

      // resumo (sua lógica permanece igual)...
      // ------------------------
      const dadosAlunos = {};
      alunosPresenca.forEach(registro => {
        const dt = criarDataLocal(registro.data);
        if ((inicio && dt < inicio) || (fim && dt > fim)) return;
        if (!dadosAlunos[registro.aluno]) {
          dadosAlunos[registro.aluno] = {
            totalPresencas: 0,
            totalAulas: 0,
            somaNotasAulas: 0,
            totalNotasAulas: 0,
            somaNotasAvaliacoes: 0,
            totalNotasAvaliacoes: 0
          };
        }
        if (registro.presenca === "Presente") {
          dadosAlunos[registro.aluno].totalPresencas++;
          if (registro.nota) {
            dadosAlunos[registro.aluno].somaNotasAulas += parseFloat(registro.nota);
            dadosAlunos[registro.aluno].totalNotasAulas++;
          }
        }
        dadosAlunos[registro.aluno].totalAulas++;
      });
      // 2) agrega avaliações
      alunosNotas.forEach(nota => {
        if (!dadosAlunos[nota.aluno]) return;
        dadosAlunos[nota.aluno].somaNotasAvaliacoes += parseFloat(nota.nota) || 0;
        dadosAlunos[nota.aluno].totalNotasAvaliacoes++;
      });
      // 3) renderiza resumo
      const tbodyResumo = document.querySelector("#tabela-relatorio-turma tbody");
      tbodyResumo.innerHTML = "";
      Object.entries(dadosAlunos).forEach(([nomeAluno, aluno]) => {
        const mediaPresenca = aluno.totalAulas > 0
          ? ((aluno.totalPresencas / aluno.totalAulas) * 100).toFixed(1) + "%"
          : "-";
        const mediaNotasAulas = aluno.totalNotasAulas > 0
          ? (aluno.somaNotasAulas / aluno.totalNotasAulas).toFixed(2)
          : "-";
        const mediaAvals = aluno.totalNotasAvaliacoes > 0
          ? (aluno.somaNotasAvaliacoes / aluno.totalNotasAvaliacoes).toFixed(2)
          : "-";
        const tr = document.createElement("tr");
        tr.innerHTML = `
    <td>${nomeAluno}</td>
    <td>${mediaPresenca}</td>
    <td>${mediaNotasAulas}</td>
    <td>${mediaAvals}</td>
  `;
        tbodyResumo.appendChild(tr);
      });

      // exibe resumo
      document.getElementById("relatorio-turma-container").classList.remove("hidden");

      // ---- pivot detail ----
      const detalheTable = document.getElementById("tabela-detalhe-turma");
      const thead = detalheTable.querySelector("thead");
      const tbody = detalheTable.querySelector("tbody");

      thead.innerHTML = "";
      tbody.innerHTML = "";

      // 1) datas únicas, já filtradas e ordenadas
      const datasUnicas = Array.from(new Set(
        alunosPresenca
          .filter(r => {
            const d = criarDataLocal(r.data);
            return (!inicio || d >= inicio) && (!fim || d <= fim);
          })
          .map(r => criarDataLocal(r.data).toISOString().slice(0, 10))
      )).sort();


      // 2) cabeçalho: Aluno + cada data em DD/MM/YYYY
      const headerRow = document.createElement("tr");
      headerRow.innerHTML = "<th>Aluno</th>" +
        datasUnicas.map(d => {
          const [y, m, dia] = d.split("-");
          return `<th>${dia}/${m}/${y}</th>`;
        }).join("");
      thead.appendChild(headerRow);

      // 3) uma linha por aluno, preenchendo Presente/Ausente
      const alunosUnicos = Array.from(new Set(
        alunosPresenca.map(r => r.aluno)
      )).sort();
      alunosUnicos.forEach(aluno => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${aluno}</td>`;
        datasUnicas.forEach(d => {
          // encontra o registro daquela data
          const reg = alunosPresenca.find(r =>
            r.aluno === aluno &&
            criarDataLocal(r.data).toISOString().slice(0, 10) === d
          );
          tr.innerHTML += `<td>${reg ? reg.presenca : "-"}</td>`;
        });
        tbody.appendChild(tr);
      });

      // garante visibilidade
      detalheTable.parentElement.classList.remove("hidden");
    })
    .catch(err => {
      console.error("Erro ao gerar relatório da turma:", err);
      alert("Erro ao gerar o relatório da turma.");
    });
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
  document.getElementById("relatorio-unidade-btn").addEventListener("click", () => {
    document.getElementById("relatorio-unidade-container").classList.remove("hidden");
    document.getElementById("relatorio-aluno-container").classList.add("hidden");
    document.getElementById("conteinerTurma").classList.add("hidden");
    document.getElementById("conteinerOpcao").classList.add("hidden");
  });



  function gerarRelatorioAluno() {
    const dataInicio = document.getElementById("data-inicio-aluno").value;
    const dataFim = document.getElementById("data-fim-aluno").value;
    const graficosContainer = document.getElementById("graficos-aluno-container");

    if (!alunoSelecionadoGlobal || (!presencasAlunoGlobal.length && !notasAlunoGlobal.length)) {
      alert("Selecione um aluno com dados antes de gerar o relatório.");
      return;
    }

    const inicio = dataInicio ? new Date(dataInicio) : null;
    const fim = dataFim ? new Date(dataFim) : null;

    const presencasFiltradas = presencasAlunoGlobal.filter(p => {
      const data = new Date(p.data);
      return (!inicio || data >= inicio) && (!fim || data <= fim);
    });

    const notasFiltradas = notasAlunoGlobal.map(n => parseFloat(n.nota) || 0);

    if (!presencasFiltradas.length && !notasFiltradas.length) {
      document.getElementById("msg-erro").textContent = "Nenhum dado encontrado no período selecionado.";
      document.getElementById("msg-erro").style.display = "block";
      graficosContainer?.classList.add("hidden");
      return;
    }

    document.getElementById("msg-erro").style.display = "none";

    const datasAulas = presencasFiltradas.map(p => {
      const d = new Date(p.data);
      d.setDate(d.getDate() + 1);
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    });

    const statusPresencas = presencasFiltradas.map(p => p.presenca === "Presente" ? 1 : 0);

    criarGraficoNotasAluno(notasFiltradas);
    criarGraficoPresencaData(datasAulas, statusPresencas);
    criarGraficoNotasTodasAulas(presencasFiltradas, alunoSelecionadoGlobal);

    graficosContainer?.classList.remove("hidden");
    document.getElementById("exportar-relatorio")?.classList.remove("hidden");

  }
  document.getElementById("carregar-relatorio").addEventListener("click", gerarRelatorioAluno);
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

  const token = localStorage.getItem('token');
  //const token = getTokenFromCookie();

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
    // const response = await fetch("http://localhost:3000/usuarios");
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


async function carregarUnidades() {
  try {
    // busca simultânea de unidades e turmas
    const [unidadesRes, turmasRes] = await Promise.all([
      fetch("/unidades"),
      fetch("/dados")
    ]);
    if (!unidadesRes.ok) throw new Error("Erro ao buscar unidades");
    if (!turmasRes.ok) throw new Error("Erro ao buscar turmas");

    const unidadesMap = await unidadesRes.json();     // { "1":"Unid A",... }
    const turmasData = await turmasRes.json();       // { "Turma 1":{unidade_id, instrutor,...}, ... }

    const select = document.getElementById("unidade-select");
    // zera e coloca o placeholder
    select.innerHTML = '<option value="" disabled selected>Escolha uma unidade</option>';

    const tipoUsuario = localStorage.getItem("tipoUsuario");
    const nomeUsuario = localStorage.getItem("nomeUsuario");

    let unidadeIds = [];

    if (tipoUsuario === "Instrutor") {
      // só as unidades onde este instrutor dá aula
      unidadeIds = [...new Set(
        Object.values(turmasData)
          .filter(t => t.instrutor === nomeUsuario)
          .map(t => t.unidade_id)
      )];
    }
    else if (tipoUsuario === "Coordenador") {
      // pega todos os instrutores deste coordenador
      const usuariosRes = await fetch("http://localhost:3000/usuarios");
      if (!usuariosRes.ok) throw new Error("Erro ao buscar usuários");
      const usuarios = await usuariosRes.json();
      const instrutores = usuarios
        .filter(u => u.coordenador === nomeUsuario && u.tipo === "Instrutor")
        .map(u => u.name);
      // só as unidades onde esses instrutores dão aula
      unidadeIds = [...new Set(
        Object.values(turmasData)
          .filter(t => instrutores.includes(t.instrutor))
          .map(t => t.unidade_id)
      )];
    }
    else {
      // caso especial (admin?), todas
      unidadeIds = Object.keys(unidadesMap);
    }

    // popula o <select>
    unidadeIds.forEach(id => {
      if (unidadesMap[id]) {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = unidadesMap[id];
        select.appendChild(opt);
      }
    });

  } catch (err) {
    console.error("carregarUnidades:", err);
  }
}

async function gerarRelatorioUnidade() {
  const unidadeId = document.getElementById("unidade-select").value;
  const inicioRaw = document.getElementById("data-inicio-unidade").value;
  const fimRaw = document.getElementById("data-fim-unidade").value;
  if (!unidadeId) { alert("Selecione uma unidade."); return; }

  // Carrega todos os dados de turmas e presenças
  const [turmasRes, presencaRes] = await Promise.all([
    fetch("/dados"),
    fetch("/dados-presenca")
  ]);
  const turmasData = await turmasRes.json();      // { turmaNome: { unidade_id, alunos: [...] }, … }
  const presencasMap = await presencaRes.json();    // { turmaNome: [ { data, presenca, … }, … ], … }

  // 1) filtra só as turmas desta unidade
  const turmasDaUnidade = Object.entries(turmasData)
    .filter(([, t]) => String(t.unidade_id) === unidadeId)
    .map(([nome]) => nome);

  // 2) matrículas totais: uniões de arrays de alunos
  const setAlunos = new Set();
  turmasDaUnidade.forEach(t =>
    (turmasData[t].alunos || []).forEach(a => setAlunos.add(a))
  );
  const totalMatriculas = setAlunos.size;

  // 3) agrupa todas as presenças dessa unidade, no período
  const inicio = inicioRaw ? new Date(inicioRaw) : null;
  const fim = fimRaw ? new Date(fimRaw) : null;
  let registros = [];
  turmasDaUnidade.forEach(t => {
    (presencasMap[t] || []).forEach(r => {
      const dt = new Date(r.data);
      if ((!inicio || dt >= inicio) && (!fim || dt <= fim)) {
        registros.push(r);
      }
    });
  });

  const totalRegistros = registros.length;
  const presentes = registros.filter(r => r.presenca === "Presente").length;
  const faltas = totalRegistros - presentes;

  const pctPresenca = totalRegistros
    ? ((presentes / totalRegistros) * 100).toFixed(1) + "%"
    : "-";
  const pctFaltas = totalRegistros
    ? ((faltas / totalRegistros) * 100).toFixed(1) + "%"
    : "-";

  // 4) exibe no HTML
  document.getElementById("matriculas-unidade").textContent = totalMatriculas;
  document.getElementById("percentual-presenca").textContent = pctPresenca;
  document.getElementById("percentual-faltas").textContent = pctFaltas;
  document.getElementById("resultado-unidade").classList.remove("hidden");
  // Exibe os indicadores
  document.getElementById("matriculas-unidade").textContent = totalMatriculas;
  document.getElementById("percentual-presenca").textContent = pctPresenca;
  document.getElementById("percentual-faltas").textContent = pctFaltas;
  document.getElementById("resultado-unidade").classList.remove("hidden");
  // agora sim exibe o botão de exportar
  document.getElementById("exportar-relatorio-unidade").classList.remove("hidden");


  // Cria o gráfico de pizza
  criarGraficoUnidade(presentes, faltas);
}
document.getElementById("gerar-relatorio-unidade")
  .addEventListener("click", gerarRelatorioUnidade);


document.addEventListener("DOMContentLoaded", () => {
  carregarTurmas();
  carregarUnidades();   // <— novo
  obterNomeUsuario();
  // … restante das suas chamadas
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

    const data = criarDataLocal(aula.data);

    if (isNaN(data.getTime())) {
      console.error("Erro ao processar data:", aula.data);
      return "Data Inválida";
    }


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

function criarGraficoUnidade(presentes, faltas) {
  const ctx = document.getElementById("grafico-unidade").getContext("2d");

  // Se já existir um gráfico, destroí-lo antes de recriar
  if (window.graficoUnidade) {
    window.graficoUnidade.destroy();
  }

  window.graficoUnidade = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Presença", "Faltas"],
      datasets: [{
        data: [presentes, faltas],
        backgroundColor: [
          "rgba(0, 142, 237, 0.7)",
          "rgba(255, 0, 55, 0.7)"
        ],
        borderColor: [
          "#36a2eb",
          "#ff0037"
        ],
        borderWidth: 1
      }]
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
            }
          }
        },
        legend: {
          position: "bottom"
        }
      }
    }
  });
}


// Função para exportar relatório em PDF
// Função para exportar relatório em PDF do aluno
async function exportarRelatorioPDF() {
  function formatarDataBrasileira(dataStr) {
    if (!dataStr || dataStr === "-") return "-";
    const data = typeof dataStr === "string" ? new Date(dataStr + 'T12:00:00') : dataStr;
    if (isNaN(data)) return "-";
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }


  const dataInicioRaw = document.getElementById("data-inicio-aluno").value || "-";
  const dataFimRaw = document.getElementById("data-fim-aluno").value || "-";

  const dataInicioBR = formatarDataBrasileira(dataInicioRaw);
  const dataFimBR = formatarDataBrasileira(dataFimRaw);

  const doc = new jspdf.jsPDF("p", "mm", "a4");
  let yOffset = 10;

  doc.setFontSize(12);
  doc.text(`Período: ${dataInicioBR} até ${dataFimBR}`, 10, yOffset);
  yOffset += 10;

  const turmaNome = document.getElementById("turma-select").value.trim();
  const alunoSelecionado = document.getElementById("aluno-select").value.trim();

  if (!turmaNome || !alunoSelecionado) {
    alert("Selecione uma turma e um aluno para exportar o relatório.");
    return;
  }

  try {
    const [turmasResponse, presencaResponse, notasResponse, unidadesResponse] = await Promise.all([
      fetch("/dados"),
      fetch(`/dados-presenca?turma=${encodeURIComponent(turmaNome)}&aluno=${encodeURIComponent(alunoSelecionado)}`),
      fetch(`/notasavaliacoes?turma=${encodeURIComponent(turmaNome)}&aluno=${encodeURIComponent(alunoSelecionado)}`),
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

    const inicio = dataInicioRaw ? new Date(dataInicioRaw) : null;
    const fim = dataFimRaw ? new Date(dataFimRaw) : null;

    console.log("presencaData:", presencaData);
    console.log("notasData:", notasData);

    const registrosFiltradosPresenca = (
      Array.isArray(presencaData)
        ? presencaData
        : presencaData[turmaNome] || []
    ).filter(registro => registro.aluno === alunoSelecionado)
      .filter(registro => {
        const data = new Date(registro.data);
        return (!inicio || data >= inicio) && (!fim || data <= fim);
      });

    const registrosFiltradosNotas = (
      Array.isArray(notasData)
        ? notasData
        : notasData[turmaNome] || []
    ).filter(registro => registro.aluno === alunoSelecionado);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Unidade: ${nomeUnidade}`, 10, yOffset);
    yOffset += 10;

    doc.setFontSize(14);
    doc.text(`Relatório de Desempenho - Turma: ${turmaNome}`, 10, yOffset);
    yOffset += 10;

    doc.text(`Aluno: ${alunoSelecionado}`, 10, yOffset);
    yOffset += 10;

    // Notas das Avaliações
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

      yOffset = doc.lastAutoTable.finalY + 10;
    }

    // Resumo do Desempenho
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

      yOffset = doc.lastAutoTable.finalY + 10;
    }

    // Detalhamento por Aula
    if (registrosFiltradosPresenca.length > 0) {
      const tabelaPresencaDesempenho = registrosFiltradosPresenca.map((registro) => {
        if (!registro.data) return ["Data Inválida", registro.presenca, registro.nota, registro.conteudoAula || "-"];
        const partes = registro.data?.split("-"); // ['2024', '05', '12']
        if (!partes || partes.length < 3) {
          return ["Data Inválida", registro.presenca, registro.nota, registro.conteudoAula || "-"];
        }
        const data = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));


        const dataFormatada = formatarDataBrasileira(data);
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

      yOffset = doc.lastAutoTable.finalY + 10;
    }

    doc.save(`Relatorio_Turma_${turmaNome}_${alunoSelecionado}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar o relatório:", error);
  }
}


// Atualizar o evento do botão para incluir essa versão corrigida
document.getElementById("exportar-relatorio").addEventListener("click", exportarRelatorioPDF);


// Função para exportar relatório em PDF
async function exportarRelatorioTurmaPDF() {
  function formatarDataBrasileira(dataStr) {
    if (!dataStr || dataStr === "-") return "-";
    const data = typeof dataStr === "string" ? new Date(dataStr + 'T12:00:00') : dataStr;
    if (isNaN(data)) return "-";
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }



  const dataInicioRaw = document.getElementById("data-inicio-turma").value || "-";
  const dataFimRaw = document.getElementById("data-fim-turma").value || "-";
  const dataInicioBR = formatarDataBrasileira(dataInicioRaw);
  const dataFimBR = formatarDataBrasileira(dataFimRaw);

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

    const inicio = dataInicioRaw ? new Date(dataInicioRaw) : null;
    const fim = dataFimRaw ? new Date(dataFimRaw) : null;

    const alunosPresenca = (presencaData[turmaNome] || []).filter(registro => {
      const data = criarDataLocal(registro.data);
      return (!inicio || data >= inicio) && (!fim || data <= fim);
    });

    const alunosNotas = notasData[turmaNome] || [];

    const doc = new jspdf.jsPDF("p", "mm", "a4");
    let yOffset = 10;

    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Unidade: ${nomeUnidade}`, 10, yOffset);
    yOffset += 10;

    doc.setFontSize(14);
    doc.text(`Relatório de Desempenho da Turma: ${turmaNome}`, 10, yOffset);
    yOffset += 10;

    doc.setFontSize(12);
    doc.text(`Período: ${dataInicioBR} até ${dataFimBR}`, 10, yOffset);
    yOffset += 10;

    // Processa dados dos alunos
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

    // Geração da tabela
    doc.setFontSize(12);
    doc.text("Informações Gerais da Turma:", 10, yOffset);
    yOffset += 5;

    const tabelaDadosAlunos = Object.keys(dadosAlunos).map(nomeAluno => {
      const alunoData = dadosAlunos[nomeAluno];
      const mediaPresenca = alunoData.totalAulas > 0
        ? (alunoData.totalPresencas / alunoData.totalAulas) * 100
        : "-";

      const mediaNotasAulas = alunoData.totalNotasAulas > 0
        ? (alunoData.somaNotasAulas / alunoData.totalNotasAulas)
        : "-";

      const mediaNotasAvaliacoes = alunoData.totalNotasAvaliacoes > 0
        ? (alunoData.somaNotasAvaliacoes / alunoData.totalNotasAvaliacoes)
        : "-";

      return [
        nomeAluno,
        `${mediaPresenca === "-" ? "-" : mediaPresenca.toFixed(1)}%`,
        mediaNotasAulas === "-" ? "-" : mediaNotasAulas.toFixed(2),
        mediaNotasAvaliacoes === "-" ? "-" : mediaNotasAvaliacoes.toFixed(2)
      ];
    });
    const detalheBody = (presencaData[turmaNome] || [])
      .filter(r => {
        const d = new Date(r.data + 'T12:00:00');
        return (!inicio || d >= inicio) && (!fim || d <= fim);
      })
      .sort((a, b) => a.aluno.localeCompare(b.aluno) || new Date(a.data) - new Date(b.data))
      .map(r => {
        const [y, m, d] = r.data.split("T")[0].split("-");
        return [r.aluno, `${d.padStart(2, "0")}/${m}/${y}`, r.presenca];
      });

    // 1) Tabela de Resumo
    doc.autoTable({
      startY: yOffset + 5,
      head: [["Nome do Aluno", "Porcentagem de Presença", "Média de Notas nas Aulas Presentes", "Média nas Avaliações"]],
      body: tabelaDadosAlunos,
      theme: "grid"
    });

    // 2) Puxa a segunda tabela diretamente do HTML
    const detailStartY = doc.lastAutoTable.finalY + 10;
    doc.autoTable({
      html: '#tabela-detalhe-turma',
      startY: detailStartY,
      theme: 'grid'
    });

    // 3) Salva
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
document.addEventListener("DOMContentLoaded", async function () {
  await obterNomeUsuario();
  await carregarTurmas(); // Mantendo a função original

  // Adiciona evento de mudança para atualizar os alunos ao selecionar a turma
  document.getElementById("turma-select").addEventListener("change", () => {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const alunos = obterListaDeAlunos(turmaSelecionada);
    console.log("Alunos carregados:", alunos);
  });
});

async function carregarInstrutoresParaCoordenador() {
  try {
    const nomeCoordenador = localStorage.getItem("nomeUsuario");
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/usuarios"); 
    //🚭Como é localmente
    // const response = await fetch("http://localhost:3000/usuarios");
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
    // const response = await fetch("http://localhost:3000/usuarios");
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
document.addEventListener("DOMContentLoaded", async function () {
  await obterNomeUsuario();
  await carregarTurmas();
  const tipoUsuario = localStorage.getItem("tipoUsuario");

  if (tipoUsuario === "Coordenador") {
    await carregarInstrutoresParaCoordenador();
    await carregarInstrutoresParaCoordenadorTurma();
  }

  await carregarTurmas();

  document.getElementById("turma-select").addEventListener("change", () => {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const alunos = obterListaDeAlunos(turmaSelecionada);
    console.log("Alunos carregados:", alunos);
  });
});

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

async function exportarRelatorioUnidadePDF() {
  const unidadeSelect = document.getElementById("unidade-select");
  const unidadeId = unidadeSelect.value;
  const unidadeNome = unidadeSelect.options[unidadeSelect.selectedIndex].text;
  const inicioRaw = document.getElementById("data-inicio-unidade").value; // "YYYY-MM-DD"
  const fimRaw = document.getElementById("data-fim-unidade").value;    // "YYYY-MM-DD"

  // formata manualmente para DD/MM/YYYY
  const formatarBR = s => {
    if (!s) return "-";
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  };
  const inicioBR = formatarBR(inicioRaw);
  const fimBR = formatarBR(fimRaw);

  // lê indicadores já exibidos
  const matriculas = document.getElementById("matriculas-unidade").textContent;
  const presenca = document.getElementById("percentual-presenca").textContent;
  const faltas = document.getElementById("percentual-faltas").textContent;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  let y = 15;

  doc.setFontSize(16);
  doc.text(`Relatório por Unidade`, 105, y, { align: "center" });
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

  // captura o gráfico como imagem
  const canvas = document.getElementById("grafico-unidade");
  await html2canvas(canvas, { scale: 2 }).then(c => {
    const imgData = c.toDataURL("image/png");
    const pdfW = 180;
    const props = doc.getImageProperties(imgData);
    const pdfH = (props.height * pdfW) / props.width;
    doc.addImage(imgData, "PNG", 14, y, pdfW, pdfH);
  });

  doc.save(
    `Relatorio_Unidade_${unidadeNome}_${inicioBR.replace(/\//g, "")}-${fimBR.replace(/\//g, "")}.pdf`
  );
}

// amarre o botão
document
  .getElementById("exportar-relatorio-unidade")
  .addEventListener("click", exportarRelatorioUnidadePDF);

