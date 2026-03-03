# /commit

Analisa mudanças e cria commit conciso.

## Passos

1. `git status` - ver arquivos modificados
2. `git diff` - analisar mudanças
3. `npm run lint` - verificar erros
4. Gerar mensagem de commit
5. Executar commit

## Formato

```
tipo: descrição curta
```

Tipos:

- `feat` - nova funcionalidade
- `fix` - correção de bug
- `refactor` - mudança sem alterar comportamento
- `chore` - configs, deps, cleanup
- `docs` - documentação
- `test` - testes
- `style` - formatação

## Regras

- Conciso (max 50 chars no título)
- Sem emoji
- Sem co-author
- Em inglês

## Execução

```bash
npm run lint
git add -A
git commit -m "tipo: descrição"
```

Analise as mudanças e faça o commit.
