# Especificação de arte — Reino de Aço e Runas

Direção de arte: **pixel art desenhada em código** (seção "Direção de arte" do `CLAUDE.md`).
Os sprites são módulos JS em `tools/pixel-art/sprites/`; `npm run pixel` desenha cada um **em partes** e exporta
os PNGs para `public/assets/` + `tools/pixel-art/preview.html`. Para mudar a arte, mude o módulo — não o PNG.

Situação: o **Orc Cibernético** e o **chão do mapa 1** já são pixel art. Os demais assets abaixo ainda são SVGs
antigos (placeholders) e serão refeitos no gerador seguindo o guia de estilo abaixo; as medidas deles continuam
valendo como referência.

# Guia de estilo — a "bíblia" da pixel art

Escrito a partir do **orc Saqueador aprovado** (T09/T10) e do chão da T12. **Tudo que for desenhado daqui em diante
segue este guia.** Se uma arte nova precisar quebrar uma regra, a regra muda aqui primeiro.

Referências vivas: `tools/pixel-art/preview.html` (paleta completa, tiles, recorte do chão, sprites em loop) e
`tools/pixel-art/cena-referencia.png` (mapa inteiro 1280×720 com orcs e placeholders de torres/castelo).

## 1. Resolução e escala

- **1×**: 1 pixel da arte = **1 pixel do mundo** 1280×720 (`PIXEL_SCALE` = 1). Nada é ampliado nem reduzido.
- Sem antialias, sem rotação e sem escala fracionada nos sprites (o jogo só desloca em pixels inteiros).
- **Fundo transparente**; só cores da paleta (`tools/pixel-art/palette.js`).

## 2. Paleta

Cada material é uma **rampa de 5 tons com hue shift**: 0 = mais escuro … 4 = mais claro. As sombras puxam para
**roxo/azul frio** e as luzes para **amarelo quente** (nunca "preto + branco" do mesmo matiz).

| Material | Uso | 0 | 1 | 2 (base) | 3 | 4 |
|---|---|---|---|---|---|---|
| `pele` | pele de orc (padrão) | `#243028` | `#3a5230` | `#5f7f35` | `#8aa845` | `#c4d06a` |
| `peleClara` | Saqueador (B) | `#26382e` | `#3f6436` | `#68963e` | `#98c052` | `#d6e67c` |
| `peleOliva` | Brutamontes | `#1e2226` | `#2f3a2c` | `#4a5a2e` | `#6b7a3a` | `#a0a45a` |
| `peleCinza` | Ciborgue | `#22282e` | `#3a4644` | `#5a6a5a` | `#7f8f7a` | `#b6bea2` |
| `aco` | armaduras, braço mecânico | `#1c1a2a` | `#2e3244` | `#474f60` | `#6f7886` | `#b8b8ae` |
| `acoClaro` | placas, biqueiras, emissores | `#2e3244` | `#474f60` | `#6e7688` | `#9ea6b0` | `#dedcc8` |
| `couro` | colete, botas, cintos | `#22161e` | `#3c2a26` | `#5a3e2a` | `#7a5634` | `#a67c46` |
| `tecido` | faixas, panos | `#2e1226` | `#54202c` | `#80352c` | `#a24e36` | `#c87c4a` |
| `borracha` | cabos, mangueiras | `#16121c` | `#261e2c` | `#3a2e40` | `#54445a` | `#7e6c80` |
| `presa` | dentes, ossos, chifres | `#4e4656` | `#8e8474` | `#cbbd9c` | `#e9ddbc` | `#fffaec` |
| `madeira` | catapulta, portões, cabos de ferramenta | `#26161e` | `#472a26` | `#6e442c` | `#946236` | `#bf8e4c` |
| `pedra` | castelo, pedras, pedrinhas, sulcos rúnicos | `#23222c` | `#3d3c46` | `#5b5a5f` | `#7c7a76` | `#a5a18f` |
| `grama` | chão (grama, tufos) | `#232d2c` | `#35432f` | `#4b5a36` | `#627040` | `#858b52` |
| `terra` | chão (caminho) | `#35272a` | `#58443a` | `#7a6049` | `#977b5b` | `#b59c76` |
| `ciano` ⚡ | energia rúnica, plasma, runas | `#0c3252` | `#14788c` | `#3ff5ff` | `#a8fcf0` | `#f2fff0` |
| `vermelho` ⚡ | olhos, perigo, núcleo ferido | `#3a0a26` | `#78101c` | `#ff3b4e` | `#ff9a78` | `#fff0d8` |
| `fogo` ⚡ | explosões, brasas, forja | `#4a1020` | `#a8321c` | `#ec6a24` | `#ffae3c` | `#ffe8a0` |

