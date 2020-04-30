
/**
 * Retrieve the type of fulfillment value of a Promise
 */
export type PromisedValueOf<T extends Promise<any>> = T extends Promise<infer P> ? P : never
