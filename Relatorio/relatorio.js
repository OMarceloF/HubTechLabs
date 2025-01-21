// Função para carregar turmas ao abrir a página
async function carregarTurmas() {
    try {
        const response = await fetch('/dados');
        if (!response.ok) throw new Error("Erro ao buscar dados das turmas.");
        const turmas = await response.json();

        const turmaSelect = document.getElementById('turma-select');
        turmaSelect.innerHTML = '<option value="" disabled selected>Escolha uma turma</option>';
        Object.keys(turmas).forEach(nomeTurma => {
            const option = document.createElement('option');
            option.value = nomeTurma;
            option.textContent = nomeTurma;
            turmaSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar as turmas:', error);
    }
}



// Evento ao selecionar uma turma
document.getElementById('turma-select').addEventListener('change', async function() {
    const turmaSelecionada = this.value;
    const alunoSelect = document.getElementById('aluno-select');
    alunoSelect.innerHTML = '<option value="" disabled selected>Escolha um aluno</option>';

    try {
        const response = await fetch('/dados');
        if (!response.ok) throw new Error("Erro ao buscar os alunos.");
        const turmas = await response.json();
        const alunos = turmas[turmaSelecionada] && turmas[turmaSelecionada].alunos ? turmas[turmaSelecionada].alunos : [];

        if (alunos.length === 0) {
            alunoSelect.innerHTML = '<option disabled>Nenhum aluno encontrado</option>';
            alunoSelect.disabled = true;
            return;
        }

        alunos.forEach(aluno => {
            const option = document.createElement('option');
            option.value = aluno;
            option.textContent = aluno;
            alunoSelect.appendChild(option);
        });

        alunoSelect.disabled = false;
    } catch (error) {
        console.error('Erro ao carregar os alunos:', error);
    }
});

// Evento ao selecionar um aluno
document.getElementById('aluno-select').addEventListener('change', async function() {
    const turmaSelecionada = document.getElementById('turma-select').value;
    const alunoSelecionado = this.value;

    try {
        const notasResponse = await fetch('/notasavaliacoes');
        const presencaResponse = await fetch('/dados-presenca');
        if (!notasResponse.ok || !presencaResponse.ok) throw new Error("Erro ao buscar dados de notas ou presença.");

        const notasData = await notasResponse.json();
        const presencaData = await presencaResponse.json();

        // Filtrar os dados de notas e presença
        const notasAluno = notasData
            .filter(n => n.turma === turmaSelecionada)
            .flatMap(avaliacao => avaliacao.notas.filter(n => n.aluno === alunoSelecionado).map(n => n.nota || 0));

        const presencasAluno = presencaData
            .filter(p => p.turma === turmaSelecionada)
            .flatMap(chamada => chamada.alunos.filter(a => a.nome === alunoSelecionado));

        const datasAulas = presencasAluno.map(p => p.data || "Data Desconhecida");
        const statusPresencas = presencasAluno.map(p => (p.presenca === 'Presente' ? 1 : 0));

        criarGraficoNotasAluno(notasAluno);
        // criarGraficoPresencas(datasAulas, statusPresencas);

        document.getElementById('graficos-aluno-container').classList.remove('hidden');

        // Carregar as aulas e notas por presença para o gráfico
        const aulasAluno = presencaData.filter(p => p.turma === turmaSelecionada)
            .map(p => {
                const alunoData = p.alunos.find(a => a.nome === alunoSelecionado);
                return {
                    data: p.data,
                    nota: alunoData ? parseFloat(alunoData.nota) || 0 : 0,
                    totalNotasPresenca: alunoData ? parseFloat(alunoData.totalNotasPresenca) || 0 : 0 // Notas vindas da presença
                };
            });

        criarGraficoNotasTodasAulas(aulasAluno, alunoSelecionado);
        criarGraficoPresencaData(aulasAluno);


    } catch (error) {
        console.error('Erro ao carregar os gráficos do aluno:', error);
    }
});

// Função para criar gráfico com todas as notas do aluno (incluindo somaNotasPresenca)
function criarGraficoNotasTodasAulas(aulasAluno, alunoSelecionado) {
    const ctxDesempenhoAula = document.getElementById('grafico-desempenho-aula').getContext('2d');

    const labels = aulasAluno.map(aula => {
        if (!aula.data || aula.data === "Data Desconhecida") return "Data Desconhecida";
        const [ano, mes, dia] = aula.data.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, dia); // Cria a data local sem fuso horário
        return `${dataObj.getDate().toString().padStart(2, '0')}/${(dataObj.getMonth() + 1).toString().padStart(2, '0')}/${dataObj.getFullYear()}`;
    });
    const notas = aulasAluno.map(aula => aula.nota); // Notas das aulas
    const somaNotasPresenca = aulasAluno.map(aula => aula.totalNotasPresenca); // Notas vindas da presença

    if (window.graficoDesempenhoAula) window.graficoDesempenhoAula.destroy();
    window.graficoDesempenhoAula = new Chart(ctxDesempenhoAula, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                    label: `Notas de ${alunoSelecionado} em todas as aulas`,
                    data: notas,
                    backgroundColor: 'rgb(243, 24, 24)',
                    borderColor: '#4bc0c0',
                    borderWidth: 2
                },


            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, max: 5 }
            }
        }
    });
}

