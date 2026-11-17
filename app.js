'use strict';
/* Хозяйкина тетрадь — планировщик бюджета на еду.
   Данные хранятся в localStorage этого устройства. */

const KEY = 'hozyayka-tetrad-v1';
const DAYS = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const RCATS = { breakfast:'Завтраки', main:'Обеды и ужины', sweet:'Сладкое к кофе', snack:'Перекусы и салаты', drink:'Напитки', prep:'Заготовки' };
const MEAL_CATS = ['breakfast','main','sweet','snack','drink'];
// Приёмы пищи по умолчанию. light — «лёгкий» приём (норма бюджета вдвое меньше).
const DEFAULT_SLOTS = () => [
  { id:'b', name:'Завтрак', cat:'breakfast', on:true },
  { id:'l', name:'Обед', cat:'main', on:true },
  { id:'c', name:'Кофе со сладким', cat:'sweet', on:true, light:true },
  { id:'d', name:'Ужин', cat:'main', on:true },
];
const PCATS = ['Овощи и фрукты','Крупы и макароны','Мясо и рыба','Молочное и яйца','Хлеб и бакалея','Другое'];
const UNITS = ['кг','г','л','мл','шт','упак','банка','пучок'];
// Подсказки «что сделать заранее» по разделу продукта
const PREP_TIPS = {
  'Овощи и фрукты': 'помыть, почистить и нарезать — сложить в контейнеры',
  'Крупы и макароны': 'сварить сразу большую кастрюлю, разложить по контейнерам (3–4 дня в холодильнике)',
  'Мясо и рыба': 'нарезать, замариновать и разделить на порции; часть — в морозилку',
};
const plural = (n, a, b, c) => { n = Math.abs(n); if(n % 1) return b; n %= 100; if(n>10 && n<20) return c; n %= 10; return n===1 ? a : n>=2 && n<=4 ? b : c; };
const tipFor = p => p.tip ?? PREP_TIPS[p.cat] ?? '';

/* ---------- утилиты ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = s => { const n = parseFloat(String(s ?? '').replace(/\s/g,'').replace(',','.')); return isFinite(n) ? n : 0; };
const fmt = (n, d=2) => (Math.round(n*100)/100).toLocaleString('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d});
const fq = n => (Math.round(n*1000)/1000).toLocaleString('ru-RU',{maximumFractionDigits:3});
const uid = () => Math.random().toString(36).slice(2,9);
const money = n => `${fmt(n)} ${esc(S.settings.currency)}`;

/* ---------- пример данных (из таблицы) ---------- */
function seed(){
  const p = (id,name,unit,pack,price,cat) => ({id,name,unit,pack,price,cat,shop:''});
  const tips = { eggs:'сварить сразу на несколько дней — хранятся неделю в холодильнике', banana:'', milk:'',
    beans:'замочить с вечера и отварить всю порцию сразу', potato:'отварить или запечь сразу на 2 дня' };
  const products = [
    p('oats','Овсянка','г',165,4.49,'Крупы и макароны'),
    p('bread','Хлеб (буханка)','шт',1,8.39,'Хлеб и бакалея'),
    p('eggs','Яйца','шт',30,27.5,'Молочное и яйца'),
    p('milk','Молоко','л',1,5.59,'Молочное и яйца'),
    p('coffee','Кофе','г',40,6.19,'Хлеб и бакалея'),
    p('banana','Бананы','кг',1,5.67,'Овощи и фрукты'),
    p('pasta','Макароны','г',400,3.09,'Крупы и макароны'),
    p('chickcut','Куриное филе, нарезанное','кг',1,20.92,'Мясо и рыба'),
    p('chicken','Куриное филе','г',700,15.9,'Мясо и рыба'),
    p('beans','Фасоль','кг',1,8.59,'Крупы и макароны'),
    p('broccoli','Брокколи','кг',1,24.5,'Овощи и фрукты'),
    p('rice','Рис','кг',1,5.99,'Крупы и макароны'),
    p('onion','Лук','кг',1,3.67,'Овощи и фрукты'),
    p('carrot','Морковь','кг',1,5.57,'Овощи и фрукты'),
    p('potato','Картофель','кг',1,5.25,'Овощи и фрукты'),
    p('tomato','Помидоры','кг',1,9.68,'Овощи и фрукты'),
    p('arugula','Руккола','пучок',1,4.29,'Овощи и фрукты'),
    p('cucumber','Огурцы','кг',1,11.28,'Овощи и фрукты'),
    p('cabbage','Капуста','кг',1,5.98,'Овощи и фрукты'),
    p('spices','Специи','упак',1,7.19,'Хлеб и бакалея'),
    p('sardines','Сардины, 75 г','банка',1,6.19,'Мясо и рыба'),
  ];
  products.forEach(x => { if(x.id in tips) x.tip = tips[x.id]; });
  const it = (ref,qty) => ({ref,qty});
  const recipes = [
    { id:'sauce', name:'Соус с овощами', cat:'prep', serves:1, art:'jar', time:25,
      items:[it('carrot',0.2),it('onion',0.2),it('tomato',0.16),it('spices',0.3)],
      steps:'Лук и морковь мелко нарезать.\nОбжарить 5 минут на масле.\nДобавить помидоры и специи, тушить 15 минут.\nОстудить, разложить по банкам — в холодильнике до 4 дней.' },
    { id:'oatmeal', name:'Овсянка с бананом и яйцом', cat:'breakfast', serves:4, art:'bowl', time:15,
      items:[it('oats',165),it('milk',0.5),it('eggs',6),it('banana',0.36),it('coffee',6)],
      steps:'Овсянку залить молоком пополам с водой, варить 5 минут.\nБананы нарезать кружочками сверху.\nЯйца сварить 8 минут.\nСварить кофе.' },
    { id:'toast', name:'Бутерброды с яичницей', cat:'breakfast', serves:4, art:'pan', time:10,
      items:[it('bread',0.5),it('eggs',6),it('coffee',6)],
      steps:'Хлеб нарезать и подсушить на сковороде.\nПожарить яичницу.\nСварить кофе.' },
    { id:'chickpasta', name:'Курица с макаронами и соусом', cat:'main', serves:4, art:'chicken', time:25,
      items:[it('chickcut',0.5),it('pasta',400),it('r:sauce',1)],
      steps:'Отварить макароны.\nКурицу обжарить 7–8 минут.\nДобавить баночку соуса, прогреть вместе.' },
    { id:'beansrice', name:'Фасоль с рисом и брокколи', cat:'main', serves:4, art:'pot', time:20,
      items:[it('beans',0.25),it('rice',0.3),it('broccoli',0.25),it('r:sauce',1)],
      steps:'Фасоль замочить с вечера, отварить 40 минут (или взять сваренную заранее).\nРис отварить.\nБрокколи — на пару 5 минут.\nПодавать с соусом.' },
    { id:'ricefish', name:'Рис с яйцом и сардинами', cat:'main', serves:4, art:'fish', time:15,
      items:[it('rice',0.3),it('eggs',6),it('sardines',1),it('arugula',1)],
      steps:'Рис отварить (или взять из заготовки).\nЯйца сварить.\nВыложить сардины, руккола сверху.' },
    { id:'potatosalad', name:'Картошка с курицей и салатом', cat:'main', serves:4, art:'salad', time:35,
      items:[it('potato',1),it('chicken',350),it('cabbage',0.3),it('cucumber',0.2)],
      steps:'Картошку отварить или запечь.\nКурицу нарезать и обжарить.\nКапусту нашинковать, огурец нарезать, посолить.' },
  ];
  return { v:2, settings:{ budget:500, people:4, currency:'R$', slots:DEFAULT_SLOTS() }, products, recipes, plan:{}, bought:{}, notes:'' };
}

