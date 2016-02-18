var path = require("path");

module.exports = {
  context: __dirname,
  entry: {
    "Sticky":  "./src/Sticky.jsx",
  },
  output: {
    path: path.join(__dirname, 'umd'),
    filename: "[name].js",
    publicPath: "/javascripts/",
    library: "StickyNode",
    libraryTarget: "var"
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  },
  "externals": {
    react: "React",
    classnames: 'classNames'
  }
};
