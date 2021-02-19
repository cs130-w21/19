Welcome to our repo!
# Getting set up

Please follow the following commands:

```sh
# 1. install client & server modules. Make sure to use node v12.19.0 as stated in .nvmrc
npm install;

# 2. make sure to have postgresql 12.4 running, and specify the connection string in the 
# environment variable PG_CONNSTR
export PG_CONNSTR="postgresql://willyspinner:@localhost:5432/willyspinner"

# 3. Start both client and server in development mode. See the root directory
# package.json for more details.
npm start

# navigate to localhost:3000 to see the frontend! Backend is hosted in port 8080 (default)
open localhost:3000
```

# Useful links

- [Server Unit Tests](./server/test/unit)
- [Server Integration Tests](./server/test/integration)
- [Wiki page](https://github.com/cs130-w21/19/wiki)
- [Kanban board](https://github.com/cs130-w21/19/projects/1)
- [CICD (Travis)](https://travis-ci.com/github/cs130-w21/19)
- [Live prod site](http://stonks.us-west-1.elasticbeanstalk.com/)
- [Live API docs](http://stonks.us-west-1.elasticbeanstalk.com/docs)

# Repo Conventions

See this [markdown file](REPO_CONVENTIONS.md) to see how we document our progress and manage our workflows in this repo.
