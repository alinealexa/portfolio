/* ============================================================
   _aa.creativestudio — comportamento
   Sem dependências. Tudo degrada para HTML estático funcional.
   ============================================================ */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- NAV: ganha fundo ao sair do topo ---------- */
  var nav = document.querySelector('[data-nav]');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- MENU MOBILE ---------- */
  var menu = document.querySelector('[data-menu]');
  var toggles = document.querySelectorAll('[data-menu-toggle]');
  if (menu && toggles.length) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
      toggles.forEach(function (t) { t.setAttribute('aria-expanded', String(open)); });
      var label = menu.querySelector('[data-menu-label]');
      if (label) label.textContent = open ? 'Fechar' : 'Menu';
    };
    toggles.forEach(function (t) {
      t.addEventListener('click', function () {
        setMenu(!menu.classList.contains('is-open'));
      });
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------- REVELAÇÃO NO SCROLL ----------
     Um observer para a página inteira. Elementos com [data-reveal]
     sobem 20px e aparecem uma vez só. Sem reduced-motion, já nascem
     visíveis (o CSS cuida disso). */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
          setTimeout(function () { el.classList.add('is-in'); }, delay);
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });

      // Rede de segurança: se por qualquer motivo algo não for observado
      // (navegação por âncora, restauração de scroll, aba em segundo
      // plano), nada fica invisível para sempre.
      setTimeout(function () {
        revealables.forEach(function (el) { el.classList.add('is-in'); });
      }, 6000);
    }
  }

  /* ---------- METODOLOGIA: acordeão ----------
     Um item aberto por vez. Começa com o primeiro aberto para que a
     seção nunca pareça uma lista morta de títulos. */
  /* O diagrama e o acordeão são a mesma coisa vista de dois jeitos:
     abrir uma etapa acende o quadrante correspondente do duplo diamante. */
  var diamond = document.querySelector('[data-diamond]');
  function lightDiamond(index) {
    if (!diamond) return;
    diamond.querySelectorAll('.dia__stage').forEach(function (g) {
      g.classList.toggle('is-active', Number(g.getAttribute('data-stage')) === index);
    });
  }

  var method = document.querySelector('[data-method]');
  if (method) {
    var items = Array.prototype.slice.call(method.querySelectorAll('[data-method-item]'));
    items.forEach(function (item, i) {
      var trigger = item.querySelector('[data-method-trigger]');
      var panel = item.querySelector('[data-method-panel]');
      if (!trigger || !panel) return;

      var open = i === 0;
      if (open) lightDiamond(0);
      var apply = function (state) {
        item.classList.toggle('is-open', state);
        trigger.setAttribute('aria-expanded', String(state));
        panel.setAttribute('aria-hidden', String(!state));
      };
      apply(open);

      trigger.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          var t = other.querySelector('[data-method-trigger]');
          var p = other.querySelector('[data-method-panel]');
          other.classList.remove('is-open');
          if (t) t.setAttribute('aria-expanded', 'false');
          if (p) p.setAttribute('aria-hidden', 'true');
        });
        if (willOpen) apply(true);
        lightDiamond(willOpen ? i : -1);
      });
    });
  }

  /* ---------- HERO: vídeo por dentro das letras ----------
     Técnica: o título é um bloco com fundo cor-do-papel e texto preto,
     em mix-blend-mode: screen sobre o vídeo.
       screen(papel, vídeo) ≈ papel   → fundo continua limpo
       screen(preto, vídeo) = vídeo   → o vídeo aparece só nas letras
     Sem suporte a blend, ou com reduced-motion, fica texto preto sólido:
     nunca some, nunca quebra. */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var video = hero.querySelector('video');
    var supportsBlend = window.CSS && CSS.supports && CSS.supports('mix-blend-mode', 'screen');

    /* Sem vídeo o hero é o gradiente por dentro das letras, que é CSS puro:
       o JS não tem nada a fazer aqui. `is-solid` só entra quando havia um
       vídeo e ele não pode tocar. */
    if (!video) {
      /* nada a fazer */
    } else if (reduced || !supportsBlend) {
      hero.classList.add('is-solid');
      video.pause(); video.remove();
    } else {
      video.muted = true;
      video.playsInline = true;
      var play = video.play();
      if (play && play.catch) {
        play.catch(function () { hero.classList.add('is-solid'); video.remove(); });
      }
      // Pausa o vídeo quando o hero sai da tela — economiza bateria.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { video.play().catch(function () {}); }
            else { video.pause(); }
          });
        }, { threshold: 0 }).observe(hero);
      }
    }
  }

  /* ---------- ANO CORRENTE NO RODAPÉ ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- VÍDEOS DO CASE: capa parada; clique abre em tela cheia, com som ---------- */
  var vids = document.querySelectorAll('[data-video]');
  if (vids.length) {
    var fechar = function (v) { v.pause(); v.currentTime = 0; v.load(); };
    vids.forEach(function (v) {
      v.addEventListener('click', function () {
        if (document.fullscreenElement) return;
        var p = v.play(); if (p && p.catch) p.catch(function () {});
        if (v.requestFullscreen) v.requestFullscreen().catch(function () {});
        else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      });
      v.addEventListener('webkitendfullscreen', function () { fechar(v); });
      v.addEventListener('ended', function () {
        if (document.fullscreenElement === v && document.exitFullscreen) document.exitFullscreen();
        else fechar(v);
      });
    });
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement) vids.forEach(function (v) { if (!v.paused || v.currentTime) fechar(v); });
    });
  }

  /* ---------- FILME DO YOUTUBE: capa parada; clique troca pelo player, com som ---------- */
  document.querySelectorAll('[data-yt]').forEach(function (m) {
    var abrir = function () {
      if (m.querySelector('iframe')) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + m.getAttribute('data-yt') + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      f.title = m.getAttribute('aria-label') || 'Vídeo';
      f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      m.appendChild(f);
      m.classList.add('is-playing');
    };
    m.addEventListener('click', abrir);
    m.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
  });

  /* ---------- CARROSSEL: setas e contador; o resto é rolagem nativa ---------- */
  document.querySelectorAll('[data-carrossel]').forEach(function (c) {
    var track = c.querySelector('[data-carrossel-track]');
    var slides = track.children;
    var prev = c.querySelector('[data-carrossel-prev]');
    var next = c.querySelector('[data-carrossel-next]');
    var count = c.querySelector('[data-carrossel-count]');
    var total = String(slides.length).padStart(2, '0');
    var dots = c.querySelectorAll('.carrossel__dots span');
    var atual = function () {
      var x = track.scrollLeft, best = 0, d = Infinity;
      for (var i = 0; i < slides.length; i++) {
        var dd = Math.abs(slides[i].offsetLeft - track.offsetLeft - x);
        if (dd < d) { d = dd; best = i; }
      }
      return best;
    };
    var fim = function () { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; };
    var update = function () {
      var i = fim() ? slides.length - 1 : atual();
      count.textContent = String(i + 1).padStart(2, '0') + ' / ' + total;
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = fim();
    };
    var ir = function (i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', function () { ir(atual() - 1); });
    next.addEventListener('click', function () { ir(atual() + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual() - 1); }
    });
    var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
