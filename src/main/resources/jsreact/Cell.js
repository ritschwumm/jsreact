var jsreact	= jsreact || {};

// T -> { signal:Signal[T], set:T=>Unit }
jsreact.Cell = function(initial) {
	this.signal	= new jsreact.Signal(function(first, previous) {
		return first ? initial : previous;
	});
};
jsreact.Cell.prototype	= {
	set: function(change) {
		window.setTimeout(this.setImpl.bind(this, change), 0);
	},
	
	setImpl: function(value) {
		this.signal.version	= jsreact.Engine.nextTick;
		var previous		= this.signal.value;
		this.signal.value	= value;
		this.signal.fire	= this.signal.value !== previous;
		if (this.signal.fire) {
			jsreact.Engine.propagate();
		}
	}//,
};
