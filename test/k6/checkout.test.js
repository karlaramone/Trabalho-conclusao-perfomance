import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';
import { generateRandomEmail } from './helpers/randomEmail.js';
import { getBaseUrl } from './helpers/getBaseUrl.js';
import { login } from './helpers/login.js';

const checkoutDuration = new Trend('checkout_duration');

export const options = {
  stages: [
    { duration: '5s', target: 5 },
    { duration: '10s', target: 5 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000']
  }
};

export default function () {
  const baseUrl = getBaseUrl();
  const email = generateRandomEmail();
  const password = 'Test@1234';
  const name = `User ${Date.now()}`;

  group('User Registration', () => {
    const registerUrl = `${baseUrl}/api/users/register`;
    const payload = JSON.stringify({
      name: name,
      email: email,
      password: password
    });

    const params = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = http.post(registerUrl, payload, params);

    check(response, {
      'register status code is 201': (r) => r.status === 201,
      'register response has user': (r) => r.json('user') !== undefined
    });
  });

  let token = null;
  group('User Login', () => {
    const response = login(baseUrl, email, password);
    token = response.json('token');
  });

  group('Checkout Process', () => {
    const checkoutUrl = `${baseUrl}/api/checkout`;
    const payload = JSON.stringify({
      valorFinal: 101,
      userId: 3,
      items: [
        {
          productId: 1,
          quantity: 1
        }
      ],
      freight: 1,
      paymentMethod: 'boleto',
      total: 101
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const startTime = new Date();
    const response = http.post(checkoutUrl, payload, params);
    const endTime = new Date();
    const duration = endTime - startTime;

    checkoutDuration.add(duration);

    check(response, {
      'checkout status code is 200': (r) => r.status === 200,
      'checkout response has items': (r) => r.json('items') !== undefined
    });
  });
}
