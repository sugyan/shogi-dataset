declare module 'glfx' {
    function canvas(): Canvas;

    type points = [number, number, number, number, number, number, number, number];

    export class Canvas extends HTMLCanvasElement {
        draw: (texture: Texture) => Canvas;
        perspective: (before: points, after: points) => Canvas;
        update: () => Canvas;
        texture: (image: HTMLImageElement) => Texture;
    }
    export class Texture {
    }
}
