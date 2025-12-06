/**
 * ReportModal Component Tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the moderation module
jest.mock('../../lib/moderation', () => ({
    reportProduct: jest.fn().mockResolvedValue({ success: true, message: 'Report submitted' }),
    REPORT_REASONS: {
        spam: { labelMn: 'Спам' },
        illegal: { labelMn: 'Хууль бус' },
        scam: { labelMn: 'Залилан' },
        other: { labelMn: 'Бусад' }
    }
}));

// Import after mock
import ReportModal from '../ReportModal';

describe('ReportModal', () => {
    const defaultProps = {
        productId: 'test-product-123',
        isOpen: true,
        onClose: jest.fn(),
        onReportSuccess: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders modal when isOpen is true', () => {
        render(<ReportModal {...defaultProps} />);
        expect(screen.getByText('Бүтээгдэхүүн мэдээлэх')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
        render(<ReportModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Бүтээгдэхүүн мэдээлэх')).not.toBeInTheDocument();
    });

    test('displays all report reasons', () => {
        render(<ReportModal {...defaultProps} />);
        expect(screen.getByText('Спам')).toBeInTheDocument();
        expect(screen.getByText('Хууль бус')).toBeInTheDocument();
        expect(screen.getByText('Залилан')).toBeInTheDocument();
        expect(screen.getByText('Бусад')).toBeInTheDocument();
    });

    test('submit button is disabled when no reason selected', () => {
        render(<ReportModal {...defaultProps} />);
        const submitButton = screen.getByText('Мэдээлэх').closest('button');
        expect(submitButton).toBeDisabled();
    });

    test('calls onClose when cancel button clicked', () => {
        render(<ReportModal {...defaultProps} />);
        fireEvent.click(screen.getByText('Болих'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('calls onClose when X button clicked', () => {
        render(<ReportModal {...defaultProps} />);
        const closeButton = screen.getByLabelText('Close report modal');
        fireEvent.click(closeButton);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
