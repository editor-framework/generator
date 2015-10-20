'use strict';

require('./editor-framework');
const Path = require('fire-path');

//
Editor.App.extend({
  beforeInit ( commander ) {
    // EXAMPLE:
    commander
      .usage('[options] <file>')
      .option('--foobar', 'A foobar option.')
      .command('foobar', 'A foobar command').action(() => {
        console.log('hello foobar!');
        process.exit(1);
      })
      ;
  },

  init ( options, cb ) {
    // EXAMPLE:
    // let projectPath;
    // if ( options.args.length > 0 ) {
    //   projectPath = options.args[0];
    // }

    // register package path: ~/.your-app/packages/
    Editor.registerPackagePath( Path.join(Editor.App.home, 'packages') );

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
});
