require({cache:{
'url:dote-client/resources/TopicAdd.html':"<form class=\"${baseClass}\" action=\"\" method=\"post\">\n\t<input class=\"${baseClass}Title\" type=\"text\" name=\"title\" data-dojo-attach-point=\"titleNode\" />\n\t<div class=\"${baseClass}Status\" data-dojo-attach-point=\"statusContainerNode\">\n\t\t<div class=\"${baseClass}Poster\" data-dojo-attach-point=\"posterNode\"></div>\n\t\t<div class=\"${baseClass}OwnerContainer\">\n\t\t\t<label for=\"name\">Owned by</label>\n\t\t\t<select class=\"${baseClass}Owner\" name=\"owner\" data-dojo-attach-point=\"ownerNode\"></select>\n\t\t</div>\n\t</div>\n\t<div class=\"${baseClass}TagsContainer\">\n\t\t<i class=\"icon-tags\"></i>\n\t\t<input class=\"${baseClass}Tags\" type=\"text\" name=\"tags\" data-dojo-attach-point=\"tagsNode\" />\n\t</div>\n\t<div class=\"${baseClass}HeightContainer\"></div>\n\t<div class=\"${baseClass}DescriptionLabel\">Description</div>\n\t<div class=\"${baseClass}Description\" data-dojo-attach-point=\"descriptionNode\">\n\t\t<div class=\"${baseClass}PreviewContainer\" data-dojo-attach-point=\"previewContainerNode\"></div>\n\t\t<div class=\"${baseClass}ButtonPanel\">\n\t\t\t<button class=\"${baseClass}Submit\" type=\"submit\" data-dojo-attach-point=\"submitNode\">Add</button>\n\t\t\t<button class=\"${baseClass}Cancel\" type=\"button\" data-dojo-attach-point=\"cancelNode\">Cancel</button>\n\t\t</div>\n\t</form>\n</form>"}});
define("dote-client/TopicAdd", [
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.mixin
	"dojo/when", // when
	"dijit/_CssStateMixin",
	"dijit/_OnDijitClickMixin",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetBase",
	"dijit/form/Button",
	"dijit/form/Select",
	"dijit/form/Textarea",
	"dijit/form/TextBox",
	"dijit/layout/_LayoutWidget",
	"dijit/layout/ContentPane",
	"dijit/layout/TabContainer",
	"dojo/text!./resources/TopicAdd.html"
], function(array, declare, lang, when, _CssStateMixin, _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, Button,
		Select, Textarea, TextBox, _LayoutWidget, ContentPane, TabContainer, template){

	return declare([_LayoutWidget, _TemplatedMixin], {
		baseClass: "doteTopicAdd",
		templateString: template,

		_widgets: [],

		postText: null,
		previewContainer: null,
		submitButton: null,
		store: null,
		parser: null,

		user: "",
		_setUserAttr: function(value){
			this.posterNode.innerHTML = "Posted by " + value;
			this._set("user", value);
		},

		owners: null,

		ownerSelect: null,

		buildRendering: function(){
			this.inherited(arguments);
			this._widgets = [];

			this._widgets.push(new TextBox({
				id: this.id + "_title",
				"class": this.baseClass + "Title",
				name: "title",
				placeHolder: "Topic Title"
			}, this.titleNode));

			this.ownerSelect = new Select({
				id: this.id + "_owner",
				"class": this.baseClass + "Owner",
				name: "owner",
				options: this.owners
			}, this.ownerNode);
			this._widgets.push(this.ownerSelect);

			this._widgets.push(new TextBox({
				id: this.id + "_tags",
				"class": this.baseClass + "Tags",
				name: "tags",
				placeHolder: "Tags, Comma Separated"
			}, this.tagsNode));

			this.previewContainer = new TabContainer({
				id: this.id + "_previewContainer",
				doLayout: false
			}, this.previewContainerNode);

			var descriptionPane = new ContentPane({
				id: this.id + "_descriptionPane",
				"class": this.baseClass + "DescriptionPane",
				title: '<i class="icon-pencil"></i> Write'
			});

			descriptionPane.addChild(this.postText = new Textarea({
				id: this.id + "_descriptionTextarea",
				"class": this.baseClass + "DescriptionTextarea",
				placeHolder: "Description, markdown formatted",
				name: "description",
				style: {
					minHeight: "120px"
				},
				rows: 15
			}));
			this.previewContainer.addChild(descriptionPane);

			this.previewContainer.addChild(this.previewPane = new ContentPane({
				id: this.id + "_previewPane",
				"class": this.baseClass + "PreviewPane",
				title: '<i class="icon-eye-open"></i> Preview'
			}));
			this.own(this.previewPane.on("show", lang.hitch(this, this.previewDescription)));

			this._widgets.push(this.previewContainer);

			this._widgets.push(this.submitButton = new Button({
				id: this.id + "_submitButton",
				label: '<i class="icon-plus"></i> Add'
			}, this.submitNode));
			this.own(this.submitButton.on("click", lang.hitch(this, this._onSubmit)));

			this._widgets.push(this.cancelButton = new Button({
				id: this.id + "_cancelButton",
				label: '<i class="icon-remove"></i> Cancel'
			}, this.cancelNode));
			this.own(this.cancelButton.on("click", lang.hitch(this, this._onCancel)));
		},

		startup: function(){
			array.forEach(this._widgets, function(widget){
				if(widget && !widget._started && widget.startup){
					widget.startup();
				}
			});
			this.previewContainer.resize();
			this.inherited(arguments);
		},

		previewDescription: function(){
			var text = this.postText.get("value");
			if(this.parser){
				text = this.parser(text);
			}
			this.previewPane.set("content", text);
		},

		_onSubmit: function(e){
			e && e.preventDefault();
			this.submitButton.set("disabled", true);
			var item = {};
			array.forEach(this.domNode.elements, function(element){
				if(element.name){
					item[element.name] = element.value;
				}
			});
			item.tags = item.tags ? item.tags.replace(/\s{2,}/, " ").toLowerCase().split(/\s*,\s*/) : [];
			item.owner = item.owner == "__unassigned" ? "" : item.owner;
			var self = this;
			when(this.store.add(item), function(results){
				self.emit("add", { item: results });
				self.submitButton.set("disabled", false);
			}, function(e){
				console.error(e);
				self.submitButton.set("disabled", false);
			});
		},

		_onCancel: function(e){
			e && e.preventDefault();
			this.emit("cancel", e);
		}
	});
});