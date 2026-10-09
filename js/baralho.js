/* =============================================================================
   Baralho de perfis (usado no hero e na demonstração)
   -----------------------------------------------------------------------------
   Monta os cartões, controla a ordem e a pose de cada um na pilha.
   - GSAP: posição/rotação/opacidade dos cartões (composição da pilha)
   - anime.js: só o medidor de sintonia dentro de cada cartão (MES.Sintonia)
   Funciona sem as bibliotecas: os cartões só não se movem.
   ============================================================================= */
window.MES = window.MES || {};

(function () {
  'use strict';
  const { $$, on, clamp } = MES.util;

  const POSES = {
    demo: [
      { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
      { x: 0, y: 16, rotation: 2.2, scale: 0.95, opacity: 1 },
      { x: 0, y: 30, rotation: -2.4, scale: 0.9, opacity: 1 },
      { x: 0, y: 40, rotation: 0, scale: 0.86, opacity: 0 },
    ],
    hero: [
      { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
      { x: 26, y: 26, rotation: 3, scale: 0.96, opacity: 1 },
      { x: -24, y: 42, rotation: -3.5, scale: 0.92, opacity: 1 },
      { x: 0, y: 50, rotation: 0, scale: 0.88, opacity: 0 },
    ],
    heroCompacto: [
      { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
      { x: 14, y: 18, rotation: 2.5, scale: 0.96, opacity: 1 },
      { x: -12, y: 30, rotation: -3, scale: 0.92, opacity: 1 },
      { x: 0, y: 36, rotation: 0, scale: 0.88, opacity: 0 },
    ],
  };

  function cidadeCurta(cidade) {
    return cidade.split(',')[0];
  }

  function cartaoMarkup(perfil, res, variante) {
    const D = MES.dados;
    const abord = D.abordagens.find((a) => a.id === perfil.abordagem);
    const tagNome = variante === 'demo' ? 'h3' : 'p';
    const formatos = perfil.formatos
      .map((f) =>
        f === 'online'
          ? `<li class="atributo" data-chave="formato:online"><svg class="icone" aria-hidden="true"><use href="#i-video" /></svg>atende online</li>`
          : `<li class="atributo" data-chave="formato:presencial"><svg class="icone" aria-hidden="true"><use href="#i-pino" /></svg>presencial em ${cidadeCurta(perfil.cidade)}</li>`
      )
      .join('');
    const temas = perfil.temas
      .map((t) => `<li class="etiqueta" data-chave="tema:${t}">${MES.rotuloDe(D.temas, t)}</li>`)
      .join('');
    const acoesHero =
      variante === 'hero'
        ? `<div class="cartao__acoes">
            <button class="cartao__passar" type="button" data-cartao-passar><svg class="icone" aria-hidden="true"><use href="#i-x" /></svg><span>passar</span></button>
            <button class="botao botao--primario botao--p cartao__conhecer" type="button" data-cartao-conhecer data-botao><span class="botao__rotulo">conhecer perfil</span></button>
          </div>`
        : '';
    const intro = variante === 'demo' ? `<p class="cartao__intro">${perfil.intro}</p>` : '';

    return `
<article class="cartao cartao--${variante}" data-cartao="${perfil.id}">
  <div class="cartao__foto">
    ${MES.retrato(perfil, { enquadramento: 'largo' })}
    <span class="cartao__selo">perfil fictício</span>
  </div>
  <div class="cartao__corpo">
    <div class="cartao__cabeca">
      <${tagNome} class="cartao__nome">${perfil.nome}</${tagNome}>
      <span class="cartao__pronomes">${perfil.pronomes}</span>
    </div>
    <p class="cartao__papel">${perfil.papel}, ${perfil.cidade}</p>
    <ul class="cartao__atributos">
      <li class="atributo" data-chave="abordagem:${perfil.abordagem}"><svg class="icone" aria-hidden="true"><use href="#i-livro" /></svg>${abord ? abord.rotulo : ''}</li>
      ${formatos}
    </ul>
    ${intro}
    <ul class="etiquetas" aria-label="temas">${temas}</ul>
    ${MES.Sintonia.markup(res.valor)}
    ${acoesHero}
  </div>
</article>`;
  }

  class Baralho {
    /**
     * @param {HTMLElement} el
     * @param {object} op { perfis, resultados (Map id→res), variante, aoMudar, aoConhecer }
     */
    constructor(el, op) {
      this.el = el;
      this.variante = op.variante || 'demo';
      this.aoMudar = op.aoMudar || (() => {});
      this.aoConhecer = op.aoConhecer || (() => {});
      this.cartoes = new Map();
      this.ordem = [];
      this.atual = 0;
      this.ocupado = false;
      this.limpezas = [];
      this.poses = POSES[op.poses || this.variante] || POSES.demo;
      this.gsap = MES.movimento.gsap ? window.gsap : null;
      this.montar(op.perfis, op.resultados, op.ordem);
    }

    montar(perfis, resultados, ordem) {
      this.el.innerHTML = '';
      perfis.forEach((p) => {
        const res = resultados.get(p.id);
        const tmp = document.createElement('div');
        tmp.innerHTML = cartaoMarkup(p, res, this.variante).trim();
        const el = tmp.firstElementChild;
        this.el.appendChild(el);
        const sint = new MES.Sintonia(el.querySelector('[data-sintonia]'));
        this.cartoes.set(p.id, { el, perfil: p, res, sint });
        this.marcarComuns(p.id, res);
      });
      this.ordem = ordem ? ordem.slice() : perfis.map((p) => p.id);
      this.atual = 0;
      this.aplicarPoses(false);
      this.ligarEventos();
      this.anunciar();
    }

    /* destaca no cartão o que bate com a busca (etiquetas e atributos) */
    marcarComuns(id, res) {
      const c = this.cartoes.get(id);
      const chaves = new Set(res.comuns.map((x) => x.tipo + ':' + x.id));
      $$('[data-chave]', c.el).forEach((n) => {
        const comum = chaves.has(n.dataset.chave);
        n.toggleAttribute('data-comum', comum);
      });
      c.el.setAttribute('aria-label', `${c.perfil.nome}, ${res.valor}% de sintonia ilustrativa`);
    }

    posicaoDe(id) {
      const i = this.ordem.indexOf(id);
      const n = this.ordem.length;
      return (i - this.atual + n) % n;
    }

    poseDe(pos) {
      return this.poses[Math.min(pos, this.poses.length - 1)];
    }

    get frente() {
      return this.cartoes.get(this.ordem[this.atual]);
    }

    /* aplica a pose de cada cartão (com ou sem animação) */
    aplicarPoses(animar = true, op = {}) {
      if (animar) this.aguardandoEntrada = false;
      this.cartoes.forEach((c, id) => {
        const pos = this.posicaoDe(id);
        const pose = this.poseDe(pos);
        c.el.dataset.pos = pos;
        c.el.style.zIndex = String(20 - pos);
        c.el.toggleAttribute('inert', pos !== 0);
        if (op.exceto === id) return;
        if (this.gsap) {
          if (animar && !MES.movimento.reduzido) {
            this.gsap.to(c.el, { ...pose, duration: op.duracao || 0.62, ease: 'expo.out', delay: (op.escalonar || 0) * pos, overwrite: 'auto' });
          } else {
            this.gsap.set(c.el, pose);
          }
        } else {
          c.el.style.transform = `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotation}deg) scale(${pose.scale})`;
          c.el.style.opacity = pose.opacity;
        }
      });
    }

    /* passa o cartão da frente (sai para o lado `dir`: -1 esquerda, 1 direita) */
    proximo(dir = -1) {
      if (this.ocupado || this.ordem.length < 2) return;
      const saindo = this.frente;
      const fim = () => {
        this.atual = (this.atual + 1) % this.ordem.length;
        this.reposicionarSaida(saindo);
        this.aoTrocar();
      };
      if (this.gsap && !MES.movimento.reduzido) {
        this.ocupado = true;
        this.gsap.to(saindo.el, {
          x: dir * (this.el.offsetWidth * 0.9 + 80),
          y: '+=12',
          rotation: dir * 14,
          opacity: 0,
          duration: 0.38,
          ease: 'power2.in',
          overwrite: 'auto',
          onComplete: () => { this.ocupado = false; fim(); },
        });
      } else {
        fim();
      }
    }

    /* cartão que saiu vai para o fundo da pilha */
    reposicionarSaida(c) {
      const pos = this.posicaoDe(c.perfil.id);
      const pose = this.poseDe(pos);
      if (this.gsap && !MES.movimento.reduzido) {
        this.gsap.set(c.el, { x: pose.x * 0.4, y: pose.y + 30, rotation: pose.rotation, scale: pose.scale * 0.94, opacity: 0 });
      }
      this.aplicarPoses(true, { escalonar: 0.04 });
    }

    anterior() {
      if (this.ocupado || this.ordem.length < 2) return;
      this.atual = (this.atual - 1 + this.ordem.length) % this.ordem.length;
      const entrando = this.frente;
      if (this.gsap && !MES.movimento.reduzido) {
        this.gsap.set(entrando.el, { x: -(this.el.offsetWidth * 0.9 + 80), y: 12, rotation: -14, opacity: 0, scale: 1 });
      }
      this.aplicarPoses(true);
      this.aoTrocar();
    }

    irPara(id) {
      const i = this.ordem.indexOf(id);
      if (i < 0 || i === this.atual || this.ocupado) return;
      const saindo = this.frente;
      this.atual = i;
      if (this.gsap && !MES.movimento.reduzido) {
        this.gsap.set(this.frente.el, { y: 40, opacity: 0, scale: 0.96, rotation: 0, x: 0 });
        this.gsap.to(saindo.el, { opacity: 0, duration: 0.2, overwrite: 'auto' });
      }
      this.aplicarPoses(true, { escalonar: 0.03 });
      this.aoTrocar();
    }

    /* novos resultados (preferências mudaram): reordena e atualiza medidores */
    atualizar(resultados, novaOrdem) {
      const frenteAntes = this.ordem[this.atual];
      resultados.forEach((res, id) => {
        const c = this.cartoes.get(id);
        if (!c) return;
        c.res = res;
        this.marcarComuns(id, res);
      });
      const mudouOrdem = novaOrdem.join() !== this.ordem.join();
      this.ordem = novaOrdem.slice();
      this.atual = 0;
      const frenteDepois = this.ordem[0];

      this.cartoes.forEach((c, id) => {
        const naFrente = id === frenteDepois;
        c.sint.definir(c.res.valor, { animar: naFrente, sintonizar: naFrente && frenteAntes !== frenteDepois, duracao: 900 });
      });

      if (!mudouOrdem) return this.anunciar();
      if (this.gsap && !MES.movimento.reduzido && frenteAntes !== frenteDepois) {
        // "embaralha": a frente antiga afunda, a nova sobe
        const antiga = this.cartoes.get(frenteAntes);
        this.gsap.to(antiga.el, { y: '+=18', scale: 0.9, opacity: 0, duration: 0.22, ease: 'power2.in', overwrite: 'auto' });
        this.gsap.set(this.frente.el, { y: 46, opacity: 0, scale: 0.94, rotation: 0, x: 0 });
        this.aplicarPoses(true, { escalonar: 0.05, duracao: 0.7 });
      } else {
        this.aplicarPoses(true);
      }
      this.anunciar();
    }

    /* cartões entram "dados" na mesa (chamado quando a seção aparece) */
    // os cartões esperam "fora da mesa" (deslocados e esmaecidos, nunca invisíveis)
    esconderParaEntrada() {
      if (!this.gsap || MES.movimento.reduzido) return;
      this.cartoes.forEach((c, id) => {
        const pos = this.posicaoDe(id);
        const pose = this.poseDe(pos);
        const lado = pos % 2 ? 1 : -1;
        this.gsap.set(c.el, { x: pose.x + lado * 60, y: pose.y + 140, rotation: pose.rotation + lado * 9, opacity: Math.min(pose.opacity, 0.2), scale: pose.scale });
      });
      this.aguardandoEntrada = true;
    }

    entrar() {
      if (!this.aguardandoEntrada) return;
      this.aguardandoEntrada = false;
      this.cartoes.forEach((c, id) => {
        const pos = this.posicaoDe(id);
        const pose = this.poseDe(pos);
        this.gsap.to(c.el, { ...pose, duration: 1.05, ease: 'expo.out', delay: 0.09 * (3 - Math.min(pos, 3)), overwrite: 'auto' });
      });
      const f = this.frente;
      f.sint.definir(f.res.valor, { sintonizar: true, atraso: 450 });
    }

    aoTrocar() {
      const f = this.frente;
      f.sint.definir(f.res.valor, { sintonizar: true, duracao: 1000 });
      this.anunciar();
    }

    anunciar() {
      const f = this.frente;
      this.aoMudar({ perfil: f.perfil, res: f.res, el: f.el, posicao: this.atual + 1, total: this.ordem.length });
    }

    /* eventos: botões do cartão (hero), teclado e arrastar para passar */
    ligarEventos() {
      this.limpezas.forEach((fn) => fn());
      this.limpezas = [];
      this.limpezas.push(
        on(this.el, 'click', (e) => {
          if (e.target.closest('[data-cartao-passar]')) this.proximo(-1);
          else if (e.target.closest('[data-cartao-conhecer]')) this.aoConhecer(this.frente);
        }),
        on(this.el, 'keydown', (e) => {
          if (e.target !== this.el) return;
          if (e.key === 'ArrowRight') { e.preventDefault(); this.proximo(-1); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); this.anterior(); }
          else if (e.key === 'Enter') { e.preventDefault(); this.aoConhecer(this.frente); }
        })
      );
      if (this.gsap) this.ligarArrasto();
    }

    ligarArrasto() {
      const g = this.gsap;
      let ativo = null, x0 = 0, y0 = 0, dx = 0, t0 = 0, horizontal = null;
      const inicio = (e) => {
        if (e.button > 0 || this.ocupado || MES.movimento.reduzido) return;
        const card = e.target.closest('[data-cartao]');
        if (!card || card !== this.frente.el || e.target.closest('button, a')) return;
        ativo = card; x0 = e.clientX; y0 = e.clientY; dx = 0; t0 = performance.now(); horizontal = null;
      };
      const mover = (e) => {
        if (!ativo) return;
        const mx = e.clientX - x0, my = e.clientY - y0;
        if (horizontal === null && Math.hypot(mx, my) > 6) {
          horizontal = Math.abs(mx) > Math.abs(my);
          if (horizontal) { ativo.setPointerCapture(e.pointerId); ativo.classList.add('is-arrastando'); }
          else { ativo = null; return; }
        }
        if (!horizontal) return;
        dx = mx;
        g.set(ativo, { x: dx, rotation: clamp(dx * 0.06, -16, 16), y: Math.abs(dx) * 0.05 });
      };
      const fim = () => {
        if (!ativo) return;
        const card = ativo;
        ativo = null;
        card.classList.remove('is-arrastando');
        if (!horizontal) return;
        const vel = Math.abs(dx) / Math.max(1, performance.now() - t0);
        if (Math.abs(dx) > 110 || (Math.abs(dx) > 40 && vel > 0.6)) {
          this.proximo(dx < 0 ? -1 : 1);
        } else {
          g.to(card, { ...this.poseDe(0), duration: 0.55, ease: 'back.out(1.8)' });
        }
      };
      this.limpezas.push(
        on(this.el, 'pointerdown', inicio),
        on(window, 'pointermove', mover, { passive: true }),
        on(window, 'pointerup', fim),
        on(window, 'pointercancel', fim)
      );
    }

    destruir() {
      this.limpezas.forEach((fn) => fn());
      this.limpezas = [];
      this.cartoes.forEach((c) => {
        c.sint.destruir();
        if (this.gsap) this.gsap.killTweensOf(c.el);
      });
    }
  }

  MES.Baralho = Baralho;
  MES.Baralho.POSES = POSES;
})();