Avulsas: contorno `#1e1512` · ferrugem `#7a4a2c` / `#4e2c26` · flores `#c4bd9c` (creme), `#b9a55e` (amarela),
`#958aa4` (lilás), miolo `#e0cf82`.

⚡ = **emissivo**: ciano, vermelho e fogo **só** em energia, runas, olhos, brilhos e explosões — nunca em
roupa, pedra ou madeira "pintadas".

**Contraste entre camadas** (o que deixa os personagens legíveis):
- **Cenário** (grama, terra, pedra do chão): rampas **mais escuras e dessaturadas**; o tom de base fica em valor
  médio-baixo e o tom 4 é raro (só pontas de capim ao sol, brilho de pedrinha).
- **Personagens e torres**: saturação maior e faixa de valor mais ampla (tons 0 a 4), contorno externo escuro.
- **Emissivos**: os pixels mais claros e saturados da tela; o olho e a arma são os pontos focais do inimigo.
- Teste: todo sprite novo precisa ler bem **sobre a grama e sobre a terra** (o preview mostra os dois fundos).

## 3. Luz e sombreamento

- Luz do **canto superior esquerdo**. Em cada parte: **tom 3** na borda de cima/esquerda, **tom 2** no resto,
  **tons 0–1** nos pixels mais de baixo/direita — **no máximo ~30% da parte** (o gerador confere) —, **tom 4** só em
  brilho especular (1–3 px no canto iluminado das placas de metal) e rim light.
- **Rim light**: 1 px no tom 3 na borda direita da silhueta (personagens, torres, objetos em pé).
- **Relevo × depressão no chão**: o que sobe (pedras, tufos) é claro em cima/esquerda e escuro embaixo/direita;
  o que afunda (caminho, sulcos, circuitos gravados) tem a **parede de cima/esquerda escura** (sombra do barranco)
  e a **borda de baixo/direita clara**.

## 4. Contorno seletivo

- **Externo**: 1 px `#1e1512` em volta da silhueta de personagens, torres e objetos em pé.
- **Interno**: onde uma parte encosta em outra já desenhada, a borda leva o **tom 0 do material da parte da frente**
  (nunca preto).
- **Sem contorno**: emissivos (núcleo claro + halo de 1–2 px nos tons da rampa; com `glow` o halo se espalha no vazio)
  e **elementos do chão** (tiles, tufos, flores, pedrinhas, caminho): o volume vem do tom mais escuro do próprio material
  embaixo/à direita.

## 5. Densidade de detalhe

Hierarquia: silhueta → grandes massas de material → poucos detalhes → pontos focais emissivos.
**Proibido "ruído de 1 px" espalhado**: todo detalhe é uma marca com forma (2 px ou mais), exceto brilho especular
e texturas de material com semente fixa.

| Detalhe | Tamanho em pixels |
|---|---|
| Rebite | 2 px: 1 claro (tom 4) + 1 escuro (tom 0) embaixo/à direita; espaçamento ≥ 4 px |
| Costura, risco, junta | linha de 1 px no tom 0–1, tracejada a cada 2–3 px |
| Placa de metal | ≥ 6×4 px (menor que isso vira rebite) |
| Olho / emissor | núcleo de 2–4 px + halo de 1–2 px |
| Runa | glifo de 3×5 px, traço de 1 px, emissivo |
| Lâmina de grama | 1×2 a 1×3 px (ponta tom 3/4, pé tom 1 à direita) |
| Tufo de capim | 4–9 px de largura × 4–7 px de altura, sombra de contato de 1 px (tom 0) |
| Flor | cruz de 3×3 px ou 1 px, com 1 px de haste/sombra; grupos de 1–3 |
| Folha / aglomerado de folhas (árvores) | massas de 3×2 a 5×4 px com 1 px de luz (tom 3/4) em cima/esquerda |
| Pedrinha no chão | 2×2 a 7×5 px (tom 3–4 em cima/esquerda, 1 embaixo/direita) |
| Tijolo / pedra de muralha | 8–12 × 5–7 px, junta de 1 px |
| Tábua de madeira | 4–6 px de largura, veio de 1 px a cada 3–5 px |

## 6. Tamanhos de referência (no mundo 1280×720)

