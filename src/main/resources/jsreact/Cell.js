var jsreact	= jsreact || {};

// Engine => { signal:Signal[T], set:T=>Unit }
jsreact.Cell = function(engine, initial) {
	this.engine	= engine;
	
	//## public
	
	this.signal	= new jsreact.Signal(function(currentTick, first, previous) {
		return first ? initial : previous;
	});
};
jsreact.Cell.prototype	= {
	set: function(change) {
		this.engine.delay(this.setImpl.bind(this, change));
	},
	
	modify: function(func) {
		this.engine.delay(this.modifyImpl.bind(this, func));
	},
	
	//------------------------------------------------------------------------------
	//## private
	
	setImpl: function(value) {
		if (value === this.signal.value)	return;
		
		var nextTick	= {};
		
		this.signal.version	= nextTick;
		this.signal.value	= value;
		this.signal.fire	= true;
		this.engine.propagate(nextTick);
		this.signal.fire	= false;
	},
	
	modifyImpl: function(func) {
		this.setImpl(func(this.signal.value));
	}//,
};
