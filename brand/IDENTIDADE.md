# Discows: identidade visual (case para o Behance)

Material de apoio para montar a apresentação do projeto no Behance. Tem a história, as decisões e onde está cada imagem. Os caminhos são relativos a esta pasta `brand/`.

---

## 1. Contexto

**Discows** é uma rede social para avaliar álbuns: você dá nota, escreve o review, segue outras pessoas e compartilha no Instagram. O nome junta **disc** (disco) + **cows** (vacas). Os seguidores são o rebanho.

**O problema:** o logo antigo era um close de um CD iridescente num quadrado escuro. Era bonito, mas genérico: não tinha nada de vaca, não dizia "Discows" e se perdia no meio de outros apps de música.

**Objetivo:** uma marca única e fácil de lembrar, com a cara do produto, que funcione do favicon de 16 px ao slide do Instagram, no tema claro e no escuro.

## 2. Processo (o que foi explorado)

| Rodada | Direção | Por que não seguiu | Imagem |
|---|---|---|---|
| 1 a 4 | Disco que vira focinho de vaca, brinco de gado, versões iridescentes | Literal demais, muitos detalhes | `logo/concepts-round1.png` … `round4.png` |
| 5 | Vaca dentro do CD (rosto, chifres, orelhas) | Mascote infantil e genérico | `logo/cow-disc-round1.png` |
| 6 | Vaca-disco em monolinha | Correto, mas sem personalidade | `logo/cow-line-round1.png` |
| 7 | Do zero: disco que fala, D de capa, wordmark c-o-w | Pouca ligação com a vaca | `logo/fresh-round1.png` |
| 8 | Disco com chifres, vinil malhado, d de chifre | Genérico | `logo/novo/concepts-novo.png` |
| 9 | Símbolo abstrato premium (quatro discos formando uma estrela) | Limpo, mas sem o humor do produto | `logo/abstrato/concepts-abstrato.png` |
| 10 | Estampa de vaca + nome em fonte pronta (referência trazida pelo cliente) | Ótima estampa, mas não era um logo | — |
| **Final** | **Nome desenhado com o "o" de disco e selo-mancha** | Aprovado | `logo/divertido/v2/` e `logo/final/` |

**A virada:** a referência com a estampa de vaca mostrou que o autêntico do Discows é o **humor**, e não um símbolo sério. A partir daí, a estampa virou padrão de apoio e o nome virou o logo.

## 3. O conceito

> **O selo do disco é uma mancha de vaca.**

- No nome **discows**, o "o" é um disco de vinil e o selo central dele é uma mancha de vaca. O pingo do "i" também é uma mancha.
- O **símbolo** é esse mesmo "o" tirado do nome. Nome e ícone são uma peça só.
- As letras foram desenhadas do zero, gordinhas e arredondadas, com uma leve inclinação diferente em cada uma, como se estivessem dançando. Elas seguem o espírito da Chewy, que já é usada no Studio, sem depender da fonte.

## 4. Cores: regra 60 / 30 / 10

Duas versões oficiais, uma para cada tema do app:

| Papel | Claro (branco 60) | Escuro (preto 60) |
|---|---|---|
| 60% fundo | `#FFFFFF` branco | `#140C18` preto-ameixa |
| 30% tinta | `#1A1020` preto-ameixa | `#FFF7F0` creme |
| 10% acento | `#E0349A` rosa | `#E0349A` rosa |

O rosa aparece só nos detalhes: pingo do i, selo do disco, estrelas da nota.

## 5. Estampa de vaca

Manchas grandes e irregulares que saem pela borda, com no máximo uma mancha rosa por composição. Ela é usada em fundos, cards de compartilhar e telas vazias, nunca atrás do logo.

## 6. Aplicações

- Ícone de app e favicon, claro e escuro, legíveis a 16 px
- Card de review para compartilhar no Instagram
- Slides do Studio: o nome entra no canto de cada slide e no slide final

## 7. Imagens para a apresentação (ordem sugerida)

1. Capa: `logo/final/png/discows-wordmark-escuro.png` sobre fundo `#140C18`
2. Logo antigo × novo: print do logo antigo + `logo/final/png/discows-wordmark-claro.png`
3. Processo: mosaico com as rodadas da tabela da seção 2
4. Conceito: close do "o" (`logo/final/discows-simbolo-claro.svg`) com a legenda "o selo do disco é uma mancha de vaca"
5. Sistema 60/30/10: `logo/divertido/v2/prancha-branco-60.png` e `prancha-preto-60.png`
6. Ícones: `logo/final/icones/icone-claro-1024.png` e `icone-escuro-1024.png`
7. Aplicações reais: prints do app e slides exportados do Studio com a marca nova

## 8. Arquivos

- Masters SVG: `logo/final/` (nome, símbolo e ícone em claro, escuro e uma cor). Guia de uso em `logo/final/GUIA.md`.
- Para o site e os slides: `public/brand/` e os componentes `src/components/brand/discows-wordmark.tsx` e `discows-symbol.tsx`, que recebem as cores por props.

## 9. Ficha técnica

- Tipografia do app: Geist (texto) e Chewy (títulos do Studio). O logo usa letras desenhadas próprias.
- Ferramentas: SVG construído em código, testes de redução (64/32/16 px), renderização com Chrome e `next/og`.
