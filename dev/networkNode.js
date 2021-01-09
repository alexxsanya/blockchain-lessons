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
const uuid = require('uuid');
const port = process.argv[2];
const nodeAddress = uuid.v1().split('-').join(''); //mock ID of the node mining the bitcoin
const bitcoin = new Blockchain()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// fetch entire blockchain
app.get('/blockchain', function(req, res){
    res.send(bitcoin);
});


//create a new transaction on the blockchain
app.post('/transaction', function(req, res){
    const blockIndex = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient)
    res.json({
        note: `Transaction will be added in block ${blockIndex}.`
    })
});

// create or mine a new block
app.get('/mine', function(req, res){
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];

    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    }

    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData );

    const blockHash = bitcoin.hashBlock(previousBlockHash,currentBlockData,nonce);


    /**
     * Rem: every time that mines a block successfully they do get a reward for mining it.
     * 12.5 is the current reward for mining on bitcoin network
     * 00 - the sender address used for use to know that this is a reward transaction
     * nodeAddress - is the unique address of the node running this mining
    */

    bitcoin.createNewTransaction(12.5, "00", nodeAddress );

    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    res.json({
        note: `New block mined successfully`,
        block: newBlock
    });

})
//register a node and broadcast it to the entire network
app.post('/register-and-broadcast-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
})


//register a node with the network by the existing on the network
app.post('/register-node', function(req, res){

})

// register multiple nodes at once
app.post('/register-nodes-bullk', function(req, res){

});
 
app.listen(port, function(){
    console.log(`>>> Listening on port ${port} `)
});