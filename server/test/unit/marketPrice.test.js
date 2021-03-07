import marketPriceFns from '../../src/marketData/marketPrice.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from "sinon-chai";
import chaiArrays from 'chai-arrays';

const PRICE_STALENESS_TTL_SECS = marketPriceFns.PRICE_STALENESS_TTL_SECS;

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);
chai.use(chaiArrays);

describe('getMarketPrice unit tests', () => {
  const sandbox = sinon.createSandbox();
  let dbClientStub;
  beforeEach(() => {
    dbClientStub = {
      query: sandbox.stub(),
    };
  });
  afterEach(() => {
    sandbox.restore();
  });

  it('should return the price when not stale', async () => {
    const secs_since_change = `${Math.round(PRICE_STALENESS_TTL_SECS / 2)}`;
    dbClientStub.query.resolves({ rows: [{ last_price: '30.44', secs_since_change }] });
    const price = await marketPriceFns.getMarketPrice(dbClientStub, 'MSFT');
    expect(dbClientStub.query).to.be.calledOnce;
    expect(dbClientStub.query).to.be.calledWith(sinon.match.string, ['MSFT']);
    expect(parseFloat(price)).to.equal(30.44);
  });

  it('should throw exception when ticker is not found', async () => {
    const secs_since_change = `${Math.round(PRICE_STALENESS_TTL_SECS / 2)}`;
    dbClientStub.query.resolves({ rows: [] });
    try {
      await marketPriceFns.getMarketPrice(dbClientStub, 'MSFT_NO_EXIST');
    } catch (error) {
      assert.equal(error.message, `ticker MSFT_NO_EXIST not found in table`);
      expect(dbClientStub.query).to.be.calledOnce;
      expect(dbClientStub.query).to.be.calledWith(sinon.match.string, ['MSFT_NO_EXIST']);
      return;
    }
    assert(false); // Should not be called
  });

  it('should call updateMultiplePrices when price stale', async () => {
    sandbox.stub(marketPriceFns, 'updateMultiplePrices').resolves([33.33]);
    const secs_since_change = `${Math.round(PRICE_STALENESS_TTL_SECS * 2)}`;
    dbClientStub.query.resolves({ rows: [{ last_price: '30.44', secs_since_change }] });
    const price = await marketPriceFns.getMarketPrice(dbClientStub, 'MSFT');
    expect(dbClientStub.query).to.be.calledOnce;
    expect(dbClientStub.query).to.be.calledWith(sinon.match.string, ['MSFT']);
    expect(parseFloat(price)).to.equal(33.33);
  });

  it('updateMultiplePrices should return empty [] when no tickers are passed in', async () => {
    const price = await marketPriceFns.updateMultiplePrices(dbClientStub, []);
    expect(dbClientStub.query).to.not.be.called;
    expect(price).to.be.ofSize(0);
  });

  it('updateMultiplePrices should return multiple prices when multiple tickers are passed in', async () => {
    dbClientStub.query.resolves({ rowCount: 2 });
    await marketPriceFns.updateMultiplePrices(dbClientStub, ['MSFT', 'FB']);
    expect(dbClientStub.query).to.be.calledOnce;
  });

  it('updateMultiplePrices should error if more/less prices are returned by DB than the number of tickers passed in', async () => {
    dbClientStub.query.resolves({ rowCount: 3 });
    const tickerNames = ['MSFT', 'FB'];
    try {
      await marketPriceFns.updateMultiplePrices(dbClientStub, tickerNames);
    } catch (error) {
      assert.equal(error.message, `ERROR updating database for ${tickerNames} new price in tickers table. 3 !== ${tickerNames.length} tickers`);
      expect(dbClientStub.query).to.be.calledOnce;
      return;
    }
    assert(false); // Should not be called
  });
});
