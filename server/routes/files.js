const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

const upNw = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

module.exports = (app, supabase) => {
  app.post('/api/nimg', auth, upNw.single('img'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Нет файла' });
    try {
      const name = `nw-${Date.now()}${path.extname(req.file.originalname)}`;
      const { error } = await supabase.storage.from('uploads').upload(name, req.file.buffer, {
        contentType: req.file.mimetype, upsert: true
      });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true, url: supabase.storage.from('uploads').getPublicUrl(name).data.publicUrl });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/file/:filename', async (req, res) => {
    try {
      const { data, error } = await supabase.storage.from('uploads').download(req.params.filename);
      if (error) return res.status(404).json({ error: 'Файл не найден' });
      res.setHeader('Content-Type', data.type);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(Buffer.from(await data.arrayBuffer()));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
};
