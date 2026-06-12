/* ════════════════════════════════════════════════════════════════════════════
   i18n — переключение языка RU / KK / EN (по умолчанию RU)
   Переводит весь видимый текст (data-i18n / data-i18n-ph / data-i18n-html)
   и синхронизирует 3D-надписи на досках через window.setBoardLanguage.
   ════════════════════════════════════════════════════════════════════════════ */
const I18N = {
  ru: {
    'nav.home': 'Главная', 'nav.services': 'Услуги', 'nav.about': 'О нас', 'nav.news': 'Новости', 'nav.contacts': 'Контакты',
    'hero.eyebrow': 'Национальный Банк Казахстана · ЦЦР',
    'hero.title': 'Центр<br><span>Цифрового</span><br>Развития',
    'hero.sub': 'Передовые IT-решения для финансовой системы Казахстана — с 1996 года',
    'hero.scroll': 'ПРОКРУТИТЕ',
    'services.tag': 'Услуги · ЦЦР', 'services.title': 'Наши услуги',
    'services.s1t': 'Разработка ИС', 'services.s1d': 'Информационные системы для НБК — заглушка',
    'services.s2t': 'Системная интеграция', 'services.s2d': 'Интеграция с госсистемами — заглушка',
    'services.s3t': 'Портал закупок', 'services.s3d': 'Оператор zakup.nationalbank.kz — заглушка',
    'services.s4t': 'Аналитика и отчётность', 'services.s4d': 'NBK Analytics Dashboard — заглушка',
    'services.s5t': 'Поддержка 1477', 'services.s5d': 'Контакт-центр по Казахстану — заглушка',
    'about.tag': 'О нас · с 1996 года', 'about.title': 'О нас',
    'about.text': 'АО «Центр цифрового развития Национального Банка Казахстана» — лидер цифровой трансформации. С 1996 года обеспечиваем Национальный Банк и его дочерние структуры передовыми ИТ-решениями, ускоряя инновации и поддерживая соответствие международным стандартам ISO 9001.',
    'about.board': 'Совет директоров',
    'about.p1n': 'Жаленов Бинур Муратович', 'about.p1r': 'Председатель Совета директоров · Заместитель Председателя НБ РК',
    'about.p2n': 'Узбеков Асхат Архатович', 'about.p2r': 'Член Совета директоров · Директор департамента ИТ НБ РК',
    'about.p3n': 'Аринова Айжан Бейбытовна', 'about.p3r': 'Член Совета директоров · Директор Департамента цифровой трансформации',
    'about.p4n': 'Амардинов Малик Алимжанович', 'about.p4r': 'Член Совета директоров · Председатель Правления',
    'about.p5n': 'Конирбаев Баян Кайратович', 'about.p5r': 'Член Совета директоров · независимый директор',
    'about.p6n': 'Алпамысов Абай Абдисаметович', 'about.p6r': 'Член Совета директоров · независимый директор',
    'about.p7n': 'Марат Аскар', 'about.p7r': 'Член Совета директоров · независимый директор',
    'news.tag': 'Новости · ЦЦР', 'news.title': 'Новости',
    'news.n1t': 'Бинур Жаленов назначен заместителем Председателя НБ РК', 'news.n2t': 'Заголовок новости 2', 'news.n3t': 'Заголовок новости 3',
    'news.n4t': 'Заголовок новости 4', 'news.n5t': 'Заголовок новости 5', 'news.n6t': 'Заголовок новости 6',
    'news.n1d': 'ЦЦР поздравляет Бинура Муратовича с назначением и желает успехов в развитии финансово-технологической экосистемы страны.',
    'news.n2d': 'Краткое описание новости — заглушка. Здесь появится короткий анонс события.',
    'news.n3d': 'Краткое описание новости — заглушка. Здесь появится короткий анонс события.',
    'news.n4d': 'Краткое описание новости — заглушка. Здесь появится короткий анонс события.',
    'news.n5d': 'Краткое описание новости — заглушка. Здесь появится короткий анонс события.',
    'news.n6d': 'Краткое описание новости — заглушка. Здесь появится короткий анонс события.',
    'contact.url': 'ccr.nationalbank.kz — Обратная связь',
    'contact.eyebrow': '● Центр Цифрового Развития НБК', 'contact.title': 'Напишите нам',
    'contact.addr': 'г. Астана, пр. Мангилик Ел, 57А',
    'contact.f.name': 'ФИО', 'contact.f.email': 'Email', 'contact.f.phone': 'Телефон',
    'contact.f.subject': 'Предмет вопроса', 'contact.f.message': 'Ваш вопрос',
    'contact.send': 'Отправить →', 'contact.sent': 'Отправлено ✓',
    'asst.title': 'ЦЦР Ассистент', 'asst.status': 'Онлайн · отвечает сразу',
    'asst.greeting': 'Здравствуйте! Я ассистент Центра цифрового развития. Выберите вопрос ниже — отвечу сразу.',
  },
  kk: {
    'nav.home': 'Басты бет', 'nav.services': 'Қызметтер', 'nav.about': 'Біз туралы', 'nav.news': 'Жаңалықтар', 'nav.contacts': 'Байланыс',
    'hero.eyebrow': 'Қазақстан Ұлттық Банкі · ЦДО',
    'hero.title': 'Цифрлық<br><span>Даму</span><br>Орталығы',
    'hero.sub': 'Қазақстанның қаржы жүйесіне арналған озық IT-шешімдер — 1996 жылдан бері',
    'hero.scroll': 'ТӨМЕН ЖЫЛЖЫТЫҢЫЗ',
    'services.tag': 'Қызметтер · ЦДО', 'services.title': 'Біздің қызметтер',
    'services.s1t': 'АЖ әзірлеу', 'services.s1d': 'ҰБ үшін ақпараттық жүйелер — толтыру қажет',
    'services.s2t': 'Жүйелік интеграция', 'services.s2d': 'Мемлекеттік жүйелермен интеграция — толтыру қажет',
    'services.s3t': 'Сатып алу порталы', 'services.s3d': 'zakup.nationalbank.kz операторы — толтыру қажет',
    'services.s4t': 'Талдау және есептілік', 'services.s4d': 'NBK Analytics Dashboard — толтыру қажет',
    'services.s5t': '1477 қолдау қызметі', 'services.s5d': 'Қазақстан бойынша байланыс орталығы — толтыру қажет',
    'about.tag': 'Біз туралы · 1996 жылдан', 'about.title': 'Біз туралы',
    'about.text': '«Қазақстан Ұлттық Банкінің Цифрлық даму орталығы» АҚ — цифрлық трансформация көшбасшысы. 1996 жылдан бері Ұлттық Банкті және оның еншілес құрылымдарын озық IT-шешімдермен қамтамасыз етеміз, инновацияларды жеделдетіп, ISO 9001 халықаралық стандарттарына сәйкестікті ұстанамыз.',
    'about.board': 'Директорлар кеңесі',
    'about.p1n': 'Жаленов Бинұр Мұратұлы', 'about.p1r': 'Директорлар кеңесінің төрағасы · ҚР ҰБ Төрағасының орынбасары',
    'about.p2n': 'Өзбеков Асхат Архатұлы', 'about.p2r': 'Директорлар кеңесінің мүшесі · ҚР ҰБ АТ департаментінің директоры',
    'about.p3n': 'Аринова Айжан Бейбітқызы', 'about.p3r': 'Директорлар кеңесінің мүшесі · Цифрлық трансформация департаментінің директоры',
    'about.p4n': 'Амардинов Малик Әлімжанұлы', 'about.p4r': 'Директорлар кеңесінің мүшесі · Басқарма төрағасы',
    'about.p5n': 'Қоңырбаев Баян Қайратұлы', 'about.p5r': 'Директорлар кеңесінің мүшесі · тәуелсіз директор',
    'about.p6n': 'Алпамысов Абай Әбдісаметұлы', 'about.p6r': 'Директорлар кеңесінің мүшесі · тәуелсіз директор',
    'about.p7n': 'Марат Асқар', 'about.p7r': 'Директорлар кеңесінің мүшесі · тәуелсіз директор',
    'news.tag': 'Жаңалықтар · ЦДО', 'news.title': 'Жаңалықтар',
    'news.n1t': 'Бинұр Жаленов ҚР ҰБ Төрағасының орынбасары болып тағайындалды', 'news.n2t': 'Жаңалық тақырыбы 2', 'news.n3t': 'Жаңалық тақырыбы 3',
    'news.n4t': 'Жаңалық тақырыбы 4', 'news.n5t': 'Жаңалық тақырыбы 5', 'news.n6t': 'Жаңалық тақырыбы 6',
    'news.n1d': 'ЦДО Бинұр Мұратұлын тағайындалуымен құттықтап, елдің қаржы-технологиялық экожүйесін дамытуда табыс тілейді.',
    'news.n2d': 'Жаңалықтың қысқаша сипаттамасы — толтыру қажет. Мұнда оқиғаның қысқаша анонсы пайда болады.',
    'news.n3d': 'Жаңалықтың қысқаша сипаттамасы — толтыру қажет. Мұнда оқиғаның қысқаша анонсы пайда болады.',
    'news.n4d': 'Жаңалықтың қысқаша сипаттамасы — толтыру қажет. Мұнда оқиғаның қысқаша анонсы пайда болады.',
    'news.n5d': 'Жаңалықтың қысқаша сипаттамасы — толтыру қажет. Мұнда оқиғаның қысқаша анонсы пайда болады.',
    'news.n6d': 'Жаңалықтың қысқаша сипаттамасы — толтыру қажет. Мұнда оқиғаның қысқаша анонсы пайда болады.',
    'contact.url': 'ccr.nationalbank.kz — Кері байланыс',
    'contact.eyebrow': '● ҰБ Цифрлық Даму Орталығы', 'contact.title': 'Бізге жазыңыз',
    'contact.addr': 'Астана қ., Мәңгілік Ел даңғ., 57А',
    'contact.f.name': 'Аты-жөні', 'contact.f.email': 'Email', 'contact.f.phone': 'Телефон',
    'contact.f.subject': 'Сұрақ тақырыбы', 'contact.f.message': 'Сіздің сұрағыңыз',
    'contact.send': 'Жіберу →', 'contact.sent': 'Жіберілді ✓',
    'asst.title': 'ЦДО Көмекшісі', 'asst.status': 'Онлайн · бірден жауап береді',
    'asst.greeting': 'Сәлеметсіз бе! Мен Цифрлық даму орталығының көмекшісімін. Төмендегі сұрақты таңдаңыз — бірден жауап беремін.',
  },
  en: {
    'nav.home': 'Home', 'nav.services': 'Services', 'nav.about': 'About', 'nav.news': 'News', 'nav.contacts': 'Contacts',
    'hero.eyebrow': 'National Bank of Kazakhstan · DDC',
    'hero.title': 'Digital<br><span>Development</span><br>Center',
    'hero.sub': 'Advanced IT solutions for the financial system of Kazakhstan — since 1996',
    'hero.scroll': 'SCROLL',
    'services.tag': 'Services · DDC', 'services.title': 'Our services',
    'services.s1t': 'IS Development', 'services.s1d': 'Information systems for the NBK — placeholder',
    'services.s2t': 'System Integration', 'services.s2d': 'Integration with state systems — placeholder',
    'services.s3t': 'Procurement Portal', 'services.s3d': 'Operator of zakup.nationalbank.kz — placeholder',
    'services.s4t': 'Analytics & Reporting', 'services.s4d': 'NBK Analytics Dashboard — placeholder',
    'services.s5t': '1477 Support', 'services.s5d': 'Contact center across Kazakhstan — placeholder',
    'about.tag': 'About · since 1996', 'about.title': 'About us',
    'about.text': '“Digital Development Center of the National Bank of Kazakhstan” JSC is a leader in digital transformation. Since 1996 we have provided the National Bank and its subsidiaries with advanced IT solutions, accelerating innovation and maintaining compliance with ISO 9001 international standards.',
    'about.board': 'Board of Directors',
    'about.p1n': 'Binur M. Zhalenov', 'about.p1r': 'Chairman of the Board · Deputy Chairman of the NBK',
    'about.p2n': 'Askhat A. Uzbekov', 'about.p2r': 'Board member · Director of the IT Department, NBK',
    'about.p3n': 'Aizhan B. Arinova', 'about.p3r': 'Board member · Director of the Digital Transformation Department',
    'about.p4n': 'Malik A. Amardinov', 'about.p4r': 'Board member · Chairman of the Management Board',
    'about.p5n': 'Bayan K. Konirbayev', 'about.p5r': 'Board member · independent director',
    'about.p6n': 'Abai A. Alpamysov', 'about.p6r': 'Board member · independent director',
    'about.p7n': 'Askar Marat', 'about.p7r': 'Board member · independent director',
    'news.tag': 'News · DDC', 'news.title': 'News',
    'news.n1t': 'Binur Zhalenov appointed Deputy Chairman of the NBK', 'news.n2t': 'News headline 2', 'news.n3t': 'News headline 3',
    'news.n4t': 'News headline 4', 'news.n5t': 'News headline 5', 'news.n6t': 'News headline 6',
    'news.n1d': 'The DDC congratulates Binur Muratovich on his appointment and wishes him success in developing the country’s financial-technology ecosystem.',
    'news.n2d': 'Short news summary — placeholder. A brief announcement of the event will appear here.',
    'news.n3d': 'Short news summary — placeholder. A brief announcement of the event will appear here.',
    'news.n4d': 'Short news summary — placeholder. A brief announcement of the event will appear here.',
    'news.n5d': 'Short news summary — placeholder. A brief announcement of the event will appear here.',
    'news.n6d': 'Short news summary — placeholder. A brief announcement of the event will appear here.',
    'contact.url': 'ccr.nationalbank.kz — Feedback',
    'contact.eyebrow': '● Digital Development Center of the NBK', 'contact.title': 'Get in touch',
    'contact.addr': 'Astana, Mangilik El Ave., 57A',
    'contact.f.name': 'Full name', 'contact.f.email': 'Email', 'contact.f.phone': 'Phone',
    'contact.f.subject': 'Subject', 'contact.f.message': 'Your question',
    'contact.send': 'Send →', 'contact.sent': 'Sent ✓',
    'asst.title': 'DDC Assistant', 'asst.status': 'Online · instant replies',
    'asst.greeting': 'Hello! I am the Digital Development Center assistant. Pick a question below — I will answer right away.',
  },
};