// Старый формат (3 приёма, plan['d-0'] = id) → слоты и списки блюд
function migrate(s){
  if(!s.settings.slots){
    s.settings.slots = DEFAULT_SLOTS();
    const map = { 0:'b', 1:'l', 2:'d' }, np = {};
    for(const k in s.plan){ const [d, m] = k.split('-'); if(map[m] && s.plan[k]) np[`${d}-${map[m]}`] = s.plan[k]; }
    s.plan = np;
  }
  for(const k in s.plan){ if(!Array.isArray(s.plan[k])) s.plan[k] = [s.plan[k]]; }
  s.v = 2;
  return s;
}

const shuffle = a => { a = [...a]; for(let i=a.length-1; i>0; i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };

// Разложить блюда на неделю: максимум разнообразия, и чтобы влезло в бюджет.
// Пробуем много случайных раскладок и берём первую, что уложилась (или самую дешёвую).
function autofill(tries = 300){
  const act = slots(), drinks = S.recipes.filter(r => r.cat === 'drink');
  const pool = c => S.recipes.filter(r => r.cat === c);
  let best = null, bestTotal = Infinity;
  for(let t = 0; t < tries; t++){
    const plan = {}, bags = {}; let total = 0;
    const next = c => { const p = pool(c); if(!p.length) return null; if(!bags[c]?.length) bags[c] = shuffle(p); return bags[c].pop(); };
    for(let d = 0; d < 7; d++){
      const today = new Set();
      for(const sl of act){
        let r = next(sl.cat); if(r && today.has(r.id)) r = next(sl.cat);
        if(!r) continue; today.add(r.id);
        const ids = [r.id]; if(sl.cat === 'sweet' && drinks.length) ids.push(drinks[0].id);
        plan[`${d}-${sl.id}`] = ids;
        total += ids.reduce((s, id) => s + mealCost(R(id), slotPeople(sl)), 0);
      }
    }
    if(total < bestTotal){ best = plan; bestTotal = total; }
    if(total <= S.settings.budget){ best = plan; break; }
  }
  // приёмы, которые сейчас выключены, не трогаем
  const keep = {}; for(const k in S.plan){ const sid = k.split('-')[1]; if(!act.some(x => x.id === sid)) keep[k] = S.plan[k]; }
  S.plan = { ...keep, ...(best || {}) };
}

/* ---------- состояние ---------- */
let S, fresh = false;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch(e) {}
if(!S || !S.products){ S = seed(); fresh = true; }
migrate(S);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} };

/* ---------- расчёты ---------- */
const P = id => S.products.find(p => p.id === id);
const R = id => S.recipes.find(r => r.id === id);
const unitPrice = p => p.pack > 0 ? p.price / p.pack : 0;
const isPrepRef = ref => ref.startsWith('r:');

function itemCost(it, depth=0){
  if(isPrepRef(it.ref)){ const r = R(it.ref.slice(2)); return r && depth < 5 ? recipeCost(r, depth+1) * it.qty : 0; }
  const p = P(it.ref); return p ? unitPrice(p) * it.qty : 0;
}
const recipeCost = (r, depth=0) => r.items.reduce((s,it) => s + itemCost(it, depth), 0);
const mealFactor = (r, people = S.settings.people) => people / (r.serves || 1);
const mealCost = (r, people) => recipeCost(r) * mealFactor(r, people);
const slots = () => S.settings.slots.filter(x => x.on);
const slotPeople = sl => sl.people || S.settings.people;
const slotWeight = sl => (sl.light ? 0.5 : 1) * slotPeople(sl) / Math.max(1, S.settings.people);
// Норма бюджета на один приём: делим недельный бюджет по «весам» приёмов
function normFor(sl){ const W = slots().reduce((s, x) => s + slotWeight(x), 0); return W ? S.settings.budget / 7 / W * slotWeight(sl) : 0; }
const refName = ref => isPrepRef(ref) ? (R(ref.slice(2))?.name ?? '—') : (P(ref)?.name ?? '—');
const refUnit = ref => isPrepRef(ref) ? 'партия' : (P(ref)?.unit ?? '');

function plannedMeals(){
  const out = [];
  for(let d=0; d<7; d++) for(const sl of slots()) for(const id of (S.plan[`${d}-${sl.id}`] || [])){
    const r = R(id); if(r) out.push({ d, sl, r, people: slotPeople(sl) });
  }
  return out;
}
const weekTotal = () => plannedMeals().reduce((s,x) => s + mealCost(x.r, x.people), 0);

// Что нужно на неделю: продукты, заготовки, сколько раз встречается
function weekNeeds(){
  const need = {}, preps = {}, uses = {};
  const add = (items, f, depth) => {
    for(const it of items){
      if(isPrepRef(it.ref)){
        const r = R(it.ref.slice(2)); if(!r || depth > 5) continue;
        preps[r.id] = (preps[r.id] || 0) + it.qty * f;
        add(r.items, it.qty * f, depth + 1);
      } else {
        need[it.ref] = (need[it.ref] || 0) + it.qty * f;
        uses[it.ref] = (uses[it.ref] || 0) + 1;
      }
    }
  };
  for(const {r, people} of plannedMeals()) add(r.items, mealFactor(r, people), 0);
  return { need, preps, uses };
}
const packsFor = (p, q) => p.pack > 0 ? Math.ceil(q / p.pack - 1e-9) : 0;

/* ---------- отрисовка ---------- */
const TABS = [['week','Неделя','week'],['recipes','Рецепты','book'],['products','Цены','tag'],['shop','Покупки','cart'],['prep','Заготовки','jar']];

function route(){ const [v, id] = (location.hash.slice(1) || 'week').split('/'); return { v, id }; }

function render(){
  const { v, id } = route();
  const views = { week:vWeek, recipes:vRecipes, recipe:()=>vRecipe(id), library:vLibrary, products:vProducts, shop:vShop, prep:vPrep };
  const tab = v === 'recipe' || v === 'library' ? 'recipes' : v;
  $('#app').innerHTML = (views[v] || vWeek)();
  $('#tabs').innerHTML = TABS.map(([k,t,ic]) => `<a href="#${k}" class="tab tab-${k} ${k===tab?'on':''}">${icon(ic)}<span>${t}</span></a>`).join('');
}

const tagsHtml = tags => tags?.length ? `<span class="tags">${tags.map(t => `<i>${esc(t)}</i>`).join('')}</span>` : '';
function header(title, extra=''){
  return `<header class="head"><h1>${title}</h1>${extra}</header>`;
}

/* --- Неделя --- */
function recipeOptions(sel, first){
  let h = `<option value="">— не выбрано —</option>`;
  for(const c of [first, ...MEAL_CATS.filter(c => c !== first)]){
    const rs = S.recipes.filter(r => r.cat === c); if(!rs.length) continue;
    h += `<optgroup label="${RCATS[c]}">` + rs.map(r => `<option value="${r.id}" ${r.id===sel?'selected':''}>${esc(r.name)}</option>`).join('') + `</optgroup>`;
  }
  return h;
}
const cnt = (n, a, b, c) => `${n} ${plural(n, a, b, c)}`;

