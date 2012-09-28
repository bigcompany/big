var resource  = require('resource'),
    replicator = resource.define('replicator'),
    fs = require('fs');

replicator.schema.description = "replicator service for big instances";

replicator.method('push', push, {
  "description": "pushes current big instance to a remote big instance",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "path": {
          "description": "the path of the big instance to push",
          "type": "string",
          "default": "."
        },
        "location": {
          "description": "the location to push the big instance",
          "type": "string",
          "default": "localhost"
        }
      }
    },
    "callback": {
      "type": "function"
    }
  }
});

replicator.method('pull', pull, {
  "description": "pulls a big instance from a remote big instance",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "path": {
          "description": "the path to pull the big instance from",
          "type": "string"
        },
        "location": {
          "description": "the type of location big is pulling from",
          "type": "string",
          "enum": ["fs", "http"]
        }
      }
    },
    "callback": {
      "type": "function"
    }
  }
});

replicator.method('listen', listen, {
  "description": "starts a listening replicator service capable of recieving big push requests"
});

function listen () {

  resource.http.app.get('/replicator', function(req, res) {
    // TODO: build replicator status page
    //       - list of snapshots
    //       - replication log
    //       - replication sources
    res.send('<form method="post" enctype="multipart/form-data">'
        + '<p>snapshot: <input type="file" name="snapshot" /></p>'
        + '<p><input type="submit" value="Upload" /></p>'
        + '</form>');
  });

  resource.http.app.post('/replicator', function(req, res, next){

    //
    // Get the temporary upload location of the file
    //
    var tmpPath = req.files.snapshot.path;
    //
    // Set destination path
    //
    //
    // TODO: destination path should be in separate user home directory
    //
    var targetPath = __dirname + '/snapshots/' + req.files.snapshot.name;

    //
    // TODO only allow tar files
    //

    //
    // Move the file from temporary location to destination
    //
    fs.rename(tmpPath, targetPath, function(err) {
       if (err) {
         throw err;
       }
       //
       // Remove the temporary file from upload folder
       //
       fs.unlink(tmpPath, function() {
           if (err) {
             throw err;
           }
           res.send('File uploaded to: ' + targetPath + ' - ' + req.files.snapshot.size + ' bytes');
           res.end('snapshot uploaded');
           //
           // Now that the snapshot has been uploaded, trigger the pull
           //
           replicator.pull({
             path: targetPath,
             location: "fs"
           }, function(err, result){

             //
             // Remove the current source directory ( DANGER )
             //

             //
             // Move the contents of the snapshot into the current dir
             //

             //
             // Put a start command on the next tick, and stop process
             //
             console.log('pulled', err, result);
           });
       });
    });

  });

};

function compress (options, callback) {

  var fstream = require('fstream'),
  fstreamNpm = require('fstream-npm'),
  zlib = require('zlib'),
  tar = require('tar'),
  name = tarName();

  fstreamNpm({ path: options.path })
    .on('error', callback)
    .pipe(tar.Pack())
    .on('error', callback)
    .pipe(zlib.Gzip())
    .on('error', callback)
    .pipe(fstream.Writer({ type: "File", path: __dirname + '/snapshots/' + name}))
    .on('close', function () {
      callback(null, name);
    });

};

function extract (options, callback) {

  var fstream = require('fstream'),
  fstreamNpm = require('fstream-npm'),
  zlib = require('zlib'),
  tar = require('tar');

  //
  // Choose the directory where the snapshot will be extracted
  //
  var extractor = new tar.Extract({ 
    path:  __dirname + '/snapshots' 
  });

  //
  // Read in the contents of the snapshot as a stream, 
  // and pipe that to Gunzip which will extract the contents of the tar
  //
  fs.createReadStream(options.path).pipe(zlib.Gunzip()).pipe(extractor).on('end', function () {
    callback(null, options.path);
  });

};

// pushes current big instance to another
function push (options, callback) {

  var request = require('request');

  //
  // TODO
  //

  // create tarball of local instance
  compress(options, function(err, result){

    //
    // Connect to remote server
    //
    var r = request.post('http://localhost:8888/replicator');
    var form = r.form();

    //
    // Upload local instance to remote
    //
    form.append('snapshot', fs.createReadStream(__dirname + '/snapshots/' + result));
    r.on('end', callback);

    //
    // TODO:
    //
      // if no connection can be found, throw error
      // in the future, we could add prompt to noc noc over ssh and try push again

    // remote instance restarts and pipes back success / fail message

    // win!

  });

  
}

// pulls down a big instance to current
function pull (options, callback) {
  
  //
  // TODO
  //
  
  // determine if path to pull is a remote of local file
  
    // if local, pull from hd
  
    // if remote, connect to remote server
  
  // get the tar ball
  
  // move the tarball from its location into the "active" folder
  
  // extract tarball
  extract(options, callback);
  
  // restart instance locally
  
  // win!
  
}

//
// Creates a new tar file name based on current time
//
function tarName () {
  var name = '',
      now = new Date();
  name = now.toString();
  name = name.replace(/ /g, '-');
  name = name.replace(/\)/g, '');
  name = name.replace(/\(/g, '');
  name += '.tar';
  return name;
};

exports.replicator = replicator;

exports.dependencies = {
  "fstream": "*",
  "fstream-npm": "*",
  "tar": "*",
  "request": "*"
};