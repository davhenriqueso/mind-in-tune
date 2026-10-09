# Mente em Sintonia — landing page

Landing page da Mente em Sintonia, plataforma que aproxima pessoas de psicólogos compatíveis com o que elas procuram. Feita só com HTML, CSS e JavaScript puro, com GSAP + ScrollTrigger e anime.js carregados por CDN. Não há instalação, dependências nem etapa de build.

## Como abrir

**Jeito mais rápido:** dê dois cliques no `index.html`. Abre direto no navegador (Firefox, Chrome, Edge, Safari).

**Com servidor local (opcional):** dentro da pasta, rode um destes comandos e acesse `http://localhost:8000`:

```
python -m http.server 8000
npx serve .
```

As bibliotecas de animação vêm do jsDelivr, então é preciso estar conectado à internet para ver as animações. Sem internet, a página continua inteira e a demonstração funciona; só fica sem movimento. As fontes estão na pasta `fonts/` e funcionam offline.

**Publicar:** a pasta já é um site estático. Pode subir do jeito que está no GitHub Pages, Netlify ou qualquer hospedagem de arquivos.

## Estrutura

```
index.html        estrutura das seis seções, diálogos e ícones (sprite SVG)
style.css         tokens, componentes, seções, responsivo, foco e movimento reduzido
script.js         orquestração: navegação, menu, hero, rolagem e animações
js/dados.js       conteúdo editável: perfis fictícios, opções da demo e links dos botões
js/retratos.js    retratos ilustrados de placeholder (troca por foto em dados.js)
js/sinal.js       utilidades: ondas SVG, índice ilustrativo, medidor de sintonia, atalhos do anime.js
js/baralho.js     pilha de cartões de perfil (hero e demonstração), arrastar para passar
js/demo.js        demonstração interativa, diálogo de perfil e aviso para psicólogos
fonts/            Young Serif e Atkinson Hyperlegible Next (licença OFL, arquivos incluídos)
assets/           favicon
```

## Personalizar

- **Textos dos perfis, temas e abordagens:** `js/dados.js`.
- **Fotos reais:** em cada perfil de `js/dados.js`, preencha `foto: 'img/nome.jpg'`. Sem foto, o retrato ilustrado é gerado automaticamente.
- **Cadastro de psicólogos:** quando existir, coloque a URL em `links.cadastroPsicologos` (`js/dados.js`). Hoje o botão "quero apresentar meu trabalho" abre um aviso dizendo que o cadastro ainda não está aberto.
- **Cores e tipografia:** tokens no início do `style.css` (`--anil`, `--papel`, `--lilas`, `--violeta`…).

## Conceito

"Sintonia" como em sintonizar uma frequência: cada pessoa e cada profissional têm a sua, e a plataforma ajuda as duas a se encontrarem. Isso aparece como sistema visual em toda a página:

- duas ondas (você e o profissional) que entram em fase no medidor de sintonia dos cartões;
- a palavra "match" com uma segunda camada levemente fora de fase, que se ajusta mas nunca fica 100% (o índice também nunca passa de 97%);
- o menu como um dial de rádio, com a agulha acompanhando a rolagem;
- o problema como ruído (fragmentos de uma busca comum) e a solução como sinal;
- o "como funciona" como um sintonizador que trava no match.

## Animações: quem faz o quê

Nenhum elemento é animado pelas duas bibliotecas.

| Biblioteca | Responsabilidade |
|---|---|
| GSAP + SplitText | entrada do hero, revelação dos títulos com máscara e stagger |
| GSAP + ScrollTrigger | tudo ligado à rolagem: parallax, ruído virando sinal, sintonizador fixo do "como funciona", encontro das ondas em "para quem é", ondas do encerramento |
| GSAP | composição dos cartões (pilha, passar, voltar, reordenar, arrastar), miniaturas (FLIP), menu e diálogos |
| anime.js | botões (onda que sintoniza no hover, toque), chips das preferências, medidores de sintonia, linhas de conexão do hero, eco do "match", detalhes do dial e do logo |

## Acessibilidade e desempenho

- `prefers-reduced-motion`: sem animações de entrada, parallax ou rolagem suave; tudo aparece no estado final e o sintonizador troca de etapa sem transição.
- Modo leve automático em aparelhos com pouca memória ou economia de dados (também forçado com `?leve` na URL): sem parallax.
- Foco visível em todos os controles, diálogos nativos (`<dialog>`) com Esc e retorno de foco, menu com foco preso, anúncios para leitores de tela na demonstração, contraste AA.
- Títulos animados têm uma cópia em texto para leitores de tela.

## Observações

Perfis, nomes, registros e índices são fictícios. O índice de sintonia é ilustrativo: compara só as preferências marcadas na demonstração e não é avaliação clínica. O rodapé traz os contatos do CVV (188) e do SAMU (192) para situações de crise.

Versões das bibliotecas: GSAP 3.15.0 (ScrollTrigger e SplitText) e anime.js 4.5.0.
