define([
	"dojo/node!express",
	"dojo/node!stylus",
	"dojo/node!nib",
	"dojo/node!url",
	"dojo/node!colors",
	"dojo/_base/lang",
	"dojo/promise/all",
	"dojo/when",
	"marked/marked",
	"doqueue/Queue",
	"dote/wait",
	"./auth",
	"./config",
	"./email",
	"./messages",
	"./stores",
	"./topic",
	"./util"
], function(express, stylus, nib, url, colors, lang, all, when, marked, Queue, wait, auth, config, email, messages,
		stores, topic, util){

	function compile(str, path){
		return stylus(str).
			set("filename", path).
			use(nib());
	}

	function checkLogin(request, response, next){
		if(!request.session.username){
			request.session.loginRedirect = request.url;
			response.redirect("/login");
		}else{
			next();
		}
	}

	function queryObject(obj, request, response){
		var range = request.header("Range") ? util.parseRange(request.header("Range")) : null,
			query = decodeURIComponent(url.parse(request.url).query || "");
		if(range){
			var q = query.split("&");
			q.push(range.query);
			query = q.join("&");
		}
		return obj.query(query, range || {}).then(function(items){
			var totalCount;
			return when(items.totalCount, function(count){
				totalCount = count || items.length;
				if(range){
					response.header("Content-Range", util.getContentRange(range.start, items.length, totalCount));
				}
				return items;
			});
		});
	}

	function queryStore(store, request, response, forEach){
		var range = request.header("Range") ? util.parseRange(request.header("Range")) : null,
			query = decodeURIComponent(url.parse(request.url).query || ""),
			options = range || {};
		return store.query(query, options).then(function(results){
			var gets = [],
				totalCount = results.totalCount || results.length;
			results.forEach(function(item){
				gets.push(store.get(item.id));
			});
			return all(gets).then(function(items){
				if(forEach){
					items.forEach(forEach);
				}
				response.status(200);
				if(range){
					response.header("Content-Range", util.getContentRange(range.start, items.length, totalCount));
				}
				response.json(items);
			});
		});
	}

	/* Express Application */
	var app = express(),
		appPort = process.env.PORT || config.port || 8022,
		appConfig = {
			title: config.title,
			subtitle: config.subtitle
		},
		env = process.env.NODE_ENV || "development";

	/* Storage */
	stores.open();

	/* Init Authorization */
	auth.init();

	/* Init Messages */
	messages.init("Drag00n$%!");

	/* Setup Queue */
	var queue = new Queue({
		storeOptions: {
			url: process.env.MONGOLAB_URI || config.db.url,
			collection: "queue"
		}
	});

	/* Setup Topic Handlers */
	queue.ready().then(function(){
		topic.on("add", function(e){
			queue.create("topic", {
				topic: e.item,
				isNew: true
			});
			// messages.calculateTopicRecipients(e.item, true).then(function(results){
			// 	results.forEach(function(address){
			// 		messages.mailTopic(address, e.item).then(function(){
			// 			console.log("Mailed topic ".grey + e.item.id.cyan + " to ".grey + address.yellow);
			// 		});
			// 	});
			// });
		});
	});

	/* Markdown Parser */
	marked.setOptions({
		gfm: true,
		pendantic: false,
		sanitize: false
	});

	/* Configure the server */
	app.configure(function(){
		app.locals.pretty = true;
		app.set("view engine", "jade");
		app.set("views", "views");
		app.use(express.logger(env && env == "production" ? null : "dev"));
		app.use(express.compress());
		app.use(express.cookieParser());
		app.use(express.cookieSession({ secret: config.secret || "notset" }));
		app.use(express.bodyParser());
		app.use(express.favicon("dote_16.ico"));
		app.use(app.router);

		app.use(stylus.middleware({
			src: ".",
			compile: compile,
			compress: true
		}));

		app.use("/_static", express["static"]("./_static"));
		app.use("/src", express["static"]("src"));
		app.use("/lib", express["static"]("lib"));

		app.use("/500", function(request, response, next){
			next(new Error("All your base are belong to us!"));
		});

		app.use(function(request, response, next){
			response.status(404);
			if(request.accepts("html")){
				response.render("404", { url: request.url });
				return;
			}else if(request.accepts("json")){
				response.send({ error: "Not Found", url: request.url });
				return;
			}
			response.type("text").send("Not Found");
		});

		app.use(function(error, request, response, next){
			response.status(error.status || 500);
			if(request.accepts("html")){
				response.render("500", {
					error: error,
					bugs: config.bugs || "",
					app: appConfig
				});
			}else if(request.accepts("json")){
				response.json({
					name: error.name,
					message: error.message,
					stack: error.stack.split("\n")
				});
			}else{
				response.type("text").send(error);
			}
		});
	});

	/* Login Page */
	app.get("/login", function(request, response, next){
		response.render("login", {
			base: config.base,
			app: appConfig
		});
	});

	/* Logout Page */
	app.get("/logout", function(request, response, next){
		request.session.username = null;
		response.render("logout", {
			app: appConfig
		});
	});

	/* Checked we are logged in */
	app.all("/views/*", checkLogin);
	app.all("/", checkLogin);
	app.all("/initStores", checkLogin);
	app.all("/add", checkLogin);
	app.all("/topic/*", checkLogin);
	app.all("/topics/*", checkLogin);
	app.all("/comments/*", checkLogin);
	app.all("/users", checkLogin);
	app.all("/users/:id", checkLogin);
	app.all("/owners", checkLogin);
	app.all("/settings", checkLogin);

	/* Index Page */
	app.get("/", function(request, response, next){
		response.render("index", {
			username: request.session.username,
			base: config.base,
			app: appConfig
		});
	});

	/* Add a Topic */
	app.get("/add", function(request, response, next){
		response.render("add", {
			username: request.session.username,
			base: config.base,
			app: appConfig
		});
	});

	/* Display a Topic */
	app.get("/topic/:id", function(request, response, next){
		response.render("topic", {
			topicId: request.params.id,
			username: request.session.username,
			base: config.base,
			app: appConfig
		});
	});

	/* User Settings */
	app.get("/settings", function(request, response, next){
		response.render("settings", {
			username: request.session.username,
			base: config.base,
			app: appConfig
		});
	});

	/* New User Welcome */
	app.get("/welcome", function(request, response, next){
		response.render("welcome", {
			username: request.session.username,
			base: config.base,
			app: appConfig
		});
	});

	/* Initialise the Stores */
	app.get("/initStores", function(request, response, next){
		topic.clear();
		stores.init().then(function(results){
			response.json(results);
		});
	});

	/* Provide the Public Key for Logging In */
	app.get("/pubKey", function(request, response, next){
		response.json(auth.pubKey());
	});

	/* Hidden URL for Directing Seeing Views */
	app.get("/views/:view", function(request, response, next){
		response.render(request.params.view, {
			topicId: "3af990e5-036a-4e01-80a4-0a46d158038c",
			username: request.session.username,
			base: "src",
			app: appConfig
		});
	});

	/*
	 * Other Services
	 */

	app.get("/userSettings", function(request, response, next){
		messages.settings.get(request.session.username).then(function(settings){
			response.status(200);
			response.json(settings);
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.post("/userSettings", function(request, response, next){
		var settings = JSON.parse(request.body.settings);
		messages.settings.set(request.session.username, settings).then(function(results){
			response.status(200);
			response.json(results);
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	/*
	 * Manual mail check
	 */

	app.get("/checkMail", function(request, response, next){
		checkMail.then(function(emails){
			response.json(emails);
		}).otherwise(function(err){
			response.status(500);
			next(err);
		});
	});

	/*
	 * Manual mail process
	 */

	app.get("/processMail", function(request, response, next){
		messages.process().then(function(results){
			response.json(results);
		}).otherwise(function(err){
			response.status(500);
			next(err);
		});
	});

	/*
	 * Restful Services
	 */

	/* Authorise User */
	app.all("/users/:id/auth", function(request, response, next){
		var username = request.params.id,
			password = request.body && request.body.password ? request.body.password : "";
		if(auth.authorize(username, password)){
			response.status(200);
			stores.users.get(username).then(function(user){
				request.session.username = username;
				if(user) request.session.user = user;
				var href = user ? (request.session.loginRedirect ? request.session.loginRedirect : "/") : "/welcome";
				request.session.loginRedirect = null;
				response.json({
					authorized: true,
					href: href
				});
			});
		}else{
			response.status(401);
			request.session.username = null;
			response.json({ authorized: false });
		}
	});

	app.all("/users", function(request, response, next){
		queryStore(stores.users, request, response);
	});

	app.all("/users/:id", function(request, response, next){
		stores.users.get(request.params.id).then(function(user){
			if(user){
				response.status(200);
				response.json(user);
			}else{
				response.status(404);
				next();
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	/*
	 * Topics
	 */

	app.get("/topics", function(request, response, next){
		queryObject(topic, request, response).then(function(topics){
			response.status(200);
			response.json(topics);
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.post("/topics", function(request, response, next){
		var data = request.body,
			summary = "";

		marked.lexer(data.description).forEach(function(token){
			if(token && token.text){
				summary = summary.concat(token.text.replace(/\n/g, " ") + " ");
			}
		});
		data.summary = summary.substring(0, 120);
		data.author = request.session.username;

		topic().add(data).then(function(results){
			if(results){
				if(results.id){
					response.header("Location", "/topics/" + results.id);
				}
				response.status(200);
				response.json(results);
			}else{
				response.status(500);
				next(new Error("Unable to add topic"));
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.get("/topics/:id", function(request, response, next){
		topic(request.params.id).get().then(function(data){
			if(data){
				response.status(200);
				response.json(data);
			}else{
				response.status(404);
				next();
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.put("/topics/:id", function(request, response, next){
		var data = request.body;
		data.id = request.params.id || data.id;
		topic(data.id).put(data).then(function(data){
			if(data){
				response.status(200);
				response.json(data);
			}else{
				response.status(404);
				next();
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	/*
	 * Comments
	 */

	app.get("/topics/:topicId/comments", function(request, response, next){
		queryObject(topic(request.params.topicId).comment, request, response).then(function(comments){
			response.status(200);
			response.json(comments);
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.post("/topics/:topicId/comments", function(request, response, next){
		var data = request.body;
		topic(request.params.topicId).comment().add(data).then(function(item){
			if(item){
				if(item.id){
					response.header("Location", "/topics/" + request.params.topicId + "/comments/" + item.id);
				}
				response.status(200);
				response.json(item);
			}else{
				response.status(500);
				next(new Error("Unable to add comment"));
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.get("/topics/:topicId/comments/:id", function(request, response, next){
		topic(request.params.topicId).comment(request.params.id).get().then(function(item){
			if(item){
				response.status(200);
				response.json(item);
			}else{
				response.status(404);
				next();
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.put("/topics/:topicId/comments/:id", function(request, resopnse, next){
		var data = request.body;
		data.id = request.body.id || data.id;
		data.topicId = request.body.topicId || data.topicId;
		topic(request.params.topicId).comment(request.params.id).put(data).then(function(item){
			if(item){
				response.status(200);
				response.json(item);
			}else{
				response.status(500);
				next(new Error("Unable to update comment"));
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	/*
	 * EMails
	 */

	app.get("/emails", function(request, response, next){
		queryObject(email, request, response).then(function(emails){
			response.status(200);
			response.json(emails);
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.get("/emails/:id", function(request, response, next){
		email(request.params.id).get().then(function(item){
			if(item){
				response.status(200);
				response.json(item);
			}else{
				response.status(404);
				next();
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	/*
	 * Owners
	 */

	app.get("/owners", function(request, response, next){

		function flattenCounts(arr){
			var counts = {};
			arr.forEach(function(count){
				if(count._id){
					counts[count._id] = count.count;
				}else{
					counts["__undefined"] = count.count;
				}
			});
			return counts;
		}

		var results = stores.users.query("owner=true&sort(+id)"),
			topicCounts = stores.topics.aggregate({ $group : { _id : "$owner", count : { $sum : 1 } } });
		all({ query: results, aggregate: topicCounts }).then(function(results){
			var items = results.query,
				counts = flattenCounts(results.aggregate),
				owners = [{
					label: "[Unassigned]" + (counts.__undefined ? " (" + counts.__undefined + ")" : ""),
					value: "__undefined"
				}];
			items.forEach(function(owner){
				owners.push({
					label: owner.id + (counts[owner.id] ? " (" + counts[owner.id] + ")" : ""),
					value: owner.id
				});
			});
			response.status(200);
			response.json(owners);
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	/*
	 * Authors
	 */

	app.get("/authors", function(request, response, next){
		stores.topics.aggregate({ $group : { _id: "$author", count : { $sum: 1 } } }).then(function(results){
			var authors = [];
			results.forEach(function(count){
				authors.push({
					label: count._id + " (" + count.count + ")",
					value: count._id
				});
			});
			response.status(200);
			response.json(authors);
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	return {
		start: function(){
			app.listen(appPort);
			console.log("Application Title: ".grey + config.title.cyan);
			console.log("Environment: ".grey + env.cyan);
			console.log("HTTP server started on port: ".grey + appPort.cyan);
			return app;
		}
	};
});