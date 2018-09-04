import * as React from "react";
import { connect } from "react-redux";
import { Istate } from "../redux/reducers";

interface IstateProps {
    image?: HTMLImageElement;
}

type Props = IstateProps;

interface IdivideStates {
    row: number;
    col: number;
}

class Divide extends React.Component<Props, IdivideStates> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            col: 9,
            row: 9,
        };
    }
    public render(): React.ReactNode {
        const { image } = this.props;
        const { row, col } = this.state;
        if (!image) {
            return null;
        }
        return (
            <div>
              <h3>Divide</h3>
              <form>
                <div className="form-group row">
                  <label className="col-sm-3 col-form-label">Rows</label>
                  <div className="col-sm-9">
                    <input
                      type="number" min={1} max={9}
                      name="row"
                      className="form-control"
                      value={row}
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
                      value={col}
                      onChange={this.onChangeNumber.bind(this)}
                    />
                  </div>
                </div>
              </form>
            </div>
        );
    }
    private onChangeNumber(ev: Event) {
        const target: HTMLInputElement = ev.target as HTMLInputElement;
        const nextState: any = {};
        nextState[target.name] = target.value;
        this.setState(nextState);
    }
}
export default connect(
    (state: Istate): IstateProps => {
        return {
            image: state.image,
        };
    },
)(Divide);
