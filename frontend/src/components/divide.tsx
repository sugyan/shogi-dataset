import * as React from "react";
import { connect } from "react-redux";
import { Button, Modal, ModalBody, ModalFooter } from "reactstrap";
import { Dispatch } from "redux";

import { changeDivideAction, UploaderAction } from "../redux/actions/uploader";
import { Istate } from "../redux/reducer";
import { IdivideNums } from "../redux/reducers/uploader";
import { labels, labelStringMap } from "../utils/piece";
import WorkerProxy, { IpredictResult } from "../utils/worker-proxy";

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
    changeDivide: (divide: IdivideNums) => UploaderAction;
}

type Props = Iprops & IstateProps & IdispatchProps;

interface IdividedImage {
    src: string;
    predicted?: IpredictResult[];
    uploaded: boolean;
}

interface IdivideState {
    images: IdividedImage[];
    modal: boolean;
    selectedLabel: string;
    targetImage?: number;
    uploading: boolean;
}

class Divide extends React.Component<Props, IdivideState> {
    private options: Ilabel[];
    public constructor(props: Props) {
        super(props);
        this.options = [{}];
        Object.keys(labels).forEach((e: string) => {
            this.options.push({ label: labelStringMap[e as labels], value: e });
        });
        this.state = {
            images: [],
            modal: false,
            selectedLabel: "",
            uploading: false,
        };
    }
    public render(): React.ReactNode {
        const { divide, image } = this.props;
        const { images, modal, selectedLabel, targetImage, uploading } = this.state;
        if (!image) {
            return null;
        }
        const results: React.ReactNode[] = images.map((v: IdividedImage, i) => {
            let predicted: React.ReactNode;
            if (v.predicted) {
                const lines: string[] = v.predicted.map((p: IpredictResult, j: number) => {
                    return `${p.label}: ${Math.round(p.score * 10000) / 10000}`;
                });
                predicted = <pre>{lines.join("\n")}</pre>;
            }
            return (
                <tr
                  key={i}
                  className={v.uploaded ? "table-success" : ""}
                  style={{ marginBottom: 5 }}
                  onClick={this.onClickImage.bind(this, i)}
                >
                  <td>
                    <img src={v.src} />
                  </td>
                  <td style={{ width: "100%" }}>
                    {predicted}
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
                <form onSubmit={this.onSubmitUpload.bind(this)}>
                  <ModalBody>
                    <div className="row">
                      <div className="col-md-3">
                        <img src={targetImage !== undefined ? images[targetImage].src : ""} />
                      </div>
                      <div className="col-md-9">
                        <div className="form-group">
                          <label>Label</label>
                          <select
                            className="form-control"
                            onChange={this.onChangeSelect.bind(this)}
                            value={selectedLabel}>
                            {options}
                          </select>
                        </div>
                      </div>
                    </div>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="primary" disabled={selectedLabel === "" || uploading}>
                      Upload
                    </Button>
                    <Button color="secondary" onClick={this.toggleModal.bind(this)}>
                      Cancel
                    </Button>
                  </ModalFooter>
                </form>
              </Modal>
              <form onSubmit={this.onSubmitDivide.bind(this)}>
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
    private onSubmitDivide(ev: Event) {
        ev.preventDefault();

        const { imageData, divide, size } = this.props;
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
        canvas.height = imageData!.height;
        canvas.width  = imageData!.width;
        ctx.putImageData(imageData!, 0, 0);

        const urls: string[] = [];
        const inputs: ImageData[] = [];
        const h: number = imageData!.height / divide.row;
        const w: number = imageData!.width  / divide.col;
        const imgCanvas: HTMLCanvasElement = document.createElement("canvas");
        const imgCtx: CanvasRenderingContext2D = imgCanvas.getContext("2d")!;
        imgCanvas.height = imgCanvas.width = size;
        for (let i = 0; i < divide.row; i++) {
            for (let j = 0; j < divide.col; j++) {
                imgCtx.fillRect(0, 0, size, size);
                imgCtx.drawImage(canvas, w * j, h * i, w, h, 0, 0, size, size);
                inputs.push(imgCtx.getImageData(0, 0, size, size));
                urls.push(imgCanvas.toDataURL("image/jpeg"));
            }
        }
        const images: IdividedImage[] = urls.map((src: string): IdividedImage => {
            return { src, uploaded: false };
        });
        this.setState({ images }, () => {
            inputs.forEach((data: ImageData, i: number) => {
                WorkerProxy.predict([data]).then((results: IpredictResult[][]) => {
                    images[i].predicted = results[0];
                    this.setState({ images });
                });
            });
        });
    }
    private onChangeSelect(ev: Event) {
        const select: HTMLSelectElement = ev.target as HTMLSelectElement;
        this.setState({
            selectedLabel: select.value,
        });
    }
    private onSubmitUpload(ev: Event) {
        ev.preventDefault();

        const { images, selectedLabel, targetImage } = this.state;
        fetch(
            "/api/upload", {
                body: JSON.stringify({
                    image: images[targetImage!].src,
                    label: selectedLabel,
                }),
                method: "POST",
            },
        ).then((res: Response) => {
            if (res.ok) {
                images[targetImage!].uploaded = true;
                this.setState({
                    images,
                    modal: false,
                    selectedLabel: "",
                });
            }
        }).catch((err: Error) => {
            window.console.error(err.message);
        }).finally(() => {
            this.setState({ uploading: false });
        });
        this.setState({ uploading: true });
    }
    private onClickImage(i: number) {
        const { images } = this.state;
        this.setState({
            modal: true,
            targetImage: i,
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
            divide: state.uploaderReducer.divide,
            image: state.uploaderReducer.image,
            imageData: state.uploaderReducer.imageData,
        };
    },
    (dispath: Dispatch): IdispatchProps => {
        return {
            changeDivide: (divide: IdivideNums): UploaderAction => dispath(changeDivideAction(divide)),
        };
    },
)(Divide);
