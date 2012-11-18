require([
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/JsonRest",
	"dojo/store/Memory",
	"dote-client/marked",
	"dote-client/Topic",
	"dote-client/userControls"
], function(ready, Cache, JsonRest, Memory, marked, Topic, userControls){

	var topicStore = new JsonRest({
		target: "/topics/"
	});

	var commentStore = Cache(new JsonRest({
		target: "/comments/"
	}), new Memory(), {});

	ready(function(){
		userControls.start();
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
			user: dote.username
		}, "topic");
		topic.startup();

		topicStore.get(dote.topicId).then(function(topicItem){
			topic.set("item", topicItem);
			topic.refresh();
		});
	});
});