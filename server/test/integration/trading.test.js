import { createConnectedClient } from '../../src/db/dbClient.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinonChai from "sinon-chai";
import { executeMarketBuyOrder } from '../../src/tradingRoutes.js';
import marketUtils from '../../src/utils/markets.js';
import getMarket from '../../src/marketData/marketPrice.js';
import { createTestUser, deleteTestUser }  from '../utils/userManagement.js';

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);

const DUMMY_PRICE = 10.45;
const DUMMY_PRICE2 = 142.45;
const DUMMY_PRICE3 = 342.45;

const startingBalance = 75000;

/* Helper methods for us to check the trades and portfolioItems tables */
const checkPortfolioItem = async (dbClient, userId, symbol, amountNumber) => {
  const { rows: portfolioRows } = await dbClient.query(`
    SELECT * FROM PortfolioItems
    WHERE user_id = $1 AND symbol = $2;
  `, [ userId, symbol ]);
  expect(portfolioRows.length).to.equal(1);
  // toFixed(2) below is to maintain the 2 decimal points if whole number.
  expect(portfolioRows[0].quantity).to.equal(amountNumber.toFixed(2).toString());
};

const checkPortfolioItemExists = async(dbClient, userId, symbol, exists) => {
  const { rows: portfolioRows } = await dbClient.query(`
    SELECT * FROM PortfolioItems
    WHERE user_id = $1 AND symbol = $2;
  `, [ userId, symbol ]);
  if (exists) {
    expect(portfolioRows.length).to.not.equal(0);
  } else {
    expect(portfolioRows.length).to.equal(0);
  }
};


/* check the trades chronologically, where each object in 'trades' arrray is:
* { 
*   quantity (if sellOnly is true, this is optional)
*   action
*   price
*   ticker
* }
*/ 
const checkTrades = async (dbClient, userId, trades, sellOnly=false) => {
  let query ;
  if (sellOnly) {
    query = "SELECT * FROM Trades WHERE user_id = $1 AND action='sell' ORDER BY date_executed ASC;";
  } else {
    query = "SELECT * FROM Trades WHERE user_id = $1 ORDER BY date_executed ASC;";
  }
  const { rows: tradesRows } = await dbClient.query(query, [ userId]);

  expect(tradesRows.length).to.equal(trades.length);
  trades.forEach((trade, i) => {
    const { action, quantity, price, ticker } = trade;
    if ((!action && !sellOnly) || !quantity || !price || !ticker ) {
      throw Error('one of action, quantity, ticker or price is falsy.');
    }
    expect(tradesRows[i].action).to.equal(action)
    expect(tradesRows[i].ticker).to.equal(ticker)
    expect(tradesRows[i].quantity).to.equal(quantity.toString())
    expect(tradesRows[i].unit_price_executed).to.equal(price.toFixed(2).toString());
  });
}

describe('/api/trading/buy integration tests', () => {
  const sandbox = sinon.createSandbox();
  let testUserObj;
  let pgClient;

  before(async () => {
    pgClient = await createConnectedClient();
  })

  beforeEach(async () => {
    sandbox.stub(marketUtils, "checkMarketOpen").returns(true);
    sandbox.stub(getMarket, 'getMarketPrice')
      .withArgs(sinon.match.any, 'TEST_TICKER').resolves(DUMMY_PRICE)
      .withArgs(sinon.match.any, 'TEST_TICKER2').resolves(DUMMY_PRICE2);

    testUserObj = await createTestUser(pgClient, app);// username test_user.
  });

  afterEach(async () => {
    sandbox.restore();
    await deleteTestUser(pgClient, testUserObj.userId);
  });

  after(() => {
    pgClient.end();
  });

  it('should be auth-protected', async () => {
    const res = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .send({ ticker: 'TEST_TICKER', quantity: 100 });
    expect(res.status).to.equal(401);
    expect(res.body).to.deep.equal({
      success: false,
      errorMessage: 'Not Authorized / Session expired. Please login.',
    });
  });


  it('should update tables accordingly after a successful buy order', async () => {
    const res = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 100 });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ message: 'order filled', success: true, executedPrice: DUMMY_PRICE });

    await checkTrades (pgClient, testUserObj.userId, [
      { action: 'buy', quantity: 100, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
    ]);

    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER', 100);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', startingBalance - DUMMY_PRICE * 100);
  });

  it('should update same portfolioitem row for same stock when purchased more than once', async () => {
    const res1 = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 100 });

    const res2 = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 199 });

    [res1, res2].forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ message: 'order filled', success: true, executedPrice: DUMMY_PRICE });
    });

    await checkTrades (pgClient, testUserObj.userId, [
      { action: 'buy', quantity: 100, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
      { action: 'buy', quantity: 199, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
    ]);

    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER', 299);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', startingBalance - DUMMY_PRICE * 299);
  });

  it('should update tables correctly when multiple stocks purchased', async () => {
    const res1 = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 1000 });

    const res2 = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER2', quantity: 400 });

    [res1, res2].forEach((res, i) => {
      expect(res.body).to.deep.equal({ message: 'order filled', success: true, executedPrice: [DUMMY_PRICE, DUMMY_PRICE2][i] });
      expect(res.status).to.equal(200);
    });

    await checkTrades (pgClient, testUserObj.userId, [
      { action: 'buy', quantity: 1000, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
      { action: 'buy', quantity: 400, price: DUMMY_PRICE2, ticker: 'TEST_TICKER2' },
    ]);

    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER', 1000);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER2', 400);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', startingBalance - DUMMY_PRICE2 * 400 - DUMMY_PRICE * 1000);
  });

  it('should not execute trade if buying more stock than what can be afforded.', async () => {
    assert(DUMMY_PRICE * 50000 > startingBalance);

    const res = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 50000 });


    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ 
      errorMessage: 'not enough money to buy requested amount of shares.',
      success: false,
    });

    await checkTrades (pgClient, testUserObj.userId, []);

    await checkPortfolioItemExists(pgClient, testUserObj.userId, 'TEST_TICKER', false);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', startingBalance);
  });

  it('should not be able to buy USD (not a stock) ', async () => {
    const res = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'USD', quantity: 10000000 }); // i'm gna get rich!!
    expect(res.status).to.equal(400);

    expect(res.body).to.deep.equal({
      errorMessage: 'ticker cannot be a currency.',
      success: false,
    });
  });


  it('should not execute trade when negative quantity entered', async () => {
    const res = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: -100 });


    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ 
      errorMessage: 'quantity body field not a valid positive integer',
      success: false,
    });

    await checkTrades (pgClient, testUserObj.userId, []);

    await checkPortfolioItemExists(pgClient, testUserObj.userId, 'TEST_TICKER', false);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', startingBalance);
  });

  it('should not execute trade when zero quantity entered', async () => {
    const res = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 0 });


    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ 
      errorMessage: 'quantity body field not a valid positive integer',
      success: false,
    });

    await checkTrades (pgClient, testUserObj.userId, []);

    await checkPortfolioItemExists(pgClient, testUserObj.userId, 'TEST_TICKER', false);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', startingBalance);
  });
});


