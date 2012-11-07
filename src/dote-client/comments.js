require([
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/JsonRest",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dijit/form/Button",
	"dote-client/Topic",
	"marked/marked",
	"hljs/highlight.pack"
], function(ready, Cache, JsonRest, Memory, Observable, Button, Topic, marked, hljs){
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

	var topicStore = new JsonRest({
		target: "/topics/"
	});

	var commentStore = Observable(Cache(new JsonRest({
		target: "/comments/"
	}), new Memory(), {}));

	ready(function(){
		var topic = new Topic({
			id: "topic",
			parser: marked,
			store: commentStore,
			queryOptions: {
				count: 10,
				sort: [
					{
						attribute: "created",
						descending: false
					}
				]
			},
			topicStore: topicStore,
			user: "rawld"
		}, "topic");
		topic.startup();

		topicStore.get("3af990e5-036a-4e01-80a4-0a46d158038c").then(function(topicItem){
			topic.set("item", topicItem);
			topic.refresh();	
		});
	});
});