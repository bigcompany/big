//
// noc - [N]ode [O]perations [C]enter
//
// noc takes a server, logs in via ssh, then installs everything needed
// to run node.js and a big replicator.
//
// "recipes" are simple bash shell scripts stored in the ./recipes/ folder.
//  some common recipes are provided, and you can write your own by dropping them
//  into the ./recipes/ folder
//
//

var resource = require('resource'),
    noc = resource.define('noc'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    sys = require('sys');

resource.use('node');

noc.method('noc', _noc, {
  "description": "the [N]ode [O]perations [C]enter, bootstraps new servers into big nodes",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "node": resource.node.schema.properties,
        "recipe": {
          "description": "path to the shell script to run remotely",
          "type": "string"
        }
      },
      "callback": {
        "type": "function"
      }
    }
  }
});

function _noc (options, callback) {

  //
  // Read in shell script recipe file
  //
  fs.readFile(options.recipe, function (err, data) {

    if (err) {
      return callback(err);
    }

    var loggedIn = false,
    lines,
    commands = [],
    ssh;

   //
   // Turn recipe commands into new line delimited array
   //
   lines = data.toString().split('\n');

   //
   // Remove any line that is empty or starts with a comment
   //
   lines.forEach(function(line){
     if(line.substr(0, 1) !== '#' && line.length > 0) {
       commands.push(line);
     }
   });

   //
   // Join the commands back into bash commands using && to concat each command
   // This creates a long string of bash commands connected by &&,
   // which are executed sequentially
   //
   commands = commands.join(' && ');
   //
   // Spawn SSH binary as child process
   //
   ssh = spawn('ssh', ['-l' + options.node.username, options.node.host, commands]);

   //
   // When the SSH binary exits, execute the callback
   //
   ssh.on('exit', function (code, signal) {
     callback(null, {
       code: code,
       signal: signal
     })
   });

   ssh.stdout.on('data', function (out) {
     process.stdout.write(out);
     if (!loggedIn) {
       var stdin = process.openStdin();
       stdin.on('data', function (chunk) {
         ssh.stdin.write(chunk);
       });
     }

     loggedIn = true;
   });

   ssh.stderr.on('data', function (err) {
     process.stdout.write(err);
   });

 });

}

exports.noc = noc;