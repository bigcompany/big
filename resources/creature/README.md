# creature


# usage

    var big = require("big");
    big.use("creature");

## creature

#### [properties](#creature-properties)

  - [type](#creature-properties-type)

  - [life](#creature-properties-life)


#### [methods](#creature-methods)

  - [create](#creature-methods-create) (options, callback)

  - [get](#creature-methods-get) (id, callback)

  - [find](#creature-methods-find) (options, callback)

  - [save](#creature-methods-save) (options, callback)

  - [destroy](#creature-methods-destroy) (id, callback)

  - [poke](#creature-methods-poke) ()

  - [fire](#creature-methods-fire) (options)

  - [talk](#creature-methods-talk) (text)


<a name="creature-properties"></a>

## properties 


- **type** 

  - **type** : string

  - **enum**

    - 0 : *dragon*

    - 1 : *unicorn*

    - 2 : *pony*

  - **default** : dragon

- **life** 

  - **type** : number

  - **default** : 10


<a name="creature-methods"></a> 

## methods 

<a name="creature-methods-create"></a> 

### creature.create(options, callback)

create a new foobar

- **options** 

  - **type** : object

  - **properties**

    - **type** 

      - **type** : string

      - **enum**

        - 0 : *dragon*

        - 1 : *unicorn*

        - 2 : *pony*

      - **default** : dragon

    - **life** 

      - **type** : number

      - **default** : 10

- **callback** 

  - **type** : function

<a name="creature-methods-get"></a> 

### creature.get(id, callback)

Get object by id

- **id** 

  - **type** : any

  - **description** : the id of the object

- **callback** 

  - **type** : function

<a name="creature-methods-find"></a> 

### creature.find(options, callback)

find all instances of resource that matches query

- **options** 

  - **type** : object

  - **properties**

    - **type** 

      - **type** : string

      - **enum**

        - 0 : *dragon*

        - 1 : *unicorn*

        - 2 : *pony*

      - **default** : dragon

    - **life** 

      - **type** : number

      - **default** : 10

- **callback** 

  - **type** : function

<a name="creature-methods-save"></a> 

### creature.save(options, callback)

saves instance. if no id is provided, create called instead.

- **options** 

  - **type** : object

  - **properties**

    - **type** 

      - **type** : string

      - **enum**

        - 0 : *dragon*

        - 1 : *unicorn*

        - 2 : *pony*

      - **default** : dragon

    - **life** 

      - **type** : number

      - **default** : 10

- **callback** 

  - **type** : function

<a name="creature-methods-destroy"></a> 

### creature.destroy(id, callback)

destroys object by id

- **id** 

  - **type** : any

  - **description** : the id of the object

  - **required** : true

- **callback** 

  - **type** : function

<a name="creature-methods-poke"></a> 

### creature.poke()

<a name="creature-methods-fire"></a> 

### creature.fire(options)

fires a lazer at a certain power and direction

- **options** 

  - **type** : object

  - **properties**

    - **power** 

      - **type** : number

      - **default** : 1

      - **required** : true

    - **direction** 

      - **type** : string

      - **enum**

        - 0 : *up*

        - 1 : *down*

        - 2 : *left*

        - 3 : *right*

      - **required** : true

      - **default** : up

    - **callback** 

      - **type** : function

      - **required** : false

<a name="creature-methods-talk"></a> 

### creature.talk(text)

echos back a string

- **text** 

  - **type** : string

  - **required** : true


*README auto-generated with [big-docs](https://github.com/bigcompany/big/resources/tree/master/docs)*