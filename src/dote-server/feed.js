define([
	'./stores',
	'./topic',
	'./config',
	'dojo/promise/all',
	'moment/moment',
	'dojo/node!feed'
], function (stores, topic, config, all, moment, Feed) {

	function eventFeed() {
		var feed = new Feed({
			title: config.title + ' Events',
			description: config.subtitle,
			link: config.address,
			image: config.address + '_static/dote.png',
			copyright: 'Copyright © 2012-2013 Dojo Foundation - All Rights Reserved',
			author: {
				name: config.title,
				email: config.mail.address,
				link: config.address
			}
		});
		return stores.events.query('sort(-created)&limit(' + config.rss.eventCount + ',0,Infinity)').then(function (events) {
			var dfds = [];
			events.forEach(function (event) {
				switch (event.type) {
				case 'topic.vote':
				case 'topic.new':
				case 'topic.action':
				case 'topic.tag':
				case 'topic.assigned':
					dfds.push(topic(event.target).get().then(function (data) {
						event.topic = data;
					}));
					break;
				case 'comment':
					dfds.push(topic(event.topicId).get().then(function (data) {
						event.topic = data;
					}));
					dfds.push(stores.comments.get(event.target).then(function (data) {
						event.comment = data;
					}));
					break;
				}
			});
			return all(dfds).then(function () {
				var title,
					link,
					description;
				events.forEach(function (event) {
					description = '';
					switch (event.type) {
					case 'topic.vote':
						title = event.user.id + ' has voted ' + (event.value ? event.value > 0 ? '+1' : '-1' : '0') +
							' on topic "' + event.topic.title + '"';
						link = config.address + 'archive/topic/' + event.target;
						break;
					case 'topic.new':
						title = event.user.id + ' has created topic "' + event.topic.title + '"';
						link = config.address + 'archive/topic/' + event.target;
						break;
					case 'topic.action':
						title = event.user.id + ' has ' + event.value + ' topic "' + event.topic.title + '"';
						link = config.address + 'archive/topic/' + event.target;
						description = event.topic.description;
						break;
					case 'topic.tag':
						title = event.user.id + ' has tagged topic "' + event.topic.title + '"';
						link = config.address + 'archive/topic/' + event.target;
						break;
					case 'topic.assigned':
						title = event.user.id + ' has been assigned as owner of topic "' + event.topic.title + '"';
						link = config.address + 'archive/topic/' + event.target;
						break;
					case 'comment':
						title = event.user.id + ' has commented on topic "' + event.topic.title + '"';
						link = config.address + 'archive/topic/' + event.topicId + '#' + event.target;
						description = event.comment.text;
						break;
					case 'user.welcome':
						title = event.target + ' has joined';
						break;
					}
					feed.item({
						title: title || 'No Title',
						link: link || config.address,
						description: description || title || 'No Title',
						date: new Date(event.created * 1000)
					});
				});
				return feed.render('rss-2.0');
			});
		});
	}

	function topicFeed() {
		var feed = new Feed({
			title: config.title + ' Topics',
			description: config.subtitle,
			link: config.address,
			image: config.address + '_static/dote.png',
			copyright: 'Copyright © 2012-2013 Dojo Foundation - All Rights Reserved',
			author: {
				name: config.title,
				email: config.mail.address,
				link: config.address
			}
		});
		return topic.query('sort(-updated,-created)&ne(action,closed)&limit(' + config.rss.topicCount + ',0,Infinity)', {}).
			then(function (topics) {
				topics.forEach(function (data) {
					feed.item({
						title: data.title || '[ No Title ]',
						link: config.address + 'archive/topic/' + data.id,
						description: data.description || '[ No Description ]',
						date: new Date((data.updated || data.created) * 1000)
					});
				});
				return feed.render('rss-2.0');
			});
	}

	var feed = {
		events: eventFeed,
		topics: topicFeed
	};

	return feed;
});