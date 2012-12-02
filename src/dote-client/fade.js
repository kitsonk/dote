define([
	"dojo/_base/fx",
	"dojo/dom",
	"dojo/dom-style"
], function(fx, dom, style){
	return {
		show: function(node, duration, widget){
			if(typeof node === "string"){
				node = dom.byId(node);
			}
			style.set(node, "opacity", "0");
			style.set(node, "display", "block");
			fx.fadeIn({
				node: node,
				duration: duration || 500
			}).play();
			if(widget) widget.focus();
		}
	};
});