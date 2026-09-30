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

**Documento de design: `DESIGN.md`** — pilares, elenco da versão 1.0 (8 torres, 10 inimigos + 2 chefes), matriz
inimigo × torre, caminhos de upgrade das 8 torres, ordem de introdução por mapa e o marco "versão 0.5". Consulte-o antes
de criar qualquer torre, inimigo ou mapa; ele é revisado a cada fase do plano de produção.

## Direção de arte

**Pixel art desenhada em código** (substitui as direções anteriores "cartoon sério" e "pintada estilizada").
Os sprites são gerados por `npm run pixel` a partir de módulos JS em `tools/pixel-art/sprites/`, que desenham
cada personagem **em partes** numa grade pequena. Não se edita PNG à mão: muda-se o módulo e roda o gerador.

> Transição em andamento: o **Orc Cibernético** (com caminhada) e o **chão do mapa 1** (T12) já são pixel art 1×.
> A **decoração** é pixel art em 3 kits = biomas (T15/T18): mapa 1 = kit A (Bosque antigo) com transição para o kit C
> (Floresta rúnica) perto do castelo; kit B (Fronteira de pinheiros) guardado para um mapa futuro. Kit base do mapa em
> `decorKit` (padrão `DECOR_KIT` em `src/config/art.js`), troca por item com `kit`. As **torres** têm 3 versões em pixel
> art aguardando escolha (T19, `TOWER_VARIANT`). Castelo, plataforma, projéteis e ícones ainda são os SVGs antigos
> (placeholders) e serão refeitos no mesmo gerador.
> **Guia de estilo ("bíblia") em `ART_SPEC.md`**: paleta completa, luz, contorno, densidade de detalhe, tamanhos de
> referência e sombras. Toda arte nova segue esse guia.
> O orc padrão é o **"Saqueador"** (`sprites/orc-b.js`, `ORC_VARIANT = 'b'` em `src/config/art.js`); o orc da T08
> continua como alternativa (`?orc=atual` na URL). `tools/pixel-art/escolha-orc.html` compara "B antes × B ajustado".
> Arte pronta para inimigos futuros fica em `tools/pixel-art/sprites/futuros/` (ver Plano de produção, Fase D).

### Resolução
- **Pixel art 1×**: 1 pixel da arte = **1 pixel do mundo** 1280×720 (`PIXEL_SCALE` = 1). Vale para TODA a arte nova.
- **Inimigos comuns com ~80 px de altura** (T13; orc Saqueador: quadro 102×83, ~81 px com o moicano). Nada de ampliar
  ou reduzir imagem: para mudar o tamanho, as partes são redesenhadas numa grade menor (`PixelCanvas` com `scale`,
  ex.: o Saqueador é desenhado em coordenadas 136×110 e rasterizado na grade 0,75).

### Gerador (`tools/pixel-art/`)
- Primitivas rasterizadas na grade, **sem antialias**: retângulo, polígono, elipse, linha grossa, pixel avulso.
- **Rampas de 5 tons por material com hue shift** (`palette.js`): sombras puxam para roxo/azul frio, luzes para
  amarelo quente. Tons 0–1 (escuros) nos pixels mais de baixo/direita, **no máximo ~30% de cada parte**; tom 3 na
  borda de cima/esquerda; tom 2 no resto; **tom 4 só para brilho especular e rim light**.
- **Contorno seletivo**: externo `#1e1512` em volta da silhueta; **internos na cor mais escura do próprio material**
  (não preto), onde uma parte encosta em outra já desenhada. Vizinhos com checagem de limites (nunca deslocamento
  circular de máscara).
- **Texturas por material com semente fixa** (`lib/textures.js`), em coordenadas locais da parte, iguais em todos os
  quadros (não "fervem"): aço escovado (riscos horizontais sutis), ferrugem (manchas nas bordas das placas), couro
  (ruído leve), tecido (trama), pele (poucos pixels de volume). Texturas só variam entre os tons 2 e 3.
