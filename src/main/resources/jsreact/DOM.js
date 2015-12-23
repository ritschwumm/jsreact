var jsreact	= jsreact || {};

jsreact.DOM = {
	// DOMNode,String,Boolean,Boolean => { stream:Stream[_], dispose:()=>Unit }
	eventStream: function(target, eventName, preventDefault, capture) {
		var emitter		= new jsreact.Emitter();
		var listener	= function(ev) {
			if (preventDefault)	ev.preventDefault();
			emitter.emit(ev);
		};
		var captureBoolean	= !!capture;
		target.addEventListener(eventName, listener, captureBoolean);
		var dispose		= function() {
			target.removeEventListener(eventName, listener, captureBoolean);
		};
		return {
			stream:		emitter.stream,
			dispose:	dispose//,
		};
	},
	
	// Number => { stream:Stream[_], dispose:()=>Unit }
	intervalStream: function(cycleMillis) {
		var emitter	= new jsreact.Emitter();
		var id		= window.setInterval(emitter.emit.bind(emitter), cycleMillis);
		var dispose	= window.clearInterval.bind(window, id);
		return {
			stream:		emitter.stream,
			dispose:	dispose//,
		};
	}//,
};
