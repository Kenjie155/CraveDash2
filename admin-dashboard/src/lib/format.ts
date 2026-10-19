export const peso = (n: number | string) =>
  `₱${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
