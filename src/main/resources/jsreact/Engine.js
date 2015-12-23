var jsreact	= jsreact || {};

jsreact.Engine	= function(onPropagationError) {
	this.onPropagationError	= onPropagationError;
	
	this.subscribers	= [];
	this.currentTick	= {};
	this.propagating	= false;
};
jsreact.Engine.prototype	= {
	//------------------------------------------------------------------------------
	//## source
	
	newCell: function(initial) {
		return new jsreact.Cell(this, initial);
	},
	
	newEmitter: function() {
		return new jsreact.Emitter(this);
	},
	
	connectExternal: function(subscribeFunc) {
		var emitter		= this.newEmitter();
		var dispose		= subscribeFunc(emitter.emit.bind(emitter));
		return {
			stream:		emitter.stream,
			dispose:	dispose//,
		};
	},
	
	//------------------------------------------------------------------------------
	//## drain
	
	newObserving: function(aliveSignal) {
		return new jsreact.Observing(this, aliveSignal);
	},
	
	//------------------------------------------------------------------------------
	//## package
	
	// Reactive[T] => Unit
	updateReactive: function(reactive) {
		reactive.update(this.currentTick);
	},
	
	//------------------------------------------------------------------------------
	//## private
	
	delay: function(task) {
		window.setTimeout(task, 0);
	},
	
	propagate: function(currentTick) {
		if (this.propagating)	throw new Error("propagation already in progress");
		
		this.currentTick	= currentTick;
		
		this.propagating	= true;
		// cloned because observers might change the original array
		var subscribersCopy	= this.subscribers.slice();
		for (var i=0; i<subscribersCopy.length; i++) {
			try {
				subscribersCopy[i]();
			}
			catch (e) {
				this.onPropagationError(e);
			}
		}
		this.propagating	= false;
	},
	
	// (() -> Unit) -> (() -> Unit)
	subscribe: function(subscriber) {
		this.subscribers.push(subscriber);
		return this.unsubscribe.bind(this, subscriber);
	},
	
	// (() -> Unit) -> Boolean
	unsubscribe: function(subscriber) {
		var index	= this.subscribers.indexOf(subscriber);
		var found	= index !== -1;
		if (found)	this.subscribers.slice(index, 1);
		return found;
	}//,
};
