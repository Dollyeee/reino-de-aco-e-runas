# Fila de tarefas — Reino de Aço e Runas

Este arquivo é mantido pelo Claude Code. O usuário manda as tarefas pela conversa:
- `/fila <prompt>` — adiciona a tarefa no final desta fila, sem executar.
- `/proxima` — executa a próxima tarefa pendente (uma por vez) e para.
- Se chegar uma tarefa nova pela conversa enquanto outra está em andamento, ela é adicionada aqui e a atual continua.

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluída · `[!]` bloqueada (precisa do usuário) · `[-]` descartada

---

## [x] T01 — Posicionamento livre de torres

**Concluída em 2026-09-30.** Resultado:
- Construção livre: barra de torres (`src/ui/TowerBar.js`, teclas 1/2), modo posicionamento com prévia e alcance ciano/vermelho + motivo da recusa (`src/towers/TowerPlacer.js`), clique/Shift/botão direito/Esc e arrastar a carta até o mapa.
- Regras de área válida em `src/world/PlacementRules.js`; valores em `BALANCE.placement` e `footprintRadius` por torre. Plataformas fixas e `buildSlots` removidos; `Tower` usa (x, y) e cria a própria plataforma rúnica com animação.
- `BuildMenu` substituído por `TowerInfoPanel` (painel da torre) + `towerPreview` (miniaturas).
- Simulação com torres nas curvas em U: mista 19/20, só Bestas 13/20, só Catapultas 20/20 — ficou mais fácil que com plataformas fixas. Sugestão (NÃO aplicada): onda 4 healthMult 2.8, onda 5 healthMult 3.5, Catapulta custo 135 → mista 11/20, só Catapultas 12/20, só Bestas perde.
- Teste manual pendente: arrastar a carta com toque num celular/tablet de verdade.

Quero trocar as plataformas fixas por posicionamento LIVRE de torres (estilo Bloons TD). Hoje as torres só podem ser construídas nos 11 buildSlots de src/data/map01.js, via BuildMenu que abre sobre a plataforma. Leia GameScene.js (createSlots, selectSlot, onBuildRequest, onBuildPreview), ui/BuildMenu.js, world/PathTrack.js e config/balance.js antes de começar.

1. Novo fluxo de construção
   - Barra de torres fixa na parte de baixo da tela (UIScene), com uma carta por torre (ícone, nome, custo). Cartas sem éter suficiente ficam acinzentadas. Atalhos de teclado 1 e 2.
   - Ao escolher uma torre, entra em "modo posicionamento": uma prévia translúcida da torre segue o cursor, com o círculo de alcance.
   - Prévia e círculo ficam verdes/ciano quando o local é válido e vermelhos quando inválido.
   - Clique esquerdo em local válido constrói (desconta éter, toca a animação de construção atual). Clique direito ou ESC cancela. Depois de construir, sai do modo posicionamento (segurar Shift mantém o modo, para construir várias).
   - Deve funcionar também com toque: arrastar a carta até o mapa e soltar.
   - Clicar numa torre já construída continua abrindo o painel de informações que já existe.

2. Regras de local válido (valores em balance.js, em BALANCE.placement)
   - Distância até o caminho (PathTrack.distanceTo) > pathWidth/2 + raio da torre.
   - Não sobrepõe outras torres (distância mínima entre centros = soma dos raios de footprint; cada torre tem footprintRadius próprio em BALANCE.towers).
   - Não sobrepõe decorações (árvores, pedras, cristais: raio de bloqueio por tipo) nem o castelo.
   - Dentro do mundo 1280×720 com margem, e fora das áreas ocupadas pelo HUD e pela barra de torres.

3. Visual
   - Quando a torre é construída, uma plataforma rúnica (build-slot.svg) surge embaixo dela com animação e passa a fazer parte da torre.
   - Remova as plataformas vazias do mapa e o buildSlots de map01.js. Adapte Tower para não depender de "slot" (use x, y).
   - Mantenha depth = DEPTH.OBJECTS + y, sombras e iluminação funcionando para torres em qualquer posição.

4. Atualize o CLAUDE.md: escopo da Fase 1 ("posicionamento livre de torres, com regras de área válida") e a organização do código se criar arquivos novos (ex.: src/ui/TowerBar.js, src/world/PlacementRules.js).

