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
    new (require('dotenv-webpack'))({
      path: './server/.env' // Fix: Point to the .env file in server directory
    })
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
      '/api': {
        target: 'http://localhost:3001',
        secure: false,
        changeOrigin: true,
        timeout: 300000, // 5 minutes timeout
        proxyTimeout: 300000,
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
