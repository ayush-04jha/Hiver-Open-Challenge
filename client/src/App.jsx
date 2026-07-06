import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyzeEmail = async () => {
    if (!email.trim()) {
      setError('Please enter an email');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/api/analyze', { email });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Email Response Generator</h1>
      <p className="subtitle">Generate and evaluate customer support responses</p>

      <div className="input-section">
        <textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter customer email..."
          className="email-input"
          rows={6}
        />
        <button 
          onClick={analyzeEmail} 
          disabled={loading}
          className="analyze-button"
        >
          {loading ? 'Analyzing...' : 'Analyze Email'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="results-section">
          <div className="overall-score">
            <h2>Overall Quality Score: {result.qualityScore}/100</h2>
          </div>

          <div className="result-block">
            <h3>Generated Response</h3>
            <p className="response-text">{result.generatedResponse}</p>
          </div>

          <div className="metrics-section">
            <div className="metric">
              <h4>Issue Coverage: {result.evaluation.issueCoverage.score}/10</h4>
              <p>{result.evaluation.issueCoverage.reason}</p>
            </div>

            <div className="metric">
              <h4>Grounding: {result.evaluation.grounding.score}/10</h4>
              <p>{result.evaluation.grounding.reason}</p>
            </div>

            <div className="metric">
              <h4>Actionability: {result.evaluation.actionability.score}/10</h4>
              <p>{result.evaluation.actionability.reason}</p>
            </div>

            <div className="metric">
              <h4>Tone & Clarity: {result.evaluation.toneClarity.score}/10</h4>
              <p>{result.evaluation.toneClarity.reason}</p>
            </div>
          </div>

          <div className="contract-section">
            <h3>Extracted Contract</h3>
            <div className="contract-details">
              <p><strong>Intent:</strong> {result.contract.intent}</p>
              <p><strong>Customer Needs:</strong></p>
              <ul>
                {result.contract.customerNeeds.map((need, i) => (
                  <li key={i}>{need}</li>
                ))}
              </ul>
              <p><strong>Required Points:</strong></p>
              <ul>
                {result.contract.requiredPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
              <p><strong>Forbidden Claims:</strong></p>
              <ul>
                {result.contract.forbiddenClaims.map((claim, i) => (
                  <li key={i}>{claim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
