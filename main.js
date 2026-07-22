(function () {
    'use strict';

    const PLUGIN_NAME = 'WParty Redirect';
    const TARGET_URL = 'https://wparty.net/search';

    // Создание родной кнопки Lampa
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

        // Используем строго стандартные классы Лампы
        const button = $(`
            <div class="full-start__button selector wparty-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>WParty</span>
            </div>
        `);

        // Клик мышкой или событие Выбрать на пульте (hover:enter)
        button.on('hover:enter click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.open(searchUrl, '_blank');
        });

        return button;
    }

    // Внедрение в блок кнопок
    function inject(movieData) {
        if (!movieData) return;

        // Находим блок с круглыми кнопками действий
        const render = $('.full-start-new, .full-start, .activity').first();
        const container = render.find('.full-start__buttons, .full-start-new__buttons').first();

        if (container.length && !container.find('.wparty-btn').length) {
            console.log('[WParty] Кнопка успешно добавлена');
            container.append(createButton(movieData));
            
            // Регистрируем новую кнопку в системе навигации пультом/клавиатурой
            if (window.Lampa && Lampa.Controller) {
                Lampa.Controller.toggle('content');
            }
        }
    }

    // Вспомогательная функция получения данных о фильме
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

        // Проверка если карточка уже открыта
        setTimeout(function () {
            if (window.Lampa && Lampa.Activity && Lampa.Activity.active) {
                const active = Lampa.Activity.active();
                const movie = getMovieData(active);
                if (movie) inject(movie);
            }
        }, 300);

        // Слушаем переходы
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