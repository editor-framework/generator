var Async = require('async');
var Fs = require('fire-fs');
var Path = require('path');

var git = require('./utils/libs/git.js');
var pjson = require('./package.json');

if ( !pjson.packages ) {
  return;
}

Fs.ensureDirSync('packages');
var infos = [];
for ( var p in pjson.packages ) {
  infos.push({ path: p, branch: pjson.packages[p] });
}

Async.eachLimit( infos, 5, function ( info, done ) {
  var name = Path.basename(info.path);

  // if not exists, git clone it
  if (!Fs.existsSync(Path.join('packages', name))) {
    git.clone('https://github.com/' + info.path + '.git',
              Path.join('packages', name),
              done);
    return;
  }

  // update by git pull
  var branch = info.branch || 'master';
  git.pull(Path.join('packages', name),
           'https://github.com/' + info.path + '.git',
           branch,
           done);
}, function ( err ) {
  if ( err ) {
    console.log(err);
    return;
  }

  console.log('Builtin packages update complete!');
});
