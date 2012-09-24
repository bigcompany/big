var resource = require('resource'),
    ssh = resource.define('ssh');

ssh.schema.description = "enables an ssh interface to communicate with a remote big instance";

ssh.method('start', start);

function start () {
  console.log('start');
}

exports.ssh = ssh;