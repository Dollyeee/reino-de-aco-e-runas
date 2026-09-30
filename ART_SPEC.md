# Especificação de arte — Reino de Aço e Runas

Direção de arte: **pixel art desenhada em código** (seção "Direção de arte" do `CLAUDE.md`).
Os sprites são módulos JS em `tools/pixel-art/sprites/`; `npm run pixel` desenha cada um **em partes** e exporta
os PNGs para `public/assets/` + `tools/pixel-art/preview.html`. Para mudar a arte, mude o módulo — não o PNG.

Situação: o **Orc Cibernético** já é pixel art. Os demais assets abaixo ainda são SVGs antigos (placeholders) e
serão refeitos no gerador seguindo as mesmas regras; as medidas deles continuam valendo como referência.

## Regras da pixel art (valem para todo sprite novo)

- **Resolução 1×**: 1 pixel da arte = **1 pixel do mundo** (`PIXEL_SCALE` = 1, mundo 1280×720).
  **Inimigos comuns com ~100 px de altura** (orc: quadro 116×104).
- **Fundo transparente**, **sem antialias**, só cores da paleta fixa (`tools/pixel-art/palette.js`), em
  **rampas de 5 tons com hue shift** (sombras frias arroxeadas/azuladas, luzes quentes amareladas):
  pele · aço · aço claro · couro · tecido · presa · ciano · vermelho (+ ferrugem). Ciano e vermelho só em energia,
  runas, olhos e brilhos.
- **Partes**: cada sprite é desenhado em partes, de trás para frente. O gerador sombreia cada parte (tons escuros em
  no máximo ~30%, embaixo/à direita), aplica a textura do material e o brilho especular nas placas de metal.
- **Contorno seletivo**: externo `#1e1512` de 1 px em volta da silhueta; internos na cor mais escura do material
  da parte da frente. **Rim light** de 1 px na borda direita da silhueta.
- **Emissivos** (olho, runas, plasma): núcleo claro + halo de 1–2 px, sem contorno.
- **Texturas** com semente fixa e presas à parte (não mudam entre quadros): aço escovado, ferrugem nas bordas,
  couro, tecido, volume de pele.
- **Câmera 3/4**, luz do canto superior esquerdo, personagem **olhando para a direita** (o jogo espelha).
- **Ancoragem**: pés/base na **borda inferior central** do quadro (linha de baixo = contorno do chão).
- **Margem**: pelo menos 1 px livre em volta de tudo, **considerando o maior deslocamento da animação**.
- **Animação**: gerada pelas partes a partir de uma fase `t` (0..1), só com **deslocamentos inteiros**. Exporta uma
  folha com os quadros lado a lado (`<nome>-walk.png`), um quadro parado (`<nome>.png`) e um JSON com dados por quadro.
- **NÃO desenhe**: sombra projetada (o jogo desenha uma elipse de pixels), halos fora da silhueta além do halo dos
  emissivos, rotação ou escala (proibidas em pixel art).

## Como registrar um sprite no jogo

1. Crie/edite o módulo em `tools/pixel-art/sprites/`, registre-o em `tools/pixel-art/generate.js` e rode `npm run pixel`.
2. Em `src/config/art.js`: `file`, `pixel: true`, `frame: [w, h]` (se for folha), `anims`, `meta`, `size` (= quadro),
   `pivot` (em px do mundo) e os pontos de encaixe (em px do mundo, a partir do pivot).
3. Rode `npm run dev`. Se o arquivo não bater com `size`/`frame`, aparece um aviso `[arte]` no console.

## Assets ainda em SVG (placeholders)

- Formato atual: SVG, PNG ou WebP com fundo transparente (o carregador aceita os três).
- **Tamanho lógico** e **pontos de encaixe** abaixo são em pixels do mundo; como a pixel art é 1×, o quadro em pixels
  da arte é o mesmo tamanho (ex.: pedra 76×56 → quadro de 76×56).

## Resumo

| Arquivo | Tamanho lógico | Pivot (no quadro) | Olha para | Animação feita pelo código |
|---|---|---|---|---|
| `enemy-cyber-orc` (pixel art 1×) | 116×104 | 58,104 (inferior central) | direita (espelhado) | caminhada em 8 quadros, dano, morte |
| `tower-crossbow-base` | 88×88 | 44,88 (inferior central) | frente (simétrica) | squash |
| `tower-crossbow-head` | 116×66 | 58,33 (centro = eixo de giro) | direita (gira 360°) | giro, recuo, brilho |
| `tower-catapult-base` | 128×104 | 64,104 (inferior central) | direita (espelhada) | squash, vira de lado |
| `tower-catapult-arm` | 52×108 | 26,100 (eixo do braço) | para cima (gira) | giro de arremesso |
| `build-slot` | 100×60 | 50,25 (centro da face de cima) | — | surge ao construir, anel pulsando |
| `castle` | 260×272 | 130,272 (inferior central) | frente | nenhuma (escudo é do código) |
| `core-crystal` | 76×124 | 38,62 (centro) | frente | flutua, pulsa, reflexo |
| `tree` | 100×122 | 50,122 (base do tronco) | frente | balança ao vento |
| `rock` | 76×56 | 38,56 (inferior central) | frente | nenhuma |
| `crystal-cluster` | 84×86 | 42,86 (inferior central) | frente | pulsa, halo |
| `projectile-bolt` | 52×18 | 26,9 (centro) | direita (gira) | gira na direção do voo, estica |
| `projectile-plasma` | 40×40 | 20,20 (centro) | — | estica na direção do voo |
| `icon-ether` / `icon-core` / `icon-wave` | 48×48 | 24,24 (centro) | — | "respiram" na interface |

