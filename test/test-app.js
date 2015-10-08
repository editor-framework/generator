'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var os = require('os');

describe('editor-framework:app', function () {
  before(function (done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        projectName: 'Simple App',
        repo: 'simple/app',
      })
      .on('end', done);
  });

  it('creates files', function () {
    assert.file([
      'bower.json',
      'package.json',
      'gulpfile.js',
      'app.js',

      // utils
      'utils/gulp-tasks/electron-tasks.js',
      'utils/gulp-tasks/setup-tasks.js',

      'utils/libs/check-deps.js',
      'utils/libs/git.js',
      'utils/libs/setup-mirror.js',

      'utils/res/atom.icns',
      'utils/res/atom.ico',

      'utils/git-commit.sh',
      'utils/git-pull.sh',
      'utils/git-push.sh',
      'utils/git-status.sh',
      'utils/pre-install-npm.js',
      'utils/rm-settings.sh',
      'utils/run-tests.js',

      // configs
      '.gitignore',
      '.editorconfig',
      '.jshintrc',

      // misc
      'CONTRIBUTING.md',
      'LICENSE.md',
      'README.md',
    ]);
  });

  it('should have the contents we expect', function () {
    assert.fileContent('package.json', '"name": "Simple App",');
    assert.fileContent('bower.json', '"name": "Simple App",');
    assert.fileContent('gulpfile.js', 'gulp.task(\'simple-app\'');
    assert.fileContent('utils/rm-settings.sh', 'rm -rf ~/.simple-app/*');
  });
});
