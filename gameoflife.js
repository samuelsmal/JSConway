/*
 * @author Samuel von Baussnern
 *
 * Conway's game of life. With help from https://github.com/nomatteus/conway-game-of-life-js/blob/master/gameoflife.js.
 *
 * @version V1
 */
function GameOfLife(params) {
	var num_cells_y = params["init_cells"].length,
		num_cells_x = params["init_cells"][0].length,
		cell_width  = params["cell_width"]  || 10,
		cell_height = params["cell_height"] || 10,
		init_cells  = params["init_cells"]  || [],
		canvas_id   = params["canvas_id"]   || "game",
		step_speed  = params["step_speed"]  || 500;

	this.interval = null;

    this.cells = [];
    this.cells_alive = [];
    this.late_cells = [];
    this.num_cells_alive = 0;
    this.run_number = 0;

    this.initCells(num_cells_x, num_cells_y, init_cells);
    this.display = new GameDisplay(num_cells_x, num_cells_y, cell_width, cell_height, canvas_id);
    this.display.initAsBackground();
    this.updateDisplay();
}

GameOfLife.prototype.updateDisplay = function() {
	this.display.update(this.late_cells);
	this.display.update(this.cells_alive);
};

GameOfLife.prototype.initCells = function(num_cells_x, num_cells_y, init_cells) {
	var	cell_neighbours = [],
		cell,
		row_above, row_below, column_left, column_right;

	this.cells = new Array(num_cells_y);

	for (var y = num_cells_y - 1; y >= 0; y--) {
        this.cells[y] = new Array(num_cells_x);

		for (var x = num_cells_x - 1; x >= 0; x--) {

			// using periodically assignment.
			row_above = (y - 1 >= 0) ? y - 1 : num_cells_y - 1;
			row_below = (y + 1 < num_cells_y) ? y + 1 : 0;
			column_left = (x - 1 >= 0) ? x - 1 : num_cells_x - 1;
			column_right = (x + 1 < num_cells_x) ? x + 1 : 0;

			cell_neighbours = [[row_above, column_left], [row_above, x], [row_above, column_right],
                               [y, column_left], [y, column_right],
                               [row_below, column_left], [row_below, x], [row_below, column_right]];

            if (init_cells[y][x] === 1) {
				// it's alive!
				cell = new Cell(x, y, true, cell_neighbours);
				this.cells[y][x] = cell;
				this.cells_alive.push(cell);
				this.num_cells_alive++;
            }
            else this.cells[y][x] = new Cell(x, y, false, cell_neighbours);
		}
	}
};

GameOfLife.prototype.evalGen = function() {
	var cell_neighbour, cell_alive, cell, num_alive, px, py, new_cells_alive = [], i, k;

	this.cells_changed = [];

	// Determine numbers of alive neighbours.
	for (i = this.cells_alive.length - 1; i >= 0; i--) {
		cell_alive = this.cells_alive[i];
		for (k = cell_alive.neighbours.length - 1; k >= 0; k--) {
			py = cell_alive.neighbours[k][0];
			px = cell_alive.neighbours[k][1];
			cell_neighbour = this.cells[py][px];
			if (cell_neighbour.last_run_touched < this.run_number) {
				cell_neighbour.num_neighbours_alive = 1;
				cell_neighbour.last_run_touched = this.run_number;
			} else {
				cell_neighbour.num_neighbours_alive++;
			}

		}
	}

	this.cells_alive = [];
	this.late_cells = [];

	// Game rules
	for (i = this.cells.length - 1; i >= 0; i--) {
		for (k = this.cells[i].length - 1; k >= 0; k--) {
			cell = this.cells[i][k];
			num_alive = cell.num_neighbours_alive;
			if (cell.is_alive) {
				if (num_alive < 2) {
					cell.is_alive = false;
					this.late_cells.push(cell);
				} else if (num_alive <= 3) {
					cell.is_alive = true;
					this.cells_alive.push(cell);
				} else {
					cell.is_alive = false;
					this.late_cells.push(cell);
				}
			} else {
				if (num_alive === 3) {
					cell.is_alive = true;
					this.cells_alive.push(cell);
				}
			}
		}
	}
};

