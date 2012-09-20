var big = require('big');

big.use('mesh');

big.connect();
big.start();

setInterval(function(){
  big.emit('client-foo', { bar: "foo" });
}, 2000);

big.onAny(function(data){
  console.log(this.event, data)
});