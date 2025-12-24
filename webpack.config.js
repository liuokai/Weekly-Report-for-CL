module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new (require('html-webpack-plugin'))({
      template: './public/index.html',
    }),
  ],
  devServer: {
    static: [
      {
        directory: __dirname + '/public',
      },
      {
        directory: __dirname + '/src/data',
        publicPath: '/src/data',
      }
    ],
    compress: true,
    port: 8000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
