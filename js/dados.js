/* =============================================================================
   Mente em Sintonia — conteúdo da página
   -----------------------------------------------------------------------------
   Tudo o que é "dado" fica aqui: perfis fictícios, opções da demonstração e
   links dos botões. Edite este arquivo para trocar textos, fotos ou destinos
   sem mexer na lógica.
   ============================================================================= */
window.MES = window.MES || {};

MES.dados = {
  /* Destinos dos botões. Quando o cadastro de psicólogos existir, coloque a URL
     em `cadastroPsicologos` e o botão "quero apresentar meu trabalho" passa a
     levar direto para lá (hoje ele abre um aviso honesto). */
  links: {
    encontrarMatch: '#demo',
    souPsicologo: '#para-psicologos',
    cadastroPsicologos: null,
  },

  /* Opções da demonstração */
  temas: [
    { id: 'ansiedade', rotulo: 'ansiedade' },
    { id: 'autoconhecimento', rotulo: 'autoconhecimento' },
    { id: 'relacionamentos', rotulo: 'relacionamentos' },
    { id: 'carreira', rotulo: 'carreira e trabalho' },
    { id: 'autoestima', rotulo: 'autoestima' },
    { id: 'luto', rotulo: 'luto' },
    { id: 'familia', rotulo: 'família' },
    { id: 'transicoes', rotulo: 'mudanças de vida' },
  ],
  formatos: [
    { id: 'online', rotulo: 'online' },
    { id: 'presencial', rotulo: 'presencial' },
    { id: 'tanto-faz', rotulo: 'tanto faz' },
  ],
  abordagens: [
    { id: 'sem-preferencia', rotulo: 'sem preferência' },
    { id: 'tcc', rotulo: 'TCC', nome: 'terapia cognitivo-comportamental' },
    { id: 'psicanalise', rotulo: 'psicanálise', nome: 'psicanálise' },
    { id: 'humanista', rotulo: 'humanista', nome: 'abordagem humanista' },
    { id: 'gestalt', rotulo: 'Gestalt', nome: 'Gestalt-terapia' },
    { id: 'sistemica', rotulo: 'sistêmica', nome: 'terapia sistêmica' },
  ],
  extras: [
    { id: 'lgbt', rotulo: 'atendimento afirmativo LGBTQIA+' },
    { id: 'ingles', rotulo: 'sessões em inglês' },
    { id: 'noite', rotulo: 'horários à noite' },
  ],

  /* Preferências que aparecem marcadas quando a demonstração abre */
  prefsIniciais: { temas: ['ansiedade'], formato: 'online', abordagem: 'sem-preferencia', extras: [] },

  /* A busca de exemplo mostrada no hero (precisa bater com o HTML do hero) */
  buscaHero: { temas: ['ansiedade', 'carreira'], formato: 'online', abordagem: 'tcc', extras: [] },
  perfisHero: ['helena', 'caio', 'marina'],

  /* Perfis FICTÍCIOS. Para usar fotos reais, preencha `foto` com o caminho da
     imagem (ex.: 'img/helena.jpg'); sem foto, um retrato ilustrado é gerado. */
  perfis: [
    {
      id: 'helena',
      nome: 'Helena Prado',
      pronomes: 'ela/dela',
      papel: 'psicóloga clínica',
      cidade: 'São Paulo, SP',
      abordagem: 'tcc',
      formatos: ['online', 'presencial'],
      temas: ['ansiedade', 'carreira', 'autoestima'],
      extras: ['noite'],
      intro: 'Trabalho com ansiedade e mudanças de carreira, com sessões estruturadas e combinados práticos entre um encontro e outro.',
      sobre: 'Atendo adultos que querem entender o que alimenta a ansiedade no dia a dia, principalmente no trabalho. Gosto de definir objetivos junto com a pessoa e revisar o caminho com frequência.',
      primeira: 'Uma conversa para entender o que trouxe você até aqui, combinar frequência e tirar dúvidas sobre como funcionam as sessões.',
      horarios: 'manhãs e noites',
      foto: null,
      retrato: { pele: '#E0AC85', cabelo: 'chanel', corCabelo: '#2B211C', roupa: '#5A46D2', fundo: '#DCD5FF', gola: 'v' },
    },
    {
      id: 'caio',
      nome: 'Caio Nascimento',
      pronomes: 'ele/dele',
      papel: 'psicólogo clínico',
      cidade: 'Salvador, BA',
      abordagem: 'tcc',
      formatos: ['online'],
      temas: ['carreira', 'relacionamentos', 'autoestima'],
      extras: ['noite'],
      intro: 'Atendo à noite, pensando em quem tem rotina puxada. Gosto de objetivos claros e de rever o caminho junto com você.',
      sobre: 'Trabalho com pessoas em momentos de muita pressão profissional, conflitos no trabalho e dúvidas sobre os próximos passos. Os atendimentos são online.',
      primeira: 'Começamos pelo que está pesando agora e montamos juntos um plano para as primeiras semanas.',
      horarios: 'noites durante a semana',
      foto: null,
      retrato: { pele: '#7A4B2F', cabelo: 'raspado', corCabelo: '#1B1714', barba: true, roupa: '#161E52', fundo: '#EAE2D4', gola: 'redonda' },
    },
    {
      id: 'marina',
      nome: 'Marina Okabe',
      pronomes: 'ela/dela',
      papel: 'psicóloga clínica',
      cidade: 'Curitiba, PR',
      abordagem: 'humanista',
      formatos: ['online', 'presencial'],
      temas: ['autoestima', 'transicoes', 'ansiedade'],
      extras: ['lgbt'],
      intro: 'Um espaço sem julgamentos para olhar para autoestima e fases de mudança, no seu ritmo.',
      sobre: 'Acompanho pessoas em transições: mudança de cidade, fim de relações, novas fases da vida. Meu trabalho parte da sua experiência, sem pressa e sem roteiro pronto.',
      primeira: 'Um encontro para você contar sua história do jeito que quiser e sentir se o espaço faz sentido para você.',
      horarios: 'tardes',
      foto: null,
      retrato: { pele: '#F1C9A5', cabelo: 'longo', corCabelo: '#1B1714', roupa: '#CDBFA8', fundo: '#D3DDF4', gola: 'redonda' },
    },
    {
      id: 'rafael',
      nome: 'Rafael Monteiro',
      pronomes: 'ele/dele',
      papel: 'psicólogo e psicanalista',
      cidade: 'Rio de Janeiro, RJ',
      abordagem: 'psicanalise',
      formatos: ['online'],
      temas: ['relacionamentos', 'autoconhecimento', 'luto'],
      extras: [],
      intro: 'Escuta sem pressa para quem quer entender padrões que se repetem nos vínculos e nas perdas.',
      sobre: 'Atendo pessoas que percebem histórias parecidas se repetindo nas relações ou que passam por perdas importantes. As sessões são um espaço de fala livre.',
      primeira: 'Uma conversa aberta, sem questionário, para você falar do que quiser e entender como funciona a análise.',
      horarios: 'manhãs e tardes',
      foto: null,
      retrato: { pele: '#C68B62', cabelo: 'curto', corCabelo: '#4A3021', oculos: true, roupa: '#FBF8F2', fundo: '#F3D9C8', gola: 'camisa' },
    },
    {
      id: 'joana',
      nome: 'Joana Bastos',
      pronomes: 'ela/dela',
      papel: 'psicóloga clínica',
      cidade: 'Porto Alegre, RS',
      abordagem: 'gestalt',
      formatos: ['online'],
      temas: ['autoconhecimento', 'transicoes', 'relacionamentos'],
      extras: ['ingles', 'lgbt'],
      intro: 'Atendo em português e em inglês. Trabalho com o que está acontecendo agora, no corpo e nas relações.',
      sobre: 'Muitas das pessoas que atendo vivem fora do país ou em mudança. Trabalho com atenção ao presente: o que você sente, percebe e escolhe no dia a dia.',
      primeira: 'Conversamos sobre o momento que você está vivendo e combinamos o idioma e o ritmo das sessões.',
      horarios: 'manhãs, inclusive aos sábados',
      foto: null,
      retrato: { pele: '#9C6644', cabelo: 'volume', corCabelo: '#2B211C', roupa: '#A99BFF', fundo: '#DCE5D5', gola: 'redonda' },
    },
    {
      id: 'lucia',
      nome: 'Lúcia Ferraz',
      pronomes: 'ela/dela',
      papel: 'psicóloga e terapeuta de família',
      cidade: 'Recife, PE',
      abordagem: 'sistemica',
      formatos: ['presencial', 'online'],
      temas: ['familia', 'luto', 'relacionamentos'],
      extras: [],
      intro: 'Olho para a família como um sistema: conflitos, lutos e mudanças que atravessam várias pessoas ao mesmo tempo.',
      sobre: 'Atendo indivíduos, casais e famílias. Ajudo a entender como cada pessoa participa de uma situação difícil e o que pode mudar na convivência.',
      primeira: 'Entendemos quem faz parte da situação e se o melhor formato é individual, de casal ou com a família.',
      horarios: 'tardes e noites',
      foto: null,
      retrato: { pele: '#E0AC85', cabelo: 'coque', corCabelo: '#B9B4AC', oculos: true, roupa: '#161E52', fundo: '#E4DEFF', gola: 'v' },
    },
  ],
};
