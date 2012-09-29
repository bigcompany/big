var resource   = require('resource'),
    stdin = resource.define('stdin');

stdin.schema.description = "allows application to listen for input from STDIN";

stdin.method('start', start, {
  "description": "listens for STDIN on the process and attempts to eval it as JavaScript"
});

function start () {
  process.listening = true;
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (chunk) {
    var lines = chunk.split('\n');
    lines.forEach(function(line){
      if (line) {
        //
        // Evaluate all STDIN in current context
        // WARNING: This will not attempt to parse parse STDIN at all
        // If you don't control the STDIN for this process, don't big.use('stdin').
        //
        try {
          eval(line);
        } catch (err) {
          throw err;
        }
      }
    });
  });
  process.stdin.on('end', function () {});
};

exports.stdin = stdin;