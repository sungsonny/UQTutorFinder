var hSlot = 0;
var sSlot = null;
var cjStatus = "";
var cjLateStatus = true;
var cjClassFilesTracer = null;
var cjInitDone = 0;
var cjListener = null;
var cheerpjJarJsOverridePath = null;
var cjIsWorker = !self.window;

function CheerpJPromise()
{
	this.callback = null;
	this.value = null;
	this.isDone = false;
}

CheerpJPromise.prototype.then = function(c)
{
	if(this.isDone)
		c(this.value);
	else
		this.callback = c;
}

CheerpJPromise.prototype.done = function(v)
{
	this.value = v;
	this.isDone = true;
	if(this.callback)
		this.callback(v);
}

function writeContinuationFunction(func, args, first)
{
	var pc = 0;
	// TODO: label variable should only be used if required
	var ret = "";
	var vars = "";
	// HACK: The implementation for jsr still sends the PC as the second arg
	if(typeof(args) == "number")
		var pc = args | 0;
	else
	{
		// Read all local variables from the stacklet
		for(var p in args)
		{
			if(p=="pc")
			{
				var pc = args[p];
				continue;
			}
			else if(p =="f")
				continue;
			vars += "var "+p+"=a."+p+";";
		}
	}
	var code = func.toString();
	// Generate a Int8Array for C++ implementation
	var codeBuf = new Int8Array(code.length);
	for(var i=0;i<code.length;i++)
		codeBuf[i] = code.charCodeAt(i);
	ret+=writeContinuationFunctionImpl(code, codeBuf, pc, first, vars)
	return ret;
}

function cheerpjEncodeClassName(name)
{
	var mangledName = "N";
	var curStart = 0;
	var i = 0;
	while(i!=name.length)
	{
		if(name.charCodeAt(i) == /*'/'*/0x2f)
		{
			mangledName += (i-curStart|0) + name.substring(curStart,i);
			curStart = i+1|0;
		}
		i=i+1|0;
	}
	mangledName += (i-curStart|0) + name.substring(curStart,i);
	return mangledName;
}

function decodeClassName(name)
{
	var ret="";
	if(name[0]!='N')
	{
		// Try to decompress the symbol before giving up
		var decompressedName = cheerpjDecompressSymbol(name);
		if(decompressedName[0] != 'N')
			return null;
		name = decompressedName;
	}
	var lastNameStart=1;
	var nameLength = 0;
	var charCodeO = 0x30;
	var charCode9 = 0x39;
	while(lastNameStart!=name.length)
	{
		var charCode = name.charCodeAt(lastNameStart);
		if(charCode >= charCodeO && charCode <= charCode9)
		{
			nameLength*=10;
			nameLength+=charCode - charCodeO;
			lastNameStart++;
			continue;
		}
		else if(nameLength == 0)
			return ret;
		// Length parsed, now extract the name
		var part = name.substr(lastNameStart, nameLength);
		lastNameStart += nameLength;
		nameLength = 0;
		if(ret.length)
			ret+='/';
		ret+=part;
	}
	return ret;
}

var pendingLoads = 0;

function buildContinuations(args, atGuard)
{
	if(args===null)
		return;
	var caller=args.f;
	if(args.p!==null)
		buildContinuations(args.p, false);
	var rewrittenCaller = writeContinuationFunction(caller, args, atGuard);
	try
	{
		var rewrittenFunc = new Function('a', 'b', "_"+caller.name, rewrittenCaller);
	}
	catch(e)
	{
		cjReportError(location.href, "Rewriter error: "+caller.name+"/"+rewrittenCaller);
		throw e;
	}
	args.p=null;
	currentThread.continuationStack.push({func:rewrittenFunc,args:args});
}

var cjLoadedScripts = {}

function classLoadComplete(e)
{
	var script = e.target;
	var pendingName = script.pendingName;
	assert(cjLoadedScripts.hasOwnProperty(pendingName));
	var pendingList = cjLoadedScripts[pendingName];
	if(e.type == "error" && pendingName.startsWith("/lt/runtime/rt.jar."))
	{
		// Abuse the pendingList array to keep track of failures
		if(pendingList.failureCount)
			pendingList.failureCount++;
		else
			pendingList.failureCount=1;
		if(pendingList.failureCount > 5)
		{
			cjReportError(location.href, "Core JS error "+e.target.src);
			return;
		}
		// Try again in 3 secs, make a new script element
		setTimeout(function()
		{
			var newScript = document.createElement("script");
			newScript.pendingName = script.pendingName;
			newScript.onload=classLoadComplete;
			newScript.onerror=classLoadComplete;
			newScript.crossOrigin = "anonymous";
			newScript.src = script.src;
			script.parentNode.replaceChild(newScript, script);
		}, 3000);
		return;
	}
	for(var i=0;i<pendingList.length;i++)
	{
		var waitingThread = pendingList[i];
		assert(waitingThread.state == "WAIT_NET");
		waitingThread.state = "READY";
	}
	cjLoadedScripts[pendingName] = null;
	// onerror may be triggered immediately from the same thread, so avoid rescheduling
	if(currentThread != waitingThread)
		cheerpjSchedule();
	else
		debugger
}

function cheerpjReportJSLoadReason(loadedName, callback)
{
	var userFuncName = null;
	var directFuncName = null;
	var contStack = currentThread.continuationStack;
	for(var i=contStack.length-1;i>=0;i--)
	{
		var args = contStack[i].args;
		if(!args || !args.f)
			break;
		var curName = contStack[i].args.f.name;
		var curNameStart = curName[0];
		if(curNameStart != "_" && curNameStart != "N")
			continue;
		if(directFuncName == null)
		{
			if(curNameStart == "_")
				directFuncName = cheerpjDecompressSymbol(curName.substr(1));
			else
				directFuncName = curName;
		}
		else
		{
			var decompressedName = null;
			var classStart = 0;
			if(curNameStart == "_")
			{
				decompressedName = cheerpjDecompressSymbol(curName.substr(1));
				assert(decompressedName[0] == 'Z');
				classStart = 1;
			}
			else
			{
				decompressedName = curName;
			}
			// Extract the class name from the mangled string
			assert(decompressedName[classStart] == "N");
			var prevEnd = 0;
			var classEnd = 0;
			var curChar = classStart+1|0;
			var curLen = 0;
			var charCodeO = 0x30;
			var charCode9 = 0x39;
			var classPart = null;
			while(curChar < decompressedName.length)
			{
				var charCode = decompressedName.charCodeAt(curChar);
				if(charCode >= charCodeO && charCode <= charCode9)
				{
					curLen *= 10;
					curLen += charCode - charCodeO | 0;
					curChar++;
				}
				else if(curLen == 0)
				{
					if(charCode == 0x45/*E*/)
						classPart = decompressedName.substring(classStart, prevEnd);
					else
						classPart = decompressedName.substring(classStart, classEnd);
					break;
				}
				else
				{
					prevEnd = classEnd;
					curChar += curLen;
					curLen = 0;
					classEnd = curChar;
				}
			}
			var mangledClassName = classPart;
			var scriptName = cheerpjGetJSFromClassName(mangledClassName);
			if(scriptName && !scriptName.startsWith(loaderPath+"/runtime/"))
			{
				userFuncName = curName;
				break;
			}
		}
	}
	callback(loadedName, directFuncName == null ? "(Internal)" : directFuncName, userFuncName == null ? "(Internal)" : userFuncName);
}

function loadScript(name, p)
{
	assert(typeof(p) != "undefined");
	if(!cjIsWorker)
		buildContinuations(p, false);
	if(cjLoadedScripts.hasOwnProperty(name))
	{
		var pending = cjLoadedScripts[name];
		assert(pending)
		pending.push(currentThread);
	}
	else
	{
		if(cjListener && cjListener.jsLoadReason)
		{
			cheerpjReportJSLoadReason(name, cjListener.jsLoadReason);
		}
		if(currentThread.threadObj)
			cheerpjCL = currentThread.threadObj.contextClassLoader9;
		var mount = cheerpjGetFSMountForPath(name);
		if(!(mount instanceof CheerpJWebFolder))
			return;
		var fileToLoad = mount.mapPath(mount, name.substr(mount.mountPoint.length-1));
		if(cjIsWorker)
		{
			try
			{
				importScripts(fileToLoad);
			}
			catch(e)
			{
			}
			return;
		}
		var newScript = document.createElement("script");
		var pendingList = [currentThread];
		cjLoadedScripts[name] = pendingList;
		newScript.pendingName = name;
		newScript.onload=classLoadComplete;
		newScript.onerror=classLoadComplete;
		newScript.crossOrigin = "anonymous";
		newScript.src = fileToLoad;
		document.head.appendChild(newScript);
	}
	currentThread.state = "WAIT_NET";
	throw "CheerpJContinue";
}

function cheerpjLoadJarPackage(jarPath, jarName, demangledName, p)
{
	var rtPackageList = cheerpjAOTPackages[jarName];
	for(var i=0;i<rtPackageList.length;i++)
	{
		if(!demangledName.startsWith(rtPackageList[i]))
			continue;
		var packageName = rtPackageList[i].split('/').join('.');
		var scriptName = jarPath + jarName +"."+packageName+"js";
		if(cjLoadedScripts.hasOwnProperty(scriptName) && cjLoadedScripts[scriptName]==null)
		{
			// Already loaded, give up
			return;
		}
		loadScript(scriptName, p);
		return;
	}
}

function loadWeakClass(name, p, allowMissing)
{
	if(cjHasGlobalDynamic(name))
		return;
	// Very early in the loading process we don't have a threadObj yet
	if(!threads[0].threadObj || !threads[0].threadObj.contextClassLoader9)
	{
		var demangledName = decodeClassName(name);
		// Assume we need to load from the runtime
		return cheerpjLoadJarPackage("/lt/runtime/", "rt.jar", demangledName, p);;
	}
	// Attempt loading using the contextClassLoader for thread. This is incorrect, but ok for now
	var ctxLoader = threads[0].threadObj.contextClassLoader9;
	if(ctxLoader)
	{
		assert(typeof(p) !== "undefined");
		var a = {f:loadWeakClass,p:p,pc:0,s0:null,s1:name,allowMissing:allowMissing};
		var demangledName = decodeClassName(name).split('/').join('.');
		assert(demangledName.length);
		// loadClass
		a.pc=0;a.s0=ctxLoader.v13(ctxLoader,cheerpjInternString(demangledName),0,a);
		if(a.s0)
			return;
		debugger
		var name = a.s1;
	}
	loadScript(decodeClassName(name)+".js", p);
}

function loadWeakClassE(a, ex)
{
	// Intercept exceptions
	if(a.allowMissing)
		return true;
	else if(ex instanceof N4java4lang22ClassNotFoundException){
		// Convert to NoClassDefFoundError
		a.f=loadWeakClassE;
		a.pc=0;cheerpjEnsureInitialized("N4java4lang20NoClassDefFoundError", a);
		var e=new N4java4lang20NoClassDefFoundError();
		e.detailMessage1=cheerpjInternString(decodeClassName(a.s1));
		cheerpjThrow(a,e);
	}else{
		a.pc=-1;
	}
}

function runContinuationStack(ret)
{
	sSlot = currentThread.sSlot;
	try
	{
		while(currentThread.continuationStack.length)
		{
			var c = currentThread.continuationStack.pop();
			ret=c.func(c.args, ret);
			assert(currentThread.state == "RUNNING");
		}
		currentThread.retValue = ret;
	}
	catch(e)
	{
		// Special handling for null exceptions
		if(e instanceof TypeError)
		{
			assert(sSlot);
			currentThread.continuationStack.push({func: cjThrowNPE, args: {p:sSlot,f:cjThrowNPE,pc:0,stack:e.stack,ex:null,last:c.args}});
		}
		else if(e != "CheerpJContinue")
			throw e;
	}
	if(currentThread && currentThread.state == "RUNNING")
	{
		if(currentThread.continuationStack.length==0)
			currentThread.state = "PAUSED";
		else
		{
			currentThread.state = "READY";
		}
	}
	currentThread.sSlot = sSlot;
	sSlot = null;
	//cheerpjSchedule();
	currentThread = null;
}

