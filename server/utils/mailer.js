const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"English Club" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('✅ Письмо отправлено:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return { success: false, error: error.message };
  }
}

const templates = {
  newMessage: (userName, fromName, message) => ({
    subject: `💬 Новое сообщение от ${fromName}`,
    text: `Привет, ${userName}!\n\nУ вас новое сообщение от ${fromName}:\n"${message}"\n\nОтветьте в чате: https://english-club-v1.onrender.com/messages`,
    html: `<div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial;background:#0b1120;color:#e2e8f0;border-radius:16px">
      <h2 style="color:#6366f1">💬 Новое сообщение</h2>
      <p>Привет, <strong>${userName}</strong>!</p>
      <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:12px;border-left:4px solid #6366f1;margin:16px 0">"${message}"</div>
      <a href="https://english-club-v1.onrender.com/messages" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#2dd4bf);color:#fff;text-decoration:none;border-radius:50px;font-weight:600">Ответить</a>
    </div>`
  }),
  
  newSession: (userName, title, date) => ({
    subject: `📅 Напоминание: ${title}`,
    text: `Привет, ${userName}!\n\nНапоминаем о занятии "${title}" — ${date}\n\nПодробности: https://english-club-v1.onrender.com/calendar`,
    html: `<div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial;background:#0b1120;color:#e2e8f0;border-radius:16px">
      <h2 style="color:#6366f1">📅 Напоминание о занятии</h2>
      <p>Привет, <strong>${userName}</strong>!</p>
      <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:12px;margin:16px 0"><h3 style="color:#fff">${title}</h3><p>📅 ${date}</p></div>
      <a href="https://english-club-v1.onrender.com/calendar" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#2dd4bf);color:#fff;text-decoration:none;border-radius:50px;font-weight:600">Перейти</a>
    </div>`
  }),
  
  welcome: (userName) => ({
    subject: `🎉 Добро пожаловать в English Club!`,
    text: `Привет, ${userName}!\n\nДобро пожаловать в English Club! Начните с записи на первое занятие.`,
    html: `<div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial;background:#0b1120;color:#e2e8f0;border-radius:16px">
      <h2 style="color:#6366f1">🎉 Добро пожаловать!</h2>
      <p>Привет, <strong>${userName}</strong>!</p>
      <p>Что дальше?</p>
      <ul><li>📅 Запишитесь на занятие</li><li>💬 Познакомьтесь в чате</li><li>🏆 Получайте достижения</li></ul>
      <a href="https://english-club-v1.onrender.com/dashboard" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#2dd4bf);color:#fff;text-decoration:none;border-radius:50px;font-weight:600">Начать</a>
    </div>`
  })
};

module.exports = { sendEmail, templates };
