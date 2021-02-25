import express from 'express';
import authMiddleware from './auth/authMiddleware.js';
import { getHistoricalData } from './marketData/finnhub.js';
import SubscriptionManager from './marketData/subscriptionManager.js';
import { pgPool } from './db/dbClient.js';


const router = express.Router();

/**
 * @api {get} /api/chart Get historical OHLC data
 * @apiDescription get historical OHLC data. Each data point i has its OHLC data in opens[i], highs[i], lows[i], closes[i] and volume data in volumes[i].
 * @apiPermission none
 * @apiGroup charting
 * @apiParam (Query param) {Number} from unix timestamp (in seconds)
 * @apiParam (Query param) {Number} to unix timestamp (in seconds) (optional - If not specified, uses current time).
 * @apiParam (Query param) {String} ticker ticker (capitalized) to get.
 * @apiParam (Query param) {String} resolution resolution of each datapoint. one of '1', '5', '30', '60', 'D', 'W', 'M'. 1/5/30/60 are in minutes.
 * @apiSuccess {Boolean} hasData if there are any datapoints or not.
 * @apiSuccess {Number} opens[i] open data for datapoint i.
 * @apiSuccess {Number} highs[i] high for datapoint i.
 * @apiSuccess {Number} lows[i] time for datapoint i.
 * @apiSuccess {Number} closes[i] close for datapoint i.
 * @apiSuccess {Number} timestamps[i] timestamp for datapoint i.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
  "closes": [
    217.68,
    221.03,
    219.89
  ],
  "highs": [
    222.49,
    221.5,
    220.94
  ],
  "lows": [
    217.19,
    217.1402,
    218.83
  ],
  "opens": [
    221.03,
    218.55,
    220
  ],
  "hasData": "ok",
  "timestamps": [
    1569297600,
    1569384000,
    1569470400
  ],
  "volumes": [
    33463820,
    24018876,
    20730608
  ]
}
 */
router.get('/', async (req, res) => {
  const { from, to, resolution, ticker } = req.query;
  if (!from || !resolution || !ticker) {
    return res.status(400).json({
      errorMessage: 'Missing query string parameters',
      success: false,
    });
  }
  const data = await getHistoricalData(ticker, resolution, from, to || Math.round(Date.now() / 1000));
  res.status(200).json(data);
});

/**
 * @api {WebSocket} event:"subscribeToTicker" subscribe to ticker price updates
 * @apiDescription subscribe to realtime price updates for a ticker.
 * @apiPermission none
 * @apiGroup charting
 * @apiParam (Websocket request body) {String} event "subscribeToTicker"
 * @apiParam (Websocket request body) {String} ticker Stock ticker in caps lock.
 * @apiExample WS request body example:
 * {
 *   "event": "subscribeToTicker",
 *   "ticker": "MSFT",
 * }
 *
 *
 *
 * @apiSuccess (Websocket Response) {String} event "tickerPriceUpdate"
 * @apiSuccess (Websocket Response) {String} ticker ticker that is updated.
 * @apiSuccess (Websocket Response) {Number} price updated price.
 * @apiSuccess (Websocket Response) {Number} volume updated volume.
 * @apiSuccess (Websocket Response) {Number} timestamp time of update (unix time in seconds)
 * @apiSuccessExample (json) Success-Response:
 * Sample update messages sent from server:
 * {
 *   "event": "tickerPriceUpdate",
 *   "timestamp": 1613411273,
 *   "price": 200.43,
 *   "volume": 1000
 * }
 */
const wsSubscribeToTickerHandler = async (wss, ws, payload) => {
  const { ticker } = payload;
  if (!ticker) {
    ws.send(JSON.stringify({
      success: false,
      errorMessage: 'missing ticker.',
    }));
    return;
  }
  const { rowCount, rows } = await pgPool.query('SELECT 1 FROM tickers WHERE ticker_name = $1',[ ticker ]);
  if (rowCount === 1) {
    if (SubscriptionManager.getSubscriptions(ws).includes(ticker)) {
      ws.send(JSON.stringify({
        success: false,
        errorMessage: 'ticker already subscribed.',
      }));
      return;
    }
    SubscriptionManager.addSubscription(ws, ticker);
    ws.send(JSON.stringify({ success: true }));
  } else {
    ws.send(JSON.stringify({ 
      success: false,
      errorMessage: 'ticker not recognized',
    }));
  }
};

/**
 * @api {WebSocket} event:"unsubscribeFromTicker" unsubscribe to ticker price updates
 * @apiDescription unsubscribe to stop realtime price updates for a ticker.
 * @apiParam (Websocket request body) {String} event "subscribeToTicker"
 * @apiParam (Websocket request body) {String} ticker Stock ticker in caps lock.
 * @apiExample WS request body example:
 * {
 *   "event": "unsubscribeFromTicker",
 *   "ticker": "MSFT",
 * }
 *
 *
 * @apiPermission none
 * @apiGroup charting
 */
const wsUnsubscribeFromTickerHandler = async (wss, ws, payload) => {
  const { ticker } = payload;
  const { rowCount, rows } = await pgPool.query('SELECT 1 FROM tickers WHERE ticker_name = $1',[ ticker ]);
  if (rowCount === 1) {
    if (! SubscriptionManager.getSubscriptions(ws).includes(ticker)) {
      ws.send(JSON.stringify({ 
        success: false,
        errorMessage: 'ticker not subscribed.',
      }));
      return;
    }
    SubscriptionManager.removeSubscription(ws, ticker);
    ws.send(JSON.stringify({ success: true }));
  } else {
    ws.send(JSON.stringify({
      success: false,
      errorMessage: 'ticker not recognized',
    }));
  }
};

export default router;
export { wsSubscribeToTickerHandler, wsUnsubscribeFromTickerHandler };
