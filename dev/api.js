/**
 *  :::::: API SERVER ::::::
 *  Which interacts blockchain data structure, 
 *  To fetch an entire blockchain, create new transactions, to mine blocks
 * 
*/

const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const Blockchain = require('./blockchain')

const bitcoin = new Blockchain()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// fetch entire blockchain
app.get('/blockchain', function(req, res){
    res.send(bitcoin);
});


//create a new transaction on the blockchain
app.post('/transaction', function(req, res){
    res.send(req.body)
});

// create or mine a new block
app.get('/mine', function(req, res){

})

app.listen(4600, function(){
    console.log('>>> Listening on port 4600 ')
});