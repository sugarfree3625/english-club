export async function translateWord(word, from = 'en', to = 'ru') {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(word)}`;
    const r = await fetch(url);
    const data = await r.json();
    return data[0]?.map(item => item[0]).join('') || word;
  } catch(e) {
    return word;
  }
}
