import { createConnectedClient } from '../../src/db/dbClient.js';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinonChai from "sinon-chai";

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);

describe('GET /api/chart integration tests', () => {
  let pgClient;
  beforeEach(async () => {
    pgClient = await createConnectedClient();
  });
  after(() => {
    if (pgClient !== undefined) {
      pgClient.end();
    }
  });

  it('should get data from finnhub in the correct format', async () => {
    // NOTE: we hardcode the data here. Expect OHLC history data not to change anyway.
    const res = await chai.request(app)
      .get('/api/chart?from=1613411273&to=1613979273&ticker=AAPL&resolution=M')
      .set('Content-Type', 'application/json')
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      "opens": [
          135.49,
      ],
      "highs": [
          136.01,
      ],
      "lows": [
          127.41,
      ],
      "closes": [
          129.87
      ],
      "volumes": [
        363187147,
      ],
      "timestamps": [
        1612137600,
      ],
      "hasData": true
    });
  });

});
