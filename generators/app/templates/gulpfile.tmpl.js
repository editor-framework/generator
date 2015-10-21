'use strict';

var Fs = require('fire-fs');
var Path = require('path');
var Del = require('del');
var Chalk = require('chalk');
var Npmconf = require('npmconf');

var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');

var git = require('./utils/libs/git.js');
var pjson = require('./package.json');
var spawn = require('child_process').spawn;

// require tasks
require('./utils/gulp-tasks/electron-tasks');
require('./utils/gulp-tasks/setup-tasks');
require('./utils/gulp-tasks/release-tasks');
require('./utils/gulp-tasks/minimize-tasks');

// init and update
// =====================================

gulp.task('bootstrap',
  gulpSequence([
    'update-hosts',
    'update-builtin'
  ],'update-electron')
);

gulp.task('update',
  gulpSequence(
    'setup-branch',
    'update-<%= projectName %>',
    'update-hosts',
    'update-builtin',
    'clear-builtin-bin',
    'update-electron',
    'check-dependencies'
  )
);

gulp.task('pre-install-npm', ['setup-mirror'], function(cb) {
  var mirror = JSON.parse(Fs.readFileSync('local-setting.json')).mirror;
  Npmconf.load(function(_, conf) {
    var registry = Npmconf.defaults.registry;
    if (mirror === 'china') {
      registry = 'http://registry.npm.taobao.org/';
    }
    conf.set('registry', registry, 'user');
    conf.save('user', cb);
  });
});

gulp.task('post-install-npm', function(cb) {
  // resume the default config when being installed
  Npmconf.load(function(_, conf) {
    conf.set('registry', Npmconf.defaults.registry, 'user');
    conf.save('user', cb);
  });
});

// run
// =====================================

gulp.task('run', function(cb) {
  var args = process.argv.slice(3); // strip gulp run
  var cmdStr = '';
  var optArr = [];

  if (process.platform === 'win32') {
    cmdStr = 'bin\\electron\\electron.exe';
    optArr = ['.\\', '--debug=3030', '--dev', '--show-devtools'].concat(args);
  } else {
    cmdStr = 'bin/electron/Electron.app/Contents/MacOS/Electron';
    optArr = ['./', '--debug=3030', '--dev', '--show-devtools'].concat(args);
  }

  var child = spawn(cmdStr, optArr, {
    stdio: 'inherit'
  });
  child.on('exit', function() {
    cb();
  });
});

// self
// =====================================

gulp.task('update-<%= projectName %>', function(cb) {
  var Async = require('async');

  Async.series([
    function ( next ) {
      git.exec(['pull', 'git@github.com:<%= repo %>.git', 'master'], './', next);
    },

    function ( next ) {
      console.log('<%= projectName %> update complete!');
      git.exec(['fetch', '--all'], './', next);
    },

    function ( next ) {
      // NOTE: when we update the main project, we should reload its package.json
      pjson = JSON.parse(Fs.readFileSync('./package.json'));
      next();
    },

  ], function ( err ) {
    if ( err ) {
      console.log( Chalk.red(err.message));
    }
    cb ();
  });
});

// hosts
// =====================================

