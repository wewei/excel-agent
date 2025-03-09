// Clojure 语法树的基础节点类型
export type ClojureNode = 
  | AtomNode 
  | SymbolNode 
  | ListNode 
  | VectorNode 
  | MapNode 
  | SetNode;

// 函数参数类型
export interface FnParam {
  name: string;
  destructured?: boolean;
  rest?: boolean;
}

// 基础节点接口
export interface BaseNode {
  type: string;
}

// 原子类型 (数字、字符串、布尔值等)
export interface AtomNode extends BaseNode {
  type: 'atom';
  value: string | number | boolean | null;
  valueType: 'string' | 'number' | 'boolean' | 'nil' | 'keyword';
}

// 符号类型 (变量名、函数名等)
export interface SymbolNode extends BaseNode {
  type: 'symbol';
  name: string;
  namespace?: string; // 命名空间 (如 clojure.core/map 中的 clojure.core)
}

// 列表类型 (函数调用、特殊形式等)
export interface ListNode extends BaseNode {
  type: 'list';
  elements: ClojureNode[];
}

// 向量类型
export interface VectorNode extends BaseNode {
  type: 'vector';
  elements: ClojureNode[];
}

// 映射类型
export interface MapNode extends BaseNode {
  type: 'map';
  pairs: Array<[ClojureNode, ClojureNode]>; // 键值对数组
}

// 集合类型
export interface SetNode extends BaseNode {
  type: 'set';
  elements: ClojureNode[];
}

// 创建节点的辅助函数
export const createAtom = (value: string | number | boolean | null, valueType: AtomNode['valueType']): AtomNode => ({
  type: 'atom',
  value,
  valueType,
});

export const createSymbol = (name: string, namespace?: string): SymbolNode => ({
  type: 'symbol',
  name,
  namespace,
});

export const createList = (elements: ClojureNode[]): ListNode => ({
  type: 'list',
  elements,
});

export const createVector = (elements: ClojureNode[]): VectorNode => ({
  type: 'vector',
  elements,
});

export const createMap = (pairs: Array<[ClojureNode, ClojureNode]>): MapNode => ({
  type: 'map',
  pairs,
});

export const createSet = (elements: ClojureNode[]): SetNode => ({
  type: 'set',
  elements,
});

// 创建函数定义的辅助函数
export const createDefn = (
  fnName: string, 
  params: string[] | FnParam[], 
  body: ClojureNode[], 
  docstring?: string,
  namespace?: string
): ListNode => {
  // 函数定义主要部分
  const elements: ClojureNode[] = [
    createSymbol('defn'),
    createSymbol(fnName, namespace)
  ];
  
  // 添加可选的文档字符串
  if (docstring) {
    elements.push(createAtom(docstring, 'string'));
  }
  
  // 添加参数向量
  const paramsVector: ClojureNode[] = params.map(param => {
    if (typeof param === 'string') {
      return createSymbol(param);
    } else {
      if (param.rest) {
        // 处理 rest 参数 (如 & args)
        return createSymbol(`& ${param.name}`);
      }
      return createSymbol(param.name);
    }
  });
  
  elements.push(createVector(paramsVector));
  
  // 添加函数体
  elements.push(...body);
  
  return createList(elements);
};

// 创建匿名函数的辅助函数
export const createFn = (
  params: string[] | FnParam[], 
  body: ClojureNode[],
): ListNode => {
  const elements: ClojureNode[] = [
    createSymbol('fn')
  ];
  
  // 添加参数向量
  const paramsVector: ClojureNode[] = params.map(param => {
    if (typeof param === 'string') {
      return createSymbol(param);
    } else {
      if (param.rest) {
        return createSymbol(`& ${param.name}`);
      }
      return createSymbol(param.name);
    }
  });
  
  elements.push(createVector(paramsVector));
  
  // 添加函数体
  elements.push(...body);
  
  return createList(elements);
};

// 创建多重参数函数的辅助函数
export const createMultiArityDefn = (
  fnName: string,
  arities: Array<{
    params: string[] | FnParam[], 
    body: ClojureNode[]
  }>,
  docstring?: string,
  namespace?: string
): ListNode => {
  // 函数定义主要部分
  const elements: ClojureNode[] = [
    createSymbol('defn'),
    createSymbol(fnName, namespace)
  ];
  
  // 添加可选的文档字符串
  if (docstring) {
    elements.push(createAtom(docstring, 'string'));
  }
  
  // 添加每个参数数量的函数实现
  arities.forEach(arity => {
    const paramsVector: ClojureNode[] = arity.params.map(param => {
      if (typeof param === 'string') {
        return createSymbol(param);
      } else {
        if (param.rest) {
          return createSymbol(`& ${param.name}`);
        }
        return createSymbol(param.name);
      }
    });
    
    const arityList = createList([
      createVector(paramsVector),
      ...arity.body
    ]);
    
    elements.push(arityList);
  });
  
  return createList(elements);
};

// 代码生成器 - 将语法树转换为 Clojure 代码字符串
export function generateCode(node: ClojureNode): string {
  switch (node.type) {
    case 'atom':
      if (node.valueType === 'string') return `"${node.value}"`;
      if (node.valueType === 'nil') return 'nil';
      if (node.valueType === 'keyword') return `:${node.value}`;
      return String(node.value);
      
    case 'symbol':
      return node.namespace ? `${node.namespace}/${node.name}` : node.name;
      
    case 'list':
      return `(${node.elements.map(generateCode).join(' ')})`;
      
    case 'vector':
      return `[${node.elements.map(generateCode).join(' ')}]`;
      
    case 'map':
      return `{${node.pairs.map(([k, v]) => `${generateCode(k)} ${generateCode(v)}`).join(' ')}}`;
      
    case 'set':
      return `#{${node.elements.map(generateCode).join(' ')}}`;
      
    default:
      throw new Error(`未知节点类型: ${(node as any).type}`);
  }
}
