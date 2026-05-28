const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
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
      const stats = { meetings_count: b?.count||0, messages_count: m?.count||0, words_count: w?.count||0, rating_rank: rank, account_age_days: age };
      
      const { data: all } = await supabase.from('achievements').select('*');
      const { data: earned } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', uid);
      const earnedIds = (earned||[]).map(e=>e.achievement_id);
      
      for (const a of (all||[])) {
        if (earnedIds.includes(a.id)) continue;
        let ok = false;
        switch(a.condition_field){case'meetings_count':ok=stats.meetings_count>=a.condition_value;break;case'messages_count':ok=stats.messages_count>=a.condition_value;break;case'words_count':ok=stats.words_count>=a.condition_value;break;case'rating_rank':ok=stats.rating_rank<=a.condition_value;break;case'account_age_days':ok=stats.account_age_days>=a.condition_value;break;}
        if(ok){const{error}=await supabase.from('user_achievements').insert({user_id:uid,achievement_id:a.id});if(!error)earnedIds.push(a.id);}
      }
      
      const { data: fresh } = await supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', uid);
      const map = {}; (fresh||[]).forEach(e=>map[e.achievement_id]=e.earned_at);
      
      const result = (all||[]).map(a=>{
        const earned=!!map[a.id]; let cv=0;
        switch(a.condition_field){case'meetings_count':cv=stats.meetings_count;break;case'messages_count':cv=stats.messages_count;break;case'words_count':cv=stats.words_count;break;case'rating_rank':cv=stats.rating_rank;break;case'account_age_days':cv=stats.account_age_days;break;}
        let p=0;if(earned)p=100;else if(a.condition_field==='rating_rank')p=a.condition_value>0?Math.min(100,Math.round((a.condition_value/cv)*100)):0;else p=a.condition_value>0?Math.min(100,Math.round((cv/a.condition_value)*100)):0;
        return{...a,earned,earned_at:map[a.id]||null,current_value:cv,condition_value:a.condition_value,progressPercent:p};
      });
      res.json(result);
    } catch (err) { console.error('Achievements error:', err); res.json([]); }
  });
};
