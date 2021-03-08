const bs = require('browser-sync').create(); // create a browser sync instance.
const gulp = require('gulp');

gulp.task('serve', function () {
  bs.init({
    watch: true,
    notify: false,
    server: {
      baseDir: ['./examples/basic', './dist'], //added multiple directories
    },
    files: ['dist', 'examples/basic'],
  });
});
