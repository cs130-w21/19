Welcome to our repo!

# Stonks
[![Build Status](https://travis-ci.com/cs130-w21/19.svg?branch=master)](https://travis-ci.com/cs130-w21/19)

Making paper trading available for everyone. Check us out [here](http://stonks.us-west-1.elasticbeanstalk.com/).

# Getting set up

Please follow the following commands:

```sh
# 1. install client & server modules. Make sure to use node v12.19.0 as stated in .nvmrc
npm run install:all


# 2. make sure to have postgresql 12.4 running, and specify the connection string in the 
# environment variable PG_CONNSTR
export PG_CONNSTR="postgresql://username:password@localhost:5432/db_name"

# go to finnhub.io and make a free account. Then, add your API KEY:
export FINNHUB_API_KEY="YOUR_API_KEY_HERE"


# 3. Start both client and server in development mode. See the root directory
# package.json for more details.
npm start


# navigate to localhost:3000 to see the frontend! Backend is hosted in port 8080 (default)
open localhost:3000
```
## Deployments & the state of the `master` branch
We do CICD on Travis CI. For every push onto every branch, a travis build is triggered. See the link below for our travis site.

Merging to master can only happen upon approval in review and the passing of checks. Once merged to `master`, tested & built successfully, Travis CI will kick off the deployment to elastic beanstalk. We must not skip builds and deployments on `master`.

The **master** branch is a **direct** reflection of what's deployed in production. To streamline and simplify the project, we do not operate on a tag & release system.



# Useful links

- [Server Unit Tests](./server/test/unit)
- [Server Integration Tests](./server/test/integration)
- [Wiki page](https://github.com/cs130-w21/19/wiki)
- [Kanban board](https://github.com/cs130-w21/19/projects/1)
- [CICD (Travis)](https://travis-ci.com/github/cs130-w21/19)
- [Live prod site](http://stonks.us-west-1.elasticbeanstalk.com/)
- [Live API docs](http://stonks.us-west-1.elasticbeanstalk.com/docs)
- [Live Integration Test coverage report](http://stonks.us-west-1.elasticbeanstalk.com/coverage-integration)
- [Live Unit Test coverage report](http://stonks.us-west-1.elasticbeanstalk.com/coverage-unit)

# Repo Conventions

See this [markdown file](REPO_CONVENTIONS.md) to see how we document our progress and manage our workflows in this repo.
