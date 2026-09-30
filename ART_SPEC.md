# Especificação de arte — Reino de Aço e Runas

Documento para quem vai produzir a arte final. Cada asset abaixo substitui um arquivo em `public/assets/`.
Direção de arte completa: seção "Estilo visual" do `CLAUDE.md` ("cartoon sério": Warcraft III, Kingdom Rush Vengeance).

## Regras gerais (valem para todos os assets)

- **Formato**: SVG, PNG ou WebP, **fundo transparente**.
  - PNG/WebP: entregue em **2× ou 4×** o tamanho lógico (ex.: pedra 76×56 → PNG 304×224 em 4×).
    O jogo reduz na tela com mipmaps, então fica nítido em qualquer resolução.
  - SVG: use `viewBox="0 0 <largura> <altura>"` com o tamanho lógico exato.
- **Tamanho lógico** = tamanho que o asset ocupa no mundo do jogo (mapa de 1280×720). Respeite **exatamente**
  a proporção indicada; o quadro inteiro conta (inclusive o espaço transparente).
- **Margem**: deixe ao menos **3 px lógicos** livres em todas as bordas do quadro. Nada (nem o contorno) pode
  encostar na borda, senão é cortado.
- **Ancoragem (pivot)**: o ponto do quadro que fica "no chão" / no eixo do objeto. Na maioria dos assets é a
  **borda inferior central** (onde os pés/base tocam o chão). Os pontos de encaixe da tabela são medidos
  **a partir do pivot**, em pixels lógicos (x → direita, y → para baixo; y negativo = acima do pivot).
- **Câmera 3/4**: vista de cima, levemente inclinada. Objetos mostram a face de cima e a frente.
- **Luz fixa do canto superior esquerdo**, cel shading: cor base, lado escuro embaixo/à direita, brilho pequeno
  em cima/à esquerda.
- **NÃO desenhe**:
  - **sombra projetada no chão** (o jogo desenha uma elipse suave embaixo de cada objeto);
  - **halo/brilho fora da silhueta** em partes que emitem luz (o jogo adiciona brilho, luz dinâmica e Bloom);
  - **pose de movimento, rastro ou borrão**: movimento, recuo, giro e squash são feitos pelo código.
    Desenhe sempre uma **pose neutra e estável**.
- **Cores**: paleta dessaturada (musgo, pedra fria, terra, bronze); ciano `#3ff5ff`, vermelho e laranja
  **só** em energia, runas, olhos e explosões. Contorno marrom-escuro `#1e1512`, ~3 px na silhueta e
  ~1,5 px nos detalhes internos.
- **Peças separadas**: algumas torres são montadas com várias imagens (base + peça que gira). Entregue cada peça
  num arquivo próprio, com o próprio pivot.

## Como trocar um arquivo

1. Salve o arquivo em `public/assets/` (pode mudar a extensão, ex.: `rock.svg` → `rock.png`).
2. Em `src/config/art.js`, mude `file` para o novo nome e, se for PNG/WebP em alta resolução, ponha `scale: 2`
   ou `scale: 4`. Não mexa em `size`, `pivot` nem nos pontos de encaixe se a arte seguiu esta especificação.
3. Rode `npm run dev`. Se o tamanho do arquivo não bater com o tamanho lógico × `scale`, aparece um aviso
   `[arte]` no console do navegador.

## Resumo

| Arquivo | Tamanho lógico | Pivot (no quadro) | Olha para | Animação feita pelo código |
|---|---|---|---|---|
| `enemy-cyber-orc` | 88×94 | 44,94 (inferior central) | direita (espelhado) | passo, balanço, dano, morte |
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

### Orc Cibernético — `enemy-cyber-orc`
- **Tamanho**: 88×94 · **pivot**: 44,94 (entre os pés, no chão) · **olha para a direita** (o jogo espelha
  quando anda para a esquerda: a arte precisa funcionar espelhada).
- **Pontos de encaixe**:
  - `eye` (+20, −63): centro do olho robótico. O jogo põe um brilho vermelho em cima.
  - `hit` (0, −34): altura do peito, onde os disparos acertam.
  - `top` −88: topo da silhueta; a barra de vida fica logo acima.
- **Leitura**: 3 massas claras (cabeça+elmo, tronco, braço com a clava de plasma). A pele jade clara deve
  separar do chão (grama escura) em **valor**, não só em cor. Presas e arma devem aparecer também na silhueta
  preta.
- **Animação procedural**: passo pesado (sobe ~3 px e balança ±2°), achatamento de até 8% ao levar dano,
  flash branco, morte = tomba para frente girando em torno dos pés. Desenhe **uma pose em pé, parada**.
- Sombra no chão: elipse de 64×22 desenhada pelo jogo.

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
