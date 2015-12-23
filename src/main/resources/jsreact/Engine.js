var jsreact	= jsreact || {};

jsreact.Engine	= {
	//------------------------------------------------------------------------------
	//## observation
	
	/** returns a disconnect function */
	// (Reactive[T], Handler[T]) -> () -> Boolean
	observe: function(reactive, handler) {
		this.observeOnce(reactive, handler);
		return this.subscribe(
			this.observeAgain.bind(this, reactive, handler)
		);
	},
	
	/** call this to immediately observe a signal */
	observeOnce: function(reactive, handler) {
		reactive.update();
		reactive.notify(true, handler);
	},
	
	observeAgain: function(reactive, handler) {
		reactive.update();
		reactive.notify(false, handler);
	},
	
	//------------------------------------------------------------------------------
	//## feedback
	
	/** returns a disconnect function */
	// (Stream[T], Cell[T]) -> () -> Boolean
	feedCell: function(stream, cell) {
		return this.observe(stream, cell.set.bind(cell));
	},
	
	/** returns a disconnect function */
	// (Stream[T], Cell[T]) -> () -> Boolean
	feedEmitter: function(stream, emitter) {
		return this.observe(stream, emitter.emit.bind(emitter));
	},
	
	//------------------------------------------------------------------------------
	//## private
	
	subscribers:	[],
	currentTick:	{},
	nextTick:		{},
	propagating:	false,
	
	propagate: function() {
		if (this.propagating)	throw new Error("propagation already in progress");
		
		this.currentTick	= this.nextTick;
		this.nextTick		= {};
		
		this.propagating	= true;
		// cloned because observers might change the original array
		this.subscribers.slice().forEach(function(subscribers) {
			subscribers();
		});
		this.propagating	= false;
	},
	
	subscribe: function(subscriber) {
		this.subscribers.push(subscriber);
		return this.unsubscribe.bind(this, subscriber);
	},
	
	unsubscribe: function(subscriber) {
		var index	= this.subscribers.indexOf(subscriber);
		var found	= index !== -1;
		if (found)	this.subscribers.slice(index, 1);
		return found;
	}//,
};
