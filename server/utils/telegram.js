const TG_TOKEN = process.env.TG_TOKEN || '';

// ==================== ОТПРАВКА СООБЩЕНИЙ ====================

function sendTelegram(chatId, text, options = {}) {
  if (!TG_TOKEN || !chatId) return;
  let url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=HTML`;
  if (options.replyMarkup) url += `&reply_markup=${encodeURIComponent(JSON.stringify(options.replyMarkup))}`;
  fetch(url).catch(() => {});
}

function sendPhoto(chatId, photoUrl, caption = '') {
  if (!TG_TOKEN || !chatId) return;
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto?chat_id=${chatId}&photo=${encodeURIComponent(photoUrl)}&caption=${encodeURIComponent(caption)}&parse_mode=HTML`).catch(() => {});
}

function sendDocument(chatId, fileUrl, caption = '') {
  if (!TG_TOKEN || !chatId) return;
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendDocument?chat_id=${chatId}&document=${encodeURIComponent(fileUrl)}&caption=${encodeURIComponent(caption)}&parse_mode=HTML`).catch(() => {});
}

// ==================== УВЕДОМЛЕНИЯ ====================

async function notifyUser(supabase, userId, text, options = {}) {
  try {
    const { data } = await supabase.from('tg_users').select('chat_id').eq('user_id', userId).maybeSingle();
    if (data?.chat_id) sendTelegram(data.chat_id, text, options);
  } catch(e) {}
}

async function notifyAdmins(supabase, text) {
  try {
    const { data: admins } = await supabase.from('users').select('id').in('role', ['admin', 'host']);
    if (admins) for (const admin of admins) await notifyUser(supabase, admin.id, text);
  } catch(e) {}
}

async function notifyAllStudents(supabase, text) {
  try {
    const { data: students } = await supabase.from('users').select('id').in('role', ['user', 'student']);
    if (students) for (const s of students) await notifyUser(supabase, s.id, text);
  } catch(e) {}
}

// ==================== РЕЙТИНГ ====================

async function updateRating(supabase, userId, points, getLevelFn) {
  try {
    const { data: user } = await supabase.from('users').select('rating, level').eq('id', userId).single();
    if (!user) return;
    const newRating = Math.max(0, (user.rating || 0) + points);
    const newLevel = getLevelFn ? getLevelFn(newRating) : user.level;
    await supabase.from('users').update({ rating: newRating, level: newLevel }).eq('id', userId);
    if (newLevel !== user.level) {
      await notifyUser(supabase, userId, `🎉 Ваш уровень повышен до <b>${newLevel}</b>! +${points} XP`);
    }
  } catch(e) {}
}

// ==================== КЛАВИАТУРЫ ====================

const keyboards = {
  main: {
    keyboard: [
      ['📅 Ближайшие занятия', '📝 Мои задания'],
      ['📊 Мой прогресс', '📚 Мой словарь'],
      ['💬 Открыть чат', '🏆 Рейтинг'],
      ['📞 Связаться с учителем']
    ],
    resize_keyboard: true
  },
  admin: {
    keyboard: [
      ['📅 Ближайшие занятия', '📝 Задания'],
      ['👥 Ученики', '📊 Статистика клуба'],
      ['📢 Рассылка', '⚙️ Настройки'],
      ['↩️ В главное меню']
    ],
    resize_keyboard: true
  },
  back: {
    keyboard: [['↩️ Назад']],
    resize_keyboard: true
  },
  remove: { remove_keyboard: true }
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function getLevelProgress(rating) {
  const xpInLevel = rating % 100;
  const nextLevel = 100 - xpInLevel;
  return { xpInLevel, nextLevel };
}

async function getOrCreateUser(supabase, chatId) {
  const { data } = await supabase.from('tg_users').select('user_id').eq('chat_id', chatId.toString()).maybeSingle();
  return data?.user_id || null;
}

// ==================== ОСНОВНОЙ БОТ ====================

function startTelegramBot(supabase) {
  if (!TG_TOKEN) {
    console.log('⚠️ TG_TOKEN не указан');
    return;
  }
  
  let lastUpdateId = 0;
  
  setInterval(async () => {
    try {
      const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`);
      const d = await r.json();
      if (!d.ok) return;
      
      for (const up of d.result || []) {
        lastUpdateId = up.update_id;
        const msg = up.message;
        if (!msg?.text) continue;
        
        const chatId = msg.chat.id;
        const text = msg.text.trim();
        
        // ==================== /START ====================
        if (text.startsWith('/start')) {
          const userId = text.split(' ')[1];
          
          if (userId && !isNaN(userId)) {
            await supabase.from('tg_users').upsert({ user_id: parseInt(userId), chat_id: chatId.toString() });
            const { data: user } = await supabase.from('users').select('username, role, level, rating, avatar_url').eq('id', parseInt(userId)).single();
            
            if (user?.role === 'admin' || user?.role === 'host') {
              sendTelegram(chatId, 
                `👨‍🏫 <b>Привет, ${user?.username || 'учитель'}!</b>\n\n` +
                `✅ Аккаунт привязан.\n` +
                `📊 Уровень: <b>${user?.level || '—'}</b>\n` +
                `⭐ Рейтинг: <b>${user?.rating || 0} XP</b>`,
                { replyMarkup: keyboards.admin }
              );
            } else {
              if (user?.avatar_url) sendPhoto(chatId, user.avatar_url);
              sendTelegram(chatId,
                `🎉 <b>Добро пожаловать, ${user?.username || 'друг'}!</b>\n\n` +
                `✅ Аккаунт привязан к English Club.\n` +
                `📊 Уровень: <b>${user?.level || 'A1'}</b>\n` +
                `⭐ Рейтинг: <b>${user?.rating || 0} XP</b>\n\n` +
                `Используй кнопки для навигации ⬇️`,
                { replyMarkup: keyboards.main }
              );
            }
          } else {
            sendTelegram(chatId, 
              `👋 <b>Привет!</b>\n\nЧтобы привязать аккаунт:\n1️⃣ Войди на сайт\n2️⃣ Профиль → Telegram\n3️⃣ Нажми "Подключить"`,
              { replyMarkup: keyboards.remove }
            );
          }
        }
        
        // ==================== ОБЩИЕ КОМАНДЫ ====================
        
        else if (text === '📅 Ближайшие занятия') {
          const uid = await getOrCreateUser(supabase, chatId);
          if (!uid) { sendTelegram(chatId, '⚠️ Привяжите аккаунт: /start'); continue; }
          
          const { data: slots } = await supabase.from('slots')
            .select('title, start_time, lesson_type, color')
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(5);
          
          if (!slots?.length) {
            sendTelegram(chatId, '📅 Нет предстоящих занятий.\n\nЗапишитесь на сайте!');
          } else {
            let msg = '<b>📅 Ближайшие занятия:</b>\n\n';
            slots.forEach((s, i) => {
              const type = { online: '🟢', offline: '🔵', group: '🟠' }[s.lesson_type] || '📅';
              msg += `${type} <b>${s.title}</b>\n📆 ${formatDate(s.start_time)}\n\n`;
            });
            msg += '<i>Записаться можно на сайте</i>';
            sendTelegram(chatId, msg);
          }
        }
        
        else if (text === '📝 Мои задания') {
          const uid = await getOrCreateUser(supabase, chatId);
          if (!uid) { sendTelegram(chatId, '⚠️ Привяжите аккаунт: /start'); continue; }
          
          const { data: hw } = await supabase.from('homework')
            .select('title, status, deadline, grade')
            .eq('student_id', uid)
            .order('deadline', { ascending: true })
            .limit(5);
          
          if (!hw?.length) {
            sendTelegram(chatId, '📝 Нет заданий! 🎉');
          } else {
            let msg = '<b>📝 Задания:</b>\n\n';
            hw.forEach(h => {
              const status = { completed: '✅', submitted: '📤', in_progress: '⏳' }[h.status] || '📝';
              msg += `${status} <b>${h.title}</b>\n📅 Срок: ${formatDate(h.deadline)}\n${h.grade ? `⭐ Оценка: ${h.grade}\n` : ''}\n`;
            });
            sendTelegram(chatId, msg);
          }
        }
        
        else if (text === '📊 Мой прогресс') {
          const uid = await getOrCreateUser(supabase, chatId);
          if (!uid) { sendTelegram(chatId, '⚠️ Привяжите аккаунт: /start'); continue; }
          
          const { data: user } = await supabase.from('users').select('rating, level, words_count, sessions_count').eq('id', uid).single();
          if (!user) { sendTelegram(chatId, 'Ошибка загрузки'); continue; }
          
          const { nextLevel } = getLevelProgress(user.rating || 0);
          const progressBar = '▓'.repeat(Math.floor((user.rating % 100) / 10)) + '░'.repeat(10 - Math.floor((user.rating % 100) / 10));
          
          sendTelegram(chatId,
            `<b>📊 Прогресс:</b>\n\n` +
            `📈 Уровень: <b>${user.level || 'A1'}</b>\n` +
            `⭐ Рейтинг: <b>${user.rating || 0} XP</b>\n` +
            `📊 [${progressBar}] ${nextLevel} XP до уровня\n` +
            `📚 Слов: <b>${user.words_count || 0}</b>\n` +
            `📅 Занятий: <b>${user.sessions_count || 0}</b>`
          );
        }
        
        else if (text === '📚 Мой словарь') {
          const uid = await getOrCreateUser(supabase, chatId);
          if (!uid) { sendTelegram(chatId, '⚠️ Привяжите аккаунт: /start'); continue; }
          
          const { count } = await supabase.from('words').select('*', { count: 'exact', head: true }).eq('user_id', uid);
          sendTelegram(chatId, 
            `📚 <b>Словарь:</b>\n\n` +
            `📖 Слов изучено: <b>${count || 0}</b>\n\n` +
            `Добавляйте новые слова на сайте!`
          );
        }
        
        else if (text === '💬 Открыть чат') {
          sendTelegram(chatId, '💬 <a href="https://english-club-v1.onrender.com/messages">Открыть чат на сайте</a>');
        }
        
        else if (text === '🏆 Рейтинг') {
          const { data: top } = await supabase.from('users')
            .select('username, rating, level')
            .order('rating', { ascending: false })
            .limit(10);
          
          if (top?.length) {
            let msg = '<b>🏆 Топ-10 учеников:</b>\n\n';
            top.forEach((u, i) => {
              const medals = ['🥇', '🥈', '🥉', '4', '5', '6', '7', '8', '9', '10'];
              msg += `${medals[i]} ${u.username} — ${u.rating} XP\n`;
            });
            sendTelegram(chatId, msg);
          }
        }
        
        else if (text === '📞 Связаться с учителем') {
          const { data: settings } = await supabase.from('site_settings').select('tg').maybeSingle();
          sendTelegram(chatId, 
            `📞 <b>Связь с учителем:</b>\n\n` +
            `${settings?.tg ? `✈️ Telegram: ${settings.tg}\n` : ''}` +
            `🌐 Сайт: english-club-v1.onrender.com`
          );
        }
        
        // ==================== АДМИН-КОМАНДЫ ====================
        
        else if (text === '📊 Статистика клуба') {
          const uid = await getOrCreateUser(supabase, chatId);
          if (!uid) continue;
          const { data: user } = await supabase.from('users').select('role').eq('id', uid).single();
          if (user?.role !== 'admin' && user?.role !== 'host') continue;
          
          const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
          const { count: slots } = await supabase.from('slots').select('*', { count: 'exact', head: true });
          const { count: msgs } = await supabase.from('msg').select('*', { count: 'exact', head: true });
          
          sendTelegram(chatId,
            `<b>📊 Статистика клуба:</b>\n\n` +
            `👥 Учеников: <b>${users || 0}</b>\n` +
            `📅 Занятий: <b>${slots || 0}</b>\n` +
            `💬 Сообщений: <b>${msgs || 0}</b>`
          );
        }
        
        else if (text === '📢 Рассылка') {
          const uid = await getOrCreateUser(supabase, chatId);
          if (!uid) continue;
          const { data: user } = await supabase.from('users').select('role').eq('id', uid).single();
          if (user?.role !== 'admin' && user?.role !== 'host') continue;
          
          sendTelegram(chatId, '📢 Отправьте сообщение для рассылки всем ученикам. Используйте /broadcast [текст]');
        }
        
        // ==================== КОМАНДЫ С ПАРАМЕТРАМИ ====================
        
        else if (text.startsWith('/broadcast ')) {
          const uid = await getOrCreateUser(supabase, chatId);
          if (!uid) continue;
          const { data: user } = await supabase.from('users').select('role').eq('id', uid).single();
          if (user?.role !== 'admin' && user?.role !== 'host') continue;
          
          const broadcastText = text.replace('/broadcast ', '');
          await notifyAllStudents(supabase, `📢 <b>Сообщение от учителя:</b>\n\n${broadcastText}`);
          sendTelegram(chatId, '✅ Рассылка отправлена!');
        }
        
        else if (text === '↩️ Назад' || text === '↩️ В главное меню') {
          const uid = await getOrCreateUser(supabase, chatId);
          const { data: user } = await supabase.from('users').select('role').eq('id', uid).single();
          if (user?.role === 'admin' || user?.role === 'host') {
            sendTelegram(chatId, '📋 Главное меню', { replyMarkup: keyboards.admin });
          } else {
            sendTelegram(chatId, '📋 Главное меню', { replyMarkup: keyboards.main });
          }
        }
      }
    } catch(e) {
      console.error('🤖 Bot error:', e.message);
    }
  }, 1500);
  
  console.log('🤖 Telegram бот запущен: максимум функций');
}

module.exports = { notifyUser, notifyAdmins, updateRating, startTelegramBot };
