/* =============================================================================
   Demonstração interativa + diálogos
   -----------------------------------------------------------------------------
   - Preferências (chips) → recalcula o índice ilustrativo → reordena o baralho
   - Miniaturas reordenadas com FLIP (GSAP)
   - Microinterações dos chips (anime.js)
   - Diálogo de perfil e aviso para psicólogos
   Nada é salvo nem enviado: é um protótipo.
   ============================================================================= */
window.MES = window.MES || {};

(function () {
  'use strict';
  const { $, $$, on } = MES.util;

  /* ------------------------------------------------------------ diálogos --- */
  // Abre/fecha <dialog> com transição GSAP (ou instantâneo sem a biblioteca).
  function abrirDialogo(dlg, painel) {
    dlg.showModal();
    document.documentElement.classList.add('tem-dialogo');
    if (MES.movimento.gsap && !MES.movimento.reduzido) {
      window.gsap.fromTo(painel, { y: 28, opacity: 0, scale: 0.985 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
    }
  }
  function fecharDialogo(dlg, painel, depois) {
    const terminar = () => {
      dlg.close();
      document.documentElement.classList.remove('tem-dialogo');
      if (depois) depois();
    };
    if (MES.movimento.gsap && !MES.movimento.reduzido) {
      window.gsap.to(painel, { y: 18, opacity: 0, duration: 0.24, ease: 'power2.in', overwrite: 'auto', onComplete: terminar });
    } else {
      terminar();
    }
  }
  function ligarDialogo(dlg, painel, aoFechar) {
    const fechar = () => fecharDialogo(dlg, painel, aoFechar);
    const offs = [
      on(dlg, 'cancel', (e) => { e.preventDefault(); fechar(); }),
      on(dlg, 'click', (e) => {
        if (e.target === dlg) fechar(); // clique no fundo
        if (e.target.closest('[data-perfil-fechar], [data-aviso-fechar]')) fechar();
      }),
    ];
    return { fechar, destruir: () => offs.forEach((f) => f()) };
  }

  /* --------------------------------------------------- diálogo de perfil --- */
  const perfilDialogo = {
    init() {
      this.dlg = $('[data-perfil]');
      if (!this.dlg) return;
      this.painel = $('[data-perfil-painel]', this.dlg);
      this.controle = ligarDialogo(this.dlg, this.painel, () => {
        if (this.origem && document.contains(this.origem)) this.origem.focus({ preventScroll: true });
        if (this.sint) this.sint.destruir();
      });
      on(this.dlg, 'click', (e) => {
        if (e.target.closest('[data-escolher]')) this.escolher();
      });
    },

    abrir(perfil, res, origem) {
      if (!this.dlg) return;
      const D = MES.dados;
      this.perfil = perfil;
      this.origem = origem || document.activeElement;
      const abord = D.abordagens.find((a) => a.id === perfil.abordagem);
      const formatos = perfil.formatos
        .map((f) => (f === 'online' ? 'online' : `presencial em ${perfil.cidade}`))
        .join(' e ');
      $('[data-perfil-foto]', this.dlg).innerHTML = MES.retrato(perfil, { enquadramento: 'largo' });
      $('[data-perfil-nome]', this.dlg).textContent = perfil.nome;
      $('[data-perfil-papel]', this.dlg).textContent = `${perfil.papel}, ${perfil.pronomes}`;
      $('[data-perfil-dados]', this.dlg).innerHTML = `
        <div><dt>abordagem</dt><dd>${abord ? abord.nome || abord.rotulo : ''}</dd></div>
        <div><dt>formato</dt><dd>${formatos}</dd></div>
        <div><dt>horários</dt><dd>${perfil.horarios}</dd></div>
        <div><dt>registro</dt><dd>CRP 00/00000 (número fictício)</dd></div>`;
      const comuns = new Set(res.comuns.filter((c) => c.tipo === 'tema').map((c) => c.id));
      $('[data-perfil-temas]', this.dlg).innerHTML = perfil.temas
        .map((t) => `<li class="etiqueta"${comuns.has(t) ? ' data-comum' : ''}>${MES.rotuloDe(D.temas, t)}</li>`)
        .join('');
      $('[data-perfil-sobre]', this.dlg).textContent = perfil.sobre;
      $('[data-perfil-primeira]', this.dlg).textContent = perfil.primeira;
      const lista = res.comuns.map((c) => c.rotulo);
      const emComum = lista.length
        ? `Em comum com o que você marcou: ${lista.join(', ')}.`
        : 'Nenhuma das preferências marcadas aparece neste perfil.';
      $('[data-perfil-sintonia]', this.dlg).innerHTML = `
        ${MES.Sintonia.markup(res.valor, { rotulo: 'de sintonia ilustrativa', classe: 'sintonia--g' })}
        <p class="perfil__comum">${emComum} O índice é só uma referência para esta demonstração.</p>`;
      this.sint = new MES.Sintonia($('[data-sintonia]', this.dlg));
      $('[data-perfil-acoes]', this.dlg).hidden = false;
      $('[data-perfil-match]', this.dlg).hidden = true;
      this.dlg.scrollTop = 0;
      abrirDialogo(this.dlg, this.painel);
      this.sint.definir(res.valor, { sintonizar: true, atraso: 250 });
    },

    escolher() {
      const p = this.perfil;
      $('[data-perfil-acoes]', this.dlg).hidden = true;
      const bloco = $('[data-perfil-match]', this.dlg);
      bloco.hidden = false;
      $('[data-perfil-mini]', this.dlg).innerHTML = MES.retrato(p);
      $('[data-match-texto]', this.dlg).textContent =
        `Você escolheu ${p.nome}. Como esta é uma demonstração, nada foi enviado. Na plataforma, este seria o momento de combinar a primeira conversa.`;
      $('[data-match-titulo]', this.dlg).focus({ preventScroll: true });
      bloco.scrollIntoView({ block: 'nearest', behavior: MES.movimento.reduzido ? 'auto' : 'smooth' });
      MES.anunciar(`Você escolheu ${p.nome} nesta demonstração. Nada foi enviado.`);

      // as duas ondas entram em fase (anime.js)
      const a = $('.pm-a', bloco), b = $('.pm-b', bloco);
      const est = { d: 16, amp: 4 };
      const desenhar = () => {
        const base = { x0: 0, x1: 160, y: 20, comp: 32, passo: 2 };
        a.setAttribute('d', MES.onda.caminho({ ...base, amp: est.amp }));
        b.setAttribute('d', MES.onda.caminho({ ...base, amp: est.amp, fase: -(est.d / 32) * Math.PI * 2 }));
      };
      desenhar();
      MES.fx.animate(est, { d: 0, amp: 11, duration: 1100, ease: 'outElastic(1, .7)', onUpdate: desenhar });
    },
  };
  MES.perfilDialogo = perfilDialogo;

  /* ------------------------------------------- aviso para psicólogos --- */
  const avisoPsicologos = {
    init() {
      this.dlg = $('[data-aviso]');
      if (!this.dlg) return;
      this.painel = $('.aviso__painel', this.dlg);
      this.controle = ligarDialogo(this.dlg, this.painel, () => {
        if (this.origem) this.origem.focus({ preventScroll: true });
      });
      const destino = MES.dados.links.cadastroPsicologos;
      $$('[data-cadastro-psi]').forEach((btn) => {
        if (destino) {
          btn.setAttribute('href', destino);
          return;
        }
        on(btn, 'click', (e) => {
          e.preventDefault();
          this.origem = btn;
          abrirDialogo(this.dlg, this.painel);
        });
      });
      on($('[data-aviso-demo]', this.dlg), 'click', (e) => {
        e.preventDefault();
        fecharDialogo(this.dlg, this.painel, () => MES.irPara && MES.irPara('#demo'));
      });
    },
  };

  /* ---------------------------------------------------------- preferências --- */
  function chip(tipo, nome, item, marcado) {
    return `<label class="chip">
      <input type="${tipo}" name="${nome}" value="${item.id}"${marcado ? ' checked' : ''}>
      <span class="chip__corpo">
        <svg class="chip__check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.6l3.1 3L13 4.6" /></svg>
        <span>${item.rotulo}</span>
      </span>
    </label>`;
  }

  function montarPrefs(form, ini) {
    const D = MES.dados;
    form.innerHTML = `
      <fieldset class="prefs__grupo">
        <legend class="prefs__legenda">o que te traz aqui?</legend>
        <p class="prefs__dica">Marque quantos temas quiser.</p>
        <div class="chips">${D.temas.map((t) => chip('checkbox', 'temas', t, ini.temas.includes(t.id))).join('')}</div>
      </fieldset>
      <fieldset class="prefs__grupo">
        <legend class="prefs__legenda">formato do atendimento</legend>
        <div class="chips chips--segmento">${D.formatos.map((f) => chip('radio', 'formato', f, ini.formato === f.id)).join('')}</div>
      </fieldset>
      <details class="prefs__mais" data-prefs-mais open>
        <summary class="prefs__mais-titulo">
          <span>mais preferências</span>
          <span class="prefs__mais-conta" data-mais-conta></span>
          <svg class="icone" aria-hidden="true"><use href="#i-direita" /></svg>
        </summary>
      <fieldset class="prefs__grupo">
        <legend class="prefs__legenda">abordagem</legend>
        <p class="prefs__dica">Se não souber, tudo bem deixar sem preferência.</p>
        <div class="chips">${D.abordagens.map((a) => chip('radio', 'abordagem', a, ini.abordagem === a.id)).join('')}</div>
      </fieldset>
      <fieldset class="prefs__grupo">
        <legend class="prefs__legenda">também é importante para mim</legend>
        <div class="chips">${D.extras.map((x) => chip('checkbox', 'extras', x, ini.extras.includes(x.id))).join('')}</div>
      </fieldset>
      </details>
      <p class="prefs__ao-vivo" data-ao-vivo></p>
      <div class="prefs__rodape">
        <button class="prefs__limpar" type="reset">
          <svg class="icone" aria-hidden="true"><use href="#i-voltar" /></svg>
          limpar escolhas
        </button>
      </div>`;
  }

  function lerPrefs(form) {
    const fd = new FormData(form);
    return {
      temas: fd.getAll('temas'),
      formato: fd.get('formato') || 'tanto-faz',
      abordagem: fd.get('abordagem') || 'sem-preferencia',
      extras: fd.getAll('extras'),
    };
  }

  /* microinteração do chip (anime.js): o check se desenha e o chip "pulsa" */
  const desenhaveis = new WeakMap();
  function drawable(path) {
    if (!desenhaveis.has(path)) desenhaveis.set(path, window.anime.svg.createDrawable(path)[0]);
    return desenhaveis.get(path);
  }
  function animarChip(input, primeiraVez = false) {
    if (!MES.movimento.anime) return;
    const corpo = input.nextElementSibling;
    const check = drawable(corpo.querySelector('path'));
    if (!input.checked) { MES.fx.set(check, { draw: '0 0' }); return; }
    if (primeiraVez) { MES.fx.set(check, { draw: '0 1' }); return; }
    MES.fx.animate(check, { draw: ['0 0', '0 1'], duration: 360, ease: 'outQuad' });
    MES.fx.animate(corpo, { scale: [{ to: 1.06, duration: 120, ease: 'outQuad' }, { to: 1, duration: 380, ease: 'outElastic(1, .55)' }] });
  }

  /* ----------------------------------------------------------- miniaturas --- */
  function montarMiniaturas(lista, ordem, resultados) {
    lista.innerHTML = ordem
      .map((id) => {
        const p = MES.dados.perfis.find((x) => x.id === id);
        const r = resultados.get(id);
        return `<li data-mini="${id}">
          <button class="miniatura" type="button" data-ir="${id}">
            <span class="miniatura__foto">${MES.retrato(p, { classe: 'retrato' })}</span>
            <span class="miniatura__nome">${p.nome.split(' ')[0]}<span class="sr-only"> ${p.nome.split(' ').slice(1).join(' ')},</span></span>
            <span class="miniatura__valor"><span data-mini-valor>${r.valor}%</span><span class="sr-only"> de sintonia ilustrativa</span></span>
          </button>
        </li>`;
      })
      .join('');
  }

  function reordenarMiniaturas(lista, ordem, resultados) {
    const itens = new Map($$('[data-mini]', lista).map((li) => [li.dataset.mini, li]));
    const antes = new Map();
    itens.forEach((li, id) => antes.set(id, li.getBoundingClientRect()));
    ordem.forEach((id) => {
      const li = itens.get(id);
      const r = resultados.get(id);
      $('[data-mini-valor]', li).textContent = r.valor + '%';
      lista.appendChild(li);
    });
    if (!MES.movimento.gsap || MES.movimento.reduzido) return;
    // FLIP: cada miniatura sai da posição antiga e desliza para a nova
    itens.forEach((li, id) => {
      const a = antes.get(id), b = li.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      window.gsap.fromTo(li, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
    });
  }

  function marcarMiniaturaAtual(lista, id) {
    $$('.miniatura', lista).forEach((b) => {
      if (b.dataset.ir === id) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  /* ----------------------------------------------------------- demonstração --- */
  const demo = {
    init() {
      const raiz = $('[data-demo]');
      if (!raiz) return;
      this.raiz = raiz;
      this.form = $('[data-prefs]', raiz);
      this.lista = $('[data-miniaturas]', raiz);
      this.resumo = $('[data-resumo]', raiz);
      this.posicao = $('[data-posicao]', raiz);
      this.limpezas = [];

      const ini = MES.dados.prefsIniciais;
      montarPrefs(this.form, ini);
      this.mais = $('[data-prefs-mais]', this.form);
      if (window.matchMedia('(max-width: 1023px)').matches) this.mais.open = false;
      this.aoVivo = $('[data-ao-vivo]', this.form);
      $$('input', this.form).forEach((i) => animarChip(i, true));

      const { resultados, ordem } = this.calcular(lerPrefs(this.form));
      montarMiniaturas(this.lista, ordem, resultados);
      this.baralho = new MES.Baralho($('[data-demo-baralho]', raiz), {
        variante: 'demo',
        perfis: MES.dados.perfis,
        resultados,
        ordem,
        aoMudar: (info) => this.aoMudar(info),
        aoConhecer: (c) => perfilDialogo.abrir(c.perfil, c.res, $('[data-conhecer]', raiz)),
      });
      this.atualizarResumo(lerPrefs(this.form), resultados, ordem);

      const b = this.baralho;
      this.limpezas.push(
        on(this.form, 'change', (e) => {
          if (e.target.type === 'radio') $$(`input[name="${e.target.name}"]`, this.form).forEach((i) => animarChip(i, i !== e.target));
          else animarChip(e.target);
          this.recalcular();
        }),
        on(this.form, 'reset', () => {
          // depois do reset nativo, volta às escolhas iniciais da demonstração
          setTimeout(() => {
            $$('input', this.form).forEach((i) => {
              const nome = i.name;
              if (nome === 'temas') i.checked = false;
              else if (nome === 'extras') i.checked = false;
              else if (nome === 'formato') i.checked = i.value === 'tanto-faz';
              else if (nome === 'abordagem') i.checked = i.value === 'sem-preferencia';
              animarChip(i, true);
            });
            this.recalcular();
            MES.anunciar('Escolhas limpas.');
          });
        }),
        on($('[data-passar]', raiz), 'click', () => b.proximo(-1)),
        on($('[data-anterior]', raiz), 'click', () => b.anterior()),
        on($('[data-conhecer]', raiz), 'click', (e) => perfilDialogo.abrir(b.frente.perfil, b.frente.res, e.currentTarget)),
        on(this.lista, 'click', (e) => {
          const btn = e.target.closest('[data-ir]');
          if (btn) b.irPara(btn.dataset.ir);
        }),
        on($('[data-info]', raiz), 'click', (e) => {
          const btn = e.currentTarget;
          const txt = $('[data-info-texto]', raiz);
          const abrir = btn.getAttribute('aria-expanded') !== 'true';
          btn.setAttribute('aria-expanded', String(abrir));
          txt.hidden = !abrir;
          if (abrir) MES.fx.animate(txt, { opacity: [0, 1], translateY: [-6, 0], duration: 320, ease: 'outQuad' });
        })
      );
    },

    calcular(prefs) {
      const resultados = new Map();
      MES.dados.perfis.forEach((p) => resultados.set(p.id, MES.calcularSintonia(p, prefs)));
      const ordem = MES.dados.perfis
        .map((p, i) => ({ id: p.id, v: resultados.get(p.id).valor, i }))
        .sort((a, b) => b.v - a.v || a.i - b.i)
        .map((x) => x.id);
      return { resultados, ordem };
    },

    recalcular() {
      const prefs = lerPrefs(this.form);
      const { resultados, ordem } = this.calcular(prefs);
      reordenarMiniaturas(this.lista, ordem, resultados);
      this.baralho.atualizar(resultados, ordem);
      this.atualizarResumo(prefs, resultados, ordem);
    },

    atualizarResumo(prefs, resultados, ordem) {
      const topo = MES.dados.perfis.find((p) => p.id === ordem[0]);
      const extrasMarcados = (prefs.abordagem !== 'sem-preferencia') + prefs.extras.length;
      $('[data-mais-conta]', this.form).textContent = extrasMarcados ? `${extrasMarcados} marcada${extrasMarcados > 1 ? 's' : ''}` : '';
      this.aoVivo.innerHTML = `No topo agora: <strong>${topo.nome.split(' ')[0]}, ${resultados.get(topo.id).valor}%</strong> <a href="#perfis">ver perfis</a>`;
      const n = prefs.temas.length + prefs.extras.length + (prefs.formato !== 'tanto-faz') + (prefs.abordagem !== 'sem-preferencia');
      this.resumo.innerHTML = n
        ? `<strong>${ordem.length} perfis</strong> ordenados por sintonia com ${n === 1 ? 'a sua escolha' : `suas ${n} escolhas`}. No topo: ${topo.nome}.`
        : `<strong>${ordem.length} perfis</strong>. Marque o que importa para ver quem está mais em sintonia.`;
    },

    aoMudar({ perfil, res, posicao, total }) {
      marcarMiniaturaAtual(this.lista, perfil.id);
      this.posicao.textContent = `Perfil ${posicao} de ${total}: ${perfil.nome}, ${res.valor}% de sintonia ilustrativa.`;
    },

    destruir() {
      this.limpezas.forEach((f) => f());
      if (this.baralho) this.baralho.destruir();
    },
  };

  MES.demo = demo;
  MES.avisoPsicologos = avisoPsicologos;

  /* anúncios para leitores de tela */
  MES.anunciar = function (texto) {
    const el = $('[data-anuncio]');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = texto; }, 60);
  };
})();
