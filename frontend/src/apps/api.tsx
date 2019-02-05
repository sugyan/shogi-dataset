import * as React from "react";

interface Istate {
    responses: string[];
    submitting: boolean;
    tokens: string[];
}

interface Iparam {
    key: string;
    required: boolean;
}

interface Iapi {
    endpoint: string;
    method: string;
    name: string;
    params: Iparam[];
}

class Api extends React.Component<{}, Istate> {
    private apis: Iapi[] = [{
        endpoint: "/api/total",
        method: "GET",
        name: "Get total",
        params: [],
    }, {
        endpoint: "/api/images",
        method: "GET",
        name: "Get images",
        params: [
            { key: "cursor", required: false },
            { key: "label", required: false },
        ],
    }];
    public constructor(props: any) {
        super(props);
        this.state = {
            responses: [],
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
            this.updateTokens(tokens);
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
        const { responses } = this.state;
        const header: string = `-H 'Authorization: Bearer ${token}'`;
        const apiUrlBase: string = `${location.protocol}//${location.host}`;
        const docs: React.ReactNode = this.apis.map((e: Iapi, i: number) => {
            const params: React.ReactNode = e.params.map((p: Iparam, j: number) => {
                return (
                    <li key={j}><code>{p.key}</code>: <var>{p.required ? "required" : "optional"}</var></li>
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
                    <dt>Response</dt>
                    <dd>
                      <pre style={{ backgroundColor: "#f7f7f9", padding: 10 }}>
                        <samp>{responses[i]}</samp>
                      </pre>
                    </dd>
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
            this.updateTokens(tokens);
        }).catch((err: Error) => {
            window.console.error(err.message);
        }).finally(() => {
            this.setState({ submitting: false });
        });
    }
    private updateTokens(tokens: string[]) {
        this.setState({ tokens }, () => {
            this.apis.forEach((api: Iapi, index: number) => {
                fetch(
                    api.endpoint, {
                        credentials: "omit",
                        headers: {
                            Authorization: `Bearer ${tokens[0]}`,
                        },
                    },
                ).then((res: Response) => {
                    if (res.ok) {
                        return res.json();
                    }
                    throw new Error(res.statusText);
                }).then((json) => {
                    const { responses } = this.state;
                    responses[index] = JSON.stringify(json, null, "  ");
                    this.setState({ responses });
                }).catch((err: Error) => {
                    window.console.error(err.message);
                });
            });
        });
    }
}
export default Api;
