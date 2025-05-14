// 🔹 Função para obter nome do usuário logado
async function obterNomeUsuario() {
    try {
        const email = localStorage.getItem("email");
        if (!email) throw new Error("Nenhum email encontrado");

        //🚭Como era na Vercel
        const response = await fetch("https://hub-orcin.vercel.app/usuarios");
        //🚭Como é localmente
        //const response = await fetch("http://localhost:3000/usuarios");
        if (!response.ok) throw new Error("Erro ao buscar usuários");

        const usuarios = await response.json();
        const usuario = usuarios.find(user => user.email === email);

        if (usuario) {
            localStorage.setItem("nomeUsuario", usuario.name);
        } else {
            console.warn("Usuário não encontrado");
        }
    } catch (err) {
        console.error("Erro ao obter nome:", err);
    }
}

// 🔹 Função para carregar turmas do instrutor logado
async function carregarTurmas() {
    try {
        //🚭Como era na Vercel
        const response = await fetch("https://hub-orcin.vercel.app/dados");
        //🚭Como é localment
        //const response = await fetch("http://localhost:3000/dados");
        if (!response.ok) throw new Error("Erro ao buscar turmas");

        const turmas = await response.json();
        const nomeUsuario = localStorage.getItem("nomeUsuario");
        if (!nomeUsuario) throw new Error("Nome do usuário não encontrado");

        const turmasFiltradas = Object.fromEntries(
            Object.entries(turmas).filter(([_, turma]) => turma.instrutor === nomeUsuario)
        );

        const select = document.getElementById("turma-select");
        select.innerHTML = `<option disabled selected>Escolha sua turma</option>`;
        for (const nomeTurma in turmasFiltradas) {
            const option = document.createElement("option");
            option.value = nomeTurma;
            option.textContent = nomeTurma;
            select.appendChild(option);
        }

        window.turmas = turmasFiltradas;
    } catch (err) {
        console.error("Erro ao carregar turmas:", err);
    }
}

// 🔹 Inicialização
document.addEventListener("DOMContentLoaded", async () => {
    const tipoUsuario = localStorage.getItem("tipoUsuario");
    if (tipoUsuario === "Coordenador") window.location.href = "/Erro/erro.html";

    const token = localStorage.getItem('token');
    //const token = getTokenFromCookie();


    if (!token) {
        alert("Você precisa estar logado.");
        window.location.href = "/Login/login.html";
        return;
    }

    const turmaSelect = document.getElementById("turma-select");
    const alunosList = document.getElementById("alunos-list");
    const turmaDetails = document.getElementById("turma-details");

    // 🔹 Perfil
    try {
        //🚭Como era na Vercel
        const response = await fetch('https://hub-orcin.vercel.app/perfil', 
        //🚭Como é localmente
        //const res = await fetch("http://localhost:3000/perfil",
            {
                headers: { Authorization: token }
            });
        const perfil = await res.json();
        document.getElementById("profile-photo").src = perfil.photo || "/projeto/Imagens/perfil.png";
    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
    }

    await obterNomeUsuario();
    await carregarTurmas();

    // 🔹 Ao selecionar turma
    turmaSelect.addEventListener("change", async () => {
        const turma = turmaSelect.value;
        //🚭Como era na Vercel
        const response = await fetch("https://hub-orcin.vercel.app/dados");
        //🚭Como é localmente
        //const response = await fetch("http://localhost:3000/dados");


        const dados = await response.json();

        if (!dados[turma]?.alunos) {
            alunosList.innerHTML = "<p>Não há alunos cadastrados.</p>";
            turmaDetails.classList.add("hidden");
            return;
        }

        alunosList.innerHTML = "";
        turmaDetails.classList.remove("hidden");

        dados[turma].alunos.sort().forEach(aluno => {
            const li = document.createElement("li");
            li.innerHTML = `
                <input type="text" value="${aluno}" readonly>
                <button class="remover-aluno">Remover</button>
            `;
            alunosList.appendChild(li);
        });
    });

    // 🔹 Adicionar aluno
    document.getElementById("adicionar-aluno").addEventListener("click", () => {
        const li = document.createElement("li");
        li.innerHTML = `
            <input type="text" placeholder="Nome do Aluno">
            <button class="remover-aluno">Remover</button>
        `;
        alunosList.appendChild(li);
    });

    // 🔹 Remover aluno
    alunosList.addEventListener("click", (e) => {
        if (e.target.classList.contains("remover-aluno")) {
            e.target.parentElement.remove();
        }
    });

    // 🔹 Salvar alterações
    document.getElementById("salvar-turma").addEventListener("click", async () => {
        const turma = turmaSelect.value.trim();
        const alunos = Array.from(alunosList.querySelectorAll("input"))
            .map(i => i.value.trim())
            .filter(Boolean)
            .sort();

        if (!turma || alunos.length === 0) {
            alert("Selecione uma turma e adicione pelo menos um aluno.");
            return;
        }

        try {
            //🚭Como era na Vercel
            const res = await fetch("https://hub-orcin.vercel.app/editar-turma", {
            //🚭Como é localment
            //const res = await fetch("http://localhost:3000/editar-turma", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ turma, alunos })
            });

            const text = await res.text();

            if (res.ok) {
                document.getElementById("mensagem-atualizacao").classList.remove("hidden");
                setTimeout(() => {
                    document.getElementById("mensagem-atualizacao").classList.add("hidden");
                    turmaDetails.classList.add("hidden");
                    alunosList.innerHTML = "";
                    turmaSelect.value = "";
                }, 2000);
            } else {
                console.error("Erro:", text);
                alert("Erro ao atualizar a turma: " + text);
            }
        } catch (err) {
            console.error("Erro ao salvar:", err);
            alert("Erro ao enviar os dados para o servidor.");
        }
    });

    // 🔹 Excluir turma
    document.getElementById("excluir-turma").addEventListener("click", () => {
        document.getElementById("confirmacao-exclusao").classList.remove("hidden");
    });

    document.getElementById("confirmar-exclusao").addEventListener("click", async () => {
        const turma = turmaSelect.value;
        //🚭Como era na Vercel
        const res = await fetch("https://hub-orcin.vercel.app/excluir-turma", {
        //🚭Como é localmente
        //const res = await fetch("http://localhost:3000/excluir-turma", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ turma })
        });

        if (res.ok) {
            await carregarTurmas();
            turmaDetails.classList.add("hidden");
            document.getElementById("confirmacao-exclusao").classList.add("hidden");
        }
    });

    document.getElementById("cancelar-exclusao").addEventListener("click", () => {
        document.getElementById("confirmacao-exclusao").classList.add("hidden");
    });
    document.getElementById("alterar-alunos").addEventListener("click", () => {
        const turmaSelecionada = document.getElementById("turma-select").value;
        if (!turmaSelecionada) {
            alert("Selecione uma turma para alterar.");
            return;
        }
        localStorage.setItem("turmaParaEditar", turmaSelecionada);
        window.location.href = "/EditarTurmas/alterarAlunos.html";
    });

});

// 🔹 Alterna o menu do perfil
function toggleMudarPerfil() {
    const box = document.getElementById("mudarPerfil");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", (e) => {
    const perfilBox = document.getElementById("mudarPerfil");
    const userInfo = document.getElementById("user-info");

    if (perfilBox.style.display === "flex" &&
        !perfilBox.contains(e.target) &&
        !userInfo.contains(e.target)) {
        perfilBox.style.display = "none";
    }
});
