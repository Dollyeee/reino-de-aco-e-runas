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

---

## [x] T09 — Três versões do Orc Cibernético para escolha

Criar 3 versões TOTALMENTE diferentes do Orc Cibernético em pixel art 1×, para o usuário escolher. NÃO substituir o orc atual no jogo; ele continua como padrão até a decisão.

Mesmo gerador (tools/pixel-art), mesma paleta base e técnicas (rampas de 5 tons, contorno seletivo, texturas com semente fixa, emissivos), ~100 px de altura, olhando para a direita, câmera 3/4. Cada versão em `sprites/orc-a.js`, `orc-b.js`, `orc-c.js`, com parado + caminhada de 8 quadros gerada pelas partes. Diferentes em SILHUETA, tipo de corpo, arma e jeito de andar — não variações de cor.

- **A — "Brutamontes"**: muito largo e curvado, cabeça pequena e baixa entre os ombros, braços enormes, armadura pesada de placas com rebites, pele verde-oliva escura. Martelo de guerra de duas mãos com cabeça de plasma ciano, APOIADO NO OMBRO. Caminhada lenta e pesada, balançando o corpo de um lado para o outro.
- **B — "Saqueador"**: mais alto e magro, inclinado para frente como quem vai atacar, pouca armadura (couro, faixas, uma ombreira pequena), moicano, pele verde mais clara. Braço da frente INTEIRO mecânico, com lâmina de plasma ciano saindo do antebraço. Caminhada rápida e agressiva, passos longos.
- **C — "Ciborgue de guerra"**: mais máquina que orc. Pernas mecânicas com articulação invertida (tipo pássaro), cabos expostos, reator ciano no peito, capacete cobrindo metade do rosto com visor vermelho horizontal, presas por baixo. Braço da frente é um canhão de plasma. Pele verde-acinzentada só nos ombros e no maxilar. Caminhada mecânica, passos marcados, leve "tranco" no pouso do pé.

Entregáveis:
1. `tools/pixel-art/escolha-orc.html`: as 3 versões + o orc atual lado a lado, parados e andando em loop, no tamanho real sobre grama e terra, e ampliados 4×; também 2 orcs de cada versão sobrepostos no caminho (como numa onda).
2. Seletor `ORC_VARIANT` em `src/config/art.js` (`'atual' | 'a' | 'b' | 'c'`), padrão `'atual'`.
3. `npm run pixel` e `npm run build` sem erros. Descrever em 2 linhas o ponto forte e o ponto fraco de cada versão.

**Resultado:**
- `tools/pixel-art/sprites/orc-a.js` (Brutamontes, 128×110), `orc-b.js` (Saqueador, 128×110), `orc-c.js` (Ciborgue de guerra, 128×106): parado + caminhada de 8 quadros gerada pelas partes, cada uma com seu jeito de andar. Checagens: sombreamento máx. 30% em todas; pernas com diferença mínima de 441 / 543 / 772 px entre quadros.
- Paleta: novas rampas de pele `peleOliva` (A), `peleClara` (B), `peleCinza` (C) e `borracha` (cabos), com a mesma textura de pele. `PixelCanvas` ganhou `origin` (reenquadrar um sprite sem mudar coordenadas).
- `tools/pixel-art/escolha-orc.html` (gerado por `npm run pixel`, código em `tools/pixel-art/escolha.js`): atual + A + B + C parados e andando no tamanho real (grama e terra), ampliados 4×, e 2 de cada versão andando juntos no caminho na velocidade do jogo.
- Seletor `ORC_VARIANT` em `src/config/art.js` (padrão `'atual'`) + `?orc=a|b|c|atual` na URL; `ORC_VARIANTS` guarda quadro, pivot, olho, hit, topo, sombra e `walkCycle` de cada versão. `Enemy` usa o `walkCycle` do manifesto quando existe.
- Testado no jogo com as 4 versões: sprite no tamanho certo, brilho do olho acompanhando o quadro, sombra de pixels, cadência própria, dano (recuo 2 px) e morte; sem avisos de `[arte]`. O orc atual continua idêntico e é o padrão. `npm run pixel` e `npm run build` OK.
- Pendente: o usuário escolher a versão (depois, trocar o padrão de `ORC_VARIANT` ou remover as candidatas não usadas).

---

## [x] T10 — Fixar a versão B (Saqueador) como Orc Cibernético padrão

