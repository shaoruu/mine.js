const bs = require('browser-sync').create(); // create a browser sync instance.
const gulp = require('gulp');

gulp.task('dev', function () {
  bs.init({
    watch: true,
    notify: false,
    server: {
      baseDir: ['./public'], //added multiple directories
    },
    files: ['./public'],
    ui: false,
  });
});
