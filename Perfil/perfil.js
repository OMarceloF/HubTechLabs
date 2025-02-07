document.addEventListener("DOMContentLoaded", () => {
    const profilePhoto = document.getElementById("profile-photo");
    const profileForm = document.getElementById("profile-form");

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
    }
    
    async function carregarPerfil() {
        try {
            const response = await fetch('https://hub-orcin.vercel.app/perfil', {
                headers: { 'Authorization': token }
            });
    
            if (!response.ok) {
                throw new Error("Erro ao carregar os dados do perfil");
            }
    
            const data = await response.json();
    
            // Preencher os campos do formulário
            document.getElementById("name").value = data.name || "";
            document.getElementById("email").value = data.email || "";
            document.getElementById("phone").value = data.phone || "";
            document.getElementById("city").value = data.city || "";
            document.getElementById("state").value = data.state || "";
            document.getElementById("unit").value = data.unit || "";
            document.getElementById("profile-photo").src = data.photo || "/projeto/Imagens/perfil.png";
            document.getElementById("profile-photo1").src = data.photo || "/projeto/Imagens/perfil.png";
    
            // Tornar o campo de e-mail somente leitura
            document.getElementById("email").setAttribute("readonly", "readonly");
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
        }
    }

    // Atualizar perfil
    profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const novosDados = {
            name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            unit: document.getElementById("unit").value.trim(),
            senha: document.getElementById("senha").value.trim(),
            photo: profilePhoto.src // Salvar a URL da foto no perfil
        };

        try {
            const response = await fetch('https://hub-orcin.vercel.app/atualizar-perfil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(novosDados)
            });

            if (response.ok) {
                alert("Perfil atualizado com sucesso!");
            } else {
                const errorData = await response.json();
                alert(`Erro ao atualizar perfil: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
        }
    });

    // Carregar o perfil ao carregar a página
    carregarPerfil(); 
});

// Função para formatar telefone no padrão (DDD) 99999-9999
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