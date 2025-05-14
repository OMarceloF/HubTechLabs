let dadosTurmas = {};

async function carregarTurmasInstrutor() {
    try {

        //🚭Como era na Vercel
        const response = await fetch("https://hub-orcin.vercel.app/dados");
        //🚭Como é localmente
        //const response = await fetch("http://localhost:3000/dados");

        const dados = await response.json();
        const nomeInstrutor = localStorage.getItem("nomeUsuario");

        dadosTurmas = Object.fromEntries(
            Object.entries(dados).filter(([_, turma]) =>
                turma.instrutor === nomeInstrutor
            )
        );

        const turmaOrigemSelect = document.getElementById("turma-origem");
        const turmaDestinoSelect = document.getElementById("turma-destino");

        for (const nomeTurma in dadosTurmas) {
            turmaOrigemSelect.add(new Option(nomeTurma, nomeTurma));
            turmaDestinoSelect.add(new Option(nomeTurma, nomeTurma));
        }
    } catch (err) {
        alert("Erro ao carregar turmas.");
        console.error(err);
    }
}

document.getElementById("turma-origem").addEventListener("change", (e) => {
    const turma = e.target.value;
    const alunoSelect = document.getElementById("aluno");
    alunoSelect.innerHTML = '<option disabled selected>Selecione o aluno</option>';

    const alunos = dadosTurmas[turma]?.alunos || [];
    alunos.forEach(aluno => {
        alunoSelect.add(new Option(aluno, aluno));
    });
});


document.getElementById("mover-aluno").addEventListener("click", async () => {
    const origem = document.getElementById("turma-origem").value;
    const destino = document.getElementById("turma-destino").value;
    const aluno = document.getElementById("aluno").value;
    const msg = document.getElementById("mensagem");

    if (!origem || !destino || !aluno || origem === destino) {
        msg.textContent = "Preencha os campos corretamente.";
        msg.classList.remove("mensagem-sucesso");
        msg.classList.add("mensagem-erro");
        msg.classList.remove("hidden");
        return;
    }

    try {
        //🚭Como era na Vercel
        const res = await fetch("https://hub-orcin.vercel.app/dados");
        //🚭Como é localmente
        //const res = await fetch("http://localhost:3000/dados");
        const dados = await res.json();

        const alunosOrigem = dados[origem]?.alunos || [];
        const alunosDestino = dados[destino]?.alunos || [];

        const novaOrigem = alunosOrigem.filter(a => a !== aluno);
        const novaDestino = [...alunosDestino, aluno];

        const turmaIdOrigem = dados[origem]?.id;
        const turmaIdDestino = dados[destino]?.id;

        // Atualiza lista de alunos
        //Como era na Vercel
        await fetch("https://hub-orcin.vercel.app/editar-turma", {
        //Como é localmente
        //await fetch("http://localhost:3000/editar-turma", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ turma: origem, alunos: novaOrigem })
        });

        //Como era na Vercel
        await fetch("https://hub-orcin.vercel.app/editar-turma", {
        //Como é localmente
        //await fetch("http://localhost:3000/editar-turma", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ turma: destino, alunos: novaDestino })
        });

        // Atualiza registros da tabela presencas com novo turma_id
        //Como era na Vercel
        await fetch("https://hub-orcin.vercel.app/atualizar-presencas-aluno", {
        //Como é localmente
        //await fetch("http://localhost:3000/atualizar-presencas-aluno", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                aluno,
                turmaIdAntiga: turmaIdOrigem,
                turmaIdNova: turmaIdDestino
            })
        });

        msg.textContent = "Aluno movido com sucesso!";
        msg.classList.remove("mensagem-erro");
        msg.classList.add("mensagem-sucesso");
        msg.classList.remove("hidden");

        setTimeout(() => {
            msg.classList.add("hidden");
            msg.textContent = "";
        }, 3000);

        // Resetar selects
        document.getElementById("turma-origem").value = "";
        document.getElementById("aluno").innerHTML = '<option selected disabled>Selecione o aluno</option>';
        document.getElementById("turma-destino").value = "";

    } catch (err) {
        msg.textContent = "Erro ao mover aluno.";
        msg.classList.remove("mensagem-sucesso");
        msg.classList.add("mensagem-erro");
        msg.classList.remove("hidden");
        console.error(err);
    }
});



window.onload = carregarTurmasInstrutor;
