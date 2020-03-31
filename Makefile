index.html: index_top.html combine.js index_btwn_js.html combine_module.js index_b4_css.html combine.css index_bot.html
	cat $^ > $@ 
