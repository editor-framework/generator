'use strict';

var Path = require('path');
var Chalk = require('chalk');
var Async = require('async');
var Globby = require('globby');
var Spawn = require('child_process').spawn;

// get extPath
var exePath = '';
var cwd = process.cwd();
if ( process.platform === 'darwin' ) {
  exePath = Path.join(cwd, 'bin/electron/Electron.app/Contents/MacOS/Electron');
}
else {
  exePath = Path.join(cwd, 'bin/electron/Electron.exe');
}

// get main files
var mainTests = Globby.sync([
  Path.join(cwd,'test/main/**/*.js'),
  Path.join(cwd,'test/share/**/*.js')
]);

// get renderer files
var rendererTests = Globby.sync([
  Path.join(cwd,'test/renderer/**/*.js'),
  Path.join(cwd,'test/share/**/*.js')
]);

// process tests
var failedTests = [];
Async.eachSeries([
  { files: mainTests, renderer: false },
  { files: rendererTests, renderer: true },
], function(info, next) {
  Async.eachSeries(info.files, function(file, done) {
    console.log( Chalk.magenta( 'Start test: ') + Chalk.cyan( Path.relative(cwd, file) ) );

    var args = [];
    if ( info.renderer ) {
      args = [cwd, 'test', '--renderer', '--reporter', 'spec', file];
    } else {
      args = [cwd, 'test', '--reporter', 'spec', file];
    }

    var cp = Spawn(
      exePath,
      args,
      { stdio: [ 0, 1, 2, 'ipc' ] }
    );

    cp.on('message', function(data) {
      if ( data.channel === 'process:end' ) {
        if ( data.failures > 0 ) {
          failedTests.push(data.path);
        }
      }
    });

    cp.on('exit', function () {
      done();
    });

  }, next );
}, function ( err ) {
  if (err) {
    throw err;
  }

  if ( !failedTests.length ) {
    console.log(Chalk.green('================================='));
    console.log(Chalk.green('All tests passed, Congratulations! '));
    console.log(Chalk.green('================================='));
    return;
  }

  console.log(Chalk.red('================================='));
  console.log(Chalk.red(`${failedTests.length} failes: `));
  console.log(Chalk.red('================================='));

  failedTests.forEach(function(file) {
    // SpawnSync(
    //   exePath,
    //   [cwd, '--test', file, '--reporter', 'spec'],
    //   {stdio: 'inherit'}
    // );
    console.log(Chalk.red(` - ${file}`));
  });
});
