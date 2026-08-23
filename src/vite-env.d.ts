/// <reference types="vite/client" />

declare global {
  interface HTMLInputElement {
    webkitdirectory?: string;
  }
}

export {};
