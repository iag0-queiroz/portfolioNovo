/* ==========================================================================
   IAGO QUEIROZ — CADERNO TÉCNICO
   JavaScript puro e mínimo: só o que o CSS não consegue fazer sozinho.
   Carregado com `defer`, então o DOM já está pronto quando este arquivo roda.

   1. Revelar elementos ao rolar (IntersectionObserver)
   2. Menu mobile
   3. Copiar e-mail

   O carimbo do hero, os hovers, a rolagem suave e o "voltar ao topo" são CSS/HTML puros.
   ========================================================================== */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. REVELAR AO ROLAR
     .reveal começa invisível (style.css, seção 12) e ganha .is-visible ao entrar
     na tela. Os títulos .reveal--stamp usam a mesma classe para disparar o carimbo.
     ------------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('.reveal');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    // Sem animação (ou navegador muito antigo): mostra tudo de uma vez
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // cada elemento anima uma vez só
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -6% 0px'
    });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------------
     2. VOLTAR AO TOPO
     O botão usa rolagem suave para o topo sem empurrar o histórico para um hash
     ou criar um teleporte instantâneo.
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-scroll-top]').forEach(function (trigger) {
    trigger.addEventListener('click', function (event) {
      event.preventDefault();

      if (window.history && window.history.replaceState) {
        var baseUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', baseUrl);
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var targetId = link.getAttribute('href').slice(1);
      var target = document.getElementById(targetId);
      var sectionHead = target && target.classList.contains('section')
        ? target.querySelector('.section__head')
        : null;

      if (!sectionHead) return;

      event.preventDefault();

      var header = document.querySelector('.site-header');
      var headerHeight = header ? header.getBoundingClientRect().height : 68;
      var targetTop = sectionHead.getBoundingClientRect().top + window.pageYOffset - headerHeight - 24;

      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', '#' + targetId);
      }

      window.scrollTo({
        top: Math.max(targetTop, 0),
        left: 0,
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    });
  });

  /* ------------------------------------------------------------------------
     3. MENU MOBILE
     Painel simples que desce do cabeçalho (não é modal, então não prende o foco).
     Fecha ao: escolher um link, apertar Esc, clicar fora, o foco sair do cabeçalho
     ou voltar à largura desktop.
     ------------------------------------------------------------------------ */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu');
  var header = document.querySelector('.site-header');

  if (toggle && menu && header) {
    var isOpen = function () {
      return toggle.getAttribute('aria-expanded') === 'true';
    };

    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      menu.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      menu.classList.add('is-animated'); // liga a transição só a partir do primeiro uso
      setMenu(!isOpen());
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });

    document.addEventListener('click', function (event) {
      if (isOpen() && !header.contains(event.target)) setMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Foco saiu do cabeçalho (Tab depois do último link, Shift+Tab até o skip-link): fecha o painel.
    // relatedTarget é null em cliques/toques fora — esses casos já são do listener de click acima.
    header.addEventListener('focusout', function (event) {
      if (isOpen() && event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
    });

    var desktop = window.matchMedia('(min-width: 861px)');
    var onDesktop = function (event) {
      if (!event.matches) return;
      menu.classList.remove('is-animated'); // ao voltar para o mobile, o painel fechado não "pisca"
      setMenu(false);
    };

    if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
    else if (desktop.addListener) desktop.addListener(onDesktop); // Safari < 14
  }

  /* ------------------------------------------------------------------------
     4. COPIAR E-MAIL
     Melhoria progressiva: o botão nasce com `hidden` no HTML e só aparece se o
     navegador tiver a Clipboard API. Sem ela (ou sem JS), o link mailto resolve.
     ------------------------------------------------------------------------ */
  var copyBtn = document.querySelector('[data-copy]');
  var feedback = document.querySelector('.contact__feedback');

  // Fonte única: copia sempre o endereço do link mailto da seção de contato
  var mailLink = document.querySelector('.contact a[href^="mailto:"]');
  var address = mailLink ? mailLink.getAttribute('href').replace(/^mailto:/i, '').split('?')[0] : '';

  if (copyBtn && address && navigator.clipboard && navigator.clipboard.writeText) {
    var resetTimer = null;

    copyBtn.hidden = false;

    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(address).then(function () {
        if (feedback) feedback.textContent = 'copiado!';
      }, function () {
        if (feedback) feedback.textContent = 'não deu — use o link acima';
      }).then(function () {
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
          if (feedback) feedback.textContent = '';
        }, 2400);
      });
    });
  }
})();