function cheerpjPromiseFulfill(a, b)
{
	a(b);
	return b;
}

function cheerpjCreateInstance(className, signature)
{
	var args = [].splice.call(arguments, 2);
	threads[0].continuationStack.unshift({func:loadWeakClass, args:className});
	threads[0].continuationStack.unshift({func:function(args)
		{
			cheerpjEnsureInitialized(className, null);
		}, args: className});
	var promise = new CheerpJPromise();
	threads[0].continuationStack.unshift({func:cheerpjCreateInstanceFunc, args:{className:className, args:args, signature:signature, promise:promise}});
	if(threads[0].state == "PAUSED")
		threads[0].state = "READY";
	cheerpjSchedule();
	return promise;
}

function cjPushArgs(dest, args)
{
	for(var i=0;i<args.length;i++)
	{
		var arg = args[i];
		if(typeof arg == "string")
			arg = cheerpjInternString(arg);
		else if(arg instanceof CheerpJPromise)
		{
			assert(arg.isDone);
			arg = arg.value;
		}
		dest.push(arg);
	}
}

function cheerpjCreateInstanceFunc(a)
{
	a.f=cheerpjCreateInstanceFunc;
	a.s0=new self[a.className];
	a.p=null;
	var args = a.args;
	var finalArgs = [a.s0];
	cjPushArgs(finalArgs, args);
	finalArgs.push(a);
	a.pc=0;(cjMethodDynamic("Z"+a.className+"C2E"+a.signature+"EV")).apply(null,finalArgs);
	a.promise.done(a.s0);
	return a.s0;
}

function cheerpjRunMethod(obj, method)
{
	var args = [].splice.call(arguments, 2);
	var promise = new CheerpJPromise();
	threads[0].continuationStack.unshift({func:function(args)
		{
			if(obj instanceof CheerpJPromise)
			{
				assert(obj.isDone);
				obj = obj.value;
			}
			var a = [obj];;
			cjPushArgs(a, args);
			a.push(null);
			var ret = obj[method].apply(null,a)
			promise.done(ret);
			return ret;
		}, args:args});
	if(threads[0].state == "PAUSED")
		threads[0].state = "READY";
	cheerpjSchedule();
	return promise;
}

function cheerpjInitializeClass(className)
{
	// Queue the call on the main thread
	var oldThread = currentThread;
	currentThread = threads[0];
	// Compute the mangled name
	var mangledName = "N";
	var parts = className.split('/');
	for(var i=0;i<parts.length;i++)
		mangledName += parts[i].length + parts[i];
	// cheerpjEnsureInitialized will take care of loading the class if needed
	currentThread.continuationStack.unshift({func:function(args)
		{
			cheerpjEnsureInitialized(mangledName, null);
		}, args: mangledName});
	if(currentThread.state == "PAUSED")
		currentThread.state = "READY";
	currentThread = oldThread;
	cheerpjSchedule();
}

function cheerpjRunStaticMethod(t, className, methodName)
{
	var args = [].splice.call(arguments, 3);
	// Queue the call on the main thread
	var oldThread = currentThread;
	currentThread = t;
	// Compute the mangled name
	var mangledName = "N";
	var parts = className.split('/');
	for(var i=0;i<parts.length;i++)
		mangledName += parts[i].length + parts[i];
	// cheerpjEnsureInitialized will take care of loading the class if needed
	currentThread.continuationStack.unshift({func:function(args)
		{
			cheerpjEnsureInitialized(mangledName, null);
		}, args: mangledName});
	var promise = new CheerpJPromise();
	// Schedule the function itself, this may happen after the class is loaded
	currentThread.continuationStack.unshift({func:function(_args)
		{
			var mangledName = _args.mangledName;
			var args = _args.args;
			var a = [];
			cjPushArgs(a, args);
			a.push(null);
			var func=cjMethodDynamic("Z"+mangledName+methodName);
			assert(func);
			return func.apply(null,a);
		}, args:{args:args,mangledName:mangledName}});
	currentThread.continuationStack.unshift({func:function(_p, b)
		{
			_p.done(b);
			return b;
		},args:promise});
	if(currentThread.state == "PAUSED")
		currentThread.state = "READY";
	currentThread = oldThread;
	cheerpjSchedule();
	return promise;
}

var internStringMap = {}

function cheerpjInternString(a)
{
	if(internStringMap.hasOwnProperty(a))
		return internStringMap[a];
	var ret = cjStringJsToJava(a);
	internStringMap[a] = ret;
	return ret;
}

var classMap = {}

function cheerpjGetClass(a)
{
	if(classMap.hasOwnProperty(a))
		return classMap[a];
	var ret = new N4java4lang5Class();
	ret.cheerpjDownload = null;
	ret.jsName = a;
	ret.jsConstructor = null;
	if(a[0] != '[')
	{
		var mangledName = cheerpjEncodeClassName(a);
		var constructor = cjGlobalDynamic(mangledName);
		ret.jsConstructor = constructor;
		assert(constructor);
		if(constructor.cl!==null && constructor.cl.hasOwnProperty("cl"))
			ret.classLoader3 =  constructor.cl.cl;
		else
			ret.classLoader3 =  constructor.cl;
	}
	ret.name2=cheerpjInternString(a.split('/').join('.'));
	classMap[a] = ret;
	return ret;
}

function cjC(c,p)
{
	// Fast path, if the class is already there
	if(classMap.hasOwnProperty(c))
		return classMap[c];
	// Make sure the class code is loaded
	var mangledClassName = cheerpjEncodeClassName(c);
	if(!self.hasOwnProperty(mangledClassName))
	{
		var a={p:p,f:cjC,pc:0,c:c};
		a.pc=0;loadWeakClass(mangledClassName, a, false);
	}
	return cheerpjGetClass(c);
}

function cheerpjAddPrimitiveClass(a)
{
	var ret = new N4java4lang5Class();
	ret.cheerpjDownload = null;
	ret.jsName = a;
	ret.name2 = cheerpjInternString(a);
	ret.hackIsPrimitive = true;
	classMap[a] = ret;
}

function cheerpjGetClassConstructor(c)
{
	assert(c.jsConstructor);
	return c.jsConstructor;
}

// clone
Array.prototype.v3=Array.prototype.cqRa6mmXRhd9pmAqYahb=function()
{
	var ret = [];
	for(var i=0;i<this.length;i++)
		ret[i]=this[i];
	return ret;
}

// getClass
Array.prototype.v0=Array.prototype.kBqmXTaij96Tq_bNxKe=function()
{
	var ret=cheerpjGetClass(this[0]);
	return ret;
}

// hashCode
Array.prototype.v1=Array.prototype.lFaiDW5mq86jc=function()
{
	// TODO: Better implementation?
	return 0;
}

// notifyAll
Array.prototype.v6=Array.prototype.idauYifyAllVEV=function()
{
	debugger
}

// equals
Array.prototype.v2=Array.prototype.gtarbSiXq_dJgKmWrc7nd=function(a0,a1,p)
{
	return a0===a1?1:0;
}

Array.prototype.ifs = []

function typedArrayClone()
{
	return new this.constructor(this);
}

function typedArrayGetClass()
{
	assert(this[0]);
	return cheerpjGetClass("["+String.fromCharCode(this[0]));
}

function cjTypedArrayHashCode(p)
{
	return cjObjectHashCode(this, p);
}

Int8Array.prototype.v3=Int8Array.prototype.cqRa6mmXRhd9pmAqYahb=typedArrayClone;
Int16Array.prototype.v3=Int16Array.prototype.cqRa6mmXRhd9pmAqYahb=typedArrayClone;
Uint16Array.prototype.v3=Uint16Array.prototype.cqRa6mmXRhd9pmAqYahb=typedArrayClone;
Int32Array.prototype.v3=Int32Array.prototype.cqRa6mmXRhd9pmAqYahb=typedArrayClone;
Float32Array.prototype.v3=Float32Array.prototype.cqRa6mmXRhd9pmAqYahb=typedArrayClone;
Float64Array.prototype.v3=Float64Array.prototype.cqRa6mmXRhd9pmAqYahb=typedArrayClone;
Int8Array.prototype.v0=Int8Array.prototype.kBqmXTaij96Tq_bNxKe=typedArrayGetClass;
Int16Array.prototype.v0=Int16Array.prototype.kBqmXTaij96Tq_bNxKe=typedArrayGetClass;
Uint16Array.prototype.v0=Uint16Array.prototype.kBqmXTaij96Tq_bNxKe=typedArrayGetClass;
Int32Array.prototype.v0=Int32Array.prototype.kBqmXTaij96Tq_bNxKe=typedArrayGetClass;
Float32Array.prototype.v0=Float32Array.prototype.kBqmXTaij96Tq_bNxKe=typedArrayGetClass;
Float64Array.prototype.v0=Float64Array.prototype.kBqmXTaij96Tq_bNxKe=typedArrayGetClass;
Int8Array.prototype.v1=cjTypedArrayHashCode;
Int16Array.prototype.v1=cjTypedArrayHashCode;
Uint16Array.prototype.v1=cjTypedArrayHashCode;
Int32Array.prototype.v1=cjTypedArrayHashCode;
Float32Array.prototype.v1=cjTypedArrayHashCode;
Float64Array.prototype.v1=cjTypedArrayHashCode;
Int8Array.prototype.ifs=[];
Int16Array.prototype.ifs=[];
Uint16Array.prototype.ifs=[];
Int32Array.prototype.ifs=[];
Float32Array.prototype.ifs=[];
Float64Array.prototype.ifs=[];

var threads = null;
var currentThread = null;
var loaderPath = null;
var appUrlPrefix = null;

function cheerpjInitOnce()
{
	if(threads !== null)
		return;
	// Log critical page level errors
	self.addEventListener("error", function(err)
	{
		var message = "Error";
		if(err)
		{
			message = err.message;
			if(err.error)
			{
				message += "/" + err.error.stack;
			}
		}
		cjReportError(location.href, message);
	});
	threads = [];
	threads.push(new CheerpJThread());
	if(loaderPath == null)
	{
		try
		{
			throw new Error();
		}
		catch(e)
		{
			var stack = e.stack;
		}
		var part=cheerpjGetStackEntry(stack);
		var loaderStart = part.indexOf("http://");
		if(loaderStart == -1)
			loaderStart = part.indexOf("https://");
		var loaderEnd = part.indexOf(".js");
		assert(loaderStart >= 0 && loaderEnd > 0);
		var loaderFile = part.substring(loaderStart, loaderEnd+3);
		loaderPath = loaderFile.substr(0, loaderFile.length - "/loader.js".length);
	}
	// Install compatibility code for IE
	// TODO: Move this to a separate JS
	if(!Math.fround)
		Math.fround = function(v) { return v; };
	if(!Math.imul)
	{
		Math.imul = function(a, b) {
			var ah = (a >>> 16) & 0xffff;
			var al = a & 0xffff;
			var bh = (b >>> 16) & 0xffff;
			var bl = b & 0xffff;
			return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
		};
	}
	if(!Math.sign)
		Math.sign = function(x) { return ((x > 0) - (x < 0)) || +x; };
	if(!Math.clz32)
	{
		Math.clz32 = function(x) {
			if (x == null || x === 0)
				return 32;
			return 31 - Math.floor(Math.log(x >>> 0) * Math.LOG2E);
		};
	}
	if(!Math.cbrt)
	{
		Math.cbrt = function(x) {
			var y = Math.pow(Math.abs(x), 1/3);
			return x < 0 ? -y : y;
		};
	}
	if(!String.prototype.startsWith)
	{
		String.prototype.startsWith = function(searchString, position) {
			return this.substr(position || 0, searchString.length) === searchString;
		};
	}
	if (!String.prototype.endsWith)
	{
		String.prototype.endsWith = function(searchStr, Position) {
			// This works much better than >= because
			// it compensates for NaN:
			if (!(Position < this.length))
				Position = this.length;
			else
				Position |= 0; // round position
			return this.substr(Position - searchStr.length, searchStr.length) === searchStr;
		};
	}
	if(!cheerpjInitOnce.name)
	{
		Object.defineProperty(Function.prototype, 'name', { get: function() {
			var code = this.toString();
			var idxOfFunction = code.indexOf('function ');
			var idxOfName = idxOfFunction + 9;
			var idxOfNameEnd = code.indexOf('(', idxOfName);
			var name = code.substring(idxOfName, idxOfNameEnd);
			// TODO: Cache, maybe
			return name;
		} });
	}
}

