var jsreact	= jsreact || {};

/** alive until the alive signal becomes false */
// Signal[Boolean] -> Observing
jsreact.Observing	= function Observing(aliveSignal) {
	this.aliveSignal	= aliveSignal;
};
jsreact.Observing.prototype	= {
	/** alive while this Observing is alive and another Signal didn't become false */
	child: function(aliveSignal) {
		function and(a,b) { return a && b; }
		var childAlive	= jsreact.Signals.combine(and)(this.aliveSignal, aliveSignal);
		return new jsreact.Observing(childAlive);
	},
	
	// (Reactive[T], Handler[T]) -> Unit
	observe: function(reactive, handler) {
		var self	= this;
		
		self.updateReactive(self.aliveSignal);
		if (self.aliveSignal.value) {
			self.updateAndNotifyReactive(reactive, handler, true);
			var unsubscribe	= jsreact.Engine.subscribe(function() {
				self.updateReactive(self.aliveSignal);
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
		this.updateReactive(this.aliveSignal);
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
		this.updateReactive(reactive);
		reactive.notify(first, handler);
	},
	
	// Reactive[T] -> Unit
	updateReactive: function(reactive) {
		reactive.update(jsreact.Engine.currentTick);
	}//,
};
jsreact.Observing.always	= function() {
	return new jsreact.Observing(
		jsreact.Signals.constant(true)	
	);
};
