var big = require('big');

big.use('mesh');

big.connect();
big.start();

big.on('hello', function(data){
  console.log(data);
});