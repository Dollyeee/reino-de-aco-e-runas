# Documento de design — Reino de Aço e Runas

Visão de design da **versão 1.0**: o que cada torre e cada inimigo fazem, como se relacionam e em que ordem aparecem.
É um documento de intenção, não de números — custos, valores e visuais são decididos na produção de cada item
(ver "Em aberto"). A ordem de produção está no **Plano de produção** do `CLAUDE.md`; as regras técnicas de dano e traits,
em `src/config/balance.js` (T11); a arte, no `ART_SPEC.md`.

---

## 1. Pilares de design

1. **Cada inimigo traz uma regra nova.** Nenhum inimigo é "o mesmo com mais vida": cada um muda o que o jogador precisa fazer.
2. **Cada torre resolve um problema claro.** O jogador deve saber, ao ver um inimigo novo, qual torre é a resposta.
3. **Nenhuma torre resolve tudo.** Toda torre tem pelo menos um inimigo contra o qual é fraca ou inútil.
4. **Resistências, não imunidades.** Um inimigo resiste (dano × 0,3–0,6) em vez de ignorar; a única "imunidade" é de
   camada (voador fora do `canHit`) ou de visibilidade (invisível sem detecção) — e as duas têm resposta clara.
5. **Toda fraqueza é visível.** Armadura, escudo, voo, invisibilidade e auras aparecem na arte e no efeito do golpe
   (faísca na armadura, bolha de escudo piscando, número de dano menor), nunca só num número escondido.
6. **Ensinar antes de cobrar.** Cada mapa introduz no máximo **1–2 inimigos novos**: primeiro sozinhos e em pouca
   quantidade, depois misturados e em massa.

---

## 2. Elenco de torres (v1.0) — 8 torres

| Torre | Papel | Tipo de dano | Acerta | Resolve | Não resolve |
|---|---|---|---|---|---|
| **Besta Laser** | dano rápido em alvo único | perfurante | terrestre (voador com upgrade Sentinela) | Saqueador, Lobo, Ciborgue | Brutamontes, Enxame |
| **Catapulta de Plasma** | dano em área, disparo em arco | explosivo | terrestre | Enxame, Brutamontes, Carcaça | Lobo (erra o rápido), voadores |
| **Torre de Estase** | controle: lentidão em área | — (quase sem dano) | terrestre e voador | Lobo, Chefe de Guerra (anula a aceleração) | matar qualquer coisa sozinha |
| **Ninho do Dragão Mecânico** | fogo em linha, dano contínuo | fogo | terrestre e voador | Golem, Brutamontes, Enxame | Ciborgue com escudo cheio |
| **Bobina Rúnica** | raio em cadeia | energia | terrestre e voador | Enxame, Ciborgue (derruba escudo), Gárgula | Golem (alvo único enorme) |
| **Balista de Longo Alcance** | alcance enorme, dano alto, detecta invisíveis | perfurante (pesado) | terrestre e voador | Espectro, Xamã, Gárgula, chefes | Enxame, Lobo (cadência baixa) |
| **Forja de Éter** | economia: gera éter a cada onda | — | — | falta de éter a longo prazo | defesa (não ataca) |
| **Obelisco de Comando** | suporte: fortalece torres próximas | — | — | torres no limite do alcance/dano | defesa sozinho (não ataca) |

---

## 3. Elenco de inimigos (v1.0) — 10 inimigos + 2 chefes

| Inimigo | Regra nova | Traits (T11 + novas) | Contra-ataque |
|---|---|---|---|
| **Saqueador** (orc atual) | básico, anda em grupo | terrestre | qualquer torre; Besta é a mais eficiente |
| **Lobo de Sucata** | **rápido**, pouca vida | terrestre | Estase (desacelera) + Besta/Bobina; a Catapulta erra |
| **Brutamontes** | **blindado**: resiste a perfurante | terrestre, blindado | Catapulta (explosivo), Ninho do Dragão |
| **Ciborgue** | **escudo de energia** que regenera; resiste a explosivo enquanto tem escudo | terrestre, escudo | Bobina Rúnica derruba o escudo; Besta termina |
| **Gárgula-Drone** | **voa**: só algumas torres acertam | voador | Balista, Bobina, Dragão, Besta com Sentinela |
| **Enxame de Drones** | **muitos e pequenos** (voam rente ao chão: camada terrestre) | terrestre, enxame | dano em área: Catapulta, Dragão, Bobina |
| **Xamã Rúnico** | **cura/protege aliados** próximos | terrestre, cura | matar primeiro: Balista (alcance) e prioridade "mais forte" |
| **Espectro** | **invisível** até ser detectado | terrestre, invisivel | Balista (detecta) ou Obelisco com upgrade de detecção; área acerta de raspão |
| **Carcaça Divisora** | **divide-se em 3** ao morrer | terrestre, divide | área (os 3 pedaços nascem juntos): Catapulta, Dragão, Bobina |
| **Golem de Sucata** | **tanque lento**, vida enorme, resiste a lentidão | terrestre, pesado | dano contínuo e dano alto: Ninho do Dragão, Balista |
| **Chefe de Guerra Orc** (mini-chefe) | **acelera orcs próximos** (aura) | terrestre, aura | Estase anula a aceleração; Balista foca o chefe |
| **Dragão Ancestral** (chefe final) | **fases**: voa → pousa blindado → núcleo exposto | voador → terrestre + blindado → núcleo | cada fase pede um grupo de torres diferente (ver matriz) |

