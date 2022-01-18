const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    funcomponent: "./src/fun-component.jsx",
    classcomponent: "./src/class-component.jsx",
    index: "./src/index.jsx",
    demo: "./src/demo.jsx",
    okrtree: "./src/okr-tree.jsx",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
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
      title: "index",
      template: "./public/index.html",
      chunks: ["index"],
      filename: "index.html",
    }),
    new HtmlWebpackPlugin({
      title: "funcomponent",
      template: "./public/index.html",
      chunks: ["funcomponent"],
      filename: "funcomponent.html",
    }),
    new HtmlWebpackPlugin({
      title: "classcomponent",
      template: "./public/index.html",
      chunks: ["classcomponent"],
      filename: "classcomponent.html",
    }),
    new HtmlWebpackPlugin({
      title: "okrtree",
      template: "./public/index.html",
      chunks: ["okrtree"],
      filename: "okrtree.html",
    }),
    new HtmlWebpackPlugin({
      title: "demo",
      template: "./public/index.html",
      chunks: ["demo"],
      filename: "demo.html",
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