function CheerpJProcess()
{
	this.threads = null;
	this.daemonThreads = null;
	this.endPromise = null;
}

CheerpJProcess.prototype.addThread=function(t)
{
	if(this.threads == null)
		this.threads = [];
	this.threads.push(t);
	t.parent = this;
}

CheerpJProcess.prototype.removeThread=function(t)
{
	assert(this.threads);
	var threadIndex = this.threads.indexOf(t);
	this.threads.splice(threadIndex,1);
	if(this.threads.length == 0)
	{
		if(this.endPromise)
			this.endPromise.done(t.retValue);
	}
}

function CheerpJThread()
{
	this.threadObj = null
	this.continuationStack = [];
	this.state = "PAUSED";
	this.retValue = null;
	this.schedTime = -0;
	this.schedTotal = -0;
	this.parent = null;
	this.sSlot = null;
}

function assert(cond)
{
	if(!cond)
		debugger
}

var cjScheduleDelayer = new MessageChannel();

// Arrays of pairs (absolute wake time, thread)
var cjScheduleTimers = []

var cjScheduledTimerId = 0;

function cheerpjScheduleTimer(absTime, thread, p)
{
	// TODO: Use binary search
	for(var i=0;i<cjScheduleTimers.length;i+=2)
	{
		if(cjScheduleTimers[i] > absTime)
		{
			cjScheduleTimers.splice(i, 0, absTime, thread);
			break;
		}
	}
	if(i == cjScheduleTimers.length)
		cjScheduleTimers.push(absTime, thread);
	buildContinuations(p, false);
	thread.state = "BLOCKED_WAIT";
	throw "CheerpJContinue";
}

// This function can only be called before cheerpjSchedule, it does not clear the timeout id
function cheerpjRemoveTimer(thread)
{
	for(var i=1;i<cjScheduleTimers.length;i+=2)
	{
		if(cjScheduleTimers[i] == thread)
		{
			cjScheduleTimers.splice(i-1, 2);
			break;
		}
	}
}

function cheerpjDoTimer()
{
	// Drop the time
	var curTime = cjScheduleTimers.shift();
	var now = Date.now();
	assert(curTime - now < 20);
	var thisThread = cjScheduleTimers.shift();
	assert(thisThread.state == "BLOCKED_WAIT");
	thisThread.state = "READY";
	assert(cjScheduledTimerId);
	cjScheduledTimerId = 0;
	cheerpjSchedule();
}

var cheerpjLastScheduled = 0;
var cheerpjRafTimestamp = -0;
var cheerpjRafPending = 0 // 0: not pending, 1: pending, 2: schedule delegated

function cheerpjRaf()
{
	if(cheerpjRafPending == 2)
		cjScheduleDelayer.port2.postMessage(0);
	cheerpjRafPending = 0;
}

function cjNotifyThread(threadObj)
{
	threadObj.v6(threadObj, null);
}

function cheerpjSchedule()
{
	// Chrome: Apparently the debugger may cause an event handler to schedule a thread while another one is running
	// Do not schedule something if there is a current thread
	if(currentThread!=null && currentThread.state == "RUNNING")
		return;
	if(cjScheduledTimerId)
	{
		clearTimeout(cjScheduledTimerId)
		cjScheduledTimerId = 0;
	}
	if(cheerpjRafPending == 0)
	{
		cheerpjRafTimestamp = Date.now();
		cheerpjRafPending = 1;
		if(!cjIsWorker)
			requestAnimationFrame(cheerpjRaf);
	}
	do
	{
		var foundReady = false;
		// Search the first READY thread and run its continuations
		for(var i=cheerpjLastScheduled;i<threads.length;i++)
		{
			if(threads[i].state == "READY")
			{
				var chosenThread = threads[i];
				chosenThread.schedTime = Date.now();
				currentThread = chosenThread;
				currentThread.state = "RUNNING";
				foundReady = true;
				runContinuationStack(chosenThread.retValue);
				cheerpjLastScheduled = i+1;
				if(i>0 && chosenThread.state == "PAUSED")
				{
					var threadIndex = threads.indexOf(chosenThread);
					// Remove dead thread
					if(threadIndex > 0)
					{
						// Notify waiting threads
						if(chosenThread.threadObj)
						{
							threads[0].continuationStack.push({func:cjNotifyThread,args:chosenThread.threadObj});
							if(threads[0].state == "PAUSED")
								threads[0].state = "READY";
						}
						// Remove from process if presend
						if(chosenThread.parent)
							chosenThread.parent.removeThread(chosenThread);
						threads.splice(threadIndex,1);
					}
				}
				chosenThread.schedTotal += (Date.now() - chosenThread.schedTime);
				break;
			}
		}
		// If we did not start from the first thread we need to make sure to reschedule
		if(foundReady==false && cheerpjLastScheduled != 0)
		{
			foundReady = true;
			cheerpjLastScheduled = 0;
		}
		// Check if at this point any sleeping thread should be woken up
		var now = Date.now();
		for(var i=0;i<cjScheduleTimers.length;i+=2)
		{
			if(cjScheduleTimers[i] < now)
			{
				cjScheduleTimers.shift();
				var thisThread = cjScheduleTimers.shift();
				assert(thisThread.state == "BLOCKED_WAIT");
				thisThread.state = "READY";
				foundReady = true;
			}
			else
				break;
		}
	}while(foundReady && now - cheerpjRafTimestamp < 17);
	if(foundReady)
	{
		cheerpjRafPending = 2;
		if(cjIsWorker)
			cheerpjRaf();
	}
	else if(cjScheduleTimers.length)
	{
		// No ready threads, schedule a timeout if required
		var delay = cjScheduleTimers[0] - Date.now();
		cjScheduledTimerId = setTimeout(cheerpjDoTimer, delay);
	}
	else if(cjLateStatus)
	{
		for(var i=0;i<threads.length;i++)
		{
			if(threads[i].state == "WAIT_NET")
			{
				cheerpjFlashStatus("Loading...");
				return;
			}
		}
	}
}

cjScheduleDelayer.port1.onmessage = cheerpjSchedule;

function cheerpjFileLoaded(e)
{
	var xhr = e.target;
	if(xhr.status == 200)
		xhr.fileRef.cheerpjDownload = new Uint8Array(xhr.response);
	else if(xhr.status >= 500 && xhr.status < 600)
		cjReportError(location.href, "Network error "+xhr.url+"/"+xhr.status);
	else
		xhr.fileRef.cheerpjDownload = null;
	var waitingThread = xhr.thread;
	assert(waitingThread.state == "BLOCKED_ON_FILE");
	waitingThread.state = "READY";
	cheerpjSchedule();
}

function cheerpjNetworkError(e)
{
	var xhr = e.target;
	var failCount = xhr.failureCount ? xhr.failureCount + 1 : 1;
	if(failCount > 5)
	{
		cjReportError(location.href, "Network error "+xhr.url);
		return;
	}
	// Try again
	var xhr2 = new XMLHttpRequest();
	xhr2.fileRef = xhr.fileRef;
	xhr2.thread = xhr.thread;
	xhr2.url = xhr.url;
	xhr2.method = xhr.method;
	xhr2.failureCount = failCount;
	xhr2.open(xhr.method, xhr.url);
	xhr2.responseType="arraybuffer";
	xhr2.onload=xhr.onload;
	xhr2.onerror=cheerpjNetworkError;
	xhr2.send();
}

function cheerpjNormalizePath(path)
{
	var parts = path.split('/');
	var newParts = [""]
	// TODO: Support cwd
	if(parts[0] != "" || parts.length == 1)
		newParts.push("files");
	else
		parts.shift();
	for(var i=0;i<parts.length;i++)
	{
		if(parts[i] == '.' || parts[i] == "")
			continue;
		else if(parts[i] == '..')
		{
			if(newParts.length)
				newParts.pop();
		}
		else
			newParts.push(parts[i]);
	}
	if(newParts.length == 1)
		newParts.push("");
	return newParts.join("/");
}

function cheerpjMangleClassName(c)
{
	var ret = "";
	var className = String.fromCharCode.apply(null, c.name2.value0).substr(1);
	switch(className)
	{
		case "[Z":
			return "AZ";
		case "[B":
			return "AB";
		case "[C":
			return "AC";
		case "[D":
			return "AD";
		case "[F":
			return "AF";
		case "[I":
			return "AI";
		case "[J":
			return "AJ";
		case "[S":
			return "AS";
		default:
			break;
	}
	while(className[0]=="[")
	{
		ret += "A";
		className = className.substring(1, className.length);
		// There is only 1 ; indipendently of the array levels
		if(className[className.length-1] == ';')
			className = className.substring(0, className.length-1);
		if(className[0] == 'L')
			className = className.substring(1, className.length);
	}
	if(className=="boolean")
		ret+='Z';
	else if(className=="byte")
		ret+='B';
	else if(className=="char")
		ret+='C';
	else if(className=="double")
		ret+='D';
	else if(className=="float")
		ret+='F';
	else if(className=="int")
		ret+='I';
	else if(className=="long")
		ret+='J';
	else if(className=="short")
		ret+='S';
	else if(className=="void")
		ret+='V';
	else
	{
		ret += "N";
		var curStart = 0;
		for(var i=0;i<className.length;i++)
		{
			if(className[i] == '.')
			{
				ret += (i-curStart) + className.substring(curStart,i);
				curStart = i+1;
			}
		}
		ret += (i-curStart) + className.substring(curStart,i);
	}
	return ret;
}

function cheerpjCreateDisplay(w, h, oldElem)
{
	// Create a div element that will contain all Java Windows
	var element = document.createElement("div");
	element.id="cheerpjDisplay";
	if(oldElem && w<0 && h<0)
	{
		// Compute the sizes from the parent
		element.style.width="100%";
		element.style.height="100%";
	}
	else
	{
		element.style.width=w+"px";
		element.style.height=h+"px";
	}
	element.classList.add("cheerpjLoading");
	element.classList.add("bordered");
	if(oldElem)
		oldElem.appendChild(element);
	else
		document.body.appendChild(element);
	cheerpjSetStatus(cjStatus, element);
	return element;
}

var cheerpjMEEvents = null;

