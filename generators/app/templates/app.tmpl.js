'use strict';

const Editor = require('editor-framework');

//
Editor.App.extend({
  init ( opts, cb ) {
    Editor.init({
      'package-search-path': [
        'app://packages/',
      ],
      'panel-window': 'app://window.html',
    });

    cb ();
  },

  run () {
    // create main window
    Editor.run('app://index.html', {
      title: '<%= projectName %>',
      width: 900,
      height: 700,
      minWidth: 900,
      minHeight: 700,
      show: false,
      resizable: true,
    });
  },
});
