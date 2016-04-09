'use strict';

var Fs = require('fire-fs');
var Path = require('path');
var Del = require('del');
var Chalk = require('chalk');

var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');

var git = require('./utils/libs/git.js');
var pjson = require('./package.json');
var spawn = require('child_process').spawn;

// init and update
// =====================================

gulp.task('update',
  gulpSequence(
    'update-hosts',
    'update-packages',
    'clear-packages-bin',
    'check-dependencies'
  )
);

// hosts
// =====================================

gulp.task('update-hosts', function (cb) {
  if ( !pjson.hosts ) {
    cb ();
    return;
  }

  var infos = [];
  for ( var p in pjson.hosts ) {
    infos.push({ path: p, branch: pjson.hosts[p] });
  }

  var Async = require('async');
  Async.eachLimit( infos, 5, function ( info, done ) {
    var name = Path.basename(info.path);

    // if not exists, git clone it
    if (!Fs.existsSync(name)) {
      git.clone('https://github.com/' + info.path + '.git',
                name,
                done);
      return;
    }

    // update by git pull
    var branch = info.branch || 'master';
    git.pull(name,
             'https://github.com/' + info.path + '.git',
             branch,
             done);
  }, function ( err ) {
    if ( err ) {
      return cb(err);
    }

    console.log('Hosts update complete!');
    return cb();
  });
});

// packages
// =====================================

gulp.task('update-packages', function (cb) {
  if ( !pjson.packages ) {
    cb ();
    return;
  }

  Fs.ensureDirSync('packages');
  var infos = [];
  for ( var p in pjson.packages ) {
    infos.push({ path: p, branch: pjson.packages[p] });
  }

  var Async = require('async');
  Async.eachLimit( infos, 5, function ( info, done ) {
    var name = Path.basename(info.path);

    // if not exists, git clone it
    if (!Fs.existsSync(Path.join('packages', name))) {
      git.clone('https://github.com/' + info.path + '.git',
                Path.join('packages', name),
                done);
      return;
    }

    // update by git pull
    var branch = info.branch || 'master';
    git.pull(Path.join('packages', name),
             'https://github.com/' + info.path + '.git',
             branch,
             done);
  }, function ( err ) {
    if ( err ) {
      return cb(err);
    }

    console.log('Builtin packages update complete!');
    return cb();
  });
});

gulp.task('clear-packages-bin', function (cb) {
  var paths = [];
  for ( var p in pjson.packages ) {
    paths.push(p);
  }

  var bins = paths.filter(function (path) {
    var name = Path.basename(path);
    var json = JSON.parse(Fs.readFileSync(Path.join('packages', name, 'package.json')));
    return json.build;
  }).map(function (path) {
    var name = Path.basename(path);
    return Path.join('packages', name, 'bin');
  });

  console.log('Clean built files for ' + bins);
  Del(bins, function(err) {
    if (err) {
      return cb(err);
    }

    console.log('Builtin Packages Cleaned! Will be rebuilt when editor launches.');
    cb();
  });
});

gulp.task('prune-packages', function (cb) {
  var packages = [];
  for ( var p in pjson.packages ) {
    packages.push(Path.basename(p));
  }

  var results = Fs.readdirSync('packages').filter(function(name) {
    return packages.indexOf(name) === -1;
  });

  results = results.map(function( name ) {
    return Path.join( 'packages', name );
  });

  Del( results, function ( err ) {
    if (err) {
      return cb(err);
    }

    results.forEach( function (name) {
      console.log( 'Prune packages package ' + name );
    });

    cb();
  });
});

// native rebuild
// =====================================

function findNativeModulePathRecursive(path) {
  var nativePaths = [];
  if (Fs.existsSync(Path.join(path, 'binding.gyp'))) {
    nativePaths.push(path);
  } else {
    if (Fs.isDirSync(Path.join(path, 'node_modules'))) {
      var subPaths = Fs.readdirSync(Path.join(path, 'node_modules'));
      subPaths.forEach(function(subpath) {
        var subCollect = findNativeModulePathRecursive(Path.join(path, 'node_modules', subpath));
        if (subCollect.length > 0) {
          nativePaths = nativePaths.concat(subCollect);
        }
      });
    }
  }
  return nativePaths;
}

gulp.task('npm-rebuild', function (cb) {
  var os = require('os');

  var cmdstr;
  var tmpenv = process.env;
  var arch = os.arch();

  if (process.platform === 'win32') {
    cmdstr = 'node-gyp.cmd';
    tmpenv.HOME = Path.join(tmpenv.HOMEPATH, '.electron-gyp');
    // arch = 'ia32';
    arch = os.arch();
  } else {
    cmdstr = 'node-gyp';
    tmpenv.HOME = Path.join(tmpenv.HOME, '.electron-gyp');
    arch = os.arch();
  }
  var disturl = 'https://atom.io/download/atom-shell';
  var target = pjson.electronVersion;
  // var arch = process.platform === 'win32' ? 'ia32' : 'x64';
  var nativePaths = findNativeModulePathRecursive('.');
  console.log('rebuilding native modules: \n' + nativePaths);
  var count = nativePaths.length;
  if (count === 0) {
    console.log('no native module found!');
    return cb();
  }
  nativePaths.forEach(function(path) {
    var child = spawn(cmdstr, [
      'rebuild',
      '--target='+target,
      '--arch='+arch,
      '--dist-url='+disturl
    ], {
      stdio: 'inherit',
      env: tmpenv,
      cwd: path
    });
    child.on('exit', function () {
      if (--count <= 0) {
        cb();
      }
    });
  });
});

// deps
// =====================================

gulp.task('check-dependencies', function (cb) {
  var CheckDeps = require('check-dependencies');
  var Async = require('async');

  console.log(Chalk.cyan('===== Checking Dependencies ====='));

  function _check ( pkgManager, done ) {
    CheckDeps({
      packageManager: pkgManager,
      verbose: false,
      checkGitUrls: true
    }, function (result) {
      if (result.depsWereOk) {
        console.log(Chalk.green( pkgManager + ' dependency check complete, everything is ok!'));
        done();
        return;
      }

      var missingPkgs = [];
      for (var i = 0; i < result.error.length - 1; ++i) {
        console.log(result.error[i]);
        var logArr = result.error[i].split(':');
        missingPkgs.push(logArr[0]);
      }
      console.log('Please run ' + Chalk.blue('"' + pkgManager + ' install ' + missingPkgs.join(' ') + '"'));
      done();
    });
  }

  Async.series([
    function ( next ) {
      _check('npm', next);
    },

    function ( next ) {
      _check('bower', next);
    },
  ], function () {
    cb();
  });
});
