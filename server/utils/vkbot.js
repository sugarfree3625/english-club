const VkBot = require('node-vk-bot-api');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const bot = new VkBot({
  token: process.env.VK_TOKEN,
  group_id: process.env.VK_GROUP_ID
});

// Приветствие
bot.command('/start', (ctx) => {
  ctx.reply(`👋 Привет! Я бот English Club.
  
📋 Команды:
• /расписание — посмотреть расписание
• /слова — слово дня и мой словарь
• /ачивки — мои достижения
• /рейтинг — мой прогресс
• /привязать — привязать аккаунт
• /помощь — все команды`);
});

// Привязка аккаунта
bot.command('/привязать', async (ctx) => {
  const vkId = ctx.message.from_id;
  ctx.reply('Чтобы привязать аккаунт, перейди в профиль на сайте и нажми "Привязать ВК". Твой VK ID: ' + vkId);
});

// Привязка по коду
bot.command(/^\/bind (.+)$/, async (ctx) => {
  const code = ctx.match[1];
  const vkId = ctx.message.from_id;
  
  const { data: user } = await supabase.from('users').select('id, username').eq('vk_bind_code', code).single();
  
  if (!user) {
    return ctx.reply('❌ Неверный код привязки. Проверь код в профиле.');
  }
  
  await supabase.from('users').update({ vk_id: vkId, vk_bind_code: null }).eq('id', user.id);
  ctx.reply(`✅ Аккаунт ${user.username} привязан! Теперь используй команды.`);
});

// Расписание
bot.command('/расписание', async (ctx) => {
  const vkId = ctx.message.from_id;
  const { data: user } = await supabase.from('users').select('id').eq('vk_id', vkId).single();
  
  if (!user) return ctx.reply('❌ Привяжи аккаунт: /привязать');
  
  const { data: slots } = await supabase.from('schedule_slots')
    .select('title, start_time, meeting_link')
    .eq('student_id', user.id)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(5);
  
  if (!slots?.length) return ctx.reply('📅 У тебя нет ближайших встреч.');
  
  const text = slots.map((s, i) => {
    const time = new Date(s.start_time).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `${i+1}. ${s.title}\n📅 ${time}\n${s.meeting_link ? '📹 ' + s.meeting_link : ''}`;
  }).join('\n\n');
  
  ctx.reply(`📅 Твои ближайшие встречи:\n\n${text}`);
});

// Слово дня
const WORDS = [
  { en: 'Serendipity', ru: 'счастливая случайность' },
  { en: 'Resilience', ru: 'устойчивость' },
  { en: 'Euphoria', ru: 'эйфория' },
  { en: 'Ephemeral', ru: 'мимолётный' },
  { en: 'Mellifluous', ru: 'сладкозвучный' },
  { en: 'Petrichor', ru: 'запах после дождя' },
  { en: 'Solitude', ru: 'уединение' }
];

bot.command('/слова', async (ctx) => {
  const vkId = ctx.message.from_id;
  const { data: user } = await supabase.from('users').select('id').eq('vk_id', vkId).single();
  
  const day = new Date().getDate();
  const word = WORDS[day % WORDS.length];
  
  let text = `📖 Слово дня: ${word.en} — ${word.ru}\n\n`;
  
  if (user) {
    const { data: words } = await supabase.from('words').select('en, ru').eq('user_id', user.id).limit(5);
    if (words?.length) {
      text += '📚 Твой словарь:\n';
      words.forEach(w => { text += `• ${w.en} — ${w.ru}\n`; });
    }
  }
  
  ctx.reply(text);
});

// Достижения
bot.command('/ачивки', async (ctx) => {
  const vkId = ctx.message.from_id;
  const { data: user } = await supabase.from('users').select('id').eq('vk_id', vkId).single();
  
  if (!user) return ctx.reply('❌ Привяжи аккаунт: /привязать');
  
  const { data: ua } = await supabase.from('user_achievements')
    .select('achievements(name, icon, rarity)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(5);
  
  if (!ua?.length) return ctx.reply('🏆 Пока нет достижений.');
  
  const text = '🏆 Твои последние трофеи:\n\n' + ua.map((a, i) => {
    const ach = a.achievements;
    return `${i+1}. ${ach.icon || '⭐'} ${ach.name} (${ach.rarity || 'бронза'})`;
  }).join('\n');
  
  ctx.reply(text);
});

// Рейтинг
bot.command('/рейтинг', async (ctx) => {
  const vkId = ctx.message.from_id;
  const { data: user } = await supabase.from('users').select('id, username, rating, level').eq('vk_id', vkId).single();
  
  if (!user) return ctx.reply('❌ Привяжи аккаунт: /привязать');
  
  ctx.reply(`📊 Твой прогресс:\n👤 ${user.username}\n⭐ Уровень: ${user.level}\n🏆 Рейтинг: ${user.rating}\n🔥 Продолжай!`);
});

bot.command('/помощь', (ctx) => {
  ctx.reply('📋 Команды: /расписание, /слова, /ачивки, /рейтинг, /привязать, /помощь');
});

// На любое другое сообщение
bot.on((ctx) => {
  ctx.reply('Используй /помощь для списка команд.');
});

module.exports = { bot, supabase };
