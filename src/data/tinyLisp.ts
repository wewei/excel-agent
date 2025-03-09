export type TinyLispNode =
  | AtomNode
  | ListNode
  | LambdaNode
  | QuoteNode
  | MacroNode
  | SymbolNode
  | NumberNode
  | StringNode

