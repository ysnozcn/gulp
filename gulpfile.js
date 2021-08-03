const gulp = require("gulp");
const uglify = require("gulp-uglify");
const minifyCSS = require("gulp-minify-css");
const sourcemaps = require("gulp-sourcemaps");
const concat = require("gulp-concat");
const del = require("del");
const sass = require("gulp-sass");
const babel = require("gulp-babel");
const browserSync = require("browser-sync");
const autoprefixer = require("gulp-autoprefixer");
const bro = require('gulp-bro');
const uglifyify = require('uglifyify');
const babelify = require('babelify');

var rename = require("gulp-rename");
var iconfont = require('gulp-iconfont');
var consolidate = require('gulp-consolidate');
var iconfontCss = require('gulp-iconfont-css');
var runTimestamp = Math.round(Date.now() / 1000);
var async = require('async');

const server = browserSync.create();

// Clean assets
function clean() {
  return del(["./assets/js/*.js"]);
}

function scripts_plugins() {
  return gulp
    .src([
      "./assets/_src/js/base/jquery-3.2.0.js",
      "./assets/_src/js/base/jquery-migrate-1.4.1.js",
      "./assets/_src/js/libs/*.js",
    ])
    .pipe(uglify())
    .pipe(concat("file.plugins.min.js"))
    .pipe(gulp.dest("./assets/js/"));
}

function scripts() {
  return gulp
    .src(["./assets/_src/js/file.script.js"])
    .pipe(bro({
      transform: [
        babelify.configure({ presets: ['@babel/preset-env'] }),
        ['uglifyify', { global: true }]
      ]
    }))

    .pipe(concat("file.min.js"))
    .pipe(sourcemaps.write(".", { sourceRoot: "css-source" }))
    .pipe(gulp.dest("./assets/js/"));
}

function style() {
  return gulp
    .src([
      "./assets/_src/css/imports.scss",
      "./assets/_src/css/libs/*.css",
      "./assets/_src/css/base/*.scss",
      "./assets/_src/css/file.style.scss",
    ])
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(minifyCSS())
    .pipe(concat("file.style.min.css"))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest("./assets/css/"));
}

function watchFiles() {
  gulp.watch("./assets/_src/css/**/*.scss", gulp.series(style, reload));
  gulp.watch("./assets/_src/js/**/*.js", gulp.series(scripts, reload));
  gulp.watch("./assets/_src/js/**/*.js", gulp.series(scripts_plugins, reload));
  gulp.watch("./**/*.html", reload);
}

function reload(done) {
  server.reload();
  done();
}

function serve(done) {
  server.init({
    server: {
      baseDir: "./",
    },
  });
  done();
}

function icons(done) {
  var fontName = 'icon';


  var iconStream = gulp.src(['assets/_src/icons/svg/*.svg'])
    .pipe(iconfont({
      fontName: fontName,
      formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
    }));

  return async.parallel([
    function handleGlyphs(cb) {
      iconStream.on('glyphs', function (glyphs, options) {
        gulp.src('assets/_src/icons/_template.css')
          .pipe(consolidate('lodash', {
            glyphs: glyphs,
            fontName: fontName,
            fontPath: '../fonts/',
            className: 'icon',
            glyphs: glyphs.map(mapGlyphs)
          }))
          .pipe(rename({ basename: fontName }))
          .pipe(gulp.dest('assets/_src/css/'))
          .on('finish', cb);
      });
    },
    function handleFonts(cb) {
      iconStream
        .pipe(gulp.dest('assets/fonts/'))
        .on('finish', cb);
    }
  ], done);

  function mapGlyphs(glyph) {
    return { name: glyph.name, codepoint: glyph.unicode[0].charCodeAt(0) }
  }
}


const compile = gulp.series(scripts, scripts_plugins, style);
const js = gulp.series(icons, scripts, scripts_plugins, style, serve, reload);
const build = gulp.series(gulp.parallel(js, watchFiles));
const watch = gulp.parallel(watchFiles);

exports.js = js;
exports.compile = compile;
exports.style = style;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = build;
