import axios from 'axios';

export function useFiles() {
  async function uploadFile(file) {
    const form = new FormData();
    form.append('img', file);
    const r = await axios.post('/api/nimg', form);
    return r.data?.url || null;
  }

  function getFileType(file) {
    if (!file) return 'file';
    if (file.type) {
      if (file.type.startsWith('image/')) return 'image';
      if (file.type.startsWith('audio/')) return 'audio';
      if (file.type.startsWith('video/')) return 'video';
    }
    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    if (['mp3','wav','ogg','aac','m4a','flac','webm'].includes(ext)) return 'audio';
    if (['mp4','webm','mov','avi'].includes(ext)) return 'video';
    if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
    return 'file';
  }

  function getFileIcon(type) {
    return { image: '🖼️', audio: '🎵', video: '🎬' }[type] || '📎';
  }

  const SUPABASE_URL = 'https://qmoxemhstzfxirpskext.supabase.co/storage/v1/object/public/uploads/';

  function proxifyUrl(url) {
    if (!url) return '';
    return url.replace(SUPABASE_URL, '/api/file/');
  }

  return { uploadFile, getFileType, getFileIcon, proxifyUrl };
}
