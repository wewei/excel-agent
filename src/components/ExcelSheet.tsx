import { HotTable } from '@handsontable/react-wrapper';
import 'handsontable/dist/handsontable.full.min.css';
import { registerAllModules } from 'handsontable/registry';
import HyperFormula from 'hyperformula';
import { CellChange } from '../data/sheetData';

registerAllModules();

const initialData: string[][] = Array.from({ length: 100 }, () => Array(10).fill(''));

export type ExcelSheetProps = {
  onChange: (changes: CellChange[]) => void;
}

export default function ExcelSheet({
  onChange,
}: ExcelSheetProps) {
  return (
    <HotTable
      afterChange={(changes) => {
        if (changes) {
          onChange(changes.map((change) => ({
            row: change[0],
            col: change[1] as number,
            before: change[2] as string,
            after: change[3] as string,
          })));
        }
      }}
      data={initialData}
      formulas={{ engine: HyperFormula }}
      stretchH="all"
      width={"100%"}
      height={"100%"}
      rowHeaders={true}
      colHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
}