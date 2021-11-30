const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/fun-component.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js|jsx?$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Dev",
      template: "./public/index.html",
    }),
  ],
  devServer: {
    port: 3333,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        pathRewrite: { "^/api": "" },
      },
    },
  },
};
