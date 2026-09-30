# Reino de Aço e Runas — Tower Defense

Jogo tower defense de navegador feito com **Phaser 4** (4.2.x), **Vite** e **JavaScript** (ES modules, sem TypeScript).

Referência de API: `node_modules/phaser/skills/` (skills oficiais do Phaser 4). Consulte-as antes de usar
qualquer API — o Phaser 4 mudou bastante em relação ao 3 (FX viraram Filters, pipelines viraram RenderNodes,
`setPipeline('Light2D')` virou `setLighting(true)`, `setTintFill` virou `setTint().setTintMode(Phaser.TintModes.FILL)`,
Bloom/Shine agora são `Phaser.Actions.AddEffectBloom` / `Phaser.Actions.AddEffectShine`).

## Conceito

Medieval fundido com futurista. Runas funcionam como circuitos, cavaleiros usam armas de plasma, o castelo tem
escudos de energia. O jogador defende o **Núcleo Arcano** (um cristal flutuando no centro do castelo) contra ondas
de inimigos que seguem um caminho fixo. Derrotar inimigos rende **éter**, gasto para construir torres em
qualquer ponto válido do mapa (estilo Bloons TD); cada torre surge sobre uma plataforma rúnica.

## Direção de arte

**Pixel art desenhada em código** (substitui as direções anteriores "cartoon sério" e "pintada estilizada").
Os sprites são gerados por `npm run pixel` a partir de módulos JS em `tools/pixel-art/sprites/`, que desenham
cada personagem **em partes** numa grade pequena. Não se edita PNG à mão: muda-se o módulo e roda o gerador.

> Transição em andamento: o **Orc Cibernético** já é pixel art (com caminhada). Torres, castelo, cenário,
> projéteis e ícones ainda são os SVGs antigos (placeholders) e serão refeitos no mesmo gerador.

### Gerador (`tools/pixel-art/`)
- Primitivas rasterizadas na grade, **sem antialias**: retângulo, polígono, elipse, linha grossa, pixel avulso.
- **Cel shading automático por parte**, rampa de 3 tons por material: claro nas bordas de cima/esquerda, escuro nos
  pixels mais de baixo/direita (bordas primeiro), **no máximo ~30% de cada parte** (o gerador mede e avisa).
  Luz do canto superior esquerdo.
- **Contorno** `#1e1512` de 1 px em volta da silhueta inteira + contorno interno onde uma parte se sobrepõe a
  outra já desenhada. Vizinhos são consultados com checagem de limites (nunca deslocamento circular de máscara).
- **Paleta fixa** em `tools/pixel-art/palette.js` (pele, aço, couro, tecido, ciano, vermelho, presa + ferrugem).
  Ciano `#3ff5ff` e vermelho só em energia, runas, olhos e brilhos.
- **Animação gerada pelas partes**, parametrizada por uma fase `t` (0..1), **só com deslocamentos inteiros**.
  Sprite sheets com os quadros lado a lado + um PNG parado + um JSON com dados por quadro (ex.: posição do olho);
  `tools/pixel-art/preview.html` mostra tudo em loop (4× e tamanho real, sobre grama e terra) e o "antes × depois".
  O gerador também confere se as pernas mudam de verdade entre os quadros da caminhada.
- Câmera 3/4, personagem olhando para a **direita** (o jogo espelha), pés na borda inferior do quadro.

### No jogo (renderização pixel-perfect)
- `pixelArt: true` (filtro NEAREST, `roundPixels`, canvas "pixelated"). **1 pixel da arte = `PIXEL_SCALE` (2) px do
  mundo** 1280×720. `RENDER_SCALE` e zoom das câmeras são sempre **inteiros**.
- Texturas que não são pixel art (SVGs antigos, brilhos, sombras suaves) continuam com filtro LINEAR.
- Em sprites de pixel art **não há escala fracionada nem rotação**: squash, quique e inclinação viram deslocamentos
  de pixels inteiros (ou quadros da animação). Flash branco (tint FILL) e piscar continuam. Tweens de escala só
  na UI e em efeitos.
