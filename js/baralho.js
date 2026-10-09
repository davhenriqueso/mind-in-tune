(function () {
  'use strict';

  const { $, $$, clamp } = MES.util;

  const POSES = {
    normal: [
      { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
      { x: 26, y: 26, rotation: 3, scale: 0.96, opacity: 1 },
      { x: -24, y: 42, rotation: -3.5, scale: 0.92, opacity: 1 },
      { x: 0, y: 50, rotation: 0, scale: 0.88, opacity: 0 },
    ],
    compacta: [
      { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
      { x: 14, y: 18, rotation: 2.5, scale: 0.96, opacity: 1 },
      { x: -12, y: 30, rotation: -3, scale: 0.92, opacity: 1 },
      { x: 0, y: 36, rotation: 0, scale: 0.88, opacity: 0 },
    ],
  };

  function prepararFoto(cartao) {
    const foto = $('.cartao__foto', cartao);
    const img = $('img', foto);
    const nome = $('.cartao__nome', cartao).textContent.trim().split(/\s+/);
    foto.dataset.iniciais = (nome[0][0] + (nome.length > 1 ? nome[nome.length - 1][0] : '')).toUpperCase();
    const semFoto = () => foto.classList.add('sem-foto');
    if (img.complete && !img.naturalWidth) semFoto();
    else img.addEventListener('error', semFoto);
  }

  class Baralho {
    constructor(el) {
      this.el = el;
      this.status = $('[data-baralho-status]');
      this.cartoes = $$('.cartao', el).map((c) => {
        prepararFoto(c);
        return { el: c, nome: $('.cartao__nome', c).textContent, sint: new MES.Sintonia($('[data-sintonia]', c)) };
      });
      this.atual = 0;
      this.ocupado = false;

      const mq = window.matchMedia('(max-width: 899px)');
      const definirPoses = () => { this.poses = mq.matches ? POSES.compacta : POSES.normal; };
      definirPoses();
      mq.addEventListener('change', () => { definirPoses(); this.aplicarPoses(false); });

      this.aplicarPoses(false);
      this.ligarArrasto();
    }

    get frente() {
      return this.cartoes[this.atual];
    }

    posicao(c) {
      const n = this.cartoes.length;
      return (this.cartoes.indexOf(c) - this.atual + n) % n;
    }

    pose(pos) {
      return this.poses[Math.min(pos, this.poses.length - 1)];
    }

    aplicarPoses(animar = true, escalonar = 0) {
      this.cartoes.forEach((c) => {
        const pos = this.posicao(c);
        const pose = this.pose(pos);
        c.el.dataset.pos = pos;
        c.el.style.zIndex = 20 - pos;
        c.el.toggleAttribute('inert', pos !== 0);
        if (!window.gsap) {
          c.el.style.transform = `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotation}deg) scale(${pose.scale})`;
          c.el.style.opacity = pose.opacity;
        } else if (animar && MES.anima()) {
          gsap.to(c.el, { ...pose, duration: 0.62, ease: 'expo.out', delay: escalonar * pos, overwrite: 'auto' });
        } else {
          gsap.set(c.el, pose);
        }
      });
    }

    proximo(dir = -1) {
      if (this.ocupado || this.cartoes.length < 2) return;
      const saindo = this.frente;
      const concluir = () => {
        this.atual = (this.atual + 1) % this.cartoes.length;
        if (MES.anima()) {
          const p = this.pose(this.posicao(saindo));
          gsap.set(saindo.el, { x: p.x * 0.4, y: p.y + 30, rotation: p.rotation, scale: p.scale * 0.94, opacity: 0 });
        }
        this.aplicarPoses(true, 0.04);
        this.frente.sint.sintonizar({ duracao: 1 });
        this.status.textContent = `${this.frente.nome}, ${this.frente.sint.valor}% de sintonia.`;
      };
      if (!MES.anima()) return concluir();
      this.ocupado = true;
      gsap.to(saindo.el, {
        x: dir * (this.el.offsetWidth * 0.9 + 80), y: '+=12', rotation: dir * 14, opacity: 0,
        duration: 0.38, ease: 'power2.in', overwrite: 'auto',
        onComplete: () => { this.ocupado = false; concluir(); },
      });
    }

    ligarArrasto() {
      let ativo = null, x0 = 0, y0 = 0, dx = 0, t0 = 0, horizontal = null;

      this.el.addEventListener('pointerdown', (e) => {
        if (e.button > 0 || this.ocupado || !MES.anima()) return;
        const card = e.target.closest('.cartao');
        if (card !== this.frente.el) return;
        ativo = card; x0 = e.clientX; y0 = e.clientY; dx = 0; t0 = performance.now(); horizontal = null;
      });

      window.addEventListener('pointermove', (e) => {
        if (!ativo) return;
        const mx = e.clientX - x0, my = e.clientY - y0;
        if (horizontal === null && Math.hypot(mx, my) > 6) {
          horizontal = Math.abs(mx) > Math.abs(my);
          if (!horizontal) { ativo = null; return; }
          ativo.setPointerCapture(e.pointerId);
          ativo.classList.add('is-arrastando');
        }
        if (!horizontal) return;
        dx = mx;
        gsap.set(ativo, { x: dx, rotation: clamp(dx * 0.06, -16, 16), y: Math.abs(dx) * 0.05 });
      }, { passive: true });

      const soltar = () => {
        if (!ativo) return;
        const card = ativo;
        ativo = null;
        card.classList.remove('is-arrastando');
        if (!horizontal) return;
        const vel = Math.abs(dx) / Math.max(1, performance.now() - t0);
        if (Math.abs(dx) > 110 || (Math.abs(dx) > 40 && vel > 0.6)) this.proximo(dx < 0 ? -1 : 1);
        else gsap.to(card, { ...this.pose(0), duration: 0.55, ease: 'back.out(1.8)' });
      };
      window.addEventListener('pointerup', soltar);
      window.addEventListener('pointercancel', soltar);
    }
  }

  MES.Baralho = Baralho;
})();
