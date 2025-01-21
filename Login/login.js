document.getElementById("form-login").addEventListener("submit", async(event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();
        if (response.ok) {
            document.cookie = `token=${data.token}; path=/; max-age=7200`;
            localStorage.setItem('tipoUsuario', data.tipo); // Armazena corretamente o tipo
            // alert("Login realizado com sucesso!");
            window.location.href = "http://localhost:3000/projeto/public/index.html";
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao conectar ao servidor.");
    }
});