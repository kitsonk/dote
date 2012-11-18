define([
	"dojo/node!express",
	"dojo/node!stylus",
	"dojo/node!nib",
	"dojo/node!url",
	"./auth",
	"./config",
	"./initStores",
	"./Storage",
	"./util",
	"dojo/_base/lang",
	"dote/util",
	"dojo/text!keys/pubKey.json",
	"dojo/text!keys/privKey.json"
], function(express, stylus, nib, url, auth, config, initStores, Storage, util, lang, doteUtil){

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

	function queryStore(store, request, response){
		var range = request.header("Range") ? util.parseRange(request.header("Range")) : null,
			query = decodeURIComponent(url.parse(request.url).query || "");
		var results = store.query(query, range || {});
		response.status(200);
		if(range){
			response.header("Content-Range", util.getContentRange(range.start, results.length,
				results.totalCount ? results.totalCount : results.length));
		}
		response.json(results);
	}

	/* Express Application */
	var app = express(),
		appPort = process.env.PORT || config.port || 8022;

	/* Storage */
	var topics = new Storage("store", "topics.json"),
		comments = new Storage("store", "comments.json"),
		owners = new Storage("store", "owners.json");

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
		response.render("login", {});
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

	/* Index Page */
	app.get("/", function(request, response, next){
		response.render("index", {
			username: request.session.username
		});
	});

	/* Add a Topic */
	app.get("/add", function(request, response, next){
		response.render("add", {
			username: request.session.username
		});
	});

	/* Display a Topic */
	app.get("/topic/:id", function(request, response, next){
		response.render("topic", {
			topicId: request.params.id,
			username: request.session.username
		});
	});

	/* Initialise the Stores */
	app.get("/initStores", function(request, response, next){
		initStores.run().then(function(results){
			response.json(results);
			// You need to restart the application now
		});
	});

	/* Provide the Public Key for Logging In */
	app.get("/pubKey", function(request, response, next){
		response.json(auth.pubKey);
	});

	/* Hidden URL for Directing Seeing Views */
	app.get("/views/:view", function(request, response, next){
		response.render(request.params.view, {
			topicId: "3af990e5-036a-4e01-80a4-0a46d158038c",
			username: request.session.username
		});
	});

	/*
	 * Restful Services
	 */

	/* Authorise User */
	app.all("/users/:username/auth", function(request, response, next){
		var username = request.params.username,
			password = request.body && request.body.password ? request.body.password : "";
		if(auth.authorized(username, password)){
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

	/*
	 * Topics
	 */

	app.get("/topics", function(request, response, next){
		queryStore(topics, request, response);
	});

	app.post("/topics", function(request, response, next){
		var topic = request.body;
		topic.author = request.session.username;
		topic.created = Math.round((new Date()).getTime() / 1000);
		topic.voters = [];
		topic.action = "open";
		topic.commentsCount = 0;
		var results = topics.add(topic);
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
	});

	app.get("/topics/:id", function(request, response, next){
		var topic = topics.get(request.params.id);
		if(topic){
			response.status(200);
			response.json(topic);
		}else{
			response.status(404);
			next();
		}
	});

	app.put("/topics/:id", function(request, response, next){
		var topic = request.body;
		topic.id = topic.id || request.params.id;
		if(topic = topics.put(topic)){
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
		queryStore(comments, request, response);
	});

	app.post("/comments", function(request, response, next){
		var comment = request.body;
		var results = comments.add(comment);
		if(results){
			if(results.id){
				response.header("Location", "/comments/" + results.id);
			}
			if(results.topicId){
				var topic = topics.get(results.topicId);
				if(topic){
					if(topic.commentsCount){
						topic.commentsCount++;
					}else{
						topic.commentsCount = 1;
					}
					topics.put(topic);
				}
			}
			response.status(200);
			response.json(results);
		}else{
			response.status(500);
			next(new Error("Unable to add comment"));
		}
	});

	app.get("/comments/:id", function(request, response, next){
		var comment = comments.get(request.params.id);
		if(comment){
			response.status(200);
			response.send(topic);
		}else{
			response.status(404);
			next();
		}
	});

	/*
	 * Owners
	 */

	app.get("/owners", function(request, response, next){
		queryStore(owners, request, response);
	});

	return {
		start: function(){
			app.listen(appPort);
			console.log("HTTP server started on port: " + appPort);
			return app;
		}
	};
});