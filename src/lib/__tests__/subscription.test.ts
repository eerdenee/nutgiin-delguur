import { SUBSCRIPTION_PLANS, canPostMoreAds, isAdExpired, getDaysUntilExpiration } from '../subscription';

describe('Subscription System', () => {
    describe('SUBSCRIPTION_PLANS', () => {
        it('should have all required plans', () => {
            expect(SUBSCRIPTION_PLANS.start).toBeDefined();
            expect(SUBSCRIPTION_PLANS.active).toBeDefined();
            expect(SUBSCRIPTION_PLANS.business).toBeDefined();
        });

        it('should have correct pricing', () => {
            expect(SUBSCRIPTION_PLANS.start.price).toBe(0);
            expect(SUBSCRIPTION_PLANS.active.price).toBe(9900);
            expect(SUBSCRIPTION_PLANS.business.price).toBe(49000);
        });

        it('should have correct ad limits', () => {
            expect(SUBSCRIPTION_PLANS.start.limits.adsPerMonth).toBe(3);
            expect(SUBSCRIPTION_PLANS.active.limits.adsPerMonth).toBe(10);
            expect(SUBSCRIPTION_PLANS.business.limits.adsPerMonth).toBe(100);
        });
    });

    describe('isAdExpired', () => {
        it('should correctly identify expired ads', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 10);

            // START tier: 7 days duration, created 10 days ago = expired
            expect(isAdExpired(oldDate.toISOString(), 'start')).toBe(true);
        });

        it('should correctly identify active ads', () => {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 2);

            // START tier: 7 days duration, created 2 days ago = still active
            expect(isAdExpired(recentDate.toISOString(), 'start')).toBe(false);
        });
    });

    describe('getDaysUntilExpiration', () => {
        it('should calculate days correctly', () => {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 2);

            // START tier: 7-day duration, 2 days passed = 5 days left
            const daysLeft = getDaysUntilExpiration(recentDate.toISOString(), 'start');
            expect(daysLeft).toBeGreaterThanOrEqual(4);
            expect(daysLeft).toBeLessThanOrEqual(6); // Allow for test timing variance
        });

        it('should return 0 for expired ads', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 30);

            expect(getDaysUntilExpiration(oldDate.toISOString(), 'start')).toBe(0);
        });
    });
});
