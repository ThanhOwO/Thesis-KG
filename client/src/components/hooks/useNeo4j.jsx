import { useEffect, useState } from 'react';
import axios from 'axios';

const useNeo4j = () => {
  const fetchDataFromNeo4j = async (subject, object, relation) => {
    try {
      const response = await axios.get(`http://localhost:8080/neo4j?subject=${subject}&object=${object}&relation=${relation}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching data from Neo4j:', error);
      throw error;
    }
  };

  return { fetchDataFromNeo4j };
};

export default useNeo4j;
