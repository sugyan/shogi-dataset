import * as fx from "glfx";
import * as React from "react";
import { connect } from "react-redux";
import { Istate } from "../redux/reducers";

interface IstateProps {
    image?: HTMLImageElement;
    points: number[];
}

type Props = IstateProps;

interface IperspectiveState {
    texture?: fx.Texture;
}

class Perspective extends React.Component<Props, IperspectiveState> {
    private container: React.RefObject<HTMLCanvasElement>;
    private canvas?: fx.Canvas;
    private size: number = 864;
    constructor(props: any) {
        super(props);
        this.container = React.createRef<HTMLCanvasElement>();
        this.state = {
            texture: undefined,
        };
    }
    public componentDidMount() {
        const canvas: HTMLCanvasElement = this.container.current!;
        canvas.height = canvas.width = this.size;
        try {
            this.canvas = fx.canvas();
        } catch (e) {
            window.console.error(e);
            return;
        }
    }
    public componentWillReceiveProps(props: Props) {
        const { image } = props;
        if (image !== this.props.image) {
            this.canvas!.width  = image!.width;
            this.canvas!.height = image!.height;
            this.setState({ texture: this.canvas!.texture(image!) });
        }
    }
    public render(): React.ReactNode {
        const { points } = this.props;
        const { texture } = this.state;
        if (texture) {
            const size: number = Math.min(this.canvas!.height, this.canvas!.width);
            this.canvas!.draw(texture).perspective(
                [
                    points[0] * this.canvas!.width, points[1] * this.canvas!.height,
                    points[2] * this.canvas!.width, points[3] * this.canvas!.height,
                    points[4] * this.canvas!.width, points[5] * this.canvas!.height,
                    points[6] * this.canvas!.width, points[7] * this.canvas!.height,
                ],
                [0, 0, size, 0, size, size, 0, size]).update();
            const img: HTMLImageElement = new Image();
            img.onload = () => {
                this.container.current!.getContext("2d")!.drawImage(img, 0, 0, size, size, 0, 0, this.size, this.size);
            };
            const data: Uint8Array = this.canvas!.getPixelArray();
            const c: HTMLCanvasElement = document.createElement("canvas");
            c.width = c.height = this.size;
            const tmpCtx: CanvasRenderingContext2D = c.getContext("2d")!;
            const imageData: ImageData = tmpCtx.createImageData(this.canvas!.width, this.canvas!.height);
            for (let i = 0; i < imageData.data.length; i++) {
                imageData.data[i] = data[i];
            }
            tmpCtx.putImageData(imageData, 0, 0);
            img.src = c.toDataURL("image/jpeg");
        }
        return (
            <div>
              <h3>Cropped</h3>
              <canvas ref={this.container} style={{ width: "100%" }} />
            </div>
        );
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
