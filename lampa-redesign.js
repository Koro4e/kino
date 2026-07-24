/* =====================================================================
   LAMPA HERO v3 — премиум hero-шапка в стиле SILMON CINEMA
   Хостить НА СТАТИКЕ (gist raw / jsdelivr). НЕ на ngrok.
   v3: hero виден ПО УМОЛЧАНИЮ; распорка — прямой DOM-патч в .content;
       activity используется ТОЛЬКО для скрытия на не-главных страницах.
   ===================================================================== */
(function () {
    'use strict';
    if (window.__LAMPA_HERO_V3__) return;
    window.__LAMPA_HERO_V3__ = true;

    /* ---------- [1] CONFIG ---------- */
    var CFG = {
        HERO_VH: 82,          // высота hero и распорки
        SLIDES: 6,            // фильмов в карусели
        ROTATE_MS: 8000,      // авто-смена слайда
        Z_HERO: 4,            // z hero (под штатными оверлеями Lampa)
        Z_SIDE: 4,            // z левой колонки иконок
        TMDB_KEY: '4ef0d7355d9ffb5151e987764708ce96'
    };

    /* ---------- [2] GENRES ---------- */
    var GENRES = {28:'Боевик',12:'Приключения',16:'Анимация',35:'Комедия',80:'Криминал',
        99:'Документальный',18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',27:'Ужасы',
        10402:'Музыка',9648:'Детектив',10749:'Мелодрама',878:'Фантастика',10770:'ТВ-фильм',
        53:'Триллер',10752:'Военный',37:'Вестерн',10759:'Боевик и Приключения',10762:'Детский',
        10765:'Фантастика и Фэнтези',10768:'Война и Политика'};
    function genreNames(ids){return (ids||[]).map(function(i){return GENRES[i];}).filter(Boolean).slice(0,2);}

    /* ---------- [3] UTILS ---------- */
    function log(){try{console.log.apply(console,['[HERO3]'].concat([].slice.call(arguments)));}catch(e){}}
    function toast(t){try{Lampa.Noty&&Lampa.Noty.show(t);}catch(e){}}
    function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
    function imgUrl(path,w){try{return path?Lampa.TMDB.image('t/p/'+(w||'original')+path):'';}catch(e){return path?('https://image.tmdb.org/t/p/'+(w||'original')+path):'';}}
    function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
    function isMain(o){if(!o)return false;if(o.component==='main'||o.component==='category_main')return true;return /главная|головна|\bmain\b/i.test(o.title||'');}

    /* ---------- [4] CSS ---------- */
    function addStyles(){
        var css = [
        /* распорка в потоке главной */
        '.lh-spacer{width:100%;height:'+CFG.HERO_VH+'vh;flex:0 0 auto;pointer-events:none}',
        /* fixed hero */
        '.lh-root{position:fixed;top:0;left:0;right:0;height:'+CFG.HERO_VH+'vh;z-index:'+CFG.Z_HERO+';overflow:hidden;opacity:0;visibility:hidden;transition:opacity .5s ease}',
        '.lh-root.lh-on{opacity:1;visibility:visible}',
        '.lh-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s ease;will-change:opacity,transform}',
        '.lh-bg.lh-act{opacity:1;animation:lhKen 14s ease-in-out infinite alternate}',
        '@keyframes lhKen{from{transform:scale(1.03)}to{transform:scale(1.13)}}',
        '.lh-grad{position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,8,11,.98) 0%,rgba(8,8,11,.78) 34%,rgba(8,8,11,.25) 66%,rgba(8,8,11,0) 100%)}',
        '.lh-gradb{position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,8,11,.96) 0%,rgba(8,8,11,0) 30%)}',
        /* левый текст */
        '.lh-body{position:absolute;z-index:3;left:7.5%;top:0;bottom:0;width:46%;display:flex;flex-direction:column;justify-content:center}',
        '.lh-anim>*{animation:lhUp .7s cubic-bezier(.2,.7,.2,1) both}',
        '.lh-anim>*:nth-child(2){animation-delay:.06s}.lh-anim>*:nth-child(3){animation-delay:.12s}.lh-anim>*:nth-child(4){animation-delay:.18s}',
        '@keyframes lhUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}',
        '.lh-title{font-size:4.4vw;font-weight:600;line-height:1.0;letter-spacing:.18em;text-transform:uppercase;margin:0 0 .25em;color:#fff;text-shadow:0 2px 30px rgba(0,0,0,.6)}',
        '.lh-sub{font-size:1.3vw;font-weight:400;letter-spacing:.5em;text-transform:uppercase;color:#cfd2da;margin:0 0 1.1em;opacity:.85}',
        '.lh-meta{display:flex;gap:14px;align-items:center;color:#c7cad6;font-size:1.02vw;margin-bottom:1em;flex-wrap:wrap}',
        '.lh-pill{background:#c9a24b;color:#161006;font-weight:800;padding:3px 10px;border-radius:6px;font-size:.95vw;letter-spacing:.02em}',
        '.lh-dot{width:4px;height:4px;border-radius:50%;background:#6f7384;display:inline-block}',
        '.lh-desc{color:#c2c5d2;font-size:1.08vw;line-height:1.6;max-height:4.8em;overflow:hidden;margin-bottom:1.5em;max-width:90%;text-shadow:0 1px 12px rgba(0,0,0,.5)}',
        '.lh-btns{display:flex;gap:12px;flex-wrap:wrap}',
        '.lh-btn{border:0;border-radius:10px;padding:.72em 1.5em;font-size:1.08vw;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:.55em;transition:transform .15s ease,box-shadow .2s ease,background .2s ease}',
        '.lh-btn--play{background:linear-gradient(180deg,#d8b25a,#c9a24b);color:#161006;box-shadow:0 8px 26px rgba(201,162,75,.35)}',
        '.lh-btn--play:hover,.lh-btn--play.focus{transform:translateY(-2px) scale(1.03);box-shadow:0 12px 34px rgba(201,162,75,.5)}',
        '.lh-btn--ghost{background:rgba(255,255,255,.10);color:#fff;border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(6px)}',
        '.lh-btn--ghost:hover,.lh-btn--ghost.focus{background:rgba(255,255,255,.20);transform:translateY(-2px)}',
        /* правая стеклянная панель */
        '.lh-panel{position:absolute;z-index:3;right:3.2%;top:50%;transform:translateY(-50%);width:19vw;min-width:230px;background:rgba(18,18,24,.40);border:1px solid rgba(255,255,255,.12);border-radius:16px;backdrop-filter:blur(18px);padding:1.2em 1.4em;box-shadow:0 20px 60px rgba(0,0,0,.5)}',
        '.lh-panel__row{display:flex;justify-content:space-between;align-items:center;padding:.55em 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:1.0vw}',
        '.lh-panel__row:last-child{border-bottom:0}',
        '.lh-panel__k{color:#9aa0b0}.lh-panel__v{color:#fff;font-weight:700;text-align:right;max-width:62%}',
        '.lh-panel__v--gold{color:#d8b25a}',
        /* точки-карусель */
        '.lh-dots{position:absolute;z-index:4;left:50%;transform:translateX(-50%);bottom:4.5%;display:flex;gap:9px;align-items:center}',
        '.lh-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.32);transition:all .35s ease;cursor:pointer}',
        '.lh-dots i.on{width:26px;border-radius:5px;background:#c9a24b}',
        /* левая колонка иконок (декор + мышь) */
        '.lh-side{position:fixed;left:0;top:0;bottom:0;width:64px;z-index:'+CFG.Z_SIDE+';display:none;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:linear-gradient(90deg,rgba(8,8,11,.55),rgba(8,8,11,0));pointer-events:none}',
        '.lh-side.lh-on{display:flex}',
        '.lh-side a{pointer-events:auto;width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:12px;color:#cfd2da;cursor:pointer;transition:all .2s ease;opacity:.8}',
        '.lh-side a:hover,.lh-side a.act{background:rgba(201,162,75,.16);color:#d8b25a;opacity:1}',
        '.lh-side a svg{width:22px;height:22px;fill:currentColor}',
        /* мобила */
        '@media screen and (max-width:767px){',
        ' .lh-body{left:6%;width:84%}.lh-title{font-size:9vw;letter-spacing:.1em}.lh-sub{font-size:3.4vw;letter-spacing:.3em}.lh-desc{font-size:3.4vw}.lh-btn{font-size:3.6vw}.lh-meta{font-size:3.1vw}',
        ' .lh-panel{display:none}.lh-side{display:none!important}',
        '}'
        ].join('');
        try{Lampa.Template.add('lh_v3_css','<style>'+css+'</style>');$('body').append(Lampa.Template.get('lh_v3_css',{},true));}
        catch(e){var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);}
    }

    /* ---------- [5] DATA ---------- */
    var POOL=[],SLIDES=[];
    function loadPool(cb){
        function done(list){POOL=(list||[]).filter(function(x){return x&&x.backdrop_path;});log('pool',POOL.length);cb&&cb();}
        try{
            var url=Lampa.TMDB.api('trending/all/week?api_key='+Lampa.TMDB.key()+'&language=ru');
            Lampa.Network.silent(url,function(d){done(d&&d.results);},function(){fallback();},false,{cache:{life:60}});
        }catch(e){fallback();}
        function fallback(){
            try{fetch('https://api.themoviedb.org/3/trending/all/week?language=ru&api_key='+CFG.TMDB_KEY)
                .then(function(r){return r.json();}).then(function(d){done(d&&d.results);}).catch(function(){done([]);});}
            catch(e){done([]);}
        }
    }
    function pickSlides(){SLIDES=shuffle(POOL).slice(0,Math.min(CFG.SLIDES,POOL.length));}

    /* ---------- [6] ROOT + SIDE ---------- */
    var $root,$bgA,$bgB,$body,$panel,$dots,$side,bgT=false,onMain=true;
    var ICON={
        home:'<svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-4v-6h-4v6H6v-9H3z"/></svg>',
        film:'<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z M6 6v2h2V6z M6 10v2h2v-2z M6 14v2h2v-2z M16 6v2h2V6z M16 10v2h2v-2z M16 14v2h2v-2z M10 8h4v8h-4z"/></svg>',
        tv:'<svg viewBox="0 0 24 24"><path d="M3 5h18v12H3z M9 21h6 M12 17v4"/></svg>',
        book:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-3-6 3z"/></svg>',
        gear:'<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 100 8 4 4 0 000-8z M19 12l2-1-2-3-2 1-2-1V6h-4v2l-2 1-2-1-2 3 2 1v2l-2 1 2 3 2-1 2 1v2h4v-2l2-1 2 1 2-3-2-1z"/></svg>'
    };
    function buildRoot(){
        if($root)return;
        $root=$('<div class="lh-root"><div class="lh-bg a"></div><div class="lh-bg b"></div><div class="lh-grad"></div><div class="lh-gradb"></div><div class="lh-body"></div><div class="lh-panel"></div><div class="lh-dots"></div></div>');
        $bgA=$root.find('.a');$bgB=$root.find('.b');$body=$root.find('.lh-body');$panel=$root.find('.lh-panel');$dots=$root.find('.lh-dots');
        $('body').append($root);
        $side=$('<div class="lh-side">'+
            '<a data-go="main" title="Главная">'+ICON.home+'</a>'+
            '<a data-go="movies" title="Фильмы">'+ICON.film+'</a>'+
            '<a data-go="tv" title="Сериалы">'+ICON.tv+'</a>'+
            '<a data-go="book" title="Закладки">'+ICON.book+'</a>'+
            '<a data-go="set" title="Настройки">'+ICON.gear+'</a>'+
          '</div>');
        $('body').append($side);
        $side.find('a').on('click',function(){sideGo($(this).attr('data-go'));});
        log('root+side built');
    }
    function sideGo(k){
        try{
            if(k==='set'){Lampa.Controller.toggle('settings');return;}
            var map={
                main:{component:'main',title:'Главная',source:Lampa.Storage.get('source','tmdb'),page:1},
                movies:{component:'category',title:'Фильмы',url:'discover/movie?sort_by=popularity.desc',source:'tmdb',card_type:'movie',page:1},
                tv:{component:'category',title:'Сериалы',url:'discover/tv?sort_by=popularity.desc',source:'tmdb',card_type:'tv',page:1},
                book:{component:'bookmarks',title:'Закладки',url:'',page:1}
            };
            if(map[k])Lampa.Activity.push(map[k]);
        }catch(e){log('side err',e);}
    }

    /* ---------- [7] SPACER (прямой DOM-патч) ---------- */
    function ensureSpacer(show){
        try{
            var $c=$('.content');
            if(!$c.length)return;
            var has=$c.children('.lh-spacer').length>0;
            if(show&&!has){$c.prepend($('<div class="lh-spacer"></div>'));}
            else if(!show&&has){$c.children('.lh-spacer').remove();}
        }catch(e){}
    }

    /* ---------- [8] RENDER SLIDE ---------- */
    var cur=0,timer=null;
    function renderSlide(i){
        var it=SLIDES[i];if(!it)return;
        var on=bgT?$bgA:$bgB,off=bgT?$bgB:$bgA;
        on.css('background-image','url('+imgUrl(it.backdrop_path)+')');
        void on[0].offsetWidth;on.addClass('lh-act');off.removeClass('lh-act');bgT=!bgT;
        var rating=it.vote_average?it.vote_average.toFixed(1):'—';
        var year=(it.release_date||it.first_air_date||'').slice(0,4);
        var liked=it.vote_average?Math.round(it.vote_average*10)+'%':'—';
        var g=genreNames(it.genre_ids);
        var type=it.media_type==='tv'?'Сериал':'Фильм';
        $body.removeClass('lh-anim');
        $body.html(
            '<h1 class="lh-title">'+esc(it.title||it.name)+'</h1>'+
            (it.original_title&&it.original_title!==it.title?'<div class="lh-sub">'+esc(it.original_title)+'</div>':'<div class="lh-sub">'+esc(type)+'</div>')+
            '<div class="lh-meta"><span class="lh-pill">TMDB '+rating+'</span>'+(year?'<span>'+year+'</span><span class="lh-dot"></span>':'')+
              '<span>'+esc(g.join(', ')||type)+'</span></div>'+
            '<div class="lh-desc">'+esc(it.overview||'')+'</div>'+
            '<div class="lh-btns"><button class="lh-btn lh-btn--play" data-a="play">▶ Смотреть</button>'+
              '<button class="lh-btn lh-btn--ghost" data-a="trailer">▷ Трейлер</button>'+
              '<button class="lh-btn lh-btn--ghost" data-a="list">＋ В список</button></div>'
        );
        void $body[0].offsetWidth;$body.addClass('lh-anim');
        $panel.html(
            prow('Рейтинг TMDB','<span class="lh-panel__v lh-panel__v--gold">'+rating+'</span>')+
            prow('Год',year||'—')+
            prow('Жанры',esc(g.join(', ')||'—'))+
            prow('Понравилось',liked)+
            prow('Тип',type)
        );
        $dots.html('');
        SLIDES.forEach(function(_,k){var d=$('<i></i>').toggleClass('on',k===i);d.on('click',function(){go(k,true);});$dots.append(d);});
        $body.find('[data-a="play"]').on('click',function(){actPlay(it);});
        $body.find('[data-a="trailer"]').on('click',function(){actTrailer(it);});
        $body.find('[data-a="list"]').on('click',function(){actList(it);});
    }
    function prow(k,v){return '<div class="lh-panel__row"><span class="lh-panel__k">'+k+'</span><span class="lh-panel__v">'+v+'</span></div>';}
    function go(i,user){if(!SLIDES.length)return;cur=(i+SLIDES.length)%SLIDES.length;renderSlide(cur);if(user)restart();}
    function startT(){stopT();timer=setInterval(function(){go(cur+1,false);},CFG.ROTATE_MS);}
    function stopT(){if(timer){clearInterval(timer);timer=null;}}
    function restart(){startT();}

    /* ---------- [9] ACTIONS ---------- */
    function actPlay(it){try{if(Lampa.Card&&Lampa.Card.open){Lampa.Card.open(it);return;}Lampa.Activity.push({url:'card',title:it.title||it.name,card:it});}catch(e){toast('Не удалось открыть');}}
    function actList(it){try{if(Lampa.Favorite&&Lampa.Favorite.add){Lampa.Favorite.add('bookmarks',it,100);toast('Добавлено в закладки');return;}toast('Закладки недоступны');}catch(e){toast('Не удалось добавить');}}
    function actTrailer(it){
        try{
            var type=it.media_type==='tv'?'tv':'movie';
            toast('Ищу трейлер…');
            var u=Lampa.TMDB.api(type+'/'+it.id+'/videos?api_key='+Lampa.TMDB.key()+'&language=ru');
            Lampa.Network.silent(u,function(d){
                var v=(d&&d.results)||[];
                var key=(v.filter(function(x){return x.site==='YouTube'&&x.type==='Trailer';})[0]||v.filter(function(x){return x.site==='YouTube';})[0]||{}).key;
                if(key){try{if(Lampa.YouTube&&Lampa.YouTube.open){Lampa.YouTube.open(key);}else{window.open('https://www.youtube.com/watch?v='+key,'_blank');}}catch(e){}toast('Трейлер: '+(it.title||it.name));}
                else toast('Трейлер не найден');
            },function(){toast('Трейлер недоступен');},false,{cache:{life:60}});
        }catch(e){toast('Трейлер недоступен');}
    }

    /* ---------- [10] VISIBILITY ---------- */
    function sync(){
        buildRoot();
        $root.toggleClass('lh-on',onMain);
        $side.toggleClass('lh-on',onMain);
        $side.find('a').removeClass('act');if(onMain)$side.find('[data-go="main"]').addClass('act');
        ensureSpacer(onMain);
        if(onMain){if(!SLIDES.length&&POOL.length){pickSlides();cur=0;renderSlide(0);}startT();}
        else stopT();
    }
    function onActivity(e){
        try{
            var o=e.object||e.data||{};
            if(e.type==='push'||e.type==='replace'||e.type==='ready'||e.type==='back'){
                onMain=isMain(o);sync();
            }
        }catch(err){log('act err',err);}
    }

    /* ---------- [11] START ---------- */
    function start(){
        addStyles();buildRoot();
        // дефолт: главная → показать сразу (закрывает стартовую дыру v2)
        try{var l=Lampa.Activity&&Lampa.Activity.last&&Lampa.Activity.last();if(l&&!isMain(l))onMain=false;}catch(e){}
        sync();
        loadPool(function(){if(onMain){pickSlides();cur=0;renderSlide(0);startT();}});
        if(Lampa.Listener&&Lampa.Listener.follow){
            Lampa.Listener.follow('activity',onActivity);
            Lampa.Listener.follow('app',function(e){if(e.type==='ready'){onMain=true;sync();}});
        }
        // подстраховка: если Lampa перерисовал .content и распорка пропала на главной — вернуть
        if(window.MutationObserver){var mo=new MutationObserver(function(){if(onMain)ensureSpacer(true);});mo.observe(document.body,{childList:true,subtree:true});}
        document.addEventListener('visibilitychange',function(){if(document.hidden)stopT();else if(onMain)startT();});
        log('started, onMain=',onMain);
    }

    if(window.appready)start();
    else Lampa.Listener.follow('app',function(e){if(e.type==='ready')start();});
})();