define([
	"dojo/node!colors",
	"dojo/Deferred",
	"dojo/promise/all",
	"dote/timer",
	"./config",
	"./messages",
	"./queue",
	"./stores",
	"./topic",
	"./util"
], function(colors, Deferred, all, timer, config, messages, queue, stores, topic, util){

	/* Environment */
	var env = process.env.NODE_ENV || "development";

	/* Init Messages */
	messages.init(process.env.DOTE_MAIL_PWD || config.mail.password || "password");

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
			var dfd = new Deferred(),
				changes = util.difference(item.original, item.changed);
			if(changes.voters){
				var vote = changes.voters[0],
					voter;
				if(vote.name){
					voter = vote.name;
				}else{
					var originalVoters = item.original.voters,
						newVoters = item.changed.voters;
					originalVoters.some(function(i, idx){
						if(i.vote !== newVoters[idx].vote){
							return voter = i.name;
						}
					});
				}
				if(voter){
					vote.name = voter;
					messages.calculateVoteRecipients(item.changed, vote.name).then(function(results){
						var mails = [];
						results.forEach(function(address){
							mails.push(messages.mailVote(address, vote, item.changed));
						});
						all(mails).then(function(results){
							console.log("Vote on Topic ".grey + item.changed.id.yellow + " mailed.".grey);
							dfd.resolve("complete");
						});
					});
				}else{
					console.log("Could not identify voter".red.bold);
					dfd.reject(new Error("Could not identify voter"));
				}
			}else if(changes.action){
				console.log("action changed");
				dfd.resolve("complete");
			}else if(changes.tags){
				console.log("tags changed");
				dfd.resolve("complete");
			}else if(changes.owner){
				console.log("owner changed");
				dfd.resolve("complete");
			}else if(changes.commentsCount){
				dfd.resolve("complete");
			}else{
				if(util.isEmpty(changes)){
					console.log("No Topic Changes".yellow.bold);
					console.log(item);
					dfd.resolve("complete");
				}else{
					console.log("Unsupported Topic Change".red.bold);
					console.log(changes);
					dfd.reject(new Error("Unsupported Topic Change"));
				}
			}
			return dfd.promise;
		});

		queue.on("comment.add", function(item){
			var dfd = new Deferred();
			topic(item.comment.topicId).get().then(function(topicItem){
				messages.calculateCommentRecipients(item).then(function(results){
					var mails = [];
					results.forEach(function(address){
						mails.push(messages.mailComment(address, item.comment, topicItem));
					});
					all(mails).then(function(results){
						console.log("Comment ".grey + item.comment.id.yellow + " mailed.".grey);
						dfd.resolve("complete");
					});
				});
			});
			return dfd.promise;
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

		topic.on("put", function(e){
			queue.create("topic.change", {
				original: e.original,
				changed: e.item
			});
		});

		topic.on("comment.add", function(e){
			queue.create("comment.add", {
				comment: e.item
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

	if(env === "development"){
		var memoryInfoTimer = timer(60000),
			memoryInfoSignal = memoryInfoTimer.on("tick", function(){
				var info = process.memoryUsage();
				console.log("Memory Usage: [".grey + "rss=".cyan + info.rss.toString().cyan +
					" - ".grey + "heapTotal=".cyan + info.heapTotal.toString().cyan +
					" - ".grey + "heapUsed=".cyan + info.heapUsed.toString().cyan + "]".grey);
			});
	}

	console.log("Worker started...".grey);
	console.log("Environment: ".grey + env.cyan);

});