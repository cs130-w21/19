import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinonChai from "sinon-chai";

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);




describe('/api/search integration tests', () => {
  const sandbox = sinon.createSandbox();


  it('should have search results for stock using ticker', async () => {
    const res = await chai.request(app)
      .get('/api/search?searchString=PLTR')
      .set('Content-Type', 'application/json')

    expect(res.status).to.equal(200);
    expect(res.body.searchResults.length).to.be.at.least(1);
    expect(res.body.searchResults[0].symbol).to.equal('PLTR');
    expect(res.body.searchResults[0].name).to.equal('PALANTIR TECHNOLOGIES INC-A');
  });

    it('should have search results for stock using company name', async () => {
      const res = await chai.request(app)
        .get(`/api/search?searchString=${encodeURI("Palantir Technologies")}`)
        .set('Content-Type', 'application/json')
      expect(res.status).to.equal(200);
      expect(res.body.searchResults.length).to.be.at.least(1);
      expect(res.body.searchResults[0].symbol).to.equal('PLTR');
      expect(res.body.searchResults[0].name).to.equal('PALANTIR TECHNOLOGIES INC-A');
    });

  it('should send maxResults results if specified', async () => {
    const res = await chai.request(app)
      .get(`/api/search?searchString=${encodeURI("Palantir Technologies")}&maxResults=1`)
      .set('Content-Type', 'application/json')
    expect(res.status).to.equal(200);
    expect(res.body.searchResults.length).to.equal(1);
    expect(res.body.searchResults[0].symbol).to.equal('PLTR');
    expect(res.body.searchResults[0].name).to.equal('PALANTIR TECHNOLOGIES INC-A');
  });

  it('should return 400 when invalid maxResults param', async () => {
    const res = await chai.request(app)
      .get(`/api/search?searchString=${encodeURI("Palantir Technologies")}&maxResults=a`)
      .set('Content-Type', 'application/json')
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({
      errorMessage: 'Invalid maxResults query param',
    });
  });

  it('should return 400 when no searchString specified', async () => {
    const res = await chai.request(app)
      .get(`/api/search`)
      .set('Content-Type', 'application/json')
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({
      errorMessage: 'Invalid searchString param / missing',
    });
  });
}); 
