'use strict';

var Path = require('path');
// var Chalk = require('chalk');

var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');

var cachePath = Path.join(require('os').tmpDir(), '<%= projectName %>-cache');

var paths = {
  js: [
    '**/*.js',
    '!**/*.min.js',
    '!**/test/**/*',
    '!**/tests/**/*',
  ],
  html: ['**/*.html'],
  css: ['**/*.css'],
};

// ==============================
// tasks
// ==============================

gulp.task('minify-source-in-cache', ['copy-to-cache'], gulpSequence(
  'minify-js',
  'minify-html',
  'minify-css'
));

// js
gulp.task('minify-js', function () {
  var uglify = require('gulp-uglify');
  var babel = require('gulp-babel');

  return gulp.src(paths.js, {cwd: cachePath})
  .pipe(babel())
  .pipe(uglify())
  .pipe(gulp.dest(cachePath))
  ;
});

// html
gulp.task('minify-html', function () {
  var htmlmin = require('gulp-htmlmin');

  return gulp.src(paths.html, {cwd: cachePath})
  .pipe(htmlmin({
    removeComments: true,
    removeScriptTypeAttributes: true,
    minifyJS: true,
    minifyCSS: true,
    collapseWhitespace: true,
    customAttrAssign: [ /\?=/, /\$=/ ],
  }))
  .pipe(gulp.dest(cachePath))
  ;
});

// css
gulp.task('minify-css', function () {
  var minifyCss = require('gulp-minify-css');

  return gulp.src(paths.css, {cwd: cachePath})
  .pipe(minifyCss())
  .pipe(gulp.dest(cachePath))
  ;
});
