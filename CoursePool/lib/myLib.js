var Lib = Lib||{};

/*
	Lib.loader继承自cjs的LoadQueue
	add：将一系列或单个文件添加到加载队列;
	addLoadProgress：添加加载进度文本，默认为50px Arial，该方法返回text实例用于设置，设置第二个参数parent可以自动添加
	getImage：获取Bitmap实例或加载到的图片标签（mode为1）
	getSprite：获取一个雪碧图对象合集
	allComplete：事件，声音，图片等资源处理完后会派发'allComplete'	事件

	

	Lib.fileNamesGetter继承自cjs的LoadQueue
	用于获取整个文件夹里quiz的js文件名(string),用于loader进行加载，需要有存放信息的json文件,全部处理完会派发processComplete事件;
						.add()参数:
							options: 
									jsonSrc:json文件的路径;
									fileSrc:当json文件和要获取文件不在同一文件夹时设置;
										json格式: 
										"mode":"list"（默认）
											list:按顺序获取，如:quiz1,quiz2,quiz3，"target":["quiz",3,1],
																					"members":[文件名前缀,结束后缀,起始后缀（默认为1）];
										"mode":"byKey":
											byKey:根据每个文件名获取，如:tip,quiz,part1，对应json格式："target":["tip","quiz","part1"];
*/

