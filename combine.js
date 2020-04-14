function run_combine() {
    if( parse_file_list().length < 1 ) {
        alert("Add some files before pressing combine");
        return;
    }

    let combining_cover = document.getElementById("combining-cover");
    combining_cover.style.display = "block";

    run_combine_async();
}

async function run_combine_async() {
    build_pngs();
    await window.build_pdf();

    let combining_cover = document.getElementById("combining-cover");
    combining_cover.style.display = "none";
}

function parse_file_list() {
    let list_div = document.getElementById("file-list");
    let file_list = Object.values(list_div.children).map(function(file_div) {
            let filename = file_div.getAttribute("file_set_filename");
            let start_pg_elem = file_div.getElementsByClassName("start_pg")[0];
            let end_pg_elem = file_div.getElementsByClassName("end_pg")[0];
            let quality_range = file_div.getElementsByClassName("quality_range")[0];

            let start_pg = Number(start_pg_elem.value);
            let end_pg = Number(end_pg_elem.value);
            let quality = Number(quality_range.value);

            return {"filename": filename, "start_pg": start_pg,
                    "end_pg": end_pg, "quality": quality};
        });

    return file_list;
}

function build_pngs() {
    const file_list = parse_file_list();

    window.page_set = [];

    // Convert their pages into pngs
    file_list.forEach(function(file_elem) {
            const filename = file_elem["filename"];

            // Write the files into the filesystem
            FS.writeFile(filename, window.file_set[filename]);

            const dpi = file_elem["quality"];
            const start_pg = file_elem["start_pg"];
            const end_pg = file_elem["end_pg"];
            let doc = mupdf.openDocument(filename);
            const page_count = mupdf.countPages(doc);
            if( window.page_set[filename] === undefined ) {
                window.page_set[filename] = [];
            }
            for( let page = start_pg; page <= end_pg; page += 1 ) {
                if( window.page_set[filename][page] === undefined ) {
                    // Draw the page - indexing there starts with 1...
                    let outpng = mupdf.drawPageAsPNG(doc, page, dpi);
                    window.page_set[filename][page] = outpng;
                }
            }

            // Free some resources...
            mupdf.freeDocument(doc);
            FS.unlink(filename);
        });
}

function get_page_count(filename) {
    FS.writeFile(filename, window.file_set[filename]);

    let doc = mupdf.openDocument(filename);
    const page_count = mupdf.countPages(doc);
    mupdf.freeDocument(doc);

    FS.unlink(filename);

    return page_count;
}

function get_fd_control_fd(ev) {
    let cur_node = ev.target;
    while( !cur_node.classList.contains("file_div") ) {
        cur_node = cur_node.parentElement;
    }
    return cur_node;
}

function dupe_file_div(ev) {
    const file_set_filename = get_fd_control_fd(ev).getAttribute(
            "file_set_filename");
    const nice_filename = get_fd_control_fd(ev).getAttribute("nice_filename");
    const new_fd = build_file_list_elem(nice_filename, file_set_filename);
    add_to_file_list(new_fd);
}

function delete_file_div(ev) {
    const file_div = get_fd_control_fd(ev);
    file_div.remove();
}

function update_qr_value(ev) {
    const file_div = get_fd_control_fd(ev);
    const qr_value = file_div.getElementsByClassName("qr_value")[0];
    qr_value.value = ev.target.value;
}

function validate_st_end_page(ev) {
    const file_div = get_fd_control_fd(ev);
    const tgt = ev.target;

    if( isNaN(tgt.value) ) {
        return false;
    }

    const new_val = Number(tgt.value);
    if( new_val < 1 || new_val > file_div.getAttribute("page_count") ) {
        return false;
    }
    return true;
}

function validate_start_page(ev) {
    const file_div = get_fd_control_fd(ev);
    const tgt = ev.target;
    const new_val = Number(tgt.value);
    const old_val = tgt.getAttribute("prev_value");
    const end_page_elem = file_div.getElementsByClassName("end_pg")[0];
    const end_page_val = Number(end_page_elem.value);

    if( !validate_st_end_page(ev) || new_val > end_page_val ) {
        tgt.value = old_val;
        return;
    }
    
    // Otherwise it's GTG
    tgt.setAttribute("prev_value", new_val);
}

function validate_end_page(ev) {
    const file_div = get_fd_control_fd(ev);
    const tgt = ev.target;
    const new_val = Number(tgt.value);
    const old_val = tgt.getAttribute("prev_value");
    const start_page_elem = file_div.getElementsByClassName("start_pg")[0];
    const start_page_val = Number(start_page_elem.value);

    if( !validate_st_end_page(ev) || new_val < start_page_val ) {
        tgt.value = old_val;
        return;
    }
    
    // Otherwise it's GTG
    tgt.setAttribute("prev_value", new_val);
}

