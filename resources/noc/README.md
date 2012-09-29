# noc

Node Operations Center

## API

#### [properties](#noc-properties)

  - [id](#noc-properties-id)


#### [methods](#noc-methods)

  - [noc](#noc-methods-noc) (options)


Node Operations Center

- **id** 

  - **type** : any


<a name="noc-methods"></a> 

## methods 

<a name="noc-methods-noc"></a> 

### noc.noc(options)

the [n]ode [o]perations [c]enter, bootstraps new servers into big nodes

- **options** 

  - **type** : object

  - **properties**

    - **node** 

      - **id**

        - type : *any*

      - **port**

        - type : *number*

        - default : *7777*

        - description : *the port of the node*

      - **host**

        - type : *string*

        - default : *0.0.0.0*

        - description : *the host of the node*

      - **events**

        - description : *the total amount of events processed by this node*

        - type : *number*

      - **username**

        - description : *the username used to log into the node*

        - type : *string*

        - default : *root*

        - required : *false*

      - **password**

        - description : *the password used to log into the node*

        - type : *string*

        - required : *false*

      - **system**

        - description : *a dump of the node's system information ( from node.process and require('os') module )*

        - type : *object*

      - **lastSeen**

        - description : *the last date/time the node was seen*

        - type : *string*

    - **recipe** 

      - **description** : path to the shell script to run remotely

      - **type** : string

  - **callback**

    - type : *function*


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*