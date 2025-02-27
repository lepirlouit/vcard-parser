declare module 'vcard-parser' {
  export interface vCardEntry {
    value: string | string[];
    meta?: {
      type?: string[];
      value?: string[];
      charset?: string[];
    };
    namespace?: string;
  }
  export interface vCard {
    [key: string]: vCardEntry[];
  }
  export function parse(val: string): vCard;
  export function generate(val: vCard): string;
}
