//require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const mysql = require('mysql2/promise');
//🚭Como era na Vercel
//const port = 80;
//🚭Como é localmente
const port = 3000;
const secretKey = "sua_chave_secreta_super_segura";


// 👇 Aqui você define a pasta pública
app.use(express.static(path.join(__dirname, "../public")));


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));  // ✅ Permite ler dados no formato x-www-form-urlencoded
app.use(express.json());  // ✅ Permite ler JSON, caso precise



// Caminho do arquivo de dados e de saída
const dadosPath = path.join(__dirname, 'data', 'dados.json'); // Caminho para dados.json
const presencaPath = path.join(__dirname, 'output', 'presenca_dados.json'); // Caminho para presenca_dados.json
const usuariosPath = path.join(__dirname, 'output', 'usuarios.json');

//🚭Como era na Vercel
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
};

//🚭Como é localmente
// const dbConfig = {
//  host: 'localhost',
// user: 'root',
// password: '',
// database: 'buldjoxpabj83wr7hks0'
// };

app.post('/salvar-turma', async (req, res) => {
    const { turma, instrutor, alunos, unidade_id } = req.body;

    if (!turma || !instrutor || !unidade_id || !alunos || alunos.length === 0) {
        return res.status(400).send({ message: 'Preencha todos os campos obrigatórios!' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute(
            'INSERT INTO turmas (nome, instrutor, unidade_id) VALUES (?, ?, ?)',
            [turma, instrutor, unidade_id]
        );

        const turmaId = result.insertId;

        const alunoValues = alunos.map(nome => [nome, turmaId]);
        await connection.query('INSERT INTO alunos (nome, turma_id) VALUES ?', [alunoValues]);

        await connection.end();

        res.status(201).send({ message: 'Turma salva com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar a turma:', error);
        res.status(500).send({ message: 'Erro ao salvar a turma.' });
    }
});


// Rota para salvar os dados de presença 
app.post('/salvar-presenca', async (req, res) => {
    const { turma, data, dataSalvo, conteudoAula, alunos } = req.body;

    if (!turma || !data || !conteudoAula || !alunos || alunos.length === 0) {
        return res.status(400).send({ message: "Faltam informações obrigatórias: turma, data ou lista de alunos." });
    }

    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Obter o ID da turma
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );

        if (turmaResult.length === 0) {
            return res.status(404).send({ message: `Turma "${turma}" não encontrada.` });
        }

        const turmaId = turmaResult[0].id;

        // Inserir presenças na tabela `presencas`
        const presencas = alunos.map(aluno => [
            turmaId, // turma_id
            data, // data
            aluno.nome, // aluno
            aluno.presenca, // presenca
            aluno.nota,      // nota
            aluno.observacao, // observacao
            conteudoAula
        ]);

        await connection.query(
            'INSERT INTO presencas (turma_id, data, aluno, presenca, nota, observacao, conteudoAula) VALUES ?',
            [presencas]
        );

        // Fechar a conexão
        await connection.end();

        console.log(`Presenças da turma "${turma}" salvas com sucesso para a data ${data}.`);
        res.status(200).send({ message: "Dados de presença salvos com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar presença:", error);
        res.status(500).send({ message: "Erro ao salvar os dados de presença." });
    }
});

app.get('/Diario/indexDiario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Diario', 'indexDiario.html'));
});

app.get('/Diario/stylesDiario.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Diario', 'stylesDiario.css'));
});

app.get('/Diario/scriptDiario.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Diario', 'scriptDiario.js'));
});

app.get('/EditarDiario/editarDiario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarDiario', 'editarDiario.html'));
});

app.get('/EditarDiario/editarDiario.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarDiario', 'editarDiario.css'));
});

app.get('/EditarDiario/editarDiario.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarDiario', 'editarDiario.js'));
});

app.get('/Login/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login', 'login.html'));
});

app.get('/Login/login.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login', 'login.css'));
});

app.get('/Login/login.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login', 'login.js'));
});

app.get('/Cadastro/cadastro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cadastro', 'cadastro.html'));
});

app.get('/Cadastro/cadastro.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cadastro', 'cadastro.css'));
});

app.get('/Cadastro/cadastro.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cadastro', 'cadastro.js'));
});

app.get('/Perfil/perfil.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Perfil', 'perfil.html'));
});

app.get('/Perfil/perfil.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Perfil', 'perfil.css'));
});

app.get('/Perfil/perfil.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Perfil', 'perfil.js'));
});

app.get('/projeto/public/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/projeto/public/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});

app.get('/projeto/public/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'script.js'));
});

app.get('/Erro/erro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Erro', 'erro.html'));
});

// Pegar arquivos de imagens
app.get('/projeto/Imagens/logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'logo.png'));
});
app.get('/projeto/Imagens/perfil.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'perfil.png'));
});

