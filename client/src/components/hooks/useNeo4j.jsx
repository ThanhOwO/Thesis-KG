import axios from 'axios';
import { message } from 'antd';

const useNeo4j = () => {
  const fetchDataFromNeo4j = async (subject, object, relation) => {
    try {
      const response = await axios.get(`http://localhost:8080/neo4j?subject=${subject}&object=${object}&relation=${relation}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      } else {
        console.error('Error fetching data from Neo4j:', error);
        return null;
      }
    }
  };

  const addTripleToNeo4j = async (foodName, relation, locationName) => {
    try {
      const response = await axios.post('http://localhost:8080/neo4j/create', {
        foodName,
        relation,
        locationName,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding triple to Neo4j:', error);
      return null;
    }
  };

  const fetchAllLocations = async () => {
    try {
      const response = await axios.get('http://localhost:8080/neo4j/locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return null;
    }
  };

  const fetchAllRelations = async () => {
    try {
      const response = await axios.get('http://localhost:8080/neo4j/relations');
      return response.data;
    } catch (error) {
      console.error('Error fetching relations:', error);
      return null;
    }
  };

  return { fetchDataFromNeo4j, addTripleToNeo4j, fetchAllLocations, fetchAllRelations };
};

export default useNeo4j;
