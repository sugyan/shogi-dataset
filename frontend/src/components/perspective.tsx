import * as fx from "glfx";
import * as React from "react";
import { connect } from "react-redux";
import { Ipoint, Istate } from "../redux/reducers";

interface Iprops {
    size: number;
}

interface IstateProps {
    image?: HTMLImageElement;
    points: Ipoint[];
    exampleIndex: number;
}

type Props = Iprops & IstateProps;

interface Inumbers {
    row: number;
    col: number;
}

interface IperspectiveState {
    images: ImageData[];
    texture?: fx.Texture;
    num: Inumbers;
    selectedImage: number;
}

class Perspective extends React.Component<Props, IperspectiveState> {
    private container: React.RefObject<HTMLCanvasElement>;
    private canvas?: fx.Canvas;
    private nums: Inumbers[] = [
        { col: 9, row: 9 },
        { col: 4, row: 5 },
        { col: 8, row: 3 },
    ];
    private imageData?: ImageData;
    constructor(props: any) {
        super(props);
        this.container = React.createRef<HTMLCanvasElement>();
        this.state = {
            images: [],
            num: { col: 9, row: 9 },
            selectedImage: 0,
            texture: undefined,
        };
    }
    public componentDidMount() {
        const { size } = this.props;
        const canvas: HTMLCanvasElement = this.container.current!;
        canvas.height = canvas.width = size;
        try {
            this.canvas = fx.canvas();
            this.canvas!.width = this.canvas!.height = size;
        } catch (e) {
            window.console.error(e);
            return;
        }
    }
    public componentWillReceiveProps(props: Props) {
        const { image, exampleIndex } = this.props;
        if (image !== props.image) {
            this.setState({ texture: this.canvas!.texture(props.image!) });
        }
        if (exampleIndex !== props.exampleIndex) {
            this.setState({
                images: [],
                num: this.nums[props.exampleIndex],
            });
        }
    }
    public render(): React.ReactNode {
        const { points, size } = this.props;
        const { texture, images, num } = this.state;
        if (texture) {
            this.canvas!.draw(texture, size, size)
                .perspective(
                    points
                        .map((v) => [v.x * size, v.y * size])
                        .reduce((prev, curr) => prev.concat(curr, [])),
                    [0, 0, 1, 0, 1, 1, 0, 1].map((v) => v * size))
                .update();
            const data: Uint8Array = this.canvas!.getPixelArray();
            const ctx: CanvasRenderingContext2D = this.container.current!.getContext("2d")!;
            this.imageData = new ImageData(new Uint8ClampedArray(data), size, size);
            ctx.putImageData(this.imageData, 0, 0);
            ctx.strokeStyle = "white";
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            for (let i = 1; i < num.row; i++) {
                ctx.moveTo(0, size / num.row * i);
                ctx.lineTo(size, size / num.row * i);
                ctx.stroke();
            }
            for (let i = 1; i < num.col; i++) {
                ctx.moveTo(size / num.col * i, 0);
                ctx.lineTo(size / num.col * i, size);
                ctx.stroke();
            }
        }
        const results: React.ReactNode[] = images.map((v, i) => {
            const canvas: HTMLCanvasElement = document.createElement("canvas");
            const imgCanvas: HTMLCanvasElement = document.createElement("canvas");
            imgCanvas.height = v.height;
            imgCanvas.width  = v.width;
            imgCanvas.getContext("2d")!.putImageData(v, 0, 0);
            canvas.width = canvas.height = 96;
            canvas.getContext("2d")!.drawImage(imgCanvas, 0, 0, 96, 96);
            return (
                <div key={i} style={{ margin: "2px", float: "left" }}>
                  <img src={canvas.toDataURL("image/jpeg")} style={{ border: "1px solid" }} />
                </div>
            );
        });
        return (
            <div>
              <h3>Cropped</h3>
              <canvas ref={this.container} style={{ width: "100%" }} />
              <div>
                <div className="form-group row">
                  <label className="col-3 col-form-label">row</label>
                  <div className="col-9">
                    <input
                    id="row"
                    type="number"
                    className="form-control"
                    value={num.row}
                    min={1} max={9}
                    onChange={this.onChangeNumber.bind(this)}
                    />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-3 col-form-label">col</label>
                  <div className="col-9">
                    <input
                      id="col"
                      type="number"
                      className="form-control"
                      value={num.col}
                      min={1} max={9}
                      onChange={this.onChangeNumber.bind(this)}
                    />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={this.onDivide.bind(this)}>
                  Divide
                </button>
              </div>
              <hr />
              {results}
            </div>
        );
    }
    private onDivide() {
        const { exampleIndex, size } = this.props;
        const num: Inumbers = this.nums[exampleIndex];
        const ctx: CanvasRenderingContext2D = this.container.current!.getContext("2d")!;
        ctx.putImageData(this.imageData!, 0, 0);
        const images: ImageData[] = [];
        const h: number = size / num.row;
        const w: number = size / num.col;
        for (let i = 0; i < num.row; i++) {
            for (let j = 0; j < num.col; j++) {
                images.push(ctx.getImageData(w * j, h * i, w, h));
            }
        }
        this.setState({ images });
    }
    private onChangeNumber(ev: Event) {
        const { exampleIndex } = this.props;
        const num: Inumbers = this.nums[exampleIndex];
        const target: HTMLInputElement = ev.target as HTMLInputElement;
        const nextNum: Inumbers = num;
        switch (target.id) {
        case "col":
            nextNum.col = Number(target.value);
            break;
        case "row":
            nextNum.row = Number(target.value);
            break;
        }
        this.setState({ num: nextNum });
    }
}

export default connect(
    (state: Istate): IstateProps => {
        return {
            exampleIndex: state.exampleIndex,
            image: state.image,
            points: state.points,
        };
    },
)(Perspective);
