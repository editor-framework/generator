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

// init and update
// =====================================

gulp.task('bootstrap',
  gulpSequence([
    'install-hosts',
    'install-builtin'
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
  var Commander = require('commander');
  Commander.option('--path <path>', 'Run open <%= projectName %> project in path')
  .parse(process.argv);

  var projectPath = Commander.path;
  if (projectPath) {
    console.log('Load project from %s', projectPath);
  }

  var cmdStr = '';
  var args = [];
  if (process.platform === 'win32') {
    cmdStr = 'bin\\electron\\electron.exe';
    args = ['.\\', '--debug=3030', '--dev', '--show-devtools'];
  } else {
    cmdStr = 'bin/electron/Electron.app/Contents/MacOS/Electron';
    args = ['./', '--debug=3030', '--dev', '--show-devtools'];
  }

  if ( projectPath ) {
    args.push(projectPath);
  }

  var child = spawn(cmdStr, args, { stdio: 'inherit' });
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
      throw err;
    }
    cb ();
  });
});

// builtin
// =====================================

gulp.task('install-builtin', function(cb) {
  Fs.ensureDirSync('builtin');

  var Async = require('async');
  Async.eachLimit( pjson.builtins, 5, function ( path, done ) {
    var name = Path.basename(path);
    git.clone('git@github.com:' + path + '.git',
              Path.join('builtin', name),
              done);
  }, function ( err ) {
    if ( err ) {
      throw err;
    }

    console.log('Builtin packages installation complete!');
    cb();
  });
});

gulp.task('update-builtin', ['setup-branch'], function(cb) {
  var setting = JSON.parse(Fs.readFileSync('local-setting.json'));

  if ( !Fs.isDirSync('builtin') ) {
    console.error(Chalk.red('Builtin folder not initialized, please run "gulp install-builtin" first!'));
    return cb();
  }

  var Async = require('async');
  Async.eachLimit( pjson.builtins, 5, function ( path, done ) {
    var name = Path.basename(path);
    if ( !Fs.existsSync(Path.join('builtin', name, '.git')) ) {
      console.error(Chalk.red('Builtin package ' + name + ' not initialized, please run "gulp install-builtin" first!'));
      process.exit(1);
      return;
    }

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
      process.exit(1);
      return;
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
      throw err;
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
      throw err;
    }

    results.forEach( function (name) {
      console.log( 'Prune builtin package ' + name );
    });

    cb();
  });
});

// hosts
// =====================================

gulp.task('install-hosts', function(cb) {
  var Async = require('async');
  Async.eachLimit( pjson.hosts, 5, function ( path, done ) {
    var name = Path.basename(path);
    git.clone('git@github.com:' + path + '.git',
              name,
              done);
  }, function ( err ) {
    if ( err ) {
      throw err;
    }

    console.log('Hosts installation complete!');
    cb();
  });
});

gulp.task('update-hosts', ['setup-branch'], function(cb) {
  var setting = JSON.parse(Fs.readFileSync('local-setting.json'));

  var Async = require('async');
  Async.eachLimit( pjson.hosts, 5, function ( path, done ) {
    var name = Path.basename(path);
    if ( !Fs.existsSync(Path.join(name, '.git')) ) {
      console.error(Chalk.red('Hosts package ' + name + ' not initialized, please run "gulp install-hosts" first!'));
      process.exit(1);
      return;
    }

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
      process.exit(1);
      return;
    }

    console.log('Hosts update complete!');
    return cb();
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
  var checkDeps = require('./utils/libs/check-deps');
  checkDeps(pjson.hosts);
});

gulp.task('check-dependencies', function(cb) {
  var checkdeps = require('check-dependencies');
  console.log(Chalk.cyan('====Checking Dependencies===='));
  var count = 2;
  checkdeps({
    packageManager: 'npm',
    verbose: true,
    checkGitUrls: true
  }, function() {
    if (--count<=0) {
      console.log('If you see any version number in ' + Chalk.red('red') + '. Please run ' + Chalk.cyan('"npm install && bower install"') + 'to install missing dependencies');
      cb();
    }
  });
  checkdeps({
    packageManager: 'bower',
    verbose: true,
    checkGitUrls: true
  }, function() {
    if (--count<=0) {
      console.log('If you see any version number in ' + Chalk.red('red') + '. Please run ' + Chalk.cyan('"npm install && bower install"') + 'to install missing dependencies');
      cb();
    }
  });
});

// distribute
// =====================================

gulp.task('make-dist-mac', gulpSequence('rename-electron-mac', 'copy-app-dist', 'flatten-modules'));

gulp.task('make-dist-win', gulpSequence('rename-electron-win', 'copy-app-dist', 'flatten-modules'));

gulp.task('copy-app-dist', function() {
  var destPath = process.platform === 'win32' ? 'dist/resources/app' : 'dist/<%= projectName %>.app/Contents/Resources/app';
  var src = [
    'License.md',
    'apidocs/**/*',
    'app.js',
    'bower.json',
    'bower_components/**/*',
    'builtin/**/*',
    'dashboard/**/*',
    'docs/**/*',
    'editor/**/*',
    'package.json',
    'share/**/*',
    'test/**/*',
  ];

  pjson.hosts.forEach(function ( path ) {
    var name = Path.basename(path);
    src.push(name + '/**/*');
  });

  var moduleDeps = Object.keys(pjson.dependencies);
  src = src.concat(moduleDeps.map(function(module) {
    return Path.join('node_modules', module, '**/*');
  }));

  return gulp.src(src, {base: './'})
    .pipe(gulp.dest(destPath));
});

gulp.task('flatten-modules', function() {
  var appLoc = process.platform === 'win32' ? 'dist/resources/app' : 'dist/<%= projectName %>.app/Contents/Resources/app';
  var flatten = require('flatten-packages');
  flatten(appLoc, {}, function (err, res) {
    if (err) {
      console.error(err);
    }

    if (res) {
      return console.log(res);
    }
  });
});
