define([
	"dojo/node!colors",
	"dojo/Deferred",
	"dojo/promise/all",
	"doqueue/Queue",
	"dote/timer",
	"./config",
	"./messages",
	"./stores"
], function(colors, Deferred, all, Queue, timer, config, messages, stores){

	/* Init Messages */
	messages.init("Drag00n$%!");

	/* Open Stores */
	stores.open();

	/* Setup Queue */
	var queue = new Queue({
		storeOptions: {
			url: process.env.MONGOLAB_URI || config.db.url,
			collection: "queue"
		}
	});

	queue.ready().then(function(){
		queue.on("topic", function(item){
			var dfd = new Deferred();
			messages.calculateTopicRecipients(item.topic, item.isNew).then(function(results){
				var mails = [];
				results.forEach(function(address){
					mails.push(messages.mailTopic(address, item.topic));
				});
				all(mails).then(function(results){
					console.log("Topic ".grey + item.topic.id.yellow + " mailed.".grey);
					dfd.resolve("complete");
				});
			});
			return dfd.promise;
		});

		queue.on("recieve", function(item){
			var dfd = new Deferred();
			return dfd.promise;
		});

		function checkMail(){
			console.log("Checking inbound mail...".grey);
			return messages.fetch(true).then(function(results){
				results.forEach(function(email){
					queue.create("receive", email);
				});
				console.log("Fetched ".grey + results.length.toString().cyan + " emails.".grey);
				return results;
			});
		}

		/* Setup Mail Check Timer */
		var checkMailTimer = timer(config.mail.checkInterval || 60000);
		if(!config.mail.enabled) checkMailTimer.pause();
		var checkMailSignal = checkMailTimer.on("tick", checkMail);
	});

	console.log("Worker started...".grey);

});