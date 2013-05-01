# Big

## Developer Start

### Install Big Globally

In a terminal, run:

```bash
<sudo> npm install big -g
```

### Install as a Library in an Application

Inside a project folder with a `package.json`, run:

```bash
npm install big
npm install resource
npm install resources

```

Add the following to the entry point of your application:

```js
var big = require('big');
big.use('creature');
big.use('admin');
big.admin.start(function(err, server) {
  big.logger.info('admin server started on http://0.0.0.0:8888/admin');
  big.logger.help('username and password is: admin');
});
```

*Starts a http web admin server on http://admin:admin@localhost:8888/admin*

## Resource Development

[https://github.com/bigcompany/resource](https://github.com/bigcompany/resource)

## Additional Resources

[https://github.com/bigcompany/resources](https://github.com/bigcompany/resources)