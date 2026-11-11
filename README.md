# Sonda em Marte

API em Python (FastAPI) para controlar sondas num planalto retangular, com interface web em React.
O enunciado original do desafio está em [CHALLENGE.md](CHALLENGE.md).

## Início rápido

Três terminais, nesta ordem. O primeiro deixa a API no ar, o segundo serve a interface (que
depende da API), e o terceiro é opcional, para ver os testes.

```bash
# terminal 1 — API
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
# terminal 2 — interface (deixe o terminal 1 rodando)
cd web
npm install
npm run dev
```

Abra **http://localhost:5173**. A API fica em http://localhost:8000, com documentação interativa em
http://localhost:8000/docs.

```bash
# terminal 3 — testes (opcional)
pip install -r requirements-dev.txt
pytest
cd web && npm test
```

Prefere não instalar nada? `docker compose up --build` sobe os dois serviços e dispensa os passos
acima. Detalhes de cada caminho estão nas seções seguintes.

## Requisitos

- **Python 3.13+** — confira com `python --version`
- **Node.js 20.19+ ou 22.12+** — confira com `node --version`. O Vite 8 não aceita versões
  anteriores a essas. O npm vem junto com o Node.
- **Docker** (opcional) — só se for usar o `docker compose`

## Como rodar

### API

```bash
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`. Documentação interativa em `http://localhost:8000/docs`.

### Interface

```bash
cd web
npm install
npm run dev
```

A interface sobe em `http://localhost:5173`.

### Testes

```bash
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

Os dois arquivos são necessários: `requirements.txt` traz a aplicação (FastAPI, Pydantic) e
`requirements-dev.txt` traz só o que a suíte usa para rodar (pytest e o cliente HTTP do
`TestClient`). Instalar apenas o segundo faz a coleta falhar em `ModuleNotFoundError`.

Estado atual: **44 testes, 100% de cobertura** do código em `app/` (116 instruções). Para ver o
número na sua máquina:

```bash
pytest --cov=app --cov-report=term-missing
```

### Testes da interface

```bash
cd web
npm install
npm test          # Vitest + Testing Library, uma passada
npm run test:watch
```

São **32 testes** em 5 arquivos: o grid do planalto, o cliente HTTP, a tabela navegável por teclado,
o fluxo completo do app com a API mockada, e verificações de acessibilidade com `axe-core`.
Rodam em jsdom, sem precisar de servidor nem navegador.

### Docker

```bash
docker compose up --build
```

API em `http://localhost:8000`, interface em `http://localhost:5173`.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/probes` | Configura a malha e lança uma sonda em `(0, 0)` |
| `POST` | `/probes/{id}/commands` | Executa uma sequência de comandos `M`, `L`, `R` |
| `GET` | `/probes` | Lista o estado atual de todas as sondas |
| `GET` | `/probes/{id}` | Consulta uma sonda individual |
| `DELETE` | `/probes` | Reinicia a missão: remove todas as sondas |

O `POST /probes` responde `201` com o header `Location: /probes/{id}`, apontando para o recurso
recém-criado. O enunciado pede três endpoints; `GET /probes/{id}` e `DELETE /probes` são acréscimos
para a interface conseguir consultar uma sonda e reiniciar a missão.

Toda resposta de sonda inclui o planalto em que ela foi lançada:

```json
{"id": "b31e5917", "x": 0, "y": 0, "direction": "NORTH", "max_x": 5, "max_y": 5}
```

`max_x` e `max_y` existem para a interface saber até onde desenhar o grid: sem eles, ela só
conheceria o tamanho que está no formulário, não o da malha em que a sonda realmente está.

### Exemplos

Lançar uma sonda numa malha `(5,5)` apontando para o norte:

```bash
curl -X POST http://localhost:8000/probes \
  -H "Content-Type: application/json" \
  -d '{"x": 5, "y": 5, "direction": "NORTH"}'
```

```json
{"id": "b31e5917", "x": 0, "y": 0, "direction": "NORTH", "max_x": 5, "max_y": 5}
```

Mover com a sequência `MRM`:

```bash
curl -X POST http://localhost:8000/probes/b31e5917/commands \
  -H "Content-Type: application/json" \
  -d '{"commands": "MRM"}'
```

```json
{"id": "b31e5917", "x": 1, "y": 1, "direction": "EAST", "max_x": 5, "max_y": 5}
```

Listar todas as sondas:

```bash
curl http://localhost:8000/probes
```

```json
{"probes": [{"id": "b31e5917", "x": 1, "y": 1, "direction": "EAST", "max_x": 5, "max_y": 5}]}
```

Reiniciar a missão (remove todas as sondas):

```bash
curl -X DELETE http://localhost:8000/probes
```

```json
{"probes": []}
```

## Regras de domínio

- `x` e `y` do lançamento são o **canto superior direito inclusivo** da malha. `{"x": 5, "y": 5}`
  cria um planalto de 6x6 posições (`0..5` em cada eixo). Os dois valores são independentes: a
  malha pode ser retangular, como `{"x": 3, "y": 1}` (4 por 2 posições).
- Toda sonda começa em `(0, 0)`, com a direção informada.
- `M` move 1 posição na direção atual; `L` e `R` giram 90° sem mover.
- Nenhum comando pode levar a sonda para fora do planalto.

### Limites de entrada

O enunciado não define teto para o planalto nem para a sequência, então a API impõe os seus:

- `x` e `y` do lançamento vão até **100**. Sem esse teto, um pedido como `{"x": 100000}`
  obrigaria a interface a desenhar 10¹⁰ células.
