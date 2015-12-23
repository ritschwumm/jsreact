var jsreact	= jsreact || {};

// (Tick => Unit) => { stream:Stream[T], emit:T=>Unit }
jsreact.Emitter = function(propagateFunc) {
	this.propagateFunc	= propagateFunc;
	
	//## public
	
	this.stream	= new jsreact.Stream(function(currentTick, first) {
		return {
			fire:	this.fire,
			change:	this.change
		};
	});
};
jsreact.Emitter.prototype	= {
	emit: function(change) {
		window.setTimeout(this.emitImpl.bind(this, change), 0);
	},
	
	emitImpl: function(change) {
		var nextTick	= {};
		
		this.stream.version	= nextTick;
		this.stream.change	= change;
		this.stream.fire	= true;
		this.propagateFunc(nextTick);
		this.stream.fire	= false;
	}//,
};
