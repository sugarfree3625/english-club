const i = require('sql.js');
const f = require('fs');
i().then(S => {
  const d = new S.Database(f.readFileSync('db.db'));
  d.run("UPDATE users SET role = 'admin' WHERE email = 'admin@club.com'");
  const users = d.exec("SELECT id, username, email, role FROM users");
  console.log('Пользователи:');
  if (users.length) users[0].values.forEach(r => console.log(`  ${r[1]} | ${r[2]} | ${r[3]}`));
  f.writeFileSync('db.db', Buffer.from(d.export()));
  console.log('\nГотово! admin@club.com теперь админ.');
});