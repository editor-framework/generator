'use strict';

var Fs = require('fs');

function setupMirror(cb) {
  var hasMirrorSetting = false;
  var hasSettingFile = false;
  if ( Fs.existsSync('local-setting.json') ) {
    try {
      var jsonObj = JSON.parse(Fs.readFileSync('local-setting.json'));
      if (jsonObj.mirror) {
        return cb();
      } else {
        hasMirrorSetting = false;
        hasSettingFile = true;
      }
    }
    catch (err) {
      hasMirrorSetting = false;
      hasSettingFile = false;
    }
  } else {
    hasMirrorSetting = false;
    hasSettingFile = false;
  }

  //
  if ( hasMirrorSetting ) {
    cb();
    return;
  }

  var obj = {
    mirror: 'global'
  };
  if ( hasSettingFile ) {
    obj = JSON.parse(Fs.readFileSync('local-setting.json'));
  }
  Fs.writeFileSync('local-setting.json', JSON.stringify(obj, null, '  '));

  cb();

  // DISABLE:
  // var readline = require('readline');
  // var rl = readline.createInterface({
  //   input: process.stdin,
  //   output: process.stdout
  // });
  // rl.question('Do you want to use mirror in China to download Electron and other dependencies? (y/n) : ', function(answer) {
  //   var obj = {mirror: ''};
  //   if ( hasSettingFile ) {
  //     obj = JSON.parse(Fs.readFileSync('local-setting.json'));
  //   }

  //   obj.mirror = 'global';
  //   if ( answer === 'y' ) {
  //     obj.mirror = 'china';
  //   }

  //   Fs.writeFileSync('local-setting.json', JSON.stringify(obj, null, '  '));
  //   rl.close();

  //   cb();
  //   return;
  // });
}

module.exports = setupMirror;
