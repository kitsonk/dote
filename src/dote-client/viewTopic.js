define([
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/Memory",
	"dote/marked",
	"./store/JsonRest",
	"./Topic",
	"./userControls"
], function(ready, Cache, Memory, marked, JsonRest, Topic, userControls){

	var topicStore = new JsonRest({
		target: "/topics/"
	});

	var commentStore = Cache(new JsonRest({
		target: "/topics/" + dote.topicId + "/comments/"
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
						descending: true
					}
				]
			},
			topicStore: topicStore,
			user: dote.username
		}, "topic");
		topic.startup();

		topicStore.get(dote.topicId).then(function(topicItem){
			topic.set("item", topicItem);
			topic.fetch();
		});
	});
	
	return {};
});