'use strict';

var Path = require('path');
var Fs = require('fire-fs');

var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');

var spawn = require('child_process').spawn;
var pjson = require('../../package.json');

/////////////////////////////////////////////////////
// inits
/////////////////////////////////////////////////////

var electronVer = pjson.electronVersion;
if ( electronVer === null || electronVer === undefined ) {
  console.error( 'Can not read electron-version from package.json' );
  return;
}

/////////////////////////////////////////////////////
// tasks
/////////////////////////////////////////////////////

function checkElectronInstalled () {
  var binary = process.platform === 'win32' ? 'electron.exe' : 'Electron.app';
  if ( Fs.existsSync(Path.join('bin', 'electron', binary)) &&
       Fs.existsSync(Path.join('bin', 'electron', 'version')) ) {
    var version = Fs.readFileSync(Path.join('bin', 'electron', 'version'), 'utf8');
    if (version === 'v' + electronVer) {
      console.log('Electron version ' + version + ' already installed in bin/electron.');
      return true;
    }
  }

  return false;
}

gulp.task('update-electron', function(cb) {
  if ( checkElectronInstalled() ) {
    cb();
    return;
  }

  gulpSequence('setup-mirror', 'install-electron','electron-to-bin', cb);
});

function installElectron (isChina, cb) {
  var cmdstr = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  var tmpenv = process.env;
  if(isChina) {
    tmpenv.ELECTRON_MIRROR = 'http://npm.taobao.org/mirrors/electron/';
  }
  var child = spawn(cmdstr, ['install', 'mafintosh/electron-prebuilt#v'+electronVer], {
    stdio: 'inherit',
    env: tmpenv
  });
  child.on('exit', function() {
    cb();
  });
}

gulp.task('install-electron', function(cb) {
  var mirror = JSON.parse(Fs.readFileSync('local-setting.json')).mirror;
  var isChina = mirror === 'china' ? true : false;
  installElectron(isChina, cb);
});

gulp.task('electron-to-bin', function(cb) {
  var electronPath = Path.join('node_modules', 'electron-prebuilt', 'dist');
  console.log('copying electron from: ' + electronPath);

  Fs.ensureDirSync('bin/electron');
  Fs.copy(electronPath, 'bin/electron', {clobber: true}, function(err){
    if (err) {
      console.log('Fs.copy Error: ' + err);
      return;
    }

    console.log('Electron ' + Fs.readFileSync(Path.join(electronPath, 'version')) + ' has been download to bin/electron folder');
    cb();
  });
});
