define([
	"dojo/node!express",
	"dojo/node!stylus",
	"dojo/node!nib",
	"dojo/node!url",
	"dojo/promise/all",
	"marked/marked",
	"dote/timer",
	"./auth",
	"./config",
	"./messages",
	"./stores",
	"./util"
], function(express, stylus, nib, url, all, marked, timer, auth, config, messages, stores, util){

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

	function queryStore(store, request, response, forEach){
		var range = request.header("Range") ? util.parseRange(request.header("Range")) : null,
			query = decodeURIComponent(url.parse(request.url).query || ""),
			options = range || {};
		options.allowBulkFetch = true;
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
					response.header("Content-Range", util.getContentRange(range. start, results.length,
						results.totalCount ? results.totalCount : results.length));
				}
				response.json(items);
			});
		});
	}

	/* Express Application */
	var app = express(),
		appPort = process.env.PORT || config.port || 8022;

	/* Storage */
	stores.open();

	/* Init Authorization */
	auth.init();

	/* Init Messages */
	messages.init("Drag00n$%!");

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
		app.use(express.logger("dev"));
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
					bugs: config.bugs || ""
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
			base: config.base
		});
	});

	/* Logout Page */
	app.get("/logout", function(request, response, next){
		request.session.username = null;
		response.render("logout", {});
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
			base: config.base
		});
	});

	/* Add a Topic */
	app.get("/add", function(request, response, next){
		response.render("add", {
			username: request.session.username,
			base: config.base
		});
	});

	/* Display a Topic */
	app.get("/topic/:id", function(request, response, next){
		response.render("topic", {
			topicId: request.params.id,
			username: request.session.username,
			base: config.base
		});
	});

	/* User Settings */
	app.get("/settings", function(request, response, next){
		response.render("settings", {
			username: request.session.username,
			base: config.base
		});
	});

	/* Initialise the Stores */
	app.get("/initStores", function(request, response, next){
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
			base: "src"
		});
	});

	/*
	 * Other Services
	 */

	app.get("/userSettings", function(request, response, next){
		response.json(messages.settings.get(request.session.username));
	});

	app.post("/userSettings", function(request, response, next){
		var settings = JSON.parse(request.body.settings);
		response.json(messages.settings.set(request.session.username, settings));
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
			request.session.username = username;
			var href = request.session.loginRedirect ? request.session.loginRedirect : "/";
			request.session.loginRedirect = null;
			response.json({
				authorized: true,
				href: href
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
		queryStore(stores.topics, request, response);
	});

	app.post("/topics", function(request, response, next){
		var topic = request.body,
			summary = "";

		marked.lexer(topic.description).forEach(function(token){
			if(token && token.text){
				summary = summary.concat(token.text.replace(/\n/g, " ") + " ");
			}
		});
		topic.summary = summary.substring(0, 120);
		topic.author = request.session.username;
		topic.created = Math.round((new Date()).getTime() / 1000);
		topic.voters = [];
		topic.action = "open";
		topic.commentsCount = 0;
		stores.topics.add(topic).then(function(results){
			if(results){
				if(results.id){
					response.header("Location", "/topics/" + results.id);
				}
				response.status(200);
				response.json(results);
				messages.mailTopic(request.session.username, results).then(function(){
					console.log("message sent...");
				}, function(e){
					console.error("message error!", e);
				});
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
		stores.topics.get(request.params.id).then(function(topic){
			if(topic){
				response.status(200);
				response.json(topic);
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
		var topic = request.body;
		topic.id = topic.id || request.params.id;
		var original = stores.topics.get(topic.id);
		if(original && (original.action !== topic.action)){
			topic.actioned = Math.round((new Date()).getTime() / 1000);
		}
		if(topic = stores.topics.put(topic)){
			response.status(200);
			response.json(topic);
		}else{
			response.status(404);
			next();
		}
	});

	/*
	 * Comments
	 */

	app.get("/comments", function(request, response, next){
		queryStore(stores.comments, request, response);
	});

	app.post("/comments", function(request, response, next){
		var comment = request.body;
		stores.comments.add(comment).then(function(results){
			if(results){
				if(results.id){
					response.header("Location", "/comments/" + results.id);
				}
				if(results.topicId){
					var topic = stores.topics.get(results.topicId);
					if(topic){
						if(topic.commentsCount){
							topic.commentsCount++;
						}else{
							topic.commentsCount = 1;
						}
						stores.topics.put(topic);
					}
				}
				response.status(200);
				response.json(results);
			}else{
				response.status(500);
				next(new Error("Unable to add comment"));
			}
		}, function(err){
			response.status(500);
			next(err);
		});
	});

	app.get("/comments/:id", function(request, response, next){
		stores.comments.get(request.params.id).then(function(comment){
			if(comment){
				response.status(200);
				response.send(topic);
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
		var query = "owner=true",
			results = stores.users.query(query, {}),
			owners = [{
				label: "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
				value: "__undefined"
			}];
		results.then(function(items){
			items.forEach(function(owner){
				owners.push({
					label: owner.id,
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

	return {
		start: function(){
			app.listen(appPort);
			console.log("HTTP server started on port: " + appPort);
			return app;
		}
	};
});