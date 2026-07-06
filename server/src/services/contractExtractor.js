const { spawn } = require('child_process');
const path = require('path');

async function extractContract(email) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../ai_services/contract_extractor.py');
    const pythonExecutable = path.join(__dirname, '../../ai_services/venv/Scripts/python.exe');
    
    const pythonProcess = spawn(pythonExecutable, [pythonScript, email]);
    
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
        const contract = JSON.parse(output.trim());
        resolve(contract);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });
  });
}

module.exports = { extractContract };
