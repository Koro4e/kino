(function () {
    'use strict';

    // Конфигурация плагина
    const PLUGIN_NAME = 'WParty Redirect';
    const TARGET_URL = 'https://wparty.net/search'; // Замени на актуальный URL поиска WParty или балансера
    
    /**
     * Основная функция создания и внедрения кнопки
     */
    function injectButton(movieData, renderContainer) {
        // Проверка, чтобы не дублировать кнопку при повторных событиях
        if (renderContainer.find('.wparty-redirect-btn').length > 0) return;

        // Безопасное извлечение данных
        const title = movieData.title || movieData.name || '';
        let year = '';
        
        if (movieData.release_date) {
            year = String(movieData.release_date).substring(0, 4);
        } else if (movieData.first_air_date) {
            year = String(movieData.first_air_date).substring(0, 4);
        }

        // Формирование поискового запроса
        const query = `${title} ${year}`.trim();
        const searchUrl = `${TARGET_URL}?q=${encodeURIComponent(query)}`;

        // Создание DOM-элемента кнопки
        const button = $(`
            <div class="full-start__button selector wparty-redirect-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Смотреть в WParty</span>
            </div>
        `);

        // Обработчик нажатия (стандартный для пультов и мыши в Lampa)
        button.on('hover:enter', function () {
            window.open(searchUrl, '_blank');
        });

        // Вставка кнопки в контейнер кнопок карточки
        renderContainer.append(button);
    }

    /**
     * Слушатель события полной загрузки карточки фильма/сериала
     */
    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite' && e.data && e.data.movie) {
            // Ищем стандартный контейнер кнопок в активити
            const buttonsContainer = e.object.activity.render().find('.full-start__buttons');
            
            // Если контейнер найден, внедряем кнопку
            if (buttonsContainer.length > 0) {
                injectButton(e.data.movie, buttonsContainer);
            }
        }
    });

    /**
     * Инициализация плагина с проверкой готовности приложения
     */
    function init() {
        console.log(`[Lampa] Плагин "${PLUGIN_NAME}" успешно загружен.`);
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                init();
            }
        });
    }

})();