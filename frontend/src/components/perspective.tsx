import * as fx from "glfx";
import * as React from "react";
import { connect } from "react-redux";

interface IstateProps {
    dataUrl?: string;
    points: number[];
}

type Props = IstateProps;

interface Istate {
    texture?: fx.Texture;
}

class Perspective extends React.Component<Props, Istate> {
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
        const canvas: HTMLCanvasElement = this.container.current!;
        canvas.height = canvas.width;
        try {
            this.canvas = fx.canvas();
        } catch (e) {
            window.console.error(e);
            return;
        }
    }
    public componentWillReceiveProps(props: Props) {
        const { dataUrl } = this.props;
        if (props.dataUrl !== dataUrl) {
            const image: HTMLImageElement = new Image();
            image.onload = (ev: Event) => {
                this.setState({ texture: this.canvas!.texture(image) });
            };
            image.src = props.dataUrl!;
        }
    }
    public render(): React.ReactNode {
        const { points } = this.props;
        const { texture } = this.state;
        if (texture) {
            window.console.log(points);
            this.canvas!.draw(texture).perspective(
                [0, 0, 100, 0, 100, 100, 0, 100],
                [0, 0, 100, 0, 100, 100, 0, 100]).update();
            const img: HTMLImageElement = new Image();
            img.onload = () => {
                this.container.current!.getContext("2d")!.drawImage(img, 0, 0);
            };
            img.src = this.canvas!.toDataURL("image/jpeg");
        }
        return (
            <div>
              <h3>Cropped</h3>
              <canvas ref={this.container} style={{ width: "100%" }} />
            </div>
        );
    }
}

export default connect<IstateProps>(
    // TODO
    (state: any): IstateProps => {
        return {
            dataUrl: state.dataUrl,
            points: state.points,
        };
    },
)(Perspective);
