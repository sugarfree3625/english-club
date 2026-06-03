const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  
  // ==================== ПОЛУЧИТЬ ДОСТИЖЕНИЯ ====================
  app.get('/api/achievements', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      const [b, m, w] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('msg').select('*', { count: 'exact', head: true }).eq('sender_id', uid),
        supabase.from('words').select('*', { count: 'exact', head: true }).eq('user_id', uid)
      ]);
      const { data: u } = await supabase.from('users').select('rating, created_at').eq('id', uid).single();
      const rating = u?.rating || 0;
      const { count: better } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('rating', rating);
      const rank = (better || 0) + 1;
      const age = u?.created_at ? Math.floor((Date.now() - new Date(u.created_at).getTime()) / 86400000) : 0;
      const stats = { 
        meetings_count: b?.count || 0, 
        messages_count: m?.count || 0, 
        words_count: w?.count || 0, 
        rating_rank: rank, 
        account_age_days: age 
      };
      
      const { data: all } = await supabase.from('achievements').select('*');
      const { data: earned } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', uid);
      const earnedIds = (earned || []).map(e => e.achievement_id);
      
      // Проверяем новые достижения
      let newAchievements = [];
      for (const a of (all || [])) {
        if (earnedIds.includes(a.id)) continue;
        let ok = false;
        switch (a.condition_field) {
          case 'meetings_count': ok = stats.meetings_count >= a.condition_value; break;
          case 'messages_count': ok = stats.messages_count >= a.condition_value; break;
          case 'words_count': ok = stats.words_count >= a.condition_value; break;
          case 'rating_rank': ok = stats.rating_rank <= a.condition_value; break;
          case 'account_age_days': ok = stats.account_age_days >= a.condition_value; break;
        }
        if (ok) {
          const { error } = await supabase.from('user_achievements').insert({ user_id: uid, achievement_id: a.id });
          if (!error) {
            earnedIds.push(a.id);
            newAchievements.push(a);
            // Начисляем XP за достижение
            const xpReward = a.rarity === 'platinum' ? 500 : a.rarity === 'gold' ? 250 : a.rarity === 'silver' ? 100 : 50;
            await addXP(supabase, uid, xpReward, `achievement_earned`);
          }
        }
      }
      
      const { data: fresh } = await supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', uid);
      const map = {};
      (fresh || []).forEach(e => map[e.achievement_id] = e.earned_at);
      
      const result = (all || []).map(a => {
        const earned = !!map[a.id];
        let cv = 0;
        switch (a.condition_field) {
          case 'meetings_count': cv = stats.meetings_count; break;
          case 'messages_count': cv = stats.messages_count; break;
          case 'words_count': cv = stats.words_count; break;
          case 'rating_rank': cv = stats.rating_rank; break;
          case 'account_age_days': cv = stats.account_age_days; break;
        }
        let p = 0;
        if (earned) p = 100;
        else if (a.condition_field === 'rating_rank') p = a.condition_value > 0 ? Math.min(100, Math.round((a.condition_value / cv) * 100)) : 0;
        else p = a.condition_value > 0 ? Math.min(100, Math.round((cv / a.condition_value) * 100)) : 0;
        return { ...a, earned, earned_at: map[a.id] || null, current_value: cv, condition_value: a.condition_value, progressPercent: p };
      });
      
      res.json(result);
    } catch (err) {
      console.error('Achievements error:', err);
      res.json([]);
    }
  });

  // ==================== НАЧИСЛИТЬ XP МГНОВЕННО ====================
  app.post('/api/xp/add', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      const { action, points } = req.body;
      
      const xpMap = {
        'word_added': 10,
        'message_sent': 5,
        'meeting_attended': 50,
        'homework_submitted': 30,
        'homework_graded': 20,
        'achievement_earned': 100,
        'streak_day': 15
      };
      
      const xp = points || xpMap[action] || 10;
      const result = await addXP(supabase, uid, xp, action);
      res.json(result);
    } catch (e) {
      console.error('XP add error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // ==================== ПОЛУЧИТЬ ТЕКУЩИЙ XP ====================
  app.get('/api/xp', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      const { data: user } = await supabase.from('users').select('rating, level').eq('id', uid).single();
      res.json({
        rating: user?.rating || 0,
        level: user?.level || 'A1',
        xp_to_next: getXPToNext(user?.rating || 0, user?.level || 'A1')
      });
    } catch (e) {
      res.json({ rating: 0, level: 'A1', xp_to_next: 100 });
    }
  });
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Начислить XP и обновить уровень
async function addXP(supabase, userId, amount, action) {
  const { data: user } = await supabase.from('users').select('rating, level').eq('id', userId).single();
  if (!user) return { success: false, error: 'User not found' };
  
  const newRating = (user.rating || 0) + amount;
  const newLevel = getLevel(newRating);
  
  await supabase.from('users').update({ 
    rating: newRating, 
    level: newLevel 
  }).eq('id', userId);
  
  // Сохраняем в историю XP
  await supabase.from('xp_history').insert({
    user_id: userId,
    amount: amount,
    action: action || 'other',
    created_at: new Date().toISOString()
  });
  
  const leveledUp = newLevel !== user.level;
  
  return {
    success: true,
    xp_added: amount,
    total_xp: newRating,
    level: newLevel,
    leveled_up: leveledUp,
    prev_level: user.level,
    xp_to_next: getXPToNext(newRating, newLevel)
  };
}

// Определить уровень по XP
function getLevel(rating) {
  if (rating >= 5000) return 'C2';
  if (rating >= 3000) return 'C1';
  if (rating >= 1500) return 'B2';
  if (rating >= 500) return 'B1';
  if (rating >= 200) return 'A2';
  return 'A1';
}

// Сколько XP осталось до следующего уровня
function getXPToNext(rating, level) {
  const thresholds = { 'A1': 200, 'A2': 500, 'B1': 1500, 'B2': 3000, 'C1': 5000, 'C2': Infinity };
  const next = thresholds[level] || 200;
  return Math.max(0, next - rating);
}

module.exports = { addXP, getLevel, getXPToNext };
