import * as React from "react";

export class Canvas extends React.Component<{}, {}> {
    private canvas: React.RefObject<HTMLCanvasElement>;
    private size: number;
    constructor(props: any) {
        super(props);
        this.canvas = React.createRef<HTMLCanvasElement>();
    }
    componentDidMount() {
        const ctx: CanvasRenderingContext2D = this.canvas.current.getContext("2d");
        this.size = this.canvas.current.height = this.canvas.current.width;
        ctx.fillStyle = "lightgray";
        ctx.fillRect(0, 0, this.size, this.size);
    }
    render() {
        return (
            <div>
              <h2>Image</h2>
              <canvas ref={this.canvas} style={{ width: "100%" }} />
            </div>
        );
    }
}
