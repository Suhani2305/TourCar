/**
 * Formats a number into a shorthand string (e.g., 2000 -> 2k, 2500000 -> 2.5m)
 * @param {number} amount - The number to format
 * @returns {string} - The formatted shorthand string
 */
export const formatShorthand = (amount) => {
    if (!amount || isNaN(amount)) return '0';

    if (amount >= 1e9) {
        return (amount / 1e9).toFixed(1).replace(/\.0$/, '') + 'b';
    }
    if (amount >= 1e6) {
        return (amount / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (amount >= 1000) {
        return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return amount.toString();
};

/**
 * Formats a number into a shorthand currency string (e.g., 2000 -> ₹2k)
 * @param {number} amount - The number to format
 * @returns {string} - The formatted currency shorthand string
 */
export const formatCurrencyShorthand = (amount) => {
    return '₹' + formatShorthand(amount);
};
