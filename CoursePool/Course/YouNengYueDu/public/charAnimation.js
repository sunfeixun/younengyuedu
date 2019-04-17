let charAnimation;

(function() {
	let charPath = '';
	let jsonFile = 'info.json';
	let charPool = [];
	let width = 1280, height = 720;
	let charPoolByKey = {};
	let id = -1;
	let pausedPool = [];
	let flashRepeat = 2, flashDelay = 1, flashDuration = 1;
	let shiftx = 0, shifty = 0;
	
	function charAni(char,word){
		this.Container_constructor();
		this.custom = {};
		this.custom.char = char;
		this.custom.state = 'ready';
		this.custom.fullPath = '';
		this.custom.code = char.charCodeAt(0).toString();
		this.custom.readFinish = false;
		this.custom.animateFinish = false;
		this.custom.word = new createjs.Text(word,'35px Kaiti','black').set({x:800+shiftx,y:435+shifty});
		this.custom.charText = new createjs.Text(char,'200px Kaiti','black').set({x:800+shiftx,y:185+shifty});
		this.custom.once = undefined;
		this.custom.pic = undefined;
		this.custom.txt = undefined;

		// this.loadResource();
		charPool.push(this);	//用于顺序加载
		charPoolByKey['a'+ this.custom.code] = this;	//用于getByChar
	}

	charAni.shiftPosition = function(x,y){
		shiftx = x;
		shifty = y;
	}

	charAni.setCharPath = function(path){
		charPath = path;
	}

	charAni.getCharPool = function(){
		return charPool;
	}

	charAni.loadByOrder = function(){
		for(let i=0;i<charPool.length;i++){
			charPool[i].on('buildup',orderLoad,null,true);
		}

		orderLoad();
	}

	charAni.pirorLoad = function(char){
		for(let i=0;i<charPool.length;i++){
			charPool[i].pauseLoad();
		}

		charAni.getByChar(char).resumeLoad();
	}

	charAni.getByChar = function(char){
		let str = 'a'+char.charCodeAt(0).toString();
		return charPoolByKey[str];
	}

	function orderLoad(){
		let _c;
		for(let i=0;i<charPool.length;i++){
			_c = charPool[i];

			if(_c.custom.state==='ready'){
				_c.loadResource();
				break;
			}else if(_c.custom.state==='loading'){
				_c.resumeLoad();
				break;
			}
		}
	}

	let p = createjs.extend(charAni,createjs.Container);

	p.loadResource = function(){
		this.custom.fullPath = charPath + this.custom.char.charCodeAt(0).toString() + '/';
		let jsonloader = new createjs.JSONLoader(this.custom.fullPath + jsonFile);
		jsonloader.on('complete',p.handleJson,this);
		jsonloader.load();
	}

	p.handleJson = function(e){
		this.custom.state = 'loading';
		this.custom.sheetInfo = e.target.getResult();
		this.custom.sheetInfo.framerate = 24;

		let imgLoader = new Lib.loader(false);
		imgLoader.addLoadProgress(null,this).set({x:width/2,y:height/2 - 50});
		imgLoader.on('handlecomplete',complete,this);
		imgLoader.on('error',function(e){log(e)});
		imgLoader.on('fileerror',function(e){log(e)});
		imgLoader.add(this.custom.sheetInfo.images,this.custom.fullPath);
		imgLoader.add([{src:'read.mp3',id:'read'+this.custom.code},{src:'single.mp3',id:'single'+this.custom.code}],this.custom.fullPath);
		imgLoader.Load();
		this.custom.mainloader = imgLoader;

		function complete(){
			this.custom.state = 'finish';
			this.dispatchEvent('buildup');
			
			//创建动画，播放一次动画：'once'，单帧动画: 'pic'和'txt'用于字卡闪烁
			let sprites = imgLoader.getSprite(this.custom.sheetInfo,true,{x:width/2 + shiftx,y:height/2 + shifty});
			let once = sprites.once, pic = sprites.pic, txt = sprites.txt;
			let single = createjs.Sound.play('single'+this.custom.code).stop();

			this.custom.once = once;
			this.custom.pic = pic;
			this.custom.txt = txt;
			this.custom.read = createjs.Sound.play('read'+this.custom.code).stop();
			this.custom.single = single;
			this.addChild(this.custom.word,this.custom.charText);

			this.custom.read.on('complete',function(){
				this.custom.readFinish = true;
				this.flashText();
			},this);

			this.custom.once.on('animationend',function(e){
				if(e.name==='once'){
					this.custom.animateFinish = true;
					this.flashText();
				}
			},this);

			this.custom.flashTween = new TimelineLite;
			this.custom.flashTween.to(once,flashDuration,{alpha:0});

			for(let i=0;i<flashRepeat;i++){
				this.custom.flashTween.call(readSingle).to(pic,flashDuration,{alpha:1})
									.to(pic,flashDuration,{alpha:0,delay:flashDelay})
									.call(readSingle).to(txt,flashDuration,{alpha:1});

				i<flashRepeat-1 && this.custom.flashTween.to(txt,flashDuration,{alpha:0,delay:flashDelay});
			}

			this.custom.flashTween.pause();

			function readSingle(){single.play();}

			this.addChild(sprites.once,sprites.pic,sprites.txt);

			this.on('added',p.replay,this);
			this.on('removed',p.pauseAll,this);

			this.stage && this.replay();

			delete this.custom.mainloader;
		}
	}

	p.pauseLoad = function(){
		if(this.custom.state === 'loading'){
			this.custom.mainloader.setPaused(true);
		}
	}

	p.resumeLoad = function(){
		if(this.custom.state==='ready'){
			this.loadResource();
		}else if(this.custom.state==='loading'){
			this.custom.mainloader.setPaused(false);
		}
	}

	p.flashText = function(){
		if(!this.custom.readFinish || !this.custom.animateFinish) return;
		this.custom.flashTween.restart();
	}

	p.replay = function(){
		this.custom.readFinish = false;
		this.custom.animateFinish = false;

		this.custom.txt.alpha = 0;
		this.custom.pic.alpha = 0;

		this.custom.once.alpha = 1;
		this.custom.once.gotoAndPlay('once');
		this.custom.read.position = 0;
		this.custom.read.play();

		this.custom.flashTween.seek(0);
		this.custom.flashTween.stop();
	}

	p.pauseAll = function(){
		this.custom.flashTween.pause();
		this.custom.once.stop();
		this.custom.read.paused = true;
	}

	p.getState = function(){
		return this.custom.state;
	}

	p.getChar = function(){
		return this.custom.char;
	}

	charAnimation = createjs.promote(charAni,'Container');
})();