require([
	'dote-server/auth',
	'dote-server/stores',
	'dojo/node!colors'
], function (auth, stores) {

	console.log('dote Password Manager v1.0'.cyan);

	stores.open().then(function () {
		var username = process.argv[2],
			password = process.argv[3];
		console.log('Changing Password for:'.cyan, username.yellow);
		if (username && password) {
			stores.users.get(username).then(function (data) {
				data.attempts = 0;
				data.password = auth.saltPassword(password);
				return stores.users.put(data).then(function () {
					console.log('Password changed.'.green.bold);
					process.exit(1);
				});
			}, function (err) {
				console.error(err);
				process.exit(255);
			});
		}
		else {
			console.error('No user or password supplied.'.red);
			process.exit(255);
		}
	});
});