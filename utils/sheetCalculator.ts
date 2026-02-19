interface SheetSize {
  size: string;
  qty: string | number;
}

export const calculateTotalSheets = (
  sheetSizes: SheetSize[] | undefined,
  numberOfPoses: number | undefined,
  packageType: string | undefined
): string => {
  if (!sheetSizes || !packageType) return '0';

  const qty8x10 = parseFloat(String(sheetSizes[0]?.qty)) || 0;
  const qty5x7 = parseFloat(String(sheetSizes[1]?.qty)) || 0;
  const qty3_5x5 = parseFloat(String(sheetSizes[2]?.qty)) || 0;
  const qtyWallets = parseFloat(String(sheetSizes[3]?.qty)) || 0;

  const sheetsPerImage = (qty8x10 / 1) + (qty5x7 / 2) + (qty3_5x5 / 4) + (qtyWallets / 8);
  const poses = packageType === 'multi-pose' ? (numberOfPoses || 1) : 1;
  const totalSheets = sheetsPerImage * poses;

  if (totalSheets === 0) return '0';

  return Number.isInteger(totalSheets) ? totalSheets.toString() : totalSheets.toFixed(1);
};
