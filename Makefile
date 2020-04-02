all: index.html magickApi_TEMP.js

libmupdf_packaged.js: libmupdf.js libmupdf.wasm
	(echo -n 'const LIBMUPDF_WASM_DATA_URI="data:application/octet-stream;base64,'; base64 -w 0 libmupdf.wasm; echo '";'; cat libmupdf.js | sed 's/wasmBinaryFile="libmupdf.wasm"/wasmBinaryFile=LIBMUPDF_WASM_DATA_URI/') > $@

magick_packaged.js: magick.js magick.wasm
	(echo -n 'const MAGICK_WASM_DATA_URI="data:application/octet-stream;base64,'; base64 -w 0 magick.wasm; echo '";'; cat magick.js | sed 's/wasmBinaryFile="magick.wasm"/wasmBinaryFile=MAGICK_WASM_DATA_URI/') > $@

magickApi_TEMP.js: magick_packaged.js magickApi.js
	(echo -n 'const MAGIC_WORKER_URL="data:application/octet-stream;base64,'; base64 -w 0 magick_packaged.js; echo '";'; cat magickApi.js | sed "s#let currentJavascriptURL = './magickApi.js';#let currentJavascriptURL = '';#;s#let stacktrace#//let stacktrace#;s#currentJavascriptURL = stacktrace#//currentJavascriptURL = stacktrace#;s#const magickWorkerUrl#const magickWorkerUrl = MAGIC_WORKER_URL; //#;") > $@

index.html: index_top.html jquery-3.4.1.min.js jquery-ui.min.js libmupdf_packaged.js combine.js index_btwn_js.html combine_module.js index_b4_css.html opt_common.css combine.css index_bot.html
	cat $^ > $@ 

clean:
	rm libmupdf_packaged.js magick_packaged.js magickApi_TEMP.js index.html

.PHONY:clean
