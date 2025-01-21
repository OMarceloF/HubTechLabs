const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const port = 3000;
const secretKey = "sua_chave_secreta_super_segura";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Caminho do arquivo de dados e de saída
const dadosPath = path.join(__dirname, 'data', 'dados.json'); // Caminho para dados.json
const presencaPath = path.join(__dirname, 'output', 'presenca_dados.json'); // Caminho para presenca_dados.json
const usuariosPath = path.join(__dirname, 'output', 'usuarios.json');

// Rota para salvar turmas em `dados.json`
app.post('/salvar-turma', (req, res) => {
    const { turma, instrutor, alunos } = req.body;

    if (!turma || !instrutor || alunos.length === 0) {
        return res.status(400).send({ message: "Nome da turma, nome do instrutor ou lista de alunos está vazia." });
    }

    // Ler o arquivo `dados.json` (se existir)
    let turmas = {};
    if (fs.existsSync(dadosPath)) {
        turmas = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));
    }

    // Adicionar a nova turma com o nome do instrutor
    turmas[turma] = {
        instrutor: instrutor,
        alunos: alunos
    };

    // Salvar as mudanças no arquivo `dados.json`
    fs.writeFileSync(dadosPath, JSON.stringify(turmas, null, 2));
    console.log(`Turma "${turma}" com instrutor "${instrutor}" salva com sucesso.`);

    res.status(200).send({ message: "Turma salva com sucesso!" });
});

// Rota para salvar os dados de presença em JSON
app.post('/salvar-json', (req, res) => {
    const { turma, data, dataSalvo, alunos } = req.body;

    const novaPresenca = {
        turma,
        data,
        dataSalvo,
        alunos
    };

    // Lê o arquivo de presença existente (se houver)
    let chamadas = [];
    if (fs.existsSync(presencaPath)) {
        chamadas = JSON.parse(fs.readFileSync(presencaPath, 'utf8'));
    }

    // Adiciona a nova presença
    chamadas.push(novaPresenca);

    // Salva o arquivo com o novo registro
    fs.writeFileSync(presencaPath, JSON.stringify(chamadas, null, 2));
    console.log(`Chamada de ${turma} salva com sucesso para a data ${data}.`);

    res.status(200).send({ message: "Dados de presença salvos com sucesso!" });
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

app.get('/VisualizarAvaliacao/visualizarAvaliacao.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'visualizarAvaliacao.html'));
});

app.get('/VisualizarAvaliacao/visualizarAvaliacao.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'visualizarAvaliacao.css'));
});

app.get('/VisualizarAvaliacao/visualizarAvaliacao.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisualizarAvaliacao', 'VisualizarAvaliacao.js'));
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

// Inicializa o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}/Login/login.html`);
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

app.get('/dados', (req, res) => {
    try {
        const dados = fs.readFileSync(dadosPath, 'utf8');
        const turmas = JSON.parse(dados);
        res.status(200).json(turmas);
    } catch (error) {
        console.error("Erro ao carregar o arquivo dados.json:", error);
        res.status(500).send({ message: "Erro ao carregar os dados de turmas." });
    }
});


app.get('/listar-turmas', (req, res) => {
    try {
        const dados = JSON.parse(fs.readFileSync('dados.json', 'utf8')); // Caminho correto para `dados.json`
        const turmas = Object.keys(dados); // Retorna apenas os nomes das turmas
        res.status(200).json(turmas);
    } catch (error) {
        console.error("Erro ao listar as turmas:", error);
        res.status(500).json({ message: "Erro ao listar as turmas." });
    }
});



app.post('/atualizar-notas', (req, res) => {
    const { turma, data, alunos } = req.body;

    let chamadas = [];
    if (fs.existsSync(presencaPath)) {
        chamadas = JSON.parse(fs.readFileSync(presencaPath, 'utf8'));
    }

    // Atualiza o registro correspondente
    const index = chamadas.findIndex(p => p.turma === turma && p.data === data);
    if (index === -1) {
        res.status(404).send({ message: "Chamada não encontrada." });
        return;
    }

    chamadas[index].alunos = alunos;

    fs.writeFileSync(presencaPath, JSON.stringify(chamadas, null, 2));
    res.status(200).send({ message: "Notas atualizadas com sucesso!" });
});

