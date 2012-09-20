# api


# usage

    var big = require("big");
    big.use("api");

## api

#### [properties](#api-properties)

  - [version](#api-properties-version)

  - [resources](#api-properties-resources)


#### [methods](#api-methods)

  - [start](#api-methods-start) (options)


<a name="api-properties"></a>

## properties 


- **version** 

  - **description** : the semantic version of the API

  - **type** : string

  - **default** : v0.0.1

- **resources** 

  - **description** : the resources represented by the api

  - **type** : object

  - **default** : undefined


<a name="api-methods"></a> 

## methods 

<a name="api-methods-start"></a> 

### api.start(options)

when the api resource starts

- **options** 

  - **type** : object

  - **properties**

    - **version** 

      - **description** : the semantic version of the API

      - **type** : string

      - **default** : v0.0.1

    - **resources** 

      - **description** : the resources represented by the api

      - **type** : object

      - **default** : undefined


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*