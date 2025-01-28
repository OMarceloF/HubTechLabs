// Carrega as turmas do servidor (agora usando o backend)
async function carregarTurmas() {
    try {
        const response = await fetch('http://localhost:3000/dados'); // Requisição ao backend
        if (!response.ok) {
            throw new Error("Erro ao buscar as turmas");
        }
        const turmas = await response.json(); // Dados das turmas

        const selectElement = document.getElementById("turma-select");

        // Preenche o dropdown com as turmas recebidas
        for (const nomeTurma in turmas) {  // Agora estamos usando a chave "nomeTurma"
            const option = document.createElement("option");
            option.value = nomeTurma;
            option.textContent = nomeTurma;
            selectElement.appendChild(option);
        }

        // Armazena os dados das turmas globalmente
        window.turmas = turmas;
        window.presencaDados = [];
    } catch (error) {
        console.error("Erro ao carregar as turmas:", error);
    }
}

// Função para salvar os dados de presença e notas com data
async function salvarDados() {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const dataChamada = document.getElementById("data-chamada").value;
    const alunos = document.querySelectorAll("#alunos-list tr");

    if (!dataChamada) {
        exibirMensagem("Por favor, selecione a data da chamada.", true);
        return;
    }

    const dados = {
        turma: turmaSelecionada,
        data: dataChamada,
        alunos: Array.from(alunos).map(aluno => ({
            nome: aluno.querySelector("td:first-child").textContent,
            presenca: aluno.querySelector(".presenca-check").checked ? "Presente" : "Ausente",
            nota: aluno.querySelector(".nota-select").value,
            observacao: aluno.querySelector(".observacao-input").value || "" // Captura a observação
        }))
    };

    try {
        const response = await fetch('http://localhost:3000/salvar-presenca', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            exibirMensagem("Chamada salva com sucesso!", false, () => resetarCampos());
        } else {
            exibirMensagem("Erro ao salvar os dados!", true);
        }
    } catch (error) {
        console.error("Erro ao enviar os dados:", error);
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
    document.getElementById("turma-selecionada").innerText = "Selecione uma turma";
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
            callback();  // Chama a função de reset após a mensagem desaparecer
        }
    }, 2000);  // 2 segundos
}

function mostrarAlunosSelecionados() {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const alunosList = document.getElementById("alunos-list");
    alunosList.innerHTML = "";  // Limpa a lista de alunos

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

// Carrega as turmas ao abrir a página
window.onload = carregarTurmas;
