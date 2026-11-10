/* =============================================================
   ABHINAV PRASAD — PORTFOLIO
   ============================================================= */
(() => {
  'use strict';

  const body = document.body;
  const intro = document.getElementById('intro');
  const snap = document.getElementById('snap');
  const topbar = document.getElementById('topbar');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* -----------------------------------------------------------
     Reveal on scroll
     ----------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  const revealInView = () => {
    document.querySelectorAll('.reveal').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
        el.classList.add('is-in');
        revealObserver.unobserve(el);
      } else {
        revealObserver.observe(el);
      }
    });
  };

  /* -----------------------------------------------------------
     Contact heading — fit to the full page width
     ----------------------------------------------------------- */
  function fitContactTitle() {
    const title = document.querySelector('.contact__title');
    if (!title) return;
    title.style.fontSize = '';
    const stage = title.parentElement;
    const available = stage.clientWidth;
    const width = title.scrollWidth;
    if (!width || !available) return;
    const current = parseFloat(getComputedStyle(title).fontSize) || 100;
    const target = Math.min(current * (available / width) * 0.985, 300);
    title.style.fontSize = `${target.toFixed(2)}px`;
  }

  /* -----------------------------------------------------------
     Intro sequence
     ----------------------------------------------------------- */
  let introDone = false;
  let autoTimer = null;

  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    clearTimeout(autoTimer);

    if (intro) {
      intro.classList.add('is-out');
      window.setTimeout(() => { intro.style.display = 'none'; }, reduceMotion ? 100 : 1250);
    }
    if (snap) {
      snap.classList.add('is-flashing');
      window.setTimeout(() => snap.classList.remove('is-flashing'), 750);
    }

    body.classList.remove('is-intro');
    body.classList.add('intro-done');
    window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      revealInView();
      fitContactTitle();
    });
  };

  window.addEventListener('wheel', (e) => {
    if (!introDone && e.deltaY > 0) finishIntro();
  }, { passive: true });

  window.addEventListener('touchmove', () => {
    if (!introDone) finishIntro();
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (introDone) return;
    if (['Enter', ' ', 'Escape', 'ArrowDown', 'PageDown'].includes(e.key)) finishIntro();
  });

  autoTimer = window.setTimeout(finishIntro, reduceMotion ? 1800 : 5600);

  /* -----------------------------------------------------------
     Scroll: progress, header, parallax
     ----------------------------------------------------------- */
  let scrollRaf = null;
  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(y / max, 1) : 0;
      if (topbar) topbar.classList.toggle('is-scrolled', y > 24);

      // Move the accent through the site's existing orange -> magenta range.
      // The hue is intentionally subtle so the page still feels like one system.
      const hue = Math.round(24 + progress * 304);
      document.documentElement.style.setProperty('--scroll-hue', hue);
      document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(3));
      document.documentElement.style.setProperty('--scroll-percent', `${(progress * 100).toFixed(2)}%`);

      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0;
        el.style.translate = `0 ${(y * speed).toFixed(1)}px`;
      });

      scrollRaf = null;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', onScroll);

  /* -----------------------------------------------------------
     Project carousel
     ----------------------------------------------------------- */
  const carousel = document.getElementById('carousel');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const carCount = document.getElementById('carCount');
  const carProgress = document.getElementById('carProgress');

  if (carousel) {
    const cards = Array.from(carousel.querySelectorAll('.card'));

    const gap = () => {
      const styles = getComputedStyle(carousel);
      return parseFloat(styles.columnGap || styles.gap) || 0;
    };

    const stepSize = () => {
      if (!cards.length) return 320;
      return cards[0].getBoundingClientRect().width + gap();
    };

    const pad = (n) => String(n).padStart(2, '0');

    const updateCarousel = () => {
      const max = carousel.scrollWidth - carousel.clientWidth;
      const progress = max > 0 ? Math.min(Math.max(carousel.scrollLeft / max, 0), 1) : 0;
      const index = Math.min(cards.length - 1, Math.max(0, Math.round(progress * (cards.length - 1))));
      if (carProgress) carProgress.style.transform = `translateX(${progress * 300}%)`;
      if (carCount) carCount.textContent = `${pad(index + 1)} / ${pad(cards.length)}`;
      if (prevBtn) prevBtn.disabled = carousel.scrollLeft <= 3;
      if (nextBtn) nextBtn.disabled = carousel.scrollLeft >= max - 3;
    };

    carousel.addEventListener('scroll', updateCarousel, { passive: true });

    const go = (dir) => {
      carousel.scrollBy({ left: dir * stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(1));

    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    /* mouse drag */
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = 0;

    carousel.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startScroll = carousel.scrollLeft;
      carousel.classList.add('is-dragging');
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) carousel.scrollLeft = startScroll - dx;
    });

    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      carousel.classList.remove('is-dragging');
    });

    carousel.addEventListener('click', (e) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    }, true);

    carousel.addEventListener('dragstart', (e) => e.preventDefault());

    updateCarousel();
    window.addEventListener('load', updateCarousel);
  }

  /* -----------------------------------------------------------
     Copy email
     ----------------------------------------------------------- */
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || '';
      const label = copyBtn.querySelector('.copy__text');
      let copied = false;

      try {
        await navigator.clipboard.writeText(email);
        copied = true;
      } catch (err) {
        const field = document.createElement('textarea');
        field.value = email;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
        document.body.removeChild(field);
      }

      if (label) label.textContent = copied ? 'Copied ✓' : 'Copy failed';
      copyBtn.classList.toggle('is-copied', copied);
      window.setTimeout(() => {
        if (label) label.textContent = 'Copy email';
        copyBtn.classList.remove('is-copied');
      }, 2200);
    });
  }

  /* -----------------------------------------------------------
     Clock — IST
     ----------------------------------------------------------- */
  const clock = document.getElementById('clock');
  if (clock) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const tick = () => { clock.textContent = formatter.format(new Date()); };
    tick();
    window.setInterval(tick, 30000);
  }

  /* -----------------------------------------------------------
     Resize / font load
     ----------------------------------------------------------- */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      fitContactTitle();
      if (carousel) {
        const evt = new Event('scroll');
        carousel.dispatchEvent(evt);
      }
    }, 140);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      fitContactTitle();
      onScroll();
    });
  }
  window.addEventListener('load', fitContactTitle);

  revealInView();
})();
