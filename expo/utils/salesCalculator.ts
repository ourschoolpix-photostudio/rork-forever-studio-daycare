import type { Sale, PhotoSession } from '@/context/DataContext';

/**
 * Calculate the total for a specific sales type (early-bird or regular)
 * Includes tax and applies discount
 */
export function calculateSalesTypeTotal(
  sales: Sale[],
  type: 'early-bird' | 'regular',
  discount: number = 0,
  taxRate: number = 0.06
): number {
  const subtotal = sales
    .filter((s) => s.type === type)
    .reduce((sum, sale) => sum + (sale.total_price || 0), 0);

  const withTax = subtotal * (1 + taxRate);
  const withDiscount = withTax - discount;

  return Math.max(0, withDiscount);
}

/**
 * Calculate the grand total for an entire session
 * Combines early-bird and regular sales, applies tax, shipping, and discounts
 */
export function calculateSessionGrandTotal(
  sales: Sale[],
  session: PhotoSession,
  taxRate: number = 0.06
): number {
  const subtotal = sales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);
  const tax = subtotal * taxRate;
  const shipping = session.shipping || 0;
  const earlyBirdDiscount = session.early_bird_discount || 0;
  const regularDiscount = session.regular_discount || 0;
  const grandTotal = subtotal + tax + shipping - earlyBirdDiscount - regularDiscount;

  return grandTotal;
}

/**
 * Get subtotal (before tax and discount) for a sales type
 */
export function calculateSalesTypeSubtotal(
  sales: Sale[],
  type: 'early-bird' | 'regular'
): number {
  return sales
    .filter((s) => s.type === type)
    .reduce((sum, sale) => sum + (sale.total_price || 0), 0);
}

/**
 * Get tax amount for a sales type
 */
export function calculateSalesTypeTax(
  sales: Sale[],
  type: 'early-bird' | 'regular',
  taxRate: number = 0.06
): number {
  const subtotal = calculateSalesTypeSubtotal(sales, type);
  return subtotal * taxRate;
}

/**
 * Calculate total production cost for a session
 * Formula: sum of (quantity × cost) for all items
 */
export function calculateSessionProductionCost(sales: Sale[]): number {
  return sales.reduce((sum, sale) => {
    const itemCost = (sale.quantity || 0) * (sale.cost || 0);
    return sum + itemCost;
  }, 0);
}

export interface ExpenseData {
  daycareExpenses: number;
  photographerCost: number;
}

/**
 * Calculate total expenses for a session
 * Single source of truth for expense calculation
 */
export function calculateSessionTotalExpenses(
  sales: Sale[],
  session: PhotoSession,
  expenseData: ExpenseData
): number {
  const productionCost = calculateSessionProductionCost(sales);
  const shippingExpense = session.shipping || 0;
  const { daycareExpenses, photographerCost } = expenseData;
  
  return daycareExpenses + productionCost + shippingExpense + photographerCost;
}

/**
 * Calculate net profit for a session
 * Single source of truth for profit calculation
 */
export function calculateSessionNetProfit(
  sales: Sale[],
  session: PhotoSession,
  expenseData: ExpenseData,
  taxRate: number = 0.06
): number {
  const grandTotal = calculateSessionGrandTotal(sales, session, taxRate);
  const totalExpenses = calculateSessionTotalExpenses(sales, session, expenseData);
  
  return grandTotal - totalExpenses;
}
