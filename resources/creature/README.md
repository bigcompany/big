# big-creature


# installation

    npm install big-creature

# usage

    var big = require("big");
    big.use("creature");

# creature properties 

## `creature.type`

 - type : string

 - enum

   - 0 : dragon

   - 1 : unicorn

   - 2 : pony

 - default : dragon

## `creature.description`

 - default : 

## `creature.life`

 - default : 10


# methods

## `creature.poke()`

## `creature.fire(options)`

fires a lazer at a certain power and direction

### `options`

 - type : object

#### `power`

   - type : number

   - default : 1

   - required : true

#### `direction`

   - type : string

   - enum : up,down,left,right

   - required : true

   - default : up

#### `callback`

   - type : function

   - required : false

## `creature.talk(text)`

echos back a string

### `text`

 - type : string

 - required : true


### README auto-generated with [big-docs](https://github.com/bigcompany/big/resources/tree/master/docs)