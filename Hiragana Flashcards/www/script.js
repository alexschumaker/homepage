var currentCard = "";
var db;
var recent = [];

var burger;
var menu;
var reset;

var card;
var front;
var back;

var incorrectBtn;
var correctBtn;
var skipBtn;

// init
$(document).ready( function() {
	// if (window.AndroidFullScreen) {
	// 	// Extend your app underneath the status bar (Android 4.4+ only)
	// 	window.AndroidFullScreen.showUnderStatusBar();

	// 	// Extend your app underneath the system UI (Android 4.4+ only)
	// 	window.AndroidFullScreen.showUnderSystemUI();

	// 	// Hide system UI and keep it hidden (Android 4.4+ only)
	// 	window.AndroidFullScreen.immersiveMode();
	// }

	// set global ids
	burger = $("#burger");
	menu = $("#menu");
	reset = $("#reset");

	card = $("#card");
	front = $("#symbol");
	back = $("#answer");
	incorrectBtn = $("#incorrect");
	correctBtn = $("#correct");
	skipBtn = $("#skip");

	glyphs["setMap"] = {};
	glyphs.symbols.forEach(
		function(set, i) {
			Object.keys(set).forEach(
				function(romanji, j) {
					glyphs.setMap[romanji] = i;
				});
		});

	// set up click events
	$("#app").on("click", function(){
		if (menu.hasClass("open")) {
			toggleMenu();
		}
	});

	burger.on("click", function(e) {
		e.stopPropagation();
		toggleMenu();
	});

	reset.on("click", function() {
		initScoresDB(function(sets) {
			sets.forEach(function(value, i) {
				var btn = $("#set"+i);
				btn.toggleClass("checked", value === 1 ? true : false);
			});
		});

		db.transaction(function(tx) {
			updateSetPercentages(tx);
		});
	});

	card.on("click", function() {
		flipCard(.25);
	});

	incorrectBtn.on("click", function() {
		incorrectCard();
	});

	correctBtn.on("click", function() {
		correctCard();
	});

	skipBtn.on("click", function() {
		skipCard();
	});

	document.addEventListener("backbutton", 
		function() {
			if (menu.hasClass("open")) {
				toggleMenu();
			} else {
				navigator.app.backHistory();
			}
		}, false);


	// create DB if there isn't one, otherwise load it up.
	// during load also set up data-reliant things.
	db = window.openDatabase("flashcardsDB", "1.0", 'Hiragana Flashcards DB', 1000000);

	db.transaction(function(tx) {
		tx.executeSql("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='scores'", [], 
			function(tx, results) {
				if (results.rows[0]['count(*)'] == 1) {
					console.log("Scores table found.");
					refreshGlyphPool(chooseCard);
				} else {
					console.log("Scores table does not exist, creating and initializing now...");
					initScoresDB(chooseCard);
				}
				initMenu();
			});
	});
});

// create and populate scores table with initial values
function initScoresDB(callback) {
	var activeSets;
	db.transaction(function(tx) {
		tx.executeSql("DROP TABLE IF EXISTS activeSets");
		tx.executeSql("DROP TABLE IF EXISTS scores");
		tx.executeSql("CREATE TABLE IF NOT EXISTS scores \
						(id TEXT PRIMARY KEY, correct INTEGER, incorrect INTEGER, score INTEGER, \
						lastCallDelta INTEGER, lastCallCorrect INTEGER)");

		tx.executeSql("CREATE TABLE IF NOT EXISTS activeSets \
						(setActive INTEGER)");

		glyphs.setActivePool(Array.apply(null, Array(glyphs.symbols.length)).map(Number.prototype.valueOf,1));

		var symbols = Object.keys(glyphs.pool);
		for (i = 0; i < symbols.length; i++) {
			tx.executeSql("INSERT INTO scores (id, correct, incorrect, score, lastCallDelta, lastCallCorrect) \
							VALUES (?, 0, 0, 0, 0, 0)", [symbols[i]], );
		}


		// set only set0 active by default
		activeSets = [1].concat(Array.apply(null, Array(glyphs.symbols.length-1)).map(Number.prototype.valueOf,0));
		glyphs.setActivePool(activeSets);

		activeSets.forEach(function(value,i) {
			tx.executeSql("INSERT INTO activeSets (setActive) VALUES (?)", [value]);
		});

	}, null, function() {
		if (typeof(callback) === "function") {
			callback(activeSets);
		}
	});
}

function initMenu() {
	db.transaction(function(tx) {
		tx.executeSql("SELECT * FROM activeSets",[],
			function(tx, results) {
				var sets = Object.values(results.rows);
				sets.forEach(function(j,i) {
					sets[i] = j["setActive"];
				});
				var setList = $("#setList");

				sets.forEach(function(active, i) {
					var checked = (active ? "checked": "");
					setList.append("<div class='setItem "+checked+"' id='set"+i+"'> \
										<div class='setLabel'>"+i+"</div> \
										<div class='setScore' id='set"+i+"Score'></div> \
									</div>");

					var btn = $("#set"+i);
					btn.on("click", function() {
						btn.toggleClass("checked");
					});
				});
			})
		updateSetPercentages(tx);
	});
}

function refreshGlyphPool(callback) {
	db.transaction(function(tx) {
		tx.executeSql("SELECT * FROM activeSets",[],
		function(tx, results) {
			var sets = Object.values(results.rows);
			sets.forEach(function(j,i) {
				sets[i] = j["setActive"];
			});
			glyphs.setActivePool(sets);
			if (typeof(callback) === 'function') {
				callback();		
			}
		});
	});
}