const HTML_LANG = { ru: 'ru', kk: 'kk', en: 'en' };

function applyLanguage(lang) {
  const dict = I18N[lang] || I18N.ru;
  document.documentElement.lang = HTML_LANG[lang] || 'ru';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (dict[k] != null) el.textContent = dict[k];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const k = el.dataset.i18nHtml;
    if (dict[k] != null) el.innerHTML = dict[k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const k = el.dataset.i18nPh;
    if (dict[k] != null) el.setAttribute('placeholder', dict[k]);
  });
  // Кнопка «Отправить»: хранит переведённый текст «Отправлено» в data-атрибуте
  document.querySelectorAll('[data-i18n-sent]').forEach(el => {
    const k = el.dataset.i18nSent;
    if (dict[k] != null) el.dataset.sentText = dict[k];
  });

  // 3D-надписи на досках
  if (typeof window.setBoardLanguage === 'function') window.setBoardLanguage(lang);

  // Перерисовать ассистента под новый язык
  if (typeof window.renderAssistant === 'function') window.renderAssistant(lang);

  // Активная кнопка переключателя
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));

  try { localStorage.setItem('ddc_lang', lang); } catch (e) {}
}

// Инициализация языка: сохранённый или RU по умолчанию
let initialLang = 'ru';
try { const s = localStorage.getItem('ddc_lang'); if (s && I18N[s]) initialLang = s; } catch (e) {}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
});

