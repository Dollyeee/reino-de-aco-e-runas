# Besta Laser — 3 bases novas (T24): autocrítica das rodadas

Pedido: "a base da torre eu achei muito estranha, faça 3 design completamente diferentes". Mesma técnica da T22
(`lib/Grade.js` + peças à mão de `lib/materiais/`), câmera 3/4 frontal pura (revisão da besta-r3), mesma arma.
Renderização: `node tools/pixel-art/rodadas/render.mjs bases <rodada> <estágio>` (as 3 lado a lado com orc e árvore do kit A).
Peças novas na biblioteca: tronco, ponta de tronco, porta, seteira, tocha (fogo, 3 quadros), cristal pequeno.

## 0 · Conceito — `bases-conceitos.png`
- **N1 Torreão redondo de pedra** — cilindro com ameias em volta: silhueta clássica de castelo, vertical e compacta.
- **N2 Paliçada de troncos** — muralha de troncos pontudos: silhueta serrilhada, larga, "fronteira".
- **N3 Altar rúnico em degraus** — pirâmide de 3 degraus baixos: silhueta larga e baixa, mais mágica.

## R1 · Blocagem + luz e volume — `bases-r1.png`
1. Torreão: o topo não lê como cilindro com ameias (bloco cortado com dentinhos); a arma cobre o piso.
2. Paliçada: a plataforma de trás parece uma caixa flutuando sobre as pontas.
3. Altar: o suporte some — a arma assenta direto no último degrau.
4. Torreão: ameias de 7 px baixas demais para a largura.
5. As três com volume certo (topo claro, sombra à direita, contato no chão); falta material.
**Correções**: ameias de 9 px, piso visível, pedestais mais altos, plataforma da paliçada mais baixa.

## R2 · Materiais e detalhes — `bases-r2.png`
1. Torreão: a arma ainda cobre o topo; lê como caixa de tijolos.
2. Paliçada: tocha solta à esquerda da muralha = pixel laranja flutuando.
3. Paliçada: plataforma ainda parece caixote; os postes ficaram escondidos.
4. Torreão: o cilindro só aparece pelo escurecimento à direita; base pouco curva.
5. Altar: o mais legível; cristais pequenos no limite do ruído (lêem como cristais).
**Correções**: pedestal do torreão de 15 px (arma acima das ameias), base do cilindro mais curva, tocha presa à
muralha, postes de parapeito com corda nos cantos da plataforma, limpeza (etapa 4).

## R3 · Limpeza — `bases-r3.png` (versões entregues: `?besta=n1`, `n2`, `n3`)
Pontos que ainda vejo, para a revisão do usuário:
1. Torreão: o plinto largo esconde parte da curva da base; o cilindro ainda lê um pouco "quadrado" de frente.
2. Paliçada: as cintas de ferro de ponta a ponta lembram canos; talvez corda em vez de ferro.
3. Paliçada: a tocha é pequena no tamanho real (só o brilho aparece).
4. Altar: é a mais baixa (arma a −57 px); pode parecer fraca ao lado de torres mais altas.
5. As três usam a mesma arma da Besta nova — se a base mudar muito de altura, talvez a arma precise de outro suporte.
