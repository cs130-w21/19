'use strict';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import crypto from 'crypto';

// have to import using .js extension, a wierd nodejs quirk
import accountRoutes from './src/accountRoutes.js';
import tradingRoutes from './src/tradingRoutes.js';
import portfolioRoutes from './src/portfolioRoutes.js';
import searchRoutes from './src/searchRoutes.js';
import watchlistRoutes from './src/watchlistRoutes.js';
import { initializePg } from './src/db/dbClient.js';
import { initializeSearchEngine } from './src/search/searchEngine.js';
import { truncate } from 'fs';

import cors from 'cors';
import passport from 'passport';
import configurePassport from './src/auth/passportConfig.js';
import passportLocal from 'passport-local';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { pgPool } from './src/db/dbClient.js';

const app = express();

if (process.env.NODE_ENV !== 'stonks-dev') {
  app.use(express.static(path.join('client', 'build')));
}

app.use('/docs', express.static('docs'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
  origin: 'http://localhost:3000', //location of react app // TODO: change.
  credentials: truncate,
}))

/* passport authentication setup */
const secret = crypto.randomBytes(128) + '';
app.use(session({
  secret,
  resave: true,
  saveUninitialized: true
}));

// NOTE: since we are using in-memory session storage, our secret is randomly generated every time.
// This will change if we opt to use anoter storage, e.g. DB.
app.use(cookieParser(secret));

app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);


app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    user: req.user || 'NONE'
  });
});


// register the main routes here.
app.use('/api/accounts', accountRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/watchlist', watchlistRoutes);

const port = process.env.PORT || 8080;

console.log("Initializing pg tables if not exists & search engine...");
Promise.all([initializePg(), initializeSearchEngine()]).then(() => {
  app.listen(port, () => {
    console.log("App listening on port", port);
  });
}).catch((e) => {
  console.error("DB initialization ERROR", e)
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log("SIGINT received - Shutting down server.")
  process.exit(1);

})

process.on('SIGTERM', () => {
  console.log("SIGTERM received - Shutting down server.")
  process.exit(1);
});

export default app;
