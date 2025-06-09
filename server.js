//=============================================================================
// server.js
//=============================================================================

// Carrega módulos
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mysql = require('mysql2/promise');

const app = express();
//🚭Como era na Vercel
const port = 80;
//🚭Como é localmente
// const port = 3000;                          // Porta local
const secretKey = "sua_chave_secreta_super_segura"; // Chave para JWT

//🚭Como era na Vercel
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
};

//🚭Como é localmente
// Configuração do banco de dados (local)
// const dbConfig = {
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'buldjoxpabj83wr7hks0'
// };

//----------------------------------------------------------------------------
// MIDDLEWARES
//----------------------------------------------------------------------------

// Permite requisições Cross-Origin
app.use(cors());
app.use('/Imagens', express.static(path.join(__dirname, 'Imagens')));
// Permite receber JSON no corpo da requisição
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta "public" e de outras rotas específicas
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//----------------------------------------------------------------------------
// CONFIGURAÇÃO DO UPLOAD DE IMAGENS (multer)
//----------------------------------------------------------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

//----------------------------------------------------------------------------
// FUNÇÃO AUXILIAR: verificarToken (middleware para rotas protegidas)
//----------------------------------------------------------------------------

function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido!' });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Token inválido!' });
        }
        req.user = decoded; // informa o usuário decodificado
        next();
    });
}

//----------------------------------------------------------------------------
// ROTAS PARA SERVIR ARQUIVOS HTML/CSS/JS DE DIVERSOS MODULOS
//----------------------------------------------------------------------------

// ---- Diário ----
app.get('/Diario/indexDiario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Diario', 'indexDiario.html'));
});
app.get('/Diario/stylesDiario.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Diario', 'stylesDiario.css'));
});
app.get('/Diario/scriptDiario.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Diario', 'scriptDiario.js'));
});

// ---- Editar Diário ----
app.get('/EditarDiario/editarDiario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarDiario', 'editarDiario.html'));
});
app.get('/EditarDiario/editarDiario.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarDiario', 'editarDiario.css'));
});
app.get('/EditarDiario/editarDiario.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarDiario', 'editarDiario.js'));
});

// ---- Login ----
app.get('/Login/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login', 'login.html'));
});
app.get('/Login/login.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login', 'login.css'));
});
app.get('/Login/login.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login', 'login.js'));
});

// ---- Cadastro de Usuário ----
app.get('/Cadastro/cadastro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cadastro', 'cadastro.html'));
});
app.get('/Cadastro/cadastro.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cadastro', 'cadastro.css'));
});
app.get('/Cadastro/cadastro.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cadastro', 'cadastro.js'));
});

// ---- Perfil de Usuário ----
app.get('/Perfil/perfil.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Perfil', 'perfil.html'));
});
app.get('/Perfil/perfil.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Perfil', 'perfil.css'));
});
app.get('/Perfil/perfil.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Perfil', 'perfil.js'));
});

// ---- Criar Turmas ----
app.get('/CriarTurmas/criarTurmas.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'CriarTurmas', 'criarTurmas.html'));
});
app.get('/CriarTurmas/criarTurmas.css.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'CriarTurmas', 'criarTurmas.css.css'));
});
app.get('/CriarTurmas/criarTurmas.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'CriarTurmas', 'criarTurmas.js'));
});

// ---- Editar Turmas ----
app.get('/EditarTurmas/editarTurmas.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'editarTurmas.html'));
});
app.get('/EditarTurmas/editarTurmas.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'editarTurmas.css'));
});
app.get('/EditarTurmas/editarTurmas.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'EditarTurmas', 'editarTurmas.js'));
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

// ---- Avaliações ----
app.get('/Avaliacoes/avaliacao.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Avaliacoes', 'avaliacao.html'));
});
app.get('/Avaliacoes/avaliacao.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Avaliacoes', 'avaliacao.css'));
});
app.get('/Avaliacoes/avaliacao.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Avaliacoes', 'avaliacao.js'));
});

// ---- Notas e Avaliações ----
app.get('/NotasAvaliacoes/notasavaliacoes.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'NotasAvaliacoes', 'notasavaliacoes.html'));
});
app.get('/NotasAvaliacoes/notasavaliacoes.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'NotasAvaliacoes', 'notasavaliacoes.css'));
});
app.get('/NotasAvaliacoes/notasavaliacoes.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'NotasAvaliacoes', 'notasAvaliacoes.js'));
});

