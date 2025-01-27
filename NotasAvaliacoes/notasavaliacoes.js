document.addEventListener("DOMContentLoaded", () => {
    const turmaSelect = document.getElementById("turma-select");
    const avaliacaoSelect = document.getElementById("avaliacao-select");
    const formNotas = document.getElementById("form-notas");
    const alunosContainer = document.getElementById("alunos-container");
    const salvarNotasBtn = document.getElementById("salvar-notas-btn");

    // Função para carregar as turmas
    async function carregarTurmas() {
        try {
            const response = await fetch('http://localhost:3000/dados'); // Usando a rota correta
            if (!response.ok) {
                throw new Error("Erro ao buscar as turmas");
            }

            const turmas = await response.json(); // Obtenha as turmas
            turmaSelect.innerHTML = '<option value="" disabled selected>Selecione uma turma</option>';

            Object.keys(turmas).forEach(turma => {
                const option = document.createElement('option');
                option.value = turma;
                option.textContent = turma; // Exibe o nome da turma corretamente
                turmaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar as turmas:', error);
        }
    }

    // Função para carregar avaliações da turma selecionada
    async function carregarAvaliacoes(turma) {
        try {
            const response = await fetch('http://localhost:3000/avaliacoes'); // Ajuste para a rota que retorna as avaliações
            const avaliacoes = await response.json();

            // Filtra as avaliações pela turma selecionada
            const avaliacoesFiltradas = avaliacoes.filter(avaliacao => avaliacao.turma === turma);

            avaliacaoSelect.innerHTML = '<option value="">Selecione uma avaliação</option>';

            if (avaliacoesFiltradas.length === 0) {
                alert(`Nenhuma avaliação encontrada para a turma "${turma}".`);
                return;
            }

            // Exibe as avaliações filtradas no dropdown
            avaliacoesFiltradas.forEach(avaliacao => {
                const option = document.createElement("option");
                option.value = avaliacao.nome_avaliacao; // Nome da avaliação
                option.textContent = `${avaliacao.nome_avaliacao} - ${formatarData(avaliacao.data_avaliacao)}`; // Exibe nome e data
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

    // Função para formatar data para o formato dd/mm/yyyy
    function formatarData(dataISO) {
        const data = new Date(dataISO);
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    // Função para gerar lista de alunos da turma
    async function gerarListaAlunos(turma) {
        try {
            const response = await fetch('http://localhost:3000/dados'); // Ajuste a rota para obter as turmas
            const dados = await response.json();
            const turmaData = dados[turma]; // Obtém os dados da turma

            // Verifica se a turma contém a lista de alunos
            const alunos = turmaData?.alunos || [];

            if (alunos.length === 0) {
                alert(`Nenhum aluno encontrado para a turma "${turma}".`);
                alunosContainer.classList.add("hidden");
                return; // Usar return dentro da função, não fora
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
            console.error("Erro ao carregar alunos:", error);
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

    // Função para exibir mensagens de sucesso ou erro
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

    // Função para resetar os campos
    function resetarCampos() {
        formNotas.reset();
        alunosContainer.classList.add("hidden");
        document.getElementById("turma-select").value = "";
        document.getElementById("avaliacao-select").value = "";
    }

    // Função para obter lista de alunos
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

    // Função para mostrar alunos selecionados
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

    // Carregar turmas ao abrir a página
    window.onload = carregarTurmas;
});