function criarGraficoPresencaData(aulasAluno) {
    const ctxPresencaAula = document.getElementById('grafico-presenca-aula').getContext('2d');

    const labels = aulasAluno.map(aula => {
        if (!aula.data || aula.data === "Data Desconhecida") return "Data Desconhecida";
        const [ano, mes, dia] = aula.data.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, dia);
        return `${dataObj.getDate().toString().padStart(2, '0')}/${(dataObj.getMonth() + 1).toString().padStart(2, '0')}/${dataObj.getFullYear()}`;
    });

    const presencas = aulasAluno.map(() => 1); // Todas as barras terão o valor 1
    const cores = aulasAluno.map(aula => aula.nota > 0 ? 'rgb(0, 123, 255)' : 'rgb(255, 0, 55)');

    if (window.graficoPresencaAula) window.graficoPresencaAula.destroy();

    window.graficoPresencaAula = new Chart(ctxPresencaAula, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Presença / Falta',
                data: presencas,
                backgroundColor: cores,
                borderColor: cores,
                borderWidth: 1,
                barThickness: 'flex', // Mantém uma espessura automática proporcional
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Mantém o gráfico proporcional
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Datas das Aulas'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    min: 0,
                    max: 1, // Limita a altura das barras a 1
                    ticks: {
                        stepSize: 1,
                        callback: () => "Aula"
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: context => context.raw === 1
                            ? (context.dataset.backgroundColor[context.dataIndex] === 'rgb(0, 123, 255)' ? "Presente" : "Faltou")
                            : ""
                    }
                }
            }
        }
    });
}


// Função para criar gráfico de notas do aluno
function criarGraficoNotasAluno(notas) {
    if (window.graficoNotasAluno) window.graficoNotasAluno.destroy();
    const ctxNotasAluno = document.getElementById('grafico-notas-aluno').getContext('2d');

    window.graficoNotasAluno = new Chart(ctxNotasAluno, {
        type: 'bar',
        data: {
            labels: notas.map((_, index) => `Prova ${index + 1}`),
            datasets: [{
                label: 'Notas das Avaliações',
                data: notas,
                backgroundColor: 'rgb(0, 142, 237)',
                borderColor: '#36a2eb',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, max: 5 }
            }
        }
    });
}