| Objeto | Tamanho | Observação |
|---|---|---|
| Inimigo comum (orc Saqueador) | ~100–107 px de altura (quadro 136×110) | régua de tudo |
| Inimigo pesado / elite | 100–115 px (Brutamontes 128×110, Ciborgue 128×106) | mais largo, não muito mais alto |
| Inimigo voador (futuro) | 60–90 px | voa ~40 px acima da sombra |
| Torre (base + peça de cima) | 100–150 px de altura, base 80–130 px | Besta ~100 px, Catapulta ~150 px com o braço |
| Plataforma rúnica | 100×60 px | centro da face de cima = ponto da torre |
| Castelo | ~260×272 px (≈ 2,5× o orc) | maior objeto do mapa |
| Núcleo Arcano | 76×124 px | |
| Árvore | 100–130 px de altura (≈ 1–1,3× o orc), copa 70–100 px | |
| Pedra decorativa | 30–76 px de largura | |
| Aglomerado de cristais | ~84×86 px | |
| Largura do caminho | 66 px (`MAP01.pathWidth`) | cabe um orc de lado com folga |
| Projéteis | 10–52 px | |

## 7. Sombra no chão

- **Nunca desenhada no sprite.** O jogo desenha uma **elipse de pixels duros** (sem blur) na camada de sombras,
  cor `rgb(30, 14, 40)` com opacidade 0,28 (`SHADOW.alpha`), **deslocada +7, +4 px** (para baixo/direita).
- Tamanho (`SHADOWS` em `src/config/art.js`): personagens ≈ 40–60% da largura do quadro × altura de ¼ da largura
  (orc 56×15); torres e castelo ≈ a largura da base (Besta 84×30, Catapulta 124×38, castelo 270×60).
- O chão (tiles, tufos, pedrinhas) não tem sombra projetada: só a sombra de contato de 1 px embutida no desenho.
- Sprites de pixel art não escalam a sombra; objetos no ar (projéteis) usam a sombra suave que encolhe com a altura.

## 8. Regras de sprite (personagens, torres, objetos)

- **Partes**: cada sprite é desenhado em partes, de trás para frente. O gerador sombreia cada parte, aplica a textura
  do material e o brilho especular nas placas de metal.
- **Texturas** com semente fixa e presas à parte (não mudam entre quadros): aço escovado, ferrugem nas bordas,
  couro, tecido, volume de pele.
- **Câmera 3/4**, personagem **olhando para a direita** (o jogo espelha).
- **Ancoragem**: pés/base na **borda inferior central** do quadro (linha de baixo = contorno do chão).
- **Margem**: pelo menos 1 px livre em volta de tudo, **considerando o maior deslocamento da animação**.
- **Animação**: gerada pelas partes a partir de uma fase `t` (0..1), só com **deslocamentos inteiros**. Exporta uma
  folha com os quadros lado a lado (`<nome>-walk.png`), um quadro parado (`<nome>.png`) e um JSON com dados por quadro.
- **NÃO desenhe**: sombra projetada, halos fora da silhueta além do halo dos emissivos, rotação ou escala.

## 9. Chão e mapas

- O chão de cada mapa é **uma imagem do tamanho do mundo** (1280×720), gerada por `npm run pixel` a partir dos dados
  do mapa (`src/data/map01.js`) e do mesmo `PathTrack` do jogo → o traçado desenhado é o que os inimigos seguem.
- Grama em **tiles de 32×32** (6 variações com o **mesmo tom de base**, para não aparecer emenda) + manchas de musgo
  (um tom abaixo, borda recortada) + tufos, flores e pedrinhas espalhados por semente fixa.
- Caminho de terra com **borda irregular** (nunca linha reta), barranco escuro em cima/esquerda e claro embaixo/direita,
  capim avançando sobre a terra, sulcos, pegadas e pedrinhas.
- Mudou o caminho do mapa? Rode `npm run pixel`; o jogo avisa no console se o chão estiver desatualizado.

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
| `ground-map01` (pixel art 1×, chão) | 1280×720 | 0,0 (canto superior esquerdo) | — | nenhuma |
| `enemy-cyber-orc` (pixel art 1×, Saqueador) | 136×110 | 61,110 (entre os pés) | direita (espelhado) | caminhada em 8 quadros, dano, morte |
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

### Chão do mapa 1 — `ground-map01` (pixel art 1×) ✅
- **Arquivos**: `chao-map01.png` (1280×720, o mundo inteiro) + `chao-map01.json` (caminho, largura e raio usados no
  desenho, para o jogo conferir). Fonte: `tools/pixel-art/cenario/chao.js` (dados de `src/data/map01.js`).
- **No jogo**: `MapRenderer` coloca a imagem em (0, 0) na camada `DEPTH.GROUND`, com iluminação dinâmica.
  Decoração, sombras, torres e castelo ficam por cima como antes.
- Cena de conferência: `tools/pixel-art/cena-referencia.png` (`tools/pixel-art/cenario/cena.js`).

