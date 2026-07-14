/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_API_BASE_URL: string;
    readonly REACT_APP_CLOUDINARY_CLOUD_NAME: string;
    readonly REACT_APP_CLOUDINARY_UPLOAD_PRESET: string;
  }
}