// ---- Relatório ----
app.get('/Relatorio/relatorio.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Relatorio', 'relatorio.html'));
});
app.get('/Relatorio/relatorio.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'Relatorio', 'relatorio.css'));
});
app.get('/Relatorio/relatorio.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'Relatorio', 'relatorio.js'));
});

// ---- Cadastro de Unidades ----
app.get('/CadastroUnidades/cadastroUnidades.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'CadastroUnidades', 'cadastroUnidades.html'));
});
app.get('/CadastroUnidades/cadastroUnidades.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'CadastroUnidades', 'cadastroUnidades.css'));
});
app.get('/CadastroUnidades/cadastroUnidades.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'CadastroUnidades', 'cadastroUnidades.js'));
});

// ---- Visualizar Avaliação ----
app.get('/VisualizarAvaliacao/visualizarAvaliacao.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'visualizarAvaliacao.html'));
});
app.get('/VisualizarAvaliacao/visualizarAvaliacao.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'visualizarAvaliacao.css'));
});
app.get('/VisualizarAvaliacao/visualizarAvaliacao.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'visualizarAvaliacao.js'));
});

// ---- Arquivos Estáticos de Imagens ----
app.get('Imagens/logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'Imagens', 'logo.png'));
});
app.get('/Imagens/perfil.png', (req, res) => {
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

//----------------------------------------------------------------------------
// ROTAS DE API – BACKEND (Banco de Dados)
//----------------------------------------------------------------------------

// === 1) Cadastro de Unidades ===
app.post("/cadastrar-unidade", async (req, res) => {
    try {
        const { unidade, escola, cidade, coordenador, competencias } = req.body;
        if (!unidade || !escola || !cidade || !coordenador || typeof competencias === "undefined") {
            return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
        }
        const competenciasFlag = competencias ? 1 : 0;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `INSERT INTO unidades (unidade, escola, cidade, coordenador, competencias)
       VALUES (?, ?, ?, ?, ?)`,
            [unidade, escola, cidade, coordenador, competenciasFlag]
        );
        await connection.end();
        return res.status(201).json({ message: "Unidade cadastrada com sucesso!" });
    } catch (error) {
        console.error("Erro ao cadastrar unidade:", error);
        return res.status(500).json({ message: error.message });
    }
});

// === 2) Listar Unidades ===
app.get("/listar-unidades", async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            "SELECT id, unidade, escola, cidade, coordenador, competencias FROM unidades"
        );
        await connection.end();
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao buscar unidades:", error);
        return res.status(500).json({ message: "Erro ao buscar unidades." });
    }
});

// === 3) Cadastro de Turma e Alunos ===
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
        return res.status(201).send({ message: 'Turma salva com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar a turma:', error);
        return res.status(500).send({ message: 'Erro ao salvar a turma.' });
    }
});

