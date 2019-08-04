/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as fx from "glfx";
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { AppState } from "../../redux/store";
import { UploadAction, updateImageData } from "../../redux/actions";
import { DivideNums } from "../../redux/reducers";

interface ComponentProps {
    size: number;
}

interface StateProps {
    divide: DivideNums;
    image?: HTMLImageElement;
    imageData?: ImageData;
    points: number[];
}

interface DispatchProps {
    updateImageData: (imageData: ImageData) => void;
}

type Props = ComponentProps & StateProps & DispatchProps;

class Perspective extends React.Component<Props> {
    private container: React.RefObject<HTMLCanvasElement>;
    private canvas?: fx.Canvas;
    private texture?: fx.Texture;

    public constructor(props: Props) {
        super(props);
        this.container = React.createRef<HTMLCanvasElement>();
    }
    public componentDidMount(): void {
        const { size } = this.props;
        const canvas: HTMLCanvasElement = this.container.current!;
        canvas.height = canvas.width = size;
        try {
            this.canvas = fx.canvas();
            this.canvas.width = this.canvas.height = size;
        } catch (e) {
            window.console.error(e);
            return;
        }
    }
    public componentWillReceiveProps(props: Props): void {
        const { image, points } = this.props;
        if (props.image !== image) {
            this.texture = this.canvas!.texture(props.image);
            this.updateImageData(props.points);
        }
        if (props.points !== points && this.texture) {
            this.updateImageData(props.points);
        }
    }
    public render(): JSX.Element {
        const { size, divide, imageData } = this.props;
        if (imageData) {
            const ctx: CanvasRenderingContext2D = this.container.current!.getContext("2d")!;
            ctx.putImageData(imageData, 0, 0);
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
        const rotateButton = imageData && (
          <div className="text-right">
            <button className="btn btn-light" onClick={this.onClickRotateButton.bind(this)}>
              <svg viewBox="0 0 8 8" style={{ height: 16, width: 16 }}>
                <use xlinkHref="/static/svg/open-iconic.min.svg#loop-circular" style={{ fill: "gray" }} />
              </svg>
            </button>
          </div>
        );
        return (
          <div>
            <h2>Cropped</h2>
            <canvas ref={this.container} style={{ width: "100%", border: "1px solid" }} />
            {rotateButton}
          </div>
        );
    }
    private updateImageData(points: number[]): void {
        const { size, updateImageData } = this.props;
        this.canvas!.draw(this.texture!, size, size)
            .perspective(
                points.map((v): number => v * size),
                [0, 0, 1, 0, 1, 1, 0, 1].map((v): number => v * size))
            .update();
        const data: Uint8Array = this.canvas!.getPixelArray();
        const imageData = new ImageData(new Uint8ClampedArray(data), size, size);
        updateImageData(imageData);
    }
    private onClickRotateButton(): void {
        const { imageData, updateImageData } = this.props;
        if (!imageData) {
            return;
        }
        const imgCanvas: HTMLCanvasElement = document.createElement("canvas");
        imgCanvas.height = imageData.height;
        imgCanvas.width  = imageData.width;
        imgCanvas.getContext("2d")!.putImageData(imageData, 0, 0);
        const img: HTMLImageElement = new Image();
        img.onload = (): void => {
            const drawCanvas: HTMLCanvasElement = document.createElement("canvas");
            const ctx: CanvasRenderingContext2D = drawCanvas.getContext("2d")!;
            drawCanvas.height = imageData.height;
            drawCanvas.width  = imageData.width;
            ctx.save();
            ctx.translate(+ 0.5 * imageData.height, + 0.5 * imageData.height);
            ctx.rotate(- Math.PI * 0.5);
            ctx.translate(- 0.5 * imageData.height, - 0.5 * imageData.height);
            ctx.drawImage(img, 0, 0);
            ctx.restore();
            updateImageData(ctx.getImageData(0, 0, imageData.width, imageData.height));
        };
        img.src = imgCanvas.toDataURL("image/png");
    }
}

export default connect(
    (state: AppState): StateProps => {
        return {
            divide: state.uploadReducer.divide,
            image: state.uploadReducer.image,
            points: state.uploadReducer.points,
            imageData: state.uploadReducer.imageData,
        };
    },
    (dispatch: Dispatch<UploadAction>): DispatchProps => {
        return {
            updateImageData: (imageData: ImageData): void => {
                dispatch(updateImageData(imageData));
            },
        };
    },
)(Perspective);