A versão B passa a ser o Orc Cibernético padrão. Ajustes na B antes de fixar:
1. Um pouco mais de massa, sem perder a silhueta magra e curvada: ombros e peito ~15% mais largos, braço mecânico mais grosso, botas um pouco maiores — para não parecer frágil ao lado das torres no tamanho real.
2. Lâmina de plasma ~30% maior e mais grossa (3–4 px), com núcleo claro + halo ciano de 1–2 px; ela e o olho vermelho são os dois pontos focais.
3. Mais leitura "cibernética": uma ou duas linhas ciano no braço mecânico e um pequeno implante/placa de metal na cabeça, sem poluir.
4. Manter a caminhada atual da B, só ajustando para as novas proporções.

Depois:
- `ORC_VARIANT` padrão = `'b'` em `src/config/art.js`.
- NÃO apagar A e C: mover para `tools/pixel-art/sprites/futuros/` (orc-a → "brutamontes", orc-c → "ciborgue") e registrar no roadmap do CLAUDE.md como arte pronta para inimigos futuros (brutamontes = candidato ao inimigo blindado e lento da Fase 2; ciborgue = inimigo mecânico de elite).
- Atualizar `escolha-orc.html` com "B antes × B ajustado", rodar `npm run pixel` e `npm run build`.

**Resultado:**
- Saqueador ajustado (`tools/pixel-art/sprites/orc-b.js`, quadro 136×110): tronco, colete e ombreira mais largos (~15% nos ombros/peito), braço mecânico com espessura 10 (antes 7), cotovelo e antebraço maiores, 2 linhas ciano no braço, botas maiores com sola, placa de metal rebitada na cabeça, lâmina de 27 px (antes 21) com núcleo de 4 px e brilho ciano de 2 px no vazio. Caminhada igual (mesma tabela de poses); pernas com diferença mínima de 595 px entre quadros, sombreamento máx. 30%.
- `PixelCanvas.emissive(..., { glow: true })`: halo que se espalha no vazio, sem contorno externo em volta.
- `ORC_VARIANT = 'b'` (padrão); `ORC_VARIANTS` agora tem só `b` e `atual` (orc da T08, `?orc=atual`). Encaixes do Saqueador: pivot (61,110), olho (+33,−86), hit (0,−60), top −106, sombra 56×15, walkCycle 44.
- A e C movidos para `tools/pixel-art/sprites/futuros/brutamontes.js` e `ciborgue.js` (PNGs renomeados para `brutamontes*` / `ciborgue*`, idênticos aos antigos `orc-a*` / `orc-c*`), registrados no Roadmap do CLAUDE.md e no ART_SPEC.md.
- `escolha-orc.html` agora mostra "B antes (T09) × B ajustado (T10)" (tamanho real, 4× e 2 na onda); a B antiga está congelada em `tools/pixel-art/legacy/orc-b-v1.js`.
- `npm run pixel` e `npm run build` OK; testado no jogo sem parâmetro na URL (Saqueador ajustado é o padrão).

---

## [x] T11 — Estrutura de tipos de dano e características de inimigos

**Concluída em 2026-09-30.** Resultado:
- `balance.js`: torres com `damageType` (Besta 'perfurante', Catapulta 'explosivo') e `canHit: ['terrestre']`; Orc com `traits: ['terrestre']` e `resist: {}`; `BALANCE.traitRules` com terrestre/voador (camada), blindado (perfurante 0.4) e escudo (absorve 40, regenera 6/s — placeholders —, explosivo 0.3 enquanto houver escudo), sem inimigo usando.
- Novo `src/combat/damage.js` (`canHit`, `resistFor`, `finalDamage`); `Enemy.receiveAttack(dano, tipo)` aplica resist + escudo; escolha de alvo da torre e o splash da Catapulta respeitam `canHit`. Hook de upgrades: `Tower.addCapabilityMod({ damageType } | { addCanHit })`.
- Comportamento idêntico: nova simulação determinística `tools/sim/simulacao.js` (a da T07 não estava no repositório) deu a **mesma assinatura antes e depois** nas 3 estratégias (mista d97b03d9, só Bestas 714fe679, só Catapultas b3934d63).
- **Atenção:** o robô novo não é o da T07 e os números dele diferem muito: mista perde na onda 5 (núcleo 17 17 11 6 0), só Bestas 20/20, só Catapultas perde. Vale revisar o balanceamento com essa ferramenta (não mexido nesta tarefa).
- CLAUDE.md: tabela de design inimigos × tipos de dano + regras, convenção de dano/traits e a pasta `combat/`.

