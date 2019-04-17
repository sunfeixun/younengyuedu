let menu;

(function() {
	let p = {};

	p.init = function(){
		Lib.stageFunc.initStage('canvas',{width:1280,height:720});
		let container = Lib.stageFunc.getRootContainer();

		forTest(container);
	}


	function forTest(_con){
		let rect = new createjs.Shape;
		let txt = new createjs.Text('1级','30px Kaiti','black');
		let numRect = new createjs.Container;
		let _nr;
		let levelCon = _con.addChild(new createjs.Container);
		let classCon = _con.addChild(new createjs.Container);
		let lessonCon = _con.addChild(new createjs.Container);

		rect.graphics.f('red').r(0,0,txt.getBounds().width,txt.getBounds().height+18);
		numRect.addChild(rect,txt);

		window.txt = txt;

		for(let i=1;i<=8;i++){
			_nr = numRect.clone(true);
			_nr.x = (i-1)*60
			_nr.getChildAt(1).text = i + '级';
			_nr.level = i;
			_nr.mouseChildren = false;
			levelCon.addChild(_nr);
		}

		levelCon.cursor = 'pointer';
		levelCon.on('click',function(e){
			hideSub();
			sessionStorage.level = e.target.level;
			classCon.visible = true;
			classCon.x = e.target.x;
		});

		//册
		for(let i=1;i<=4;i++){
			_nr = numRect.clone(true);
			_nr.x = (i-1)*60;
			_nr.y = 70;
			_nr.getChildAt(1).text = i + '册';
			_nr.class = i;
			_nr.mouseChildren = false;
			classCon.addChild(_nr);
		}

		classCon.cursor = 'pointer';
		classCon.on('click',function(e){sessionStorage.class = e.target.class;lessonCon.set({visible:true,x:e.target.x+classCon.x})});
		classCon.visible = false;

		// 课
		for(let i=1;i<=4;i++){
			_nr = numRect.clone(true);
			_nr.x = (i-1)*60;
			_nr.y = 140;
			_nr.getChildAt(1).text = i + '课';
			_nr.lesson = i;
			_nr.mouseChildren = false;
			lessonCon.addChild(_nr);
		}

		lessonCon.cursor = 'pointer';
		lessonCon.visible = false;
		lessonCon.on('click',function(e){
			sessionStorage.lesson = e.target.lesson;
			hideSub();
			window.location.href = 'course.html';
		});



		function hideSub(){
			lessonCon.visible = classCon.visible = false;
		}
	}

	menu = p;
})();