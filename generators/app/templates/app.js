'use strict';

const Path = require('fire-path');

//
global.__app = {
  initCommander ( commander ) {
    // EXAMPLE:
    commander
      .usage('[options] <project-path>')
      .option('--require-login', 'Require login in dev mode.')
      ;
  },

  init ( options, cb ) {
    // EXAMPLE:
    // let projectPath;
    // if ( options.args.length > 0 ) {
    //   projectPath = options.args[0];
    // }

    // register package path: ~/.your-app/packages/
    Editor.registerPackagePath( Path.join(Editor.appHome, 'packages') );

    if ( cb ) cb ();
  },

  run () {
    // create main window
    let mainWin = new Editor.Window('main', {
      'title': 'Editor Framework',
      'width': 900,
      'height': 700,
      'min-width': 900,
      'min-height': 700,
      'show': false,
      'resizable': true,
    });
    Editor.mainWindow = mainWin;

    // restore window size and position
    mainWin.restorePositionAndSize();

    // load and show main window
    mainWin.show();

    // page-level test case
    mainWin.load( 'app://index.html' );

    // open dev tools if needed
    if ( Editor.showDevtools ) {
      // NOTE: open dev-tools before did-finish-load will make it insert an unused <style> in page-level
      mainWin.nativeWin.webContents.once('did-finish-load', function () {
        mainWin.openDevTools({ detach: true });
      });
    }
    mainWin.focus();
  },

  load () {
    // TODO:
  },

  unload () {
    // TODO:
  },

  // EXAMPLE: a core-level ipc message
  // 'app:say-hello': function () {
  //   console.log('hello editor-framework');
  // },
};

require('./editor-framework/init');