Brutamontes e Golem de Sucata são **inimigos diferentes**: o Brutamontes é o blindado (armadura, fraco a explosivo);
o Golem é o tanque lento (muita vida, sem armadura especial, resiste a lentidão). Arte pronta: Brutamontes e Ciborgue
(`tools/pixel-art/sprites/futuros/`).

---

## 4. Matriz inimigo × torre

**F** = forte (resposta ideal) · **N** = normal · **f** = fraco (dano reduzido ou ineficiente) · **✕** = não acerta
(camada) · **D** = só com detecção. Forja e Obelisco não atacam (—). Derivada das regras acima e dos tipos de dano/traits
da T11 (`damageType`, `canHit`, `traits`, `resist`, `BALANCE.traitRules`).

| Inimigo \ Torre | Besta | Catapulta | Estase | Dragão | Bobina | Balista | Forja | Obelisco |
|---|---|---|---|---|---|---|---|---|
| Saqueador | F | N | N | N | N | N | — | — |
| Lobo de Sucata | F | f | F | N | F | f | — | — |
| Brutamontes | f | F | N | F | N | N | — | — |
| Ciborgue | F | f | N | N | F | N | — | — |
| Gárgula-Drone | ✕ (F com Sentinela) | ✕ | N | N | F | F | — | — |
| Enxame de Drones | f | F | N | F | F | f | — | — |
| Xamã Rúnico | N | N | N | N | N | F | — | — |
| Espectro | D | f (área de raspão) | D | D | D | F | — | — |
| Carcaça Divisora | N | F | N | F | F | f | — | — |
| Golem de Sucata | N | N | f | F | f | F | — | — |
| Chefe de Guerra Orc | N | N | F | N | N | F | — | — |
| Dragão Ancestral | fase 1 ✕/F · 2 f · 3 F | fase 1 ✕ · 2 F · 3 N | N em todas | N · F · N | F · N · F | F · N · F | — | — |

Leitura rápida: **nenhuma coluna é toda F** (pilar 3) e **toda linha tem pelo menos um F** (todo inimigo tem resposta).

### Pendências técnicas (para o sistema de dano/traits da T11)
- **Tipos de dano novos**: `fogo` (Ninho do Dragão, dano contínuo) e `energia` (Bobina Rúnica, forte contra escudo).
- **Traits novos**: `invisivel` (não pode ser alvo sem detecção), `cura` (cura/protege aliados num raio), `divide`
  (gera N inimigos ao morrer), `aura` (efeito em aliados próximos, ex.: velocidade), além de `enxame` e `pesado`
  (resiste a lentidão) usados na tabela.
- **Sistemas**: detecção (torre com `detecta` revela invisíveis no alcance, compartilhado), efeitos de status (lentidão,
  dano contínuo, atordoar, redução de armadura), dano em cadeia, buffs de torre em área (Obelisco), economia por onda
  (Forja), chefe com fases (troca de traits por fase).

---

## 5. Caminhos de upgrade (esboço)

Regra (CLAUDE.md, Fase C): **3 caminhos × 4 níveis**; um caminho até o nível 4, um segundo até o 2, o terceiro
bloqueado. Níveis 1–2 detalhes pequenos, 3 mudança visível, 4 mudança grande de visual e comportamento.

