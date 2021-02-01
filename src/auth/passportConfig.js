import bcrypt from "bcryptjs";
import passportLocal from 'passport-local';
import { pgPool } from '../db/dbClient.js';

const localStrategy = passportLocal.Strategy;

const configurePassport = (passport) => {
  passport.use(
    // strategy to authenticate a username and password (login)
    new localStrategy(async (username, password, done) => {
      const dbClient = await pgPool.connect();
      const { rows } = await dbClient.query(`
        SELECT * from Users WHERE username = $1;
      `, [ username ]);
      if (rows.length === 0) {
        return done(null, false);
      }
      const result = await bcrypt.compare(password, rows[0].hashed_password);
      if (result === true) {
        return done(null, rows[0]);
      } else {
        return done(null ,false);
      }
    }
  ));

  // see here: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
  passport.serializeUser((user, cb) => {
    cb(null, user.user_id); // here the CB is used to store the user_id that is associated with this
    // session token.
  });
  passport.deserializeUser((user_id, cb) => {
    cb(null, { user_id }); // if needed, can query DB to get details on user. But this
    // can be split into two auth middlewares (one to just get the user_id, another to get the full
    // user information.
  });
};

export default configurePassport;
