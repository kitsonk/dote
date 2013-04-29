define([
	"./fade",
	"./userControls",
	"dote/util",
	"dojo/_base/array",
	"dojo/dom",
	"dojo/json",
	"dojo/on",
	"dojo/ready",
	"dojo/request",
	"dojo/store/JsonRest",
	"dijit/form/Button",
	"dijit/form/CheckBox",
	"dijit/form/TextBox",
	"dijit/form/ValidationTextBox",
	"dijit/registry",
	"dojox/encoding/crypto/RSAKey",
	"./widgetModules"
], function(fade, userControls, util, array, dom, JSON, on, ready, request, JsonRest, Button, CheckBox, TextBox,
		ValidationTextBox, registry, RSAKey){

	var userStore = new JsonRest({
		target: "/users/"
	});

	ready(function(){
		userControls.start();

		var widgets = [];
		widgets.push(new Button({
			id: "save",
			type: "submit",
			label: "Save"
		}, "save"));
		widgets.push(new ValidationTextBox({
			id: "email",
			name: "email",
			type: "text",
			promptMessage: "This is the e-mail address e-mails will be sent to.",
			invalidMessage: "Not a valid e-mail address",
			pattern: "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?",
			placeholder: "name@example.com"
		}, "email"));
		widgets.push(new ValidationTextBox({
			id: "fromaddress",
			name: "fromaddress",
			type: "text",
			promptMessage: "E-mails from this address are matched to your<br>username for creating posts and voting. This will<br>default to the <strong>Send to Address</strong>.",
			invalidMessage: "Not a valid e-mail address",
			pattern: "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?",
			placeholder: "name@example.com"
		}, "fromaddress"));
		widgets.push(new ValidationTextBox({
			id: "password",
			name: "password",
			type: "password",
			promptMessage: "",
			invalidMessage: "Please ensure your password is at least six characters long",
			pattern: "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]{6,}",
			value: "password"
		}, "password"));
		widgets.push(new ValidationTextBox({
			id: "confirmpassword",
			name: "confirmpassword",
			type: "password",
			promptMessage: "Please re-enter your password.",
			invalidMessage: "Passwords do not match.",
			disabled: true
		}, "confirmpassword"));
		widgets.push(new TextBox({
			id: "ontags",
			name: "ontags",
			type: "text",
			placeholder: "Comma seperated list"
		}, "ontags"));
		array.forEach(["onnew", "onwatched", "onparticipate", "onown", "onassigned", "excreated", "optout"], function(id){
			widgets.push(new CheckBox({
				id: id,
				name: id
			}, id));
		});

		var userSettings = dom.byId("userSettings"),
			save = registry.byId("save");

		on(userSettings, "submit", function(e){
			function sendSettings(settings) {
				return request.post("/userSettings", {
					data: { settings: JSON.stringify(settings) }
				});
			}

			e && e.preventDefault();
			save.set("disabled", true);
			var settings = {};
			array.forEach(userSettings.elements, function(element){
				if(element.name && element.type !== "checkbox"){
					settings[element.name] = element.value;
				}else if(element.name){
					settings[element.name] = element.checked;
				}
			});
			settings.ontags = settings.ontags.split(/\s*,\s*/);
			delete settings.confirmpassword;
			var r;
			if (settings.password && settings.password !== 'password') {
				r = request.get("/pubKey", {
					handleAs: "json"
				}).then(function (pubKey) {
					var rsakey = new RSAKey();
					rsakey.setPublic(pubKey.n, pubKey.e);
					settings.password = util.hex2b64(rsakey.encrypt(settings.password));
					return sendSettings(settings);
				}).otherwise(function (e) {
					console.error(e);
				});
			}
			else {
				r = sendSettings(settings);
			}
			r.always(function(){
				save.set("disabled", false);
			});
		});

		var optout = registry.byId("optout");
		optout.on("change", function(value){
			array.forEach(["onnew", "onwatched", "onparticipate", "onown", "onassigned", "ontags", "excreated", "email"],
			function(id){
				registry.byId(id).set("disabled", value);
			});
		});

		var password = registry.byId("password"),
			confirmpassword = registry.byId("confirmpassword");
		password.on("input", function(e){
			if (password.get("value") !== "password" && confirmpassword.get("disabled")) {
				confirmpassword.set("disabled", false);
				save.set("disabled", true);
			}
		});

		confirmpassword.validator = function (value) {
			if (value === password.get("value")) {
				if (save.get("disabled")) {
					save.set("disabled", false);
				}
				return true;
			}
			if (!save.get("disabled")) {
				save.set("disabled", true);
			}
			return false;
		};

		array.forEach(widgets, function(widget){
			widget.startup();
		});

		request.get("/userSettings",{
			handleAs: "json"
		}).then(function(settings){
			var id, widget, value;
			for(id in settings){
				if(id !== 'password' && id !== 'confirmpassword' && (widget = registry.byId(id))){ // intentional assignment
					value = settings[id];
					if(widget.get("type") === "checkbox"){
						widget.set("checked", value);
					}else if(value instanceof Array){
						widget.set("value", value.join(", "));
					}else{
						widget.set("value", value);
					}
				}
			}
			fade.show(userSettings, 500, registry.byId("email"));
		});

	});

	return {};
});