'use strict';

var Path = require('path');
var Fs = require('fire-fs');

var gulp = require('gulp');

var spawn = require('child_process').spawn;
var pjson = require('../../package.json');

var cacheDir = Path.join(require('os').tmpDir(), '<%= projectName %>-cache');
var appLoc = process.platform === 'win32' ? 'dist/resources/app' : 'dist/<%= projectName %>.app/Contents/Resources/app';

gulp.task('clean-dist', function(cb) {
  var Del = require('del');
  Del('dist', {force: true}, cb);
});

gulp.task('clean-cache', function(cb) {
  var Del = require('del');
  Del(cacheDir, {force: true}, cb);
});

gulp.task('copy-to-cache', ['clean-cache'], function() {
  var pattern = [
    'app.js',
    'builtin/**/*',
    'editor/**/*',
    'share/**/*',
    'dashboard/**/*',
  ];

  pjson.hosts.forEach(function ( path ) {
    var name = Path.basename(path);
    pattern.push(name + '/**/*');
  });

  pattern = pattern.concat([
    '!**/test',
    '!**/tests',
    '!**/test/**/*',
    '!**/tests/**/*',
  ]);

  return gulp.src(pattern, {base: './'})
    .pipe(gulp.dest(cacheDir))
    ;
});

gulp.task('copy-electron-mac', function(cb) {
  Fs.ensureDirSync('dist');
  Fs.copy('bin/electron/Electron.app', 'dist/<%= projectName %>.app', function(err) {
    if (err) {
      return cb(err);
    }

    Fs.copy(
      'utils/res/atom.icns',
      'dist/<%= projectName %>.app/Contents/Resources/atom.icns',
      {clobber: true},
      cb
    );
  });
});

gulp.task('copy-electron-win', function(cb) {
  Fs.ensureDirSync('dist');
  Fs.copy('bin/electron', 'dist', function (err) {
    if (err) {
      return cb(err);
    }

    Fs.move('dist/electron.exe', 'dist/<%= projectName %>.exe', cb);
  });
});

gulp.task('rename-electron-win', ['copy-electron-win'], function(cb) {
  var rcedit = require('rcedit');
  rcedit('dist/<%= projectName %>.exe', {
    'product-version': pjson.version,
    'icon': 'utils/res/atom.ico'
  }, cb);
});

gulp.task('rename-electron-mac', ['copy-electron-mac'], function (cb) {
  var Plist = require('plist');
  var Async = require('async');

  var plistSrc = ['dist/<%= projectName %>.app/Contents/Info.plist', 'dist/<%= projectName %>.app/Contents/Frameworks/Electron Helper.app/Contents/Info.plist'];
  plistSrc.forEach(function(file) {
    var obj = Plist.parse(Fs.readFileSync(file, 'utf8'));
    obj.CFBundleDisplayName = '<%= projectName %>';
    obj.CFBundleIdentifier = 'com.<%= projectName %>.www';
    obj.CFBundleName = '<%= projectName %>';
    obj.CFBundleExecutable = '<%= projectName %>';
    Fs.writeFileSync(file, Plist.build(obj), 'utf8');
  });

  var renameSrc = [
    'dist/<%= projectName %>.app/Contents/MacOS/Electron',
    'dist/<%= projectName %>.app/Contents/Frameworks/Electron Helper EH.app',
    'dist/<%= projectName %>.app/Contents/Frameworks/Electron Helper NP.app',
    'dist/<%= projectName %>.app/Contents/Frameworks/Electron Helper.app',
    'dist/<%= projectName %>.app/Contents/Frameworks/<%= projectName %> Helper EH.app/Contents/MacOS/Electron Helper EH',
    'dist/<%= projectName %>.app/Contents/Frameworks/<%= projectName %> Helper NP.app/Contents/MacOS/Electron Helper NP',
    'dist/<%= projectName %>.app/Contents/Frameworks/<%= projectName %> Helper.app/Contents/MacOS/Electron Helper',
  ];

  Async.eachSeries( renameSrc, function ( file, done ) {
    Fs.move(file, file.replace(/Electron/, '<%= projectName %>'), done);
  }, cb);
});

gulp.task('copy-app-dist', function() {
  var pattern = [
    'License.md',
    'apidocs/**/*',
    'bower.json',
    'docs/**/*',
    'index.html',
    'package.json',
  ];

  return gulp.src(pattern, {base: './'})
    .pipe(gulp.dest(appLoc))
    ;
});

gulp.task('copy-src-dist', function() {
	return gulp.src('**/*', {cwd: cacheDir})
    .pipe(gulp.dest(appLoc))
    ;
});

gulp.task('npm-deps-dist', function(cb) {
  var Async = require('async');

  Async.series([
    // pre-install-npm
    function ( next ) {
      var child = spawn('node', ['./utils/pre-install-npm.js'], {
        stdio: 'inherit'
      });
      child.on('exit', next);
    },

    // npm install
    function ( next ) {
      var cmdStr = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      var child = spawn(cmdStr, ['install', '--production', '--ignore-scripts'], {
        cwd: appLoc,
        stdio: 'inherit'
      });
      console.log(appLoc);
      child.on('exit', next);
    },

  ], function (err) {
    cb(err);
  });
});

gulp.task('npm-rm-tests', function(cb) {
  var Del = require('del');
  Del([
    appLoc + '/node_modules/**/test',
    appLoc + '/node_modules/**/tests',
  ], cb);
});

gulp.task('bower-deps-dist', function(cb) {
  var cmdStr = process.platform === 'win32' ? 'bower.cmd' : 'bower';
  var child = spawn(cmdStr, ['install'], {
    cwd: appLoc,
    stdio: 'inherit'
  });

  child.on('exit', cb);
});