5. Teste com npm run dev: construir nas duas extremidades do mapa, tentar construir em cima do caminho, de outra torre, de uma árvore e do castelo (tem que ser recusado), cancelar com ESC e com clique direito, e ficar sem éter. Sem erros no console. No fim, jogue as 5 ondas colocando torres no meio das curvas em U e me diga se ficou fácil demais; se ficou, sugira ajustes em balance.js, mas NÃO aplique sem eu aprovar.

## [x] T02 — Refazer o Orc Cibernético

**Concluída em 2026-09-30.** Resultado:
- `public/assets/enemy-cyber-orc.svg` refeito: 83 → 30 formas, "massa arredondada, acento pontiagudo" (tronco/cabeça/braço arredondados; pontas só no espinho do ombro, borda do elmo, presas e visor).
- Contraste: pele jade clara (#93bd9d) é a maior massa clara e se separa da grama em valor; armadura em bronze escurecido (#74492a); só o olho vermelho e as linhas ciano são saturados.
- Contorno externo ~3.2 px via camada `<use>` + linhas internas 1.5 px; nada encosta nas bordas do SVG (a versão anterior era cortada na borda direita).
- Olho robótico continua em (64,31); `eye` e `top` em art.js não precisaram mudar. Animações, balanceamento e outros SVGs intocados.
- Teste de leitura: cabeça, clava e espinho claros na silhueta; a presa aparece como uma ponta pequena abaixo da borda do elmo (sutil no tamanho real). Pares sobrepostos se separam pelo contorno e pela ombreira de bronze.

Refazer o Orc Cibernético (public/assets/enemy-cyber-orc.svg). A versão atual ficou confusa: 83 formas num sprite de 88×94, tudo angular, e a pele (#7d8450) quase igual à grama (#677444), então ele some no cenário e dois orcs juntos viram uma massa só. Mantenha a direção "cartoon sério" (não voltar ao fofo), mas corrija a leitura:

1. Linguagem de formas: "massa arredondada, acento pontiagudo".
   - Corpo e cabeça são formas grandes arredondadas e pesadas (tronco em trapézio de cantos arredondados, cabeça larga e baixa, ombros largos). É isso que dá peso.
   - Pontas SÓ nos acentos de ameaça: 2 presas, 1 espinho no ombro, borda do elmo e visor do olho robótico.

2. Simplificar: no máximo ~30 formas. A silhueta deve ter 3 leituras claras: cabeça+elmo, tronco, braço com a clava de plasma. Tire placas e rebites pequenos; deixe no máximo 3 detalhes pequenos, concentrados perto do olho, que é o ponto focal. Contorno externo 3–3.5 px, linhas internas 1.5 px e poucas.

3. Contraste com o cenário (o mais importante):
   - A pele deve se separar da grama em VALOR (claro/escuro), não só em matiz: pele verde mais clara e um pouco mais fria/jade que a grama, sendo a maior massa clara do personagem.
   - Armadura em metal quente (bronze escurecido/ferrugem) em vez de cinza neutro, para não sumir na pedra e na terra.
   - Olho vermelho e linhas ciano continuam como os únicos pontos saturados.
   - Não altere as cores do cenário nesta tarefa.

4. Teste de leitura (obrigatório, me mostre o resultado):
   - Renderize o orc no tamanho real do jogo sobre a grama e sobre a terra do caminho, e também como silhueta preta chapada. Nos dois casos tem que dar para identificar cabeça, presas e arma.
   - Mostre dois orcs sobrepostos, como acontece na onda, e confirme que dá para ver onde termina um e começa o outro.

5. Mantenha 88×94, ancoragem no centro inferior e o olho robótico perto de (64,31); se mudar, atualize eye e top em src/config/art.js. Não mexa em animações, balanceamento nem em outros SVGs. Rode npm run build.

## [x] T03 — Animação de construção por materialização rúnica

**Concluída em 2026-09-30.** Resultado:
- `Tower.playBuildAnimation` refeito de forma genérica a partir de `this.pieces` (base + peças de cima); Besta e Catapulta só declaram as peças. Substitui a queda do céu e o "pop" da plataforma.
- Fases: runas giram/acendem + luz ciano; base revelada de baixo para cima com `setCrop`, faixa de holograma (tint FILL ciano, sem iluminação) e linha de varredura, arte sólida logo atrás; cabeça/braço descem em holograma e encaixam com Back.easeOut + squash 6%; flash, 8 faíscas, luz e runas apagam. Sombra cresce com a revelação.
- Duração em `BALANCE.towers.buildTime` (0,9 s); fases, cores e medidas em `BUILD_FX` (visual.js); textura procedural `rune-circle`.
- Testado: orc no alcance desde 16 ms, torre pronta em 928 ms, 1º disparo em 992 ms; construção seguida com Shift; depth, iluminação e luzes temporárias restauradas ao final. `buildPuff` (efeito antigo) removido.

Nova animação de construção das torres: "materialização rúnica". Esta tarefa vem depois da remoção da plataforma e SUBSTITUI o efeito de construção dela (o círculo de runas continua, mas passa a fazer parte desta sequência). Consulte node_modules/phaser/skills antes de usar crop, tint e filtros do Phaser 4.

Sequência (duração total em BALANCE.towers.buildTime, padrão 0.9 s; os tempos de cada fase em visual.js):
1. Runas (0–0.25 s): o círculo de runas no chão (DEPTH.DECAL, achatado em 3/4, ciano #3ff5ff) aparece girando e acende, com uma luz pontual ciano crescendo no centro.
2. Base em holograma (0.2–0.55 s): a base da torre aparece como holograma (tint FILL ciano, alpha ~0.6) e é revelada de BAIXO para CIMA com setCrop; uma linha de varredura clara e brilhante acompanha a borda do corte. Logo atrás da varredura, o holograma vira a arte normal (sem tint).
3. Encaixe (0.5–0.8 s): a peça de cima (cabeça da besta / braço da catapulta) surge em holograma um pouco acima do ponto de encaixe, desce e encaixa com Back.easeOut, virando sólida no impacto + squash de ~6% na torre inteira.
4. Final (0.8–0.9 s): flash branco rápido, 6–10 faíscas ciano, a luz ciano apaga e o círculo de runas some em fade.

Regras:
- A torre só procura alvos e atira depois que a sequência termina. O éter é descontado no início.
- A sombra no chão cresce junto com a revelação (começa pequena e fraca).
- Implemente de forma genérica em Tower.js (ex.: playBuildAnimation usando uma lista de "peças" de cada torre: base primeiro, depois as de cima), para torres futuras com mais peças funcionarem sem código novo.
- Nada de números de gameplay fora de balance.js; tempos e cores do efeito em visual.js.

Teste: construir várias torres seguidas (inclusive com Shift), construir durante uma onda com inimigos passando perto (não pode atirar antes de terminar) e conferir depth/iluminação. npm run build sem erros.

## [-] T04 — Processo de arte pintada

**Descartada em 2026-09-30.** Substituída pela direção pixel art gerada por código (T05). Reaproveitados da preparação anterior: carregamento de PNG/WebP e `ART_SPEC.md`.

Configurar o processo de arte pintada. A direção de arte mudou: o jogo passa a usar arte "pintada estilizada" gerada em PNG por IA de imagem, no lugar dos SVGs desenhados em código. Depende da tarefa que preparou o carregamento de PNG/WebP e o ART_SPEC.md.

1. CLAUDE.md: substitua a seção "Estilo visual" por "Direção de arte" com:
   - Estilo: arte pintada à mão estilizada, pinceladas suaves visíveis, formas grandes e legíveis, proporções pesadas (não fofas), paleta terrosa e dessaturada, ciano #3ff5ff e vermelho só em energia/olhos/magia, contorno escuro fino e irregular só na silhueta, câmera 3/4, luz quente do canto superior esquerdo + rim light.
   - A arte é produzida FORA do código. O Claude Code não desenha nem redesenha arte de personagens/torres/cenário em SVG ou código; só integra os arquivos. Os SVGs atuais são placeholders até serem substituídos.
   - Mantenha as regras de iluminação dinâmica, sombras projetadas, depth e animações procedurais (ajustando a intensidade do squash para combinar com arte pintada: máx. ~6%).

2. Crie a pasta arte-bruta/ (fora de public/) para eu jogar as imagens geradas, e o script `npm run arte` (Node + sharp) que, para cada arquivo em arte-bruta/ cujo nome bate com um asset do ART_SPEC.md:
   - remove o fundo magenta #FF00FF com tolerância ajustável e borda suave (antialias), e remove o "vazamento" rosado nas bordas (despill);
   - recorta o espaço vazio, posiciona com a ancoragem do ART_SPEC.md (borda inferior central, com a margem certa);
   - redimensiona para 2× o tamanho lógico do asset e salva como WebP com transparência em public/assets/;
   - atualiza o art.js (arquivo, escala e, se preciso, pontos de encaixe proporcionais) e gera arte-bruta/preview.html mostrando cada asset processado sobre a grama e sobre a terra do caminho, no tamanho real do jogo.
   - Arquivos que não batem com nenhum asset: liste no final como "ignorados", sem apagar.

3. Adicione arte-bruta/ ao .gitignore (as imagens finais em public/assets/ entram no git).

4. Teste com uma imagem de exemplo gerada por você mesmo (um círculo sobre fundo magenta), confira o recorte e a ancoragem, e depois apague o exemplo. npm run build sem erros.

## [x] T05 — Pixel art do Orc Cibernético com caminhada

**Concluída em 2026-09-30.** Resultado:
- Gerador `tools/pixel-art/` (`npm run pixel`, Node + pngjs): primitivas sem antialias, cel shading automático por parte, contorno interno + silhueta, paleta fixa, preview.html.
- Orc 60×52 em partes (`sprites/orc.js`) + caminhada de 8 quadros por fase t com deslocamentos inteiros → `orc-walk.png` e `orc.png`.
- Jogo: `pixelArt`, zoom inteiro, `PIXEL_SCALE` 2, sprite sheet + anim no manifesto, walk com frameRate pela velocidade, recuo/morte em pixels inteiros, sombra de pixels, bloom e luzes mais fracos. SVG antigo do orc removido.
- CLAUDE.md ("Direção de arte" pixel art) e ART_SPEC.md atualizados. T04 descartada.

Mudar a direção de arte para PIXEL ART desenhada em código, começando pelo Orc Cibernético com animação de caminhada. (Texto completo enviado pela conversa em 2026-09-30: gerador em tools/pixel-art/ com `npm run pixel`, paleta fixa, orc 60×52 em partes, caminhada de 8 quadros, renderização pixel-perfect no jogo, atualizar CLAUDE.md e ART_SPEC.md, mostrar o preview.html.)

## [x] T06 — Ajustes no pixel art do Orc

**Concluída em 2026-09-30.** Resultado:
- Orc redesenhado: pernas ~1/3 com coxas/grevas/botas, tronco em placas (peitoral claro × barriga de malha escura), ombreira de aço escuro com ferrugem, cabeça maior, braços grossos, clava ~30% maior com núcleo ciano.
- Caminhada com poses-chave (contato ±5 px, passagem +1 px, pé a 3 px do chão, inclinação no contato); brilho do olho acompanha via `orc-walk.json`.
- Gerador: sombra escura limitada a 30% por parte (antes chegava a 73%); teste de pernas entre quadros (antes: 0 px de diferença em alguns pares; agora ≥ 98 px); preview com "antes × depois".
- Altura 49 px da arte = 98 px no mundo (PIXEL_SCALE 2 e canvas 60×52 mantidos).

Ajustes no pixel art do Orc (tools/pixel-art/sprites/orc.js): proporções (pernas ~30%, tronco ~40% curvado, cabeça maior), braços grossos e clava 30% maior, placas de aço legíveis (sombra escura ≤ ~1/3 por parte), caminhada com poses-chave (contato ±5 px, passagem, pé levantando 2–3 px, olho acompanhando), orc com ~100 px de altura, preview "antes × depois". (Texto completo enviado pela conversa em 2026-09-30.)

## [x] T07 — Aplicar balanceamento da sugestão da T01

**Concluída em 2026-09-30.** Resultado:
- Aplicado em `src/config/balance.js`: Catapulta de Plasma custo 120 → **135**; onda 5 `healthMult` 3.1 → **3.5**; onda 4 **mantida em 2.5** (aprovado pelo usuário).
- Simulação (robô construindo nas curvas em U, mesma da T01; Catapulta 135 e onda 5 = 3.5 fixos; determinística):

  | Onda 4 `healthMult` | Mista | Só Catapultas | Só Bestas |
  |---|---|---|---|
  | 2.45 | 16/20 | 14/20 | 4/20 |
  | **2.5 (escolhido)** | **16/20** | **14/20** | **4/20** |
  | 2.52 | 16/20 | 12/20 | 4/20 |
  | 2.55 | 16/20 | 10/20 | 5/20 |
  | 2.6 | 14/20 | 10/20 | 3/20 |
  | 2.65 | 14/20 | 10/20 | 2/20 |
  | 2.8 | 12/20 | 9/20 | 5/20 |
  | 3.2 | 7/20 | 3/20 | 1/20 |

  Referência sem mudanças (Catapulta 120, onda 5 = 3.1): 20/20 nas três estratégias.
- Alvo pedido (mista ~15, só Catapultas ~13) não é atingível só com a onda 4: a mista fica em 16 até 2.55 e cai direto para 14 em 2.6.
- **Pendência:** observar nos testes manuais do usuário a força da Besta Laser sozinha (só Bestas vence com apenas 4/20).

Sobre a sugestão de balanceamento da T01: aplique a Catapulta custo 135 e a onda 5 healthMult 3.5, mas ajuste a onda 4 para que a estratégia mista vença ~15/20 e "só Catapultas" ~13/20 na mesma simulação. Me mostre os números antes de commitar.

## [x] T08 — Pixel art em alta resolução

Pixel art em ALTA RESOLUÇÃO com mais detalhe, a partir do orc já ajustado (proporções e caminhada da tarefa anterior). Isso passa a valer para TODA a arte do jogo.

1. Resolução: PIXEL_SCALE = 1 (1 pixel da arte = 1 pixel do mundo 1280×720). O orc passa a ser desenhado com ~100 px de altura (canvas ~112×104), ocupando o mesmo tamanho de tela de antes. Reescale todas as coordenadas das partes do orc para a nova grade (não amplie o sprite antigo — redesenhe as partes na resolução nova).

2. Técnicas de detalhe no gerador (tools/pixel-art/lib), reutilizáveis para todos os sprites:
   - Rampas de 5 tons por material com hue shift (sombras puxam para roxo/azul frio, luzes para amarelo quente). Atualize palette.js.
   - Contorno seletivo: contorno externo #1e1512; contornos internos na cor mais escura do próprio material (não preto).
   - Dithering/texturas por material: aço escovado (linhas horizontais sutis), ferrugem (manchas nas bordas das placas), couro (ruído leve), pele (poucos pixels de volume muscular). Textura com semente fixa, igual em todos os quadros da animação (não pode "ferver").
   - Brilho especular: 1–3 pixels claros nas placas voltadas para a luz (canto superior esquerdo) e rim light de 1 px na borda direita da silhueta.
   - Pixels emissivos: olho, runas e plasma com núcleo claro + halo de 1–2 px nos tons da rampa ciano/vermelha.

3. Detalhes do orc: rebites e arranhões nas placas, costura e fivela no cinto, dentes e presas com volume, veias/músculos nos braços, bota com sola e cadarço de couro, espinhos na clava e runas ciano gravadas nela. Tudo com a hierarquia de leitura mantida: olho e clava continuam sendo os pontos que mais chamam atenção.

4. A caminhada continua gerada pelas partes (8 quadros) e deve ficar igual em ritmo à versão ajustada, só com mais resolução. Deslocamentos continuam inteiros (agora em pixels de 1×, então dobre os valores).

5. Atualize ART_SPEC.md e CLAUDE.md: pixel art 1×, inimigos comuns ~100 px de altura, rampas de 5 tons, contorno seletivo. Rode npm run pixel e npm run build e gere no preview.html o comparativo "2× antigo × 1× novo" no tamanho real e ampliado 4×.

**Resultado:**
- `PIXEL_SCALE = 1` (`src/config/visual.js`); recuo de dano 2 px, morte afunda 4 px.
- Orc redesenhado na grade 1× (`tools/pixel-art/sprites/orc.js`): quadro 116×104, personagem com ~96 px, pivot (58,104), olho (+39,−66), hit (0,−54), top −96. Folha `orc-walk.png` 928×104 (8 quadros) + `orc.png` + `orc-walk.json` (olho por quadro).
- Gerador: `palette.js` com rampas de 5 tons com hue shift; `lib/PixelCanvas.js` com contorno seletivo (interno na cor mais escura do material), sombreamento por ranking (≤30% escuro por parte), especular, rim light e emissivos com halo; `lib/textures.js` (aço escovado, ferrugem nas bordas, couro, tecido, pele) com semente fixa em coordenadas locais — 0 px de diferença no peitoral, cabeça e ombreira entre quadros (não ferve).
- Caminhada com o mesmo ritmo, deslocamentos dobrados (pernas ±10, quique 2, braço/clava ±6). Checagens: sombreamento máx. 30% ✓, pernas com diferença mínima de 453 px entre quadros ✓.
- Versão 2× congelada em `tools/pixel-art/legacy/` só para o comparativo "2× antigo × 1× novo" do `preview.html` (tamanho real e 4×); `orc-v1.js` removido.
- `CLAUDE.md` (Direção de arte) e `ART_SPEC.md` atualizados. `npm run pixel` e `npm run build` OK; no jogo: 8 quadros, escala 1, brilho do olho acompanha o quadro, sombra de pixels 56×16, sem avisos de `[arte]`.
