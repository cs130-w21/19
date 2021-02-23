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
      .get('/api/chart?from=1613411273&to=1613979273&ticker=AAPL&resolution=D')
      .set('Content-Type', 'application/json')
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      "opens": [
          135.49,
          131.25,
          129.2,
          130.24
      ],
      "highs": [
          136.01,
          132.22,
          129.995,
          130.71
      ],
      "lows": [
          132.79,
          129.47,
          127.41,
          128.8
      ],
      "closes": [
          133.19,
          130.84,
          129.71,
          129.87
      ],
      "volumes": [
          80576316,
          98085249,
          96856748,
          87525900
      ],
      "timestamps": [
          1613433600,
          1613520000,
          1613606400,
          1613692800
      ],
      "hasData": true
    });
  });

});
