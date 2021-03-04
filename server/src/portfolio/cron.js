import express from 'express';
import cron from 'node-cron'
import { pgPool } from '../db/dbClient.js';
import { updatePortfolioValues } from './portfolio.js';


export const schedulePortfolioCron = () => {
    cron.schedule("0 * * * *", async () => {
        console.log('running a task every hour');
        let dbClient;
        try {
            dbClient = await pgPool.connect();
            await updatePortfolioValues(dbClient);
        }
        finally {
            dbClient.release();
        }
    });
};
