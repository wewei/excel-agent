import { SheetData } from "./sheetData";

// Translate the sheetData into Lisp code (in Scheme)
export function toLisp(sheetData: SheetData): string {
  return `(sheet ${sheetData.cells.map(cell => `(cell ${cell.row} ${cell.col} "${cell.value}")`).join(" ")})`;
}
