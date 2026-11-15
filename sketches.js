// Карандашные рисунки «от руки». Каждый рисунок — набор SVG-фигур в поле 120×100.
// Фильтр #pencil (в index.html) слегка «дрожит» линии и даёт зернистость грифеля.
const WASH = { yolk:'#f2c94c', tomato:'#e46f5a', leaf:'#8dbf6a', coffee:'#8a5a3b', bread:'#d9a55b', carrot:'#ee8b3a', milk:'#cfe3f2', fish:'#9fb6c8' };
const h = (x1,y1,x2,y2,n,dx,dy)=>{ let s=''; for(let i=0;i<n;i++) s+=`M${x1+i*dx} ${y1+i*dy} L${x2+i*dx} ${y2+i*dy} `; return `<path class="hatch" d="${s}"/>`; };

const ART = {
  bowl: { name:'Миска каши', svg:`
    <path class="wash" fill="${WASH.milk}" d="M22 50 Q24 82 60 84 Q96 82 98 50 Z"/>
    <ellipse cx="60" cy="48" rx="40" ry="10"/>
    <path d="M20 48 Q22 83 60 85 Q98 83 100 48"/>
    <path d="M45 85 Q46 91 60 91 Q74 91 75 85"/>
    <path d="M27 48 q6 -5 12 0 q6 -5 12 0 q6 -5 12 0 q6 -5 12 0 q5 -4 10 0"/>
    <circle class="wash" fill="${WASH.yolk}" cx="48" cy="46" r="4.5"/><circle cx="48" cy="46" r="4.5"/>
    <circle class="wash" fill="${WASH.yolk}" cx="62" cy="44" r="4.5"/><circle cx="62" cy="44" r="4.5"/>
    <circle class="wash" fill="${WASH.yolk}" cx="73" cy="47" r="4"/><circle cx="73" cy="47" r="4"/>
    <path d="M86 44 L96 18"/><ellipse cx="98" cy="13" rx="4.5" ry="7" transform="rotate(20 98 13)"/>
    <path class="steam" d="M45 32 q-4 -6 0 -11 q4 -5 0 -10 M58 30 q-4 -6 0 -11 q4 -5 0 -10 M71 32 q-4 -6 0 -11"/>
    ${h(70,80,80,64,5,4,-1.2)}` },
  pan: { name:'Сковорода', svg:`
    <ellipse cx="50" cy="60" rx="38" ry="16"/>
    <ellipse cx="50" cy="58" rx="32" ry="12"/>
    <path d="M12 60 Q14 74 50 77 Q86 74 88 60"/>
    <path d="M87 55 L116 46 Q119 48 117 51 L89 63"/>
    <path class="wash" fill="#fffdf2" d="M28 57 q-2 -8 8 -8 q6 -4 12 1 q8 0 6 7 q2 6 -8 7 q-6 4 -12 0 q-8 0 -6 -7z"/>
    <path d="M28 57 q-2 -8 8 -8 q6 -4 12 1 q8 0 6 7 q2 6 -8 7 q-6 4 -12 0 q-8 0 -6 -7z"/>
    <circle class="wash" fill="${WASH.yolk}" cx="41" cy="56" r="5"/><circle cx="41" cy="56" r="5"/>
    <path class="wash" fill="#fffdf2" d="M56 54 q0 -7 9 -6 q8 -2 10 4 q5 5 -2 9 q-5 4 -11 1 q-7 -1 -6 -8z"/>
    <path d="M56 54 q0 -7 9 -6 q8 -2 10 4 q5 5 -2 9 q-5 4 -11 1 q-7 -1 -6 -8z"/>
    <circle class="wash" fill="${WASH.yolk}" cx="65" cy="55" r="4.5"/><circle cx="65" cy="55" r="4.5"/>
    ${h(20,66,24,74,9,7,0.6)}` },
  pot: { name:'Кастрюля', svg:`
    <path class="wash" fill="${WASH.milk}" d="M30 42 L31 82 Q60 90 89 82 L90 42 Z"/>
    <ellipse cx="60" cy="40" rx="32" ry="7"/>
    <path d="M28 40 L30 82 Q60 91 90 82 L92 40"/>
    <path d="M28 48 q-10 0 -10 5 q0 5 10 4 M92 48 q10 0 10 5 q0 5 -10 4"/>
    <path class="steam" d="M46 28 q-4 -6 0 -11 q4 -5 0 -10 M60 26 q-4 -6 0 -11 q4 -5 0 -10 M74 28 q-4 -6 0 -11 q4 -5 0 -10"/>
    <path d="M40 40 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -3 6 0"/>
    ${h(72,84,80,46,6,3,0)}` },
  jar: { name:'Баночка соуса', svg:`
    <path class="wash" fill="${WASH.tomato}" d="M36 46 V82 Q36 89 44 89 H76 Q84 89 84 82 V46 Z"/>
    <path d="M42 16 H78 V28 H42 Z"/>
    <path d="M47 16 V28 M53 16 V28 M59 16 V28 M65 16 V28 M71 16 V28"/>
    <path d="M42 28 Q34 32 34 42 V82 Q34 91 44 91 H76 Q86 91 86 82 V42 Q86 32 78 28"/>
    <path class="wash" fill="#fffdf2" d="M44 52 H76 V74 H44 Z"/>
    <path d="M44 52 H76 V74 H44 Z"/>
    <path class="ink" d="M48 60 q4 -3 8 0 t8 0 t8 0 M50 67 q4 -3 8 0 t8 0"/>
    <path d="M78 34 q4 6 4 14"/>
    ${h(74,80,82,52,4,2,0)}` },
  salad: { name:'Салат', svg:`
    <path class="wash" fill="${WASH.leaf}" d="M24 52 q4 -18 18 -14 q6 -16 20 -8 q12 -12 22 2 q16 -4 14 20 Z"/>
    <path d="M24 52 q4 -18 18 -14 M42 38 q6 -16 20 -8 M62 30 q12 -12 22 2 M84 32 q16 -4 14 20"/>
    <path d="M34 50 q4 -8 10 -10 M54 46 q2 -8 8 -12 M74 46 q4 -8 10 -10"/>
    <circle class="wash" fill="${WASH.tomato}" cx="52" cy="47" r="6"/><circle cx="52" cy="47" r="6"/>
    <path d="M52 41 V53 M46 47 H58"/>
    <circle class="wash" fill="${WASH.tomato}" cx="72" cy="45" r="5"/><circle cx="72" cy="45" r="5"/>
    <ellipse cx="60" cy="52" rx="42" ry="8"/>
    <path d="M18 52 Q22 84 60 86 Q98 84 102 52"/>
    ${h(74,80,86,60,5,3.5,-0.8)}` },
  fish: { name:'Рыбка', svg:`
    <path class="wash" fill="${WASH.fish}" d="M18 52 Q50 26 84 52 Q50 78 18 52 Z"/>
    <path d="M18 52 Q50 26 84 52 Q50 78 18 52 Z"/>
    <path d="M84 52 L106 36 L100 52 L106 68 Z"/>
    <circle cx="32" cy="48" r="2.5"/>
    <path d="M40 40 q6 12 0 24"/>
    <path d="M50 46 q4 3 0 6 M60 44 q4 3 0 6 M60 54 q4 3 0 6 M70 48 q4 3 0 6 M50 56 q4 3 0 6"/>
    <path d="M52 32 q8 -6 16 0"/>
    <circle class="wash" fill="${WASH.yolk}" cx="24" cy="80" r="9"/><circle cx="24" cy="80" r="9"/>
    <path d="M24 71 V89 M15 80 H33 M18 74 L30 86 M30 74 L18 86"/>` },
  bread: { name:'Хлеб', svg:`
    <path class="wash" fill="${WASH.bread}" d="M14 70 Q14 40 60 38 Q106 40 106 70 Q60 78 14 70 Z"/>
    <path d="M14 70 Q14 40 60 38 Q106 40 106 70 Q60 78 14 70 Z"/>
    <path d="M34 52 q6 -8 14 -10 M54 50 q6 -8 14 -10 M74 52 q6 -8 14 -10"/>
    <path d="M14 70 Q16 80 30 82 H96 Q106 80 106 70"/>
    <path class="wash" fill="#fff4dc" d="M70 86 q-2 -16 10 -16 q12 0 10 16 Z"/>
    <path d="M70 86 q-2 -16 10 -16 q12 0 10 16 Z"/>
    ${h(20,74,26,66,8,9,0.4)}` },
  cup: { name:'Чашка кофе', svg:`
    <ellipse cx="55" cy="84" rx="40" ry="7"/>
    <path class="wash" fill="${WASH.coffee}" d="M33 41 Q55 47 77 41 Q55 35 33 41 Z"/>
    <ellipse cx="55" cy="40" rx="24" ry="6"/>
    <path d="M30 40 L36 78 Q55 86 74 78 L80 40"/>
    <path d="M79 48 Q96 46 93 60 Q90 72 76 70"/>
    <path class="steam" d="M46 28 q-4 -6 0 -11 q4 -5 0 -10 M58 26 q-4 -6 0 -11 q4 -5 0 -10"/>
    <path d="M44 58 q6 6 12 0 q-6 -6 -12 0 M50 52 V64"/>
    ${h(62,78,68,46,5,2.6,0)}` },
  veg: { name:'Овощи', svg:`
    <path class="wash" fill="${WASH.carrot}" d="M22 86 Q58 58 76 40 Q86 34 88 44 Q72 64 22 86 Z"/>
    <path d="M22 86 Q58 58 76 40 Q86 34 88 44 Q72 64 22 86 Z"/>
    <path d="M50 66 l6 4 M60 58 l6 4 M68 50 l6 4 M40 74 l5 4"/>
    <path class="leafs" d="M84 38 Q86 20 80 10 M86 38 Q96 22 104 16 M86 40 Q102 34 112 34"/>
    <path class="wash" fill="#e9d6c0" d="M26 52 q-14 -2 -14 -18 q2 -14 14 -16 q12 2 14 16 q0 16 -14 18z"/>
    <path d="M26 52 q-14 -2 -14 -18 q2 -14 14 -16 q12 2 14 16 q0 16 -14 18z"/>
    <path d="M26 18 q-2 -6 2 -10 M20 24 q-2 12 2 26 M32 24 q2 12 -2 26"/>` },
  basket: { name:'Корзинка', svg:`
    <path class="wash" fill="${WASH.leaf}" d="M66 50 q2 -22 16 -26 q-2 18 -10 26 Z"/>
    <path d="M66 50 q2 -22 16 -26 q-2 18 -10 26 M70 48 q4 -10 10 -20"/>
    <path class="wash" fill="${WASH.bread}" d="M36 50 L52 14 Q56 10 58 16 L46 50 Z"/>
    <path d="M36 50 L52 14 Q56 10 58 16 L46 50 M48 26 l5 2 M44 34 l5 2"/>
    <path d="M30 50 Q60 -2 90 50"/>
    <path class="wash" fill="${WASH.bread}" d="M18 52 L28 88 H92 L102 52 Z" style="opacity:.25"/>
    <path d="M14 50 H106 V55 H14 Z"/>
    <path d="M18 55 L28 88 H92 L102 55"/>
    <path d="M22 66 H98 M25 77 H95 M40 55 L44 88 M60 55 V88 M80 55 L76 88"/>` },
  chicken: { name:'Курочка', svg:`
    <path class="wash" fill="${WASH.bread}" d="M30 64 Q16 46 34 32 Q56 20 72 40 Q80 52 70 62 Q52 76 30 64 Z"/>
    <path d="M30 64 Q16 46 34 32 Q56 20 72 40 Q80 52 70 62 Q52 76 30 64 Z"/>
    <path d="M68 60 L92 80"/><path d="M72 56 L96 76"/>
    <circle cx="96" cy="82" r="5"/><circle cx="100" cy="76" r="5"/>
    <path d="M36 44 q8 -6 16 -4 M40 54 q10 -2 18 -8"/>
    ${h(34,62,40,52,6,6,1)}` },
};
const ART_KEYS = Object.keys(ART);

