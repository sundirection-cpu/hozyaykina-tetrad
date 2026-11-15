'use strict';
/* Хозяйкина тетрадь — планировщик бюджета на еду.
   Данные хранятся в localStorage этого устройства. */

const KEY = 'hozyayka-tetrad-v1';
const DAYS = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const MEALS = ['Завтрак','Обед','Ужин'];
const RCATS = { breakfast:'Завтраки', main:'Обеды и ужины', snack:'Перекусы', prep:'Заготовки' };
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
  const s = { v:1, settings:{ budget:500, people:4, currency:'R$' }, products, recipes, plan:{}, bought:{}, notes:'' };
  autofill(s);
  return s;
}

function autofill(s){
  const br = s.recipes.filter(r=>r.cat==='breakfast'), mn = s.recipes.filter(r=>r.cat==='main');
  for(let d=0; d<7; d++){
    if(br.length) s.plan[`${d}-0`] = br[d % br.length].id;
    if(mn.length){ s.plan[`${d}-1`] = mn[(d*2) % mn.length].id; s.plan[`${d}-2`] = mn[(d*2+1) % mn.length].id; }
  }
}

/* ---------- состояние ---------- */
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch(e) {}
if(!S || !S.products) S = seed();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} };
save();

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
const mealFactor = r => S.settings.people / (r.serves || 1);
const mealCost = r => recipeCost(r) * mealFactor(r);
const refName = ref => isPrepRef(ref) ? (R(ref.slice(2))?.name ?? '—') : (P(ref)?.name ?? '—');
const refUnit = ref => isPrepRef(ref) ? 'партия' : (P(ref)?.unit ?? '');

function plannedMeals(){
  const out = [];
  for(let d=0; d<7; d++) for(let m=0; m<3; m++){ const r = R(S.plan[`${d}-${m}`]); if(r) out.push({d,m,r}); }
  return out;
}
const weekTotal = () => plannedMeals().reduce((s,x) => s + mealCost(x.r), 0);

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
  for(const {r} of plannedMeals()) add(r.items, mealFactor(r), 0);
  return { need, preps, uses };
}
const packsFor = (p, q) => p.pack > 0 ? Math.ceil(q / p.pack - 1e-9) : 0;

/* ---------- отрисовка ---------- */
const TABS = [['week','Неделя','week'],['recipes','Рецепты','book'],['products','Цены','tag'],['shop','Покупки','cart'],['prep','Заготовки','jar']];

function route(){ const [v, id] = (location.hash.slice(1) || 'week').split('/'); return { v, id }; }

function render(){
  const { v, id } = route();
  const views = { week:vWeek, recipes:vRecipes, recipe:()=>vRecipe(id), products:vProducts, shop:vShop, prep:vPrep };
  const tab = v === 'recipe' ? 'recipes' : v;
  $('#app').innerHTML = (views[v] || vWeek)();
  $('#tabs').innerHTML = TABS.map(([k,t,ic]) => `<a href="#${k}" class="tab tab-${k} ${k===tab?'on':''}">${icon(ic)}<span>${t}</span></a>`).join('');
}

function header(title, extra=''){
  return `<header class="head"><h1>${title}</h1>${extra}</header>`;
}

/* --- Неделя --- */
function recipeOptions(sel){
  let h = `<option value="">— не выбрано —</option>`;
  for(const c of ['breakfast','main','snack']){
    const rs = S.recipes.filter(r => r.cat === c); if(!rs.length) continue;
    h += `<optgroup label="${RCATS[c]}">` + rs.map(r => `<option value="${r.id}" ${r.id===sel?'selected':''}>${esc(r.name)}</option>`).join('') + `</optgroup>`;
  }
  return h;
}

function vWeek(){
  const st = S.settings, total = weekTotal(), left = st.budget - total;
  const norm = st.budget / 21, perPerson = st.budget / 7 / Math.max(1, st.people);
  const pct = st.budget > 0 ? Math.min(100, total / st.budget * 100) : 0;
  const over = left < 0;
  let h = header('Хозяйкина тетрадь', `<button class="icon-btn" data-act="settings" aria-label="Настройки">⚙</button>`);
  h += `<section class="card budget">
    ${sketch('basket','float')}
    <h2>Бюджет на неделю</h2>
    <label class="line">Бюджет: <input class="ink-in w5" inputmode="decimal" data-f="budget" value="${fmt(st.budget)}"> ${esc(st.currency)}</label>
    <label class="line">Едоков: <input class="ink-in w2" inputmode="numeric" data-f="people" value="${st.people}"> чел.</label>
    <p class="pencil">7 завтраков + 7 обедов + 7 ужинов = 21 приём пищи</p>
    <p>На один приём: <b class="hl">${money(norm)}</b><br><span class="pencil">≈ ${money(perPerson)} на человека в день</span></p>
    <div class="bar ${over?'over':''}"><i style="width:${pct}%"></i></div>
    <table class="sum"><tr><td>Запланировано</td><td class="r">${money(total)}</td></tr>
    <tr><td>${over?'Перерасход':'Остаток'}</td><td class="r ${over?'red':'green'}"><b>${money(Math.abs(left))}</b></td></tr></table>
    ${over ? '<div class="stamp">Перерасход!</div>' : ''}
  </section>
  <div class="tools"><button class="btn" data-act="autofill">↻ Заполнить по кругу</button><button class="btn ghost" data-act="clearplan">Очистить</button></div>`;
  for(let d=0; d<7; d++){
    let ds = 0, rows = '';
    for(let m=0; m<3; m++){
      const r = R(S.plan[`${d}-${m}`]); const c = r ? mealCost(r) : 0; ds += c;
      rows += `<div class="meal"><span class="mname">${MEALS[m]}</span>
        <select class="ink-sel" data-slot="${d}-${m}">${recipeOptions(r?.id)}</select>
        <span class="mcost ${r && c > norm ? 'red' : ''}">${r ? fmt(c) : ''}</span>
        ${r ? `<a class="go" href="#recipe/${r.id}" aria-label="Открыть рецепт">→</a>` : '<span class="go"></span>'}</div>`;
    }
    h += `<section class="day"><h2>${DAYS[d]} <span class="daysum">${ds ? money(ds) : ''}</span></h2>${rows}</section>`;
  }
  h += `<p class="pencil foot">Красным — приёмы дороже нормы ${money(norm)}. Цены меняются на закладке «Цены», всё пересчитается само.</p>`;
  return h;
}

