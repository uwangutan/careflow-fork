const express = require('express');
const mariadb = require('mariadb');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const session = require('express-session');

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

app.use(session({
  secret: 'gumandoy',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/signup.html', (req, res) => {
  res.sendFile(__dirname + '/public/signup.html');
});

app.post('/api/queue', async (req, res) => {
  console.log(req.body);

  const uid = req.session.uid;
  if (!uid) return res.status(401).json({ error: 'Not logged in' });
  const { category, queueNumber } = req.body;
  let categoryComplete = {
    A: 'Aisthecategory',
    B: 'Bisthecategory',
    C: 'Cisthecategory'
  };
  let departmentName = categoryComplete[category];

  let conn;

  try {
    conn = await pool.getConnection();
    await conn.execute(
      'INSERT INTO queues (queueCode, department, userID) VALUES (?, ?, ?)',
      [queueNumber, departmentName, uid]
    );
    res.json({ success: true });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
  finally {
    if (conn) conn.release();
  }
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

  let { email, password } = req.body;

  let conn;

  try {
    conn = await pool.getConnection();
    const [user] = await conn.execute(
      'SELECT userID, password_hash FROM users WHERE email = ?',
      [email]
    )
    console.log(user);

    if (user.length === 0) {
      console.log('there is none');
      return;
    }


    if (await bcrypt.compare(password, user.password_hash)) {

      console.log('The data is intercepted');
      req.session.uid = user.userID;
      res.json({ "success": true });
    } else {
      res.json(({ "failed": false }));
      console.log('there is something wrong');
    }


  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }

});


app.listen(3000, () => console.log('Running at http://localhost:3000'));
