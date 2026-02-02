export const formatCurrency = (pence: number): string => {
  const value = typeof pence === "number" && !Number.isNaN(pence) ? pence : 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value / 100);
};
