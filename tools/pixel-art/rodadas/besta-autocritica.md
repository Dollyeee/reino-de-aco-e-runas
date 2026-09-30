# Besta Laser — nova técnica (T22): autocrítica das rodadas

Cada rodada foi renderizada no tamanho real sobre o chão do mapa 1 (árvore do kit A e orc ao lado) e ampliada 4×
(`node tools/pixel-art/rodadas/render.mjs <rodada> <estágio>`), olhada, e os 5 maiores problemas foram corrigidos.

## 0 · Conceito — `besta-conceitos.png`
Três silhuetas em 3 tons (topo claro, frente média, lateral escura), no tamanho real ao lado do orc:
- **baixa e larga** — parece um baú; o topo some atrás da arma.
- **robusta (escolhida)** — mais larga que alta, peso de torre de vigia, lê bem ao lado do orc.
- **alta e estreita** — volta ao problema das "estruturas de palito"; compete em altura com as árvores.

## R1 · Blocagem + luz e volume (etapas 1–2) — `besta-r1.png`
1. **Legibilidade**: a arma fica baixa, "deitada" no piso; esconde o suporte giratório e as ameias da frente.
2. **Proporção**: a pedra está alta demais para o corpo de madeira; lê como "caixa sobre caixa".
3. **Volume**: o corpo parece uma placa (lateral fina demais).
4. **Contato com o chão**: sombra só como linha sob a frente; falta a sombra projetada para baixo/direita.
5. **Consistência com o orc**: tons chapados de valor médio; estandarte é um retângulo sem forma.
**Correções**: pedra 19 px (era 22), corpo 35 px e 9 de profundidade (era 30 e 7), pedestal sob o suporte, sombra
projetada para baixo/direita.

## R2 · Materiais e detalhes (etapa 3) — `besta-r2.png`
1. **Legibilidade no topo**: a arma ainda cobre o pedestal e o suporte.
2. **Ruído**: runas nos tons 3–4 do ciano ficaram quase brancas — pontos soltos brilhando.
3. **Banding na pedra**: rejunte horizontal todo no tom 0 vira listras paralelas.
4. **Banding na madeira**: frestas escuras a cada 5 px viram "código de barras" no tamanho real.
5. **Detalhe que vira ruído**: a amarração de corda no poste lê como um quadradinho marrom.
**Correções**: pedestal de 9 px (arma 5 px mais alta), runas nos tons 1/2/3, rejunte horizontal no tom 1 com trechos
no tom 0, tábuas de 6 px com fresta alternando tons 0 e 1, corda removida do poste (a peça segue na biblioteca).

## R3 · Limpeza (etapa 4) — `besta-r3.png` (versão entregue)
Limpeza aplicada (pixels órfãos removidos pela `Grade.cleanup`, sem mexer em rebites, runas e emissivos).
Problemas que ainda vejo — candidatos para a primeira revisão na ferramenta (T23):
1. A arma ainda encosta nas ameias de trás em alguns ângulos; o disco do suporte aparece pouco.
2. A janela ciano é o ponto mais claro do corpo; talvez precise de 1 px de moldura a mais.
3. O emblema do estandarte (3×4) é legível ampliado, mas no tamanho real vira uma mancha clara.
4. O topo da pedra quase não aparece (o corpo cobre a maior parte).
5. A lateral direita do piso e do corpo é estreita (4–7 px); pode ganhar 1–2 px para reforçar o volume.

## Revisão do diretor de arte (fluxo da T23)
- **besta-r3 #1** ("ângulo meio estranho", forma/silhueta, alta) → câmera 3/4 frontal pura: `SKEW = 0` em `besta-nova.js` (topo recua reto, sem lateral oblíqua), lado da sombra por `Grade.shadeRight`, ameia com topo reto, suporte e arma centralizados (`headMount` x 0). A R3 foi regerada; a versão revisada está em `tools/revisor/revisoes/besta-r3.b70b82e7.png`.
