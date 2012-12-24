require([
	"dote-server/messages",
	"dote-server/stores",
	"dote-server/topic",
	"dojo/promise/all",
	"dojo/when"
], function(messages, stores, topic, all, when){
	stores.open().then(function(){
		// topic("3af990e5-036a-4e01-80a4-0a46d158038c").comment("bbf3ea80-afc4-442e-84a6-81d1db065941").get().then(function(comment){
		// 	messages.mailComment("kitsonk <me@kitsonkelly.com>", comment);
		// });
		messages.init("Drag00n$%!");
		gets = {};
		gets.topic = topic("3af990e5-036a-4e01-80a4-0a46d158038c").get();
		gets.comment = topic("3af990e5-036a-4e01-80a4-0a46d158038c").comment("bbf3ea80-afc4-442e-84a6-81d1db065941").get();
		all(gets).then(function(results){
			console.log(results);
			var m = messages.mailVote("ttrenka <ttrenka@gmail.com>", { name: "kitsonk", vote: 1 }, results.topic, results.comment);
			when(m, function(results){
				console.log("mail sent");
			});
			// messages.mailTopic("kitsonk <me@kitsonkelly.com>", item, { includeComments: 1 }).then(function(){
			// 	console.log("email sent");
			// });
		});
	});
});
