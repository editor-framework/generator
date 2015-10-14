'use strict';

var Path = require('path');
var Fs = require('fire-fs');
var Async = require('async');
var Chalk = require('chalk');
var Spawn = require('child_process').spawn;

function exec(cmdArgs, path, cb) {
  console.log('git ' + cmdArgs.join(' ') + ' in ' + path);
  var child = Spawn('git', cmdArgs, {
    cwd: path
  });
  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });
  child.stderr.on('data', function(data) {
    if (data.toString().indexOf('error') !== -1) {
      console.log('=========error stderr===========');
    }
    if (data.toString().indexOf('Aborting') !== -1  ||
        data.toString().indexOf('fatal') !== -1) {
      console.log(data.toString());
    process.kill();
    }
    console.error(data.toString());
  });
  child.on('exit', function () {
    if ( cb ) {
      cb ();
    }
  });
}

function clone( remote, path, cb ) {
  if ( Fs.existsSync(Path.join(path, '.git')) ) {
    console.log(path + ' has already cloned!');
    if ( cb ) {
      cb ();
    }
    return;
  }

  exec(['clone', remote, path], '', cb);
}

function pull( repo, remote, branch, cb ) {
  Async.series([
    function ( next ) {
      exec(['checkout', branch], repo, next );
    },

    function ( next ) {
      exec(['pull', remote, branch], repo, next );
    },

    function ( next ) {
      exec(['fetch', '--all'], repo, next );
    },
  ], function ( err ) {
    if ( err ) {
      console.error(Chalk.red('Failed to update ' + repo + '. Message: ' + err.message ));
      if (cb) {
        cb (err);
      }
      return;
    }

    console.log( repo + ' remote head updated!');
    if (cb) {
      cb ();
    }
  });
}

function push( repo, remote, branch, cb ) {
  var Async = require('async');
  Async.series([
    function ( next ) {
      exec(['push', remote, branch], repo, next );
    },

    function ( next ) {
      exec(['push', remote, '--tags'], repo, next );
    },
  ], function ( err ) {
    if ( err ) {
      console.error(Chalk.red('Failed to push ' + repo + '. Message: ' + err.message ));
      if (cb) {
        cb (err);
      }
      return;
    }

    if (cb) {
      cb ();
    }
  });
}

module.exports = {
  exec: exec,
  clone: clone,
  pull: pull,
  push: push,
};
