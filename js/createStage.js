function createStage(_level,_class,_lesson){
	Lib.stageFunc.initStage('canvas',{width:projectData.width,height:projectData.height});
	let container = Lib.stageFunc.getRootContainer();
	let yuedu = courseGetter.getManager();
	let mainloader = yuedu.loader;

	mainloader.addLoadProgress(null,container).set({x:640,y:360});

	mainloader.add(['ui.json','ui.png'],'ui/');
	yuedu.on('loadup',function(){buildFrame(yuedu,mainloader,container)},null,true);
	courseGetter.getManager().loadLesson(_level,_class,_lesson);

/*	function show(e){
		let _p = yuedu.goPart(1);
		container.addChild(yuedu.shower);
		_p.goSubPart(1);
	}*/
}

function buildFrame(yuedu,loader,root){
	let contentContainer = root.addChild(new createjs.Container);
	let uiContainer = root.addChild(new createjs.Container);

	let bottomContainer = uiContainer.addChild(new createjs.Container);
	let tabContainer = uiContainer.addChild(new createjs.Container);
	let yueduTabContainer = uiContainer.addChild(new createjs.Container).set({visible:false,cursor:'pointer'});
	let tishengTabContainer = uiContainer.addChild(new createjs.Container).set({visible:false,cursor:'pointer'});
	let shiziTabContainer = uiContainer.addChild(new createjs.Container).set({visible:false});
	let prevNextContainer = uiContainer.addChild(new createjs.Container).set({visible:false,cursor:'pointer'});

	let currentTab = null;
	let nextButton = null, prevButton = null;
	let shiziCicles;

	let fade = TweenLite.from(yuedu.shower,0.5,{alpha:0});

	let sprite = loader.getSprite('ui',true);
	let elementData = [
		{name:'back',attr:{x:1121,y:586},addTo:bottomContainer},
		{name:'rect',attr:{x:670,y:386}},

		{name:'tab1',attr:{x:194,y:206,alpha:0.5,part:1,subPartController:yueduTabContainer},addTo:tabContainer},
		{name:'tab2',attr:{y:320,alpha:0.5,part:2,subPartController:tishengTabContainer}},
		{name:'tab3',attr:{y:435,alpha:0.5,part:3,subPartController:shiziTabContainer}},
		{name:'tab4',attr:{y:549,alpha:0.5,part:4}},

		{name:'lijiebiaoda',attr:{x:424,y:73,subPart:1},addTo:yueduTabContainer},
		{name:'guinazongjie',attr:{x:670,subPart:2}},
		{name:'yueduyanshen',attr:{x:915,subPart:3}},

		{name:'guancha',attr:{x:424,subPart:1},addTo:tishengTabContainer},
		{name:'qingting',attr:{x:670,subPart:2}},
		{name:'jiangshu',attr:{x:915,subPart:3}},

		{name:'splitStar',attr:{x:672,y:515},addTo:shiziTabContainer},
		{name:'replay',attr:{x:435,y:448}},

		{name:'next',attr:{x:1056,y:386,alpha:0.2,funcName:'next'},addTo:prevNextContainer},
		{name:'prev',attr:{x:284,alpha:0.2,funcName:'prev'}}
	];
	let _ele, _preEle, _parent = null;

	for(let i=0;i<elementData.length;i++){
		_ele = sprite[elementData[i].name];
		_parent = elementData[i].addTo === undefined? _parent:elementData[i].addTo;
		_parent? _parent.addChild(_ele):uiContainer.addChild(_ele);

		if(_preEle && elementData[i].attr){
			if(typeof(elementData[i].attr.x)!=='number') _ele.x = _preEle.x;
			if(typeof(elementData[i].attr.y)!=='number') _ele.y = _preEle.y;
		}

		_ele.set(elementData[i].attr);

		_preEle = _ele;
	}

	// 阅读，提升子环节
	yueduTabContainer.on('click',chooseSubPart);
	tishengTabContainer.on('click',chooseSubPart);

	//识字选择功能
	shiziCicles = getShiziCircles(sprite.charCircle);
	shiziCicles.cursor = 'pointer';
	shiziCicles.on('click',chooseSubPart);
	shiziTabContainer.addChild(shiziCicles);

	//翻页功能
	prevNextContainer.on('click',prevNext);
	nextButton = sprite.next;
	prevButton = sprite.prev;	

	//给识字环节添加replay按钮
	yuedu.part3.addReplayButton(sprite.replay);

	// 环节选择功能
	tabContainer.cursor = 'pointer';
	tabContainer.on('click',function(e){goPartByTab(e.target)});

	//返回
	sprite.back.set({cursor:'pointer'}).on('click',function(){window.location.href = 'index.html'});

	//默认环节，优能阅读
	goPartByTab(sprite.tab1);

	//调整课件内容容器位置，并加上遮罩
	yuedu.shower.set({scaleX:0.648,scaleY:0.736,x:670.4,y:386.65,regX:640,regY:360});
	contentContainer.addChild(yuedu.shower);
	contentContainer.mask = new createjs.Shape(new createjs.Graphics().f('white').rr(
			255.4,121.65,828,528,38));
	contentContainer.addChildAt(contentContainer.mask,0);

	//识字环节位置调整
	charAnimation.shiftPosition(-100,-70);

	function goPartByTab(tab){
		if(tab === currentTab) return;
		yuedu.shower.scaleX = tab.part ===1 ? 0.648:yuedu.shower.scaleY;

		yuedu.goPart(tab.part);
		prevNextContainer.visible = false;

		tab.alpha = 1;
		if(tab.subPartController) tab.subPartController.visible = true;

		if(currentTab){
			currentTab.alpha = .2;
			if(currentTab.subPartController) currentTab.subPartController.visible = false;
		}
		currentTab = tab;
	}

	function chooseSubPart(e){
		if(!yuedu.goSubPart(e.target.subPart)) return; //重复点击当前页则返回

		let _subpart = yuedu.currentSubPart();

		fade.restart();

		if(_subpart.hasNext){
			prevNextContainer.visible = true;
			nextButton.visible = true;
			prevButton.visible = false;
		}else{
			prevNextContainer.visible = false;
		}
	}

	function prevNext(e){
		let position;
		e.target.funcName === 'next'? yuedu.currentSubPart().next():yuedu.currentSubPart().prev();
		position = yuedu.currentSubPart().position();
		nextButton.visible = position!=='end';
		prevButton.visible = position!=='start';
	}
}

function getShiziCircles(texture){
	let arr = charAnimation.getCharPool();
	let char;
	let circle;
	let txt;
	let pool = new createjs.Container;
	let y1, y2;
	let x, sumX;

	for(let i=0;i<arr.length;i++){
		char = arr[i].getChar()
		circle = new createjs.Container;
		circle.mouseChildren = false;

		txt = new createjs.Text(char,'30px Kaiti','black');
		txt.textAlign = 'center';
		txt.textBaseline = 'middle';

		circle.addChild(texture.clone(),txt);
		circle.subPart = char;
		pool.addChild(circle);
	}


	if(pool.numChildren===8){
		y1 = 580;
		x = 340;
		sumX = 95;
		for(let i=0;i<pool.children.length;i++){
			pool.children[i].x = x + (i*sumX);
			pool.children[i].y = y1;
		}
	}

	return pool;
}