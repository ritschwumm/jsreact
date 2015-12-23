var jsreact	= jsreact || {};

/** alive until the alive signal becomes false */
// (Engine, Signal[Boolean]) -> Observing
jsreact.Observing	= function Observing(engine, aliveSignal) {
	this.engine			= engine;
	this.aliveSignal	= aliveSignal;
};
jsreact.Observing.prototype	= {
	//------------------------------------------------------------------------------
	//## observing
	
	/** alive while this Observing is alive and another Signal didn't become false */
	child: function(aliveSignal) {
		function and(a, b) { return a && b; }
		var childAlive	= jsreact.Signals.combine(and)(this.aliveSignal, aliveSignal);
		return new jsreact.Observing(this.engine, childAlive);
	},
	
	//------------------------------------------------------------------------------
	//## drain
	
	// (Reactive[T], Handler[T]) -> Unit
	observe: function(reactive, handler) {
		this.engine.updateReactive(this.aliveSignal);
		if (this.aliveSignal.value) {
			this.updateAndNotifyReactive(reactive, handler, true);
			
			var self	= this;
			var unsubscribe	= self.engine.subscribe(function() {
				self.engine.updateReactive(self.aliveSignal);
				if (self.aliveSignal.value) {
					self.updateAndNotifyReactive(reactive, handler, false);
				}
				else {
					unsubscribe();
				}
			});
		}
	},
	
	// (Reactive[T], Handler[T]) -> Unit
	initialize: function(reactive, handler) {
		this.engine.updateReactive(this.aliveSignal);
		if (this.aliveSignal.value) {
			this.updateAndNotifyReactive(reactive, handler, true);
		}
	},
	
	// (Stream[T], Cell[T]) -> Unit
	feedCell: function(stream, cell) {
		return this.observe(stream, cell.set.bind(cell));
	},
	
	// (Stream[T], Cell[T]) -> Unit
	feedEmitter: function(stream, emitter) {
		return this.observe(stream, emitter.emit.bind(emitter));
	},
	
	//------------------------------------------------------------------------------
	//## private
	
	// (Reactive[T], Handler[T], Boolean) -> Unit
	updateAndNotifyReactive: function(reactive, handler, first) {
		this.engine.updateReactive(reactive);
		reactive.notify(first, handler);
	}//,
};
