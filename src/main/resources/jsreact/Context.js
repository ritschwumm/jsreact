var jsreact	= jsreact || {};

jsreact.Context	= function(engine, observing) {
	this.engine		= engine;
	this.observing	= observing;
};
jsreact.Context.prototype	= {
	//------------------------------------------------------------------------------
	//## source
	
	newCell: function(initial) {
		return this.engine.newCell(initial);
	},
	
	newEmitter: function() {
		return this.engine.newEmitter();
	},
	
	connectExternal: function(subscribeFunc) {
		return this.engine.connectExternal(subscribeFunc);
	},
	
	//------------------------------------------------------------------------------
	//## drain
	
	// (Reactive[T], Handler[T]) -> Unit
	observe: function(reactive, handler) {
		this.observing.observe(reactive, handler);
	},
	
	// (Reactive[T], Handler[T]) -> Unit
	initialize: function(reactive, handler) {
		this.observing.initialize(reactive, handler);
	},
	
	// (Stream[T], Cell[T]) -> Unit
	feedCell: function(stream, cell) {
		return this.observing.observe(stream, cell.set.bind(cell));
	},
	
	// (Stream[T], Cell[T]) -> Unit
	feedEmitter: function(stream, emitter) {
		return this.observing.observe(stream, emitter.emit.bind(emitter));
	},
	
	//------------------------------------------------------------------------------
	//## context
	
	child: function(aliveSignal) {
		return new jsreact.Context(
			this.engine,
			this.observing.child(aliveSignal)
		);
	}//,
};

jsreact.Context.toplevel	= function(onPropagationError) {
	var engine		= new jsreact.Engine(onPropagationError);
	var observing	= engine.newObserving(jsreact.Signals.constant(true));
	return new jsreact.Context(engine, observing);
};
