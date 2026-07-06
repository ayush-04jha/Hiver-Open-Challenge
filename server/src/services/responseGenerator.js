const { spawn } = require('child_process');
const path = require('path');

async function generateResponse(email, contract) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../ai_services/response_generator.py');
    const pythonExecutable = path.join(__dirname, '../../ai_services/venv/Scripts/python.exe');
    const contractJson = JSON.stringify(contract);
    
    const pythonProcess = spawn(pythonExecutable, [pythonScript, email, contractJson]);
    
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
      
      resolve(output.trim());
    });
  });
}

module.exports = { generateResponse };