// background.js мог ещё не выставить window.setBoardLanguage — применяем язык
// и при загрузке, и после небольшого тика на случай гонки инициализации.
applyLanguage(initialLang);
window.addEventListener('load', () => applyLanguage(initialLang));

/**
 * script.js — UI-логика: скролл, navbar, наложение HTML-панелей на 3D-доски.
 *
 * Координация с background.js:
 *   - читаем/пишем window.scrollProgress (прогресс камеры)
 *   - background.js каждый кадр зовёт window.onBoardRects(rects) с экранными
 *     прямоугольниками досок и монитора → накладываем HTML точно по их размеру.
 */

// ── Scroll progress ───────────────────────────────────────────────────────────
const totalScrollHeight = () => document.body.scrollHeight - window.innerHeight;
window.scrollProgress = 0;

function onScroll() {
  window.scrollProgress = Math.max(0, Math.min(1, window.scrollY / totalScrollHeight()));
  document.getElementById('progress').style.width = (window.scrollProgress * 100) + '%';
  updateNavActive();
}
window.addEventListener('scroll', onScroll, { passive: true });

// ── Фазы пути камеры (должны совпадать с keyframes в background.js) ────────────
// Для каждой панели — диапазон прогресса, где она «активна» (видна и кликабельна).
const PHASES = {
  services: { panel: 'panel-services', target: 'services', from: 0.27, to: 0.47 },
  about:    { panel: 'panel-about',    target: 'about',    from: 0.47, to: 0.67 },
  news:     { panel: 'panel-news',     target: 'news',     from: 0.67, to: 0.87 },
};
const MONITOR_FROM = 0.88;

