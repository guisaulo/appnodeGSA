const express = require ('express')
const endpoint = '/'
let apiRouter = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
module.exports = apiRouter;

const knex = require('knex')({
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  });

let checkToken = (req, res, next) => {
    let authToken = req.headers["authorization"]
    if (!authToken) {
        res.status(401).json({ message: 'Token de acesso requerida' })
    }
    else {
        let token = authToken.split(' ')[1]
        req.token = token
    }
    jwt.verify(req.token, process.env.SECRET_KEY, (err, decodeToken) => {
        if (err) {
            res.status(401).json({ message: 'Acesso negado' })
            return
        }
        req.usuarioId = decodeToken.id
        next()
    })
}

let isAdmin = (req, res, next) => {
    knex
        .select('*').from('usuario').where({ id: req.usuarioId })
        .then((usuarios) => {
            if (usuarios.length) {
                let usuario = usuarios[0]
                let roles = usuario.roles.split(';')
                let adminRole = roles.find(i => i === 'ADMIN')
                if (adminRole === 'ADMIN') {
                    next()
                    return
                }
                else {
                    res.status(403).json({ message: 'Role de ADMIN requerida' })
                    return
                }
            }
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao verificar roles de usuário - ' + err.message
            })
        })
}

apiRouter.post (endpoint + 'seguranca/register', (req, res) => {
    knex('usuario')
        .insert({
            nome: req.body.nome,
            login: req.body.login,
            senha: bcrypt.hashSync(req.body.senha, 8),
            email: req.body.email
    }, ['id'])
        .then((result) => {
            let { id } = result[0]
            return res.status(200).json({ message: 'Usuário criado com sucesso!', id })
    })
    .catch(err => {
        res.status(500).json({
            message: 'Erro ao registrar usuario - ' + err.message })
    })
})

apiRouter.post(endpoint + 'seguranca/login', (req, res) => {
    knex.select('*').from('usuario').where({ login: req.body.login })
        .then(usuarios => {
            if (usuarios.length) {
                let usuario = usuarios[0]
                let checkSenha = bcrypt.compareSync(req.body.senha, usuario.senha)
                if (checkSenha) {
                    var tokenJWT = jwt.sign({ id: usuario.id },
                        process.env.SECRET_KEY, {
                        expiresIn: 3600
                    })
                    res.status(200).json({
                        success: true,
                        user: {
                            id: usuario.id,
                            login: usuario.login,
                            nome: usuario.nome,
                            roles: usuario.roles,
                            token: tokenJWT
                        }
                    })
                    return
                }
            }
            res.status(200).json({ success: false, message: 'Login ou senha incorretos' })
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao verificar login - ' + err.message
            })
        })
})

apiRouter.get(endpoint + 'produtos', checkToken, (req, res) => {
    knex.select('*').from('produto')
        .then( produtos => {
            if (produtos.length) {
                res.status(200).json(produtos)
            } else {   
                res.status(204).json({ message: 'Produtos não encontrados' })
            }
        })
        .catch(err => {
            res.status(500).json({
            message: 'Erro ao recuperar produtos - ' + err.message })
        })
})

apiRouter.get (endpoint + 'produtos/:id', checkToken, (req, res) => {
    knex.select('*').from('produto').where({ id: req.params.id })
        .then( produtos => {
            if (produtos.length) {
                res.status(200).json(produtos[0])
            } else {   
                res.status(404).json({ message: 'Produto não encontrado' })
            }
        })
        .catch(err => {
            res.status(500).json({
            message: 'Erro ao recuperar produtos - ' + err.message })
        })  
})

apiRouter.post(endpoint + 'produtos', checkToken, isAdmin, (req, res) => {
    let produto = {
        descricao: req.body.descricao,
        valor: req.body.valor,
        marca: req.body.marca
    };

    if (!produto.descricao || !produto.valor || !produto.marca) {
        return res.status(400).json({ error: 'Os parâmetros obrigatórios estão incorretos!' })
    }
    knex('produto').insert(produto, ['id'])
        .then(result => {
            let { id } = result[0]
            return res.status(200).json({ message: 'Produto criado com sucesso!', id })        
        })
        .catch(err => {
            res.status(500).json({
            message: 'Erro ao inserir produto - ' + err.message })
        })
})

apiRouter.put(endpoint + 'produtos/:id', checkToken, isAdmin, (req, res) => {    
    let produto = {
        descricao: req.body.descricao,
        valor: req.body.valor,
        marca: req.body.marca
    };
    knex('produto').where({ id: req.params.id }).update(produto)
        .then(() => {
            return res.status(200).json({ message: 'Produto alterado com sucesso!', produto })  
        })
        .catch(err => {
            res.status(500).json({
            message: 'Erro ao alterar produto - ' + err.message })
        })
})

apiRouter.delete (endpoint + 'produtos/:id', checkToken, isAdmin, (req, res) => {
    knex('produto').where({ id: req.params.id }).del()
    .then( produto => {
        if (produto) {
            res.status(200).json({ message: 'Produto excluído com sucesso' })
        } else {
            res.status(404).json({ message: 'Produto não encontrado para exclusão' })
        }  
    })
    .catch(err => {
        res.status(500).json({
        message: 'Erro ao recuperar produtos - ' + err.message })
    })  
})
