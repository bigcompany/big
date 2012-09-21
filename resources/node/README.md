# node


# usage

    var big = require("big");
    big.use("node");

## node

#### [properties](#node-properties)

  - [host](#node-properties-host)

  - [port](#node-properties-port)

  - [events](#node-properties-events)

  - [system](#node-properties-system)

  - [lastSeen](#node-properties-lastSeen)


#### [methods](#node-methods)


<a name="node-properties"></a>

## properties 


- **host** 

  - **type** : string

- **port** 

  - **type** : number

- **events** 

  - **description** : the total amount of events processed by this node

  - **type** : number

- **system** 

  - **description** : a dump of the node's system information ( from node.process and require('os') module )

  - **type** : object

- **lastSeen** 

  - **description** : the last date/time the node was seen

  - **type** : string


<a name="node-methods"></a> 

## methods 


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*