function vWeek(){
  const st = S.settings, act = slots(), total = weekTotal(), left = st.budget - total;
  const mainNorm = act.find(x => !x.light) ? normFor(act.find(x => !x.light)) : 0;
  const lightSl = act.find(x => x.light);
  const perPerson = st.budget / 7 / Math.max(1, st.people);
  const pct = st.budget > 0 ? Math.min(100, total / st.budget * 100) : 0;
  const over = left < 0;
  let h = header('Хозяйкина тетрадь', `<button class="icon-btn" data-act="settings" aria-label="Настройки">⚙</button>`);
  h += `<section class="card budget">
    ${sketch('basket','float')}
    <h2>Бюджет на неделю</h2>
    <label class="line">Бюджет: <input class="ink-in w5" inputmode="decimal" data-f="budget" value="${fmt(st.budget)}"> ${esc(st.currency)}</label>
    <label class="line">Едоков: <input class="ink-in w2" inputmode="numeric" data-f="people" value="${st.people}"> чел.</label>
    <p class="pencil">${act.map(x => esc(x.name.toLowerCase())).join(' · ')} — ${cnt(act.length*7,'приём','приёма','приёмов')} за неделю
      <button class="linkbtn" data-act="settings">изменить</button></p>
    <p>На обед или ужин: <b class="hl">${money(mainNorm)}</b>${lightSl ? `<br>На «${esc(lightSl.name.toLowerCase())}»: <b>${money(normFor(lightSl))}</b>` : ''}<br>
      <span class="pencil">≈ ${money(perPerson)} на человека в день</span></p>
    <div class="bar ${over?'over':''}"><i style="width:${pct}%"></i></div>
    <table class="sum"><tr><td>Запланировано</td><td class="r">${money(total)}</td></tr>
    <tr><td>${over?'Перерасход':'Остаток'}</td><td class="r ${over?'red':'green'}"><b>${money(Math.abs(left))}</b></td></tr></table>
    ${over ? '<div class="stamp">Перерасход!</div>' : ''}
  </section>
  <div class="tools"><button class="btn" data-act="autofill">↻ Разложить в бюджет</button><button class="btn ghost" data-act="clearplan">Очистить</button></div>`;
  for(let d=0; d<7; d++){
    let ds = 0, rows = '';
    for(const sl of act){
      const key = `${d}-${sl.id}`, ids = S.plan[key]?.length ? S.plan[key] : [''];
      const sc = ids.reduce((s, id) => s + (R(id) ? mealCost(R(id), slotPeople(sl)) : 0), 0); ds += sc;
      const red = sc > normFor(sl) * 1.001;
      rows += ids.map((id, i) => { const r = R(id), c = r ? mealCost(r, slotPeople(sl)) : 0;
        return `<div class="meal ${i ? 'extra' : ''}"><span class="mname">${i ? '' : esc(sl.name)}${!i && sl.people ? `<small>${sl.people} чел.</small>` : ''}</span>
        <select class="ink-sel" data-slot="${key}" data-i="${i}">${recipeOptions(r?.id, sl.cat)}</select>
        <span class="mcost ${r && red ? 'red' : ''}">${r ? fmt(c) : ''}</span>
        <span class="acts">${r ? `<a class="go" href="#recipe/${r.id}" aria-label="Открыть рецепт">→</a>` : ''}${i
          ? `<button class="mini-btn x" data-act="deldish" data-key="${key}" data-i="${i}" aria-label="Убрать блюдо">×</button>`
          : (r ? `<button class="mini-btn" data-act="adddish" data-key="${key}" aria-label="Добавить блюдо в этот приём">+</button>` : '')}</span></div>`; }).join('');
    }
    h += `<section class="day"><h2>${DAYS[d]} <span class="daysum">${ds ? money(ds) : ''}</span></h2>${rows}</section>`;
  }
  h += `<p class="pencil foot">Красным — приёмы дороже нормы. «+» — добавить второе блюдо в приём (например, салат к супу или кофе к пирогу). Пироги и супы на 6–10 порций считаются частями: одна выпечка — на 2–3 раза.</p>`;
  return h;
}

/* --- Рецепты --- */
function vRecipes(){
  let h = header('Рецепты', `<button class="btn small" data-act="newrecipe">+ Свой</button>`);
  const fresh = LIB.recipes.filter(lr => !inBook(lr)).length;
  h += `<a class="card libbanner" href="#library">${sketch('pancakes','float')}<h2>Книга рецептов</h2>
    <p>${fresh ? `${fresh} недорогих домашних блюд — добавляйте в тетрадь одним нажатием →` : 'Все блюда из книги уже в тетради ✓'}</p></a>`;
  for(const c of Object.keys(RCATS)){
    const rs = S.recipes.filter(r => r.cat === c); if(!rs.length) continue;
    h += `<h2 class="sec">${RCATS[c]}</h2><div class="grid">`;
    h += rs.map((r,i) => `<a class="rcard" href="#recipe/${r.id}" style="--tilt:${(i%3-1)*0.8}deg">
      ${sketch(r.art)}<b>${esc(r.name)}</b>
      <span class="pencil">${c==='prep' ? `1 партия — ${money(recipeCost(r))}` : `на ${S.settings.people} чел. — ${money(mealCost(r))}`}</span>${tagsHtml(r.tags)}</a>`).join('');
    h += `</div>`;
  }
  return h;
}

