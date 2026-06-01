import { ref, watch } from 'vue';

const isDark = ref(false);

export function useTheme() {
  // Загружаем сохранённую тему
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    isDark.value = true;
    document.body.classList.add('dark');
  } else if (saved === 'light') {
    isDark.value = false;
    document.body.classList.remove('dark');
  } else {
    // Системные предпочтения
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark.value) document.body.classList.add('dark');
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    if (isDark.value) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return { isDark, toggleTheme };
}
