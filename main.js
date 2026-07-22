(function () {
    'use strict';

    const PLUGIN_NAME = 'WParty Redirect';
    const TARGET_URL = 'https://wparty.net/search';

    // Функция создания кнопки
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

        const button = $(`
            <div class="full-start__button selector wparty-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>WParty</span>
            </div>
        `);

        button.on('hover:enter', function () {
            window.open(searchUrl, '_blank');
        });

        return button;
    }

    // Внедрение кнопки
    function inject(activity, movieData) {
        if (!activity || !movieData) return;

        // Ищем контейнер с кнопками
        const render = activity.render ? activity.render() : $(activity);
        const container = render.find('.full-start__buttons');

        if (container.length && !container.find('.wparty-btn').length) {
            console.log('[WParty] Успешно вставили кнопку!');
            container.append(createButton(movieData));
        }
    }

    // Функция проверки текущей активности
    function checkCurrentActivity() {
        if (window.Lampa && Lampa.Activity && Lampa.Activity.active) {
            const active = Lampa.Activity.active();
            if (active && active.component === 'full' && active.activity) {
                const data = active.activity.data || (active.activity.card ? { movie: active.activity.card } : null);
                if (data && data.movie) {
                    inject(active.activity, data.movie);
                }
            }
        }
    }

    function start() {
        console.log('[WParty] Плагин запущен');

        // 1. Проверяем сразу (если карточка уже открыта)
        setTimeout(checkCurrentActivity, 300);

        // 2. Слушаем переходы на новые карточки
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' && e.data && e.data.movie) {
                setTimeout(function () {
                    inject(e.object.activity, e.data.movie);
                }, 100);
            }
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();