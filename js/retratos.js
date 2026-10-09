/* =============================================================================
   Retratos de placeholder
   -----------------------------------------------------------------------------
   Gera ilustrações SVG simples (sem rosto, estilo editorial) a partir de
   `perfil.retrato`. Se `perfil.foto` tiver um caminho, usa a foto no lugar.
   ============================================================================= */
window.MES = window.MES || {};

(function () {
  'use strict';

  let contador = 0;

  // Escurece/clareia uma cor hex em `pct` (-1 a 1)
  function tom(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    const canal = (v) => Math.round(Math.min(255, Math.max(0, pct < 0 ? v * (1 + pct) : v + (255 - v) * pct)));
    const r = canal((n >> 16) & 255), g = canal((n >> 8) & 255), b = canal(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  // Cabelo: camada de trás (atrás da cabeça) e camada da frente
  const CABELOS = {
    chanel: {
      tras: 'M64 132C64 88 90 62 120 62s56 26 56 70v60c0 7-6 11-12 10H76c-6 1-12-3-12-10z',
      frente: 'M75 120c2-34 22-50 47-50 25 0 43 16 44 46-14-14-34-20-54-17-16 2-28 9-37 21z',
    },
    longo: {
      tras: 'M62 132c-2-46 26-70 58-70s60 24 58 70l5 128c-22 9-42 6-51-5h-24c-9 11-29 14-51 5z',
      frente: 'M76 126c-2-38 20-60 44-60s46 22 44 60c-8-24-24-38-44-40-20 2-36 16-44 40z',
    },
    curto: {
      tras: '',
      frente: 'M73 124c-5-40 20-62 49-62 29 0 50 22 45 58-3-13-11-21-23-23-14-2-31 2-46 2-12 0-21 9-25 25z',
    },
    raspado: {
      tras: '',
      frente: 'M76 118c0-34 20-48 44-48s44 14 44 48c-14-14-28-20-44-20s-30 6-44 20z',
      opacidade: 0.82,
    },
    coque: {
      tras: 'M98 64a22 22 0 1044 0 22 22 0 10-44 0z',
      frente: 'M75 124c-1-36 21-54 45-54s46 18 45 54c-8-22-24-34-45-34s-37 12-45 34z',
    },
    volume: {
      tras: 'M46 116c0-44 32-76 74-76s74 32 74 76c0 30-14 52-32 62H78c-18-10-32-32-32-62z',
      frente: 'M75 122c0-32 19-50 45-50s45 18 45 50c-12-13-28-20-45-20s-33 7-45 20z',
    },
  };

  const GOLAS = {
    redonda: { corpo: 'M26 300c2-50 34-76 76-84 6 13 30 13 36 0 42 8 74 34 76 84z' },
    v: { corpo: 'M26 300c2-50 34-76 76-84l18 34 18-34c42 8 74 34 76 84z', peito: 'M100 212l20 40 20-40z' },
    camisa: { corpo: 'M26 300c2-50 34-76 76-84 6 13 30 13 36 0 42 8 74 34 76 84z', gola: true },
  };

  /**
   * Devolve o markup do retrato de um perfil.
   * @param {object} perfil  item de MES.dados.perfis
   * @param {object} [op]    { classe }
   */
  function retrato(perfil, op = {}) {
    const classe = op.classe || 'retrato';
    // 'largo' afasta a câmera para fotos horizontais (cartões); 'busto' é o padrão
    const viewBox = op.enquadramento === 'largo' ? '-40 -10 320 300' : '0 -24 240 300';
    if (perfil.foto) {
      return `<img class="${classe} ${classe}--foto" src="${perfil.foto}" alt="" loading="lazy" decoding="async">`;
    }
    const r = perfil.retrato || {};
    const id = 'r' + (++contador);
    const pele = r.pele || '#E0AC85';
    const cabelo = CABELOS[r.cabelo] || CABELOS.curto;
    const corCabelo = r.corCabelo || '#2B211C';
    const gola = GOLAS[r.gola] || GOLAS.redonda;
    const roupa = r.roupa || '#161E52';
    const fundo = r.fundo || '#E4DEFF';

    return `
<svg class="${classe}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <pattern id="${id}-p" width="5" height="5" patternUnits="userSpaceOnUse">
      <circle cx="1.25" cy="1.25" r=".85" fill="#161E52" fill-opacity=".1" />
    </pattern>
    <clipPath id="${id}-c"><rect x="-80" y="-60" width="400" height="420" /></clipPath>
  </defs>
  <g clip-path="url(#${id}-c)">
    <rect x="-80" y="-60" width="400" height="420" fill="${fundo}" />
    <circle cx="150" cy="118" r="104" fill="${tom(fundo, -0.06)}" />
    ${cabelo.tras ? `<path d="${cabelo.tras}" fill="${corCabelo}" />` : ''}
    <path d="M102 172v42c0 14 36 14 36 0v-42z" fill="${tom(pele, -0.14)}" />
    ${gola.peito ? `<path d="${gola.peito}" fill="${tom(pele, -0.08)}" />` : ''}
    <path d="${gola.corpo}" fill="${roupa}" />
    ${gola.gola ? `<path d="M100 214l12 24 8-16zM140 214l-12 24-8-16z" fill="${tom(roupa, -0.12)}" />` : ''}
    <ellipse cx="77" cy="134" rx="8" ry="12" fill="${tom(pele, -0.06)}" />
    <ellipse cx="163" cy="134" rx="8" ry="12" fill="${tom(pele, -0.06)}" />
    <ellipse cx="120" cy="128" rx="44" ry="54" fill="${pele}" />
    <path d="M86 150c6 20 18 30 34 30s28-10 34-30c-6 26-18 36-34 36s-28-10-34-36z" fill="${tom(pele, -0.07)}" />
    ${r.barba ? `<path d="M80 146c2 30 19 44 40 44s38-14 40-44c-7 12-20 19-40 19s-33-7-40-19z" fill="${corCabelo}" fill-opacity=".9" />` : ''}
    <path d="${cabelo.frente}" fill="${corCabelo}" ${cabelo.opacidade ? `fill-opacity="${cabelo.opacidade}"` : ''} />
    ${r.oculos ? `<g fill="none" stroke="#161E52" stroke-width="3.4"><rect x="85" y="121" width="29" height="21" rx="8" /><rect x="126" y="121" width="29" height="21" rx="8" /><path d="M114 130c4-3 8-3 12 0" /></g>` : ''}
    <rect x="-80" y="-60" width="400" height="420" fill="url(#${id}-p)" />
  </g>
</svg>`;
  }

  MES.retrato = retrato;
})();
