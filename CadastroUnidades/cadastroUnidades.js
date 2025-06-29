document.getElementById("cadastrar-btn").addEventListener("click", async () => {
    const unidade = document.getElementById("unidade").value.trim();
    const escola = document.getElementById("escola").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const coordenador = document.getElementById("coordenador").value.trim();
    // lê o radio
    const sistema = document.querySelector('input[name="sistema"]:checked').value;
    const mensagemSucesso = document.getElementById("mensagem-sucesso");

    if (!unidade || !escola || !cidade || !coordenador) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    // armaze­na 0 ou 1
    const dados = {
        unidade,
        escola,
        cidade,
        coordenador,
        competencias: parseInt(sistema, 10)
    };

    console.log("📤 Enviando dados para o backend:", dados);

    try {
        //🚭Como era na Vercel
        const response = await fetch('https://hub-orcin.vercel.app/cadastrar-unidade', {
        //🚭Como é localmente
        // const response = await fetch("http://localhost:3000/cadastrar-unidade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });

        const result = await response.json();
        console.log("📥 Resposta do backend:", result);

        if (response.ok) {
            mensagemSucesso.style.display = "block";
            document.getElementById("cadastro-form").reset();
            setTimeout(() => (mensagemSucesso.style.display = "none"), 2000);
        } else {
            alert(`Erro ao cadastrar: ${result.message}`);
        }
    } catch (error) {
        console.error("❌ Erro ao cadastrar unidade:", error);
        alert("Erro ao conectar ao servidor. Verifique sua conexão e tente novamente.");
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
            }

            if (tipoUsuario === 'Coordenador') {
                window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
            }
            if (tipoUsuario === 'Instrutor') {
                window.location.href = "/Erro/erro.html"; // Redireciona para a página de erro
            }
        } catch (error) {
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

    const token = localStorage.getItem('token');
    //const token = getTokenFromCookie();

    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "/Login/login.html";
        return;
    }

    // Função para carregar perfil do usuário logado
    async function carregarPerfil() {
        try {
            //🚭Como era na Vercel
            const response = await fetch('https://hub-orcin.vercel.app/perfil', 
            //🚭Como é localmente
            // const response = await fetch('http://localhost:3000/perfil',
                {
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
        }
    }
    carregarPerfil();

    async function carregarCoordenadores() {
        try {
            console.log("Carregando coordenadores..."); // 🔹 Para depuração

            //🚭Como era na Vercel
            const response = await fetch('https://hub-orcin.vercel.app/listar-coordenadores'); 
            //🚭Como é localmente
            // const response = await fetch('http://localhost:3000/listar-coordenadores');

            if (!response.ok) {
                throw new Error("Erro ao carregar os coordenadores.");
            }

            const coordenadores = await response.json();
            console.log("Coordenadores recebidos:", coordenadores); // 🔹 Verifica se os dados foram recebidos corretamente

            const selectCoordenador = document.getElementById("coordenador");

            // Limpa o select antes de adicionar os coordenadores
            selectCoordenador.innerHTML = `<option value="">Selecione um Coordenador</option>`;

            if (!coordenadores || coordenadores.length === 0) {
                console.warn("Nenhum coordenador encontrado.");
                return;
            }

            coordenadores.forEach(coordenador => {
                const option = document.createElement("option");
                option.value = coordenador.name; // Armazena o nome como identificador
                option.textContent = `${coordenador.name}`;
                selectCoordenador.appendChild(option);
            });

            console.log("Lista de coordenadores adicionada ao select.");

        } catch (error) {
            console.error("Erro ao carregar os coordenadores:", error);
        }
    }

    carregarCoordenadores();
});