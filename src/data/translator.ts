import { SheetData } from "./sheetData";
import { createList, createMap, createMultiArityDefn, createAtom, createSymbol, generateCode } from "./tinyLisp";

// Translate the sheetData into Lisp code (in Clojure)
export function toLisp(sheetData: SheetData): string {
  return generateCode(
    createMultiArityDefn("sheet", [
      {
        params: ["cells"],
        body: [
          createList(
            sheetData.cells.map((cell) =>
              createMap([
                [createSymbol("row"), createAtom(cell.row, "number")],
                [createSymbol("col"), createAtom(cell.col, "number")],
                [createSymbol("value"), createAtom(cell.value, "string")],
              ])
            )
          ),
        ],
      },
    ])
  );
}
