// @ts-ignore
import { exec } from "@jcubic/lips";

export function runCode(code: string): Promise<any> {
  return exec(code);
}
