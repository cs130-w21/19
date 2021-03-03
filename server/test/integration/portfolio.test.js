import { createConnectedClient } from '../../src/db/dbClient.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinonChai from "sinon-chai";
import { updatePortfolioValues } from '../../src/portfolio/portfolio.js';
import { addTestTickers, cleanupTestTickers }  from '../utils/testTickers.js';
import { createTestUser, deleteTestUser }  from '../utils/userManagement.js';

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);

const startingBalance =  75000;

/* In this case, we are buying a real stock. We want to see if it works */
/* Returns the actual executed price */
const buyStock = async (userObj, ticker, quantity) => {
  const res = await chai.request(app)
    .post('/api/trading/buy')
    .set('Content-Type', 'application/json')
    .set('Cookie', userObj.setCookie)
    .send({ ticker, quantity });
  if (res.status !== 200) {
    throw new Error("Error buyStock()", res.body);
  }
  return res.body.executedPrice;
};

describe('/api/portfolio integration tests', () => {
  let stocks = [];
  const sandbox = sinon.createSandbox();
  let testUserObj;
  let pgClient;

  before(async () => {
    pgClient = await createConnectedClient();
    await addTestTickers(pgClient);
  })

  beforeEach(async () => {
    testUserObj = await createTestUser(pgClient, app);

    // Bullish investor!
    stocks = ['PLTR', 'TSLA', 'GME', 'DDOG', 'ADBE' ];
    await buyStock(testUserObj, 'PLTR', 3);
    await buyStock(testUserObj, 'TSLA', 1);
    await buyStock(testUserObj, 'GME', 10);
    await buyStock(testUserObj, 'DDOG', 10);
    await buyStock(testUserObj, 'ADBE', 10);
  });

  afterEach(async () => {
    sandbox.restore();
    await deleteTestUser(pgClient, testUserObj.userId);
  });

  after(async () => {
    await cleanupTestTickers(pgClient);
    pgClient.end();
  });

  it('should get portfolio items with non-null price', async () => {
    const res = await chai.request(app)
      .get('/api/portfolio')
      .set('Cookie', testUserObj.setCookie)
      .set('Content-Type', 'application/json')

    expect(res.status).to.equal(200);

    const includedStocks = [];
    res.body.portfolioItems.forEach((item) => {
      expect(item.item_id).to.be.a("string");
      expect(item.date_changed).to.be.a("string");
      expect(item.date_created).to.be.a("string");
      expect(item.quantity).to.be.a("string");
      expect(item.price_per_share).to.be.a("string");

      if (item.symbol !== 'USD') {
        assert(stocks.includes(item.symbol));
        if (!includedStocks.includes(item.symbol)) {
          includedStocks.push(item.symbol);
        }
      }
      expect(item.was_stale).to.equal(false);
    });

    assert(includedStocks.length === stocks.length);
  });
}); 
describe('/api/portfolio/growth & cron job integration tests', () => {
  const sandbox = sinon.createSandbox();
  let testUserObj;
  let testUserObj2;
  let pgClient;

  before(async () => {
    pgClient = await createConnectedClient();
  })

  beforeEach(async () => {
    testUserObj = await createTestUser(pgClient, app);
    testUserObj2 = await createTestUser(pgClient, app, '2'); // add suffix '2' to differentiate between test users.
    await buyStock(testUserObj, 'PLTR', 5);
    await buyStock(testUserObj, 'TSLA', 5);
    await buyStock(testUserObj, 'GME',  5);
    await buyStock(testUserObj, 'DDOG', 5);
    await buyStock(testUserObj, 'ADBE', 5);

    await buyStock(testUserObj2, 'PLTR', 5);
    await buyStock(testUserObj2, 'TSLA', 5);
    await buyStock(testUserObj2, 'GME',  5);
    await buyStock(testUserObj2, 'DDOG', 5);
    await buyStock(testUserObj2, 'ADBE', 5);
  });

  afterEach(async () => {
    sandbox.restore();
    await deleteTestUser(pgClient, testUserObj.userId);
    await deleteTestUser(pgClient, testUserObj2.userId);
  });

  after(async () => {
    await cleanupTestTickers(pgClient);
    pgClient.end();
  });

  it('should register the correct sum in the DB ', async () => {
    await updatePortfolioValues(pgClient);
    const { rows } = await pgClient.query(`
      SELECT * FROM PortfolioGrowth;
    `);
    expect(rows.length).to.equal(2); // we only want 2 so far, since this method is run once for each user (2 users).
    // sum should still be the same as starting balance.
    expect(Number(rows[0].total_value)).to.equal(startingBalance);
    expect(Number(rows[1].total_value)).to.equal(startingBalance);
    expect(rows[1].user_id).to.not.equal(rows[0].user_id);
    if(rows[0].user_id === testUserObj.userId) {
      expect(rows[1].user_id).to.equal(testUserObj2.userId);
    } else if(rows[0].user_id === testUserObj2.userId) {
      expect(rows[1].user_id).to.equal(testUserObj.userId);
    } else {
      throw new Error("user_id wrong in rows");
      assert(1==2);
    }
  });
  it('route should work correctly', async () => {
    await updatePortfolioValues(pgClient);
    const res = await chai.request(app)
      .get('/api/portfolio/growth')
      .set('Cookie', testUserObj.setCookie)
      .set('Content-Type', 'application/json')
    const { portfolioGrowth } = res.body;
    expect(portfolioGrowth.length).to.equal(1); // we only want 1 so far, since this is for this userId.
    expect(portfolioGrowth[0].user_id).to.equal(testUserObj.userId);
    expect(Number(portfolioGrowth[0].total_value)).to.equal(startingBalance);
  });
});

