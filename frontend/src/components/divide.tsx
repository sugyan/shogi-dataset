import * as tf from "@tensorflow/tfjs";
import { loadFrozenModel } from "@tensorflow/tfjs-converter";
import * as React from "react";
import { connect } from "react-redux";
import { Button, Modal, ModalBody, ModalFooter } from "reactstrap";
import { Dispatch } from "redux";

import { Action, changeDivideAction } from "../redux/actions";
import { IdivideNums, Istate } from "../redux/reducers";

interface Ilabel {
    label?: string;
    value?: string;
}

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
    modal: boolean;
    targetImage: string;
}

class Divide extends React.Component<Props, IdivideState> {
    private options: Ilabel[] = [
        {},
        { value: "BLANK", label: "空白" },
        { value: "B_FU", label: "▲歩兵 (B_FU)" },
        { value: "B_KY", label: "▲香車 (B_KY)" },
        { value: "B_KE", label: "▲桂馬 (B_KE)" },
        { value: "B_GI", label: "▲銀将 (B_GI)" },
        { value: "B_KI", label: "▲金将 (B_KI)" },
        { value: "B_KA", label: "▲角行 (B_KA)" },
        { value: "B_HI", label: "▲飛車 (B_HI)" },
        { value: "B_OU", label: "▲玉将 (B_OU)" },
        { value: "B_TO", label: "▲と金 (B_TO)" },
        { value: "B_NY", label: "▲成香 (B_NY)" },
        { value: "B_NK", label: "▲成桂 (B_NK)" },
        { value: "B_NG", label: "▲成銀 (B_NG)" },
        { value: "B_UM", label: "▲竜馬 (B_UM)" },
        { value: "B_RY", label: "▲竜王 (B_RY)" },
        { value: "W_FU", label: "△歩兵 (W_FU)" },
        { value: "W_KY", label: "△香車 (W_KY)" },
        { value: "W_KE", label: "△桂馬 (W_KE)" },
        { value: "W_GI", label: "△銀将 (W_GI)" },
        { value: "W_KI", label: "△金将 (W_KI)" },
        { value: "W_KA", label: "△角行 (W_KA)" },
        { value: "W_HI", label: "△飛車 (W_HI)" },
        { value: "W_OU", label: "△玉将 (W_OU)" },
        { value: "W_TO", label: "△と金 (W_TO)" },
        { value: "W_NY", label: "△成香 (W_NY)" },
        { value: "W_NK", label: "△成桂 (W_NK)" },
        { value: "W_NG", label: "△成銀 (W_NG)" },
        { value: "W_UM", label: "△竜馬 (W_UM)" },
        { value: "W_RY", label: "△竜王 (W_RY)" },
    ];
    public constructor(props: Props) {
        super(props);
        this.state = {
            images: [],
            modal: false,
            targetImage: "",
        };
    }
    public componentDidMount() {
        // TODO
        const MODEL_URL = "/static/data/tensorflowjs_model.pb";
        const WEIGHTS_URL = "/static/data/weights_manifest.json";
        loadFrozenModel(
            MODEL_URL, WEIGHTS_URL,
        ).then((model) => {
            window.console.log(model);
        }).catch((err: Error) => {
            window.console.error(err);
        });
    }
    public render(): React.ReactNode {
        const { divide, image } = this.props;
        const { images, modal, targetImage } = this.state;
        if (!image) {
            return null;
        }
        const results: React.ReactNode[] = images.map((v, i) => {
            return (
                <tr key={i} style={{ marginBottom: 5 }} onClick={this.onClickImage.bind(this, i)}>
                  <td>
                    <img src={v} />
                  </td>
                </tr>
            );
        });
        const options = this.options.map((option: Ilabel, i: number) => {
            return (
                <option key={i} value={option.value}>{option.label}</option>
            );
        });
        return (
            <div>
              <Modal isOpen={modal} toggle={this.toggleModal.bind(this)} backdrop={true}>
                <ModalBody>
                  <div className="row">
                    <div className="col-md-3">
                      <img src={targetImage} />
                    </div>
                    <div className="col-md-9">
                      <select className="form-control">
                        {options}
                      </select>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="secondary" onClick={this.toggleModal.bind(this)}>
                    Cancel
                  </Button>
                </ModalFooter>
              </Modal>
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
    private onClickImage(i: number) {
        const { images } = this.state;
        this.setState({
            modal: true,
            targetImage: images[i],
        });
    }
    private toggleModal() {
        const { modal } = this.state;
        this.setState({ modal: !modal });
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
