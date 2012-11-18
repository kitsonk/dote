require([
	"dote/util",
	"dojo/_base/array",
	"dojo/_base/fx",
	"dojo/_base/window",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/ready",
	"dojo/request",
	"dijit/form/Button",
	"dijit/form/TextBox",
	"dojox/encoding/crypto/RSAKey"
], function(util, array, baseFx, win, dom, style, ready, request, Button, TextBox, RSAKey){

	var widgets = [],
		warningVisible = false,
		rsakey = new RSAKey();

	ready(function(){

		var warnNode = dom.byId("warn");

		function showWarning(text){
			if(!warningVisible){
				style.set(warnNode, "opacity", "0");
				style.set(warnNode, "display", "block");
				warnNode.innerHTML = text;
				baseFx.fadeIn({
					node: warnNode,
					duration: 750
				}).play();
				warningVisible = true;
			}else{
				warnNode.innerHTML = text;
			}
		}

		function doLogin(e){
			e.preventDefault();
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
					if(results && results.href){
						win.global.location.href = results.href;
					}
				}, function(e){
					showWarning("Invalid username or password.");
					submit.set("disabled", false);
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