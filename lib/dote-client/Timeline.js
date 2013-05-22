define("dote-client/Timeline", [
	'./_StoreMixin',
	'./fade',
	'dojo/_base/array',
	'dojo/_base/declare', // declare
	'dojo/_base/lang', // lang.mixin, lang.hitch
	'dojo/_base/window', // win.doc win.global
	'dojo/dom-attr', // attr.set attr.remove
	'dojo/dom-class', // domClass.remove
	'dojo/dom-geometry', // domGeom.position
	'dojo/on', // on
	'dojo/window', // winUtil.getBox
	'dijit/_Contained',
	'dijit/_CssStateMixin',
	'dijit/_OnDijitClickMixin',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetBase',
	'dijit/layout/_LayoutWidget',
	'moment/moment',
	'dojo/text!./resources/_Event.html',
	'dojo/text!./resources/Timeline.html'
], function (_StoreMixin, fade, array, declare, lang, win, attr, domClass, domGeom, on, winUtil, _Contained,
		_CssStateMixin, _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, _LayoutWidget, moment, templateEvent,
		templateTimeline) {

	var eventTypeClasses = [
			'doteEventTypeVotePlus',
			'doteEventTypeVoteMinus',
			'doteEventTypeVoteNeutral',
			'doteEventTypeComment',
			'doteEventTypeQuestion',
			'doteEventTypeActionAccepted',
			'doteEventTypeActionRejected',
			'doteEventTypeActionClosed',
			'doteEventTypeActionOpen',
			'doteEventTypeNew',
			'doteEventTypeAssign',
			'doteEventTypeTag',
			'doteEventTypeWelcome'
		];

	var _Event = declare([_WidgetBase, _Contained, _TemplatedMixin, _OnDijitClickMixin, _CssStateMixin], {
		baseClass: 'doteEvent',
		templateString: templateEvent,

		cssStateNodes: {
			"innerNode": "doteEventInner"
		},

		item: null,
		_setItemAttr: function (value) {
			var username = (value.user && value.user.id || ''),
				voteValue;
			if (value.user && value.user.committer) {
				username = '<span class="username committer">' + username + '</span>';
			}
			else {
				username = '<span class="username">' + username + '</span>';
			}
			domClass.remove(this.typeNode, eventTypeClasses);
			switch (value.type) {
			case 'topic.vote':
				switch (value.value) {
				case -1:
					this.typeNode.innerHTML = '<i class="icon-minus"></i>';
					domClass.add(this.typeNode, 'doteEventTypeVoteMinus');
					voteValue = '-1';
					break;
				case 1:
					this.typeNode.innerHTML = '<i class="icon-plus"></i>';
					domClass.add(this.typeNode, 'doteEventTypeVotePlus');
					voteValue = '+1';
					break;
				case 0:
					this.typeNode.innerHTML = '<i class="icon-circle-blank"></i>';
					domClass.add(this.typeNode, 'doteEventTypeVoteNeutral');
					voteValue = '0';
					break;
				default:
					this.typeNode.innerHTML = '<i class="icon-question"></i>';
					domClass.add(this.typeNode, 'doteEventTypeQuestion');
					voteValue = '?';
				}
				this.descriptionNode.innerHTML = username + ' has voted <span class="vote">' + voteValue +
					'</span> on topic <span class="topicTitle">' + value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'comment':
				this.typeNode.innerHTML = '<i class="icon-comment"></i>';
				domClass.add(this.typeNode, 'doteEventTypeComment');
				this.descriptionNode.innerHTML = username + ' has commented on topic <span class="topicTitle">' +
					value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.topicId + '#' + value.target);
				break;
			case 'topic.action':
				switch (value.value) {
				case 'accepted':
					this.typeNode.innerHTML = '<i class="icon-ok"></i>';
					domClass.add(this.typeNode, 'doteEventTypeActionAccepted');
					break;
				case 'rejected':
					this.typeNode.innerHTML = '<i class="icon-remove"></i>';
					domClass.add(this.typeNode, 'doteEventTypeActionRejected');
					break;
				case 'closed':
					this.typeNode.innerHTML = '<i class="icon-trash"></i>';
					domClass.add(this.typeNode, 'doteEventTypeActionClosed');
					break;
				case 'opened':
				case 'reopened':
					this.typeNode.innerHTML = '<i class="icon-info"></i>';
					domClass.add(this.typeNode, 'doteEventTypeActionOpen');
					break;
				default:
					this.typeNode.innerHTML = '<i class="icon-question"></i>';
				}
				this.descriptionNode.innerHTML = username + ' has <span class="action">' + value.value +
					'</span> topic <span class="topicTitle">' + value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'topic.new':
				this.typeNode.innerHTML = '<i class="icon-pencil"></i>';
				domClass.add(this.typeNode, 'doteEventTypeNew');
				this.descriptionNode.innerHTML = username + ' has created the topic <span class="topicTitle">' +
					value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'topic.assigned':
				this.typeNode.innerHTML = '<i class="icon-legal"></i>';
				domClass.add(this.typeNode, 'doteEventTypeAssign');
				this.descriptionNode.innerHTML = username + ' has been assigned to topic <span class="topicTitle">' +
					value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'topic.tag':
				this.typeNode.innerHTML = '<i class="icon-tag"></i>';
				domClass.add(this.typeNode, 'doteEventTypeTag');
				this.descriptionNode.innerHTML = username + ' has tagged topic <span class="topicTitle">' +
					value.topic.title + '</span>.';
				this.set('href', '/topic/' + value.target);
				break;
			case 'user.welcome':
				this.typeNode.innerHTML = '<i class="icon-user"></i>';
				domClass.add(this.typeNode, 'doteEventTypeWelcome');
				this.descriptionNode.innerHTML = '<span class="newuser">' + value.target + '</span> has joined.';
				this.set('href', '');
				break;
			default:
				this.typeNode.innerHTML = '<i class="icon-question"></i>';
				this.descriptionNode.innerHTML = 'Someone did something, but I don\'t know what it was.';
				this.set('href', '');
			}
			if (value.created) {
				this.timeNode.innerHTML = '<span>' + moment.unix(value.created).fromNow() + '</span>';
			}
			this._set('item', value);
		},

		href: '',

		timeline: null,

		startup: function () {
			this.inherited(arguments);
			fade.show(this.domNode);
		},

		_onClick: function (e) {
			e && e.preventDefault();
			if (this.href) {
				win.global.location.href = this.href;
			}
		}
	});

	var Timeline = declare([_LayoutWidget, _TemplatedMixin, _CssStateMixin, _OnDijitClickMixin, _StoreMixin], {
		baseClass: 'doteTimeline',
		templateString: templateTimeline,

		moreLabel: 'More...',
		loadingLabel: '<span class="dijitInline doteTopicListLoadingIcon"></span>Loading...',

		cssStateNodes: {
			"moreButtonNode": "doteTimelineMoreButton"
		},

		_signals: null,

		more: false,
		_setMoreAttr: function (value) {
			if (value !== this.more) {
				if (value) {
					domClass.remove(this.moreNode, this.baseClass + 'Hide');
					this._signals.push(on(this.domNode.parentNode, 'scroll', lang.hitch(this, this._calcMoreVisible)));
					this._signals.push(on(win.doc, 'scroll', lang.hitch(this, this._calcMoreVisible)));
				}
				else {
					domClass.add(this.moreNode, this.baseClass + 'Hide');
					array.forEach(this._signals, function (signal) {
						signal.remove();
					});
					this._signals = [];
				}
				this._set('more', value);
			}
		},

		constructor: function () {
			this._signals = [];
		},

		startup: function () {
			this.inherited(arguments);
			this.own(this.on('results', lang.hitch(this, this._onResults)));
			this.own(this.on('visible', lang.hitch(this, this._onVisible)));
		},

		addEvent: function (eventInfo) {
			this.addChild(lang.mixin(eventInfo, {
				id: this.id + '_event' + this.getChildren().length
			}));
		},

		empty: function () {
			this.set('more', false);
			this.set('start', 0);
			this.destroyDescendants();
		},

		_onResults: function (e) {
			if (e && e.items) {
				var self = this;
				self._morePos = null;
				e.items.forEach(function (item) {
					self.addChild(new _Event({
						id: this.id + '_event' + self.getChildren().length,
						timeline: self,
						item: item
					}));
				});
				if (self.total && self.total > self.getChildren().length) {
					self.set('more', true);
				}
				else {
					self.set('more', false);
				}
			}
		},

		_calcMoreVisible: function () {
			var morePos = this._morePos = this._morePos || domGeom.position(this.moreNode, true),
				winPos = winUtil.getBox(),
				moreVisible = ((morePos.y > (winPos.t)) && (morePos.y <= (winPos.h + winPos.t))) &&
					((morePos.x > winPos.l) && (morePos.x <= (winPos.w + winPos.l)));
			if (moreVisible !== this.moreVisible) {
				if (moreVisible && !this.moreVisible) {
					this.emit('visible', { node: this.moreNode, position: { node: morePos, win: winPos } });
				}
				this.set('moreVisible', moreVisible);
			}
		},

		_setLoading: function (loading) {
			if (loading) {
				attr.set(this.moreButtonNode, 'disabled', 'disabled');
				this.moreButtonNode.innerHTML = this.loadingLabel;
			}
			else {
				attr.remove(this.moreButtonNode, 'disabled');
				this.moreButtonNode.innerHTML = this.moreLabel;
			}
		},

		_onVisible: function(e){
			if(e.node === this.moreNode){
				if(this.start < this.maxCount){
					this._setLoading(true);
					this.fetch().then(lang.hitch(this, this._setLoading));
				}
			}
		},

		_onMoreClick: function (e) {
			e && e.preventDefault();
			this._setLoading(true);
			this.fetch().then(lang.hitch(this, this._setLoading));
		}
	});

	return Timeline;

});require({cache:{
'url:dote-client/resources/_Event.html':"<div class=\"${baseClass}\" data-dojo-attach-event=\"ondijitclick:_onClick\">\n\t<div class=\"${baseClass}Inner\" data-dojo-attach-point=\"innerNode\">\n\t\t<div class=\"${baseClass}Time\" data-dojo-attach-point=\"timeNode\"></div>\n\t\t<div class=\"${baseClass}Type\" data-dojo-attach-point=\"typeNode\"></div>\n\t\t<div class=\"${baseClass}Description\" data-dojo-attach-point=\"descriptionNode\"></div>\n\t</div>\n</div>",
'url:dote-client/resources/Timeline.html':"<div class=\"${baseClass}\" role=\"presentation\" data-dojo-attach-point=\"wrapperNode\">\n\t<div class=\"${baseClass}Container\" data-dojo-attach-point=\"containerNode\"></div>\n\t<div class=\"${baseClass}More ${baseClass}Hide\" data-dojo-attach-point=\"moreNode\">\n\t\t<button type=\"button\" class=\"${baseClass}MoreButton\" data-dojo-attach-event=\"ondijitclick:_onMoreClick\" data-dojo-attach-point=\"moreButtonNode\">${moreLabel}</button>\n\t</div>\n</div>"}});
