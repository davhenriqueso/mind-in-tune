/* =============================================================================
   Utilidades compartilhadas
   -----------------------------------------------------------------------------
   - MES.util ........ atalhos de DOM e matemática
   - MES.movimento ... preferências de movimento (reduced motion, modo leve)
   - MES.onda ........ gera os caminhos SVG das ondas (o "sinal" da marca)
   - MES.fx .......... atalhos do anime.js que respeitam reduced motion
   - MES.calcularSintonia ... índice ILUSTRATIVO usado nas demonstrações
   - MES.Sintonia .... componente do medidor de sintonia (anime.js)

   Divisão de responsabilidades das bibliotecas:
   GSAP + ScrollTrigger  → entrada do hero, títulos, tudo ligado à rolagem,
                           composição dos cartões (baralho), menu e diálogos.
   anime.js              → microinterações (botões, chips), medidores de
                           sintonia, linhas de conexão e pequenos detalhes.
   Nenhum elemento é animado pelas duas bibliotecas.
   ============================================================================= */
window.MES = window.MES || {};

(function () {
  'use strict';

  /* ---------------------------------------------------------------- util --- */
  const util = {
    $: (sel, ctx = document) => ctx.querySelector(sel),
    $$: (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)),
    clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    // gerador pseudoaleatório determinístico (mesma "bagunça" a cada carga)
    semente(seed) {
      let s = seed >>> 0;
      return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    // registra um listener e devolve a função que o remove
    on(alvo, evento, fn, op) {
      alvo.addEventListener(evento, fn, op);
      return () => alvo.removeEventListener(evento, fn, op);
    },
    esperar: (ms) => new Promise((r) => setTimeout(r, ms)),
  };
  MES.util = util;

  /* ----------------------------------------------------------- movimento --- */
  const mqReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mqGrosso = window.matchMedia('(pointer: coarse)');
  const nav = navigator;
  const leve =
    /[?&]leve\b/.test(location.search) ||
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) ||
    (nav.deviceMemory && nav.deviceMemory <= 2) ||
    (nav.connection && nav.connection.saveData) ||
    false;

  MES.movimento = {
    get reduzido() { return mqReduzido.matches; },
    get toque() { return mqGrosso.matches; },
    leve: !!leve,
    gsap: typeof window.gsap !== 'undefined',
    anime: typeof window.anime !== 'undefined' && typeof window.anime.animate === 'function',
    aoMudarReduzido(fn) { return util.on(mqReduzido, 'change', fn); },
  };

  /* ---------------------------------------------------------------- onda --- */
  /**
   * Caminho de uma onda senoidal (com ruído opcional).
   * @param {object} o
   *  x0, x1   intervalo horizontal          y        linha central
   *  amp      amplitude                      comp     comprimento de onda
   *  fase     fase em radianos               passo    distância entre pontos
   *  ruido    0–1 mistura de ruído           seed     semente do ruído
   *  envelope função(t 0–1) → multiplicador da amplitude (opcional)
   */
  function caminho(o) {
    const x0 = o.x0 ?? 0, x1 = o.x1 ?? 100, y = o.y ?? 50;
    const amp = o.amp ?? 10, comp = o.comp ?? 40, fase = o.fase ?? 0;
    const passo = o.passo ?? 3, ruido = o.ruido ?? 0;
    const tabela = ruido ? tabelaRuido(o.seed ?? 7) : null;
    let d = '';
    for (let x = x0; x <= x1 + 0.001; x += passo) {
      const t = (x - x0) / Math.max(1, x1 - x0);
      const env = o.envelope ? o.envelope(t) : 1;
      let v = Math.sin(((x - x0) / comp) * Math.PI * 2 + fase) * amp * env;
      if (tabela) {
        const i = Math.floor(x / passo) % tabela.length;
        v = v * (1 - ruido) + tabela[i] * (o.ampRuido ?? amp * 1.6) * ruido;
      }
      d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + (y + v).toFixed(2);
    }
    return d;
  }
  const cacheRuido = new Map();
  function tabelaRuido(seed) {
    if (cacheRuido.has(seed)) return cacheRuido.get(seed);
    const r = util.semente(seed);
    const t = [];
    let ant = 0;
    for (let i = 0; i < 1024; i++) {
      // ruído "de rádio": picos irregulares suavizados de leve
      const alvo = (r() * 2 - 1) * (r() < 0.12 ? 1 : 0.45);
      ant = ant * 0.35 + alvo * 0.65;
      t.push(ant);
    }
    cacheRuido.set(seed, t);
    return t;
  }
  MES.onda = { caminho };

  /* ------------------------------------------------------------------ fx --- */
  // Atalhos do anime.js. Com reduced motion (ou sem a biblioteca) o estado
  // final é aplicado na hora, sem animação.
  const fx = {
    animate(alvos, params) {
      if (!MES.movimento.anime) return null;
      const a = window.anime;
      if (MES.movimento.reduzido) {
        const final = {};
        for (const k in params) {
          if (['duration', 'delay', 'ease', 'loop', 'alternate', 'autoplay', 'onUpdate', 'onComplete', 'onBegin', 'onRender', 'composition', 'playbackEase', 'loopDelay', 'frameRate', 'modifier', 'keyframes'].includes(k)) continue;
          let v = params[k];
          if (Array.isArray(v)) v = v[v.length - 1];
          if (v && typeof v === 'object' && 'to' in v) v = v.to;
          final[k] = v;
        }
        a.utils.set(alvos, final);
        if (params.onUpdate) params.onUpdate();
        if (params.onComplete) params.onComplete();
        return null;
      }
      return a.animate(alvos, params);
    },
    set(alvos, props) {
      if (MES.movimento.anime) window.anime.utils.set(alvos, props);
    },
    remover(alvos) {
      if (MES.movimento.anime) window.anime.utils.remove(alvos);
    },
  };
  MES.fx = fx;

  /* --------------------------------------------------- índice de sintonia --- */
  /**
   * Índice ILUSTRATIVO de compatibilidade da demonstração.
   * Compara só preferências declaradas com dados fictícios do perfil.
   * Não é avaliação clínica. Devolve { valor, comuns: [{tipo, id, rotulo}] }.
   */
  MES.calcularSintonia = function (perfil, prefs) {
    const D = MES.dados;
    const comuns = [];
    let s = 46;
    const temas = prefs.temas || [];
    if (temas.length) {
      const inter = perfil.temas.filter((t) => temas.includes(t));
      inter.forEach((t) => comuns.push({ tipo: 'tema', id: t, rotulo: rotuloDe(D.temas, t) }));
      s += Math.round((30 * inter.length) / Math.min(temas.length, 3));
      if (temas.includes(perfil.temas[0])) s += 2;
    } else {
      s += 12;
    }
    if (prefs.formato === 'tanto-faz') {
      s += 6;
    } else if (perfil.formatos.includes(prefs.formato)) {
      s += 6;
      comuns.push({ tipo: 'formato', id: prefs.formato, rotulo: rotuloDe(D.formatos, prefs.formato) });
    } else {
      s -= 4;
    }
    if (prefs.abordagem === 'sem-preferencia') {
      s += 4;
    } else if (perfil.abordagem === prefs.abordagem) {
      s += 8;
      comuns.push({ tipo: 'abordagem', id: prefs.abordagem, rotulo: rotuloDe(D.abordagens, prefs.abordagem) });
    }
    (prefs.extras || []).forEach((e) => {
      if (perfil.extras.includes(e)) {
        s += 3;
        comuns.push({ tipo: 'extra', id: e, rotulo: rotuloDe(D.extras, e) });
      } else {
        s -= 2;
      }
    });
    return { valor: util.clamp(Math.round(s), 35, 97), comuns };
  };
  function rotuloDe(lista, id) {
    const item = lista.find((i) => i.id === id);
    return item ? item.rotulo : id;
  }
  MES.rotuloDe = rotuloDe;

  /* ------------------------------------------------- medidor de sintonia --- */
  // Duas ondas: "você" e o profissional. Quanto maior o índice, menor a
  // defasagem entre elas. O valor nunca chega a 100%: sintonia não é encaixe
  // perfeito, e a interface não promete isso.
  const LARG = 160, ALT = 36, COMP = 40, AMP = 10;

  function deslocDe(v) {
    return (COMP / 2) * Math.pow(1 - util.clamp(v, 0, 100) / 100, 0.75);
  }

  class Sintonia {
    static markup(valor, op = {}) {
      const rotulo = op.rotulo || 'de sintonia';
      return `
<div class="sintonia${op.classe ? ' ' + op.classe : ''}" data-sintonia data-valor="${valor}">
  <svg class="sintonia__ondas" viewBox="0 0 ${LARG} ${ALT}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path class="sintonia__base" d="M0 ${ALT / 2} H${LARG}" />
    <path class="sintonia__psi" data-onda-psi d="" />
    <path class="sintonia__voce" data-onda-voce d="" />
  </svg>
  <p class="sintonia__valor"><span class="sintonia__num" data-num>${valor}</span><span class="sintonia__pct">%</span></p>
  <p class="sintonia__rotulo">${rotulo}</p>
</div>`;
    }

    constructor(el) {
      this.el = el;
      this.voce = el.querySelector('[data-onda-voce]');
      this.psi = el.querySelector('[data-onda-psi]');
      this.num = el.querySelector('[data-num]');
      this.valor = +el.dataset.valor || 0;
      this.estado = { desloc: deslocDe(this.valor), fase: 0, amp: AMP, n: this.valor };
      this.anim = null;
      this.render();
    }

    render() {
      const e = this.estado;
      const base = { x0: -COMP, x1: LARG + COMP, y: ALT / 2, amp: e.amp, comp: COMP, passo: 2.5 };
      this.voce.setAttribute('d', caminho({ ...base, fase: e.fase }));
      this.psi.setAttribute('d', caminho({ ...base, fase: e.fase - (e.desloc / COMP) * Math.PI * 2 }));
      this.num.textContent = Math.round(e.n);
    }

    // Vai para um valor. `sintonizar` faz a varredura completa (fora de fase → valor).
    definir(valor, { animar = true, sintonizar = false, duracao = 1300, atraso = 0 } = {}) {
      this.valor = valor;
      this.el.dataset.valor = valor;
      if (this.anim) { this.anim.pause(); this.anim = null; }
      const alvo = { desloc: deslocDe(valor), n: valor, amp: AMP };
      if (!animar || !MES.movimento.anime || MES.movimento.reduzido) {
        Object.assign(this.estado, alvo, { fase: 0 });
        this.render();
        return;
      }
      if (sintonizar) {
        Object.assign(this.estado, { desloc: COMP / 2, n: 0, fase: 0, amp: AMP * 0.35 });
        this.render();
      }
      this.anim = window.anime.animate(this.estado, {
        desloc: alvo.desloc,
        n: alvo.n,
        amp: [{ to: AMP * 1.15, duration: duracao * 0.55 }, { to: AMP, duration: duracao * 0.45 }],
        fase: this.estado.fase + Math.PI * (sintonizar ? 3 : 1.2),
        duration: duracao,
        delay: atraso,
        ease: 'out(3)',
        onUpdate: () => this.render(),
      });
    }

    // Pequena "oscilação" quando o usuário passa o mouse: as ondas correm e voltam.
    pulsar() {
      if (!MES.movimento.anime || MES.movimento.reduzido || (this.anim && !this.anim.completed)) return;
      this.anim = window.anime.animate(this.estado, {
        fase: this.estado.fase + Math.PI * 2,
        duration: 900,
        ease: 'inOut(2)',
        onUpdate: () => this.render(),
      });
    }

    destruir() {
      if (this.anim) this.anim.pause();
      this.anim = null;
    }
  }
  MES.Sintonia = Sintonia;
})();
