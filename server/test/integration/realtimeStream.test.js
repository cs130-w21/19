import { createConnectedClient } from '../../src/db/dbClient.js';
import  { finnhubWsMessageHandler } from '../../src/marketData/realtimeStream.js';
import { FinnhubWsClient } from '../../src/marketData/finnhub.js';
import SubscriptionManager from '../../src/marketData/subscriptionManager.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinonChai from "sinon-chai";
import ws from 'ws';

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);
/* In this integration test, we'll be mimicking finnhub sending data as a 'price update'. 
 * we want to make sure that we do the right things when updating, and that the correect clients
 * get updated.
 */

const createWsClient = (sandbox) => ({
  send: sandbox.stub(),
  id: undefined,
  readyState: ws.OPEN,
});

describe('tickerPriceUpdate / subscribeToTicker integration tests', () => {
  let pgClient;
  let registeredWsClients = [];
  const sandbox = sinon.createSandbox();
  before(() => {
    // TODO: should write unit tests on the SubscriptionManager, and stubb finnhubWsClient.
    sinon.stub(FinnhubWsClient, 'send');
  });
  beforeEach(async () => {
    pgClient = await createConnectedClient();
  });
  afterEach(() => {
    sandbox.restore();
    registeredWsClients.forEach((c) => SubscriptionManager.unregisterClient(c));
    registeredWsClients = [];
  });

  after(() => {
    if (pgClient !== undefined) {
      pgClient.end();
    }
  });

  it('should update database correctly when ticker updates are obtained', async () => {
    const currentTimeMillis = Date.now();
    const updatesPayload = {
      data: [
        { "p": 6969.69, "s": "TEST_TICKER", "t": currentTimeMillis, "v": 6969 },
        { "p": 7969.69, "s": "TEST_TICKER_2", "t": currentTimeMillis, "v": 7969 },
      ],
      type: 'trade',
    };
    await finnhubWsMessageHandler({ data: JSON.stringify(updatesPayload)});

    const { rows } = await pgClient.query(`
      SELECT ROUND(extract(epoch FROM price_last_changed)) as ts, last_price
      FROM tickers
      WHERE ticker_name = 'TEST_TICKER' OR ticker_name = 'TEST_TICKER_2' ORDER BY ticker_name ASC;`
    );
    expect(rows.length).to.equal(2);
    expect(rows[0]).to.deep.equal({
      ts: Math.round(currentTimeMillis / 1000),
      last_price: "6969.69",
    })

    expect(rows[1]).to.deep.equal({
      ts: Math.round(currentTimeMillis / 1000),
      last_price: "7969.69",
    })

  });

  it('should send messages only to subscribed clients for a particular ticker', async () => {
    const currentTimeMillis = Date.now();
    const updatesPayload = {
      data: [
        { "p": 6969.69, "s": "TEST_TICKER", "t": currentTimeMillis, "v": 6969 },
        { "p": 8969.69, "s": "TEST_TICKER_2", "t": currentTimeMillis, "v": 800 },
      ],
      type: 'trade',
    };
    const client1 = createWsClient(sandbox);
    const client2 = createWsClient(sandbox);
    registeredWsClients = [client1, client2];

    SubscriptionManager.registerClient(client1);
    SubscriptionManager.registerClient(client2);
    SubscriptionManager.addSubscription(client1, 'TEST_TICKER');
    SubscriptionManager.addSubscription(client2, 'TEST_TICKER_2');

    await finnhubWsMessageHandler({ data: JSON.stringify(updatesPayload)});

    expect(client1.send).to.be.calledOnce;
    expect(client2.send).to.be.calledOnce;
    expect(client1.send).to.be.calledWith(JSON.stringify({
      price: 6969.69,
      volume: 6969,
      ticker: "TEST_TICKER",
      event: "tickerPriceUpdate",
      timestamp: currentTimeMillis / 1000,
    }));

    expect(client2.send).to.be.calledWith(JSON.stringify({
      price: 8969.69,
      volume: 800,
      ticker: "TEST_TICKER_2",
      event: "tickerPriceUpdate",
      timestamp: currentTimeMillis / 1000,
    }));
  });
  it('should reduce multiple data values for a ticker correctly', async () => {
    const currentTimeMillis = Date.now();
    const updatesPayload = {
      data: [
        { c: [], p: 28.27, s: 'PLTR', t: 1614020488374, v: 200 },
        { c: [], p: 28.2799, s: 'PLTR', t: 1614020488422, v: 60 },
        { c: [], p: 28.28, s: 'PLTR', t: 1614020488618, v: 100 },
        { c: [], p: 28.275, s: 'PLTR', t: 1614020488621, v: 100 },
        { c: [], p: 28.28, s: 'PLTR', t: 1614020488622, v: 100 },
        { c: [], p: 28.269, s: 'PLTR', t: 1614020489021, v: 36 }
      ],
      type: 'trade',
    };
    const client1 = createWsClient(sandbox);
    registeredWsClients = [client1];

    SubscriptionManager.registerClient(client1);
    SubscriptionManager.addSubscription(client1, 'PLTR');

    await finnhubWsMessageHandler({ data: JSON.stringify(updatesPayload)});

    expect(client1.send).to.be.calledOnce;
    expect(client1.send).to.be.calledWith(JSON.stringify({
      price: 28.269,
      volume: 596,
      ticker: 'PLTR',
      event: "tickerPriceUpdate",
      timestamp: 1614020489021 / 1000,
    }));
  });

  it('should reduce multiple data values for multiple tickers correctly', async () => {
    const currentTimeMillis = Date.now();
    const updatesPayload = {
      data: [
        { c: [], p: 28.27, s: 'PLTR', t: 1614020488374, v: 200 },
        { c: [], p: 28.2799, s: 'PLTR', t: 1614020488422, v: 60 },
        { c: [], p: 28.28, s: 'PLTR', t: 1614020488618, v: 100 },
        { c: [], p: 28.275, s: 'PLTR', t: 1614020488621, v: 100 },
        { c: [], p: 28.28, s: 'PLTR', t: 1614020488622, v: 100 },
        { c: [], p: 48.28, s: 'ABNB', t: 1614020488618, v: 101 },
        { c: [], p: 48.275, s: 'ABNB', t: 1614020488621, v: 101 },
        { c: [], p: 48.38, s: 'ABNB', t: 1614020488622, v: 101 },
        { c: [], p: 28.269, s: 'PLTR', t: 1614020489021, v: 36 }
      ],
      type: 'trade',
    };
    const client1 = createWsClient(sandbox);
    const client2 = createWsClient(sandbox);
    registeredWsClients = [client2, client1];

    SubscriptionManager.registerClient(client1);
    SubscriptionManager.registerClient(client2);
    SubscriptionManager.addSubscription(client1, 'PLTR');
    SubscriptionManager.addSubscription(client2, 'ABNB');
    await finnhubWsMessageHandler({ data: JSON.stringify(updatesPayload)});
    expect(client1.send).to.be.calledOnce;
    expect(client1.send).to.be.calledWith(JSON.stringify({
      price: 28.269,
      volume: 596,
      ticker: 'PLTR',
      event: "tickerPriceUpdate",
      timestamp: 1614020489021 / 1000,
    }));

    expect(client2.send).to.be.calledOnce;
    expect(client2.send).to.be.calledWith(JSON.stringify({
      price: 48.38,
      volume: 303,
      ticker: 'ABNB',
      event: "tickerPriceUpdate",
      timestamp: 1614020488622/ 1000,
    }));
  });
});
