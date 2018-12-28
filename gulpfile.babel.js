import { dest, series, src, task, watch } from 'gulp'
import yargs from 'yargs'
import glob from 'glob'
import del from 'del'
import postcss from 'gulp-postcss'
import prefix from 'autoprefixer'
import cssnano from 'cssnano'

let browserSync = require('browser-sync').create()
let { reload } = browserSync
let $ = require('gulp-load-plugins')()

/**
 * Set up prod/dev tasks
 */
const PROD = !(yargs.argv.dev)

/**
 * Set up file paths
 */
const _assetsDir = './assets'
const _srcDir = _assetsDir + '/src'
const _distDir = _assetsDir + '/dist'
const _devDir = _assetsDir + '/dev'
const _buildDir = (PROD) ? _distDir : _devDir
const _bowerDir = './bower_components'

/**
 * Error notification settings
 */
const errorAlert = err => {
  $.notify.onError({
    message: '<%= error.message %>',
    sound: 'Sosumi'
  })(err)
}

/**
 * Clean the dist/dev directories
 */
task('clean', function (cb) {
  del(_buildDir + '/**/*')
  cb()
})

/**
 * Lints the gulpfile for errors
 */
task('lint:gulpfile', function () {
  src('gulpfile.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'))
    .on('error', errorAlert)
})

/**
 * Lints the source js files for errors
 */
task('lint:src', function () {
  let _src = [
    _srcDir + '/js/**/*.js',
    '!**/libs/**/*.js'
  ]

  src(_src)
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'))
    .on('error', errorAlert)
})

/**
 * Lint the Sass
 */
task('lint:sass', function () {
  src([_srcDir + '/scss/**/*.scss', '!' + _srcDir + '/scss/vendor/*'])
    .pipe($.sassLint({
      'merge-default-rules': true
    }))
    .pipe($.sassLint.format())
    .pipe($.sassLint.failOnError())
})

/**
 * Lints all the js files for errors
 */
task('lint', series('lint:gulpfile', 'lint:src', 'lint:sass'))

/**
 * Concatenates, minifies and renames the source JS files for dist/dev
 */
task('scripts', function () {
  let matches = glob.sync(_srcDir + '/js/*')

  if (matches.length) {
    matches.forEach(function (match) {
      let dir = match.split('/js/')[1]
      let scripts = [
        _srcDir + '/js/' + dir + '/libs/**/*.js',
        _srcDir + '/js/' + dir + '/**/*.js'
      ]

      if (dir === 'footer') {
        // Add any JS from Bower or another location
        // to this `footerLibs` array to concat it into `footer.js`
        // eg: _bowerDir + '/responsive-nav/responsive-nav.min.js'
        let footerLibs = [
          _bowerDir + '/js-cookie/src/js.cookie.js'
        ]

        scripts = footerLibs.concat(scripts)
      }

      src(scripts)
        .pipe($.plumber({ errorHandler: errorAlert }))
        .pipe($.concat(dir + '.js'))
        .pipe(
          $.notify({
            message: 'Before Babel'
          })
        )
        .pipe($.babel())
        .pipe(
          $.notify({
            message: 'After Babel'
          })
        )
        .pipe(PROD ? $.uglify() : $.util.noop())
        .pipe(PROD ? $.rename(dir + '.min.js') : $.util.noop())
        .pipe(dest(_buildDir))
        .pipe(reload({ stream: true }))
        .on('error', errorAlert)
        .pipe(
          $.notify({
            message: dir + ' scripts have been compiled',
            onLast: true
          })
        )
    })
  }
})

/**
 * Compiles and compresses the source Sass files for dist/dev
 */
task('styles', function (cb) {
  const _sassOpts = {
    outputStyle: PROD ? 'compressed' : 'expanded',
    sourceComments: !PROD
  }

  const _postcssOpts = [
    prefix({ browsers: ['last 3 versions'] })
  ]

  if (PROD) _postcssOpts.push(cssnano())

  src(_srcDir + '/scss/style.scss')
    .pipe($.plumber({ errorHandler: errorAlert }))
    .pipe($.sass(_sassOpts))
    .on('error', function (err) {
      new $.util.PluginError(
        'CSS',
        err,
        {
          showStack: true
        }
      )
    })
    .pipe(PROD ? $.rename({ suffix: '.min' }) : $.util.noop())
    .pipe(postcss(_postcssOpts))
    .pipe(dest(_buildDir))
    .pipe(reload({ stream: true }))
    .on('error', errorAlert)
    .pipe(
      $.notify({
        message: (PROD) ? 'Styles have been compiled and minified' : 'Dev styles have been compiled',
        onLast: true
      })
    )
  cb()
})

/**
 * Builds for distribution (staging or production)
 */
task('build', series('clean', 'styles', function (cb) {
  cb()
}))

/**
 * Builds assets and reloads the page when any php, html, img or dev files change
 */
task('watch:files', series('build', function () {
  browserSync.init({
    server: {
      baseDir: './'
    },
    notify: true
  })

  watch(_srcDir + '/scss/**/*', ['styles'])
  watch(_srcDir + '/js/**/*', ['scripts'])
  watch('./**/*.html').on('change', reload)
}))

/**
 * Backup default task just triggers a build
 */
task('default', series('build', function (cb) {
  cb()
}))
