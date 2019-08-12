/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as fx from "glfx";
import React, { useRef, useEffect, useState, useMemo } from "react";
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

const Perspective: React.FC<Props> = (props: Props): JSX.Element => {
    const { size, divide, imageData } = props;
    const container = useRef<HTMLCanvasElement>(null);
    const [canvas, updateCanvas] = useState<fx.Canvas>();
    const [texture, updateTexture] = useState<fx.Texture>();
    const onClickRotateButton = (): void => {
        const { imageData, updateImageData } = props;
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
    };
    useMemo((): void => {
        const size = props.size;
        const points = props.points;
        const updateImageData = props.updateImageData;
        if (canvas && texture) {
            canvas.draw(texture, size, size)
                .perspective(
                    points.map((v): number => v * size),
                    [0, 0, 1, 0, 1, 1, 0, 1].map((v): number => v * size))
                .update();
            const data: Uint8Array = canvas.getPixelArray();
            const imageData = new ImageData(new Uint8ClampedArray(data), size, size);
            updateImageData(imageData);
        }
    }, [props.size, props.points, props.updateImageData, canvas, texture]);
    useEffect((): void => {
        const canvas = container.current;
        if (canvas) {
            canvas.height = canvas.width = size;
            const fxcanvas = fx.canvas();
            fxcanvas.width = fxcanvas.height = size;
            updateCanvas(fxcanvas);
        }
    }, [size]);
    useEffect((): void => {
        if (canvas && props.image) {
            updateTexture(canvas.texture(props.image));
        }
    }, [canvas, props.image]);

    if (imageData) {
        const ctx: CanvasRenderingContext2D = container.current!.getContext("2d")!;
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
        <button className="btn btn-light" onClick={onClickRotateButton}>
          <svg viewBox="0 0 8 8" style={{ height: 16, width: 16 }}>
            <use xlinkHref="/static/svg/open-iconic.min.svg#loop-circular" style={{ fill: "gray" }} />
          </svg>
        </button>
      </div>
    );
    return (
      <div>
        <h2>Cropped</h2>
        <canvas ref={container} style={{ width: "100%", border: "1px solid" }} />
        {rotateButton}
      </div>
    );
};

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
