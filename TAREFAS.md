# Fila de tarefas — Reino de Aço e Runas

Este arquivo é mantido pelo Claude Code. O usuário manda as tarefas pela conversa:
- `/fila <prompt>` — adiciona a tarefa no final desta fila, sem executar.
- `/proxima` — executa a próxima tarefa pendente (uma por vez) e para.
- Se chegar uma tarefa nova pela conversa enquanto outra está em andamento, ela é adicionada aqui e a atual continua.

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluída · `[!]` bloqueada (precisa do usuário)

---

## [ ] T01 — Posicionamento livre de torres

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

## [ ] T02 — Refazer o Orc Cibernético

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
