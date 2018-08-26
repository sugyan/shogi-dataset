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

interface Istate {
    selectedImage: number;
}

interface Ipoint {
    x: number;
    y: number;
}

class Canvas extends React.Component<Props, Istate> {
    private canvas: React.RefObject<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D | null = null;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private points: Ipoint[] = [];
    private drag: number = -1;
    private imageData?: ImageData;
    private images: string[] = [
        "/static/img/example1.jpg",
        "/static/img/example2.jpg",
        "/static/img/example3.jpg",
    ];
    private initialPoints = [
        [
            { x: 272.1315068493151, y: 256.701369863014 },
            { x: 779.9232876712329, y: 249.687671232877 },
            { x: 896.3506849315069, y: 743.452054794521 },
            { x: 129.0520547945206, y: 737.841095890411 },
        ],
        [
            { x:  28.0547945205479, y: 262.312328767123 },
            { x: 559.6931506849315, y: 161.315068493151 },
            { x: 994.5424657534247, y: 621.413698630137 },
            { x: 371.7260273972603, y: 833.227397260274 },
        ],
        [
            { x: 141.6767123287671, y: 366.115068493151 },
            { x: 928.6136986301370, y: 429.238356164384 },
            { x: 890.7397260273973, y: 749.063013698630 },
            { x: 0,                 y: 625.621917808219 },
        ],
    ];
    constructor(props: any) {
        super(props);
        this.canvas = React.createRef<HTMLCanvasElement>();
        this.state = {
            selectedImage: 0,
        };
    }
    public componentDidMount(): void {
        const { size } = this.props;
        const canvas: HTMLCanvasElement = this.canvas.current!;
        canvas.height = canvas.width = size;
        canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
        canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        canvas.addEventListener("mouseup",   this.onMouseUp.bind(this));

        this.ctx = canvas.getContext("2d");
        this.loadImage();
    }
    public render(): React.ReactNode {
        const { selectedImage } = this.state;
        return (
            <div>
              <h2>Image</h2>
              <div style={{ margin: "5px 0" }}>
                <button className={`btn btn-${selectedImage === 0 ? "success" : "light"}`}
                  onClick={this.onSelectImage.bind(this, 0)}>
                  example 1
                </button>
                <button className={`btn btn-${selectedImage === 1 ? "success" : "light"}`}
                  onClick={this.onSelectImage.bind(this, 1)}>
                  example 2
                </button>
                <button className={`btn btn-${selectedImage === 2 ? "success" : "light"}`}
                  onClick={this.onSelectImage.bind(this, 2)}>
                  example 3
                </button>
              </div>
              <canvas ref={this.canvas} style={{ width: "100%", border: "1px solid gray" }} />
              <code>{JSON.stringify(this.points)}</code>
            </div>
        );
    }
    private loadImage(): void {
        const { size, loadImage } = this.props;
        const { selectedImage } = this.state;
        const ctx: CanvasRenderingContext2D = this.ctx!;
        ctx.fillStyle = "lightgray";
        ctx.fillRect(0, 0, size, size);

        const img: HTMLImageElement = new Image();
        img.onload = () => {
            const [h, w] = [img.height, img.width];
            const scale: number = Math.max(h / size, w / size);
            this.offsetX = (size - w / scale) / 2.0;
            this.offsetY = (size - h / scale) / 2.0;
            ctx.drawImage(img, this.offsetX, this.offsetY, w / scale, h / scale);
            this.imageData = ctx.getImageData(0, 0, size, size);
            this.onLoadImage();

            const imageCanvas: HTMLCanvasElement = document.createElement("canvas");
            imageCanvas.width = img.width;
            imageCanvas.height = img.height;
            imageCanvas.getContext("2d")!.drawImage(img, 0, 0);
            loadImage(img);
        };
        img.src = this.images[selectedImage];
    }
    private draw(): void {
        const ctx: CanvasRenderingContext2D = this.ctx!;
        ctx.putImageData(this.imageData!, 0, 0);
        // line
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "red";
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(this.points[3].x, this.points[3].y);
        this.points.forEach((p: Ipoint) => {
            ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.closePath();
        // circle
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        this.points.forEach((p: Ipoint) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2.0);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        });
    }
    private onLoadImage(): void {
        const { updatePoints, size } = this.props;
        const { selectedImage } = this.state;
        this.points = this.initialPoints[selectedImage];
        this.draw();
        updatePoints(
            this.points
                .map((p: Ipoint) => [
                    (p.x - this.offsetX) / (size - this.offsetX * 2),
                    (p.y - this.offsetY) / (size - this.offsetY * 2),
                ])
                .reduce((prev, curr) => prev.concat(curr), []));
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
    private onSelectImage(index: number) {
        this.setState({
            selectedImage: index,
        }, this.loadImage);
    }
}

export default connect(
    (state) => state,
    (dispatch: Dispatch): IdispatchProps => {
        return {
            loadImage: (image: HTMLImageElement) => dispatch(loadImageAction(image)),
            updatePoints: (points: number[]) => dispatch(updatePointAction(points)),
        };
    },
)(Canvas);
