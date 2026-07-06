const { analyzeEmail } = require('../services/analyze.service');

async function analyzeController(req, res) {
  try {
    const { email } = req.body;
    
    const result = await analyzeEmail(email);
    
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { analyzeController };
