const userService = require('../../src/services/userService');

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = userService.registerUser(name, email, password);
    res.status(201).json({ user });
  } catch (err) {
    if (err.message === 'Email já cadastrado') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  try {
    const result = userService.authenticate(email, password);
    if (!result) return res.status(401).json({ error: 'Credenciais inválidas' });
    res.json(result);
  } catch (err) {
    if (err.message === 'Credenciais inválidas') {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
