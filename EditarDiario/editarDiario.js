// Carrega as turmas disponíveis no carregamento da página
async function carregarTurmas() {
    try {
        const response = await fetch('http://localhost:3000/dados'); // Requisição ao servidor Node.js
        if (!response.ok) {
            throw new Error("Erro ao buscar as turmas");
        }
        const turmas = await response.json();

        const selectElement = document.getElementById("turma-select");

        // Preenche o dropdown com as turmas recebidas
        for (const turma in turmas) {
            const option = document.createElement("option");
            option.value = turma;
            option.textContent = turma;
            selectElement.appendChild(option);
        }

        // Armazena os dados das turmas globalmente
        window.turmas = turmas;
        window.presencaDados = [];
    } catch (error) {
        console.error("Erro ao carregar as turmas:", error);
    }
}

// Carrega as datas da turma selecionada
async function carregarDatas() {
    const turmaSelecionada = document.getElementById("turma-select").value;

    if (!turmaSelecionada) {
        alert("Por favor, selecione uma turma.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/dados-presenca');
        if (!response.ok) throw new Error("Erro ao buscar as datas");

        const presencas = await response.json();
        const datasDaTurma = presencas.filter(p => p.turma === turmaSelecionada);

        if (datasDaTurma.length === 0) {
            alert(`Nenhuma chamada encontrada para a turma ${turmaSelecionada}.`);
            return;
        }

        const dataSelect = document.getElementById("data-chamada");
        dataSelect.innerHTML = `<option value="" disabled selected>Escolha a data</option>`;

        datasDaTurma.forEach(p => {
            const dataObj = new Date(p.data);
            const dia = String(dataObj.getUTCDate()).padStart(2, '0');
            const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
            const ano = dataObj.getUTCFullYear();
            const dataFormatada = `${dia}/${mes}/${ano}`;

            const option = document.createElement("option");
            option.value = p.data; // Mantém o formato ISO para busca
            option.textContent = dataFormatada;
            dataSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar as datas:", error);
        alert("Erro ao carregar as datas.");
    }
}

function formatarData() {
    const inputData = document.getElementById("data-chamada");
    const dataSelecionada = new Date(inputData.value);

    if (!isNaN(dataSelecionada.getTime())) {
        const dia = String(dataSelecionada.getUTCDate()).padStart(2, '0');
        const mes = String(dataSelecionada.getUTCMonth() + 1).padStart(2, '0');
        const ano = dataSelecionada.getUTCFullYear();
        inputData.value = `${ano}-${mes}-${dia}`; // Mantém o formato ISO para submissão
        console.log(`Data formatada para exibição: ${dia}/${mes}/${ano}`);
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

    const response = await fetch('http://localhost:3000/dados-presenca');
    const presencas = await response.json();
    const chamada = presencas.find(p => p.turma === turmaSelecionada && p.data === dataSelecionada);

    if (!chamada) {
        alert("Não foram encontrados registros para essa data.");
        return;
    }

    const alunosList = document.getElementById("alunos-list");
    alunosList.innerHTML = "";

    chamada.alunos.forEach(aluno => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${aluno.nome}</td>
            <td>${aluno.presenca}</td>
            <td>
                <select class="nota-select">
                    <option value="0" ${aluno.nota === "0" ? "selected" : ""}>0</option>
                    <option value="1" ${aluno.nota === "1" ? "selected" : ""}>1</option>
                    <option value="2" ${aluno.nota === "2" ? "selected" : ""}>2</option>
                    <option value="3" ${aluno.nota === "3" ? "selected" : ""}>3</option>
                    <option value="4" ${aluno.nota === "4" ? "selected" : ""}>4</option>
                    <option value="5" ${aluno.nota === "5" ? "selected" : ""}>5</option>
                </select>
            </td>
        `;
        alunosList.appendChild(row);
    });

    document.getElementById("alunos-container").classList.remove("hidden");
    document.getElementById("salvar-btn").classList.remove("hidden");
}

async function salvarNotas() {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const dataSelecionada = document.getElementById("data-chamada").value;

    if (!turmaSelecionada || !dataSelecionada) {
        alert("Por favor, selecione a turma e a data.");
        return;
    }

    const alunos = document.querySelectorAll("#alunos-list tr");
    const novosDados = [];

    alunos.forEach(aluno => {
        const nome = aluno.querySelector("td:first-child").textContent;
        const nota = aluno.querySelector(".nota-select").value;
        novosDados.push({ nome, nota });
    });

    // Buscar os dados atuais para manter o campo `dataSalvo`
    let chamadas = [];
    try {
        const response = await fetch('http://localhost:3000/dados-presenca');
        if (response.ok) {
            chamadas = await response.json();
        } else {
            throw new Error("Erro ao buscar dados de presença.");
        }
    } catch (error) {
        console.error("Erro ao carregar os dados:", error);
        alert("Erro ao buscar as chamadas.");
        return;
    }

    // Encontra o registro original
    const chamadaOriginal = chamadas.find(p => p.turma === turmaSelecionada && p.data === dataSelecionada);
    if (!chamadaOriginal) {
        alert("Registro original não encontrado.");
        return;
    }

    // Mantém a `dataSalvo` original e atualiza as notas
    const dadosAtualizados = {
        turma: turmaSelecionada,
        data: dataSelecionada,
        dataSalvo: chamadaOriginal.dataSalvo || new Date().toISOString().split('T')[0],
        alunos: novosDados.map(aluno => ({
            nome: aluno.nome,
            presenca: chamadaOriginal.alunos.find(a => a.nome === aluno.nome)?.presenca || "Ausente",
            nota: aluno.nota
        }))
    };

    // Envia os dados atualizados ao backend
    try {
        const response = await fetch('http://localhost:3000/atualizar-notas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        if (response.ok) {
            exibirMensagem("Alterações salvas com sucesso!", false, () => resetarCampos());
        } else {
            alert("Erro ao salvar as notas!");
        }
    } catch (error) {
        console.error("Erro ao salvar as notas:", error);
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
            callback();  // Chama a função de reset após a mensagem desaparecer
        }
    }, 2000);  // 2 segundos
}

function obterListaDeAlunos(turmaSelecionada) {
    const turma = window.turmas[turmaSelecionada];
    if (Array.isArray(turma)) {
        // Caso a turma seja um array simples
        return turma;
    } else if (typeof turma === "object" && turma.alunos) {
        // Caso a turma tenha a estrutura com "instrutor" e "alunos"
        return turma.alunos;
    } else {
        return [];
    }
}

function mostrarAlunosSelecionados() {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const alunosList = document.getElementById("alunos-list");
    alunosList.innerHTML = "";

    document.getElementById("turma-selecionada").innerText = `Turma: ${turmaSelecionada}`;
    document.getElementById("turma-selecionada").classList.remove("hidden");
    document.getElementById("alunos-container").classList.remove("hidden");
    document.getElementById("salvar-btn").classList.remove("hidden");

    const alunos = obterListaDeAlunos(turmaSelecionada);

    if (alunos.length === 0) {
        alert("Nenhum aluno encontrado para esta turma.");
        return;
    }

    alunos.forEach(aluno => {
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
        `;
        alunosList.appendChild(row);
    });
}

function resetarCampos() {
    document.getElementById("turma-select").value = "";
    document.getElementById("data-chamada").value = "";
    document.getElementById("alunos-container").classList.add("hidden");
    document.getElementById("salvar-btn").classList.add("hidden");
    document.getElementById("turma-selecionada").innerText = "Selecione uma turma";
    document.getElementById("turma-selecionada").classList.add("hidden");
}

async function carregarPresencas() {
    try {
        const response = await fetch('http://localhost:3000/dados-presenca');
        if (!response.ok) {
            throw new Error("Erro ao buscar as presenças.");
        }

        const presencas = await response.json();

        // Preencher a tabela com os dados organizados
        const tabela = document.getElementById("alunos-table");
        tabela.innerHTML = ''; // Limpa a tabela

        presencas.forEach((chamada) => {
            chamada.alunos.forEach((aluno) => {
                const linha = document.createElement('tr');
                linha.innerHTML = `
                    <td>${aluno.nome}</td>
                    <td>${chamada.data}</td>
                    <td>${aluno.presenca}</td>
                    <td>${aluno.nota}</td>
                `;
                tabela.appendChild(linha);
            });
        });
    } catch (error) {
        console.error("Erro ao carregar as presenças:", error);
    }
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

    async function carregarPerfil() {
        try {
            const response = await fetch('http://localhost:3000/perfil', {
                headers: { Authorization: token }
            });

            if (!response.ok) {
                throw new Error("Erro ao carregar os dados do perfil");
            }

            const data = await response.json();

            // Atualiza os elementos do HTML com os dados do usuário
            document.getElementById("profile-photo").src = data.photo || "/projeto/Imagens/perfil.png";
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            alert("Erro ao carregar os dados do perfil.");
        }
    }

    carregarPerfil();

});



// Chamada inicial
window.onload = () => {
    carregarPresencas();
};

// Carrega as turmas ao abrir a página
window.onload = carregarTurmas;