const avaliacoesPath = path.join(__dirname, 'output', 'avaliacoes.json'); // Caminho atualizado para a pasta /output

// Rota para salvar avaliação
app.post('/salvar-avaliacao', (req, res) => {
    const { turma, nomeAvaliacao, dataAvaliacao, conteudoAvaliacao } = req.body;

    if (!turma || !nomeAvaliacao || !dataAvaliacao || !conteudoAvaliacao) {
        return res.status(400).send({ message: "Preencha todos os campos da avaliação." });
    }

    const novaAvaliacao = {
        turma,
        nomeAvaliacao,
        dataAvaliacao,
        conteudoAvaliacao
    };

    // Ler avaliações existentes
    let avaliacoes = [];
    if (fs.existsSync(avaliacoesPath)) {
        avaliacoes = JSON.parse(fs.readFileSync(avaliacoesPath, 'utf8'));
    }

    // Adicionar nova avaliação
    avaliacoes.push(novaAvaliacao);

    // Salvar no arquivo avaliacoes.json
    fs.writeFileSync(avaliacoesPath, JSON.stringify(avaliacoes, null, 2));
    console.log(`Avaliação para "${turma}" salva com sucesso.`);

    res.status(200).send({ message: "Avaliação salva com sucesso!" });
});

const notasAvaliacoesPath = path.join(__dirname, 'output', 'notasAvaliacoes.json');

// Função para carregar usuários
function carregarUsuarios() {
    if (fs.existsSync(usuariosPath)) {
        return JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
    }
    return [];
}

// Rota de cadastro de usuários
app.post('/cadastro', (req, res) => {
    const { email, senha, tipo, name, phone, city, state, unit, photo } = req.body;

    if (!email || !senha || !tipo) {
        return res.status(400).send({ message: 'Preencha todos os campos!' });
    }

    const usuarios = carregarUsuarios();
    const usuarioExistente = usuarios.find(u => u.email === email);

    if (usuarioExistente) {
        return res.status(400).send({ message: 'Usuário já cadastrado!' });
    }

    const novoUsuario = { id: email, email, senha, tipo, name, phone, city, state, unit, photo };
    usuarios.push(novoUsuario);
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
    res.status(201).send({ message: 'Usuário cadastrado com sucesso!' });
});


// Rota para verificar o tipo de usuário
app.get('/verificar-acesso', (req, res) => {
    const { email } = req.query;
    const usuarios = carregarUsuarios();
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario) {
        return res.status(404).send({ message: 'Usuário não encontrado!' });
    }

    res.status(200).send({ tipo: usuario.tipo });
});


// Rota para salvar notas
app.post('/salvar-notas-avaliacoes', (req, res) => {
    const { turma, avaliacao, notas } = req.body;

    if (!turma || !avaliacao || notas.length === 0) {
        return res.status(400).send({ message: "Preencha todos os campos corretamente." });
    }

    let dadosNotas = [];
    if (fs.existsSync(notasAvaliacoesPath)) {
        dadosNotas = JSON.parse(fs.readFileSync(notasAvaliacoesPath, 'utf8'));
    }

    dadosNotas.push({ turma, avaliacao, notas });
    fs.writeFileSync(notasAvaliacoesPath, JSON.stringify(dadosNotas, null, 2));

    console.log(`Notas da avaliação "${avaliacao}" da turma "${turma}" salvas com sucesso.`);
    res.status(200).send({ message: "Notas salvas com sucesso!" });
});


// Rota para obter as avaliações
app.get('/avaliacoes', (req, res) => {
    try {
        if (fs.existsSync(avaliacoesPath)) {
            const avaliacoes = JSON.parse(fs.readFileSync(avaliacoesPath, 'utf8'));
            res.status(200).json(avaliacoes);
        } else {
            res.status(404).send({ message: "Nenhuma avaliação encontrada." });
        }
    } catch (error) {
        console.error("Erro ao carregar as avaliações:", error);
        res.status(500).send({ message: "Erro ao carregar as avaliações." });
    }
});

