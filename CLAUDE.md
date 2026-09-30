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
plataformas rúnicas ao lado do caminho.

## Estilo visual

Direção: **"cartoon sério"** (referências: Warcraft III, Kingdom Rush Vengeance). Leitura clara e personalidade,
mas com **peso, desgaste e ameaça**. Nada de ar infantil.

> Transição em andamento: o piloto (paleta do mapa + Orc Cibernético + animações do inimigo) já segue esta direção.
> Torres, castelo, decoração do cenário e UI ainda estão no estilo antigo (arredondado/saturado) e serão migrados.

- **2.5D cartoon**, câmera em visão 3/4 (de cima, levemente inclinada): objetos mostram a face de cima e a frente.
- **Formas angulares**: cunhas, trapézios e placas chanfradas em vez de círculos. Silhuetas **pesadas e
  assimétricas** (ombros largos, massa concentrada em cima, corpo curvado para frente nos inimigos).
- **Contorno 2–3 px, variável**, cor **marrom-escuro quente `#1e1512`**:
  - mais grosso (~3 px) na silhueta externa;
  - fino (~1–1.5 px) nos detalhes internos (placas, rebites, rugas, arranhões).
- **Cel shading** em tudo: luz fixa vinda do **canto superior esquerdo**. Cada forma tem:
  1. cor base;
  2. versão mais escura no lado oposto à luz (baixo/direita);
  3. um brilho pequeno e duro no lado iluminado (cima/esquerda) — em metal, uma aresta clara fina.
- **Paleta do mundo dessaturada e mais escura**: musgo, pedra fria, terra batida, madeira velha; luz de **fim de
  tarde** (ambiente quente e baixo).
- **Saturação é reservada**: ciano `#3ff5ff`, vermelho e laranja são os **únicos** tons saturados, e só aparecem em
  **energia, runas, olhos e explosões**. Todo o resto (pele, metal, madeira, tecido, pedra) fica dessaturado.
- **Desgaste**: rebites, arranhões, ferrugem nas bordas, amassados, runas gravadas (sulcos finos, não adesivos).
- **Sombras elípticas suaves** no chão, deslocadas para **baixo e à direita**, sob torres, inimigos e projéteis.
  Sombras ficam numa camada própria, sempre abaixo de todos os objetos.
- **Ordenação por profundidade**: `depth = DEPTH.OBJECTS + y` (quem está mais abaixo na tela fica na frente).
- **Tipografia**: `FONT` = **Cinzel** (títulos, banners, nomes); `FONT_NUMBERS` = **Oxanium** (HUD, custos,
  números de dano). Carregadas do Google Fonts em `index.html`.
- Recursos do Phaser 4:
  - **Iluminação dinâmica** (`setLighting(true)` + `this.lights`): chão, torres, inimigos e castelo são iluminados;
    cristais, disparos e explosões criam luzes pontuais.
  - **Bloom** na câmera do jogo (só brilhos intensos — cristais, lasers, plasma — "vazam" luz).
  - **Shine** no Núcleo Arcano e nos cristais das torres.
  - `PointLight` (game object) para halos visíveis de cristais e projéteis.
- Arte de personagens e torres fica em **SVG separados em `public/assets/`**, para ser trocada por arte
  profissional sem mexer no código. Mantenha nomes de arquivo e proporções; os pontos de ancoragem
  (pés/base) ficam na **borda inferior central** de cada SVG. Pontos de encaixe (olho, topo, montagens) ficam em
  `src/config/art.js`.

## Regras de animação

Personalidade vem do **peso**, não da elasticidade. Nada fica 100% parado, mas nada é "borrachudo".

- **Squash and stretch contido**: no máximo **5–8%** de deformação.
- **Inimigos andam com passo pesado**: sem pulinhos. Balanço lateral curto, leve afundada a cada passo e poeira
  ocasional no chão. Constantes em `ENEMY_ANIM` (`src/config/visual.js`).
- **Dano**: flash branco (tint FILL) + tranco curto (≤ 8%).
- **Morte**: tombo pesado para frente, impacto no chão e desmanche em faíscas/destroços — sem esticar.
- **Easing `Elastic` só em UI e explosões.** No mundo use `Quad`, `Cubic`, `Sine` e `Back` com pouco overshoot.
- **Torres com recuo** ao disparar e retorno firme (a migrar para a nova direção: hoje ainda usam `Elastic`).
- **Cristais flutuam e pulsam** devagar (subida/descida senoidal + intensidade da luz).
- **Explosões** com partículas (ciano, laranja, faíscas metálicas) + luz temporária.
- **Números de dano** sobem e somem rápido (fonte `FONT_NUMBERS`).
- **Leve tremida de câmera** só nos impactos grandes (catapulta, dano no Núcleo).
- Projéteis de catapulta voam **em arco**; a **sombra acompanha no chão** e cresce/escurece ao se aproximar do solo.

## Organização do código

```
index.html
public/assets/            SVGs substituíveis (torres, inimigos, castelo, cristais, cenário, ícones)
src/
  main.js                 configuração do Phaser.Game
  config/balance.js       TODOS os valores de balanceamento (dano, alcance, custo, vida, velocidade, ondas, economia)
  config/visual.js        cores, profundidades, luzes, bloom, escala de renderização
  data/map01.js           caminho, plataformas de construção e decoração do mapa 1
  scenes/                 BootScene (carregamento), GameScene (mundo), UIScene (HUD), ResultScene (vitória/derrota)
  world/                  desenho do mapa, caminho (PathTrack), castelo + Núcleo Arcano
  towers/                 Tower (base), LaserCrossbow, PlasmaCatapult
  enemies/                Enemy (base), CyberOrc
  projectiles/            LaserBolt, PlasmaBall
  waves/                  WaveManager
  effects/                Effects (explosões, números de dano, flashes, luzes temporárias), Shadow
  ui/                     BuildMenu, Button, helpers de texto
```

Convenções:
- Balanceamento **só** em `src/config/balance.js`. Nenhum número de gameplay espalhado pelo código.
- Comunicação entre cenas via `this.game.events` (eventos nomeados em `src/config/events.js`).
- Coordenadas de mundo fixas em 1280×720; a renderização usa `RENDER_SCALE` (câmeras com zoom) para ficar nítida.
- Todas as entidades do mundo são `Container`s posicionados no **ponto de contato com o chão**.

## Escopo — Fase 1 (atual)

- 1 mapa com caminho fixo e plataformas para construir torres
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
