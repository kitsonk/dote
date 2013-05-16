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
				if(vote && vote.user){
					voter = vote.user;
				}else{
					var originalVoters = item.original.voters,
						newVoters = item.changed.voters;
					originalVoters.some(function(i, idx){
						if(i && newVoters[idx] && (i.vote !== newVoters[idx].vote)){
							return voter = i.user;  // intentional assignment
						}
					});
				}
				if(voter){
					vote.user = voter;
					messages.calculateVoteRecipients(item.changed, vote.user.id).then(function(results){
						var mails = [];
						results.forEach(function(address){
							if (address && vote && item && item.changed) {
								mails.push(messages.mailVote(address, vote, item.changed));
							}
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
					console.log("No Topic Changes".yellow.bold, "topic.id: ".grey + item.original.id.yellow);
					dfd.resolve("complete");
				}else{
					console.log("Unsupported Topic Change".red.bold);
					console.log("Changes:".grey, changes);
					dfd.reject(new Error("Unsupported Topic Change"));
				}
			}
			return dfd.promise;
		});

		queue.on("comment.add", function(item){
			var dfd = new Deferred();
			topic(item.comment.topicId).get(true).then(function(topicItem){
				messages.calculateCommentRecipients(item.comment).then(function(results){
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

		queue.on('user.welcome', function (item) {
			var dfd = new Deferred();
			messages.mailWelcome(item.user.id + ' <' + item.user.email + '>', item.user).then(function (results) {
				console.log('Welcome to '.grey + item.user.id.yellow + ' mailed.'.grey);
				dfd.resolve('complete');
			}, function (e) {
				dfd.reject(e);
			});
			return dfd.promise;
		});

		topic.on("add", function(e){
			queue.create("topic.new", {
				topic: e.item,
				isNew: true
			});
			queue.create("topic.refresh", {
				topic: e.item
			});
		});

		topic.on("put", function(e){
			queue.create("topic.change", {
				original: e.original,
				changed: e.item
			});
			queue.create("topic.refresh", {
				topic: e.item
			});
		});

		topic.on("comment.add", function(e){
			queue.create("comment.add", {
				comment: e.item
			});
			queue.create("topic.refresh", {
				comment: e.item
			});
		});

		function checkCommitters() {
			console.log('Checking committer flags...'.grey);
			return stores.users.query('select(id,committer)&eq(committer,true)').then(function (users) {
				var committers = [];
				users.forEach(function (user) {
					committers.push(user.id);
				});
				return topic.query().then(function (topics) {
					var changed;
					topics.forEach(function (item) {
						if (item.voters.length) {
							changed = false;
							item.voters.forEach(function (voter) {
								if (~committers.indexOf(voter.user.id) && !voter.user.committer) {
									changed = true;
									voter.user.committer = true;
								}
								else if (!~committers.indexOf(voter.user.id) && voter.user.committer) {
									changed = true;
									voter.user.committer = false;
								}
							});
							if (changed) {
								topic(item.id).put(item);
							}
						}
					});
				});
			});
		}

		timer(3600000).on('tick', checkCommitters);

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