async function carregarInstrutores(coordenador) {
  try {
    if (!coordenador) {
      console.warn("Coordenador não encontrado no localStorage.");
      return;
    }
    //🚭Como era na Vercel
    const response = await fetch(`https://hub-orcin.vercel.app/instrutores-por-coordenador?coordenador=${encodeURIComponent(coordenador)}`);
    //🚭Como é localmente
    //const response = await fetch(`http://localhost:3000/instrutores-por-coordenador?coordenador=${encodeURIComponent(coordenador)}`);

    if (!response.ok) {
      const erroTexto = await response.text();
      console.error("❌ Erro no backend:", erroTexto);
      return;
    }

    const instrutores = await response.json();

    const selectElement = document.getElementById("instrutores");
    selectElement.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecione um Instrutor";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    selectElement.appendChild(defaultOption);

    instrutores.forEach(instrutor => {
      const option = document.createElement("option");
      option.value = instrutor.id;
      option.textContent = instrutor.name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar instrutores:", error);
  }
}


async function obterNomeUsuario() {
  try {
    const email = localStorage.getItem("email"); // Obtém o email armazenado
    if (!email) {
      throw new Error("Nenhum email encontrado no localStorage");
    }

    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/usuarios");
    //🚭Como é localmente
    //const response = await fetch("http://localhost:3000/usuarios"); // Chama a API
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
  } catch (error) { console.error("Erro em X:", error); }
  {
  }
}

//...
async function carregarTurmas(instrutorSelecionado = null) {
  try {
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/dados");
    //🚭Como é localmente
    //const response = await fetch("http://localhost:3000/dados"); // Requisição ao backend
    if (!response.ok) throw new Error("Erro ao buscar as turmas");
    const turmas = await response.json();// Dados das turmas

    const nomeUsuario = localStorage.getItem("nomeUsuario");// Obtém o nome do instrutor
    const tipoUsuario = localStorage.getItem("tipoUsuario");

    const instrutorAlvo = tipoUsuario === "Coordenador" && instrutorSelecionado
      ? instrutorSelecionado
      : nomeUsuario;

    // Filtra turmas onde o instrutor seja o usuário logado
    const turmasFiltradas = Object.fromEntries(
      Object.entries(turmas).filter(([_, turma]) => turma.instrutor === instrutorAlvo)
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
    console.error("Erro ao carregar turmas:", error);
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

// Função para resetar os campos
function resetarCampos() {
  document.getElementById("turma-select").value = "";
  document.getElementById("data-chamada").value = "";
  document.getElementById("alunos-list").innerHTML = ""; // Limpa a lista de alunos
  document.getElementById("alunos-container").classList.add("hidden");
  document.getElementById("salvar-btn").classList.add("hidden");
  document.getElementById("turma-selecionada").innerText =
    "Selecione uma turma";
  document.getElementById("turma-selecionada").classList.add("hidden");
}

// Carrega as datas da turma selecionada
async function carregarDatas() {
  const turmaSelecionada = document.getElementById("turma-select").value;

  if (!turmaSelecionada) {
    alert("Por favor, selecione uma turma.");
    return;
  }

  try {
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/dados-presenca");
    //🚭Como é localmente
    //const response = await fetch("http://localhost:3000/dados-presenca");
    if (!response.ok) throw new Error("Erro ao buscar as datas");
    const presencas = await response.json();


    // Acessar os dados da turma selecionada
    const presencasDaTurma = presencas[turmaSelecionada];

    // Acesse os dados de presença pela turma selecionada

    if (
      !presencas[turmaSelecionada] ||
      presencas[turmaSelecionada].length === 0
    ) {
      alert(`Nenhuma chamada encontrada para a turma ${turmaSelecionada}.`);
      return;
    }

    // Obter datas únicas para a turma
    const datasUnicas = [...new Set(presencasDaTurma.map((p) => p.data))]; // Remove datas duplicadas

    const dataSelect = document.getElementById("data-chamada");
    dataSelect.innerHTML = `<option value="" disabled selected>Escolha a data</option>`;

    // Preenche o dropdown com as datas únicas
    datasUnicas.forEach((data) => {
      const dataObj = new Date(data);
      const dia = String(dataObj.getUTCDate()).padStart(2, "0");
      const mes = String(dataObj.getUTCMonth() + 1).padStart(2, "0");
      const ano = dataObj.getUTCFullYear();
      const dataFormatada = `${dia}/${mes}/${ano}`;

      const option = document.createElement("option");
      option.value = data; // Mantém o formato ISO para busca
      option.textContent = dataFormatada;
      dataSelect.appendChild(option);
    });
  } catch (error) { console.error("Erro em X:", error); }
  {
  }
}

// Carrega as notas dos alunos na data escolhida
async function carregarNotas() {
  const turmaSelecionada = document.getElementById("turma-select").value;
  const dataSelecionada = document.getElementById("data-chamada").value;

  if (!dataSelecionada) {
    alert("Por favor, selecione uma data.");
    return;
  }

  try {
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/dados-presenca");
    //🚭Como é localmente
    //const response = await fetch("http://localhost:3000/dados-presenca");
    if (!response.ok) {
      throw new Error("Erro ao buscar as presenças");
    }

    const presencas = await response.json();

    // Verifica se os dados de presença da turma e a data selecionada existem
    const chamada = presencas[turmaSelecionada]?.filter((p) => p.data === dataSelecionada);

    // Novo Tratamento

    const campoConteudo = document.getElementById("campo-conteudo-aula");
    const conteudoAula = chamada.find(c => c.conteudoAula)?.conteudoAula;

    // Atualiza o valor do campo de conteúdo
    campoConteudo.value = conteudoAula || "Sem conteúdo registrado para esta data.";

    // ✅ Verifica se o elemento existe antes de remover a classe 'hidden'
    const exibido = document.getElementById("conteudo-aula-exibido");
    if (exibido) exibido.classList.remove("hidden");

    if (chamada && chamada.length > 0) {
      const primeiroRegistro = chamada[0]; // pega o primeiro da data

      if (primeiroRegistro.conteudoAula) {
        campoConteudo.value = primeiroRegistro.conteudoAula;
      } else {
        campoConteudo.value = "Sem conteúdo registrado para esta data.";
      }

      // ✅ Verifica novamente se o elemento existe antes de mostrar
      if (exibido) exibido.classList.remove("hidden");
    } else {
      campoConteudo.value = "Sem conteúdo registrado para esta data.";

      // ✅ E novamente aqui
      if (exibido) exibido.classList.remove("hidden");
    }

    // Atualiza o texto visível (se aplicável)
    document.getElementById("campo-conteudo-aula").textContent = conteudoAula;

    // Usa filter para garantir que todas as presenças da data sejam selecionadas

    if (!chamada || chamada.length === 0) {
      alert("Não foram encontrados registros para essa data.");
      return;
    }

    const alunosList = document.getElementById("alunos-list");
    alunosList.innerHTML = ""; // Limpa a lista de alunos antes de preenchê-la

    // Ordena os alunos em ordem alfabética pelo nome
    chamada.sort((a, b) => a.aluno.localeCompare(b.aluno));

    // Itera sobre os alunos da chamada e preenche a tabela
    chamada.forEach((p) => {
      // Verifica se o aluno já tem nota atribuída
      const notaAluno = p.nota !== undefined ? p.nota : 0; // Se não tiver nota, usa 0 como valor padrão
      const observacao = p.observacao || "";
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${p.aluno}</td>
                <td>${p.presenca}</td>
                <td>
                    <select class="nota-select">
                        <option value="0" ${notaAluno === 0 ? "selected" : ""
        }>0</option>
                        <option value="1" ${notaAluno === 1 ? "selected" : ""
        }>1</option>
                        <option value="2" ${notaAluno === 2 ? "selected" : ""
        }>2</option>
                        <option value="3" ${notaAluno === 3 ? "selected" : ""
        }>3</option>
                        <option value="4" ${notaAluno === 4 ? "selected" : ""
        }>4</option>
                        <option value="5" ${notaAluno === 5 ? "selected" : ""
        }>5</option>
                    </select>
                </td>
                                <td>
                    <input type="text" class="observacao-input" value="${observacao}" placeholder="Digite uma observação">
                </td>
            `;
      alunosList.appendChild(row);
    });

    document.getElementById("alunos-container").classList.remove("hidden");
    document.getElementById("salvar-btn").classList.remove("hidden");
  } catch (error) { console.error("Erro em X:", error); }
  {
  }
}

// Função para salvar as notas
async function salvarNotas() {
  console.log("🧪 Botão Salvar Alterações clicado");
  const turmaSelecionada = document.getElementById("turma-select").value;
  const dataSelecionada = document.getElementById("data-chamada").value;

  if (!turmaSelecionada || !dataSelecionada) {
    alert("Por favor, selecione a turma e a data.");
    return;
  }

  const alunos = document.querySelectorAll("#alunos-list tr");
  const novosDados = [];

  // Itera sobre os alunos e captura as notas
  alunos.forEach((aluno) => {
    const nome = aluno.querySelector("td:first-child").textContent; // Nome do aluno
    const nota = linha.querySelector(".nota-select")?.value || "";
    const observacao = linha.querySelector(".observacao-input")?.value || "";
    novosDados.push({ nome, nota, observacao }); // Adiciona a nota ao array de novos dados
  });

  // Busca os dados atuais para manter o campo `dataSalvo`
  let chamadas = [];
  try {
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/dados-presenca");
    //🚭Como é localmente
    //const response = await fetch("http://localhost:3000/dados-presenca");
    if (response.ok) {
      chamadas = await response.json(); // Carrega os dados de presença
    } else {
      throw new Error("Erro ao buscar dados de presença.");
    }
  } catch (error) { console.error("Erro em X:", error); }
  {
    return;
  }

  // Encontra o registro original para a turma e data selecionadas
  const chamadaOriginal = chamadas[turmaSelecionada]?.find(
    (p) => p.data === dataSelecionada
  );
  if (!chamadaOriginal) {
    alert("Registro original não encontrado.");
    return;
  }

  // Mantém a `dataSalvo` original e atualiza as notas
  const dadosAtualizados = {
    turma: turmaSelecionada,
    data: dataSelecionada,
    dataSalvo:
      chamadaOriginal.dataSalvo || new Date().toISOString().split("T")[0],
    alunos: novosDados.map((aluno) => {
      // Encontrar o aluno na chamadaOriginal
      const alunoPresenca = chamadaOriginal.alunos?.find(
        (a) => a.aluno === aluno.nome
      );

      return {
        nome: aluno.nome,
        presenca: alunoPresenca ? alunoPresenca.presenca : "Ausente", // Se o aluno não existir, "Ausente"
        nota: aluno.nota,
        observacao: aluno.observacao, // Se não tiver observação, usa a original
      };
    }),
  };

  // Envia os dados atualizados ao backend
  try {
    //🚭Como era na Vercel
    const response = await fetch("https://hub-orcin.vercel.app/atualizar-notas",
      //🚭Como é localmente
      //const response = await fetch("http://localhost:3000/atualizar-notas", 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAtualizados), // Envia os dados atualizados
      });

    if (response.ok) {
      exibirMensagem("Alterações salvas com sucesso!", false, () =>
        resetarCampos()
      );
    } else {
      alert("Erro ao salvar as notas!");
    }
  } catch (error) { console.error("Erro em X:", error); }
  {
  }
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
// teste ...
document.addEventListener("DOMContentLoaded", () => {
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
      //   window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
      //}
    } catch (error) { console.error("Erro em X:", error); }
    {
    }
  }
  verificarAcessoRestrito();

  // Carrega as turmas ao abrir a página
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
    } catch (error) { console.error("Erro em X:", error); }
    {
    }
  }
  carregarPerfil();
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


document.addEventListener("DOMContentLoaded", () => {
  async function verificarAcessoRestrito() {
    const tipoUsuario = localStorage.getItem("tipoUsuario");
    const nomeUsuario = localStorage.getItem("nomeUsuario");

    if (!tipoUsuario || !nomeUsuario) {
      window.location.href = "/Login/login.html";
      return;
    }

    if (tipoUsuario === "Coordenador") {
      document.getElementById("div-coordenador").classList.remove("hidden");
      await carregarInstrutores(nomeUsuario); // Chama a função com o nome
      document.getElementById("instrutores").addEventListener("change", (e) => {
        const instrutorSelecionado = e.target.options[e.target.selectedIndex].text;
        carregarTurmas(instrutorSelecionado);
      });
    } else {
      document.getElementById("div-coordenador").classList.add("hidden");
      await carregarTurmas();
    }
  }

  verificarAcessoRestrito();
});
//...
document.addEventListener("DOMContentLoaded", () => {
  // Função para obter o tipo de usuário armazenado no localStorage
  function getUserType() {
    return localStorage.getItem("tipoUsuario");
  }

  // Função para verificar o acesso e exibir a div de Coordenador
  async function verificarAcessoRestrito() {
    const tipoUsuario = getUserType();

    if (!tipoUsuario) {
      window.location.href = "/Login/login.html"; // Redireciona para login se não houver tipo definido
      return;
    }

    // Verifica se o tipo de usuário é Coordenador
    if (tipoUsuario === 'Coordenador') {
      // Exibe a div de coordenador se o tipo de usuário for Coordenador
      document.getElementById('div-coordenador').classList.remove('hidden');
      carregarInstrutores(); // Carrega os instrutores do coordenador logado
    } else {
      // Caso contrário, a div é escondida
      document.getElementById('div-coordenador').classList.add('hidden');
    }
  }

  // Função para carregar os instrutores vinculados ao coordenador logado
  async function carregarInstrutores() {
    try {
      const coordenador = localStorage.getItem("nomeUsuario");
      if (!coordenador) {
        alert("Nome do coordenador não encontrado.");
        return;
      }
      //🚭Como era na Vercel
      const response = await fetch(`https://hub-orcin.vercel.app/instrutores-por-coordenador?coordenador=${encodeURIComponent(coordenador)}`);
      //🚭Como é localmente
      //const response = await fetch(`http://localhost:3000/instrutores-por-coordenador?coordenador=${encodeURIComponent(coordenador)}`);


      if (!response.ok) {
        const text = await response.text(); // Lê como texto se falhou
        console.error("❌ Erro no backend:", text);
        return;
      }

      const instrutores = await response.json();

      if (instrutores.length > 0) {
        const selectElement = document.getElementById("instrutores");
        selectElement.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Selecione um Instrutor";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectElement.appendChild(defaultOption);

        instrutores.forEach(instrutor => {
          const option = document.createElement("option");
          option.value = instrutor.id;
          option.textContent = instrutor.name;
          selectElement.appendChild(option);
        });
      } else {
        alert("Nenhum instrutor encontrado para esse coordenador.");
      }
    } catch (error) {
      console.error("Erro em X:", error);
    }
  }
  verificarAcessoRestrito(); // Executa a verificação ao carregar a página
});
//...

// Chamar a função ao carregar a página
window.onload = async function () {
  await obterNomeUsuario(); // Sempre carrega o nome primeiro

  document.getElementById("turma-select").addEventListener("change", () => {
    const turmaSelecionada = document.getElementById("turma-select").value;
    obterListaDeAlunos(turmaSelecionada);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const botaoSalvar = document.getElementById("salvarAlteracoes");

  if (!botaoSalvar) {
    console.warn("❗ Botão 'salvarAlteracoes' não encontrado!");
    return;
  }

  botaoSalvar.addEventListener("click", async () => {
    try {
      // Pegando turma e data da URL ou do DOM (ajuste conforme necessário)
      const turma = document.getElementById("turma-select").value;
      const data = document.getElementById("data-chamada").value;


      const linhas = document.querySelectorAll("table tbody tr");
      const alunos = [];

      linhas.forEach(linha => {
        const nome = linha.querySelector("td:nth-child(1)").textContent.trim();
        const nota = linha.querySelector(".nota-select")?.value || "";
        const observacao = linha.querySelector(".observacao-input")?.value || "";


        if (nome) {
          alunos.push({ nome, nota, observacao });
        }
      });

      if (alunos.length === 0) {
        alert("Nenhum aluno encontrado.");
        return;
      }

      const response = await fetch("/atualizar-notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turma, data, alunos })
      });

      const contentType = response.headers.get("content-type");

      if (response.ok && contentType?.includes("application/json")) {
        const resultado = await response.json();
        alert("Alterações salvas com sucesso! Atualize a página!");
      } else {
        const erroTexto = await response.text(); // 🔹 Lê o erro como texto, se não for JSON
        console.error("❌ Erro ao salvar alterações:", erroTexto);
        alert("Erro ao salvar alterações: " + erroTexto);
      }

    } catch (erro) {
      console.error("Erro ao salvar alterações:", erro);
      alert("Erro ao salvar alterações.");
    }
  });
});