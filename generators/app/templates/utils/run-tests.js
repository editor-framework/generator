var Path = require('path');
var Fs = require('fire-fs');
var Chalk = require('chalk');
var SpawnSync = require('child_process').spawnSync;
var Spawn = require('child_process').spawn;
var Async = require('async');

var pjson = require('../package.json');
var exePath = '';
var cwd = process.cwd();

if ( process.platform === 'darwin' ) {
  exePath = Path.join(cwd, 'bin/electron/Electron.app/Contents/MacOS/Electron');
}
else {
  exePath = Path.join(cwd, 'bin/electron/Electron.exe');
}

var testDirs = [
  Path.join( cwd, 'test' ),
];
pjson.hosts.forEach(function( path ) {
  var name = Path.basename(path);
  testDirs.push( Path.join( cwd, name, 'test' ) );
});

var singleTestFile = process.argv[2];
var failedTest = [];

// accept
if (singleTestFile) {
  if (Fs.isDirSync(singleTestFile)) { // if test a folder
    if( Path.basename(singleTestFile) === 'test' ) {
      singleTestFile = Path.join(singleTestFile, 'index.js');
    } else {
      singleTestFile = Path.join(singleTestFile, 'test', 'index.js');
    }

    var indexFile = Path.join(cwd, singleTestFile);
    if ( Fs.existsSync(indexFile) ) {
      var files = require(indexFile);
      files.forEach(function ( file ) {
        var testfile = Path.join( Path.dirname(indexFile), file );
        console.log( Chalk.magenta( 'Start test: ') + Chalk.cyan( Path.relative(__dirname, testfile) ) );
        SpawnSync(exePath, [cwd, '--test', testfile], {stdio: 'inherit'});
      });
    } else {
      console.error('Can not find index.js in %s', Path.dirname(singleTestFile));
    }
  } else {
    if ( Path.basename(singleTestFile) === 'index.js' ) {
      indexFile = Path.join(cwd, singleTestFile);
      var files = require(indexFile);
      files.forEach(function ( file ) {
        var testfile = Path.join( Path.dirname(indexFile), file );
        console.log( Chalk.magenta( 'Start test: ') + Chalk.cyan( Path.relative(__dirname, testfile) ) );
        SpawnSync(exePath, [cwd, '--test', testfile], {stdio: 'inherit'});
      });
    } else {
      singleTestFile = (singleTestFile + '.js').replace('.js.js', '.js');
      SpawnSync(exePath, [cwd, '--test', singleTestFile], {stdio: 'inherit'});
    }
  }
} else {
  Async.eachSeries(testDirs, function( path, cb ) {
    if ( !Fs.existsSync(path) ) {
      console.error( 'Path not found %s', path );
      return;
    }
    var indexFile = Path.join( path, 'index.js' );
    if ( Fs.existsSync(indexFile) ) {
      var files = require(indexFile);
      var count = files.length;
      Async.eachSeries(files, function(file, callback) {
        var testfile = Path.join( Path.dirname(indexFile), file );
        console.log( Chalk.magenta( 'Start test: ') + Chalk.cyan( Path.relative(__dirname, testfile) ) );
        var cp = Spawn(exePath, [cwd, '--test', testfile, '--report-failures'], {stdio:[0,1,2,'ipc']});
        cp.on('message', function(data) {
          if ( data.channel === 'process:end' ) {
            if ( data.failures > 0 ) {
              failedTest.push(data.path);
            }
          }
        });
        cp.on('exit', function(){
          callback();
          if (--count <= 0) {
            cb();
          }
        });
      });
      // files.forEach(function ( file ) {
      //   // console.log(file);
      //     var testfile = Path.join( Path.dirname(indexFile), file );
      //     console.log( Chalk.magenta( 'Start test: ') + Chalk.cyan( Path.relative(__dirname, testfile) ) );
      //     SpawnSync(exePath, [cwd, '--test', testfile, '--report-failures'], {stdio: 'inherit'});
      // });
    }
    else {
      console.error('Can not find index.js in %s', path);
      cb();
    }
  }, function(err) {
    if (err) {
      throw err;
    } else {
      if (failedTest.length > 0) {
        console.log(Chalk.red('================================='));
        console.log(Chalk.red( 'Listing all failed tests: '));
        console.log(Chalk.red('================================='));
        failedTest.forEach(function(file) {
          SpawnSync(exePath, [cwd, '--test', file], {stdio: 'inherit'});
        });
      } else {
        console.log(Chalk.green('================================='));
        console.log(Chalk.green( 'All tests passed, Congratulations! '));
        console.log(Chalk.green('================================='));
      }
    }
  });
}
