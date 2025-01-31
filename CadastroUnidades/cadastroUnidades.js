document.getElementById("cadastrar-btn").addEventListener("click", async () => {
    const unidade = document.getElementById("unidade").value.trim();
    const escola = document.getElementById("escola").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const coordenador = document.getElementById("coordenador").value.trim();
    const uploadPhotoInput = document.getElementById("upload-photo1");

    if (!unidade || !escola || !cidade || !coordenador) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    // Criar um FormData para enviar os dados corretamente
    const formData = new FormData();
    formData.append("unidade", unidade);
    formData.append("escola", escola);
    formData.append("cidade", cidade);
    formData.append("coordenador", coordenador);
    
    // Se houver imagem, adiciona ao FormData
    if (uploadPhotoInput.files.length > 0) {
        formData.append("photo", uploadPhotoInput.files[0]);
    }

    try {
        const response = await fetch("http://localhost:3000/cadastrar-unidade", {
            method: "POST",
            body: formData // ✅ Agora envia os dados corretamente como `multipart/form-data`
        });

        const result = await response.text();
        console.log("✅ Resposta do servidor:", result);

        if (response.ok) {
            alert("Unidade cadastrada com sucesso!");
            window.location.reload();
        } else {
            alert(`Erro ao cadastrar: ${result}`);
        }
    } catch (error) {
        console.error("❌ Erro na requisição:", error);
        alert("Erro ao conectar-se ao servidor.");
    }
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

document.addEventListener("DOMContentLoaded", () => {

    const profilePhoto = document.getElementById("profile-photo1");
    const uploadPhotoInput = document.getElementById("upload-photo1");

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

    const token = getTokenFromCookie();
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "/Login/login.html";
        return;
    }
    
    // Função para carregar perfil do usuário logado
    async function carregarPerfil() {
        try {
        const response = await fetch("http://localhost:3000/perfil", {
            headers: { Authorization: token },
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar os dados do perfil");
        }

        const data = await response.json();

        // Atualiza os elementos do HTML com os dados do usuário
        document.getElementById("profile-photo").src =
            data.photo || "/projeto/Imagens/perfil.png";
        } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        alert("Erro ao carregar os dados do perfil.");
        }
    }
    carregarPerfil();

    // Atualizar a visualização da foto no upload
    uploadPhotoInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('photo', file);
    
            try {
                const response = await fetch('http://localhost:3000/upload-image', {
                    method: 'POST',
                    body: formData
                });
    
                if (!response.ok) {
                    throw new Error("Erro ao enviar imagem.");
                }
    
                const data = await response.json();
                profilePhoto.src = data.imageUrl;
    
                // Salvar o URL da imagem no perfil
                document.getElementById("profile-photo1-url").value = data.imageUrl;
            } catch (error) {
                console.error("Erro ao fazer upload da imagem:", error);
            }
        }
    });

    async function carregarCoordenadores() {
        try {
            const response = await fetch("http://localhost:3000/listar-coordenadores");
    
            if (!response.ok) {
                throw new Error("Erro ao carregar os coordenadores.");
            }
    
            const coordenadores = await response.json();
            const selectCoordenador = document.getElementById("coordenador");
    
            // Limpa o select antes de adicionar os coordenadores
            selectCoordenador.innerHTML = `<option value="">Selecione um Coordenador</option>`;
    
            coordenadores.forEach(coordenador => {
                const option = document.createElement("option");
                option.value = coordenador.name; /* Armazena o nome como identificador*/
                option.textContent = `${coordenador.name}`;
                /*option.textContent = `${coordenador.name} - ${coordenador.email}`;*/ 
                selectCoordenador.appendChild(option);
            });
    
        } catch (error) {
            console.error("❌ Erro ao carregar coordenadores:", error);
        }
    }
    carregarCoordenadores();
});