define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/Memory",
	"dgrid/OnDemandGrid",
	"dgrid/Keyboard",
	"dgrid/Selection",
	"dgrid/editor",
	"moment/moment",
	"./store/JsonRest",
	"./userControls"
], function(array, declare, ready, Cache, Memory, OnDemandGrid, Keyboard, Selection, editor, moment, JsonRest,
		userControls){

	var dateTimeFormat = "DD/MM/YY HH:mm";

	var userStore = Cache(new JsonRest({
		target: "/users/"
	}), new Memory());

	var topicStore = Cache(new JsonRest({
		target: "/topics/"
	}), new Memory());

	ready(function(){
		userControls.start();

		var userGridColumns = [
			{ field: "id", label: "User ID" },
			editor({
				field: "admin",
				label: "Admin Flag",
				editor: "checkbox",
				editOn: "dblclick",
				autoSave: true
			}),
			{ field: "owner", label: "Owner Flag" },
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
				formatter: function(value){
					return '<a href="/topic/' + value + '" target="_blank">' + value + '</a>';
				}
			},
			{ field: "title", label: "Title" },
			{
				field: "voters",
				sortable: false,
				label: "Vote",
				get: function(object){
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
				get: function(object){
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
			{ field: "action", label: "Action" },
			{
				field: "actioned",
				label: "Actioned",
				get: function(object){
					return object.actioned ? moment.unix(object.actioned).format(dateTimeFormat) : null;
				}
			},
			{ field: "commentsCount", label: "Cmt" }
		];

		var topicGrid = new declare([OnDemandGrid, Keyboard, Selection])({
			columns: topicGridColumns,
			store: topicStore
		}, "topicGrid");
	});

});