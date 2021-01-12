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


// this will now be hint by other transaction to add the transaction to its array/store
app.post('/transaction', function(req, res){
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);

    res.json({
        note: `Transaction will be added in block ${blockIndex}.`
    })
});

/**
 * Any time we create a transaction, we are going to hint this endpoint
 * to send a broadcast to the rest of the nodes in the network to record this transaction.
 * It will do 2 things. create a transaction & 2. broadcast it to the sender
 */
app.post('/transaction/broadcast', function(req, res){
    /** 
     *  create a new transaction
     *  add transaction to pending Transaction array (store) on the current node
    */

    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient)
    bitcoin.addTransactionToPendingTransactions(newTransaction);

    //then send a broadcast to the other nodes in the network.
    const requestPromises =  []

    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        }

        requestPromises.push(rp(requestOptions))
    });

    Promise.all(requestPromises)
    .then(data => {
        res.json({note: 'Transaction created and broadcast successfully.'})
    })

})

/**
 *  create or mine a new block
 * */
app.get('/mine', async function(req, res){
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];

    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    }

    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData );

    const blockHash = await bitcoin.hashBlock(previousBlockHash,currentBlockData,nonce);



    const newBlock = await bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    // broadcast the new block to the network
    const requestPromises = []
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: newBlock,
            json: true
        }

        requestPromises.push(rp(requestOptions));

    });

    Promise.all(requestPromises)
    .then(data => {
        /**
         * Rem: every time that mines a block successfully they do get a reward for mining it.
         * 12.5 is the current reward for mining on bitcoin network
         * 00 - the sender address used for use to know that this is a reward transaction
         * nodeAddress - is the unique address of the node running this mining
        */
        //boadcast a mining reward transaction on this node
        const requestOptions = {
            uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',
            body: {
                amount: 12.5,
                sender: "00",
                recipient: nodeAddress
            },
            json: true
        };

        return rp(requestOptions)

    })
    .then(data => {
        res.json({
            note: `New block mined & broadcast successfully`,
            block: newBlock
        });
    })
    .catch(error => {
        res.status(500).send({error})
    })

})

/**
 * receive a new block
 * However before a new block is added,  the node needs to validate the incoming block
 * 1. check if its previous hash is the same as it has
 * 2. the new block must have it index greater than that of the previous block in the chain
*/
app.post('/receive-new-block', function(req, res) {
    const newBlock = req.body;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash == newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if(correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        //since we added a block to our chain, means we have to clear our pendingTransactions
        bitcoin.pendingTransactions = [];

        res.json({
            note: 'New block received and accepted',
            newBlock: newBlock
        })
    }else{
        res.json({
            note: 'New block rejected',
            newBlock: newBlock
        })
    }
})

//register a node and broadcast it to the entire network
app.post('/register-and-broadcast-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    //register on this node if the node does not already exist
    if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1 && bitcoin.networkNodes!==null){
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
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: {
                    allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
                },
                json:true
            };

            return rp(bulkRegisterOptions)
        })
        .then(data =>{
            res.json({
                note: 'New node registered with network successfully'
            })
        })
        .catch(err=>{
            res.status(500).send({err})
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
app.post('/register-nodes-bulk', function(req, res){
    const  allNetworkNodes = req.body.allNetworkNodes;

    //Loop throu the array and register it with the node
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1
        const notCurrentNode = bitcoin.currentNodeUrl != networkNodeUrl

        if(nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);

    });

    res.json({note: 'Bulk registration successful'})

});
 
/***
 * We make a request to all nodes on the network to get their copy blockchain
 * and compare them with the copy of the blockchain on which the endpoint is running
*/
app.get('/consensus', function(req, res){
    const requestPromises = []
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        }
        //returns an array with the block of the various nodes
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(blockchains => {
        //check if there is a blockchain longer than the blockchain on this node
        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength; //initial length;
        let newLongestChain = null;
        let newPendingTransactions = null;

        blockchains.forEach(blockchain => {
            if(blockchain.chain.length > maxChainLength){
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain
                newPendingTransactions = blockchain.pendingTransactions;
            }
        })

        if(!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))){
            res.json({
                note: 'Current chain has not been replaced',
                chain: bitcoin.chain
            })
        }
        else if(newLongestChain && bitcoin.chainIsValid(newLongestChain)){
            //now we replace the current chain with the new longest chain and pending transaction
            bitcoin.chain = newLongestChain;
            bitcoin.pendingTransactions = newPendingTransactions;

            res.json({
                note: 'Current chain has been replaced',
                chain: bitcoin.chain
            })
        }
    })
})

/**
 * Endpoint returns the block with matching Hash
 */
app.get('/block/:blockHash', function(req, res) {
    const blockHash = req.params.blockHash;

    const correctBlock = bitcoin.getBlock(blockHash);

    res.json({
        block: correctBlock
    })
});

app.get('/transaction/:transactionId', function(req, res){

});

app.get('/address/:address', function(req, res){

});

app.listen(port, function(){
    console.log(`>>> Listening on port ${port} `)
});