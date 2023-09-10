const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/ner', (req, res) => {
    const text = req.body.text;
    executeNER(text)
        .then((entities) => {
            res.json(entities);
        })
        .catch((error) => {
            console.error('Error in NER execution:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

function executeNER(inputText) {
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

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
