define([
	"./fade",
	"./userControls",
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
	"dijit/registry"
], function(fade, userControls, array, dom, JSON, on, ready, request, JsonRest, Button, CheckBox, TextBox,
		ValidationTextBox, registry){

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

		var userSettings = dom.byId("userSettings");

		on(userSettings, "submit", function(e){
			e && e.preventDefault();
			registry.byId("save").set("disabled", true);
			var settings = {};
			array.forEach(userSettings.elements, function(element){
				if(element.name && element.type !== "checkbox"){
					settings[element.name] = element.value;
				}else if(element.name){
					settings[element.name] = element.checked;
				}
			});
			settings.ontags = settings.ontags.split(/\s*,\s*/);
			request.post("/userSettings", {
				data: { settings: JSON.stringify(settings) }
			}).always(function(){
				registry.byId("save").set("disabled", false);
			});
		});

		var optout = registry.byId("optout");
		optout.on("change", function(value){
			array.forEach(["onnew", "onwatched", "onparticipate", "onown", "onassigned", "ontags", "excreated", "email"],
			function(id){
				registry.byId(id).set("disabled", value);
			});
		});

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