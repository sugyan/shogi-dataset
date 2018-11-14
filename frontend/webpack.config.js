const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.tsx',
    module: {
        rules: [
            {
                test: /\.?worker\.ts$/,
                use: {
                    loader: 'worker-loader',
                    options: { inline: true }
                }
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            MODEL_URL_BASE: 'http://localhost:8080/static/data'
        })
    ],
    devServer: {
        port: 8081
    }
};
