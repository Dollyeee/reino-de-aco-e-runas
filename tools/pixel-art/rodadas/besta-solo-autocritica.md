# Besta Laser SOLO (T26): autocrítica das rodadas

Pedido: tirar o corpo da torre (competia com a arma e escondia inimigos atrás) — a peça principal é a própria besta
mecânica, grande e legível, sobre um apoio BAIXO. Conjunto de ~64–72 px de largura, besta a no máximo ~60 px do chão.
Técnica da T22 (`lib/Grade.js` + peças de `lib/materiais/`), câmera 3/4 frontal pura.
Renderização: `node tools/pixel-art/rodadas/render.mjs solo apoios` e `solo r<N> <estágio>` (cena 1× com árvore do kit A e
orc logo atrás/ao lado + ampliação 3×; a partir da R2, tira de ângulos −90°, −45°, 0°, 45°, 90° em 2×).
Fonte: `tools/pixel-art/sprites/torres/besta-solo.js`; encaixes em `TOWER_ART.laserCrossbow.s`.

## 0 · Conceito — `besta-solo-apoios.png` (3 apoios, estágio 2, mesma besta)
- **(a) Tripé de madeira e ferro** — lê como "arma de cerco" mas as pernas finas somem ao lado do orc; a arma parece
  equilibrada num palito. Pouco robusto.
- **(b) Pedestal curto de pedra com runa** — **escolhido**: bloco largo e baixo, a silhueta mais firme; a runa ciano liga
  o apoio à energia da arma e às outras peças do jogo (pedra + runa = linguagem do reino).
- **(c) Plataforma giratória rente ao chão** — a roda larga e baixa vira uma mancha marrom (parece trenó/caixote) e
  alarga o conjunto além dos 72 px.

## R1 · Blocagem + luz e volume (etapas 1–2) — `besta-solo-r1.png`
1. Altura: com o eixo a −33 o braço de cima do arco passava dos 60 px — baixei o eixo para −29 e o bloco do pedestal.
2. O disco giratório ficava escondido pela arma: parecia que a besta flutuava sobre a pedra.
3. A corda e o braço de baixo do arco cruzam a frente do pedestal e cobrem a runa.
4. A besta é desenhada "vista de cima" (planta): mirando para cima/baixo ela fica comprida na vertical, a coronha sobe
   acima de 60 px e não combina com o 3/4 do resto da cena.
5. O virote comprido deixava o conjunto com ~76 px — encurtei 4 px (ponta a +35).
**Correções**: eixo −29, pedestal mais baixo (topo −16), disco mais baixo e visível sob a arma + pescoço de ferro
ligando o disco à besta, virote 40 px.

## R2 · Materiais (etapa 3) — `besta-solo-r2.png`
1. **Escorço 3/4** (o problema 4 da R1): nova opção `rotate.sy` no `PixelCanvas` / `head.foreshorten` no towerArt — a besta
   gira NO PLANO DO CHÃO e o eixo vertical da tela é achatado ×0,7. Mirando para baixo a coronha encurta e o arco aparece
   de frente, largo; mirando para o lado, as asas do arco ficam mais baixas (±20 px em vez de ±29). O quadro de cada
   ângulo aponta o virote para a direção NA TELA; `muzzle`/`crystal` seguem com `headPoint` (jogo e página de escolha).
2. A besta ainda parecia recortada em papel: sem espessura, as peças deitadas não têm face lateral.
3. Coronha de madeira escura contra a terra do caminho: pouco contraste; o contorno segura, mas a chapa de ferro ajuda.
4. Pedestal com pedra em blocos + runa: lê bem; a runa aparece entre os braços do arco.
5. A proporção arma × apoio está certa para o conceito (a arma é a peça principal), mas o pedestal parece pequeno de
   lado; aceito para não passar dos 72 px.
**Correções**: face de lado de 3 px (tom escuro) sob a coronha, a chapa e o mecanismo, 2 px sob os braços do arco.

## R3 · Limpeza (etapa 4) — `besta-solo-r3.png` (versão entregue: `?besta=s`, não trocada no jogo)
Pontos que ainda vejo, para a revisão do usuário:
1. Mirando para baixo (90°) a coronha fica em pé sobre o pedestal e lembra uma coluna — é o escorço correto, mas é o
   ângulo menos legível.
2. A corda de energia cruza a runa do pedestal em alguns ângulos (brilho ciano sobre brilho ciano).
3. A coronha escura ainda se perde um pouco no caminho de terra; se incomodar, clarear a madeira um tom.
4. O escorço ×0,7 é novo no jogo (as outras bestas giram sem escorço) — se aprovado, vale levar para a Besta N e para o
   braço da catapulta.
5. Upgrades ainda não desenhados (texto em `upgrades` e no DESIGN.md): arco duplo, trilho de plasma, luneta; placas de
   aço, pistões e anel rúnico no apoio.

Medidas finais: besta de 72 px de ponta a ponta (coronha −36 … ponta +35), topo a ≤ ~55 px do chão em qualquer ângulo
(eixo −29 + no máximo 25 px de escorço), apoio 40 px de largura, `footprintRadius` 30 (a torre padrão ocupa 38),
sombra 52×14. Idle: cordas pulsando (3 fases) + runa do pedestal (2 quadros); recuo de 3 px em 2 passos ao disparar.
