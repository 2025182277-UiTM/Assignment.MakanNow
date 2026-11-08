/* ===== Login + Register (simulated; no database) =====
   Built-in accounts come from data.js. New accounts are saved in localStorage.
   Prototype only: passwords are stored as plain text, never do this in a real system. */
const homeFor = role => role === 'admin' ? 'dashboard.html' : 'home.html';
const saved = JSON.parse(sessionStorage.getItem('user') || 'null');
if (saved) location.replace(homeFor(saved.role)); // already logged in

const $ = id => document.getElementById(id);
const getUsers = () => [...USERS, ...JSON.parse(localStorage.getItem('users') || '[]')];
function showMsg(el, text, type) { el.textContent = text; el.className = 'alert alert-' + type; }
function hideMsgs() { ['loginMsg', 'regMsg'].forEach(i => $(i).className = 'alert d-none'); }

// Switch between the Login and Register forms
function showPane(pane) {
  const isLogin = pane === 'login';
  $('loginForm').classList.toggle('d-none', !isLogin);
  $('registerForm').classList.toggle('d-none', isLogin);
  $('tabLogin').classList.toggle('active', isLogin);
  $('tabRegister').classList.toggle('active', !isLogin);
  hideMsgs();
}
$('tabLogin').onclick = () => showPane('login');
$('tabRegister').onclick = () => showPane('register');

// ---- Login ----
$('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const u = $('username').value.trim().toLowerCase(), p = $('password').value;
  const match = getUsers().find(x => x.username === u && x.password === p);
  if (match) {
    sessionStorage.setItem('user', JSON.stringify({ username: match.username, name: match.name, role: match.role }));
    location.href = homeFor(match.role);
  } else {
    showMsg($('loginMsg'), !u || !p ? 'Enter both username and password.' : 'Wrong username or password. Check your details or register a new account.', 'danger');
    $('password').value = ''; $('password').focus();
  }
});
$('togglePw').addEventListener('click', () => { const f = $('password'), show = f.type === 'password'; f.type = show ? 'text' : 'password'; $('togglePw').textContent = show ? 'Hide' : 'Show'; });

// ---- Register ----
$('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('regName').value.trim(), user = $('regUser').value.trim().toLowerCase();
  const pw = $('regPw').value, pw2 = $('regPw2').value, msg = $('regMsg');
  if (!name || !user || !pw || !pw2) return showMsg(msg, 'Fill in all fields.', 'danger');
  if (!/^[a-z0-9]{3,15}$/.test(user)) return showMsg(msg, 'Username must be 3 to 15 letters or numbers, no spaces.', 'danger');
  if (getUsers().some(x => x.username === user)) return showMsg(msg, 'That username is taken. Try another one.', 'danger');
  if (pw.length < 6) return showMsg(msg, 'Password must be at least 6 characters.', 'danger');
  if (pw !== pw2) return showMsg(msg, 'Passwords do not match.', 'danger');

  const list = JSON.parse(localStorage.getItem('users') || '[]');
  list.push({ username: user, password: pw, name, role: 'customer' });
  localStorage.setItem('users', JSON.stringify(list));
  $('registerForm').reset();
  showPane('login');
  $('username').value = user; $('password').focus();
  showMsg($('loginMsg'), 'Account created. Log in with your new username and password.', 'success');
});