- `commands` aceita até **1000 caracteres**.

Acima disso a resposta é `422`.

### Validação de entrada

O contrato é estrito nos dois sentidos:

- Campos que não existem no contrato são recusados com `422` (`extra="forbid"`). Um
  `{"x": 5, "y": 5, "direction": "NORTH", "admin": true}` não passa.
- `x` e `y` exigem inteiro de verdade (`StrictInt`). `"5"`, `5.9` e `true` são recusados com `422`
  em vez de convertidos em `5`, `5` e `1`.

Isso evita que um cliente com bug passe despercebido: em vez de o servidor adivinhar a intenção,
ele diz que o corpo está errado.

### Sequências inválidas

Uma sequência é inválida quando contém um caractere diferente de `M`, `L` ou `R`, ou quando
algum `M` levaria a sonda para fora da malha. Nesses casos a resposta é `422` e **a sonda não se
move** — a sequência é tudo ou nada.

Isso é implementado calculando o resultado numa cópia: `apply_commands` em `app/engine.py` é uma
função pura que devolve uma sonda nova ou levanta `InvalidCommandSequence`. O estado salvo só é
substituído depois que a função retorna com sucesso, então uma falha no meio da sequência não
deixa resíduo.

A leitura e a escrita acontecem sob o mesmo lock (`Store.apply_to`). Sem isso, duas sequências
enviadas ao mesmo tempo para a mesma sonda leriam a mesma posição e a última gravação descartaria
o movimento da outra.

### Dois formatos de `422`

O `422` aparece em duas situações, com corpos diferentes e de propósito:

- **Corpo fora do schema** (campo faltando, tipo errado, direção inválida): o Pydantic devolve uma
  lista, um item por campo, com `loc` dizendo onde está o problema.
- **Regra de domínio violada** (a sonda sairia da malha, comando desconhecido): a resposta é uma
  mensagem única em `detail`, porque não há campo errado — a requisição está bem formada, o que
  não pode acontecer é o efeito.

Unificar os dois faria o erro de schema perder o detalhe por campo. O cliente ramifica pelo tipo
de `detail` (string ou lista); `web/src/api.ts` já faz isso.

## Decisões de projeto

- **Separação entre domínio e HTTP**: as regras da sonda vivem em `app/engine.py`, sem importar
  FastAPI. Isso permite testar a lógica sem subir servidor e mantém os handlers finos.
- **Contrato estrito**: os corpos de requisição usam `extra="forbid"` e `StrictInt`, então campo
  desconhecido ou tipo frouxo é recusado com `422` em vez de silenciosamente ignorado ou convertido.
- **Headers de segurança**: toda resposta leva `X-Content-Type-Options: nosniff` e
  `X-Frame-Options: DENY`.
- **Acessibilidade na interface**: mensagens de erro são anunciadas por leitor de tela
  (`aria-live` + `role="alert"`), a tabela de sondas é navegável por teclado (Tab, Enter, Espaço) com
  foco visível, e o planalto é anunciado como região rotulada. Verificado com `axe-core` contra as
  regras WCAG A/AA em `src/App.test.tsx` e `src/components/ProbeRow.test.tsx`, além dos
  comportamentos que o axe não cobre (teclado e live region).
- **Planalto memoizado**: o `Board` só re-renderiza quando as sondas ou a seleção mudam. Sem isso,
  cada tecla no campo de sequência reconstruía todas as células — 10.201 numa malha 100x100.
- **Armazenamento em memória**: um `dict` protegido por lock. O enunciado dispensa banco de dados;
  o estado é perdido ao reiniciar o processo.
- **Malha por sonda**: cada sonda carrega `max_x` e `max_y` do planalto em que foi lançada, em vez
  de guardar esse estado à parte. Lançar uma sonda numa malha maior depois não expande o planalto
  das anteriores — o enunciado não define esse caso, e esse comportamento evita que uma sonda
  "caia" retroativamente. A interface usa esses campos para desenhar o grid com o tamanho real da
  sonda selecionada.
- **Contrato do endpoint de comandos**: `{"commands": "MRM"}`, já que o enunciado deixa o formato
  de entrada a critério da implementação.
- **Comandos em minúsculo** são aceitos e normalizados para maiúsculo.
- **Reiniciar a missão**: `DELETE /probes` limpa o estado em memória. Exposto na interface como
  "Reiniciar missão", com confirmação antes de apagar. O reset remove as sondas mas mantém o
  tamanho do planalto escolhido no formulário.

## Estrutura

```
app/
  main.py      # rotas e handlers de erro
  models.py    # Direction, Probe e corpos das requisições
  engine.py    # regras da sonda (puro, sem FastAPI)
  store.py     # armazenamento em memória
tests/
  test_engine.py  # regras de movimento e rotação
  test_api.py     # contrato dos endpoints
  test_store.py   # atomicidade da leitura-modificação-escrita
web/
  src/App.tsx          # composição: estado e handlers
  src/main.tsx         # ponto de entrada
  src/style.css        # estilos
  src/components/      # Board, CommandForm, HowToPlay, LaunchForm, ProbeRow, ResetBar, Rover
  src/lib/             # api (HTTP), directions, commands
  src/test/            # setup do Vitest e declarações de tipo
  src/**/*.test.tsx    # os 32 testes (ao lado do componente que cobrem)
  vite.config.ts       # Vite + configuração do Vitest (jsdom)
```

## Versões

- Python 3.13
- FastAPI 0.121
- React 19 + Vite 8

As dependências estão fixadas em `requirements.txt` e `web/package-lock.json`.
