import marketPriceFns from '../../src/marketData/marketPrice.js';
import { getUpdatedPortfolio } from '../../src/portfolio/portfolio.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from "sinon-chai";


const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);


describe('getUpdatedPortfolio unit tests', () => {
  const userId = '123124124';
  const sandbox = sinon.createSandbox();
  let dbClientStub;
  let updatePricesStub;
  beforeEach(() => {
    dbClientStub = {
      query: sandbox.stub(),
    };
  });
  afterEach(() => {
    sandbox.restore();
  });

  it('should return all rows including USD (no stales)', async () => {
    updatePricesStub = sandbox.stub(marketPriceFns, "updateMultiplePrices").resolves([]);
    const rows = [
      { item_id: '1', date_created: 'd', date_changed: 'd', symbol: 'MSFT', quantity: '100', price_per_share: '200.02', was_stale: false },
      { item_id: '2', date_created: 'd', date_changed: 'd', symbol: 'USD', quantity: '100000', price_per_share: '1', was_stale: false },
      { item_id: '3', date_created: 'd', date_changed: 'd', symbol: 'PLTR', quantity: '100', price_per_share: '60.02', was_stale: false },
    ];
    dbClientStub.query.resolves({ rows });
    const portfolioItems = await getUpdatedPortfolio(dbClientStub, userId);
    expect(portfolioItems).to.deep.equal(rows);
    expect(updatePricesStub).to.not.be.called;
    expect(dbClientStub.query).to.be.calledOnce;
  });

  it('should call updateMultiplePrices for stale rows', async () => {
    updatePricesStub = sandbox.stub(marketPriceFns, "updateMultiplePrices").resolves(['3000.33']);
    const rows = [
      { item_id: '1', date_created: 'd', date_changed: 'd', symbol: 'MSFT', quantity: '100', price_per_share: '200.02', was_stale: true },
      { item_id: '2', date_created: 'd', date_changed: 'd', symbol: 'USD', quantity: '100000', price_per_share: '1', was_stale: false },
      { item_id: '3', date_created: 'd', date_changed: 'd', symbol: 'PLTR', quantity: '100', price_per_share: '60.02', was_stale: false },
    ];
    dbClientStub.query.resolves({ rows });
    const portfolioItems = await getUpdatedPortfolio(dbClientStub, userId);
    rows[0].price_per_share = '3000.33';
    expect(portfolioItems).to.deep.equal(rows);
    expect(updatePricesStub).to.be.calledOnce;
    expect(dbClientStub.query).to.be.calledOnce;
  });
});
