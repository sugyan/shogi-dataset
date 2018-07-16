import * as React from "react";

interface Ipoint {
    x: number;
    y: number;
}

export class Canvas extends React.Component<any> {
    private canvas: React.RefObject<HTMLCanvasElement>;
    private ctx?: CanvasRenderingContext2D;
    private size: number = 1024;
    private points: Ipoint[] = [];
    private drag: number = -1;
    private imageData?: ImageData;
    constructor(props: any) {
        super(props);
        this.canvas = React.createRef<HTMLCanvasElement>();
    }
    public componentDidMount(): void {
        this.canvas.current!.height = this.canvas.current!.width = this.size;
        this.canvas.current!.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.canvas.current!.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.canvas.current!.addEventListener("mouseup",   this.onMouseUp.bind(this));
        this.canvas.current!.addEventListener("mouseout",  this.onMouseUp.bind(this));

        this.ctx = this.canvas.current!.getContext("2d")!;
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
        this.ctx!.fillStyle = "lightgray";
        this.ctx!.fillRect(0, 0, this.size, this.size);

        const img: HTMLImageElement = new Image();
        img.onload = (ev: Event) => {
            const [h, w] = [img.height, img.width];
            const scale: number = Math.max(h / this.size, w / this.size);
            const x: number = (this.size - w / scale) / 2.0;
            const y: number = (this.size - h / scale) / 2.0;
            this.ctx!.drawImage(img, x, y, w / scale, h / scale);
            this.imageData = this.ctx!.getImageData(0, 0, this.size, this.size);
            this.onLoadImage(x, y);
        };
        // TODO
        img.src = "http://localhost:8080/static/img/20161108211226.jpg"
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
    private onLoadImage(offsetX: number, offsetY: number): void {
        const w: number = this.size - offsetX * 2.0;
        const h: number = this.size - offsetY * 2.0;
        this.points = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]].map((e): Ipoint => {
            const x: number = offsetX + e[0] * w;
            const y: number = offsetY + e[1] * h;
            return { x, y };
        });
        this.draw();
    }
    private onMouseDown(ev: MouseEvent): void {
        const rect: ClientRect = this.canvas.current!.getBoundingClientRect();
        const scale: number = Math.max(this.size / rect.width, this.size / rect.height);
        const target: Ipoint = {
            x: (ev.clientX - rect.left) * scale,
            y: (ev.clientY - rect.top) * scale,
        };
        this.drag = this.points.findIndex((p: Ipoint): boolean => {
            return Math.sqrt((target.x - p.x) ** 2 + (target.y - p.y) ** 2) < 10.0;
        });
    }
    private onMouseMove(ev: MouseEvent): void {
        if (this.drag === -1) {
            return;
        }
        const rect: ClientRect = this.canvas.current!.getBoundingClientRect();
        const scale: number = Math.max(this.size / rect.width, this.size / rect.height);
        const target: Ipoint = {
            x: (ev.clientX - rect.left) * scale,
            y: (ev.clientY - rect.top) * scale,
        };
        this.points[this.drag] = target;
        this.draw();
    }
    private onMouseUp(ev: Event): void {
        this.drag = -1;
    }
}
