require([
	"dojo/store/Cache",
	"dojo/store/JsonRest",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dote-client/TopicList",
	"moment/moment"
], function(Cache, JsonRest, Memory, Observable, TopicList, moment){
	var store = Observable(Cache(new JsonRest({
		target: "/topics/"
	}), new Memory(), {}));
	var tl = new TopicList({
		store: store,
		queryOptions: {
			count: 10,
			sort: [
				{
					attribute: "created",
					descending: false
				}
			]
		},
		user: "rawld"
	}, "topicList");
	tl.startup();
	tl.refresh();
});