function vRecipe(id){
  const r = R(id); if(!r) return `<p>Рецепт не найден. <a href="#recipes">К рецептам</a></p>`;
  const cost = recipeCost(r), prep = r.cat === 'prep';
  const used = plannedMeals().filter(x => x.r.id === id).length;
  const usedAsPrep = prep ? S.recipes.filter(x => x.items.some(i => i.ref === 'r:'+id)).map(x => x.name) : [];
  let h = `<a class="back" href="#recipes">← все рецепты</a>
  <article class="card recipe">
    ${sketch(r.art,'big')}
    <h1>${esc(r.name)}</h1>
    <p class="pencil">${RCATS[r.cat]}${prep ? '' : ` · на ${r.serves} порц.`}${r.time ? ` · ${r.time} мин` : ''}</p>
    ${tagsHtml(r.tags)}
    <table class="tbl"><thead><tr><th>Продукт</th><th class="r">Кол-во</th><th class="r">Цена</th></tr></thead><tbody>
    ${r.items.map(it => `<tr><td>${isPrepRef(it.ref) ? `<a href="#recipe/${it.ref.slice(2)}">${esc(refName(it.ref))}</a>` : esc(refName(it.ref))}</td>
      <td class="r">${fq(it.qty)} ${esc(refUnit(it.ref))}</td><td class="r">${fmt(itemCost(it))}</td></tr>`).join('')}
    </tbody></table>
    <table class="sum">
      <tr><td>Итого${prep ? ' за партию' : ` на ${r.serves} порц.`}</td><td class="r"><b class="hl">${money(cost)}</b></td></tr>
      ${prep ? '' : `<tr><td>На семью (${S.settings.people} чел.)</td><td class="r">${money(mealCost(r))}</td></tr>
      <tr><td>На 1 порцию</td><td class="r">${money(cost / (r.serves||1))}</td></tr>`}
    </table>
    ${r.steps ? `<h2>Как готовить</h2><ol class="steps">${r.steps.split('\n').filter(Boolean).map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    <p class="pencil">${prep ? (usedAsPrep.length ? 'Идёт в: ' + esc(usedAsPrep.join(', ')) : 'Пока не используется в рецептах') : (used ? `В плане на неделю: ${used} раз(а)` : 'В плане на неделю пока нет')}</p>
    <div class="tools"><button class="btn" data-act="editrecipe" data-id="${r.id}">✎ Изменить</button><button class="btn ghost" data-act="duprecipe" data-id="${r.id}">Копия</button></div>
  </article>`;
  return h;
}

/* --- Цены --- */
function vProducts(){
  let h = header('Цены', `<button class="btn small" data-act="newproduct">+ Продукт</button>`);
  h += `<p class="pencil">Впишите цену упаковки — рецепты и бюджет пересчитаются сами.</p>
    <div class="tools"><button class="btn small" data-act="fetchprices">⇩ Свежие цены Extra</button><label class="btn small ghost">Цены из файла<input type="file" accept="application/json,.json" data-act-file="prices" hidden></label></div>`;
  for(const c of PCATS){
    const ps = S.products.filter(p => (p.cat || 'Другое') === c).sort((a,b) => a.name.localeCompare(b.name,'ru')); if(!ps.length) continue;
    h += `<h2 class="sec">${c}</h2><div class="plist">`;
    h += ps.map(p => `<div class="prow">
      <button class="pname" data-act="editproduct" data-id="${p.id}">${esc(p.name)}<small>${fq(p.pack)} ${esc(p.unit)}${p.shop ? ' · ' + esc(p.shop) : ''}${p.approx ? ' · <span class="red">цена примерная — проверьте</span>' : ''}</small></button>
      <label class="price"><input class="ink-in w4" inputmode="decimal" data-price="${p.id}" value="${fmt(p.price)}"><small>${esc(S.settings.currency)}</small></label>
      <span class="pencil unitp">${unitLine(p)}</span></div>`).join('');
    h += `</div>`;
  }
  return h;
}
function unitLine(p){
  const u = unitPrice(p);
  if(p.unit === 'г') return `${fmt(u*1000)} за кг`;
  if(p.unit === 'мл') return `${fmt(u*1000)} за л`;
  if(p.pack === 1) return '';
  return `${fmt(u)} за ${p.unit}`;
}

/* --- Покупки --- */
function vShop(){
  const { need } = weekNeeds();
  const ids = Object.keys(need).filter(id => P(id));
  let used = 0, buy = 0, leftBuy = 0;
  for(const id of ids){ const p = P(id), q = need[id], k = packsFor(p,q); used += unitPrice(p)*q; buy += k*p.price; if(!S.bought[id]) leftBuy += k*p.price; }
  let h = header('Список покупок', `<button class="icon-btn" data-act="copylist" aria-label="Скопировать">⧉</button>`);
  if(!ids.length) return h + `<div class="card empty">${sketch('basket','big')}<p>План на неделю пуст — выберите блюда на закладке «Неделя».</p></div>`;
  h += `<section class="card"><table class="sum">
    <tr><td>Уйдёт по рецептам</td><td class="r">${money(used)}</td></tr>
    <tr><td>Купить целыми упаковками</td><td class="r"><b class="hl">${money(buy)}</b></td></tr>
    <tr><td>Осталось купить</td><td class="r">${money(leftBuy)}</td></tr>
    <tr><td>Бюджет</td><td class="r ${buy > S.settings.budget ? 'red' : 'green'}">${money(S.settings.budget)}</td></tr></table>
    <p class="pencil">Разница между «по рецептам» и «упаковками» — то, что останется на следующую неделю.</p></section>`;
  for(const c of PCATS){
    const rows = ids.filter(id => (P(id).cat || 'Другое') === c); if(!rows.length) continue;
    h += `<h2 class="sec">${c}</h2><ul class="shop">`;
    h += rows.map(id => { const p = P(id), q = need[id], k = packsFor(p,q), b = !!S.bought[id];
      return `<li class="${b?'done':''}" data-act="buy" data-id="${id}"><span class="box">${b?'✓':''}</span>
        <span class="sn">${esc(p.name)}<small>нужно ${fq(q)} ${esc(p.unit)}${p.shop ? ' · ' + esc(p.shop) : ''}</small></span>
        <span class="sq">${k} × ${fq(p.pack)} ${esc(p.unit)}</span><span class="sc">${fmt(k*p.price)}</span></li>`; }).join('');
    h += `</ul>`;
  }
  h += `<div class="tools"><button class="btn ghost" data-act="unbuy">Снять все отметки</button></div>`;
  return h;
}

/* --- Заготовки --- */
function vPrep(){
  const { need, preps, uses } = weekNeeds();
  let h = header('Заготовки');
  h += `<p class="pencil">Что приготовить в «день готовки», чтобы в будни только разогреть и собрать.</p>`;
  const pids = Object.keys(preps).filter(R);
  if(pids.length){
    h += `<h2 class="sec">Заготовки на неделю</h2>`;
    for(const id of pids){
      const r = R(id), k = preps[id];
      h += `<section class="card prep">${sketch(r.art,'float')}<h2><a href="#recipe/${id}">${esc(r.name)}</a></h2>
        <p>Нужно: <b class="hl">${fq(k)} ${plural(k,'партия','партии','партий')}</b></p>
        <ul class="mini">${r.items.map(it => `<li>${esc(refName(it.ref))} — ${fq(it.qty*k)} ${esc(refUnit(it.ref))}</li>`).join('')}</ul>
        ${r.steps ? `<ol class="steps">${r.steps.split('\n').filter(Boolean).map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}</section>`;
    }
  }
  const tips = Object.keys(need).filter(id => P(id) && uses[id] >= 2 && tipFor(P(id)));
  if(tips.length){
    h += `<h2 class="sec">Что можно сделать заранее</h2><section class="card"><ul class="tips">`;
    h += tips.sort((a,b) => uses[b]-uses[a]).map(id => { const p = P(id);
      return `<li><b>${esc(p.name)}</b> — ${fq(need[id])} ${esc(p.unit)}, в ${uses[id]} блюдах:<br><span class="pencil">${esc(tipFor(p))}</span></li>`; }).join('');
    h += `</ul></section>`;
  }
  if(!pids.length && !tips.length) h += `<div class="card empty">${sketch('jar','big')}<p>В плане пока нет заготовок. Отметьте рецепт как «Заготовка» и добавьте его в блюда как ингредиент.</p></div>`;
  h += `<h2 class="sec">Мои заметки</h2><textarea class="notes" data-f="notes" placeholder="Купить контейнеры, разморозить курицу в субботу…">${esc(S.notes)}</textarea>`;
  return h;
}

