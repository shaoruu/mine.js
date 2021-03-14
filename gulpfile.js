const bs = require('browser-sync').create(); // create a browser sync instance.
const gulp = require('gulp');

function serveSimple(filepath) {
  bs.init({
    watch: true,
    notify: false,
    server: {
      baseDir: [filepath, './dist'], //added multiple directories
    },
    files: [filepath, 'dist'],
  });
}

gulp.task('dev', function () {
  serveSimple('./examples/dev');
});

gulp.task('classic', function () {
  serveSimple('./examples/classic');
});
