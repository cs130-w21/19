import { pgPool } from '../../src/db/dbClient.js';
import sinon from 'sinon';
import chai from 'chai';
import sinonChai from "sinon-chai";
import { executeMarketSellOrder , executeMarketBuyOrder } from '../../src/tradingRoutes.js';
import marketUtils from '../../src/utils/markets.js';
import getMarket from '../../src/marketData/marketPrice.js';

const expect = chai.expect;
chai.use(sinonChai);

describe('/api/trading/buy executeMarketBuyOrder unit tests', () => {
  const sandbox = sinon.createSandbox();
  let dbClientMock;
  beforeEach(() => {
    sandbox.stub(marketUtils, "checkMarketOpen").returns(true);
    dbClientMock = {
      query: sandbox.stub().resolves({}),
      release: sandbox.stub(),
    };
    sandbox.stub(pgPool, 'connect').resolves(dbClientMock);
    sandbox.stub(getMarket, 'getMarketPrice').resolves(10.40);
  });

  afterEach(() => {
    sandbox.restore();
  })


  it('should fill a buy market order when enough money', async function () {
    dbClientMock.query
      .onCall(0).resolves() // BEGIN
      .onCall(1).resolves({ rows: [ { quantity: 100000 }]}) // query money in portfolio
      .onCall(2).resolves({ rows: [ ], rowCount: 1})  //inserted trade
      .onCall(3).resolves({ rows: [ ], rowCount: 1}) // insert new stock to portfolio
      .onCall(4).resolves({ rows: [ ], rowCount: 1}) // update money in portfolio
      .onCall(5).resolves() // COMMIT

    const res = await executeMarketBuyOrder('myuser_id_in_uuid', 'TEST_TICKER', 40);
    expect(dbClientMock.query).to.be.callCount(6);
    expect(dbClientMock.query).to.be.calledWith('BEGIN');
    expect(dbClientMock.query).to.be.calledWith('COMMIT');
    expect(dbClientMock.query).to.not. be.calledWith('ROLLBACK');
    expect(dbClientMock.release).to.be.calledOnce;
    expect(res).to.deep.equal({ status: 200 });
  });

  it('should not fill a market order when not enough money', async function () {
    dbClientMock.query
      .onCall(0).resolves() // BEGIN
      .onCall(1).resolves({ rows: [ { quantity: 0.10 /* USD */ }]}) // query money in portfolio 

    const res = await executeMarketBuyOrder('myuser_id_in_uuid', 'AAPL', 40);
    expect(dbClientMock.query).to.be.callCount(3);
    expect(dbClientMock.query).to.be.calledWith('BEGIN');
    expect(dbClientMock.query).to.not.be.calledWith('COMMIT');
    expect(dbClientMock.query).to.be.calledWith('ROLLBACK');
    expect(dbClientMock.release).to.be.calledOnce;
    expect(res).to.deep.equal({ status: 400, errorMessage: 'not enough money to buy requested amount of shares.' });
  });
});


describe('/api/trading/sell executeMarketSellOrder unit tests', () => {
  const sandbox = sinon.createSandbox();
  let dbClientMock;
  beforeEach(() => {
    sandbox.stub(marketUtils, "checkMarketOpen").returns(true);
    dbClientMock = {
    query: sandbox.stub().resolves({}),
      release: sandbox.stub(),
    };
    sandbox.stub(pgPool, 'connect').resolves(dbClientMock);
    sandbox.stub(getMarket, 'getMarketPrice').resolves(10.40);
  });

  afterEach(() => {
    sandbox.restore();
  })

  it('should fill a sell market order when enough stock quantity', async function () {
    dbClientMock.query
      .onCall(0).resolves() // BEGIN
      .onCall(1).resolves({ rows: [ { quantity: 100 }]}) // query stock quantity 
      .onCall(2).resolves({ rows: [ ], rowCount: 1})  //inserted trade
      .onCall(3).resolves({ rows: [ ], rowCount: 1}) // update stock to portfolio
      .onCall(4).resolves({ rows: [ ], rowCount: 1}) // update remaining money in portfolio
      .onCall(5).resolves() // COMMIT

    const res = await executeMarketSellOrder('myuser_id_in_uuid', 'TEST_TICKER', 70);
    expect(dbClientMock.query).to.be.callCount(6);
    expect(dbClientMock.query).to.be.calledWith('BEGIN');
    expect(dbClientMock.query).to.be.calledWith('COMMIT');
    expect(dbClientMock.query).to.not. be.calledWith('ROLLBACK');
    expect(dbClientMock.release).to.be.calledOnce;
    expect(res).to.deep.equal({ status: 200 });
  });

  it('should not fill a sell market order when not enough stock quantity', async function () {
    dbClientMock.query
      .onCall(0).resolves() // BEGIN
      .onCall(1).resolves({ rows: [ ]}) // query stock qty in portfolio. But in this case, no rows since not meeting qty.
      .onCall(2).resolves() // ROLLBACK

    const res = await executeMarketSellOrder('myuser_id_in_uuid', 'AAPL', 40);
    expect(dbClientMock.query).to.be.callCount(3);
    expect(dbClientMock.query).to.be.calledWith('BEGIN');
    expect(dbClientMock.query).to.not.be.calledWith('COMMIT');
    expect(dbClientMock.query).to.be.calledWith('ROLLBACK');
    expect(dbClientMock.release).to.be.calledOnce;
    expect(res).to.deep.equal({ status: 400, errorMessage: 'Not enough stock to sell / not owned.' });
  });

  it('should delete the stock in portfolioItem if all stocks sold.', async function () {
    dbClientMock.query
      .onCall(0).resolves() // BEGIN
      .onCall(1).resolves({ rows: [ { quantity: 1000 }]}) // query stock quantity 
      .onCall(2).resolves({ rows: [ ], rowCount: 1})  //inserted trade
      .onCall(3).resolves({ rows: [ ], rowCount: 1}) // update stock to portfolio
      .onCall(4).resolves({ rows: [ ], rowCount: 1}) // update remaining money in portfolio
      .onCall(5).resolves({ rows: [ ], rowCount: 1}) // DELETE dangling stock in portfolio
      .onCall(6).resolves() // COMMIT

    const res = await executeMarketSellOrder('myuser_id_in_uuid', 'TEST_TICKER', 1000);
    expect(dbClientMock.query).to.be.callCount(7);
    expect(dbClientMock.query).to.be.calledWith('BEGIN');
    expect(dbClientMock.query).to.be.calledWith('COMMIT');
    expect(dbClientMock.query).to.not.be.calledWith('ROLLBACK');
    expect(dbClientMock.release).to.be.calledOnce;
    expect(res).to.deep.equal({ status: 200 });
  });

  it('should return status 500 with appropriate errorMessage if dbClient errors.', async function () {
    dbClientMock.query
      .onCall(0).resolves() // BEGIN
      .onCall(1).throws(Error("sample error in test")) // random db error
      .onCall(2).resolves() // ROLLBACK

    const res = await executeMarketSellOrder('myuser_id_in_uuid', 'TEST_TICKER', 1000);
    expect(dbClientMock.query).to.be.callCount(3);
    expect(dbClientMock.query).to.be.calledWith('BEGIN');
    expect(dbClientMock.query).to.be.calledWith('ROLLBACK');
    expect(dbClientMock.query).to.not.be.calledWith('COMMIT');
    expect(dbClientMock.release).to.be.calledOnce;
    expect(res).to.deep.equal({ 
      status: 500,
      errorMessage: 'We could not process your trade. Please try again later',
    });
    
  });

});
