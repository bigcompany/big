# Big

## Installation

```bash
npm install big
```

## Quick Start

```bash
big admin start
```

## Developer Start

```js
var big = require('big');
big.use('creature');
big.use('admin');
big.admin.start(function(err, server) {
  big.logger.info('admin server started on http://0.0.0.0:8888/');
});
```

*Starts a http web admin server on http://localhost:8888/*

## Resource Development

[https://github.com/bigcompany/resource](https://github.com/bigcompany/resource)

## Additional Resources

[https://github.com/bigcompany/resources](https://github.com/bigcompany/resources)