- **Brilho especular**: 1–3 pixels no tom 4 no canto iluminado das placas de metal; **rim light** de 1 px na borda
  direita da silhueta.
- **Emissivos** (olho, runas, plasma): núcleo claro + halo de 1–2 px nos tons da rampa ciano/vermelha, sem contorno.
  Com `glow: true` o halo também se espalha no vazio (lâminas e energia fora da silhueta), sem contorno externo em volta.
- **Detalhes** com hierarquia de leitura: rebites (1 px claro + 1 px escuro), riscos, costuras; olho e arma continuam
  sendo os pontos que mais chamam atenção.
- **Paleta fixa** em `tools/pixel-art/palette.js` (pele, aço, aço claro, couro, tecido, presa, ciano, vermelho +
  ferrugem). Ciano `#3ff5ff` e vermelho só em energia, runas, olhos e brilhos.
- **Animação gerada pelas partes**, parametrizada por uma fase `t` (0..1), **só com deslocamentos inteiros**.
  Sprite sheets com os quadros lado a lado + um PNG parado + um JSON com dados por quadro (ex.: posição do olho);
  `tools/pixel-art/preview.html` mostra tudo em loop (tamanho real e ampliado, sobre grama e terra) e o comparativo
  com a versão anterior (congelada em `tools/pixel-art/legacy/`).
- O gerador confere o sombreamento (≤ ~30% escuro por parte) e se as pernas mudam de verdade entre os quadros.
- Câmera 3/4, personagem olhando para a **direita** (o jogo espelha), pés na borda inferior do quadro.

### No jogo (renderização pixel-perfect)
- `pixelArt: true` (filtro NEAREST, `roundPixels`, canvas "pixelated"). `RENDER_SCALE` e zoom das câmeras são sempre
  **inteiros**.
- Texturas que não são pixel art (SVGs antigos, brilhos, sombras suaves) continuam com filtro LINEAR.
- Em sprites de pixel art **não há escala fracionada nem rotação**: squash, quique e inclinação viram deslocamentos
  de pixels inteiros (ou quadros da animação). Flash branco (tint FILL) e piscar continuam. Tweens de escala só
  na UI e em efeitos.
- Posição dos sprites de pixel art alinhada à grade de `PIXEL_SCALE`.
- **Chão**: uma imagem 1280×720 por mapa (`chao-map01.png`), gerada por `npm run pixel` a partir de `src/data/map01.js`
  e do `PathTrack` (`tools/pixel-art/cenario/chao.js`): tiles de grama 32×32 + caminho de terra com borda irregular.
  Mudou o caminho → rode `npm run pixel` (o jogo avisa no console se o chão ficou desatualizado).
