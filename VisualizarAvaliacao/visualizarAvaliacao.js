document.addEventListener("DOMContentLoaded", () => {
            const turmaSelect = document.getElementById("turma-select");
            const avaliacaoSelect = document.getElementById("avaliacao-select");
            const avaliacoesContainer = document.getElementById("avaliacoes-container");

            // Função para formatar a data para o formato dd/mm/yyyy
            function formatarData(dataISO) {
                const data = new Date(dataISO);
                const dia = String(data.getDate()).padStart(2, '0');
                const mes = String(data.getMonth() + 1).padStart(2, '0');
                const ano = data.getFullYear();
                return `${dia}/${mes}/${ano}`;
            }

            async function carregarTurmas() {
                try {
                    const response = await fetch('http://localhost:3000/dados'); // Certifique-se de que a rota está correta
                    if (!response.ok) {
                        throw new Error("Erro ao buscar as turmas");
                    }
                    const turmas = await response.json();
                    
                    const selectElement = document.getElementById("turma-select"); // ID correto
            
                    // Limpa o dropdown antes de preenchê-lo
                    selectElement.innerHTML = '<option value="" disabled selected>Escolha uma turma</option>';
            
                    // Preenche o dropdown com as turmas recebidas
                    for (const turma in turmas) {
                        const option = document.createElement("option");
                        option.value = turma;
                        option.textContent = turma;
                        selectElement.appendChild(option);
                    }
                } catch (error) {
                    console.error("Erro ao carregar as turmas:", error);
                }
            }
         
            async function carregarAvaliacoes(turma) {
                try {
                    const response = await fetch('http://localhost:3000/avaliacoes');
                    const avaliacoes = await response.json();
                    const avaliacoesFiltradas = avaliacoes.filter(avaliacao => avaliacao.turma === turma);

                    avaliacaoSelect.innerHTML = '<option value="">Selecione uma avaliação</option>';
                    avaliacoesFiltradas.forEach(avaliacao => {
                        const option = document.createElement('option');
                        const dataFormatada = formatarData(avaliacao.dataAvaliacao);
                        option.value = avaliacao.nomeAvaliacao;
                        option.textContent = `${avaliacao.nomeAvaliacao} - ${dataFormatada}`;
                        avaliacaoSelect.appendChild(option);
                    });
                } catch (error) {
                    console.error("Erro ao carregar avaliações:", error);
                }
            }

            async function exibirAvaliacao(turma, avaliacaoNome) {
                try {
                    const responseAvaliacoes = await fetch('http://localhost:3000/avaliacoes');
                    const responseNotas = await fetch('http://localhost:3000/notasavaliacoes');
                    const avaliacoes = await responseAvaliacoes.json();
                    const notasAvaliacao = await responseNotas.json();
            
                    const avaliacao = avaliacoes.find(a => a.turma === turma && a.nomeAvaliacao === avaliacaoNome);
                    const notas = (notasAvaliacao.find(n => n.turma === turma && n.avaliacao === avaliacaoNome) || { notas: [] }).notas;
            
                    const tabelaHeader = document.getElementById("tabela-header");
                    const tabelaBody = document.getElementById("tabela-notas").querySelector("tbody");
            
                    // Limpa a tabela e oculta o cabeçalho por padrão
                    tabelaBody.innerHTML = "";
                    tabelaHeader.style.display = "none";
            
                    if (!avaliacao || notas.length === 0) {
                        avaliacoesContainer.innerHTML = "<p>Avaliação não encontrada ou sem notas.</p>";
                        return;
                    }
            
                    // Exibe o cabeçalho da tabela
                    tabelaHeader.style.display = "table-header-group";
            
                    // Popula os dados na tabela
                    notas.forEach(nota => {
                        const tr = document.createElement("tr");
                        const tdAluno = document.createElement("td");
                        const tdNota = document.createElement("td");
            
                        tdAluno.textContent = nota.aluno;
                        tdNota.textContent = nota.nota === "Não Avaliado" ? "Não Avaliado" : parseFloat(nota.nota).toFixed(1);
            
                        tr.appendChild(tdAluno);
                        tr.appendChild(tdNota);
                        tabelaBody.appendChild(tr);
                    });
                } catch (error) {
                    console.error("Erro ao exibir a avaliação:", error);
                }
            }
            
            // async function exibirAvaliacao(turma, avaliacaoNome) {
            //     try {
            //         const responseAvaliacoes = await fetch('http://localhost:3000/avaliacoes');
            //         const responseNotas = await fetch('http://localhost:3000/notasavaliacoes');
            //         const avaliacoes = await responseAvaliacoes.json();
            //         const notasAvaliacao = await responseNotas.json();
            
            //         const avaliacao = avaliacoes.find(a => a.turma === turma && a.nomeAvaliacao === avaliacaoNome);
            //         const notas = (notasAvaliacao.find(n => n.turma === turma && n.avaliacao === avaliacaoNome) || { notas: [] }).notas;
            
            //         if (!avaliacao) {
            //             avaliacoesContainer.innerHTML = "<p>Avaliação não encontrada.</p>";
            //             return;
            //         }
            
            //         const dataFormatada = formatarData(avaliacao.dataAvaliacao);
            
            //         // Atualize a tabela
            //         const tabelaBody = document.getElementById("tabela-notas").querySelector("tbody");
            //         tabelaBody.innerHTML = ""; // Limpe a tabela antes de preencher
            
            //         notas.forEach(nota => {
            //             const tr = document.createElement("tr");
            //             const tdAluno = document.createElement("td");
            //             const tdNota = document.createElement("td");
            
            //             tdAluno.textContent = nota.aluno;
            //             tdNota.textContent = nota.nota === "Não Avaliado" ? "Não Avaliado" : parseFloat(nota.nota).toFixed(1);
            
            //             tr.appendChild(tdAluno);
            //             tr.appendChild(tdNota);
            //             tabelaBody.appendChild(tr);
            //         });
            //     } catch (error) {
            //         console.error("Erro ao exibir a avaliação:", error);
            //     }
            // }
            

            // async function exibirAvaliacao(turma, avaliacaoNome) {
            //     try {
            //         const responseAvaliacoes = await fetch('http://localhost:3000/avaliacoes');
            //         const responseNotas = await fetch('http://localhost:3000/notasavaliacoes');
            //         const avaliacoes = await responseAvaliacoes.json();
            //         const notasAvaliacao = await responseNotas.json();
            
            //         const avaliacao = avaliacoes.find(a => a.turma === turma && a.nomeAvaliacao === avaliacaoNome);
            //         const notas = (notasAvaliacao.find(n => n.turma === turma && n.avaliacao === avaliacaoNome) || { notas: [] }).notas;
            
            //         if (!avaliacao) {
            //             avaliacoesContainer.innerHTML = "<p>Avaliação não encontrada.</p>";
            //             return;
            //         }
            
            //         const dataFormatada = formatarData(avaliacao.dataAvaliacao);
            
            //         let cardHTML = `
            //             <div class="card">
            //                 <h3>${avaliacao.nomeAvaliacao} - ${dataFormatada}</h3>
            //                 <p><strong>Conteúdo:</strong> ${avaliacao.conteudoAvaliacao}</p>
            //                 <h4>Notas:</h4>
            //                 <ul class="tabela-notas">
            //                     ${notas.map(n => `<li><span>${n.aluno}</span>Nota: ${n.nota}</li>`).join("")}
            //                 </ul>
            //             </div>
            //         `;
            //         avaliacoesContainer.innerHTML = cardHTML;
            //     } catch (error) {
            //         console.error("Erro ao exibir a avaliação:", error);
            //     }
            // }            

            turmaSelect.addEventListener("change", () => {
                const turma = turmaSelect.value;
                if (turma) carregarAvaliacoes(turma);
            });

            avaliacaoSelect.addEventListener("change", () => {
                const turma = turmaSelect.value;
                const avaliacao = avaliacaoSelect.value;
                if (turma && avaliacao) exibirAvaliacao(turma, avaliacao);
            });

            carregarTurmas();

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

// Carrega as turmas ao abrir a página
window.onload = carregarTurmas;