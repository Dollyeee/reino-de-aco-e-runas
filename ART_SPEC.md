# Especificação de arte — Reino de Aço e Runas

Direção de arte: **pixel art desenhada em código** (seção "Direção de arte" do `CLAUDE.md`).
Os sprites são módulos JS em `tools/pixel-art/sprites/`; `npm run pixel` desenha cada um **em partes** e exporta
os PNGs para `public/assets/` + `tools/pixel-art/preview.html`. Para mudar a arte, mude o módulo — não o PNG.

Situação: o **Orc Cibernético** já é pixel art. Os demais assets abaixo ainda são SVGs antigos (placeholders) e
serão refeitos no gerador seguindo as mesmas regras; as medidas deles continuam valendo como referência.

## Regras da pixel art (valem para todo sprite novo)

- **Grade**: 1 pixel da arte = **2×2 px do mundo** (`PIXEL_SCALE` = 2, mundo 1280×720). O quadro do sprite é
  definido em pixels da arte (ex.: orc 60×52 → 120×104 no mundo).
- **Fundo transparente**, **sem antialias**, só cores da paleta fixa (`tools/pixel-art/palette.js`):
  pele `#3e5422 #688434 #92ae4e` · aço `#262a32 #424a56 #6e7886` (destaque `#aab4c0`) ·
  couro `#342418 #543a26 #705034` · tecido `#54221a #803828 #9c4e38` · ciano `#14788c #3ff5ff #c8fdff` ·
  vermelho `#78101c #ff3b4e #ffd0c8` · presa `#aaa082 #e8dcc0 #fffaec` · ferrugem `#7a4a2c`.
  Ciano e vermelho só em energia, runas, olhos e brilhos.
- **Partes**: cada sprite é desenhado em partes, de trás para frente. Cada parte recebe cel shading automático
  (rampa de 3 tons: claro em cima/esquerda, escuro embaixo/direita e na metade inferior-direita) e contorno
  interno onde se sobrepõe a uma parte anterior. Contorno `#1e1512` de 1 px em volta da silhueta inteira.
- **Câmera 3/4**, luz do canto superior esquerdo, personagem **olhando para a direita** (o jogo espelha).
- **Ancoragem**: pés/base na **borda inferior central** do quadro (linha de baixo = contorno do chão).
- **Margem**: pelo menos 1 px livre em volta de tudo, **considerando o maior deslocamento da animação**.
- **Animação**: gerada pelas partes a partir de uma fase `t` (0..1), só com **deslocamentos inteiros**. Exporta uma
  folha com os quadros lado a lado (`<nome>-walk.png`) e um quadro parado (`<nome>.png`).
- **NÃO desenhe**: sombra projetada (o jogo desenha uma elipse de pixels), halos fora da silhueta (o jogo põe brilho
  e luz), rotação ou escala (proibidas em pixel art).

## Como registrar um sprite no jogo

1. Crie/edite o módulo em `tools/pixel-art/sprites/`, registre-o em `tools/pixel-art/generate.js` e rode `npm run pixel`.
2. Em `src/config/art.js`: `file`, `pixel: true`, `frame: [w, h]` (se for folha), `anims`, `size` (= quadro × 2),
   `pivot` (em px do mundo) e os pontos de encaixe (em px do mundo, a partir do pivot).
3. Rode `npm run dev`. Se o arquivo não bater com `size`/`frame`, aparece um aviso `[arte]` no console.

## Assets ainda em SVG (placeholders)

- Formato atual: SVG, PNG ou WebP com fundo transparente (o carregador aceita os três).
- **Tamanho lógico** e **pontos de encaixe** abaixo são em pixels do mundo; ao refazer em pixel art, o quadro em
  pixels da arte é a metade (ex.: pedra 76×56 → quadro de 38×28).

## Resumo

| Arquivo | Tamanho lógico | Pivot (no quadro) | Olha para | Animação feita pelo código |
|---|---|---|---|---|
| `enemy-cyber-orc` (pixel art) | 120×104 (quadro 60×52) | 60,104 (inferior central) | direita (espelhado) | caminhada em 8 quadros, dano, morte |
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

### Orc Cibernético — `enemy-cyber-orc` (pixel art) ✅
- **Arquivos**: `orc-walk.png` (folha 480×52, **8 quadros** de 60×52) e `orc.png` (parado, 60×52).
  Fonte: `tools/pixel-art/sprites/orc.js`.
- **Quadro**: 60×52 px da arte → **120×104** no mundo · pivot no pé, centro inferior (30, 52 da arte) ·
  **olha para a direita** (espelhado para a esquerda).
- **Partes, de trás para frente**: braço de trás (pendurado, punho fechado) → perna de trás → tronco curvado em aço
  escuro (chevron ciano no peito) → perna da frente → tanga vermelho-escura → cinto de couro com disco rúnico ciano →
  cabeça baixa e projetada (orelha pontuda, mandíbula grande, 2 presas, sobrancelha pesada) → implante ocular
  vermelho com aro de aço e antena → ombreira com um espinho e runa ciano → clava de ferro com núcleo ciano
  (mão da frente, apontando para baixo/trás) → braço da frente com bracelete e punho sobre o cabo.
- **Caminhada** (fase `t` 0..1): pernas ±3 px, pé de trás levanta 1–2 px, corpo/cabeça/ombreira sobem 1 px na
  passagem, braços e clava ±2 px em oposição às pernas.
- **Pontos de encaixe** (px do mundo, a partir do pivot): `eye` (+37, −68) brilho vermelho do olho ·
  `hit` (0, −44) onde os disparos acertam · `top` −98 barra de vida.
- **No jogo**: animação "walk" em loop com velocidade proporcional ao passo; dano = flash branco + recuo de 1 px da
  arte; morte = quadro parado, pisca, afunda e vira faíscas. Sombra: elipse de pixels 28×8 (56×16 no mundo).

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
