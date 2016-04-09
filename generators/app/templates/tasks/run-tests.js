'use strict';

const path = require('path');
const chalk = require('chalk');
const async = require('async');

const electron = require('electron-prebuilt');
const globby = require('globby');
const spawn = require('child_process').spawn;

// get cwd
let cwd = process.cwd();

// get main files
let mainTests = globby.sync([
  'main/**/*.js', 'share/**/*.js', '!**/*.skip.js'
], { cwd: './test', realpath: true });

// get renderer files
let rendererTests = globby.sync([
  'renderer/**/*.js', 'share/**/*.js', '!**/*.skip.js'
], { cwd: './test', realpath: true });

// process tests
let failedTests = [];
async.eachSeries([
  { files: mainTests, renderer: false },
  { files: rendererTests, renderer: true },
], (info, next) => {
  async.eachSeries(info.files, (file, done) => {
    console.log( chalk.magenta('Start test: ') + chalk.cyan( path.relative(cwd, file) ) );

    let args = [];
    if ( info.renderer ) {
      args = ['./test', 'test', '--renderer', '--reporter', 'spec', file];
    } else {
      args = ['./test', 'test', '--reporter', 'spec', file];
    }

    let app = spawn(electron, args, {
      stdio: [ 0, 1, 2, 'ipc' ]
    });

    app.on('message', data => {
      if ( data.channel === 'process:end' ) {
        if ( data.failures > 0 ) {
          failedTests.push(data.path);
        }
      }
    });

    app.on('exit', () => {
      done();
    });

  }, next );
}, err => {
  if (err) {
    throw err;
  }

  if ( !failedTests.length ) {
    console.log(chalk.green('================================='));
    console.log(chalk.green('All tests passed, Congratulations! '));
    console.log(chalk.green('================================='));
    return;
  }

  console.log(chalk.red('================================='));
  console.log(chalk.red(`${failedTests.length} failes: `));
  console.log(chalk.red('================================='));

  failedTests.forEach(file => {
    // SpawnSync(
    //   exePath,
    //   [cwd, '--test', file, '--reporter', 'spec'],
    //   {stdio: 'inherit'}
    // );
    console.log(chalk.red(` - ${file}`));
  });

  throw new Error(`${failedTests.length} test(s) faield.`);
});
