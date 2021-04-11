import express from 'express';
import path from 'path';
import chalk from 'chalk';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

app.use(express.static('public'));
app.get('*', (_, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀  Server is up at ${chalk.green(`http://localhost:${port}`)}`);
});
