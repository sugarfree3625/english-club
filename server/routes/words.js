const { auth } = require('../middleware/auth');
const { updateRating } = require('../utils/telegram');
const { getLevel } = require('../utils/helpers');

module.exports = (app, supabase) => {
  // Получить слова
  app.get('/api/words', auth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('user_id', req.session.userId)
        .order('id', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error('GET /api/words error:', err);
      res.status(500).json({ error: 'Ошибка загрузки словаря' });
    }
  });

  // Добавить слово
  app.post('/api/words', auth, async (req, res) => {
    try {
      const { en, ru, transcription, part_of_speech, category, example } = req.body;
      if (!en || !ru || !en.trim() || !ru.trim()) {
        return res.status(400).json({ error: 'Заполните оба поля' });
      }
      const { data: existing } = await supabase
        .from('words').select('id')
        .eq('user_id', req.session.userId).eq('en', en.trim())
        .maybeSingle();
      if (existing) return res.status(409).json({ error: 'Такое слово уже есть' });
      
      const { error } = await supabase.from('words').insert({
        user_id: req.session.userId, en: en.trim(), ru: ru.trim(),
        transcription: transcription || null, part_of_speech: part_of_speech || null,
        category: category || null, example: example || null
      });
      if (error) throw error;
      
      try { await updateRating(supabase, req.session.userId, 3, getLevel); } catch(e) {}
      
      // Достижения за слова
      const { count } = await supabase.from('words').select('*', { count: 'exact', head: true }).eq('user_id', req.session.userId);
      const { data: earned } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', req.session.userId);
      const earnedIds = (earned || []).map(e => e.achievement_id);
      const { data: achs } = await supabase.from('achievements').select('*').eq('condition_field', 'words_count').lte('condition_value', count || 0);
      const unlocked = [];
      if (achs) for (const a of achs) {
        if (!earnedIds.includes(a.id)) {
          const { error: ie } = await supabase.from('user_achievements').insert({ user_id: req.session.userId, achievement_id: a.id });
          if (!ie) unlocked.push(a);
        }
      }
      res.status(201).json({ success: true, newAchievements: unlocked });
    } catch (err) {
      console.error('POST /api/words error:', err);
      res.status(500).json({ error: 'Не удалось добавить слово' });
    }
  });

  // Обновить слово
  app.put('/api/words/:id', auth, async (req, res) => {
    try {
      const u = {};
      ['status','next_review','repeat_count','correct_count','wrong_count','last_reviewed'].forEach(k => {
        if (req.body[k] !== undefined) u[k] = req.body[k];
      });
      const { error } = await supabase.from('words').update(u).eq('id', req.params.id).eq('user_id', req.session.userId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Не удалось обновить слово' });
    }
  });

  // Удалить слово
  app.delete('/api/words/:id', auth, async (req, res) => {
    try {
      const { error } = await supabase.from('words').delete().eq('id', req.params.id).eq('user_id', req.session.userId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Не удалось удалить слово' });
    }
  });
};