/* --- Книга рецептов --- */
const libState = { cat:'all', q:'' };
const normName = s => String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]/g,'');
// продукт из книги → продукт в тетради (по id или по названию)
const localProduct = (id, src=LIB) => P(id) || S.products.find(p => normName(p.name) === normName(src.products[id]?.name));
const inBook = (lr, src=LIB) => S.recipes.some(r => r.id === lr.id || normName(r.name) === normName(lr.name));
function libCost(lr, src=LIB, depth=0){
  return lr.items.reduce((s,[ref,q]) => {
    if(ref.startsWith('r:')){ const pr = src.recipes.find(x => x.id === ref.slice(2)); return s + (pr && depth<5 ? libCost(pr, src, depth+1)*q : 0); }
    const p = localProduct(ref, src) || src.products[ref]; return s + (p && p.pack ? p.price/p.pack*q : 0);
  }, 0);
}
function libRefName(ref, src=LIB){
  if(ref.startsWith('r:')) return src.recipes.find(x => x.id === ref.slice(2))?.name ?? '—';
  return (localProduct(ref, src) || src.products[ref])?.name ?? ref;
}
function libRefUnit(ref, src=LIB){ return ref.startsWith('r:') ? 'партия' : ((localProduct(ref, src) || src.products[ref])?.unit ?? ''); }
// Добавить рецепт (и нужные заготовки, продукты) в тетрадь. Возвращает имена новых продуктов.
function addFromLib(id, src=LIB, depth=0){
  const lr = src.recipes.find(x => x.id === id); if(!lr || depth > 5) return [];
  const existing = S.recipes.find(r => r.id === lr.id || normName(r.name) === normName(lr.name));
  if(existing) return [];
  const added = [], items = [];
  for(const [ref, qty] of lr.items){
    if(ref.startsWith('r:')){
      const pid = ref.slice(2); added.push(...addFromLib(pid, src, depth+1));
      const pr = src.recipes.find(x => x.id === pid);
      const local = pr && S.recipes.find(r => r.id === pr.id || normName(r.name) === normName(pr.name));
      if(local) items.push({ ref:'r:'+local.id, qty });
      continue;
    }
    let p = localProduct(ref, src);
    if(!p){
      const d = src.products[ref]; if(!d) continue;
      p = { id: P(ref) ? uid() : ref, name:d.name, unit:d.unit, pack:d.pack, price:d.price, cat: PCATS.includes(d.cat) ? d.cat : 'Другое', shop:'', approx:true };
      if(d.tip !== undefined) p.tip = d.tip;
      S.products.push(p); added.push(p.name);
    }
    items.push({ ref:p.id, qty });
  }
  S.recipes.push({ id: R(lr.id) ? uid() : lr.id, name:lr.name, cat: RCATS[lr.cat] ? lr.cat : 'main', serves: lr.serves || 4, art: ART[lr.art] ? lr.art : 'pot', time: lr.time || '', steps: lr.steps || '', items, ...(lr.tags ? { tags:[...lr.tags] } : {}) });
  save();
  return added;
}
function libList(){
  const q = normName(libState.q);
  const order = ['breakfast','main','sweet','snack','drink','prep'];
  return [...LIB.recipes].sort((x,y) => order.indexOf(x.cat) - order.indexOf(y.cat)).filter(lr => (libState.cat === 'all' || lr.cat === libState.cat || (libState.cat === 'healthy' && lr.set === 'healthy')) && (!q || normName(lr.name).includes(q) || lr.items.some(([ref]) => normName(libRefName(ref)).includes(q))));
}
function libFactor(lr){ return lr.cat === 'prep' ? 1 : S.settings.people / (lr.serves || 4); }
function vLibrary(){
  let h = `<a class="back" href="#recipes">← мои рецепты</a>` + header('Книга рецептов');
  h += `<p class="pencil">Простые домашние блюда из продуктов, которые легко найти. Цены — по вашим ценам из тетради, а где их нет — примерные.</p>`;
  h += `<div class="chips">${[['all','Все'],['healthy','★ Полезная подборка'],...Object.entries(RCATS)].map(([k,v]) => `<button class="chip ${libState.cat===k?'on':''}" data-act="libcat" data-c="${k}">${v}</button>`).join('')}</div>`;
  h += `<input class="ink-in search" data-f="libq" value="${esc(libState.q)}" placeholder="Поиск: курица, тыква, суп…">`;
  return h + `<div id="libgrid">${libGrid()}</div>`;
}
function libGrid(){
  const list = libList(); let h = '';
  if(!list.length) return `<p class="pencil">Ничего не нашлось.</p>`;
  h += `<div class="grid">` + list.map((lr,i) => { const has = inBook(lr);
    return `<div class="rcard lib ${has?'has':''}" style="--tilt:${(i%3-1)*0.8}deg">
      <button class="plain" data-act="libview" data-id="${lr.id}">${sketch(lr.art)}<b>${esc(lr.name)}</b>
      <span class="pencil">${lr.cat==='prep' ? `партия ≈ ${money(libCost(lr))}` : `на ${S.settings.people} чел. ≈ ${money(libCost(lr)*libFactor(lr))}`}${lr.time ? ` · ${lr.time} мин` : ''}</span>${tagsHtml(lr.tags)}</button>
      ${has ? `<span class="inbook">✓ в тетради</span>` : `<button class="btn small" data-act="libadd" data-id="${lr.id}">+ В тетрадь</button>`}</div>`; }).join('') + `</div>`;
  if(list.some(lr => !inBook(lr))) h += `<div class="tools"><button class="btn ghost" data-act="liball">Добавить все из списка</button></div>`;
  return h;
}
function libPreview(id){
  const lr = LIB.recipes.find(x => x.id === id); if(!lr) return;
  const has = inBook(lr), prep = lr.cat === 'prep';
  openModal(`${sketch(lr.art,'big')}<h2 style="text-align:center">${esc(lr.name)}</h2>
    <p class="pencil" style="text-align:center">${RCATS[lr.cat]}${prep ? '' : ` · на ${lr.serves} порц.`}${lr.time ? ` · ${lr.time} мин` : ''}</p>
    <table class="tbl"><thead><tr><th>Продукт</th><th class="r">Кол-во</th></tr></thead><tbody>
    ${lr.items.map(([ref,q]) => `<tr><td>${esc(libRefName(ref))}${!ref.startsWith('r:') && !localProduct(ref) ? ' <span class="pencil">(новый)</span>' : ''}</td><td class="r">${fq(q)} ${esc(libRefUnit(ref))}</td></tr>`).join('')}
    </tbody></table>
    <p class="right">${prep ? 'Партия' : `На ${lr.serves} порц.`} ≈ <b class="hl">${money(libCost(lr))}</b></p>
    <ol class="steps">${lr.steps.split('\n').filter(Boolean).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="tools">${has ? '<span class="inbook">✓ уже в тетради</span>' : `<button class="btn" data-act="libadd" data-id="${lr.id}">+ В тетрадь</button>`}<button class="btn ghost" data-act="close">Закрыть</button></div>`);
}

/* --- Обновление цен из файла магазина ---
   Формат: { type:"prices", source:"Extra", date:"2026-11-16",
             prices:[{ id?, name, aliases?:[..], storeName, pack, unit, price, cat? }] }
   Единицу продукта в тетради не меняем (на ней держатся рецепты): размер упаковки
   переводим в неё (кг↔г, л↔мл). Ничего не меняется без галочки. */
const UNIT_BASE = { 'кг':['кг',1], 'г':['кг',0.001], 'л':['л',1], 'мл':['л',0.001] };
function convQty(q, from, to){
  if(from === to) return q;
  const a = UNIT_BASE[from], b = UNIT_BASE[to];
  return a && b && a[0] === b[0] ? q * a[1] / b[1] : null;
}
function perBase(price, pack, unit){
  if(!(pack > 0)) return '';
  const b = UNIT_BASE[unit];
  return b ? `${fmt(price / pack / b[1])} за ${b[0]}` : `${fmt(price / pack)} за ${unit}`;
}
let priceDraft = null;
function findProduct(x){
  return (x.id && P(x.id)) || S.products.find(p => normName(p.name) === normName(x.name))
    || (x.aliases || []).map(a => S.products.find(p => normName(p.name) === normName(a))).find(Boolean) || null;
}
function pricePreview(data){
  const taken = new Set();
  const rows = (data.prices || []).map((x, i) => {
    let p = findProduct(x); const price = num(x.price);
    const dup = p && taken.has(p.id); if(p) taken.add(p.id);
    const pack = p ? convQty(num(x.pack), x.unit, p.unit) : num(x.pack);
    const ok = price > 0 && pack > 0;
    const same = p && Math.abs(p.price - price) < 0.005 && Math.abs(p.pack - pack) < 1e-9;
    return { i, x, p, price, pack, ok, on: !!p && ok && !same && !dup, same };
  });
  priceDraft = { rows, source: data.source || '', date: data.date || '' };
  drawPricePreview();
}
function drawPricePreview(){
  const d = priceDraft, cur = esc(S.settings.currency);
  const found = d.rows.filter(r => r.p), fresh = d.rows.filter(r => !r.p);
  const row = r => {
    const x = r.x, p = r.p;
    let what;
    if(!r.ok) what = `<span class="red">не подходит: ${p ? `в тетради «${esc(p.unit)}», в магазине «${esc(x.unit)}»` : 'нет цены или упаковки'}</span>`;
    else if(p) what = `было ${fmt(p.price)} ${cur} за ${fq(p.pack)} ${esc(p.unit)} <span class="pencil">(${perBase(p.price, p.pack, p.unit)})</span><br>
      станет <b>${fmt(r.price)} ${cur} за ${fq(r.pack)} ${esc(p.unit)}</b> <span class="pencil">(${perBase(r.price, r.pack, p.unit)})</span>${r.same ? ' <span class="green">— без изменений</span>' : ''}`;
    else what = `новый продукт: ${fmt(r.price)} ${cur} за ${fq(r.pack)} ${esc(x.unit)}`;
    return `<label class="pp ${r.ok ? '' : 'off'}"><input type="checkbox" data-pi="${r.i}" ${r.on ? 'checked' : ''} ${r.ok ? '' : 'disabled'}>
      <span><b>${esc(p ? p.name : x.name)}</b>${x.storeName ? `<small>${esc(x.storeName)}</small>` : ''}<span class="ppw">${what}</span></span></label>`;
  };
  openModal(`<h2>Цены из магазина</h2>
    <p class="pencil">${esc(d.source)}${d.date ? ' · ' + esc(d.date) : ''}. Отметьте, что обновить — остальное останется как есть. Рецепты не меняются.</p>
    ${found.length ? `<h3>Есть в тетради (${found.length})</h3>${found.map(row).join('')}` : ''}
    ${fresh.length ? `<h3>Новые продукты (${fresh.length})</h3><p class="pencil">Добавятся в «Цены», только если отметите.</p>${fresh.map(row).join('')}` : ''}
    <div class="tools"><button class="btn" data-act="applyprices">Обновить отмеченные</button><button class="btn ghost" data-act="close">Отмена</button></div>`);
}

