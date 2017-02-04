var mcolors = {
};

var mcolor = false;

var mcolorJoinHandler = function(msg){
	if(msg.sender.nick.toLowerCase() == guser.nick.toLowerCase() || !colorsAllowed(msg.text)){
		return;
	}
	if(mcolor){
		var color = mcolor;
	} else {
		return;
	}
	gateway.ctcp(msg.sender.nick, 'MCOL '+color);
}

var mcolorChModeHandler = function(msg){
	if(!colorsAllowed(msg.args[1])){
		return;
	}
	if(mcolor){
		var color = mcolor;
	} else {
		return;
	}
	gateway.ctcp(msg.args[1], 'MCOL '+color);
}

var mcolorNickHandler = function(msg){
	var index = md5(msg.sender.nick.toLowerCase());
	var color = mcolors[index];
	if(color){
		delete mcolors[index];
		mcolors[md5(msg.text.toLowerCase())] = color;
	}
}

var isCorrectColor = function(color){
	if(color.match(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/)){
		return true;
	}
	return false;
}

var mcolorCtcpHandler = function(msg){
	if(msg.ctptext == 'OFF'){
		delete mcolors[md5(msg.sender.nick.toLowerCase())];
		return;
	}
	if(!isCorrectColor(msg.ctcptext)){
		console.log(msg.sender.nick+' sent bad color code: '+msg.ctcptext);
		return;
	}
	mcolors[md5(msg.sender.nick.toLowerCase())] = msg.ctcptext;
	console.log('Color set for '+msg.sender.nick+': '+msg.ctcptext);
}

var setMyColor = function(color){
	if(!color){
		if(!mcolor) return;
		mcolor = false;
		var scolor = 'OFF';
		$('#nickColorPick').val('#000000');
	} else {
		if(color == mcolor){
		//	$$.displayDialog('info', 'info', 'Info', '<p>Kod koloru '+he(color)+' taki jak poprzedni - nie zmieniono!</p>');
			return;
		}
		if(isCorrectColor(color)){
			mcolor = color;
		//	$$.displayDialog('info', 'info', 'Info', '<p>Ustawiono kolor na <span style="color:'+mcolor+'">'+mcolor+'</span></p>');
		} else {
			$$.displayDialog('info', 'info', 'Info', '<p>Niepoprawny kod koloru '+he(color)+'</p>');
			return;
		}
		var scolor = mcolor;
	}
	for(c in gateway.channels){
		gateway.ctcp(gateway.channels[c].name, 'MCOL '+scolor);
	}
	try {
		if(mcolor){
			localStorage.setItem('mcolor', mcolor);
		} else {
			localStorage.removeItem('mcolor');
		}
	} catch(e){}
}

var colorsAllowed = function(chan){
	if(!chan){
		return true;
	}
	if(typeof chan == 'string'){
		chan = gateway.findChannel(chan);
		if(!chan){
			return true;
		}
	}
	if(chan.modes.S || chan.modes.c || chan.modes.T || chan.modes.C){
		return false;
	}
	return true;		
}

var colorMessage = function(src, dst, text){
	if(dst.charAt(0) == '#'){
		var chan = gateway.findChannel(dst);
	} else if(src.charAt(0) == '#'){
		var chan = gateway.findChannel(src);
	}
	if(!colorsAllowed(chan)){
		return text;
	}
	if(src == guser.nick){
		var color = mcolor;
	} else {
		var color = mcolors[md5(src.toLowerCase())];
	}
	if(color){
		text = '<span style="color:'+color+'">'+text+'</span>';
	}
	return text;
}

var insertBinding = function(list, item, handler){
	if(list[item]){
		list[item].push(handler);
	} else {
		list[item] = [ handler ];
	}
}

insertBinding(cmdBinds, 'JOIN', mcolorJoinHandler);
insertBinding(ctcpBinds, 'MCOL', mcolorCtcpHandler);
insertBinding(cmdBinds, '324', mcolorChModeHandler);
insertBinding(cmdBinds, 'NICK', mcolorNickHandler);
messageProcessors.push(colorMessage);
commands['mycolor'] = {
	'channels': false,
	'nicks': false,
	'custom': [],
	'callback': function(command, input) {
		if(command[1]) {
			setMyColor(command[1]);
		} else {
			gateway.notEnoughParams("mycolor", "musisz podać kod koloru html");
		}
	}
};

var mcolorInit = function(){
	try {
		var ls = localStorage.getItem('mcolor')
		if(ls){
			mcolor = ls;
		}
	} catch(e){}
	$('#color-dialog h3').append(' (tymczasowo)');
	var html = '<h3>Ustaw kolor swojego tekstu (na stałe)</h3><p>Wybierz kolor: <input type="color" id="nickColorPick"></p>' +
		'<p><button id="clearNickColor">Skasuj kolor</button></p>';
	$('#color-dialog').append(html);
	$('#nickColorPick').change(function(){
		/*if($('#nickColorPick').val() != mcolor){
			$('#nickColorInfo').text('Kliknij "Zatwierdź" aby zmienić');
		} else {
			$('#nickColorInfo').text(' ');
		}*/
		setMyColor($('#nickColorPick').val());
	});
/*	$('#setNickColor').click(function(){
		setMyColor($('#nickColorPick').val());
	});*/
	$('#clearNickColor').click(function(){
		setMyColor(false);
		$('#nickColorPick').val('#000000');
	});
	if(mcolor){
		$('#nickColorPick').val(mcolor);
	}
	/*$('#nickColorPick').on('input', function(){
		setMyColor($('#nickColorPick').val());
	});*/
}

readyFunctions.push(mcolorInit);

addons.push('mcolor');
