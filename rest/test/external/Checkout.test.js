const request = require('supertest');
const { expect } = require('chai');

describe('Teste acessando a API externa', function() {
  let token;
  const testUser = { name: 'Karla', email: 'karla.santos@email.com', password: '123456' };

  it('Registrar novo usuário', async function() {
    const resposta = await request('http://localhost:3000')
      .post('/api/users/register')
      .send(testUser);
    expect(resposta.status).to.equal(201);
    expect(resposta.body).to.have.property('user');
    expect(resposta.body.user).to.have.property('name', testUser.name);
    expect(resposta.body.user).to.have.property('email', testUser.email);
  });

  it('Realizar login', async function() {
    const resposta = await request('http://localhost:3000')
      .post('/api/users/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(resposta.status).to.equal(200);
    expect(resposta.body).to.have.property('token');
    token = resposta.body.token;
  });

  it('Retorna erro 401', async function() {
    const resposta = await request('http://localhost:3000')
      .post('/api/checkout')
      .send({ productId: 1 });
    expect(resposta.status).to.equal(401);
    expect(resposta.body).to.have.property('error');
  });

  it('Retorna sucesso com token válido', async function() {
    const resposta = await request('http://localhost:3000')
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 1 }],
        freight: 10,
        paymentMethod: 'cartão de crédito',
        cardData: { number: '1234123412341234', name: 'Joana da Silva', expiry: '12/30', cvv: '123' }
      });
    expect(resposta.status).to.not.equal(401);
    expect(resposta.body).to.have.property('valorFinal');
  });
});
