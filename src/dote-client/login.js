require([
	"dote/util",
	"dojo/_base/array",
	"dojo/ready",
	"dojo/request",
	"dijit/form/Button",
	"dijit/form/TextBox",
	"dojox/encoding/crypto/RSAKey"
], function(util, array, ready, request, Button, TextBox, RSAKey){

	var widgets = [],
		rsakey = new RSAKey();
	rsakey.setPublic(pubKey.n, pubKey.e);

	ready(function(){

		function doLogin(e){
			e.preventDefault();
			submit.set("disabled", true);
			request.get("/pubKey",{
				handleAs: "json"
			}).then(function(pubKey){
				request.post("/users/" + username.get("value") + "/auth/", {
					data: { password: util.hex2b64(rsakey.encrypt(password.get("value"))) },
					handleAs: "json"
				}).then(function(results){
					console.log(results);
				});
			});
		}

		var username = new TextBox({
			id: "username"
		}, "username");
		widgets.push(username);
		var password = new TextBox({
			id: "password",
			type: "password"
		}, "password");
		widgets.push(password);
		var submit = new Button({
			id: "submit"
		}, "submit");
		submit.on("click", doLogin);
		widgets.push(submit);
		array.forEach(widgets, function(widget){
			widget.startup();
		});
		username.focus();
	});
});