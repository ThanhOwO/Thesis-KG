const express = require('express');
const translate = require('translate-google');
const neo4j = require('neo4j-driver');
const { containsVietnameseDiacritics, executeNER } = require('../functions/functions');


const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', '12345678')
  );
  
const router = express.Router();

//Translate Vietnamese text to English
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

//Call NER model
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

//Get all data from Neo4j
router.get('/all-neo4j', async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (food:Food)
        MATCH (location:Location)
        RETURN
          food.foodName AS foodName,
          food.image AS foodImage,
          food.sources AS foodSource,
          location.locationName AS locationName,
          location.country AS locationCountry
        LIMIT 10
      `);
  
      const defaultRelation = 'SPECIALTY_IN';
      const data = result.records.map(record => ({
        subject: {
          type: 'Food',
          name: record.get('foodName'),
          image: record.get('foodImage'),
          source: record.get('foodSource')
        },
        relation: defaultRelation,
        object: {
          type: 'Location',
          name: record.get('locationName'),
          country: record.get('locationCountry')
        }
      }));
  
      res.json(data);
    } catch (error) {
      console.error('Error fetching Neo4j triples:', error);
      res.status(500).json({ error: 'An error occurred' });
    } finally {
      await session.close();
    }
});

//Get data from Neo4j by subject and object
router.get('/neo4j', async (req, res) => {
  const { subject, object } = req.query;
  const session = driver.session();

  try {
    let cypherQuery;

    if (subject && object) {
      cypherQuery = `
        MATCH (food:Food)
        WHERE food.vieName = $subject OR food.engName = $subject
        MATCH (location:Location {lowerLocationName: $object})
        RETURN
          food.foodName AS foodName,
          food.image AS foodImage,
          food.sources AS foodSource,
          location.locationName AS locationName,
          location.country AS locationCountry
        LIMIT 10
      `;
    } else if (subject) {
      cypherQuery = `
        MATCH (food:Food)
        WHERE food.vieName = $subject OR food.engName = $subject
        MATCH (food)--(location:Location)
        RETURN
          food.foodName AS foodName,
          food.image AS foodImage,
          food.sources AS foodSource,
          location.locationName AS locationName,
          location.country AS locationCountry
        LIMIT 10
      `;
    } else if (object) {
      cypherQuery = `
        MATCH (food:Food)--(location:Location {lowerLocationName: $object})
        RETURN
          food.foodName AS foodName,
          food.image AS foodImage,
          food.sources AS foodSource,
          location.locationName AS locationName,
          location.country AS locationCountry
        LIMIT 10
      `;
    } else {
      return res.status(400).json({ error: 'Invalid input. Please provide subject and/or object.' });
    }

    const result = await session.run(cypherQuery, { subject, object });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Cannot find matching data in the database' });
    }

    const defaultRelation = 'SPECIALTY_IN';
    const data = result.records.map(record => ({
      subject: {
        type: 'Food',
        name: record.get('foodName'),
        image: record.get('foodImage'),
        sources: record.get('foodSource')
      },
      relation: defaultRelation,
      object: {
        type: 'Location',
        name: record.get('locationName'),
        country: record.get('locationCountry')
      }
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching Neo4j data:', error);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    await session.close();
  }
});

module.exports = router;
