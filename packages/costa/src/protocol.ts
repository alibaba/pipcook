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
  error: { message: string, stack: string } | null,
  result: any | null
}
