document.getElementById("cadastrar-btn").addEventListener("click", async () => {
    const unidade = document.getElementById("unidade").value.trim();
    const escola = document.getElementById("escola").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const coordenador = document.getElementById("coordenador").value.trim();

    console.log("📤 Enviando dados (form-urlencoded):", unidade, escola, cidade, coordenador);

    if (!unidade || !escola || !cidade || !coordenador) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    // Criar um FormData para enviar os dados no formato correto
    const formData = new URLSearchParams();
    formData.append("unidade", unidade);
    formData.append("escola", escola);
    formData.append("cidade", cidade);
    formData.append("coordenador", coordenador);

    

    try {
        const response = await fetch("http://localhost:3000/cadastrar-unidade", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" }, // Formato de formulário tradicional
            body: formData.toString()
        });

        const result = await response.text(); // Resposta em texto, sem JSON
        console.log("✅ Resposta do servidor:", result);

        if (response.ok) {
            alert(result);
            window.location.reload();
        } else {
            alert(`Erro: ${result}`);
        }
    } catch (error) {
        console.error("❌ Erro na requisição:", error);
        alert("Erro ao conectar-se ao servidor.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    function getUserType() {
        return localStorage.getItem("tipoUsuario");
    }
    async function verificarAcessoRestrito() {
        try {
        const tipoUsuario = getUserType();

        if (!tipoUsuario) {
            console.log("Não deu certo") 
        }

        if (tipoUsuario === 'Coordenador') {
            window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
        }
        if (tipoUsuario === 'Instrutor') {
            window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
        }
        } catch (error) {
            console.error("Não carregou o tipo", error);
            alert("Tentando carregr o tipo.");
        }
    }
    verificarAcessoRestrito();
});