// === 4) Listar Turmas (com flag competências) ===
app.get('/listar-turmas', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
      SELECT 
        t.id, 
        t.nome,
        t.instrutor,
        t.unidade_id,
        u.competencias 
      FROM 
        turmas t
      JOIN 
        unidades u ON t.unidade_id = u.id
    `);
        await connection.end();
        return res.json(rows);
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao listar turmas:", error);
        return res.status(500).json({ message: "Erro ao listar as turmas." });
    }
});

// === 5) Obter Dados de Todas as Turmas + Alunos (formato { turma: { id, instrutor, unidade_id, alunos: [...] } }) ===
app.get('/dados', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [turmas] = await connection.query('SELECT id, nome, instrutor, unidade_id FROM turmas');
        const [alunos] = await connection.query('SELECT nome, turma_id FROM alunos');
        await connection.end();
        const turmasEstruturadas = {};
        turmas.forEach(turma => {
            turmasEstruturadas[turma.nome] = {
                id: turma.id,
                instrutor: turma.instrutor,
                unidade_id: turma.unidade_id,
                alunos: alunos
                    .filter(al => al.turma_id === turma.id)
                    .map(al => al.nome)
            };
        });
        return res.status(200).json(turmasEstruturadas);
    } catch (error) {
        console.error("Erro ao carregar os dados de turmas:", error);
        return res.status(500).send({ message: "Erro ao carregar os dados de turmas." });
    }
});

// === 6) Salvar Presença (Notas x Competências) ===
app.post('/salvar-presenca', async (req, res) => {
    const { turma, data, conteudoAula, alunos } = req.body;
    if (!turma || !data || !conteudoAula || !alunos?.length) {
        return res.status(400).send({ message: "Faltam informações obrigatórias: turma, data, conteúdo ou lista de alunos." });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // 1) Pega turma_id e unidade_id
        const [[t]] = await connection.execute(
            'SELECT id AS turma_id, unidade_id FROM turmas WHERE nome = ?',
            [turma]
        );
        if (!t) {
            await connection.end();
            return res.status(404).send({ message: `Turma "${turma}" não encontrada.` });
        }

        // 2) Verifica se essa unidade usa competências
        const [[u]] = await connection.execute(
            'SELECT competencias FROM unidades WHERE id = ?',
            [t.unidade_id]
        );
        const usarCompetencias = u.competencias === 1;

        if (!usarCompetencias) {
            // Modo “Notas”
            const presencas = alunos.map(a => [
                t.turma_id,
                data,
                a.nome,
                a.presenca,
                a.nota,
                a.observacao,
                conteudoAula
            ]);
            await connection.query(
                `INSERT INTO presencas
         (turma_id, data, aluno, presenca, nota, observacao, conteudoAula)
         VALUES ?`,
                [presencas]
            );
            await connection.end();
            return res.status(200).send({ message: "Presenças salvas com sucesso!" });
        }

        // Modo “Competências”
        // 3) Busca todos os alunos dessa turma para montar map nome → id
        const [dbAlunos] = await connection.execute(
            'SELECT id, nome FROM alunos WHERE turma_id = ?',
            [t.turma_id]
        );
        const alunoMap = Object.fromEntries(dbAlunos.map(a => [a.nome, a.id]));
        const descricao = conteudoAula;

        // 4) Monta as linhas para inserir na tabela “competencias”
        const rows = alunos.map(a => {
            const alunoId = alunoMap[a.nome];
            if (typeof alunoId === 'undefined') {
                throw new Error(`Aluno "${a.nome}" não encontrado na turma_id ${t.turma_id}.`);
            }
            return [
                alunoId,               //  1: aluno_id
                t.turma_id,            //  2: turma_id   ← NOVO campo
                a.presenca,            //  3: presenca
                a.concentracao,        //  4: concentracao
                a.comprometimento,     //  5: comprometimento
                a.proatividade,        //  6: proatividade
                a.criatividade,        //  7: criatividade
                a.trabalho_em_equipe,  //  8: trabalho_em_equipe
                a.inteligencia_emocional,          //  9: inteligencia_emocional
                a.capacidade_avaliacao_decisao,     // 10: capacidade_avaliacao_decisao
                a.flexibilidade_cognitiva,          // 11: flexibilidade_cognitiva
                a.raciocinio_logico,               // 12: raciocinio_logico
                a.objetividade,                    // 13: objetividade
                a.conclusao_atividades,            // 14: conclusao_atividades
                a.organizacao,                     // 15: organizacao
                a.planejamento,                    // 16: planejamento
                a.solucao_atividade,               // 17: solucao_atividade
                a.motivacao,                       // 18: motivacao
                data,          // 19: data_avaliacao      (certifique-se de que `data` está em YYYY-MM-DD ou Date válido)
                descricao      // 20: descricao
            ];
        });

        // (2) Agora faça o INSERT incluindo exatamente 20 colunas na mesma ordem:
        await connection.query(
            `INSERT INTO competencias
   (
     aluno_id,
     turma_id,
     presenca,
     concentracao,
     comprometimento,
     proatividade,
     criatividade,
     trabalho_em_equipe,
     inteligencia_emocional,
     capacidade_avaliacao_decisao,
     flexibilidade_cognitiva,
     raciocinio_logico,
     objetividade,
     conclusao_atividades,
     organizacao,
     planejamento,
     solucao_atividade,
     motivacao,
     data_avaliacao,
     descricao
   )
   VALUES ?`,
            [rows]
        );

        await connection.end();
        return res.status(200).send({ message: "Competências salvas com sucesso!" });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro em /salvar-presenca (stack):", error.stack || error);
        return res.status(500).json({ error: error.message || "Erro interno desconhecido" });
    }
});

// === 7) Conteúdo de Aula (para exibir no front-end, se necessário) ===
app.get('/conteudo-aula', async (req, res) => {
    const { turma, data } = req.query;
    if (!turma || !data) {
        return res.status(400).json({ message: 'Informe a turma e a data.' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );
        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Turma não encontrada.' });
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
        return res.status(200).json({ conteudoAula: result[0].conteudoAula });
    } catch (error) {
        if (connection) await connection.end();
        console.error('Erro ao buscar conteúdo da aula:', error);
        return res.status(500).json({ message: 'Erro ao buscar o conteúdo da aula.' });
    }
});

// === 8) Rota para obter os dados de Competências (Grupo JSON por turma) ===
app.get('/dados-competencias', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
      SELECT
        t.nome AS turma,
        c.data_avaliacao AS data,
        a.nome AS aluno,
        c.presenca,
        c.concentracao,
        c.comprometimento,
        c.proatividade,
        c.criatividade,
        c.trabalho_em_equipe,
        c.inteligencia_emocional,
        c.capacidade_avaliacao_decisao,
        c.flexibilidade_cognitiva,
        c.raciocinio_logico,
        c.objetividade,
        c.conclusao_atividades,
        c.organizacao,
        c.planejamento,
        c.solucao_atividade,
        c.motivacao,
        c.media AS nota,
        c.descricao AS conteudoAula
      FROM competencias c
      JOIN alunos a ON c.aluno_id = a.id
      JOIN turmas t ON a.turma_id = t.id
      ORDER BY t.nome, c.data_avaliacao, a.nome
    `);
        await connection.end();

        const resultado = {};
        rows.forEach(row => {
            if (!resultado[row.turma]) {
                resultado[row.turma] = [];
            }
            resultado[row.turma].push({
                data: row.data.toISOString(),        // por segurança, transforma em string ISO
                aluno: row.aluno,
                presenca: row.presenca,
                concentracao: row.concentracao,
                comprometimento: row.comprometimento,
                proatividade: row.proatividade,
                criatividade: row.criatividade,
                trabalho_em_equipe: row.trabalho_em_equipe,
                inteligencia_emocional: row.inteligencia_emocional,
                capacidade_avaliacao_decisao: row.capacidade_avaliacao_decisao,
                flexibilidade_cognitiva: row.flexibilidade_cognitiva,
                raciocinio_logico: row.raciocinio_logico,
                objetividade: row.objetividade,
                conclusao_atividades: row.conclusao_atividades,
                organizacao: row.organizacao,
                planejamento: row.planejamento,
                solucao_atividade: row.solucao_atividade,
                motivacao: row.motivacao,
                nota: row.nota,
                conteudoAula: row.conteudoAula
            });
        });

        return res.status(200).json(resultado);
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao carregar dados das competências:", error);
        return res.status(500).json({ message: "Erro ao carregar dados das competências." });
    }
});

