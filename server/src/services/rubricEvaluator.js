const { spawn } = require('child_process');
const path = require('path');

async function evaluateResponse(email, contract, response) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../ai_services/rubric_evaluator.py');
    const pythonExecutable = path.join(__dirname, '../../ai_services/venv/Scripts/python.exe');
    const contractJson = JSON.stringify(contract);
    
    const pythonProcess = spawn(pythonExecutable, [pythonScript, email, contractJson, response]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
        return;
      }
      
      try {
        const evaluation = JSON.parse(output.trim());
        resolve(evaluation);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });
  });
}

module.exports = { evaluateResponse };
