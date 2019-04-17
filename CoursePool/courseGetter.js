var courseGetter;

/*
统一的课程加载器，被加载的课程会调用该加载器的basePath来加载公用资源

defineCoursePool()		设置所有课程库，包括lib，等所有公用文件库，默认为CoursePool
getCourse()			相对目录，相对于基础目录的课程目录
setReady() 				courseInerface及所需组件加载完成，可以调用goLesson（或其他）方法

addPlugin()				courseInterface来加载所需组件（如TweenMax或公共库）,该方法执行后会自动调用setReady()设置的方法
						格式:courseGetter.addPlugin({Lib:'myLib.js',TweenLite:'TweenMax.min.js'},courseGetter.libPath)
						Lib为加载后组件所带的实例，用于判断组件是否已加载

regManager()			注册课程管理器，courseInterface.js里将自身注册到getter中
getManager()			获取课程管理器，外部调用
*/

(function() {
	let p = new createjs.EventDispatcher();

	let onReady;
	let courseManager;
	let pluginLoader = new createjs.LoadQueue(false), pluginList = new Array;
	pluginLoader.on('complete',Ready);

	p.basePath = 'CoursePool/';
	p.libPath = p.basePath + 'lib/';
	
	p.defineCoursePool = function(path) {
		p.basePath = fixSrc(path);
		p.libPath = p.basePath + 'lib/';
	}

	p.definePath = function(pathNames){
		for(let i in pathNames){
			p[i] = p.basePath + pathNames[i];
		}
	}

	p.getCourse = function(filename) {
		/*
		if(typeof(src)==='string') p.coursePath = p.basePath + fixSrc(src);
		filename = filename || 'courseInterface.js';
		let coursefile = p.coursePath + filename;*/
		let ld = new createjs.JavaScriptLoader(p.basePath + filename);
		ld.on('complete',getup);
		ld.load();
	}

	p.addPlugin = function(plug,src) {
		let str;
		let i;
		src = src||'';

		for(let i in plug){
			try{eval(i)}catch(e){pluginList.push({src:src+plug[i],type:'javascript'})};
		}
	}

	p.setReady = function(f){
		onReady = f;
	}

	p.regManager = function(manager) {
		courseManager = manager;
	}

	p.getManager = function() {
		return courseManager;
	}

	function getup() {
		if(pluginList.length>0){
			pluginLoader.loadManifest(pluginList);
		}else{
			Ready();
		}
	}

	function Ready() {
		p.dispatchEvent('onready');
	}

	function fixSrc(src) {
		return src[src.length-1] === '/'? src:src + '/';
	}

	courseGetter = p;
})();