const sha256 =require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid');

function Blockchain(){
    this.chain = [];  // all the blocks will be stored in here
    this.pendingTransactions = []; // hold new transaction that a created before they are mined/validated
    
    this.currentNodeUrl = currentNodeUrl
    this.networkNodes = []
    
    /**
     * Creating the Genesis Block
     * - remember that the genesis block doesnt have the previousBlockHash
     * - we basically create a block with arbitrary values like createNewBlock(100, '0', '0')
     */

     this.createNewBlock(200, '0', '0');

}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash){
    const newBlock = {
        index: this.chain.length + 1, //basically the block number in the chain,
        timestamp: Date.now(), //when the block was created
        transactions: this.pendingTransactions, //all the transactions that waiting to be placed into a block
        nonce: nonce, //comes from a proof of work....basically a number that we created this new block in a legitimate way
        hash: hash, // is the hash value of the transaction data of the current block
        previousBlockHash: previousBlockHash // equals to the hash value of the previous block
    };

    console.log(newBlock)
    this.pendingTransactions = []; //empty the prev for next transaction
    this.chain.push(newBlock); //add the new block to the chain

    return newBlock;
}

Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient){
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid.v1().split('-').join('')
    }

    return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    this.pendingTransactions.push(transactionObj);

    //this returns the block number that this transaction will be added to
    return this.getLastBlock()['index'] + 1
}

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);

    return hash;

}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){
    /**
     * 1 => repeatedly has a block until we find a correct has => starting with 4 zero => '0000123MDFORNMFDJFD'
     * this is achieved by repeated chaning the nonce in hashBlock(previousBlockHash, currentBlockData, nonce)
     * Then return the nonce value that creates the correct hash
     * 
     * How this secures the block chain
     * - Remeber to generate the desired hash starting with the 4 zero 
     * we are going to generate the hash upto 10s of thousand time to get one has with 1st 4 zero
     * which will use a lot of computing power.
     * Therefore, if an individual wats to modify the previous entered bloc, one will have to try regenerate
     * the hash which will take lots of time & energy -> which is not feasible
     * And since the blocks contain a previous hash, that would mean one will need to do a proof of work for all previous block which is not feasible
     * A PROOF OF WORK IS SUPPOSED TO BE VERY DIFFICULT TO CALCULATE.
     */

    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    while(hash.substring(0,4) !== '0000'){
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    //this the nonce which generates the hash with 4 zero, so it acts as our proof
    return nonce; 
}

/***
 * validate whether 
 * How ?
 * - Iterate through all the blocks and ensure all the hashs line up correctly
 * - comparing previous hash with current hash
*/
Blockchain.prototype.chainIsValid = function(blockchain) {
    let validChain = true;

    for(var i=1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];
        const currentBlockHash = this.hashBlock(prevBlock['hash'], 
        {
            transactions: currentBlock['transactions'],
            index: currentBlock['index']
        }, currentBlock['nonce']);
        if(currentBlockHash.substring(0, 4) !== '0000') validChain = false;

        if(currentBlock['previousBlockHash'] !== prevBlock['hash']){
            //then the chain is not valid
            validChain = false;
        }
    }

    //check our genesis block is valid based on the values we used to create it
    const genesisBlock = blockchain[0]
    const correctNonce = genesisBlock['nonce'] === 200;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0

    if(!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;


    return validChain;
}

Blockchain.prototype.getBlock = function(blockHash) {
    let correctBlock = null;

    this.chain.forEach(block => {
        if(block.hash === blockHash) correctBlock = block;
    });

    return correctBlock;
}

Blockchain.prototype.getTransaction = function(transactionId) {
    let correctTransaction = null;
    let correctBlock = null;
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.id === transactionId){
                correctTransaction = transaction;
                correctBlock = block;
            }
        })
    });

    return {
        transaction: correctTransaction,
        block: correctBlock
    };
}

module.exports = Blockchain;