const { expect } = require('chai');
const sinon = require('sinon');
const userService = require('../../../src/services/userService');
const request = require('supertest');
const app = require('../../app');

describe('Testes utilizando o Mock', function() {
  afterEach(() => {
    sinon.restore();
  });

  it('Deve exibir um erro de e-mail já cadastrado', async () => {
    sinon.stub(userService, 'registerUser').throws(new Error('Email já cadastrado'));

    const testUser = {
      name: 'karla',
      email: 'karla.santos@email.com',
      password: '123456'
    };

    const resposta = await request(app)
      .post('/api/users/register')
      .send(testUser);

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property('error', 'Email já cadastrado');
  });

  it('Deve exibir um erro de credenciais inválidas', async () => {
    sinon.stub(userService, 'authenticate').throws(new Error('Credenciais inválidas'));

    const testUser = {
      email: 'karlasantos@email.com',
      password: '123456'
    };

    const resposta = await request(app)
      .post('/api/users/login')
      .send(testUser);

    expect(resposta.status).to.equal(401);
    expect(resposta.body).to.have.property('error', 'Credenciais inválidas');
  });
});
