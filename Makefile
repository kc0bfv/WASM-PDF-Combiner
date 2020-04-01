index.html: index_top.html jquery-3.4.1.min.js jquery-ui.min.js combine.js index_btwn_js.html combine_module.js index_b4_css.html opt_common.css combine.css index_bot.html
	cat $^ > $@ 
