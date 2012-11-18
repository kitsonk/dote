define([
	"dojo/_base/window",
	"dojo/json",
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/JsonRest",
	"dojo/store/Memory",
	"dojo/when",
	"dote-client/marked",
	"dote-client/TopicAdd",
	"dote-client/userControls"
], function(win, JSON, ready, Cache, JsonRest, Memory, when, marked, TopicAdd, userControls){

	var topicStore = new JsonRest({
		target: "/topics/"
	});

	var ownersStore = new JsonRest({
		target: "/owners/"
	});

	var results = ownersStore.query();

	ready(function(){
		userControls.start();
		when(results, function(owners){
			var topic = new TopicAdd({
				id: "topic",
				parser: marked,
				store: topicStore,
				user: dote.username,
				owners: owners
			}, "topic");
			topic.on("cancel", function(){
				win.global.location.href = "/";
			});
			topic.on("add", function(e){
				win.global.location.href = "/topic/" + e.item.id;
			});
			topic.startup();
		});
	});

	return {};
});