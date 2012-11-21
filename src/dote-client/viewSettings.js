define([
	"dojo/_base/array",
	"dojo/dom",
	"dojo/on",
	"dojo/ready",
	"dojo/store/JsonRest",
	"dijit/form/Button",
	"dijit/form/TextBox",
	"dote-client/userControls"
], function(array, dom, on, ready, JsonRest, Button, TextBox, userControls){

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
		widgets.push(new TextBox({
			id: "email",
			name: "email",
			type: "text",
			placeholder: "name@example.com"
		}, "email"));
		widgets.push(new TextBox({
			id: "ontags",
			name: "ontags",
			type: "text",
			placeholder: "Comma seperated list"
		}, "ontags"));

		on(dom.byId("userSettings"), "submit", function(e){
			e && e.preventDefault();
			console.log("submit");
		});

		array.forEach(widgets, function(widget){
			widget.startup();
		});
	});
	
	return {};
});