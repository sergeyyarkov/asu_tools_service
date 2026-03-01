import { AsyncLocalStorage } from "node:async_hooks";

export const httpStorage = new AsyncLocalStorage();