function cheerpjMEKeyEvent(e)
{
	if(cheerpjMEEvents==null)
		return;
	if(cheerpjMEEvents.length && (cheerpjMEEvents[cheerpjMEEvents.length-1] instanceof CheerpJThread))
	{
		// Wake the thread up, and remove it from the queue
		var t = cheerpjMEEvents.pop();
		assert(t.state = "BLOCKED_ON_EVENTS");
		t.state = "READY";
	}
	// Positive values are Unicode values, negative values are custom, for now pass all as custom
	var keyCode = -e.keyCode;
	cheerpjMEEvents.push(/*KEY_EVENT*/1, e.type == "keydown" ? /*PRESSED*/1 : /*RELEASED*/2, keyCode);
	cheerpjSchedule();
}

function cheerpjMEMouseEvent(e)
{
	if(cheerpjMEEvents==null)
		return;
	if(cheerpjMEEvents.length && (cheerpjMEEvents[cheerpjMEEvents.length-1] instanceof CheerpJThread))
	{
		// Wake the thread up, and remove it from the queue
		var t = cheerpjMEEvents.pop();
		assert(t.state = "BLOCKED_ON_EVENTS");
		t.state = "READY";
	}
	var eventType = -1;
	var rect = e.target.getBoundingClientRect();
	var x = (e.clientX - rect.left);
	var y = (e.clientY - rect.top);
	if(e.type == "mousedown")
		eventType = /*PRESSED*/1;
	else if(e.type == "mouseup")
		eventType = /*RELEASED*/2;
	else if(e.type == "mousemove")
		eventType = /*DRAGGED*/3;
	else
		debugger
	cheerpjMEEvents.push(/*PEN_EVENT*/2, eventType, x, y);
	cheerpjSchedule();
}

function cheerpjCreateCanvas(w, h)
{
	// Create a div element that will contain all Java Windows
	var element = document.createElement("canvas");
	element.id="cheerpjCanvas";
	element.width=w;
	element.height=h;
	element.style.borderColor="#000";
	element.style.borderStyle="solid";
	document.addEventListener("keydown", cheerpjMEKeyEvent);
	document.addEventListener("keyup", cheerpjMEKeyEvent);
	element.addEventListener("mousedown", cheerpjMEMouseEvent);
	element.addEventListener("mouseup", cheerpjMEMouseEvent);
	element.addEventListener("mousemove", cheerpjMEMouseEvent);
	document.body.appendChild(element);
}

var cheerpjCL = null;
var cheerpjAOTPackages = {};
var cheerpjAppletObserver = null;

function cheerpjMutationObserver(e)
{
	for(var i=0;i<e.length;i++)
	{
		var r=e[i];
		for(var j=0;j<r.addedNodes.length;j++)
		{
			var n = r.addedNodes[j];
			var lowerCaseNodeName = n.nodeName.toLowerCase();
			if(lowerCaseNodeName == "applet" || lowerCaseNodeName == "object" || lowerCaseNodeName == "embed" ||
				lowerCaseNodeName == "cheerpj-applet" || lowerCaseNodeName == "cheerpj-object" || lowerCaseNodeName == "cheerpj-embed")
			{
				cheerpjRewriteAndReplaceApplet(n);
			}
			if(!n.children)
				continue;
			// Also check known children right away
			for(var k=0;k<n.children.length;k++)
			{
				var lowerCaseNodeName = n.children[k].nodeName.toLowerCase();
				if(lowerCaseNodeName == "applet" || lowerCaseNodeName == "object" || lowerCaseNodeName == "embed" ||
					lowerCaseNodeName == "cheerpj-applet" || lowerCaseNodeName == "cheerpj-object" || lowerCaseNodeName == "cheerpj-embed")
				{
					cheerpjRewriteAndReplaceApplet(n.children[k]);
				}
			}
		}
	}
}

function cjGetAppletOrObjectOrEmbedParams(elem)
{
	// <applet> and <embed> have the main data as attributes, while <object> has it as params
	// in both cases extra <param> children should be available to the applet
	var lowerCaseNodeName = elem.nodeName.toLowerCase();
	if(lowerCaseNodeName.startsWith("cheerpj-"))
		lowerCaseNodeName = lowerCaseNodeName.substr(8);
	var isApplet = lowerCaseNodeName == "applet";
	var isObject = lowerCaseNodeName == "object";
	var isEmbed = lowerCaseNodeName == "embed";
	assert(isApplet || isObject || isEmbed);
	// 1) Get DOM level attributes
	var id = elem.getAttribute("id");
	var name = elem.getAttribute("name");
	var width = elem.getAttribute("width");
	var height = elem.getAttribute("height");
	var appletParameters = [];
	if(width == null)
	{
		width = elem.width;
		width = width.toString();
	}
	else
		appletParameters.push("width", width);
	if(height == null)
	{
		height = elem.height;
		height = height.toString();
	}
	else
		appletParameters.push("height", height);
	// 2) Try attributes first
	var code = null;
	var codebase = elem.getAttribute("codebase");
	var archive = elem.getAttribute("archive");
	if(isApplet)
	{
		code = elem.getAttribute("code");
	}
	else if(isObject)
	{
		// Is this something we should handle?
		var codetype = elem.getAttribute("codetype");
		if(codetype && codetype != "application/java")
			return null;
		var classid = elem.getAttribute("classid");
		if(classid.startsWith("java:"))
		{
			// This refers to the applet class
			code = classid.substr(5);
		}
		else if(classid == "clsid:8AD9C840-044E-11D1-B3E9-00805F499D93" ||
			classid == "clsid:CAFEEFAC-0017-0000-FFFF-ABCDEFFEDCBA")
		{
			// Clear codebase, it refers to the install file for Windows
			codebase = null;
		}
		else
			return;
	}
	var jnlp_href = null;
	if(isEmbed)
	{
		// Try to get JNLP url from poorly documented launchjnlp attribute
		jnlp_href = elem.getAttribute("launchjnlp");
	}
	// 3) Gather extra parameters for applet, if object actually also gather main attributes
	for(var i=0;i<elem.children.length;i++)
	{
		var p = elem.children[i];
		if(p.nodeName.toLowerCase() != "param")
			continue;
		// Check for JNLP forwarding, it should be handled with priority
		var paramName = p.getAttribute("name");
		var paramValue = p.getAttribute("value");
		if(paramName)
			paramName = paramName.toLowerCase();
		if(paramName == "jnlp_href")
		{
			jnlp_href = paramValue;
			continue;
		}
		else if(isObject || isApplet)
		{
			if(paramName == "code" || paramName == "java_code")
			{
				code = paramValue;
				continue;
			}
			else if(paramName == "codebase" || paramName == "java_codebase")
			{
				codebase = paramValue;
				continue;
			}
			else if(paramName == "archive" || paramName == "java_archive")
			{
				archive = paramValue;
				continue;
			}
		}
		appletParameters.push(paramName);
		appletParameters.push(paramValue);
	}
	return {id:id,name:name,width:width,height:height,code:code,codebase:codebase,archive:archive,jnlp_href:jnlp_href,appletParameters:appletParameters};
}

function cheerpjRewriteAndReplaceApplet(elem)
{
	if(elem.getAttribute("data-cheerpj")!=null)
		return;
	// It could be that the same applet has been handled as a child of a previous mutation event
	if(elem.parentNode == null)
		return;
	// It is useful to replace applet tags with object tags, sites have dropped chrome already and in this way we can have Firefox like behaviour
	var cheerpjPrefixed = elem.nodeName.toLowerCase().startsWith("cheerpj-");
	var newObj = document.createElement(cheerpjPrefixed ? "cheerpj-object" : "object");
	// Mark this object to keep the icon on the page
	newObj.setAttribute("data-cheerpj", "");
	var props = cjGetAppletOrObjectOrEmbedParams(elem);
	if(props == null)
		return;
	if(props.id)
		newObj.setAttribute("id",props.id);
	if(props.name)
		newObj.setAttribute("name",props.name);
	if(elem.getAttribute("style"))
		newObj.setAttribute("style", elem.getAttribute("style"));
	if(elem.getAttribute("class"))
		newObj.setAttribute("class", elem.getAttribute("class"));
	newObj.setAttribute("type","application/x-java-applet");
	newObj.style.display = "block";
	newObj.style.position = "relative";
	newObj.classList.add("cheerpjLoading");
	var appletClass = props.code;
	if(appletClass && appletClass.endsWith(".class"))
		appletClass = appletClass.substring(0, appletClass.length - 6);
	var width = props.width;
	var height = props.height;
	newObj.setAttribute("width", width);
	newObj.setAttribute("height", height);
	newObj.style.width = width;
	newObj.style.height = height;
	// Add an empty child tag to newObj to remove the default sizing
	var s = document.createElement("span");
	newObj.appendChild(s);
	elem.parentNode.replaceChild(newObj, elem);
	var display = document.getElementById("cheerpjDisplay");
	if(display == null)
	{
		// Create a new full screen overlay
		var overlay = document.createElement("div");
		overlay.classList.add("overlay");
		document.body.appendChild(overlay);
		display = cheerpjCreateDisplay(-1,-1,overlay);
		display.classList.remove("cheerpjLoading");
		display.classList.remove("displayBg");
	}
	// In the context of an applet we want to disable the border when the loading is done
	display.classList.remove("bordered");
	// Detect actual computed size for applet
	var computedWidth = newObj.clientWidth;
	var computedHeight = newObj.clientHeight;
	var appletParameters = props.appletParameters;
	var codeBase = props.codebase;
	if(props.jnlp_href)
	{
		// Ok this applet expects to be upgraded to JNLP, include the jnlp.js script
		var newScript = document.createElement("script");
		newScript.src = loaderPath + "/jnlp.js";
		newScript.onload = function()
		{
			var xhr = new XMLHttpRequest();
			xhr.open("GET", props.jnlp_href);
			xhr.onload=function(e)
			{
				var retData={classPath:null,mainClass:null};
				parseJNLPData(e.target.responseXML, props.jnlp_href, retData)
				if(retData.mainClass == null)
				{
					// Not an applet, possibly an application
					return;
				}
				// HACK: Convince Java detectors that this is updated
				cheerpjRunStaticMethod(threads[0], "java/lang/System", "11setPropertyEN4java4lang6StringN4java4lang6StringEN4java4lang6String", "java.version", "1.8.0_300");
				cheerpjRunStaticMethod(threads[0], "java/lang/System", "11setPropertyEN4java4lang6StringN4java4lang6StringEN4java4lang6String", "java.class.path", retData.classPath);
				// For applets we want to enable local access using XHR
				cheerpjRunStaticMethod(threads[0], "java/lang/System","11setPropertyEN4java4lang6StringN4java4lang6StringEN4java4lang6String","java.protocol.handler.pkgs","com.leaningtech.handlers");
				cheerpjCreateInstance("N3com11leaningtech7cheerpj19CheerpJAppletViewer", "V").then(function(a) { 
					var loc = codeBase;
					if(!codeBase || codeBase[0] != '/')
					{
						loc = window.location.href;
						loc = loc.substring(0, loc.lastIndexOf('/')+1);
					}
					else
						loc = window.location.origin;
					if(codeBase)
						loc += codeBase;
					// startAppletN4java4lang6StringN4java4lang6StringIIN4java4lang6ObjectN4java4lang6ObjectEV
					cheerpjRunMethod(a, "v529", retData.mainClass, loc, window.location.href, null, computedWidth, computedHeight, newObj, []);
				});
			}
			xhr.responseType="document";
			xhr.overrideMimeType('text/xml');
			xhr.send();
		};
		document.head.appendChild(newScript);
		return;
	}
	var absPath = window.location.href;
	var parts = absPath.split('/');
	// Drop the http part
	parts.splice(0,3);
	// Drop the last part
	parts.pop();
	// The class path(s) should be
	//     /app/codebase/ -> for absolute codebases
	//     /app/relPath/codebase/ -> for relative codebases
	//     http:// -> for fully qualified codebases
	//     /app/relPath/ -> by default
	var relPath = parts.join('/');
	var baseClassPath = null;
	if(codeBase)
	{
		if(codeBase.startsWith("http://") || codeBase.startsWith("https://"))
			baseClassPath = codeBase;
		else if(codeBase[0] == '/')
			baseClassPath = "/app" + codeBase;
		else
			baseClassPath = "/app/" + relPath + "/" + codeBase;
	}
	else
	{
		// Default classpath, local to the current path
		baseClassPath = "/app/" + relPath;
	}
	var jarArchive = props.archive;
	var classPath = null;
	if(jarArchive)
	{
		// This is comma separated, apparently
		var archives = jarArchive.split(',');
		for(var i=0;i<archives.length;i++)
		{
			var archive = archives[i].trim();
			if(archive.startsWith("http://") || archive.startsWith("https://"))
				archive = archive;
			else if(archive[0] == '/')
				archive = "/app" + archive;
			else
				archive = baseClassPath + "/" + archive;
			if(classPath == null)
				classPath = archive;
			else
				classPath += ":" + archive;
		}
	}
	else
	{
		classPath = baseClassPath;
	}
	cheerpjRunStaticMethod(threads[0], "java/lang/System", "11setPropertyEN4java4lang6StringN4java4lang6StringEN4java4lang6String", "java.class.path", classPath);
	// For applets we want to enable local access using XHR
	cheerpjRunStaticMethod(threads[0], "java/lang/System","11setPropertyEN4java4lang6StringN4java4lang6StringEN4java4lang6String","java.protocol.handler.pkgs","com.leaningtech.handlers");
	cheerpjCreateInstance("N3com11leaningtech7cheerpj19CheerpJAppletViewer", "V").then(function(a) { 
		var loc = null;
		if(codeBase)
		{
			if(codeBase[codeBase.length-1] != '/')
				codeBase += "/";
			if(codeBase.startsWith("http://") || codeBase.startsWith("https://"))
				loc = codeBase;
			else if(codeBase[0] == '/')
				loc = window.location.origin + codeBase;
			else
				loc = window.location.origin + "/" + relPath + "/" + codeBase;
		}
		else
			loc = window.location.origin + "/" + relPath + "/";
		// startAppletN4java4lang6StringN4java4lang6StringIIN4java4lang6ObjectN4java4lang6ObjectEV
		cheerpjRunMethod(a, "v529", appletClass, loc, window.location.href, null, computedWidth, computedHeight, newObj, appletParameters);
	});
}