(function() {
	let mySound;

	function loader(xhr,basepath,crossorigin) {
		this.LoadQueue_constructor(xhr,basepath,crossorigin);
		this.installPlugin(createjs.Sound);

		this.loadList = new Array;
		this.eleLoadCompFunc = new Array;
		this.imagePool = {};
		this.on('complete',onComplete);
	}

	loader.HANDLE_COMPLETE = 'handlecomplete';

	let p = createjs.extend(loader,createjs.LoadQueue);

	p.add = function(eles,path,type,onLoad,igoneID) {

		let queue = this.loadQueue;
		let loadList = this.loadList;

		path = path||'';
		type = type||'';

		let str, i;
		if(typeof(eles)==='string'){    //直接添加单个文件
			eles = path + eles;
			loadList.push({src:eles,id:buildID(eles,igoneID)});
		}else if(eles.constructor === Array){      //添加一系列文件，默认用字符串组成的数组；
			for(i=0;i<eles.length;i++){
				//一系列文件中某个需要单独配置，使用object
				if(eles[i].constructor === Object){    
					eles[i].src = eles[i].src.indexOf('/')===-1? path + eles[i].src:eles[i].src;
					eles[i].id = eles[i].id || buildID(eles[i].src,eles[i].igoneID || igoneID);
					loadList.push(eles[i]);
					continue;
				}

				str = path + eles[i] + type;
				loadList.push({src:str,id:buildID(str,igoneID)});
			}
		}else if(eles.constructor === Object){      //单独加载一个文件，并有特殊设置，使用object
			eles.id = eles.id || buildID(eles.src,eles.igoneID || igoneID);
			loadList.push(eles);
		}

		typeof(onLoad)=='function' && this.eleLoadCompFunc.push(onLoad);
	}

	p.addLoadProgress = function(text,textparent) {

		if(text){
			this.progText = text;
		}else{
			this.progText = new createjs.Text('','50px Arial','black').set({textAlign:'center',textBaseline:'middle'});	
		}

		textparent && textparent.addChild(this.progText);

		this.on('progress',prog);

		return this.progText;
	}

	p.Load = function(){

		let diff = {};
		let queue = this.loadQueue, loadList = this.loadList;
		let i, j;

		if(this.progressText){
			this.progressText.visible = true;
		}

		for(i=0;i<loadList.length;){
			loadList[i].loadTimeout = loadList[i].loadTimeout||20000;
			if(loadList[i].src.slice(-3)==='.js') loadList[i].type = 'javascript';


			if(!diff[loadList[i].src]){
				diff[loadList[i].src] = true;
				i++;
			}else{
				loadList.splice(i,1);
			}
		}

		diff = null;

		this.loadManifest(loadList);
	}

	p.getImage = function (str,mode) {
		let _img, imagePool = this.imagePool;

		if(!imagePool[str]){
			for(let i in imagePool){
				if(i.indexOf(str)!==-1){
					str = i;
					break;
				}
			}
		}

		if(mode == 1){
			return imagePool[str];
		}

		_img = new createjs.Bitmap(imagePool[str]);
		mode=='center' && _img.set({regX:_img.getBounds().width/2,regY:_img.getBounds().height/2});
		
		return _img;
	}

	p.getSprite = function(data,center,attr) {
		let o = {};
		let images = new Array;
		let sprite, _sprite;

		if(typeof(data)=='string'){
			data = data.indexOf('.json')==-1? data + '.json':data;
			data = this.getResult(data);
		}

		for(let i=0;i<data.images.length;i++){
			images.push(this.getImage(data.images[i],1));
		}

		let sheet = new createjs.SpriteSheet({
			images:images,
			frames:data.frames,
			animations:data.animations,
			framerate:data.framerate
		});

		sprite = new createjs.Sprite(sheet);
		
		for(let i in data.animations){
			_sprite = sprite.clone();
			_sprite.gotoAndStop(i);
			if(center){
				_sprite.regX = _sprite.getBounds().width/2;
				_sprite.regY = _sprite.getBounds().height/2;
			}

			o[i] = _sprite;
		}

		if(typeof(attr)==='object'){
			for(i in o){
				o[i].set(attr);
			}
		}

		return o;
	}

	//所有loader实例共享同一声音实例，同时之能播放一个声音

	p.playSound = function(soundname,parallel) {
		if(parallel) return createjs.Sound.play(soundname);

		mySound && mySound.stop();
		mySound = createjs.Sound.play(soundname);
		return mySound;
	}

	p.stopSound = function() {
		mySound && mySound.stop();
	}

	function onComplete(e) {

		let loadedItems = e.target.getItems(true);
		let _script;

		for(let i=0;i<loadedItems.length;i++){
			if(loadedItems[i].item.type=='image'){
				e.target.imagePool[loadedItems[i].item.id] = e.target.getResult(loadedItems[i].item.id);
			}
		}

		while(e.target.eleLoadCompFunc.length){
			e.target.eleLoadCompFunc.shift()(e.target);
		}

		console.log('已加载资源:' + loadedItems.length + '个');
		e.target.dispatchEvent(loader.HANDLE_COMPLETE);

		delete e.target.loadList;
	}

	function prog(e) {
		let pro;
		if(e.progress >= 1){
			pro = 100;
			e.target.progText.visible = false;
			e.target.progText.parent && e.target.progText.parent.removeChild(p.progtext);
			delete e.target.progText;
			return;
		}else{
			pro = Math.round(e.progress*100);
		}
		e.target.progText.text = pro.toString() + '%';
	}

	function buildID(str,pass) {
		if(str.indexOf('/')===-1 || pass === true){
			return str;
		}

		let arr = str.split('/');
		return arr[arr.length-1];
	}

	Lib.loader = createjs.promote(loader,'LoadQueue');
})();

(function(){

	function nameGetter(){
		this.LoadQueue_constructor();
		this.loadList = new Array;
		this.on('complete',loadUp);
	}

	let p = createjs.extend(nameGetter,createjs.LoadQueue);

	p.add = function(){
		let attr;
		for(let i=0;i<arguments.length;i++){
			attr = {};
			attr.src = arguments[i].jsonSrc;
			attr.type = 'json';
			attr.id = arguments[i].id;
			if(arguments[i].fileSrc) attr.fileSrc = arguments[i].fileSrc;
			this.loadList.push(attr);
		}
	}

	p.Load = function(){
		this.loadManifest(this.loadList);
	}

	function loadUp(e){
		let json;
		let result = {};
		let arr;
		let id;
		let len;
		let loadList = this.loadList;
		let fileSrc;

		for(let i=0;i<this.loadList.length;i++){
			id = loadList[i].id || loadList[i].src;
			json = this.getResult(id);
			
			if(json.mode==='list'){
				fileSrc = loadList[i].fileSrc || loadList[i].src.substr(0,loadList[i].src.lastIndexOf('/')+1);
				if(json.target.length===1){
					result[id] = [fileSrc + json.target[0]];
				}else{
					arr = new Array;
					len = json.target[1];
					for(let j=typeof(json.target[3])==='number'? json.target[3]:1;j<=len;j++){
						arr.push(fileSrc + json.target[0] + j + json.target[2]);
					}
					result[id] = arr;
				}

			}
		}

		this.processedResult = result;

		this.dispatchEvent('processComplete');
	}

	Lib.fileNamesGetter = createjs.promote(nameGetter,'LoadQueue');
})();

