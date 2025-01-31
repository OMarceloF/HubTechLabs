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