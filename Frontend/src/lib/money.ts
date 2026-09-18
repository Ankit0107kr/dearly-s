/** All money is handled in paise (integer) and only formatted at the edge. */
const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatMoney = (paise: number) => formatter.format(paise / 100);

export const formatMoneyExact = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);

export const discountPercent = (price: number, compareAt?: number) =>
  compareAt && compareAt > price
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : 0;