(function() {
	let p = {};

	let stage, container, canvas, scale, width, height, ratio;

	p.initStage = function(canvasid,size) {
		canvas = typeof(canvasid)==='string'? document.getElementById(canvasid):canvasid;
		stage = new createjs.Stage(canvas);
		container = new createjs.Container;
		createjs.Touch.enable(stage);
		createjs.Ticker.framerate = 60;
		createjs.Ticker.timingMode = 'raf';
		createjs.Ticker.addEventListener("tick", stage);

		stage.addChild(container);
		stage.enableMouseOver();

		//stage.on('drawend',function(e){console.log(e)});

		width = size.width;
		height = size.height;

		ratio = 1 / window.devicePixelRatio;
		document.querySelector('meta[name="viewport"]').setAttribute('content','width=device-width,initial-scale=' + ratio + ', maximum-scale=' + ratio + ', minimum-scale=' + ratio + ', user-scalable=no');

		canvas.style.position = "absolute";
		window.addEventListener('resize',resize);
		resize();

		canvas.width = window.screen.width/ratio;
		canvas.height = window.screen.height/ratio;

		canvas.width<canvas.height? canvas.width=canvas.height:canvas.height=canvas.width;
	}

	p.getRootContainer = function() {
		return container;
	}

	p.getStuff = function(stuff) {
		if(stuff === 'canvas'){
			return canvas;
		}else if(stuff === 'stage'){
			return stage;
		}else if(stuff === 'rootContainer'){
			return container;
		}
	}

	function resize() {
		let w = document.documentElement.clientWidth;
		let h = document.documentElement.clientHeight;
		//canvas.width = w;
		//canvas.height = h;

		scale = h/w>0.56? w/width:h/height;
		if(h/w>0.56){
			container.x = 0;
			container.y = Math.abs(h - height*scale)/2;
		}else{
			container.x = Math.abs(w - width*scale)/2;
			container.y = 0;
		}

		container.scaleX = container.scaleY = scale;
	}

	Lib.stageFunc = p;
})();

(function(){
	// let defaultFont = 'Kaiti';

	function text(text,size,color){
		let _default = this.constructor.default;
		text = text||'';
		size = size || _default.size;
		color = color || _default.color;
		let font = size.toString() + 'px ' + _default.font;
		this.Text_constructor(text,font,color);
		this.lineHeight = size*_default.lineHeight;
	}

	text.default = {
		font:'Kaiti',
		size:30,
		color:'black',
		lineHeight:1.3
	}

	let p = createjs.extend(text,createjs.Text);

	p.alignCenter = function(){
		this.set({textAlign:'center',textBaseline:'middle'});
		return this;
	}

	p.addTo = function(parent){
		parent.addChild(this);
		return this;
	}

	Object.defineProperties(p,{
		size:{
			get:function(){return parseInt(this.font)},
			set:function(n){this.font = n.toString() + 'px ' + this.constructor.default.font}
		}
	});

	Lib.text = createjs.promote(text,'Text');
})();

function c16(){
	let str='', _str;
	for(let i in arguments){
		_str = arguments[i]<16? '0'+arguments[i].toString(16):arguments[i].toString(16);
		str = str + _str;
	}

	return '#' + str.toUpperCase();
};

let log = console.log;