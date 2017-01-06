// ------------------------------------ //
// INCLUDES
// ------------------------------------ //

// Base and utilities
const gulp = require('gulp');
const gutil = require('gulp-util');
const size = require('gulp-size');

// Misc
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const notify = require('gulp-notify');
const browserSync = require('browser-sync');

// JS
const browserify = require('browserify');
const babelify = require('babelify');
const watchify = require('watchify');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

// CSS
const autoprefixer = require('autoprefixer');
const cleanCss = require('gulp-clean-css');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');

// ------------------------------------ //
// PATHS
// ------------------------------------ //

const paths = {
  scripts: {
    input: 'assets/js/main.js',
    output: 'assets/build/js',
    dist: 'assets/build/js/dist',
  },
  styles: {
    base: 'assets/sass',
    input: 'assets/sass/main.scss',
    output: 'assets/build/css',
    dist: 'assets/build/css/dist',
  },
};

// ------------------------------------ //
// BROWSERSYNC
// ------------------------------------ //

const reload = browserSync.reload;

gulp.task('browser-sync', () => {
  browserSync({
    proxy: 'jupe-by-jackie.dev',
    browser: 'google chrome',
  });
});

// ------------------------------------ //
// ERROR HANDLER
// ------------------------------------ //

const handleErrors = function() {
  const args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>',
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
};

// ------------------------------------ //
// STYLES
// ------------------------------------ //

gulp.task('styles', () => {
  const processors = [
    autoprefixer({ browsers: ['last 2 versions'] }),
  ];

gulp.src(paths.styles.input)
  .pipe(sourcemaps.init())
  .pipe(sass())
  .on('error', handleErrors)
  .pipe(postcss(processors))
  .pipe(sourcemaps.write())
  .pipe(rename('style.css'))
  .pipe(gulp.dest(paths.styles.output))
  .pipe(rename('style.min.css'))
  .pipe(cleanCss({ compatibility: 'ie10' }))
  .pipe(gulp.dest(paths.styles.dist))
  .pipe(size({ showFiles: true }))
  .pipe(reload({ stream: true }));
});

// ------------------------------------ //
// SCRIPTS
// ------------------------------------ //

function buildScript(file, watch) {
  const props = {
    entries: [file],
    debug: true,
    transform: [babelify.configure({ presets: ['es2015', 'react'] })],
  };

  // watchify() if watch requested, otherwise run browserify() once
  const bundler = watch ? watchify(browserify(props)) : browserify(props);

  function rebundle() {
    const stream = bundler.bundle();
    return stream
      .on('error', handleErrors)
      .pipe(source(file))
      .pipe(rename('app.js'))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(paths.scripts.output))
      .pipe(buffer()) // Convert stream to buffer for gulp-uglify
      .pipe(uglify())
      .pipe(rename('app.min.js'))
      .pipe(gulp.dest(paths.scripts.dist))
      .pipe(size({ showFiles: true }))
      .pipe(reload({ stream: true }));
  }

  // listen for an update and run rebundle
  bundler.on('update', () => {
    rebundle();
  gutil.log('Rebundle...');
});

  // run it once the first time buildScript is called
  return rebundle();
}

// this will run once because we set watch to false
gulp.task('scripts', () => buildScript(paths.scripts.input, false));

// ------------------------------------ //
// DEFAULT TASK
// ------------------------------------ //

// run tasks first, then watch for changes
gulp.task('default', ['scripts', 'styles', 'browser-sync'], () => {
  // watch for CSS changes
  gulp.watch(`${paths.styles.base}/**/*`, ['styles']);
// browserify watch for JS changes
return buildScript(paths.scripts.input, true);
});