const request = require('supertest');
const { expect } = require('chai');

describe('Autenticação da API', function() {
  let token;
  const testUser = { name: 'Karla', email: 'karla.santos@email.com', password: '123456' };

  it('Registrar novo usuário', async function() {
    const res = await request('http://localhost:3000')
      .post('/api/users/register')
      .send(testUser);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('user');
    expect(res.body.user).to.have.property('name', testUser.name);
    expect(res.body.user).to.have.property('email', testUser.email);
  });

  it('Realizar login', async function() {
    const res = await request('http://localhost:3000')
      .post('/api/users/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
    token = res.body.token;
  });

  it('Retorna erro 401', async function() {
    const res = await request('http://localhost:3000')
      .post('/api/checkout')
      .send({ productId: 1 });
    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error');
  });

  it('Retorna sucesso com token válido', async function() {
    const res = await request('http://localhost:3000')
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 1 }],
        freight: 10,
        paymentMethod: 'cartão de crédito',
        cardData: { number: '1234123412341234', name: 'Joana da Silva Nates', expiry: '12/30', cvv: '123' }
      });
    expect(res.status).to.not.equal(401);
    expect(res.body).to.have.property('valorFinal');
  });
});
