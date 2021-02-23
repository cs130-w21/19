import { createConnectedClient } from '../../src/db/dbClient.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinonChai from "sinon-chai";
import getMarket from '../../src/marketData/marketPrice.js';
import { createTestUser, deleteTestUser }  from '../utils/userManagement.js';

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);

const DUMMY_PRICE = 50.40;

const checkHistory = async (dbClient, userId, trades) => {
  let query ;
  query = "SELECT * FROM Trades WHERE user_id = $1 ORDER BY date_executed ASC;";
  
  const { rows: tradesRows } = await dbClient.query(query, [ userId]);

  expect(tradesRows.length).to.equal(trades.length);
  trades.forEach((trade, i) => {
    const { action, quantity, price, ticker } = trade;
    if (!action || !quantity || !price || !ticker ) {
      throw Error('one of action, quantity, ticker or price is falsy.');
    }
    expect(tradesRows[i].action).to.equal(action)
    expect(tradesRows[i].ticker).to.equal(ticker)
    expect(tradesRows[i].quantity).to.equal(quantity.toString())
    expect(tradesRows[i].unit_price_executed).to.equal(price.toFixed(2).toString());
  });
}

describe('/api/history integration tests', () => {
    const sandbox = sinon.createSandbox();
    let testUserObj;
    let pgClient;
  
    before(async () => {
      pgClient = await createConnectedClient();
    })
  
    beforeEach(async () => {
      sandbox.stub(getMarket, 'getMarketPrice')
        .withArgs(sinon.match.any, 'TEST_TICKER').resolves(DUMMY_PRICE)
      testUserObj = await createTestUser(pgClient, app);

      const r = await chai.request(app)
      .post('/api/trading/buy')
      .set('Content-Type', 'application/json')
      .set('Cookie', testUserObj.setCookie)
      .send({ ticker: 'TEST_TICKER', quantity: 100 });

    });
  
    afterEach(async () => {
      sandbox.restore();
      await deleteTestUser(pgClient, testUserObj.userId);
    });
  
    after(() => {
      pgClient.end();
    });

    it('should not show history of trades if cookie is missing', async () => {
        const res = await chai.request(app)
          .get('/api/history')
          .set('Content-Type', 'application/json')

        expect(res.status).to.equal(401);
        // expect(res.body).to.be.empty;

      });
    
  
    it('should show history of trades', async () => {
        const res = await chai.request(app)
            .get('/api/history')
            .set('Content-Type', 'application/json')
            .set('Cookie', testUserObj.setCookie)
  
        expect(res.status).to.equal(200);
        await checkHistory (pgClient, testUserObj.userId, [
          { action: 'buy', quantity: 100, price: DUMMY_PRICE, ticker: 'TEST_TICKER' },
        ]);
 
    });
  
    
  }); 
