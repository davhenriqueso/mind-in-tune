(function () {
  'use strict';

  const { $, $$, clamp } = MES.util;
  const html = document.documentElement;
  const g = window.gsap || null;
  const ST = g && window.ScrollTrigger ? window.ScrollTrigger : null;
  const temSplit = !!(g && window.SplitText);
  if (ST) g.registerPlugin(ST);
  if (temSplit) g.registerPlugin(window.SplitText);

  const fontesProntas = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1200)),
  ]);

  function iniciarTopo() {
    const topo = $('[data-topo]');
    const secoes = $$('main > section');
    let raf = 0;
    const atualizar = () => {
      raf = 0;
      topo.classList.toggle('is-rolado', window.scrollY > 8);
      const atras = secoes.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= 36 && r.bottom > 36;
      });
      topo.dataset.tom = (atras && atras.dataset.tom) || 'claro';
    };
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(atualizar); }, { passive: true });
    atualizar();
  }

  const ONDA_PLANA = 'M1 6 C3 6 5 6 7 6 S11 6 13 6 S17 6 19 6 S23 6 25 6';
  const ONDA_VIVA = 'M1 6 C3 1.5 5 1.5 7 6 S11 10.5 13 6 S17 1.5 19 6 S23 10.5 25 6';
  const LOGO = 'M10 12 C13 4.5 17 4.5 22 12 S31 19.5 34 12';
  const LOGO_INVERSO = 'M10 12 C13 19.5 17 19.5 22 12 S31 4.5 34 12';

  function iniciarOndas() {
    if (!g) return;
    $$('.botao__onda path').forEach((onda) => {
      const botao = onda.closest('.botao');
      const vibrar = () => MES.anima() && g.to(onda, { attr: { d: ONDA_VIVA }, duration: 0.52, ease: 'elastic.out(1, 0.55)', overwrite: true });
      const acalmar = () => g.to(onda, { attr: { d: ONDA_PLANA }, duration: 0.28, ease: 'power1.out', overwrite: true });
      botao.addEventListener('pointerenter', vibrar);
      botao.addEventListener('focus', vibrar);
      botao.addEventListener('pointerleave', acalmar);
      botao.addEventListener('blur', acalmar);
    });

    const marca = $('.topo .marca');
    const ondaMarca = $('.marca__onda', marca);
    marca.addEventListener('pointerenter', () => {
      if (!MES.anima()) return;
      g.timeline({ overwrite: true })
        .to(ondaMarca, { attr: { d: LOGO_INVERSO }, duration: 0.26, ease: 'sine.inOut' })
        .to(ondaMarca, { attr: { d: LOGO }, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    });
  }

  function iniciarAviso() {
    const dlg = $('[data-aviso]');
    $$('[data-abrir-aviso]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  function sintonizarMatch(titulo, atraso = 0) {
    const eco = $('[data-match-eco]', titulo);
    if (!eco || !MES.anima()) return;
    const fs = parseFloat(getComputedStyle(eco).fontSize);
    g.fromTo(eco, { x: fs * 0.42, y: -fs * 0.16 }, { x: fs * 0.05, y: fs * 0.03, duration: 1.7, delay: atraso, ease: 'elastic.out(1, 0.42)' });
    g.fromTo(eco, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: atraso });
  }

  function dividirLinhas(el) {
    return new window.SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'linha', aria: 'none', ignore: '.match' });
  }

  function introHero(baralho) {
    const hero = $('[data-hero]');
    const frente = baralho.frente;
    html.classList.add('pronto');
    if (!MES.anima()) return;

    const partes = $$('[data-split]', hero);
    const splits = temSplit ? partes.map(dividirLinhas) : [];
    if (splits.length) window.addEventListener('resize', () => splits.forEach((s) => s.revert()), { once: true });

    const fundo = baralho.cartoes.filter((c) => c !== frente).map((c) => c.el);
    const tl = g.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('[data-topo]', { y: -24, opacity: 0, duration: 0.9 }, 0);
    if (splits.length) {
      tl.from(splits[0].lines, { yPercent: 112, duration: 1.15, stagger: 0.09 }, 0.08);
      tl.from(splits[1].lines, { yPercent: 112, duration: 1.15, stagger: 0.09 }, 0.34);
    } else {
      tl.from(partes, { y: 40, opacity: 0, duration: 1, stagger: 0.2 }, 0.1);
    }
    tl.from(fundo, { y: 140, x: 0, rotation: 0, opacity: 0, duration: 1.25, stagger: 0.1 }, 0.22);
    tl.from(frente.el, { y: 180, opacity: 0, scale: 0.94, duration: 1.3 }, 0.3);
    tl.from('.hero__texto > *', { y: 26, opacity: 0, duration: 1, stagger: 0.1 }, 0.66);
    tl.from('.hero__baralho-rodape', { opacity: 0, duration: 0.8 }, 1.1);
    tl.add(() => {
      frente.sint.sintonizar({ duracao: 1.25 });
      sintonizarMatch($('.hero__titulo', hero), 0.12);
    }, 1.05);
  }

  function comprimentoRelativo(svg, larguraVB) {
    const w = svg.clientWidth || larguraVB;
    return clamp((larguraVB / w) * 0.5, 1, 2.4);
  }

  function ondaPonte() {
    const linha = $('[data-ponte-linha]');
    const est = { t: 1 };
    const desenhar = () => {
      linha.setAttribute('d', MES.onda.caminho({
        x0: 0, x1: 1200, y: 60, amp: 22 + 8 * (1 - est.t), comp: 150, passo: 6,
        ruido: 1 - est.t, ampRuido: 46,
        envelope: (t) => 0.35 + 0.65 * Math.sin(Math.PI * t),
      }));
      linha.style.setProperty('--t', est.t.toFixed(3));
    };
    desenhar();
    return { est, desenhar };
  }

  function ondasFinal() {
    const sec = $('[data-final]');
    const a = $('[data-final-a]', sec), b = $('[data-final-b]', sec);
    const est = { p: 1 };
    const desenhar = () => {
      const p = est.p;
      const base = {
        x0: 0, x1: 1440, y: 110, amp: 46 + 18 * (1 - p), passo: 6,
        comp: 240 * comprimentoRelativo(a.ownerSVGElement, 1440),
        envelope: (t) => 0.4 + 0.6 * Math.sin(Math.PI * t),
      };
      a.setAttribute('d', MES.onda.caminho(base));
      b.setAttribute('d', MES.onda.caminho({ ...base, fase: (1 - p) * Math.PI * 1.15 }));
      sec.style.setProperty('--sintonia', p.toFixed(3));
    };
    desenhar();
    return { est, desenhar };
  }

  function animarRolagem(ponte, final, desktop) {
    g.to('.hero__a', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: 0.4 } });

    if (temSplit) {
      $$('[data-problema] [data-split]').forEach((el) => {
        const s = new window.SplitText(el, { type: 'words', aria: 'none' });
        g.from(s.words, {
          x: () => g.utils.random(-22, 22),
          y: () => g.utils.random(-16, 16),
          rotation: () => g.utils.random(-7, 7),
          opacity: 0.15, duration: 1.1, ease: 'power3.out',
          stagger: { each: 0.035, from: 'random' },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onComplete: () => s.revert(),
        });
      });
    }
    g.fromTo(ponte.est, { t: 0 }, {
      t: 1, ease: 'none', onUpdate: ponte.desenhar,
      scrollTrigger: { trigger: '[data-ponte]', start: 'top 92%', end: 'bottom 45%', scrub: 0.6 },
    });

    if (temSplit) {
      const el = $('[data-como] [data-split]');
      const s = new window.SplitText(el, { type: 'words', aria: 'none' });
      g.fromTo(s.words, { opacity: 0.18 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 35%', scrub: true } });
    }
    g.fromTo('[data-passos]', { '--linha': 0 }, { '--linha': 1, ease: 'none', scrollTrigger: { trigger: '[data-passos]', start: 'top 75%', end: 'bottom 60%', scrub: true } });
    g.from('.passo', { y: 30, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '[data-passos]', start: 'top 80%', once: true } });

    if (temSplit) {
      const titulo = $('.publicos__titulo');
      const s = new window.SplitText(titulo, { type: 'words' });
      const meio = Math.ceil(s.words.length / 2);
      const conf = { opacity: 0.15, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: titulo, start: 'top 85%', once: true } };
      g.from(s.words.slice(0, meio), { ...conf, x: -60, stagger: 0.05 });
      g.from(s.words.slice(meio), { ...conf, x: 60, stagger: { each: 0.05, from: 'end' }, onComplete: () => s.revert() });
    }
    if (desktop) {
      const conf = { ease: 'none', scrollTrigger: { trigger: '[data-publicos]', start: 'top 90%', end: 'top 30%', scrub: 0.6 } };
      g.fromTo('.lado--busca', { x: -36 }, { x: 0, ...conf });
      g.fromTo('.lado--psi', { x: 36 }, { x: 0, ...conf });
    }

    g.fromTo(final.est, { p: 0 }, {
      p: 1, ease: 'none', onUpdate: final.desenhar,
      scrollTrigger: { trigger: '[data-final]', start: 'top 75%', end: 'center 55%', scrub: 0.7 },
    });
    const tituloFinal = $('.final__titulo');
    if (temSplit) {
      const s = dividirLinhas($('[data-split]', tituloFinal));
      g.from(s.lines, {
        yPercent: 112, duration: 1.2, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: tituloFinal, start: 'top 80%', once: true },
        onStart: () => sintonizarMatch(tituloFinal, 0.5),
      });
    }
  }

  iniciarTopo();
  iniciarOndas();
  iniciarAviso();

  const baralho = new MES.Baralho($('[data-baralho]'));
  $('[data-proximo]').addEventListener('click', () => baralho.proximo());

  const ponte = ondaPonte();
  const final = ondasFinal();

  fontesProntas.then(() => {
    introHero(baralho);
    if (!MES.anima() || !ST) return;
    g.matchMedia().add({ desktop: '(min-width: 1024px)', menor: '(max-width: 1023px)' }, (ctx) => {
      animarRolagem(ponte, final, ctx.conditions.desktop);
    });
  });
})();
