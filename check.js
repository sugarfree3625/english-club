const i = require('sql.js');
const f = require('fs');
i().then(S => {
  const d = new S.Database(f.readFileSync('db.db'));
  const r = d.exec("SELECT email, password, role FROM users WHERE email = 'admin@club.com'");
  if (r.length && r[0].values.length) {
    console.log('Найден:', r[0].values[0][0]);
    console.log('Роль:', r[0].values[0][2]);
  } else {
    console.log('НЕ НАЙДЕН!');
    const all = d.exec("SELECT email FROM users");
    console.log('Все пользователи:', all.length ? all[0].values : 'пусто');
  }
});