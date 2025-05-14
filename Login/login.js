document.getElementById("form-login").addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
            //🚭Como era na Vercel
            const response = await fetch("https://hub-orcin.vercel.app/login",
            //🚭Como é localmente
            //const response = await fetch("http://localhost:3000/login",
            {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Armazena o token no cookie por 2 horas
            localStorage.setItem('token', data.token);
            
            // Armazena o tipo de usuário no localStorage
            localStorage.setItem('tipoUsuario', data.tipo);
            localStorage.setItem('email', email)

            // Redireciona para a página inicial ou para a página de acordo com o tipo de usuário
            if (data.tipo === 'DEV' || data.tipo === 'Coordenador') {
                window.location.href = "https://hub-orcin.vercel.app/index.html"; 
                //window.location.href = "http://localhost:3000/index.html"; // Redireciona para o painel
            } else {
                window.location.href = "https://hub-orcin.vercel.app/index.html"; 
                //window.location.href = "http://localhost:3000/index.html";// Página padrão
            }
        } else {
            alert(data.message); // Exibe a mensagem de erro caso não seja sucesso
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
    }
});
