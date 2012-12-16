define([
	"dojo/_base/array", // array.forEach
	"dojo/dom", // dom.byId
	"dojo/ready",
	"dojo/store/Cache",
	"dojo/store/JsonRest",
	"dojo/store/Memory",
	"dojo/when",
	"dijit/form/Button",
	"dijit/form/CheckBox",
	"dijit/form/Select",
	"dijit/form/TextBox",
	"dijit/TitlePane",
	"./TopicList",
	"./userControls",
	"moment/moment"
], function(array, dom, ready, Cache, JsonRest, Memory, when, Button, Checkbox, Select, TextBox, TitlePane, TopicList,
		userControls, moment){

	var topicStore = Cache(new JsonRest({
			target: "/topics/"
		}), new Memory(), {}),
		ownersStore = new JsonRest({
			target: "/owners/"
		}),
		ownerResults = ownersStore.query();

	function generateQuery(filter){
		var queryTerms = [],
			key, value;
		for(key in filter){
			value = filter[key];
			switch(key){
				case "filterTagTextBox":
					if(value){
						queryTerms.push("in(tags,(" + value.split(/\s*,\s*/).join(",") + "))");
					}
					break;
				case "filterInactive":
					if(value){
						queryTerms.push("in(action,(open,reopened))");
					}
					break;
				case "filterOwnerSelect":
					if(value === "__undefined"){
						queryTerms.push("owner=null");
					}else if(value){
						queryTerms.push("owner=" + value);
					}
			}
		}
		return "?" + queryTerms.join("&");
	}

	ready(function(){
		userControls.start();

		var widgets = [];

		var filterTagTextBox = new TextBox({
			id: "filterTagTextBox",
			name: "filterTagTextBox",
			placeHolder: "Comma seperated"
		}, "filterTagTextBox");

		var filterInactive = new Checkbox({
			id: "filterInactive",
			name: "filterInactive"
		}, "filterInactive");

		var filterOwnerSelect = new Select({
			id: "filterOwnerSelect",
			name: "filterOwnerSelect"
		}, "filterOwnerSelect");

		var filterButton = new Button({
			id: "filterButton",
			label: "Filter",
			type: "button"
		}, "filterButton");

		filterButton.on("click", function(e){
			e && e.preventDefault();
			clearButton.set("disabled", false);
			filterPane.set("title", "Filter (Active)");
			var filter = {};
			array.forEach(dom.byId("filterForm").elements, function(element){
				if(element.name && element.type !== "checkbox"){
					filter[element.name] = element.value;
				}else if(element.name){
					filter[element.name] = element.checked;
				}
			});
			tl.set("query", generateQuery(filter));
			tl.empty();
			tl.fetch();
		});

		var clearButton = new Button({
			id: "clearButton",
			label: "Clear",
			type: "button",
			disabled: true
		}, "clearButton");

		clearButton.on("click", function(e){
			e && e.preventDefault();
			clearButton.set("disabled", true);
			filterButton.focus();
			filterPane.set("title", "Filter");
			tl.set("query", "");
			tl.empty();
			tl.fetch();
		});

		var filterPane = new TitlePane({
			id: "filterPane",
			title: "Filter",
			open: false
		}, "filterPane");
		widgets.push(filterPane);

		var tl = new TopicList({
			store: topicStore,
			maxCount: 20,
			queryOptions: {
				sort: [
					{
						attribute: "created",
						descending: true
					}
				]
			},
			user: (dote && dote.username) || ""
		}, "topicList");
		widgets.push(tl);

		when(ownerResults).then(function(owners){
			owners.unshift({
				label: "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
				value: null
			});

			filterOwnerSelect.set("options", owners);

			array.forEach(widgets, function(widget){
				widget.startup();
			});

			tl.fetch();
		});
	});

	return {};
});