function build_file_list_elem(nice_filename, file_set_filename) {
    const page_count = get_page_count(file_set_filename);

    let file_div = document.createElement("div");
    let filename_div = document.createElement("div");
    let cont_pg_div = document.createElement("div");
    let cont_btn_div = document.createElement("div");
    let cont_qual_div = document.createElement("div");

    let start_pg_label = document.createElement("label");
    let start_pg_input = document.createElement("input");
    let end_pg_label = document.createElement("label");
    let end_pg_input = document.createElement("input");
    let dupe_button = document.createElement("input");
    let del_button = document.createElement("input");
    let quality_range = document.createElement("input");
    let qr_value = document.createElement("input");

    file_div.appendChild(filename_div);
    file_div.appendChild(cont_btn_div);
    file_div.appendChild(cont_pg_div);
    file_div.appendChild(cont_qual_div);

    cont_pg_div.appendChild(start_pg_label);
    cont_pg_div.appendChild(end_pg_label);
    cont_btn_div.appendChild(dupe_button);
    cont_btn_div.appendChild(del_button);

    cont_qual_div.innerHTML = "Quality (DPI):"
    cont_qual_div.appendChild(quality_range);
    cont_qual_div.appendChild(qr_value);

    start_pg_label.innerHTML = "Start Page: "
    end_pg_label.innerHTML = "End Page: "

    start_pg_label.appendChild(start_pg_input);
    end_pg_label.appendChild(end_pg_input);

    file_div.classList.add("file_div");

    start_pg_input.type = "number";
    start_pg_input.width = 4;
    start_pg_input.classList.add("start_pg");
    start_pg_input.addEventListener("change", validate_start_page);
    end_pg_input.type = "number";
    end_pg_input.width = 4;
    end_pg_input.classList.add("end_pg");
    end_pg_input.addEventListener("change", validate_end_page);

    start_pg_input.value = 1;
    start_pg_input.setAttribute("prev_value", 1);
    start_pg_input.min = 1;
    start_pg_input.max = page_count;
    end_pg_input.value = page_count;
    end_pg_input.setAttribute("prev_value", page_count);
    end_pg_input.min = 1;
    end_pg_input.max = page_count;

    dupe_button.type = "button";
    dupe_button.classList.add("dupe_button");
    dupe_button.name = "Duplicate this file entry";
    dupe_button.value = "Duplicate";
    dupe_button.addEventListener("click", dupe_file_div);

    del_button.type = "button";
    del_button.classList.add("del_button");
    del_button.name = "Remove this file entry";
    del_button.value = "Delete";
    del_button.addEventListener("click", delete_file_div);

    qr_value.type = "number";
    qr_value.classList.add("qr_value");
    qr_value.value = 120;
    qr_value.min = 30;
    qr_value.max = 300;
    qr_value.readOnly = true;

    quality_range.classList.add("quality_range");
    quality_range.name = "Select page output quality for this file, 120 is a good value";
    quality_range.type = "range";
    quality_range.min = 30;
    quality_range.max = 300;
    quality_range.step = 30;
    quality_range.value = qr_value.value;
    quality_range.addEventListener("input", update_qr_value);

    file_div.setAttribute("file_set_filename", file_set_filename);
    file_div.setAttribute("nice_filename", nice_filename);
    file_div.setAttribute("page_count", page_count);

    filename_div.innerHTML = "Filename: " + nice_filename;

    return file_div;
}

function add_to_file_list(file_div) {
    let list_div = document.getElementById("file-list");

    list_div.appendChild(file_div);
}

function ReadFile(file) {
    return new Promise(function(resolve) {
            let reader = new FileReader();
            reader.onload = function(func_ev) {
                let view = new Uint8Array(func_ev.target.result);
                resolve([file.name, view]);
            }
            reader.readAsArrayBuffer(file);
        });
}

async function file_change() {
    const your_files = document.getElementById("file-selector");
    let files = your_files.files;

    if (files.length > 0) {
        let file_load_cover = document.getElementById("file-load-cover");
        file_load_cover.style.display = "block";

        if( window.file_set === undefined ) {
            window.file_set = {};
        }
        for (let fileIndex = 0; fileIndex < files.length; ++fileIndex) {
            let [filename, content] = await ReadFile(files[fileIndex]);
            const file_set_filename = filename + Date.now();
            window.file_set[file_set_filename] = content;
            add_to_file_list(build_file_list_elem(filename, file_set_filename));
        }

        file_load_cover.style.display = "none";
    }

    // Clear the file element so we can add the same file again, if desired
    your_files.value = "";
}

function add_to_onload(func) {
    if( document.readyState === "complete" ) { func(); }
    if( window.onload ) {
        let cur_onload = window.onload;
        window.onload = function() { func(); cur_onload(); };
    } else {
        window.onload = func;
    }
}

function onload_setup() {
    let file_list_div = document.getElementById("file-list");
    let file_sel_hidden = document.getElementById("file-selector");
    let file_sel_button = document.getElementById("file-selector-button");
    let combine_button = document.getElementById("combine-button");

    $(file_list_div).sortable({});
    file_sel_hidden.addEventListener("change", file_change);
    file_sel_button.addEventListener("click", function(){file_sel_hidden.click();});
    combine_button.addEventListener("click", run_combine);

    // Remove modal loading window
    let loading_cover = document.getElementById("loading-cover");
    loading_cover.style.display = "none";
}

function test_load_complete() {
    // If loading isn't finished, give it more time
    // mupdf.countPages is set when mupdf is done loading
    if( mupdf.countPages !== "undefined" &&
            window.imagemagick_loaded == true ) {
        onload_setup();
    } else {
        window.update_imagemagick_loaded();
        window.setTimeout(test_load_complete, 1000);
    }
}

add_to_onload(test_load_complete);
