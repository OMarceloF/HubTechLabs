document.addEventListener("DOMContentLoaded", () => {
    const turmaSelect = document.getElementById("turma-select");
    const alunosList = document.getElementById("alunos-list");
    const turmaDetails = document.getElementById("turma-details");
    const adicionarAlunoBtn = document.getElementById("adicionar-aluno");
    const excluirTurmaBtn = document.getElementById("excluir-turma");
    const salvarTurmaBtn = document.getElementById("salvar-turma");
    const confirmacaoExclusao = document.getElementById("confirmacao-exclusao");
    const confirmarExclusaoBtn = document.getElementById("confirmar-exclusao");
    const cancelarExclusaoBtn = document.getElementById("cancelar-exclusao");

    // Função para carregar as turmas
    async function carregarTurmas() {
        try {
            const response = await fetch('http://localhost:3000/dados');
            const dados = await response.json();

            turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
            Object.keys(dados).forEach(turma => {
                const option = document.createElement('option');
                option.value = turma;
                option.textContent = turma;
                turmaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar as turmas:', error);
        }
    }

    // Mostrar detalhes após seleção da turma
    turmaSelect.addEventListener("change", () => {
        const turmaSelecionada = turmaSelect.value;

        if (!turmaSelecionada) {
            turmaDetails.classList.add("hidden");
            return;
        }

        fetch(`http://localhost:3000/dados`)
            .then(response => response.json())
            .then(dados => {
                const alunos = dados[turmaSelecionada]?.alunos || [];
                alunosList.innerHTML = '';  // Limpa lista anterior

                alunos.forEach(aluno => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <input type="text" value="${aluno}" readonly>
                        <button class="remover-aluno">Remover</button>
                    `;
                    alunosList.appendChild(li);
                });

                turmaDetails.classList.remove("hidden");  // Exibe a seção de detalhes
            })
            .catch(error => console.error('Erro ao carregar alunos:', error));
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

        // Ordenar os nomes dos alunos em ordem alfabética
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

    carregarTurmas();  // Carregar as turmas ao carregar a página
});
