document.addEventListener("DOMContentLoaded", () => {
    const profilePhoto = document.getElementById("profile-photo");
    const uploadPhotoInput = document.getElementById("upload-photo");
    const changePhotoButton = document.getElementById("change-photo-button");
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
            const response = await fetch('http://localhost:3000/perfil', {
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
            alert("Erro ao carregar os dados do perfil.");
        }
    }

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
                document.getElementById("profile-photo-url").value = data.imageUrl;
            } catch (error) {
                console.error("Erro ao fazer upload da imagem:", error);
            }
        }
    });

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
            const response = await fetch('http://localhost:3000/atualizar-perfil', {
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
            alert("Erro ao atualizar o perfil.");
        }
    });

    // Carregar o perfil ao carregar a página
    carregarPerfil(); 
});
