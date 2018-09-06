import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { Action, changeDivideAction } from "../redux/actions";
import { IdivideNums, Istate } from "../redux/reducers";

interface IstateProps {
    divide: IdivideNums;
    image?: HTMLImageElement;
}

interface IdispatchProps {
    changeDivide: (divide: IdivideNums) => Action;
}

type Props = IstateProps & IdispatchProps;

class Divide extends React.Component<Props> {
    public render(): React.ReactNode {
        const { divide, image } = this.props;
        if (!image) {
            return null;
        }
        return (
            <div>
              <h3>Divide</h3>
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
                  <input type="submit" className="btn btn-primary" />
                </div>
              </form>
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

        // TODO
    }
}
export default connect(
    (state: Istate): IstateProps => {
        return {
            divide: state.divide,
            image: state.image,
        };
    },
    (dispath: Dispatch): IdispatchProps => {
        return {
            changeDivide: (divide: IdivideNums): Action => dispath(changeDivideAction(divide)),
        };
    },
)(Divide);
