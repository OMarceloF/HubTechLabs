document.addEventListener("DOMContentLoaded", () => {
    const formAvaliacao = document.getElementById("form-avaliacao");

    // Função para carregar as turmas do servidor
    async function carregarTurmas() {
        try {
            const response = await fetch('http://localhost:3000/dados'); // Requisição ao backend
            if (!response.ok) {
                throw new Error("Erro ao buscar as turmas");
            }
            const turmas = await response.json();
        
            const selectElement = document.getElementById("turma"); // Atualizado para o ID correto
        
            // Limpa o dropdown antes de preenchê-lo
            selectElement.innerHTML = '<option value="" disabled selected>Escolha uma turma</option>';
    
            // Preenche o dropdown com as turmas recebidas
            for (const turma in turmas) {
                const option = document.createElement("option");
                option.value = turma;
                option.textContent = turma;
                selectElement.appendChild(option);
            }
        } catch (error) {
            console.error("Erro ao carregar as turmas:", error);
        }
    }

    // Carregar turmas ao abrir a página
    carregarTurmas();

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
            const response = await fetch('http://localhost:3000/salvar-avaliacao', {
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
            console.error("Erro ao enviar os dados:", error);
            alert("Erro ao enviar os dados ao servidor.");
        }

        
    });

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

// Carrega as turmas ao abrir a página
window.onload = carregarTurmas;
