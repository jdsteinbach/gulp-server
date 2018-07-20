(() => {
  'use strict'

  /**
   * Required node plugins
   */
  const gulp = require('gulp')
  const glob = require('glob')
  const del = require('del')
  const browserSync = require('browser-sync').create()
  const reload = browserSync.reload
  const $ = require('gulp-load-plugins')()
  const postcss = require('gulp-postcss')
  const prefix = require('autoprefixer')
  const cssnano = require('cssnano')

  /**
   * Set up prod/dev tasks
   */
  const isProd = !($.util.env.dev)

  /**
   * Set up file paths
   */
  const assetsDir = './assets'
  const srcDir = `${assetsDir}/src`
  const scssDir = `${srcDir}/scss`
  const jsDir = `${srcDir}/js`
  const buildDir = `${assetsDir}/${(isProd) ? 'dist' : 'dev'}`

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
  gulp.task('clean', () => del(buildDir + '/**/*'))

  /**
   * Lints the gulpfile for errors
   */
  gulp.task('lint:gulpfile', () =>
    gulp.src('gulpfile.js')
      .pipe($.jshint())
      .pipe($.jshint.reporter('default'))
      .on('error', errorAlert)
  )

  /**
   * Lints the source js files for errors
   */
  gulp.task('lint:src', () =>
    gulp.src([
      `${jsDir}/**/*.js`,
      '!**/libs/**/*.js'
    ])
      .pipe($.jshint())
      .pipe($.jshint.reporter('default'))
      .on('error', errorAlert)
  )

  /**
   * Lints all the js files for errors
   */
  gulp.task('lint', [
    'lint:gulpfile',
    'lint:src',
    'lint:sass'
  ])

  /**
   * Concatenates, minifies and renames the source JS files for dist/dev
   */
  gulp.task('scripts', () => {
    var matches = glob.sync(`${jsDir}/*`)

    if (matches.length) {
      matches.forEach(function (match) {
        var dir = match.split('/js/')[1]
        var scripts = [
          `${jsDir}/${dir}/libs/**/*.js`,
          `${jsDir}/${dir}/**/*.js`
        ]

        gulp.src(scripts)
          .pipe($.plumber({ errorHandler: errorAlert }))
          .pipe($.concat(`${dir}.js`))
          .pipe($.babel())
          .pipe(isProd ? $.uglify() : $.util.noop())
          .pipe(isProd ? $.rename({ suffix: '.min' }) : $.util.noop())
          .pipe(gulp.dest(buildDir))
          .pipe(reload({stream: true}))
          .on('error', errorAlert)
          .pipe(
            $.notify({
              message: `${dir} scripts have been compiled`,
              onLast: true
            })
          )
      })
    }
  })

  /**
   * Compiles and compresses the source Sass files for dist/dev
   */
  gulp.task('styles', () => {
    var sassOpts = {
      outputStyle: isProd ? 'compressed' : 'expanded'
    }

    var postcssOpts = [
      prefix({browsers: ['last 3 versions']})
    ]

    if (isProd) postcssOpts.push(cssnano())

    return gulp.src(`${scssDir}/style.scss`)
      .pipe($.plumber({ errorHandler: errorAlert }))
      .pipe($.sass(sassOpts))
      .on('error', function (err) {
        let error = new $.util.PluginError()
        error(
          'CSS',
          err,
          {
            showStack: true
          }
        )
      })
      .pipe(isProd ? $.rename({ suffix: '.min' }) : $.util.noop())
      .pipe(postcss(postcssOpts))
      .pipe(gulp.dest(buildDir))
      .pipe(reload({stream: true}))
      .on('error', errorAlert)
      .pipe(
        $.notify({
          message: (isProd) ? 'Styles have been compiled and minified' : 'Dev styles have been compiled',
          onLast: true
        })
      )
  })

  /**
   * Lint the Sass
   */
  gulp.task('lint:sass', () =>
    gulp.src([
      `${scssDir}/**/*.scss`,
      `!${scssDir}/vendor/*`
    ])
      .pipe($.sassLint({
        'merge-default-rules': true
      }))
      .pipe($.sassLint.format())
      .pipe($.sassLint.failOnError())
  )

  /**
   * Builds for distribution (staging or production)
   */
  gulp.task('build', ['clean', 'styles', 'scripts'])

  /**
   * Builds assets and reloads the page when any php, html, img or dev files change
   */
  gulp.task('watch', ['build'], () => {
    browserSync.init({
      server: {
        baseDir: './'
      },
      notify: true
    })

    gulp.watch(`${scssDir}/**/*`, ['styles'])
    gulp.watch(`${jsDir}/**/*`, ['scripts'])
    gulp.watch('./**/*.{html,php}').on('change', reload)
  })

  /**
   * Backup default task just triggers a build
   */
  gulp.task('default', ['build'])
})()