gulp.task('update-hosts', ['setup-branch'], function(cb) {
  var setting = JSON.parse(Fs.readFileSync('local-setting.json'));

  var Async = require('async');
  Async.eachLimit( pjson.hosts, 5, function ( path, done ) {
    var name = Path.basename(path);

    // if not exists, git clone it
    if (!Fs.existsSync(name)) {
      git.clone('git@github.com:' + path + '.git',
                name,
                done);
      return;
    }

    // update by git pull
    var branch = 'master';
    if ( setting.branch.hosts ) {
      branch = setting.branch.hosts[name] || 'master';
    }

    git.pull(name,
             'git@github.com:' + path + '.git',
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

// builtin
// =====================================

gulp.task('update-builtin', ['setup-branch'], function(cb) {
  Fs.ensureDirSync('builtin');
  var setting = JSON.parse(Fs.readFileSync('local-setting.json'));

  var Async = require('async');
  Async.eachLimit( pjson.builtins, 5, function ( path, done ) {
    var name = Path.basename(path);

    // if not exists, git clone it
    if (!Fs.existsSync(Path.join('builtin', name))) {
      git.clone('git@github.com:' + path + '.git',
                Path.join('builtin', name),
                done);
      return;
    }

    // update by git pull
    var branch = 'master';
    if ( setting.branch.builtins ) {
      branch = setting.branch.builtins[name] || 'master';
    }

    git.pull(Path.join('builtin', name),
             'git@github.com:' + path + '.git',
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

gulp.task('clear-builtin-bin', function(cb) {
  var bins = pjson.builtins.filter(function(path) {
    var name = Path.basename(path);
    var json = JSON.parse(Fs.readFileSync(Path.join('builtin', name, 'package.json')));
    return json.build;
  }).map(function (path) {
    var name = Path.basename(path);
    return Path.join('builtin', name, 'bin');
  });

  console.log('Clean built files for ' + bins);
  Del(bins, function(err) {
    if (err) {
      return cb(err);
    }

    console.log('Builtin Packages Cleaned! Will be rebuilt when <%= projectName %> launches.');
    cb();
  });
});

gulp.task('prune-builtin', function(cb) {
  var builtins = pjson.builtins.map( function ( path ) {
    return Path.basename(path);
  });

  var results = Fs.readdirSync('builtin').filter(function(name) {
    return builtins.indexOf(name) === -1;
  });

  results = results.map(function( name ) {
    return Path.join( 'builtin', name );
  });

  Del( results, function ( err ) {
    if (err) {
      return cb(err);
    }

    results.forEach( function (name) {
      console.log( 'Prune builtin package ' + name );
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

gulp.task('npm-rebuild', function(cb) {
  var cmdstr;
  var tmpenv = process.env;
  var arch;
  if (process.platform === 'win32') {
    cmdstr = 'node-gyp.cmd';
    tmpenv.HOME = Path.join(tmpenv.HOMEPATH, '.electron-gyp');
    arch = 'ia32';
  } else {
    cmdstr = 'node-gyp';
    tmpenv.HOME = Path.join(tmpenv.HOME, '.electron-gyp');
    var os = require('os');
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
    child.on('exit', function() {
      if (--count <= 0) {
        cb();
      }
    });
  });
});

// deps
// =====================================

gulp.task('check-hosts-deps', function() {
  var CheckDeps = require('./utils/libs/check-deps');
  CheckDeps(pjson.hosts);
});

gulp.task('check-dependencies', function(cb) {
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

// distribute
// =====================================

gulp.task('make-dist-mac', gulpSequence(
  'clean-dist',
  'rename-electron-mac',
  'copy-app-to-dist',
  'copy-to-cache',
  'copy-cache-to-dist',
  'npm-install-in-dist',
  'npm-rm-tests-in-dist',
  'bower-install-in-dist'
));

gulp.task('make-dist-win', gulpSequence(
  'clean-dist',
  'rename-electron-win',
  'copy-app-to-dist',
  'copy-to-cache',
  'copy-cache-to-dist',
  'npm-install-in-dist',
  'npm-rm-tests-in-dist',
  'bower-install-in-dist'
));

gulp.task('make-dist-mac-min', gulpSequence(
  'clean-dist',
  'rename-electron-mac',
  'copy-app-to-dist',
  'minify-source-in-cache',
  'copy-cache-to-dist',
  'npm-install-in-dist',
  'npm-rm-tests-in-dist',
  'bower-install-in-dist'
));

gulp.task('make-dist-win-min', gulpSequence(
  'clean-dist',
  'rename-electron-win',
  'copy-app-to-dist',
  'minify-source-in-cache',
  'copy-cache-to-dist',
  'npm-install-in-dist',
  'npm-rm-tests-in-dist',
  'bower-install-in-dist'
));

