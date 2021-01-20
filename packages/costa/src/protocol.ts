/**
 * It represents exchange message between CostaRuntime and runnable client.
 */

export interface IPCInput {
  id: number,
  method: string,
  args: any[]
}
export interface IPCOutput {
  id: number,
  error: Error | null,
  result: any | null
}
