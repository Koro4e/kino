(function () {
    'use strict';

    const PLUGIN_NAME = 'WParty Redirect';
    const TARGET_URL = 'https://wparty.net/search'; // Ссылка на поиск WParty
    
    let dom_observer; // Следильщик за изменением DOM

    /**
     * Создает DOM-элемент кнопки WParty
     */
    function createButtonElement(e) {
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

        // HTML-структура кнопки в стиле Лампы
        const buttonHTML = `
            <div class="full-start__button selector wparty-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>WParty</span>
            </div>
        `;

        const button = $(buttonHTML);

        // Обработчик клика/нажатия с пульта
        button.on('hover:enter', function () {
            window.open(searchUrl, '_blank');
        });

        return button;
    }

    /**
     * Основная логика внедрения кнопки с ожиданием DOM
     */
    function injectButton(e) {
        // Отключаем старый следильщик, если он был
        if (dom_observer) dom_observer.disconnect();

        const activity_render = e.object.activity.render();

        // 1. Пытаемся найти контейнер сразу (вдруг он уже есть)
        const buttonsContainer = activity_render.find('.full-start__buttons');

        if (buttonsContainer.length && !buttonsContainer.find('.wparty-btn').length) {
            buttonsContainer.append(createButtonElement(e));
        } else {
            // 2. Если контейнера нет, запускаем следильщик (MutationObserver)
            dom_observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.addedNodes.length) {
                        const target = activity_render.find('.full-start__buttons');
                        // Как только нашли контейнер и там еще нет нашей кнопки
                        if (target.length && !target.find('.wparty-btn').length) {
                            target.append(createButtonElement(e));
                            dom_observer.disconnect(); // Нашли, вставили, отключаем слежку
                        }
                    }
                });
            });

            // Начинаем следить за всем деревом активити
            dom_observer.observe(activity_render[0], {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * Слушатели событий и старт плагина
     */
    function startPlugin() {
        // Срабатывает, когда данные фильма загружены, но DOM может быть не готов
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' && e.data && e.data.movie) {
                injectButton(e);
            }
        });
    }

    // Инициализация при готовности Лампы
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();