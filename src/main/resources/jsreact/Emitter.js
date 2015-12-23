var jsreact	= jsreact || {};

// Engine => { stream:Stream[T], emit:T=>Unit }
jsreact.Emitter = function(engine) {
	this.engine	= engine;
	
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
		this.engine.delay(this.emitImpl.bind(this, change));
	},
	
	emitImpl: function(change) {
		var nextTick	= {};
		
		this.stream.version	= nextTick;
		this.stream.change	= change;
		this.stream.fire	= true;
		this.engine.propagate(nextTick);
		this.stream.fire	= false;
	}//,
};
