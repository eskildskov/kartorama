/*
 * Load files *locally* (GeoJSON, KML, GPX) into the map
 * using the HTML5 File API.
 *
 * Requires Mapbox's togeojson.js to be in global scope
 * https://github.com/mapbox/togeojson
 */

import * as toGeoJSON from '@tmcw/togeojson';
import L from 'leaflet';

const FileLoader = L.Layer.extend({
	options: {
		layer: L.geoJson,
		layerOptions: {},
		fileSizeLimit: 1024,
	},

	initialize(map, options) {
		this._map = map;
		L.Util.setOptions(this, options);

		this._parsers = {
			geojson: this._loadGeoJSON,
			json: this._loadGeoJSON,
			gpx: this._convertToGeoJSON,
			kml: this._convertToGeoJSON,
		};
	},

	load(file, ext) {
		let parser;
		let reader;

		// Check file is defined
		if (this._isParameterMissing(file, 'file')) {
			return false;
		}

		// Check file size
		if (!this._isFileSizeOk(file.size)) {
			return false;
		}

		// Get parser for this data type
		parser = this._getParser(file.name, ext);
		if (!parser) {
			return false;
		}

		// Read selected file using HTML5 File API
		reader = new FileReader();
		reader.addEventListener(
			'load',
			L.Util.bind(function (e) {
				let layer;
				try {
					this.fire('data:loading', {
						filename: file.name,
						format: parser.ext,
					});
					layer = parser.processor.call(this, e.target.result, parser.ext);
					this.fire('data:loaded', {
						layer,
						filename: file.name,
						format: parser.ext,
					});
				} catch (error) {
					this.fire('data:error', {error});
				}
			}, this),
		);
		// Testing trick: tests don't pass a real file,
		// but an object with file.testing set to true.
		// This object cannot be read by reader, just skip it.
		if (!file.testing) {
			reader.readAsText(file);
		}

		// We return this to ease testing
		return reader;
	},

	loadMultiple(files, ext) {
		const readers = [];
		if (files[0]) {
			files = Array.prototype.slice.apply(files);
			while (files.length > 0) {
				readers.push(this.load(files.shift(), ext));
			}
		}

		// Return first reader (or false if no file),
		// which is also used for subsequent loadings
		return readers;
	},

	loadData(data, name, ext) {
		let parser;
		let layer;

		// Check required parameters
		if (
			this._isParameterMissing(data, 'data') ||
			this._isParameterMissing(name, 'name')
		) {
			return;
		}

		// Check file size
		if (!this._isFileSizeOk(data.length)) {
			return;
		}

		// Get parser for this data type
		parser = this._getParser(name, ext);
		if (!parser) {
			return;
		}

		// Process data
		try {
			this.fire('data:loading', {filename: name, format: parser.ext});
			layer = parser.processor.call(this, data, parser.ext);
			this.fire('data:loaded', {
				layer,
				filename: name,
				format: parser.ext,
			});
		} catch (error) {
			this.fire('data:error', {error});
		}
	},

	_isParameterMissing(v, vname) {
		if (typeof v === 'undefined') {
			this.fire('data:error', {
				error: new Error('Missing parameter: ' + vname),
			});
			return true;
		}

		return false;
	},

	_getParser(name, ext) {
		let parser;
		ext = ext || name.split('.').pop();
		parser = this._parsers[ext];
		if (!parser) {
			this.fire('data:error', {
				error: new Error('Unsupported file type (' + ext + ')'),
			});
			return undefined;
		}

		return {
			processor: parser,
			ext,
		};
	},

	_isFileSizeOk(size) {
		const fileSize = (size / 1024).toFixed(4);
		if (fileSize > this.options.fileSizeLimit) {
			this.fire('data:error', {
				error: new Error(
					'File size exceeds limit (' +
						fileSize +
						' > ' +
						this.options.fileSizeLimit +
						'kb)',
				),
			});
			return false;
		}

		return true;
	},

	_loadGeoJSON: function _loadGeoJSON(content) {
		let layer;
		if (typeof content === 'string') {
			content = JSON.parse(content);
		}

		layer = this.options.layer(content, this.options.layerOptions);

		if (layer.getLayers().length === 0) {
			throw new Error('GeoJSON has no valid layers.');
		}

		if (this.options.addToMap) {
			layer.addTo(this._map);
		}

		return layer;
	},

	_convertToGeoJSON: function _convertToGeoJSON(content, format) {
		let geojson;
		// Format is either 'gpx' or 'kml'
		if (typeof content === 'string') {
			content = new window.DOMParser().parseFromString(content, 'text/xml');
		}

		if (format === 'gpx') {
			geojson = toGeoJSON.gpx(content);
		}

		if (format === 'kml') {
			geojson = toGeoJSON.kml(content);
		}

		return this._loadGeoJSON(geojson);
	},
});

