let turmas = [];

// Função para adicionar um novo campo de aluno
function adicionarInput(containerId = "inputs-alunos") {
    const inputsContainer = document.getElementById(containerId);

    const div = document.createElement("div");
    div.classList.add("input-group");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Nome do Aluno";
    input.classList.add("input-aluno");

    const addButton = document.createElement("button");
    addButton.classList.add("add-button", "green-button");
    addButton.innerText = "+";
    addButton.onclick = () => adicionarInput(containerId);

    const removeButton = document.createElement("button");
    removeButton.classList.add("remove-button", "red-button");
    removeButton.innerText = "x";
    removeButton.onclick = () => removerInput(removeButton);

    div.appendChild(input);
    div.appendChild(addButton);
    div.appendChild(removeButton);
    inputsContainer.appendChild(div);

    atualizarBotoesRemocao(containerId); // Atualiza a visibilidade do botão "X"
}

document.addEventListener('DOMContentLoaded', () => {
    async function carregarUnidades() {
    try {
        //🚭Como era na Vercel
        const response = await fetch('https://hub-orcin.vercel.app/listar-unidades'); 
        //🚭Como é localmente
        //const response = await fetch('http://localhost:3000/listar-unidades');
        if (!response.ok) throw new Error('Erro ao buscar unidades');
        
        const unidades = await response.json();
        const unidadeSelect = document.getElementById('unidade-select');
        
        // Limpa o select antes de adicionar novas opções
        unidadeSelect.innerHTML = '<option value="" disabled selected>Selecione uma unidade</option>';

        unidades.forEach(unidade => {
            if (unidade.unidade !== "Unidade Base") { // Filtra "Unidade Base"
                const option = document.createElement('option');
                option.value = unidade.id;
                option.textContent = unidade.unidade;
                unidadeSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar unidades:", error);
    }
}  
    carregarUnidades()
});



// Função para remover um campo de aluno
function removerInput(button) {
    const inputGroup = button.parentNode;
    inputGroup.remove();
    atualizarBotoesRemocao(); // Atualiza a visibilidade do botão "X" após remoção
}

// Função para atualizar a visibilidade dos botões "X"
function atualizarBotoesRemocao(containerId = "inputs-alunos") {
    const inputsContainer = document.getElementById(containerId);
    const inputGroups = inputsContainer.querySelectorAll(".input-group");
    inputGroups.forEach((group, index) => {
        const removeButton = group.querySelector(".remove-button");
        if (index === 0) {
            removeButton.style.display = "none"; // O primeiro input não mostra "X"
        } else {
            removeButton.style.display = "inline-block"; // Inputs adicionais mostram "X"
        }
    });
}

// Função para adicionar alunos da lista colada no textarea
function adicionarListaAlunos() {
    const textarea = document.getElementById("lista-alunos-textarea");
    const listaNomes = textarea.value.trim().split("\n").map(nome => nome.trim()).filter(nome => nome.length > 0);

    if (listaNomes.length === 0) {
        alert("A lista de alunos está vazia. Insira pelo menos um nome.");
        return;
    }

    const inputsContainer = document.getElementById("inputs-alunos");
    const inputsExistentes = inputsContainer.querySelectorAll(".input-aluno");

    // Preenche o primeiro campo vazio existente
    let index = 0;
    inputsExistentes.forEach(input => {
        if (input.value.trim() === "" && index < listaNomes.length) {
            input.value = listaNomes[index];
            index++;
        }
    });

    // Adiciona novos campos para os nomes restantes
    for (; index < listaNomes.length; index++) {
        const div = document.createElement("div");
        div.classList.add("input-group");

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Nome do Aluno";
        input.value = listaNomes[index];
        input.classList.add("input-aluno");

        const removeButton = document.createElement("button");
        removeButton.classList.add("remove-button", "red-button");
        removeButton.innerText = "x";
        removeButton.onclick = () => removerInput(removeButton);

        div.appendChild(input);
        div.appendChild(removeButton);
        inputsContainer.appendChild(div);
    }

    textarea.value = ""; // Limpa a área de texto após adicionar
    atualizarBotoesRemocao(); // Atualiza os botões de remoção
}

// Função para salvar a turma
async function salvarTurma() {
    const unidadeSelect = document.getElementById('unidade-select');
const unidadeId = unidadeSelect.value;
const unidadeNome = unidadeSelect.options[unidadeSelect.selectedIndex].text;

const nomeBaseTurma = document.getElementById('nome-turma').value.trim();
const nomeTurma = `${nomeBaseTurma} - ${unidadeNome}`;

    const nomeInstrutor = document.getElementById("nome-instrutor").value.trim();
    const alunosInputs = document.querySelectorAll("#inputs-alunos .input-aluno");
    let alunos = [];

    alunosInputs.forEach((input) => {
        const nomeAluno = input.value.trim();
        if (nomeAluno) {
            alunos.push(nomeAluno);
        }
    });

    if (!nomeTurma) {
        alert("Por favor, insira um nome para a turma.");
        return;
    }

    if (!nomeInstrutor) {
        alert("Por favor, insira o nome do instrutor.");
        return;
    }

    if (alunos.length === 0) {
        alert("Por favor, insira pelo menos um nome de aluno.");
        return;
    }

    // Ordena os nomes dos alunos em ordem alfabética
    alunos = alunos.sort((a, b) => a.localeCompare(b));

    const dados = {
        turma: nomeTurma,
        instrutor: nomeInstrutor,
        alunos: alunos,
        unidade_id: unidadeId
    };

    try {
        //🚭Como era na Vercel
        const response = await fetch('https://hub-orcin.vercel.app/salvar-turma',
        //🚭Como é localmente
        //const response = await fetch('http://localhost:3000/salvar-turma', 
            {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            // Resetar campos do formulário
            document.getElementById("nome-turma").value = "";
            document.getElementById("nome-instrutor").value = "";
            document.getElementById("inputs-alunos").innerHTML = "";
            adicionarInput(); // Adiciona um novo input vazio

            // Exibir mensagem de sucesso
            const mensagemSucesso = document.getElementById("mensagem-sucesso");
            mensagemSucesso.classList.remove("hidden");

            // Ocultar mensagem após 3 segundos
            setTimeout(() => {
                mensagemSucesso.classList.add("hidden");
            }, 3000);

        } else {
            alert("Erro ao salvar os dados!");
        }
    } catch (error) {
    }
}

// Função para exibir a turma na lista
function exibirTurma(turma) {
    const listaTurmas = document.getElementById("lista-turmas");
    const turmaCard = document.createElement("div");
    turmaCard.classList.add("turma-card");
    turmaCard.setAttribute("data-id", turma.id);
    turmaCard.classList.add("edit-mode");

    const turmaInfo = document.createElement("div");
    turmaInfo.classList.add("turma-info");
    turmaInfo.innerHTML = `
        <div class="turma-title">${turma.nomeTurma}</div>
        <div><strong>${turma.alunos.length} alunos</strong></div>
        <div class="buttons">
            <button class="edit-button" onclick="editarTurma(${turma.id})">Editar</button>
            <button class="remove-button red-button" onclick="removerTurma(${turma.id})">Excluir</button>
        </div>
    `;

    turmaCard.appendChild(turmaInfo);
    listaTurmas.appendChild(turmaCard);
}

// Função para editar uma turma
function editarTurma(id) {
    const turma = turmas.find((t) => t.id === id);
    if (!turma) return;

    const turmaCard = document.querySelector(`.turma-card[data-id="${id}"]`);
    turmaCard.innerHTML = `
        <div class="section">
            <label><strong>Editar Nome da Turma</strong></label>
            <input type="text" id="edit-nome-turma-${id}" class="edit-input" value="${turma.nomeTurma}">
        </div>
        <div class="section">
            <label><strong>Editar Alunos</strong></label>
            <div id="edit-inputs-alunos-${id}">
                ${turma.alunos.map((aluno, index) => `
                    <div class="input-group">
                        <input type="text" class="input-aluno" value="${aluno}">
                        <button class="remove-button red-button" onclick="removerInput(this)" style="${index === 0 ? 'display:none;' : ''}">X</button>
                    </div>
                `).join('')}
            </div>
            <button class="add-button green-button" onclick="adicionarInput('edit-inputs-alunos-${id}')">+</button>
        </div>
        <button class="save-button" onclick="salvarEdicao(${id})">Salvar Alterações</button>
    `;
}

// Função para salvar as alterações feitas na turma
function salvarEdicao(id) {
    const nomeTurmaEditado = document.getElementById(`edit-nome-turma-${id}`).value.trim();
    const alunosInputsEditados = document.querySelectorAll(`#edit-inputs-alunos-${id} .input-aluno`);
    const alunosEditados = [];

    alunosInputsEditados.forEach((input) => {
        const nomeAluno = input.value.trim();
        if (nomeAluno) {
            alunosEditados.push(nomeAluno);
        }
    });

    if (!nomeTurmaEditado || alunosEditados.length === 0) {
        alert("Preencha o nome da turma e ao menos um aluno.");
        return;
    }

    const turmaIndex = turmas.findIndex((t) => t.id === id);
    turmas[turmaIndex].nomeTurma = nomeTurmaEditado;
    turmas[turmaIndex].alunos = alunosEditados;

    document.getElementById("lista-turmas").innerHTML = "";
    turmas.forEach(exibirTurma);
}

// Função para remover uma turma
function removerTurma(id) {
    turmas = turmas.filter((t) => t.id !== id);
    document.getElementById("lista-turmas").innerHTML = "";
    turmas.forEach(exibirTurma);
}

// Função para limpar o formulário
function limparFormulario() {
    document.getElementById("nome-turma").value = "";
    document.getElementById("inputs-alunos").innerHTML = "";
    adicionarInput();
}

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

    const token = localStorage.getItem('token');
    //const token = getTokenFromCookie();

    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "/Login/login.html";
        return;
    }

    async function carregarPerfil() {
        try {
        //🚭Como era na Vercel
        const response = await fetch('https://hub-orcin.vercel.app/perfil',
        //🚭Como é localmente
        //const response = await fetch('http://localhost:3000/perfil',
            {
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

    async function carregarInstrutores() {
    try {
        //🚭Como era na Vercel
        const response = await fetch('https://hub-orcin.vercel.app/listar-instrutores');
        //🚭Como é localmente
        //const response = await fetch('http://localhost:3000/listar-instrutores');
        if (!response.ok) throw new Error("Erro ao carregar os instrutores.");

        const instrutores = await response.json();
        const selectInstrutor = document.getElementById("nome-instrutor");
        
        // Limpa o select antes de adicionar novos instrutores
        selectInstrutor.innerHTML = '<option value="" disabled selected>Selecione um Instrutor</option>';

        instrutores.forEach(instrutor => {
            if (instrutor.name !== "Instrutor da Silva") { // Filtra "Instrutor da Silva"
                const option = document.createElement("option");
                option.value = instrutor.name;
                option.textContent = instrutor.name;
                selectInstrutor.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar instrutores:", error);
    }
}

    carregarInstrutores();
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

async function carregarUnidades() {
    try {
        //🚭Como era na Vercel
        const response = await fetch('https://hub-orcin.vercel.app/listar-unidades');
        //🚭Como é localmente
        //const response = await fetch('http://localhost:3000/listar-unidades');
        if (!response.ok) throw new Error('Erro ao buscar unidades');
        const unidades = await response.json();

        const unidadeSelect = document.getElementById('unidade-select');
        unidades.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade.id;
            option.textContent = unidade.nome;
            unidadeSelect.appendChild(option);
        });
    } catch (error) {
    }
}

// Atualizar a função salvarTurma para enviar unidade_id
async function salvarTurma() {
    const unidadeSelect = document.getElementById('unidade-select');
const unidadeId = unidadeSelect.value;
const unidadeNome = unidadeSelect.options[unidadeSelect.selectedIndex].text;

const nomeBaseTurma = document.getElementById('nome-turma').value.trim();
const nomeTurma = `${nomeBaseTurma} - ${unidadeNome}`;

    const nomeInstrutor = document.getElementById('nome-instrutor').value.trim();
    const alunosInputs = document.querySelectorAll('#inputs-alunos .input-aluno');

    const alunos = Array.from(alunosInputs)
        .map(input => input.value.trim())
        .filter(nome => nome.length > 0);

    if (!unidadeId || !nomeTurma || !nomeInstrutor || alunos.length === 0) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }

    const dados = { turma: nomeTurma, instrutor: nomeInstrutor, alunos, unidade_id: unidadeId };

    try {
            //🚭Como era na Vercel
            const response = await fetch('https://hub-orcin.vercel.app/salvar-turma',
            //🚭Como é localmente
            //const response = await fetch('http://localhost:3000/salvar-turma', 
                {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });

        if (response.ok) {
            alert('Turma salva com sucesso!');
            window.location.reload();
        } else {
            throw new Error('Erro ao salvar a turma.');
        }
    } catch (error) {
    }
}




