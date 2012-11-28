define("dote/marked", [
	"marked/marked",
	"hljs/highlight.pack"
], function(marked, hljs){

	marked.setOptions({
		gfm: true,
		pedantic: false,
		sanitize: false,
		highlight: function(code, lang){
			switch(lang){
				case "js":
					code = hljs.highlight("javascript", code).value;
					break;
				case "html":
					code = hljs.highlight("xml", code).value;
					break;
				case "md":
					code = hljs.highlight("markdown", code).value;
					break;
				case "javascript":
				case "bash":
				case "diff":
				case "http":
				case "xml":
				case "ini":
				case "json":
				case "markdown":
				case "php":
				case "perl":
				case "sql":
				case "django":
					code = hljs.highlight(lang, code).value;
					break;
			}
			return code;
		}
	});

	return marked;
});