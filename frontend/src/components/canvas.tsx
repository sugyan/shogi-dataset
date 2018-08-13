import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { Action, loadImageAction, updatePointAction } from "../redux/actions";

interface Iprops {
    size: number;
}

interface IdispatchProps {
    loadImage: (data: HTMLImageElement) => Action;
    updatePoints: (points: number[]) => Action;
}

type Props = Iprops & IdispatchProps;

interface Ipoint {
    x: number;
    y: number;
}

class Canvas extends React.Component<Props> {
    private canvas: React.RefObject<HTMLCanvasElement>;
    private ctx?: CanvasRenderingContext2D;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private points: Ipoint[] = [];
    private drag: number = -1;
    private imageData?: ImageData;
    constructor(props: any) {
        super(props);
        this.canvas = React.createRef<HTMLCanvasElement>();
    }
    public componentDidMount(): void {
        const { size } = this.props;
        const canvas: HTMLCanvasElement = this.canvas.current!;
        canvas.height = canvas.width = size;
        canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
        canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        canvas.addEventListener("mouseup",   this.onMouseUp.bind(this));

        this.ctx = canvas.getContext("2d")!;
        this.loadImage();
    }
    public render(): React.ReactNode {
        return (
            <div>
              <h2>Image</h2>
              <canvas ref={this.canvas} style={{ width: "100%", border: "1px solid gray" }} />
            </div>
        );
    }
    private loadImage(): void {
        const { size, loadImage } = this.props;
        this.ctx!.fillStyle = "lightgray";
        this.ctx!.fillRect(0, 0, size, size);

        const img: HTMLImageElement = new Image();
        img.onload = (ev: Event) => {
            const [h, w] = [img.height, img.width];
            const scale: number = Math.max(h / size, w / size);
            this.offsetX = (size - w / scale) / 2.0;
            this.offsetY = (size - h / scale) / 2.0;
            this.ctx!.drawImage(img, this.offsetX, this.offsetY, w / scale, h / scale);
            this.imageData = this.ctx!.getImageData(0, 0, size, size);
            this.onLoadImage();

            const imageCanvas: HTMLCanvasElement = document.createElement("canvas");
            imageCanvas.width = img.width;
            imageCanvas.height = img.height;
            imageCanvas.getContext("2d")!.drawImage(img, 0, 0);
            loadImage(img);
        };
        img.src = "/static/img/example.jpg";
    }
    private draw(): void {
        this.ctx!.putImageData(this.imageData!, 0, 0);
        // line
        this.ctx!.lineWidth = 1.5;
        this.ctx!.strokeStyle = "red";
        this.ctx!.beginPath();
        this.ctx!.moveTo(this.points[3].x, this.points[3].y);
        this.points.forEach((p: Ipoint) => {
            this.ctx!.lineTo(p.x, p.y);
        });
        this.ctx!.stroke();
        // circle
        this.ctx!.fillStyle = "rgba(255, 255, 255, 0.1)";
        this.points.forEach((p: Ipoint) => {
            this.ctx!.beginPath();
            this.ctx!.arc(p.x, p.y, 10, 0, Math.PI * 2.0);
            this.ctx!.fill();
            this.ctx!.stroke();
        });
    }
    private onLoadImage(): void {
        const { size, updatePoints } = this.props;
        const w: number = size - this.offsetX * 2.0;
        const h: number = size - this.offsetY * 2.0;
        // this.points = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]].map((e): Ipoint => {
        // FIXME: for DEMO
        const defaultPoints: number[] = [
            0.3136986301369863, -0.07424657534246575,
            0.9479452054794520,  0.11205479452054794,
            0.7876712328767124,  1.03698630136986300,
            0.0589041095890411,  0.80246575342465750,
        ];
        updatePoints(defaultPoints);
        this.points = [
            [defaultPoints[0], defaultPoints[1]],
            [defaultPoints[2], defaultPoints[3]],
            [defaultPoints[4], defaultPoints[5]],
            [defaultPoints[6], defaultPoints[7]],
        ].map((e): Ipoint => {
            const x: number = this.offsetX + e[0] * w;
            const y: number = this.offsetY + e[1] * h;
            return { x, y };
        });
        this.draw();
    }
    private onMouseDown(ev: MouseEvent): void {
        const target: Ipoint = this.calcMousePoint(ev);
        this.drag = this.points.findIndex((p: Ipoint): boolean => {
            return Math.sqrt((target.x - p.x) ** 2 + (target.y - p.y) ** 2) < 10.0;
        });
    }
    private onMouseMove(ev: MouseEvent): void {
        if (this.drag === -1) {
            return;
        }
        this.draw();
        this.updatePoints(ev);
    }
    private onMouseUp(ev: Event): void {
        this.drag = -1;
    }
    private calcMousePoint(ev: MouseEvent): Ipoint {
        const { size } = this.props;
        const rect: ClientRect = this.canvas.current!.getBoundingClientRect();
        const scale: number = Math.max(size / rect.width, size / rect.height);
        return {
            x: (ev.clientX - rect.left) * scale,
            y: (ev.clientY - rect.top) * scale,
        };
    }
    private updatePoints(ev: MouseEvent) {
        const { size, updatePoints } = this.props;
        this.points[this.drag] = this.calcMousePoint(ev);
        updatePoints(
            this.points
                .map((p: Ipoint) => [
                    (p.x - this.offsetX) / (size - this.offsetX * 2),
                    (p.y - this.offsetY) / (size - this.offsetY * 2),
                ])
                .reduce((prev, curr) => prev.concat(curr), []));
    }
}

export default connect<{}, IdispatchProps>(
    (state) => state,
    (dispatch: Dispatch): IdispatchProps => {
        return {
            loadImage: (image: HTMLImageElement) => dispatch(loadImageAction(image)),
            updatePoints: (points: number[]) => dispatch(updatePointAction(points)),
        };
    },
)(Canvas);
