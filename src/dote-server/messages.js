define([
	"dojo/node!juice",
	"./config",
	"./Mail",
	"./stores",
	"dojo/_base/lang", // lang.mixin
	"dojo/Deferred",
	"dojo/promise/all", // all
	"dojo/when", // when
	"dote/array",
	"dote/marked",
	"dote/string", // string.substitute, string.capitaliseFirst
	"./stylus!./resources/messages.styl",
	"dojo/text!hljs/default.css"
], function(juice, config, Mail, stores, lang, Deferred, all, when, array, marked, string, cssMessages, cssHljs){
	
	var toRe = new RegExp("^" + config.mail.address.split("@")[0] + "\\+?([^@]*)@", "i"),
		subjectRe = new RegExp("(?:Re:)?\\s*(?:\\[" + config.mail.list.name +
			"\\])?\\s*(?:\\[[01\\-\\+]+\\])?\\s*(.+)$", "i"),
		textRe = /(?:Voting:\s+[01\-\+]+\s*\n*)?(?:\[Additional Comment:\]\s*\n*)?((?:.*\n*)*)/mi,
		outlookRe = /\n+_+\n+(?:.*(\n+|$))+/m;
		quoteRe = /\n*.+:\n+(?:\s*>\s*.*(?:\n+|$))+/m,
		topicIdRe = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
		actionTypes = ["voteu", "voted", "voten", "post", "unsubscribe"];

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
		htmlFooter = string.substitute('<div class="dote_f"><a href="${website}">Website</a> | ' +
			'<a href="mailto:${post}">Add Topic</a> | ' +
			'<a href="${website}settings">Settings</a> | ' +
			'<a href="${view}">View Topic</a></div>', {
				post: getActionAddress(config.mail.address, "post", true),
				website: config.address,
				view: config.address + "topic/${id}"
			});

	function init(password){
		config.mail.severconfig.password = password;
		mail = new Mail(config.mail.severconfig);
	}

	function setSettings(username, settings){
		return stores.users.get(username).then(function(user){
			if(!user){
				user = stores.defaultUser(username);
			}
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
			{ allowBulkFetch: true });
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
					var address = user.id + "<" + user.settings.email + ">";
					if(user.settings.excreated && user.id == topic.author){
						removeAuthor = address;
					}
					if(user.settings.onnew && isNew){
						addresses.push(address);
						return;
					}
					// Need to add watching
					if(user.settings.onparticipate && participants.indexOf(user.id) > -1){
						addresses.push(address);
						return;
					}
					if(user.settings.onown && topic.owner == user.id){
						addresses.push(address);
						return;
					}
					if(array.intersection(user.settings.ontags.sort(), topic.tags.sort()).length){
						addresses.push(address);
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
		queries.users = stores.users.query("select(id,settings)", { allowBulkFetch: true });
		queries.comments = stores.comments.query("select(id,topicId,author)&topicId=" + comment.topicId,
			{ allowBulkFetch: true });
		queries.topic = stores.topics.get(comment.topicId);
		return all(queries).then(function(results){
			var addresses = [],
				participants = [],
				removeAuthor,
				topic = results.topic || {};
			results.comments.forEach(function(c){
				participants.push(c.author);
			});
			if(topic.voters){
				topic.voters.forEach(function(voter){
					participants.push(voter.name);
				});
			}
			if(topic.author) participants.push(topic.author);
			if(topic.owner) participants.push(topic.owner);
			participants.push(comment.author);
			participants = array.unique(participants);
			console.log(participants);
			results.users.forEach(function(user){
				if(user.settings && user.settings.email && !user.settings.optout){
					var address = user.id + "<" + user.settings.email + ">";
					if(user.settings.excreated && user.id == comment.author){
						removeAuthor = address;
					}
					// Need to add watching
					if(user.settings.onparticipate && participants.indexOf(user.id) > -1){
						addresses.push(address);
						return;
					}
					if(user.settings.onown && topic.owner == user.id){
						addresses.push(address);
						return;
					}
					if(array.intersection(user.settings.ontags.sort(), topic.tags ? topic.tags.sort() : []).length){
						addresses.push(address);
					}
				}
			});
			return removeAuthor ? array.filter(array.unique(addresses), function(address){
				return address !== removeAuthor;
			}) : array.unique(addresses);
		});
	}

	function mailTo(address, options){
		options = options || {};
		address = address.split("@");
		var to = address[0],
			at = address[1],
			query = [],
			extensions = [];
		for(var key in options){
			switch(key){
				case "id":
					extensions.push(encodeURIComponent(options.id));
					break;
				case "action":
					extensions.push(encodeURIComponent(options.action));
					break;
				case "subject":
					query.push("subject=" + encodeURIComponent(options.subject));
					break;
				case "body":
					query.push("body=" + encodeURIComponent(options.body));
					break;
				case "cc":
					query.push("cc=" + encodeURIComponent(options.cc));
					break;
				case "bcc":
					query.push("bcc=" + encodeURIComponent(options.bcc));
					break;
			}
		}
		return "mailto:" + to + (extensions.length ? "+" + extensions.join("+") : "") + "@" + at +
			(query.length ? "?" + query.join("&") : "");
	}

	function mailTopic(address, topic, options){
		options = options || {};
		var comments = {},
			textHeader = "Created by: ${author}\n";
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
			action: string.capitaliseFirst(topic.action || "")
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
		htmlHeader += string.substitute('<br><br><a href="${mu}" class="dote_vu">Vote +1</a> ' +
			'<a href="${mn}" class="dote_vn">Vote 0</a> <a href="${md}" class="dote_vd">Vote -1</a>', {
				mu: mailTo(config.mail.address, {
					id: topic.id,
					action: "voteu",
					subject: "Re: [" + config.mail.list.name + "] [+1] " + topic.title,
					body: "Voting: +1\n\n[Additional Comment:]\n\n"
				}),
				mn: mailTo(config.mail.address, {
					id: topic.id,
					action: "voten",
					subject: "Re: [" + config.mail.list.name + "] [0] " + topic.title,
					body: "Voting: 0\n\n[Additional Comment:]\n\n"
				}),
				md: mailTo(config.mail.address, {
					id: topic.id,
					action: "voted",
					subject: "Re: [" + config.mail.list.name + "] [-1] " + topic.title,
					body: "Voting: -1\n\n[Additional Comment:]\n\n"
				})
			});
		htmlHeader += '</div>';
		htmlHeader = string.substitute(htmlHeader, {
			author: topic.author,
			owner: topic.owner || "",
			action: string.capitaliseFirst(topic.action || "")
		});
		if(options.includeComments){
			comments = stores.comments.query("select(id,topicId,author,created,text)&sort(+created)&topicId=" + topic.id).
				then(function(items){
					console.log(items);
					var commentText = "", commentHtml = "";
					items.forEach(function(comment){
						commentText += "\n**" + comment.author + "** said:\n > " +
							comment.text.replace(/\n/g, "\n > ") + "\n";
						commentHtml += '<div class="dote_c"><div class="dote_a"><b>' + comment.author +
							'</b> said:</div><div class="dote_b">' + marked(comment.text) + '</div></div>';
					});
					return {
						text: commentText,
						html: commentHtml
					};
				});
		}
		return when(comments, function(comment){
			var message = {
				from: config.mail.username + " <" + config.mail.address + ">",
				to: address,
				subject: "[" + config.mail.list.name + "] " + topic.title,
				"Reply-To": string.substitute(replyToTemplate, topic),
				"List-ID": config.mail.list.name + " <" + config.mail.list.id + ">",
				"List-Unsubscribe": unsubscribeAddress,
				"List-Post": postAddress,
				"List-Archive": config.address,
				"Message-ID": topic.id + "@" + config.mail.list.id,
				text: textHeader + topic.description + (comment.text || "") + string.substitute(textFooter, topic),
				attachment:{
					data: juice(htmlHeader + marked(topic.description) + (comment.html || "") +
						string.substitute(htmlFooter, topic), cssMessages + cssHljs),
					alternative: true
				}
			};
			if(config.mail.enabled){
				return mail.send(message);
			}
		});
	}

	function fetch(markSeen){
		var messages = [],
			dfd = new Deferred();
		var listener = mail.on("message", function(e){
			messages.push(e.mail);
		});
		if(config.mail.enabled){
			mail.connect().then(function(){
				return mail.openBox("INBOX");
			}).then(function(box){
				return mail.search([ "UNSEEN", ["SINCE", "May 20, 2010"] ]);
			}).then(function(results){
				if(results.length){
					var options = {
							request: {
								body: "full",
								headers: false
							}
						};
					if(markSeen) options.markSeen = true;
					var request = mail.fetch(results, options);
					request.on("end", function(){
						dfd.resolve(messages);
						listener.remove();
						return mail.logout();
					});
				}else{
					dfd.resolve([]);
					return mail.logout();
				}
			}).otherwise(dfd.reject);
		}else{
			dfd.resolve([]);
		}
		return dfd.promise;
	}

	function findUser(address){
		address = address.toLowerCase();
		return when(stores.users.query("select(id,settings)", { allowBulkFetch: true }).then(function(users){
			var match;
			users.some(function(user){
				return match = user.settings &&
					(user.settings.fromaddress && user.settings.fromaddress.toLowerCase() === address ?
						user : user.settings.email && user.settings.email.toLowerCase() === address ? user : false);
			});
			return match;
		}));
	}

	function processEmail(email){
		var actionParts = toRe.exec(email && email.to && email.to.length && email.to[0].address || ""),
			from = email && email.from && email.from.length && email.from[0].address || "",
			subject = subjectRe.exec(email.subject),
			textMatch = textRe.exec(email.text),
			text = textMatch && textMatch.length ? textMatch[1] : "",
			quoteMatch = quoteRe.exec(text);

		if(!quoteMatch || !quoteMatch.length){
			quoteMatch = outlookRe.exec(text);
		}
		var quote = quoteMatch && quoteMatch.length ? quoteMatch[0] : "";

		var processed = {
			text: quote ? text.replace(quote, "") : text,
			quote: quote,
			title: subject && subject.length ? subject[1] : "",
			emailId: email.id,
			from: from
		};

		if(actionParts && actionParts.length && actionParts[1]){
			processed.actions = actionParts[1].split("+");
		}

		return findUser(from).then(function(user){
			processed.user = user;
			return processed;
		});
	}

	function process(){
		return when(stores.emails.query(), function(results){
			var gets = [];
			results.forEach(function(result){
				gets.push(stores.emails.get(result.id).then(processEmail));
			});
			return all(gets).then(function(mails){
				var results = [];
				mails.forEach(function(mail){
					if(mail.user && mail.user.id){
						// Identified User
						var topicId,
							action;
						if(mail.actions && mail.actions.length){
							mail.actions.some(function(a){
								var result = topicIdRe.exec(a);
								return topicId = result ? result[0] : null;
							});
							actionTypes.some(function(a){
								return action = ~mail.actions.indexOf(a) ? a : null;
							});
						}
						if(action){
							switch(action){
								case "voteu":
									console.log("vote up");
									break;
								case "voted":
									console.log("vote down");
									break;
								case "voten":
									console.log("vote neutral");
									break;
								case "post":
									console.log("post");
									break;
								case "unsubscribe":
									console.log("unsubscribe");
									break;
							}
						}else{
							if(!topicId && mail.text){
								console.log("assume post");
							}
						}
						if(topicId && mail.text){
							console.log("add comment");
						}
					}else{
						// No User Identified
					}
					// results.push(stores.emails.remove(mail.emailId));
					results.push(when(mail.emailId));
				});
				return all(results);
			});
		});
	}

	return {
		init: init,
		mail: mail,
		mailTopic: mailTopic,
		calculateTopicRecipients: calculateTopicRecipients,
		calculateCommentRecipients: calculateCommentRecipients,
		fetch: fetch,
		process: process,
		findUser: findUser,
		settings: {
			set: setSettings,
			get: getSettings
		}
	};
});