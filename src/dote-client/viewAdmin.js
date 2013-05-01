define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dijit/form/Button",
	"dgrid/OnDemandGrid",
	"dgrid/Keyboard",
	"dgrid/Selection",
	"dgrid/editor",
	"moment/moment",
	"./store/JsonRest",
	"./userControls",
	"./widgetModules"
], function(array, declare, ready, Cache, Memory, Observable, Button, OnDemandGrid, Keyboard, Selection, editor, moment,
		JsonRest, userControls){

	var dateTimeFormat = "DD/MM/YY HH:mm";

	var userStore = Cache(new JsonRest({
		target: "/users/"
	}), new Memory());

	var topicStore = Observable(Cache(new JsonRest({
		target: "/topics/"
	}), new Memory()));

	ready(function(){
		userControls.start();

		var widgets = [];

		var userGridColumns = [
			{ field: "id", label: "User ID" },
			editor({
				field: "admin",
				label: "Admin Flag",
				editor: "checkbox",
				editOn: "dblclick",
				autoSave: true
			}),
			editor({
				field: "owner",
				label: "Owner Flag",
				editor: "checkbox",
				editOn: "dblclick",
				autoSave: true
			}),
			editor({
				field: "committer",
				label: "Committer Flag",
				editor: "checkbox",
				editOn: "dblclick",
				autoSave: true
			}),
			editor({
				field: "attempts",
				label: "Attempts",
				editor: "text",
				editOn: "dblclick",
				autoSave: true
			}),
			{
				field: "lastLogin",
				label: "Last Login",
				get: function(object){
					return object.lastLogin ? moment.unix(object.lastLogin).format(dateTimeFormat) : null;
				}
			}
		];

		var userGrid = new declare([OnDemandGrid, Keyboard, Selection])({
			columns: userGridColumns,
			store: userStore
		}, "userGrid");

		var topicGridColumns = [
			{
				field: "id",
				label: "ID",
				formatter: function (value) {
					return '<a href="/topic/' + value + '" target="_blank">' + value + '</a>';
				}
			},
			editor({
				field: "title",
				label: "Title",
				editor: "text",
				editOn: "dblclick",
				autoSave: true
			}),
			{
				field: "voters",
				sortable: false,
				label: "Vote",
				get: function (object) {
					var vote = object.voters.length ? 0 : null;
					array.forEach(object.voters, function(item){
						vote += item.vote;
					});
					return (vote > 0 && vote !== null) ? "+" + vote : vote;
				}
			},
			{ field: "author", label: "Author" },
			{
				field: "created",
				label: "Created",
				get: function (object) {
					return moment.unix(object.created).format(dateTimeFormat);
				}
			},
			editor({
				field: "owner",
				label: "Owner",
				editor: "text",
				editOn: "dblclick",
				autoSave: true
			}),
			editor({
				field: "action",
				label: "Action",
				editor: "text",
				editOn: "dblclick",
				autoSave: true
			}),
			{
				field: "actioned",
				label: "Actioned",
				get: function (object) {
					return object.actioned ? moment.unix(object.actioned).format(dateTimeFormat) : null;
				}
			},
			{ field: "commentsCount", label: "Cmt" }
		];

		var topicGrid = new declare([OnDemandGrid, Keyboard, Selection])({
			columns: topicGridColumns,
			store: topicStore,
			selectionMode: "single"
		}, "topicGrid");

		topicGrid.on("dgrid-select", function (e) {
			if (deleteTopic.get("disabled")) {
				deleteTopic.set("disabled", false);
			}
		});

		topicGrid.on("dgrid-deselect", function (e) {
			for (var key in e.grid.selection) {
				return;
			}
			deleteTopic.set("disabled", true);
		});

		var deleteTopic = new Button({
			id: "deleteTopic",
			label: "Delete Topic",
			disabled: true
		}, "deleteTopic");
		deleteTopic.on("click", function () {
			for (var key in topicGrid.selection) {
				topicStore.remove(key);
			}
		});
		widgets.push(deleteTopic);

		array.forEach(widgets, function (widget) {
			widget.startup();
		});
	});

});