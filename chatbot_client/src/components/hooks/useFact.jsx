import { useState, useEffect } from 'react';
import axios from 'axios';

const useFact = (urls, originalKeyword, chatbotRes) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post('http://localhost:8080/ref', {
          urls,
          originalKeyword, 
          chatbotRes,
        },{
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error.response.data);
        setLoading(false);
      }
    };

    fetchData();
  }, [urls, originalKeyword, chatbotRes]);

  return { data, loading, error };
};

export default useFact;