// === 9) Obter Presenças (Notas) ===
app.get('/dados-presenca', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
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
        await connection.end();

        if (presencas.length === 0) {
            return res.status(404).send({ message: "Nenhuma presença encontrada." });
        }

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

        return res.status(200).json(presencasEstruturadas);
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao carregar as presenças:", error);
        return res.status(500).send({ message: "Erro ao carregar as presenças." });
    }
});

// === 10) Rota para obter Notas de Avaliações (agrupado por turma) ===
app.get('/notasavaliacoes', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [notas] = await connection.query(`
      SELECT 
        t.nome AS turma,
        a.nome_avaliacao,
        n.aluno,
        n.nota
      FROM notas_avaliacoes n
      JOIN avaliacoes a ON n.avaliacao_id = a.id
      JOIN turmas t ON n.turma_id = t.id
    `);
        await connection.end();

        if (notas.length === 0) {
            return res.status(404).send({ message: "Nenhuma nota encontrada." });
        }

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

        return res.status(200).json(notasEstruturadas);
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao carregar as notas:", error);
        return res.status(500).send({ message: "Erro ao carregar as notas." });
    }
});

// === 11) Salvar Avaliação (nome_avaliacao, conteúdo, data) ===
app.post('/salvar-avaliacao', async (req, res) => {
    const { turma, nomeAvaliacao, dataAvaliacao, conteudoAvaliacao } = req.body;
    if (!turma || !nomeAvaliacao || !dataAvaliacao || !conteudoAvaliacao) {
        return res.status(400).send({ message: "Preencha todos os campos da avaliação." });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );
        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: `Turma "${turma}" não encontrada.` });
        }
        const turmaId = turmaResult[0].id;
        await connection.execute(
            'INSERT INTO avaliacoes (turma_id, nome_avaliacao, data_avaliacao, conteudo_avaliacao) VALUES (?, ?, ?, ?)',
            [turmaId, nomeAvaliacao, dataAvaliacao, conteudoAvaliacao]
        );
        await connection.end();
        return res.status(200).send({ message: "Avaliação salva com sucesso!" });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao salvar avaliação:", error);
        return res.status(500).send({ message: "Erro ao salvar a avaliação." });
    }
});

