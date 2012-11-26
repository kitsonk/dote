define([
	"./config",
	"./Mail",
	"./stores",
	"dojo/_base/lang", // lang.mixin
	"dojo/string", //string.substitute
	"marked/marked"
], function(config, Mail, stores, lang, string, marked){
	
	function getReplyToTemplate(name, address){
		address = address.split("@");
		return name + " <" + address[0] + "+${id}@" + address[1] + ">";
	}

	function getActionAddress(address, action){
		address = address.split("@");
		return "<mailto:" + address[0] + "+" + action + "@" + address[1] + ">";
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
			optout: false
		},
		replyToTemplate = getReplyToTemplate(config.mail.username, config.mail.address),
		unsubscribeAddress = getActionAddress(config.mail.address, "unsubscribe");
		postAddress = getActionAddress(config.mail.address, "post");

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

	function mailTopic(username, topic){
		return stores.users.get(username).then(function(user){
			if(user && user.settings && user.settings.email && !user.settings.optout){
				var message = {
					from: config.mail.username + " <" + config.mail.address + ">",
					to: username + " <" + user.settings.email + ">",
					subject: "[" + config.mail.list.name + "] " + topic.title,
					"Reply-To": string.substitute(replyToTemplate, topic),
					"List-ID": config.mail.list.name + " <" + config.mail.list.id + ">",
					"List-Unsubscribe": unsubscribeAddress,
					"List-Post": postAddress,
					"List-Archive": config.address,
					"Message-ID": topic.id + "@" + config.mail.list.id,
					text: topic.description,
					attachment:{
						data: marked(topic.description),
						alternative: true
					}
				};
				return mail.send(message);
			}
		});
	}

	return {
		init: init,
		mail: mail,
		mailTopic: mailTopic,
		settings: {
			set: setSettings,
			get: getSettings
		}
	};
});