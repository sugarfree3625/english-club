const auth = require('../middleware/auth');
const { notifyUser } = require('../utils/telegram');

module.exports = (app, supabase) => {
  app.get('/api/slots', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      let query = supabase.from('schedule_slots').select('*, users!student_id(username, avatar_url, level)');
      if (req.session.role === 'admin' || req.session.role === 'host') query = query.eq('tutor_id', parseInt(uid));
      else if (req.session.role === 'parent') {
        const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', uid);
        const ids = (links || []).map(l => l.student_id);
        if (ids.length > 0) query = query.in('student_id', ids); else return res.json([]);
      } else query = query.eq('student_id', uid);
      const { data } = await query.order('start_time', { ascending: true });
      res.json(data || []);
    } catch(e) { res.json([]); }
  });

  app.post('/api/slots', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    await supabase.from('schedule_slots').insert({ ...req.body, tutor_id: req.session.userId });
    res.json({ success: true });
  });

  app.put('/api/slots/:id/move', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    await supabase.from('schedule_slots').update({ start_time: req.body.start_time, end_time: req.body.end_time }).eq('id', req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/slots/:id', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    await supabase.from('schedule_slots').delete().eq('id', req.params.id);
    res.json({ success: true });
  });

  app.get('/api/slots/export', auth, async (req, res) => {
    const uid = req.session.userId;
    let query = supabase.from('schedule_slots').select('*');
    if (req.session.role === 'admin' || req.session.role === 'host') query = query.eq('tutor_id', uid);
    else if (req.session.role === 'parent') {
      const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', uid);
      const ids = (links || []).map(l => l.student_id);
      if (ids.length) query = query.in('student_id', ids); else return res.json([]);
    } else query = query.eq('student_id', uid);
    const { data: slots } = await query;
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n';
    slots?.forEach(s => {
      const st = new Date(s.start_time).toISOString().replace(/[-:]/g,'').substring(0,15)+'Z';
      const en = new Date(s.end_time || new Date(s.start_time).getTime()+3600000).toISOString().replace(/[-:]/g,'').substring(0,15)+'Z';
      ics += `BEGIN:VEVENT\nDTSTART:${st}\nDTEND:${en}\nSUMMARY:${s.title || 'Занятие'}\nDESCRIPTION:${s.notes||''} ${s.meeting_link||''}\nLOCATION:${s.meeting_link||'Очно'}\nEND:VEVENT\n`;
    });
    ics += 'END:VCALENDAR';
    res.setHeader('Content-Type','text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="schedule.ics"');
    res.send(ics);
  });
};
