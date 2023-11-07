import { useState, useEffect } from 'react';
import axios from 'axios';

const useFact = (urls, keywords) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post('http://localhost:8080/fact', {
          urls,
          keywords,
        });
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [urls, keywords]);

  return { data, loading, error };
};

export default useFact;
