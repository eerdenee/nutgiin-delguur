/**
 * PII Redaction System
 * 
 * Problem: Logs contain personal information (phone, RD, names).
 *          If hackers access logs, they get everything without touching database.
 * Solution: Automatically mask all PII before logging.
 */

// Patterns to detect and redact
const PII_PATTERNS = {
    // Mongolian phone numbers: 99112233, 8899-1122, +976-99112233
    phone: /(\+?976[-\s]?)?\d{4}[-\s]?\d{4}/g,

    // Mongolian Registration Number (RD): УА99112233, БТ88889999
    registrationNumber: /[А-ЯӨҮЁ]{2}\d{8}/gi,

    // Email addresses
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

    // Bank account numbers (8-16 digits)
    bankAccount: /\b\d{8,16}\b/g,

    // IP addresses
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,

    // Credit card numbers (basic pattern)
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

    // UUID (user IDs) - partial mask
    uuid: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi
};

// Fields that commonly contain PII
const PII_FIELD_NAMES = [
    'phone', 'email', 'name', 'firstName', 'lastName',
    'password', 'token', 'secret', 'apiKey', 'authToken',
    'registrationNumber', 'rd', 'bankAccount', 'iban',
    'address', 'location', 'ip', 'ipAddress'
];

/**
 * Mask a string value (show first 2 and last 2 characters)
 */
function maskString(value: string, showChars: number = 2): string {
    if (!value || value.length <= showChars * 2) {
        return '***';
    }
    const start = value.substring(0, showChars);
    const end = value.substring(value.length - showChars);
    return `${start}***${end}`;
}

/**
 * Redact phone number: 99112233 -> 99***33
 */
function redactPhone(phone: string): string {
    return phone.replace(/\d/g, (d, i, arr) => {
        const len = arr.match(/\d/g)?.length || 0;
        const digitIndex = arr.substring(0, i + 1).match(/\d/g)?.length || 0;
        return (digitIndex <= 2 || digitIndex > len - 2) ? d : '*';
    });
}

/**
 * Redact email: test@example.com -> te***@ex***.com
 */
function redactEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***@***.***';

    const [domainName, tld] = domain.split('.');
    return `${maskString(local)}@${maskString(domainName || '')}.${tld || '***'}`;
}

/**
 * Redact UUID: show only first segment
 */
function redactUUID(uuid: string): string {
    const parts = uuid.split('-');
    return `${parts[0]}-****-****-****-************`;
}

/**
 * Redact all PII patterns in a string
 */
export function redactString(text: string): string {
    let result = text;

    // Redact phone numbers
    result = result.replace(PII_PATTERNS.phone, (match) => redactPhone(match));

    // Redact RD numbers
    result = result.replace(PII_PATTERNS.registrationNumber, (match) =>
        match.substring(0, 2) + '******' + match.substring(match.length - 2)
    );

    // Redact emails
    result = result.replace(PII_PATTERNS.email, (match) => redactEmail(match));

    // Redact bank accounts
    result = result.replace(PII_PATTERNS.bankAccount, (match) =>
        match.substring(0, 2) + '*'.repeat(match.length - 4) + match.substring(match.length - 2)
    );

    // Redact IPs
    result = result.replace(PII_PATTERNS.ipAddress, (match) => {
        const parts = match.split('.');
        return `${parts[0]}.${parts[1]}.***.***`;
    });

    // Redact UUIDs
    result = result.replace(PII_PATTERNS.uuid, (match) => redactUUID(match));

    return result;
}

/**
 * Redact PII from an object (recursively)
 */
export function redactObject(obj: any, depth: number = 0): any {
    if (depth > 10) return '[MAX_DEPTH]'; // Prevent infinite recursion

    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return redactString(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => redactObject(item, depth + 1));
    }

    if (typeof obj === 'object') {
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(obj)) {
            // Check if this is a known PII field
            const isPIIField = PII_FIELD_NAMES.some(
                piiField => key.toLowerCase().includes(piiField.toLowerCase())
            );

            if (isPIIField && typeof value === 'string') {
                result[key] = maskString(value, 2);
            } else {
                result[key] = redactObject(value, depth + 1);
            }
        }

        return result;
    }

    return obj;
}

/**
 * Safe logger that redacts all PII
 */
export const safeLogger = {
    info: (message: string, data?: any) => {
        const safeMessage = redactString(message);
        const safeData = data ? redactObject(data) : undefined;
        console.log(`[INFO] ${safeMessage}`, safeData || '');
    },

    warn: (message: string, data?: any) => {
        const safeMessage = redactString(message);
        const safeData = data ? redactObject(data) : undefined;
        console.warn(`[WARN] ${safeMessage}`, safeData || '');
    },

    error: (message: string, error?: any, data?: any) => {
        const safeMessage = redactString(message);
        const safeData = data ? redactObject(data) : undefined;
        // Don't redact error stack trace, but redact error message
        const safeError = error?.message ? {
            ...error,
            message: redactString(error.message)
        } : error;
        console.error(`[ERROR] ${safeMessage}`, safeError || '', safeData || '');
    },

    debug: (message: string, data?: any) => {
        if (process.env.NODE_ENV !== 'development') return;
        const safeMessage = redactString(message);
        const safeData = data ? redactObject(data) : undefined;
        console.debug(`[DEBUG] ${safeMessage}`, safeData || '');
    }
};

/**
 * Sentry-safe error reporting (redacts PII before sending)
 */
export function safeSentryCapture(error: Error, context?: Record<string, any>): void {
    try {
        // Only import Sentry if needed
        const Sentry = require('@sentry/nextjs');

        // Redact error message
        const safeError = new Error(redactString(error.message));
        safeError.stack = error.stack; // Keep stack trace for debugging
        safeError.name = error.name;

        // Redact context
        const safeContext = context ? redactObject(context) : undefined;

        Sentry.captureException(safeError, { extra: safeContext });
    } catch {
        // Sentry not available, log locally
        safeLogger.error('Error captured', error);
    }
}
