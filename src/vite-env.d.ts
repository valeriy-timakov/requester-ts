/// <reference types="vite/client" />

import type { RequesterApi } from './shared/api/requester';

declare global {
  interface Window {
    requesterApi: RequesterApi;
  }
}

export {};
