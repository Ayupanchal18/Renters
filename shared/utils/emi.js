/**
 * Standard EMI formula:
 * EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 * where P = principal, R = monthly interest rate (annual/12/100), N = tenure in months
 * 
 * @param {number} principal - The principal loan amount
 * @param {number} annualRate - Annual interest rate in percentage (e.g. 8.5)
 * @param {number} tenureYears - Loan tenure in years
 * @returns {object} - { emi, totalInterest, totalAmount }
 */
export function calculateEMI(principal, annualRate, tenureYears) {
    if (!principal || principal <= 0 || !annualRate || annualRate <= 0 || !tenureYears) {
        return { emi: 0, totalInterest: 0, totalAmount: 0 };
    }
    const monthlyRate = annualRate / 12 / 100;
    const months = tenureYears * 12;
    const factor = Math.pow(1 + monthlyRate, months);
    const emi = (principal * monthlyRate * factor) / (factor - 1);
    const totalAmount = emi * months;
    const totalInterest = totalAmount - principal;
    return { emi, totalInterest, totalAmount };
}
