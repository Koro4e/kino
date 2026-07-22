(function () {
    'use strict';

    const PLUGIN_NAME = 'WParty Redirect';
    const TARGET_URL = 'https://wparty.net/search'; // Твоя ссылка на поиск

    function startPlugin() {
        // 1. Создаем компонент источника для бокового меню Лампы
        Lampa.Component.add('wparty', function (object) {
            let comp = this;

            this.create = function () {
                const title = object.movie.title || object.movie.name || object.movie.original_title || '';
                let year = '';

                if (object.movie.release_date) {
                    year = String(object.movie.release_date).substring(0, 4);
                } else if (object.movie.first_air_date) {
                    year = String(object.movie.first_air_date).substring(0, 4);
                }

                const query = `${title} ${year}`.trim();
                const searchUrl = `${TARGET_URL}?q=${encodeURIComponent(query)}`;

                // Сразу открываем ссылку во внешней вкладке при выборе
                window.open(searchUrl, '_blank');

                // Возвращаем пустой элемент, чтобы Лампа не выдавала ошибку рендера
                return $('<div></div>');
            };

            this.start = function () {};
            this.destroy = function () {};
        });

        // 2. Регистрируем WParty в глобальном списке онлайн-балансеров Лампы
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                // Регистрируем источник в системе
                if (window.lampa_settings) {
                    Lampa.Params.select('wparty_use', {
                        'true': 'Включено',
                        'false': 'Выключено'
                    }, 'true');
                }

                // Добавляем пункт WParty в реестр источников онлайн-просмотра
                if (Lampa.Online) {
                    Lampa.Online.add({
                        name: 'WParty',
                        component: 'wparty',
                        memo: 'Переход на WParty'
                    });
                }
            }
        });
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();