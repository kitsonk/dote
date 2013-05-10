define([
	'dojo/node!ldapauth',
	'dojo/node!colors',
	'dojo/_base/lang',
	'dojo/promise/all',
	'dojo/when',
	'dojox/encoding/crypto/RSAKey-ext',
	'dojox/encoding/digests/SHA512',
	'dote/util',
	'setten/dfs',
	'setten/util',
	'./config',
	'./stores'
], function (LdapAuth, colors, lang, all, when, RSAKey, SHA512, util, dfs, settenUtil, config, stores) {

	if (config.auth === 'ldap') {
		var ldap = new LdapAuth({
			url: config.ldap.url,
			adminDn: config.ldap.adminDn,
			adminPassword: process.env.DOTE_LDAP_PWD || config.ldap.adminPassword,
			searchBase: config.ldap.searchBase,
			searchFilter: config.ldap.searchFilter
		});

		var ldapAuthenticate = settenUtil.asDeferred(ldap.authenticate, ldap);
	}

	function generate() {
		console.log('Generating Public/Private Key...');
		var rk = new RSAKey();
		rk.generate(1024, '10001');
		var puk = {
			n: rk.n.toString(16),
			e: rk.e.toString(16)
		};
		prk = {
			n: rk.n.toString(16),
			e: rk.e.toString(16),
			d: rk.d.toString(16),
			p: rk.p.toString(16),
			q: rk.q.toString(16),
			dmp1: rk.dmp1.toString(16),
			dmq1: rk.dmq1.toString(16),
			coeff: rk.coeff.toString(16)
		};

		if (!dfs.existsSync('keys')) {
			dfs.mkdirSync('keys');
		}

		var dfds = [];

		dfds.push(dfs.writeFile('keys/pubKey.json', JSON.stringify(puk), 'utf8').then(function () {
			console.log('Public Key written to '.grey + 'keys/pubKey.json'.yellow);
		}, function () {
			console.error('Error writing Public Key!'.red.bold);
		}));
		dfds.push(dfs.writeFile('keys/privKey.json', JSON.stringify(prk), 'utf8').then(function () {
			console.log('Private Key written to '.grey + 'keys/privKey.json'.yellow);
		}, function () {
			console.error('Error writing Private Key!'.red.bold);
		}));
		return all(dfds);
	}

	var rsakey = new RSAKey(),
		pubKey,
		privKey;

	function init() {

		function load() {
			pubKey = JSON.parse(dfs.readFileSync('keys/pubKey.json'));
			privKey = JSON.parse(dfs.readFileSync('keys/privKey.json'));
			rsakey.setPrivateEx(privKey.n, privKey.e, privKey.d, privKey.p, privKey.q, privKey.dmp1, privKey.dmq1, privKey.coeff);
		}

		if (!dfs.existsSync('keys/pubKey.json')) {
			generate().then(load);
		}
		else {
			load();
		}
	}

	function saltPassword(password) {
		var salt = process.env.DOTE_SALT || 'qVHPPIBqGLPneDZZHC9WE9HwVt5XpmcKpwicHiCN';
		return SHA512(password + salt);
	}

	function hashEncrypted(password) {
		return saltPassword(rsakey.decrypt(util.b64tohex(password)));
	}

	function authorize(username, password) {
		var result;
		password = rsakey.decrypt(util.b64tohex(password));
		switch (config.auth) {
		case 'ldap':
			result = ldapAuthenticate(username, password);
			break;
		case 'internal':
			result = stores.users.get(username).then(function (user) {
				if (!user || !user.password) {
					return false;
				}
				if (user.attempts >= 3) {
					console.log('Account Locked Out!'.red.bold + ' - '.grey + username.cyan);
					return false;
				}
				if (saltPassword(password) === user.password) {
					user.attempts = 0;
					stores.users.put(user);
					return {
						mail: user.settings && user.settings.email,
						cn: ''
					};
				}
				user.attempts = user.attempts ? user.attempts + 1 : 1;
				stores.users.put(user);
				return false;
			});
			break;
		default:
			result = when(password === 'password');
		}
		return result;
	}

	return {
		init: init,
		generate: generate,
		pubKey: function () {
			return pubKey;
		},
		decrypt: lang.hitch(rsakey, rsakey.decrypt),
		saltPassword: saltPassword,
		hashEncrypted: hashEncrypted,
		authorize: authorize
	};
});