import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { loadImageAction, updatePointAction, UploaderAction } from "../redux/actions/uploader";

interface Iprops {
    size: number;
}

interface IdispatchProps {
    loadImage: (data: HTMLImageElement) => UploaderAction;
    updatePoints: (points: number[]) => UploaderAction;
}

type Props = Iprops & IdispatchProps;

interface Ipoint {
    x: number;
    y: number;
}

class Canvas extends React.Component<Props> {
    private canvas: React.RefObject<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D | null = null;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private points: Ipoint[] = [];
    private drag: number = -1;
    private imageData?: ImageData;
    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef<HTMLCanvasElement>();
    }
    public componentDidMount(): void {
        const { size } = this.props;
        const canvas: HTMLCanvasElement = this.canvas.current!;
        this.ctx = canvas.getContext("2d");
        canvas.height = canvas.width = size;
        canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
        canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        canvas.addEventListener("mouseup",   this.onMouseUp.bind(this));
    }
    public render(): React.ReactNode {
        return (
            <div>
              <h2>Image</h2>
              <canvas
                ref={this.canvas}
                style={{ width: "100%", border: "1px solid gray", backgroundColor: "lightgray" }} />
              <div className="custom-file">
                <input
                  type="file"
                  className="custom-file-input"
                  onChange={this.onChangeFile.bind(this)}
                  accept="image/*"
                  multiple={false} />
                <label className="custom-file-label">Choose file</label>
              </div>
            </div>
        );
    }
    private drawPoints(): void {
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
        this.drawPoints();
        this.points[this.drag] = this.calcMousePoint(ev);
        this.updatePoints();
    }
    private onMouseUp(): void {
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
    private updatePoints() {
        const { size, updatePoints } = this.props;
        updatePoints(
            this.points
                .map((p: Ipoint) => [
                    (p.x - this.offsetX) / (size - this.offsetX * 2),
                    (p.y - this.offsetY) / (size - this.offsetY * 2),
                ])
                .reduce((prev, curr) => prev.concat(curr), []));
    }
    private onChangeFile(ev: Event) {
        const files: FileList = (ev.target as HTMLInputElement).files!;
        if (files.length < 1) {
            return;
        }
        const file: File = files.item(0)!;
        const reader: FileReader = new FileReader();
        reader.onload = this.onLoadFile.bind(this, reader);
        reader.readAsDataURL(file);
    }
    private onLoadFile(reader: FileReader) {
        const { size, loadImage, updatePoints } = this.props;
        this.ctx!.fillStyle = "lightgray";
        this.ctx!.fillRect(0, 0, size, size);
        const img: HTMLImageElement = new Image();
        img.onload = () => {
            const [h, w] = [img.height, img.width];
            const scale: number = Math.max(h / size, w / size);
            this.offsetX = (size - w / scale) / 2.0;
            this.offsetY = (size - h / scale) / 2.0;
            this.ctx!.drawImage(img, this.offsetX, this.offsetY, w / scale, h / scale);
            this.imageData = this.ctx!.getImageData(0, 0, size, size);
            const W: number = size - this.offsetX * 2.0;
            const H: number = size - this.offsetY * 2.0;
            this.points = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]].map((v): Ipoint => {
                return {
                    x: this.offsetX + v[0] * W,
                    y: this.offsetY + v[1] * H,
                };
            });
            this.drawPoints();
            this.updatePoints();
            loadImage(img);
        };
        img.src = reader.result as string;
    }
}

export default connect(
    (state) => state,
    (dispatch: Dispatch): IdispatchProps => {
        return {
            loadImage: (image: HTMLImageElement): UploaderAction => dispatch(loadImageAction(image)),
            updatePoints: (points: number[]): UploaderAction => dispatch(updatePointAction(points)),
        };
    },
)(Canvas);
