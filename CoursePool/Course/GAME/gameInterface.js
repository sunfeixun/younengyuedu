let ShiZiYouXi;

(function() {
	let p = new createjs.EventDispatcher();

	let path = courseGetter.gamePath;
	let loader = new Lib.loader;

	loader.add(['public.json','public.png'],path + 'publicAsset/');

	courseGetter.game = p;

	p.loadGame = function(){
		
	}

	ShiZiYouXi = p;
})();