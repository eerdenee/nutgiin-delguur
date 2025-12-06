import { phoneToEmail, isValidPhone } from '../auth';

describe('Auth Utilities', () => {
    describe('phoneToEmail', () => {
        it('should convert phone number to email format', () => {
            expect(phoneToEmail('99112233')).toBe('99112233@example.com');
        });

        it('should sanitize phone number before conversion', () => {
            expect(phoneToEmail('  991-122-33  ')).toBe('99112233@example.com');
            expect(phoneToEmail('991 122 33')).toBe('99112233@example.com');
        });
    });

    describe('isValidPhone', () => {
        it('should validate correct Mongolian phone numbers', () => {
            expect(isValidPhone('99112233')).toBe(true);
            expect(isValidPhone('88776655')).toBe(true);
        });

        it('should reject invalid phone numbers', () => {
            expect(isValidPhone('12345678')).toBe(false); // Wrong prefix
            expect(isValidPhone('9911223')).toBe(false); // Too short
            expect(isValidPhone('991122334')).toBe(false); // Too long
            expect(isValidPhone('')).toBe(false); // Empty
        });

        it('should handle phone numbers with formatting', () => {
            expect(isValidPhone('991-122-33')).toBe(true);
            expect(isValidPhone('  99112233  ')).toBe(true);
        });
    });
});
