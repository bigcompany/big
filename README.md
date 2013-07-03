# Big

Big is a next generation application zero-framework which solves the domain problem of building web applications. 

 - No more writing interface code
 - No more writing API boilerplate
 - No more fishing on `npm` for decent quality modules
 - No more glue

## Big itself is zero lines long. 

What? How can a framework be zero lines long?

Big actually doesn't do anything. It's more of a [philosopy](http://big.vc/mission) then a framework.

Big provides a collection of curated [resources](http://github.com/bigcompany/resources) defined by the [resource](http://github.com/bigcompany/resource) library. Developers can use any of these resources independently of any "framework".



## A curated API across npm modules

Big ships with support for over 50 of the most popular NPM modules. We have hand picked ( and tested ) each of these modules and created a unified API to allow for rapid application development.

### A unified approach 


 - Unified configuration of npm modules
 - Unified API across npm modules ( `start` / `stop` / `connect` / `disconnect` / `send` / `recieve` )
 - Unified method signatures

All of the following methods will work. Any missing arguments data is intelligently filled in with defaults.

``` js

    var message = "hello there";
    twitter.send(message, cb);
    sms.send(message, cb);
    email.send(message, cb);
    irc.send(message, cb);
    mesh.send(message, cb);

```


## Reflection across multiple interfaces

 - REST
 - Socket
 - Forms
 - CLI
 - Documentation
 - IRC
 - Mesh

[and many more...](http://github.com/bigcompany/resources/)


## Installation

In a terminal, run:

```bash
npm install big -g
```

After `big` is installed run:

```bash
big
```

*On some systems you may have to `npm` or `big` with `sudo`*

## Example Apps

[https://github.com/bigcompany/big/tree/master/examples](https://github.com/bigcompany/big/tree/master/examples)


## Resource Development

[https://github.com/bigcompany/resource](https://github.com/bigcompany/resource)

## Featured Resources

[https://github.com/bigcompany/resources](https://github.com/bigcompany/resources)