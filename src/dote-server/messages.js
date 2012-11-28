define([
	"dojo/node!juice",
	"./config",
	"./Mail",
	"./stores",
	"dojo/_base/lang", // lang.mixin
	"dojo/promise/all",
	"dojo/string", //string.substitute
	"dote/array",
	"dote/marked",
	"./stylus!./resources/messages.styl",
	"dojo/text!hljs/default.css"
], function(juice, config, Mail, stores, lang, all, string, array, marked, cssMessages, cssHljs){
	
	function getReplyToTemplate(name, address){
		address = address.split("@");
		return name + " <" + address[0] + "+${id}@" + address[1] + ">";
	}

	function getActionAddress(address, action, noWrap){
		address = address.split("@");
		return (noWrap ? "" : "<mailto:") + address[0] + "+" + action + "@" + address[1] + (noWrap ? "" : ">");
	}

	var mail,
		defaultSettings = {
			email: "",
			onnew: false,
			onwatched: false,
			onparticipate: true,
			onown: false,
			onassigned: false,
			ontags: [],
			excreated: true,
			optout: false
		},
		replyToTemplate = getReplyToTemplate(config.mail.username, config.mail.address),
		unsubscribeAddress = getActionAddress(config.mail.address, "unsubscribe"),
		postAddress = getActionAddress(config.mail.address, "post"),
		textFooter = string.substitute("\n\n-----\nWebsite: ${website}\nPost: ${post}\nSettings: ${website}settings\n" +
			"View: ${view}", {
				post: postAddress,
				website: config.address,
				view: config.address + "${id}"
			}),
		htmlFooter = string.substitute('<div class="dote_f">Website: <a href="${website}">${website}</a><br>' +
			'New Post: <a href="mailto:${post}">${post}</a><br>' +
			'Settings: <a href="${website}settings">${website}settings</a><br>' +
			'View: <a href="${view}">${view}</a></div>', {
				post: getActionAddress(config.mail.address, "post", true),
				website: config.address,
				view: config.address + "${id}"
			});

	function init(password){
		config.mail.severconfig.password = password;
		mail = new Mail(config.mail.severconfig);
	}

	function setSettings(username, settings){
		return stores.users.get(username).then(function(user){
			user.settings = lang.clone(settings);
			return stores.users.put(user).then(function(){
				return user.settings;
			});
		});
	}

	function getSettings(username){
		return stores.users.get(username).then(function(user){
			if(user && user.settings){
				return lang.clone(user.settings);
			}else{
				return lang.clone(defaultSettings);
			}
		});
	}

	function calculateTopicRecipients(topic, isNew){
		var queries = {};
		queries.users = stores.users.query("select(id,settings)", { allowBulkFetch: true });
		queries.comments = stores.comments.query("select(id,topicId,author)&topicId=" + topic.id,
			{allowBulkFetch: true});
		return all(queries).then(function(results){
			var addresses = [],
				participants = [],
				removeAuthor;
			results.comments.forEach(function(comment){
				participants.push(comment.author);
			});
			topic.voters.forEach(function(voter){
				participants.push(voter.name);
			});
			participants.push(topic.author);
			if(topic.owner) participants.push(topic.owner);
			participants = array.unique(participants);
			results.users.forEach(function(user){
				if(user.settings && user.settings.email && !user.settings.optout){
					if(user.settings.excreated && user.id == topic.author){
						console.log("removeAuthor");
						removeAuthor = user.settings.email;
					}
					if(user.settings.onnew && isNew){
						addresses.push(user.settings.email);
						return;
					}
					if(user.settings.onparticipate && participants.indexOf(user.id) > -1){
						addresses.push(user.settings.email);
						return;
					}
					if(user.settings.onown && topic.owner == user.id){
						addresses.push(user.settings.email);
						return;
					}
					if(array.intersection(user.settings.ontags.sort(), topic.tags.sort()).length){
						addresses.push(user.settings.email);
					}
				}
			});
			return removeAuthor ? array.filter(array.unique(addresses), function(address){
					return address !== removeAuthor;
				}) : array.unique(addresses);
		});
	}

	function calculateCommentRecipients(comment){
		var queries = {};
		//queries.users = stores.users.query("select(id,settings)")
	}

	function mailTopic(address, topic, options){
		options = options || {};
		var textHeader = "Created by: ${author}\n";
		if(topic.owner) textHeader += "Owned by: ${owner}\n";
		textHeader += "Status: ${action}\n";
		if(topic.tags && topic.tags.length) textHeader += "Tags: " + topic.tags.join(", ") + "\n";
		if(topic.voters && topic.voters.length){
			textHeader += "Votes: ";
			topic.voters.forEach(function(vote){
				textHeader += vote.name + "[" + (vote.vote == 1 ? "+1" : vote.vote == -1 ? "-1" : "0") + "] ";
			});
			textHeader += "\n";
		}
		textHeader += "\n";
		textHeader = string.substitute(textHeader, {
			author: topic.author,
			owner: topic.owner || "",
			action: topic.action || ""
		});
		var htmlHeader = '<div class="dote_h"><span class="dote_l">Created By:</span> ' +
			'<span class="dote_p">${author}</span>';
		if(topic.owner) htmlHeader += '<br><span class="dote_l">Owned by:</span> <span class="dote_p">' +
			'${owner}</span>';
		htmlHeader += '<br><span class="dote_l">Status:</span> <span class="dote_p">${action}</span>';
		if(topic.tags && topic.tags.length){
			htmlHeader += '<br><span class="dote_l">Tags:</span> ';
			topic.tags.forEach(function(tag){
				htmlHeader += '<span class="dote_t">' + tag + '</span> ';
			});
		}
		if(topic.voters && topic.voters.length){
			htmlHeader += '<br><span class="dote_l">Votes:</span> ';
			topic.voters.forEach(function(vote){
				htmlHeader += string.substitute('<span class="dote_${type}">${tag} [${vote}]</span> ', {
					type: vote.vote == 1 ? "u" : vote.vote == -1 ? "d" : "n",
					tag: vote.name,
					vote: vote.vote == 1 ? "+1" : vote.vote == -1 ? "-1" : "0"
				});
			});
		}
		htmlHeader += '</div>';
		htmlHeader = string.substitute(htmlHeader, {
			author: topic.author,
			owner: topic.owner || "",
			action: topic.action || ""
		});
		var message = {
			from: config.mail.username + " <" + config.mail.address + ">",
			to: username + " <" + address + ">",
			subject: "[" + config.mail.list.name + "] " + topic.title,
			"Reply-To": string.substitute(replyToTemplate, topic),
			"List-ID": config.mail.list.name + " <" + config.mail.list.id + ">",
			"List-Unsubscribe": unsubscribeAddress,
			"List-Post": postAddress,
			"List-Archive": config.address,
			"Message-ID": topic.id + "@" + config.mail.list.id,
			text: textHeader + topic.description + string.substitute(textFooter, topic),
			attachment:{
				data: juice(htmlHeader + marked(topic.description) + string.substitute(htmlFooter, topic),
					cssMessages + cssHljs),
				alternative: true
			}
		};
		return mail.send(message);
	}

	return {
		init: init,
		mail: mail,
		mailTopic: mailTopic,
		calculateTopicRecipients: calculateTopicRecipients,
		settings: {
			set: setSettings,
			get: getSettings
		}
	};
});