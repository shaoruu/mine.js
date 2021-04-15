import express from 'express';
import cors from 'cors';
import gulp from 'gulp';

require('../gulpfile');

const app = express();
const port = parseInt(process.env.PORT, 10) || 4000;

const isProduction = 'production' === process.env.NODE_ENV;

app.use(cors());

if (isProduction) {
  app.use(express.static('public'));
}

let isHosted = false;
app.listen(port, () => {
  if (!isProduction && !isHosted) {
    gulp.task('dev')();
    isHosted = true;
  }
});
