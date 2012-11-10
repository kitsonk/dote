require([
	"dojox/encoding/crypto/RSAKey-ext",
	"setten/dfs"
], function(RSAKey, dfs){
	console.log("Generating Public/Private Key...");
	rsakey = new RSAKey();
	rsakey.generate(1024, "10001");
	pubKey = {
		n: rsakey.n.toString(16),
		e: rsakey.e.toString(16)
	};
	privKey = {
		n: rsakey.n.toString(16),
		e: rsakey.e.toString(16),
		d: rsakey.d.toString(16),
		p: rsakey.p.toString(16),
		q: rsakey.q.toString(16),
		dmp1: rsakey.dmp1.toString(16),
		dmq1: rsakey.dmq1.toString(16),
		coeff: rsakey.coeff.toString(16)
	};
	dfs.writeFile("keys/pubKey.json", JSON.stringify(pubKey), "utf8").then(function(){
		console.log("Public Key written to 'keys/pubKey.json'");
	}, function(){
		console.error("Error writing Public Key!");
	});
	dfs.writeFile("keys/privKey.json", JSON.stringify(privKey), "utf8").then(function(){
		console.log("Private Key written to 'keys/privKey.json'");
	}, function(){
		console.error("Error writing Private Key!");
	});
});