(function () {
    'use strict';

    const PLUGIN_NAME = 'WParty Redirect';
    const TARGET_URL = 'https://wparty.net/search';

    // Создание кнопки
    function createButton(movieData) {
        const title = movieData.title || movieData.name || movieData.original_title || '';
        let year = '';

        if (movieData.release_date) {
            year = String(movieData.release_date).substring(0, 4);
        } else if (movieData.first_air_date) {
            year = String(movieData.first_air_date).substring(0, 4);
        }

        const query = `${title} ${year}`.trim();
        const searchUrl = `${TARGET_URL}?q=${encodeURIComponent(query)}`;

        // Создаём элемент кнопки
        const button = $(`
            <div class="full-start__button selector wparty-btn" tabindex="0" style="background: rgba(255,255,255,0.1); border-radius: 0.5em; display: inline-flex; align-items: center; justify-content: center; padding: 0.8em 1.2em; margin-right: 0.5em; cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="margin-right: 0.4em;">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>WParty</span>
            </div>
        `);

        // Клик мышкой или выбор с пульта
        button.on('hover:enter click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.open(searchUrl, '_blank');
        });

        return button;
    }

    // Внедрение в DOM
    function inject(movieData) {
        if (!movieData) return;

        // Поиск любого подходящего контейнера для кнопок в открытой карточке
        const container = $('.full-start__buttons, .full-start-new__buttons, .full-start__rate, .full-start').first();

        if (container.length && !$('.wparty-btn').length) {
            console.log('[WParty] Успешно вставили кнопку!');
            container.append(createButton(movieData));
            
            // Переинициализируем навигацию пультом, если она есть
            if (window.Lampa && Lampa.Controller) {
                Lampa.Controller.toggle('content');
            }
        } else {
            console.log('[WParty] Контейнер не найден или кнопка уже есть. Найдено контейнеров:', container.length);
        }
    }

    // Извлечение данных фильма
    function getMovieData(active) {
        if (!active) return null;
        if (active.activity && active.activity.data && active.activity.data.movie) {
            return active.activity.data.movie;
        }
        if (active.activity && active.activity.card) {
            return active.activity.card;
        }
        if (active.card) {
            return active.card;
        }
        return null;
    }

    function start() {
        console.log('[WParty] Плагин запущен');

        // 1. Если карточка уже открыта
        setTimeout(function () {
            if (window.Lampa && Lampa.Activity && Lampa.Activity.active) {
                const active = Lampa.Activity.active();
                const movie = getMovieData(active);
                if (movie) inject(movie);
            }
        }, 300);

        // 2. Слушаем переходы
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                const movie = (e.data && e.data.movie) ? e.data.movie : e.card;
                setTimeout(function () {
                    inject(movie);
                }, 200);
            }
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();