var cheerpjPendingLoads = 0;
var cheerpjAppendedArguments = null;

function cheerpjLoaderReady()
{
	cheerpjPendingLoads--;
	if(cheerpjPendingLoads == 0)
	{
		cheerpjFSInit();
		threads[0].state = "READY";
		cheerpjSetStatus("CheerpJ runtime ready");
		cheerpjSchedule();
	}
}

function cheerpjAddCSS(file)
{
	var link = document.createElement("link");
	link.setAttribute("rel","stylesheet");
	link.setAttribute("type","text/css");
	link.setAttribute("href",file);
	link.setAttribute("media","screen");
	document.head.appendChild(link);
}

function cheerpjAddScript(file, callback)
{
	if(cjIsWorker)
	{
		importScripts(file);
		callback();
		return;
	}
	var script = document.createElement("script");
	script.onload = callback;
	script.onerror = function(e)
	{
		var failCount = this.failureCount ? this.failureCount + 1 : 1;
		if(failCount > 5)
		{
			cjReportError(location.href, "Core JS error "+e.target.src);
			return;
		}
		// Try again, make a new script element
		var newScript = document.createElement("script");
		newScript.failureCount = failCount;
		newScript.onload = this.onload;
		newScript.onerror = this.onerror;
		newScript.src = this.src;
		newScript.crossOrigin = "anonymous";
		this.parentNode.replaceChild(newScript, this);
	};
	script.src = file;
	script.crossOrigin = "anonymous";
	document.head.insertBefore(script, document.head.firstChild);
}

function cheerpjAttachBodyObserver()
{
	// Register an observer listener for dynamically loaded applets
	cheerpjAppletObserver = new MutationObserver(cheerpjMutationObserver);
	cheerpjAppletObserver.observe(document.body, { subtree: true, childList: true });
	var elemNames = ["applet", "cheerpj-applet", "object", "cheerpj-object", "embed", "cheerpj-embed"];
	for(var i=0;i<elemNames.length;i++)
	{
		var elems = document.getElementsByTagName(elemNames[i]);
		if(elems.length)
		{
			cheerpjRewriteAndReplaceApplet(elems[0]);
			return;
		}
	}
}

function cheerpjInit(options)
{
	var isME = options && options.isME ? true : false;
	cjListener = options && options.listener ? options.listener : null;
	// Check for query string parameters
	var query = location.search;
	if(query[0] == "?")
	{
		query = query.substr(1);
		var parts = query.split("&");
		for(var i=0;i<parts.length;i++)
		{
			var keyValue = parts[i].split("=");
			if(keyValue[0] == "cheerpjJarJsOverridePath")
				cheerpjJarJsOverridePath = decodeURIComponent(keyValue[1]);
			else if(keyValue[0] == "cheerpjAppendArgument")
			{
				if(cheerpjAppendedArguments === null)
					cheerpjAppendedArguments = [];
				cheerpjAppendedArguments.push(decodeURIComponent(keyValue[1]));
			}
		}
	}
	cheerpjInitOnce();
	// What level of status reporting has been requested
	if(options && options.status)
	{
		if(options.status == "splash")
		{
			cjLateStatus = false;
		}
		else if(options.status == "none")
		{
			cjStatus = null;
			cjLateStatus = false;
		}
	}
	cheerpjSetStatus("CheerpJ is initializing");
	if(!cjIsWorker)
		cheerpjAddCSS(loaderPath + "/cheerpj.css");
	cheerpjPendingLoads = 5;
	cheerpjAddScript(loaderPath + "/icu.js", cheerpjLoaderReady);
	cheerpjAddScript(loaderPath + "/64bit.js", cheerpjLoaderReady);
	cheerpjAddScript(loaderPath + "/cheerpj.js", cheerpjLoaderReady);
	cheerpjAddScript(loaderPath + "/cheerpOS.js", cheerpjLoaderReady);
	threads[0].state = "BLOCKED_ON_INIT";
	threads[0].continuationStack.unshift({func:function(args)
		{
			cheerpjEnsureInitialized(args, null);
		}, args: "N4java4lang6Object"});
	threads[0].continuationStack.unshift({func:function(args)
		{
			cheerpjEnsureInitialized(args, null);
		}, args: "N4java4lang6String"});
	threads[0].continuationStack.unshift({func:function(args)
		{
			cheerpjEnsureInitialized(args, null);
		}, args: "N4java4lang5Class"});
	threads[0].continuationStack.unshift({func:function(args)
		{
			cheerpjEnsureInitialized(args, null);
		}, args: "N4java4lang6System"});
	threads[0].continuationStack.unshift({func:function(args)
		{
			cheerpjAddPrimitiveClass("boolean");
			cheerpjAddPrimitiveClass("byte");
			cheerpjAddPrimitiveClass("char");
			cheerpjAddPrimitiveClass("short");
			cheerpjAddPrimitiveClass("int");
			cheerpjAddPrimitiveClass("long");
			cheerpjAddPrimitiveClass("float");
			cheerpjAddPrimitiveClass("double");
			cheerpjAddPrimitiveClass("void");
		}, args: null});
	threads[0].continuationStack.unshift({func:function(args)
		{
			cheerpjEnsureInitialized(args, null);
		}, args: "N4java4lang4Math"});
	if(!isME)
		cheerpjAddScript(loaderPath + "/runtime/rt.jar.js", cheerpjLoaderReady);
	else
	{
		// This should be not split
		cheerpjAddScript(loaderPath + "/runtime_me/rt.jar.js", cheerpjLoaderReady);
	}
	var ret=cheerpjRunStaticMethod(threads[0], "java/lang/System", "21initializeSystemClassEVEV");
	threads[0].continuationStack.unshift({func:function(args)
		{
			// Enable all threads waiting for init
			cjInitDone = 1;
			for(var i=0;i<threads.length;i++)
			{
				if(threads[i].state == "BLOCKED_ON_INIT")
					threads[i].state = "READY"
			}
		}, args: null});
	// Find the applet tag and create the applet viewer
	if(!cjIsWorker)
	{
		if(document.body)
			cheerpjAttachBodyObserver();
		else
			window.addEventListener("DOMContentLoaded", cheerpjAttachBodyObserver);
	}
	else
		cheerpjSchedule();
	return ret;
}

function cheerpjJNILongRetWrapper(jniFunc, paramsArray, p)
{
	var a={f:cheerpjJNILongRetWrapper,pc:0,p:p,s0:paramsArray}
	// Inject this wrapper as the parent
	paramsArray.push(a);
	// Prepend an object to store the 64bit result
	paramsArray.unshift(new Uint8Array(8),0);
	a.pc=0;
	jniFunc.apply(null, paramsArray);
	var paramsArray=a.s0;
	// TODO: Optimize
	var tmp = new DataView(paramsArray[0].buffer);
	// TODO: Highint should have reversed entries
	hSlot = tmp.getInt32(0,true);
	return tmp.getInt32(4,true);
}

function cheerpjJNIBridge(args, instance)
{
	var callerFuncName = cheerpjDecompressSymbol(cheerpjJNIBridge.caller.name.substr(1));
	var jniFuncName = "Java";
	// We need to build a JNI compatible function name from the CheerpJ encoded name
	var lastNameStart = 2;
	var charCodeO = 0x30;
	var charCode9 = 0x39;
	var callerFuncNameLength = callerFuncName.length;
	var nameLength = 0;
	while(lastNameStart!=callerFuncNameLength)
	{
		var charCode = callerFuncName.charCodeAt(lastNameStart);
		if(charCode >= charCodeO && charCode <= charCode9)
		{
			nameLength*=10;
			nameLength+=charCode - charCodeO;
			lastNameStart++;
			continue;
		}
		else if(nameLength == 0)
		{
			break;
		}
		// Length parsed, now extract the name
		var part = callerFuncName.substr(lastNameStart, nameLength);
		jniFuncName += '_' + part;
		lastNameStart += nameLength;
		nameLength = 0;
	}
	var skipToFunction = lastNameStart + 1;
	var jniFunc = self[jniFuncName];
	assert(jniFunc);
	// We need to parse the typed from the name to understand how to call the method
	var paramsPart = callerFuncName;
	// Add two parameters for the jnienv and the class
	var jnienv = JNIGetEnv();
	var paramsArray = [jnienv,0];
	var usedArgs = 0;
	if(instance)
	{
		paramsArray.push(args.l0);
		usedArgs++;
	}
	else
	{
		var parts = jniFuncName.split('_');
		var realClassName = parts[1];
		for(var i=2;i<parts.length-1;i++)
		{
			realClassName += '/' + parts[i];
		}
		paramsArray.push(cheerpjGetClass(realClassName));
	}
	var isArray = false;
	loop:for(var i=skipToFunction;i<paramsPart.length;i++)
	{
		switch(paramsPart[i])
		{
			case 'E':
				i++;
				break loop;
			case 'V':
				continue;
			case 'A':
				isArray = true;
				continue;
			case 'N':
				var decodedName = decodeClassName(paramsPart.substr(i));
				var parts = decodedName.split('/');
				for(var j=0;j<parts.length;j++)
					i += parts[j].length.toString().length + parts[j].length;
				paramsArray.push(args["l"+usedArgs++]);
				break;
			case 'F':
			case 'I':
			case 'S':
			case 'C':
			case 'B':
			case 'Z':
				paramsArray.push(args["l"+usedArgs++]);
				break;
			case 'J':
				if(isArray)
					paramsArray.push(args["l"+usedArgs++]);
				else
				{
					// Create a 64-bit object compatible with cheerp
					var tmp = new Uint8Array(8);
					var lowBits = args["l"+usedArgs];
					var highBits = args["l"+(usedArgs+1)];
					// First the high bits, then the low bits, following Cheerp convention
					tmp[0] = highBits & 0xff;
					tmp[1] = (highBits>>8) & 0xff;
					tmp[2] = (highBits>>16) & 0xff;
					tmp[3] = (highBits>>24) & 0xff;
					tmp[4] = lowBits & 0xff;
					tmp[5] = (lowBits>>8) & 0xff;
					tmp[6] = (lowBits>>16) & 0xff;
					tmp[7] = (lowBits>>24) & 0xff;
					paramsArray.push(tmp,0);
					usedArgs+=2;
				}
				break;
			case 'D':
				if(isArray)
					paramsArray.push(args["l"+usedArgs++]);
				else
				{
					// The first parameter is the data, the other is dropped
					paramsArray.push(args["l"+usedArgs]);
					usedArgs+=2;
				}
				break;
			default:
		}
		isArray = false;
	}
	assert(!args.hasOwnProperty("l"+usedArgs));
	var isLongRet = paramsPart[i] == 'J';
	if(isLongRet)
		var ret=cheerpjJNILongRetWrapper(jniFunc, paramsArray, args.p);
	else
	{
		paramsArray.push(args.p);
		var ret=jniFunc.apply(null, paramsArray);
	}
	return ret;
}

