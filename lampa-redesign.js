/* =====================================================================
   LAMPA HERO v2 — премиум hero-шапка в стиле SILMON CINEMA
   Хостить НА СТАТИКЕ (gist raw / jsdelivr). НЕ на ngrok.
   Физика: hero = fixed-слой (статичен), фильмы листаются ПОД ним.
   Маяки в консоли: [HERO] ...  (по ним видно, что живое)
   Секции: [1] config  [2] genres  [3] utils  [4] css  [5] data
           [6] render  [7] carousel  [8] actions  [9] lifecycle
   ===================================================================== */
(function () {
    'use strict';
    if (window.__LAMPA_HERO_V2__) return;
    window.__LAMPA_HERO_V2__ = true;
    console.log('[HERO] script loaded v2');

    /* ---------- [1] CONFIG ---------- */
    var CFG = {
        HERO_VH: 80,            // высота шапки в vh (и распорки)
        SLIDES: 6,              // фильмов в карусели
        ROTATE_MS: 8000,        // авто-смена слайда
        TOP_PAD_VH: 9,          // отступ текста сверху под хедер Lampa
        Z: 5                    // z-index hero (ниже хедера/меню/плеера Lampa)
    };

    /* ---------- [2] GENRES (id -> ru) ---------- */
    var GENRES = {
        28:'Боевик',12:'Приключения',16:'Анимация',35:'Комедия',80:'Криминал',
        99:'Документальный',18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',
        27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',878:'Фантастика',
        10770:'ТВ-фильм',53:'Триллер',10752:'Военный',37:'Вестерн',
        10759:'Боевик и Приключения',10762:'Детский',10765:'Фантастика и Фэнтези',
        10768:'Война и Политика'
    };
    function genreNames(ids) {
        return (ids || []).map(function (i) { return GENRES[i]; }).filter(Boolean).slice(0, 2);
    }

    /* ---------- [3] UTILS ---------- */
    function log() { try { console.log.apply(console, ['[HERO]'].concat([].slice.call(arguments))); } catch (e) {} }
    function toast(t) { try { Lampa.Noty && Lampa.Noty.show(t); } catch (e) {} }
    function img(path, w) { return path ? Lampa.TMDB.image('t/p/' + (w || 'original') + path) : ''; }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }
    function isMain(obj) { return obj && (obj.component === 'main' || obj.component === 'category_main'); }

    /* ---------- [4] CSS ---------- */
    function addStyles() {
        Lampa.Template.add('lampa_hero_v2_css', '<style>' + [
            /* распорка в потоке главной (держит место под fixed hero) */
            '.lh-spacer{width:100%;height:' + CFG.HERO_VH + 'vh;flex:0 0 ' + CFG.HERO_VH + 'vh;pointer-events:none}',
            /* fixed hero-слой */
            '.lh-root{position:fixed;top:0;left:0;right:0;height:' + CFG.HERO_VH + 'vh;z-index:' + CFG.Z + ';overflow:hidden;display:none}',
            '.lh-root.lh-on{display:block}',
            /* два фона для crossfade + ken-burns */
            '.lh-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s ease;will-change:opacity}',
            '.lh-bg.lh-bg--act{opacity:1;animation:lhKen 12s ease-in-out infinite alternate}',
            '@keyframes lhKen{from{transform:scale(1.02)}to{transform:scale(1.12)}}',
            /* градиенты читаемости */
            '.lh-grad{position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,6,10,.97) 0%,rgba(6,6,10,.72) 38%,rgba(6,6,10,.18) 70%,rgba(6,6,10,0) 100%)}',
            '.lh-gradb{position:absolute;inset:0;background:linear-gradient(0deg,rgba(6,6,10,.95) 0%,rgba(6,6,10,0) 32%)}',
            /* левый блок текста */
            '.lh-body{position:absolute;z-index:3;left:3.4%;top:' + CFG.TOP_PAD_VH + 'vh;bottom:0;width:46%;display:flex;flex-direction:column;justify-content:center}',
            '.lh-anim{animation:lhUp .7s cubic-bezier(.2,.7,.2,1) both}',
            '@keyframes lhUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}',
            '.lh-title{font-size:3.5vw;font-weight:800;line-height:1.04;letter-spacing:.4px;margin:0 0 .35em;color:#fff;text-shadow:0 2px 24px rgba(0,0,0,.5)}',
            '.lh-meta{display:flex;gap:12px;align-items:center;color:#d6d9e2;font-size:1.05vw;margin-bottom:.9em;flex-wrap:wrap}',
            '.lh-pill{background:#d4af37;color:#161006;font-weight:800;padding:2px 10px;border-radius:7px;font-size:.95vw}',
            '.lh-dot{width:4px;height:4px;border-radius:50%;background:#7c8090;display:inline-block}',
            '.lh-desc{color:#c7cad6;font-size:1.12vw;line-height:1.55;max-height:5.4em;overflow:hidden;margin-bottom:1.4em;text-shadow:0 1px 10px rgba(0,0,0,.5)}',
            '.lh-btns{display:flex;gap:12px;flex-wrap:wrap}',
            '.lh-btn{border:0;border-radius:11px;padding:.72em 1.5em;font-size:1.12vw;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:.5em;transition:transform .15s ease,box-shadow .2s ease,background .2s ease}',
            '.lh-btn--play{background:#d4af37;color:#161006;box-shadow:0 6px 22px rgba(212,175,55,.35)}',
            '.lh-btn--play:hover,.lh-btn--play.focus{transform:translateY(-2px) scale(1.03);box-shadow:0 10px 30px rgba(212,175,55,.5)}',
            '.lh-btn--ghost{background:rgba(255,255,255,.12);color:#fff;backdrop-filter:blur(6px)}',
            '.lh-btn--ghost:hover,.lh-btn--ghost.focus{background:rgba(255,255,255,.22);transform:translateY(-2px)}',
            /* правая стеклянная инфо-панель */
            '.lh-panel{position:absolute;z-index:3;right:3.2%;top:50%;transform:translateY(-50%);width:20vw;min-width:230px;background:rgba(20,20,26,.42);border:1px solid rgba(255,255,255,.12);border-radius:16px;backdrop-filter:blur(16px);padding:1.3em 1.4em;box-shadow:0 18px 50px rgba(0,0,0,.45)}',
            '.lh-panel__row{display:flex;justify-content:space-between;align-items:center;padding:.5em 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:1.02vw}',
            '.lh-panel__row:last-child{border-bottom:0}',
            '.lh-panel__k{color:#9aa0b0}',
            '.lh-panel__v{color:#fff;font-weight:700;text-align:right;max-width:60%}',
            '.lh-panel__v--gold{color:#d4af37}',
            /* точки-карусель */
            '.lh-dots{position:absolute;z-index:4;left:3.4%;bottom:5%;display:flex;gap:9px;align-items:center}',
            '.lh-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.35);transition:all .35s ease;cursor:pointer}',
            '.lh-dots i.lh-dots--act{width:26px;border-radius:5px;background:#d4af37}',
            /* мобила */
            '@media screen and (max-width:767px){',
            '  .lh-body{width:84%;left:5%}.lh-title{font-size:8vw}.lh-desc{font-size:3.5vw}.lh-btn{font-size:3.6vw}.lh-meta{font-size:3.2vw}',
            '  .lh-panel{display:none}.lh-dots{left:5%}',
            '}'
        ].join('') + '</style>');
        $('body').append(Lampa.Template.get('lampa_hero_v2_css', {}, true));
    }

    /* ---------- [5] DATA (через прокси Lampa — без CORS) ---------- */
    var POOL = [];      // топ фильмов недели
    var SLIDES = [];    // текущая выборка в карусель
    function loadPool(cb) {
        var url = Lampa.TMDB.api('trending/all/week?api_key=' + Lampa.TMDB.key() + '&language=ru');
        Lampa.Network.silent(url, function (d) {
            POOL = ((d && d.results) || []).filter(function (x) { return x.backdrop_path; });
            log('pool loaded', POOL.length);
            cb && cb();
        }, function () { log('pool error'); cb && cb(); }, false, { cache: { life: 60 } });
    }
    function pickSlides() {
        SLIDES = shuffle(POOL).slice(0, Math.min(CFG.SLIDES, POOL.length));
        log('slides picked', SLIDES.length);
    }

    /* ---------- [6] RENDER fixed-слоя ---------- */
    var $root, $bgA, $bgB, $body, $panel, $dots, bgToggle = false;
    function buildRoot() {
        if ($root) return;
        $root = $('<div class="lh-root">' +
            '<div class="lh-bg lh-bg--a"></div><div class="lh-bg lh-bg--b"></div>' +
            '<div class="lh-grad"></div><div class="lh-gradb"></div>' +
            '<div class="lh-body"></div>' +
            '<div class="lh-panel"></div>' +
            '<div class="lh-dots"></div>' +
          '</div>');
        $bgA = $root.find('.lh-bg--a'); $bgB = $root.find('.lh-bg--b');
        $body = $root.find('.lh-body'); $panel = $root.find('.lh-panel'); $dots = $root.find('.lh-dots');
        $('body').append($root);
        log('root built');
    }
    function buildSpacer() {
        // распорка-ряд только на главной (screen main) — держит место под fixed hero
        Lampa.ContentRows.add({
            index: 0, name: 'lampa_hero_spacer', title: '', screen: ['main'],
            call: function () {
                var made = false;
                return function (callback) {
                    if (made) return callback({ results: [], title: '', params: { items: { view: 1, mapping: 'line' } } });
                    made = true;
                    var card = {
                        source: 'custom', title: ' ', name: ' ', id: 'lh_spacer',
                        params: {
                            createInstance: function () { return Lampa.Maker.make('Card', this, function (m) { return m.only('Card', 'Callback'); }); },
                            emit: { onCreate: function () { this.html.addClass('lh-spacer'); this.html.find('.card__view,.card__title,.card__age,.card__img').hide(); } }
                        }
                    };
                    callback({ results: [card], title: '', params: { items: { view: 1, mapping: 'line' } } });
                };
            }
        });
    }

    /* ---------- [7] CAROUSEL ---------- */
    var cur = 0, timer = null;
    function renderSlide(i, animate) {
        var it = SLIDES[i]; if (!it) return;
        // crossfade фона
        var on = bgToggle ? $bgA : $bgB, off = bgToggle ? $bgB : $bgA;
        on.css('background-image', 'url(' + img(it.backdrop_path) + ')');
        // reflow чтобы transition сработал
        void on[0].offsetWidth;
        on.addClass('lh-bg--act'); off.removeClass('lh-bg--act');
        bgToggle = !bgToggle;
        // текст + панель
        var rating = it.vote_average ? it.vote_average.toFixed(1) : '—';
        var year = (it.release_date || it.first_air_date || '').slice(0, 4);
        var liked = it.vote_average ? Math.round(it.vote_average * 10) + '%' : '—';
        var g = genreNames(it.genre_ids).join(', ') || '—';
        var html =
            '<h1 class="lh-title">' + esc(it.title || it.name) + '</h1>' +
            '<div class="lh-meta"><span class="lh-pill">★ ' + rating + '</span>' +
              (year ? '<span>' + year + '</span><span class="lh-dot"></span>' : '') +
              '<span>' + esc((it.media_type === 'tv' ? 'Сериал' : 'Фильм')) + '</span></div>' +
            '<div class="lh-desc">' + esc(it.overview || '') + '</div>' +
            '<div class="lh-btns">' +
              '<button class="lh-btn lh-btn--play" data-act="play">▶ Смотреть</button>' +
              '<button class="lh-btn lh-btn--ghost" data-act="trailer">▷ Трейлер</button>' +
              '<button class="lh-btn lh-btn--ghost" data-act="list">＋ В список</button>' +
            '</div>';
        $body.html(html);
        if (animate) { $body.removeClass('lh-anim'); void $body[0].offsetWidth; $body.addClass('lh-anim'); }
        else $body.addClass('lh-anim');
        $panel.html(
            row('Рейтинг TMDB', '<span class="lh-panel__v lh-panel__v--gold">' + rating + '</span>') +
            row('Год', year || '—') +
            row('Жанры', esc(g)) +
            row('Понравилось', liked) +
            row('Тип', it.media_type === 'tv' ? 'Сериал' : 'Фильм')
        );
        // точки
        $dots.html('');
        SLIDES.forEach(function (_, k) {
            var d = $('<i></i>').toggleClass('lh-dots--act', k === i);
            d.on('click', function () { go(k, true); });
            $dots.append(d);
        });
        // кнопки
        $body.find('[data-act="play"]').on('click', function () { actPlay(it); });
        $body.find('[data-act="trailer"]').on('click', function () { actTrailer(it); });
        $body.find('[data-act="list"]').on('click', function () { actList(it); });
    }
    function row(k, v) { return '<div class="lh-panel__row"><span class="lh-panel__k">' + k + '</span><span class="lh-panel__v">' + v + '</span></div>'; }
    function go(i, user) {
        if (!SLIDES.length) return;
        cur = (i + SLIDES.length) % SLIDES.length;
        renderSlide(cur, true);
        if (user) restartTimer();
    }
    function next() { go(cur + 1, false); }
    function startTimer() { stopTimer(); timer = setInterval(next, CFG.ROTATE_MS); }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function restartTimer() { startTimer(); }

    /* ---------- [8] ACTIONS (все в try/catch — не падаем) ---------- */
    function actPlay(it) {
        try {
            if (Lampa.Card && Lampa.Card.open) { Lampa.Card.open(it); return; }
            Lampa.Activity.push({ url: 'card', title: it.title || it.name, card: it });
        } catch (e) { log('play err', e); toast('Не удалось открыть'); }
    }
    function actList(it) {
        try {
            if (Lampa.Favorite && Lampa.Favorite.add) { Lampa.Favorite.add('bookmarks', it, 100); toast('Добавлено в список'); return; }
            toast('Закладки недоступны');
        } catch (e) { log('list err', e); toast('Не удалось добавить'); }
    }
    function actTrailer(it) {
        try {
            var type = it.media_type === 'tv' ? 'tv' : 'movie';
            var u = Lampa.TMDB.api(type + '/' + it.id + '/videos?api_key=' + Lampa.TMDB.key() + '&language=ru');
            toast('Ищу трейлер…');
            Lampa.Network.silent(u, function (d) {
                var vids = (d && d.results) || [];
                var key = (vids.filter(function (v) { return v.site === 'YouTube' && v.type === 'Trailer'; })[0]
                        || vids.filter(function (v) { return v.site === 'YouTube'; })[0] || {}).key;
                if (key) {
                    try {
                        if (Lampa.YouTube && Lampa.YouTube.open) { Lampa.YouTube.open(key); return; }
                        window.open('https://www.youtube.com/watch?v=' + key, '_blank');
                    } catch (ee) {}
                    toast('Трейлер: ' + (it.title || it.name));
                } else toast('Трейлер не найден');
            }, function () { toast('Трейлер недоступен'); }, false, { cache: { life: 60 } });
        } catch (e) { log('trailer err', e); toast('Трейлер недоступен'); }
    }

    /* ---------- [9] LIFECYCLE (показ/скрытие/обновление) ---------- */
    function showHero() {
        buildRoot();
        if (!POOL.length) { loadPool(function () { pickSlides(); cur = 0; renderSlide(0, true); startTimer(); }); return; }
        pickSlides(); cur = 0; renderSlide(0, true); startTimer();
        $root.addClass('lh-on');
        log('hero shown');
    }
    function hideHero() { stopTimer(); if ($root) $root.removeClass('lh-on'); }

    function onActivity(e) {
        try {
            var obj = e.object || e.data || {};
            if (e.type === 'push' || e.type === 'replace' || e.type === 'ready') {
                if (isMain(obj)) showHero(); else hideHero();
            }
        } catch (err) { log('activity err', err); }
    }

    function start() {
        addStyles();
        buildSpacer();
        buildRoot();
        // первичная загрузка пула
        loadPool(function () {
            // если сейчас главная — показать
            try {
                var last = Lampa.Activity && Lampa.Activity.last ? Lampa.Activity.last() : null;
                if (isMain(last)) showHero();
            } catch (e) { showHero(); }
        });
        // слушаем переходы
        if (Lampa.Listener && Lampa.Listener.follow) {
            Lampa.Listener.follow('activity', onActivity);
            Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') onActivity({ type: 'ready', object: (Lampa.Activity.last && Lampa.Activity.last()) || {} }); });
        }
        // пауза авто-ротации когда вкладка не видна
        document.addEventListener('visibilitychange', function () { document.hidden ? stopTimer() : ($root && $root.hasClass('lh-on') ? startTimer() : 0); });
        log('started');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();