async function exportarRelatorioPDF() {
    const turmaNome = document.getElementById('turma-select').value.trim();
    const alunoSelecionado = document.getElementById('aluno-select').value.trim();

    if (!turmaNome || !alunoSelecionado) {
        alert("Selecione uma turma e um aluno para exportar o relatório.");
        return;
    }

    const doc = new jspdf.jsPDF('p', 'mm', 'a4');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Relatório de Desempenho - Turma: ${turmaNome}`, 10, 20);
    doc.setFontSize(14);
    doc.text(`Aluno: ${alunoSelecionado}`, 10, 30);

    let yOffset = 40;

    // **Carregar dados do arquivo presenca_dados.json**
    const response = await fetch('/output/presenca_dados.json');
    const dadosPresenca = await response.json();

    // **Filtrar os dados correspondentes à turma e ao aluno selecionado**
    const registrosFiltrados = dadosPresenca.filter(
        (registro) => registro.turma === turmaNome && registro.alunos.some(aluno => aluno.nome === alunoSelecionado)
    );

    if (registrosFiltrados.length === 0) {
        alert("Nenhum registro encontrado para essa turma e aluno.");
        return;
    }

    // **Cálculos de Resumo**
    let totalPresencas = 0;
    let totalFaltas = 0;
    let somaNotasAulasPresentes = 0;
    let quantidadeNotasPresentes = 0;

    registrosFiltrados.forEach(registro => {
        const aluno = registro.alunos.find(a => a.nome === alunoSelecionado);
        if (aluno.presenca === 'Presente') {
            totalPresencas++;
            if (aluno.nota) {
                somaNotasAulasPresentes += parseFloat(aluno.nota);
                quantidadeNotasPresentes++;
            }
        } else {
            totalFaltas++;
        }
    });

    const notasGrafico = window.graficoNotasAluno?.data?.datasets[0]?.data || [];
    const mediaNotasAvaliacoes = notasGrafico.length ? notasGrafico.reduce((acc, nota) => acc + nota, 0) / notasGrafico.length : 0; // Média das avaliações
    const mediaNotasAulasPresentes = somaNotasAulasPresentes / (quantidadeNotasPresentes || 1);  // Média das aulas com presença

    // **Tabela de Resumo**
    doc.setFontSize(12);
    doc.text("Resumo do Desempenho:", 10, yOffset);
    yOffset += 10;

    doc.autoTable({
        startY: yOffset,
        head: [['Indicador', 'Valor']],
        body: [
            ['Média das Avaliações', mediaNotasAvaliacoes.toFixed(2)],
            ['Total de Presenças', totalPresencas],
            ['Total de Faltas', totalFaltas],
            ['Média das Notas nas Aulas Presentes', mediaNotasAulasPresentes.toFixed(2)],
        ],
        theme: 'grid',
    });

    yOffset = doc.previousAutoTable.finalY + 10;

    // **Tabela de Presenças e Notas por Aula**
    const tabelaPresencaDesempenho = registrosFiltrados.map(registro => {
        const aluno = registro.alunos.find(aluno => aluno.nome === alunoSelecionado);
        return [
            new Date(registro.data).toLocaleDateString('pt-BR'),
            aluno.presenca,
            aluno.nota || "-"
        ];
    });

    doc.setFontSize(12);
    doc.text("Presenças e Desempenho por Aula:", 10, yOffset);
    yOffset += 10;

    doc.autoTable({
        startY: yOffset,
        head: [['Data', 'Presença', 'Nota']],
        body: tabelaPresencaDesempenho,
        theme: 'grid',
    });

    // **Adicionar imagens dos gráficos**
    const graficoNotasCanvas = document.getElementById('grafico-notas-aluno');
    const graficoPresencaCanvas = document.getElementById('grafico-presenca-aula');
    const graficoDesempenhoCanvas = document.getElementById('grafico-desempenho-aula');

    const graficoNotasImg = graficoNotasCanvas.toDataURL('image/png', 1.0);
    const graficoPresencaImg = graficoPresencaCanvas.toDataURL('image/png', 1.0);
    const graficoDesempenhoImg = graficoDesempenhoCanvas.toDataURL('image/png', 1.0);

    // **Página com gráficos de Notas e Presenças**
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Gráficos de Desempenho", 10, 20);

    doc.setFontSize(14);
    doc.text("Gráfico de Notas das Avaliações:", 10, 30);
    doc.addImage(graficoNotasImg, 'PNG', 10, 35, 190, 90);

    doc.text("Gráfico de Presenças:", 10, 130);
    doc.addImage(graficoPresencaImg, 'PNG', 10, 135, 190, 90);

    // **Nova página para o Gráfico de Desempenho por Aula**
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Gráfico de Desempenho por Aula:", 10, 20);
    doc.addImage(graficoDesempenhoImg, 'PNG', 10, 30, 190, 90);

    // **Salvar PDF**
    doc.save(`Relatorio_Turma_${turmaNome}_${alunoSelecionado}.pdf`);
}


document.addEventListener("DOMContentLoaded", () => {
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

window.onload = carregarTurmas;
document.getElementById('exportar-relatorio').addEventListener('click', exportarRelatorioPDF);
