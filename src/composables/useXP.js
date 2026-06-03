import axios from 'axios';

export function useXP() {
  const addXP = async (action) => {
    try {
      const { data } = await axios.post('/api/xp/add', { action });
      return data;
    } catch(e) {
      console.error('XP error:', e);
      return null;
    }
  };
  
  return { addXP };
}
