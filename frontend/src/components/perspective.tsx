import * as fx from "glfx";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { updateImageDataAction, UploaderAction } from "../redux/actions/uploader";
import { Istate } from "../redux/reducer";
import { IdivideNums } from "../redux/reducers/uploader";

interface Iprops {
    size: number;
}

interface IstateProps {
    divide: IdivideNums;
    image?: HTMLImageElement;
    imageData?: ImageData;
    points: number[];
}

interface IdispatchProps {
    updateImageData: (imageData: ImageData) => UploaderAction;
}

type Props = Iprops & IstateProps & IdispatchProps;

class Perspective extends React.Component<Props> {
    private container: React.RefObject<HTMLCanvasElement>;
    private canvas?: fx.Canvas;
    private texture?: fx.Texture;
    constructor(props: any) {
        super(props);
        this.container = React.createRef<HTMLCanvasElement>();
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
        const { image, points } = this.props;
        if (props.image !== image) {
            this.texture = this.canvas!.texture(props.image!);
            this.updateImageData(props.points);
        }
        if (props.points !== points && this.texture) {
            this.updateImageData(props.points);
        }
    }
    public render(): React.ReactNode {
        const { size, divide, imageData } = this.props;
        if (imageData) {
            const ctx: CanvasRenderingContext2D = this.container.current!.getContext("2d")!;
            ctx.putImageData(imageData!, 0, 0);
            ctx.strokeStyle = "lightgray";
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let i = 1; i < divide.row; i++) {
                ctx.moveTo(0, size / divide.row * i);
                ctx.lineTo(size, size / divide.row * i);
                ctx.stroke();
            }
            for (let i = 0; i < divide.col; i++) {
                ctx.moveTo(size / divide.col * i, 0);
                ctx.lineTo(size / divide.col * i, size);
                ctx.stroke();
            }
        }
        return (
            <div>
              <h2>Cropped</h2>
              <canvas ref={this.container} style={{ width: "100%", border: "1px solid" }} />
            </div>
        );
    }
    private updateImageData(points: number[]) {
        const { size, updateImageData } = this.props;
        this.canvas!.draw(this.texture!, size, size)
            .perspective(
                points.map((v) => v * size),
                [0, 0, 1, 0, 1, 1, 0, 1].map((v) => v * size))
            .update();
        const data: Uint8Array = this.canvas!.getPixelArray();
        const imageData = new ImageData(new Uint8ClampedArray(data), size, size);
        updateImageData(imageData);
    }
}

export default connect(
    (state: Istate): IstateProps => {
        return {
            divide: state.uploaderReducer.divide,
            image: state.uploaderReducer.image,
            imageData: state.uploaderReducer.imageData,
            points: state.uploaderReducer.points,
        };
    },
    (dispatch: Dispatch): IdispatchProps => {
        return {
            updateImageData: (imageData: ImageData): UploaderAction => dispatch(updateImageDataAction(imageData)),
        };
    },
)(Perspective);
