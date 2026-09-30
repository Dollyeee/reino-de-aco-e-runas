---
name: revisar
description: Aplica as correções de pixel art marcadas pelo diretor de arte no revisor (tools/revisor) a um sprite
argument-hint: "<sprite> (ex.: torre-besta-a-base)"
disable-model-invocation: true
---

Você vai aplicar as marcações de revisão do sprite **$ARGUMENTS**, feitas pelo usuário (diretor de arte) na ferramenta
`npm run revisor` (tools/revisor/). As marcações ficam em `tools/revisor/revisoes/<sprite>.json`.

**Regra de ouro**: corrija sempre no CÓDIGO-FONTE do gerador (sprites, peças de materiais, configs de encaixe) e regenere
com `npm run pixel`. NUNCA edite o PNG final — a correção se perderia na próxima geração.

## 1. Ler as marcações
- Se não houver argumento, liste os arquivos de `tools/revisor/revisoes/*.json` com marcações abertas e pergunte qual.
- Rode `node tools/revisor/recorte.mjs <sprite> --lista` para ver as marcações abertas na ordem de trabalho
  (prioridade **alta → média → baixa**). Só trate as de status `aberta`.
- Compare o hash: se o PNG atual já mudou desde a revisão (a ferramenta mostra "desatualizada"), avise o usuário antes
  de seguir — as coordenadas podem não bater mais.
- A cópia "antes" é `tools/revisor/revisoes/<sprite>.<primeiros 8 do hash>.png` (salva pela ferramenta).

## 2. Achar o código-fonte do sprite
| Sprite (public/assets) | Fonte no gerador |
|---|---|
| `torre-besta-a-*` | `tools/pixel-art/sprites/torres/besta-a.js` (+ `torres/comum.js`) |
| `torre-besta-n-*`, rodadas `besta-*` | `tools/pixel-art/sprites/torres/besta-nova.js` + peças em `tools/pixel-art/lib/materiais/index.js` + `lib/Grade.js` (rodadas: `node tools/pixel-art/rodadas/render.mjs`) |
| `torre-besta-b/c-*`, `torre-catapulta-*` | `tools/pixel-art/sprites/torres/besta.js`, `catapulta.js` |
| `orc-b*`, `orc*`, `brutamontes*`, `ciborgue*` | `tools/pixel-art/sprites/orc-b.js`, `orc.js`, `futuros/*.js` |
| `decor-<kit>-*` | `tools/pixel-art/sprites/decoracao/kit-<kit>.js` (+ `decoracao/comum.js`) |
| `chao-map01` | `tools/pixel-art/cenario/chao.js` |
Quadros, pivots e encaixes: `src/config/towerArt.js`, `src/config/decor.js`, `src/config/art.js`. Paleta: `tools/pixel-art/palette.js`.
Folhas de sprites: `quadro` da marcação = índice na folha (cabeças de torre: quadro = fase × 13 + ângulo).

## 3. Para cada marcação aberta (alta → baixa)
1. **Olhe** a área: `node tools/revisor/recorte.mjs <sprite> --marca <n>` e abra a imagem gerada (Read). Olhe também o
   quadro inteiro no tamanho real para entender o contexto.
2. **Interprete** o comentário: o usuário descreve a sensação, não a solução. Traduza para pixel art, por exemplo:
   - "parece colado / flutuando" → falta sombra de contato ou de oclusão (tom 0 onde as peças se encontram);
   - "chapado / sem volume" → falta separar topo (claro) / frente (médio) / lateral (escura), ou falta rim light;
   - "sujo / ruidoso" → pixels órfãos, detalhes de 1 px espalhados, banding;
   - "mole / borrado" → contorno sem definição, degraus irregulares (jaggies), pillow shading;
   - "pesado / magro / desproporcional" → espessura de vigas, massa, relação com o orc (~80 px);
   - "some no chão / não se destaca" → contraste de valor com a grama/terra, contorno externo, saturação.
   Siga o `ART_SPEC.md` (paleta, luz do canto superior esquerdo, contorno seletivo, processo e checklist de limpeza da seção 10).
3. **Corrija no código-fonte** e rode `npm run pixel`.
4. **Confira**: `node tools/revisor/recorte.mjs <sprite> --marca <n> --antes tools/revisor/revisoes/<sprite>.<hash8>.png`
   e olhe o antes × depois. Se não resolveu, ajuste de novo.
5. **Registre** no JSON da revisão (edite o arquivo):
   - resolvido → `"status": "corrigida"` e `"resposta": "<uma frase dizendo o que mudou>"`;
   - comentário ambíguo ou com mais de uma leitura → `"status": "esclarecimento"` e `"resposta": "<pergunta objetiva>"`
     (não chute uma solução grande);
   - acrescente `"corrigida_em": "<data>"` quando corrigir.
6. **Efeitos colaterais**: se a correção mexer em outra área do sprite, em outros quadros, numa peça compartilhada
   (`lib/materiais`, `comum.js`, paleta) ou em outros sprites, diga quais — e regenere/confira esses também.

## 4. Fechar
- Grave no JSON da revisão `"revisado": { "hash": "<sha256 do PNG novo>", "data": "<data>" }` (mantenha o `hash` original:
  ele identifica a versão que foi revisada).
- `npm run pixel` e `npm run build` sem erros (nunca commitar com build quebrado).
- Commit: `Revisão <sprite>: N correções` (N = marcações corrigidas), com um resumo curto no corpo; depois `git push`.
- Responda ao usuário com: cada marcação (#n) → o que mudou ou a pergunta de esclarecimento; efeitos colaterais; e como
  conferir: `npm run revisor` → sprite → **Comparar** (antes = cópia da revisão) → **Piscar**.
