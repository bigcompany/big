# creature


# usage

    var big = require("big");
    big.use("creature");

## creature

#### [properties](#creature-properties)

  - [id](#creature-properties-id)

  - [type](#creature-properties-type)

  - [life](#creature-properties-life)


#### [methods](#creature-methods)

  - [poke](#creature-methods-poke) ()

  - [fire](#creature-methods-fire) (options)

  - [talk](#creature-methods-talk) (text)


<a name="creature-properties"></a>

## properties 


- **id** 

  - **type** : any

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


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*