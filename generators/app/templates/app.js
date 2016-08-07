'use strict';

const Editor = require('editor-framework');

//
Editor.App.extend({
  init ( opts, cb ) {
    Editor.init({
      'profile': {
        local: Editor.url('app://.settings'),
      },
      'package-search-path': [
        Editor.url('app://packages/'),
      ],
      'panel-window': 'app://window.html',
    });

    if ( cb ) {
      cb ();
    }
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
});
