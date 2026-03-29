// Save as: src/types/mammoth.d.ts
// This adds type declarations for mammoth browser module

declare module 'mammoth/mammoth.browser' {
  interface ConvertToHtmlOptions {
    arrayBuffer: ArrayBuffer
  }

  interface ConvertResult {
    value: string
    messages: Array<{
      type: string
      message: string
    }>
  }

  export function convertToHtml(options: ConvertToHtmlOptions): Promise<ConvertResult>
  
  const mammoth: {
    convertToHtml: (options: ConvertToHtmlOptions) => Promise<ConvertResult>
  }
  
  export default mammoth
}