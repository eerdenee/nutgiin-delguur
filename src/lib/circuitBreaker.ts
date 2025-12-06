/**
 * CIRCUIT BREAKER - Payment System Resilience
 * 
 * Problem: QPay goes down during Tsagaan Sar. Users click "Buy VIP" 
 *          but get errors. They rage-post on Facebook.
 * Solution: Auto-detect failures and offer alternatives.
 */

import { supabase } from './supabase';

// Circuit Breaker States
type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
    failureThreshold: number;    // Failures before opening
    successThreshold: number;    // Successes before closing
    timeout: number;             // Time before trying again (ms)
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000 // 30 seconds
};

// In-memory state (would use Redis in production)
const circuitStates: Map<string, {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailure: number;
}> = new Map();

/**
 * Check if a service is available
 */
export function isServiceAvailable(serviceName: string): boolean {
    const circuit = circuitStates.get(serviceName);

    if (!circuit) return true; // Default: available

    if (circuit.state === 'closed') return true;

    if (circuit.state === 'open') {
        // Check if timeout has passed
        if (Date.now() - circuit.lastFailure > DEFAULT_CONFIG.timeout) {
            // Move to half-open
            circuit.state = 'half-open';
            return true; // Allow one try
        }
        return false;
    }

    // Half-open: allow trial
    return true;
}

/**
 * Record a failure
 */
export function recordFailure(serviceName: string): void {
    let circuit = circuitStates.get(serviceName);

    if (!circuit) {
        circuit = { state: 'closed', failures: 0, successes: 0, lastFailure: 0 };
        circuitStates.set(serviceName, circuit);
    }

    circuit.failures++;
    circuit.lastFailure = Date.now();
    circuit.successes = 0;

    if (circuit.failures >= DEFAULT_CONFIG.failureThreshold) {
        circuit.state = 'open';
        console.warn(`[CircuitBreaker] ${serviceName} circuit OPENED after ${circuit.failures} failures`);
    }
}

/**
 * Record a success
 */
export function recordSuccess(serviceName: string): void {
    const circuit = circuitStates.get(serviceName);

    if (!circuit) return;

    circuit.successes++;
    circuit.failures = 0;

    if (circuit.state === 'half-open' && circuit.successes >= DEFAULT_CONFIG.successThreshold) {
        circuit.state = 'closed';
        console.log(`[CircuitBreaker] ${serviceName} circuit CLOSED after recovery`);
    }
}

// ============================================
// PAYMENT CIRCUIT BREAKER
// ============================================

export interface PaymentResult {
    success: boolean;
    fallbackUsed: boolean;
    message: string;
    transactionId?: string;
    manualInstructions?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
        amount: number;
        reference: string;
    };
}

/**
 * Process payment with fallback
 */
export async function processPaymentWithFallback(
    userId: string,
    amount: number,
    purpose: 'vip' | 'boost' | 'subscription',
    primaryMethod: 'qpay' | 'socialpay' = 'qpay'
): Promise<PaymentResult> {
    const serviceName = `payment_${primaryMethod}`;

    // Check if primary payment is available
    if (!isServiceAvailable(serviceName)) {
        // Skip to fallback immediately
        return await manualPaymentFallback(userId, amount, purpose);
    }

    try {
        // Try primary payment
        const result = await attemptPayment(primaryMethod, amount, purpose);

        if (result.success) {
            recordSuccess(serviceName);
            return {
                success: true,
                fallbackUsed: false,
                message: 'Төлбөр амжилттай!',
                transactionId: result.transactionId
            };
        }

        // Payment failed
        recordFailure(serviceName);

        // Try fallback
        return await manualPaymentFallback(userId, amount, purpose);

    } catch (error) {
        recordFailure(serviceName);

        // Return graceful fallback
        return await manualPaymentFallback(userId, amount, purpose);
    }
}

/**
 * Attempt payment through provider
 */
async function attemptPayment(
    method: 'qpay' | 'socialpay',
    amount: number,
    purpose: string
): Promise<{ success: boolean; transactionId?: string }> {
    // Placeholder for actual payment integration
    // In production, call QPay/SocialPay API here

    // Simulate occasional failure
    if (Math.random() < 0.1) {
        throw new Error('Payment provider timeout');
    }

    return {
        success: true,
        transactionId: `TXN_${Date.now()}`
    };
}

/**
 * Manual payment fallback
 */
async function manualPaymentFallback(
    userId: string,
    amount: number,
    purpose: string
): Promise<PaymentResult> {
    // Generate reference code
    const reference = `ND${Date.now().toString(36).toUpperCase()}`;

    // Store pending payment
    await supabase.from('pending_payments').insert({
        user_id: userId,
        amount,
        purpose,
        reference,
        status: 'pending',
        created_at: new Date().toISOString()
    });

    return {
        success: false,
        fallbackUsed: true,
        message: 'Банкны систем ачаалалтай байна. Гар аргаар шилжүүлнэ үү.',
        manualInstructions: {
            bankName: 'Хаан Банк',
            accountNumber: '5012345678',
            accountName: 'Нутгийн Дэлгүүр ХХК',
            amount: amount,
            reference: reference
        }
    };
}

/**
 * Get payment status message
 */
export function getPaymentStatusUI(): {
    available: boolean;
    message: string;
    alternativeText?: string;
} {
    const qpayAvailable = isServiceAvailable('payment_qpay');

    if (qpayAvailable) {
        return {
            available: true,
            message: 'Төлбөрийн систем хэвийн ажиллаж байна'
        };
    }

    return {
        available: false,
        message: 'Банкны систем ачаалалтай байна',
        alternativeText: 'Та гар аргаар шилжүүлэх эсвэл сүүлд дахин оролдоно уу'
    };
}
