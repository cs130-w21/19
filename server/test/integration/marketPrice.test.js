import marketPriceFns from '../../src/marketData/marketPrice.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from "sinon-chai";
import { createConnectedClient } from '../../src/db/dbClient.js';

const PRICE_STALENESS_TTL_SECS = marketPriceFns.PRICE_STALENESS_TTL_SECS;
// Use real market price from finnhub.

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);

const clearStockUpdates = async (ticker, pgClient) => {
  await pgClient.query(`
    UPDATE tickers SET 
      price_last_changed = NOW() - interval '100 days',
      last_price = null
    WHERE ticker_name = $1
  `, [ ticker]);
}

const checkStockUpdates = async (ticker, pgClient, unixTimeStart, price) => {
  const { rows } = await pgClient.query(`
    SELECT
      extract('epoch' FROM price_last_changed) as last_changed,
      last_price
    FROM tickers
    WHERE ticker_name = $1
  `, [ ticker ]);
  expect(rows.length).to.equal(1);
  expect(rows[0].last_price).to.equal(price);
  expect(parseInt(rows[0].last_changed)).to.be.at.least(unixTimeStart);
};


describe('getMarketPrice integration tests', () => {
  const sandbox = sinon.createSandbox();
  let pgClient;
  before(async () => {
    pgClient = await createConnectedClient();
  });
  after(async () => {
    pgClient.end();
  });
  afterEach(async () => {
    sandbox.restore();
    await clearStockUpdates('PYPL', pgClient);
  });

  it('should return the updated price for a new stock', async () => {
    const currentTime = Math.floor(Date.now()/ 1000);
    const price = await marketPriceFns.getMarketPrice(pgClient, 'PYPL');
    expect(parseFloat(price)).to.be.a('number');
    await checkStockUpdates('PYPL', pgClient, currentTime, price);
  });
});
