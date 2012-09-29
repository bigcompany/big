# node

for managing nodes

## API

#### [properties](#node-properties)

  - [id](#node-properties-id)

  - [port](#node-properties-port)

  - [host](#node-properties-host)

  - [events](#node-properties-events)

  - [username](#node-properties-username)

  - [password](#node-properties-password)

  - [system](#node-properties-system)

  - [lastSeen](#node-properties-lastSeen)


#### [methods](#node-methods)


<a name="node-properties"></a>

## properties 
for managing nodes

- **id** 

  - **type** : any

- **port** 

  - **type** : number

  - **default** : 7777

  - **description** : the port of the node

- **host** 

  - **type** : string

  - **default** : 0.0.0.0

  - **description** : the host of the node

- **events** 

  - **description** : the total amount of events processed by this node

  - **type** : number

- **username** 

  - **description** : the username used to log into the node

  - **type** : string

  - **default** : root

  - **required** : false

- **password** 

  - **description** : the password used to log into the node

  - **type** : string

  - **required** : false

- **system** 

  - **description** : a dump of the node's system information ( from node.process and require('os') module )

  - **type** : object

- **lastSeen** 

  - **description** : the last date/time the node was seen

  - **type** : string


<a name="node-methods"></a> 

## methods 


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*