Preparar a estrutura de tipos de dano e características de inimigos (sem criar conteúdo novo — Fase 1 continua com 2 torres e 1 inimigo).

1. Em balance.js:
   - Cada torre ganha `damageType` ('perfurante' para a Besta, 'explosivo' para a Catapulta) e `canHit` (ex.: ['terrestre'] ou ['terrestre','voador']).
   - Cada inimigo ganha `traits` (lista: ex. 'terrestre', 'blindado', 'voador', 'escudo') e `resist` (multiplicador por tipo de dano, padrão 1.0). O Orc atual: traits ['terrestre'], sem resistências.
   - Tabela central BALANCE.traitRules descrevendo o efeito de cada trait (blindado: resist perfurante 0.4; voador: só torres com 'voador' em canHit acertam; escudo: absorve X de dano e regenera Y/s, resist explosivo 0.3 enquanto o escudo existir). Deixe definidas mas sem inimigo usando ainda.
2. O cálculo de dano e a escolha de alvo das torres passam a usar damageType, canHit, traits e resist. Com os valores atuais, o jogo tem que se comportar EXATAMENTE igual (confirme rodando a mesma simulação da T07 e comparando os resultados).
3. Prepare o hook para upgrades mudarem capacidades (ex.: um upgrade futuro trocar damageType ou adicionar 'voador' ao canHit), sem implementar upgrades.
4. Registre no CLAUDE.md (seção de roadmap) a tabela de design: Saqueador rápido; Brutamontes blindado (fraco a explosivo); Ciborgue com escudo (fraco a perfurante, resiste a plasma); Gárgula voadora (Catapulta não acerta); Enxame (fraco a área). Regras de design: preferir resistências a imunidades, toda fraqueza precisa ser visível, upgrades desbloqueiam capacidades.
5. npm run build sem erros.

---

## [x] T12 — Conversão para pixel art 1×, etapa 1: guia de estilo + chão e caminho

**Concluída em 2026-09-30.** Resultado:
- **Bíblia da pixel art** no `ART_SPEC.md` (seção "Guia de estilo"): paleta completa com hex (rampas novas em `palette.js`: grama, terra, pedra, madeira, fogo; as do orc não mudaram), luz do canto superior esquerdo, relevo × depressão no chão, contorno seletivo, tabela de densidade de detalhe, tamanhos de referência e regras de sombra.
- **Chão gerado** por `tools/pixel-art/cenario/chao.js` a partir de `map01.js` + `PathTrack` (traçado idêntico): 6 tiles de grama 32×32 com o mesmo tom de base, manchas de musgo, 520 tufos, flores em grupos, pedrinhas; caminho de terra com borda irregular, barranco escuro em cima/esquerda e claro embaixo/direita, capim entrando na terra, sulcos, pegadas e pedrinhas; circuitos rúnicos perto do castelo em pixel art.
- **No jogo**: `MapRenderer` carrega `public/assets/chao-map01.png` (manifesto `ground-map01`) no lugar do desenho em canvas; sombras, profundidade e iluminação iguais. O `chao-map01.json` guarda o caminho usado e o jogo avisa no console se `map01.js` mudar sem rodar `npm run pixel`. Cores antigas do chão removidas de `COLORS`.
- `tools/pixel-art/cena-referencia.png` (1280×720, gerada por `cenario/cena.js`): chão + 8 orcs Saqueador no caminho + placeholders de 6 torres e do castelo; `preview.html` ganhou a paleta completa, os tiles, um mosaico e um recorte do chão.
- `npm run pixel` e `npm run build` OK; sprites dos personagens idênticos (só os JSONs mudaram o fim de linha). Teste manual: jogar e julgar o contraste do chão com a luz ambiente do jogo (fica um pouco mais escuro que a cena de referência).

Início da conversão do jogo inteiro para pixel art 1×. Etapa 1: guia de estilo + chão e caminho.

1. Guia de estilo: com base no orc B aprovado, escrever em ART_SPEC.md a "bíblia" da pixel art do jogo: paleta completa (rampas de 5 tons com hue shift por material: grama, terra, pedra, madeira, aço, couro, pele, ciano rúnico, vermelho, fogo/laranja), luz do canto superior esquerdo, contorno seletivo, densidade de detalhe (quantos pixels um rebite, uma pedra, uma folha ocupam), tamanhos de referência (orc ~100 px, torres, castelo, árvores) e regras de sombra no chão. Tudo que vier depois segue esse arquivo.

