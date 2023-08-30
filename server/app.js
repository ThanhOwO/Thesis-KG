const express = require('express');
const cors = require('cors')
const translate = require('translate-google');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/translate', async (req, res) => {
    const { text } = req.body;
  
    try {
      const translation = await translate(text, { from: 'vi', to: 'en' });
      res.json({ translatedText: translation });
    } catch (error) {
      console.error('Error translating text:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Translation server is running on port ${PORT}`);
});
