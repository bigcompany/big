var big = require('big');

big.use('mesh');

big.listen();
big.start();

big.emit('server');

setInterval(function(){
  big.emit('server-foo', { bar: "foo" });
}, 2000);

big.onAny(function(data){
  console.log(this.event, data)
})