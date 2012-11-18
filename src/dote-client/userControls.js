define([
	"dojo/_base/window",
	"dojo/dom",
	"dojo/on"
], function(win, dom, on){

	function newTopic(e){
		e.preventDefault();
		win.global.location.href = "/add";
	}

	function help(e){
		e.preventDefault();
		console.log("help");
	}

	function logout(e){
		e.preventDefault();
		win.global.location.href = "/logout";
	}

	function start(){
		on(dom.byId("newTopic"), "click", newTopic);
		on(dom.byId("help"), "click", help);
		on(dom.byId("logout"), "click", logout);
	}

	return {
		start: start
	};
});