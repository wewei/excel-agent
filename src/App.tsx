import { Box, Paper } from '@mui/material';
import Editor from '@monaco-editor/react';
import ExcelSheet from './components/ExcelSheet';
import { useState } from 'react';

function App() {
  const [code, setCode] = useState('; 表格变更记录将显示在这里');

  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      gap: 2, 
      p: 2, 
      bgcolor: '#f5f5f5' 
    }}>
      {/* 左侧表格 */}
      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <ExcelSheet onChange={(changes) => {
          // 将变更转换为代码字符串
          const changeStr = changes.map(change => 
            `(change-cell ${change.row} ${change.col} ${JSON.stringify(change.before)} ${JSON.stringify(change.after)})`
          ).join('\n');
          setCode((code) => code + `\n${changeStr}`);
        }} />
      </Paper>

      {/* 右侧代码编辑器 */}
      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage="clojure"
          value={code}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            theme: 'vs-dark'
          }}
          theme="vs-dark"
        />
      </Paper>
    </Box>
  );
}

export default App;