function sketch(key, cls=''){
  const a = ART[key] || ART.pot;
  return `<svg class="sketch ${cls}" viewBox="0 0 120 100" aria-hidden="true"><g filter="url(#pencil)">${a.svg}</g></svg>`;
}

// Мелкие иконки для закладок
const ICON = {
  week: '<rect x="4" y="6" width="20" height="18" rx="2"/><path d="M4 11 H24 M9 3 V8 M19 3 V8 M8 15 h3 M13 15 h3 M18 15 h2 M8 19 h3 M13 19 h3"/>',
  book: '<path d="M14 7 Q9 4 4 5 V23 Q9 22 14 25 Q19 22 24 23 V5 Q19 4 14 7 Z M14 7 V25"/>',
  tag:  '<path d="M4 14 L14 4 H24 V14 L14 24 Z"/><circle cx="19" cy="9" r="2"/>',
  cart: '<path d="M3 5 H7 L10 19 H22 L25 9 H8"/><circle cx="11" cy="23" r="2"/><circle cx="21" cy="23" r="2"/>',
  jar:  '<path d="M9 3 H19 V7 H9 Z M9 7 Q5 9 5 13 V22 Q5 25 8 25 H20 Q23 25 23 22 V13 Q23 9 19 7"/><path d="M9 14 H19 V20 H9 Z"/>',
};
const icon = k => `<svg class="ico" viewBox="0 0 28 28" aria-hidden="true">${ICON[k]}</svg>`;