2. Chão e caminho em pixel art gerada pelo tools/pixel-art:
   - Tiles de grama (4–6 variações + tufos, flores pequenas e pedrinhas espalhados por semente fixa), com a paleta mais escura e dessaturada que o orc, para os personagens se destacarem.
   - Caminho de terra com borda irregular, sulcos/pegadas e pedrinhas; transição grama→terra com pixels de borda (sem linha reta).
   - Desenhar o mapa usando os mesmos dados de map01.js (caminho e curvas), para o traçado continuar idêntico.
3. Cena de referência: gerar tools/pixel-art/cena-referencia.png com o mapa inteiro (chão novo + orc B em alguns pontos do caminho + retângulos placeholder no lugar das torres e do castelo), no tamanho real 1280×720.
4. Integrar o chão novo no jogo (substituindo o desenho atual do MapRenderer), mantendo sombras, profundidade e iluminação. Torres, castelo, decoração e UI continuam como estão nesta etapa.
5. npm run pixel e npm run build. Mostrar ao usuário a cena de referência e um print do jogo rodando.

---

## [x] T13 — Ajustes do chão e escala do orc

**Concluída em 2026-09-30.** Resultado:
- **Musgo**: rampa própria `musgo` (entre os tons 1 e 2 da grama, mais clara que antes), manchas ~40% menores (ruído 90 → 54 px), borda quebrada em degraus de 2 px com dentes de 1 px, folhinhas por dentro; nenhuma mancha a menos de 120 px das curvas do caminho, sob/em volta do castelo nem colada no caminho.
- **Variação por região**: rampas `gramaSol` / `gramaSombra` (≈ ±4 níveis de cor) em manchas grandes e suaves (ruído de 260 px).
- **Orc Saqueador ~80 px**: `PixelCanvas` ganhou escala de grade (`scale`: formas multiplicadas antes de rasterizar; contorno, rebites e pontos continuam com 1 px); `orc-b.js` desenhado na grade 0,75 → quadro 102×83, figura de 81 px. Encaixes em `ORC_VARIANTS.b`: pivot (46,83), olho (+25,−65), hit (0,−45), top −80, sombra 42×11, walkCycle 33. Outros sprites idênticos (escala 1). `escolha-orc.html` agora compara T10 (~107 px) × T13; `legacy/orc-b-v1.js` removido.
- **ART_SPEC.md / CLAUDE.md**: inimigo comum ~80 px como régua, regra "mudar tamanho = redesenhar na grade", paleta com as rampas novas; Brutamontes e Ciborgue anotados como ainda na escala antiga (redesenho no pacote da Fase D).
- **20 orcs em fila** (imagens em `Claude outputs/fila-20-orcs-onda1.png` e `-onda5.png`): na onda 1 (71 px entre orcs) todos separados; na onda 5 (44 px) se sobrepõem nos trechos verticais, mas cabeça, olho e lâmina de cada um continuam distintos. `npm run pixel` e `npm run build` OK.

Ajustes da etapa 1 do pixel art (chão) + escala dos personagens:

1. Manchas de musgo: hoje parecem buracos/poças. Reduza o tamanho (~40%), clareie (no máximo 1–2 tons abaixo da grama base), bordas quebradas em pixels (não arredondadas/moles) e com textura de folhinhas por dentro. Nenhuma mancha perto das curvas do caminho nem sob o castelo.
2. Variação sutil de tom da grama por região (manchas grandes e suaves de ±1 tom, quase imperceptíveis) para o gramado não parecer um tapete uniforme.
3. Escala: reduza o Orc Saqueador para ~80 px de altura no mundo (redesenhe na grade menor se necessário para manter pixel 1× — não escale o sprite com fator fracionado) e registre no ART_SPEC.md a nova referência de tamanho (inimigo comum ~80 px). Confira que 20 orcs em fila no caminho não viram uma massa contínua.
4. Regere a cena de referência e mostre antes × depois. npm run pixel e npm run build.

---

## [x] T14 — Corrigir brilho do olho fora do orc

