import { Paper, Box, AppBar, Toolbar, Typography, Button, Divider } from "@mui/material";
import MonacoEditor from "@monaco-editor/react";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useState } from "react";

export type EditorProps = {
  code: string | undefined;
  onChange?: (code: string | undefined) => void;
  onExecute?: (code: string) => Promise<any>;
}

export default function Editor({ code, onChange, onExecute }: EditorProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // 执行代码
  const handleExecute = async () => {
    if (!code || !onExecute) return;
    
    setIsExecuting(true);
    setLogs(prev => [...prev, `正在执行代码...`]);
    
    try {
      const result = await onExecute(code);
      console.log(result);
      setLogs(prev => [...prev, `执行成功:`, ...result.map((r: any) => r.toString())]);
    } catch (error) {
      setLogs(prev => [...prev, `执行错误: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  // 清除日志
  const clearLogs = () => setLogs([]);

  return (
    <Paper sx={{ 
      flex: 1, 
      overflow: "hidden", 
      display: "flex", 
      flexDirection: "column", 
      height: "100%" 
    }}>
      {/* 顶部工具栏 */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar variant="dense">
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            代码编辑器
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleExecute} 
            disabled={isExecuting || !code}
            startIcon={<PlayArrowIcon />}
          >
            执行代码
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={clearLogs} 
            disabled={logs.length === 0}
            sx={{ ml: 1 }}
          >
            清除日志
          </Button>
        </Toolbar>
      </AppBar>

      {/* 中间编辑器区域 */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <MonacoEditor
          height="100%"
          defaultLanguage="scheme"
          value={code || ""}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            theme: "vs-dark",
          }}
          onChange={onChange}
          theme="vs-dark"
        />
      </Box>

      {/* 下部日志区域 */}
      <Divider />
      <Box 
        sx={{ 
          height: "120px", 
          overflow: "auto", 
          bgcolor: "#1e1e1e", 
          color: "#d4d4d4",
          p: 1,
          fontFamily: "monospace",
          fontSize: "0.875rem",
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          执行日志:
        </Typography>
        {logs.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#6e6e6e", fontStyle: "italic" }}>
            尚无日志...
          </Typography>
        ) : (
          logs.map((log, index) => (
            <Box key={index} sx={{ mb: 0.5, whiteSpace: "pre-wrap" }}>
              {log}
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}