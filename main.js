(function () {
    'use strict';

    const PLUGIN_NAME = 'WParty Redirect';
    const TARGET_URL = 'https://wparty.net/search'; // Ссылка на поиск WParty

    /**
     * Функция вставки кнопки в карточку фильма/сериала
     */
    function injectButton(e) {
        // Небольшая задержка, чтобы Лампа успела сгенерировать свой DOM
        setTimeout(function () {
            const render = e.object.activity.render();
            const buttonsContainer = render.find('.full-start__buttons');

            // Проверяем, существует ли контейнер и нет ли уже нашей кнопки
            if (buttonsContainer.length && !buttonsContainer.find('.wparty-btn').length) {
                
                // Создаем кнопку в стиле Lampa
                const button = $(`
                    <div class="full-start__button selector wparty-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span>WParty</span>
                    </div>
                `);

                // Нажатие (работает с пультов, мыши и тачскринов)
                button.on('hover:enter', function () {
                    const movie = e.data.movie;
                    const title = movie.title || movie.name || movie.original_title || '';
                    let year = '';

                    if (movie.release_date) {
                        year = String(movie.release_date).substring(0, 4);
                    } else if (movie.first_air_date) {
                        year = String(movie.first_air_date).substring(0, 4);
                    }

                    const query = `${title} ${year}`.trim();
                    const searchUrl = `${TARGET_URL}?q=${encodeURIComponent(query)}`;

                    window.open(searchUrl, '_blank');
                });

                // Добавляем кнопку в блок
                buttonsContainer.append(button);
            }
        }, 200);
    }

    /**
     * Старт плагина и слушатели событий
     */
    function startPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' && e.data && e.data.movie) {
                injectButton(e);
            }
        });
    }

    // Инициализация при готовности приложения
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();