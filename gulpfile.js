const bs = require('browser-sync').create(); // create a browser sync instance.
const gulp = require('gulp');

gulp.task('dev', function () {
  bs.init({
    watch: true,
    notify: false,
    server: {
      baseDir: ['./public'], //added multiple directories
      routes: {
        '/biomes': 'public/index.html',
        '/game': 'public/index.html',
      },
    },
    files: ['./public'],
    ui: false,
  });
});
