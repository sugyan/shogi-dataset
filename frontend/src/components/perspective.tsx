import * as fx from "glfx";
import * as React from "react";
import { connect } from "react-redux";
import { Istate } from "../redux/reducers";

interface Iprops {
    size: number;
}

interface IstateProps {
    image?: HTMLImageElement;
    points: number[];
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
}

class Perspective extends React.Component<Props, IperspectiveState> {
    private container: React.RefObject<HTMLCanvasElement>;
    private canvas?: fx.Canvas;
    constructor(props: any) {
        super(props);
        this.container = React.createRef<HTMLCanvasElement>();
        this.state = {
            images: [],
            num: {
                col: 9,
                row: 9,
            },
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
        const { image } = props;
        if (image !== this.props.image) {
            this.setState({ texture: this.canvas!.texture(image!) });
        }
    }
    public render(): React.ReactNode {
        const { points, size } = this.props;
        const { texture, images, num } = this.state;
        if (texture) {
            this.canvas!.draw(texture, size, size)
                .perspective(
                    points.map((v) => v * size),
                    [0, 0, 1, 0, 1, 1, 0, 1].map((v) => v * size))
                .update();
            const data: Uint8Array = this.canvas!.getPixelArray();
            const ctx: CanvasRenderingContext2D = this.container.current!.getContext("2d")!;
            ctx.putImageData(new ImageData(new Uint8ClampedArray(data), size, size), 0, 0);
        }
        const results: React.ReactNode[] = images.map((v, i) => {
            const canvas: HTMLCanvasElement = document.createElement("canvas");
            canvas.width = canvas.height = 96;
            canvas.getContext("2d")!.putImageData(v, 0, 0);
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
              <div className="form-inline input-group">
                <input
                  id="row"
                  type="number"
                  className="form-control"
                  value={num.row}
                  min={1} max={9}
                  onChange={this.onChangeNumber.bind(this)}
                />
                <input
                  id="col"
                  type="number"
                  className="form-control"
                  value={num.col}
                  min={1} max={9}
                  onChange={this.onChangeNumber.bind(this)}
                />
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
        const { num } = this.state;
        const ctx: CanvasRenderingContext2D = this.container.current!.getContext("2d")!;
        const images: ImageData[] = [];
        for (let i = 0; i < num.row; i++) {
            for (let j = 0; j < num.col; j++) {
                images.push(ctx.getImageData(
                    96 * j,      96 * i,
                    96 * j + 96, 96 * i + 96));
            }
        }
        this.setState({ images });
    }
    private onChangeNumber(ev: Event) {
        const { num } = this.state;
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
            image: state.image,
            points: state.points,
        };
    },
)(Perspective);
