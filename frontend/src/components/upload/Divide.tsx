/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { Button, Modal, ModalBody, ModalFooter } from "reactstrap";

import { AppState } from "../../redux/store";
import { UploadAction, changeDivide } from "../../redux/actions";
import { DivideNums } from "../../redux/reducers";
import { predictResultString } from "../../utils/functions";
import { labels, labelStringMap } from "../../utils/piece";
import { PredictResult, Predictor } from "../../utils/predictor";

interface Label {
    label?: string;
    value?: string;
}

interface DividedImage {
    src: string;
    predicted?: PredictResult[];
    uploaded: boolean;
}

interface ComponentProps {
    size: number;
}

interface StateProps {
    divide: DivideNums;
    image?: HTMLImageElement;
    imageData?: ImageData;
}

interface DispatchProps {
    changeDivide: (divide: DivideNums) => void;
}

type Props = ComponentProps & StateProps & DispatchProps;

interface State {
    images: DividedImage[];
    modal: boolean;
    selectedLabel: string;
    uploading: boolean;
}

class Divide extends React.Component<Props, State> {
    private targetImageIndex?: number;
    private options = [{}].concat(Object.values(labels).map((e: labels): Label => {
        return {
            label: labelStringMap[e],
            value: e,
        };
    }));

    public constructor(props: Props) {
        super(props);
        this.state = {
            images: [],
            modal: false,
            selectedLabel: "",
            uploading: false,
        };
    }
    public render(): JSX.Element | null {
        const { divide, image } = this.props;
        const { images, modal, selectedLabel, uploading } = this.state;
        if (!image) {
            return null;
        }
        const results = images.map((v: DividedImage, i): JSX.Element => {
            const predicted = v.predicted && <pre>{predictResultString(v.predicted)}</pre>;
            return (
              <tr
                  key={i}
                  className={v.uploaded ? "table-success" : ""}
                  style={{ marginBottom: 5 }}
                  onClick={this.onClickImage.bind(this, i)}
              >
                <td>
                  <img src={v.src} alt="cropped" />
                </td>
                <td style={{ width: "100%" }}>
                  {predicted}
                </td>
              </tr>
            );
        });
        const options = this.options.map((option: Label, i: number): JSX.Element => {
            return <option key={i} value={option.value}>{option.label}</option>;
        });
        return (
          <div>
            <Modal isOpen={modal} toggle={this.toggleModal.bind(this)} backdrop={true}>
              <form onSubmit={this.onSubmitUpload.bind(this)}>
                <ModalBody>
                  <div className="row">
                    <div className="col-md-3">
                      <img src={this.targetImageIndex !== undefined ? images[this.targetImageIndex].src : ""} alt="target" />
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
    private onChangeNumber(ev: React.ChangeEvent): void {
        const { changeDivide, divide } = this.props;
        const nextDivide: DivideNums = { ...divide };
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
    private onSubmitDivide(ev: React.FormEvent): void {
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
        const images: DividedImage[] = urls.map((src: string): DividedImage => {
            return { src, uploaded: false };
        });
        this.setState({ images }, (): void => {
            inputs.forEach((data: ImageData, i: number): void => {
                Predictor.predict([data]).then((results: PredictResult[][]): void => {
                    images[i].predicted = results[0];
                    this.setState({ images });
                });
            });
        });
    }
    private onChangeSelect(ev: React.ChangeEvent): void {
        const select: HTMLSelectElement = ev.target as HTMLSelectElement;
        this.setState({
            selectedLabel: select.value,
        });
    }
    private onSubmitUpload(ev: React.FormEvent): void {
        ev.preventDefault();

        const { images, selectedLabel } = this.state;
        fetch(
            "/api/upload", {
                method: "POST",
                body: JSON.stringify({
                    image: images[this.targetImageIndex!].src,
                    label: selectedLabel,
                }),
            },
        ).then((res: Response): void => {
            if (res.ok) {
                images[this.targetImageIndex!].uploaded = true;
                this.setState({
                    images,
                    modal: false,
                    selectedLabel: "",
                });
            }
        }).catch((err: Error): void => {
            window.console.error(err.message);
        }).finally((): void => {
            this.setState({ uploading: false });
        });
        this.setState({ uploading: true });
    }
    private onClickImage(i: number): void {
        this.targetImageIndex = i;
        this.setState({
            modal: true,
        });
    }
    private toggleModal(): void {
        const { modal } = this.state;
        this.setState({ modal: !modal });
    }
}

export default connect(
    (state: AppState): StateProps => {
        return {
            divide: state.uploadReducer.divide,
            image: state.uploadReducer.image,
            imageData: state.uploadReducer.imageData,
        };
    },
    (dispath: Dispatch<UploadAction>): DispatchProps => {
        return {
            changeDivide: (divide: DivideNums): void => {
                dispath(changeDivide(divide));
            },
        };
    },
)(Divide);
