# Big

Big is a next generation application "framework" which solves the domain problem of building applications for the web.

 - No more writing interface code
 - No more writing API boilerplate
 - No more fishing on `npm` for decent quality modules
 - No more glue

Big allows you to focus on **business logic**.

## Big itself is zero lines long. 

What? How can a framework be zero lines long?

Big actually doesn't do anything. It's more of a [philosopy](http://big.vc/mission) then a framework.

Big provides a collection of curated [resources](http://github.com/bigcompany/resources) defined by the [resource](http://github.com/bigcompany/resource) library. Developers can use any of these resources independently of any "framework".



## A curated API across npm modules

Big ships with support for over 50 of the most popular NPM modules. We have hand picked ( and tested ) each of these modules and created a unified API to allow for rapid application development.

### A unified approach 


 - Unified configuration of npm modules
 - Unified API across npm modules ( `start` / `stop` / `connect` / `disconnect` / etc.. )
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

## Developer Friendly

Confused? Lost? Try a `console.log`. 

Big is designed to be highly introspectable. Resources are simple structures that can be easily logged to the console. It's trivial to start iterating through a resource's schema and metaprogramming a new interface.


## Reflection across multiple interfaces

Big has support to reflect resources across:

 - REST
 - Socket
 - Forms
 - CLI
 - Documentation
 - IRC
 - Mesh

[and many more...](http://github.com/bigcompany/resources/)

Customization of the default reflection logic is always available, and simple. 

## Example Apps

[https://github.com/bigcompany/big/tree/master/examples](https://github.com/bigcompany/big/tree/master/examples)


## Resource Development

[https://github.com/bigcompany/resource](https://github.com/bigcompany/resource)

## Featured Resources

[https://github.com/bigcompany/resources](https://github.com/bigcompany/resources)