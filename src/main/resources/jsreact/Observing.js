var jsreact	= jsreact || {};

/** alive unzil the alive signal becomes false */
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
		
		self.aliveSignal.update();
		if (self.aliveSignal.value) {
			self.updateAndNotify(reactive, handler, true);
			var unsubscribe	= jsreact.Engine.subscribe(function() {
				self.aliveSignal.update();
				if (self.aliveSignal.value) {
					self.updateAndNotify(reactive, handler, false);
				}
				else {
					unsubscribe();
				}
			});
		}
	},
	
	// (Reactive[T], Handler[T]) -> Unit
	initialize: function(reactive, handler) {
		this.aliveSignal.update();
		if (this.aliveSignal.value) {
			this.updateAndNotify(reactive, handler, true);
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
	updateAndNotify: function(reactive, handler, first) {
		reactive.update();
		reactive.notify(first, handler);
	}//,
};
jsreact.Observing.always	= function() {
	return new jsreact.Observing(
		jsreact.Signals.constant(true)	
	);
};
