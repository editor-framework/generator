var Yeoman = require('yeoman-generator');
var Chalk = require('chalk');
var Yosay = require('yosay');
var _ = require('lodash');

module.exports = Yeoman.generators.Base.extend({
  constructor: function () {
    Yeoman.generators.Base.apply(this,arguments);

    this.argument('projectName', { type: String, required: false, desc: 'The project name' });
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(Yosay(
      'Welcome to the posh ' + Chalk.red('editor-framework') + ' generator!'
    ));

    var prompts = [];

    // projectName
    if ( !this.projectName ) {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: 'Your project name',
        default: this.appname,
      });
    }

    // repo
    prompts.push({
      type: 'input',
      name: 'repo',
      message: 'Your repo path',
      default: 'org-name/' + this.appname,
    });

    this.prompt(prompts, function (answers) {
      if ( answers.projectName ) {
        this.projectName = answers.projectName;
      }

      this.templateData = {
        projectName: this.projectName,
        projectCodeName: _.kebabCase(this.projectName),
        repo: answers.repo,
      };

      done();
    }.bind(this));
  },

  writing: {
    app: function () {
      this.template('_package.json', 'package.json', this.templateData);
      this.template('_bower.json', 'bower.json', this.templateData);
      this.template('gulpfile.js', 'gulpfile.js', this.templateData);
      this.copy('app.js', 'app.js');
    },

    utils: function () {
      this.template('utils/rm-settings.sh', 'utils/rm-settings.sh', this.templateData);

      this.template('utils/gulp-tasks/electron-tasks.js', 'utils/gulp-tasks/electron-tasks.js', this.templateData);
      this.copy('utils/gulp-tasks/setup-tasks.js', 'utils/gulp-tasks/setup-tasks.js');

      this.copy('utils/libs/check-deps.js', 'utils/libs/check-deps.js');
      this.copy('utils/libs/git.js', 'utils/libs/git.js');
      this.copy('utils/libs/setup-mirror.js', 'utils/libs/setup-mirror.js');

      this.copy('utils/git-commit.sh', 'utils/git-commit.sh');
      this.copy('utils/git-pull.sh', 'utils/git-pull.sh');
      this.copy('utils/git-push.sh', 'utils/git-push.sh');
      this.copy('utils/git-status.sh', 'utils/git-status.sh');
      this.copy('utils/pre-install-npm.js', 'utils/pre-install-npm.js');
      this.copy('utils/run-tests.js', 'utils/run-tests.js');
    },

    config: function () {
      this.copy('config/gitignore', '.gitignore');
      this.copy('config/jshintrc', '.jshintrc');
      this.copy('config/editorconfig', '.editorconfig');
    },

    // DISABLE
    // gitrepo: function () {
    //   var done = this.async();
    //   this.spawnCommand('git', [
    //     'clone',
    //     'git@github.com:fireball-x/editor-framework.git',
    //     'editor-framework'
    //   ], function() {
    //     done();
    //   });
    // },
  },

  install: function () {
    this.installDependencies();
  }
});
