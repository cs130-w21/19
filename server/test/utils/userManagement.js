import bcrypt from 'bcryptjs';
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from "sinon-chai";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiHttp);

/*
 *  method that:
 *  - Creates a new user with username 'test_user', password 'password123', email 'test_user@email.com'.
 *  - gives 100k USD to this user.
 *
 *  returns the following obj:
 *  {
 *    setCookie: 'set cookie string obtained after /register',
 *    userId: 'userId of the new user'
 *  }
 */
const createTestUser = async (dbClient, app) => {
  const username = 'test_user';
  const email = 'test_user@email.com';
  const password = 'password123';
  const res = await chai.request(app)
    .post('/api/accounts/register')
    .set('Content-Type', 'application/json')
    .send({ username, email, password });

  const userId = res.body.userId;
  const setCookie = res.header['set-cookie'];

  return {
    userId,
    setCookie,
  };

}

/* delete 'test_user' from user created in createTestUser, as well as any associated portfolio items and trades.  */
const deleteTestUser = async (dbClient, userId) => {
  await dbClient.query(`
    DELETE FROM PortfolioItems WHERE user_id = $1;
  `, [ userId ]);

  await dbClient.query(`
    DELETE FROM trades WHERE user_id = $1;
  `, [ userId ]);

  await dbClient.query(`
    DELETE FROM watchlist WHERE user_id = $1;
  `, [ userId ]);

  await dbClient.query(`
    DELETE FROM Users WHERE user_id = $1;
  `, [ userId ]);
}

const deleteTestUsers = async (dbClient, userIds) => {
  let userIdsArray = userIds;
  if (!Array.isArray(userIds)) {
    userIdsArray = [ userId ];
  }
  return Promise.all(userIdsArray.map((userId) => deleteTestUser(dbClient, userId)));
};

export {
  createTestUser, deleteTestUser, deleteTestUsers,
};
