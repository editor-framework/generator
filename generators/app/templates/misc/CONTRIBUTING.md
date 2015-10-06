# Contributing to Fireball

First off, thanks for taking the time to contribute!

The following is a set of guidelines for contributing to Fireball and its packages.

## Coding Style Guide

### General

- Fireball recommend a tab size of **4** spaces.
- use dash naming rules for files and folders ( e.g. `foo-bar` )
- use camelCase naming rules for module methods and properties ( e.g. `fooBar` )
- use CamelCase naming rules for modules ( e.g. `FooBar` )
- use upper-case for the first character of required module ( e.g. `var Foo = require('foo')` )
- use `_` prefix for private method or variables ( e.g. `var _foobar = 'FooBar'` )

### Editor, Plugins and Editor-Framework

- Recommend Ipc message in the form of `module-name:ipc-channel-name` ( e.g. `foo-bar:say-hello`)
- Recommend DOM event in Polymer in the form of `_onMyEvent` ( e.g. `<foobar on-click="_onClick" />`)

## Submitting Issues

* Include the version of Fireball you are using and the OS.
* Include screenshots and animated GIFs whenever possible; they are immensely
  helpful.
* Check the dev tools (`alt-cmd-i`) for errors to include. If the dev tools
  are open _before_ the error is triggered, a full stack trace for the error
  will be logged. If you can reproduce the error, use this approach to get the
  full stack trace and include it in the issue.
* On Mac, check Console.app for stack traces to include if reporting a crash.
* Perform a cursory search to see if a similar issue has already been submitted.
* Please setup a [profile picture](https://help.github.com/articles/how-do-i-set-up-my-profile-picture)
  to make yourself recognizable and so we can all get to know each other better.

## Pull Requests

* Include screenshots and animated GIFs in your pull request whenever possible.
* [JavaScript](https://github.com/styleguide/javascript), and [CSS](https://github.com/styleguide/css) styleguides.
* Include thoughtfully-worded, well-structured [Mocha](mochajs.org) specs. See [Editor-Framework tests](https://github.com/fireball-x/editor-framework/tree/master/test) for example.
* Document new code with comments in source code based on the [Firedoc User Guide](https://github.com/fireball-x/firedoc/blob/master/GUIDE.md)
* End files with a newline.
* Place requires in the following order:
    * Built in Node Modules (such as `path`)
    * Built in Fireball and Electron Modules (such as `fire-fs`, `shell`)
    * Local Modules (using relative paths)
* Place class properties in the following order:
    * Class methods and properties (methods starting with a `@`)
    * Instance methods and properties
* Avoid platform-dependent code:
    * Use `require('atom').fs.getHomeDirectory()` to get the home directory.
    * Use `path.join()` to concatenate filenames.
    * Use `os.tmpdir()` rather than `/tmp` when you need to reference the
      temporary directory.
* Using a plain `return` when returning explicitly at the end of a function.
    * Not `return null`, `return undefined`, `null`, or `undefined`

## Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally
* Consider starting the commit message with an applicable emoji:
    * :art: `:art:` when improving the format/structure of the code
    * :racehorse: `:racehorse:` when improving performance
    * :non-potable_water: `:non-potable_water:` when plugging memory leaks
    * :memo: `:memo:` when writing docs
    * :penguin: `:penguin:` when fixing something on Linux
    * :apple: `:apple:` when fixing something on Mac OS
    * :checkered_flag: `:checkered_flag:` when fixing something on Windows
    * :bug: `:bug:` when fixing a bug
    * :fire: `:fire:` when removing code or files
    * :green_heart: `:green_heart:` when fixing the CI build
    * :white_check_mark: `:white_check_mark:` when adding tests
    * :lock: `:lock:` when dealing with security
    * :arrow_up: `:arrow_up:` when upgrading dependencies
    * :arrow_down: `:arrow_down:` when downgrading dependencies
    * :shirt: `:shirt:` when removing linter warnings


## Documentation Styleguide

* Use [Firedoc](https://github.com/fireball-x/firedoc).
* Use [Markdown](https://daringfireball.net/projects/markdown).