## Assets

### Orc Cibernético — `enemy-cyber-orc` (pixel art 1×) ✅
- **Arquivos**: `orc-walk.png` (folha 928×104, **8 quadros** de 116×104), `orc-walk.json` (posição do olho por
  quadro) e `orc.png` (parado, 116×104). Fonte: `tools/pixel-art/sprites/orc.js` (versão 2× anterior congelada em
  `tools/pixel-art/legacy/orc-v2.js`, usada só no comparativo do preview).
- **Quadro**: 116×104 = tamanho no mundo; personagem com ~96 px de altura · pivot no pé, centro inferior (58, 104) ·
  **olha para a direita** (espelhado para a esquerda).
- **Proporções**: pernas ~1/3 da altura (coxas de pele, grevas de aço claro, botas com sola e cadarço), tronco ~40%
  curvado para frente, cabeça grande e projetada (mandíbula saliente, dentes, 2 presas com volume, orelha para fora,
  sobrancelha pesada).
- **Detalhes**: rebites e riscos no peitoral de aço claro, barriga em malha de aço escuro, ombreira com ferrugem,
  rebites, um espinho e runa ciano; cinto com costura e fivela com runa ciano; veias nos braços; clava com espinhos,
  núcleo de plasma e runas ciano gravadas. Olho vermelho e núcleo da clava são os pontos mais brilhantes.
- **Caminhada** (poses-chave, ritmo igual à versão 2×): contato com pernas ±10 px e tronco 2 px à frente (quadros 0 e 4);
  passagem com pernas juntas, corpo 2 px acima e pé de trás a 6 px do chão (quadros 2 e 6); braço de trás e clava ±6 px.
- **Pontos de encaixe** (px do mundo, a partir do pivot): `eye` (+39, −66) na pose parada (na caminhada vem do
  JSON) · `hit` (0, −54) · `top` −96.
- **No jogo**: animação "walk" em loop com velocidade proporcional ao passo; dano = flash branco + recuo de 2 px;
  morte = quadro parado, pisca, afunda e vira faíscas. Sombra: elipse de pixels 56×16.

### Orc Cibernético — versões candidatas (T09, pixel art 1×)
Escolhidas por `ORC_VARIANT` em `src/config/art.js` (`'atual' | 'a' | 'b' | 'c'`; teste rápido com `?orc=` na URL).
Pontos de encaixe, sombra e `walkCycle` de cada uma ficam em `ORC_VARIANTS`. Comparação lado a lado, andando e no
caminho: `tools/pixel-art/escolha-orc.html`.

| Versão | Arquivos | Quadro | Pivot | Olho (parado) | Hit | Top | Sombra | walkCycle |
|---|---|---|---|---|---|---|---|---|
| A "Brutamontes" (`sprites/orc-a.js`) | `orc-a-walk.png/json`, `orc-a.png` | 128×110 | 70,110 | +34,−52 | 0,−50 | −104 | 80×18 | 52 |
| B "Saqueador" (`sprites/orc-b.js`) | `orc-b-walk.png/json`, `orc-b.png` | 128×110 | 61,110 | +33,−86 | 0,−60 | −106 | 52×14 | 44 |
| C "Ciborgue de guerra" (`sprites/orc-c.js`) | `orc-c-walk.png/json`, `orc-c.png` | 128×106 | 65,106 | +41,−80 | 0,−52 | −92 | 64×16 | 42 |

- **A**: muito largo e curvado, cabeça pequena e baixa entre os ombros, braços enormes, placas rebitadas, pele oliva
  escura, martelo de duas mãos com cabeça de plasma apoiado no ombro. Caminhada: passo curto (±8 px), corpo afunda
  2 px no apoio, tronco balança ±2 px e o ombro do martelo sobe/desce 2 px a cada passo.
- **B**: alto e magro, inclinado para frente, colete de couro, faixas, ombreira pequena, moicano, pele verde clara,
  braço da frente inteiro mecânico com lâmina de plasma. Caminhada: passos longos (±14 px, pé sobe 8 px), bote de
  2 px à frente no contato, braço de carne balança ±8 px.
