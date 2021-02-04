const gulp = require('gulp');
const bs = require('browser-sync').create(); // create a browser sync instance.

gulp.task('serve', function () {
  bs.init({
    watch: true,
    server: {
      baseDir: ['./examples/basic', './dist'], //added multiple directories
    },
    files: '.',
  });
});
