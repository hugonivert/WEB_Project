declare module "@google/model-viewer";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
          src?: string;
          alt?: string;
          poster?: string;
          exposure?: string;
          "camera-controls"?: boolean;
          "camera-orbit"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          "shadow-intensity"?: string;
          "interaction-prompt"?: string;
          "touch-action"?: string;
        };
      }
    }
  }
}

export {};
