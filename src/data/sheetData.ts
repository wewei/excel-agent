export type CellData = {
  col: number;
  row: number;
  value: string;
};

export type SheetData = {
  cells: CellData[];
};

export type CellChange = {
  row: number;
  col: number;
  before: string;
  after: string;
};

export const updateCells = (changes: CellChange[]) => (sheetData: SheetData) => {
  const unhandledChanges = [...changes];
  const cells = sheetData.cells.map((cell) => {
    const idx = unhandledChanges.findIndex(
      (change) => change.col === cell.col && change.row === cell.row
    );
    if (idx !== -1) {
      const change = unhandledChanges[idx];
      unhandledChanges.splice(idx, 1);
      return { ...cell, value: change.after };
    }
    return cell;
  });
  unhandledChanges.forEach(({ col, row, after }) => {
    cells.push({ col, row, value: after });
  });
  return { cells };
};
