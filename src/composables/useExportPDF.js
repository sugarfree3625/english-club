import { jsPDF } from 'jspdf';

export function exportProgressPDF(user, stats, achievements) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Фон
  doc.setFillColor(11, 17, 32);
  doc.rect(0, 0, pageWidth, 297, 'F');
  
  // Заголовок
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('English Club', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.text('Отчёт о прогрессе', pageWidth / 2, 42, { align: 'center' });
  
  // Имя и уровень
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${user?.username || 'Ученик'}`, 20, 60);
  doc.setFontSize(12);
  doc.setTextColor(99, 102, 241);
  doc.text(`Уровень: ${user?.level || 'B1'}`, 20, 70);
  doc.text(`Рейтинг: ${user?.rating || 0} 🏆`, 20, 78);
  
  // Статистика
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Статистика', 20, 100);
  
  doc.setFontSize(12);
  doc.setTextColor(226, 232, 240);
  const statsData = [
    `💬 Сообщений: ${stats.messages || 0}`,
    `📅 Встреч: ${stats.meetings || 0}`,
    `📚 Слов: ${stats.words || 0}`,
    `🏆 Достижений: ${stats.achievements || 0}`
  ];
  statsData.forEach((s, i) => doc.text(s, 25, 112 + i * 8));
  
  // Достижения
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Достижения', 20, 160);
  
  let y = 172;
  const earned = achievements?.filter(a => a.earned) || [];
  doc.setFontSize(11);
  earned.forEach((a, i) => {
    if (y > 270) { doc.addPage(); y = 30; }
    const icon = typeof a.icon === 'string' && a.icon.length <= 2 ? a.icon : '🏆';
    doc.text(`${icon} ${a.name}`, 25, y);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text(a.description || '', 35, y + 5);
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(11);
    y += 16;
  });
  
  if (!earned.length) {
    doc.setTextColor(148, 163, 184);
    doc.text('Пока нет полученных достижений', 25, y);
  }
  
  // Футер
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`English Club © ${new Date().getFullYear()}`, pageWidth / 2, 285, { align: 'center' });
  
  // Скачать
  doc.save(`english-club-progress-${user?.username || 'student'}.pdf`);
}
