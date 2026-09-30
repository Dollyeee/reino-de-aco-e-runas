---
name: fila
description: Adiciona uma tarefa ao final da fila TAREFAS.md, sem executá-la
argument-hint: "<prompt da tarefa>"
disable-model-invocation: true
---


Adicione a tarefa abaixo ao FINAL de `TAREFAS.md` e NÃO a execute.

1. Leia `TAREFAS.md` e descubra o próximo ID livre (T01, T02, ...).
2. Crie um título curto (até ~6 palavras) que resuma a tarefa.
3. Acrescente no final do arquivo:

   ## [ ] <ID> — <título>

   <texto da tarefa exatamente como o usuário mandou, sem resumir nem reescrever>

4. Se houver uma tarefa `[~]` em andamento, não mexa nela nem no código: só registre a nova e volte ao que estava fazendo.
5. Responda em uma linha: "<ID> adicionada à fila — <título>. Pendentes: N."

Tarefa:

$ARGUMENTS
