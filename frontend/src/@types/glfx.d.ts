declare module 'glfx' {
    function canvas(): Canvas;

    export class Canvas extends HTMLCanvasElement {
        draw: (texture: Texture) => Canvas;
        perspective: (before: [number, number, number, number, number, number, number, number],
                      after:  [number, number, number, number, number, number, number, number]) => Canvas;
        update: () => Canvas;
        texture: (image: HTMLImageElement) => Texture;
    }
    export class Texture {
    }
}
