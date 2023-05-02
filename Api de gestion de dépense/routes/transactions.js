const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { check, validationResult } = require('express-validator');


const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ange2412',
    database: 'db_depenses'
});




router.post('/transactions', [
    check('user_id').not().isEmpty().withMessage("id obligatoire"),
    check('amount').not().isEmpty().withMessage('montant requit'),
    check('description').not().isEmpty().withMessage('description de la transaction'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    try {
        const client = await pool.connect();
        const result = await client.query(`INSERT INTO transactions (user_id, amount, description) values ($1, $2, $3)`, [req.body.user_id, req.body.amount, req.body.description]);
        res.status(201).send("transaction ajoutée");
        client.release();
    } catch (err) {

        res.status(400).send("transaction impossible");
    }
});



router.get('/transactions', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM transactions`);
    res.status(200).send(result.rows);
    client.release();
  } catch (err) {
    res.status(500).send(`Error retrieving user: ${err}`);
  }
});


// router.get('/transactions/:id', async (req, res) => {

//   try {
//     const client = await pool.connect();
//     const result = await client.query(`SELECT * FROM transactions WHERE id = $1`, [req.params.id]);
//     res.status(200).send(result.rows[0]);
//     client.release();
//   } catch (err) {
//     res.status(500).send(`Error retrieving user: ${err}`);
//   }
// });



router.get('/transactions/:user_id', async (req, res) => {

    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * FROM transactions WHERE user_id = $1`, [req.params.user_id]);
        res.status(200).send(result.rows);
        client.release();
    } catch (err) {
        res.status(500).send(`Error retrieving user: ${err}`);
    }
});




// modifier transaction par id non pas par id de
router.put('/transactions/:id', [
    check('amount').not().isEmpty().withMessage('amount is required'),
    check('description').not().isEmpty().withMessage('description is required'), 
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    try {
        const client = await pool.connect();
        const result = await client.query(`UPDATE transactions SET amount = $1, description = $2 WHERE id = $3`, [req.body.amount, req.body.description, req.params.id]);
        res.status(200).send(`User updated with ID: ${req.params.id}`);
        client.release();
    } catch (err) {
        // res.status(500).send(`Error updating user: ${err}`);
        res.status(400).send("l'email existe deja");
    }
});

// router.delete('/transactions/:id', async (req, res) => {
//     try {
//         const client = await pool.connect();
//         const result = await client.query(`DELETE FROM transactions WHERE id = $1`, [req.params.id]);
//         res.status(200).send(`transactions deleted with ID: ${req.params.id}`);
//         client.release();
//     } catch (err) {
//         res.status(500).send(`Error deleting transactions: ${err}`);
//     }
// });

module.exports = router;