app.get('/Imagens/fundoBarraLateral.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoBarraLateral.jpg'));
});

app.get('/Imagens/simboloDiario.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloDiario.png'));
});

app.get('/Imagens/simboloEditarDiario.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloEditarDiario.png'));
});

app.get('/Imagens/simboloCriarTurma.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloCriarTurma.png'));
});

app.get('/Imagens/simboloEditarTurma.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloEditarTurma.png'));
});

app.get('/Imagens/simboloAvaliacao.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloAvaliacao.png'));
});

app.get('/Imagens/simboloAvaliacao.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloAvaliacao.png'));
});

app.get('/Imagens/simboloAdicionaNotas.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloAdicionaNotas.png'));
});

app.get('/Imagens/simboloVisualizarNotas.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloVisualizarNotas.png'));
});

app.get('/Imagens/simboloRelatorio.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloRelatorio.png'));
});

app.get('/Imagens/simboloSeta.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'simboloSeta.png'));
});

app.get('/Imagens/cadastroUsuario.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'cadastroUsuario.png'));
});

app.get('/Imagens/cadastroUnidade.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'cadastroUnidade.png'));
});

app.get('/Imagens/fundoCriarTurma.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoCriarTurma.png'));
});

app.get('/Imagens/fundoEditarTurma.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoEditarTurma.jpg'));
});

app.get('/Imagens/fundoDiario.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoDiario.png'));
});

app.get('/Imagens/fundoEditarDiario.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoEditarDiario.png'));
});

app.get('/Imagens/fundoAvaliacoes.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoAvaliacoes.jpg'));
});

app.get('/Imagens/fundoNotasAvaliacoes.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoNotasAvaliacoes.jpg'));
});

app.get('/Imagens/fundoVisualizarAvaliacao.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoVisualizarAvaliacao.jpg'));
});

app.get('/Imagens/fundoLogin.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoLogin.jpg'));
});

app.get('/Imagens/weAreTheFuture.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'weAreTheFuture.png'));
});

app.get('/Imagens/hubTechLabsTES.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'hubTechLabsTES.png'));
});

app.get('/Imagens/fundoRelatorio.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'fundoRelatorio.png'));
});

app.get('/Imagens/imagem1.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'imagem1.jpg'));
});

app.get('/Imagens/imagem2.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'imagem2.png'));
});

app.get('/Imagens/imagem3.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'imagem3.png'));
});

app.get('/Imagens/imagem4.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'imagem4.jpg'));
});

app.get('/Imagens/cadastroUNI.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'cadastroUNI.jpg'));
});

// teste inclusão get

app.get('/conteudo-aula', async (req, res) => {
    const { turma, data } = req.query;

    if (!turma || !data) {
        return res.status(400).json({ message: 'Informe a turma e a data.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );

        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).json({ message: `Turma "${turma}" não encontrada.` });
        }

        const turmaId = turmaResult[0].id;

        const [result] = await connection.execute(
            'SELECT conteudoAula FROM presencas WHERE turma_id = ? AND data = ? LIMIT 1',
            [turmaId, data]
        );

        await connection.end();

        if (result.length === 0) {
            return res.status(404).json({ message: 'Conteúdo não encontrado.' });
        }

        res.status(200).json({ conteudoAula: result[0].conteudoAula });

    } catch (error) {
        console.error('Erro ao buscar conteúdo da aula:', error);
        res.status(500).json({ message: 'Erro ao buscar o conteúdo da aula.' });
    }
});


// Inicializa o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em https://hub-orcin.vercel.app:${port}/Login/login.html`);
    // console.log(`Servidor rodando em http://localhost:${port}/Login/login.html`);
});

app.get('/CriarTurmas/criarTurmas.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'CriarTurmas', 'criarTurmas.html'));
});

app.get('/CriarTurmas/criarTurmas.css.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'CriarTurmas', 'criarTurmas.css.css'));
});

app.get('/CriarTurmas/criarTurmas.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'CriarTurmas', 'criarTurmas.js'));
});

app.get('/EditarTurmas/editarTurmas.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'editarTurmas.html'));
});

app.get('/EditarTurmas/alterarAlunos.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'alterarAlunos.html'));
});

app.get('/EditarTurmas/alterarAlunos.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'alterarAlunos.css'));
});

app.get('/EditarTurmas/alterarAlunos.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'alterarAlunos.js'));
});

app.get('/EditarTurmas/editarTurmas.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'editarTurmas.css'));
});

app.get('/EditarTurmas/editarTurmas.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'editarTurmas.js'));
});

app.get('/Avaliacoes/avaliacao.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Avaliacoes', 'avaliacao.js'));
});

app.get('/Avaliacoes/avaliacao.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Avaliacoes', 'avaliacao.html'));
});

app.get('/Avaliacoes/avaliacao.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Avaliacoes', 'avaliacao.css'));
});

