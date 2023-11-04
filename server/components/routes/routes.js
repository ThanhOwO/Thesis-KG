const express = require('express');
const translate = require('translate-google');
const neo4j = require('neo4j-driver');
const { containsVietnameseDiacritics, executeNER, executeFactCheck } = require('../functions/functions');
const { removeDiacritics } = require('../libs/libs')
require('dotenv').config();


const driver = neo4j.driver(
    process.env.REACT_NEO4J,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);
const session = driver.session();
session
    .run('RETURN 1')
    .then(() => {
        console.log('Successfully connected to Neo4j!');
    })
    .catch((error) => {
        console.error(error);
    })
    .finally(() => {
        session.close();
    });
const router = express.Router();

function removeVietnameseMarks(str) {
  for (const [diacritic, base] of removeDiacritics) {
    const regex = new RegExp(diacritic, 'g');
    str = str.replace(regex, base);
  }
  return str;
}

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
  const { subject, object, relation } = req.query;
  const session = driver.session();

  try {
    let cypherQuery;
    let defaultRelation;

    if (subject && object) {
      if (relation && (relation.toLowerCase() === 'food_in' || relation.toLowerCase() === 'specialty_in')) {
        cypherQuery = `
          MATCH (food:Food)-[:${relation.toUpperCase()}]->(location:Location)-[:IN_REGION]->(region:Region)
          WHERE (food.vieName = $subject OR food.engName = $subject)
          AND ((location.lowerLocationName = $object) OR (region.lowerRegionDetail = $object))
          RETURN
            food.foodName AS foodName,
            food.image AS foodImage,
            food.sources AS foodSource,
            food.temporal AS foodTemporal,
            location.locationName AS locationName,
            location.country AS locationCountry,
            region.regionDetail AS regionDetail,
            region.regionName AS regionName
          LIMIT 10
        `;
        defaultRelation = relation.toUpperCase();
      } else {
        return res.status(400).json({ error: 'Invalid relation. Please provide valid relation.' });
      }
    } else if (subject) {
      if (relation && (relation.toLowerCase() === 'food_in' || relation.toLowerCase() === 'specialty_in')) {
        cypherQuery = `
          MATCH (food:Food)-[:${relation.toUpperCase()}]->(location:Location)-[:IN_REGION]->(region:Region)
          WHERE (food.vieName = $subject OR food.engName = $subject)
          WITH food, location, region, rand() AS random
          RETURN
            food.foodName AS foodName,
            food.image AS foodImage,
            food.sources AS foodSource,
            food.temporal AS foodTemporal,
            location.locationName AS locationName,
            location.country AS locationCountry,
            region.regionDetail AS regionDetail,
            region.regionName AS regionName
          ORDER BY random
          LIMIT 10
        `;
        defaultRelation = relation.toUpperCase();
      } else {
        return res.status(400).json({ error: 'Invalid relation. Please provide valid relation.' });
      }
    } else if (object) {
      if (relation && (relation.toLowerCase() === 'food_in' || relation.toLowerCase() === 'specialty_in')) {
        cypherQuery = `
          MATCH (food:Food)-[:${relation.toUpperCase()}]->(location:Location)-[:IN_REGION]->(region:Region)
          WHERE (location.lowerLocationName = $object)
          WITH food, location, region, rand() AS random
          RETURN
            food.foodName AS foodName,
            food.image AS foodImage,
            food.sources AS foodSource,
            food.temporal AS foodTemporal,
            location.locationName AS locationName,
            location.country AS locationCountry,
            region.regionDetail AS regionDetail,
            region.regionName AS regionName
          ORDER BY rand()
          LIMIT 10
        `;
        defaultRelation = relation.toUpperCase();
      } else {
        return res.status(400).json({ error: 'Invalid relation. Please provide valid relation.' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid input. Please provide valid subject, object, and/or relation.' });
    }

    const result = await session.run(cypherQuery, { subject, object });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Cannot find matching data in the database' });
    }

    const data = result.records.map(record => ({
      subject: {
        type: 'Food',
        name: record.get('foodName'),
        image: record.get('foodImage'),
        sources: record.get('foodSource'),
        temporal: record.get('foodTemporal')
      },
      relation: defaultRelation,
      object: {
        type: 'Location',
        name: record.get('locationName'),
        country: record.get('locationCountry'),
        region_detail: record.get('regionDetail'),
        region_name: record.get('regionName')
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

//fact checking source
router.post('/fact', async (req, res) => {
  try {
    const { urls, keywords } = req.body;
    if (!urls || !keywords) {
      return res.status(400).json({ error: 'Both URLs and keywords are required.' });
    }
    executeFactCheck(urls, keywords, (error, extractedInformation) => {
      if (error) {
        return res.status(500).json({ error: `Error extracting information: ${error.message}` });
      }
      res.json(extractedInformation);
    });
  } catch (error) {
    res.status(500).json({ error: `An internal server error occurred: ${error.message}` });
  }
});

//Admin add triple to neo4j
router.post('/neo4j/create', async (req, res) => {
  const session = driver.session();

  try {
    const { foodName, relation, locationName, image, sources } = req.body;
    const vieName = removeVietnameseMarks(foodName.toLowerCase());
    //check existed node
    const checkFoodQuery = `
      MATCH (food:Food {foodName: $foodName})
      RETURN food
    `;

    const foodResult = await session.run(checkFoodQuery, { foodName });

    // Check if the relationship already exists
    const checkExistingQuery = `
      MATCH (food:Food {foodName: $foodName})-[:${relation}]->(location:Location {locationName: $locationName})
      RETURN food, location
    `;

    const result = await session.run(checkExistingQuery, { foodName, locationName, relation });

    if (result.records.length > 0) {
      // Relationship already exists
      res.json({status: 409, message: 'Relationship already exists in Neo4j.' });
    } else if (foodResult.records.length > 0) {
      // Use the existing Food node
      const createRelationshipQuery = `
        MATCH (food:Food {foodName: $foodName})
        MERGE (location:Location {locationName: $locationName})
        MERGE (food)-[:${relation}]->(location)
        RETURN food, location
      `;

      const relationshipResult = await session.run(createRelationshipQuery, { foodName, locationName });

      if (relationshipResult.records.length > 0) {
        res.json({ status: 200, message: 'Relationship created successfully.' });
      } else {
        res.status(500).json({ error: 'Failed to create the relationship.' });
      }
    }
    else {
      // If the relationship doesn't exist, create it
      const createRelationshipQuery = `
        MERGE (food:Food {foodName: $foodName, vieName: $vieName, image: $image, sources: $sources})
        MERGE (location:Location {locationName: $locationName})
        MERGE (food)-[:${relation}]->(location)
        RETURN food, location
      `;

      const relationshipResult = await session.run(createRelationshipQuery, { foodName, locationName, vieName, image, sources });

      if (relationshipResult.records.length > 0) {
        res.json({status: 200, message: 'Relationship created successfully.' });
      } else {
        res.status(500).json({ error: 'Failed to create the relationship.' });
      }
    }
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    await session.close();
  }
});

//Fetch all locations
router.get('/neo4j/locations', async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run('MATCH (l:Location) RETURN l.locationName');
    const locations = result.records.map((record) => record.get('l.locationName'));
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    await session.close();
  }
});

//Fetch all relation types
router.get('/neo4j/relations', async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run('CALL db.relationshipTypes');
    const relations = result.records.map((record) => record.get('relationshipType'));
    res.json(relations);
  } catch (error) {
    console.error('Error fetching relations:', error);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    await session.close();
  }
});


module.exports = router;
