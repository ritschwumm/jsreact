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
		return jsreact.Signals.combine(function(a, b) { return [ a, b ]})(signal1, signal2);
	},
	
	// Signal[(T1, T2)] => (Signal[T1],S ignal[T2])
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
	
	//------------------------------------------------------------------------------
	
	// Signal^x => (Value^x => Value) => Signal
	multiCombine: function(/*signals*/) {
		var inputs	= Array.prototype.slice.call(arguments, 0);
		return function(funcN) {
			return new jsreact.Signal(function(first, previous) {
				inputs.forEach(function(it) { it.update(); });
				return first || inputs.some(function(it) { return it.fire; })
						?	funcN.apply(
								null,
								inputs.map(function(it) { return it.value; })
							)
						:	previous;
			});
		};
	},
	
	multiZip: function(/*signals*/) {
		var inputs	= Array.prototype.slice.call(arguments, 0);
		return new jsreact.Signal(function(first, previous) {
			inputs.forEach(function(it) { it.update(); });
			return first || inputs.some(function(it) { return it.fire; })
					?	inputs.map(function(it) { return it.value; })
					:	previous;
		});
	}//,
};
