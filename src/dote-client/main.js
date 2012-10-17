require([
	"dojo/store/Cache",
	"dojo/store/JsonRest",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dote-client/TopicList",
	"/src/moment.js"
], function(Cache, JsonRest, Memory, Observable, TopicList, moment){
	var store = Observable(Cache(new JsonRest({
		target: "/topics/"
	}), new Memory(), {}));
	var tl = new TopicList({
		store: store,
		user: "kitsonk"
	}, "topicList");
	console.log(tl.get("user"));
	tl.startup();
	tl.refresh().then(function(){
		console.log(tl.total);
	});
	console.log(moment);
});