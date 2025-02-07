document.addEventListener("DOMContentLoaded", () => {
    function getUserType() {
        return localStorage.getItem("tipoUsuario");
    }

    function restringirOpcoesCargo() {
        const tipoUsuario = getUserType();
        const selectTipo = document.getElementById("tipo");

        if (tipoUsuario === "Coordenador" && selectTipo) {
            // Remove todas as opções existentes
            selectTipo.innerHTML = "";
            
            // Adiciona apenas a opção "Instrutor"
            const opcaoInstrutor = document.createElement("option");
            opcaoInstrutor.value = "Instrutor";
            opcaoInstrutor.textContent = "Instrutor";
            selectTipo.appendChild(opcaoInstrutor);
        }
    }

    async function verificarAcessoRestrito() {
        try {
            const tipoUsuario = getUserType();

            if (!tipoUsuario) {
                console.log("Não deu certo");
            }

            // Verifica se é um Instrutor e bloqueia o acesso
            if (tipoUsuario === 'Instrutor') {
                window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
            }
        } catch (error) {
            console.error("Não carregou o tipo", error);
            alert("Tentando carregar o tipo.");
        }
    }

    verificarAcessoRestrito();
    restringirOpcoesCargo(); // Chama a função para modificar as opções do select

    document.getElementById("form-cadastro").addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();
        const tipo = document.getElementById("tipo").value;
        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const city = document.getElementById("city").value.trim();
        const state = document.getElementById("state").value.trim();
        const unit = document.getElementById("unit").value.trim();

        if (!email || !senha || !tipo || !name || !phone || !city || !state || !unit) {
            alert("Por favor, preencha todos os campos!");
            return;
        }

        try {
            const response = await fetch('https://hub-orcin.vercel.app/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha, tipo, name, phone, city, state, unit, photo: "/projeto/Imagens/perfil.png" })
            });

            const data = await response.json();
            alert(data.message);

            // 🔹 Resetando o formulário após o cadastro bem-sucedido
            if (response.ok) {
                document.getElementById("form-cadastro").reset();
            }
        } catch (error) {
        }
    });

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

    async function carregarPerfil() {
        try {
            const response = await fetch('https://hub-orcin.vercel.app/perfil', {
                headers: { Authorization: token }
            });

            if (!response.ok) {
                throw new Error("Erro ao carregar os dados do perfil");
            }

            const data = await response.json();

            document.getElementById("profile-photo").src = data.photo || "/projeto/Imagens/perfil.png";
        } catch (error) {
        }
    }

    carregarPerfil();
});

function toggleMudarPerfil() {
    const mudarPerfil = document.getElementById("mudarPerfil");

    if (mudarPerfil.style.display === "none" || !mudarPerfil.style.display) {
        mudarPerfil.style.display = "block"; 
        mudarPerfil.style.display = "flex"; 
    } else {
        mudarPerfil.style.display = "none"; 
    }
}

// Fecha a caixa ao clicar fora dela
document.addEventListener("click", (event) => {
    const mudarPerfil = document.getElementById("mudarPerfil");
    const userInfo = document.getElementById("user-info");

    if (
        mudarPerfil.style.display === "flex" &&
        !mudarPerfil.contains(event.target) &&
        !userInfo.contains(event.target)
    ) {
        mudarPerfil.style.display = "none";
    }
});

// Função para formatar o telefone no padrão (99) 99999-9999
function formatarTelefone(event) {
    let telefone = event.target.value.replace(/\D/g, ""); // Remove tudo que não for número

    if (telefone.length > 11) {
        telefone = telefone.substring(0, 11); // Limita a 11 números
    }

    if (telefone.length > 10) {
        telefone = `(${telefone.substring(0, 2)}) ${telefone.substring(2, 7)}-${telefone.substring(7)}`;
    } else if (telefone.length > 6) {
        telefone = `(${telefone.substring(0, 2)}) ${telefone.substring(2, 6)}-${telefone.substring(6)}`;
    } else if (telefone.length > 2) {
        telefone = `(${telefone.substring(0, 2)}) ${telefone.substring(2)}`;
    } else if (telefone.length > 0) {
        telefone = `(${telefone}`;
    }

    event.target.value = telefone;
}

// Aplica a formatação ao campo de telefone
document.getElementById("phone").addEventListener("input", formatarTelefone);