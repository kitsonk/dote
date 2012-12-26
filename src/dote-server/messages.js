define([
	"dojo/node!juice",
	"./config",
	"./email",
	"./Mail",
	"./stores",
	"./topic",
	"./queue",
	"dojo/_base/lang", // lang.mixin
	"dojo/Deferred",
	"dojo/promise/all", // all
	"dojo/when", // when
	"dote/array",
	"dote/marked",
	"dote/string", // string.substitute, string.capitaliseFirst
	"./stylus!./resources/messages.styl",
	"dojo/text!hljs/default.css"
], function(juice, config, email, Mail, stores, topic, queue, lang, Deferred, all, when, array, marked, string,
		cssMessages, cssHljs){
	
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
		textFooterBase = "\n\n-----\nWebsite: ${website}\nNew Topic: ${post}\nSettings: ${website}settings\n" +
			"View: ${view}",
		textFooter = string.substitute(textFooterBase, {
				post: postAddress,
				website: config.address,
				view: config.address + "topic/${id}"
			}),
		textFooterComment = string.substitute(textFooterBase, {
				post: postAddress,
				website: config.address,
				view: config.address + "topic/${topicId}#${id}"
			}),
		htmlFooterBase = '<a href="${website}">Website</a> | <a href="mailto:${post}">New Topic</a> | ' +
			'<a href="${website}settings">Settings</a> | ';
		htmlFooter = '<div class="dote_f">' + string.substitute(htmlFooterBase +
			'<a href="${view}">View Topic</a></div>', {
				post: getActionAddress(config.mail.address, "post", true),
				website: config.address,
				view: config.address + "topic/${id}"
			}),
		htmlFooterComment = '<div class="dote_f">' + string.substitute(htmlFooterBase +
			'<a href="${view}">View Comment</a></div>', {
				post: getActionAddress(config.mail.address, "post", true),
				website: config.address,
				view: config.addess + "topic/${topicId}#${id}"
			}),
		htmlFooterVote = string.substitute(htmlFooterBase +
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

	function calculateTopicRecipients(t, isNew){
		var queries = {};
		queries.users = stores.users.query();
		queries.comments = topic(t.id).comment.all();
		return all(queries).then(function(results){
			var addresses = [],
				participants = [],
				removeAuthor;
			results.comments.forEach(function(comment){
				participants.push(comment.author);
			});
			t.voters.forEach(function(voter){
				participants.push(voter.name);
			});
			participants.push(t.author);
			if(t.owner) participants.push(t.owner);
			participants = array.unique(participants);
			results.users.forEach(function(user){
				if(user.settings && user.settings.email && !user.settings.optout){
					var address = user.id + "<" + user.settings.email + ">";
					if(user.settings.excreated && user.id == t.author){
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
					if(user.settings.onown && t.owner == user.id){
						addresses.push(address);
						return;
					}
					if(array.intersection(user.settings.ontags.sort(), t.tags.sort()).length){
						addresses.push(address);
					}
				}
			});
			return removeAuthor ? array.filter(array.unique(addresses), function(address){
					return address !== removeAuthor;
				}) : array.unique(addresses);
		});
	}

	// function calculateTopicRecipients(t, isNew){
	// 	var queries = {};
	// 	queries.users = stores.users.query();
	// 	queries.comments = topic(t.id).comment.all();
	// 	return all(queries).then(function(results){
	// 		var addresses = [],
	// 			participants = [],
	// 			removeAuthor;
	// 		results.comments.forEach(function(comment){
	// 			participants.push(comment.author);
	// 		});
	// 		t.voters.forEach(function(voter){
	// 			participants.push(voter.name);
	// 		});
	// 		participants.push(t.author);
	// 		if(t.owner) participants.push(t.owner);
	// 		participants = array.unique(participants);
	// 		results.users.forEach(function(user){
	// 			if(user.settings && user.settings.email && !user.settings.optout){
	// 				var address = user.id + "<" + user.settings.email + ">";
	// 				if(user.settings.excreated && user.id == t.author){
	// 					removeAuthor = address;
	// 				}
	// 				if(user.settings.onnew && isNew){
	// 					addresses.push(address);
	// 					return;
	// 				}
	// 				// Need to add watching
	// 				if(user.settings.onparticipate && participants.indexOf(user.id) > -1){
	// 					addresses.push(address);
	// 					return;
	// 				}
	// 				if(user.settings.onown && t.owner == user.id){
	// 					addresses.push(address);
	// 					return;
	// 				}
	// 				if(array.intersection(user.settings.ontags.sort(), t.tags.sort()).length){
	// 					addresses.push(address);
	// 				}
	// 			}
	// 		});
	// 		return removeAuthor ? array.filter(array.unique(addresses), function(address){
	// 				return address !== removeAuthor;
	// 			}) : array.unique(addresses);
	// 	});
	// }

	function calculateCommentRecipients(comment){
		var queries = {};
		queries.users = stores.users.query();
		queries.comments = topic(comment.topicId).comment.all();
		queries.topic = topic(comment.topicId).get();
		// I can likely do this with an aggregate
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
			voteString, voteCount = 0,
			textHeader = "Topic: ${title}\nAuthor: ${author}\n";
		if(topic.owner) textHeader += "Owner: ${owner}\n";
		textHeader += "Status: ${action}\n";
		if(topic.tags && topic.tags.length) textHeader += "Tags: " + topic.tags.join(", ") + "\n";
		if(topic.voters && topic.voters.length){
			voteString = "";
			topic.voters.forEach(function(vote){
				voteCount += vote.vote;
				voteString += vote.name + "[" + (vote.vote == 1 ? "+1" : vote.vote == -1 ? "-1" : "0") + "] ";
			});
			textHeader += "Voting: " + voteCount + "\n";
			textHeader += "Votes: " + voteString + "\n";
		}
		textHeader += "\n";
		textHeader = string.substitute(textHeader, {
			author: topic.author,
			title: topic.title,
			owner: topic.owner || "",
			action: string.capitaliseFirst(topic.action || "")
		});
		var htmlHeader = '<div class="dote_h"><span class="dote_l">Topic:</span> <span class="dote_p">${title}</span>' +
			'<br><span class="dote_l">Author:</span> <span class="dote_p">${author}</span>';
		if(topic.owner) htmlHeader += '<br><span class="dote_l">Owner:</span> <span class="dote_p">' +
			'${owner}</span>';
		htmlHeader += '<br><span class="dote_l">Status:</span> <span class="dote_p">${action}</span>';
		if(topic.tags && topic.tags.length){
			htmlHeader += '<br><span class="dote_l">Tags:</span> ';
			topic.tags.forEach(function(tag){
				htmlHeader += '<span class="dote_t">' + tag + '</span> ';
			});
		}
		if(topic.voters && topic.voters.length){
			voteString = "";
			topic.voters.forEach(function(vote){
				voteString += string.substitute('<span class="dote_${type}">${tag} [${vote}]</span> ', {
					type: vote.vote == 1 ? "u" : vote.vote == -1 ? "d" : "n",
					tag: vote.name,
					vote: vote.vote == 1 ? "+1" : vote.vote == -1 ? "-1" : "0"
				});
			});
			htmlHeader += '<br><span class="dote_l">Voting:</span> ' + voteCount;
			htmlHeader += '<br><span class="dote_l">Votes:</span> ' + voteString;
		}
		htmlHeader += string.substitute('<br><br><a href="${mu}" class="dote_vu">Vote +1</a> ' +
			'<a href="${mn}" class="dote_vn">Vote 0</a> <a href="${md}" class="dote_vd">Vote -1</a>', {
				mu: mailTo(config.mail.address, {
					id: topic.id,
					action: "voteu",
					subject: "Re: [" + config.mail.list.name + "] " + topic.title,
					body: "Voting: +1\n\n[Additional Comment:]\n\n"
				}),
				mn: mailTo(config.mail.address, {
					id: topic.id,
					action: "voten",
					subject: "Re: [" + config.mail.list.name + "] " + topic.title,
					body: "Voting: 0\n\n[Additional Comment:]\n\n"
				}),
				md: mailTo(config.mail.address, {
					id: topic.id,
					action: "voted",
					subject: "Re: [" + config.mail.list.name + "] " + topic.title,
					body: "Voting: -1\n\n[Additional Comment:]\n\n"
				})
			});
		htmlHeader += '</div>';
		htmlHeader = string.substitute(htmlHeader, {
			author: topic.author,
			title: topic.title,
			owner: topic.owner || "",
			action: string.capitaliseFirst(topic.action || "")
		});
		if(options.includeComments){
			comments = stores.comments.query("select(id,topicId,author,created,text)&sort(+created)&topicId=" + topic.id).
				then(function(items){
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

	function mailVote(address, vote, topic, comment){
		var text = "${vote.name} is voting ${voteString}\nOverall: ${count}\nTopic: ${topic.title}\n",
			html = '<div class="dote_h"><table><tbody><tr><td class="${voteClass}">${voteString}</td>' +
				'<td class="${voteTotalClass}">${count}</td></tr><tr><td>${vote.name}</td><td>Total</td></tr>' +
				'</tbody></table><br><span class="dote_l">Topic:</span> <span class="dote_p">${topic.title}</span>';
		if(topic.owner){
			text += "Owner: ${topic.owner}\n";
			html += '<br><span class="dote_l">Owner:</span> <span class="dote_p">${topic.owner}</span>';
		}
		text += "Status: ${action}\n";
		html += '<br><span class="dote_l">Status:</span> <span class="dote_p">${action}</span>';
		if(topic.tags && topic.tags.length){
			text += "Tags: " + topic.tags.join(", ") + "\n";
			html += '<br><span class="dote_l">Tags:</span> <span class="dote_t">' +
				topic.tags.join('</span> <span class="dote_t">') + "</span>";
		}
		var count = 0;
		if(topic.voters && topic.voters.length){
			text += "Voters: ";
			html += '<br><span class="dote_l">Voters:</span> ';
			topic.voters.forEach(function(v){
				count += v.vote;
				text += v.name + "[" + (v.vote == 1 ? "+1" : v.vote == -1 ? "-1" : "0") + "] ";
				html += string.substitute('<span class="dote_${type}">${tag} [${vote}]</span> ', {
					type: v.vote == 1 ? "u" : v.vote == -1 ? "d" : "n",
					tag: v.name,
					vote: v.vote == 1 ? "+1" : v.vote == -1 ? "-1" : "0"
				});
			});
			text += "\n";
		}
		html += string.substitute('<br><br><a href="${mu}" class="dote_vu">Vote +1</a> ' +
			'<a href="${mn}" class="dote_vn">Vote 0</a> <a href="${md}" class="dote_vd">Vote -1</a>', {
				mu: mailTo(config.mail.address, {
					id: topic.id,
					action: "voteu",
					subject: "Re: [" + config.mail.list.name + "] " + topic.title,
					body: "Voting: +1\n\n[Additional Comment:]\n\n"
				}),
				mn: mailTo(config.mail.address, {
					id: topic.id,
					action: "voten",
					subject: "Re: [" + config.mail.list.name + "] " + topic.title,
					body: "Voting: 0\n\n[Additional Comment:]\n\n"
				}),
				md: mailTo(config.mail.address, {
					id: topic.id,
					action: "voted",
					subject: "Re: [" + config.mail.list.name + "] " + topic.title,
					body: "Voting: -1\n\n[Additional Comment:]\n\n"
				})
			});
		if(comment && comment.text){
			text += "\n----\n" + comment.text + "\n" + string.substitute(textFooter, topic);
			html += "</div>" + marked(comment.text) + '<div class="dote_f">';
		}else{
			html += "<br><br>";
		}
		html += string.substitute(htmlFooterVote, topic);
		var voteString = vote.vote > 0 ? "+" + vote.vote : vote.vote;
		var subs = {
			vote: vote,
			voteString: voteString,
			voteClass: vote.vote > 0 ? "plus" : vote.vote < 0 ? "minus" : "neutral",
			voteTotalClass: count > 0 ? "plus" : count < 0 ? "minus" : "neutral",
			topic: topic,
			action: string.capitaliseFirst(topic.action || ""),
			count: count > 0 ? "+" + count : count
		};
		text = string.substitute(text, subs);
		html = string.substitute(html, subs);
		var message = {
			from: config.mail.username + " <" + config.mail.address + ">",
			to: address,
			subject: "[" + config.mail.list.name + "] " + topic.title,
			"Reply-To": string.substitute(replyToTemplate, topic),
			"List-ID": config.mail.list.name + " <" + config.mail.list.id + ">",
			"List-Unsubscribe": unsubscribeAddress,
			"List-Post": postAddress,
			"List-Archive": config.address,
			"Message-ID": topic.id + "+" + vote.name + "@" + config.mail.list.id,
			"In-Reply-To": topic.id + "@" + config.mail.list.id,
			text: text,
			attachment: {
				data: juice(html, cssMessages + cssHljs),
				alternative: true
			}
		};
		return config.mail.enabled ? mail.send(message) : when(false);
	}

	function mailComment(address, comment, topic){

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

	function process(email){
		return processEmail(email).then(function(mail){
			var result = when(mail.emailId);
			if(mail.user && mail.user.id){
				var topicId,
					action,
					voter;
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
							voter = {
								vote: 1,
								name: mail.user.id
							};
							break;
						case "voted":
							voter = {
								vote: -1,
								name: mail.user.id
							};
							break;
						case "voten":
							voter = {
								vote: 0,
								name: mail.user.id
							};
							break;
						case "post":
							var summary = "";
							marked.lexer(mail.text).forEach(function(token){
								if(token && token.text){
									summary = summary.concat(token.text.replace(/\n/g, " ") + " ");
								}
							});
							var data = {
								title: mail.title,
								description: mail.text,
								summary: summary.substring(0, 120),
								author: mail.user.id
							};
							result = topic().add(data).then(function(topic){
								return {
									action: "post",
									emailId: mail.emailId,
									topicId: topic.id
								};
							});
							break;
						case "unsubscribe":
							console.log("unsubscribe");
							break;
					}
				}else{
					if(!topicId && mail.text){
						console.log(mail);
						console.log("assume post");
					}
				}
				if(topicId && (voter || mail.text)){
					var t = topic(topicId);
					if(voter){
						var comment;
						if(mail.text){
							comment = {
								author: mail.user.id,
								text: mail.text
							};
						}
						result = t.vote(voter, comment).then(function(results){
							return {
								action: "vote",
								emailId: mail.emailId,
								topicId: topicId
							};
						});
					}else{
						// just comment

					}
				}
			}else{
				// No user Identified
			}
			return result;
		});
	}

	return {
		init: init,
		mail: mail,
		mailTopic: mailTopic,
		mailVote: mailVote,
		mailComment: mailComment,
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