import axios from 'axios';

export function useXP() {
  const addXP = async (action, points = null) => {
    try {
      const { data } = await axios.post('/api/xp/add', { action, points });
      if (data.leveled_up) {
        // Вызываем событие повышения уровня
        window.dispatchEvent(new CustomEvent('level-up', { detail: data }));
      }
      // Вызываем событие начисления XP
      window.dispatchEvent(new CustomEvent('xp-gain', { detail: data }));
      return data;
    } catch(e) {
      console.error('XP error:', e);
      return null;
    }
  };
  
  const getXP = async () => {
    try {
      const { data } = await axios.get('/api/xp');
      return data;
    } catch(e) {
      return { rating: 0, level: 'A1', xp_to_next: 100 };
    }
  };
  
  return { addXP, getXP };
}
