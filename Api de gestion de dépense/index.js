const express = require('express');
const app = express();
const usersRouter = require('./routes/users');
const transactionsRouter = require('./routes/transactions');

app.use(express.json());
app.use('/api', usersRouter);
app.use('/api', transactionsRouter);

app.listen(3000, () => {
  console.log('CRUD API running on port 3000'); 
});
