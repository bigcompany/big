var resource = require('resource'),
    system = resource.define('system');

system.schema.description = "interacts with the operating system";

var spawn = require('child_process').spawn;

system.method('info', info, {
  "description": "provides information about current operating system"
});

system.method('useradd', useradd, {
  "description": "adds a user to a group",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "user": {
          "description": "the name of the user to add",
          "type": "string",
          "required": true
        },
        "password": {
          "description": "the password of the user to be added",
          "type": "string",
          "required": true
        },
        "group": {
          "description": "group to add user to",
          "type": "string",
          "default": "big-users"
        }
      }
    },
    "callback": {
      "type": "function"
    }
  }
});

system.method('userdel', userdel, {
  "description": "removes a user from a group",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "user": {
          "description": "the name of the user to add",
          "type": "string",
          "required": true
        },
        "group": {
          "description": "user group to add user to",
          "type": "string",
          "default": "big-users"
        }
      }
    },
    "callback": {
      "type": "function"
    }
  }
});

system.method('passwd', userdel, {
  "description": "changes a user's password",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "user": {
          "description": "the name of the user to update password for",
          "type": "string",
          "required": true
        },
        "password": {
          "description": "the new password",
          "type": "string",
          "required": true
        }
      }
    },
    "callback": {
      "type": "function"
    }
  }
});

system.method('groupadd', groupadd, {
  "description": "adds a new group to the system",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "name": {
          "description": "the name of the group",
          "type": "string",
          "required": true
        }
      }
    },
    "callback": {
      "type": "function"
    }
  }
});

system.method('members', members, {
  "description": "lists members of a group",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "name": {
          "description": "the name of the group",
          "type": "string",
          "default": "big-users",
          "required": true
        }
      }
    },
    "callback": {
      "type": "function"
    }
  }
});


function info () {

  var os  = require('os');

  var obj = {};

  obj.name     = "big";
  obj.version  = "v0.0.0";

  obj.system = {
    platform: os.platform(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    cpus: os.cpus(),
    networkInterfaces: os.networkInterfaces()
  };

  return obj;

};

function useradd (options, callback) {

  if (process.platform !== "linux") {
    return callback(new Error('command only available for linux systems'));
  }

  // useradd -s /usr/local/bin/big-sh -m -g big-users marak
  var useradd  = spawn('useradd', ['-s', '/usr/local/bin/big-sh', '-m', '-g', options.group, options.name]);

  useradd.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  useradd.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  useradd.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    callback(null, options);
  });
};

function passwd (options, callback) {

  if (process.platform !== "linux") {
    return callback(new Error('command only available for linux systems'));
  }

  // echo -e "foo\nfoo" | passwd marak
  var passwd  = spawn('echo', ['-e', '"' + options.password + '\n' + options.password + '"', '|', 'passwd', options.name]);

  passwd.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  passwd.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  passwd.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    callback(null, options);
  });

};

function userdel (options, callback) {

  if (process.platform !== "linux") {
    return callback(new Error('command only available for linux systems'));
  }

  // userdel marak
  var userdel  = spawn('userdel', [options.username]);

  userdel.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  userdel.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  userdel.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    callback(null, 'big-users');
  });

};

function groupadd (options, callback) {

  if (process.platform !== "linux") {
    return callback(new Error('command only available for linux systems'));
  }

  // groupadd big-users
  var groupadd  = spawn('groupadd', [options.name]);

  groupadd.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  groupadd.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  groupadd.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    callback(null, 'big-users');
  });

};

function members (options, callback) {

  if (process.platform !== "linux") {
    return callback(new Error('command only available for linux systems'));
  }

  // members big-users
  var members  = spawn('members', [options.name]);

  members.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  members.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  members.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    callback(null, code);
  });

};

exports.system = system;