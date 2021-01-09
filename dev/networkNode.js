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
const bitcoin = new Blockchain();
const rp = require('request-promise');

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
    //register on this node if the node does not already exist
    if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1){
        bitcoin.networkNodes.push(newNodeUrl);
    }

    const regNodePromises = []  //contains all requests

    //broadcast new node to other nodes in the network
    bitcoin.networkNodes.forEach(networkNodeUrl =>{
        //hint the /register-node endpoint
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: {
                newNodeUrl: newNodeUrl
            },
            json: true
        }

        regNodePromises.push(rp(requestOptions))

    });
    
    // Broadcast request is made here
    Promise.all(regNodePromises)
        .then(data => {
            //returns data when all our requests return an response
            // We sent a request to the new node to register all the existing nodes

            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulks',
                methods:'POST',
                body: {
                    allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
                    json:true
                }
            };

            return rp(bulkRegisterOptions)
        })
        .then(data =>{
            res.json({
                note: 'New node registered with network successfully'
            })
        })
})


//register a new node by the node on the existing on the network
app.post('/register-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;

    if(nodeNotAlreadyPresent && notCurrentNode)  bitcoin.networkNodes.push(newNodeUrl);

    res.json({note: 'New node registered successfully.'})

})

// register multiple nodes at once. its only hint on a new node
app.post('/register-nodes-bullk', function(req, res){
    const  allNetworkNodes = req.body.allNetworkNodes;

    //Loop throu the array and register it with the node
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1
        const notCurrentNode = bitcoin.currentNodeUrl != networkNodeUrl

        if(nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);

    });

    res.json({note: 'Bulk registration successful'})

});
 
app.listen(port, function(){
    console.log(`>>> Listening on port ${port} `)
});