var jsreact	= jsreact || {};

jsreact.Streams	= {
	// Stream[Nothing]
	never: function() {
		// TODO only a function because jsread.Functions may not be defined yet
		return new jsreact.Stream(
			jsreact.Functions.constant({
				change:	null,
				fire:	false
			})
		)
	},
	
	// T => Stream[T]
	always: function(change) {
		return new jsreact.Stream(
			jsreact.Functions.constant({
				change:	change,
				fire:	true
			})
		);
	},
	
	// T => Stream[T]
	once: function(change) {
		return new jsreact.Stream(function(first) {
			return {
				change:	change,
				fire:	first
			};
		});
	},
	
	// (Stream[T], Stream[T]) => Stream[T]
	orElse: function(stream1, stream2) {
		return new jsreact.Stream(function(first) {
			stream1.update();
			stream2.update();
			return {
				change:	stream1.fire ? stream1.change : stream2.change,
				fire:	stream1.fire || stream2.fire
			};
		});
	},
	
	// (Stream[T], Stream[T]) => Stream[Array[T]] (non-empty)
	merge: function(stream1, stream2) {
		return new jsreact.Stream(function(first) {
			stream1.update();
			stream2.update();
			var changes	= [];
			if (stream1.fire)	changes.push(stream1.change);
			if (stream2.fire)	changes.push(stream2.change);
			return {
				change:	changes,
				fire:	changes.length !== 0
			};
		});
	},
	
	// (T => Boolean) => (Stream[T] => Stream[T])
	filter: function(pred) {
		return function(stream) {
			return new jsreact.Stream(function(first) {
				stream.update();
				return {
					change:	stream.change,
					fire:	stream.fire && pred(stream.change)
				};
			});
		};
	},
	
	// (T => Boolean) => (Stream[T] => Stream[T])
	filterNot: function(pred) {
		return jsreact.Streams.filter(function(it) {
			return !pred(it);
		});
	},
	
	// Stream[T] => Stream[T]
	notNull: function() {
		return jsreact.Streams.filter(function(it) {
			return it !== null;
		});
	},
	
	// (T => Boolean) => Stream[T] => { trues:Stream[T], falses:Stream[T] }
	partition: function(pred) {
		return function(stream) {
			return {
				trues:		jsreact.Streams.filter(pred)(stream),
				falses:		jsreact.Streams.filterNot(pred)(stream)//,
			};
		};
	},
	
	// Stream[Boolean] => Stream[Boolean]
	trues: function(stream) {
		return jsreact.Streams.filter(function(it) { return !!it; })(stream);
	},
	
	// Stream[Boolean] => Stream[Boolean]
	falses: function(stream) {
		return jsreact.Streams.filter(function(it) { return !it; })(stream);
	},
	
	// Stream[Boolean] => Stream[Boolean]
	not: function(stream) {
		return jsreact.Streams.map(function(it) { return !it; });
	},

	// (S => T) => (Stream[S] => Stream[T])
	map: function(func) {
		return function(stream) {
			return new jsreact.Stream(function(first) {
				stream.update();
				return {
					change:	stream.fire ? func(stream.change) : null,
					fire:	stream.fire
				};
			});
		};
	},
	
	// T => Stream[S] => Stream[T]
	tag: function(value) {
		return function(stream) {
			return new jsreact.Stream(function(first) {
				stream.update();
				return {
					change:	value,
					fire:	stream.fire
				};
			});
		};
	},
	
	// Stream[S => T] => (Stream[S] => Stream[T])
	ap: function(funcStream) {
		return function(changeStream) {
			return funcStream.flatMap(function(f) {
				changeStream.map(function(v) {
					return f(v);
				});
			});
		};
	},
	
	// (S => Stream[T]) => (Stream[S] => Stream[T])
	flatMap: function(func) {
		return function(stream) {
			return jsreact.Streams.flatten(jsreact.Streams.map(func, signal));
		};
	},
	
	// Stream[Stream[T]] => Stream[T]
	flatten: function(streamStream) {
		var stream	= jsreact.Streams.never();
		return new jsreact.Stream(function(first) {
			streamStream.update();
			if (streamStream.fire) {
				stream	= streamStream.change;
			}
			stream.update();
			return {
				change:	stream.change,
				fire:	stream.fire
			};
		});
	},
	
	// ((S1, S2) => T) => ((Stream[S1], Signal[S2]) => Stream[T])
	sample: function(func) {
		return function(stream, signal) {
			return new jsreact.Stream(function(first) {
				stream.update();
				signal.update();
				return {
					change:	stream.fire ? func(stream.change, signal.value) : null,
					fire:	stream.fire
				};
			});
		};
	},
	
	// (Stream[S], Signal[T]) => Stream[T]
	sampleOnly: function(stream, signal) {
		return jsreact.Streams.sample(function(streamValue, signalValue) { return signalValue; })(stream, signal);
	},
	
	// T => Stream[T] => Signal[T]
	hold: function(initial) {
		return function(stream) {
			return new jsreact.Signal(
				function(first, previous) {
					stream.update();
					return stream.fire ? stream.change : first ? initial : previous
				},
				initial
			);
		};
	},
	
	// (T, (T, S) =>T) => Stream[S] => Stream[T]
	fold: function(initial, func) {
		var value	= initial;
		return function(stream) {
			return new jsreact.Stream(function(first) {
				stream.update();
				if (stream.fire) {
					value	= func(value, stream.change);
				}
				return {
					change:	value,
					fire:	stream.fire
				};
			});
		};
	},
	
	//------------------------------------------------------------------------------
	
	// Key => Stream[{Key:X}] => Stream[X]
	destruct: function(key) {
		return function(stream) {
			return new jsreact.Stream(function(first) {
				stream.update();
				var fire	= stream.fire && stream.change.hasOwnProperty(key);
				return {
					change:	fire ? stream.change[key] : null,
					fire:	fire//,
				};
			});
		};
	},
	
	// Stream[T]* => Stream[T]
	multiOrElse: function(/*streams*/) {
		var inputs	= Array.prototype.slice.call(arguments, 0);
		return new jsreact.Stream(function(first) {
			inputs.forEach(function(it) { it.update(); });
			for (var i=0; i<inputs.length; i++) {
				var input	= inputs[i];
				if (input.fire) {
					return {
						change:	input.change,
						fire:	true//,
					};
				}
			}
			return {
				change:	null,
				fire:	false//,
			};
		});
	},
	
	// Stream[T]* => Stream[Array[T]] (non-empty)
	multiMerge: function(/*streams*/) {
		var inputs	= Array.prototype.slice.call(arguments, 0);
		return new jsreact.Stream(function(first) {
			inputs.forEach(function(it) { it.update(); });
			var changes	= [];
			for (var i=0; i<inputs.length; i++) {
				var input	= inputs[i];
				if (input.fire) {
					changes.push(input.change);
				}
			}
			return {
				change:	changes,
				fire:	changes.length !== 0//,
			};
		});
	}//,
};
