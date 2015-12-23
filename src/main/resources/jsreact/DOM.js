var jsreact	= jsreact || {};

jsreact.DOM = {
	listen: function(target, eventName, preventDefault) {
		var emitter		= new jsreact.Emitter();
		var listener	= function(ev) {
			if (preventDefault)	ev.preventDefault();
			emitter.emit(ev);
		};
		var capture		= false;
		target.addEventListener(eventName, listener, capture);
		var dispose		= function() {
			target.removeEventListener(eventName, listener, capture);
		};
		return {
			stream:		emitter.stream,
			dispose:	dispose//,
		};
	}//,
};
