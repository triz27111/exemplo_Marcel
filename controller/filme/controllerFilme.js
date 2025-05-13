/**********************************************************************************
 * Objetivo: Controller responsável pela regra de negócio referente ao CRUD de Filme
 * Data: 11/02/2025
 * Autor: Marcel
 * Versão: 1.0
 **********************************************************************************/

//Import do arquivo de mensagens e status code do projeto
const message = require('../../modulo/config.js')

//Import do aquivo para realizar o CRUD de dados no Banco de Dados
const filmeDAO = require('../../model/DAO/filme.js')

//Import das controller necessárias para fazer os relacionamentos
const controllerClassificacao   = require('../classificacao/controllerClassificacao.js')
const controllerFilmeGenero     = require('./controllerFilmeGenero.js')

//Função para tratar a inserção de um novo filme no DAO
const inserirFilme = async function(filme, contentType){
    try {
        if(String(contentType).toLowerCase() == 'application/json')
        {
                if (filme.nome              == ''           || filme.nome               == undefined    || filme.nome            == null || filme.nome.length > 80   ||
                    filme.duracao           == ''           || filme.duracao            == undefined    || filme.duracao         == null || filme.duracao.length > 5 ||
                    filme.sinopse           == ''           || filme.sinopse            == undefined    || filme.sinopse         == null ||
                    filme.data_lancamento   == ''           || filme.data_lancamento    == undefined    || filme.data_lancamento == null || filme.data_lancamento.length > 10 ||
                    filme.foto_capa         == undefined    || filme.foto_capa.length       > 200   ||
                    filme.link_trailer      == undefined    || filme.link_trailer.length    > 200   ||
                    filme.id_classificacao  == ''           || filme.id_classificacao  == undefined
                )
                {
                    return message.ERROR_REQUIRED_FIELDS //400
                }else{
                    //Chama a função para inserir no BD e aguarda o retorno da função
                    let resultFilme = await filmeDAO.insertFilme(filme)

                    if(resultFilme)
                        return message.SUCCESS_CREATED_ITEM //201
                    else
                        return message.ERROR_INTERNAL_SERVER_MODEL //500
                }
        }else{
            return message.ERROR_CONTENT_TYPE //415
        }
    } catch (error) {
        return message.ERROR_INTERNAL_SERVER_CONTROLLER //500
    }
}

//Função para tratar a atualização de um filme no DAO
const atualizarFilme = async function(id, filme, contentType){
    try {
        if(String(contentType).toLowerCase() == 'application/json')
            {
                if (id                      == ''           || id                       == undefined    || id                    == null || isNaN(id)  || id  <= 0   ||
                    filme.nome              == ''           || filme.nome               == undefined    || filme.nome            == null || filme.nome.length > 80   ||
                    filme.duracao           == ''           || filme.duracao            == undefined    || filme.duracao         == null || filme.duracao.length > 5 ||
                    filme.sinopse           == ''           || filme.sinopse            == undefined    || filme.sinopse         == null ||
                    filme.data_lancamento   == ''           || filme.data_lancamento    == undefined    || filme.data_lancamento == null || filme.data_lancamento.length > 10 ||
                    filme.foto_capa         == undefined    || filme.foto_capa.length       > 200 ||
                    filme.link_trailer      == undefined    || filme.link_trailer.length    > 200 ||
                    filme.id_classificacao  == ''           || filme.id_classificacao  == undefined
                )
                {
                    return message.ERROR_REQUIRED_FIELDS //400
                }else{
                    //Validação para verificar se o ID existe no BD
                    let resultFilme = await filmeDAO.selectByIdFilme(parseInt(id))

                    if(resultFilme != false || typeof(resultFilme) == 'object'){
                        if(resultFilme.length > 0 ){
                            //Update
                            //Adiciona o ID do filme no JSON com os dados
                            filme.id = parseInt(id)

                            let result = await filmeDAO.updateFilme(filme)

                            if(result){
                                return message.SUCCESS_UPDATED_ITEM //200
                            }else{
                                return message.ERROR_INTERNAL_SERVER_MODEL //500
                            }
                        }else{
                            return message.ERROR_NOT_FOUND //404
                        }
                    }else{
                        return message.ERROR_INTERNAL_SERVER_MODEL //500
                    }
                }
            }else{
                return message.ERROR_CONTENT_TYPE //415
            }
    } catch (error) {
        return message.ERROR_INTERNAL_SERVER_CONTROLLER //500
    }
}

