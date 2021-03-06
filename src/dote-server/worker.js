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
	messages.init(process.env.DOTE_MAIL_PWD || config.mail.password || "password", process.env.DOTE_SMTP_PWD);

	/* Open Stores */
	stores.open();

	queue.ready().then(function(){
		console.log('Queue Ready'.cyan);
		queue.on("topic.new", function(item){
			console.log('Dequeued Event: '.cyan + 'topic.new'.yellow);
			var dfd = new Deferred();
			stores.users.get(item.topic.author).then(function (user) {
				return stores.events.add({
					type: 'topic.new',
					target: item.topic.id,
					created: item.topic.created,
					user: {
						id: user.id,
						committer: user.committer
					}
				});
			}, function (err) {
				console.log('Error:'.red, err);
			});
			messages.calculateTopicRecipients(item.topic, item.isNew).then(function(results){
				var mails = [];
				results.forEach(function(address){
					mails.push(messages.mailTopic(address, item.topic));
				});
				all(mails).then(function(results){
					console.log("Topic ".grey + item.topic.id.yellow + " mailed.".grey);
					dfd.resolve("complete");
				}, function(err) {
					console.error('Error:'.red, err);
					dfd.reject(err);
				});
			}, function(err) {
				console.error('Error:'.red, err);
				dfd.reject(err);
			});
			return dfd.promise;
		});

		queue.on("topic.change", function(item){
			console.log('Dequeued Event: '.cyan + 'topic.change'.yellow);
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
					stores.users.get(voter.id).then(function (user) {
						return stores.events.add({
							type: 'topic.vote',
							value: parseInt(vote.vote, 10),
							target: item.changed.id,
							created: Math.round((new Date()).getTime() / 1000),
							user: {
								id: user.id,
								committer: user.committer
							}
						});
					}, function (err) {
						console.log('Error:'.red, err);
					});
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
						}, function (err) {
							console.log('Error:'.red, err);
							dfd.reject(err);
						});
					}, function (err) {
						console.log('Error:'.red, err);
						dfd.reject(err);
					});
				}else{
					console.error("Could not identify voter".red.bold);
					dfd.reject(new Error("Could not identify voter"));
				}
			}else if(changes.action){
				console.log('Actioned'.yellow);
				stores.users.get(item.changed.owner).then(function (user) {
					return stores.events.add({
						type: 'topic.action',
						target: item.changed.id,
						value: changes.action,
						created: changes.actioned,
						user: {
							id: user.id,
							committer: user.committer
						}
					});
				})
				dfd.resolve("complete");
			}else if(changes.tags){
				console.log('Tagged'.yellow);
				stores.events.add({
					type: 'topic.tag',
					target: item.changed.id,
					created: item.changed.updated,
					user: item.changed.updater
				});
				dfd.resolve("complete");
			}else if(changes.owner){
				console.log('Owner Change'.yellow);
				stores.users.get(changes.owner).then(function (user) {
					return stores.events.add({
						type: 'topic.assigned',
						target: item.changed.id,
						created: Math.round((new Date()).getTime() / 1000),
						user: {
							id: user.id,
							committer: user.committer
						}
					});
				}, function (err) {
					console.log('Error:'.red, err);
				});
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
			console.log('Dequeued Event: '.cyan + 'comment.add'.yellow);
			var dfd = new Deferred();
			stores.users.get(item.comment.author).then(function (user) {
				return stores.events.add({
					type: 'comment',
					target: item.comment.id,
					topicId: item.comment.topicId,
					created: item.comment.created,
					user: {
						id: user.id,
						committer: user.committer
					}
				});
			}, function (err) {
				console.log('Error:'.red, err);
			});
			topic(item.comment.topicId).get(true).then(function(topicItem){
				messages.calculateCommentRecipients(item.comment).then(function(results){
					var mails = [];
					results.forEach(function(address){
						mails.push(messages.mailComment(address, item.comment, topicItem));
					});
					all(mails).then(function(results){
						console.log("Comment ".grey + item.comment.id.yellow + " mailed.".grey);
						dfd.resolve("complete");
					}, function (err) {
						console.log('Error:', err);
						dfd.reject(err);
					});
				});
			});
			return dfd.promise;
		});

		queue.on("email.inbound", function(email){
			console.log('Dequeued Event: '.cyan + 'email.inbound'.yellow);
			var dfd = new Deferred();
			messages.process(email).then(function(){
				console.log("Inbound email processed.".grey);
				dfd.resolve("complete");
			}, function (err) {
				console.log('Error:'.red, err);
				dfd.reject(err);
			});
			return dfd.promise;
		});

		queue.on('user.welcome', function (item) {
			console.log('Dequeued Event: '.cyan + 'user.welcome'.yellow);
			var dfd = new Deferred();
			stores.events.add({
				type: 'user.welcome',
				target: item.user.id,
				created: Math.round((new Date()).getTime() / 1000)
			});
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
								topic(item.id).put(item, { id: '', committer: false });
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