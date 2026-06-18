import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { calculateEMI } from '@shared/utils/emi';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Slider from '@react-native-community/slider';
import { PieChart } from 'react-native-gifted-charts';
import { Calculator, IndianRupee } from 'lucide-react-native';
import { radius as tokenRadius, spacing } from '@shared/theme/tokens';

export interface EmiCalculatorProps {
  propertyPrice?: number;
}

function formatCurrency(amount: number) {
  if (!amount && amount !== 0) return '—';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(amount))}`;
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export default function EmiCalculator({ propertyPrice = 0 }: EmiCalculatorProps) {
  const { colors, isDark } = useTheme();

  // Input states
  const [price, setPrice] = useState<number>(propertyPrice || 0);
  const [downPaymentMode, setDownPaymentMode] = useState<'percent' | 'amount'>('percent');
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20); // 20% default
  const [downPaymentAmt, setDownPaymentAmt] = useState<number>(
    propertyPrice ? Math.round(propertyPrice * 0.2) : 0
  );
  const [tenure, setTenure] = useState<number>(20); // years
  const [interestRate, setInterestRate] = useState<number>(8.5); // %

  // Derived principal
  const downPayment = useMemo(() => {
    return downPaymentMode === 'percent'
      ? Math.round((price * downPaymentPct) / 100)
      : downPaymentAmt;
  }, [price, downPaymentMode, downPaymentPct, downPaymentAmt]);

  const principal = useMemo(() => {
    return Math.max(0, price - downPayment);
  }, [price, downPayment]);

  // EMI calculation
  const { emi, totalInterest, totalAmount } = useMemo(
    () => calculateEMI(principal, interestRate, tenure) as {
      emi: number;
      totalInterest: number;
      totalAmount: number;
    },
    [principal, interestRate, tenure]
  );

  // Chart data
  const pieData = useMemo(() => {
    const total = principal + totalInterest;
    if (total === 0) return [];
    return [
      {
        value: principal,
        color: colors.primary,
        text: `${Math.round((principal / total) * 100)}%`,
        label: 'Principal',
      },
      {
        value: totalInterest,
        color: colors.secondary,
        text: `${Math.round((totalInterest / total) * 100)}%`,
        label: 'Interest',
      },
    ];
  }, [principal, totalInterest, colors]);

  // Handlers
  const handlePriceChange = useCallback((text: string) => {
    const val = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    setPrice(val);
    setDownPaymentAmt(Math.round((val * downPaymentPct) / 100));
  }, [downPaymentPct]);

  const handleDownAmtChange = useCallback((text: string) => {
    const val = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    setDownPaymentAmt(val);
    setDownPaymentPct(price > 0 ? Math.round((val / price) * 100) : 0);
  }, [price]);

  const toggleDownPaymentMode = useCallback(() => {
    setDownPaymentMode((prev) => (prev === 'percent' ? 'amount' : 'percent'));
  }, []);

  return (
    <Card variant="glass" style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(43, 80, 255, 0.15)' : 'rgba(43, 80, 255, 0.08)' }]}>
          <Calculator size={18} color={colors.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>EMI & Mortgage Calculator</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Estimate your monthly payment before buying
          </Text>
        </View>
      </View>

      {/* Main Contents */}
      <View style={styles.content}>
        {/* Property Price */}
        <Input
          label="Property Price (₹)"
          value={price ? String(price) : ''}
          onChangeText={handlePriceChange}
          placeholder="Enter property price"
          keyboardType="numeric"
        />
        {price > 0 && (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {formatCurrency(price)}
          </Text>
        )}

        {/* Down Payment */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Down Payment</Text>
            <Pressable
              onPress={toggleDownPaymentMode}
              style={[styles.toggleBtn, { borderColor: colors.primary }]}
            >
              <Text style={[styles.toggleBtnText, { color: colors.primary }]}>
                Switch to {downPaymentMode === 'percent' ? '₹ Amount' : '% Percent'}
              </Text>
            </Pressable>
          </View>

          {downPaymentMode === 'percent' ? (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderValRow}>
                <Text style={[styles.sliderVal, { color: colors.textPrimary }]}>{downPaymentPct}%</Text>
                <Text style={[styles.sliderHint, { color: colors.textSecondary }]}>
                  {formatCurrency(downPayment)}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={90}
                step={1}
                value={downPaymentPct}
                onValueChange={setDownPaymentPct}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderRange}>
                <Text style={[styles.sliderRangeText, { color: colors.textSecondary }]}>0%</Text>
                <Text style={[styles.sliderRangeText, { color: colors.textSecondary }]}>90%</Text>
              </View>
            </View>
          ) : (
            <View>
              <Input
                value={downPaymentAmt ? String(downPaymentAmt) : ''}
                onChangeText={handleDownAmtChange}
                placeholder="Enter down payment amount"
                keyboardType="numeric"
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {downPaymentPct}% of property price
              </Text>
            </View>
          )}
        </View>

        {/* Loan Tenure */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Loan Tenure</Text>
          <View style={styles.sliderValRow}>
            <Text style={[styles.sliderVal, { color: colors.textPrimary }]}>{tenure} Years</Text>
            <Text style={[styles.sliderHint, { color: colors.textSecondary }]}>{tenure * 12} months</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={30}
            step={1}
            value={tenure}
            onValueChange={setTenure}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderRange}>
            <Text style={[styles.sliderRangeText, { color: colors.textSecondary }]}>5 yrs</Text>
            <Text style={[styles.sliderRangeText, { color: colors.textSecondary }]}>30 yrs</Text>
          </View>
        </View>

        {/* Interest Rate */}
        <Input
          label="Interest Rate (% per annum)"
          value={String(interestRate)}
          onChangeText={(text) => {
            const val = parseFloat(text) || 0;
            setInterestRate(Math.min(30, Math.max(0, val)));
          }}
          placeholder="e.g. 8.5"
          keyboardType="numeric"
        />

        {/* Loan Amount Summary */}
        <View style={[styles.loanAmountCard, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Text style={[styles.loanAmountLabel, { color: colors.textSecondary }]}>Loan Amount</Text>
          <Text style={[styles.loanAmountVal, { color: colors.primary }]}>{formatCurrency(principal)}</Text>
        </View>

        {/* Output Panel */}
        <View style={[styles.outputPanel, { backgroundColor: colors.primary }]}>
          <Text style={styles.outputLabel}>Monthly EMI</Text>
          <Text style={styles.outputVal}>{emi > 0 ? formatINR(emi) : '—'}</Text>
          {emi > 0 && <Text style={styles.outputSub}>per month for {tenure} years</Text>}
        </View>

        {/* Grid Breakdown */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Interest</Text>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {totalInterest > 0 ? formatCurrency(totalInterest) : '—'}
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Payable</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {totalAmount > 0 ? formatCurrency(totalAmount) : '—'}
            </Text>
          </View>
        </View>

        {/* Pie Chart Display */}
        {emi > 0 && pieData.length > 0 && (
          <View style={styles.chartSection}>
            <PieChart
              data={pieData}
              donut
              showText
              textColor="#fff"
              textSize={12}
              radius={80}
              innerRadius={50}
              innerCircleColor={colors.card}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={[styles.centerLabelVal, { color: colors.textPrimary }]}>
                    {Math.round((principal / (principal + totalInterest)) * 100)}%
                  </Text>
                  <Text style={[styles.centerLabelLbl, { color: colors.textSecondary }]}>Principal</Text>
                </View>
              )}
            />
            {/* Chart Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Principal ({formatCurrency(principal)})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Interest ({formatCurrency(totalInterest)})
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          * Indicative calculation only. Actual EMI may vary based on lender terms, credit score, and fee structure.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    gap: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleBtn: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sliderContainer: {
    marginVertical: 4,
  },
  sliderValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  sliderHint: {
    fontSize: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderRangeText: {
    fontSize: 10,
  },
  loanAmountCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  loanAmountLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  loanAmountVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  outputPanel: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  outputVal: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  outputSub: {
    color: 'white',
    fontSize: 11,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  chartSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 16,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  centerLabelLbl: {
    fontSize: 10,
  },
  legendContainer: {
    width: '100%',
    gap: 8,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    opacity: 0.7,
  },
});
