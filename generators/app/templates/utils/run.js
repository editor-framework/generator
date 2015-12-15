'use strict';

var spawn = require('child_process').spawn;

var args = process.argv.slice(2);
var cmdStr = '';
var optArr = [];

if (process.platform === 'win32') {
  cmdStr = 'bin\\electron\\electron.exe';
  optArr = ['.\\', '--debug=3030', '--dev', '--show-devtools'].concat(args);
} else {
  cmdStr = 'bin/electron/Electron.app/Contents/MacOS/Electron';
  optArr = ['./', '--debug=3030', '--dev', '--show-devtools'].concat(args);
}

spawn(cmdStr, optArr, {
  stdio: 'inherit'
});