const FileLayerLoad = L.Control.extend({
	statics: {
		TITLE: 'Load local file (GPX, KML, GeoJSON)',
		LABEL: '&#8965;',
	},
	options: {
		position: 'topleft',
		fitBounds: true,
		layerOptions: {},
		addToMap: true,
		fileSizeLimit: 1024,
	},

	initialize(options) {
		L.Util.setOptions(this, options);
		this.loader = null;
	},

	onAdd(map) {
		this.loader = L.FileLayer.fileLoader(map, this.options);

		this.loader.on(
			'data:loaded',
			function (e) {
				// Fit bounds after loading
				if (this.options.fitBounds) {
					window.setTimeout(function () {
						map.fitBounds(e.layer.getBounds());
					}, 500);
				}
			},
			this,
		);

		// Initialize Drag-and-drop
		this._initDragAndDrop(map);

		// Initialize map control
		return this._initContainer();
	},

	_initDragAndDrop(map) {
		let callbackName;
		const thisLoader = this.loader;
		const dropbox = map._container;

		const callbacks = {
			dragenter() {
				map.scrollWheelZoom.disable();
			},
			dragleave() {
				map.scrollWheelZoom.enable();
			},
			dragover(e) {
				e.stopPropagation();
				e.preventDefault();
			},
			drop(e) {
				e.stopPropagation();
				e.preventDefault();

				thisLoader.loadMultiple(e.dataTransfer.files);
				map.scrollWheelZoom.enable();
			},
		};
		for (callbackName in callbacks) {
			if (callbacks.hasOwnProperty(callbackName)) {
				dropbox.addEventListener(callbackName, callbacks[callbackName], false);
			}
		}
	},

	_initContainer() {
		const thisLoader = this.loader;

		// Create a button, and bind click on hidden file input
		const zoomName = 'leaflet-control-filelayer leaflet-control-zoom';
		const barName = 'leaflet-bar';
		const partName = barName + '-part';
		const container = L.DomUtil.create('div', zoomName + ' ' + barName);
		const link = L.DomUtil.create('a', zoomName + '-in ' + partName, container);
		link.innerHTML = L.Control.FileLayerLoad.LABEL;
		link.href = '#';
		link.title = L.Control.FileLayerLoad.TITLE;

		// Create an invisible file input
		const fileInput = L.DomUtil.create('input', 'hidden', container);
		fileInput.type = 'file';
		fileInput.multiple = 'multiple';
		fileInput.accept = !this.options.formats
			? '.gpx,.kml,.json,.geojson'
			: this.options.formats.join(',');

		fileInput.style.display = 'none';
		// Load on file change
		fileInput.addEventListener(
			'change',
			function () {
				thisLoader.loadMultiple(this.files);
				// Reset so that the user can upload the same file again if they want to
				this.value = '';
			},
			false,
		);

		L.DomEvent.disableClickPropagation(link);
		L.DomEvent.on(link, 'click', function (e) {
			fileInput.click();
			e.preventDefault();
		});
		return container;
	},
});

L.FileLayer = {};
L.FileLayer.FileLoader = FileLoader;
L.FileLayer.fileLoader = function (map, options) {
	return new L.FileLayer.FileLoader(map, options);
};

L.Control.FileLayerLoad = FileLayerLoad;
L.Control.fileLayerLoad = function (options) {
	return new L.Control.FileLayerLoad(options);
};
