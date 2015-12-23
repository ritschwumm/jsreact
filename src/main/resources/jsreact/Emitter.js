var jsreact	= jsreact || {};

// () -> { stream:Stream[T], emit:T=>Unit }
jsreact.Emitter = function() {
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
		this.stream.version	= jsreact.Engine.nextTick;
		this.stream.change	= change;
		this.stream.fire	= true;
		jsreact.Engine.propagate();
		this.stream.fire	= false;
	}//,
};
