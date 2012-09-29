# datasource


# usage

    var big = require("big");
    big.use("datasource");

## datasource

#### [properties](#datasource-properties)

  - [id](#datasource-properties-id)

  - [name](#datasource-properties-name)

  - [status](#datasource-properties-status)

  - [type](#datasource-properties-type)

  - [port](#datasource-properties-port)

  - [host](#datasource-properties-host)

  - [uri](#datasource-properties-uri)

  - [username](#datasource-properties-username)

  - [password](#datasource-properties-password)


#### [methods](#datasource-methods)


<a name="datasource-properties"></a>

## properties 
perists resources to data storage engines

- **id** 

  - **type** : any

- **name** 

  - **type** : string

  - **description** : The name of the new datasource

  - **minLength** : 1

  - **default** : the-datasource

- **status** 

  - **type** : string

  - **description** : the status of the datasource

  - **enum**

    - 0 : *inactive*

    - 1 : *active*

    - 2 : *error*

  - **format** : status

  - **default** : inactive

- **type** 

  - **type** : string

  - **description** : The type of the datasource

  - **enum**

    - 0 : *couch*

    - 1 : *file-system*

    - 2 : *memory*

    - 3 : *mongo*

    - 4 : *mysql*

    - 5 : *redis*

  - **required** : true

  - **message** : datasource type must be valid

- **port** 

  - **type** : number

  - **description** : the port of the datasource

  - **minimum** : 1

  - **maximum** : 65535

  - **message** : port should be valid

- **host** 

  - **type** : string

  - **description** : the host of the datasource

  - **format** : host-name

  - **minLength** : 1

  - **default** : localhost

- **uri** 

  - **type** : string

  - **description** : the connection uri to the datasource

  - **default** : 

- **username** 

  - **type** : string

  - **description** : the username used to connect to the datasource

- **password** 

  - **type** : string

  - **description** : the password used to connect to the datasource


<a name="datasource-methods"></a> 

## methods 


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*