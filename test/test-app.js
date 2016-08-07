'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

describe('editor-framework:app', function () {
  before(function (done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        projectName: 'Simple App',
        repo: 'simple/app',
        copyEntryFile: true,
      })
      .on('end', done);
  });

  it('creates files', function () {
    assert.file([
      'package.json',
      'app.js',
      'index.html',
      'window.html',

      // tasks
      'tasks/run-dev.js',
      'tasks/run-tests.js',
      'tasks/run.js',

      // utils
      'utils/libs/git.js',
      'utils/git-commit.sh',
      'utils/git-pull.sh',
      'utils/git-push.sh',
      'utils/git-status.sh',
      'utils/rm-settings.sh',

      // configs
      '.gitignore',
      '.editorconfig',
      '.eslint.json',

      // misc
      'CONTRIBUTING.md',
      'LICENSE.md',
      'README.md',
    ]);
  });

  it('should have the contents we expect', function () {
    assert.fileContent('package.json', '"name": "simple-app",');
    assert.fileContent('utils/rm-settings.sh', 'rm -rf ~/.simple-app/*');
  });
});