**Concluída em 2026-09-30.** Resultado:
- **Causa**: na T13, `eyeAt(pose, k = SCALE)` ganhou o parâmetro de escala, mas `orc-b.js` gerava o JSON com `walkPoses.map(eyeAt)` — o `map` passa o **índice do quadro** como segundo argumento, então o quadro n usava escala n (quadro 0 → (0,0), quadro 7 → (661,5; 164,5)). **Correção**: `walkPoses.map((p) => eyeAt(p))`; os 8 olhos agora ficam entre (70,9; 16,6) e (72,9; 17,6), idleEye (70,9; 17,6). Orc 'atual', Brutamontes e Ciborgue conferidos: já estavam certos (o `eyeAt` deles não tem segundo parâmetro).
- **Segundo defeito encontrado no teste (existia desde a T05)**: ao virar para a esquerda, o Phaser espelha a textura dentro do quadro mas mantém a origem; como o pivot não fica no centro do quadro, o orc se deslocava 10 px para o lado e o brilho do olho ficava ~10 px à frente. **Correção**: `Enemy.faceTo()` espelha também a origem (sprite gira em volta dos pés).
- **Validação**: `npm run pixel` falha com erro claro (antes de gravar arquivos) se um ponto de ancoragem cair fora do quadro — dados por quadro dos JSONs e `eye`/`hit`/`top`/pivot de `ORC_VARIANTS`; testado reintroduzindo o bug (erro em `orc-b-walk.json eye[2]`). `Enemy.js` confere o JSON uma vez por asset e, se houver ponto fora, avisa no console (modo dev) e usa o olho fixo de `art.js` (testado).
- Teste no jogo com zoom de câmera: brilho sobre o olho andando para a direita e virado para a esquerda (prints em `Claude outputs/olho-direita-t14.jpg` e `olho-esquerda-t14.jpg`). `npm run build` OK.

BUG: bolinhas vermelhas "atirando" à frente dos orcs. Causa encontrada: public/assets/orc-b-walk.json tem as posições do olho por quadro erradas desde a T13 — eye[0] = (0,0) e os demais crescem a cada quadro até (661.5, 164.5), enquanto o correto (idleEye) é ~(70.9, 17.6) dentro do quadro 102×83. O Enemy.js posiciona o eyeGlow com esses valores, então o brilho vermelho aparece até ~660 px à frente/abaixo do orc a cada quadro.

1. Corrija o gerador (tools/pixel-art/generate.js ou onde o JSON é escrito): as coordenadas do olho de cada quadro devem ser relativas ao próprio quadro (0..largura, 0..altura), não à folha de sprites, e já na escala final após o ajuste de tamanho. Regere com npm run pixel e confira que os 8 valores ficam próximos de idleEye (variando só alguns pixels com o sobe-desce da caminhada).
2. Validação para isso não voltar a acontecer: o gerador falha com erro claro se algum ponto de ancoragem (olho, hit, etc.) cair fora do quadro; e o Enemy.js, em modo dev, avisa no console e usa o olho padrão do art.js se receber um ponto fora do quadro.
3. Confira o mesmo cálculo para a variante 'atual' e para os sprites futuros (brutamontes, ciborgue).
4. Teste no jogo: orcs andando para a direita e para a esquerda, o brilho vermelho fica exatamente sobre o olho em todos os quadros. npm run build sem erros. Registre no resultado da tarefa a causa e a correção.

---

## [ ] T15 — Kits de decoração em pixel art

Converter a decoração do mapa (árvores, pedras, cristais) para pixel art 1×, gerando 3 KITS completos para eu escolher — não 3 versões soltas de cada item. Siga o ART_SPEC.md (paleta, luz do canto superior esquerdo, contorno seletivo, densidade de detalhe) e mantenha a decoração um pouco menos saturada e contrastada que orcs e torres, para não competir com o que importa no jogo. Nada infantil (sem frutinhas, sem formas de pirulito).

Cada kit tem: 3 árvores de formas e tamanhos diferentes, 2 arbustos, 3 pedras (pequena, média, grande), 1 aglomerado de cristal ciano (com pixels emissivos) e 1 elemento temático.

- Kit A — "Bosque antigo": carvalhos largos e retorcidos, copas densas em tons de verde-musgo, pedras cobertas de musgo; elemento temático: toco de árvore cortado.
- Kit B — "Fronteira de pinheiros": pinheiros e abetos altos e escuros, arbustos espinhosos, pedras angulosas cinza-frias; elemento temático: marco de pedra com runa ciano gravada.
- Kit C — "Floresta rúnica": árvores com casca escura e veias finas de ciano brilhando, cristais maiores brotando do chão, pedras com fissuras rúnicas; elemento temático: ruína de pilar medieval com um circuito rúnico exposto.