// === 12) Rota para obter Avaliações Cadastradas ===
app.get('/avaliacoes', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [avaliacoes] = await connection.query(`
      SELECT 
        a.id AS avaliacao_id,
        t.nome AS turma,
        a.nome_avaliacao,
        a.data_avaliacao,
        a.conteudo_avaliacao
      FROM avaliacoes a
      JOIN turmas t ON a.turma_id = t.id
    `);
        await connection.end();
        if (avaliacoes.length === 0) {
            return res.status(404).send({ message: "Nenhuma avaliação encontrada." });
        }
        return res.status(200).json(avaliacoes);
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao carregar as avaliações:", error);
        return res.status(500).send({ message: "Erro ao carregar as avaliações." });
    }
});

// === 13) Salvar Notas de Avaliações (para cada aluno) ===
app.post('/salvar-notas-avaliacoes', async (req, res) => {
    const { turma, avaliacao, notas } = req.body;
    if (!turma || !avaliacao || !notas || notas.length === 0) {
        return res.status(400).send({ message: "Preencha todos os campos corretamente." });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // 1) Busca o ID da turma
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );
        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: `Turma "${turma}" não encontrada.` });
        }
        const turmaId = turmaResult[0].id;
        // 2) Busca o ID da avaliação
        const [avaliacaoResult] = await connection.execute(
            'SELECT id FROM avaliacoes WHERE nome_avaliacao = ? AND turma_id = ?', [avaliacao, turmaId]
        );
        if (avaliacaoResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: `Avaliação "${avaliacao}" não encontrada para a turma "${turma}".` });
        }
        const avaliacaoId = avaliacaoResult[0].id;
        // 3) Insere as notas
        const notasValores = notas.map(nota => [
            turmaId,          // turma_id
            avaliacaoId,      // avaliacao_id
            nota.aluno,       // aluno (nome do aluno)
            nota.nota         // nota (valor numérico)
        ]);
        await connection.query(
            'INSERT INTO notas_avaliacoes (turma_id, avaliacao_id, aluno, nota) VALUES ?',
            [notasValores]
        );
        await connection.end();
        return res.status(200).send({ message: "Notas salvas com sucesso!" });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao salvar as notas:", error);
        return res.status(500).send({ message: "Erro ao salvar as notas." });
    }
});

// === 14) Editar Turma (Atualizar lista de alunos) ===
app.put('/editar-turma', async (req, res) => {
    const { turma, alunos } = req.body;
    if (!turma || !alunos || alunos.length === 0) {
        return res.status(400).send({ message: "Preencha os dados corretamente." });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );
        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: "Turma não encontrada." });
        }
        const turmaId = turmaResult[0].id;
        // 1) Apaga todos os alunos antigos dessa turma
        await connection.query('DELETE FROM alunos WHERE turma_id = ?', [turmaId]);
        // 2) Insere novamente a lista atualizada
        const alunosValores = alunos.map(aluno => [aluno, turmaId]);
        await connection.query(
            'INSERT INTO alunos (nome, turma_id) VALUES ?', [alunosValores]
        );
        await connection.end();
        return res.status(200).send({ message: "Turma editada com sucesso!" });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao editar turma:", error);
        return res.status(500).send({ message: "Erro ao editar a turma." });
    }
});

// === 15) Atualizar Presenças de um Aluno (ao mover aluno de turma) ===
app.put('/atualizar-presencas-aluno', async (req, res) => {
    const { aluno, turmaIdAntiga, turmaIdNova } = req.body;
    if (!aluno || !turmaIdAntiga || !turmaIdNova) {
        return res.status(400).json({ message: 'Dados incompletos para atualizar presença.' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE presencas SET turma_id = ? WHERE aluno = ? AND turma_id = ?',
            [turmaIdNova, aluno, turmaIdAntiga]
        );
        await connection.end();
        return res.status(200).json({ message: 'Presenças atualizadas com sucesso.' });
    } catch (error) {
        if (connection) await connection.end();
        console.error('Erro ao atualizar presenças:', error);
        return res.status(500).json({ message: 'Erro ao atualizar presenças.' });
    }
});

// === 16) Excluir Turma (e automaticamente seus alunos) ===
app.delete('/excluir-turma', async (req, res) => {
    const { turma } = req.body;
    if (!turma) {
        return res.status(400).send({ message: "O nome da turma é obrigatório." });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );
        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: "Turma não encontrada." });
        }
        const turmaId = turmaResult[0].id;
        await connection.execute('DELETE FROM turmas WHERE id = ?', [turmaId]);
        await connection.end();
        return res.status(200).send({ message: "Turma excluída com sucesso!" });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao excluir a turma:", error);
        return res.status(500).send({ message: "Erro ao excluir a turma." });
    }
});

