# API Checkout Rest e GraphQL

Se você é aluno da Pós-Graduação em Automação de Testes de Software (Turma 2), faça um fork desse repositório e boa sorte em seu trabalho de conclusão da disciplina.

## Instalação

```bash
npm install express jsonwebtoken swagger-ui-express apollo-server-express graphql
```

## Exemplos de chamadas

### REST

#### Registro de usuário
```bash
curl -X POST http://localhost:3000/api/users/register \
	-H "Content-Type: application/json" \
	-d '{"name":"Novo Usuário","email":"novo@email.com","password":"senha123"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
	-H "Content-Type: application/json" \
	-d '{"email":"novo@email.com","password":"senha123"}'
```

#### Checkout (boleto)
```bash
curl -X POST http://localhost:3000/api/checkout \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <TOKEN_JWT>" \
	-d '{
		"items": [{"productId":1,"quantity":2}],
		"freight": 20,
		"paymentMethod": "boleto"
	}'
```

#### Checkout (cartão de crédito)
```bash
curl -X POST http://localhost:3000/api/checkout \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <TOKEN_JWT>" \
	-d '{
		"items": [{"productId":2,"quantity":1}],
		"freight": 15,
		"paymentMethod": "credit_card",
		"cardData": {
			"number": "4111111111111111",
			"name": "Nome do Titular",
			"expiry": "12/30",
			"cvv": "123"
		}
	}'
```
## Como rodar

### REST
```bash
node rest/server.js
```
Acesse a documentação Swagger em [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### GraphQL
```bash
node graphql/app.js
```
Acesse o playground GraphQL em [http://localhost:4000/graphql](http://localhost:4000/graphql)

## Endpoints REST
- POST `/api/users/register` — Registro de usuário
- POST `/api/users/login` — Login (retorna token JWT)
- POST `/api/checkout` — Checkout (requer token JWT)

## Regras de Checkout
- Só pode fazer checkout com token JWT válido
- Informe lista de produtos, quantidades, valor do frete, método de pagamento e dados do cartão se necessário
- 5% de desconto no valor total se pagar com cartão
- Resposta do checkout contém valor final

## Banco de dados
- Usuários e produtos em memória (veja arquivos em `src/models`)

## Testes
- Para testes automatizados, importe o `app` de `rest/app.js` ou `graphql/app.js` sem o método `listen()`

## Documentação
- Swagger disponível em `/api-docs`
- Playground GraphQL disponível em `/graphql`

## Conceitos aplicados nos testes K6

- **Thresholds**: definido em `test/k6/checkout.test.js` nas `options` para garantir que o percentil 95 de latência esteja abaixo do limite.
  - Exemplo:
    ```js
    export const options = {
      stages: [ { duration: '5s', target: 5 }, { duration: '10s', target: 5 } ],
      thresholds: { http_req_duration: ['p(95)<2000'] }
    };
    ```

- **Checks**: usados após cada requisição para validar status e estrutura da resposta.
  - Arquivos: `test/k6/checkout.test.js`, `test/k6/helpers/login.js`
  - Exemplo (registro):
    ```js
    check(response, {
      'register status code is 201': (r) => r.status === 201,
      'register response has user': (r) => r.json('user') !== undefined
    });
    ```

- **Helpers**: funções reutilizáveis armazenadas em `test/k6/helpers`.
  - Arquivos:
    - `test/k6/helpers/randomEmail.js` — gera email único (compatível com k6)
    - `test/k6/helpers/getBaseUrl.js` — obtém `BASE_URL` via `__ENV`
    - `test/k6/helpers/login.js` — função de login que realiza POST e faz checks
  - Uso (import): `import { login } from './helpers/login.js';`

- **Trends**: métrica custom `Trend` para monitorar duração do checkout.
  - Arquivo: `test/k6/checkout.test.js`
  - Exemplo:
    ```js
    import { Trend } from 'k6/metrics';
    const checkoutDuration = new Trend('checkout_duration');
    // depois da request:
    checkoutDuration.add(duration);
    ```

- **Faker**: `@faker-js/faker` foi usado via utilitário Node para pré-gerar emails
  - Arquivo: `tools/generate-emails.js` (usa `@faker-js/faker` e grava `tmp/emails.json`)

- **Variável de Ambiente**: `BASE_URL` lida por `test/k6/helpers/getBaseUrl.js` usando `__ENV` do k6.
  - Arquivo: `test/k6/helpers/getBaseUrl.js`
  - Exemplo de execução: `k6 run test/k6/checkout.test.js --env BASE_URL=http://localhost:3000`

- **Stages**: configuração de rampa e sustentação do teste.
  - Arquivo: `test/k6/checkout.test.js`
  - Exemplo:
    ```js
    stages: [ { duration: '5s', target: 5 }, { duration: '10s', target: 5 } ]
    ```

- **Reaproveitamento de Resposta**: respostas são lidas e reusadas (token do login para autorização no checkout).
  - Arquivo: `test/k6/checkout.test.js`
  - Exemplo:
    ```js
    const loginResp = login(baseUrl, email, password);
    const token = loginResp.json('token');
    // usar token no header do checkout
    'Authorization': `Bearer ${token}`
    ```

- **Uso de Token de Autenticação**: token JWT extraído do login e enviado no header `Authorization` para `/api/checkout`.
  - Arquivo: `test/k6/checkout.test.js` e `test/k6/helpers/login.js`

- **Data-Driven Testing**: suporte via utilitário para gerar emails (`tools/generate-emails.js`) e possibilidade de ler `tmp/emails.json` no k6 com `open()`
  - Arquivo utilitário: `tools/generate-emails.js` (gera `tmp/emails.json`)

- **Groups**: organização do fluxo em grupos para clareza e agregação de métricas.
  - Arquivo: `test/k6/checkout.test.js`
  - Exemplo:
    ```js
    group('User Registration', () => { /* register request + checks */ });
    group('User Login', () => { /* login + extract token */ });
    group('Checkout Process', () => { /* checkout + checks */ });
    ```

