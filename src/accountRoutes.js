import express from 'express';
import bcrypt from "bcryptjs";
import passportLocal from 'passport-local';
import { pgPool } from './db/dbClient.js';
import passport from 'passport';

const router = express.Router()

// NOTE: all these routes are prefixed with /api/accounts (see server.js)
router.post('/login', (req, res, next) => {
  const { username, password } = req.body;
  if (!password || !username) {
    return res.status(400).json({ errorMessage: 'invalid login details. ', success: false });
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({
        errorMessage: 'internal server error. Please try again later.',
        success: false,
      });
    }
    if (!user) {
      return res.status(404).json({
        errorMessage: 'No user exists, or incorrect login credentials',
        success: false,
      });
    }
    // we don't need to call req.logIn here, since passport.authenticate does this for us.
    req.logIn(user, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          errorMessage: 'internal server error. Please try again later.',
          success: false 
        });
      }
      res.json({ success: true });
    });
  })(req, res,next);
});

router.post('/register', async (req, res) => {
  const dbClient = await pgPool.connect();
  const { username, email, password } = req.body;
  if (!password || !username || !email) {
    return res.status(400).json({ errorMessage: 'invalid registration details. ', success: false });
  }
  const { rows } = await dbClient.query(`
    SELECT * from Users WHERE username = $1 OR email = $2;
  `, [ username, email ]);
  if (rows.length === 1) {
    return res.status(400).json({ errorMessage: 'user with username / email already exists. ', success: false });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const { rows: [newUser, ]} = await dbClient.query(`
    INSERT INTO Users(date_created, username, hashed_password, email) VALUES($1, $2, $3, $4) RETURNING *;
  `, [ new Date(), username, hashedPassword, email ]);

  // TODO: is there a promise version of this?
  req.logIn(newUser, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        errorMessage: 'internal server error. Please try again later.',
        success: false 
      });
    }
    res.json({ success: true });
  });


});

export default router;
