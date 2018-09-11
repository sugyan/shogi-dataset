import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { Action, changeDivideAction } from "../redux/actions";
import { IdivideNums, Istate } from "../redux/reducers";

interface Iprops {
    size: number;
}

interface IstateProps {
    divide: IdivideNums;
    image?: HTMLImageElement;
    imageData?: ImageData;
}

interface IdispatchProps {
    changeDivide: (divide: IdivideNums) => Action;
}

type Props = Iprops & IstateProps & IdispatchProps;

interface IdivideState {
    images: string[];
}

class Divide extends React.Component<Props, IdivideState> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            images: [],
        };
    }
    public render(): React.ReactNode {
        const { divide, image } = this.props;
        const { images } = this.state;
        if (!image) {
            return null;
        }
        const results: React.ReactNode[] = images.map((v, i) => {
            return (
                <tr key={i} style={{ marginBottom: 5 }}>
                  <td>
                    <img src={v} />
                  </td>
                </tr>
            );
        });
        return (
            <div>
              <form onSubmit={this.onSubmit.bind(this)}>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">Rows</label>
                  <div className="col-sm-9">
                    <input
                      type="number" min={1} max={9}
                      name="row"
                      className="form-control"
                      value={divide.row}
                      onChange={this.onChangeNumber.bind(this)}
                    />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">Columns</label>
                  <div className="col-sm-9">
                    <input
                      type="number" min={1} max={9}
                      name="col"
                      className="form-control"
                      value={divide.col}
                      onChange={this.onChangeNumber.bind(this)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <input type="submit" className="btn btn-primary" value="Divide" />
                </div>
              </form>
              <table className="table table-hover table-sm">
                <tbody>
                  {results}
                </tbody>
              </table>
            </div>
        );
    }
    private onChangeNumber(ev: Event) {
        const { changeDivide, divide } = this.props;
        const nextDivide: IdivideNums = { ...divide };
        const target: HTMLInputElement = ev.target as HTMLInputElement;
        switch (target.name) {
        case "col":
            nextDivide.col = Number(target.value);
            break;
        case "row":
            nextDivide.row = Number(target.value);
            break;
        }
        changeDivide(nextDivide);
    }
    private onSubmit(ev: Event) {
        ev.preventDefault();

        const { imageData, divide, size } = this.props;
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
        canvas.height = imageData!.height;
        canvas.width  = imageData!.width;
        ctx.putImageData(imageData!, 0, 0);

        const images: string[] = [];
        const h: number = imageData!.height / divide.row;
        const w: number = imageData!.width  / divide.col;
        const imgCanvas: HTMLCanvasElement = document.createElement("canvas");
        const imgCtx: CanvasRenderingContext2D = imgCanvas.getContext("2d")!;
        imgCanvas.height = imgCanvas.width = size;
        for (let i = 0; i < divide.row; i++) {
            for (let j = 0; j < divide.col; j++) {
                imgCtx.fillRect(0, 0, size, size);
                imgCtx.drawImage(canvas, w * j, h * i, w, h, 0, 0, size, size);
                images.push(imgCanvas.toDataURL("image/jpeg"));
            }
        }
        this.setState({ images });
    }
}
export default connect(
    (state: Istate): IstateProps => {
        return {
            divide: state.divide,
            image: state.image,
            imageData: state.imageData,
        };
    },
    (dispath: Dispatch): IdispatchProps => {
        return {
            changeDivide: (divide: IdivideNums): Action => dispath(changeDivideAction(divide)),
        };
    },
)(Divide);