// ── Наложение панелей по экранным прямоугольникам досок ────────────────────────
function applyRect(el, rect, opts = {}) {
  if (!el || !rect) return;
  // Если доска позади камеры — прячем
  if (rect.behind || rect.w < 4 || rect.h < 4) { el.style.visibility = 'hidden'; return; }
  el.style.visibility = '';
  el.style.setProperty('--cx', rect.cx + 'px');
  el.style.setProperty('--cy', rect.cy + 'px');
  if (!opts.skipSize) {
    el.style.setProperty('--bw', rect.w + 'px');
    el.style.setProperty('--bh', rect.h + 'px');
  }
}

// Вызывается из background.js каждый кадр
// На мобиле панели центрируются через CSS — не привязываем к 3D-прямоугольнику
const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches
  || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

window.onBoardRects = function (rects) {
  const p = window.scrollProgress || 0;

  // Доски
  for (const key in PHASES) {
    const ph = PHASES[key];
    const el = document.getElementById(ph.panel);
    if (!el) continue;
    const active = p >= ph.from && p <= ph.to;
    el.classList.toggle('active', active);
    if (active && !IS_MOBILE) applyRect(el, rects[ph.target]);
  }

  // Монитор (контактная форма)
  const cc = document.getElementById('contact-card');
  if (cc) {
    const show = p >= MONITOR_FROM;
    cc.style.opacity = show ? '1' : '0';
    cc.style.pointerEvents = show ? 'auto' : 'none';
    if (!IS_MOBILE) {
      cc.style.transform = show ? 'translateY(0)' : 'translateY(24px)';
      // Привязываем только к центру монитора, размер не навязываем
      if (show && rects.monitor) applyRect(cc, rects.monitor, { skipSize: true });
    }
  }
};