app.get('/NotasAvaliacoes/notasavaliacoes.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'NotasAvaliacoes', 'notasAvaliacoes.js'));
});

app.get('/NotasAvaliacoes/notasavaliacoes.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'NotasAvaliacoes', 'notasAvaliacoes.html'));
});

app.get('/NotasAvaliacoes/notasavaliacoes.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'NotasAvaliacoes', 'notasAvaliacoes.css'));
});

app.get('/Relatorio/relatorio.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Relatorio', 'relatorio.html'));
});

app.get('/Relatorio/relatorio.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Relatorio', 'relatorio.css'));
});

app.get('/Relatorio/relatorio.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Relatorio', 'relatorio.js'));
});

app.get('/CadastroUnidades/cadastroUnidades.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'CadastroUnidades', 'cadastroUnidades.js'));
});

app.get('/CadastroUnidades/cadastroUnidades.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'CadastroUnidades', 'cadastroUnidades.html'));
});

app.get('/CadastroUnidades/cadastroUnidades.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'CadastroUnidades', 'cadastroUnidades.css'));
});

app.get('/projeto/data/dados.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'data', 'dados.json'));
});

app.get('/VisualizarAvaliacao/visualizarAvaliacao.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'visualizarAvaliacao.html'));
});

app.get('/VisualizarAvaliacao/visualizarAvaliacao.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'visualizarAvaliacao.css'));
});

app.get('/VisualizarAvaliacao/visualizarAvaliacao.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'visualizarAvaliacao.js'));
});


app.get('/dados', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Buscar as turmas
        const [turmas] = await connection.query('SELECT id, nome, instrutor, unidade_id FROM turmas');

        // Obter os alunos de cada turma
        const [alunos] = await connection.query('SELECT nome, turma_id FROM alunos');

        // Fechar a conexão
        await connection.end();

        // Estruturar os dados no formato esperado
        const turmasEstruturadas = {};
        turmas.forEach(turma => {
            turmasEstruturadas[turma.nome] = {
                id: turma.id,
                instrutor: turma.instrutor,
                unidade_id: turma.unidade_id,
                alunos: alunos
                    .filter(aluno => aluno.turma_id === turma.id)
                    .map(aluno => aluno.nome)
            };
        });

        res.status(200).json(turmasEstruturadas);
    } catch (error) {
        console.error("Erro ao carregar os dados de turmas:", error);
        res.status(500).send({ message: "Erro ao carregar os dados de turmas." });
    }
});

app.get('/unidades', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Buscar todas as unidades cadastradas
        const [unidades] = await connection.query('SELECT id, unidade FROM unidades');

        await connection.end();

        // Estruturar os dados para fácil acesso
        const unidadesMap = {};
        unidades.forEach(u => {
            unidadesMap[u.id] = u.unidade; // Mapeia ID para Nome da Unidade
        });

        res.status(200).json(unidadesMap);
    } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        res.status(500).json({ message: 'Erro ao buscar unidades.' });
    }
});


app.get('/listar-turmas', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Buscar os nomes das turmas
        const [turmas] = await connection.query('SELECT nome FROM turmas');

        // Fechar a conexão
        await connection.end();

        // Retornar apenas os nomes das turmas
        const nomesDasTurmas = turmas.map(turma => turma.nome);
        res.status(200).json(nomesDasTurmas);
    } catch (error) {
        console.error("Erro ao listar as turmas:", error);
        res.status(500).json({ message: "Erro ao listar as turmas." });
    }
});

app.post('/atualizar-notas', async (req, res) => {
    const { turma, data, alunos } = req.body;

    if (!turma || !data || !alunos || alunos.length === 0) {
        return res.status(400).send({ message: "Faltam informações obrigatórias: turma, data ou alunos." });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Obter o ID da turma
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );

        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: `Turma "${turma}" não encontrada.` });
        }

        const turmaId = turmaResult[0].id;
        const dataFormatada = new Date(data).toISOString().split('T')[0];

        // Executa todas as atualizações em paralelo com Promise.all
        const updates = alunos.map(aluno => {
            const { nome, nota, observacao } = aluno;

            // Validações opcionais
            if (typeof nota === "undefined" || isNaN(nota)) {
                return Promise.resolve(); // Ignora aluno inválido
            }

            return connection.execute(
                'UPDATE presencas SET nota = ?, observacao = ? WHERE turma_id = ? AND data = ? AND aluno = ?',
                [nota, observacao || '', turmaId, dataFormatada, nome]
            );
        });

        await Promise.all(updates);

        await connection.end();
        res.status(200).send({ message: "Notas atualizadas com sucesso!" });

    } catch (error) {
        console.error("Erro ao atualizar notas:", error);
        res.status(500).send({ message: "Erro ao atualizar as notas." });
    }
});


