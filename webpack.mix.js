// webpack.mix.js

const mix = require('laravel-mix')

mix
  .js('src/index.js', 'js')
  .vue()
  .sourceMaps()
  .sass('src/styles/index.scss', 'css')
  .setPublicPath('dist')
