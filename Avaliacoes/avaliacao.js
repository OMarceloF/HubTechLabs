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
        if (tipoUsuario === 'Instrutor') {
            window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
        }
        } catch (error) {
        }
    }
    verificarAcessoRestrito();

    const formAvaliacao = document.getElementById("form-avaliacao");

    // Função para carregar as turmas do servidor
    async function carregarTurmas() {
        try {
            const response = await fetch('https://hub-orcin.vercel.app/listar-turmas'); // Requisição ao backend
            if (!response.ok) {
                throw new Error("Erro ao buscar as turmas");
            }
            const turmas = await response.json();

            const selectElement = document.getElementById("turma"); // ID correto

            // Limpa o dropdown antes de preenchê-lo
            selectElement.innerHTML = '<option value="" disabled selected>Escolha uma turma</option>';

            // Preenche o dropdown com as turmas recebidas
            turmas.forEach(turma => {
                const option = document.createElement("option");
                option.value = turma; // Valor da turma
                option.textContent = turma; // Exibe o nome da turma corretamente
                selectElement.appendChild(option);
            });
        } catch (error) {
        }
    }

    // Carregar turmas ao abrir a página
    carregarTurmas();

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

    // Função para enviar avaliação ao backend
    formAvaliacao.addEventListener("submit", async (event) => {
        event.preventDefault();

        const turma = document.getElementById("turma").value.trim();
        const nomeAvaliacao = document.getElementById("nome-avaliacao").value.trim();
        const dataAvaliacao = document.getElementById("data-avaliacao").value;
        const conteudoAvaliacao = document.getElementById("conteudo-avaliacao").value.trim();

        if (!turma || !nomeAvaliacao || !dataAvaliacao || !conteudoAvaliacao) {
            alert("Preencha todos os campos!");
            return;
        }

        const avaliacao = {
            turma,
            nomeAvaliacao,
            dataAvaliacao,
            conteudoAvaliacao
        };

        try {
            const response = await fetch('https://hub-orcin.vercel.app/salvar-avaliacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(avaliacao)
            });

            if (response.ok) {
                exibirMensagem("Avaliação salva com sucesso!", false, () => formAvaliacao.reset());
            } else {
                const errorData = await response.json();
                alert(`Erro ao salvar a avaliação: ${errorData.message}`);
            }
        } catch (error) {
        }
    });

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
            const response = await fetch('https://hub-orcin.vercel.app/perfil', {
                headers: { Authorization: token }
            });

            if (!response.ok) {
                throw new Error("Erro ao carregar os dados do perfil");
            }

            const data = await response.json();

            // Atualiza os elementos do HTML com os dados do usuário
            document.getElementById("profile-photo").src = data.photo || "/projeto/Imagens/perfil.png";
        } catch (error) {
        }
    }

    carregarPerfil();
});

async function obterListaDeAlunos(turmaSelecionada) {
    try {
        // Requisição ao servidor para obter as turmas
        const response = await fetch('https://hub-orcin.vercel.app/dados'); // Ou o endpoint correspondente
        if (!response.ok) {
            throw new Error("Erro ao buscar turmas");
        }

        const turmas = await response.json();

        // Verifica se a turma selecionada existe no retorno do servidor
        const turma = turmas[turmaSelecionada];
        if (!turma) {
            return []; // Retorna uma lista vazia caso a turma não exista
        }

        // Caso a turma tenha a estrutura com "instrutor" e "alunos"
        if (Array.isArray(turma.alunos)) {
            return turma.alunos;
        } else {
            return []; // Caso não haja lista de alunos
        }
    } catch (error) {
        return []; // Retorna lista vazia em caso de erro
    }
}

async function mostrarAlunosSelecionados() {
    const turmaSelecionada = document.getElementById("turma-select").value;
    const alunosList = document.getElementById("alunos-list");
    alunosList.innerHTML = "";  // Limpa a lista de alunos

    document.getElementById("turma-selecionada").innerText = `Turma: ${turmaSelecionada}`;
    document.getElementById("turma-selecionada").classList.remove("hidden");
    document.getElementById("alunos-container").classList.remove("hidden");
    document.getElementById("salvar-btn").classList.remove("hidden");

    try {
        // Chama a função para obter a lista de alunos da turma
        const alunos = await obterListaDeAlunos(turmaSelecionada);

        if (alunos.length === 0) {
            alert("Nenhum aluno encontrado para esta turma.");
            return;
        }

        // Cria as linhas na tabela para os alunos
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
    } catch (error) {
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

// Carrega as turmas ao abrir a página
window.onload = carregarTurmas;