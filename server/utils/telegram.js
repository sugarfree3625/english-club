const TG_TOKEN = process.env.TG_TOKEN || '';
const TG_BOT = 'English_Language_Class_Bot';

function sendTelegram(chatId, text) {
  if (!TG_TOKEN) return;
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=HTML`).catch(() => {});
}

async function notifyUser(supabase, userId, text) {
  const { data } = await supabase.from('tg_users').select('chat_id').eq('user_id', userId).single();
  if (data) sendTelegram(data.chat_id, text);
}

async function updateRating(supabase, userId, points, getLevelFn) {
  const { data: user } = await supabase.from('users').select('rating, level').eq('id', userId).single();
  if (!user) return;
  const newRating = (user.rating || 0) + points;
  const newLevel = getLevelFn(newRating);
  await supabase.from('users').update({ rating: newRating, level: newLevel }).eq('id', userId);
  if (newLevel !== user.level && newLevel > user.level) notifyUser(supabase, userId, `🎉 Уровень повышен до ${newLevel}!`);
}

function startTelegramBot(supabase) {
  if (!TG_TOKEN) return;
  let lastUpdateId = 0;
  const mainKeyboard = { keyboard: [['📅 Расписание', '📝 Задания'], ['📊 Статистика', '👤 Профиль'], ['🏆 Топ', '❓ Помощь']], resize_keyboard: true };
  setInterval(async () => {
    try {
      const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
      const d = await r.json();
      for (const up of d.result || []) {
        lastUpdateId = up.update_id;
        const msg = up.message; if (!msg?.text) continue;
        const chatId = msg.chat.id; const text = msg.text.trim();
        if (text.startsWith('/start')) {
          const [_, userId] = text.split(' ');
          if (userId) {
            await supabase.from('tg_users').upsert({ user_id: parseInt(userId), chat_id: chatId.toString() });
            sendTelegram(chatId, `✅ Привет!`);
          }
        }
      }
    } catch(e) {}
  }, 2000);
  console.log('🤖 Telegram бот запущен');
}

module.exports = { notifyUser, updateRating, startTelegramBot };
