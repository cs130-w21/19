#!/usr/bin/env bash
# this script runs a 12.4 postgres docker container on port 5432 and creates the database called 'integration_test_db'

docker pull postgres:12.4
docker run --name my_pg_db -d -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres:12.4

until psql -h localhost -p 5432 -U postgres -c 'select 1' &> /dev/null; do
  echo "waiting for pg"
  sleep 1
done

psql -h localhost -p 5432 -U postgres -c 'DROP DATABASE IF EXISTS integration_test_db;'
psql -h localhost -p 5432 -U postgres -c 'CREATE DATABASE integration_test_db;'
