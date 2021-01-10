# Blockchain-lessons


# Decetralise network
To demonstrate decentralized network of nodes we are going to:-
1 - rename api file to nodeNetwork.js
2 - run the multiple instances of nodeNetwork (api) by simply running the server on multiple ports at the same time.


# How to test 

1. Run all the 5 instances of the server
```
    npm run node_1
    npm run node_2
    npm run node_3
    npm run node_4
    npm run node_5
```
2. Run POST `/register-and-broadcast-node` from any node to register all the nodes on the networks
```JSON
{
    "newNodeUrl":"http://localhost:3005"
}
```
3. Run GET `/blockchain` to view the blockchain on the instance
4. Run POST `/transaction/broadcast` to create a transaction 
```JSON
    {
        "amount": 1000,
        "sender": "45IDFNDF9348539834",
        "recipient": "09PFDKJSDFUREIUERO"
    }
```
5. Run GET `/mine` to create a new block (mine)

## Note
After registering all the nodes, you can run the `/mine`, `/transaction/broadcast` and records will be synced accross the network