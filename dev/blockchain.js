const sha256 =require('sha256');

function Blockchain(){
    this.chain = [];  // all the blocks will be stored in here
    this.pendingTransaction = []; // hold new transaction that a created before they are mined/validated
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash){
    const newBlock = {
        index: this.chain.length + 1, //basically the block number in the chain,
        timestamp: Date.now(), //when the block was created
        transactions: this.pendingTransaction, //all the transactions that waiting to be placed into a block
        nonce: nonce, //comes from a proof of work....basically a number that we created this new block in a legitimate way
        hash: hash, // is the hash value of the transaction data of the current block
        previousBlockHash: previousBlockHash // equals to the hash value of the previous block
    };

    this.previousBlockHash = []; //empty the prev for next transaction
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
        recipient: recipient
    }

    this.pendingTransaction.push(newTransaction);
    
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
     * we are going to generate the hash over 10s of thousand time to get one
     * which will use a lot of computing power.
     * Therefore, if an individual wats to modify the previous entered bloc, one will have to try regenerate
     * the hash which will take lots of time & energy -> which is not feasible
     * And since the blocks contain a previous hash, that would mean one will need to do a proof of work for all previous block which is not feasible
     */

     
}

module.exports = Blockchain;