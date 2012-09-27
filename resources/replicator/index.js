var resource  = require('resource'),
    replicator = resource.define('replicator');

replicator.schema.description = "replicator service for big instances";

replicator.method('push', push, {
  "description": "pushes current big instance to a remote big instance"
});

replicator.method('pull', pull, {
  "description": "pulls a big instance from a remote big instance"
});

replicator.method('listens', start, {
  "description": "starts a lisenting replicator service capable of recieving big push requests"
});

function start () {


  resource.http.app.get('/replicator', function(req, res) {
    // TODO: build replicator status page
    //       - list of snapshots
    //       - replication log
    //       - replication sources
    res.send('<form method="post" enctype="multipart/form-data">'
        + '<p>Data: <input type="filename" name="filename" /></p>'
        + '<p>file: <input type="file" name="file" /></p>'
        + '<p><input type="submit" value="Upload" /></p>'
        + '</form>');
  });

  resource.http.app.post('/replicator', function(req, res, next){
    //
    // TODO: use node-formdible directly
    // - only allow tar files
    // - on upload event, trigger pull replicator pull action
    //
    console.log(req.files);
    res.end('file uploaded')
  });

};

function compress () {

  var fstream = require('fstream'),
  fstreamNpm = require('fstream-npm'),
  zlib = require('zlib'),
  tar = require('tar');

  function callback (err, result) {
    console.log(err, result);
  };

  fstreamNpm({ path: '.' })
    .on('error', callback)
    .pipe(tar.Pack())
    .on('error', callback)
    .pipe(zlib.Gzip())
    .on('error', callback)
    .pipe(fstream.Writer({ type: "File", path: __dirname + '/snapshots/foo.tar' }))
    .on('close', function () {
      callback(null, true);
    });

};

function extract () {

  var fstream = require('fstream'),
  fs = require('fs'),
  fstreamNpm = require('fstream-npm'),
  zlib = require('zlib'),
  tar = require('tar');

  var extractor = new tar.Extract({ path:  __dirname + '/snapshots/foo' });
   fs.createReadStream( __dirname + '/snapshots/foo.tar').pipe(zlib.Gunzip()).pipe(extractor).on('end', function () {
   });
};

// pushes current big instance to another
function push (options, callback) {

  // create tarball of local instance
  compress();

  // connect to remote server
  
    // if no connection can be found, throw error
    // in the future, we could add prompt to noc noc over ssh and try push again
  
  // upload local instance to remote
  
  // remote instance restarts and pipes back success / fail message
  
  // win!
  
}

// pulls down a big instance to current
function pull (options, callback) {
  
  // connect to remote server
  
  // asks for a tar ball to be created of remote instance
  
  // download remote instance
  
  // extracts remote instance
  extract();
  
  // start remote instance locally
  
  // win!
  
}

exports.replicator = replicator;

exports.dependencies = {
  "fstream": "*",
  "fstream-npm": "*",
  "tar": "*"
};