require('dotenv').config();
const express = require('express');
const cors = require('cors');
const analyzeRoutes = require('./routes/analyze.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', analyzeRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AI Email Response Generator & Evaluation System' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
