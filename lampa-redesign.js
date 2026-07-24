/* =====================================================================
   LAMPA HERO v4 — премиум-редизайн главной + hero-хедер карточки фильма
   Хостить НА СТАТИКЕ (gist raw / jsdelivr). НЕ на ngrok.
   Архитектура: НИЧЕГО не fixed кроме боковой панели. Hero главной и
   баннер карточки — in-flow, вставляются MutationObserver'ом ПОСЛЕ
   рендера рядов Lampa, удаляются из DOM на чужих страницах.
   Маяки в консоли: [LH4] ...
   Секции: [1] cfg [2] utils [3] data [4] css [5] side-bar
           [6] main-hero [7] card-hero [8] observer/lifecycle
   ===================================================================== */
(function () {
    'use strict';
    if (window.__LH4__) return;
    window.__LH4__ = true;
    console.log('[LH4] script loaded v4');

    /* ---------- [1] CONFIG ---------- */
    var CFG = {
        MAIN_VH: 80,          // высота hero главной
        CARD_VH: 56,          // высота hero-хедера карточки
        SLIDES: 6,            // фильмов в карусели главной
        ROTATE_MS: 8000,      // авто-смена слайда
        Z_SIDE: 7,            // z боковой панели (под штатным меню/хедером Lampa)
        TMDB_KEY: '4ef0d7355d9ffb5151e987764708ce96'
    };

    /* ---------- [2] UTILS ---------- */
    function log() { try { console.log.apply(console, ['[LH4]'].concat([].slice.call(arguments))); } catch (e) {} }
    function toast(t) { try { Lampa.Noty && Lampa.Noty.show(t); } catch (e) {} }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function imgUrl(p, w) { try { return p ? Lampa.TMDB.image('t/p/' + (w || 'original') + p) : ''; } catch (e) { return p ? ('https://image.tmdb.org/t/p/' + (w || 'original') + p) : ''; } }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    var GENRES = {28:'Боевик',12:'Приключения',16:'Анимация',35:'Комедия',80:'Криминал',99:'Документальный',18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',878:'Фантастика',10770:'ТВ-фильм',53:'Триллер',10752:'Военный',37:'Вестерн',10759:'Боевик и Приключения',10762:'Детский',10765:'Фантастика и Фэнтези',10768:'Война и Политика'};
    function genres(ids) { return (ids || []).map(function (i) { return GENRES[i]; }).filter(Boolean).slice(0, 3); }
    function yearOf(it) { return (it.release_date || it.first_air_date || '').slice(0, 4); }
    function ratingOf(it) { return it.vote_average ? it.vote_average.toFixed(1) : '—'; }

    // режим страницы: 'main' | 'card' | 'other'
    var mode = 'main';
    function detectMode(o) {
        if (!o) return 'other';
        var c = (o.component || '') + '';
        if (c === 'main' || c === 'category_main') return 'main';
        if (/главная|головна|\bmain\b/i.test(o.title || '') && c.indexOf('card') < 0 && c.indexOf('full') < 0) return 'main';
        if (c === 'card' || c === 'full' || c === 'full_start' || c.indexOf('card') === 0) return 'card';
        return 'other';
    }

    // робастный контейнер рядов/контента (не угадываем — берём несколько кандидатов)
    function contentBox() {
        var c = $('.content');
        if (c.length) return c[0];
        var card = $('.card').first();
        if (card.length) { var p = card[0].parentElement; while (p && p !== document.body) { if (p.children.length > 1) return p; p = p.parentElement; } }
        return document.body;
    }

    /* ---------- [3] DATA ---------- */
    var POOL = [], SLIDES = [];
    function loadPool(cb) {
        function done(list) { POOL = (list || []).filter(function (x) { return x && x.backdrop_path; }); log('pool', POOL.length); cb && cb(); }
        try {
            var url = Lampa.TMDB.api('trending/all/week?api_key=' + Lampa.TMDB.key() + '&language=ru');
            Lampa.Network.silent(url, function (d) { done(d && d.results); }, fallback, false, { cache: { life: 60 } });
        } catch (e) { fallback(); }
        function fallback() {
            try { fetch('https://api.themoviedb.org/3/trending/all/week?language=ru&api_key=' + CFG.TMDB_KEY).then(function (r) { return r.json(); }).then(function (d) { done(d && d.results); }).catch(function () { done([]); }); }
            catch (e) { done([]); }
        }
    }

    /* ---------- [4] CSS ---------- */
    function addStyles() {
        var css = [
        /* ===== HERO ГЛАВНОЙ (in-flow, full-bleed) ===== */
        '#lh-hero-main{position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;height:' + CFG.MAIN_VH + 'vh;min-height:420px;overflow:hidden;background:#0a0a0e}',
        '#lh-hero-main .lh-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s ease;will-change:opacity,transform}',
        '#lh-hero-main .lh-bg.on{opacity:1;animation:lhKen 16s ease-in-out infinite alternate}',
        '@keyframes lhKen{from{transform:scale(1.03)}to{transform:scale(1.14)}}',
        '#lh-hero-main .lh-g1{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,7,11,.98) 0%,rgba(7,7,11,.80) 32%,rgba(7,7,11,.30) 64%,rgba(7,7,11,0) 100%)}',
        '#lh-hero-main .lh-g2{position:absolute;inset:0;background:linear-gradient(0deg,rgba(7,7,11,.98) 0%,rgba(7,7,11,.35) 26%,rgba(7,7,11,0) 55%)}',
        '#lh-hero-main .lh-body{position:absolute;z-index:3;left:max(3.4vw,calc(50vw - 46vw));top:0;bottom:0;width:min(46vw,820px);display:flex;flex-direction:column;justify-content:center;padding-right:2vw}',
        '#lh-hero-main .lh-anim>*{animation:lhUp .7s cubic-bezier(.2,.7,.2,1) both}',
        '#lh-hero-main .lh-anim>*:nth-child(2){animation-delay:.06s}#lh-hero-main .lh-anim>*:nth-child(3){animation-delay:.12s}#lh-hero-main .lh-anim>*:nth-child(4){animation-delay:.18s}#lh-hero-main .lh-anim>*:nth-child(5){animation-delay:.24s}',
        '@keyframes lhUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}',
        '#lh-hero-main .lh-title{font-size:clamp(28px,4.4vw,72px);font-weight:700;line-height:1.02;letter-spacing:.14em;text-transform:uppercase;margin:0 0 .22em;color:#fff;text-shadow:0 4px 40px rgba(0,0,0,.6)}',
        '#lh-hero-main .lh-orig{font-size:clamp(11px,1.25vw,18px);font-weight:400;letter-spacing:.42em;text-transform:uppercase;color:#d7b25c;margin:0 0 1.05em;opacity:.92}',
        '#lh-hero-main .lh-meta{display:flex;gap:13px;align-items:center;color:#cfd2da;font-size:clamp(11px,1.02vw,16px);margin-bottom:1em;flex-wrap:wrap}',
        '#lh-hero-main .lh-pill{background:linear-gradient(180deg,#e3c069,#c9a24b);color:#161006;font-weight:800;padding:3px 11px;border-radius:7px;letter-spacing:.02em}',
        '#lh-hero-main .lh-sep{width:4px;height:4px;border-radius:50%;background:#6f7384;display:inline-block}',
        '#lh-hero-main .lh-desc{color:#c4c7d3;font-size:clamp(12px,1.08vw,17px);line-height:1.6;max-height:4.6em;overflow:hidden;margin-bottom:1.5em;text-shadow:0 1px 14px rgba(0,0,0,.55)}',
        /* кнопки */
        '#lh-hero-main .lh-btns{display:flex;gap:13px;flex-wrap:wrap}',
        '.lh-btn{border:0;border-radius:13px;padding:.82em 1.7em;font-size:clamp(12px,1.08vw,17px);font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:.6em;transition:transform .16s ease,box-shadow .22s ease,background .22s ease,border-color .22s ease;letter-spacing:.01em}',
        '.lh-btn svg{width:1.15em;height:1.15em;flex:0 0 auto}',
        '.lh-btn--play{background:linear-gradient(180deg,#e7c572 0%,#c9a24b 100%);color:#1a1206;box-shadow:0 10px 30px rgba(201,162,75,.38),inset 0 1px 0 rgba(255,255,255,.4)}',
        '.lh-btn--play:hover,.lh-btn--play.focus{transform:translateY(-3px) scale(1.035);box-shadow:0 16px 42px rgba(201,162,75,.55),inset 0 1px 0 rgba(255,255,255,.5)}',
        '.lh-btn--ghost{background:rgba(255,255,255,.07);color:#fff;border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
        '.lh-btn--ghost:hover,.lh-btn--ghost.focus{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.34);transform:translateY(-3px)}',
        /* правая стеклянная панель */
        '#lh-hero-main .lh-panel{position:absolute;z-index:3;right:max(3vw,calc(50vw - 47vw));top:50%;transform:translateY(-50%);width:clamp(220px,19vw,300px);background:rgba(14,14,19,.55);border:1px solid rgba(255,255,255,.13);border-radius:18px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:1.25em 1.45em;box-shadow:0 24px 70px rgba(0,0,0,.55)}',
        '#lh-hero-main .lh-pr{display:flex;justify-content:space-between;align-items:center;padding:.58em 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:clamp(11px,1vw,15px)}',
        '#lh-hero-main .lh-pr:last-child{border-bottom:0}',
        '#lh-hero-main .lh-pr .k{color:#9aa0b0}#lh-hero-main .lh-pr .v{color:#fff;font-weight:700;text-align:right;max-width:62%}#lh-hero-main .lh-pr .v.gold{color:#e3c069}',
        /* точки */
        '#lh-hero-main .lh-dots{position:absolute;z-index:4;left:50%;transform:translateX(-50%);bottom:4.2%;display:flex;gap:9px;align-items:center}',
        '#lh-hero-main .lh-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.32);transition:all .35s ease;cursor:pointer}',
        '#lh-hero-main .lh-dots i.on{width:28px;border-radius:5px;background:linear-gradient(90deg,#e3c069,#c9a24b)}',

        /* ===== БОКОВАЯ ПАНЕЛЬ ===== */
        '#lh-side{position:fixed;left:0;top:0;bottom:0;width:66px;z-index:' + CFG.Z_SIDE + ';display:none;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:linear-gradient(90deg,rgba(9,9,13,.86) 0%,rgba(9,9,13,.55) 70%,rgba(9,9,13,0) 100%);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
        '#lh-side.on{display:flex}',
        '#lh-side a{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:13px;color:#cfd2da;cursor:pointer;transition:all .2s ease;opacity:.82}',
        '#lh-side a:hover,#lh-side a.act{background:rgba(201,162,75,.18);color:#e7c572;opacity:1;transform:scale(1.06)}',
        '#lh-side a svg{width:23px;height:23px;fill:currentColor;stroke:currentColor}',

        /* ===== HERO-ХЕДЕР КАРТОЧКИ ФИЛЬМА ===== */
        '#lh-hero-card{position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;height:' + CFG.CARD_VH + 'vh;min-height:340px;overflow:hidden;background:#0a0a0e;margin-bottom:-6vh}',
        '#lh-hero-card .lh-cbg{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(2px) brightness(.5);transform:scale(1.06)}',
        '#lh-hero-card .lh-cg1{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,7,11,.96) 0%,rgba(7,7,11,.55) 45%,rgba(7,7,11,.15) 100%)}',
        '#lh-hero-card .lh-cg2{position:absolute;inset:0;background:linear-gradient(0deg,rgba(7,7,11,1) 2%,rgba(7,7,11,.4) 30%,rgba(7,7,11,0) 60%)}',
        '#lh-hero-card .lh-cbody{position:absolute;z-index:3;left:max(3.4vw,calc(50vw - 47vw));bottom:9%;width:min(70vw,1100px);display:flex;align-items:flex-end;gap:2.2vw;animation:lhUp .6s ease both}',
        '#lh-hero-card .lh-cposter{flex:0 0 auto;width:clamp(110px,11vw,170px);border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.1)}',
        '#lh-hero-card .lh-cposter img{width:100%;display:block}',
        '#lh-hero-card .lh-ctext{flex:1 1 auto;min-width:0}',
        '#lh-hero-card .lh-ctitle{font-size:clamp(22px,3.4vw,56px);font-weight:800;line-height:1.04;margin:0 0 .3em;color:#fff;text-shadow:0 3px 30px rgba(0,0,0,.6)}',
        '#lh-hero-card .lh-cmeta{display:flex;gap:12px;align-items:center;flex-wrap:wrap;color:#cfd2da;font-size:clamp(11px,1.05vw,16px)}',
        '#lh-hero-card .lh-cmeta .lh-pill{background:linear-gradient(180deg,#e3c069,#c9a24b);color:#161006;font-weight:800;padding:3px 11px;border-radius:7px}',
        '#lh-hero-card .lh-cmeta .chip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);padding:3px 11px;border-radius:8px;color:#fff}',

        /* мобила */
        '@media screen and (max-width:767px){',
        ' #lh-hero-main .lh-body{left:6%;width:86%}#lh-hero-main .lh-panel{display:none}#lh-side{display:none!important}',
        ' #lh-hero-card .lh-cbody{flex-direction:column;align-items:flex-start;gap:14px;left:6%;width:88%}#lh-hero-card .lh-cposter{width:90px}',
        '}'
        ].join('');
        try { Lampa.Template.add('lh4_css', '<style>' + css + '</style>'); $('body').append(Lampa.Template.get('lh4_css', {}, true)); }
        catch (e) { var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
    }

    /* ---------- [5] SIDE BAR ---------- */
    var $side;
    function sprite(name) { return '<svg viewBox="0 0 24 24"><use xlink:href="#sprite-' + name + '" href="#sprite-' + name + '"></use></svg>'; }
    function buildSide() {
        if ($side) return;
        $side = $('<div id="lh-side">' +
            '<a data-go="main" title="Главная">' + sprite('home') + '</a>' +
            '<a data-go="book" title="Закладки">' + sprite('favorite') + '</a>' +
            '<a data-go="hist" title="История">' + sprite('history') + '</a>' +
            '<a data-go="set" title="Настройки">' + sprite('settings') + '</a>' +
          '</div>');
        $('body').append($side);
        $side.find('a').on('click', function () {
            var k = $(this).attr('data-go');
            try {
                if (k === 'set') { Lampa.Controller.toggle('settings'); return; }
                if (k === 'main') Lampa.Activity.push({ source: Lampa.Storage.get('source', 'tmdb'), title: 'Главная', component: 'main', page: 1 });
                else if (k === 'book') Lampa.Activity.push({ url: '', title: 'Закладки', component: 'bookmarks', page: 1 });
                else if (k === 'hist') Lampa.Activity.push({ url: '', title: 'История', component: 'favorite', type: 'history', page: 1 });
            } catch (e) { log('side err', e); }
        });
    }
    function syncSide() {
        if (!$side) return;
        $side.toggleClass('on', mode === 'main');
        $side.find('a').removeClass('act'); if (mode === 'main') $side.find('[data-go="main"]').addClass('act');
    }

    /* ---------- [6] MAIN HERO ---------- */
    var cur = 0, timer = null, bgT = false;
    function buildMainHero() {
        var el = document.createElement('div');
        el.id = 'lh-hero-main';
        el.innerHTML =
            '<div class="lh-bg a"></div><div class="lh-bg b"></div><div class="lh-g1"></div><div class="lh-g2"></div>' +
            '<div class="lh-body"></div><div class="lh-panel"></div><div class="lh-dots"></div>';
        return el;
    }
    function renderMainSlide(root, i) {
        var it = SLIDES[i]; if (!it) return;
        var $r = $(root), $a = $r.find('.lh-bg.a'), $b = $r.find('.lh-bg.b');
        var on = bgT ? $a : $b, off = bgT ? $b : $a;
        on.css('background-image', 'url(' + imgUrl(it.backdrop_path) + ')');
        void on[0].offsetWidth; on.addClass('on'); off.removeClass('on'); bgT = !bgT;
        var g = genres(it.genre_ids), rating = ratingOf(it), yr = yearOf(it), liked = it.vote_average ? Math.round(it.vote_average * 10) + '%' : '—';
        var type = it.media_type === 'tv' ? 'Сериал' : 'Фильм';
        var $body = $r.find('.lh-body').removeClass('lh-anim');
        $body.html(
            '<h1 class="lh-title">' + esc(it.title || it.name) + '</h1>' +
            ((it.original_title && it.original_title !== it.title) ? '<div class="lh-orig">' + esc(it.original_title) + '</div>' : '<div class="lh-orig">' + type + '</div>') +
            '<div class="lh-meta"><span class="lh-pill">TMDB ' + rating + '</span>' + (yr ? '<span>' + yr + '</span><span class="lh-sep"></span>' : '') + '<span>' + esc(g.join(' · ') || type) + '</span></div>' +
            '<div class="lh-desc">' + esc(it.overview || '') + '</div>' +
            '<div class="lh-btns">' +
              '<button class="lh-btn lh-btn--play" data-a="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Смотреть</button>' +
              '<button class="lh-btn lh-btn--ghost" data-a="trailer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>Трейлер</button>' +
              '<button class="lh-btn lh-btn--ghost" data-a="list"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>В список</button>' +
            '</div>'
        );
        void $body[0].offsetWidth; $body.addClass('lh-anim');
        $r.find('.lh-panel').html(
            pr('Рейтинг TMDB', '<span class="v gold">' + rating + '</span>') +
            pr('Год', yr || '—') +
            pr('Жанры', esc(g.join(', ') || '—')) +
            pr('Понравилось', liked) +
            pr('Тип', type)
        );
        var $d = $r.find('.lh-dots').empty();
        SLIDES.forEach(function (_, k) { var d = $('<i></i>').toggleClass('on', k === i); d.on('click', function () { goMain(root, k, true); }); $d.append(d); });
        $body.find('[data-a="play"]').on('click', function () { actPlay(it); });
        $body.find('[data-a="trailer"]').on('click', function () { actTrailer(it); });
        $body.find('[data-a="list"]').on('click', function () { actList(it); });
    }
    function pr(k, v) { return '<div class="lh-pr"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; }
    function goMain(root, i, user) { if (!SLIDES.length) return; cur = (i + SLIDES.length) % SLIDES.length; renderMainSlide(root, cur); if (user) startTimer(root); }
    function startTimer(root) { stopTimer(); timer = setInterval(function () { if (document.getElementById('lh-hero-main')) goMain(root, cur + 1, false); else stopTimer(); }, CFG.ROTATE_MS); }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function ensureMainHero() {
        if (mode !== 'main') return;
        if (document.getElementById('lh-hero-main')) return;          // уже есть
        var box = contentBox(); if (!box) return;
        if (!POOL.length) { loadPool(function () { ensureMainHero(); }); return; }
        SLIDES = shuffle(POOL).slice(0, Math.min(CFG.SLIDES, POOL.length)); cur = 0;
        var el = buildMainHero();
        box.insertBefore(el, box.firstChild);                          // in-flow, ПЕРВЫМ → раздвигает ряды
        renderMainSlide(el, 0); startTimer(el);
        log('main hero inserted into', box.className || box.tagName);
    }
    function removeMainHero() { stopTimer(); var e = document.getElementById('lh-hero-main'); if (e) e.remove(); }

    /* ---------- [7] CARD HERO ---------- */
    function ensureCardHero(obj) {
        if (mode !== 'card') return;
        if (document.getElementById('lh-hero-card')) return;
        var it = obj && (obj.card || obj.data || obj);
        if (!it || !it.backdrop_path) { log('card hero: no backdrop'); return; }
        var box = contentBox(); if (!box) return;
        var g = genres(it.genre_ids), rating = ratingOf(it), yr = yearOf(it);
        var el = document.createElement('div');
        el.id = 'lh-hero-card';
        el.innerHTML =
            '<div class="lh-cbg" style="background-image:url(' + imgUrl(it.backdrop_path) + ')"></div>' +
            '<div class="lh-cg1"></div><div class="lh-cg2"></div>' +
            '<div class="lh-cbody">' +
              (it.poster_path ? '<div class="lh-cposter"><img src="' + imgUrl(it.poster_path, 'w342') + '"></div>' : '') +
              '<div class="lh-ctext"><h1 class="lh-ctitle">' + esc(it.title || it.name || '') + '</h1>' +
              '<div class="lh-cmeta"><span class="lh-pill">TMDB ' + rating + '</span>' + (yr ? '<span class="chip">' + yr + '</span>' : '') +
                (it.original_title && it.original_title !== it.title ? '<span class="chip">' + esc(it.original_title) + '</span>' : '') +
                (g.length ? '<span class="chip">' + esc(g.join(', ')) + '</span>' : '') + '</div></div>' +
            '</div>';
        box.insertBefore(el, box.firstChild);
        log('card hero inserted for', it.title || it.name);
    }
    function removeCardHero() { var e = document.getElementById('lh-hero-card'); if (e) e.remove(); }

    /* ---------- [8] ACTIONS + LIFECYCLE ---------- */
    function actPlay(it) { try { if (Lampa.Card && Lampa.Card.open) { Lampa.Card.open(it); return; } Lampa.Activity.push({ url: 'card', title: it.title || it.name, card: it }); } catch (e) { toast('Не удалось открыть'); } }
    function actList(it) { try { if (Lampa.Favorite && Lampa.Favorite.add) { Lampa.Favorite.add('bookmarks', it, 100); toast('Добавлено в закладки'); return; } toast('Закладки недоступны'); } catch (e) { toast('Не удалось добавить'); } }
    function actTrailer(it) {
        try {
            var type = it.media_type === 'tv' ? 'tv' : 'movie'; toast('Ищу трейлер…');
            var u = Lampa.TMDB.api(type + '/' + it.id + '/videos?api_key=' + Lampa.TMDB.key() + '&language=ru');
            Lampa.Network.silent(u, function (d) {
                var v = (d && d.results) || [];
                var key = (v.filter(function (x) { return x.site === 'YouTube' && x.type === 'Trailer'; })[0] || v.filter(function (x) { return x.site === 'YouTube'; })[0] || {}).key;
                if (key) { try { if (Lampa.YouTube && Lampa.YouTube.open) Lampa.YouTube.open(key); else window.open('https://www.youtube.com/watch?v=' + key, '_blank'); } catch (e) {} toast('Трейлер: ' + (it.title || it.name)); }
                else toast('Трейлер не найден');
            }, function () { toast('Трейлер недоступен'); }, false, { cache: { life: 60 } });
        } catch (e) { toast('Трейлер недоступен'); }
    }

    var lastCardObj = null;
    function applyMode(newMode, obj) {
        var prev = mode; mode = newMode;
        log('mode', prev, '->', mode);
        // чистим то, что не нужно новому режиму
        if (mode !== 'main') removeMainHero();
        if (mode !== 'card') removeCardHero();
        // ставим нужное
        if (mode === 'main') ensureMainHero();
        if (mode === 'card') { lastCardObj = obj; ensureCardHero(obj); }
        syncSide();
    }

    function onActivity(e) {
        try {
            var o = e.object || e.data || {};
            if (e.type === 'push' || e.type === 'replace' || e.type === 'ready' || e.type === 'back') {
                applyMode(detectMode(o), o);
            }
        } catch (err) { log('activity err', err); }
    }

    // observer: докидывает блоки ПОСЛЕ рендера Lampa (решает тайминг v3)
    var mo;
    function startObserver() {
        if (!window.MutationObserver) return;
        mo = new MutationObserver(function () {
            try {
                if (mode === 'main' && !document.getElementById('lh-hero-main')) ensureMainHero();
                if (mode === 'card' && !document.getElementById('lh-hero-card') && lastCardObj) ensureCardHero(lastCardObj);
                if (mode !== 'main' && document.getElementById('lh-hero-main')) removeMainHero();
                if (mode !== 'card' && document.getElementById('lh-hero-card')) removeCardHero();
            } catch (e) {}
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    function start() {
        addStyles(); buildSide();
        try { var l = Lampa.Activity && Lampa.Activity.last && Lampa.Activity.last(); if (l) mode = detectMode(l); } catch (e) {}
        loadPool(function () { applyMode(mode, lastCardObj); });
        syncSide();
        if (Lampa.Listener && Lampa.Listener.follow) {
            Lampa.Listener.follow('activity', onActivity);
            Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') { mode = 'main'; applyMode('main', null); } });
        }
        startObserver();
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stopTimer();
            else if (mode === 'main') { var r = document.getElementById('lh-hero-main'); if (r) startTimer(r); }
        });
        log('started, mode=', mode);
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();