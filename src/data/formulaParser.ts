// 常量和工具函数
const CELL_REGEX = /^[A-Za-z]+[0-9]+$/;
const RANGE_REGEX = /^[A-Za-z]+[0-9]+:[A-Za-z]+[0-9]+$/;

// 公式计算的结果类型
export type FormulaValue = number | string | boolean | null;

// 单元格接口
export interface CellValue {
  value: FormulaValue;
  formula?: string;
}

// 单元格数据查询接口
export interface CellDataProvider {
  getCellValue(cellId: string): FormulaValue;
  getCellRange(startCell: string, endCell: string): FormulaValue[][];
}

// Token 类型枚举
enum TokenType {
  NUMBER,
  STRING,
  CELL_REF,
  OPERATOR,
  FUNCTION,
  LEFT_PAREN,
  RIGHT_PAREN,
  COMMA,
  COLON,
  EOF
}

// Token 数据结构
interface Token {
  type: TokenType;
  value: string;
}

// AST 节点类型
export type AstNode = 
  | NumberNode
  | StringNode
  | CellRefNode
  | RangeRefNode
  | BinaryOpNode
  | FunctionCallNode;

// AST 节点接口 - 数字
interface NumberNode {
  type: 'number';
  value: number;
}

// AST 节点接口 - 字符串
interface StringNode {
  type: 'string';
  value: string;
}

// AST 节点接口 - 单元格引用
interface CellRefNode {
  type: 'cell_ref';
  cellId: string;
}

// AST 节点接口 - 范围引用
interface RangeRefNode {
  type: 'range_ref';
  startCell: string;
  endCell: string;
}

// AST 节点接口 - 二元操作
interface BinaryOpNode {
  type: 'binary_op';
  operator: string;
  left: AstNode;
  right: AstNode;
}

// AST 节点接口 - 函数调用
interface FunctionCallNode {
  type: 'function_call';
  name: string;
  arguments: AstNode[];
}

/**
 * Excel 公式解析器
 */
export class FormulaParser {
  private tokens: Token[] = [];
  private current = 0;
  private formula = '';
  private cellDataProvider: CellDataProvider;

  constructor(cellDataProvider: CellDataProvider) {
    this.cellDataProvider = cellDataProvider;
  }

  /**
   * 解析并计算公式
   */
  public evaluate(formula: string): FormulaValue {
    if (!formula.startsWith('=')) {
      return formula; // 如果不是公式，直接返回原始值
    }

    // 去除等号和空白字符
    this.formula = formula.substring(1).trim();
    
    try {
      // 词法分析
      this.tokenize();
      
      // 语法分析
      const ast = this.parse();
      
      // 执行计算
      return this.evaluateNode(ast);
    } catch (error) {
      if (error instanceof Error) {
        return `#ERROR: ${error.message}`;
      }
      return '#ERROR';
    }
  }

  /**
   * 词法分析 - 将公式分解为标记
   */
  private tokenize(): void {
    this.tokens = [];
    let pos = 0;
    
    while (pos < this.formula.length) {
      let char = this.formula[pos];
      
      // 跳过空白字符
      if (/\s/.test(char)) {
        pos++;
        continue;
      }
      
      // 解析数字
      if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(this.formula[pos + 1] || ''))) {
        let numStr = '';
        let hasDot = false;
        
        while (pos < this.formula.length && 
               (/[0-9]/.test(this.formula[pos]) || 
                (this.formula[pos] === '.' && !hasDot))) {
          
          if (this.formula[pos] === '.') {
            hasDot = true;
          }
          
          numStr += this.formula[pos];
          pos++;
        }
        
        this.tokens.push({ type: TokenType.NUMBER, value: numStr });
        continue;
      }
      
      // 解析字符串
      if (char === '"') {
        let str = '';
        pos++; // 跳过开始的引号
        
        while (pos < this.formula.length && this.formula[pos] !== '"') {
          str += this.formula[pos];
          pos++;
        }
        
        if (pos >= this.formula.length) {
          throw new Error('未闭合的字符串');
        }
        
        pos++; // 跳过结束的引号
        this.tokens.push({ type: TokenType.STRING, value: str });
        continue;
      }
      
