//import { call } from './magickApi_TEMP.js';
//import * as Magick from 'https://knicknic.github.io/wasm-imagemagick/magickApi.js';

function png_to_arr(page_png) {
    const b64_tell = "base64,";
    const b64_loc = page_png.indexOf(b64_tell);
    const png_start = b64_loc + b64_tell.length + 1;
    const file_base64 = decodeURI(page_png.slice(png_start));
    const file_bin = window.atob(file_base64);

    // See if we need to add on the PNG IEND chunk checksum
    // This is because it's missing in what mupdf outputs
    // But convert needs it
    let do_extra_three = false;
    let buff_len = file_bin.length;
    if( file_bin.charCodeAt(file_bin.length - 3) != 0x42 ) {
        do_extra_three = true;
        buff_len += 3;
    }

    // Build array, copy the file in, then fix it up
    let file_int_arr = new Uint8Array(
            new ArrayBuffer(buff_len)
        );
    for (let i = 0; i < file_bin.length; i++) {
        file_int_arr[i] = file_bin.charCodeAt(i);
    }
    if( do_extra_three ) {
        file_int_arr[file_int_arr.length - 3] = 0x42;
        file_int_arr[file_int_arr.length - 2] = 0x60;
        file_int_arr[file_int_arr.length - 1] = 0x82;
    }
    return file_int_arr;
}

function calc_png_filename(filename, index) {
    return filename + "_" + index + ".png";
}

export async function build_pdf() {
    // Get file ordering
    const file_list = parse_file_list();

    // Build input file set, with each page as an array inside
    const filenames = Object.keys(window.page_set);
    // input_files_pages is an object with png_filename as key,
    // "file" object as val
    let input_files_pages = {};
    filenames.forEach(function (filename) {
            //console.log("Converting: ", filename);
            const file_pages = Object.keys(window.page_set[filename]);

            file_pages.forEach(function (index) {
                    //console.log("  Page: ", index);
                    let page_png = window.page_set[filename][index];
                    const file_int_arr = png_to_arr(page_png);

                    const new_filename = calc_png_filename(filename, index);
                    const input_file = {"name": new_filename,
                            "content": file_int_arr};
                    input_files_pages[new_filename] = input_file;
                });
        });

    const input_files_list = Object.values(input_files_pages);
    
    /*
    const command_file_list = input_files.map(function(val) {
            return val["name"];
        });
    */

    let command_file_list = [];
    file_list.forEach(function(file_elem) {
            const filename = file_elem["filename"];
            const start_pg = file_elem["start_pg"];
            const end_pg = file_elem["end_pg"];
            for( let page = start_pg; page <= end_pg; page += 1 ) {
                command_file_list.push(calc_png_filename(filename, page));
            }
        });

    //console.log(input_files_list);

    //console.log("Beginning conversion");
    const command = ["convert", ...command_file_list, "combined.pdf"];
    const png_mime = "image/png";
    const pdf_mime = "application/pdf";
    const out_mime = pdf_mime;
    const result = await call(input_files_list, command);

    //console.log(result);

    const outputFiles = result.outputFiles[0];
    const exitCode = result.exitCode

    //console.log(outputFiles);
    //console.log(exitCode);

    if(exitCode === 0) {
        //console.log(outputFiles.buffer);
        let url = URL.createObjectURL(new Blob([outputFiles.buffer], {type: pdf_mime}));
        let anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "download";
        let click = document.createEvent("MouseEvents");
        click.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0,
                false, false, false, false, 0, null);
        anchor.dispatchEvent(click);
    } else {
        //console.log("Failed");
    }
}

function update_imagemagick_loaded() {
    magickWorker.postMessage("load_status_request");
}

window.update_imagemagick_loaded = update_imagemagick_loaded;
window.build_pdf = build_pdf;