// ── Навигация: активный пункт по прогрессу ────────────────────────────────────
const navLinks = Array.from(document.querySelectorAll('#navbar .nav-link'));
function updateNavActive() {
  const p = window.scrollProgress || 0;
  let bestIdx = 0, bestDist = Infinity;
  navLinks.forEach((l, i) => {
    const prog = parseFloat(l.dataset.prog || '0');
    const d = Math.abs(prog - p);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  });
  navLinks.forEach((l, i) => l.classList.toggle('active', i === bestIdx));
}

// Клик по навигации → плавная прокрутка к нужному прогрессу
navLinks.forEach(l => {
  l.addEventListener('click', e => {
    e.preventDefault();
    const prog = parseFloat(l.dataset.prog || '0');
    const y = prog * totalScrollHeight();
    window.scrollTo({ top: y, behavior: 'smooth' });
    document.getElementById('navbar').classList.remove('nav-open');
  });
});

// ── Новости: раскрытие по клику / tap (hover — через CSS) ──────────────────────
document.querySelectorAll('.news-card').forEach(card => {
  const toggle = () => {
    const wasOpen = card.classList.contains('open');
    document.querySelectorAll('.news-card.open').forEach(c => c.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

// ── Navbar mobile toggle ──────────────────────────────────────────────────────
const navToggle = document.getElementById('nav-toggle');
const navbar    = document.getElementById('navbar');
if (navToggle && navbar) {
  navToggle.addEventListener('click', e => { e.stopPropagation(); navbar.classList.toggle('nav-open'); });
  document.addEventListener('click', e => { if (!navbar.contains(e.target)) navbar.classList.remove('nav-open'); });
}

// Инициализация
onScroll();
updateNavActive();

/* ════════════════════════════════════════════════════════════════════════════
   ИИ-АССИСТЕНТ — типовые вопросы и готовые ответы (без API)
   Q&A по языкам; рендер кнопок + лента «вопрос → ответ» в стиле мессенджера.
   ════════════════════════════════════════════════════════════════════════════ */
const ASST_FAQ = {
  ru: [
    { q: 'Чем занимается ЦЦР?', a: 'АО «Центр цифрового развития НБК» разрабатывает и сопровождает информационные системы для Национального Банка Казахстана: интеграции с госсистемами, аналитику, портал закупок и др. Работаем с 1996 года.' },
    { q: 'Какие услуги вы оказываете?', a: 'Основные направления: разработка ИС, системная интеграция, сопровождение Портала закупок НБРК, аналитика и регуляторная отчётность, поддержка пользователей (1477).' },
    { q: 'Как связаться с вами?', a: 'Телефон: +7 727 258-49-58, почта: info@bsbnb.kz. Адрес: г. Астана, пр. Мангилик Ел, 57А. Также можно заполнить форму обратной связи внизу страницы.' },
    { q: 'Где находится офис?', a: 'Наш офис расположен в Астане: пр. Мангилик Ел, 57А.' },
    { q: 'Что такое Портал закупок?', a: 'С 2020 года ЦЦР — оператор Портала закупок Национального Банка: единая электронная площадка для прозрачного взаимодействия заказчиков и поставщиков. Доступ: zakup.nationalbank.kz' },
    { q: 'Как работает поддержка 1477?', a: 'Контакт-центр 1477 — бесплатная линия поддержки пользователей по всему Казахстану.' },
    { q: 'С какого года вы работаете?', a: 'Центр работает с 1996 года — более 25 лет цифровой трансформации Национального Банка. Разработано 50 информационных систем, 24 из которых активно используются сегодня.' },
  ],
  kk: [
    { q: 'ЦДО немен айналысады?', a: '«ҰБ Цифрлық даму орталығы» АҚ Қазақстан Ұлттық Банкі үшін ақпараттық жүйелерді әзірлейді және сүйемелдейді: мемлекеттік жүйелермен интеграция, талдау, сатып алу порталы т.б. 1996 жылдан бері жұмыс істейміз.' },
    { q: 'Қандай қызметтер көрсетесіздер?', a: 'Негізгі бағыттар: АЖ әзірлеу, жүйелік интеграция, ҰБ Сатып алу порталын сүйемелдеу, талдау және реттеуші есептілік, пайдаланушыларды қолдау (1477).' },
    { q: 'Сізбен қалай байланысуға болады?', a: 'Телефон: +7 727 258-49-58, пошта: info@bsbnb.kz. Мекенжай: Астана қ., Мәңгілік Ел даңғ., 57А. Сондай-ақ беттің төменгі жағындағы кері байланыс нысанын толтыруға болады.' },
    { q: 'Кеңсе қайда орналасқан?', a: 'Біздің кеңсе Астанада: Мәңгілік Ел даңғ., 57А.' },
    { q: 'Сатып алу порталы деген не?', a: '2020 жылдан бері ЦДО — Ұлттық Банктің Сатып алу порталының операторы: тапсырыс берушілер мен жеткізушілердің ашық өзара әрекеттесуіне арналған бірыңғай электрондық алаң. Қолжетімділік: zakup.nationalbank.kz' },
    { q: '1477 қолдау қалай жұмыс істейді?', a: '1477 байланыс орталығы — Қазақстан бойынша пайдаланушыларды тегін қолдау желісі.' },
    { q: 'Қай жылдан бері жұмыс істейсіздер?', a: 'Орталық 1996 жылдан бері жұмыс істейді — Ұлттық Банктің цифрлық трансформациясының 25 жылдан астам тарихы. 50 ақпараттық жүйе әзірленді, оның 24-і бүгінде белсенді қолданылады.' },
  ],
  en: [
    { q: 'What does the DDC do?', a: '“DDC of the NBK” JSC develops and maintains information systems for the National Bank of Kazakhstan: integrations with state systems, analytics, the procurement portal and more. We have operated since 1996.' },
    { q: 'What services do you offer?', a: 'Main areas: IS development, system integration, support of the NBK Procurement Portal, analytics and regulatory reporting, and user support (1477).' },
    { q: 'How can I contact you?', a: 'Phone: +7 727 258-49-58, email: info@bsbnb.kz. Address: Astana, Mangilik El Ave., 57A. You can also fill out the feedback form at the bottom of the page.' },
    { q: 'Where is the office located?', a: 'Our office is in Astana: Mangilik El Ave., 57A.' },
    { q: 'What is the Procurement Portal?', a: 'Since 2020 the DDC has been the operator of the National Bank Procurement Portal: a single electronic platform for transparent interaction between customers and suppliers. Access: zakup.nationalbank.kz' },
    { q: 'How does 1477 support work?', a: 'The 1477 contact center is a free user-support line available across Kazakhstan.' },
    { q: 'Since what year have you operated?', a: 'The Center has operated since 1996 — over 25 years of the National Bank’s digital transformation. 50 information systems have been developed, 24 of which are actively used today.' },
  ],
};

(function initAssistant() {
  const root   = document.getElementById('assistant');
  const bubble = document.getElementById('asst-bubble');
  const closeB = document.getElementById('asst-close');
  const body   = document.getElementById('asst-body');
  const quick  = document.getElementById('asst-quick');
  if (!root || !bubble || !body || !quick) return;

  // Текущий язык берём из активной кнопки переключателя (или ru)
  function curLang() {
    const a = document.querySelector('.lang-btn.active');
    return (a && a.dataset.lang) || 'ru';
  }

  function getGreeting(lang) {
    const a = document.querySelector('.lang-btn.active'); // язык уже применён
    const map = { ru: 'asst.greeting', kk: 'asst.greeting', en: 'asst.greeting' };
    // достаём из I18N-словаря, объявленного выше в этом файле
    try { return I18N[lang]['asst.greeting']; } catch (e) { return ''; }
  }

  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function addMsg(text, who) {
    const d = document.createElement('div');
    d.className = 'asst-msg ' + who;
    d.textContent = text;
    body.appendChild(d);
    scrollDown();
    return d;
  }

  let typingEl = null;
  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'asst-typing';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typingEl);
    scrollDown();
  }
  function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

  let answering = false;
  function ask(item) {
    if (answering) return;
    answering = true;
    addMsg(item.q, 'user');
    showTyping();
    setTimeout(() => {
      hideTyping();
      addMsg(item.a, 'bot');
      answering = false;
    }, 480);
  }

  // Рендер ленты + кнопок под текущий язык. Доступен глобально для applyLanguage.
  window.renderAssistant = function (lang) {
    lang = lang || curLang();
    const faq = ASST_FAQ[lang] || ASST_FAQ.ru;
    // Сброс ленты — стартовое приветствие
    body.innerHTML = '';
    const greet = getGreeting(lang);
    if (greet) addMsg(greet, 'bot');
    // Кнопки вопросов
    quick.innerHTML = '';
    faq.forEach(item => {
      const b = document.createElement('button');
      b.className = 'asst-q';
      b.textContent = item.q;
      b.addEventListener('click', () => ask(item));
      quick.appendChild(b);
    });
  };

  // Открытие/закрытие
  bubble.addEventListener('click', () => {
    const willOpen = !root.classList.contains('open');
    root.classList.toggle('open', willOpen);
    document.getElementById('asst-panel').setAttribute('aria-hidden', willOpen ? 'false' : 'true');
    if (willOpen && !body.children.length) window.renderAssistant();
  });
  if (closeB) closeB.addEventListener('click', () => {
    root.classList.remove('open');
    document.getElementById('asst-panel').setAttribute('aria-hidden', 'true');
  });

  // Первичный рендер (язык уже применён applyLanguage при загрузке)
  window.renderAssistant();
})();
