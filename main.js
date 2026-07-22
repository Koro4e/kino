(function () {
    'use strict';

    const ROOM_URL = 'https://wparty.net/s/j1vc7c5z7e3';

    function createButton(movieData) {
        const title = movieData.title || movieData.name || movieData.original_title || '';
        let year = '';

        if (movieData.release_date) {
            year = String(movieData.release_date).substring(0, 4);
        } else if (movieData.first_air_date) {
            year = String(movieData.first_air_date).substring(0, 4);
        }

        const searchQuery = `${title} ${year}`.trim();

        const button = $(`
            <div class="full-start__button selector wparty-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>WParty</span>
            </div>
        `);

        button.on('hover:enter click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Передаем параметр ?search= Название
            const targetUrl = `${ROOM_URL}?search=${encodeURIComponent(searchQuery)}`;
            window.open(targetUrl, '_blank');
        });

        return button;
    }

    function inject(movieData) {
        if (!movieData) return;
        const render = $('.full-start-new, .full-start, .activity').first();
        const container = render.find('.full-start__buttons, .full-start-new__buttons').first();

        if (container.length && !container.find('.wparty-btn').length) {
            container.append(createButton(movieData));
            if (window.Lampa && Lampa.Controller) Lampa.Controller.toggle('content');
        }
    }

    function getMovieData(active) {
        if (!active) return null;
        if (active.activity && active.activity.data && active.activity.data.movie) return active.activity.data.movie;
        if (active.activity && active.activity.card) return active.activity.card;
        if (active.card) return active.card;
        return null;
    }

    function start() {
        setTimeout(function () {
            if (window.Lampa && Lampa.Activity && Lampa.Activity.active) {
                const movie = getMovieData(Lampa.Activity.active());
                if (movie) inject(movie);
            }
        }, 300);

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                const movie = (e.data && e.data.movie) ? e.data.movie : e.card;
                setTimeout(function () { inject(movie); }, 200);
            }
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();