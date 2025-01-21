document.getElementById("form-cadastro").addEventListener("submit", async(event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo = document.getElementById("tipo").value;
    const name = "";
    const phone = "";
    const city = "";
    const state = "";
    const unit = "";
    const photo = "/projeto/Imagens/perfil.png";

    try {
        const response = await fetch('http://localhost:3000/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha, tipo, name, phone, city, state, unit, photo })
        });

        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            window.location.href = "/Login/login.html";
        }
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
    }
});