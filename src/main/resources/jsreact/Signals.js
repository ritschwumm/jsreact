var jsreact	= jsreact || {};

jsreact.Signals = {
	// T => Signal[T]
	constant: function(value) {
		return new jsreact.Signal(jsreact.Functions.constant(value));
	},

	// (S => T) => (Signal[S] => Signal[T])
	map: function(func) {
		return function(signal) {
			return new jsreact.Signal(function(first, previous) {
				signal.update();
				return first || signal.fire
						? func(signal.value)
						: previous;
			});
		};
	},
	
	// Signal[S => T] => (Signal[S] => Signal[T])
	ap: function(funcSignal) {
		return function(signal) {
			return new jsreact.Signal(function(first, previous) {
				funcSignal.update();
				signal.update();
				return first || funcSignal.fire || signal.fire
						? funcSignal.value(signal.value)
						: previous;
			});
		};
	},
	
	// ((S1, S2) => T) => (Signal[S1], Signal[S2]) => Signal[T]
	combine: function(func2) {
		return function(signal1, signal2) {
			return new jsreact.Signal(function(first, previous) {
				signal1.update();
				signal2.update();
				return first || signal1.fire || signal2.fire
						? func2(signal1.value, signal2.value)
						: previous;
			});
		};
	},
	
	// (Signal[S1], Signal[S2]) => Signal[(S1, S2)]
	zip: function(signal1, signal2) {
		return jsreact.Signals.combine(function(a, b) { return [ a, b ]; })(signal1, signal2);
	},
	
	// Signal[(T1, T2)] => (Signal[T1],Signal[T2])
	unzip: function(signal) {
		return [
			signal.map(function(it) { return it[0]; }),
			signal.map(function(it) { return it[1]; })//,
		];
	},
	
	// (S => Signal[T]) => (Signal[S] => Signal[T])
	flatMap: function(func) {
		return function(signal) {
			return jsreact.Signals.flatten(jsreact.Signals.map(func, signal));
		};
	},
	
	// Signal[Signal[T]] => Signal[T]
	flatten: function(signalSignal) {
		return new jsreact.Signal(function(first, previous) {
			signalSignal.update();
			signalSignal.value.update();
			return first || signalSignal.fire || signalSignal.value.fire
					? signalSignal.value.value
					: previous;
		});
	},
	
	// (S => Stream[T]) => (Signal[S] => Stream[T])
	flatMapStream: function(func) {
		return function(signal) {
			return jsreact.Signals.flattenStream(jsreact.Signals.map(func)(signal));
		};
	},
	
	// Signal[Stream[T]] => Stream[T]
	flattenStream: function(streamSignal) {
		return new jsreact.Stream(function(first) {
			streamSignal.update();
			var stream	= streamSignal.value;
			stream.update();
			return {
				change: stream.change,
				fire:	stream.fire
			};
		});
	},
	
	// (R => Signal[S], S => Signal[T]) => (R => Signal[T])
	chain: function(bindFunc1, bindFunc2) {
		return jsreact.Functions.andThen(bindFunc1, jsreact.Signals.flatMap(bindFunc2));
	},
	
	// Signal[T] => Stream[T]
	changes: function(signal) {
		return new jsreact.Stream(function(first) {
			signal.update();
			return {
				change:	signal.value,
				fire:	signal.fire
			};
		});
	},
	
	// (Array[S] => T) => Array[Signal[S]] => T
	combineMany: function(func) {
		return function(signalArray) {
			return new jsreact.Signal(function(first, previous) {
				signalArray.forEach(function(it) { it.update(); });
				return first || signalArray.some(function(it) { return it.fire; })
						?	func.apply(
								null,
								signalArray.map(function(it) { return it.value; })
							)
						:	previous;
			});
		};
	},
	
	// Array[Signal[T]] => Signal[Array[T]]
	sequenceArray: function(signalArray) {
		return new jsreact.Signal(function(first, previous) {
			signalArray.forEach(function(it) { it.update(); });
			return first || signalArray.some(function(it) { return it.fire; })
					?	signalArray.map(function(it) { return it.value; })
					:	previous;
		});
	},
	
	// (S => Signal[T]) => (Array[S] => Signal[Array[T]])
	traverseArray: function(func) {
		return function(array) {
			jsreact.Signals.sequenceArray(array.map(func));
		};
	},
	
	//------------------------------------------------------------------------------
	
	// Signal[_]* => (Value* => Value) => Signal
	multiCombine: function(/*signals*/) {
		var inputs	= Array.prototype.slice.call(arguments, 0);
		return function(funcN) {
			return jsreact.Signals.combineMany(funcN)(inputs);
		};
	},
	
	// Signal[_]*	=> Signal[Array[_]]
	multiZip: function(/*signals*/) {
		var inputs	= Array.prototype.slice.call(arguments, 0);
		return jsreact.Signals.sequenceArray(inputs);
	},
	
	//------------------------------------------------------------------------------
	
	// Hash[Key,Signal[_]]	=> Signal[Hash[Key,_]]
	construct: function(inputs) {
		var keys	= inputs.keys();
		var values	= keys.map(function(key) { return inputs[key]; });
		return new jsreact.Signal(function(first, previous) {
			values.forEach(function(it) { it.update(); });
			var fire	= first || values.some(function(it) { return it.fire; });
			if (fire) {
				var out	= {};
				keys.forEach(function(key) {
					out[key]	= inputs[key].value;
				});
				return out;
			}
			else return previous;
		});
	},
	
	// Array[Key] => Signal[{Key:_ ...}] => Hash[Key, Signal[_]]
	destruct: function(keys) {
		return function(signal) {
			var out	= {};
			for (var i=0; i<keys.length; i++) {
				var key		= keys[i];
				out[key]	= jsreact.Signals.pluck(key)(signal);
			}
			return out;
		};
	},
	
	// Key => Signal[{Key:X}] => Signal[X]
	pluck: function(key) {
		function pluck(it) { return it[key]; }
		return function(signal) {
			return jsreact.Signals.map(pluck)(signal);
		};
	}//,
};
