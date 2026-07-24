/* lampa-hero.js — hero-шапка на главной в стиле SILMON.
   Хостить НА СТАТИКЕ (gist / jsdelivr), НЕ на ngrok.
   Маяки в консоли: [LAMPA-HERO] script loaded / trending ok / hero built */
(function () {
    'use strict';
    if (window.lampaHeroReady) return;
    window.lampaHeroReady = true;
    console.log('[LAMPA-HERO] script loaded');

    var HERO_INDEX = 0; // ряд hero — самый верхний на главной

    // 1) CSS через Template.add (приём из SURS)
    function addStyles() {
        Lampa.Template.add('lampa_hero_style', `
        <style>
          /* растягиваем карточку hero на всю ширину ряда */
          .lampa-hero-card{width:100%!important;flex:0 0 100%!important;margin:0 0 1.4em!important}
          .lampa-hero-card .card__view{height:60vh;min-height:360px;padding-bottom:0!important;border-radius:18px;overflow:hidden;position:relative}
          .lampa-hero-card .card__title,.lampa-hero-card .card__age,.lampa-hero-card .card__img{display:none!important}
          .lh-hero{position:absolute;inset:0}
          .lh-hero__bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(3px) brightness(.5);transform:scale(1.06)}
          .lh-hero__grad{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,7,11,.96) 0%,rgba(7,7,11,.55) 48%,rgba(7,7,11,0) 100%)}
          .lh-hero__body{position:relative;z-index:2;max-width:48%;height:100%;padding:0 0 0 3.4%;display:flex;flex-direction:column;justify-content:center}
          .lh-hero__title{font-size:3.3vw;font-weight:800;line-height:1.05;margin:0 0 .35em;letter-spacing:.4px;color:#fff}
          .lh-hero__meta{display:flex;gap:12px;align-items:center;color:#cfd2da;font-size:1.05vw;margin-bottom:1em}
          .lh-hero__badge{background:#d4af37;color:#161006;font-weight:700;padding:2px 9px;border-radius:6px}
          .lh-hero__desc{color:#c9ccd6;font-size:1.12vw;line-height:1.5;max-height:5em;overflow:hidden;margin-bottom:1.3em}
          .lh-btn{border:0;border-radius:10px;padding:.7em 1.6em;font-size:1.15vw;font-weight:700;cursor:pointer;margin-right:10px}
          .lh-btn--play{background:#d4af37;color:#161006}
          .lh-btn--ghost{background:rgba(255,255,255,.14);color:#fff}
          @media screen and (max-width:767px){
            .lh-hero__body{max-width:80%;padding:0 0 0 5%}
            .lh-hero__title{font-size:7vw}.lh-hero__desc{font-size:3.4vw}.lh-btn{font-size:3.6vw}
          }
        </style>`);
        $('body').append(Lampa.Template.get('lampa_hero_style', {}, true));
    }

    // 2) hero-ряд: ОДНА широкая карточка, данные через прокси TMDB (как SURS)
    function addHeroRow(parts) {
        parts.unshift(function (callback) {
            var empty = function () { callback({ results: [], title: '', params: { items: { view: 1, mapping: 'line' } } }); };
            var url = Lampa.TMDB.api('trending/all/week?api_key=' + Lampa.TMDB.key() + '&language=ru');
            Lampa.Network.silent(url, function (data) {
                var item = (data && data.results && data.results[0]) || null;
                if (!item) { console.log('[LAMPA-HERO] trending empty'); return empty(); }
                console.log('[LAMPA-HERO] trending ok:', item.title || item.name);

                var cardData = {
                    source: 'custom', title: 'hero', name: 'hero', id: 'lampa_hero',
                    params: {
                        createInstance: function () {
                            return Lampa.Maker.make('Card', this, function (m) { return m.only('Card', 'Callback'); });
                        },
                        emit: {
                            onCreate: function () {
                                this.html.addClass('lampa-hero-card');
                                var bg = item.backdrop_path ? Lampa.TMDB.image('t/p/original' + item.backdrop_path) : '';
                                var rating = item.vote_average ? item.vote_average.toFixed(1) : '—';
                                var year = (item.release_date || item.first_air_date || '').slice(0, 4);
                                var heroHtml =
                                    '<div class="lh-hero">' +
                                      '<div class="lh-hero__bg" style="background-image:url(' + bg + ')"></div>' +
                                      '<div class="lh-hero__grad"></div>' +
                                      '<div class="lh-hero__body">' +
                                        '<h1 class="lh-hero__title">' + (item.title || item.name) + '</h1>' +
                                        '<div class="lh-hero__meta"><span class="lh-hero__badge">★ ' + rating + '</span><span>' + year + '</span></div>' +
                                        '<div class="lh-hero__desc">' + (item.overview || '') + '</div>' +
                                        '<div><button class="lh-btn lh-btn--play">▶ Смотреть</button><button class="lh-btn lh-btn--ghost">Карточка</button></div>' +
                                      '</div>' +
                                    '</div>';
                                this.html.find('.card__view').html(heroHtml);
                                console.log('[LAMPA-HERO] hero built');
                            },
                            onlyEnter: function () { if (Lampa.Card && Lampa.Card.open) Lampa.Card.open(item); }
                        }
                    }
                };
                callback({ results: [cardData], title: '', params: { items: { view: 1, mapping: 'line' } } });
            }, function () { console.log('[LAMPA-HERO] trending error'); empty(); }, false, { cache: { life: 30 } });
        });
    }

    // 3) старт (приём из SURS)
    function startPlugin() {
        addStyles();
        Lampa.ContentRows.add({
            index: HERO_INDEX, name: 'lampa_hero', title: '', screen: ['main'],
            call: function () {
                var p = []; addHeroRow(p);
                return function (cb) { if (p.length) p[0](cb); };
            }
        });
        console.log('[LAMPA-HERO] row registered at index', HERO_INDEX);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();