import * as React from "react";

interface Istate {
    submitting: boolean;
    tokens: string[];
}

class Api extends React.Component<{}, Istate> {
    public constructor(props: any) {
        super(props);
        this.state = {
            submitting: false,
            tokens: [],
        };
    }
    public componentDidMount() {
        fetch(
            "/api/token",
        ).then((res: Response) => {
            return res.json();
        }).then((tokens: string[]) => {
            this.setState({ tokens });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { submitting, tokens } = this.state;
        const tokenList: React.ReactNode = tokens.map((e: string, i: number) => {
            return (
                <p key={i} style={{ padding: 10, backgroundColor: "#f7f7f9" }}>
                  <code>{e}</code>
                </p>
            );
        });
        return (
            <React.Fragment>
              <h2>API</h2>
              <h3>Your token</h3>
              <div>{tokenList}</div>
              <div>
                <button
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={this.onClickGenerate.bind(this)}>
                  {tokens.length > 0 ? "Regenerate" : "Generate"}
                </button>
              </div>
              <hr />
              {tokens.length > 0 && this.renderDocuments(tokens[0])}
            </React.Fragment>
        );
    }
    private renderDocuments(token: string): React.ReactNode {
        const header: string = `-H 'Authorization: Bearer ${token}'`;
        interface Iparam {
            key: string;
            value: string;
        }
        interface Iapi {
            endpoint: string;
            method: string;
            name: string;
            params: Iparam[];
        }
        const apis: Iapi[] = [{
            endpoint: "/api/total",
            method: "GET",
            name: "Get total",
            params: [],
        }, {
            endpoint: "/api/images",
            method: "GET",
            name: "Get images",
            params: [
                { key: "cursor", value: "string" },
                { key: "label", value: "string" },
            ],
        }];
        const apiUrlBase: string = `${location.protocol}//${location.host}`;
        const docs: React.ReactNode = apis.map((e: Iapi, i: number) => {
            const params: React.ReactNode = e.params.map((p: Iparam, j: number) => {
                return (
                    <li key={j}><code>{p.key}</code>: <var>{p.value}</var></li>
                );
            });
            return (
                <React.Fragment key={i}>
                  <h4>{e.name}</h4>
                  <dl>
                    <dt>Endpoint</dt>
                    <dd><code>{e.endpoint}</code></dd>
                    <dt>Method</dt>
                    <dd><code>{e.method}</code></dd>
                    <dt>Parameters</dt>
                    <dd>
                      <ul>{params}</ul>
                    </dd>
                    <dt>Example</dt>
                    <dd><code>{`curl ${header} ${apiUrlBase}${e.endpoint}`}</code></dd>
                  </dl>
                </React.Fragment>
            );
        });
        return (
            <React.Fragment>
              <h3>APIs</h3>
              {docs}
            </React.Fragment>
        );
    }
    private onClickGenerate() {
        this.setState({ submitting: true });
        fetch(
            "/api/token", {
                method: "POST",
            },
        ).then((res: Response) => {
            return res.json();
        }).then((tokens: string[]) => {
            this.setState({ tokens });
        }).catch((err: Error) => {
            window.console.error(err.message);
        }).finally(() => {
            this.setState({ submitting: false });
        });
    }
}
export default Api;
