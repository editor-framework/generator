## Prerequisite

- Install [node.js v0.12+](https://nodejs.org/) or [io.js v2.0+](https://iojs.org/en/index.html)
- Install [gulp](https://github.com/gulpjs/gulp) command line tool
- Install [bower](http://bower.io/) command line tool

For **Windows** user, you need the following environment set up to be able to build nodejs native modules:

- [node-gyp](https://github.com/TooTallNate/node-gyp)
- [Visual Studio Community 2013](http://www.visualstudio.com/products/visual-studio-community-vs)
- [Python 2.7](http://www.python.org/download/releases/2.7/) - make sure you can run `python --verson` in your command line tool. Read [this](https://docs.python.org/2/using/windows.html#excursus-setting-environment-variables) for setting up path correctly.

## Install

In cloned project folder, run the following command to setup dev environment:

```bash
# Initialize gulp task dependencies
# npm is a builtin CLI when you install Node.js
npm install
```

This is all you have to do to set <%= projectName %> development environment.

### Run Tasks Manually

Behind the scene, npm install script will run a series of gulp tasks. If anything goes wrong during the bootstrap process, you can manually run these commands to get back on track:

```bash
# Install hosts
gulp install-hosts

# Install builtin packages
gulp install-builtin

# Install fireshell(electron)
gulp update-electron

# rebuild npm native modules for Electron
gulp npm-rebuild

# Install bower packages
bower install
```

### Choose Electron Download Mirror

Download Electron can take time, especially when you're on the wrong side of wall. We use [electron-prebuilt](https://github.com/mafintosh/electron-prebuilt) for Electron binary download. You can choose if you want to use the china mirror during `gulp update-electron` task.

The first time you run this task (this task is included in `npm install` process), you'll be asked if you want to use China mirror for Electron downloading. A json file `mirror-setting.json` will be created to record your choice, like this:

```js
// local-setting.json
{
    "mirror": "china" // this value can be 'china' or 'global'
                      // depending on your answer
}
```

You can change this file anytime to choose mirror for Electron downloading again.

## Run

Here are ways to run <%= projectName %> development version:

```bash
# Run <%= projectName %>
gulp run

# Open <%= projectName %> project
gulp <%= projectName %> --path path/to/project
```
## Update

To get the latest <%= projectName %> build:

```bash
# Update <%= projectName %> from github repo,
# also update builtin packages and electron binary
# this command will also check dependencies
# and report outdated or missing dependencies
gulp update

# If you want to update all dependencies
# this command will bootstrap and update the whole project and takes long
npm install

# or if you just want to quickly install a missing package:
# please use the semver reported at the end of `gulp update` dependency check
npm install some-npm-package@x.x.x

# If you only want to update bower dependencies
bower install
```

## Test

```bash
# Run all tests
npm test

# Run a single test
npm run test -- <testfile...>

# Run test in submodule
npm run test -- editor-framework/test/<testfile...>

# Run All test of a submodule
npm run test -- editor-framework
```

All test files are located in [test](/test/) folder or submodule's `test/` folder.

## API Docs

```bash
# Generate and preview API docs
npm run gendoc
```

## Feedback & Contribution

- Join our [community on slack](https://<%= projectName %>-slack.herokuapp.com), then access with http://<%= projectName %>.slack.com/
- If you have questions about a specific page of documentation, use the disqus sidebar on the left of [<%= projectName %> Documentation Site](http://docs.<%= projectName %>.com).
- If you have any suggestion/feedback/problem, feel free to [submit an issue](https://github.com/<%= repo %>/issues).
- If you want to contribute to this project, please read [Contributing Guidelines](https://github.com/<%= repo %>/blob/master/CONTRIBUTING.md).

## Trouble Shooting

### [Windows] error MSB4025: Could not load project file. Invalid character in coding provided.

This error is due to non-ascii character in your home path, please check this guide to [rename user profile](http://superuser.com/questions/495290/how-to-rename-user-folder-in-windows-8).

### Error: Permission denied (publickey)

Usually this is due to incorrect setup of ssh key. Please troubleshoot with this guide: https://help.github.com/articles/error-permission-denied-publickey/#platform-linux

