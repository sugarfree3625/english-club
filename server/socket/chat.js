module.exports = (io, supabase) => {
  const { notifyUser, updateRating } = require('../utils/telegram');
  const { getLevel } = require('../utils/helpers');
  const onlineUsers = new Map();

  io.on('connection', s => {
    s.on('join', d => {
      s.uid = d.uid; s.uname = d.uname; s.join(`u:${d.uid}`); onlineUsers.set(d.uid, true);
      supabase.from('msg').select('*', { count: 'exact', head: true }).eq('receiver_id', d.uid).is('read', false).then(({ count }) => { s.emit('unread', { count: count || 0 }); });
    });
    s.on('disconnect', () => { if (s.uid) onlineUsers.delete(s.uid); });
    s.on('dm', async d => {
      if (!s.uid) return;
      const files = d.files || null;
      const msg = { id: Date.now(), from: s.uid, fn: s.uname, msg: d.msg || '', files, reply_to: d.replyTo || null, ts: new Date().toISOString() };
      io.to(`u:${d.to}`).emit('dm', msg); s.emit('dm', msg);
      const { error } = await supabase.from('msg').insert({ sender_id: s.uid, receiver_id: d.to, message: d.msg || '', files: files ? JSON.stringify(files) : null, read: false, reply_to: d.replyTo || null });
      if (error) console.log('❌ [DB] Ошибка:', error.message);
      await updateRating(supabase, s.uid, 2, getLevel);
      if (!onlineUsers.has(d.to)) notifyUser(supabase, d.to, `💬 ${s.uname}: ${(d.msg||'📎 Файл').substring(0, 50)}`);
    });
  });
};
