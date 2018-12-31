import { dest, series, src, task, watch } from 'gulp'
import yargs from 'yargs'
import glob from 'glob'
import del from 'del'
import babel from 'gulp-babel'
import concat from 'gulp-concat'
import gulpif from 'gulp-if'
import standard from 'gulp-standard'
import uglify from 'gulp-uglify'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import rename from 'gulp-rename'
import sass from 'gulp-sass'
import sassLint from 'gulp-sass-lint'
import postcss from 'gulp-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import cssDeclararationSorter from 'css-declaration-sorter'

let browserSync = require('browser-sync').create()
let { reload } = browserSync

/**
 * Set up prod/dev tasks
 */
const PROD = !(yargs.argv.dev)

/**
 * Set up file paths
 */
const _assetsDir = './assets'
const _cleanDir = `${_assetsDir}/**/*`
const _srcDir = `${_assetsDir}/src`
const _distDir = `${_assetsDir}/dist`
const _devDir = `${_assetsDir}/dev`
const _buildDir = PROD ? _distDir : _devDir

/**
 * Error notification settings
 */
const errorAlert = err => {
  let _notifyOpts = {
    title: 'Gulp <%= error.name %>: <%= error.plugin %>',
    message: '<%= error.stack %>',
    sound: 'Basso'
  }
  notify.onError(_notifyOpts)(err)
}

/**
 * Clean the dist/dev directories
 */
task('clean', () => del(_cleanDir))

/**
 * Lints the gulpfile for errors
 */
task('lint:gulpfile', () => {
  return src('gulpfile.*')
    .pipe(standard())
    .pipe(standard.reporter('default'))
    .on('error', errorAlert)
})

/**
 * Lints the source js files for errors
 */
task('lint:src', () => {
  let _src = [
    `${_srcDir}/js/**/*.js`,
    '!**/libs/**/*.js'
  ]

  return src(_src)
    .pipe(standard())
    .pipe(standard.reporter('default'))
    .on('error', errorAlert)
})

/**
 * Lint the Sass
 */
task('lint:sass', () => {
  let _src = [
    `${_srcDir}/scss/**/*.scss`,
    `!${_srcDir}/scss/vendor/*`
  ]

  return src(_src)
    .pipe(sassLint({
      'merge-default-rules': true
    }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
})

/**
 * Lints all the js files for errors
 */
task('lint', series('lint:gulpfile', 'lint:src', 'lint:sass', cb => cb()))

/**
 * Concatenates, minifies and renames the source JS files for dist/dev
 */
task('scripts', () => {
  return src(`${_srcDir}/js/*.js`)
  .pipe(plumber({errorHandler: errorAlert}))
  .pipe(babel())
  .pipe(gulpif(PROD, uglify()))
  .pipe(gulpif(PROD, rename({ suffix: '.min' })))
  .pipe(dest(_buildDir))
  .pipe(reload({ stream: true }))
  .on('error', errorAlert)
  .pipe(
    notify({
      message: `${PROD ? 'Prod' : 'Dev'} scripts have been transpiled${PROD ? ', uglified, and minified' : ''}`,
      onLast: true
    })
  )
})

/**
 * Compiles and compresses the source Sass files for dist/dev
 */
task('styles', () => {
  const _sassOpts = {
    outputStyle: 'expanded',
    sourceComments: !PROD
  }

  const _postcssOpts = [
    cssDeclararationSorter({order:'smacss'}),
    autoprefixer({ grid: true })
  ]

  if (PROD) _postcssOpts.push(cssnano())

  return src(`${_srcDir}/scss/style.scss`)
    .pipe(plumber({ errorHandler: errorAlert }))
    .pipe(sass(_sassOpts))
    .pipe(gulpif(PROD, rename({ suffix: '.min' })))
    .pipe(postcss(_postcssOpts))
    .pipe(dest(_buildDir))
    .pipe(reload({ stream: true }))
    .on('error', errorAlert)
    .pipe(
      notify({
        message: `${PROD ? 'Prod' : 'Dev'} styles have been compiled${PROD ? ' and minified' : ''}`,
        onLast: true
      })
    )
})

/**
 * Builds for distribution (staging or production)
 */
task('build', series('clean', 'styles', 'scripts', cb => cb()))

/**
 * Builds assets and reloads the page when any php, html, img or dev files change
 */
task('watch:files', series('build', () => {
  browserSync.init({
    server: {
      baseDir: './'
    },
    notify: true
  })

  watch(`${_srcDir}/scss/**/*`, ['styles'])
  watch(`${_srcDir}/js/**/*`, ['scripts'])
  watch('./**/*.html').on('change', reload)
}))

/**
 * Backup default task just triggers a build
 */
task('default', series('build', cb => cb()))