describe('/api/trading/sell integration tests', () => {
  const sandbox = sinon.createSandbox();
  let testUserObj;
  let pgClient;
  let currentUsdBalance;

  before(async () => {
    pgClient = await createConnectedClient();
  })

  beforeEach(async () => {
    sandbox.stub(marketUtils, "checkMarketOpen").returns(true);
    sandbox.stub(getMarket, 'getMarketPrice')
      .withArgs(sinon.match.any, 'TEST_TICKER').resolves(DUMMY_PRICE)
      .withArgs(sinon.match.any, 'TEST_TICKER2').resolves(DUMMY_PRICE2)
      .withArgs(sinon.match.any, 'TEST_TICKER3').resolves(DUMMY_PRICE3);

    testUserObj = await createTestUser(pgClient, app);// username test_user, gives 100k usd to this user.

    const r = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 100 });

    const r2 = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER2', quantity: 100 });

    currentUsdBalance = startingBalance - 100 * (DUMMY_PRICE + DUMMY_PRICE2);
  });

  afterEach(async () => {
    sandbox.restore();
    await deleteTestUser(pgClient, testUserObj.userId);
  });

  after(() => {
    pgClient.end();
  });

  it('should be auth-protected', async () => {
    const res = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .send({ ticker: 'TEST_TICKER', quantity: 100 });
    expect(res.status).to.equal(401);
    expect(res.body).to.deep.equal({
      success: false,
      errorMessage: 'Not Authorized / Session expired. Please login.',
    });
  });

  it('should update tables accordingly after a successful sell order', async () => {
    const res = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 20 });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ message: 'order filled', success: true, executedPrice: DUMMY_PRICE });

    await checkTrades(pgClient, testUserObj.userId, [
      { action: 'sell', quantity: 20, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
    ], true);

    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER', 100 - 20);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', currentUsdBalance + DUMMY_PRICE * 20);
  });

  it('should update same portfolioitem row for same stock when sold more than once', async () => {
    const res1 = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 10 });

    const res2 = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 25 });

    [res1, res2].forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ message: 'order filled', success: true, executedPrice: DUMMY_PRICE });
    });

    await checkTrades(pgClient, testUserObj.userId, [
      { action: 'sell', quantity: 10, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
      { action: 'sell', quantity: 25, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
    ], true);

    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER', 100 - 10 - 25);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', currentUsdBalance + DUMMY_PRICE * (10 + 25));
  });

  it('should update tables correctly when multiple stocks sold', async () => {
    const res1 = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 25 });

    const res2 = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER2', quantity: 50 });

    [res1, res2].forEach((res, i) => {
      expect(res.body).to.deep.equal({ message: 'order filled', success: true, executedPrice: [DUMMY_PRICE, DUMMY_PRICE2][i] });
      expect(res.status).to.equal(200);
    });

    await checkTrades (pgClient, testUserObj.userId, [
      { action: 'sell', quantity: 25, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
      { action: 'sell', quantity: 50, price: DUMMY_PRICE2, ticker: 'TEST_TICKER2' },
    ], true);

    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER', 100 - 25);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER2', 100 - 50);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', currentUsdBalance + DUMMY_PRICE2 * 50 + DUMMY_PRICE * 25);
  });

  it('should not execute trade if selling more stock than owned.', async () => {
    const res = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 200 });


    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ 
      success: false,
      errorMessage: 'Not enough stock to sell / not owned.',
    });

    await checkTrades (pgClient, testUserObj.userId, [], true);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'TEST_TICKER', 100);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', currentUsdBalance);
  });

  it('should not execute trade if selling stock not owned.', async () => {
    const res = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER3', quantity: 200 });


    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ 
      success: false,
      errorMessage: 'Not enough stock to sell / not owned.',
    });

    await checkTrades (pgClient, testUserObj.userId, [], true);
    await checkPortfolioItemExists(pgClient, testUserObj.userId, 'TEST_TICKER3', false);
    await checkPortfolioItem(pgClient, testUserObj.userId, 'USD', currentUsdBalance);
  });

  it('should not be able to sell USD (not a stock) ', async () => {
    const res = await chai.request(app)
      .post('/api/trading/sell')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'USD', quantity: 100000000 }); // i'm gna be poor!
    expect(res.status).to.equal(400);

    expect(res.body).to.deep.equal({
      errorMessage: 'ticker cannot be a currency.',
      success: false,
    });
  });
});
