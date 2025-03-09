import { SheetData } from "./sheetData";

// Translate the sheetData into Lisp code (in Clojure)
export function toLisp(sheetData: SheetData): string {
  // 将单元格数据转换为 Clojure map 格式
  const cellsToClojure = sheetData.cells.map((cell) => {
    // 对值进行转义,处理特殊字符
    const escapedValue = cell.value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");

    return `  {:row ${cell.row}, :col ${cell.col}, :value "${escapedValue}"}`;
  });

  // 构建格式化的 Clojure 代码
  const clojureCode = `(def cells
    [${cellsToClojure.length ? "\n" + cellsToClojure.join("\n") + "\n]" : "])"}

    (def sheet {:cells cells})`;
  return clojureCode;
}
