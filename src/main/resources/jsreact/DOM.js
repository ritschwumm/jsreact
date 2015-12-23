var jsreact	= jsreact || {};

jsreact.DOM = {
	// DOMNode,String,Boolean,Boolean => { stream:Stream[_], dispose:()=>Unit }
	eventStream: function(target, eventName, preventDefault, capture) {
		return this.connect(function(handler) {
			var listener	= function(ev) {
				if (preventDefault)	ev.preventDefault();
				handler(ev);
			};
			var captureBoolean	= !!capture;
			target.addEventListener(eventName, listener, captureBoolean);
			return function() {
				target.removeEventListener(eventName, listener, captureBoolean);
			};
		});
	},
	
	// Number => { stream:Stream[_], dispose:()=>Unit }
	intervalStream: function(cycleMillis) {
		this.connect(function(handler) {
			var id	= window.setInterval(handler, cycleMillis);
			return window.clearInterval.bind(window, id);
		});
	},
	
	// ((T => Unit) => (() => Unit)) => { stream:Stream[T], dispose:()=>Unit }
	// roughly (Handler[T] => Disposer) => (Stream[T], Disposer)
	connect: function(subscribeFunc) {
		var emitter		= new jsreact.Emitter();
		var dispose		= subscribeFunc(emitter.emit.bind(emitter));
		return {
			stream:		emitter.stream,
			dispose:	dispose//,
		};
	}//,
};
