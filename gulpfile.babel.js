/**
 * Required node plugins
 */
var gulp = require('gulp')
var glob = require('glob')
var del = require('del')
var browserSync = require('browser-sync').create()
var reload = browserSync.reload
var $ = require('gulp-load-plugins')()
var postcss = require('gulp-postcss')
var prefix = require('autoprefixer')
var cssnano = require('cssnano')

/**
 * Set up prod/dev tasks
 */
var isProd = !($.util.env.dev)

/**
 * Set up file paths
 */
var _assetsDir = './assets'
var _srcDir = _assetsDir + '/src'
var _distDir = _assetsDir + '/dist'
var _devDir = _assetsDir + '/dev'
var _buildDir = (isProd) ? _distDir : _devDir
var _bowerDir = './bower_components'

/**
 * Error notification settings
 */
function errorAlert (err) {
  $.notify.onError({
    message: '<%= error.message %>',
    sound: 'Sosumi'
  })(err)
}

/**
 * Clean the dist/dev directories
 */
gulp.task('clean', function (cb) {
  del(_buildDir + '/**/*')
  cb()
})

/**
 * Lints the gulpfile for errors
 */
gulp.task('lint:gulpfile', function () {
  gulp.src('gulpfile.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'))
    .on('error', errorAlert)
})

/**
 * Lints the source js files for errors
 */
gulp.task('lint:src', function () {
  var _src = [
    _srcDir + '/js/**/*.js',
    '!**/libs/**/*.js'
  ]

  gulp.src(_src)
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'))
    .on('error', errorAlert)
})

/**
 * Lint the Sass
 */
gulp.task('lint:sass', function () {
  gulp.src([_srcDir + '/scss/**/*.scss', '!' + _srcDir + '/scss/vendor/*'])
    .pipe($.sassLint({
      'merge-default-rules': true
    }))
    .pipe($.sassLint.format())
    .pipe($.sassLint.failOnError())
})

/**
 * Lints all the js files for errors
 */
gulp.task('lint', gulp.series('lint:gulpfile', 'lint:src', 'lint:sass'))

/**
 * Concatenates, minifies and renames the source JS files for dist/dev
 */
gulp.task('scripts', function () {
  var matches = glob.sync(_srcDir + '/js/*')

  if (matches.length) {
    matches.forEach(function (match) {
      var dir = match.split('/js/')[1]
      var scripts = [
        _srcDir + '/js/' + dir + '/libs/**/*.js',
        _srcDir + '/js/' + dir + '/**/*.js'
      ]

      if (dir === 'footer') {
        // Add any JS from Bower or another location
        // to this `footerLibs` array to concat it into `footer.js`
        // eg: _bowerDir + '/responsive-nav/responsive-nav.min.js'
        var footerLibs = [
          _bowerDir + '/js-cookie/src/js.cookie.js'
        ]

        scripts = footerLibs.concat(scripts)
      }

      gulp.src(scripts)
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
        .pipe(isProd ? $.uglify() : $.util.noop())
        .pipe(isProd ? $.rename(dir + '.min.js') : $.util.noop())
        .pipe(gulp.dest(_buildDir))
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
gulp.task('styles', function (cb) {
  var _sassOpts = {
    outputStyle: isProd ? 'compressed' : 'expanded',
    sourceComments: !isProd
  }

  var _postcssOpts = [
    prefix({ browsers: ['last 3 versions'] })
  ]

  if (isProd) _postcssOpts.push(cssnano())

  gulp.src(_srcDir + '/scss/style.scss')
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
    .pipe(isProd ? $.rename({ suffix: '.min' }) : $.util.noop())
    .pipe(postcss(_postcssOpts))
    .pipe(gulp.dest(_buildDir))
    .pipe(reload({ stream: true }))
    .on('error', errorAlert)
    .pipe(
      $.notify({
        message: (isProd) ? 'Styles have been compiled and minified' : 'Dev styles have been compiled',
        onLast: true
      })
    )
  cb()
})

/**
 * Builds for distribution (staging or production)
 */
gulp.task('build', gulp.series('clean', 'styles', function (cb) {
  cb()
}))

/**
 * Builds assets and reloads the page when any php, html, img or dev files change
 */
gulp.task('watch', gulp.series('build', function () {
  browserSync.init({
    server: {
      baseDir: './'
    },
    notify: true
  })

  gulp.watch(_srcDir + '/scss/**/*', ['styles'])
  gulp.watch(_srcDir + '/js/**/*', ['scripts'])
  gulp.watch('./**/*.html').on('change', reload)
}))

/**
 * Backup default task just triggers a build
 */
gulp.task('default', gulp.series('build', function (cb) {
  cb()
}))
