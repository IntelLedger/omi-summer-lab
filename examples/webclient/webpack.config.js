var path = require('path')

module.exports = {
  entry: './app/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },

  resolve: {
    alias: {
      zeromq$: path.resolve(__dirname, './node_modules/omi-summer-lab/lib/mock_zeromq.js')
    }
  }
}
