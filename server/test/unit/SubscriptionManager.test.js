import { FinnhubWsClient } from '../../src/marketData/finnhub.js';
import SubscriptionManager from '../../src/marketData/subscriptionManager.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from "sinon-chai";

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);

const createWsClient = (sandbox) => ({
  send: sandbox.stub(),
  id: undefined,
});

describe('SubscriptionManager unit tests', () => {
  const sandbox = sinon.createSandbox();
  let wsSendStub;
  beforeEach(async () => {
    wsSendStub = sandbox.stub(FinnhubWsClient, 'send');
  });
  afterEach(() => {
    sandbox.restore();
    SubscriptionManager.getInstance().tickerToClients = {}; // e.g. AAPL -> [ client1, client2 ]
    SubscriptionManager.getInstance().clientIdToSubscriptions = {}; // clientId -> [ 'AAPL', 'GOOGL' ]
  });

  it('should add subscription correctly', () => {
    const client1 = createWsClient(sandbox);
    SubscriptionManager.registerClient(client1);
    SubscriptionManager.addSubscription(client1, 'MY_TICKER_C0');
    const subscriptions = SubscriptionManager.getSubscriptions(client1);
    const subscribedClients = SubscriptionManager.getSubscribedClients('MY_TICKER_C0');
    expect(subscriptions).to.deep.equal(['MY_TICKER_C0']);
    expect(subscribedClients).to.deep.equal([client1]);
  });

  it('should add multiple subscription correctly', () => {
    const client1 = createWsClient(sandbox);
    const client2 = createWsClient(sandbox);
    SubscriptionManager.registerClient(client1);
    SubscriptionManager.registerClient(client2);
    SubscriptionManager.addSubscription(client1, 'MY_TICKER_C0');
    SubscriptionManager.addSubscription(client2, 'MY_TICKER_C0');
    const subscriptions = SubscriptionManager.getSubscriptions(client1);
    const subscriptions2 = SubscriptionManager.getSubscriptions(client2);
    const subscribedClients = SubscriptionManager.getSubscribedClients('MY_TICKER_C0');

    expect(subscriptions).to.deep.equal(['MY_TICKER_C0']);
    expect(subscriptions2).to.deep.equal(['MY_TICKER_C0']);
    expect(subscribedClients).to.deep.equal([client1, client2]);
  });

  it('should unsubscribe correctly', () => {
    const client1 = createWsClient(sandbox);
    SubscriptionManager.registerClient(client1);
    SubscriptionManager.addSubscription(client1, 'MY_TICKER_C1');

    SubscriptionManager.removeSubscription(client1, 'MY_TICKER_C1');
    const subscriptions = SubscriptionManager.getSubscriptions(client1);
    const subscribedClients = SubscriptionManager.getSubscribedClients('MY_TICKER_C1');
    expect(subscriptions).to.deep.equal([]);
    expect(subscribedClients).to.deep.equal([]);
  });

  it('should unsubscribe multiple correctly', () => {
    const client1 = createWsClient(sandbox);
    const client2 = createWsClient(sandbox);
    SubscriptionManager.registerClient(client1);
    SubscriptionManager.registerClient(client2);
    SubscriptionManager.addSubscription(client1, 'MY_TICKER_C1');
    SubscriptionManager.addSubscription(client2, 'MY_TICKER_C1');

    SubscriptionManager.removeSubscription(client1, 'MY_TICKER_C1');
    let subscribedClients = SubscriptionManager.getSubscribedClients('MY_TICKER_C1');
    expect(subscribedClients).to.deep.equal([client2]);
    SubscriptionManager.removeSubscription(client2, 'MY_TICKER_C1');
    subscribedClients = SubscriptionManager.getSubscribedClients('MY_TICKER_C1');
    expect(subscribedClients).to.deep.equal([]);
  });
  it('should call finnhub ws client when client subscribing to new ticker (not subscribed before)', () => {
    const client1 = createWsClient(sandbox);
    SubscriptionManager.registerClient(client1);
    SubscriptionManager.addSubscription(client1, 'MY_TICKER_CC');
    expect(wsSendStub).to.be.calledOnce;
    expect(wsSendStub).calledWith(JSON.stringify({
      type: 'subscribe',
      symbol: 'MY_TICKER_CC',
    }));
  });

  it('should call finnhub ws client only when no more clients left subscribing', () => {
    const client1 = createWsClient(sandbox);
    const client2 = createWsClient(sandbox);
    SubscriptionManager.registerClient(client1);
    SubscriptionManager.registerClient(client2);
    SubscriptionManager.addSubscription(client1, 'MY_TICKER_CD');
    SubscriptionManager.addSubscription(client2, 'MY_TICKER_CD');

    SubscriptionManager.removeSubscription(client2, 'MY_TICKER_CD');
    expect(wsSendStub).to.be.calledOnce
    SubscriptionManager.removeSubscription(client1, 'MY_TICKER_CD');
    expect(wsSendStub).to.be.calledTwice;
    expect(wsSendStub).calledWith(JSON.stringify({
      type: 'unsubscribe',
      symbol: 'MY_TICKER_CD',
    }));
  });
  
  it('should not call finnhub ws client when client subscribing to subscribed ticker', () => {
    const client1 = createWsClient(sandbox);
    const client2 = createWsClient(sandbox);
    SubscriptionManager.registerClient(client1);
    SubscriptionManager.registerClient(client2);
    SubscriptionManager.addSubscription(client1, 'MY_TICKER_CE');
    SubscriptionManager.addSubscription(client2, 'MY_TICKER_CE');
    expect(wsSendStub).to.be.calledOnce;
    expect(wsSendStub).calledWith(JSON.stringify({
      type: 'subscribe',
      symbol: 'MY_TICKER_CE',
    }));
  });
});
