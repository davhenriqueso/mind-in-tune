window.MES = window.MES || {};

(function () {
  'use strict';

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const mqReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');

  MES.util = {
    $: (sel, ctx = document) => ctx.querySelector(sel),
    $$: (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)),
    clamp,
  };
  MES.anima = () => !!window.gsap && !mqReduzido.matches;

  function caminho(o) {
    const x0 = o.x0 ?? 0, x1 = o.x1 ?? 100, y = o.y ?? 50;
    const amp = o.amp ?? 10, comp = o.comp ?? 40, fase = o.fase ?? 0;
    const passo = o.passo ?? 3, ruido = o.ruido ?? 0;
    const tabela = ruido ? tabelaRuido() : null;
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

  let cacheRuido = null;
  function tabelaRuido() {
    if (cacheRuido) return cacheRuido;
    let s = 3;
    const aleatorio = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    cacheRuido = [];
    let ant = 0;
    for (let i = 0; i < 1024; i++) {
      const alvo = (aleatorio() * 2 - 1) * (aleatorio() < 0.12 ? 1 : 0.45);
      ant = ant * 0.35 + alvo * 0.65;
      cacheRuido.push(ant);
    }
    return cacheRuido;
  }

  MES.onda = { caminho };

  const LARG = 160, ALT = 36, COMP = 40, AMP = 10;
  const deslocDe = (v) => (COMP / 2) * Math.pow(1 - clamp(v, 0, 100) / 100, 0.75);

  class Sintonia {
    constructor(el) {
      this.num = el.querySelector('.sintonia__num');
      this.valor = parseInt(this.num.textContent, 10) || 0;
      el.insertAdjacentHTML('afterbegin', `
        <svg class="sintonia__ondas" viewBox="0 0 ${LARG} ${ALT}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path class="sintonia__base" d="M0 ${ALT / 2} H${LARG}" />
          <path class="sintonia__psi" />
          <path class="sintonia__voce" />
        </svg>`);
      this.psi = el.querySelector('.sintonia__psi');
      this.voce = el.querySelector('.sintonia__voce');
      this.estado = { desloc: deslocDe(this.valor), fase: 0, amp: AMP, n: this.valor };
      this.render();
    }

    render() {
      const e = this.estado;
      const base = { x0: -COMP, x1: LARG + COMP, y: ALT / 2, amp: e.amp, comp: COMP, passo: 2.5 };
      this.voce.setAttribute('d', caminho({ ...base, fase: e.fase }));
      this.psi.setAttribute('d', caminho({ ...base, fase: e.fase - (e.desloc / COMP) * Math.PI * 2 }));
      this.num.textContent = Math.round(e.n);
    }

    sintonizar({ duracao = 1.3, atraso = 0 } = {}) {
      if (!MES.anima()) return;
      const e = this.estado;
      gsap.killTweensOf(e);
      Object.assign(e, { desloc: COMP / 2, n: 0, fase: 0, amp: AMP * 0.35 });
      this.render();
      gsap.to(e, {
        desloc: deslocDe(this.valor), n: this.valor, fase: Math.PI * 3,
        duration: duracao, delay: atraso, ease: 'power2.out',
        onUpdate: () => this.render(),
      });
      gsap.to(e, { keyframes: [{ amp: AMP * 1.15, duration: duracao * 0.55 }, { amp: AMP, duration: duracao * 0.45 }], delay: atraso });
    }
  }

  MES.Sintonia = Sintonia;
})();
