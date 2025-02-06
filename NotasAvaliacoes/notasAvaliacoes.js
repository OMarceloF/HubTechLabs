function formatarDataParaExibicao(dataISO) {
    if (!dataISO) return "Data inválida";
    const data = new Date(dataISO);
    
    // Ajusta para o horário local
    data.setMinutes(data.getMinutes() + data.getTimezoneOffset());

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // +1 pois os meses começam do 0
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const turmaSelect = document.getElementById("turma-select");
    const avaliacaoSelect = document.getElementById("avaliacao-select");
    const formNotas = document.getElementById("form-notas");
    const alunosContainer = document.getElementById("alunos-container");
    const salvarNotasBtn = document.getElementById("salvar-notas-btn");

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
        const response = await fetch("https://hub-orcin.vercel.app/perfil", {
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

    // Função para carregar as turmas
    async function obterNomeUsuario() {
        try {
            const email = localStorage.getItem("email"); // Obtém o email armazenado
            if (!email) {
                throw new Error("Nenhum email encontrado no localStorage");
            }
    
            const response = await fetch("https://hub-orcin.vercel.app/usuarios"); // Chama a API
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
            const response = await fetch("https://hub-orcin.vercel.app/dados"); // Requisição ao backend
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

    // Função para carregar avaliações da turma selecionada
    async function carregarAvaliacoes(turma) {
        try {
            const response = await fetch('https://hub-orcin.vercel.app/avaliacoes'); // Ajuste para a rota que retorna as avaliações
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
                option.textContent = `${avaliacao.nome_avaliacao} - ${formatarDataParaExibicao(avaliacao.data_avaliacao)}`;

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
            const response = await fetch('https://hub-orcin.vercel.app/dados'); // Ajuste a rota para obter as turmas
            const dados = await response.json();
            const turmaData = dados[turma]; // Obtém os dados da turma

            // Verifica se a turma contém a lista de alunos
            const alunos = turmaData?.alunos || [];

            if (alunos.length === 0) {
                alert(`Nenhum aluno encontrado para a turma "${turma}".`);
                alunosContainer.classList.add("hidden");
                return; // Usar return dentro da função, não fora
            }

            alunos.sort((a, b) => a.localeCompare(b))

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
            const response = await fetch('https://hub-orcin.vercel.app/salvar-notas-avaliacoes', {
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
