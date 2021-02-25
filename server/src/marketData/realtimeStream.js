import { pgPool } from '../db/dbClient.js';
import SubscriptionManager from './subscriptionManager.js';
import { FinnhubWsClient } from './finnhub.js';
import ws from 'ws';
import pgFormat from 'pg-format';


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
export const finnhubWsMessageHandler = async ({ data: payloadString }) => {
  const payload = JSON.parse(payloadString);

  if (payload.type === 'trade') {
    const { data: updates } = payload;

    // First, update the database in one batch update. Better to do it this way than
    // when having series of statements.
    // see here: https://stackoverflow.com/questions/1006969/why-are-batch-inserts-updates-faster-how-do-batch-updates-work/1007006#1007006

    // TODO: There might be a postgres deadlock problem here. WHY?
    const reducedUpdates = reduceUpdates(updates);

    const rowsToAdd = reducedUpdates.map((update) => [update.s, update.p, Math.round(update.t / 1000)]);
    // pgFormat converts everything to string. So we have to cast last_price back to numeric
    // NOTE: can we make this into its own function?
    await pgPool.query(pgFormat(`
      UPDATE tickers
      SET last_price = vals.last_price::DECIMAL(12,2), price_last_changed = to_timestamp(vals.timestamp::bigint) AT TIME ZONE 'UTC'
      FROM ( VALUES %L) AS vals(ticker_name, last_price, timestamp)
      WHERE tickers.ticker_name = vals.ticker_name;`, rowsToAdd)
    );
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
            timestamp: timestampMillis/1000,
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
