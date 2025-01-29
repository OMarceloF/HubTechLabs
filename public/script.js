window.addEventListener("load", () => {
    const imagemOculos = document.querySelector(".imagemOculos");
    // const textoMaquina = document.querySelector(".textoMaquina span");

    // Lista de URLs das imagens de background
    const imagens = [
        "/Imagens/imagem1.jpg",
        "/Imagens/imagem2.png",
        "/Imagens/imagem3.png",
        "/Imagens/imagem4.jpg"
    ];
    

    let index = 0;

    // Função para alternar a imagem de fundo
    function trocarImagem() {
        index = (index + 1) % imagens.length;
        imagemOculos.style.backgroundImage = `url('${imagens[index]}')`;
    }

    // Inicia a animação de texto e o carrossel juntos
    function iniciarAnimacoes() {
        // Forçar reflow para reiniciar animação de texto
        // textoMaquina.style.animation = "none";
        // void textoMaquina.offsetWidth;
        // textoMaquina.style.animation = "typing 2s steps(14, end), blinking 0.5s infinite step-end alternate";

        // Inicia a primeira imagem imediatamente
        imagemOculos.style.backgroundImage = `url('${imagens[0]}')`;

        // Começa a troca de imagens a cada 3 segundos
        // setTimeout(() => setInterval(trocarImagem, 3000), 2000);  // Inicia após 2 segundos para coincidir com o texto
        setTimeout(() => setInterval(trocarImagem, 3000));
    }

    iniciarAnimacoes();  // Chama a função para começar as animações
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
    const imagemPerfil = document.querySelector(".imagemOculos img");

    // Verifica se o clique foi fora da caixa ou da imagem
    if (
        mudarPerfil.style.display === "flex" &&
        !mudarPerfil.contains(event.target) &&
        !imagemPerfil.contains(event.target)
    ) {
        mudarPerfil.style.display = "none";
    }
});


// Pega a foto de usuário logado
document.addEventListener("DOMContentLoaded", () => {
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
