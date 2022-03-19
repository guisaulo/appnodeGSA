const express = require ('express')
const endpoint = '/'
let apiRouter = express.Router()
module.exports = apiRouter;

const knex = require('knex')({
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  });

apiRouter.get(endpoint + 'produtos', (req, res, next) => {
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

apiRouter.get (endpoint + 'produtos/:id', (req, res, next) => {
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

apiRouter.post(endpoint + 'produtos', (req, res, next) => {
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

apiRouter.put(endpoint + 'produtos/:id', (req, res, next) => {    
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

apiRouter.delete (endpoint + 'produtos/:id', (req, res, next) => {
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
