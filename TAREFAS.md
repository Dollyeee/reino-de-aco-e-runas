# Fila de tarefas — Reino de Aço e Runas

Este arquivo é mantido pelo Claude Code. O usuário manda as tarefas pela conversa:
- `/fila <prompt>` — adiciona a tarefa no final desta fila, sem executar.
- `/proxima` — executa a próxima tarefa pendente (uma por vez) e para.
- Se chegar uma tarefa nova pela conversa enquanto outra está em andamento, ela é adicionada aqui e a atual continua.

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluída · `[!]` bloqueada (precisa do usuário)

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

## [ ] T03 — Animação de construção por materialização rúnica

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

## [ ] T04 — Processo de arte pintada

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