GameOfLife.prototype.step = function () {
	this.evalGen();
	this.updateDisplay();

	console.log("run number: " + this.run_number);
	console.log("number of cells alive: " + this.cells_alive.length);

	this.run_number++;
};

GameOfLife.prototype.toggle = function() {
	var t = this;															// since setInterval uses 'window' as 'this'.
	if (this.interval !== null) {
		clearInterval(this.interval);
		this.interval = null;
	} else {
		this.interval = setInterval(function(){t.step();}, this.step_speed);
	}
};

function GameDisplay(_num_cells_x, _num_cells_y, _cell_width, _cell_height, _canvas_id) {
	this.canvas = document.getElementById(_canvas_id);
    this.ctx = this.canvas.getContext("2d");
    this.cell_width = _cell_width;
	this.cell_height = _cell_height;
	this.num_cells_y = _num_cells_y;
	this.num_cells_x = _num_cells_x;

    this.width_pixels = this.num_cells_x * this.cell_width;
	this.height_pixels = this.num_cells_y * this.cell_height;
}

GameDisplay.prototype.initAsBackground = function() {
	var cell_dim;
	// Overwrites the parameters so, that the canvas fills the website.

	if(typeof(window.innerWidth) === 'number') {
	//Non-IE
	this.width_pixels = window.innerWidth;
	this.height_pixels = window.innerHeight;

	} else if(document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
	//IE 6+ in 'standards compliant mode'
	this.width_pixels = document.documentElement.clientWidth;
	this.height_pixels = document.documentElement.clientHeight;

	} else if(document.body && (document.body.clientWidth || document.body.clientHeight)) {
	//IE 4 compatible
	this.width_pixels = document.body.clientWidth;
	this.height_pixels = document.body.clientHeight;
	}

	this.cell_height = this.cell_width = Math.floor(Math.min(this.width_pixels / this.num_cells_x, this.height_pixels / this.num_cells_y));

	//this.cell_width = Math.floor(this.width_pixels / this.num_cells_x);
	//this.cell_height = Math.floor(this.height_pixels / this.num_cells_y);

	this.init();
};

GameDisplay.prototype.drawCell = function(cell) {
	var start_x = cell.x_pos * this.cell_width,
		start_y = cell.y_pos * this.cell_height;

	if (cell.is_alive) {
		this.ctx.fillStyle = "green";
	} else {
		this.ctx.fillStyle = "grey";
	}

	this.ctx.fillRect(start_x, start_y, this.cell_width, this.cell_height);
};

GameDisplay.prototype.init = function() {
	// resizing the canvas.
	this.canvas.width = this.width_pixels;
	this.canvas.height = this.height_pixels;
};

GameDisplay.prototype.update = function(cell_array) {
	for (var i = cell_array.length - 1; i >= 0; i--) this.drawCell(cell_array[i]);
};

GameDisplay.prototype.drawGrid = function() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "rgba(255, 0, 0, 1)";
    this.ctx.beginPath();

    for (var i = this.num_cells_x - 1; i >= 0; i--) {
        this.ctx.moveTo(i * this.cell_width, 0);
        this.ctx.lineTo(i * this.cell_width, this.height_pixels);
    }

    for (i = this.num_cells_y - 1; i >= 0; i--) {
        this.ctx.moveTo(0, i * this.cell_height);
        this.ctx.lineTo(this.width_pixels, i * this.cell_height);
    }
    this.ctx.stroke();
};

function Cell (new_x_pos, new_y_pos, new_is_alive, new_neighbours) {
	this.last_run_touched = -1;
	this.neighbours = new_neighbours;
	this.num_neighbours_alive = 0;
	this.will_live = false;
	this.is_alive = new_is_alive;
	this.x_pos = new_x_pos;
	this.y_pos = new_y_pos;
};

window.onload = function initConway() {
	params = {
		canvas_id: "game",
			cell_width: 10,
			cell_height: 10,
			init_cells: seed_2,
			step_speed: 2000
	},
	game = new GameOfLife(params);

	document.getElementById("butt").addEventListener("click", function(){
		game.step();
	});
	document.getElementById("run").addEventListener("click", function(){
		game.toggle();
	});
};