/* ---------- модальные окна ---------- */
let draft = null;
function openModal(html){ const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.hidden = false; document.body.classList.add('noscroll'); }
function closeModal(){ $('#modal').hidden = true; $('#modal').innerHTML = ''; draft = null; priceDraft = null; document.body.classList.remove('noscroll'); }

function productForm(p){
  draft = { kind:'product', ...p, tip: tipFor(p) };
  openModal(`<h2>${p.name ? 'Продукт' : 'Новый продукт'}</h2>
    <label class="fld">Название<input class="ink-in" data-d="name" value="${esc(p.name)}"></label>
    <div class="row2"><label class="fld">Упаковка<input class="ink-in" inputmode="decimal" data-d="pack" value="${fq(p.pack)}"></label>
    <label class="fld">Ед.<select class="ink-sel" data-d="unit">${UNITS.map(u => `<option ${u===p.unit?'selected':''}>${u}</option>`).join('')}</select></label></div>
    <label class="fld">Цена упаковки, ${esc(S.settings.currency)}<input class="ink-in" inputmode="decimal" data-d="price" value="${fmt(p.price)}"></label>
    <label class="fld">Раздел<select class="ink-sel" data-d="cat">${PCATS.map(c => `<option ${c===p.cat?'selected':''}>${c}</option>`).join('')}</select></label>
    <label class="fld">Где покупать<input class="ink-in" data-d="shop" value="${esc(p.shop)}" placeholder="магазин, рынок, доставка…"></label>
    <label class="fld">Что сделать заранее<input class="ink-in" data-d="tip" value="${esc(tipFor(p))}" placeholder="например: помыть и нарезать"></label>
    <p class="pencil">Пример: яйца — упаковка 30 шт; в рецепте пишем «6 шт», цена посчитается сама.</p>
    <div class="tools"><button class="btn" data-act="saveproduct">Сохранить</button><button class="btn ghost" data-act="close">Отмена</button>
    ${S.products.some(x=>x.id===p.id) ? `<button class="btn danger" data-act="delproduct">Удалить</button>` : ''}</div>`);
}

function recipeForm(r){
  draft = { kind:'recipe', ...r, items: r.items.map(i => ({...i})) };
  drawRecipeForm();
}
function drawRecipeForm(){
  const r = draft, prep = r.cat === 'prep';
  const opts = sel => `<option value="">— выбрать —</option>` +
    `<optgroup label="Продукты">${[...S.products].sort((a,b)=>a.name.localeCompare(b.name,'ru')).map(p => `<option value="${p.id}" ${p.id===sel?'selected':''}>${esc(p.name)}</option>`).join('')}</optgroup>` +
    `<optgroup label="Заготовки">${S.recipes.filter(x => x.cat==='prep' && x.id!==r.id).map(x => `<option value="r:${x.id}" ${'r:'+x.id===sel?'selected':''}>${esc(x.name)}</option>`).join('')}</optgroup>`;
  const total = r.items.reduce((s,it) => s + (it.ref ? itemCost(it) : 0), 0);
  openModal(`<h2>${S.recipes.some(x=>x.id===r.id) ? 'Рецепт' : 'Новый рецепт'}</h2>
    <label class="fld">Название<input class="ink-in" data-d="name" value="${esc(r.name)}"></label>
    <div class="row2"><label class="fld">Раздел<select class="ink-sel" data-d="cat" data-redraw>${Object.entries(RCATS).map(([k,v]) => `<option value="${k}" ${k===r.cat?'selected':''}>${v}</option>`).join('')}</select></label>
    ${prep ? '' : `<label class="fld">Порций<input class="ink-in" inputmode="numeric" data-d="serves" value="${r.serves}"></label>`}
    <label class="fld">Минут<input class="ink-in" inputmode="numeric" data-d="time" value="${r.time||''}"></label></div>
    <div class="fld">Рисунок<div class="artpick">${ART_KEYS.map(k => `<button class="${k===r.art?'on':''}" data-act="pickart" data-k="${k}" aria-label="${ART[k].name}">${sketch(k)}</button>`).join('')}</div></div>
    <h3>Продукты ${prep ? 'на 1 партию' : `на ${r.serves} порц.`}</h3>
    <div class="items">${r.items.map((it,i) => `<div class="irow">
      <select class="ink-sel" data-i="${i}" data-k="ref" data-redraw>${opts(it.ref)}</select>
      <input class="ink-in w3" inputmode="decimal" data-i="${i}" data-k="qty" value="${it.qty ? fq(it.qty) : ''}" placeholder="0">
      <span class="u">${esc(it.ref ? refUnit(it.ref) : '')}</span>
      <span class="ic">${it.ref ? fmt(itemCost(it)) : ''}</span>
      <button class="x" data-act="delitem" data-i="${i}" aria-label="Убрать">×</button></div>`).join('')}</div>
    <button class="btn small ghost" data-act="additem">+ продукт</button>
    <p class="right">Итого: <b class="hl">${money(total)}</b></p>
    <label class="fld">Как готовить (каждый шаг с новой строки)<textarea class="ink-in" rows="5" data-d="steps">${esc(r.steps)}</textarea></label>
    <div class="tools"><button class="btn" data-act="saverecipe">Сохранить</button><button class="btn ghost" data-act="close">Отмена</button>
    ${S.recipes.some(x=>x.id===r.id) ? `<button class="btn danger" data-act="delrecipe">Удалить</button>` : ''}</div>`);
}

