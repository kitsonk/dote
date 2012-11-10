define([
	"dojo/_base/lang",
	"dojox/encoding/crypto/RSAKey-ext",
	"dote/util",
	"dojo/text!keys/pubKey.json",
	"dojo/text!keys/privKey.json"
], function(lang, RSAKey, util, pubKey, privKey){

	pubKey = JSON.parse(pubKey);
	privKey = JSON.parse(privKey);

	var rsakey = new RSAKey();
	rsakey.setPrivateEx(privKey.n, privKey.e, privKey.d, privKey.p, privKey.q, privKey.dmp1, privKey.dmq1, privKey.coeff);

	function authorized(username, password){
		password = rsakey.decrypt(util.b64tohex(password));
		return password == "password";
	}

	return {
		pubKey: pubKey,
		decrypt: lang.hitch(rsakey, rsakey.decrypt),
		authorized: authorized
	};
});