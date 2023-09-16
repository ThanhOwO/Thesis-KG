const express = require('express');
const translate = require('translate-google');
const { containsVietnameseDiacritics, executeNER } = require('../functions/functions');

const router = express.Router();

router.post('/translate', async (req, res) => {
    const { text } = req.body;

    const containsVietnamese = containsVietnameseDiacritics(text);

    if (containsVietnamese) {
        try {
            const translation = await translate(text, { from: 'vi', to: 'en' });
            res.json({ translatedText: translation });
        } catch (error) {
            console.error('Error translating text:', error);
            res.status(500).json({ error: 'An error occurred' });
        }
    } else {
        res.json({ translatedText: text });
    }
});

router.post('/ner', (req, res) => {
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

module.exports = router;
