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

        // Verifica se é um Coordenador e bloqueia o acesso
        if (tipoUsuario === 'Instrutor') {
            window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
        }
        } catch (error) {
            console.error("Não carregou o tipo", error);
            alert("Tentando carregr o tipo.");
        }
    }
    verificarAcessoRestrito();
    document.getElementById("form-cadastro").addEventListener("submit", async (event) => {
        event.preventDefault();

        // Obtém os valores dos campos de formulário
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();
        const tipo = document.getElementById("tipo").value;
        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const city = document.getElementById("city").value.trim();
        const state = document.getElementById("state").value.trim();
        const unit = document.getElementById("unit").value.trim();

        // Validação simples para garantir que todos os campos essenciais estejam preenchidos
        if (!email || !senha || !tipo || !name || !phone || !city || !state || !unit) {
            alert("Por favor, preencha todos os campos!");
            return;
        }

        try {
            // Envia a requisição ao backend para cadastrar o usuário
            const response = await fetch('http://localhost:3000/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha, tipo, name, phone, city, state, unit, photo: "/projeto/Imagens/perfil.png" })
            });

            const data = await response.json();
            alert(data.message);

        } catch (error) {
            console.error("Erro ao cadastrar usuário:", error);
            alert("Erro ao cadastrar usuário. Tente novamente.");
        }
    });
    
});