import axios from 'axios';

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

  return { fetchDataFromNeo4j };
};

export default useNeo4j;
