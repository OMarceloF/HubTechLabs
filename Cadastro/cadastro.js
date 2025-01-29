document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("form-cadastro").addEventListener("submit", async (event) => {
        event.preventDefault();

        // Obtém os valores dos campos de formulário
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();
        const tipo = document.getElementById("tipo").value;

        
        // Validação simples para garantir que todos os campos essenciais estejam preenchidos
        if (!email || !senha || !tipo) {
            alert("Por favor, preencha todos os campos!");
            return;
        }

        try {
            // Envia a requisição ao backend para cadastrar o usuário
            const response = await fetch('http://localhost:3000/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email, senha, tipo, name: "", phone: "", city: "", state: "", unit: "", photo: "/projeto/Imagens/perfil.png"  // Campos adicionais com valores vazios
                })
            });

            const data = await response.json();
            alert(data.message);

            // Se o cadastro for bem-sucedido, redireciona para a página de login
            if (response.ok) {
                window.location.href = "/Login/login.html";
            }
        } catch (error) {
            console.error("Erro ao cadastrar usuário:", error);
            alert("Erro ao cadastrar usuário. Tente novamente.");
        }
    });
});
