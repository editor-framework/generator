'use strict';

const electron = require('electron');
const spawn = require('child_process').spawn;

let args = [
  './',
].concat(process.argv.slice(2));

let app = spawn(electron, args, {
  stdio: 'inherit'
});

app.on('close', () => {
  // User closed the app. Kill the host process.
  process.exit();
});
