// إضافة دعم TypeScript لـ webkitdirectory
declare global {
  namespace React {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
      webkitdirectory?: boolean;
      directory?: boolean;
      mozdirectory?: boolean;
    }
  }
}

export {};