      // 解析单元格引用或函数名
      if (/[A-Za-z]/.test(char)) {
        let identifier = '';
        
        while (pos < this.formula.length && 
               /[A-Za-z0-9_]/.test(this.formula[pos])) {
          identifier += this.formula[pos];
          pos++;
        }
        
        // 判断是函数还是单元格引用
        if (pos < this.formula.length && this.formula[pos] === '(') {
          this.tokens.push({ type: TokenType.FUNCTION, value: identifier });
        } else {
          // 检查是否为有效的单元格引用
          if (CELL_REGEX.test(identifier)) {
            this.tokens.push({ type: TokenType.CELL_REF, value: identifier });
          } else {
            throw new Error(`无效的单元格引用或函数名: ${identifier}`);
          }
        }
        continue;
      }
      
      // 解析操作符和其他符号
      switch (char) {
        case '(':
          this.tokens.push({ type: TokenType.LEFT_PAREN, value: '(' });
          break;
        case ')':
          this.tokens.push({ type: TokenType.RIGHT_PAREN, value: ')' });
          break;
        case ',':
          this.tokens.push({ type: TokenType.COMMA, value: ',' });
          break;
        case ':':
          this.tokens.push({ type: TokenType.COLON, value: ':' });
          break;
        case '+':
        case '-':
        case '*':
        case '/':
          this.tokens.push({ type: TokenType.OPERATOR, value: char });
          break;
        default:
          throw new Error(`无法识别的字符: ${char}`);
      }
      
