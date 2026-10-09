/* =============================================================================
   Mente em Sintonia — script principal
   -----------------------------------------------------------------------------
   Organiza a página em módulos (um por área). Cada módulo devolve sua função de
   limpeza; `MES.destruir()` desfaz tudo (listeners, ScrollTriggers, animações).

   GSAP + ScrollTrigger + SplitText → entrada do hero, títulos, rolagem,
                                      sintonizador, composição dos cartões,
                                      menu e diálogos
   anime.js                         → botões, chips, medidores de sintonia,
                                      linhas de conexão, eco do "match"
   ============================================================================= */
(function () {
  'use strict';

  const { $, $$, on, clamp, lerp, semente } = MES.util;
  const M = MES.movimento;
  const g = M.gsap ? window.gsap : null;
  const A = M.anime ? window.anime : null;
  const ST = g && window.ScrollTrigger ? window.ScrollTrigger : null;
  const temSplit = !!(g && window.SplitText);
  const html = document.documentElement;
  const limpezas = [];

  if (g) {
    if (ST) g.registerPlugin(ST);
    if (temSplit) g.registerPlugin(window.SplitText);
    if (ST) ST.config({ ignoreMobileResize: true });
  }
  html.classList.toggle('com-gsap', !!g);
  html.classList.toggle('com-anime', !!A);
  html.classList.toggle('leve', M.leve);

  const fontesProntas = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), MES.util.esperar(1200)]);

  /* ======================================================= navegação ====== */
  function irPara(hash) {
    const alvo = document.querySelector(hash);
    if (!alvo) return;
    alvo.scrollIntoView({ behavior: M.reduzido ? 'auto' : 'smooth', block: 'start' });
    if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
    alvo.focus({ preventScroll: true });
    try { history.replaceState(null, '', hash); } catch (e) { /* alguns ambientes (iframes) bloqueiam */ }
  }
  MES.irPara = irPara;

  function iniciarLinks() {
    return on(document, 'click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey) return;
      const hash = a.getAttribute('href');
      if (hash.length < 2 || !document.querySelector(hash)) return;
      e.preventDefault();
      if (menu.aberto) menu.fechar(false);
      irPara(hash);
    });
  }

  /* ============================================ cabeçalho + sintonizador ==== */
  function iniciarTopo() {
    const topo = $('[data-topo]');
    const escala = $('[data-dial-escala]');
    const agulha = $('[data-dial-agulha]');
    const secoes = $$('main > section');
    const ids = secoes.map((s) => s.id);
    const linksDial = $$('[data-dial] [data-estacao]');
    const linksTodos = $$('[data-estacao]');
    let topos = [], xs = [], ativo = -1, raf = 0;

    // marcas da escala (geradas uma vez)
    for (let i = 0; i <= 60; i++) {
      const t = document.createElement('i');
      t.style.left = (i / 60) * 100 + '%';
      if (i % 12 === 0) t.className = 'maior';
      escala.appendChild(t);
    }

    function medir() {
      topos = secoes.map((s) => s.getBoundingClientRect().top + window.scrollY);
      const base = escala.getBoundingClientRect();
      xs = linksDial.map((l) => {
        const r = l.getBoundingClientRect();
        return r.left + r.width / 2 - base.left;
      });
      atualizar();
    }

    const definirX = g ? g.quickSetter(agulha, 'x', 'px') : (v) => { agulha.style.transform = `translateX(${v}px)`; };

    function atualizar() {
      raf = 0;
      const y = window.scrollY + window.innerHeight * 0.35;
      let i = 0;
      while (i < topos.length - 1 && y >= topos[i + 1]) i++;
      const prox = Math.min(i + 1, topos.length - 1);
      const span = Math.max(1, (topos[prox] || topos[i] + 1) - topos[i]);
      const f = i === prox ? 0 : clamp((y - topos[i]) / span, 0, 1);
      if (xs.length) definirX(lerp(xs[i], xs[prox], f));

      if (i !== ativo) {
        ativo = i;
        linksTodos.forEach((l) => {
          if (l.dataset.estacao === ids[i]) l.setAttribute('aria-current', 'true');
          else l.removeAttribute('aria-current');
        });
      }
      // tom do cabeçalho: o da seção que está atrás dele
      const yTopo = window.scrollY + 36;
      let k = 0;
      while (k < topos.length - 1 && yTopo >= topos[k + 1]) k++;
      const tom = secoes[k].dataset.tom || 'claro';
      if (topo.dataset.tom !== tom) topo.dataset.tom = tom;
      topo.classList.toggle('is-rolado', window.scrollY > 8);
    }

    const aoRolar = () => { if (!raf) raf = requestAnimationFrame(atualizar); };
    const offs = [on(window, 'scroll', aoRolar, { passive: true }), on(window, 'resize', medir)];
    if (ST) ST.addEventListener('refresh', medir);
    fontesProntas.then(medir);
    medir();

    // microinteração: as marcas sob a estação "vibram" no hover (anime.js)
    linksDial.forEach((l, idx) => {
      offs.push(on(l, 'pointerenter', () => {
        if (!A || M.reduzido || !xs.length) return;
        const marcas = $$('i', escala).filter((m) => Math.abs(parseFloat(m.style.left) / 100 * escala.offsetWidth - xs[idx]) < 22);
        MES.fx.animate(marcas, { scaleY: [1, 1.9, 1], duration: 520, delay: A.stagger(28, { from: 'center' }), ease: 'outQuad' });
      }));
    });

    return () => {
      offs.forEach((f) => f());
      if (ST) ST.removeEventListener('refresh', medir);
      cancelAnimationFrame(raf);
    };
  }

  /* ============================================================== menu ===== */
  const menu = {
    aberto: false,
    iniciar() {
      this.btn = $('[data-menu-abrir]');
      this.el = $('[data-menu]');
      this.painel = $('.menu__painel', this.el);
      this.links = $$('.menu__lista a, .menu__acoes a', this.el);
      const offs = [
        on(this.btn, 'click', () => (this.aberto ? this.fechar() : this.abrir())),
        on($('[data-menu-fechar]', this.el), 'click', () => this.fechar()),
        on($('[data-menu-fundo]', this.el), 'click', () => this.fechar()),
        on(this.el, 'keydown', (e) => this.teclado(e)),
        on(window, 'resize', () => { if (this.aberto && window.innerWidth >= 1180) this.fechar(false); }),
      ];
      return () => offs.forEach((f) => f());
    },
    abrir() {
      this.aberto = true;
      this.el.hidden = false;
      this.btn.setAttribute('aria-expanded', 'true');
      html.classList.add('menu-aberto');
      const focaveis = this.focaveis();
      if (g && !M.reduzido) {
        const r = this.btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const raio = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
        g.killTweensOf([this.painel, this.links]);
        g.fromTo(this.painel, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${raio}px at ${cx}px ${cy}px)`, duration: 0.7, ease: 'expo.inOut' });
        g.fromTo(this.links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.04, delay: 0.28 });
      }
      setTimeout(() => focaveis[0] && focaveis[0].focus(), M.reduzido ? 0 : 120);
    },
    fechar(devolverFoco = true) {
      if (!this.aberto) return;
      this.aberto = false;
      this.btn.setAttribute('aria-expanded', 'false');
      html.classList.remove('menu-aberto');
      const fim = () => { this.el.hidden = true; if (devolverFoco) this.btn.focus(); };
      if (g && !M.reduzido && devolverFoco) {
        const r = this.btn.getBoundingClientRect();
        g.to(this.painel, { clipPath: `circle(0px at ${r.left + r.width / 2}px ${r.top + r.height / 2}px)`, duration: 0.5, ease: 'expo.in', onComplete: fim });
      } else {
        fim();
      }
    },
    focaveis() {
      return $$('a[href], button:not([disabled])', this.el).filter((n) => n.offsetParent !== null);
    },
    teclado(e) {
      if (e.key === 'Escape') { e.preventDefault(); this.fechar(); return; }
      if (e.key !== 'Tab') return;
      const f = this.focaveis();
      const primeiro = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    },
  };

  /* ===================================================== botões (anime) ==== */
  const ONDA_PLANA = 'M1 6 C3 6 5 6 7 6 S11 6 13 6 S17 6 19 6 S23 6 25 6';
  const ONDA_VIVA = 'M1 6 C3 1.5 5 1.5 7 6 S11 10.5 13 6 S17 1.5 19 6 S23 10.5 25 6';

  function iniciarBotoes() {
    if (!A) return () => {};
    const dentro = (e, b) => e.relatedTarget && b.contains(e.relatedTarget);
    const sintonizar = (b, viva) => {
      const p = b.querySelector('.botao__onda path');
      if (!p) return;
      MES.fx.animate(p, viva ? { d: ONDA_VIVA, duration: 520, ease: 'outElastic(1, .55)' } : { d: ONDA_PLANA, duration: 280, ease: 'outQuad' });
    };
    const apertar = (b, dentroBotao) => MES.fx.animate(b, dentroBotao
      ? { scale: 0.965, duration: 110, ease: 'outQuad' }
      : { scale: 1, duration: 520, ease: 'outElastic(1, .5)' });

    const offs = [
      on(document, 'pointerover', (e) => {
        const b = e.target.closest('[data-botao]');
        if (b && !dentro(e, b)) sintonizar(b, true);
      }),
      on(document, 'pointerout', (e) => {
        const b = e.target.closest('[data-botao]');
        if (b && !dentro(e, b)) { sintonizar(b, false); if (b.dataset.apertado) { delete b.dataset.apertado; apertar(b, false); } }
      }),
      on(document, 'focusin', (e) => { const b = e.target.closest('[data-botao]'); if (b) sintonizar(b, true); }),
      on(document, 'focusout', (e) => { const b = e.target.closest('[data-botao]'); if (b) sintonizar(b, false); }),
      on(document, 'pointerdown', (e) => { const b = e.target.closest('[data-botao]'); if (b) { b.dataset.apertado = '1'; apertar(b, true); } }),
      on(document, 'pointerup', () => { $$('[data-botao][data-apertado]').forEach((b) => { delete b.dataset.apertado; apertar(b, false); }); }),
    ];

    // logo: a onda entre os dois pontos oscila no hover
    const marca = $('[data-marca]');
    const ondaMarca = $('.marca__onda', marca);
    const BASE = 'M10 12 C13 4.5 17 4.5 22 12 S31 19.5 34 12';
    const INVERSA = 'M10 12 C13 19.5 17 19.5 22 12 S31 4.5 34 12';
    offs.push(on(marca, 'pointerenter', () => {
      MES.fx.animate(ondaMarca, { d: [{ to: INVERSA, duration: 260, ease: 'inOutSine' }, { to: BASE, duration: 700, ease: 'outElastic(1, .45)' }] });
    }));
    return () => offs.forEach((f) => f());
  }

  /* ===================================================== eco do "match" ==== */
  // A palavra "match" tem uma segunda camada (lilás) levemente fora de fase.
  // Ela começa desalinhada e "sintoniza", mas nunca encaixa 100%.
  // `titulo` é o h1/h2 que contém o "match"; o eco é buscado na hora porque o
  // SplitText pode recriar os nós do título.
  function sintonizarMatch(titulo, atraso = 0) {
    const eco = titulo && $('[data-match-eco]', titulo);
    if (!eco || !A || M.reduzido) return;
    const fs = parseFloat(getComputedStyle(eco).fontSize);
    A.animate(eco, {
      translateX: [fs * 0.42, fs * 0.05],
      translateY: [-fs * 0.16, fs * 0.03],
      opacity: [0, 1],
      duration: 1700,
      delay: atraso,
      ease: 'outElastic(1, .42)',
    });
  }
  function ligarEcoHover(titulo) {
    if (!titulo) return () => {};
    return on(titulo, 'pointerover', (e) => {
      const eco = $('[data-match-eco]', titulo);
      if (!eco || !A || M.reduzido || !e.target.closest('.match')) return;
      if (eco.dataset.vibrando) return;
      eco.dataset.vibrando = '1';
      setTimeout(() => delete eco.dataset.vibrando, 1300);
      const fs = parseFloat(getComputedStyle(eco).fontSize);
      A.animate(eco, {
        translateX: [{ to: fs * 0.24, duration: 180, ease: 'outQuad' }, { to: fs * 0.05, duration: 1100, ease: 'outElastic(1, .38)' }],
        translateY: [{ to: -fs * 0.08, duration: 180, ease: 'outQuad' }, { to: fs * 0.03, duration: 1100, ease: 'outElastic(1, .38)' }],
      });
    });
  }

  /* ================================================================ hero ===== */
  function iniciarHero() {
    const hero = $('[data-hero]');
    const D = MES.dados;
    const busca = $('[data-busca]', hero);
    const resumo = $('[data-busca-resumo]', hero);
    const fios = $('[data-hero-fios]', hero);
    const deckEl = $('[data-hero-baralho]', hero);
    const mqCompacto = window.matchMedia('(max-width: 899px)');
    const perfis = D.perfisHero.map((id) => D.perfis.find((p) => p.id === id));
    const resultados = new Map(perfis.map((p) => [p.id, MES.calcularSintonia(p, D.buscaHero)]));
    const offs = [];
    let timerFios = 0;

    const baralho = new MES.Baralho(deckEl, {
      variante: 'hero',
      poses: mqCompacto.matches ? 'heroCompacto' : 'hero',
      perfis,
      resultados,
      aoMudar: (info) => {
        atualizarBusca(info);
        agendarFios();
      },
      aoConhecer: (c) => MES.perfilDialogo.abrir(c.perfil, c.res, $('[data-cartao-conhecer]', c.el)),
    });

    offs.push(on(mqCompacto, 'change', () => {
      baralho.poses = MES.Baralho.POSES[mqCompacto.matches ? 'heroCompacto' : 'hero'];
      baralho.aplicarPoses(false);
      agendarFios(0);
    }));

    function atualizarBusca({ perfil, el }) {
      let n = 0;
      $$('.busca__item', busca).forEach((item) => {
        const comum = !!el.querySelector(`[data-chave="${item.dataset.chave}"][data-comum]`);
        item.classList.toggle('is-comum', comum);
        if (comum) n++;
      });
      resumo.textContent = `${n} de 4 em comum com ${perfil.nome.split(' ')[0]}`;
    }

    /* fios que ligam a busca aos atributos do cartão da frente (anime.js) */
    function desenharFios(animar) {
      fios.innerHTML = '';
      const caixa = fios.getBoundingClientRect();
      const rb = busca.getBoundingClientRect();
      const frente = baralho.frente.el;
      const rf = frente.getBoundingClientRect();
      if (!caixa.width || rb.right > rf.left - 8 || getComputedStyle(fios).display === 'none') return;
      fios.setAttribute('viewBox', `0 0 ${caixa.width.toFixed(0)} ${caixa.height.toFixed(0)}`);
      const ns = 'http://www.w3.org/2000/svg';
      const caminhos = [], pontos = [];
      // destinos: borda esquerda do cartão, na altura de cada atributo em comum;
      // itens na mesma linha (etiquetas) chegam levemente afastados entre si
      const porLinha = new Map();
      $$('.busca__item.is-comum', busca).forEach((item) => {
        const alvo = frente.querySelector(`[data-chave="${item.dataset.chave}"][data-comum]`);
        if (!alvo) return;
        const b = alvo.getBoundingClientRect();
        const chave = Math.round(b.top / 6);
        const n = porLinha.get(chave) || 0;
        porLinha.set(chave, n + 1);
        const a = $('.busca__ponto', item).getBoundingClientRect();
        const ax = a.left + a.width / 2 - caixa.left, ay = a.top + a.height / 2 - caixa.top;
        const bx = rf.left + 1 - caixa.left, by = b.top + b.height / 2 - caixa.top + n * 8;
        const dx = Math.max(28, (bx - ax) * 0.55);
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('class', 'fio');
        p.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} C${(ax + dx).toFixed(1)} ${ay.toFixed(1)} ${(bx - dx).toFixed(1)} ${by.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`);
        fios.appendChild(p);
        caminhos.push(p);
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('class', 'fio__ponto');
        c.setAttribute('cx', bx.toFixed(1));
        c.setAttribute('cy', by.toFixed(1));
        c.setAttribute('r', '3.5');
        fios.appendChild(c);
        pontos.push(c);
      });
      if (!A || !animar || M.reduzido) return;
      const desenhos = A.svg.createDrawable(caminhos);
      A.animate(desenhos, { draw: ['0 0', '0 1'], duration: 760, delay: A.stagger(110), ease: 'inOutQuad' });
      A.animate(pontos, { scale: [0, 1], opacity: [0, 1], duration: 420, delay: A.stagger(110, { start: 620 }), ease: 'outBack(2)' });
    }

    function agendarFios(espera = M.reduzido ? 0 : 700) {
      clearTimeout(timerFios);
      if (A && fios.childNodes.length && !M.reduzido) {
        A.animate(fios.children, { opacity: 0, duration: 160, ease: 'outQuad' });
      }
      timerFios = setTimeout(() => desenharFios(true), espera);
    }

    let ro = null;
    if ('ResizeObserver' in window) {
      let t = 0;
      ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => desenharFios(false), 120); });
      ro.observe(hero);
    }
    offs.push(ligarEcoHover($('.hero__titulo', hero)));

    return {
      baralho,
      desenharFios,
      destruir() {
        offs.forEach((f) => f());
        clearTimeout(timerFios);
        if (ro) ro.disconnect();
        baralho.destruir();
      },
    };
  }

  /* entrada cinematográfica do hero (GSAP), com sintonia final no anime.js */
  function introHero(heroCtl) {
    const hero = $('[data-hero]');
    const regua = $('[data-regua]', hero);
    const agulhaRegua = $('[data-regua-agulha]', hero);
    const titulo = $('.hero__titulo', hero);
    const frente = heroCtl.baralho.frente;
    const terminar = () => {
      html.classList.add('pronto');
      heroCtl.desenharFios(true);
      frente.sint.definir(frente.res.valor, { sintonizar: true, duracao: 1250 });
      sintonizarMatch(titulo, 120);
    };

    if (!g || M.reduzido) {
      html.classList.add('pronto');
      if (agulhaRegua) agulhaRegua.style.left = '100%';
      heroCtl.desenharFios(false);
      frente.sint.definir(frente.res.valor, { animar: false });
      return null;
    }

    const partes = $$('[data-split]', hero);
    const splits = temSplit
      ? partes.map((el) => new window.SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'linha', aria: 'none', ignore: '.match' }))
      : [];
    const cartoesFundo = [...heroCtl.baralho.cartoes.values()].filter((c) => c !== frente).map((c) => c.el);

    const tl = g.timeline({ defaults: { ease: 'expo.out' } });
    // as linhas divididas só existem para a entrada; num redimensionamento o
    // texto volta ao normal para quebrar as linhas de novo
    if (splits.length) window.addEventListener('resize', () => splits.forEach((s) => s.revert()), { once: true });
    html.classList.add('pronto');
    tl.from('[data-topo]', { y: -24, opacity: 0, duration: 0.9 }, 0);
    if (splits.length) {
      tl.from(splits[0].lines, { yPercent: 112, duration: 1.15, stagger: 0.09 }, 0.08);
      tl.from(splits[1].lines, { yPercent: 112, duration: 1.15, stagger: 0.09 }, 0.34);
    } else {
      tl.from(partes, { y: 40, opacity: 0, duration: 1, stagger: 0.2 }, 0.1);
    }
    tl.from(cartoesFundo, { y: 140, x: 0, rotation: 0, opacity: 0, duration: 1.25, stagger: 0.1 }, 0.22);
    tl.from(frente.el, { y: 180, opacity: 0, scale: 0.94, duration: 1.3 }, 0.3);
    tl.from('.hero__nota', { opacity: 0, duration: 0.8 }, 1.1);
    tl.from(hero.querySelector('[data-busca]'), { x: -36, opacity: 0, duration: 1.1 }, 0.62);
    tl.from(hero.querySelectorAll('.hero__apoio, .hero__acoes'), { y: 26, opacity: 0, duration: 1, stagger: 0.1 }, 0.66);
    tl.from(hero.querySelectorAll('.regua__ponta'), { opacity: 0, duration: 0.8, stagger: 0.15 }, 0.8);
    tl.from(regua, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.2, ease: 'expo.inOut' }, 0.7);
    tl.fromTo(agulhaRegua, { left: '0%' }, { left: '100%', duration: 1.6, ease: 'expo.inOut' }, 0.95);
    tl.add(terminar, 1.05);
    return tl;
  }

  /* parallax sutil do hero ao rolar (desktop) */
  function parallaxHero() {
    if (!ST || M.reduzido || M.leve) return;
    const hero = $('[data-hero]');
    const conf = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 };
    g.to('.hero__a', { yPercent: -18, ease: 'none', scrollTrigger: conf });
    g.to('.hero__regua', { y: 40, opacity: 0.4, ease: 'none', scrollTrigger: conf });
  }

  /* ========================================================== o problema ==== */
  function iniciarProblema() {
    const sec = $('[data-problema]');
    const ruido = $('[data-ruido]', sec);
    const offs = [];

    // foco por grupo: hover/foco em um problema destaca os fragmentos dele
    const definirFoco = (g_) => { if (g_) ruido.dataset.foco = g_; else delete ruido.dataset.foco; };
    $$('[data-grupo-item]', ruido).forEach((item) => {
      offs.push(
        on(item, 'pointerenter', () => definirFoco(item.dataset.grupoItem)),
        on(item, 'pointerleave', () => definirFoco(null))
      );
    });

    // linha "ruído → sinal" desenhada pela rolagem
    const linha = $('[data-ponte-linha]', sec);
    const est = { t: 0 };
    const desenhar = () => {
      linha.setAttribute('d', MES.onda.caminho({
        x0: 0, x1: 1200, y: 60, amp: 22 + 8 * (1 - est.t), comp: 150, passo: 6,
        ruido: 1 - est.t, ampRuido: 46, seed: 3,
        envelope: (t) => 0.35 + 0.65 * Math.sin(Math.PI * t),
      }));
      linha.style.setProperty('--t', est.t.toFixed(3));
    };
    desenhar();
    return { est, desenhar, destruir: () => offs.forEach((f) => f()) };
  }

  function animarProblema(ctlProblema, { desktop }) {
    if (!ST || M.reduzido) {
      ctlProblema.est.t = 1;
      ctlProblema.desenhar();
      return;
    }
    const sec = $('[data-problema]');
    // título: palavras "fora de sintonia" que se acomodam (ruído → clareza)
    if (temSplit) {
      $$('[data-split]', sec).forEach((el, k) => {
        const r = semente(17 + k);
        const s = new window.SplitText(el, { type: 'words', aria: 'none' });
        g.from(s.words, {
          x: () => (r() * 2 - 1) * 22,
          y: () => (r() * 2 - 1) * 16,
          rotation: () => (r() * 2 - 1) * 7,
          opacity: 0.15,
          duration: 1.1,
          ease: 'power3.out',
          stagger: { each: 0.035, from: 'random' },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onComplete: () => s.revert(),
        });
      });
    }
    // fragmentos se espalham em profundidades diferentes
    const campo = $('[data-ruido-campo]', sec);
    if (!M.leve) {
      $$('[data-frag]', campo).forEach((f, i) => {
        const prof = ((i * 37) % 7) / 6 - 0.5; // -0.5..0.5
        g.fromTo(f, { y: 30 * prof, rotation: 0 }, {
          y: -40 * prof,
          rotation: (i % 2 ? 1 : -1) * 3,
          ease: 'none',
          scrollTrigger: { trigger: campo, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
        });
      });
    }
    // os três problemas: no celular, a rolagem destaca o grupo de cada um
    $$('[data-grupo-item]', sec).forEach((item) => {
      g.from(item, { opacity: 0.2, y: 20, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: item, start: 'top 88%', once: true } });
      if (!desktop) {
        ST.create({
          trigger: item, start: 'top 60%', end: 'bottom 40%',
          onToggle: (self) => { const r = $('[data-ruido]', sec); if (self.isActive) r.dataset.foco = item.dataset.grupoItem; else if (r.dataset.foco === item.dataset.grupoItem) delete r.dataset.foco; },
        });
      }
    });
    // ruído vira sinal
    g.to(ctlProblema.est, {
      t: 1, ease: 'none', onUpdate: ctlProblema.desenhar,
      scrollTrigger: { trigger: '[data-ponte]', start: 'top 92%', end: 'bottom 45%', scrub: 0.6 },
    });
    g.from('[data-ponte-txt]', { opacity: 0.2, y: 14, duration: 0.8, scrollTrigger: { trigger: '[data-ponte]', start: 'top 55%', once: true } });
  }

  /* ======================================================= como funciona ==== */
  const COMP_VOCE = 120;
  const ESTADOS = [
    // va: amplitude "você", vr: ruído "você", c: candidatos [opacidade, comprimento, fase], trava 0–1
    { va: 30, vr: 0.6, c: [[0, 70, 0.4], [0, 95, 1.2], [0, 140, 2.4], [0, 160, 3.1], [0, 190, 4]], trava: 0 },
    { va: 34, vr: 0, c: [[0.4, 70, 0.4], [0.4, 95, 1.2], [0.4, 140, 2.4], [0.4, 160, 3.1], [0.4, 190, 4]], trava: 0 },
    { va: 34, vr: 0, c: [[0, 70, 0.4], [0.65, 108, 1.7], [0.65, 124, 2.3], [0.65, 133, 3], [0, 190, 4]], trava: 0 },
    { va: 34, vr: 0, c: [[0, 70, 0.4], [0, 108, 1.7], [1, COMP_VOCE, 0], [0, 133, 3], [0, 190, 4]], trava: 1 },
  ];
  const STATUS = ['sintonizando você', 'buscando combinações', 'comparando perfis', 'em sintonia'];

  function achatar(e) {
    const o = { va: e.va, vr: e.vr, trava: e.trava };
    e.c.forEach((c, i) => { o['a' + i] = c[0]; o['l' + i] = c[1]; o['f' + i] = c[2]; });
    return o;
  }

  function iniciarComo() {
    const sec = $('[data-como]');
    const disp = $('[data-sintonizador]', sec);
    const osc = $('[data-osc]', disp);
    const voce = $('[data-osc-voce]', osc);
    const grupo = $('[data-osc-cands]', osc);
    const trava = $('[data-osc-trava]', osc);
    const ns = 'http://www.w3.org/2000/svg';
    const D = MES.dados;
    const offs = [];

    // ondas dos candidatos
    const cands = ESTADOS[0].c.map(() => {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('class', 'osc__cand');
      grupo.appendChild(p);
      return p;
    });
    // pulso de "travou" (anime.js) separado do anel que o GSAP controla
    const pulso = document.createElementNS(ns, 'circle');
    pulso.setAttribute('class', 'osc__pulso');
    pulso.setAttribute('cx', '300'); pulso.setAttribute('cy', '85'); pulso.setAttribute('r', '16');
    osc.appendChild(pulso);

    // escala do dial
    const escala = $('[data-escala]', disp);
    for (let i = 0; i <= 48; i++) {
      const t = document.createElement('i');
      t.style.left = (i / 48) * 100 + '%';
      if (i % 16 === 0) t.className = 'maior';
      escala.appendChild(t);
    }

    // telas 2–4: grade de perfis, trio e escolha
    const grade = $('[data-grade-perfis]', disp);
    const destaques = [1, 4, 7, 10, 13];
    grade.innerHTML = Array.from({ length: 15 }, (_, i) =>
      `<span class="tela__pessoa${destaques.includes(i) ? ' is-combina' : ''}"><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4" /><path d="M4.5 21c.8-4.2 3.8-6.6 7.5-6.6s6.7 2.4 7.5 6.6" /></svg></span>`
    ).join('');
    const trio = D.perfisHero.map((id) => D.perfis.find((p) => p.id === id));
    const valores = trio.map((p) => MES.calcularSintonia(p, D.buscaHero).valor);
    $('[data-trio]', disp).innerHTML = trio.map((p, i) => `
      <div class="mini-cartao">
        <div class="mini-cartao__foto">${MES.retrato(p)}</div>
        <p class="mini-cartao__nome">${p.nome.split(' ')[0]}</p>
        <p class="mini-cartao__valor">${valores[i]}%</p>
      </div>`).join('');
    $('[data-escolha]', disp).innerHTML = `
      <div class="mini-cartao mini-cartao--escolhido">
        <div class="mini-cartao__foto">${MES.retrato(trio[0])}</div>
        <div>
          <p class="mini-cartao__nome">${trio[0].nome}</p>
          <p class="mini-cartao__selo"><svg class="icone" aria-hidden="true"><use href="#i-check" /></svg> seu match</p>
        </div>
      </div>
      <p class="tela__nota">a escolha é sua</p>`;

    // estado das ondas
    const est = achatar(ESTADOS[0]);
    function render(alvo = est, svgVoce = voce, svgCands = cands, svgTrava = trava) {
      svgVoce.setAttribute('d', MES.onda.caminho({ x0: 0, x1: 600, y: 85, amp: alvo.va, comp: COMP_VOCE, passo: 5, ruido: alvo.vr, ampRuido: 40, seed: 9 }));
      svgCands.forEach((p, i) => {
        const a = alvo['a' + i];
        p.setAttribute('stroke-opacity', a.toFixed(3));
        p.setAttribute('d', a < 0.01 ? 'M0 85 H600' : MES.onda.caminho({ x0: 0, x1: 600, y: 85, amp: 30, comp: alvo['l' + i], fase: alvo['f' + i], passo: 6 }));
      });
      if (svgTrava) {
        svgTrava.setAttribute('opacity', alvo.trava.toFixed(3));
        svgTrava.setAttribute('r', (10 + 8 * alvo.trava).toFixed(2));
      }
    }
    render();

    // versão para telas pequenas: cada passo ganha a sua tela e a sua onda (estáticas)
    $$('.passo', sec).forEach((passo, i) => {
      const alvo = $('[data-passo-tela]', passo);
      const tela = $(`[data-tela="${i}"]`, disp).cloneNode(true);
      tela.classList.add('is-visivel');
      tela.removeAttribute('data-tela');
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 600 170');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('class', 'passo__osc');
      const pv = document.createElementNS(ns, 'path'); pv.setAttribute('class', 'osc__voce');
      const pc = ESTADOS[0].c.map(() => { const p = document.createElementNS(ns, 'path'); p.setAttribute('class', 'osc__cand'); svg.appendChild(p); return p; });
      svg.appendChild(pv);
      render(achatar(ESTADOS[i]), pv, pc, null);
      alvo.append(svg, tela);
    });

    // etapa ativa (funciona com ou sem GSAP)
    const passos = $$('.passo', sec);
    const status = $('[data-status]', disp);
    const canal = $('[data-canal]', disp);
    const led = $('[data-led]', disp);
    let etapa = -1;
    function ativar(i, { instantaneo = false } = {}) {
      if (i === etapa) return;
      const antes = etapa;
      etapa = i;
      passos.forEach((p, k) => p.classList.toggle('is-ativo', k === i));
      status.textContent = STATUS[i];
      canal.textContent = `etapa ${i + 1} de 4`;
      disp.dataset.etapa = i;
      if (instantaneo) {
        Object.assign(est, achatar(ESTADOS[i]));
        render();
        $$('[data-tela]', disp).forEach((t, k) => t.classList.toggle('is-visivel', k === i));
        $('[data-agulha]', disp).style.left = (i / 3) * 100 + '%';
      }
      if (i === 3 && antes !== 3 && A && !M.reduzido) {
        A.animate(pulso, { r: [16, 70], opacity: [0.9, 0], duration: 1100, ease: 'outCubic' });
        A.animate(led, { scale: [1, 1.8, 1], duration: 600, ease: 'outQuad' });
      }
    }

    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) ativar(+en.target.dataset.passo, { instantaneo: !ST || M.reduzido || !matchMedia('(min-width: 1024px)').matches });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    passos.forEach((p) => io.observe(p));
    ativar(0, { instantaneo: true });

    return { est, render, disp, ativar, destruir: () => { io.disconnect(); offs.forEach((f) => f()); } };
  }

  function animarComo(ctl, { desktop }) {
    if (!ST || M.reduzido) return;
    const sec = $('[data-como]');

    // título: as palavras "acendem" conforme a leitura avança
    if (temSplit) {
      const el = $('[data-split]', sec);
      const s = new window.SplitText(el, { type: 'words', aria: 'none' });
      g.fromTo(s.words, { opacity: 0.18 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 35%', scrub: true },
      });
    }

    if (!desktop) {
      // celular/tablet: a linha que liga os passos se desenha com a rolagem
      $$('.passo', sec).forEach((p) => {
        g.from($('[data-passo-tela]', p), { opacity: 0.25, y: 30, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 75%', once: true } });
      });
      g.fromTo('.passos', { '--linha': 0 }, { '--linha': 1, ease: 'none', scrollTrigger: { trigger: '.passos', start: 'top 70%', end: 'bottom 70%', scrub: true } });
      return;
    }

    // desktop: o aparelho fica fixo e a rolagem conduz a sintonia
    const disp = ctl.disp;
    const agulha = $('[data-agulha]', disp);
    const dial = $('.sintonizador__dial', disp);
    const telas = $$('[data-tela]', disp);
    const chips = $$('[data-tela="0"] [data-chip]', disp);
    const pessoas = $$('.tela__pessoa.is-combina', disp);
    const minis = $$('[data-tela="2"] .mini-cartao', disp);
    const escolhido = $('[data-tela="3"] .mini-cartao', disp);

    g.set(telas, { autoAlpha: 0 });
    g.set(telas[0], { autoAlpha: 1 });
    g.set(agulha, { left: 0 });

    const tl = g.timeline({
      defaults: { ease: 'power2.inOut' },
      onUpdate: () => ctl.render(),
      scrollTrigger: { trigger: '.passos', start: 'top 50%', end: 'bottom 60%', scrub: 0.7 },
    });
    // etapa 1: o seu sinal aparece enquanto você "conta" o que procura
    tl.from(chips, { scale: 0.6, opacity: 0, stagger: 0.12, duration: 0.25, ease: 'back.out(2)' }, 0.02);
    tl.to(ctl.est, { ...achatar(ESTADOS[0]), vr: 0.15, duration: 0.6 }, 0);
    // transições entre etapas
    for (let i = 1; i < 4; i++) {
      const t0 = i - 0.32;
      tl.to(ctl.est, { ...achatar(ESTADOS[i]), duration: 0.32 }, t0);
      tl.to(agulha, { left: (i / 3) * 100 + '%', duration: 0.32 }, t0);
      tl.to(telas[i - 1], { autoAlpha: 0, y: -16, duration: 0.16 }, t0);
      tl.fromTo(telas[i], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.2 }, t0 + 0.12);
    }
    tl.from(pessoas, { scale: 0.7, duration: 0.2, stagger: 0.04, ease: 'back.out(2)' }, 0.9);
    tl.from(minis, { y: 30, rotation: (k) => (k - 1) * 6, opacity: 0, stagger: 0.06, duration: 0.25 }, 1.86);
    tl.from(escolhido, { scale: 0.86, duration: 0.28, ease: 'back.out(1.8)' }, 2.86);
    tl.to({}, { duration: 0.4 }); // respiro no final
  }

  /* ========================================================= demonstração === */
  function animarDemo({ desktop }) {
    if (!ST) return;
    const b = MES.demo.baralho;
    if (!b) return;
    if (!M.reduzido) {
      b.esconderParaEntrada();
      ST.create({ trigger: '[data-demo-baralho]', start: 'top 80%', once: true, onEnter: () => b.entrar() });
      const titulo = $('[data-demo] [data-split]');
      if (temSplit && titulo) {
        const s = new window.SplitText(titulo, { type: 'lines', mask: 'lines', linesClass: 'linha', aria: 'none' });
        g.from(s.lines, { yPercent: 110, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: titulo, start: 'top 85%', once: true }, onComplete: () => s.revert() });
      }
      if (desktop) {
        g.from('[data-prefs] .prefs__grupo', { x: -24, opacity: 0.25, duration: 0.9, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '[data-app]', start: 'top 75%', once: true } });
      }
    }
  }

  /* SVGs esticados (preserveAspectRatio="none"): em telas estreitas a onda
     ficaria espremida; este fator mantém o comprimento de onda agradável */
  function comprimentoRelativo(svg, larguraVB) {
    const w = svg.clientWidth || svg.getBoundingClientRect().width || larguraVB;
    return clamp((larguraVB / w) * 0.5, 1, 2.4);
  }

  /* ====================================================== para quem é ===== */
  function animarPublicos({ desktop }) {
    const sec = $('[data-publicos]');
    const a = $('[data-onda-a]', sec), b = $('[data-onda-b]', sec), no = $('[data-no]', sec);
    const est = { p: 0 };
    const svg = a.ownerSVGElement;
    const desenhar = () => {
      const p = est.p;
      const comp = 110 * comprimentoRelativo(svg, 1200);
      const ex = 600 * (0.25 + 0.75 * p); // até onde cada onda chega
      a.setAttribute('d', MES.onda.caminho({ x0: 0, x1: ex, y: 60, amp: 18, comp, passo: 5, envelope: (t) => Math.min(1, t * 3) }));
      // a onda da direita começa em fase com a da esquerda (contínua no encontro) mais uma defasagem que some com a rolagem
      b.setAttribute('d', MES.onda.caminho({ x0: 1200 - ex, x1: 1200, y: 60, amp: 18, comp, passo: 5, fase: ((1200 - ex) / comp) * Math.PI * 2 + (1 - p) * Math.PI, envelope: (t) => Math.min(1, (1 - t) * 3) }));
    };
    if (!ST || M.reduzido) {
      est.p = 1; desenhar();
      return;
    }
    desenhar();
    g.to(est, { p: 1, ease: 'none', onUpdate: desenhar, scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 25%', scrub: 0.6 } });
    g.from(no, { scale: 0, rotation: -90, duration: 0.8, ease: 'back.out(2)', scrollTrigger: { trigger: sec, start: 'top 35%', once: true } });
    // título: as duas metades da frase chegam de lados opostos
    const titulo = $('.publicos__titulo', sec);
    if (temSplit) {
      const s = new window.SplitText(titulo, { type: 'words', aria: 'auto' });
      const meio = Math.ceil(s.words.length / 2);
      g.from(s.words.slice(0, meio), { x: -60, opacity: 0.15, duration: 1, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: titulo, start: 'top 85%', once: true } });
      g.from(s.words.slice(meio), { x: 60, opacity: 0.15, duration: 1, stagger: { each: 0.05, from: 'end' }, ease: 'expo.out', scrollTrigger: { trigger: titulo, start: 'top 85%', once: true }, onComplete: () => s.revert() });
    }
    if (desktop && !M.leve) {
      g.fromTo('.lado--busca', { x: -36 }, { x: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 90%', end: 'top 30%', scrub: 0.6 } });
      g.fromTo('.lado--psi', { x: 36 }, { x: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 90%', end: 'top 30%', scrub: 0.6 } });
    }
  }

  /* ========================================================== encerramento === */
  function animarFinal() {
    const sec = $('[data-final]');
    const a = $('[data-final-a]', sec), b = $('[data-final-b]', sec);
    const est = { p: 0 };
    const svg = a.ownerSVGElement;
    const desenhar = () => {
      const p = est.p;
      const base = { x0: 0, x1: 1440, y: 110, comp: 240 * comprimentoRelativo(svg, 1440), passo: 6, envelope: (t) => 0.4 + 0.6 * Math.sin(Math.PI * t) };
      a.setAttribute('d', MES.onda.caminho({ ...base, amp: 46 + 18 * (1 - p), fase: 0 }));
      b.setAttribute('d', MES.onda.caminho({ ...base, amp: 46 + 18 * (1 - p), fase: (1 - p) * Math.PI * 1.15 }));
      sec.style.setProperty('--sintonia', p.toFixed(3));
    };
    const tituloEl = $('.final__titulo', sec);
    const off = ligarEcoHover(tituloEl);
    if (!ST || M.reduzido) {
      est.p = 1; desenhar();
      return off;
    }
    desenhar();
    g.to(est, { p: 1, ease: 'none', onUpdate: desenhar, scrollTrigger: { trigger: sec, start: 'top 75%', end: 'center 55%', scrub: 0.7 } });
    const titulo = $('[data-split-final]', sec);
    if (temSplit) {
      const s = new window.SplitText(titulo, { type: 'lines', mask: 'lines', linesClass: 'linha', aria: 'none', ignore: '.match' });
      g.from(s.lines, {
        yPercent: 112, duration: 1.2, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: titulo, start: 'top 80%', once: true },
        onStart: () => sintonizarMatch(tituloEl, 500),
      });
      const desfazer = () => s.revert();
      window.addEventListener('resize', desfazer, { once: true });
      const offAnterior = off;
      return () => { offAnterior(); window.removeEventListener('resize', desfazer); };
    }
    ST.create({ trigger: titulo, start: 'top 80%', once: true, onEnter: () => sintonizarMatch(tituloEl, 200) });
    g.from('[data-verbos] span', { y: 20, opacity: 0.2, stagger: 0.18, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '[data-verbos]', start: 'top 88%', once: true } });
    return off;
  }

  /* ================================================================ início === */
  function iniciar() {
    limpezas.push(iniciarLinks());
    limpezas.push(menu.iniciar());
    limpezas.push(iniciarTopo());
    limpezas.push(iniciarBotoes());
    MES.perfilDialogo.init();
    MES.avisoPsicologos.init();
    MES.demo.init();
    limpezas.push(() => MES.demo.destruir());

    const heroCtl = iniciarHero();
    const problemaCtl = iniciarProblema();
    const comoCtl = iniciarComo();
    limpezas.push(heroCtl.destruir, problemaCtl.destruir, comoCtl.destruir);

    fontesProntas.then(() => {
      const tl = introHero(heroCtl);
      if (!g) {
        // sem GSAP: estados finais estáticos
        problemaCtl.est.t = 1; problemaCtl.desenhar();
        animarPublicos({ desktop: true });
        animarFinal();
        return;
      }
      // animações que dependem do tamanho da tela e de reduced motion
      const mm = g.matchMedia();
      mm.add(
        { desktop: '(min-width: 1024px)', menor: '(max-width: 1023px)', reduzido: '(prefers-reduced-motion: reduce)' },
        (ctx) => {
          const { desktop } = ctx.conditions;
          parallaxHero();
          animarProblema(problemaCtl, { desktop });
          animarComo(comoCtl, { desktop });
          animarDemo({ desktop });
          animarPublicos({ desktop });
          const offFinal = animarFinal();
          return () => {
            if (offFinal) offFinal();
            // ao trocar de layout, o sintonizador volta ao estado da etapa ativa
            comoCtl.ativar(0, { instantaneo: true });
          };
        }
      );
      limpezas.push(() => mm.revert(), () => tl && tl.kill());
      if (ST) ST.refresh();
    });
  }

  MES.destruir = function () {
    while (limpezas.length) {
      const f = limpezas.pop();
      try { if (typeof f === 'function') f(); } catch (e) { /* segue limpando */ }
    }
  };

  iniciar();
})();