- **C**: pernas de pássaro (joelho para frente, jarrete alto para trás), cabos, reator ciano no peito, capacete com
  visor vermelho horizontal, presas por baixo, braço-canhão; pele verde-acinzentada só nos ombros e no maxilar.
  Caminhada mecânica: pé anda em linha reta no apoio, afunda 3 px no pouso ("tranco") e o canhão atrasa 1 quadro.

### Besta Laser — base `tower-crossbow-base` + cabeça `tower-crossbow-head`
- **Base**: 88×88 · pivot 44,88 · simétrica (não espelha).
  - `headMount` (0, −61): onde fica o eixo de giro da cabeça (centro do topo da base).
- **Cabeça (peça que gira)**: 116×66 · pivot 58,33 = **eixo de giro** · desenhada **apontando para a direita**.
  - O jogo gira 360° para mirar e **espelha na vertical** quando aponta para a esquerda: evite detalhes que
    fiquem estranhos de cabeça para baixo.
  - `muzzle` (+54, 0): ponta de onde sai o virote.
  - `crystal` (−21, 0): cristal de energia; o jogo põe um brilho ciano pulsando em cima.
- **Animação procedural**: giro de mira, recuo (desliza para trás e achata), reflexo (Shine) passando, squash
  da torre inteira ao atirar/construir.
- Sombra no chão: elipse 84×30.

### Catapulta de Plasma — base `tower-catapult-base` + braço `tower-catapult-arm`
- **Base**: 128×104 · pivot 64,104 · desenhada **virada para a direita** (espelhada quando o alvo está à
  esquerda).
  - `armPivot` (0, −52): eixo onde o braço gira.
- **Braço (peça que gira)**: 52×108 · pivot 26,100 = **eixo de giro** (parte de baixo do braço) · desenhado
  **em pé, apontando para cima**.
  - `cup` (0, −88): centro da concha (ponto de onde a bola é lançada).
  - `orb` (0, −94): onde a bola de plasma fica apoiada. **Não desenhe a bola no braço**: ela é o asset
    `projectile-plasma`, colocado pelo jogo.
  - O jogo gira o braço: repouso −20°, puxada −49°, arremesso +60°.
- **Animação procedural**: arremesso, recarga (a bola reaparece), squash, virar de lado.
- Sombra no chão: elipse 124×38.

### Plataforma rúnica — `build-slot`
- **Tamanho**: 100×60 · **pivot 50,25 = centro da face de cima** (exceção: não é a borda inferior; é o ponto
  onde a torre fica em pé).
- Surge embaixo de cada torre construída. O jogo sobrepõe um anel ciano pulsando e anima o surgimento.
- Sombra: elipse 108×38 (desenhada pelo jogo).

### Castelo — `castle`
- **Tamanho**: 260×272 · pivot 130,272 (base da muralha da frente, no centro do portão).
- `core` (0, −178): onde o Núcleo Arcano flutua (asset separado `core-crystal`).
- `pedestal` (0, −122): pedestal do núcleo, dentro do pátio.
- O **escudo de energia** (bolha) e a luz do núcleo são do código: não desenhe.
- Sombra: elipse 270×60.

### Núcleo Arcano — `core-crystal`
- **Tamanho**: 76×124 · pivot 38,62 (centro).
- Emite luz (não é afetado pela iluminação do cenário): cores claras e saturadas de ciano.
- **Animação procedural**: flutua, pulsa, reflexo (Shine), flash vermelho ao ser atingido.

### Árvore — `tree`
- **Tamanho**: 100×122 · pivot 50,122 (base do tronco).
- **Animação procedural**: balança ±1,5° girando em torno da base; mantenha a base do tronco no pivot.
- Sombra: elipse 80×26 (× escala da árvore no mapa).

### Pedra — `rock`
- **Tamanho**: 76×56 · pivot 38,56. Estática. Sombra: elipse 66×20.

### Aglomerado de cristais — `crystal-cluster`
- **Tamanho**: 84×86 · pivot 42,86.
- `glow` (+2, −46): centro do halo de luz que o jogo desenha.
- Emite luz (sem iluminação de cena). **Animação procedural**: pulsa levemente.
- Sombra: elipse 72×22.

### Virote laser — `projectile-bolt`
- **Tamanho**: 52×18 · pivot 26,9 (centro) · **aponta para a direita**.
- O jogo gira na direção do voo, estica um pouco e soma um brilho aditivo ciano.

### Bola de plasma — `projectile-plasma`
- **Tamanho**: 40×40 · pivot 20,20 (centro).
- Usada no voo (esticada na direção do movimento) e parada na concha da catapulta.

### Ícones da interface — `icon-ether`, `icon-core`, `icon-wave`
- **Tamanho**: 48×48 · pivot 24,24 (centro). Sem sombra. O código anima escala ("respiração" e achatamento).
