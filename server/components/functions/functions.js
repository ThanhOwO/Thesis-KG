const { spawn } = require('child_process');
const { vietnameseDiacritics } = require('../libs/libs');

function containsVietnameseDiacritics(text) {
    for (const diacritic of vietnameseDiacritics) {
        if (text.includes(diacritic)) {
            return true;
        }
    }
    return false;
}

async function executeNER(inputText) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['ner.py', inputText]);

        let result = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const entities = JSON.parse(result);
                    resolve(entities);
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error(`Python script exited with code ${code}`));
            }
        });
    });
}

module.exports = {
    containsVietnameseDiacritics,
    executeNER
};
