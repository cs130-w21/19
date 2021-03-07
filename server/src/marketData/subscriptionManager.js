/* Singleton class that keeps track a list of websocket socket clients and their stock subscriptions.
 * We need this to keep track of which clients need to be sent which stocks.
 */
import { v4 as uuidv4 } from 'uuid';
import { FinnhubWsClient } from './finnhub.js';

class PrivateSingleton {
  constructor() {
    this.tickerToClients = {}; // e.g. AAPL -> [ client1, client2 ]
    this.clientIdToSubscriptions = {}; // clientId -> [ 'AAPL', 'GOOGL' ]
  }
}

class SubscriptionManager {
  constructor() {
    throw new Error('Use subscriptionManager.getInstance()');
  }

  static getInstance() {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new PrivateSingleton();
    }
    return SubscriptionManager.instance;
  }

  static registerClient(client) {
    client.id = uuidv4();
    const instance = this.getInstance();
    instance.clientIdToSubscriptions[client.id] = [];
  }

  static unregisterClient(client) {
    const id = client.id;
    const instance = this.getInstance();
    instance.clientIdToSubscriptions[id].forEach((ticker) => {
      this.removeSubscription(client, ticker);
    });
    delete instance.clientIdToSubscriptions[id];
  }


  static addSubscription(client, ticker) {
    const instance = this.getInstance();
    if (!instance.tickerToClients[ticker]) {
      FinnhubWsClient.send(JSON.stringify({
        type: 'subscribe',
        symbol: ticker,
      }));
    }
    instance.tickerToClients[ticker] = [...(instance.tickerToClients[ticker] || []), client];
    instance.clientIdToSubscriptions[client.id].push(ticker);
  }

  static removeSubscription(client, ticker) {
    const instance = this.getInstance();
    instance.tickerToClients[ticker] =  instance.tickerToClients[ticker].filter((c) => c.id !== client.id);
    instance.clientIdToSubscriptions[client.id] = instance.clientIdToSubscriptions[client.id].filter(t => t !== ticker);
    if (instance.tickerToClients[ticker].length === 0) {
      delete instance.tickerToClients[ticker];
      FinnhubWsClient.send(JSON.stringify({
        type: 'unsubscribe',
        'symbol': ticker,
      }));
    }
  }

  static getSubscriptions(client) {
    const instance = this.getInstance();
    return instance.clientIdToSubscriptions[client.id] || [];
  }
  static getAllSubscribedTickers() {
    const instance = this.getInstance();
    return Object.keys(instance.tickerToClients);
  }

  static getSubscribedClients(ticker) {
    const instance = this.getInstance();
    return instance.tickerToClients[ticker] || [];
  }
}

export default SubscriptionManager;


