import { createConnectedClient } from '../../src/db/dbClient.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinonChai from "sinon-chai";
import getMarket from '../../src/marketData/marketPrice.js';
import { addTestTickers, cleanupTestTickers }  from '../utils/testTickers.js';
import { createTestUser, deleteTestUser }  from '../utils/userManagement.js';

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);

const DUMMY_PRICE = 50.40;


/* In this case, we are buying a real stock. We want to see if it works */
const buyStock = async (userObj, ticker, quantity) => {
  await chai.request(app)
    .post('/api/trading/buy')
    .set('Content-Type', 'application/json')
    .set('Cookie', userObj.setCookie)
    .send({ ticker, quantity });
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
