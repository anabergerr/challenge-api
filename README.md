# Desafio Técnico Python Sonda em Marte

## Nossas expectativas

A equipe de engenharia da RD Station tem alguns princípios nos quais baseamos nosso trabalho diário. Um deles é: projete seu código para ser mais fácil de entender, não mais fácil de escrever.

Portanto, para nós, é mais importante um código de fácil leitura do que um que utilize recursos complexos e/ou desnecessários.

O que gostaríamos de ver:

- O código deve ser fácil de ler. Clean Code pode te ajudar.
- Testes são parte essencial do desenvolvimento, ter bons testes do seu código é importante.
- Notas gerais e informações sobre a versão da linguagem e outras informações importantes para executar seu código.
- Um README.md bem organizado que facilite o entendimento do seu teste e sua execução.
- Você deve enviar para nós o link do repositório público com a aplicação desenvolvida (GitHub, BitBucket, etc.).

## O Desafio - API da Sonda em Marte

O desafio consiste em uma API para controlar o movimento de sondas enviadas em missão para Marte para explorar um planalto estranhamente retangular.
Para representar esse planalto e facilitar a navegação vamos usar uma malha com duas dimensões **X** e **Y** e a posição da sonda será dada
pelas suas coordenadas mais a direção que ela está virada, por exemplo (0, 0, NORTH) indica que a sonda está no canto inferior esquerdo olhando para
a direção norte. Alguns pontos de atenção:

- Uma sonda sempre começará no canto inferior esquerdo da malha, representado pelas coordenadas (0,0).
- Uma sonda **nunca** deverá sair dos limites da malha e portanto "cair" do planalto.

Você deverá desenvolver em Python utilizando qualquer biblioteca ou framework para criação de APIs (FastAPI, Flask, Django, etc),
sua API deverá expor 3 endpoints:

### 1. Lançar sonda e Configurar malha

Esse endpoint receberá a seguinte requisição para lançar uma sonda e definir o tamanho total da malha:
```json
{
    "x": 5,
    "y": 5,
    "direction": "NORTH"
}
```
As coordenadas ***x, y*** indicam o canto superior direito da malha disponível para a sonda, novamente, a sonda também **sempre** deverá
iniciar na posição (0,0). Nesse exemplo, teríamos a seguinte malha e situação inicial:

```
Y
5 +---+---+---+---+---+---+(5,5)
  |   |   |   |   |   |   |
  +---+---+---+---+---+---+
4 |   |   |   |   |   |   |
  +---+---+---+---+---+---+
3 |   |   |   |   |   |   |
  +---+---+---+---+---+---+
2 |   |   |   |   |   |   |
  +---+---+---+---+---+---+
1 |   |   |   |   |   |   |
  +---+---+---+---+---+---+
0 | ^ |   |   |   |   |   |
  +---+---+---+---+---+---+
    0   1   2   3   4   5   X
```

A resposta deverá conter um **identificador único** para a sonda, para que seja possível utilizar nos próximos endpoints. Um
exemplo de resposta seria:

```json
{
    "id": "abc123",
    "x": 0,
    "y": 0,
    "direction": "NORTH"
}
```

### 2. Mover sonda

Esse endpoint receberá uma string contendo uma lista de comandos a serem executados pela sonda. Existem 3 tipos de comando simbolizados pelas letras:

- M: para mover a sonda 1 espaço na direção que ela está apontando
- L: para fazer a sonda rotacionar uma vez para a direção à esquerda (exemplo, se estiver olhando para o Norte, irá olhar para o Oeste), mas sem se mover de quadrante.
- R: para fazer a sonda rotacionar para a direção à direita (exemplo, se estiver olhando para o Leste, irá olhar para o Sul), mas sem se mover de quadrante.

Por exemplo, a sequência "MRM" para a sonda de exemplo a cima resultará no seguinte estado (1, 1, EAST):

```
Y
5 +---+---+---+---+---+---+(5,5)
  |   |   |   |   |   |   |
  +---+---+---+---+---+---+
4 |   |   |   |   |   |   |
  +---+---+---+---+---+---+
3 |   |   |   |   |   |   |
  +---+---+---+---+---+---+
2 |   |   |   |   |   |   |
  +---+---+---+---+---+---+
1 |   | > |   |   |   |   |
  +---+---+---+---+---+---+
0 |   |   |   |   |   |   |
  +---+---+---+---+---+---+
    0   1   2   3   4   5   X
```

**Atenção!** O contrato de entrada para esse endpoint fica a seu critério. Mas o retorno do endpoint necessariamente deverá responder com a posição e direção final da sonda::

```json
{
    "id": "abc123",
    "x": 1,
    "y": 1,
    "direction": "EAST"
}
```

**Importante**, lembre-se de tratar casos de sequências inválidas de movimento, se uma sequência inválida for enviada,
a sonda **não deverá** executar ela inteira e retornar uma resposta apropriada a seu critério.

### 3. Ver posição das sondas

Por último, você precisa implementar um endpoint que retorne o estado de todas as sondas enviadas com a seguinte resposta:

```json
"probes": [
  {
      "id": "abc123",
      "x": 1,
      "y": 1,
      "direction": "EAST"
  },
  {
      "id": "xyzbas1234",
      "x": 3,
      "y": 4,
      "direction": "NORTH"
  }
]
```
### O que esperamos da sua solução

1. Uma API construída com boas práticas e seguindo as convenções esperadas para uma API REST HTTP.
2. Código limpo e com bons testes.
3. Domínio da linguagem Python, seu ecossistema e boas práticas.

### Itens adicionais / Legais de ter

1. Dockerização da sua aplicação.
2. Conhecimento de ferramentas de gerenciamento de projetos Python.
3. Uma solução de armazenamento para a sua API. Você não precisa implementar um banco de dados, mas caso queira ou julgue que possa ajudar ou ficar legal na sua solução, sinta-se à vontade.