const { spawn, exec } = require('child_process');
const { vietnameseDiacritics } = require('../libs/libs');

function containsVietnameseDiacritics(text) {
    if(text) {
        for (const diacritic of vietnameseDiacritics) {
            if (text.includes(diacritic)) {
                return true;
            }
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

async function executeFactCheck(urls, keywords, callback) {
  const pythonScriptPath = 'factChecking.py';

  let urlsString = urls;
  let keywordsString = keywords;

  if (Array.isArray(urls)) {
    urlsString = urls.join(',');
  }

  if (Array.isArray(keywords)) {
    keywordsString = keywords.join(',');
  }

  const command = `python ${pythonScriptPath} ${urlsString} ${keywordsString}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      callback(error, null);
    } else {
      const extractedInformation = JSON.parse(stdout);
      callback(null, extractedInformation);
    }
  });
}

module.exports = {
    containsVietnameseDiacritics,
    executeNER,
    executeFactCheck
};
