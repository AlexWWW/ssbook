if (typeof SS == 'undefined') {
	SS = {};
}

(function ($) {

SS.Superbar = function(selector, Enterbets) {
	this.jSelect = $(selector);

	this.jSelect.keydown($.proxy(this.onKeyPress, this));
	this.jSelect.keyup($.proxy(this.onKeyUp, this));
	this.jSelect.focus($.proxy(this.onFocus, this));

	this.url = SS.Cake.base + '/bets/ajax/superbar';
	this.divHeight = '300px';
	this.lastVal = '';

	this.lastRequest = null;

	this.Enterbets = Enterbets;
	this.doneLoadingBet = true;
}

$.extend(SS.Superbar.prototype, {

	getValue : function() {
		return this.jSelect.val();
	},

	onFocus : function(e) {
		if (this.doneLoadingBet) {
			this.lastVal = null;
			this.onKeyUp();
		}
	},

	onKeyUp : function(e) {
		var val = this.getValue();
		if (val != this.lastVal && this.doneLoadingBet) {
			this.request(val);
			this.lastVal = val;
		}
	},

	onKeyPress : function(e) {
		switch (e.which) {
		case 38: // Up
			this.goUp();
			e.stopPropagation();
			return false;
		case 40: // Down
			this.goDown();
			e.stopPropagation();
			return false;
		case 13: // Enter
			this.selectCurrent();
			e.stopPropagation();
			return false;
		}
	},

	getHoverLi : function() {
		if (this['dropdownDiv'] === undefined) {
			return null;
		}
		var out = this.dropdownDiv.find('.hover');
		if (out.length) {
			return out;
		} else {
			return null;
		}
	},

	selectCurrent : function () {
		var hli = this.getHoverLi();
		this.abort();

		if (hli) {
			var text = $.trim(hli.text());
			this.jSelect.val(text);
			this.lastVal = text;
			var clazzez = hli.attr('class').split(' ');
			var _this = this;

			$.each(clazzez, function (key, clazz) {
				if (!clazz.match(/scoreid_/)) {
					return false;
				}
				var scoreid = clazz.replace('scoreid_', '');
				_this.gameClick(scoreid);
			});
		} else {
			this.createGame(null);
		}
		this.hideDiv();
	},

	goUp : function() {
		var hli = this.getHoverLi();		
		if (hli) {
			hli.removeClass('hover');
			hli.prev().addClass('hover');
		} else {
			this.dropdownDiv.find('li:last').addClass('hover');
		}
	},
	
	goDown : function() {
		var hli = this.getHoverLi();		
		if (hli) {
			hli.removeClass('hover');
			hli.next().addClass('hover');
		} else {
			this.dropdownDiv.find('li:first').addClass('hover');
		}
	},

	response : function (data, textStatus) {
		if (!data) {
			return false;
		}
		if (textStatus != 'success') {
			alert('Unable to read from server please try again');
		}
		this.showDropdown(data);
	},

	showDropdown : function (data) {
		if (!data.length) {
			this.hideDiv();
			return false;
		}

		var p = this.jSelect.position();
		var h = this.jSelect.outerHeight();
		var w = this.jSelect.innerWidth();
		var l = p.left;
		var t = p.top + h;
		var _this = this;
		 
		this.createOrShowDiv(t, l, w);

		var html = '<ul>';
		$.each(data, function (key, v) {
			html += '<li class="scoreid_'+v.scoreid+'">'+v.html+'</li>';
		});
		html += '</ul>';
		this.dropdownDiv.html(html).find('li')
			.click($.proxy(this.selectCurrent, this))
			.hover(function() { $(this).addClass('hover') }, function() { $(this).removeClass('hover') });
	},

	gameClick : function (scoreid) {
		this.createGame(scoreid);
	},

	createGame : function (scoreid) {
		var data = { scoreid : scoreid };
		if (!scoreid) {
			data['text'] = this.getValue();
		}
		this.doneLoadingBet = false;
		this.Enterbets.done = $.proxy(this, 'enterbetsDone');
		this.Enterbets.add(data);
	},

	enterbetsDone : function() {
		this.doneLoadingBet = true;
	},

	createOrShowDiv : function(t, l, w) {
		if (this['dropdownDiv'] === undefined) {
			var ndiv = $('<div class="dropdown"></div>').appendTo($('body'));
			ndiv.css({
				top : t+'px',
				left : l+'px',
				width : w+'px',
				height : this.divHeight+'px'
			});
			this.dropdownDiv = ndiv;
		}
		this.dropdownDiv.css('display', 'block');		
		$(window).one('click', $.proxy(this.hideDiv, this));
	},

	hideDiv : function() {
		if (this['dropdownDiv'] !== undefined) {
			this.dropdownDiv.css('display', 'none');
		}
	},

	abort : function() {
		if (this.lastRequest) {
			this.lastRequest.abort();
		}
		this.lastRequest = null;
	},

	request : function(val) {
		this.abort();

		if (val.length >= 2) {
			this.lastRequest = $.getJSON(this.url, {text : val}, $.proxy(this.response, this));
		} else {
			this.hideDiv();
		}
	}

});

SS.Enterbets = function(selector) {
	this.jSelect = $(selector);
	this.jBets = null;
	this.url = SS.Cake.base + '/bets/createbets';
	this.ajaxUrl = SS.Cake.base + '/bets/ajax/getbet';
	this.idenNumber = 0;
}

SS.Enterbets.TYPES = [
	{name:'total',desc:"Total",show:'Total'},
	{name:'spread',desc:"Spread",show:'Spread'}
];

$.extend(SS.Enterbets.prototype, {

	render : function() {
		this.jSelect.html("<form action='"+this.url+"' method='post'><div class='bets'><h1>Bets</h1></div><div class='record'><input type='submit' /></div>");
		var _this = this;
		this.jSelect.ready(function() {
			_this.jBets = _this.jSelect.find('.bets');
			_this.jSelect.find('form').submit($.proxy(_this.onSubmit, _this));
		});
	},

	onSubmit : function () {
		//console.debug('currently submitting');
	},

	/**
         * Adding a bet with {scoreid, [text]}
         */
	add : function (data) {
		var _this = this;
		$.getJSON(this.ajaxUrl, data, function(data) {
			_this.done();
			if (data) {
				_this.show(data);
			}
		});
	},

	done : function() {},

	/**
	 * @param <string> iden Identifier "SS[scoreid]" "incremental"
	 */
	renderBet : function (home, visitor, datetime, type, iden) {
		var h = '<td><select class="type" name="type['+iden+']">';
		$.each(SS.Enterbets.TYPES, function (key, val) {
			h += '<option value="'+val.name+'"';
			if (val.name == type) {
				h += ' selected="selected"';
			}
			h += '>'+val.desc+'</option>';
		});
		h += '</select></td>';
		h += '<td class="direction">&nbsp;</td>';

		h += '<td><input type="text" class="spread" name="spread['+iden+']" /></td>';
		h += '<td><input type="text" class="risk" name="risk['+iden+']" /></td>';
		h += '<td><input type="text" class="odds" name="odds['+iden+']" /></td>';
		h += '<td><input type="text" class="towin" name="towin['+iden+']" /></td>';
		var ttl = '<tr><td colspan="2">Type</td><td class="type_header">&nbsp;</td><td>Risk</td><td>Odds</td><td>To Win</td>';

		var datestr = datetime.toString('M/d/yy h:mm tt');
		var je = $('<div class="bet"><table><tr><td colspan="6">'+visitor+' @ '+home+' '+datestr+'</td></tr>'+ttl+'<tr>'+h+'</tr></table></div>');
		return je;
	},

	spreadChange : function(bet, val) {
		//console.debug('spreadChange', bet, val);
	},

	calcRisk : function(win, odds) {
		if(odds == 0)
			return;

		if(odds > 0) {
			return win*100/odds;
		} else {
			return win/-100*odds;
		}
	},
	
	calcWin : function (risk, odds) {
		if(odds == 0)
			return;

		if(odds > 0) {
			return risk*odds/100;
		} else {
			return risk/odds*-100;
		}
	},

	oddsChange : function(bet, val) {
		var odds = parseInt(bet.find('.odds').val());
		if (odds == 0 || odds == NaN) {
			return;
		}
		if (odds > 0) {
			this.riskChange(bet, val);
		} else {
			this.towinChange(bet, val);
		}
	},

	riskChange : function(bet,val ) {
		var risk = parseInt(bet.find('.risk').val());
		var odds = parseInt(bet.find('.odds').val());
		if (!(isNaN(risk) || isNaN(odds)) && risk > 0 && odds != 0) {
			bet.find('.towin').val(this.calcWin(risk, odds));
		}
	},
	
	towinChange : function(bet, val) {
		var towin = parseInt(bet.find('.towin').val());
		var odds = parseInt(bet.find('.odds').val());
		if (!(isNaN(towin) || isNaN(odds)) && towin > 0 && odds != 0) {
			bet.find('.risk').val(this.calcRisk(towin, odds));
		}
	},
	
	typeChange : function(bet, type, data, iden) {
		var _this = this;
		var dir = bet.find('.direction select').val();
		$.each(SS.Enterbets.TYPES, function (key, val) {
			if (val.name == type) {
				bet.find('.type_header').text(val.show);
				return false;
			} 
		});
		// Set the other stuff
		var odd = null;
		$.each(data.odds, function (key, val) {
			if (val.type == type) {
				odd = val;
				return false;
			}
		});
		var h = '<select name="direction['+iden+']">';
		var hsel = '';
		var vsel = '';
		if (!dir) {
			dir = 'home';
			if (type == 'total') {
				dir = 'over';
			}
		}
		if (dir == 'over' || dir == 'home') {
			hsel = 'selected="selected"';
		} else {
			vsel = 'selected="selected"';
		}
		if (type == 'spread') {
			h += '<option '+hsel+' value="home">Home</option><option '+vsel+' value="visitor">Visitor</option>';
		} else {
			h += '<option '+hsel+' value="over">Over</option><option '+vsel+' value="under">Under</option>';
		}
		h += '</select>';
		var setodd = function() {
			var newdir = bet.find('.direction select').val();
			_this.setOdd(bet, odd, type, newdir);
		}
		bet.find('.direction').html(h).change(setodd).ready(function() {
			setodd(bet, odd, dir);
		});
	},
	
	setOdd : function (bet, odd, type, dir) {
		if (odd) {
			//console.debug('odd', odd);
			switch(type) {
			case 'spread':
				if (dir == 'home') {
					bet.find('.spread').val(odd.spread_home);
					bet.find('.odds').val(odd.odds_home);
				} else {
					bet.find('.spread').val(odd.spread_visitor);
					bet.find('.odds').val(odd.odds_visitor);
				}
				break;
			case 'total':
				if (dir == 'over') {
					bet.find('.spread').val(odd.total);
					bet.find('.odds').val(odd.odds_home);
				} else {
					bet.find('.spread').val(odd.total);
					bet.find('.odds').val(odd.odds_visitor);
				}
				break;
			}
		}
	},

	setupEvents : function(bet, data, iden) {
		var _this = this;
		bet.find('.spread').keyup(function() { _this.spreadChange(bet, bet.find('.spread').val()); });
		bet.find('.risk').keyup(function() { _this.riskChange(bet, bet.find('.risk').val()); });
		bet.find('.odds').keyup(function() { _this.oddsChange(bet, bet.find('.odds').val()); });
		bet.find('.towin').keyup(function() { _this.towinChange(bet, bet.find('.towin').val()); });

		var typeC = function() { _this.typeChange(bet, bet.find('.type').val(), data, iden); };
		bet.find('.type').change(typeC);
		typeC();
	},
	
	show : function (data) {
		var num = this.idenNumber++;
		var iden = 'SS'+data.scoreid+'_'+num;
		var bet = this.renderBet(data.home, data.visitor, new Date(data.game_date), data.type, iden);
		var _this = this;
		this.jBets.append(bet).ready(function() {
			bet.find('.spread').focus();
			_this.setupEvents(bet, data, iden);
		});
	}

});

$(function() {
	var enterbets = new SS.Enterbets('#enterbets');
	enterbets.render();
	var superbar = new SS.Superbar('#superbar', enterbets);
});

})(jQuery);
