var resource   = require('resource'),
    stdout = resource.define('stdout'),
    big = require('big');

stdout.schema.description = "outputs all big events as new-line delimited JSON fragments";

big.onAny(function(data){
  data = data || {};
  var obj = {
    "event": this.event,
    "data": data
  };
  console.log(JSON.stringify(obj));
});

exports.stdout = stdout;