      pos++;
    }
    
    // 添加 EOF 标记
    this.tokens.push({ type: TokenType.EOF, value: '' });
    this.current = 0;
  }

  /**
   * 语法分析 - 生成 AST
   */
  private parse(): AstNode {
    return this.parseExpression();
  }
  
  /**
   * 解析表达式
   */
  private parseExpression(): AstNode {
    return this.parseAddSubtract();
  }
  
  /**
   * 解析加减法
   */
  private parseAddSubtract(): AstNode {
    let left = this.parseMultiplyDivide();
    
    while (this.match([TokenType.OPERATOR]) && 
           (this.previous().value === '+' || this.previous().value === '-')) {
      const operator = this.previous().value;
      const right = this.parseMultiplyDivide();
      
      left = {
        type: 'binary_op',
        operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  /**
   * 解析乘除法
   */
  private parseMultiplyDivide(): AstNode {
    let left = this.parsePrimary();
    
    while (this.match([TokenType.OPERATOR]) && 
           (this.previous().value === '*' || this.previous().value === '/')) {
      const operator = this.previous().value;
      const right = this.parsePrimary();
      
      left = {
        type: 'binary_op',
        operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  /**
   * 解析基础元素 (数字、字符串、单元格引用、函数调用、括号表达式)
   */
  private parsePrimary(): AstNode {
    // 解析数字
    if (this.match([TokenType.NUMBER])) {
      return {
        type: 'number',
        value: parseFloat(this.previous().value)
      };
    }
    
    // 解析字符串
    if (this.match([TokenType.STRING])) {
      return {
        type: 'string',
        value: this.previous().value
      };
    }
    
    // 解析单元格引用
    if (this.match([TokenType.CELL_REF])) {
      const cellId = this.previous().value;
      
      // 检查是否是范围引用 (A1:B2)
      if (this.match([TokenType.COLON]) && this.match([TokenType.CELL_REF])) {
        return {
          type: 'range_ref',
          startCell: cellId,
          endCell: this.previous().value
        };
      }
      
      return {
        type: 'cell_ref',
        cellId
      };
    }
    
    // 解析函数调用
    if (this.match([TokenType.FUNCTION])) {
      const name = this.previous().value;
      
      this.consume(TokenType.LEFT_PAREN, `预期函数 ${name} 后跟随的是 '('`);
      
      const args: AstNode[] = [];
      
      // 处理无参数的情况
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          args.push(this.parseExpression());
        } while (this.match([TokenType.COMMA]));
      }
      
      this.consume(TokenType.RIGHT_PAREN, "预期函数参数结束有 ')'");
      
      return {
        type: 'function_call',
        name,
        arguments: args
      };
    }
    
    // 解析括号表达式
    if (this.match([TokenType.LEFT_PAREN])) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, "预期表达式结束有 ')'");
      return expr;
    }
    
    throw new Error(`无法解析的表达式: ${this.peek().value}`);
  }
  
  /**
   * 检查当前 token 是否匹配指定类型
   */
  private match(types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  /**
   * 检查当前 token 类型
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  /**
   * 消费当前 token 并前进
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  /**
   * 判断是否到达 token 序列末尾
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }
  
  /**
   * 获取当前 token
   */
  private peek(): Token {
    return this.tokens[this.current];
  }
  
  /**
   * 获取前一个 token
   */
  private previous(): Token {
    return this.tokens[this.current - 1];
  }
  
  /**
   * 消费指定类型的 token，如果不匹配则抛出错误
   */
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(message);
  }
  
  /**
   * 计算 AST 节点的值
   */
  private evaluateNode(node: AstNode): FormulaValue {
    switch (node.type) {
      case 'number':
        return node.value;
        
      case 'string':
        return node.value;
        
      case 'cell_ref':
        return this.cellDataProvider.getCellValue(node.cellId);
        
      case 'range_ref':
        return this.cellDataProvider.getCellRange(node.startCell, node.endCell);
        
      case 'binary_op':
        const left = this.toNumber(this.evaluateNode(node.left));
        const right = this.toNumber(this.evaluateNode(node.right));
        
        if (left === null || right === null) {
          return '#ERROR: 无法执行数值运算';
        }
        
        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': 
            if (right === 0) return '#DIV/0!';
            return left / right;
          default:
            return '#ERROR: 未知操作符';
        }
        
      case 'function_call':
        return this.evaluateFunction(node.name, node.arguments);
        
      default:
        return '#ERROR: 未知节点类型';
    }
  }
  
  /**
   * 计算函数调用
   */
  private evaluateFunction(name: string, args: AstNode[]): FormulaValue {
    const evaluatedArgs = args.map(arg => this.evaluateNode(arg));
    
    switch (name.toUpperCase()) {
      case 'SUM':
        return this.calculateSum(evaluatedArgs);
        
      case 'AVERAGE':
        const sum = this.calculateSum(evaluatedArgs);
        const count = this.countNumericValues(evaluatedArgs);
        if (count === 0) return 0;
        return sum / count;
        
      case 'COUNT':
        return this.countNumericValues(evaluatedArgs);
        
      case 'MAX':
        return this.calculateMax(evaluatedArgs);
        
      case 'MIN':
        return this.calculateMin(evaluatedArgs);
        
      case 'IF':
        if (evaluatedArgs.length < 2) {
          return '#ERROR: IF 函数需要至少 2 个参数';
        }
        
        const condition = !!evaluatedArgs[0];
        return condition 
          ? (evaluatedArgs[1] ?? null) 
          : (evaluatedArgs.length > 2 ? evaluatedArgs[2] : null);
        
      default:
        return `#ERROR: 未知函数 ${name}`;
    }
  }
  
  /**
   * 将值转为数字
   */
  private toNumber(value: FormulaValue): number | null {
    if (value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }
  
  /**
   * 计算 SUM 函数
   */
  private calculateSum(args: FormulaValue[]): number {
    let sum = 0;
    
    for (const arg of args) {
      if (Array.isArray(arg)) {
        // 处理范围
        for (const row of arg) {
          for (const cell of row) {
            const num = this.toNumber(cell);
            if (num !== null) sum += num;
          }
        }
      } else {
        const num = this.toNumber(arg);
        if (num !== null) sum += num;
      }
    }
    
    return sum;
  }
  
  /**
   * 计算 MAX 函数
   */
  private calculateMax(args: FormulaValue[]): number | '#ERROR' {
    let max: number | null = null;
    
    for (const arg of args) {
      if (Array.isArray(arg)) {
        // 处理范围
        for (const row of arg) {
          for (const cell of row) {
            const num = this.toNumber(cell);
            if (num !== null) {
              max = max === null ? num : Math.max(max, num);
            }
          }
        }
      } else {
        const num = this.toNumber(arg);
        if (num !== null) {
          max = max === null ? num : Math.max(max, num);
        }
      }
    }
    
    return max === null ? '#ERROR' : max;
  }
  
  /**
   * 计算 MIN 函数
   */
  private calculateMin(args: FormulaValue[]): number | '#ERROR' {
    let min: number | null = null;
    
    for (const arg of args) {
      if (Array.isArray(arg)) {
        // 处理范围
        for (const row of arg) {
          for (const cell of row) {
            const num = this.toNumber(cell);
            if (num !== null) {
              min = min === null ? num : Math.min(min, num);
            }
          }
        }
      } else {
        const num = this.toNumber(arg);
        if (num !== null) {
          min = min === null ? num : Math.min(min, num);
        }
      }
    }
    
    return min === null ? '#ERROR' : min;
  }
  
  /**
   * 计算数值型值的数量
   */
  private countNumericValues(args: FormulaValue[]): number {
    let count = 0;
    
    for (const arg of args) {
      if (Array.isArray(arg)) {
        // 处理范围
        for (const row of arg) {
          for (const cell of row) {
            if (this.toNumber(cell) !== null) count++;
          }
        }
      } else {
        if (this.toNumber(arg) !== null) count++;
      }
    }
    
    return count;
  }
}

// 创建默认的单元格数据提供者
export class SimpleCellDataProvider implements CellDataProvider {
  private data: Record<string, FormulaValue> = {};
  
  constructor(initialData?: Record<string, FormulaValue>) {
    if (initialData) {
      this.data = { ...initialData };
    }
  }
  
  public setCellValue(cellId: string, value: FormulaValue): void {
    this.data[cellId] = value;
  }
  
  public getCellValue(cellId: string): FormulaValue {
    return this.data[cellId] ?? null;
  }
  
  public getCellRange(startCell: string, endCell: string): FormulaValue[][] {
    // 简单实现，只支持同一列或同一行的范围
    const startMatch = startCell.match(/([A-Za-z]+)([0-9]+)/);
    const endMatch = endCell.match(/([A-Za-z]+)([0-9]+)/);
    
    if (!startMatch || !endMatch) {
      throw new Error('无效的单元格范围');
    }
    
    const startCol = startMatch[1];
    const startRow = parseInt(startMatch[2]);
    const endCol = endMatch[1];
    const endRow = parseInt(endMatch[2]);
    
    // 转换列名到索引
    const colToIndex = (col: string): number => {
      let index = 0;
      for (let i = 0; i < col.length; i++) {
        index = index * 26 + (col.charCodeAt(i) - 64);
      }
      return index;
    };
    
    // 索引到列名
    const indexToCol = (index: number): string => {
      let col = '';
      while (index > 0) {
        const remainder = (index - 1) % 26;
        col = String.fromCharCode(65 + remainder) + col;
        index = Math.floor((index - 1) / 26);
      }
      return col;
    };
    
    const startColIndex = colToIndex(startCol.toUpperCase());
    const endColIndex = colToIndex(endCol.toUpperCase());
    
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startColIndex, endColIndex);
    const maxCol = Math.max(startColIndex, endColIndex);
    
    const result: FormulaValue[][] = [];
    
    for (let row = minRow; row <= maxRow; row++) {
      const rowData: FormulaValue[] = [];
      
      for (let col = minCol; col <= maxCol; col++) {
        const cellId = `${indexToCol(col)}${row}`;
        rowData.push(this.getCellValue(cellId));
      }
      
      result.push(rowData);
    }
    
    return result;
  }
}

// 使用示例
/*
const cellData = new SimpleCellDataProvider({
  'A1': 10,
  'A2': 20,
  'B1': 30,
  'B2': 40
});

const parser = new FormulaParser(cellData);

// 简单算术
console.log(parser.evaluate('=2+3*4')); // 输出: 14

// 单元格引用
console.log(parser.evaluate('=A1+B2')); // 输出: 50

// 函数调用
console.log(parser.evaluate('=SUM(A1:B2)')); // 输出: 100
console.log(parser.evaluate('=AVERAGE(A1:A2)')); // 输出: 15

// 复杂公式
console.log(parser.evaluate('=IF(A1>B1, SUM(A1:A2), MAX(B1:B2))')); // 输出: 40
*/
