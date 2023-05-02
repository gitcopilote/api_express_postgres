const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const multer = require('multer');

router.use(cookieParser());
// router.use(express.json());


const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'ange2412',
  database: 'db_depenses'
});


const transporter = nodemailer.createTransport({
  // host: 'smtp.example.com',
  service: 'gmail',
  // port: 587,
  secure: false,
  auth: {
    user: 'angeparfaitkouadio@gmail.com',
    pass: '@nge2412'
  }
});








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

    // fs.readFile('email.html', 'utf-8', function (err, data) {
    //   if (err) {
    //     return console.error(err);
    //   }

    //   const mailOptions = {
    //     from: 'angeparfaitkouadio@gmail.com',
    //     to: req.body.email,
    //     subject: 'Confirmer votre email',
    //     html: data
    //   };

    //   transporter.sendMail(mailOptions, function (error, info) { 
    //     if (error) {
    //       console.log(error);
    //     } else {
    //       console.log('Email sent: ' + info.response);
    //     }
    //   });
    // });



 


    const hash = await bcrypt.hash(req.body.password, 10);
    const client = await pool.connect();
    const result = await client.query(`INSERT INTO users (username, email, password) values ($1, $2, $3)`, [req.body.username, req.body.email, hash]);
    res.status(201).send(`utilisateur enregistré`);
    client.release();
  }

  catch (err) {
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

    const payload = { user: { id: user.id, username: user.username, email: user.email, password: user.password } };
    jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      // res.send({ token });



      res.cookie('jwt', token, { httpOnly: true });
      res.send({ message: 'Connexion réussie' });
    });

  } catch (err) {
    res.status(500).send(`Error logging in user: ${err}`);
  }
});



// Middleware pour vérifier le jeton JWT
const authMiddleware = (req, res, next) => {
  const token = req.cookies.jwt;

  // console.log(token);

  if (!token) {
    return res.status(401).send({ message: 'Non authentifié' });
  }
  try {

    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).send({ message: 'Non authentifiégg' });
    // res.status(401).send(e); 
  }
};

// Endpoint pour obtenir des informations de l'utilisateur connecté
router.get('/userinfo', authMiddleware, (req, res) => {
  res.send(req.user);
});




// Endpoint pour la déconnexion
router.post('/logout', (req, res) => {
  // Supprimer le cookie avec le jeton JWT
  res.clearCookie('jwt');
  
  res.send({ message: 'Déconnexion réussie' });
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
  check('username').not().isEmpty().withMessage('Username is required'),
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