function cheerpjEnsureInitialized(mangledName, p)
{
	assert(mangledName[0] == 'N');
	// Check the guard, the fast path does not require a stacklet
	if(self[mangledName + 'G'])
		return;
	// Slow path, the guard is either not existing or still uninitialized
	var a={p:p,f:cheerpjEnsureInitialized,pc:0,mangledName:mangledName};
	a.pc=0;loadWeakClass(mangledName, a, false);
	assert(self.hasOwnProperty(mangledName));
	a.pc=1;cheerpjClassInit(mangledName, a);
}

var cheerpjSafeInitMap = {}

function cheerpjSafeInitGuard(className)
{
	if(!cheerpjSafeInitMap.hasOwnProperty(className))
	{
		// The class is not initialized yet, make currentThread it's init thread
		cheerpjSafeInitMap[className] = { initThread: currentThread, blockedThreads: [] };
		return false;
	}
	// If it's a recursive init from the current thread don't enter the init again
	var initData = cheerpjSafeInitMap[className];
	if(initData.initThread == currentThread)
		return true;
	// A different thread is trying to init the class, block it
	buildContinuations(cheerpjSafeInitGuard.caller.arguments[0].p, true);
	currentThread.state = "BLOCKED_ON_SAFE_INIT";
	initData.blockedThreads.push(currentThread);
	throw "CheerpJContinue";
}

function cheerpjSafeInitFinish(className)
{
	var initData = cheerpjSafeInitMap[className];
	assert(initData.initThread == currentThread);
	for(var i=0;i<initData.blockedThreads.length;i++)
	{
		assert(initData.blockedThreads[i].state == "BLOCKED_ON_SAFE_INIT");
		initData.blockedThreads[i].state = "READY";
	}
	delete cheerpjSafeInitMap[className];
}

function cheerpjThrow(a, ex)
{
	// Look for an exception handler in the stacklet chain, so that we can skip buildContinuations for all methods without handlers
	var curA = a;
	while(curA)
	{
		assert(curA.f);
		var exFuncName = curA.f.name + 'E';
		if(!self.hasOwnProperty(exFuncName))
		{
			curA = curA.p;
			continue;
		}
		// Flatten the surviving stack to continuations
		buildContinuations(curA, false);
		break;
	}
	// Now find the first method in the continuation stack that has a exception handling function
	// We can pop the elements along the way, as the stack is unrolled until handling happens
	while(currentThread.continuationStack.length)
	{
		var c = currentThread.continuationStack.pop();
		if(!c.args.f)
			continue;
		var exFuncName = c.args.f.name + 'E';
		if(!self.hasOwnProperty(exFuncName))
			continue;
		var exFunc = self[exFuncName];
		// Ok, we got a possible handler
		var ret = exFunc(c.args, ex);
		if(c.args.pc == -1)
		{
			// PC was invalidated, so this handler did not match for the exception
			continue;
		}
		// The exception handler returned cleanly we can restart from the caller of this function
		currentThread.retValue = ret;
		currentThread.state = "READY";
		break
	}
	if(currentThread.continuationStack.length == 0)
	{
		var detailMessage = "";
		if(ex.detailMessage1)
			detailMessage = " " + String.fromCharCode.apply(null, ex.detailMessage1.value0).substr(1);
		var message = "Unhandled exception "+ex.constructor.name+detailMessage;
		if(ex.backtrace0)
			message += "/" + ex.backtrace0;
		cjReportError(location.href, message);
		console.log(message);
	}
	// Go back to the scheduler
	throw "CheerpJContinue";
}

function cheerpjApplyWithArgs(args)
{
	args.func.apply(null,args.args);
}

function cheerpjRunMain(className, classPath)
{
	// Prepend the /app/ prefix to the classpath
	var paths = classPath.split(':');
	for(var i=0;i<paths.length;i++)
	{
		if(paths[i][0] != '/')
			paths[i] = "/app/" + paths[i];
	}
	classPath = paths.join(':');
	// Create a new thread and a new process
	var process = new CheerpJProcess();
	process.endPromise = new CheerpJPromise();
	var mainArgs = Array.prototype.slice.call(arguments, 2);
	// Set the classpath
	cheerpjRunStaticMethod(threads[0], "java/lang/System", "11setPropertyEN4java4lang6StringN4java4lang6StringEN4java4lang6String", "java.class.path", classPath);
	// Use the LauncherHelper class
	cheerpjRunStaticMethod(threads[0], "sun/launcher/LauncherHelper", "16checkAndLoadMainEZIN4java4lang6StringEN4java4lang5Class", /*printToStderr*/ 0, /*LM_CLASS*/ 1, className).then(
		function(b){
			// At this point the String class is initialized
			var argsArray = ["[Ljava/lang/String;"];
			for(var i=0;i<mainArgs.length;i++)
				argsArray.push(cheerpjInternString(mainArgs[i]));
			var a = [argsArray,null];
			var func=cjMethodDynamic("Z"+cheerpjMangleClassName(b)+"4mainEAN4java4lang6StringEV");
			assert(func);
			console.log("Run main for "+b.jsName);
			var newThread = new CheerpJThread();
			threads.push(newThread);
			process.addThread(newThread);
			newThread.continuationStack.push({func:cheerpjApplyWithArgs,args:{func:func,args:a}});
			newThread.state = "READY";
			cjScheduleDelayer.port2.postMessage(0);
		});
	cjScheduleDelayer.port2.postMessage(0);
	return process.endPromise;
}

function cheerpjRunJar(jarName)
{
	if(jarName[0] != '/')
		jarName = "/app/" + jarName;
	// Set the classpath
	cheerpjRunStaticMethod(threads[0], "java/lang/System", "11setPropertyEN4java4lang6StringN4java4lang6StringEN4java4lang6String", "java.class.path", jarName);
	// Use the LauncherHelper class
	cheerpjRunStaticMethod(threads[0], "sun/launcher/LauncherHelper", "16checkAndLoadMainEZIN4java4lang6StringEN4java4lang5Class", /*printToStderr*/ 0, /*LM_JAR*/ 2, jarName);
	var mainArgs = Array.prototype.slice.call(arguments, 1);
	// Inject a method to receive the returned class and schedule the main
	threads[0].continuationStack.unshift({func:function(args, b)
		{
			// At this point the String class is initialized
			var argsArray = ["[Ljava/lang/String;"];
			for(var i=0;i<args.length;i++)
				argsArray.push(cheerpjInternString(args[i]));
			cheerpjRunStaticMethod(threads[0], b.jsName, "4mainEAN4java4lang6StringEV", argsArray);
			cheerpjSetStatus("Jar is loaded, main is starting");
		}, args:mainArgs});
}


function cheerpjRunJarWithClasspath(jarName, classPath)
{
	if(jarName[0] != '/')
		jarName = "/app/" + jarName;
	// Create a new thread and a new process
	var process = new CheerpJProcess();
	var newThread = new CheerpJThread();
	threads.push(newThread);
	process.addThread(newThread);
	newThread.state = cjInitDone ? "READY" : "BLOCKED_ON_INIT";
	// Set the classpath
	cheerpjRunStaticMethod(newThread, "java/lang/System", "11setPropertyEN4java4lang6StringN4java4lang6StringEN4java4lang6String", "java.class.path", jarName+":"+classPath);
	// Use the LauncherHelper class
	cheerpjRunStaticMethod(newThread, "sun/launcher/LauncherHelper", "16checkAndLoadMainEZIN4java4lang6StringEN4java4lang5Class", /*printToStderr*/ 0, /*LM_JAR*/ 2, jarName);
	var mainArgs = Array.prototype.slice.call(arguments, 2);
	// Inject a method to receive the returned class and schedule the main
	newThread.continuationStack.unshift({func:function(args, b)
		{
			// At this point the String class is initialized
			var argsArray = ["[Ljava/lang/String;"];
			for(var i=0;i<args.length;i++)
				argsArray.push(cheerpjInternString(args[i]));
			cheerpjRunStaticMethod(newThread, b.jsName, "4mainEAN4java4lang6StringEV", argsArray);
			cheerpjSetStatus("Jar is loaded, main is starting");
		}, args:mainArgs});
}

function cheerpjGetStackEntry(s)
{
	var frames=s.split("  at ");
	if(frames.length == 1)
	{
		// It was not chrome probably, try again
		frames=s.split("@");
	}
	var firstFrame=frames[1];
	var path=firstFrame.split('.js:')[0]+".js";
	return path;
}

function cheerpjGetJSFromClassName(mangledName)
{
	// If the class is not loaded already stop here
	var classConstructor = self[mangledName+"X"];
	if(!classConstructor)
		return null;
	// Produce an error from the class initializer so that we can see the file name
	try
	{
		classConstructor(null);
		debugger
	}
	catch(e)
	{
		var s=e.stack;
		var part=cheerpjGetStackEntry(s);
		var protocolPart = "http://";
		var tmp=part.split(protocolPart);
		if(tmp.length < 2)
		{
			protocolPart = "https://";
			tmp=part.split(protocolPart);
		}
		return protocolPart + tmp[1];
	}
	debugger
}

function cheerpjAdaptLegacyArgs(args)
{
	var ret={p:args[args.length-1]};
	for(var i=0;i<args.length-1;i++)
		ret["l"+i] = args[i];
	return ret;
}

