var big = require('big');

big.use('mesh');

big.listen();
big.start();

setInterval(function(){
  big.emit('hello', { foo: "bar" });
}, 500);