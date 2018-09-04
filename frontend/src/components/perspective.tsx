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

interface IperspectiveState {
    texture?: fx.Texture;
}

class Perspective extends React.Component<Props, IperspectiveState> {
    private container: React.RefObject<HTMLCanvasElement>;
    private canvas?: fx.Canvas;
    constructor(props: any) {
        super(props);
        this.container = React.createRef<HTMLCanvasElement>();
        this.state = {
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
        const { texture } = this.state;
        if (texture) {
            this.canvas!.draw(texture, size, size)
                .perspective(
                    points.map((v) => v * size),
                    [0, 0, 1, 0, 1, 1, 0, 1].map((v) => v * size))
                .update();
            const data: Uint8Array = this.canvas!.getPixelArray();
            const imageData = new ImageData(new Uint8ClampedArray(data), size, size);
            this.container.current!.getContext("2d")!.putImageData(imageData, 0, 0);
        }
        return (
            <div>
              <h2>Cropped</h2>
              <canvas ref={this.container} style={{ width: "100%", border: "1px solid" }} />
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
