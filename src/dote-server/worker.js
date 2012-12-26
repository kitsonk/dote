define([
	"dojo/node!colors",
	"dojo/Deferred",
	"dojo/promise/all",
	"dote/timer",
	"./config",
	"./messages",
	"./queue",
	"./stores",
	"./topic"
], function(colors, Deferred, all, timer, config, messages, queue, stores, topic){

	/* Init Messages */
	messages.init("Drag00n$%!");

	/* Open Stores */
	stores.open();

	queue.ready().then(function(){
		queue.on("topic.new", function(item){
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

		queue.on("topic.change", function(item){

		});

		queue.on("email.inbound", function(email){
			var dfd = new Deferred();
			messages.process(email).then(function(){
				console.log("Inbound email processed.".grey);
				dfd.resolve("complete");
			});
			return dfd.promise;
		});

		topic.on("add", function(e){
			queue.create("topic.new", {
				topic: e.item,
				isNew: true
			});
		});

		function checkMail(){
			console.log("Checking inbound mail...".grey);
			return messages.fetch(true).then(function(results){
				results.forEach(function(email){
					queue.create("email.inbound", email);
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