- Posição dos sprites de pixel art alinhada à grade de `PIXEL_SCALE`.
- Sombra no chão de pixel art = **elipse de pixels duros**, sem blur, deslocada para baixo/direita.
- **Luzes pontuais e Bloom só nos brilhos** (olho, plasma, cristais), com intensidade moderada para não borrar.
- Manifesto de arte (`src/config/art.js`): `pixel: true`, `frame` (tamanho do quadro) e `anims` (sprite sheet);
  especificação dos assets em **`ART_SPEC.md`**.

### Regras gerais que continuam
- Iluminação dinâmica (`setLighting`), sombras numa camada própria abaixo dos objetos, `depth = DEPTH.OBJECTS + y`.
- Tipografia: `FONT` = Cinzel (títulos), `FONT_NUMBERS` = Oxanium (HUD, custos, dano).

## Regras de animação

Personalidade vem do **peso**, não da elasticidade. Nada fica 100% parado, mas nada é "borrachudo".

- **Pixel art**: movimento por **quadros** e por **deslocamentos inteiros** de pixels da arte. Sem escala fracionada
  nem rotação no sprite.
- **Inimigos andam com passo pesado**. Com sprite sheet, a caminhada toca em loop e o `frameRate` é proporcional à
  velocidade (um ciclo a cada `ENEMY_ANIM.walkCycle` px); o quique procedural fica desligado. Poeira ocasional no
  chão nos quadros de passada. Constantes em `ENEMY_ANIM` (`src/config/visual.js`).
- **Dano**: flash branco (tint FILL) + recuo de 1 pixel da arte por um instante.
- **Morte (pixel art)**: para no quadro parado, pisca e afunda em passos de pixel, e se desfaz em faíscas/destroços.
- **Arte vetorial antiga** (enquanto existir): squash contido (máx. 5–8%), tombo ao morrer.
- **Easing `Elastic` só em UI e explosões.** No mundo use `Quad`, `Cubic`, `Sine` e `Back` com pouco overshoot.
- **Torres com recuo** ao disparar e retorno firme (a migrar para pixel art: hoje ainda usam `Elastic` e escala).
- **Construção = materialização rúnica**: círculo de runas girando + luz ciano → base revelada de baixo para cima
  em holograma (`setCrop` + linha de varredura) → peças de cima descem e encaixam (`Back.easeOut`, squash ~6%) →
  flash e faíscas. Genérico em `Tower.playBuildAnimation` a partir de `this.pieces` (base primeiro); tempos e
  cores em `BUILD_FX` (visual.js), duração em `BALANCE.towers.buildTime`. A torre só atira depois de terminar.
- **Cristais flutuam e pulsam** devagar (subida/descida senoidal + intensidade da luz).
- **Explosões** com partículas (ciano, laranja, faíscas metálicas) + luz temporária.
- **Números de dano** sobem e somem rápido (fonte `FONT_NUMBERS`).
- **Leve tremida de câmera** só nos impactos grandes (catapulta, dano no Núcleo).
- Projéteis de catapulta voam **em arco**; a **sombra acompanha no chão** e cresce/escurece ao se aproximar do solo.

## Organização do código

```
index.html
tools/pixel-art/          gerador de pixel art (`npm run pixel`): palette.js, lib/PixelCanvas.js, sprites/*.js, preview.html
public/assets/            SVGs substituíveis (torres, inimigos, castelo, cristais, cenário, ícones)
src/
  main.js                 configuração do Phaser.Game
  config/balance.js       TODOS os valores de balanceamento (dano, alcance, custo, vida, velocidade, ondas, economia)
  config/visual.js        cores, profundidades, luzes, bloom, escala de renderização
  data/map01.js           caminho, castelo e decoração do mapa 1 (decorações também bloqueiam construção)
  scenes/                 BootScene (carregamento), GameScene (mundo), UIScene (HUD), ResultScene (vitória/derrota)
  world/                  desenho do mapa, caminho (PathTrack), castelo + Núcleo Arcano, PlacementRules (área válida)
  towers/                 Tower (base, com plataforma rúnica), LaserCrossbow, PlasmaCatapult, TowerPlacer (modo posicionamento)
  enemies/                Enemy (base), CyberOrc
  projectiles/            LaserBolt, PlasmaBall
  waves/                  WaveManager
  effects/                Effects (explosões, números de dano, flashes, luzes temporárias), Shadow
  ui/                     TowerBar (barra de torres), TowerInfoPanel, towerPreview (miniaturas), Button
```

