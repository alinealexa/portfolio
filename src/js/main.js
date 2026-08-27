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
})();
