var jsreact	= jsreact || {};

jsreact.DOM = function DOM(connectExternalFunc) {
	this.connectExternalFunc	= connectExternalFunc;
};
jsreact.DOM.prototype	= {
	// DOMNode,String,Boolean,Boolean => { stream:Stream[_], dispose:()=>Unit }
	eventStream: function(target, eventName, preventDefault, capture) {
		return this.connectExternalFunc(function(handler) {
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
		this.connectExternalFunc(function(handler) {
			var id	= window.setInterval(handler, cycleMillis);
			return window.clearInterval.bind(window, id);
		});
	}//,
};