function cheerpjArrayInstanceof(obj, arrayType, p)
{
	var objConstructorFunc=null;
	if(!Array.isArray(obj))
		return 0;
	var objArrayType = obj[0];
	// Easy case, it's exactly the same type
	if(objArrayType===arrayType)
		return 1;
	// Nope, remove as many array layers as possible on both sides
	while(objArrayType[0]=='[')
	{
		// If the object is an array but the type is not we return false, unless the type is Object
		if(arrayType[0]!='[')
			return arrayType == "Ljava/lang/Object" ? 1 :0;
		objArrayType=objArrayType.substr(1,objArrayType.length-2);
		arrayType=arrayType.substr(1,arrayType.length-2);
	}
	// There are more array layers on the type than on the object, return false
	if(arrayType[0]=='[')
		return 0;
	// Same amount of array layers, now check for inheritance and interfaces
	assert(arrayType[0]=='L');
	assert(objArrayType[0]=='L');
	arrayType = arrayType.substr(1);
	objArrayType = objArrayType.substr(1);
	// TODO: Maybe we could mangle above so that arrays are just an A prefix
	var objArrayClass = cheerpjGetClass(objArrayType);
	objConstructorFunc = cheerpjGetClassConstructor(objArrayClass);
	if(!objConstructorFunc || !self[objConstructorFunc.name+'G'])
	{
		var mangledObjType = cheerpjMangleClassName(objArrayClass);
		var a={p:p,f:cheerpjArrayInstanceof,pc:0,objArrayClass:objArrayClass,arrayType:arrayType};
		a.pc=0;cheerpjEnsureInitialized(mangledObjType, a);
		objConstructorFunc = cheerpjGetClassConstructor(objArrayClass);
	}
	var arrayClass = cheerpjGetClass(arrayType); 
	assert(objConstructorFunc);
	assert(objConstructorFunc.prototype.ifs);
	var isInterface=objConstructorFunc.prototype.ifs.indexOf(arrayType)!=-1;
	if(isInterface)
		return 1;
	var typeConstructorFunc = cheerpjGetClassConstructor(arrayClass);
	assert(typeConstructorFunc);
	if((new objConstructorFunc) instanceof typeConstructorFunc)
		return 1;
	return 0;
}

function cheerpjClassInit(mangledClassName, p)
{
	var cinit=self[mangledClassName + 'X'];
	cinit({p:p,f:null,pc:0});
}

function cjG(a)
{
	// Centralized handler for all guards
	// Deduce the guard to initialize by code inspection
	var code = a.f.toString();
	var guardPos = 0;
	var pcVal = a.pc | 0;
	if(pcVal < 0)
	{
		var pcVal = -pcVal | 0;
		guardPos = pcVal | 0;
		// Skip until the guard, first "a.pc=-" and ";;if((";
		guardPos = guardPos + 12 | 0;
		while(pcVal)
		{
			guardPos = guardPos + 1 | 0;
			pcVal = pcVal / 10 | 0;
		}
	}
	else
	{
		var pc = "a.pc=" + pcVal + ";;if((";
		guardPos = code.indexOf(pc) + pc.length;
	}
	var endOfGuard = code.indexOf("G|0)", guardPos);
	var mangledClassName = code.substring(guardPos, endOfGuard);
	var cinit=self[mangledClassName + 'X'];
	if(cinit===undefined)
	{
		loadWeakClass(mangledClassName, a, false);
		cinit=self[mangledClassName + 'X'];
	}
	// The guard is called again if continuation are required
	cinit({p:a,f:null,pc:0});
}

function cjW(a)
{
	var code = a.f.toString();
	var pc = "a.pc=" + a.pc + ";;if((";
	var guardPos = code.indexOf(pc);
	assert(guardPos >= 0);
	var endOfGuard = code.indexOf("G|0)", guardPos);
	var mangledClassName = code.substring(guardPos+pc.length, endOfGuard);
	if(!self.hasOwnProperty(mangledClassName))
		loadWeakClass(mangledClassName, a, false);
}

var cjGCVersion = 0;

function cjGCMarkObj(q, obj)
{
	// White (Not scanned) -> 0 or old version
	// Grey (Live, but not scanned) -> 1
	// Black (Live scanned) -> 2
	// TODO: Recycle the h value for the hash
	if((obj.g&0xf)==0 || ((obj.g>>4)&0xf) != cjGCVersion)
	{
		//assert(q.indexOf(obj)<0);
		q.push(obj);
		obj.g = (cjGCVersion<<4) | 0x01;
	}
//	if(obj instanceof N4java4lang3ref13WeakReference)
//		debugger
}

function cjGCMarkArray(q, arr)
{
	// Put all the objects in the queue, we don't want to mark arrays
	for(var i=1;i<arr.length;i++)
	{
		var obj=arr[i];
		if(obj instanceof Array)
			cjGCMarkArray(q, obj);
		else if(obj instanceof N4java4lang6Object)
			cjGCMarkObj(q, obj);
	}
}

function cjGC()
{
	var gcStart = performance.now();
	var q = [];
	// We need to scan the whole global space, then the stacks, then the JNI global refs
	for(var n in self)
	{
		// In Java all global are static variables which are inside the prototypes of classes
		if(n[0] != "N")
			continue;
		var v = self[n];
		// We need to skip guards
		if(!(v instanceof Function))
			continue;
		for(var w in v)
		{
			var obj = v[w];
			if(obj instanceof Array)
				cjGCMarkArray(q, obj);
			if(!(obj instanceof N4java4lang6Object))
				continue;
			cjGCMarkObj(q, obj);
		}
	}
	// Stack time
	for(var i=0;i<threads.length;i++)
	{
		var t=threads[i];
		for(var j=0;j<t.continuationStack.length;j++)
		{
			var s=t.continuationStack[j];
			for(var v in s.args)
			{
				var obj = s.args[v];
				if(obj instanceof Array)
					cjGCMarkArray(q, obj);
				if(!(obj instanceof N4java4lang6Object))
					continue;
				cjGCMarkObj(q, obj);
			}
		}
	}
	// TODO: JNI
	// TODO: Finalizable list
	// TODO: Acquire reference lock
	var weakRefs = []
	while(q.length)
	{
		var v = q.pop();
		//assert((v.g&0xf)==1);
		// Special handling for ref types
		// TODO: Soft/Phantom refs?
		if(v instanceof N4java4lang3ref13WeakReference)
		{
			// We don't want to look into this object
			// TODO: Maybe we want to only ignore the 'referent' field
		//	debugger
			weakRefs.push(v);
		}
		else
		{
			for(var w in v)
			{
				var obj = v[w];
				if(obj instanceof Array)
					cjGCMarkArray(q, obj);
				if(!(obj instanceof N4java4lang6Object))
					continue;
				cjGCMarkObj(q, obj);
			}
		}
		// This object is done
		v.g = (v.g&0xf0) | 0x02;
	}
	// Does any weak ref contains an object which is otherwise unreachable?
	for(var i=0;i<weakRefs.length;i++)
	{
		var w = weakRefs[i];
		var referent = w.referent0;
		if(referent == null)
			continue;
		if((referent.g&0xf)<2 || (referent.g>>4)!=cjGCVersion)
		{
			assert((referent.g&0xf)!=1);
			// TODO: Poison the object
			w.discovered3 = N4java4lang3ref9Reference.pending1;
			N4java4lang3ref9Reference.pending1 = w;
			w.referent0 = null;
		}
	}
	if(N4java4lang3ref9Reference.pending1!==null)
	{
		N4java4lang3ref9Reference.lock0.notifyVEV(N4java4lang3ref9Reference.lock0, null);
	}
	var gcEnd = performance.now();
	var gcTime = gcEnd - gcStart;
	cjGCVersion = 1 - cjGCVersion|0;
	console.log("GC TIME",gcTime);
}

function cjCastFailure(a,o)
{
	// While static initialization is incomplete the guard may be undefined even if
	// instances of a given class can actually be valid. To avoid this issue we
	// inspect the calling code to find out if the instanceof check can succeed
	// The effect is that we check twice on failure but use the fast path on success
	// which is more common
	var code = a.f.toString();
	var pc = "a.pc=" + a.pc + ";;if(";
	var checkPos = code.indexOf(pc);
	assert(checkPos >= 0);
	var endOfGuard = code.indexOf("G|0)&&", checkPos);
	var beginOfInstanceOf = code.indexOf(" ", endOfGuard);
	var endOfInstanceOf = code.indexOf(")>>0))", endOfGuard);
	var instanceOfStatement = code.substring(beginOfInstanceOf, endOfInstanceOf);
	try
	{
		// The statement may fail if the checked class is not defined
		var f = new Function("a", "return a"+instanceOfStatement);
		var ret=f(o);
		if(ret)
		{
			// The instanceof check succeeded, so we can let program continue
			return;
		}
	}
	catch(e)
	{
		debugger
	}
	cheerpjEnsureInitialized("N4java4lang18ClassCastException", a);
	var ex=new N4java4lang18ClassCastException();
	// TODO: Stack trace, constructor
	cheerpjThrow(a, ex);
}

function cheerpjSetAppPrefix(p)
{
	appUrlPrefix = p;
}

function cjGlobalDynamic(name, compressHint, forGuard)
{
	if(compressHint && self.hasOwnProperty(compressHint))
		return self[compressHint];
	// NOTE: This is dangerous as a collision between the compressed and uncompressed name may happen
	// Try the name as it is first
	var plainName = name;
	if(forGuard)
		plainName += "G";
	if(self.hasOwnProperty(plainName))
		return self[plainName];
	// Try the compressed one otherwise
	var compressedName = cheerpjCompressSymbol(name);
	if(forGuard)
		compressedName += "G";
	return self[compressedName];
}

function cjMethodDynamic(name, compressHint, suffix)
{
	if(compressHint && self.hasOwnProperty(compressHint))
		return self[compressHint];
	var plainName = name;
	if(suffix)
		plainName += suffix;
	if(self.hasOwnProperty("_"+plainName))
		return self["_"+plainName];
	// Try the compressed one otherwise
	var compressedName = cheerpjCompressSymbol(name);
	if(suffix)
		compressedName += suffix;
	return self["_"+compressedName];
}

function cjHasGlobalDynamic(name)
{
	// NOTE: This is dangerous as a collision between the compressed and uncompressed name may happen
	// Try the name as it is first
	if(self.hasOwnProperty(name))
		return true;
	// Try the compressed one otherwise
	var compressedName = cheerpjCompressSymbol(name);
	return self.hasOwnProperty(compressedName);
}

function cheerpjResolveVirtualIndex(c, methodName, descriptor, p)
{
	var a={p:p,f:cheerpjResolveVirtualIndex,pc:0,c:c,curClass:null,classFile:null,mangledName:null,methodName:methodName,descriptor:descriptor}
	assert(p);
	var curClass = a.curClass = c;
	var classFile = null;
	// We need to load the class and all the bases
	while(1){
		if(!curClass.cheerpjDownload)
			cheerpjClassLoadFile(a, curClass, 0);
		a.pc=0;;
		if(classFile)
			classFile.addClassFromBytes(curClass.cheerpjDownload, curClass.jsName, [])
		else
		{
			classFile = a.classFile = new CheerpJClassFile(curClass.cheerpjDownload, curClass.jsName, /*onlyConstantsAndFlags*/false);
			// Get modifiers now, if it is an interface we actually need to just compress the name
			if(classFile.getModifiers() & 0x200)
				return -1;
		}
		// Find out the base class
		var mangledName = a.mangledName = cheerpjMangleClassName(curClass);
		assert(mangledName[0] != 'A');
		a.pc=1;cheerpjEnsureInitialized(mangledName, a);
		var superProto = cheerpjGetClassConstructor(curClass).prototype;
		var superConstructor = Object.getPrototypeOf(superProto).constructor;
		if(superConstructor === Object)
			break;
		var demangledSuperName = decodeClassName(superConstructor.name);
		curClass = a.curClass = cheerpjGetClass(demangledSuperName);
	}
	return classFile.getVirtualIndex(methodName, descriptor);
}

function cheerpjSetStatus(s, elem)
{
	// Status reporting stops at first null
	if(cjStatus == null)
		return;
	cjStatus = s;
	var display = elem;
	if(display == null && !cjIsWorker)
		display = document.getElementById("cheerpjDisplay");
	if(display)
	{
		var computedHeight = display.offsetHeight;
		if(computedHeight <= 266 + 80)
		{
			cjStatus = null;
			return;
		}
		if(s == null)
			display.classList.remove("status");
		else
		{
			display.classList.add("status");
			display.setAttribute("data-status", s);
		}
	}
	else if(s != null)
		console.log(s);
}