function settingsForm(){
  const sl = S.settings.slots;
  openModal(`<h2>Настройки</h2>
    <h3>Приёмы пищи</h3>
    <p class="pencil">Галочка — приём есть в плане. Стрелками можно переставить (например, кофе — после завтрака). «Чел.» — сколько человек в этом приёме, пусто = вся семья.</p>
    <div class="slots">${sl.map((x, i) => `<div class="slotrow ${x.on ? '' : 'off'}">
      <button class="box" data-act="slottoggle" data-id="${x.id}" aria-label="Включить или выключить">${x.on ? '✓' : ''}</button>
      <input class="ink-in" data-slotf="name" data-sid="${x.id}" value="${esc(x.name)}">
      <span class="mv"><button class="mini-btn" data-act="slotmove" data-id="${x.id}" data-dir="-1" ${i ? '' : 'disabled'} aria-label="Выше">↑</button><button class="mini-btn" data-act="slotmove" data-id="${x.id}" data-dir="1" ${i < sl.length-1 ? '' : 'disabled'} aria-label="Ниже">↓</button><button class="mini-btn x" data-act="slotdel" data-id="${x.id}" aria-label="Удалить">×</button></span>
      <div class="subs"><label class="sub">что ставить: <select class="ink-sel" data-slotf="cat" data-sid="${x.id}">${MEAL_CATS.map(c => `<option value="${c}" ${c===x.cat?'selected':''}>${RCATS[c]}</option>`).join('')}</select></label>
      <label class="sub">чел.: <input class="ink-in w2" inputmode="numeric" data-slotf="people" data-sid="${x.id}" value="${x.people || ''}" placeholder="${S.settings.people}"></label>
      <label class="sub"><input type="checkbox" data-slotf="light" data-sid="${x.id}" ${x.light ? 'checked' : ''}> лёгкий</label></div></div>`).join('')}</div>
    <button class="btn small ghost" data-act="slotadd">+ приём пищи</button>
    <label class="fld">Валюта<input class="ink-in" data-set="currency" value="${esc(S.settings.currency)}"></label>
    <h3>Резервная копия</h3>
    <p class="pencil">Данные хранятся только в этом браузере. Сохраняйте копию, чтобы не потерять или перенести на другой телефон.</p>
    <div class="tools"><button class="btn" data-act="export">Сохранить в файл</button>
    <label class="btn ghost">Загрузить из файла<input type="file" accept="application/json,.json" data-act-file="import" hidden></label></div>
    <h3>Подборка рецептов</h3>
    <p class="pencil">Файл с рецептами (например, который подготовит Claude) — добавится к вашим, ничего не сотрётся.</p>
    <div class="tools"><label class="btn ghost">Добавить рецепты из файла<input type="file" accept="application/json,.json" data-act-file="pack" hidden></label></div>
    <h3>Начать заново</h3>
    <div class="tools"><button class="btn danger" data-act="reset">Вернуть пример</button><button class="btn ghost" data-act="close">Закрыть</button></div>`);
}

function toast(t){ const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2200); }

