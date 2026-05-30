const { auth } = require('../middleware/auth');
const { notifyUser } = require('../utils/telegram');

module.exports = (app, supabase) => {
  // ==================== ПОЛУЧИТЬ СЛОТЫ ====================
  app.get('/api/slots', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      let query = supabase.from('schedule_slots').select('*, users!student_id(username, avatar_url, level)');
      
      if (req.session.role === 'admin' || req.session.role === 'host') {
        query = query.eq('tutor_id', parseInt(uid));
      } else if (req.session.role === 'parent') {
        const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', uid);
        const ids = (links || []).map(l => l.student_id);
        if (ids.length > 0) query = query.in('student_id', ids);
        else return res.json([]);
      } else {
        query = query.eq('student_id', uid);
      }
      
      const { data } = await query.order('start_time', { ascending: true });
      res.json(data || []);
    } catch(e) { res.json([]); }
  });

  // ==================== СОЗДАТЬ СЛОТ ====================
  app.post('/api/slots', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      // Только поля которые есть в таблице
      const insertData = {
        title: req.body.title || '',
        lesson_type: req.body.lesson_type || 'online',
        student_id: req.body.student_id || null,
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        notes: req.body.notes || '',
        color: req.body.color || '#6366f1',
        group_students: req.body.group_students || [],
        tutor_id: req.session.userId,
        meeting_link: req.body.meeting_link || null
      };
      
      const { data: slot, error } = await supabase.from('schedule_slots')
        .insert(insertData).select('id').single();
      
      if (error) throw error;

      // Повторяющиеся слоты
      if (req.body.repeat && req.body.repeat !== 'none') {
        const startDate = new Date(req.body.start_time);
        const endDate = new Date(req.body.end_time);
        const repeatCount = req.body.repeat_count || 4;
        
        for (let i = 1; i < repeatCount; i++) {
          const newStart = new Date(startDate);
          const newEnd = new Date(endDate);
          
          if (req.body.repeat === 'weekly') {
            newStart.setDate(newStart.getDate() + 7 * i);
            newEnd.setDate(newEnd.getDate() + 7 * i);
          } else if (req.body.repeat === 'biweekly') {
            newStart.setDate(newStart.getDate() + 14 * i);
            newEnd.setDate(newEnd.getDate() + 14 * i);
          } else if (req.body.repeat === 'monthly') {
            newStart.setMonth(newStart.getMonth() + i);
            newEnd.setMonth(newEnd.getMonth() + i);
          }
          
          await supabase.from('schedule_slots').insert({
            ...insertData,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            parent_id: slot.id
          });
        }
      }

      if (req.body.student_id) {
        try { notifyUser(supabase, req.body.student_id, `📅 Новое занятие: ${req.body.title || 'Занятие'}`); } catch(e) {}
      }
      
      res.status(201).json({ success: true, id: slot.id });
    } catch(err) {
      console.error('POST /api/slots error:', err);
      res.status(500).json({ error: 'Не удалось создать занятие' });
    }
  });

  // ==================== ПЕРЕМЕСТИТЬ СЛОТ ====================
  app.put('/api/slots/:id/move', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      const { error } = await supabase.from('schedule_slots')
        .update({ start_time: req.body.start_time, end_time: req.body.end_time })
        .eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch(err) {
      res.status(500).json({ error: 'Не удалось переместить' });
    }
  });

  // ==================== ОБНОВИТЬ СЛОТ (ИСПРАВЛЕНО) ====================
  app.put('/api/slots/:id', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      // ТОЛЬКО поля которые есть в таблице schedule_slots
      const updates = {};
      
      if (req.body.title !== undefined) updates.title = req.body.title;
      if (req.body.lesson_type !== undefined) updates.lesson_type = req.body.lesson_type;
      if (req.body.student_id !== undefined) updates.student_id = req.body.student_id || null;
      if (req.body.start_time !== undefined) updates.start_time = req.body.start_time;
      if (req.body.end_time !== undefined) updates.end_time = req.body.end_time;
      if (req.body.notes !== undefined) updates.notes = req.body.notes;
      if (req.body.color !== undefined) updates.color = req.body.color;
      if (req.body.group_students !== undefined) updates.group_students = req.body.group_students;
      if (req.body.meeting_link !== undefined) updates.meeting_link = req.body.meeting_link;
      
      const { error } = await supabase.from('schedule_slots')
        .update(updates)
        .eq('id', req.params.id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch(err) {
      console.error('PUT /api/slots error:', err);
      res.status(500).json({ error: 'Не удалось обновить' });
    }
  });

  // ==================== УДАЛИТЬ СЛОТ ====================
  app.delete('/api/slots/:id', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      const { error } = await supabase.from('schedule_slots')
        .delete()
        .or(`id.eq.${req.params.id},parent_id.eq.${req.params.id}`);
      
      if (error) throw error;
      res.json({ success: true });
    } catch(err) {
      res.status(500).json({ error: 'Не удалось удалить' });
    }
  });

  // ==================== СТАТИСТИКА ====================
  app.get('/api/slots/stats', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      const uid = req.session.userId;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const [totalRes, monthRes, upcomingRes] = await Promise.all([
        supabase.from('schedule_slots').select('*', { count: 'exact', head: true }).eq('tutor_id', uid),
        supabase.from('schedule_slots').select('*', { count: 'exact', head: true }).eq('tutor_id', uid).gte('start_time', monthStart.toISOString()).lte('start_time', monthEnd.toISOString()),
        supabase.from('schedule_slots').select('*', { count: 'exact', head: true }).eq('tutor_id', uid).gte('start_time', now.toISOString())
      ]);
      
      res.json({
        total: totalRes?.count || 0,
        thisMonth: monthRes?.count || 0,
        upcoming: upcomingRes?.count || 0
      });
    } catch(err) {
      res.json({ total: 0, thisMonth: 0, upcoming: 0 });
    }
  });

  // ==================== ЭКСПОРТ ICS ====================
  app.get('/api/slots/export', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      let query = supabase.from('schedule_slots').select('*');
      
      if (req.session.role === 'admin' || req.session.role === 'host') {
        query = query.eq('tutor_id', uid);
      } else if (req.session.role === 'parent') {
        const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', uid);
        const ids = (links || []).map(l => l.student_id);
        if (ids.length) query = query.in('student_id', ids);
        else return res.json([]);
      } else {
        query = query.eq('student_id', uid);
      }
      
      const { data: slots } = await query;
      let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n';
      
      slots?.forEach(s => {
        const st = new Date(s.start_time).toISOString().replace(/[-:]/g,'').substring(0,15)+'Z';
        const en = new Date(s.end_time || new Date(s.start_time).getTime()+3600000).toISOString().replace(/[-:]/g,'').substring(0,15)+'Z';
        ics += `BEGIN:VEVENT\nDTSTART:${st}\nDTEND:${en}\nSUMMARY:${s.title||'Занятие'}\nDESCRIPTION:${s.notes||''} ${s.meeting_link||''}\nLOCATION:${s.meeting_link||'Очно'}\nEND:VEVENT\n`;
      });
      
      ics += 'END:VCALENDAR';
      res.setHeader('Content-Type','text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition','attachment; filename="schedule.ics"');
      res.send(ics);
    } catch(err) {
      res.status(500).json({ error: 'Ошибка экспорта' });
    }
  });
};
