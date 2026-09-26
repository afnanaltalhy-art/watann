const SUPABASE_URL = 'https://tunjhzdeslsliixoepep.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9d8zAa-nMttJp0n02SyOhg_rvK3ypv-';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const roles = [
  ['طالبة', '🎓'],
  ['معلمة', '📚'],
  ['إدارية', '✦'],
  ['قائدة المدرسة', '♛'],
  ['ولي أمر', '♡']
];

let selected = 'طالبة';
let messages = [];

const $ = id => document.getElementById(id);
const rolesEl = $('roles');
const nameEl = $('name');
const msgEl = $('msg');
const addEl = $('add');
const statusEl = $('status');

roles.forEach(([role, icon]) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'role' + (role === selected ? ' active' : '');
  button.textContent = icon + ' ' + role;

  button.onclick = () => {
    selected = role;
    document.querySelectorAll('.role').forEach(x => x.classList.remove('active'));
    button.classList.add('active');
  };

  rolesEl.appendChild(button);
});

const ar = n => Number(n).toLocaleString('ar-SA');

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const sym = role => roles.find(x => x[0] === role)?.[1] || '♡';

msgEl.addEventListener('input', () => {
  $('chars').textContent = ar(msgEl.value.length);
});

function normalize(x) {
  return {
    id: x.id,
    name: x.name,
    role: x.role,
    message: x.message,
    created_at: x.created_at
  };
}

function render() {
  const list = messages.map(normalize);

  $('total').textContent = ar(list.length);

  $('stats').innerHTML = roles.map(([role, icon]) =>
    `<div class="stat">${icon}<b>${ar(list.filter(x => x.role === role).length)}</b>${role}</div>`
  ).join('');

  $('wall').innerHTML = list.length
    ? list.map(x => `
      <article class="card">
        <div class="person">
          <div class="avatar" data-symbol="${sym(x.role)}"></div>
          <div>
            <h3>${esc(x.name)}</h3>
            <small>${esc(x.role)}</small>
          </div>
        </div>
        <p>${esc(x.message)}</p>
      </article>
    `).join('')
    : `<div class="empty">🌴<br>
       <strong>جدار الوطن ينتظر أول رسالة</strong><br>
       كوني أول من يترك أثرًا جميلًا للوطن 🇸🇦</div>`;
}

async function load() {
  const { data, error } = await db
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('LOAD ERROR:', error);
    $('wall').innerHTML =
      '<div class="empty">تعذر تحميل المشاركات الآن.</div>';
    return;
  }

  messages = data || [];
  render();
}

addEl.onclick = async () => {
  const n = nameEl.value.trim();
  const m = msgEl.value.trim();

  if (!n || !m) {
    statusEl.className = 'status err';
    statusEl.textContent = 'اكتبي الاسم ورسالتك للوطن أولًا';
    return;
  }

  addEl.disabled = true;
  statusEl.className = 'status';
  statusEl.textContent = 'جارٍ إضافة رسالتك…';

  const { data, error } = await db
    .from('messages')
    .insert({
      name: n,
      role: selected,
      message: m
    })
    .select()
    .single();

  addEl.disabled = false;

  if (error) {
    console.error('INSERT ERROR:', error);
    statusEl.className = 'status err';
    statusEl.textContent =
      'تعذر حفظ الرسالة في قاعدة البيانات. حاولي مرة أخرى.';
    return;
  }

  nameEl.value = '';
  msgEl.value = '';
  $('chars').textContent = '٠';

  statusEl.className = 'status ok';
  statusEl.textContent = 'تمت إضافة رسالتك إلى جدار الوطن ✓';

  await load();
};

load();

db.channel('watan-live')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    () => load()
  )
  .subscribe();