//Função para tratar a exclusão de um filme no DAO
const excluirFilme = async function(id){
    try {
        if(id == '' || id == undefined || id == null || isNaN(id) || id <=0){
            return message.ERROR_REQUIRED_FIELDS //400
        }else{

            //Funcção que verifica se  ID existe no BD
            let resultFilme = await filmeDAO.selectByIdFilme(parseInt(id))

            if(resultFilme != false || typeof(resultFilme) == 'object'){
                //Se existir, faremos o delete
                if(resultFilme.length > 0){
                    //delete
                    let result = await filmeDAO.deleteFilme(parseInt(id))

                    if(result){
                        return message.SUCCESS_DELETED_ITEM //200
                    }else{
                        return message.ERROR_INTERNAL_SERVER_MODEL //500
                    }
                }else{
                    return message.ERROR_NOT_FOUND //404
                }
            }else{
                return message.ERROR_INTERNAL_SERVER_MODEL //500
            }
        }
    } catch (error) {
        return message.ERROR_INTERNAL_SERVER_CONTROLLER //500
    }
}

//Função para tratar o retorno de uma lista de filmes do DAO
const listarFilme = async function(){
    try {
        //Cria um objeto array para montar a nova estrutura de filmes no forEach
        let arrayFilmes = []

        //Objeto do tipo JSON
        let dadosFilme = {}
        //Chama a função para retornar os filmes cadastrados
        let resultFilme = await filmeDAO.selectAllFilme()

        if(resultFilme != false || typeof(resultFilme) == 'object'){
            if(resultFilme.length > 0){

               
                //Criando um JSON de retorno de dados para a API
                dadosFilme.status = true
                dadosFilme.status_code = 200
                dadosFilme.items = resultFilme.length
                
                //Percorrer o array de filmes para pegar cada ID de classificação
                // e descobrir quais os dados da classificação
                
                // resultFilme.forEach( async function(itemFilme){
                //Precisamos utilizar o for of, pois o foreach não consegue trabalhar com 
                // requisições async com await
                for(const itemFilme of resultFilme){
                    /* Monta o objeto da classificação para retornar no Filme (1XN) */
                        //Busca os dados da classificação na controller de classificacao
                        let dadosClassificacao = await controllerClassificacao.buscarClassificacao(itemFilme.id_classificacao)
                        //Adiciona um atributo classificação no JSON de filmes e coloca os dados da classificação
                        itemFilme.classificacao = dadosClassificacao.classificacao
                        //Remover um atributo do JSON
                        delete itemFilme.id_classificacao
                    /* */

                    /* Monta o objeto de Generos para retornar no Filme (Relação NxN) */
                        //encaminha o id do filme para a controller retornar os generos associados a esse filme
                        let dadosGenero = await controllerFilmeGenero.buscarGeneroPorFilme(itemFilme.id)
                        console.log(dadosGenero)
                        //Adiciona um atributo genero no JSON de filmes e coloca os dados do genero
                        itemFilme.genero = dadosGenero.genero

                    /* */
                    //Adiciona em um novo array o JSON de filmes com a sua nova estrutura de dados
                    arrayFilmes.push(itemFilme)
 
                }
                
                dadosFilme.films = arrayFilmes

                return dadosFilme
            }else{
                return message.ERROR_NOT_FOUND //404
            }
        }else{
            return message.ERROR_INTERNAL_SERVER_MODEL //500
        }
    } catch (error) {

        return message.ERROR_INTERNAL_SERVER_CONTROLLER //500
    }
}

//Função para tratar o retorno de um filme filtrando pelo ID do DAO
const buscarFilme = async function(id){
    try {

        let arrayFilmes = []
        
        if(id == '' || id == undefined || id == null || isNaN(id) || id <=0){
            return message.ERROR_REQUIRED_FIELDS //400
        }else{
            dadosFilme = {}

            let resultFilme = await filmeDAO.selectByIdFilme(parseInt(id))
            
            if(resultFilme != false || typeof(resultFilme) == 'object'){
                if(resultFilme.length > 0){
                     //Criando um JSON de retorno de dados para a API
                    dadosFilme.status = true
                    dadosFilme.status_code = 200
                    
                     //Precisamos utilizar o for of, pois o foreach não consegue trabalhar com 
                // requisições async com await
                for(const itemFilme of resultFilme){
                    //Busca os dados da classificação na controller de classificacao
                    let dadosClassificacao = await controllerClassificacao.buscarClassificacao(itemFilme.id_classificacao)
                    
                    //Adiciona um atributo classificação no JSON de filmes e coloca os dados da classificação
                    itemFilme.classificacao = dadosClassificacao.classificacao
                    
                    //Remover um atributo do JSON
                    delete itemFilme.id_classificacao
                    
                    //Adiciona em um novo array o JSON de filmes com a sua nova estrutura de dados
                    arrayFilmes.push(itemFilme)
 
                }
                
                dadosFilme.films = arrayFilmes

                    // dadosFilme.films = resultFilme

                    return dadosFilme //200
                }else{
                    return message.ERROR_NOT_FOUND //404
                }
            }else{
                return message.ERROR_INTERNAL_SERVER_MODEL //500
            }
        }

    } catch (error) {
        return message.ERROR_INTERNAL_SERVER_CONTROLLER //500
    }
}

module.exports = {
    inserirFilme,
    atualizarFilme,
    excluirFilme,
    listarFilme,
    buscarFilme
} 