import marketPriceFns from '../../src/marketData/marketPrice.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from "sinon-chai";

const PRICE_STALENESS_TTL_SECS = marketPriceFns.PRICE_STALENESS_TTL_SECS;

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);


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
    dbClientStub.query.resolves({ rows: [{last_price: '30.44', secs_since_change }]});

    const price = await marketPriceFns.getMarketPrice(dbClientStub, 'MSFT');

    expect(dbClientStub.query).to.be.calledOnce;
    expect(dbClientStub.query).to.be.calledWith(sinon.match.string, [ 'MSFT']);
    expect(parseFloat(price)).to.equal(30.44);
  });

  it('should call updateMultiplePrices when price stale', async () => {
    sandbox.stub(marketPriceFns, 'updateMultiplePrices').resolves([ 33.33 ]);
    const secs_since_change = `${Math.round(PRICE_STALENESS_TTL_SECS * 2)}`;
    dbClientStub.query.resolves({ rows: [{last_price: '30.44', secs_since_change }]});

    const price = await marketPriceFns.getMarketPrice(dbClientStub, 'MSFT');

    expect(dbClientStub.query).to.be.calledOnce;
    expect(dbClientStub.query).to.be.calledWith(sinon.match.string, ['MSFT']);
    expect(parseFloat(price)).to.equal(33.33);
  });
});