| Torre | Caminho 1 | Caminho 2 | Caminho 3 |
|---|---|---|---|
| **Besta Laser** | **Perfurante** — atravessa armadura (anti-blindado) | **Rajada** — cadência, tiro triplo | **Sentinela** — alcance + acerta voadores |
| **Catapulta de Plasma** | **Devastação** — área maior e mais dano no centro | **Fragmentação** — sub-bombas que se espalham | **Corrosão** — derrete armadura e escudo, dano contínuo |
| **Torre de Estase** | **Congelamento** — lentidão mais forte, chance de parar o inimigo | **Campo Amplo** — raio maior, mais alvos | **Fratura** — inimigos lentos recebem mais dano |
| **Ninho do Dragão** | **Sopro Longo** — linha de fogo mais longa | **Chama Azul** — dano contínuo forte, ignora parte da armadura | **Revoada** — dragões menores atacam vários alvos, bom contra voadores |
| **Bobina Rúnica** | **Cadeia Longa** — mais saltos entre alvos | **Sobrecarga** — dano extra em escudos, derruba escudo | **Pulso** — atordoa brevemente os atingidos |
| **Balista** | **Arpão** — o virote atravessa vários inimigos em linha | **Olho do Falcão** — alcance e raio de detecção maiores | **Execução** — dano crítico em chefes e em inimigos com pouca vida |
| **Forja de Éter** | **Veio Profundo** — mais éter por onda | **Juros** — bônus sobre o éter guardado | **Tributo** — éter extra por abate perto da forja |
| **Obelisco de Comando** | **Estandarte** — mais cadência para torres próximas | **Farol** — alcance e detecção para torres próximas | **Comando** — dano e redução de armadura para torres próximas |

---

## 6. Mapas e ordem de introdução

Cada mapa apresenta no máximo 1–2 inimigos novos e 1–2 torres novas; o inimigo novo aparece primeiro sozinho, e a
torre que responde a ele chega no mesmo mapa ou antes.

| Mapa | Torres novas | Inimigos novos | O que ensina |
|---|---|---|---|
| 1 — Vale das Runas (atual) | Besta Laser, Catapulta de Plasma | Saqueador; Lobo de Sucata nas últimas ondas | alvo único × área; rápido escapa da área |
| 2 | Torre de Estase | Brutamontes | armadura: trocar perfurante por explosivo; lentidão ajuda tudo |
| 3 | Bobina Rúnica | Ciborgue, Enxame de Drones | escudo; massa de inimigos pequenos |
| 4 | Balista de Longo Alcance | Gárgula-Drone, Espectro | camada aérea; detecção |
| 5 | Ninho do Dragão, Forja de Éter | Xamã Rúnico, Carcaça Divisora; mini-chefe Chefe de Guerra Orc | prioridade de alvo; economia; divisão |
| 6 — final | Obelisco de Comando | Golem de Sucata; chefe Dragão Ancestral | suporte e combinação de tudo; chefe em fases |

### Biomas: cada kit de decoração = bioma de um mapa
Os kits de decoração em pixel art (`src/config/decor.js`, `ART_SPEC.md`) funcionam como **biomas**: cada mapa tem um kit
base (`decorKit`) e pode trocar peças soltas por peças de outro kit (`kit` no item) para contar uma transição.
- **Kit A — Bosque antigo**: bioma do **mapa 1 (Vale das Runas)**.
- **Kit C — Floresta rúnica**: a floresta "contaminada" pela energia do Núcleo Arcano. No mapa 1 aparece só no terço
  final, perto do castelo (cristais grandes, árvores com veias ciano, pedras com fissuras, pilar em ruína); pode ser o
  bioma inteiro de um mapa mais avançado, próximo de uma fonte rúnica.
- **Kit B — Fronteira de pinheiros**: guardado para um **mapa futuro de montanha/fronteira** (pinheiros escuros, pedras
  frias, marcos rúnicos na estrada).
- Regra dos biomas: a decoração nunca compete com o gameplay — o ciano dela é sempre mais fraco que o de torres,
  projéteis e runas de construção.

### Marco intermediário — versão 0.5
Primeiro jogo completo e jogável de ponta a ponta, em **3 mapas** (1 a 3 acima):
- **4 torres**: Besta Laser, Catapulta de Plasma, Torre de Estase, Bobina Rúnica.
- **5 inimigos**: Saqueador, Lobo de Sucata, Brutamontes, Ciborgue, Enxame de Drones.
- **1 chefe**: Chefe de Guerra Orc (fim do mapa 3).
Cobre os pilares (alvo único × área, armadura, escudo, massa, controle) com arte já adiantada (Brutamontes e Ciborgue).

---

## 7. Em aberto

- **Números, custos e visuais** de cada torre, inimigo, upgrade e mapa são definidos **na produção de cada item** (Fase D
  do plano), validados no simulador de balanceamento (Fase B) — nada aqui é número final.
- Nomes dos mapas 2–6, bioma e traçado de cada um.
- Quantidade de ondas por mapa e se o mapa final tem modo sem fim.
- Este documento é **revisado a cada fase** do plano de produção: o que mudar na prática volta para cá.