function cheerpjFlashStatus(s)
{
	var display = document.getElementById("cheerpjDisplay");
	if(display == null)
		return;
	if(cjStatus != null)
		return;
	display.classList.remove("statusflash");
	// Force reflow to restart the animation
	void display.offsetWidth;
	display.setAttribute("data-status", s);
	display.classList.add("status");
	display.classList.add("statusflash");
	display.addEventListener("animationend", function() { display.classList.remove("statusflash"); display.classList.remove("status");});
}

function cheerpjEnableClassFilesTracing(callback)
{
	cjClassFilesTracer = callback;
}

function cjCallImpl(objOrClassName, methodName, args)
{
	if((typeof(objOrClassName) == "string") || (objOrClassName instanceof String))
		return cheerpjRunStaticMethod(threads[0], "com/leaningtech/CallHelper", "10callStaticEN4java4lang6StringN4java4lang6StringN4java4lang6ObjectIEN4java4lang6Object", objOrClassName, methodName, args, args.length);
	else
		return cheerpjRunStaticMethod(threads[0], "com/leaningtech/CallHelper", "4callEN4java4lang6ObjectN4java4lang6StringN4java4lang6ObjectIEN4java4lang6Object", objOrClassName, methodName, args, args.length);
}

function cjCall(objOrClassName, methodName)
{
	var args = [].splice.call(arguments, 2);
	return cjCallImpl(objOrClassName, methodName, args);
}

function cjCallSync(objOrClassName, methodName, args)
{
	assert(!cjForceSync);
	cjForceSync = true;
	assert(threads[0].continuationStack.length == 0);
	cjCall(objOrClassName, methodName, args);
	// The thread may not have finished if an exception is raised, try again
	while(threads[0].state == "READY")
		cheerpjSchedule();
	assert(threads[0].continuationStack.length == 0);
	cjForceSync = false;
	var ret = threads[0].retValue;
	threads[0].retValue = null;
	if(ret instanceof N4java4lang6String)
		ret = String.fromCharCode.apply(null, ret.value0).substr(1);
	return ret;
}

function cjNew(className)
{
	var args = [].splice.call(arguments, 1);
	return cheerpjRunStaticMethod(threads[0], "com/leaningtech/CallHelper", "6createEN4java4lang6StringN4java4lang6ObjectIEN4java4lang6Object", className, args, args.length);
}

var cjReportedErrors = 0;

function cjReportError(info, message)
{
	if(location.protocol == "file:")
	{
		// Do not log all errors from local testing pages
		return;
	}
	if(cjReportedErrors > 3)
		return;
	var xhr = new XMLHttpRequest()
	console.log("Reporting error: "+message)
	xhr.open("POST","https://docs.google.com/forms/d/e/1FAIpQLScErDRKZvSy1JAdiRSZfAsjf711VWdSdkczuSYHfIHQbtyFXA/formResponse")
	// Google forms does not provide CORS, but we actually don't care
	xhr.onerror=function()
	{
		// TODO: Tell the user that an error has been detected and we are forever sorry
	};
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send("entry.1790791857=" + encodeURIComponent(info) + "&entry.1699159116=" + encodeURIComponent(message));
	cjReportedErrors++;
}

// Type conversion APIs
function cjStringJavaToJs(javaString)
{
	return String.fromCharCode.apply(null, javaString.value0).substr(1);
}

function cjStringJsToJava(a)
{
	var ret = new N4java4lang6String();
	var value = new Uint16Array(a.length+1);
	for(var i=0;i<a.length;i++)
		value[i+1] = a.charCodeAt(i);
	ret.value0 = value;
	// Support Micro Edition
	if(ret.hasOwnProperty("count2"))
		ret.count2 = a.length;
	return ret;
}

function cjTypedArrayToJava(a)
{
	if(a instanceof Int8Array)
	{
		var ret = new Int8Array(a.length + 1);
		ret.set(a, 1);
		ret[0] = 66;
		return ret;
	}
	else if(a instanceof Uint8Array)
	{
		var ret = new Int8Array(a.length + 1);
		ret.set(new Int8Array(a.buffer), 1);
		ret[0] = 66;
		return ret;
	}
	else if(a instanceof Int16Array)
	{
		var ret = new Int16Array(a.length + 1);
		ret.set(a, 1);
		ret[0] = 83;
		return ret;
	}
	else if(a instanceof Uint16Array)
	{
		var ret = new Uint16Array(a.length + 1);
		ret.set(a, 1);
		ret[0] = 67;
		return ret;
	}
	else if(a instanceof Int32Array)
	{
		var ret = new Int32Array(a.length + 1);
		ret.set(a, 1);
		ret[0] = 73;
		return ret;
	}
	else if(a instanceof Uint32Array)
	{
		var ret = new Int32Array(a.length + 1);
		ret.set(new Int32Array(a.buffer), 1);
		ret[0] = 73;
		return ret;
	}
	else if(a instanceof Float32Array)
	{
		var ret = new Float32Array(a.length + 1);
		ret.set(a, 1);
		ret[0] = 70;
		return ret;
	}
	else if(a instanceof Float64Array)
	{
		var ret = new Float64Array(a.length + 1);
		ret.set(a, 1);
		ret[0] = 68;
		return ret;
	}
	else
		throw "CheerpJ: Invalid type for array conversion";
}

// Worker APIs
function cjWorkerAllocPromiseId(cjWorker, promise)
{
	var emptyId = cjWorker.pendingPromises.indexOf(null);
	if(emptyId >= 0)
	{
		cjWorker.pendingPromises[emptyId] = promise;
		return emptyId;
	}
	else
	{
		cjWorker.pendingPromises.push(promise);
		return cjWorker.pendingPromises.length-1;
	}
}

function cjWorkerInit()
{
	var args = [].splice.call(arguments, 0);
	var ret = new CheerpJPromise();
	var id = cjWorkerAllocPromiseId(this, ret);
	var d = {f: "cheerpjInit", args: args, id: id, loaderFile: this.loaderFile, appPrefix: window.location.origin};
	if(this.w == null)
		ret.d = d;
	else
		this.w.postMessage(d);
	return ret;
}

function cjWorkerFilterArgs(w, args)
{
	var transferables = [];
	for(var i=0;i<args.length;i++)
	{
		var val = args[i];
		if(typeof(val) == "number" || typeof(val) == "string")
			continue;
		else if(val == null)
			continue;
		else if(val.BYTES_PER_ELEMENT)
		{
			transferables.push(val.buffer);
			continue;
		}
		else if(val instanceof CheerpJPromise)
		{
			throw new Error("CheerpJWorker: Can't transfer CheerpJPromise. Wait for result using .then(...)");
		}
		else if(val instanceof Object)
		{
			throw new Error("CheerpJWorker: Can't transfer Objects.");
		}
		else
			debugger;
	}
	return transferables;
}

function cjWorkerRunMain()
{
	var args = [].splice.call(arguments, 0);
	var t = cjWorkerFilterArgs(this, args);
	var ret = new CheerpJPromise();
	var id = cjWorkerAllocPromiseId(this, ret);
	var d = {f: "cheerpjRunMain", args: args, id: id};
	if(this.w == null)
	{
		ret.d = d;
		ret.t = t;
	}
	else
		this.w.postMessage(d, t);
	return ret;
}

function cjWorkerCall()
{
	var args = [].splice.call(arguments, 0);
	var t = cjWorkerFilterArgs(this, args);
	var ret = new CheerpJPromise();
	var id = cjWorkerAllocPromiseId(this, ret);
	var d = {f: "cjCall", args: args, id: id};
	if(this.w == null)
	{
		ret.d = d;
		ret.t = t;
	}
	else
		this.w.postMessage(d, t);
	return ret;
}

function cjWorkerHandleMessage(e)
{
	// Message from worker
	var d = e.data;
	var w = this.w;
	var p = w.pendingPromises[d.id];
	assert(p);
	w.pendingPromises[d.id] = null;
	p.done(d.v);
}

function CheerpJWorker()
{
	try
	{
		throw new Error();
	}
	catch(e)
	{
		var stack = e.stack;
	}
	var part=cheerpjGetStackEntry(stack);
	var loaderStart = part.indexOf("http://");
	if(loaderStart == -1)
		loaderStart = part.indexOf("https://");
	var loaderEnd = part.indexOf(".js");
	assert(loaderStart >= 0 && loaderEnd > 0);
	var loaderFile = part.substring(loaderStart, loaderEnd+3);
	this.pendingPromises = [];
	this.w = null;
	this.loaderFile = loaderFile;
	var w = this;
	// Async load to workaround cross-origin sillyness
	var xhr = new XMLHttpRequest();
	xhr.open("GET", loaderFile);
	xhr.onload = function(e)
	{
		var b = new Blob([xhr.responseText]);
		w.w = new Worker(URL.createObjectURL(b));
		w.w.addEventListener("message", cjWorkerHandleMessage);
		w.w.w = w;
		for(var i=0;i<w.pendingPromises.length;i++)
		{
			var p = w.pendingPromises[i];
			assert(p.d);
			w.w.postMessage(p.d, p.t);
			p.d = null;
		}
	};
	xhr.send();
}

CheerpJWorker.prototype.cheerpjInit = cjWorkerInit;
CheerpJWorker.prototype.cheerpjRunMain = cjWorkerRunMain;
CheerpJWorker.prototype.cjCall = cjWorkerCall;

function cjHandleWorkerMessage(e)
{
	// Message to worker
	var d = e.data;
	var p = d.id;
	function forwardPromise(v)
	{
		var transferables = [];
		if(v)
		{
			if(v.BYTES_PER_ELEMENT)
				transferables.push(v.buffer);
			else if(v.hasOwnProperty("value0h"))
				v = v.value0h * 4294967296 + v.value0;
			else if(v.hasOwnProperty("value0"))
				v = v.value0;
			else if(v instanceof Object)
				v = "CheerpJWorker: Can't transfer Objects."
		}
		postMessage({id:p, v:v}, transferables);
	}
	var args = d.args;
	if(d.f == "cheerpjInit")
	{
		cheerpjSetAppPrefix(d.appPrefix);
		var loaderFile = d.loaderFile;
		loaderPath = loaderFile.substr(0, loaderFile.length - "/loader.js".length);
		cheerpjInit.apply(null, args).then(forwardPromise);
	}
	else if(d.f == "cheerpjRunMain")
	{
		cheerpjRunMain.apply(null, args).then(forwardPromise);
	}
	else if(d.f == "cjCall")
	{
		cjCall.apply(null, args).then(forwardPromise);
	}
	else
		debugger;
}

if(cjIsWorker)
	self.addEventListener("message", cjHandleWorkerMessage);

// JS interop
function cjVariadicJavaToJs(dstArray, srcArray)
{
	for(var i=1;i<srcArray.length;i++){
		if(srcArray[i] instanceof N4java4lang6String){
			dstArray.push(cjStringJavaToJs(srcArray[i]));
		}else if(srcArray[i].hasOwnProperty("value0h")){
			dstArray.push(srcArray[i].value0h * 4294967296 + srcArray[i].value0);
		}else if(srcArray[i].hasOwnProperty("value0")){
			dstArray.push(srcArray[i].value0);
		}else{
			dstArray.push(srcArray[i]);
		}
	}
	return dstArray;
}

function cjJSCall(funcName, args)
{
	var jsArgs = cjVariadicJavaToJs([], args);
	return self[cjStringJavaToJs(funcName)].apply(null, jsArgs);
}
