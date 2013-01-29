# Big

## Developer Start

### Installation

```bash
npm install big
```

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