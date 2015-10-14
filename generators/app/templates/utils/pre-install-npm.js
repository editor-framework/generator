'use strict';

var Fs = require('fs');
var Npmconf = require('npmconf');

var setupMirror = require('./libs/setup-mirror');

setupMirror(function() {
  var mirror = JSON.parse(Fs.readFileSync('local-setting.json')).mirror;
  Npmconf.load(function(_, conf) {
    var registry = Npmconf.defaults.registry;
    if (mirror === 'china') {
      registry = 'http://registry.npm.taobao.org/';
    }
    conf.set('registry', registry, 'user');
    conf.save('user', function (err) {
      // foo = bar is now saved to ~/.npmrc or wherever
      if (err) {
        throw err;
      }
    });
  });
});
