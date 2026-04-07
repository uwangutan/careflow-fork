const express = require('express');
const mariadb = require('mariadb');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.static('public'));

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/signup.html', (req, res) => {
  res.sendFile(__dirname + '/public/signup.html');
});

app.post('/api/signup', async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, hashed]
    );
    res.json({ "success": true });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
  finally {
    if (conn) conn.release();
  }
});

app.post('/api/login', async (req, res) => {

  const { email, password } = req.body;

  let conn;

  try {
    conn = await pool.getConnection();
    const [user] = await conn.execute(
      'SELECT id, password_hash FROM users WHERE email = ?',
      [email]
    )

    if (user.length === 0) {
      console.log('there is none');
    }

    if (await bcrypt.compare(password, user[0].password_hash)) {

      res.json({ "success": true });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }

});


app.listen(3000, () => console.log('Running at http://localhost:3000'));
