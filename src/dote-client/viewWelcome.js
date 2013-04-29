define([
	"./fade",
	"./userControls",
	"dote/util",
	"dojo/_base/array",
	"dojo/_base/window",
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
], function(fade, userControls, util, array, win, dom, JSON, on, ready, request, JsonRest, Button, CheckBox, TextBox,
		ValidationTextBox, registry, RSAKey){

	var userStore = new JsonRest({
		target: "/users/"
	});

	ready(function(){
		userControls.start();

		var widgets = [];
		widgets.push(new Button({
			id: "next",
			type: "button",
			label: "Next",
			style: {
				"float": "right"
			},
			disabled: true
		}, "next"));
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
			placeholder: "Enter Password"
		}, "password"));
		widgets.push(new ValidationTextBox({
			id: "confirmpassword",
			name: "confirmpassword",
			type: "password",
			promptMessage: "Please re-enter your password.",
			invalidMessage: "Passwords do not match.",
			placeholder: "Re-Enter Password",
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
			next = registry.byId("next");

		function saveSettings(e){
			function sendSettings(settings) {
				return request.post("/userSettings", {
					data: { settings: JSON.stringify(settings) }
				});
			}

			e && e.preventDefault();
			next.set("disabled", true);
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
				next.set("disabled", false);
				win.global.location.href = "/";
			});
		}

		on(userSettings, "submit", saveSettings);
		next.on("click", saveSettings);

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
				next.set("disabled", true);
			}
		});

		confirmpassword.validator = function (value) {
			if (value === password.get("value")) {
				if (next.get("disabled")) {
					next.set("disabled", false);
				}
				return true;
			}
			if (!next.get("disabled")) {
				next.set("disabled", true);
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
				if(widget = registry.byId(id)){
					value = settings[id];
					if(widget.get("type") === "checkbox"){
						widget.set("checked", value);
					}else if(value instanceof Array){
						widget.set("value", value.join(", "));
					}else if(id == "email"){
						widget.set("value", value || dote.email);
					}else{
						widget.set("value", value);
					}
				}
			}
			fade.show(userSettings);
		});

	});

	return {};
});