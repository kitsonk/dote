define([
	"./fade",
	"dote/util",
	"dojo/_base/array",
	"dojo/_base/window",
	"dojo/dom",
	"dojo/on",
	"dojo/ready",
	"dojo/request",
	"dijit/form/Button",
	"dijit/form/TextBox",
	"dojox/encoding/crypto/RSAKey"
], function(fade, util, array, win, dom, on, ready, request, Button, TextBox, RSAKey){

	var widgets = [],
		warningVisible = false,
		rsakey = new RSAKey();

	ready(function(){

		var warnNode = dom.byId("warn"),
			loginForm = dom.byId('loginForm');

		function showWarning(text){
			if(!warningVisible){
				warnNode.innerHTML = text;
				fade.show(warnNode, 750);
				warningVisible = true;
			}else{
				warnNode.innerHTML = text;
			}
		}

		function doLogin(e){
			// e.preventDefault();
			submit.set("disabled", true);
			request.get("/pubKey",{
				handleAs: "json"
			}).then(function(pubKey){
				rsakey.setPublic(pubKey.n, pubKey.e);
				request.post("/users/" + username.get("value") + "/auth/", {
					data: { password: util.hex2b64(rsakey.encrypt(password.get("value"))) },
					handleAs: "json"
				}).then(function(results){
					submit.set("disabled", false);
					if(results){
						loginForm.submit();
					}
				}, function(e){
					showWarning("Invalid username or password.");
					submit.set("disabled", false);
				});
			});
			return false;
		}

		var username = new TextBox({
			id: "username",
			autocomplete: "on"
		}, "username");
		widgets.push(username);
		var password = new TextBox({
			id: "password",
			type: "password",
			autocomplete: "on"
		}, "password");
		widgets.push(password);
		var submit = new Button({
			id: "submit",
			type: "submit"
		}, "submit");
		submit.on("click", doLogin);
		widgets.push(submit);
		array.forEach(widgets, function(widget){
			widget.startup();
		});
		username.focus();
	});

	return {};
});