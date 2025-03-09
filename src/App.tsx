import { Box, Paper } from "@mui/material";
import Editor from "@monaco-editor/react";
import ExcelSheet from "./components/ExcelSheet";
import { useState } from "react";
import { SheetData, updateCells } from "./data/sheetData";
import { toLisp } from "./data/translator";

function App() {
  const [sheetData, setSheetData] = useState<SheetData>({
    cells: [],
  });

  return (
    <Box
      sx={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        gap: 2,
        p: 2,
        bgcolor: "#f5f5f5",
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
      <Paper sx={{ flex: 1, overflow: "hidden" }}>
        <Editor
          height="100%"
          defaultLanguage="clojure"
          value={toLisp(sheetData)}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            theme: "vs-dark",
          }}
          theme="vs-dark"
        />
      </Paper>
    </Box>
  );
}

export default App;
