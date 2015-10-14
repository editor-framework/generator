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

gulp.task('copy-electron-mac', function(cb) {
  Fs.ensureDirSync('dist');
  Fs.copy('bin/electron/Electron.app', 'dist/<%= projectName%>.app', function(err) {
    if (err) {
      console.log('Fs.copy Error: ' + err);
      return;
    }

    Fs.copy('utils/res/atom.icns', 'dist/<%= projectName%>.app/Contents/Resources/atom.icns', {clobber: true}, function() {
      cb();
    });
  });
});

gulp.task('copy-electron-win', function(cb) {
  Fs.ensureDirSync('dist');
  Fs.copy('bin/electron', 'dist', function (err) {
    if (err) {
      console.log('Fs.copy Error: ' + err);
      return;
    }

    Fs.move('dist/electron.exe', 'dist/<%= projectName%>.exe', cb);
    cb();
  });
});

gulp.task('rename-electron-win', ['copy-electron-win'], function(cb) {
  var rcedit = require('rcedit');
  rcedit('dist/<%= projectName%>.exe', {
    'product-version': pjson.version,
    'icon': 'utils/res/atom.ico'
  }, function(err) {
    if (err) {
      console.log(err);
      return;
    }

    cb();
  });
});

gulp.task('rename-electron-mac', ['copy-electron-mac'], function (cb) {
  var Plist = require('plist');
  var Async = require('async');

  var plistSrc = ['dist/<%= projectName%>.app/Contents/Info.plist', 'dist/<%= projectName%>.app/Contents/Frameworks/Electron Helper.app/Contents/Info.plist'];
  plistSrc.forEach(function(file) {
    var obj = Plist.parse(Fs.readFileSync(file, 'utf8'));
    obj.CFBundleDisplayName = '<%= projectName%>';
    obj.CFBundleIdentifier = 'com.<%= projectName%>.www';
    obj.CFBundleName = '<%= projectName%>';
    obj.CFBundleExecutable = '<%= projectName%>';
    Fs.writeFileSync(file, Plist.build(obj), 'utf8');
  });

  var renameSrc = [
    'dist/<%= projectName%>.app/Contents/MacOS/Electron',
    'dist/<%= projectName%>.app/Contents/Frameworks/Electron Helper EH.app',
    'dist/<%= projectName%>.app/Contents/Frameworks/Electron Helper NP.app',
    'dist/<%= projectName%>.app/Contents/Frameworks/Electron Helper.app',
    'dist/<%= projectName%>.app/Contents/Frameworks/<%= projectName%> Helper EH.app/Contents/MacOS/Electron Helper EH',
    'dist/<%= projectName%>.app/Contents/Frameworks/<%= projectName%> Helper.app/Contents/MacOS/Electron Helper',
    'dist/<%= projectName%>.app/Contents/Frameworks/<%= projectName%> Helper NP.app/Contents/MacOS/Electron Helper NP'
  ];

  Async.each( renameSrc, function ( file, done ) {
    Fs.move(file, file.replace(/Electron/, '<%= projectName%>'), done);
  }, function ( err ) {
    if ( err ) {
      throw err;
    }

    cb ();
  });
});


function installElectron (isChina, cb) {
  var cmdstr = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  var tmpenv = process.env;
  if(isChina) {
    tmpenv.ELECTRON_MIRROR = 'http://npm.taobao.org/mirrors/electron/';
  }
  var child = spawn(cmdstr, ['install', 'nantas/electron-prebuilt'], {
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
