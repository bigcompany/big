module['exports'] = function spawn (app, opts, cb) {
  cb = cb || function (err, res) {
    if (err) {
      console.log('An error has occurred in ' + app)
      console.log('big.spawn about to throw!');
      throw err;
    }
  };
  opts = opts || {};

  // shortcut names for apps
  if (app === "lb") {
    app = "load-balancer";
  }
  
  var _app = require('../apps/' + app);
  _app(opts, cb);
};