app.put('/editar-turma', (req, res) => {
    const { turma, alunos } = req.body;

    let turmas = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));

    if (!turmas[turma]) {
        return res.status(404).send({ message: "Turma não encontrada." });
    }

    turmas[turma].alunos = alunos;  // Atualiza os alunos
    fs.writeFileSync(dadosPath, JSON.stringify(turmas, null, 2));
    res.status(200).send({ message: "Turma editada com sucesso!" });
});

app.delete('/excluir-turma', (req, res) => {
    const { turma } = req.body;

    let turmas = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));

    if (!turmas[turma]) {
        return res.status(404).send({ message: "Turma não encontrada." });
    }

    delete turmas[turma];
    fs.writeFileSync(dadosPath, JSON.stringify(turmas, null, 2));
    res.status(200).send({ message: "Turma excluída com sucesso!" });
});


// Rota para obter as notas das avaliações
app.get('/notasavaliacoes', (req, res) => {
    try {
        const notas = fs.readFileSync(path.join(__dirname, 'output', 'notasavaliacoes.json'), 'utf8');
        res.status(200).json(JSON.parse(notas));
    } catch (error) {
        console.error("Erro ao carregar as notas:", error);
        res.status(500).send({ message: "Erro ao carregar as notas." });
    }
});

// Rota para obter as presenças
app.get('/dados-presenca', (req, res) => {
    try {
        const chamadas = JSON.parse(fs.readFileSync(presencaPath, 'utf8'));

        // Ordenar as chamadas pela data
        const chamadasOrdenadas = chamadas.sort((a, b) => new Date(a.data) - new Date(b.data));

        res.status(200).json(chamadasOrdenadas);
    } catch (error) {
        console.error("Erro ao carregar as presenças:", error);
        res.status(500).send({ message: "Erro ao carregar as presenças" });
    }
});

app.get('/dados-presenca', (req, res) => {
    try {
        const presencas = JSON.parse(fs.readFileSync(presencaPath, 'utf8'));
        console.log("Chamadas retornadas:", presencas); // Adiciona log para depuração
        res.status(200).json(presencas);
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



// Middleware para verificar permissão usando arquivo `usuarios.json`
function verificarPermissao(permissoes) {
    return (req, res, next) => {
        const usuarios = carregarUsuarios();
        const usuario = usuarios.find(u => u.email === req.user.email);
        if (!usuario) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }
        if (permissoes.includes(usuario.tipo) || usuario.tipo === 'Diretor/Coordenador') {
            next();
        } else {
            res.status(403).send({ message: 'Acesso negado!' });
        }
    };
}

// Função para carregar usuários
function carregarUsuarios() {
    const usuariosPath = path.join(__dirname, 'output', 'usuarios.json');
    if (fs.existsSync(usuariosPath)) {
        return JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
    }
    return [];
}

// Rota protegida para criação de turma (apenas DEV e Coordenador)
app.post('/salvar-turma', verificarToken, verificarPermissao(['DEV']), (req, res) => {
    const { turma, instrutor, alunos } = req.body;
    if (!turma || !instrutor || alunos.length === 0) {
        return res.status(400).send({ message: "Nome da turma, nome do instrutor ou lista de alunos está vazia." });
    }
    const turmas = fs.existsSync(dadosPath) ? JSON.parse(fs.readFileSync(dadosPath, 'utf8')) : {};
    turmas[turma] = { instrutor, alunos };
    fs.writeFileSync(dadosPath, JSON.stringify(turmas, null, 2));
    res.status(200).send({ message: "Turma salva com sucesso!" });
});

// Rota para acessar diário (Instrutor e Coordenador têm acesso)
app.get('/Diario/indexDiario.html', verificarToken, verificarPermissao(['Instrutor/Professor', 'DEV']), (req, res) => {
    res.sendFile(path.join(__dirname, 'Diario', 'indexDiario.html'));
});


// app.get('/usuario-logado', verificarToken, (req, res) => {
//     const usuarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'usuarios.json'), 'utf8'));
//     const usuario = usuarios.find(u => u.email === req.user.email);
//     if (!usuario) {
//         return res.status(404).send({ message: 'Usuário não encontrado!' });
//     }
//     res.status(200).send({ email: usuario.email, tipo: usuario.tipo });
// });

// Rota para obter os dados do usuário logado
app.get('/usuario-logado', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido!' });
    }

    try {
        const decoded = jwt.verify(token, secretKey); // Decodifica o token
        const usuarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'usuarios.json'), 'utf8'));
        const usuario = usuarios.find(u => u.email === decoded.email);

        if (!usuario) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }

        // Retorna apenas o campo "photo" (ou outros se necessário)
        res.status(200).send({ photo: usuario.photo });
    } catch (error) {
        console.error("Erro ao verificar token:", error);
        res.status(403).send({ message: 'Token inválido!' });
    }
});




