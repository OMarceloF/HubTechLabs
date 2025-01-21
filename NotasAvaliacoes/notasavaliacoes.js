document.addEventListener("DOMContentLoaded", () => {
    const turmaSelect = document.getElementById("turma-select");
    const avaliacaoSelect = document.getElementById("avaliacao-select");
    const formNotas = document.getElementById("form-notas");
    const alunosContainer = document.getElementById("alunos-container");
    const salvarNotasBtn = document.getElementById("salvar-notas-btn");

    // Função para carregar as turmas
    async function carregarTurmas() {
        try {
            const response = await fetch('http://localhost:3000/dados'); // Use a rota correta
            if (!response.ok) {
                throw new Error("Erro ao buscar as turmas");
            }
    
            const turmas = await response.json(); // Obtenha as turmas
            const turmaSelect = document.getElementById("turma-select");
    
            // Limpa o dropdown antes de preenchê-lo
            turmaSelect.innerHTML = '<option value="" disabled selected>Selecione uma turma</option>';
    
            for (const turma in turmas) {
                const option = document.createElement('option');
                option.value = turma;
                option.textContent = turma;
                turmaSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Erro ao carregar as turmas:', error);
        }
    }
    

    // Função para carregar avaliações da turma selecionada
    async function carregarAvaliacoes(turma) {
        try {
            const response = await fetch('http://localhost:3000/avaliacoes'); // Endpoint para listar avaliações
            const avaliacoes = await response.json();
            const avaliacoesFiltradas = avaliacoes.filter(avaliacao => avaliacao.turma === turma);

            avaliacaoSelect.innerHTML = '<option value="">Selecione uma avaliação</option>';
            if (avaliacoesFiltradas.length === 0) {
                alert(`Nenhuma avaliação encontrada para a turma "${turma}".`);
                return;
            }

            avaliacoesFiltradas.forEach(avaliacao => {
                const option = document.createElement('option');
                option.value = avaliacao.nomeAvaliacao;
                option.textContent = avaliacao.nomeAvaliacao;
                avaliacaoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar as avaliações:', error);
        }
    }



    // Evento de seleção de turma
    turmaSelect.addEventListener("change", () => {
        const turmaSelecionada = turmaSelect.value;
        if (turmaSelecionada) {
            carregarAvaliacoes(turmaSelecionada);
        }
    });

    async function gerarListaAlunos(turma) {
        try {
            const response = await fetch('http://localhost:3000/dados'); // Carrega os dados das turmas
            const dados = await response.json();
            const turmaData = dados[turma]; // Obtém os dados da turma
    
            // Verifica se a turma contém a lista de alunos
            const alunos = Array.isArray(turmaData) ? turmaData : turmaData?.alunos || [];
    
            if (alunos.length === 0) {
                alert(`Nenhum aluno encontrado para a turma "${turma}".`);
                alunosContainer.classList.add("hidden");
                return;
            }
    
            formNotas.innerHTML = `
                <table class="tabela-notas">
                    <thead>
                        <tr>
                            <th>Nome do Aluno</th>
                            <th>Nota</th>
                        </tr>
                    </thead>
                    <tbody id="tabela-body"></tbody>
                </table>
            `;
    
            const tabelaBody = document.getElementById("tabela-body");
    
            alunos.forEach(aluno => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${aluno}</td>
                    <td>
                        <select data-aluno="${aluno}" required>
                            <option value="">Nota</option>
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </td>
                `;
                tabelaBody.appendChild(row);
            });
    
            alunosContainer.classList.remove("hidden"); // Exibe a tabela
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
        }
    }
    

    // Evento de seleção de avaliação
    avaliacaoSelect.addEventListener("change", () => {
        const turmaSelecionada = turmaSelect.value;
        if (turmaSelecionada) {
            gerarListaAlunos(turmaSelecionada);
        }
    });

    // Função para salvar notas
    salvarNotasBtn.addEventListener("click", async () => {
        const turma = turmaSelect.value;
        const avaliacao = avaliacaoSelect.value;
        const inputsNotas = formNotas.querySelectorAll('select[data-aluno]');
    
        const notas = Array.from(inputsNotas).map(input => ({
            aluno: input.dataset.aluno,
            nota: input.value === "" ? "Não Avaliado" : parseFloat(input.value)  // Define "Não Avaliado" se não houver nota
        }));
    
        const dadosNotas = {
            turma,
            avaliacao,
            notas
        };
    
        try {
            const response = await fetch('http://localhost:3000/salvar-notas-avaliacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosNotas)
            });
    
            if (response.ok) {
                exibirMensagem("Avaliação salva com sucesso!", false, () => resetarCampos());
            } else {
                alert("Erro ao salvar as notas.");
            }
        } catch (error) {
            console.error("Erro ao salvar as notas:", error);
        }
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

    function resetarCampos() {
        formNotas.reset();
        alunosContainer.classList.add("hidden");
        document.getElementById("turma-select").value = "";
        document.getElementById("avaliacao-select").value = "";
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

    carregarTurmas();
});


