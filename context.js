import { AsyncLocalStorage } from "node:async_hooks";

export const ctxAsyncLocalStorage = new AsyncLocalStorage();
