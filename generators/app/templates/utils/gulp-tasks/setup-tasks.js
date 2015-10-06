var Fs = require('fire-fs');
var Path = require('fire-path');
var gulp = require('gulp');

var pjson = require('../../package.json');
var setupMirror = require('../libs/setup-mirror');

function _setupBranchAt ( localJson, group ) {
  if ( !localJson.branch[group] ) {
    localJson.branch[group] = {};
  }

  var localGroup = localJson.branch[group];
  var list = pjson[group] || [];
  var i, name, nameInPjson;

  for ( i = 0; i < list.length; ++i ) {
    name = Path.basename(list[i]);
    if ( !localGroup[name] ) {
      localGroup[name] = 'master';
    }
  }

  for ( name in localGroup ) {
    var found = false;

    for ( i = 0; i < list.length; ++i ) {
      nameInPjson = Path.basename(list[i]);
      if ( name === nameInPjson ) {
        found = true;
        break;
      }
    }

    if ( !found ) {
      delete localGroup[name];
    }
  }
}

gulp.task('setup-mirror', function(cb) {
  setupMirror(cb);
});

gulp.task('setup-branch', function(cb) {
  var localJson = {};

  if ( Fs.existsSync('local-setting.json') ) {
    try {
      localJson = JSON.parse(Fs.readFileSync('local-setting.json'));
    } catch (err) {
      console.log( 'Failed to load local-settings.json, %s', err.message );
    }
  }

  if ( !localJson.branch ) {
    localJson.branch = {};
  }

  // hosts
  _setupBranchAt( localJson, 'hosts' );
  _setupBranchAt( localJson, 'builtins' );

  //
  Fs.writeFileSync('local-setting.json', JSON.stringify(localJson, null, '  '));
  console.log('Setup submodule branch local setting. You can change "local-setting.json" to specify your branches.');

  cb();
});
