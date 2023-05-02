
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');


const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'ange2412',
  database: 'db_depenses'
});




// router.post('/users', async (req, res) => {
//   try {
//     const client = await pool.connect();
//     const result = await client.query(`INSERT INTO users (username, email, password) values ($1, $2, $3)`, [req.body.username, req.body.email, req.body.password]);
//     res.status(201).send(`User created with ID: ${result.insertId}`);
//     client.release();
//   } catch (err) {
//     res.status(500).send(`Error creating user: ${err}`);
//   }
// });



router.post('/users', [
  check('username').not().isEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Email is invalid'),
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const client = await pool.connect();
    const result = await client.query(`INSERT INTO users (username, email, password) values ($1, $2, $3)`, [req.body.username, req.body.email, hash]);
    res.status(201).send(`User created with ID: ${result}`);
    client.release();
  } catch (err) {
    // res.status(500).send(`Error creating user: ${err}`);
    res.status(400).send("l'utilisateur exite deja");
  }
});



router.post('/login', [
  check('email').isEmail().withMessage('Email is invalid'),
  check('password').not().isEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM users WHERE email = $1`, [req.body.email]);
    const user = result.rows[0];
    client.release();

    if (!user) {
      return res.status(400).send({ errors: [{ msg: 'Email or password is incorrect' }] });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).send({ errors: [{ msg: 'Email or password is incorrect' }] });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.send({ token });
    });
  } catch (err) {
    res.status(500).send(`Error logging in user: ${err}`);
  }
});




router.get('/users', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM users`);
    res.status(200).send(result.rows);
    client.release();
  } catch (err) {
    res.status(500).send(`Error retrieving user: ${err}`);
  }
});







router.get('/users/:id', async (req, res) => {

  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM users WHERE id = $1`, [req.params.id]);
    res.status(200).send(result.rows[0]);
    client.release();
  } catch (err) {
    res.status(500).send(`Error retrieving user: ${err}`);
  }
});


router.put('/users/:id', [
  check('email').isEmail().withMessage('Email is invalid'),
  check('password').not().isEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(`UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4`, [req.body.username, req.body.email, req.body.password, req.params.id]);
    res.status(200).send(`User updated with ID: ${req.params.id}`);
    client.release();
  } catch (err) {
    // res.status(500).send(`Error updating user: ${err}`);
    res.status(400).send("l'email existe deja");
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.status(200).send(`User deleted with ID: ${req.params.id}`);
    client.release();
  } catch (err) {
    res.status(500).send(`Error deleting user: ${err}`);
  }
});

module.exports = router;