/* ---------- события ---------- */
const ACT = {
  noop(){},
  fetchprices(){
    fetch('prices/latest.json?' + Date.now(), { cache:'no-store' })
      .then(r => { if(!r.ok) throw 0; return r.json(); })
      .then(x => { if(!Array.isArray(x.prices)) throw 0; pricePreview(x); })
      .catch(() => toast('Не удалось загрузить цены — нужен интернет'));
  },
  applyprices(){
    const d = priceDraft; if(!d) return; let upd = 0, add = 0;
    for(const r of d.rows){
      if(!r.on || !r.ok) continue;
      if(r.p){ r.p.price = r.price; r.p.pack = r.pack; if(d.source) r.p.shop = d.source; delete r.p.approx; upd++; }
      else { S.products.push({ id:uid(), name:r.x.name, unit: UNITS.includes(r.x.unit) ? r.x.unit : 'шт', pack:r.pack, price:r.price,
        cat: PCATS.includes(r.x.cat) ? r.x.cat : 'Другое', shop:d.source }); add++; }
    }
    priceDraft = null; save(); closeModal(); render();
    toast(`Обновлено цен: ${upd}` + (add ? `, новых продуктов: ${add}` : ''));
  },
  settings: settingsForm,
  close: closeModal,
  autofill(){
    if(!confirm('Разложить блюда на неделю вперемешку, чтобы уложиться в бюджет? Текущий план заменится.')) return;
    autofill(); save(); render();
    const t = weekTotal(); toast(t <= S.settings.budget ? `Готово: ${money(t)} из ${money(S.settings.budget)}` : `Не уложились: ${money(t)}. Добавьте блюда подешевле`);
  },
  adddish(el){ const k = el.dataset.key; (S.plan[k] ||= []).push(''); render(); },
  deldish(el){ const k = el.dataset.key; S.plan[k]?.splice(+el.dataset.i, 1); if(!S.plan[k]?.length) delete S.plan[k]; save(); render(); },
  slottoggle(el){ const sl = S.settings.slots.find(x => x.id === el.dataset.id); sl.on = !sl.on; save(); render(); settingsForm(); },
  slotmove(el){ const a = S.settings.slots, i = a.findIndex(x => x.id === el.dataset.id), j = i + (+el.dataset.dir);
    if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; save(); render(); settingsForm(); },
  slotdel(el){ const sl = S.settings.slots.find(x => x.id === el.dataset.id); if(!confirm(`Удалить приём «${sl.name}»?`)) return;
    S.settings.slots = S.settings.slots.filter(x => x !== sl); for(const k in S.plan) if(k.endsWith('-'+sl.id)) delete S.plan[k]; save(); render(); settingsForm(); },
  slotadd(){ S.settings.slots.push({ id:uid(), name:'Перекус', cat:'snack', on:true, light:true }); save(); render(); settingsForm(); },
  clearplan(){ if(confirm('Очистить план недели?')){ S.plan = {}; save(); render(); } },
  newrecipe(){ recipeForm({ id:uid(), name:'', cat:'main', serves:S.settings.people, art:'pot', time:'', items:[{ref:'',qty:0}], steps:'' }); },
  editrecipe(el){ recipeForm(R(el.dataset.id)); },
  duprecipe(el){ const r = R(el.dataset.id); const c = { ...structuredClone(r), id:uid(), name:r.name + ' (копия)' }; S.recipes.push(c); save(); location.hash = 'recipe/' + c.id; toast('Копия создана'); },
  pickart(el){ draft.art = el.dataset.k; drawRecipeForm(); },
  additem(){ draft.items.push({ref:'',qty:0}); drawRecipeForm(); },
  delitem(el){ draft.items.splice(+el.dataset.i, 1); drawRecipeForm(); },
  saverecipe(){
    const r = draft; if(!r.name.trim()){ toast('Впишите название'); return; }
    const clean = { id:r.id, name:r.name.trim(), cat:r.cat, serves: r.cat==='prep' ? 1 : Math.max(1, Math.round(num(r.serves))||1), art:r.art, time: Math.round(num(r.time))||'', steps:r.steps||'', items: r.items.filter(i => i.ref && i.qty > 0) };
    const i = S.recipes.findIndex(x => x.id === r.id); if(i >= 0) S.recipes[i] = clean; else S.recipes.push(clean);
    save(); closeModal(); location.hash = 'recipe/' + r.id; render(); toast('Записано');
  },
  delrecipe(){
    const id = draft.id, r = R(id);
    if(!confirm(`Удалить «${r.name}»?`)) return;
    S.recipes = S.recipes.filter(x => x.id !== id);
    S.recipes.forEach(x => x.items = x.items.filter(i => i.ref !== 'r:'+id));
    for(const k in S.plan) if(S.plan[k] === id) delete S.plan[k];
    save(); closeModal(); location.hash = 'recipes'; render();
  },
  newproduct(){ productForm({ id:uid(), name:'', unit:'кг', pack:1, price:0, cat:'Овощи и фрукты', shop:'' }); },
  editproduct(el){ productForm(P(el.dataset.id)); },
  saveproduct(){
    const p = draft; if(!p.name.trim()){ toast('Впишите название'); return; }
    const clean = { id:p.id, name:p.name.trim(), unit:p.unit, pack: num(p.pack) || 1, price: num(p.price), cat:p.cat, shop:(p.shop||'').trim(), tip:(p.tip ?? '').trim() };
    const i = S.products.findIndex(x => x.id === p.id); if(i >= 0) S.products[i] = clean; else S.products.push(clean);
    save(); closeModal(); render(); toast('Записано');
  },
  delproduct(){
    const id = draft.id, used = S.recipes.filter(r => r.items.some(i => i.ref === id));
    if(!confirm(used.length ? `Продукт есть в рецептах: ${used.map(r=>r.name).join(', ')}. Всё равно удалить?` : 'Удалить продукт?')) return;
    S.products = S.products.filter(x => x.id !== id); S.recipes.forEach(r => r.items = r.items.filter(i => i.ref !== id)); delete S.bought[id];
    save(); closeModal(); render();
  },
  buy(el){ const id = el.dataset.id; if(S.bought[id]) delete S.bought[id]; else S.bought[id] = true; save(); render(); },
  unbuy(){ S.bought = {}; save(); render(); },
  copylist(){
    const { need } = weekNeeds();
    const lines = Object.keys(need).filter(P).filter(id => !S.bought[id]).map(id => { const p = P(id), k = packsFor(p, need[id]); return `☐ ${p.name} — ${k} × ${fq(p.pack)} ${p.unit}${p.shop ? ' ('+p.shop+')' : ''}`; });
    const text = 'Покупки на неделю:\n' + lines.join('\n');
    (navigator.clipboard?.writeText(text) || Promise.reject()).then(() => toast('Список скопирован'), () => { prompt('Скопируйте список:', text); });
  },
  export(){
    const blob = new Blob([JSON.stringify(S, null, 1)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `тетрадь-${new Date().toISOString().slice(0,10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  libcat(el){ libState.cat = el.dataset.c; render(); },
  libview(el){ libPreview(el.dataset.id); },
  libadd(el){
    const id = el.dataset.id, newP = addFromLib(id); closeModal(); render();
    toast(newP.length ? `Добавлено! Новые продукты (${newP.length}) — проверьте цены` : 'Добавлено в тетрадь');
  },
  liball(){
    const list = libList().filter(lr => !inBook(lr)); if(!list.length) return;
    if(!confirm(`Добавить в тетрадь все ${list.length} рецепт(ов) из этого раздела?`)) return;
    const newP = new Set(); list.forEach(lr => addFromLib(lr.id).forEach(p => newP.add(p)));
    render(); toast(`Добавлено: ${list.length}` + (newP.size ? `, новых продуктов: ${newP.size} — проверьте цены` : ''));
  },
  reset(){ if(confirm('Стереть все свои данные и вернуть пример?')){ S = seed(); save(); closeModal(); location.hash = 'week'; render(); } },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) { if(e.target.id === 'modal') closeModal(); return; }
  const f = ACT[el.dataset.act]; if(f){ e.preventDefault(); f(el); }
});

document.addEventListener('change', e => {
  const t = e.target, d = t.dataset;
  if(d.slot){ const a = S.plan[d.slot] ||= [], i = +d.i || 0;
    if(t.value) a[i] = t.value; else a.splice(i, 1);
    S.plan[d.slot] = a.filter(Boolean); if(!S.plan[d.slot].length) delete S.plan[d.slot]; save(); render(); return; }
  if(d.slotf){ const sl = S.settings.slots.find(x => x.id === d.sid); if(!sl) return;
    if(d.slotf === 'name') sl.name = t.value.trim() || sl.name;
    if(d.slotf === 'people') sl.people = Math.max(0, Math.round(num(t.value))) || undefined;
    if(d.slotf === 'cat') sl.cat = t.value;
    if(d.slotf === 'light') sl.light = t.checked;
    save(); render(); return; }
  if(d.f === 'budget'){ S.settings.budget = Math.max(0, num(t.value)); save(); render(); return; }
  if(d.f === 'people'){ S.settings.people = Math.max(1, Math.round(num(t.value)) || 1); save(); render(); return; }
  if(d.price){ const p = P(d.price); if(p){ p.price = Math.max(0, num(t.value)); delete p.approx; save(); t.value = fmt(p.price);
    t.closest('.prow')?.querySelector('.pname .red')?.remove();
    const u = t.closest('.prow')?.querySelector('.unitp'); if(u) u.textContent = unitLine(p); } return; }
  if(d.set){ S.settings[d.set] = t.value.trim() || 'R$'; save(); render(); return; }
  if(d.actFile === 'import'){
    const file = t.files[0]; if(!file) return;
    file.text().then(txt => { const x = JSON.parse(txt); if(!x.products || !x.recipes) throw 0;
      if(!confirm('Заменить все данные в тетради данными из файла?')) return; S = x; S.plan ||= {}; S.bought ||= {}; save(); closeModal(); render(); toast('Данные загружены'); })
      .catch(() => toast('Не получилось прочитать файл'));
    return;
  }
  if(d.actFile === 'prices'){
    const file = t.files[0]; if(!file) return;
    file.text().then(txt => { const x = JSON.parse(txt); if(!Array.isArray(x.prices)) throw 0; pricePreview(x); })
      .catch(() => toast('Это не файл с ценами'));
    t.value = '';
    return;
  }
  if(d.pi !== undefined && priceDraft){ const r = priceDraft.rows[+d.pi]; if(r) r.on = t.checked; return; }
  if(d.actFile === 'pack'){
    const file = t.files[0]; if(!file) return;
    file.text().then(txt => { const x = JSON.parse(txt); if(!Array.isArray(x.recipes)) throw 0;
      const src = { products: x.products || {}, recipes: x.recipes }; let n = 0; const newP = new Set();
      for(const lr of x.recipes){ if(!inBook(lr, src)){ addFromLib(lr.id, src).forEach(p => newP.add(p)); n++; } }
      closeModal(); location.hash = 'recipes'; render(); toast(`Добавлено рецептов: ${n}` + (newP.size ? `, новых продуктов: ${newP.size}` : '')); })
      .catch(() => toast('Не получилось прочитать файл'));
    return;
  }
  if(draft && (d.d || d.k) && 'redraw' in d){ syncDraft(t); drawRecipeForm(); return; }
});

document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if(d.f === 'notes'){ S.notes = t.value; save(); return; }
  if(d.f === 'libq'){ libState.q = t.value; const g = $('#libgrid'); if(g) g.innerHTML = libGrid(); return; }
  if(draft && (d.d || d.k)) syncDraft(t);
  // живой пересчёт стоимости строки и итога, без перерисовки (чтобы не терять фокус)
  if(draft && draft.kind === 'recipe' && (d.k === 'qty' || d.d === 'serves')){
    const it = draft.items[+d.i]; const cell = t.closest('.irow')?.querySelector('.ic');
    if(it && cell && it.ref) cell.textContent = fmt(itemCost(it));
    const tot = draft.items.reduce((s,x) => s + (x.ref ? itemCost(x) : 0), 0);
    const el = $('.sheet .right .hl'); if(el) el.innerHTML = money(tot);
  }
});

function syncDraft(t){
  const d = t.dataset;
  if(d.d) draft[d.d] = t.value;
  else if(d.k){ const it = draft.items[+d.i]; if(!it) return; it[d.k] = d.k === 'qty' ? num(t.value) : t.value; }
}

document.addEventListener('keydown', e => { if(e.key === 'Escape' && draft) closeModal(); });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0,0); });
if(fresh) autofill(1);
save();
render();

if('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
