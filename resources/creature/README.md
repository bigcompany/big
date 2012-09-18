# creature


# usage

    var big = require("big");
    big.use("creature");

## creature

#### [properties](#creature-properties)

  - [type](#creature-properties-type)

  - [description](#creature-properties-description)

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


  - **type** : string

  - **enum**

      - 0 : *dragon*

      - 1 : *unicorn*

      - 2 : *pony*

  - **default** : dragon

  - **default** : this is a dragon resource

  - **type** : number

  - **default** : 10


<a name="creature-methods"></a> 

## methods 

<a name="creature-methods-create"></a> 

### creature.create(options, callback)

create a new foobar

  - **type** : object

  - **properties**

      - **type**

          - type : *string*

          - enum : *["dragon", "unicorn", "pony"]*

          - default : *dragon*

      - **description**

          - default : *this is a dragon resource*

      - **life**

          - type : *number*

          - default : *10*

  - **type** : function

<a name="creature-methods-get"></a> 

### creature.get(id, callback)

Get object by id

  - **type** : any

  - **description** : the id of the object

  - **type** : function

<a name="creature-methods-find"></a> 

### creature.find(options, callback)

find all instances of resource that matches query

  - **type** : object

  - **properties**

      - **type**

          - type : *string*

          - enum : *["dragon", "unicorn", "pony"]*

          - default : *dragon*

      - **description**

          - default : *this is a dragon resource*

      - **life**

          - type : *number*

          - default : *10*

  - **type** : function

<a name="creature-methods-save"></a> 

### creature.save(options, callback)

saves instance. if no id is provided, create called instead.

  - **type** : object

  - **properties**

      - **type**

          - type : *string*

          - enum : *["dragon", "unicorn", "pony"]*

          - default : *dragon*

      - **description**

          - default : *this is a dragon resource*

      - **life**

          - type : *number*

          - default : *10*

  - **type** : function

<a name="creature-methods-destroy"></a> 

### creature.destroy(id, callback)

destroys object by id

  - **type** : any

  - **description** : the id of the object

  - **required** : true

  - **type** : function

<a name="creature-methods-poke"></a> 

### creature.poke()

<a name="creature-methods-fire"></a> 

### creature.fire(options)

fires a lazer at a certain power and direction

  - **type** : object

  - **properties**

      - **type** : number

      - **default** : 1

      - **required** : true

      - **type** : string

      - **enum**

          - 0 : *up*

          - 1 : *down*

          - 2 : *left*

          - 3 : *right*

      - **required** : true

      - **default** : up

      - **type** : function

      - **required** : false

<a name="creature-methods-talk"></a> 

### creature.talk(text)

echos back a string

  - **type** : string

  - **required** : true


### README auto-generated with [big-docs](https://github.com/bigcompany/big/resources/tree/master/docs)