const avaliacoesPath = path.join(__dirname, 'output', 'avaliacoes.json'); // Caminho atualizado para a pasta /output

// Rota para salvar avaliação
app.post('/salvar-avaliacao', async (req, res) => {
    const { turma, nomeAvaliacao, dataAvaliacao, conteudoAvaliacao } = req.body;

    if (!turma || !nomeAvaliacao || !dataAvaliacao || !conteudoAvaliacao) {
        return res.status(400).send({ message: "Preencha todos os campos da avaliação." });
    }

    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Obter o ID da turma
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );

        if (turmaResult.length === 0) {
            return res.status(404).send({ message: `Turma "${turma}" não encontrada.` });
        }

        const turmaId = turmaResult[0].id;

        // Inserir a nova avaliação na tabela `avaliacoes`
        await connection.execute(
            'INSERT INTO avaliacoes (turma_id, nome_avaliacao, data_avaliacao, conteudo_avaliacao) VALUES (?, ?, ?, ?)', [turmaId, nomeAvaliacao, dataAvaliacao, conteudoAvaliacao]
        );

        // Fechar a conexão
        await connection.end();

        console.log(`Avaliação "${nomeAvaliacao}" para a turma "${turma}" salva com sucesso.`);
        res.status(200).send({ message: "Avaliação salva com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar avaliação:", error);
        res.status(500).send({ message: "Erro ao salvar a avaliação." });
    }
});

const notasAvaliacoesPath = path.join(__dirname, 'output', 'notasAvaliacoes.json');

// Função para carregar usuários
async function carregarUsuarios() {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar os usuários
        const [usuarios] = await connection.query('SELECT * FROM usuarios');

        // Fechar a conexão
        await connection.end();

        // Retornar os usuários
        return usuarios;
    } catch (error) {
        console.error("Erro ao carregar os usuários:", error);
        return []; // Retorna lista vazia em caso de erro
    }
}

// Rota de cadastro de usuários

