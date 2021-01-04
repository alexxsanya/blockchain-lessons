function Blockchain(){
    this.chain = [];  // all the blocks will be stored in here
    this.newTransaction = []; // hold new transaction that a created before they are mined
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash){
    const newBlock = {
        index: this.chain.length + 1, //basically the block number in the chain,
        timestamp: Date.now(), //when the block was created
        transactions: this.newTransaction, //all the transactions that waiting to be placed into a block
        nonce: nonce, //comes from a proof of work....basically a number that we created this new block in a legitimate way
        hash: hash, // is the hash value of the transaction data of the current block
        previousBlockHash: previousBlockHash // equals to the hash value of the previous block
    };

    this.previousBlockHash = []; //empty the prev for next transaction
    this.chain.push(newBlock); //add the new block to the chain

    return newBlock;
}




module.exports = Blockchain;