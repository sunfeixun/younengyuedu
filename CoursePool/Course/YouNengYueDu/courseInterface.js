let YouNengYueDu;
let projectData = {width:1280,height:720}

if(courseGetter){
	courseGetter.addPlugin({Lib:'myLib.js',TweenLite:'TweenMax.min.js'},courseGetter.libPath);
	courseGetter.addPlugin({ShiZiYouXi:'gameInterface.js'},courseGetter.gamePath);
	courseGetter.addPlugin({charAnimation:'charAnimation.js'},courseGetter.courseClass+'public/')
}

(function() {
	let p = new createjs.EventDispatcher();

	let Part1, Part2, Part3, Part4;// 将4部分封装成构造函数
	let currentPart;
	let mainLoader = new Lib.loader, mainJsonLoader = new Lib.loader;

	// 需要在courseGetter中配置的路径， courseClass, gamePath, charPath
	let publicPath = courseGetter.courseClass + 'public/';
	let charPath = courseGetter.charPath;
	let gamePath = courseGetter.gamePath

	p.part1 = null;
	p.part2 = null;
	p.part3 = null;
	p.part4 = null;
	p.loader = mainLoader;
	p.shower = new createjs.Container;

	p.loadLesson = function(_lvl,_cls,_lesson){
		let path = courseGetter.courseClass + 'course/LEVEL' + _lvl + '/CLASS' + _cls + '/LESSON' + _lesson + '/';

		p.part1 = new Part1(path).addJSON(mainJsonLoader);
		p.part2 = new Part2(path).addJSON(mainJsonLoader);
		p.part3 = new Part3(path).addJSON(mainJsonLoader);
		p.part4 = null;

		mainJsonLoader.on('handlecomplete',function(){
			p.part1.addResource(mainLoader);
			p.part2.addResource(mainLoader);

			mainLoader.Load();
		}); // JSON文件加载完后，开始加载资源文件

		mainLoader.on('handlecomplete',function(){
			p.part1.build();
			p.part2.build();
			p.part3.quietBuild(charPath);
			p.dispatchEvent('loadup');
		})

		mainJsonLoader.Load();
	}

	p.goPart = function(part){
		part = p['part'+part];
		if(!part || currentPart===part) return;
		if(currentPart){
			p.shower.removeChild(currentPart);
		}

		currentPart = p.shower.addChild(part);
		return part;
	}

	p.currentPart = function(){
		return currentPart;
	}

	p.currentSubPart = function(){
		if(!currentPart) return;
		return currentPart.custom._subPart;
	}

	p.goSubPart = function(n){
		if(!currentPart) return;
		return currentPart.goSubPart(n);
	}

	YouNengYueDu = p;
	courseGetter.regManager(p);

	function onPartRemove(e){
		e.target.removeAllChildren();
		e.target.custom._subPart = undefined;
		typeof(e.target.custom.onRemove)==='function' && e.target.custom.onRemove();
	}

	// 优能阅读,PART1
	(function() {
		let readingAudio = 'reading.mp3';
		let duration = 0.5;
		let jsonID = 'part1';

		function part1(path){
			this.Container_constructor();
			this.custom = {};
			this.custom.reading = null;
			this.custom.path = path + 'PART1/';
			this.custom.partid = null;
			let p1, p2;

			p1 = {
				shower:new createjs.Container,
				timeline:new TimelineLite,
				totalImage:null,
				currentImage:1,
				hasNext:true,
				next:function(){
					if(this.timeline.isActive()) return;
					if(p1.currentImage<p1.totalImage){
						p1.currentImage ++;
						p1.timeline.play();						
					}

					if(p1.currentImage===p1.totalImage) return 'end';
				},
				prev:function(){
					if(this.timeline.isActive()) return;
					if(p1.currentImage>1){
						p1.currentImage --;
						p1.timeline.reverse();
					}

					if(p1.currentImage===1) return 'start';
				},
				position:function(){
					if(p1.currentImage===1) return 'start';
					if(p1.currentImage===p1.totalImage) return 'end';
					return p1.currentImage;
				},
				onAdded:function(){
					p1.timeline.seek(0).play();
					p1.currentImage = 1;
				}
			};

			p1.shower.on('added',p1.onAdded);
			this.custom.p1 = this.custom.p3 = p1;

			p2 = {
				shower:new createjs.Container,
				timeline:new TimelineLite,
				reading:null,
				onAdded:function(){
					p2.timeline.seek(0).play();
					p2.reading && p2.reading.play();
				},
				onRemove:function(){
					p2.timeline.stop();
					p2.reading && p2.reading.stop();
				},
				pause:function(){
					p2.timeline.pause();
					p2.reading.paused = true;
				},
				play:function(){
					p2.timeline.play();
					p2.reading.paused = false;
				}
			}

			p2.shower.on('added',p2.onAdded);
			p2.shower.on('removed',p2.onRemove);
			this.custom.p2 = p2;
			this.on('removed',onPartRemove);
		}

		let _p = createjs.extend(part1,createjs.Container);

		_p.goSubPart = function(_part){
			let id = _part;
			_part = this.custom['p'+_part];
			if(!_part || id === this.custom.partid) return;

			this.removeAllChildren();
			this.addChild(_part.shower);
			this.custom._subPart = _part;
			this.custom.partid = id;
			return _part;
		}

		_p.addJSON = function(loader){
			loader.add({src:this.custom.path + 'info.json',id:jsonID});
			this.custom.jsonloader = loader;
			return this;
		}

		_p.addResource = function(loader){
			let info = this.custom.jsonloader.getResult(jsonID);
			let loadList = [];

			loadList.push(readingAudio);
			for(let i=1;i<=info.imgcount;i++){
				loadList.push(i.toString()+'.jpg');
			}

			loader.add(loadList,this.custom.path);
			this.custom.resourceloader = loader;
		}

		_p.build = function(){
			let img1,img2;
			let p1 = this.custom.p1, p2 = this.custom.p2;
			let data = this.custom.jsonloader.getResult(jsonID);
			let loader = this.custom.resourceloader;
			let sync = data.sync;

			delete this.custom.jsonloader;
			delete this.custom.resourceloader;

			p2.reading = createjs.Sound.play(readingAudio);
			p2.reading.stop();

			p1.totalImage = data.imgcount;
			for(let i=1;i<=data.imgcount;i++){
				img1 = loader.getImage(i+'.jpg');
				img2 = loader.getImage(i+'.jpg');
				p1.shower.addChild(img1);
				p2.shower.addChild(img2);

				p1.timeline.from(img1,duration,{alpha:0}).addPause();
				p2.timeline.from(img2,duration,{alpha:0},sync[i-1]);
			}
		}

		Part1 = createjs.promote(part1,'Container');
	})();

	// 能力提升,PART2

	(function() {
		let jsonID = 'part2';
		let ansewrImagePosition = [
			{scale:0.5,pos:[[640,400]]},
			{scale:0.35,pos:[[350,400],[930,400]]},
			{scale:0.3,pos:[[350,230],[930,230],[640,500]]},
			{scale:0.3,pos:[[350,280],[930,280],[350,550],[930,550]]},
			{scale:0.25,pos:[[460,280],[820,280],[280,500],[640,500],[1000,500]]},
			{scale:0.25,pos:[[280,280],[640,280],[1000,280],[280,500],[640,500],[1000,500]]}
		];

		let textTop = 70;
		let maxTextWidth = 950;

		function part2(path){
			this.Container_constructor();
			this.custom = {};
			this.custom.path = path + 'PART2/';
			this.on('removed',onPartRemove);
		}

		let _p = createjs.extend(part2,createjs.Container);

		_p.goSubPart = function(_part){
			_part = this.custom['p'+_part];
			if(!_part) return;

			this.removeAllChildren();
			this.addChild(_part.shower);
			this.custom._subPart = _part;
			return _part;
		}

		_p.addJSON = function(loader){
			loader.add({src:this.custom.path + 'info.json',id:jsonID});
			this.custom.jsonloader = loader;
			return this;
		}

		_p.addResource = function(loader){
			this.custom.resourceloader = loader;
			let info = this.custom.jsonloader.getResult(jsonID);
			let subpart1 = info.subpart1;
			let loadList = [];

			loadList.push('zongjie.mp3','yanshen.mp3');

			for(let i=0;i<subpart1.length;i++){
				subpart1[i].audio = subpart1[i].audio.indexOf('.')===-1? subpart1[i].audio + '.mp3':subpart1[i].audio;
				subpart1[i].audio && loadList.push(subpart1[i].audio);
			}

			this.custom.info = info;
			loader.add(['PUBLICIMAGE.json','PUBLICIMAGE.png'],publicPath);
			loader.add(loadList,this.custom.path);
		}

		_p.build = function(){
			let p1, p2, p3;
			let info = this.custom.info;
			let resourceloader = this.custom.resourceloader;
			let sprite = resourceloader.getSprite('PUBLICIMAGE',true);

			delete this.custom.resourceloader;
			delete this.custom.jsonloader;

			this.custom.p1 = buildP1();
			this.custom.p2 = buildP2();
			this.custom.p3 = buildP3();

			function onRemove(){
				this.readAudio && this.readAudio.stop();
			}

			function buildP1(){
				let listen, tip;
				let _txt;
				let listenX = 35, txtX = 70 ,marginY = 50, tipX = 40;
				let txtbound = {y:0,height:0};
				let ansImg, autoPos, ansTxt;
				let _info1 = info.subpart1;

				let p1 = {
					shower:new createjs.Container,
					readAudio:undefined,
					questionContainer: new createjs.Container,
					// answerContainer: new createjs.Container,
					questions: new Array().concat(_info1),
					showingAnswer:undefined,
					closeAnswerButton:sprite.close.clone().set({x:640,y:650}),
					read:function(e){
						p1.readAudio && p1.readAudio.stop();
						p1.readAudio = createjs.Sound.play(e.target._audioname);
					},
					showanswer:function(e){
						p1.shower.removeChild(p1.questionContainer);
						p1.showingAnswer = e.target.contentContainer;
						p1.shower.addChild(p1.showingAnswer,p1.closeAnswerButton);
					},
					closeAnswer:function(){
						p1.shower.removeChild(p1.showingAnswer,p1.closeAnswerButton);
						p1.shower.addChild(p1.questionContainer);
						p1.showingAnswer = undefined;
					},
					onAdded:function(){
						p1.shower.removeAllChildren();
						p1.shower.addChild(p1.questionContainer);
					}
				}

				p1.shower.on('removed',onRemove,p1);
				p1.shower.on('added',p1.onAdded);
				p1.closeAnswerButton.on('click',p1.closeAnswer);
				p1.closeAnswerButton.cursor = 'pointer';

				let listenContainer = p1.questionContainer.addChild(new createjs.Container);
				let tipContainer = p1.questionContainer.addChild(new createjs.Container);

				listenContainer.cursor = tipContainer.cursor = 'pointer';
				listenContainer.on('click',p1.read);
				tipContainer.on('click',p1.showanswer);

				for(let i=0;i<p1.questions.length;i++){
					_txt = new p.text();
					_txt.text = p1.questions[i].text;
					_txt.warpText(1020);
					_txt.x = txtX;
					_txt.y = txtbound.y + txtbound.height + (i===0? 0:marginY);
					txtbound = _txt.getTransformedBounds();

					listen = sprite.listen.clone();

					listen.x = listenX;
					listen.y = txtbound.y + (txtbound.height - (_txt.lineHeight - _txt.size))/2;
					listen._audioname = p1.questions[i].audio;

					if(p1.questions[i].tip){
						tip = sprite.tip.clone();
						tip.x = txtbound.x + txtbound.width + tipX;
						tip.y = listen.y;
						tip.contentContainer = new createjs.Container;
						autoPos = ansewrImagePosition[p1.questions[i].tip.length-1];

						ansTxt = new p.text(p1.questions[i].text);
						ansTxt.warpText(maxTextWidth);
						ansTxt.y = textTop;
						ansTxt.x = (projectData.width - ansTxt.getBounds().width)/2;

						for(let j=0;j<p1.questions[i].tip.length;j++){
							ansImg = resourceloader.getImage(p1.questions[i].tip[j].toString()+'.jpg','center');
							ansImg.scaleX = ansImg.scaleY = autoPos.scale;
							ansImg.x = autoPos.pos[j][0];
							ansImg.y = autoPos.pos[j][1];
							tip.contentContainer.addChild(ansImg);
						}

						tip.contentContainer.addChild(ansTxt);
					}

					p1.questionContainer.addChild(_txt);
					listenContainer.addChild(listen);
					tipContainer.addChild(tip);
					p1.questions[i].text = _txt;
				}

				p1.questionContainer.x = (projectData.width - p1.questionContainer.getBounds().width)/2;
				p1.questionContainer.y = (projectData.height - p1.questionContainer.getBounds().height)/2;
				return p1;
			}

			function buildP2(){
				let _info2 = info.subpart2;
				let _text;

				let p2 = {
					shower:new createjs.Container,
					readAudio:createjs.Sound.play('zongjie.mp3').stop(),
					onAdded:function(){
						p2.readAudio.stop();
						p2.readAudio.play();
					}
				}

				_text = new p.text(_info2.text);
				_text.warpText(maxTextWidth);
				_text.y = textTop;
				_text.x = (projectData.width - _text.getBounds().width)/2;
				p2.shower.addChild(_text);

				p2.shower.on('removed',onRemove,p2);
				p2.shower.on('added',p2.onAdded);

				return p2;
			}

			function buildP3(){
				let _info3 = info.subpart3;
				let _text;

				let p3 = {
					shower:new createjs.Container,
					readAudio:createjs.Sound.play('yanshen.mp3').stop(),
					onAdded:function(){
						p3.readAudio.stop();
						p3.readAudio.play();
					}
				}

				_text = new p.text(_info3.text);
				_text.warpText(maxTextWidth);
				_text.y = textTop;
				_text.x = (projectData.width - _text.getBounds().width)/2;
				p3.shower.addChild(_text);

				p3.shower.on('removed',onRemove,p3);
				p3.shower.on('added',p3.onAdded);

				return p3;
			}
		}

		Part2 = createjs.promote(part2,'Container');
	})();

	// Part3 识字动画模块

	(function() {
		let jsonID = 'part3';

		function part3(path){
			this.Container_constructor();
			this.custom = {};
			this.custom.path = path + 'PART3/';
			this.custom.charPool = null;
			this.custom._subPart = undefined;
			this.custom.replayButton = undefined;

			this.on('removed',onPartRemove);
		}

		let p = createjs.extend(part3,createjs.Container);

		p.addJSON = function(loader){
			this.custom.jsonloader = loader;
			loader.add({src:this.custom.path + 'info.json',id:jsonID});
			return this;
		}

		p.quietBuild = function(charPath){
			let data = this.custom.jsonloader.getResult(jsonID);

			charAnimation.setCharPath(charPath);   //设定识字动画的加载总目录

			this.custom.charPool = charAnimation.getCharPool();

			for(let i=0;i<data.content.length;i++){
				new charAnimation(data.content[i].char,data.content[i].word);		//创建出的动画实例会自动加入到动画识字类的数组里
			}

			charAnimation.loadByOrder();
		}

		p.goSubPart = function(char){
			let _char = charAnimation.getByChar(char);

			_char.getState()!=='finish' && charAnimation.pirorLoad(char);
				
			if(!_char || _char === this.custom._subPart) return;

			this.removeAllChildren();
			this.custom._subPart = _char;
			this.custom._subPart = this.addChild(_char);

			if(this.custom.replayButton){
				this.custom.replayButton.visible = true;
			}

			return _char;
		}

		p.replay = function(){
			this.custom._subPart && this.custom._subPart.replay();
		}

		p.addReplayButton = function(btn){
			if(this.custom.replay instanceof createjs.DisplayObject) return;

			btn.visible = false;
			btn.cursor = 'pointer';
			btn.on('click',p.replay,this);
			this.custom.replayButton = btn;
			this.custom.onRemove = function(){btn.visible = false};
		}

		Part3 = createjs.promote(part3,'Container');
	})();

})();

(function() {
	function text(text,size,color){
		this.text_constructor(text,size,color);
	}

	text.default = {font:'Kaiti',size:40,color:'black',lineHeight:1.3};

	let p = createjs.extend(text,Lib.text);

	p.warpText = function(limit){
		if(this.getBounds().width < limit) return;

		let size = parseInt(this.font);
		let str = this.text;
		let len = 0;
		let upSymbol = '，。？：；》！”';
		let downSymbol = '《“';
		let cutPosition;

		for(let i=0;i<str.length;i++){
			len += str.charCodeAt(i) > 255? size:0.5*size;

			if(limit < len){
				cutPosition = i;
				if(downSymbol.indexOf(str[i-1])>-1){
					i --;
				}else if(upSymbol.indexOf(str[i])>-1){
					i++;
				}

				str = str.slice(0,i) + '\n' + str.slice(i);
				len = 0;
			}
		}

		this.text = str;
		return this;	
	}

	YouNengYueDu.text = createjs.promote(text,'text');
})();