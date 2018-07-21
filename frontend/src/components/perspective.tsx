import * as fx from "glfx";
import * as React from "react";

export class Perspective extends React.Component {
    private container: React.RefObject<HTMLDivElement>;
    constructor(props: any) {
        super(props);
        this.container = React.createRef<HTMLDivElement>();
    }
    public componentDidMount() {
        let canvas: fx.Canvas;
        try {
            canvas = fx.canvas();
        } catch (e) {
            window.console.error(e);
            return;
        }
        const image: HTMLImageElement = new Image();
        image.onload = (ev: Event) => {
            const texture: fx.Texture = canvas.texture(image);
            canvas.draw(texture).perspective(
                [175, 156, 496,  55, 161, 279, 504, 330],
                [175, 156, 496,  55, 161, 279, 504, 330]).update();

            this.container.current!.appendChild(canvas);
        };
        // TODO
    }
    public render(): React.ReactNode {
        return (
            <div ref={this.container} />
        );
    }
}
