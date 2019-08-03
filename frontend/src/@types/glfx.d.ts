declare module "glfx" {
    function canvas(): Canvas;

    export class Canvas extends HTMLCanvasElement {
        public draw: (texture: Texture, width?: number, height?: number) => Canvas;
        public perspective: (before: number[], after: number[]) => Canvas;
        public update: () => Canvas;
        public getPixelArray: () => Uint8Array;
        public texture: (image?: HTMLImageElement) => Texture;
    }
    export class Texture {
    }
}
