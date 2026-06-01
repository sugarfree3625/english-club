const { auth } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = (app, supabase) => {
  // Получить заметку
  app.get('/api/notes', auth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('note, attachments')
        .eq('user_id', req.session.userId)
        .maybeSingle();
      if (error) throw error;
      res.json({ note: data?.note || '', attachments: data?.attachments || [] });
    } catch (err) { res.json({ note: '', attachments: [] }); }
  });

  // Сохранить заметку
  app.put('/api/notes', auth, async (req, res) => {
    try {
      const { data: existing } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', req.session.userId)
        .maybeSingle();

      const updateData = { 
        note: req.body.note || '', 
        attachments: req.body.attachments || [] 
      };
      
      if (existing) {
        const { error } = await supabase.from('notes').update(updateData).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notes').insert({ user_id: req.session.userId, ...updateData });
        if (error) throw error;
      }
      res.json({ success: true });
    } catch (err) {
      console.error('PUT /api/notes error:', err);
      res.status(500).json({ error: 'Не удалось сохранить заметку' });
    }
  });

  // Загрузить файл в заметку
  app.post('/api/notes/upload', auth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Нет файла' });
      
      const fileName = `notes/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      const fileUrl = urlData?.publicUrl || '';
      
      res.json({ 
        url: fileUrl, 
        name: req.file.originalname, 
        type: req.file.mimetype,
        size: req.file.size 
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
  });

  // Удалить файл из заметки
  app.delete('/api/notes/file', auth, async (req, res) => {
    try {
      const fileUrl = req.body.url;
      if (!fileUrl) return res.status(400).json({ error: 'Нет URL файла' });
      
      // Удаляем из хранилища
      const path = fileUrl.split('/').pop();
      if (path) {
        await supabase.storage.from('uploads').remove([`notes/${path}`]);
      }
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Ошибка удаления файла' });
    }
  });
};
