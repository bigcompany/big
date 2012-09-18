# big-http


# installation

    npm install big-http

# usage

    var big = require("big");
    big.use("http");

# http properties 

## `http.port`

 - type : string

 - default : 8888

 - description : the port to listen on 

## `http.host`

 - type : string

 - default : 0.0.0.0

 - description : the host interface to listen on

## `http.root`

 - type : string

 - default : ./public


# methods

## `http.start(options, callback)`

starts an http server

### `options`

 - type : object

#### `port`

   - type : string

   - default : 8888

   - description : the port to listen on 

#### `host`

   - type : string

   - default : 0.0.0.0

   - description : the host interface to listen on

#### `root`

   - type : string

   - default : ./public

### `callback`

 - description : the callback executed after server listen

 - type : function

 - required : false


### README auto-generated with [big-docs](https://github.com/bigcompany/big/resources/tree/master/docs)