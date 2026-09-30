---
description: Executa a próxima tarefa pendente da fila TAREFAS.md (uma por vez)
argument-hint: "[opcional: ID da tarefa, ex. T03]"
---

Você vai executar UMA tarefa da fila em `TAREFAS.md`, na raiz do projeto.

## 1. Escolher a tarefa
- Leia `TAREFAS.md` inteiro.
- Se o usuário passou um ID ("$ARGUMENTS"), execute essa tarefa.
- Senão: se existir alguma tarefa `[~]` (em andamento), ela foi interrompida — retome-a, conferindo no código o que já foi feito. Caso contrário, pegue a PRIMEIRA tarefa `[ ]` de cima para baixo.
- Se não houver tarefa pendente, diga isso e pare.

## 2. Antes de começar
- Marque a tarefa como `[~]` no cabeçalho dela em `TAREFAS.md`.
- Rode `git status`. Se houver mudanças não commitadas que não são desta tarefa, faça um commit delas antes ("mudanças antes de <ID>"), para esta tarefa ficar isolada e fácil de desfazer. Se o projeto ainda não usa git, avise o usuário e siga.
- Leia os arquivos que a tarefa menciona antes de alterá-los.

## 3. Executar
- Faça SOMENTE o que esta tarefa pede. Não comece a próxima tarefa, não adiante itens do roadmap e não "aproveite" para refatorar outras partes.
- Siga o `CLAUDE.md`. Se a tarefa pedir algo que contradiz o `CLAUDE.md`, a tarefa vale e o `CLAUDE.md` deve ser atualizado para refletir a nova regra.
- Se a tarefa for ambígua, contradisser uma tarefa já concluída, ou exigir uma decisão de gosto/design que ela não define, PARE e pergunte antes de seguir (marque `[!]` com o motivo se não puder continuar).

## 4. Verificar
- Rode `npm run build` e corrija qualquer erro.
- Cumpra os testes e critérios descritos na própria tarefa. O que depender de o usuário jogar/olhar, liste como "teste manual".

## 5. Fechar
- Troque o status para `[x]` e acrescente logo abaixo do cabeçalho da tarefa:
  `**Concluída em AAAA-MM-DD.** Resultado:` seguido de 2 a 5 tópicos curtos (o que mudou, arquivos principais, pendências ou sugestões).
- Não altere o texto das outras tarefas nem a ordem da fila.
- Se o git estiver disponível, faça um commit: "<ID>: <título da tarefa>".
- Responda ao usuário com: resumo do que foi feito, o que ele deve testar manualmente e quantas tarefas pendentes restam. Então PARE e espere.
