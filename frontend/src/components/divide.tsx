import * as React from "react";
import { connect } from "react-redux";
import { Istate } from "../redux/reducers";

interface IstateProps {
    image?: HTMLImageElement;
}

class Divide extends React.Component<IstateProps> {
    public render(): React.ReactNode {
        const { image } = this.props;
        if (!image) {
            return null;
        }
        return (
            <div>
              <h3>Divide</h3>
            </div>
        );
    }
}
export default connect(
    (state: Istate): IstateProps => {
        return {
            image: state.image,
        };
    },
)(Divide);