/* --- Рецепты --- */
function vRecipes(){
  let h = header('Рецепты', `<button class="btn small" data-act="newrecipe">+ Новый</button>`);
  for(const c of ['breakfast','main','snack','prep']){
    const rs = S.recipes.filter(r => r.cat === c); if(!rs.length) continue;
    h += `<h2 class="sec">${RCATS[c]}</h2><div class="grid">`;
    h += rs.map((r,i) => `<a class="rcard" href="#recipe/${r.id}" style="--tilt:${(i%3-1)*0.8}deg">
      ${sketch(r.art)}<b>${esc(r.name)}</b>
      <span class="pencil">${c==='prep' ? `1 партия — ${money(recipeCost(r))}` : `на ${S.settings.people} чел. — ${money(mealCost(r))}`}</span></a>`).join('');
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
  h += `<p class="pencil">Впишите цену упаковки — рецепты и бюджет пересчитаются сами.</p>`;
  for(const c of PCATS){
    const ps = S.products.filter(p => (p.cat || 'Другое') === c).sort((a,b) => a.name.localeCompare(b.name,'ru')); if(!ps.length) continue;
    h += `<h2 class="sec">${c}</h2><div class="plist">`;
    h += ps.map(p => `<div class="prow">
      <button class="pname" data-act="editproduct" data-id="${p.id}">${esc(p.name)}<small>${fq(p.pack)} ${esc(p.unit)}${p.shop ? ' · ' + esc(p.shop) : ''}</small></button>
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

/* ---------- модальные окна ---------- */
let draft = null;
function openModal(html){ const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.hidden = false; document.body.classList.add('noscroll'); }
function closeModal(){ $('#modal').hidden = true; $('#modal').innerHTML = ''; draft = null; document.body.classList.remove('noscroll'); }

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
  openModal(`<h2>Настройки</h2>
    <label class="fld">Валюта<input class="ink-in" data-set="currency" value="${esc(S.settings.currency)}"></label>
    <h3>Резервная копия</h3>
    <p class="pencil">Данные хранятся только в этом браузере. Сохраняйте копию, чтобы не потерять или перенести на другой телефон.</p>
    <div class="tools"><button class="btn" data-act="export">Сохранить в файл</button>
    <label class="btn ghost">Загрузить из файла<input type="file" accept="application/json,.json" data-act-file="import" hidden></label></div>
    <h3>Начать заново</h3>
    <div class="tools"><button class="btn danger" data-act="reset">Вернуть пример</button><button class="btn ghost" data-act="close">Закрыть</button></div>`);
}

function toast(t){ const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2200); }

/* ---------- события ---------- */
const ACT = {
  settings: settingsForm,
  close: closeModal,
  autofill(){ if(confirm('Расставить блюда по кругу на всю неделю? Текущий план заменится.')){ S.plan = {}; autofill(S); save(); render(); } },
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
  reset(){ if(confirm('Стереть все свои данные и вернуть пример?')){ S = seed(); save(); closeModal(); location.hash = 'week'; render(); } },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) { if(e.target.id === 'modal') closeModal(); return; }
  const f = ACT[el.dataset.act]; if(f){ e.preventDefault(); f(el); }
});

document.addEventListener('change', e => {
  const t = e.target, d = t.dataset;
  if(d.slot){ if(t.value) S.plan[d.slot] = t.value; else delete S.plan[d.slot]; save(); render(); return; }
  if(d.f === 'budget'){ S.settings.budget = Math.max(0, num(t.value)); save(); render(); return; }
  if(d.f === 'people'){ S.settings.people = Math.max(1, Math.round(num(t.value)) || 1); save(); render(); return; }
  if(d.price){ const p = P(d.price); if(p){ p.price = Math.max(0, num(t.value)); save(); t.value = fmt(p.price);
    const u = t.closest('.prow')?.querySelector('.unitp'); if(u) u.textContent = unitLine(p); } return; }
  if(d.set){ S.settings[d.set] = t.value.trim() || 'R$'; save(); render(); return; }
  if(d.actFile === 'import'){
    const file = t.files[0]; if(!file) return;
    file.text().then(txt => { const x = JSON.parse(txt); if(!x.products || !x.recipes) throw 0; S = x; S.plan ||= {}; S.bought ||= {}; save(); closeModal(); render(); toast('Данные загружены'); })
      .catch(() => toast('Не получилось прочитать файл'));
    return;
  }
  if(draft && (d.d || d.k) && 'redraw' in d){ syncDraft(t); drawRecipeForm(); return; }
});

document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if(d.f === 'notes'){ S.notes = t.value; save(); return; }
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
render();

if('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
