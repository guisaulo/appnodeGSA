const express = require ('express')
let apiRouter = express.Router()
module.exports = apiRouter;

const knex = require('knex')({
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  });

const endpoint = '/'

apiRouter.get(endpoint + 'produtos', (req, res, next) => {
    knex.select('*').from('produto')
    .then( produtos => res.status(200).json(produtos) )
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
        }
        else{   
            res.status(404).json({ message: 'Produto não encontrado' })
        }
    })
    .catch(err => {
        res.status(500).json({
        message: 'Erro ao recuperar produtos - ' + err.message })
    })  
})

apiRouter.delete (endpoint + 'produtos/:id', (req, res, next) => {
    knex('produto').where({ id: req.params.id }).del()
    .then( produto => {
        if (produto) {
            res.status(200).json({ message: 'Produto excluído com sucesso' })
        }
        else{
            res.status(404).json({ message: 'Produto não encontrado para exclusão' })
        }  
    })
    .catch(err => {
        res.status(500).json({
        message: 'Erro ao recuperar produtos - ' + err.message })
    })  
})
