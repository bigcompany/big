# replicator


# usage

    var big = require("big");
    big.use("replicator");

## replicator

#### [properties](#replicator-properties)

  - [id](#replicator-properties-id)


#### [methods](#replicator-methods)

  - [push](#replicator-methods-push) (options, callback)

  - [pull](#replicator-methods-pull) (options, callback)

  - [listen](#replicator-methods-listen) ()


replicator service for big instances

- **id** 

  - **type** : any


<a name="replicator-methods"></a> 

## methods 

<a name="replicator-methods-push"></a> 

### replicator.push(options, callback)

pushes current big instance to a remote big instance

- **options** 

  - **type** : object

  - **properties**

    - **path** 

      - **description** : the path of the big instance to push

      - **type** : string

      - **default** : .

    - **location** 

      - **description** : the location to push the big instance

      - **type** : string

      - **default** : localhost

- **callback** 

  - **type** : function

<a name="replicator-methods-pull"></a> 

### replicator.pull(options, callback)

pulls a big instance from a remote big instance

- **options** 

  - **type** : object

  - **properties**

    - **path** 

      - **description** : the path to pull the big instance from

      - **type** : string

    - **location** 

      - **description** : the type of location big is pulling from

      - **type** : string

      - **enum**

        - 0 : *fs*

        - 1 : *http*

    - **targetDir** 

      - **description** : the location to extract big instance

      - **type** : string

- **callback** 

  - **type** : function

<a name="replicator-methods-listen"></a> 

### replicator.listen()


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*