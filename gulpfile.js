const gulp = require('gulp'),
      pug = require('gulp-pug'),
      sass = require('gulp-sass'),
      sourceMaps = require('gulp-sourcemaps'),
      plumber = require('gulp-plumber'),
      rename = require('gulp-rename'),
      csso = require('gulp-csso'),
      notify = require('gulp-notify'),
      del = require('del'),
      browserSync = require('browser-sync').create(),
      autoprefixer = require('gulp-autoprefixer'),
      imagemin = require('gulp-imagemin'),
      imageminJpegRecompress = require('imagemin-jpeg-recompress'),
      pngquant = require('imagemin-pngquant'),
      cache = require('gulp-cache'),
      svgSprite = require('gulp-svg-sprite'),
      cheerio = require('gulp-cheerio'),
      replace = require('gulp-replace'),
      svgmin = require('gulp-svgmin'),
      uglify = require('gulp-uglify'),
      webpack = require('webpack'),
      webpackStream = require('webpack-stream');

const paths = {
  root: './dist',
  templates: {
    pages: './src/views/pages/*.pug',
    src: './src/views/**/*.pug',
    dest: './dist'
  },
  styles: {
    main: './src/assets/styles/main.scss',
    src: './src/assets/styles/**/*.scss',
    dest: './dist/assets/css'
  },
  js: {
    src: './src/assets/scripts/**/*.js',
    scripts: {
      main: './src/assets/scripts/main.js',
      app: './src/assets/scripts/app.js'
    },
    dest: './dist/assets/js'
  },
  images: {
    src: './src/assets/images/**/*.{png,jpg,gif,svg}',
    dest: './dist/assets/images'
  },
  svg: {
    src: './src/assets/svg/**/*.svg',
    dest: './src/assets/svgsprite'
  },
  fonts: {
    src: './src/assets/fonts/**/*.*',
    dest: './dist/assets/fonts'
  }
};

const templates = () => {
  return gulp.src(paths.templates.pages)
        .pipe(pug({ pretty: true }))
        .on('error', notify.onError({
          title: 'templates'
        }))
        .pipe(gulp.dest(paths.templates.dest))
        .on('end', browserSync.reload);
}

const styles = () => {
  return gulp.src(paths.styles.main)
        .pipe(sourceMaps.init())
        .pipe(plumber())
        .pipe(sass({
          includePaths: ['node_modules/']
        }))
        .on('error', notify.onError({
          title: 'styles'
        }))
        .pipe(autoprefixer({
          borwsers: ['last 3 version']
        }))
        // .pipe(csso())
        .pipe(sourceMaps.write())
        .pipe(rename('main.min.css'))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.stream());
}

const stylesProd = () => {
  return gulp.src(paths.styles.main)
        .pipe(sass({
          includePaths: ['node_modules/']
        }))
        .pipe(autoprefixer({
          borwsers: ['last 3 version']
        }))
        .pipe(csso())
        .pipe(rename('main.min.css'))
        .pipe(gulp.dest(paths.styles.dest));
}

const images = () => {
  return gulp.src(paths.images.src)
        .pipe(gulp.dest(paths.images.dest))
        .pipe(browserSync.stream());
}

const imagesProd = () => {
  return gulp.src(paths.images.src)
        .pipe(cache(imagemin([
          imagemin.gifsicle({ interlaced: true }),
          imagemin.jpegtran({ progressive: true }),
          imageminJpegRecompress({
            loops: 5,
            min: 70,
            max: 75,
            quality: 'medium'
          }),
          imagemin.svgo(),
          imagemin.optipng({ optimizationLevel: 3 }),
          pngquant({
            quality: '65-70',
            speed: 5
          })
        ],
        {
          verbose: true
        }
        )))
        .pipe(gulp.dest(paths.images.dest));
}

const svg = () => {
  return gulp.src(paths.svg.src)
        .pipe(svgmin({
          js2svg: {
              pretty: true
          }
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "sprite.svg"
                }
            }
        }))
        .pipe(gulp.dest(paths.svg.dest))
        .pipe(browserSync.stream());
}

const fonts = () => {
  return gulp.src(paths.fonts.src)
        .pipe(gulp.dest(paths.fonts.dest))
        .pipe(browserSync.stream());
}

const js = () => {
  return gulp.src(paths.js.scripts.main)
        .pipe(webpackStream({
          mode: 'none',
          entry: paths.js.scripts,
          output: {
            filename: '[name].min.js'
          },
          module: {
            rules: [
              {
                test: /\.(js)$/,
                exclude: '/(node_modules)/',
                loader: 'babel-loader',
              }
            ]
          }
        }))
        .pipe(gulp.dest(paths.js.dest))
        .on('end', browserSync.reload);
}

const clean = () => del(paths.root)

const watch = () => {
  gulp.watch(paths.templates.src, templates);
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.fonts.src, fonts);
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.svg.src, svg);
  gulp.watch(paths.js.src, js);
}

const serve = () => {
  browserSync.init({
    server: {
      baseDir: paths.root
    },
    port: 8080,
    open: false
  });
}

exports.templates = templates;
exports.styles = styles;
exports.stylesProd = stylesProd;
exports.images = images;
exports.imagesProd = imagesProd;
exports.svg = svg;
exports.js = js;
exports.fonts = fonts;
exports.clean = clean;
exports.watch = watch;
exports.serve = serve;

gulp.task('default', gulp.series(
  clean,
  gulp.parallel(
    styles,
    templates,
    images,
    svg,
    fonts,
    js
  ),
  templates,
  gulp.parallel(watch, serve)
));

gulp.task('build', gulp.series(
  clean,
  gulp.parallel(
    stylesProd,
    templates,
    imagesProd,
    svg,
    fonts,
    js
  ),
  templates
));
