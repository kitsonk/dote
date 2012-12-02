define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.hitch
	"dojo/Deferred",
	"dojo/Evented",
	"dojo/node!mailparser",
	"dojo/node!imap",
	"dojo/node!emailjs/email"
], function(declare, lang, Deferred, Evented, mailparser, imap, email){

	return declare([Evented], {

		imap: null,
		smtp: null,

		_imapConfig: {},
		_smtpConfig: {},

		_onFetchMessage: function(message){
			var parser = new mailparser.MailParser();
			var self = this;
			parser.on("end", function(mail){
				self.emit("message", { mail: mail });
			});
			message.on("data", function(data){
				parser.write(data.toString());
			});
			message.on("end", function(){
				parser.end();
			});
		},

		constructor: function(config){
			config = config || {};
			var imapConfig = this._imapConfig = {
				username: config.username || config.user,
				password: config.password,
				host: config.imapHost || config.host,
				port: config.imapPort || config.port || 993,
				secure: config.secure || config.ssl
			};
			this._smtpConfig = {
				user: config.user || config.username,
				password: config.password,
				host: config.smtpHost || config.host,
				ssl: config.ssl || config.secure
			};
			this.imap = new imap.ImapConnection(imapConfig);
		},

		connect: function(){
			var dfd = new Deferred();
			this.imap.connect(function(err){
				if(err) dfd.reject(err);
				dfd.resolve(true);
			});
			return dfd.promise;
		},

		openBox: function(box){
			var dfd = new Deferred();
			this.imap.openBox(box, false, function(err, box){
				if(err) dfd.reject(err);
				dfd.resolve(box);
			});
			return dfd.promise;
		},

		search: function(query){
			var dfd = new Deferred();
			this.imap.search(query, function(err, results){
				if(err) dfd.reject(err);
				dfd.resolve(results);
			});
			return dfd.promise;
		},

		fetch: function(results, options){
			var fetch = this.imap.fetch(results, options);
			fetch.on("message", lang.hitch(this, this._onFetchMessage));
			return fetch;
		},

		send: function(mail){
			if(!this.smtp){
				console.log(email);
				console.log(this._smtpConfig);
				this.smtp = email.server.connect(this._smtpConfig);
			}
			var dfd = new Deferred();
			this.smtp.send(mail, function(err, message){
				if(err) dfd.reject(err);
				dfd.resolve(message);
			});
			return dfd.promise;
		},

		logout: function(cb){
			this.imap.logout(cb);
		}
	});

});