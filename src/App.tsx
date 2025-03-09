import { Box, Paper } from "@mui/material";
import ExcelSheet from "./components/ExcelSheet";
import { useEffect, useState } from "react";
import { SheetData, updateCells } from "./data/sheetData";
import { toLisp } from "./data/translator";
import Editor from "./components/Editor";
import { runCode } from "./data/runner";

function App() {
  const [sheetData, setSheetData] = useState<SheetData>({
    cells: [],
  });
  const [code, setCode] = useState<string | undefined>(toLisp(sheetData));

  useEffect(() => {
    setCode(toLisp(sheetData));
  }, [sheetData]); 

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: "#f5f5f5",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* 左侧表格 */}
      <Paper sx={{ flex: 1, overflow: "hidden" }}>
        <ExcelSheet
          onChange={(changes) => {
            setSheetData(updateCells(changes)(sheetData));
          }}
        />
      </Paper>

      {/* 右侧代码编辑器 */}
      <Editor
        code={code}
        onChange={(code) => {
          setCode(code);
        }}
        onExecute={(code) => {
          return runCode(code);
        }}
      />
    </Box>
  );
}

export default App;