### Orc Cibernético — `enemy-cyber-orc` (pixel art 1×, "Saqueador") ✅
Versão padrão do jogo (`ORC_VARIANT = 'b'` em `src/config/art.js`), escolhida na T09 e ajustada na T10.
- **Arquivos**: `orc-b-walk.png` (folha 1088×110, **8 quadros** de 136×110), `orc-b-walk.json` (olho por quadro) e
  `orc-b.png` (parado). Fonte: `tools/pixel-art/sprites/orc-b.js`. A versão da T09 (antes do ajuste) está congelada
  em `tools/pixel-art/legacy/orc-b-v1.js`, só para o comparativo "B antes × B ajustado" de `escolha-orc.html`.
- **Quadro**: 136×110 = tamanho no mundo (a lâmina e seu brilho ocupam a direita) · pivot entre os pés (61, 110) ·
  **olha para a direita** (espelhado para a esquerda).
- **Corpo**: alto e magro, inclinado para frente como quem vai atacar; pernas longas (coxa de pele, canela enfaixada,
  bota de couro com sola e biqueira de aço); colete de couro, alça, cinto com bolsa, faixas; ombreira pequena;
  cabeça projetada com orelha longa, mandíbula comprida, presa, moicano, monóculo vermelho e placa de metal rebitada.
- **Braço da frente inteiro mecânico**: braço de aço com pistão, cotovelo, antebraço blindado, garra, cabos e 2 linhas
  ciano; **lâmina de plasma** saindo do antebraço (núcleo claro de 4 px + brilho ciano de 2 px que se espalha no vazio,
  sem contorno). Lâmina e olho vermelho são os dois pontos focais.
- **Caminhada**: passos longos (pernas ±14 px, pé sobe 8 px) com joelhos dobrados; corpo sobe 2 px na passagem e dá um
  bote de 2 px à frente no contato; braço de carne balança ±8 px; lâmina firme.
- **Pontos de encaixe** (px do mundo, a partir do pivot): `eye` (+33, −86) na pose parada (na caminhada vem do
  JSON) · `hit` (0, −60) · `top` −106. Sombra: elipse de pixels 56×15. `walkCycle` 44.
- **No jogo**: animação "walk" em loop com velocidade proporcional ao passo; dano = flash branco + recuo de 2 px;
  morte = quadro parado, pisca, afunda e vira faíscas.

### Orc Cibernético da T08 — alternativa (`ORC_VARIANT = 'atual'` ou `?orc=atual`)
- `orc-walk.png` (928×104, 8 quadros de 116×104), `orc-walk.json`, `orc.png`; fonte `tools/pixel-art/sprites/orc.js`.
  Pivot (58, 104) · `eye` (+39, −66) · `hit` (0, −54) · `top` −96 · sombra 56×16. Clava de plasma, tronco curvado.

### Arte pronta para inimigos futuros (`tools/pixel-art/sprites/futuros/`, ainda fora do jogo)
Nasceram como versões A e C do orc (T09). `npm run pixel` continua gerando os PNGs; o inimigo e seu manifesto
entram quando a fase deles chegar.

| Sprite | Arquivos | Quadro | Pivot | Olho (parado) | Hit | Top | Sombra | walkCycle |
|---|---|---|---|---|---|---|---|---|
| Brutamontes (`futuros/brutamontes.js`) | `brutamontes-walk.png/json`, `brutamontes.png` | 128×110 | 70,110 | +34,−52 | 0,−50 | −104 | 80×18 | 52 |
| Ciborgue de guerra (`futuros/ciborgue.js`) | `ciborgue-walk.png/json`, `ciborgue.png` | 128×106 | 65,106 | +41,−80 | 0,−52 | −92 | 64×16 | 42 |

- **Brutamontes** (candidato ao inimigo blindado e lento da Fase 2): muito largo e curvado, cabeça pequena e baixa
  entre os ombros, braços enormes, placas rebitadas, pele oliva escura, martelo de duas mãos com cabeça de plasma
  apoiado no ombro. Caminhada: passo curto (±8 px), corpo afunda 2 px no apoio, tronco balança ±2 px e o ombro do
  martelo sobe/desce 2 px a cada passo.
- **Ciborgue de guerra** (candidato a inimigo mecânico de elite): pernas de pássaro (joelho para frente, jarrete alto
  para trás), cabos, reator ciano no peito, capacete com visor vermelho horizontal, presas por baixo, braço-canhão;
  pele verde-acinzentada só nos ombros e no maxilar. Caminhada mecânica: pé anda em linha reta no apoio, afunda 3 px
  no pouso ("tranco") e o canhão atrasa 1 quadro.

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