- Sombra no chão de pixel art = **elipse de pixels duros**, sem blur, deslocada para baixo/direita.
- **Luzes pontuais e Bloom só nos brilhos** (olho, plasma, cristais), com intensidade moderada para não borrar.
- Manifesto de arte (`src/config/art.js`): `pixel: true`, `frame` (tamanho do quadro), `anims` e `meta` (JSON do
  gerador); especificação dos assets em **`ART_SPEC.md`**.

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
- **Dano**: flash branco (tint FILL) + recuo de 2 pixels por um instante.
- **Morte (pixel art)**: para no quadro parado, pisca e afunda em passos de pixel, e se desfaz em faíscas/destroços.
- **Arte vetorial antiga** (enquanto existir): squash contido (máx. 5–8%), tombo ao morrer.
- **Easing `Elastic` só em UI e explosões.** No mundo use `Quad`, `Cubic`, `Sine` e `Back` com pouco overshoot.
- **Torres com recuo** ao disparar e retorno firme. SVG atual: `Elastic` e escala. Pixel art (T19): a peça que gira
  (cabeça da besta, braço da catapulta) é uma **folha com um quadro por ângulo**, redesenhada pelo gerador (rotação de
  grade, nunca rotação da imagem); lado esquerdo = quadro espelhado; recuo de 3 px inteiros na direção oposta ao tiro,
  voltando em 2 passos; `kick` = afundar 1 px; retorno do braço com `Back` (sem `Elastic`).
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
tools/sim/simulacao.js    simulação determinística de balanceamento (roda no navegador, ver cabeçalho do arquivo)
tools/pixel-art/          gerador de pixel art (`npm run pixel`): palette.js, lib/PixelCanvas.js, sprites/*.js (futuros/ = inimigos futuros, decoracao/ = kits A/B/C), cenario/ (chão dos mapas + cena de referência), legacy/, preview.html, escolha-orc.html, escolha-decoracao.html (+ decoracao/mapa-*.png), cena-referencia.png
public/assets/            SVGs substituíveis (torres, inimigos, castelo, cristais, cenário, ícones)
src/
  main.js                 configuração do Phaser.Game
  config/decor.js         kits de decoração (itens, quadros, sombras, raio de bloqueio) e decorFor (kit por item)
  config/towerArt.js      torres em pixel art: 3 versões de cada (quadros, ângulos, encaixes, onde entram os upgrades)
  config/balance.js       TODOS os valores de balanceamento (dano, alcance, custo, vida, velocidade, ondas, economia)
  config/visual.js        cores, profundidades, luzes, bloom, escala de renderização
  data/map01.js           caminho, castelo e decoração do mapa 1 (decorações também bloqueiam construção)
  scenes/                 BootScene (carregamento), GameScene (mundo), UIScene (HUD), ResultScene (vitória/derrota)
  world/                  MapRenderer (chão em pixel art + decoração), caminho (PathTrack), castelo + Núcleo Arcano, PlacementRules (área válida)
  towers/                 Tower (base, com plataforma rúnica), LaserCrossbow, PlasmaCatapult, TowerPlacer (modo posicionamento)
  enemies/                Enemy (base: traits, resist, escudo, receiveAttack), CyberOrc
  combat/                 damage.js — quem acerta quem (canHit × camada) e dano final (resist × traits)
  projectiles/            LaserBolt, PlasmaBall
  waves/                  WaveManager
  effects/                Effects (explosões, números de dano, flashes, luzes temporárias), Shadow
  ui/                     TowerBar (barra de torres), TowerInfoPanel, towerPreview (miniaturas), Button
```

Convenções:
- Balanceamento **só** em `src/config/balance.js`. Nenhum número de gameplay espalhado pelo código.
- **Tipos de dano e traits**: torre tem `damageType` e `canHit`; inimigo tem `traits` e `resist`; efeitos das traits
  em `BALANCE.traitRules`. Todo dano passa por `enemy.receiveAttack(dano, tipo)` e todo alvo por `canHit`
  (`src/combat/damage.js`). Capacidades da torre mudam só via `Tower.addCapabilityMod` (hook dos upgrades).
- Mudança que não deveria alterar o gameplay: confirme com `tools/sim/simulacao.js` (mesma assinatura antes e depois).
- Comunicação entre cenas via `this.game.events` (eventos nomeados em `src/config/events.js`).
- Coordenadas de mundo fixas em 1280×720; a renderização usa `RENDER_SCALE` (câmeras com zoom) para ficar nítida.
- Todas as entidades do mundo são `Container`s posicionados no **ponto de contato com o chão**.

## Escopo — base jogável (concluída)

O que o jogo já tem. A produção daqui em diante segue o **Plano de produção** abaixo (fase atual: **A**).

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

## Plano de produção (NÃO implementar antes da hora)

**Regra:** não começar uma fase sem a anterior estar **concluída e aprovada pelo usuário**, exceto quando ele pedir
explicitamente. Dentro de uma fase, o trabalho continua passando pela fila (`TAREFAS.md`).

### Fase A — Vertical slice visual (atual)
Tudo em **pixel art 1×**, seguindo o guia de estilo do `ART_SPEC.md`:
- [x] Orc Cibernético "Saqueador" (orc B) com caminhada (T05–T10)
- [x] Chão e caminho do mapa 1 + guia de estilo (T12)
- [ ] Torres (Besta Laser, Catapulta de Plasma) — 3 versões de cada em pixel art (T19), aguardando a escolha
  (`TOWER_VARIANT` em `src/config/art.js`, padrão `'atual'`; comparação em `tools/pixel-art/escolha-torres.html`)
- [ ] Plataforma rúnica
- [ ] Castelo + Núcleo Arcano
- [x] Decoração (árvores, pedras, cristais): kit A no mapa 1 com transição para o C perto do castelo (T15/T18)
- [ ] Projéteis e efeitos
- [ ] UI com fonte pixel

### Fase B — Fundação técnica
1. **Conteúdo como dados**: torres, inimigos e ondas em definições de dados; criar uma torre = ficha + sprite, sem classe nova.
2. **Simulador de balanceamento permanente**: `npm run sim`, headless, várias estratégias, taxa de vitória por onda
   (ponto de partida: `tools/sim/simulacao.js`, da T11, que hoje roda no navegador).
3. **Testes automáticos da lógica central** (Vitest): dano, resistências, alvo, economia, ondas.
4. **Desempenho**: object pooling (projéteis, partículas, inimigos, textos de dano), limite de luzes, teste de estresse
   (200 inimigos a 60 FPS).
5. **Painel de desenvolvedor** (tecla F1, só em modo dev): spawn de inimigos, éter infinito, pular onda, mostrar
   hitboxes/alcances/FPS.

### Fase C — Sistemas do gênero
- Pausar e velocidade 2×/3×
- Vender torre (reembolso)
- Prioridade de alvo (primeiro / último / mais forte / mais perto)
- Estrutura de upgrades com capacidades (design abaixo)
- Aviso da próxima onda

#### Design dos upgrades (decidido na T16 — ainda não implementado)
- **Caminhos cruzados (estilo Bloons)**: cada torre tem **3 caminhos × 4 níveis**.
- **Regra de cruzamento**: um caminho pode chegar ao **nível 4**; um segundo caminho, só até o **nível 2**; o terceiro
  fica **bloqueado** depois que os outros dois forem escolhidos. (Combinações possíveis por torre: 4/2/0 em qualquer ordem
  de caminhos, e tudo abaixo disso.)
- **Peso visual por nível**: níveis 1–2 = melhorias menores com pequenos detalhes visuais; nível 3 = mudança visível;
  nível 4 = mudança grande de visual **e** de comportamento.
- **Números e capacidades**: um upgrade pode mudar números (dano, alcance, cadência, área…) **e** capacidades —
  `damageType`, `canHit` e efeitos novos (dano contínuo, fragmentação, redução de armadura…) — pelo hook da T11
  (`Tower.addCapabilityMod`; efeitos novos entram como novos campos de modificador).
- **Visual por peças**: cada nível troca ou adiciona **peças** no gerador de pixel art (ex.: outra cabeça, reforço na
  base, emissor novo), sem redesenhar a torre inteira — segue o esquema de peças da materialização (`this.pieces`).
- **Balanceamento**: todo caminho e toda combinação passam pelo **simulador de balanceamento (Fase B)** antes de entrar no jogo.
- **Esboço inicial dos caminhos** (nomes e ideia; números na produção):

  | Torre | Caminho 1 | Caminho 2 | Caminho 3 |
  |---|---|---|---|
  | Besta Laser | **Perfurante** — anti-blindado | **Rajada** — cadência, tiro triplo | **Sentinela** — alcance + acerta voadores |
  | Catapulta de Plasma | **Devastação** — área maior | **Fragmentação** — sub-bombas | **Corrosão** — derrete armadura e escudo, dano contínuo |

### Fase D — Conteúdo em pacotes completos
Cada pacote entra **completo**: arte + animação + som + efeitos + upgrades + balanceamento validado no simulador.
Elenco completo, regras de cada item e ordem por mapa: **`DESIGN.md`** (o marco "versão 0.5" vem antes da 1.0).
- **Inimigos**: Saqueador (orc atual), Lobo de Sucata, **Brutamontes** (blindado), **Ciborgue** (escudo),
  **Gárgula-Drone** (voa), **Enxame de Drones**, Xamã Rúnico, Espectro, Carcaça Divisora, **Golem de Sucata** (tanque
  lento — inimigo diferente do Brutamontes, decidido na T17).
- **Torres**: Torre de Estase, Ninho do Dragão Mecânico, Bobina Rúnica, Balista de Longo Alcance, Forja de Éter,
  Obelisco de Comando.
- **Chefes**: mini-chefe Chefe de Guerra Orc; chefe final **Dragão Ancestral** (com fases), reconstruído com peças de metal.

**Resumo inimigos × tipos de dano** (estrutura pronta desde a T11: `damageType`, `canHit`, `traits`, `resist`,
`BALANCE.traitRules`; matriz completa inimigo × torre no `DESIGN.md`):

| Inimigo | Traits | Fraqueza / resistência |
|---|---|---|
| Saqueador (orc atual) | terrestre | rápido, sem resistências |
| Brutamontes | terrestre, blindado | resiste a perfurante, fraco a explosivo |
| Ciborgue | terrestre, escudo | fraco a perfurante, resiste a plasma/explosivo enquanto tem escudo |
| Gárgula-Drone | voador | a Catapulta não acerta |
| Enxame de Drones | terrestre (voam rente ao chão; muitos, pouca vida) | fraco a dano em área |

Regras de design:
- Preferir **resistências** a imunidades (a única "imunidade" é de camada: voador × `canHit`).
- Toda fraqueza precisa ser **visível** (arte, cor, efeito ao acertar), nunca só um número escondido.
- **Upgrades desbloqueiam capacidades** (trocar `damageType`, adicionar 'voador' ao `canHit`) via `Tower.addCapabilityMod`.

**Arte pronta para inimigos da Fase D** (pixel art 1×, em `tools/pixel-art/sprites/futuros/`, gerada por `npm run pixel`
mas fora do jogo; detalhes em `ART_SPEC.md`):
- **Brutamontes** (`futuros/brutamontes.js`): orc largo e blindado com martelo de plasma no ombro, passo curto e pesado.
- **Ciborgue de guerra** (`futuros/ciborgue.js`): pernas mecânicas de pássaro, reator no peito, visor vermelho, braço-canhão.

### Fase E — Jogo completo
Áudio e música (trilha sonora e efeitos sonoros), menu inicial, seleção de fases, salvamento de progresso, mais mapas,
polimento e testes com jogadores.

## Comandos

- `npm install` — instala dependências
- `npm run dev` — servidor de desenvolvimento (Vite) em http://localhost:5173
- `npm run pixel` — gera os sprites e o chão (`chao-map01.png`) em `public/assets/`, o `tools/pixel-art/preview.html`, o `tools/pixel-art/escolha-orc.html` e a `tools/pixel-art/cena-referencia.png`
- `npm run build` — build de produção em `dist/`
- `npm run preview` — serve o build de produção

## Fluxo de trabalho

Versionamento com **git** (branch `main`), remoto `origin` = repositório **público** https://github.com/Dollyeee/reino-de-aco-e-runas.
Identidade configurada só neste repositório (em outro PC, configure de novo com `git config user.name/user.email`).

- **Sincronizar**: `git pull` antes de começar a trabalhar e `git push` depois de cada commit, para o outro PC achar tudo atualizado.

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