app.post('/cadastro', async (req, res) => {
    const { email, senha, tipo, name, phone, city, state, unit, photo, coordenador } = req.body;

    console.log("📦 Dados recebidos:", req.body); // Log dos dados recebidos

    // Verifica se os dados obrigatórios estão presentes
    if (!email || !senha || !tipo || !name || !phone || !city || !state || !unit) {
        return res.status(400).send({ message: 'Todos os campos obrigatórios devem ser preenchidos!' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Verifica se o e-mail já existe
        const [usuarioExistente] = await connection.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (usuarioExistente.length > 0) {
            await connection.end();
            return res.status(400).send({ message: 'Usuário já cadastrado!' });
        }

        console.log("✅ E-mail válido e não encontrado no banco.");

        // Não incluímos o campo ID, pois ele é autoincrementado
        const sql = `INSERT INTO usuarios (email, senha, tipo, name, phone, city, state, unit, photo, coordenador) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [email, senha, tipo, name, phone, city, state, unit, photo, coordenador];

        console.log("📝 Executando query SQL com os parâmetros:", params); // Log da query

        // Executa a query de inserção
        await connection.execute(sql, params);

        // Fechar a conexão
        await connection.end();

        console.log(`Usuário ${email} cadastrado com sucesso.`);
        res.status(201).send({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).send('Erro ao cadastrar o usuário.');
    }
});




// Rota para verificar o tipo de usuário
app.get('/verificar-acesso', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).send({ message: 'O campo email é obrigatório!' });
    }

    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar o tipo de usuário pelo email
        const [result] = await connection.execute(
            'SELECT tipo FROM usuarios WHERE email = ?', [email]
        );

        // Fechar a conexão
        await connection.end();

        // Verificar se o usuário foi encontrado
        if (result.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }

        // Retornar o tipo de usuário
        res.status(200).send({ tipo: result[0].tipo });
    } catch (error) {
        console.error("Erro ao verificar o tipo de usuário:", error);
        res.status(500).send({ message: 'Erro ao verificar o acesso.' });
    }
});


// Rota para salvar notas
app.post('/salvar-notas-avaliacoes', async (req, res) => {
    const { turma, avaliacao, notas } = req.body;

    if (!turma || !avaliacao || !notas || notas.length === 0) {
        return res.status(400).send({ message: "Preencha todos os campos corretamente." });
    }

    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Obter o ID da turma
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );

        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: `Turma "${turma}" não encontrada.` });
        }

        const turmaId = turmaResult[0].id;

        // Obter o ID da avaliação
        const [avaliacaoResult] = await connection.execute(
            'SELECT id FROM avaliacoes WHERE nome_avaliacao = ? AND turma_id = ?', [avaliacao, turmaId]
        );

        if (avaliacaoResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: `Avaliação "${avaliacao}" não encontrada para a turma "${turma}".` });
        }

        const avaliacaoId = avaliacaoResult[0].id;

        // Inserir as notas na tabela `notas_avaliacoes`
        const notasValores = notas.map(nota => [
            turmaId, // turma_id
            avaliacaoId, // avaliacao_id
            nota.aluno, // aluno
            nota.nota // nota
        ]);

        await connection.query(
            'INSERT INTO notas_avaliacoes (turma_id, avaliacao_id, aluno, nota) VALUES ?', [notasValores]
        );

        // Fechar a conexão
        await connection.end();

        console.log(`Notas da avaliação "${avaliacao}" da turma "${turma}" salvas com sucesso.`);
        res.status(200).send({ message: "Notas salvas com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar as notas:", error);
        res.status(500).send({ message: "Erro ao salvar as notas." });
    }
});


// Rota para obter as avaliações
app.get('/avaliacoes', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar as avaliações junto com as informações das turmas
        const [avaliacoes] = await connection.query(`
            SELECT 
                a.id AS avaliacao_id,
                t.nome AS turma,
                a.nome_avaliacao,
                a.data_avaliacao,
                a.conteudo_avaliacao
            FROM 
                avaliacoes a
            JOIN 
                turmas t ON a.turma_id = t.id
        `);

        // Fechar a conexão
        await connection.end();

        if (avaliacoes.length === 0) {
            return res.status(404).send({ message: "Nenhuma avaliação encontrada." });
        }

        // Retornar as avaliações
        res.status(200).json(avaliacoes);
    } catch (error) {
        console.error("Erro ao carregar as avaliações:", error);
        res.status(500).send({ message: "Erro ao carregar as avaliações." });
    }
});

app.put('/editar-turma', async (req, res) => {
    const { turma, alunos } = req.body;

    if (!turma || !alunos || alunos.length === 0) {
        return res.status(400).send({ message: "Preencha os dados corretamente." });
    }

    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Obter o ID da turma
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );

        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: "Turma não encontrada." });
        }

        const turmaId = turmaResult[0].id;

        // Atualizar os alunos na tabela `alunos` para a turma especificada
        await connection.query('DELETE FROM alunos WHERE turma_id = ?', [turmaId]);

        // Inserir os novos alunos na tabela `alunos`
        const alunosValores = alunos.map(aluno => [aluno, turmaId]);
        await connection.query(
            'INSERT INTO alunos (nome, turma_id) VALUES ?', [alunosValores]
        );

        // Fechar a conexão
        await connection.end();

        console.log(`Turma "${turma}" atualizada com sucesso.`);
        res.status(200).send({ message: "Turma editada com sucesso!" });
    } catch (error) {
        console.error("Erro ao editar turma:", error);
        res.status(500).send({ message: "Erro ao editar a turma." });
    }
});
app.put('/atualizar-presencas-aluno', async (req, res) => {
    const { aluno, turmaIdAntiga, turmaIdNova } = req.body;

    if (!aluno || !turmaIdAntiga || !turmaIdNova) {
        return res.status(400).json({ message: 'Dados incompletos para atualizar presença.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE presencas SET turma_id = ? WHERE aluno = ? AND turma_id = ?',
            [turmaIdNova, aluno, turmaIdAntiga]
        );
        await connection.end();

        res.status(200).json({ message: 'Presenças atualizadas com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar presenças:', error);
        res.status(500).json({ message: 'Erro ao atualizar presenças.' });
    }
});


app.delete('/excluir-turma', async (req, res) => {
    const { turma } = req.body;

    if (!turma) {
        return res.status(400).send({ message: "O nome da turma é obrigatório." });
    }

    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Verificar se a turma existe
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );

        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: "Turma não encontrada." });
        }

        const turmaId = turmaResult[0].id;

        // Excluir a turma (os alunos associados serão removidos automaticamente)
        await connection.execute('DELETE FROM turmas WHERE id = ?', [turmaId]);

        // Fechar a conexão
        await connection.end();

        console.log(`Turma "${turma}" excluída com sucesso.`);
        res.status(200).send({ message: "Turma excluída com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir a turma:", error);
        res.status(500).send({ message: "Erro ao excluir a turma." });
    }
});


// Rota para obter as notas das avaliações
app.get('/notasavaliacoes', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar as notas das avaliações
        const [notas] = await connection.query(`
            SELECT 
                t.nome AS turma,
                a.nome_avaliacao,
                n.aluno,
                n.nota
            FROM 
                notas_avaliacoes n
            JOIN 
                avaliacoes a ON n.avaliacao_id = a.id
            JOIN 
                turmas t ON n.turma_id = t.id
        `);

        // Fechar a conexão
        await connection.end();

        if (notas.length === 0) {
            return res.status(404).send({ message: "Nenhuma nota encontrada." });
        }

        // Estruturar os dados no formato esperado
        const notasEstruturadas = {};
        notas.forEach(nota => {
            if (!notasEstruturadas[nota.turma]) {
                notasEstruturadas[nota.turma] = [];
            }

            notasEstruturadas[nota.turma].push({
                nomeAvaliacao: nota.nome_avaliacao,
                aluno: nota.aluno,
                nota: nota.nota
            });
        });

        // Retornar os dados estruturados
        res.status(200).json(notasEstruturadas);
    } catch (error) {
        console.error("Erro ao carregar as notas:", error);
        res.status(500).send({ message: "Erro ao carregar as notas." });
    }
});

// Rota para obter as presenças
app.get('/dados-presenca', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar presenças e ordenar pela data
        const [presencas] = await connection.query(`
            SELECT 
        t.nome AS turma,
        p.data,
        p.aluno,
        p.presenca,
        p.nota,
        p.observacao,
        p.conteudoAula
        FROM presencas p
        JOIN turmas t ON p.turma_id = t.id
        ORDER BY p.data ASC

        `);

        // Fechar a conexão
        await connection.end();

        if (presencas.length === 0) {
            return res.status(404).send({ message: "Nenhuma presença encontrada." });
        }

        // Estruturar os dados por turma e data
        const presencasEstruturadas = {};
        presencas.forEach(presenca => {
            if (!presencasEstruturadas[presenca.turma]) {
                presencasEstruturadas[presenca.turma] = [];
            }

            presencasEstruturadas[presenca.turma].push({
                data: presenca.data,
                aluno: presenca.aluno,
                presenca: presenca.presenca,
                nota: presenca.nota,
                observacao: presenca.observacao,
                conteudoAula: presenca.conteudoAula
            });
        });

        // Retornar os dados estruturados
        res.status(200).json(presencasEstruturadas);
    } catch (error) {
        console.error("Erro ao carregar as presenças:", error);
        res.status(500).send({ message: "Erro ao carregar as presenças." });
    }
});
// Função de middleware para verificar se o usuário está autenticado

function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido!' });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Token inválido!' });
        }
        req.user = decoded; // Armazena as informações decodificadas do token
        next();
    });
}

// Função para carregar usuários
async function carregarUsuarios() {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar todos os usuários
        const [usuarios] = await connection.query('SELECT * FROM usuarios');

        // Fechar a conexão
        await connection.end();

        // Retornar os usuários
        return usuarios;
    } catch (error) {
        console.error("Erro ao carregar os usuários:", error);
        return []; // Retorna uma lista vazia em caso de erro
    }
}

// Rota para acessar diário (Instrutor e Coordenador têm acesso)
app.get('/Diario/indexDiario.html', verificarToken, (req, res) => {
    try {
        const filePath = path.join(__dirname, 'Diario', 'indexDiario.html');
        res.sendFile(filePath);
    } catch (error) {
        console.error("Erro ao acessar o diário:", error);
        res.status(500).send({ message: "Erro ao acessar o diário." });
    }
});
//...
app.get("/instrutores-por-coordenador", async (req, res) => {
    const coordenador = req.query.coordenador;

    if (!coordenador) {
        return res.status(400).send("Coordenador não fornecido");
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        const [instrutores] = await connection.execute(
            "SELECT name, id FROM usuarios WHERE tipo = 'Instrutor' AND coordenador = ?",
            [coordenador]
        );

        await connection.end();

        if (instrutores.length > 0) {
            return res.status(200).json(instrutores);
        } else {
            return res.status(404).send("Nenhum instrutor encontrado para esse coordenador.");
        }
    } catch (err) {
        console.error("Erro ao buscar instrutores:", err);
        return res.status(500).send("Erro interno do servidor.");
    }
});

// Rota para obter os dados do usuário logado
app.get('/usuario-logado', async (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido!' });
    }


    try {
        // Verificar e decodificar o token
        const decoded = jwt.verify(token, secretKey);

        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar o usuário pelo e-mail decodificado
        const [usuarios] = await connection.query(
            'SELECT email, name, photo, tipo FROM usuarios WHERE email = ?', [decoded.email]
        );

        // Fechar a conexão
        await connection.end();

        // Verificar se o usuário existe
        if (usuarios.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }

        // Retornar os dados do usuário
        const usuario = usuarios[0];
        res.status(200).send({
            email: usuario.email,
            name: usuario.name,
            photo: usuario.photo,
            tipo: usuario.tipo
        });
    } catch (error) {
        console.error("Erro ao verificar token ou buscar usuário:", error);
        res.status(403).send({ message: 'Token inválido!' });
    }
});




app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).send({ message: 'E-mail e senha são obrigatórios!' });
    }

    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar o usuário pelo e-mail
        const [usuarios] = await connection.query(
            'SELECT email, senha, tipo FROM usuarios WHERE email = ?', [email]
        );

        // Fechar a conexão
        await connection.end();

        // Verificar se o usuário foi encontrado
        if (usuarios.length === 0) {
            return res.status(401).send({ message: 'E-mail ou senha incorretos!' });
        }

        const usuario = usuarios[0];

        // Comparar a senha diretamente (apenas para uso temporário)
        if (usuario.senha !== senha) {
            return res.status(401).send({ message: 'E-mail ou senha incorretos!' });
        }

        // Gerar o token JWT
        const token = jwt.sign({ email: usuario.email, tipo: usuario.tipo },
            secretKey, { expiresIn: '2h' }
        );

        console.log(`Usuário autenticado: ${usuario.email}, Tipo: ${usuario.tipo}`);
        res.status(200).send({
            message: 'Login bem-sucedido!',
            token,
            tipo: usuario.tipo
        });
    } catch (error) {
        console.error("Erro ao autenticar o usuário:", error);
        res.status(500).send({ message: 'Erro ao realizar login.' });
    }
});

// Função para atualizar usuário
async function atualizarUsuario(email, novosDados) {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Verificar se o usuário existe
        const [usuarioExistente] = await connection.query(
            'SELECT id FROM usuarios WHERE email = ?', [email]
        );

        if (usuarioExistente.length === 0) {
            await connection.end();
            return false; // Usuário não encontrado
        }

        // Atualizar os dados do usuário
        const campos = Object.keys(novosDados)
            .map(campo => `${campo} = ?`)
            .join(', ');

        const valores = [...Object.values(novosDados), email];

        await connection.query(
            `UPDATE usuarios SET ${campos} WHERE email = ?`,
            valores
        );

        // Fechar a conexão
        await connection.end();
        return true; // Atualização bem-sucedida
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        return false; // Erro ao atualizar
    }
}

app.get('/perfil', async (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido!' });
    }

    try {
        // Decodificar o token
        const decoded = jwt.verify(token, secretKey);

        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar o usuário pelo e-mail
        const [usuarios] = await connection.query(
            'SELECT name, email, phone, city, state, unit, photo FROM usuarios WHERE email = ?', [decoded.email]
        );

        // Fechar a conexão
        await connection.end();

        // Verificar se o usuário foi encontrado
        if (usuarios.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }

        const usuario = usuarios[0];

        // Retornar os dados do perfil
        res.status(200).send({
            name: usuario.name || "",
            email: usuario.email,
            phone: usuario.phone || "",
            city: usuario.city || "",
            state: usuario.state || "",
            unit: usuario.unit || "",
            photo: usuario.photo || "/projeto/Imagens/perfil.png"
        });
    } catch (error) {
        console.error('Erro ao verificar token ou consultar usuário:', error);
        res.status(403).send({ message: 'Token inválido!' });
    }
});


// Função para atualizar um usuário
async function atualizarUsuario(email, novosDados) {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Verificar se o usuário existe
        const [usuarioExistente] = await connection.query(
            'SELECT id FROM usuarios WHERE email = ?', [email]
        );

        if (usuarioExistente.length === 0) {
            await connection.end();
            return false; // Usuário não encontrado
        }

        // Preparar os campos e valores para o update
        const campos = Object.keys(novosDados)
            .map(campo => `${campo} = ?`)
            .join(', ');
        const valores = [...Object.values(novosDados), email];

        // Atualizar os dados do usuário
        await connection.query(
            `UPDATE usuarios SET ${campos} WHERE email = ?`,
            valores
        );

        // Fechar a conexão
        await connection.end();
        return true; // Atualização bem-sucedida
    } catch (error) {
        console.error("Erro ao atualizar o usuário:", error);
        return false; // Erro ao atualizar
    }
}

// Rota para atualizar o perfil do usuário
app.post('/atualizar-perfil', async (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ error: "Token não fornecido" });
    }

    try {
        // Decodificar o token
        const decoded = jwt.verify(token, secretKey);
        const email = decoded.email;

        const { name, phone, city, state, unit, senha, photo } = req.body;

        if (!name && !phone && !city && !state && !unit && !senha && !photo) {
            return res.status(400).send({ error: "Nenhum campo para atualizar fornecido" });
        }

        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Verificar se o usuário existe
        const [usuarios] = await connection.query(
            'SELECT id FROM usuarios WHERE email = ?', [email]
        );

        if (usuarios.length === 0) {
            await connection.end();
            return res.status(404).send({ error: "Usuário não encontrado" });
        }

        // Montar query de atualização dinamicamente
        const campos = [];
        const valores = [];

        if (name) {
            campos.push('name = ?');
            valores.push(name);
        }
        if (phone) {
            campos.push('phone = ?');
            valores.push(phone);
        }
        if (city) {
            campos.push('city = ?');
            valores.push(city);
        }
        if (state) {
            campos.push('state = ?');
            valores.push(state);
        }
        if (unit) {
            campos.push('unit = ?');
            valores.push(unit);
        }
        if (photo) {
            campos.push('photo = ?');
            valores.push(photo);
        }
        if (senha) {
            campos.push('senha = ?');
            valores.push(senha);
        }

        // Adicionar o e-mail ao final dos valores para a cláusula WHERE
        valores.push(email);

        // Executar atualização
        const updateQuery = `UPDATE usuarios SET ${campos.join(', ')} WHERE email = ?`;
        await connection.query(updateQuery, valores);

        // Fechar a conexão
        await connection.end();

        res.status(200).send({ message: "Perfil atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).send({ error: "Erro ao atualizar perfil" });
    }
});


// Configuração do armazenamento de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads'); // 🔴 Garante que as imagens das unidades sejam armazenadas na pasta correta
        fs.mkdirSync(uploadPath, { recursive: true }); // 🔴 Cria a pasta caso não exista
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Endpoint para upload de imagem
app.post('/upload-image', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'Nenhuma imagem foi enviada.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).send({ imageUrl });
});

app.get('/usuarios', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Consultar todos os usuários
        const [usuarios] = await connection.query('SELECT * FROM usuarios');

        // Fechar a conexão
        await connection.end();

        // Retornar os usuários
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        res.status(500).send({ message: "Erro ao carregar usuários." });
    }
});

app.get('/listar-unidades', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT id, unidade, photo FROM unidades');
        await connection.end();

        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        res.status(500).json({ message: 'Erro ao buscar unidades.' });
    }
});

// Middleware para processar formulários sem JSON
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // Para processar formulários tradicionais


app.post("/cadastrar-unidade", async (req, res) => {
    try {
        console.log("📥 Dados recebidos no backend:", req.body); // 🔹 Depuração

        const { unidade, escola, cidade, coordenador } = req.body;

        if (!unidade || !escola || !cidade || !coordenador) {
            return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
        }

        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            "INSERT INTO unidades (unidade, escola, cidade, coordenador) VALUES (?, ?, ?, ?)",
            [unidade, escola, cidade, coordenador]
        );
        await connection.end();

        console.log("✅ Unidade cadastrada com sucesso!");
        res.status(201).json({ message: "Unidade cadastrada com sucesso!" });

    } catch (error) {
        console.error("❌ Erro ao cadastrar unidade:", error);
        res.status(500).json({ message: "Erro ao cadastrar a unidade." });
    }
});


// Rota para listar unidades cadastradas
app.get('/listar-unidades', async (req, res) => {
    console.log('🔹 Requisição recebida para listar unidades');

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [unidades] = await connection.query('SELECT * FROM unidades');
        await connection.end();

        console.log('✅ Lista de unidades recuperada com sucesso!', unidades);
        res.status(200).json(unidades);
    } catch (error) {
        console.error('❌ Erro ao listar unidades:', error);
        res.status(500).json({ message: 'Erro ao listar as unidades.' });
    }
});

app.get("/listar-coordenadores", async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Buscar apenas usuários que são Coordenadores
        const [coordenadores] = await connection.execute(
            "SELECT name, email FROM usuarios WHERE tipo = 'Coordenador'"
        );

        await connection.end();

        res.status(200).json(coordenadores);
    } catch (error) {
        console.error("❌ Erro ao listar coordenadores:", error);
        res.status(500).send({ message: "Erro ao obter a lista de coordenadores." });
    }
});
//... Modificação para listar instrutores
// Rota para listar instrutores
app.get("/listar-instrutores", async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Buscar apenas usuários que são Instrutores
        const [instrutores] = await connection.execute(
            "SELECT name, email FROM usuarios WHERE tipo = 'Instrutor'"
        );

        await connection.end();

        res.status(200).json(instrutores);
    } catch (error) {
        console.error("❌ Erro ao listar instrutores:", error);
        res.status(500).send({ message: "Erro ao obter a lista de instrutores." });
    }
});
app.get("/instrutores-por-coordenador", async (req, res) => {
    const coordenador = req.query.coordenador; // Obtém o nome do coordenador do query string

    if (!coordenador) {
        return res.status(400).send("Coordenador não fornecido");
    }

    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Buscar instrutores cujo coordenador é igual ao nome fornecido
        const [instrutores] = await connection.execute(
            "SELECT * FROM usuarios WHERE tipo = 'Instrutor' AND coordenador = ?",
            [coordenador]
        );

        // Verifica se encontrou instrutores
        if (instrutores.length > 0) {
            return res.status(200).json(instrutores); // Retorna os instrutores encontrados
        } else {
            return res.status(404).send("Nenhum instrutor encontrado para esse coordenador.");
        }
    } catch (error) {
        console.error("Erro ao buscar instrutores:", error);
        res.status(500).send("Erro no servidor.");
    }
});



