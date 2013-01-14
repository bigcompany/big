# big - prerelease

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
big.admin.start();
```

*Starts a http web admin server on http://localhost:8888/*