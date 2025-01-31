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
        if (tipoUsuario === 'Coordenador') {
            window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
        }
        } catch (error) {
        }
    }
    verificarAcessoRestrito();

    const turmaSelect = document.getElementById("turma-select");
    const alunosList = document.getElementById("alunos-list");
    const turmaDetails = document.getElementById("turma-details");
    const adicionarAlunoBtn = document.getElementById("adicionar-aluno");
    const excluirTurmaBtn = document.getElementById("excluir-turma");
    const salvarTurmaBtn = document.getElementById("salvar-turma");
    const confirmacaoExclusao = document.getElementById("confirmacao-exclusao");
    const confirmarExclusaoBtn = document.getElementById("confirmar-exclusao");
    const cancelarExclusaoBtn = document.getElementById("cancelar-exclusao");

    // Função para carregar as turmas do backend
    async function obterNomeUsuario() {
        try {
            const email = localStorage.getItem("email"); // Obtém o email armazenado
            if (!email) {
                throw new Error("Nenhum email encontrado no localStorage");
            }
    
            const response = await fetch("http://localhost:3000/usuarios"); // Chama a API
            if (!response.ok) {
                throw new Error("Erro ao buscar usuários");
            }
    
            const usuarios = await response.json(); // Converte a resposta em JSON
            
            // Filtra o usuário correspondente ao email armazenado
            const usuarioEncontrado = usuarios.find(usuario => usuario.email === email);
            
            if (usuarioEncontrado) {
                localStorage.setItem("nomeUsuario", usuarioEncontrado.name); // Salva o nome no localStorage
            } else {
                console.warn("Usuário não encontrado");
            }
        } catch (error) {
            console.error("Erro ao obter nome do usuário:", error);
        }
    }
    
    async function carregarTurmas() {
        try {
            const response = await fetch("http://localhost:3000/dados"); // Requisição ao backend
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

    // Evento de seleção de turma
    turmaSelect.addEventListener("change", async () => {
        const turmaSelecionada = turmaSelect.value;
        
        if (!turmaSelecionada) return;

        // Carregar os alunos dessa turma
        try {
            const response = await fetch('http://localhost:3000/dados'); // Rota para buscar os dados da turma
            const dados = await response.json();

            // Acessa os dados da turma selecionada corretamente
            const turma = dados[turmaSelecionada];

            if (!turma || !turma.alunos) {
                alunosList.innerHTML = "<p>Não há alunos cadastrados para esta turma.</p>";
                turmaDetails.classList.add("hidden");
                return;
            }

            // Exibe os detalhes da turma
            turmaDetails.classList.remove("hidden");
            alunosList.innerHTML = ""; // Limpa a lista de alunos

            turma.alunos.forEach(aluno => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <input type="text" value="${aluno}" readonly>
                    <button class="remover-aluno">Remover</button>
                `;
                alunosList.appendChild(li);
            });
        } catch (error) {
            console.error('Erro ao carregar dados da turma:', error);
        }
    });


    // Adicionar aluno
    adicionarAlunoBtn.addEventListener("click", () => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="text" placeholder="Nome do Aluno">
            <button class="remover-aluno">Remover</button>
        `;
        alunosList.appendChild(li);
    });

    // Remover aluno
    alunosList.addEventListener("click", (event) => {
        if (event.target.classList.contains("remover-aluno")) {
            event.target.parentElement.remove();
        }
    });

    // Salvar alterações
    salvarTurmaBtn.addEventListener("click", async () => {
        const turma = turmaSelect.value;
        let alunos = Array.from(alunosList.querySelectorAll("input"))
            .map(input => input.value.trim())
            .filter(aluno => aluno !== "");

        if (!turma || alunos.length === 0) {
            alert("Selecione uma turma e adicione pelo menos um aluno.");
            return;
        }

        // Ordena os nomes dos alunos em ordem alfabética
        alunos = alunos.sort((a, b) => a.localeCompare(b));

        const dadosAtualizados = { turma, alunos };

        try {
            const response = await fetch('http://localhost:3000/editar-turma', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            });

            if (response.ok) {
                // Exibe mensagem de sucesso
                const mensagemAtualizacao = document.getElementById("mensagem-atualizacao");
                mensagemAtualizacao.classList.remove("hidden");

                // Oculta a mensagem e esconde a seção após 3 segundos
                setTimeout(() => {
                    mensagemAtualizacao.classList.add("hidden");
                    turmaDetails.classList.add("hidden");  // Oculta a seção "Editar Alunos da Turma"
                    alunosList.innerHTML = "";  // Limpa os nomes dos alunos
                }, 2000);

                document.getElementById("turma-select").value = "";
            } else {
                alert("Erro ao atualizar a turma.");
            }
        } catch (error) {
            console.error("Erro ao salvar a turma:", error);
        }
    });

    // Exibir a confirmação ao clicar em "Excluir Turma"
    excluirTurmaBtn.addEventListener("click", () => {
        confirmacaoExclusao.classList.remove("hidden");
    });

    // Confirmar exclusão
    confirmarExclusaoBtn.addEventListener("click", async () => {
        const turma = turmaSelect.value;

        try {
            const response = await fetch('http://localhost:3000/excluir-turma', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ turma })
            });

            if (response.ok) {
                carregarTurmas();  // Atualiza a lista de turmas
                turmaDetails.classList.add("hidden");  // Oculta a seção de edição
                confirmacaoExclusao.classList.add("hidden");  // Oculta a confirmação de exclusão
            } else {
                console.error("Erro ao excluir a turma.");
            }
        } catch (error) {
            console.error("Erro ao excluir a turma:", error);
        }
    });

    // Cancelar exclusão
    cancelarExclusaoBtn.addEventListener("click", () => {
        confirmacaoExclusao.classList.add("hidden");  // Oculta a confirmação
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

    carregarTurmas();  // Carregar as turmas ao carregar a página
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
    });
};