Convenções:
- Balanceamento **só** em `src/config/balance.js`. Nenhum número de gameplay espalhado pelo código.
- Comunicação entre cenas via `this.game.events` (eventos nomeados em `src/config/events.js`).
- Coordenadas de mundo fixas em 1280×720; a renderização usa `RENDER_SCALE` (câmeras com zoom) para ficar nítida.
- Todas as entidades do mundo são `Container`s posicionados no **ponto de contato com o chão**.

## Escopo — Fase 1 (atual)

- 1 mapa com caminho fixo e **posicionamento livre de torres, com regras de área válida**
  (fora do caminho, de outras torres, das decorações, do castelo, do HUD e da barra de torres — valores em
  `BALANCE.placement` e `footprintRadius` de cada torre). Barra de torres embaixo (teclas 1/2), prévia
  translúcida com alcance (ciano = válido, vermelho = inválido), clique constrói, Shift constrói várias,
  botão direito/Esc cancela, no toque arraste a carta até o mapa.
- 2 torres: **Besta Laser** (rápida, barata, disparo em linha reta) e **Catapulta de Plasma** (dano em área, mais cara, disparo em arco)
- 1 inimigo: **Orc Cibernético** (armadura metálica, olho robótico vermelho)
- 5 ondas com dificuldade crescente
- Recurso **éter**: ganho ao derrotar inimigos, gasto para construir torres
- Vida do Núcleo Arcano, telas de vitória e derrota
- Interface: éter, vida do Núcleo, onda atual, botão para iniciar a próxima onda

## Roadmap (NÃO implementar ainda)

- **Fase 2**: upgrades das torres (2 a 3 níveis cada); **Torre de Estase** (desacelera inimigos);
  **Gárgula-Drone** (voadora, só algumas torres acertam); **Golem de Sucata** (blindado e lento).
- **Fase 3**: **Ninho do Dragão Mecânico** (fogo em linha); chefe **Dragão Ancestral** reconstruído com peças
  de metal; trilha sonora e efeitos sonoros.
- **Fase 4**: mais mapas, menu inicial, seleção de fases e salvamento de progresso.

## Comandos

- `npm install` — instala dependências
- `npm run dev` — servidor de desenvolvimento (Vite) em http://localhost:5173
- `npm run pixel` — gera os sprites de pixel art em `public/assets/` e o `tools/pixel-art/preview.html`
- `npm run build` — build de produção em `dist/`
- `npm run preview` — serve o build de produção

## Fluxo de trabalho

Versionamento com **git** (branch `main`, sem remoto por enquanto). Identidade configurada só neste repositório.

- **Fila de tarefas** em `TAREFAS.md`:
  - `/fila <tarefa>` adiciona ao final da fila, **sem executar**.
  - `/proxima` executa a próxima tarefa pendente, **uma por vez**, e **para** para o usuário testar.
- **Tarefa nova no meio de outra**: se o usuário mandar uma tarefa nova pela conversa enquanto outra está em
  andamento, **NÃO** comece a nova. Adicione-a ao final de `TAREFAS.md` (mesmo formato do `/fila`), confirme em
  uma linha e continue a tarefa atual.
- **Um commit ao fim de cada tarefa concluída**, mensagem em português `<ID>: <título>` e um resumo curto no corpo.
  **Nunca** commitar com `npm run build` quebrado.
- **Pedidos soltos** fora da fila (ajustes rápidos) também terminam em commit, com mensagem clara.
- **Proibido sem autorização explícita do usuário**: `git reset --hard`, `git push --force`, `git clean`, rebase,
  reescrever histórico, apagar branches.
- **Desfazer uma tarefa**: use `git revert` do commit dela (mantém o histórico) e mostre ao usuário o que vai ser
  revertido (`git show --stat <commit>`) **antes** de reverter.
- **"O que mudou?"**: responda com base em `git log` / `git diff`.
