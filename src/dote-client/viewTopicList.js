define([
	"dojo/dom",
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/JsonRest",
	"dojo/store/Memory",
	"./TopicList",
	"./userControls",
	"moment/moment"
], function(dom, ready, Cache, JsonRest, Memory, TopicList, userControls, moment){

	var topicStore = Cache(new JsonRest({
		target: "/topics/"
	}), new Memory(), {});

	ready(function(){
		userControls.start();
		var tl = new TopicList({
			store: topicStore,
			maxCount: 20,
			queryOptions: {
				sort: [
					{
						attribute: "created",
						descending: true
					}
				]
			},
			user: (dote && dote.username) || ""
		}, "topicList");
		tl.startup();
		tl.fetch();
	});

	return {};
});