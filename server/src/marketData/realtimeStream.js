import { pgPool } from '../db/dbClient.js';
import SubscriptionManager from './subscriptionManager.js';
import gaussian from 'gaussian';
import { FinnhubWsClient } from './finnhub.js';
import ws from 'ws';
import pgFormat from 'pg-format';
import marketPriceFns from './marketPrice.js';


const reduceUpdates = (updates) => {
  // TODO: need to test this.
  /* There may be multiple updates for the same stock.e.g. MSFT, AAPL, so we reduce them here.
   *
   * Get the last price (p), the last timestamp (t) and the sum of all volumes (v)
   */
  const tickerMap = {};

  updates.forEach((update) => {
    if (!tickerMap[update.s]) {
      tickerMap[update.s] = update;
    } else {
      if (tickerMap[update.s].t < update.t) {
        tickerMap[update.s].t = update.t;
        tickerMap[update.s].p = update.p;
      }
      tickerMap[update.s].v += update.v;
    }
  });
  return Object.values(tickerMap);
}

/* handler function that is called whenever finnhub sends data to us (the server). */
export const finnhubWsMessageHandler = async ({ data: payloadString }, updatePrices=true) => {
  const payload = JSON.parse(payloadString);

  if (payload.type === 'trade') {
    const { data: updates } = payload;

    // First, update the database in one batch update. Better to do it this way than
    // when having series of statements.
    // see here: https://stackoverflow.com/questions/1006969/why-are-batch-inserts-updates-faster-how-do-batch-updates-work/1007006#1007006

    const reducedUpdates = reduceUpdates(updates);

    if (updatePrices) {
      const rowsToAdd = reducedUpdates.map((update) => [update.s, update.p, Math.round(update.t / 1000)]);
      // pgFormat converts everything to string. So we have to cast last_price back to numeric
      // NOTE: can we make this into its own function?
      await pgPool.query(pgFormat(`
      UPDATE tickers
      SET last_price = vals.last_price::DECIMAL(12,2), price_last_changed = to_timestamp(vals.timestamp::bigint) AT TIME ZONE 'UTC'
      FROM ( VALUES %L) AS vals(ticker_name, last_price, timestamp)
      WHERE tickers.ticker_name = vals.ticker_name;`, rowsToAdd)
      );
    }
    reducedUpdates.forEach((update) => {
      const { s: ticker, p: price, t: timestampMillis, v: volume } = update;
      const clients = SubscriptionManager.getSubscribedClients(ticker);
      clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify({
            price,
            volume,
            ticker,
            event: "tickerPriceUpdate",
            timestamp: Math.round(timestampMillis/1000),
          }));
        }
      });
    });
  } else if (payload.type === 'ping') {
    console.log("Received ping from finnhub. Sending pong..");
    FinnhubWsClient.pong('Pong');
  } else {
    console.error("Unrecognized finnhub WS type:", payload);
  }
};


/**
 * method that we use to simulate stock updates during weekends.
 * This is because market data changes don't happen at weekends.
 */
const generateFakeStockUpdates = async () => {
  const pgClient = await pgPool.connect();
  const tickers = SubscriptionManager.getAllSubscribedTickers();
  // get all prices for this.
  const prices = await Promise.all(tickers.map((ticker) => marketPriceFns.getMarketPrice(pgClient, ticker)));

  // model with a normal distribution.
  const fakeUpdates = prices.map((price, i) => {
    const p = parseFloat(price);
    const variance = (p * 0.004) ** 2;
    const gaussDistr = gaussian(0, variance);
    return {
      s: tickers[i],
      p: p + gaussDistr.random(1)[0],
      t: Date.now(),
      v: 10000 + (Math.random() * 250),
    }
  });

  pgClient.release();
  return JSON.stringify({
    type: 'trade',
    data: fakeUpdates,
  });
}

setInterval(async () => {
  if(process.env.NODE_ENV !== 'production') {
    const fakeStockUpdates = await generateFakeStockUpdates();
    await finnhubWsMessageHandler({ data: fakeStockUpdates }, false);
  }
}, 3500);
