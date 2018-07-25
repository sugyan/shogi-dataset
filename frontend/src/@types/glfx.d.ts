declare module 'glfx' {
    function canvas(): Canvas;

    export class Canvas extends HTMLCanvasElement {
        draw: (texture: Texture) => Canvas;
        perspective: (before: number[], after: number[]) => Canvas;
        update: () => Canvas;
        getPixelArray: () => Uint8Array;
        texture: (image: HTMLImageElement) => Texture;
    }
    export class Texture {
    }
}