// === 17) Atualizar Notas (apenas notas, no sistema de “Notas”) ===
app.post('/atualizar-notas', async (req, res) => {
    const { turma, data, alunos } = req.body;
    if (!turma || !data || !alunos || alunos.length === 0) {
        return res.status(400).send({ message: "Faltam informações obrigatórias: turma, data ou alunos." });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // 1) Busca ID da turma
        const [turmaResult] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );
        if (turmaResult.length === 0) {
            await connection.end();
            return res.status(404).send({ message: `Turma "${turma}" não encontrada.` });
        }
        const turmaId = turmaResult[0].id;
        const dataFormatada = new Date(data).toISOString().split('T')[0];
        // 2) Para cada aluno, faz UPDATE na tabela 'presencas'
        const updates = alunos.map(aluno => {
            const { nome, nota, observacao } = aluno;
            if (typeof nota === "undefined" || isNaN(nota)) {
                return Promise.resolve(); // caso seja inválido, ignora
            }
            return connection.execute(
                'UPDATE presencas SET nota = ?, observacao = ? WHERE turma_id = ? AND data = ? AND aluno = ?',
                [nota, observacao || '', turmaId, dataFormatada, nome]
            );
        });
        await Promise.all(updates);
        await connection.end();
        return res.status(200).send({ message: "Notas atualizadas com sucesso!" });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao atualizar notas:", error);
        return res.status(500).send({ message: "Erro ao atualizar as notas." });
    }
});

//----------------------------------------------------------------------------
// ROTAS PARA GERENCIAMENTO DE USUÁRIOS (Login, Cadastro, Perfil, etc.)
//----------------------------------------------------------------------------