function toggleMenu() {
	menu.toggleClass("open");
	burger.toggleClass("open");

	if (!menu.hasClass("open")) {
		db.transaction(function(tx) {
			for (i = 0; i < glyphs.symbols.length; i++) {
				var checked = $("#set"+i).hasClass("checked") ? 1 : 0;
				tx.executeSql("UPDATE activeSets SET setActive=? WHERE rowid=?",[checked, i+1]);
			}
		}, function() {
			alert("Error Processing SQL.");
		}, function() {
			refreshGlyphPool();
		});
	}
}

// "randomly" select a card
function chooseCard() {
	db.transaction(function(tx) {
		tx.executeSql("SELECT * FROM scores", [], 
			function(tx, results) {
				var scoresData = results.rows;
				var randomBins = [];
				var poolKeys = Object.keys(glyphs.pool);
				var poolSize = poolKeys.length;
				var adjN = 0.0;
				poolKeys.forEach(
					function(item, i) {
						var offset = cubicBezier[Math.ceil(glyphs.pool[item][1] * (cubicBezier.length - 1))];
						var weight = (1 + scoresData[i].score) * offset;
						adjN += weight;
						randomBins.push(weight);
					}
				);

				randomBins.forEach(function(val, i) {
					randomBins[i] = val/adjN;
				});

				var r = Math.random();
				var total = 0;
				var nextCard;
				for (i=0; i < poolSize; i++) {
					total += randomBins[i];

					if (r < total) {
						nextCard = poolKeys[i];
						currentCard = nextCard;
						break;
					}
				}

				if (flipped) {
					setTimeout(function() {setCurrentCardBack(nextCard);}, 300);
					flipCard(.15);
				} else {
					setCurrentCardBack(nextCard);
				}

				setCurrentCardFront(nextCard);

				// increment all of the offset values in glyphs and set the chosen one to 0
				poolKeys.forEach(
					function(item, i) {
						var currentOffset = glyphs.pool[item][1];
						if ( (currentOffset + 1/poolSize) > 1) {
							glyphs.pool[item][1] = 1;
						} else {
							glyphs.pool[item][1] += 1/poolSize;
						}
					}
				);

				glyphs.pool[nextCard][1] = 0;
			});
	});

}

function setCurrentCardFront(symbol) {
	front.html(glyphs.pool[symbol][0]);
}

function setCurrentCardBack(symbol) {
	$("#answer div").html(glyphs.pool[symbol][0]);
	$("#answer span").html("\""+symbol+"\"");
}


// function and support variable for handling the card flipping effect
var flipped = false;
function flipCard(speed) {
	if (!flipped) {
		flipped = true;
		setTimeout(function() {
			front.css("opacity", 0);
			back.css("opacity", 1);
		}, speed/2 * 1000);
		
		card.css("transition", speed+"s linear");
		card.css("transform", "translate(-50%, 0%) rotateY(180deg)");

	} else { 
		flipped = false; 
		setTimeout(function() {
			front.css("opacity", 1);
			back.css("opacity", 0);
		}, speed/2 * 1000);
		card.css("transition", speed+"s linear");
		card.css("transform", "translate(-50%, 0%) rotateY(0deg)");
	}
}


// functions for handling answers or skip
function incorrectCard() {
	console.log("INCORRECT ANSWER");
	updateScore(currentCard, "incorrect");
	chooseCard();
}

function correctCard() {
	console.log("CORRECT ANSWER");
	updateScore(currentCard, "correct");
	chooseCard();
}

function skipCard() {
	console.log("SKIP CARD");
	chooseCard();
}

// update the score field in the db for the specified card
// based on the call (correct or inncorrect)
function updateScore(card, call) {
	db.transaction(function(tx) {
		var callBool = call == "correct" ? 1 : 0;
		tx.executeSql("SELECT * FROM scores WHERE id=?", [card],
			function(tx, results) {
				var row = results.rows[0];
				var lastCallCorrect = row["lastCallCorrect"];
				var lastCallDelta = row["lastCallDelta"];
				var score = row["score"];
				
				lastCallDelta = (lastCallCorrect == callBool) ? lastCallDelta + 1 : 1;
				score = (callBool == 0) ? (score + lastCallDelta) : (score - lastCallDelta); 

				if (score < 0) {
					lastCallDelta = 0;
					score = 0;
				}

				tx.executeSql("UPDATE scores SET "+call+" = "+call+" + 1, score=?, lastCallDelta=?, \
								 lastCallCorrect=? WHERE id=?",[score, lastCallDelta, callBool, card], updateSetPercentages(tx));
			});
	});
}

function updateSetPercentages(tx) {
	tx.executeSql("SELECT id, correct, incorrect FROM scores", [],
		function(tx, results) {
			var setTotals = Array.apply(null, Array(glyphs.symbols.length)).map(Number.prototype.valueOf,0);
			var setCorrect = setTotals.slice();

			for (i=0; i < results.rows.length; i++) {
				var set = glyphs.setMap[results.rows[i].id];
				setCorrect[set] += results.rows[i].correct;
				setTotals[set] += (results.rows[i].correct + results.rows[i].incorrect);

			}

			setTotals.forEach(function(value, i) {
				console.log(setCorrect[i], value);
				if (value != 0) {
					$("#set"+i+"Score").html(Math.ceil(setCorrect[i]/value * 100) + "%");
				} else {
					$("#set"+i+"Score").html("");
				}
			});
		});
}