app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    // Carregar os usuários
    const usuarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'usuarios.json'), 'utf8'));
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    if (!usuario) {
        return res.status(401).send({ message: 'E-mail ou senha incorretos!' });
    }
    console.log(`Usuário autenticado: ${usuario.email}, Tipo: ${usuario.tipo}`);
    const token = jwt.sign({ email: usuario.email, tipo: usuario.tipo }, secretKey, { expiresIn: '2h' });
    res.status(200).send({ message: 'Login bem-sucedido!', token, tipo: usuario.tipo });
});

// Função para salvar as alterações no `usuarios.json`
function atualizarUsuario(email, novosDados) {
    const usuariosPath = path.join(__dirname, 'output', 'usuarios.json');
    const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
    const usuarioIndex = usuarios.findIndex(u => u.email === email);
    if (usuarioIndex === -1) {
        return false; // Usuário não encontrado
    }
    usuarios[usuarioIndex] = {...usuarios[usuarioIndex], ...novosDados };
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
    return true;
}

app.get('/perfil', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido!' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
        const usuario = usuarios.find(u => u.email === decoded.email);

        if (!usuario) {
            return res.status(404).send({ message: 'Usuário não encontrado!' });
        }

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
        console.error('Erro ao verificar token:', error);
        res.status(403).send({ message: 'Token inválido!' });
    }
});


// Função para atualizar um usuário no arquivo JSON
function atualizarUsuario(email, novosDados) {
    if (fs.existsSync(usuariosPath)) {
        const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
        const usuarioIndex = usuarios.findIndex(u => u.email === email);
        if (usuarioIndex === -1) {
            return false; // Usuário não encontrado
        }
        // Atualiza os dados do usuário
        usuarios[usuarioIndex] = {...usuarios[usuarioIndex], ...novosDados };
        fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
        return true;
    }
    return false;
}

// Rota para atualizar o perfil do usuário
app.post('/atualizar-perfil', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ error: "Token não fornecido" });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        const email = decoded.email;

        const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
        const usuarioIndex = usuarios.findIndex(user => user.email === email);

        if (usuarioIndex === -1) {
            return res.status(404).send({ error: "Usuário não encontrado" });
        }

        const { name, phone, city, state, unit, senha, photo } = req.body;

        if (name) usuarios[usuarioIndex].name = name;
        if (phone) usuarios[usuarioIndex].phone = phone;
        if (city) usuarios[usuarioIndex].city = city;
        if (state) usuarios[usuarioIndex].state = state;
        if (unit) usuarios[usuarioIndex].unit = unit;
        if (photo) usuarios[usuarioIndex].photo = photo; // Atualizar o URL da foto
        if (senha) usuarios[usuarioIndex].senha = senha;

        fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
        res.status(200).send({ message: "Perfil atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).send({ error: "Erro ao atualizar perfil" });
    }
});


// Configuração do armazenamento de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
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

app.get('/usuarios', (req, res) => {
    try {
        const usuarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'usuarios.json'), 'utf8'));
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        res.status(500).send({ message: "Erro ao carregar usuários." });
    }
});