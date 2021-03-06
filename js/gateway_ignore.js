var ignoreData = {
	'full': {
		'channel': [],
		'query': []
	},
	'wildcard': {
		'channel': [],
		'query': []
	}
};

var ignore = {
	'ignoring': function(nick, type, dontProcessWildcard) {
		if(nick.isInList(servicesNicks)){
			return false;
		}
		if($.inArray(nick, ignoreData.full[type]) >= 0){
			return true;
		}
		if(dontProcessWildcard){
			if($.inArray($$.wildcardToRegex(nick), ignoreData.wildcard[type]) >= 0){
				return true;
			}
		} else {
			for(var i = 0; i < ignoreData.wildcard[type].length; i++){
				var regex = ignoreData.wildcard[type][i];
				console.log(nick);
				console.log(regex);
				if(nick.match(new RegExp(regex))){
					return true;
				}
			}
		}
		return false;
	},
	'getIgnoreList': function() {
		var data = [];
		for(var i=0; i < ignoreData.full.channel.length; i++){
			data.push(['channel', ignoreData.full.channel[i]]);
		}
		for(var i=0; i < ignoreData.full.query.length; i++){
			data.push(['query', ignoreData.full.query[i]]);
		}
		for(var i=0; i < ignoreData.wildcard.channel.length; i++){
			data.push(['channel', $$.regexToWildcard(ignoreData.wildcard.channel[i])]);
		}
		for(var i=0; i < ignoreData.wildcard.query.length; i++){
			data.push(['query', $$.regexToWildcard(ignoreData.wildcard.query[i])]);
		}
		return data;
	},
	'showIgnoreManagement': function() {
		var data = ignore.getIgnoreList();
		if($$.getDialogSelector('ignore', 'ignorelist').length != 0){
			$$.closeDialog('ignore', 'ignorelist');
		}
		if(data.length == 0){
			var html = 'Lista jest pusta.';
		} else {
			var html = '<div class="beIListContents"><table><tr><th>Dotyczy</th><th>Maska</th></tr></table></div>';
		}
		$$.displayDialog('ignore', 'ignorelist', 'Lista ignorowanych użytkowników', html);
		for(var i=0; i<data.length; i++){
			var ignoreT = data[i][0];
			if(ignoreT == 'channel'){
				var ignoreType = 'kanał';
			} else {
				var ignoreType = 'rozmowa prywatna';
			}
			var ignoreMask = data[i][1];
			
			var html = '<tr><td>'+ignoreType+'</td><td>'+he(ignoreMask)+'</td>' +
				'<td><button id="unignore_'+ignoreT+'_'+md5(ignoreMask)+'">Usuń</button>' +
				'</td></tr>';
			$('table', $$.getDialogSelector('ignore', 'ignorelist')).append(html);
			$('#unignore_'+ignoreT+'_'+md5(ignoreMask)).click({type: ignoreT, mask: ignoreMask}, function(e){
				ignore.unIgnore(e.data.type, e.data.mask);
				ignore.showIgnoreManagement();
			});
		}
		var html = '<hr style="margin-top:5px;margin-bottom:5px;"><strong>Dodaj wpis do listy</strong><br>'+
			'<p><input type="text" id="new_ignore_mask"></p>' +
			'<p><input type="checkbox" id="new_ignore_query"> Wiadomości prywatne<br><input type="checkbox" id="new_ignore_channel"> Wiadomości na kanale</p>' +
			'<p><input type="button" value="Dodaj" onclick="ignore.ignoreClickInput();"></p>';
		$$.getDialogSelector('ignore', 'ignorelist').append(html);
	},
	'unIgnore': function(type, mask){
		ignore.changeIgnoreList(type, mask, false);
	},
	'changeIgnoreList': function(type, mask, add) {
		var wildcard = false;
		if(mask.indexOf('?') >= 0 || mask.indexOf('*') >= 0){
			var wildcard = true;
			var regex = $$.wildcardToRegex(mask);
		}
		try {
			if(add){
				if(ignore.ignoring(mask, type, true)){
					return; //już jest
				}
				if(wildcard){
					ignoreData.wildcard[type].push(regex);
				} else {
					ignoreData.full[type].push(mask);
				}
				if(type == 'channel'){
					var pattern = messagePatterns.channelIgnoreAdded;
				} else {
					var pattern = messagePatterns.queryIgnoreAdded;
				}
			} else {
				if(!ignore.ignoring(mask, type, true)){
					return; //nie ma czego usuwać
				}
				//try {
					if(wildcard){
						ignoreData.wildcard[type].splice(ignoreData.wildcard[type].indexOf(regex), 1);
					} else {
						ignoreData.full[type].splice(ignoreData.full[type].indexOf(mask), 1);
					}
			//	} catch (e) {
			//	}
				if(type == 'channel'){
					var pattern = messagePatterns.channelIgnoreRemoved;
				} else {
					var pattern = messagePatterns.queryIgnoreRemoved;
				}
			}
			gateway.statusWindow.appendMessage(pattern, [$$.niceTime(), he(mask)]);
			gateway.statusWindow.markBold();
			localStorage.setItem('ignore', JSON.stringify(ignoreData));
		} catch(e){
			$$.displayDialog('error', 'ignore', 'Błąd', 'Operacja nieudana.');
		}
	},
	'ignoreClickInput': function() {
		var channel = $('#new_ignore_channel').prop('checked');
		var query = $('#new_ignore_query').prop('checked');
		var mask = $('#new_ignore_mask').val();
		if(mask.length == 0){
			$$.alert('Nie wpisano maski!');
			return;
		}
		if(mask.indexOf(' ') > -1){
			$$.alert('Maska nie może zawierać spacji!');
			return;
		}
		if(!channel && !query){
			$$.alert('Nie zaznaczono ani kanału ani query!');
			return;
		}
		if(channel && mask == '*'){
			$$.alert('Nie możesz ignorować wszystkich nicków na kanałach!');
			return;
		}
		if(channel){
			ignore.changeIgnoreList('channel', mask, true);
		}
		if(query){
			ignore.changeIgnoreList('query', mask, true);
		}
		ignore.showIgnoreManagement();
	},
	'ignoreClick': function(nick) {
		ignore.changeIgnoreList('query', nick, $('#'+nick+'_ignore_query').prop('checked'));
		ignore.changeIgnoreList('channel', nick, $('#'+nick+'_ignore_channel').prop('checked'));
	},
	'askIgnore': function(nick) {
		if(nick.isInList(servicesNicks)){
			$$.displayDialog('error', 'ignore', 'Błąd', 'Nie możesz ignorować usługi sieciowej!', 'OK');
			return;
		}
		var chanExplIgnored = ignore.ignoring(nick, 'channel', true);
		var queryExplIgnored = ignore.ignoring(nick, 'query', true);
		var ignoredByWildcard = false;
		if(!chanExplIgnored && !queryExplIgnored){
			if(ignore.ignoring(nick, 'channel') || ignore.ignoring(nick, 'query')){
				ignoredByWildcard = true;
			}
		}
		var html =
			'<p><input type="checkbox" id="'+nick+'_ignore_query"> Ignoruj wiadomości prywatne</p>' +
			'<p><input type="checkbox" id="'+nick+'_ignore_channel"> Ignoruj wiadomości na kanałach</p>';
		if(ignoredByWildcard){
			html += '<p>Ten użytkownik jest ignorowany za pomocą reguł ogólnych.</p>';
		}
		html += '<p><a href="javascript:ignore.showIgnoreManagement();">Zarządzaj ignorowanymi nickami</a></p>';
		var button = [
			{
				text: 'Anuluj',
				click: function(){
					$(this).dialog('close');
				}
			},
			{
				text: 'Zastosuj',
				click: function(){
					ignore.ignoreClick(nick);
					$(this).dialog('close');
				}
			}
		];
		$$.displayDialog('ignore', 'ignore', 'Ignoruj użytkownika '+nick, html, button);
		if(chanExplIgnored){
			$('#'+nick+'_ignore_channel').prop('checked', true);
		}
		if(queryExplIgnored){
			$('#'+nick+'_ignore_query').prop('checked', true);
		}
	}
}

