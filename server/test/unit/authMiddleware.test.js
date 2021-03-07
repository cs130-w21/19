import authMiddleware from '../../src/auth/authMiddleware.js';
import chai from 'chai';

const { assert } = chai;

describe('authMiddleware unit tests', () => {
    it('should call next() when req.user is defined', async () => {
        let i = false;
        const next = () => {
            i = true;
        };
        const req = {
            user: {}
        };
        const res = {};
        assert(!i);
        authMiddleware(req, res, next);
        assert(i);
    });
    it('should not call next() when req.user is undefined', async () => {
        let i = false;
        const next = () => {
            i = true;
        };
        const req = {
            user: null
        };
        const res = {
            status:(_) => {
                return {
                    json: (_) => {

                    }
                }
            }
        };
        assert(!i);
        authMiddleware(req, res, next);
        assert(!i);
    });
});
