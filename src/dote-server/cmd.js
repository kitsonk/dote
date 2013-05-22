require([
	'dote-server/stores',
	'dote-server/topic',
	'dojo/promise/all',
	'dojo/node!colors'
], function (stores, topic, all) {

	console.log('dote Commander v1.0'.cyan);

	stores.open().then(function () {
		var command = process.argv[2];
		switch (command) {
		case 'initEvents':
			console.log('Initialise Events'.cyan);
			stores.users.query().then(function (items) {
				var users = {};
				items.forEach(function (item) {
					users[item.id] = item.committer;
				});
				return stores.events.empty().then(function () {
					return topic.query().then(function (topics) {
						var dfds = [];
						topics.forEach(function (item) {
							dfds.push(stores.events.add({
								type: 'topic.new',
								target: item.id,
								created: item.created,
								user: {
									id: item.author,
									committer: users[item.author]
								}
							}));
							if (item.action && item.actioned && item.owner) {
								dfds.push(stores.events.add({
									type: 'topic.action',
									target: item.id,
									created: item.actioned,
									value: item.action,
									user: {
										id: item.owner,
										committer: users[item.owner]
									}
								}));
							}
						});
						return all(dfds).then(function () {
							return stores.comments.query().then(function (comments) {
								var dfds = [];
								comments.forEach(function (comment) {
									dfds.push(stores.events.add({
										type: 'comment',
										target: comment.id,
										topicId: comment.topicId,
										created: comment.created,
										user: {
											id: comment.author,
											committer: users[comment.author]
										}
									}));
								});
								return all(dfds).then(function () {
									console.log('Initialised Events'.green);
									process.exit(1);
								});
							});
						});
					});
				});
			}, function (err) {
				console.log('Error:'.red, err);
				process.exit(255);
			});
			break;
		default:
			console.log('Unrecognised command:'.red.bold, command.yellow);
			process.exit(255);
		}
	}, function (err) {
		console.log('Error:'.red, err);
		process.exit(255);
	});
});