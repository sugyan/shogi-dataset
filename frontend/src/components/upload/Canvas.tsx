import { CursorProperty } from "csstype";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { AppState } from "../../redux/store";
import { UploadAction, loadImage, updatePoints } from "../../redux/actions";

interface Point {
    x: number;
    y: number;
}

interface ComponentProps {
    size: number;
}

interface DispatchProps {
    loadImage: (image?: HTMLImageElement) => void;
    updatePoints: (points: number[]) => void;
}

type Props = ComponentProps & DispatchProps;

interface State {
    cursor: CursorProperty;
}

class Canvas extends React.Component<Props, State> {
    private canvas: React.RefObject<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D | null = null;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private points: Point[] = [];
    private drag: number = -1;
    private imageData?: ImageData;

    public constructor(props: Props) {
        super(props);
        this.canvas = React.createRef<HTMLCanvasElement>();
        this.state = {
            cursor: "default",
        };
    }
    public componentDidMount(): void {
        const { size } = this.props;
        const canvas: HTMLCanvasElement | null = this.canvas && this.canvas.current;
        this.ctx = canvas && canvas.getContext("2d");
        if (canvas) {
            canvas.height = canvas.width = size;
            canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
            canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
            canvas.addEventListener("mouseup",   this.onMouseUp.bind(this));
        }
    }
    public render(): React.ReactNode {
        const { cursor } = this.state;
        return (
          <div>
            <h2>Image</h2>
            <canvas
                ref={this.canvas}
                style={{ width: "100%", border: "1px solid gray", backgroundColor: "lightgray", cursor: cursor }} />
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
        const ctx: CanvasRenderingContext2D | null = this.ctx;
        if (!ctx || !this.imageData) {
            return;
        }
        ctx.putImageData(this.imageData, 0, 0);
        // line
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "red";
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(this.points[3].x, this.points[3].y);
        this.points.forEach((p: Point): void => {
            ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.closePath();
        // circle
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        this.points.forEach((p: Point): void => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2.0);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        });
    }
    private onMouseDown(ev: MouseEvent): void {
        const target: Point = this.calcMousePoint(ev);
        this.drag = this.points.findIndex((p: Point): boolean => {
            return Math.sqrt((target.x - p.x) ** 2 + (target.y - p.y) ** 2) < 10.0;
        });
    }
    private onMouseMove(ev: MouseEvent): void {
        ev.preventDefault();
        ev.stopPropagation();

        if (this.drag === -1) {
            const target: Point = this.calcMousePoint(ev);
            const draggable = this.points.some((p: Point): boolean => {
                return Math.sqrt((target.x - p.x) ** 2 + (target.y - p.y) ** 2) < 10.0;
            });
            this.setState({ cursor: draggable ? "grab" : "default" });
            return;
        }
        this.setState({ cursor: "grabbing" });
        this.drawPoints();
        this.points[this.drag] = this.calcMousePoint(ev);
        this.updatePoints();
    }
    private onMouseUp(ev: MouseEvent): void {
        this.drag = -1;
        const target: Point = this.calcMousePoint(ev);
        const draggable = this.points.some((p: Point): boolean => {
            return Math.sqrt((target.x - p.x) ** 2 + (target.y - p.y) ** 2) < 10.0;
        });
        this.setState({ cursor: draggable ? "grab" : "default" });
    }
    private calcMousePoint(ev: MouseEvent): Point {
        const { size } = this.props;
        const rect: ClientRect | null = this.canvas.current && this.canvas.current.getBoundingClientRect();
        if (!rect) {
            return { x: 0, y: 0 };
        }
        const scale: number = Math.max(size / rect.width, size / rect.height);
        return {
            x: (ev.clientX - rect.left) * scale,
            y: (ev.clientY - rect.top) * scale,
        };
    }
    private updatePoints(): void {
        const { size, updatePoints } = this.props;
        updatePoints(
            this.points
                .map((p: Point): number[] => [
                    (p.x - this.offsetX) / (size - this.offsetX * 2),
                    (p.y - this.offsetY) / (size - this.offsetY * 2),
                ])
                .reduce((prev, curr): number[] => prev.concat(curr), []));
    }
    private onChangeFile(ev: React.ChangeEvent): void {
        const files: FileList | null = (ev.target as HTMLInputElement).files;
        if (!files || files.length < 1) {
            return;
        }
        const file: File | null = files.item(0);
        if (file) {
            const reader: FileReader = new FileReader();
            reader.onload = this.onLoadFile.bind(this, reader);
            reader.readAsDataURL(file);
        }
    }
    private onLoadFile(reader: FileReader): void {
        const { size, loadImage } = this.props;
        const ctx = this.ctx;
        if (!ctx) {
            return;
        }
        ctx.fillStyle = "lightgray";
        ctx.fillRect(0, 0, size, size);
        const img: HTMLImageElement = new Image();
        img.onload = (): void => {
            const [h, w] = [img.height, img.width];
            const scale: number = Math.max(h / size, w / size);
            this.offsetX = (size - w / scale) / 2.0;
            this.offsetY = (size - h / scale) / 2.0;
            ctx.drawImage(img, this.offsetX, this.offsetY, w / scale, h / scale);
            this.imageData = ctx.getImageData(0, 0, size, size);
            const W: number = size - this.offsetX * 2.0;
            const H: number = size - this.offsetY * 2.0;
            this.points = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]].map((v): Point => {
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
    (state: AppState): AppState => state,
    (dispatch: Dispatch<UploadAction>): DispatchProps => {
        return {
            loadImage: (image?: HTMLImageElement): void => {
                dispatch(loadImage(image));
            },
            updatePoints: (points: number[]): void => {
                dispatch(updatePoints(points));
            },
        };
    },
)(Canvas);
