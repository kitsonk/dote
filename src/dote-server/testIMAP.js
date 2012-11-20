require([
	"dote-server/Mail"
], function(Mail){

	var mail = new Mail({
		user: "dote@kitsonkelly.com",
		password: "Drag00n$%!",
		imapHost: "imap.gmail.com",
		imapPort: 993,
		smtpHost: "smtp.gmail.com",
		secure: true
	});

	// mail.on("message", function(e){
	// 	var mail = e.mail;
	// 	console.log("From: " + mail.from);
	// 	console.log("To: " + mail.to);
	// 	console.log("Subject: " + mail.subject);
	// 	console.log("Text Length: " + mail.text.length);
	// 	console.log("HTML Length: " + mail.html.length);
	// 	console.log("Alternatives: ", mail.alternatives);
	// 	console.log("Attachments: ", mail.attachments);	
	// });

	// mail.connect().then(function(){
	// 	return mail.openBox("INBOX");
	// }).then(function(box){
	// 	return mail.search([ "UNSEEN", ["SINCE", "May 20, 2010"] ]);
	// }).then(function(results){
	// 	var fetch = mail.fetch(results, {
	// 		request: {
	// 			body: "full",
	// 			headers: false
	// 		}
	// 	});
	// 	fetch.on("end", function(){
	// 		return mail.logout();
	// 	});
	// }).otherwise(function(err){
	// 	console.error(err);
	// });

	mail.send({
		text: "I hope this works!\n\nRegards,\nKit",
		from: "dote <dote@kitsonkelly.com>",
		to: "Kitson Kelly <me@kitsonkelly.com>",
		subject: "[dote] testing emailjs",
		"Reply-To": "dote <dote+e905f041-f417-4389-8b03-b54772f310bb@kitsonkelly.com>",
		"List-ID": "dote <dote.kitsonkelly.com>",
		"List-Unsubscribe": "<mailto:dote+usubscribe@kitsonkelly.com>",
		"List-Post": "<mailto:dote+post@kitsonkelly.com>",
		"List-Archive": "http://livi.kitsonkelly.com:8011/",
		"Message-ID": "<e905f041-f417-4389-8b03-b54772f310bb@dote.kitsonkelly.com>",
		attachment:{
			data: "<p>I hope <i>this</i> works!</p><p>Regards,<br>Kit</p>",
			alternative: true
		}
	}).then(function(message){
		console.log(message);
	}, function(err){
		console.err(err);
	});

});