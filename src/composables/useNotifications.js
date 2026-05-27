// Запрос разрешения на уведомления
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Отправить браузерное уведомление
export function sendNotification(title, body, icon = '🗣️') {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body.substring(0, 150),
        icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`,
        tag: 'english-club'
      });
    } catch(e) {}
  }
}

// Звук уведомления
let audioCtx = null;
export function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

// Проверить встречи и уведомить
export function checkUpcomingLessons(slots, notifyFn) {
  const now = new Date();
  const in30Min = new Date(now.getTime() + 30 * 60000);
  
  slots?.forEach(slot => {
    const startTime = new Date(slot.start_time);
    if (startTime > now && startTime <= in30Min) {
      notifyFn(
        `📅 Скоро урок: ${slot.title}`,
        `Начало в ${startTime.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`
      );
    }
  });
}
