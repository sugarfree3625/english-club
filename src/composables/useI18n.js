import { ref } from 'vue';

const locale = ref(localStorage.getItem('locale') || 'ru');

const messages = {
  ru: {
    home: 'Главная',
    dashboard: 'Дашборд',
    profile: 'Профиль',
    messages: 'Сообщения',
    calendar: 'Календарь',
    groups: 'Группы',
    login: 'Войти',
    register: 'Регистрация',
    logout: 'Выйти',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    search: 'Поиск',
    theme_light: 'Светлая тема',
    theme_dark: 'Тёмная тема',
    welcome: 'Добро пожаловать',
    online: 'Онлайн',
    offline: 'Оффлайн',
    typing: 'печатает...',
    today: 'Сегодня',
    yesterday: 'Вчера',
    no_messages: 'Нет сообщений',
    no_groups: 'Нет групп',
    create_group: 'Создать группу',
    send: 'Отправить',
    reply: 'Ответить',
    translate: 'Перевести',
    achievements: 'Достижения',
    schedule: 'Расписание',
    words: 'Словарь',
    notes: 'Блокнот',
    homework: 'Задания',
    students: 'Ученики',
    feedbacks: 'Фидбеки',
    settings: 'Настройки',
    admin: 'Админка'
  },
  en: {
    home: 'Home',
    dashboard: 'Dashboard',
    profile: 'Profile',
    messages: 'Messages',
    calendar: 'Calendar',
    groups: 'Groups',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    search: 'Search',
    theme_light: 'Light theme',
    theme_dark: 'Dark theme',
    welcome: 'Welcome',
    online: 'Online',
    offline: 'Offline',
    typing: 'typing...',
    today: 'Today',
    yesterday: 'Yesterday',
    no_messages: 'No messages',
    no_groups: 'No groups',
    create_group: 'Create group',
    send: 'Send',
    reply: 'Reply',
    translate: 'Translate',
    achievements: 'Achievements',
    schedule: 'Schedule',
    words: 'Dictionary',
    notes: 'Notes',
    homework: 'Homework',
    students: 'Students',
    feedbacks: 'Feedbacks',
    settings: 'Settings',
    admin: 'Admin'
  }
};

export function useI18n() {
  const t = (key) => {
    return messages[locale.value]?.[key] || messages.ru[key] || key;
  };

  const setLocale = (lang) => {
    locale.value = lang;
    localStorage.setItem('locale', lang);
  };

  const toggleLocale = () => {
    setLocale(locale.value === 'ru' ? 'en' : 'ru');
  };

  return { locale, t, setLocale, toggleLocale };
}
