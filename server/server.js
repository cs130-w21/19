'use strict';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import crypto from 'crypto';
import { truncate } from 'fs';
import cors from 'cors';
import passport from 'passport';
import passportLocal from 'passport-local';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { fileURLToPath } from 'url';
import axios from 'axios';
import ws from 'ws';

// have to import using .js extension, a wierd nodejs quirk
import accountRoutes from './src/accountRoutes.js';
import tradingRoutes from './src/tradingRoutes.js';
import portfolioRoutes from './src/portfolioRoutes.js';
import searchRoutes from './src/searchRoutes.js';
import watchlistRoutes from './src/watchlistRoutes.js';
import chartingRoutes, { wsSubscribeToTickerHandler, wsUnsubscribeFromTickerHandler } from './src/chartingRoutes.js';
import historyRoutes from './src/historyRoutes.js';
import { initializePg } from './src/db/dbClient.js';
import { FinnhubWsClient } from './src/marketData/finnhub.js';
import { finnhubWsMessageHandler } from './src/marketData/realtimeStream.js';
import { initializeSearchEngine } from './src/search/searchEngine.js';
import configurePassport from './src/auth/passportConfig.js';
import { pgPool } from './src/db/dbClient.js';
import SubscriptionManager from './src/marketData/subscriptionManager.js';
import { schedulePortfolioCron } from './src/portfolio/cron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const wsServer = new ws.Server({ noServer :true, clientTracking: true });

app.use('/docs', express.static(path.join(__dirname, 'docs')));

app.use('/coverage-integration', express.static(path.join(__dirname, 'coverage-integration')));
app.use('/coverage-unit', express.static(path.join(__dirname, 'coverage-unit')));

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
app.use('/api/chart', chartingRoutes);
app.use('/api/history', historyRoutes);

// serve frontend assets if not exists
if (process.env.NODE_ENV !== 'stonks-dev') {
  const frontendBuildPath = path.join(__dirname, '..', 'client', 'build');
  const frontendAssetsRoute = express.static(frontendBuildPath);
  app.use(frontendAssetsRoute);
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

const port = process.env.PORT || 8080;

/* Our websocket server initializations */
wsServer.on('connection', (ws) => {
  SubscriptionManager.registerClient(ws);
  console.log("Client connected. Assigned websocket id:", ws.id);
  ws.on('message', async (msg) => {
    let payload;
    try {
      payload = JSON.parse(msg);
    } catch(e) {
      ws.send("Invalid JSON.");
      return;
    }

    if (payload.event === 'subscribeToTicker') {
      await wsSubscribeToTickerHandler(wsServer, ws, payload);
    } else  if (payload.event === 'unsubscribeFromTicker') {
      await wsUnsubscribeFromTickerHandler(wsServer, ws, payload);
    } else {
      console.log("Invalid event type for msg", payload);
      ws.send("Invalid event type");
    }
  });
  ws.on('close', () => {
    console.log("Client", ws.id,"Unregistered.")
    SubscriptionManager.unregisterClient(ws);
  });
});



console.log("Initializing pg tables if not exists...");
initializePg().then(() => {
  console.log("OK. Initializing search engine & ticker table...");
  initializeSearchEngine().then(() => {
    const server = app.listen(port);
    /* Updating Portfolio Growth Using Cron Job */
    schedulePortfolioCron();
    /* Finnhub Websocket Client listeners */ 
    FinnhubWsClient.addEventListener('message', finnhubWsMessageHandler);

    server.on('upgrade', (req, socket, head) => {
      wsServer.handleUpgrade(req, socket, head, (ws) => {
        wsServer.emit('connection', ws, req);
      });
    });
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

// for testing so that we have everythign set up.
const sleepMs = ms => new Promise(res => setTimeout(res, ms));

export const getAppWhenReady = async () => {
  while(true) {
    // Do an HTTP request.
    try {
      const res = await axios.get(`http://localhost:${port}/api/health`, { timeout: 250 });
      if (res.status === 200) {
        break;
      }
    } catch(e) {
    }
    await sleepMs(250);
  }
  return app;
}