// === 18) Cadastro de Usuário ===
app.post('/cadastro', async (req, res) => {
    const { email, senha, tipo, name, phone, city, state, unit, photo, coordenador } = req.body;
    if (!email || !senha || !tipo || !name || !phone || !city || !state || !unit) {
        return res.status(400).send({ message: 'Todos os campos obrigatórios devem ser preenchidos!' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // Verifica se o e-mail já existe
        const [usuarioExistente] = await connection.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (usuarioExistente.length > 0) {
            await connection.end();
            return res.status(400).send({ message: 'Usuário já cadastrado!' });
        }
        // Insere novo usuário
        const sql = `
      INSERT INTO usuarios (email, senha, tipo, name, phone, city, state, unit, photo, coordenador)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const params = [email, senha, tipo, name, phone, city, state, unit, photo || '', coordenador || ''];
        await connection.execute(sql, params);
        await connection.end();
        return res.status(201).send({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        if (connection) await connection.end();
        console.error('Erro ao cadastrar usuário:', error);
        return res.status(500).send('Erro ao cadastrar o usuário.');
    }
});

// === 19) Listar Coordenadores ===
app.get("/listar-coordenadores", async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [coordenadores] = await connection.execute(
            "SELECT name, email FROM usuarios WHERE tipo = 'Coordenador'"
        );
        await connection.end();
        return res.status(200).json(coordenadores);
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao listar coordenadores:", error);
        return res.status(500).send({ message: "Erro ao obter a lista de coordenadores." });
    }
});

// === 20) Listar Instrutores ===
app.get("/listar-instrutores", async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [instrutores] = await connection.execute(
            "SELECT name, email FROM usuarios WHERE tipo = 'Instrutor'"
        );
        await connection.end();
        return res.status(200).json(instrutores);
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao listar instrutores:", error);
        return res.status(500).send({ message: "Erro ao obter a lista de instrutores." });
    }
});

// === 21) Obter Instrutores de um Coordenador ===
app.get("/instrutores-por-coordenador", async (req, res) => {
    const coordenador = req.query.coordenador;
    if (!coordenador) {
        return res.status(400).send("Coordenador não fornecido");
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [instrutores] = await connection.execute(
            "SELECT * FROM usuarios WHERE tipo = 'Instrutor' AND coordenador = ?",
            [coordenador]
        );
        await connection.end();
        if (instrutores.length > 0) {
            return res.status(200).json(instrutores);
        } else {
            return res.status(404).send("Nenhum instrutor encontrado para esse coordenador.");
        }
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao buscar instrutores:", error);
        return res.status(500).send("Erro no servidor.");
    }
});

// === 22) Verificar Acesso (retorna tipo de usuário a partir do email) ===
app.get('/verificar-acesso', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).send({ message: 'O campo email é obrigatório!' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'SELECT tipo FROM usuarios WHERE email = ?', [email]
        );
        await connection.end();
        if (result.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }
        return res.status(200).send({ tipo: result[0].tipo });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao verificar o tipo de usuário:", error);
        return res.status(500).send({ message: 'Erro ao verificar o acesso.' });
    }
});

// === 23) Login (gera JWT) ===
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).send({ message: 'E-mail e senha são obrigatórios!' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [usuarios] = await connection.query(
            'SELECT email, senha, tipo FROM usuarios WHERE email = ?', [email]
        );
        await connection.end();
        if (usuarios.length === 0) {
            return res.status(401).send({ message: 'E-mail ou senha incorretos!' });
        }
        const usuario = usuarios[0];
        // Comparação simples de senha (sem hashing; só para uso temporário)
        if (usuario.senha !== senha) {
            return res.status(401).send({ message: 'E-mail ou senha incorretos!' });
        }
        // Gera token JWT válido por 2h
        const token = jwt.sign({ email: usuario.email, tipo: usuario.tipo },
            secretKey, { expiresIn: '2h' });
        return res.status(200).send({
            message: 'Login bem-sucedido!',
            token,
            tipo: usuario.tipo
        });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao autenticar o usuário:", error);
        return res.status(500).send({ message: 'Erro ao realizar login.' });
    }
});

// === 24) Obter Dados do Usuário Logado (a partir do token) ===
app.get('/usuario-logado', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido!' });
    }
    let connection;
    try {
        const decoded = jwt.verify(token, secretKey);
        connection = await mysql.createConnection(dbConfig);
        const [usuarios] = await connection.query(
            'SELECT email, name, photo, tipo FROM usuarios WHERE email = ?', [decoded.email]
        );
        await connection.end();
        if (usuarios.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }
        const usuario = usuarios[0];
        return res.status(200).send({
            email: usuario.email,
            name: usuario.name,
            photo: usuario.photo,
            tipo: usuario.tipo
        });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao verificar token ou buscar usuário:", error);
        return res.status(403).send({ message: 'Token inválido!' });
    }
});

// === 25) Atualizar Perfil do Usuário (name, phone, city, state, unit, senha, photo) ===
app.post('/atualizar-perfil', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({ error: "Token não fornecido" });
    }
    let connection;
    try {
        const decoded = jwt.verify(token, secretKey);
        const email = decoded.email;
        const { name, phone, city, state, unit, senha, photo } = req.body;
        if (!name && !phone && !city && !state && !unit && !senha && !photo) {
            return res.status(400).send({ error: "Nenhum campo para atualizar fornecido" });
        }
        connection = await mysql.createConnection(dbConfig);
        const [usuarios] = await connection.query(
            'SELECT id FROM usuarios WHERE email = ?', [email]
        );
        if (usuarios.length === 0) {
            await connection.end();
            return res.status(404).send({ error: "Usuário não encontrado" });
        }
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
        valores.push(email); // para o WHERE
        const updateQuery = `UPDATE usuarios SET ${campos.join(', ')} WHERE email = ?`;
        await connection.query(updateQuery, valores);
        await connection.end();
        return res.status(200).send({ message: "Perfil atualizado com sucesso!" });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro ao atualizar perfil:", error);
        return res.status(500).send({ error: "Erro ao atualizar perfil" });
    }
});

// === 26) Obter Perfil do Usuário (simples, rota GET) ===
app.get('/perfil', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido!' });
    }
    let connection;
    try {
        const decoded = jwt.verify(token, secretKey);
        connection = await mysql.createConnection(dbConfig);
        const [usuarios] = await connection.query(
            'SELECT name, email, phone, city, state, unit, photo FROM usuarios WHERE email = ?', [decoded.email]
        );
        await connection.end();
        if (usuarios.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }
        const usuario = usuarios[0];
        return res.status(200).send({
            name: usuario.name || "",
            email: usuario.email,
            phone: usuario.phone || "",
            city: usuario.city || "",
            state: usuario.state || "",
            unit: usuario.unit || "",
            photo: usuario.photo || "/Imagens/perfil.png"
        });
    } catch (error) {
        if (connection) await connection.end();
        console.error('Erro ao verificar token ou consultar usuário:', error);
        return res.status(403).send({ message: 'Token inválido!' });
    }
});

//----------------------------------------------------------------------------
// ENDPOINT PARA UPLOAD DE IMAGENS
//----------------------------------------------------------------------------
app.post('/upload-image', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'Nenhuma imagem foi enviada.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.status(200).send({ imageUrl });
});

//----------------------------------------------------------------------------
// ROTA PARA OPRERAÇÕES FINANCEIRAS, TEMPO OU OUTROS – (se precisar, habilite
//----------------------------------------------------------------------------
// Exemplo para WEATHER ou SPORTS – mas não está sendo usado no momento.

//----------------------------------------------------------------------------
// INICIALIZAÇÃO DO SERVIDOR
//----------------------------------------------------------------------------
app.listen(port, () => {
    // Como era na Vercel
    console.log(`Servidor rodando em http://hub-orcin.vercel.app:${port}/Login/login.html`);
    // Como era localmente
    // console.log(`Servidor rodando em http://localhost:${port}/Login/login.html`);
});

// === ROTA PARA ATUALIZAR COMPETÊNCIAS POR ALUNO ===
app.post('/atualizar-competencias', async (req, res) => {
    const { turma, data, competencias } = req.body;
    if (!turma || !data || !Array.isArray(competencias) || competencias.length === 0) {
        return res.status(400).json({ message: "Dados insuficientes para atualizar competências." });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // 1) Busca ID da turma
        const [turmaRows] = await connection.execute(
            'SELECT id FROM turmas WHERE nome = ?', [turma]
        );
        if (turmaRows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: `Turma "${turma}" não encontrada.` });
        }
        const turmaId = turmaRows[0].id;

        // 2) Carrega alunos dessa turma para mapear nome → id
        const [dbAlunos] = await connection.execute(
            'SELECT id, nome FROM alunos WHERE turma_id = ?', [turmaId]
        );
        const alunoMap = Object.fromEntries(dbAlunos.map(a => [a.nome, a.id]));

        // 3) Prepara UPDATEs
        const updates = competencias.map(item => {
            const alunoId = alunoMap[item.aluno];
            if (typeof alunoId === 'undefined') {
                throw new Error(`Aluno "${item.aluno}" não encontrado na turma "${turma}".`);
            }
            const {
                presenca,
                concentracao,
                comprometimento,
                proatividade,
                criatividade,
                trabalho_em_equipe,
                inteligencia_emocional,
                capacidade_avaliacao_decisao,
                flexibilidade_cognitiva,
                raciocinio_logico,
                objetividade,
                conclusao_atividades,
                organizacao,
                planejamento,
                solucao_atividade,
                motivacao
            } = item;

            return connection.execute(
                `UPDATE competencias
          SET
            presenca = ?,
            concentracao = ?,
            comprometimento = ?,
            proatividade = ?,
            criatividade = ?,
            trabalho_em_equipe = ?,
            inteligencia_emocional = ?,
            capacidade_avaliacao_decisao = ?,
            flexibilidade_cognitiva = ?,
            raciocinio_logico = ?,
            objetividade = ?,
            conclusao_atividades = ?,
            organizacao = ?,
            planejamento = ?,
            solucao_atividade = ?,
            motivacao = ?
          WHERE
            aluno_id = ? AND
            turma_id = ? AND
            DATE(data_avaliacao) = ?`,
                [
                    presenca,
                    concentracao,
                    comprometimento,
                    proatividade,
                    criatividade,
                    trabalho_em_equipe,
                    inteligencia_emocional,
                    capacidade_avaliacao_decisao,
                    flexibilidade_cognitiva,
                    raciocinio_logico,
                    objetividade,
                    conclusao_atividades,
                    organizacao,
                    planejamento,
                    solucao_atividade,
                    motivacao,
                    alunoId,
                    turmaId,
                    data
                ]
            );
        });

        await Promise.all(updates);
        await connection.end();
        return res.status(200).json({ message: "Competências atualizadas com sucesso!" });
    } catch (error) {
        if (connection) await connection.end();
        console.error("Erro em /atualizar-competencias:", error.stack || error);
        return res.status(500).json({ message: error.message || "Erro interno ao atualizar competências." });
    }
});
