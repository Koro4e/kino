// lampa-redesign.js  →  подключить: https://твой-ngrok/lampa-redesign.js
(function () {
    'use strict';

    var IMG = 'https://image.tmdb.org/t/p/';
    var TMDB_KEY = '4ef0d7355d9ffb5151e987764708ce96'; // публичный демо-ключ; можно заменить на свой

    // 1) Премиум-CSS (инжектим вручную — не зависит от версии Lampa)
    var style = document.createElement('style');
    style.textContent = [
        '.rd-hero{position:relative;height:60vh;min-height:360px;border-radius:20px;overflow:hidden;margin:0 0 26px}',
        '.rd-hero__bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(3px) brightness(.5);transform:scale(1.06)}',
        '.rd-hero__grad{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,7,11,.96) 0%,rgba(7,7,11,.5) 50%,rgba(7,7,11,0) 100%)}',
        '.rd-hero__body{position:relative;z-index:2;max-width:48%;height:100%;padding:0 0 0 3.5%;display:flex;flex-direction:column;justify-content:center}',
        '.rd-hero__title{font-size:3.3vw;font-weight:800;line-height:1.05;margin:0 0 .35em;letter-spacing:.4px}',
        '.rd-hero__meta{display:flex;gap:12px;align-items:center;color:#cfd2da;font-size:1.05vw;margin-bottom:1em}',
        '.rd-hero__badge{background:#d4af37;color:#161006;font-weight:700;padding:2px 9px;border-radius:6px}',
        '.rd-hero__desc{color:#c9ccd6;font-size:1.12vw;line-height:1.5;max-height:5em;overflow:hidden;margin-bottom:1.3em}',
        '.rd-btn{border:0;border-radius:10px;padding:.7em 1.6em;font-size:1.15vw;font-weight:700;cursor:pointer;margin-right:10px}',
        '.rd-btn--play{background:#d4af37;color:#161006}',
        '.rd-btn--ghost{background:rgba(255,255,255,.12);color:#fff}',
        // прячем штатный первый заголовок/строку, чтобы hero был «первым экраном» (селекторы подкрутим под твою версию)
        '.rd-applied .category-full:first-of-type{display:none}'
    ].join('');
    document.head.appendChild(style);

    var applied = false;

    // 2) Строим hero-узел из данных TMDB
    function heroNode(item) {
        var bg = IMG + 'original' + item.backdrop_path;
        var rating = item.vote_average ? item.vote_average.toFixed(1) : '—';
        var year = (item.release_date || item.first_air_date || '').slice(0, 4);
        var $h = $([
            '<div class="rd-hero">',
              '<div class="rd-hero__bg" style="background-image:url(' + bg + ')"></div>',
              '<div class="rd-hero__grad"></div>',
              '<div class="rd-hero__body">',
                '<h1 class="rd-hero__title">' + (item.title || item.name) + '</h1>',
                '<div class="rd-hero__meta"><span class="rd-hero__badge">★ ' + rating + '</span><span>' + year + '</span></div>',
                '<div class="rd-hero__desc">' + (item.overview || '') + '</div>',
                '<div><button class="rd-btn rd-btn--play">▶ Смотреть</button><button class="rd-btn rd-btn--ghost">Карточка</button></div>',
              '</div>',
            '</div>'
        ].join(''));
        $h.find('.rd-btn--play, .rd-btn--ghost').on('click', function () {
            if (Lampa.Card && Lampa.Card.open) Lampa.Card.open(item); // откроем штатную карточку (там твой Lampac «Онлайн»)
        });
        return $h;
    }

    // 3) Патчим главную: ждём контент, вставляем hero сверху
    function tryPatch() {
        if (applied) return;
        var $content = $('.content');           // корень страницы Lampa (селектор подкрутим под твою версию)
        if (!$content.length) return;
        applied = true;
        $content.addClass('rd-applied');

        fetch('https://api.themoviedb.org/3/trending/all/week?language=ru-RU&api_key=' + TMDB_KEY)
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var item = (d.results || [])[0];
                if (!item) return;
                $content.prepend(heroNode(item)); // hero становится первым экраном
            })
            .catch(function () { applied = false; }); // не удалось — дадим шанс перепатчить
    }

    // 4) Ловим момент рендера главной (работает на любой версии Lampa)
    if (window.MutationObserver) {
        var mo = new MutationObserver(function () { tryPatch(); });
        mo.observe(document.body, { childList: true, subtree: true });
    }
    // подстраховка — события Lampa, если доступны
    if (Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') tryPatch(); });
    }
    setTimeout(tryPatch, 800);
})();