Entregáveis:
1. tools/pixel-art/escolha-decoracao.html: cada kit com os itens soltos (tamanho real e ampliados 4×) e, principalmente, cada kit aplicado no MAPA INTEIRO (mesmas posições de decoração de map01.js, sobre o chão novo, com orcs no caminho), lado a lado, para eu comparar o conjunto.
2. Um seletor DECOR_KIT em src/config/art.js ('a' | 'b' | 'c'), para eu testar no jogo; padrão = arte atual até eu escolher.
3. Sombras no chão seguindo as regras do ART_SPEC; a área de bloqueio de construção de cada item (PlacementRules) ajustada ao tamanho real da nova arte.
4. npm run pixel e npm run build sem erros. Me diga em 2 linhas o ponto forte e o ponto fraco de cada kit no conjunto do mapa.

---

## [ ] T16 — Registrar design dos upgrades

Registrar no CLAUDE.md (plano de produção, Fase C — estrutura de upgrades) a decisão de design dos upgrades. Não implemente nada agora.

- Sistema de caminhos cruzados estilo Bloons: cada torre tem 3 caminhos × 4 níveis.
- Regra de cruzamento: um caminho pode chegar ao nível 4, um segundo caminho até o nível 2, o terceiro fica bloqueado depois que os outros dois forem escolhidos.
- Níveis 1–2: melhorias menores com pequenos detalhes visuais; nível 3: mudança visível; nível 4: mudança grande de visual e comportamento.
- Upgrades podem alterar números E capacidades (damageType, canHit, efeitos como dano contínuo, fragmentação, redução de armadura), usando o hook preparado na T11.
- Visual por peças: cada nível troca ou adiciona peças no gerador de pixel art, sem redesenhar a torre inteira.
- Todo caminho e combinação precisa passar pelo simulador de balanceamento (Fase B) antes de entrar no jogo.
- Esboço inicial dos caminhos: Besta Laser = Perfurante (anti-blindado) / Rajada (cadência, tiro triplo) / Sentinela (alcance + acerta voadores). Catapulta de Plasma = Devastação (área) / Fragmentação (sub-bombas) / Corrosão (derrete armadura e escudo, dano contínuo).

---

## [ ] T17 — Criar DESIGN.md do jogo

Criar DESIGN.md na raiz (documento de design do jogo) e referenciá-lo no CLAUDE.md. Só documentação, sem implementar nada.

Conteúdo:
1. Pilares de design: cada inimigo traz uma regra nova; cada torre resolve um problema claro; nenhuma torre resolve tudo; resistências são preferidas a imunidades; toda fraqueza é visível; cada mapa introduz no máximo 1–2 inimigos novos, ensinando antes de cobrar.
2. Elenco da versão 1.0 — 8 torres com papel: Besta Laser (dano rápido em alvo único), Catapulta de Plasma (área), Torre de Estase (controle/lentidão), Ninho do Dragão Mecânico (fogo em linha, dano contínuo), Bobina Rúnica (raio em cadeia, bom contra enxame e escudo), Balista de Longo Alcance (alcance enorme, dano alto, detecta invisíveis), Forja de Éter (economia: gera éter por onda), Obelisco de Comando (suporte: fortalece torres próximas).
3. Elenco da versão 1.0 — 10 inimigos + 2 chefes, cada um com sua regra e contra-ataques: Saqueador (básico), Lobo de Sucata (rápido), Brutamontes (blindado), Ciborgue (escudo de energia), Gárgula-Drone (voa), Enxame de Drones (muitos e pequenos), Xamã Rúnico (cura/protege aliados), Espectro (invisível até ser detectado), Carcaça Divisora (divide-se em 3 ao morrer), Golem de Sucata (tanque lento); mini-chefe Chefe de Guerra Orc (acelera orcs próximos); chefe final Dragão Ancestral (com fases).
4. Matriz "inimigo × torre" (forte / normal / fraco) derivada das regras acima, usando os tipos de dano e traits da T11 — e novos traits necessários (invisivel, cura, divide, aura) listados como pendências técnicas.
5. Esboço dos caminhos de upgrade das 8 torres (3 caminhos cada, só nomes e ideia), seguindo a regra de caminhos cruzados já registrada.
6. Ordem sugerida de introdução ao longo dos mapas (qual torre e qual inimigo aparece em qual mapa) e um escopo reduzido "versão 0.5" (4 torres, 5 inimigos, 1 chefe) como marco intermediário.
7. Seção "Em aberto": números, custos e visuais são definidos na produção de cada item; o documento é revisado a cada fase.
