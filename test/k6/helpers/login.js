import http from 'k6/http';
import { check } from 'k6';

export function login(baseUrl, email, password) {
  const loginUrl = `${baseUrl}/api/users/login`;
  const payload = JSON.stringify({
    email: email,
    password: password
  });

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const response = http.post(loginUrl, payload, params);

  check(response, {
    'login status code is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json('token') !== undefined
  });

  return response;
}
