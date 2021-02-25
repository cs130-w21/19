import { createConnectedClient } from '../../src/db/dbClient.js';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import sinonChai from "sinon-chai";
import { createTestUser, deleteTestUser, deleteTestUsers } from '../utils/userManagement.js';

const { expect, assert } = chai;
chai.use(sinonChai);
chai.use(chaiHttp);

describe('/api/accounts/register integration tests', () => {
  const sandbox = sinon.createSandbox();
  let pgClient;
  let usedUserIds = [];

  const testUsername = 'test_username';
  const testPassword = 'test_password';
  const testEmail = 'test@eemail.com';

  before(async () => {
    pgClient = await createConnectedClient();
  });

  afterEach(async () => {
    sandbox.restore();
    await deleteTestUsers(pgClient, usedUserIds);
    usedUserIds = [];
  });

  after(() => {
    if (pgClient !== undefined) {
      pgClient.end();
    }
  });
  

  const checkUniqueAccountByUsername = async (dbClient, username, exists) => {
    const { rows: accountRows } = await dbClient.query(`
      SELECT * FROM users 
      WHERE username = $1;
    `, [username]);
    if (exists) {
      expect(accountRows.length).to.equal(1);
    } else {
      expect(accountRows.length).to.equal(0);
    }
  };

  const checkUniqueAccountByEmail = async (dbClient, email, exists) => {
    const { rows: accountRows } = await dbClient.query(`
      SELECT * FROM users 
      WHERE email = $1;
    `, [email]);
    if (exists) {
      expect(accountRows.length).to.equal(1);
    } else {
      expect(accountRows.length).to.equal(0);
    }
  }

  const doRegisterRequest = async (app, payload) => {
    const res = await chai.request(app)
      .post('/api/accounts/register')
      .set('Content-Type', 'application/json')
      .send(payload);
    if (res.status === 200) {
      const { userId } = res.body;
      if (! usedUserIds.includes(userId)) {
        usedUserIds.push(userId);
      }
    }
    return res;
  };

  it('should create a row in users table with a valid hashed_password', async () => {
    await doRegisterRequest(app, {
      username: testUsername,
      password: testPassword,
      email: testEmail
    });

    const { rows: [user,] } = await pgClient.query("SELECT * FROM users WHERE username = 'test_username'");
    assert(bcrypt.compare(testPassword, user.hashed_password));
    expect(user.username).to.equal(testUsername);
    expect(user.email).to.equal(testEmail);
  });

  it('should not create a row in users table without a valid password', async () => {
    await doRegisterRequest(app, {
      username: testUsername,
      email: testEmail
    });
    await checkUniqueAccountByUsername(pgClient, testUsername, false);
    await checkUniqueAccountByEmail(pgClient, testUsername, false);
  });

  it('should not create a row in users table without a valid username', async () => {
    await doRegisterRequest(app, {
      email: testEmail,
      password: testPassword
    });
    await checkUniqueAccountByEmail(pgClient, testEmail, false);
  });

  it('should not create a row in users table without a valid email', async () => {
    await doRegisterRequest(app, {
      username: testUsername,
      password: testPassword
    });
    await checkUniqueAccountByUsername(pgClient, testUsername, false);
  });

  it('should not create an another row in users table if an account with the same username already exists', async () => {
    const reqBody = {
      username: testUsername,
      password: testPassword,
      email: testEmail
    };
    // do it twice.
    await doRegisterRequest(app, reqBody);
    await doRegisterRequest(app, reqBody);

    await checkUniqueAccountByUsername(pgClient, testUsername, true);
  });

  it('should not create an another row in users table if an account with the same username already exists but with different email', async () => {
    await doRegisterRequest(app, {
      username: testUsername,
      password: testPassword,
      email: testEmail
    });
    await doRegisterRequest(app, {
      username: testUsername,
      password: testPassword,
      email: 'test1@email.com'
    });
    await checkUniqueAccountByUsername(pgClient, testUsername, true);
    await checkUniqueAccountByEmail(pgClient, 'test1@email.com', false);
  });

  it('should not create an another row in users table if an account with the same email already exists but with different username', async () => {
      await doRegisterRequest(app, {
        username: testUsername,
        password: testPassword,
        email: testEmail
      });
    await doRegisterRequest(app, {
      username: 'userName2',
      password: testPassword,
      email: testEmail
    });
    await checkUniqueAccountByEmail(pgClient, testEmail, true);
    await checkUniqueAccountByUsername(pgClient, 'userName2', false);
  });

});


describe('/api/accounts/login integration tests', () => {
  const sandbox = sinon.createSandbox();
  let pgClient;

  const email = 'test_user@email.com';
  const password = 'password123';
  let userId; 

  before(async () => {
    pgClient = await createConnectedClient();
    const user = await createTestUser(pgClient, app);
    userId = user.userId;
  });

  afterEach(async () => {
    sandbox.restore();
    await deleteTestUser(pgClient, userId);
  });

  after(() => {
    if (pgClient !== undefined) {
      pgClient.end();
    }
  });

  it('should login succesfully with valid credentials', async () => {
    const res = await chai.request(app)
      .post('/api/accounts/login')
      .set('Content-Type', 'application/json')
      .send({
        username: 'test_user',
        password: password
      });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should not login succesfully without email', async () => {
    const res = await chai.request(app)
      .post('/api/accounts/login')
      .set('Content-Type', 'application/json')
      .send({
        password: password
      });
    expect(res.status).to.not.equal(200);
    expect(res.body.success).to.equal(false);
  });

  it('should not login succesfully without password', async () => {
    const res = await chai.request(app)
      .post('/api/accounts/login')
      .set('Content-Type', 'application/json')
      .send({
        email: email
      });
    expect(res.status).to.not.equal(200);
    expect(res.body.success).to.equal(false);
  });

});
