import path from 'path';
import express from 'express';
import cors from 'cors';
import router from './routes/index';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client')));
app.use('/api', router);

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});

export default app;
