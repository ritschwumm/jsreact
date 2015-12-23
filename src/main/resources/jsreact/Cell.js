var jsreact	= jsreact || {};

// T -> { signal:Signal[T], set:T=>Unit }
jsreact.Cell = function(initial) {
	this.signal	= new jsreact.Signal(function(currentTick, first, previous) {
		return first ? initial : previous;
	});
};
jsreact.Cell.prototype	= {
	set: function(change) {
		window.setTimeout(this.setImpl.bind(this, change), 0);
	},
	
	modify: function(func) {
		window.setTimeout(this.modifyImpl.bind(this, func), 0);
	},
	
	//------------------------------------------------------------------------------
	//## private
	
	setImpl: function(value) {
		if (value === this.signal.value)	return;
		
		var nextTick	= {};
		
		this.signal.version	= nextTick;
		this.signal.value	= value;
		this.signal.fire	= true;
		jsreact.Engine.propagate(nextTick);
		this.signal.fire	= false;
	},
	
	modifyImpl: function(func) {
		this.setImpl(func(this.signal.value));
	}//,
};
