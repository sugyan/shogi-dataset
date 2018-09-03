import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { Action, loadImageAction, selectExampleAction, updatePointAction } from "../redux/actions";
import { Ipoint, Istate } from "../redux/reducers";

interface Iprops {
    size: number;
}

interface IstateProps {
    exampleIndex: number;
    points: Ipoint[];
}

interface IdispatchProps {
    loadImage: (data: HTMLImageElement) => Action;
    selectExample: (index: number) => Action;
    updatePoints: (points: Ipoint[]) => Action;
}

type Props = Iprops & IstateProps & IdispatchProps;

class Canvas extends React.Component<Props> {
    private canvas: React.RefObject<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D | null = null;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private drag: number = -1;
    private imageData?: ImageData;
    private images: string[] = [
        "/static/img/example1.jpg",
        "/static/img/example2.jpg",
        "/static/img/example3.jpg",
    ];
    private points = [
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
    private drawPoints: Ipoint[] = this.points[0];
    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef<HTMLCanvasElement>();
    }
    public componentDidMount(): void {
        const { size, exampleIndex } = this.props;
        const canvas: HTMLCanvasElement = this.canvas.current!;
        canvas.height = canvas.width = size;
        canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
        canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        canvas.addEventListener("mouseup",   this.onMouseUp.bind(this));

        this.ctx = canvas.getContext("2d");
        this.loadImage(exampleIndex);
    }
    public componentWillReceiveProps(props: Props) {
        const { exampleIndex } = this.props;
        if (exampleIndex !== props.exampleIndex) {
            this.drawPoints = this.points[props.exampleIndex];
            this.loadImage(props.exampleIndex);
        }
    }
    public render(): React.ReactNode {
        const { exampleIndex, points, size } = this.props;
        const displayPoints: Ipoint[] = points.map((p: Ipoint) => {
            return {
                x: Math.round(p.x * (size - this.offsetX * 2) * 100) / 100.0,
                y: Math.round(p.y * (size - this.offsetY * 2) * 100) / 100.0,
            };
        });
        return (
            <div>
              <h2>Image</h2>
              <div style={{ margin: "5px 0" }}>
                <button
                  className={`btn btn-${exampleIndex === 0 ? "success" : "light"}`}
                  style={{ marginRight: 5 }}
                  onClick={this.onSelectImage.bind(this, 0)}>
                  example 1
                </button>
                <button
                  className={`btn btn-${exampleIndex === 1 ? "success" : "light"}`}
                  style={{ marginRight: 5 }}
                  onClick={this.onSelectImage.bind(this, 1)}>
                  example 2
                </button>
                <button
                  className={`btn btn-${exampleIndex === 2 ? "success" : "light"}`}
                  onClick={this.onSelectImage.bind(this, 2)}>
                  example 3
                </button>
              </div>
              <canvas ref={this.canvas} style={{ width: "100%", border: "1px solid gray" }} />
              <code>{JSON.stringify(displayPoints)}</code>
            </div>
        );
    }
    private loadImage(index: number): void {
        const { size, loadImage } = this.props;
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
        img.src = this.images[index];
    }
    private draw(): void {
        const points: Ipoint[] = this.drawPoints;
        const ctx: CanvasRenderingContext2D = this.ctx!;
        ctx.putImageData(this.imageData!, 0, 0);
        // line
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "red";
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(points[3].x, points[3].y);
        points.forEach((p: Ipoint) => {
            ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.closePath();
        // circle
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        points.forEach((p: Ipoint) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2.0);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        });
    }
    private onLoadImage(): void {
        const { updatePoints, size, exampleIndex } = this.props;
        const points: Ipoint[] = this.drawPoints;
        this.draw();
        updatePoints(points.map((p: Ipoint): Ipoint => {
            return {
                x: (p.x - this.offsetX) / (size - this.offsetX * 2),
                y: (p.y - this.offsetY) / (size - this.offsetY * 2),
            };
        }));
    }
    private onMouseDown(ev: MouseEvent): void {
        const target: Ipoint = this.calcMousePoint(ev);
        this.drag = this.drawPoints.findIndex((p: Ipoint): boolean => {
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
        this.drawPoints[this.drag] = this.calcMousePoint(ev);
        updatePoints(this.drawPoints.map((p: Ipoint): Ipoint => {
            return {
                x: (p.x - this.offsetX) / (size - this.offsetX * 2),
                y: (p.y - this.offsetY) / (size - this.offsetY * 2),
            };
        }));
    }
    private onSelectImage(index: number) {
        const { selectExample } = this.props;
        selectExample(index);
    }
}

export default connect(
    (state: Istate): IstateProps => {
        return {
            exampleIndex: state.exampleIndex,
            points: state.points,
        };
    },
    (dispatch: Dispatch): IdispatchProps => {
        return {
            loadImage: (image: HTMLImageElement) => dispatch(loadImageAction(image)),
            selectExample: (index: number) => dispatch(selectExampleAction(index)),
            updatePoints: (points: Ipoint[]) => dispatch(updatePointAction(points)),
        };
    },
)(Canvas);
