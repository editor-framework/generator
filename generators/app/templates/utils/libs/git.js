'use strict';

var Path = require('path');
var Fs = require('fire-fs');
var Chalk = require('chalk');
var Spawn = require('child_process').spawn;

function exec(cmdArgs, path, cb) {
  console.log(
    Chalk.yellow('git ' + cmdArgs.join(' ')) +
    ' in ' +
    Chalk.magenta(path)
  );

  var child = Spawn('git', cmdArgs, {
    cwd: path,
    stdio: [0, 1,'pipe'],
  });
  child.stderr.on('data', function(data) {
    var text = data.toString();

    if (
      text.indexOf('Aborting') !== -1 ||
      text.indexOf('fatal') !== -1 ||
      text.indexOf('error') !== -1
    ) {
      process.stderr.write(Chalk.red(text));
      return;
    }

    process.stderr.write(Chalk.green(text));
  });
  child.on('exit', function (code) {
    if ( code !== 0 ) {
      if ( cb ) {
        cb ( new Error('Failed to exec git ' + cmdArgs.join(' ')) );
      }

      return;
    }

    if ( cb ) {
      cb ();
    }
  });
}

function clone( remote, path, cb ) {
  if ( Fs.existsSync(Path.join(path, '.git')) ) {
    console.log(Chalk.green(path + ' has already cloned!'));
    if ( cb ) {
      cb ();
    }
    return;
  }

  exec(['clone', remote, path], '', cb);
}

function pull( repo, remote, branch, cb ) {
  var Async = require('async');
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
      if (cb) {
        cb (err);
      }
      return;
    }

    console.log(Chalk.green(repo + ' remote head updated!'));
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
