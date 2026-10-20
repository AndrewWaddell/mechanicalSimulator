// built/z3-built.mjs
async function initZ3(moduleArg = {}) {
  var moduleRtn;
  var Module = moduleArg;
  var ENVIRONMENT_IS_WEB = !!globalThis.window;
  var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
  var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
  var arguments_ = [];
  var thisProgram = "./this.program";
  var quit_ = (status, toThrow) => {
    throw toThrow;
  };
  var _scriptName = globalThis.Z3_SCRIPT_URL;
  var scriptDirectory = "";
  function locateFile(path) {
    if (Module["locateFile"]) {
      return Module["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }
  var readAsync, readBinary;
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    try {
      scriptDirectory = new URL(".", _scriptName).href;
    } catch {
    }
    {
      if (ENVIRONMENT_IS_WORKER) {
        readBinary = (url) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.responseType = "arraybuffer";
          xhr.send(null);
          return new Uint8Array(xhr.response);
        };
      }
      readAsync = async (url) => {
        var response = await fetch(url, { credentials: "same-origin" });
        if (response.ok) {
          return response.arrayBuffer();
        }
        throw new Error(response.status + " : " + response.url);
      };
    }
  } else {
  }
  var out = console.log.bind(console);
  var err = console.error.bind(console);
  var wasmBinary;
  var ABORT = false;
  var EXITSTATUS;
  var readyPromiseResolve, readyPromiseReject;
  var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  var HEAP64, HEAPU64;
  var runtimeInitialized = false;
  function updateMemoryViews() {
    var b = wasmMemory.buffer;
    HEAP8 = new Int8Array(b);
    HEAP16 = new Int16Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    HEAPU16 = new Uint16Array(b);
    Module["HEAP32"] = HEAP32 = new Int32Array(b);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
    HEAPF32 = new Float32Array(b);
    HEAPF64 = new Float64Array(b);
    Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
    Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b);
  }
  function preRun() {
    if (Module["preRun"]) {
      if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
      while (Module["preRun"].length) {
        addOnPreRun(Module["preRun"].shift());
      }
    }
    callRuntimeCallbacks(onPreRuns);
  }
  function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.initialized) FS.init();
    TTY.init();
    wasmExports["__wasm_call_ctors"]();
    FS.ignorePermissions = false;
  }
  function postRun() {
    if (Module["postRun"]) {
      if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
      while (Module["postRun"].length) {
        addOnPostRun(Module["postRun"].shift());
      }
    }
    callRuntimeCallbacks(onPostRuns);
  }
  function abort(what) {
    Module["onAbort"]?.(what);
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    what += ". Build with -sASSERTIONS for more info.";
    if (runtimeInitialized) {
      ___trap();
    }
    var e = new WebAssembly.RuntimeError(what);
    readyPromiseReject?.(e);
    throw e;
  }
  var wasmBinaryFile;
  function findWasmBinary() {
    if (Module["locateFile"]) {
      return locateFile("z3-built.wasm");
    }
    return new URL("z3-built.wasm", globalThis.Z3_SCRIPT_URL).href;
  }
  function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
      try {
        var response = await readAsync(binaryFile);
        return new Uint8Array(response);
      } catch {
      }
    }
    return getBinarySync(binaryFile);
  }
  async function instantiateArrayBuffer(binaryFile, imports) {
    try {
      var binary = await getWasmBinary(binaryFile);
      var instance = await WebAssembly.instantiate(binary, imports);
      return instance;
    } catch (reason) {
      err(`failed to asynchronously prepare wasm: ${reason}`);
      abort(reason);
    }
  }
  async function instantiateAsync(binary, binaryFile, imports) {
    if (!binary) {
      try {
        var response = fetch(binaryFile, { credentials: "same-origin" });
        var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
        return instantiationResult;
      } catch (reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
      }
    }
    return instantiateArrayBuffer(binaryFile, imports);
  }
  function getWasmImports() {
    var imports = { env: wasmImports, wasi_snapshot_preview1: wasmImports };
    return imports;
  }
  async function createWasm() {
    function receiveInstance(instance, module) {
      wasmExports = instance.exports;
      wasmExports = applySignatureConversions(wasmExports);
      assignWasmExports(wasmExports);
      updateMemoryViews();
      return wasmExports;
    }
    function receiveInstantiationResult(result2) {
      return receiveInstance(result2["instance"]);
    }
    var info = getWasmImports();
    if (Module["instantiateWasm"]) {
      return new Promise((resolve, reject) => {
        Module["instantiateWasm"](info, (inst, mod) => {
          resolve(receiveInstance(inst, mod));
        });
      });
    }
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
  }
  class ExitStatus {
    name = "ExitStatus";
    constructor(status) {
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }
  }
  var callRuntimeCallbacks = (callbacks) => {
    while (callbacks.length > 0) {
      callbacks.shift()(Module);
    }
  };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);
  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);
  var noExitRuntime = true;
  var syscallGetVarargI = () => {
    var ret = HEAP32[+SYSCALLS.varargs >>> 2 >>> 0];
    SYSCALLS.varargs += 4;
    return ret;
  };
  var syscallGetVarargP = syscallGetVarargI;
  var PATH = { isAbs: (path) => path.charAt(0) === "/", splitPath: (filename) => {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  }, normalizeArray: (parts, allowAboveRoot) => {
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    if (allowAboveRoot) {
      for (; up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  }, normalize: (path) => {
    var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
    path = PATH.normalizeArray(path.split("/").filter((p) => !!p), !isAbsolute).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  }, dirname: (path) => {
    var result = PATH.splitPath(path), root = result[0], dir = result[1];
    if (!root && !dir) {
      return ".";
    }
    if (dir) {
      dir = dir.slice(0, -1);
    }
    return root + dir;
  }, basename: (path) => path && path.match(/([^\/]+|\/)\/*$/)[1], join: (...paths) => PATH.normalize(paths.join("/")), join2: (l, r) => PATH.normalize(l + "/" + r) };
  var initRandomFill = () => (view) => crypto.getRandomValues(view);
  var randomFill = (view) => {
    (randomFill = initRandomFill())(view);
  };
  var PATH_FS = { resolve: (...args) => {
    var resolvedPath = "", resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? args[i] : FS.cwd();
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((p) => !!p), !resolvedAbsolute).join("/");
    return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
  }, relative: (from, to) => {
    from = PATH_FS.resolve(from).slice(1);
    to = PATH_FS.resolve(to).slice(1);
    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  } };
  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
    var maxIdx = idx + maxBytesToRead;
    if (ignoreNul) return maxIdx;
    while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
    return idx;
  };
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
    idx >>>= 0;
    var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
      return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = "";
    while (idx < endPtr) {
      var u0 = heapOrArray[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
    return str;
  };
  var FS_stdin_getChar_buffer = [];
  var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      var c = str.charCodeAt(i);
      if (c <= 127) {
        len++;
      } else if (c <= 2047) {
        len += 2;
      } else if (c >= 55296 && c <= 57343) {
        len += 4;
        ++i;
      } else {
        len += 3;
      }
    }
    return len;
  };
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    outIdx >>>= 0;
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
      var u = str.codePointAt(i);
      if (u <= 127) {
        if (outIdx >= endIdx) break;
        heap[outIdx++ >>> 0] = u;
      } else if (u <= 2047) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++ >>> 0] = 192 | u >> 6;
        heap[outIdx++ >>> 0] = 128 | u & 63;
      } else if (u <= 65535) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++ >>> 0] = 224 | u >> 12;
        heap[outIdx++ >>> 0] = 128 | u >> 6 & 63;
        heap[outIdx++ >>> 0] = 128 | u & 63;
      } else {
        if (outIdx + 3 >= endIdx) break;
        heap[outIdx++ >>> 0] = 240 | u >> 18;
        heap[outIdx++ >>> 0] = 128 | u >> 12 & 63;
        heap[outIdx++ >>> 0] = 128 | u >> 6 & 63;
        heap[outIdx++ >>> 0] = 128 | u & 63;
        i++;
      }
    }
    heap[outIdx >>> 0] = 0;
    return outIdx - startIdx;
  };
  var intArrayFromString = (stringy, dontAddNull, length) => {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  };
  var FS_stdin_getChar = () => {
    if (!FS_stdin_getChar_buffer.length) {
      var result = null;
      if (globalThis.window?.prompt) {
        result = window.prompt("Input: ");
        if (result !== null) {
          result += "\n";
        }
      } else {
      }
      if (!result) {
        return null;
      }
      FS_stdin_getChar_buffer = intArrayFromString(result, true);
    }
    return FS_stdin_getChar_buffer.shift();
  };
  var TTY = { ttys: [], init() {
  }, shutdown() {
  }, register(dev, ops) {
    TTY.ttys[dev] = { input: [], output: [], ops };
    FS.registerDevice(dev, TTY.stream_ops);
  }, stream_ops: { open(stream) {
    var tty = TTY.ttys[stream.node.rdev];
    if (!tty) {
      throw new FS.ErrnoError(43);
    }
    stream.tty = tty;
    stream.seekable = false;
  }, close(stream) {
    stream.tty.ops.fsync(stream.tty);
  }, fsync(stream) {
    stream.tty.ops.fsync(stream.tty);
  }, read(stream, buffer, offset, length, pos) {
    if (!stream.tty || !stream.tty.ops.get_char) {
      throw new FS.ErrnoError(60);
    }
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
      var result;
      try {
        result = stream.tty.ops.get_char(stream.tty);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (result === void 0 && bytesRead === 0) {
        throw new FS.ErrnoError(6);
      }
      if (result === null || result === void 0) break;
      bytesRead++;
      buffer[offset + i] = result;
    }
    if (bytesRead) {
      stream.node.atime = Date.now();
    }
    return bytesRead;
  }, write(stream, buffer, offset, length, pos) {
    if (!stream.tty || !stream.tty.ops.put_char) {
      throw new FS.ErrnoError(60);
    }
    try {
      for (var i = 0; i < length; i++) {
        stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
      }
    } catch (e) {
      throw new FS.ErrnoError(29);
    }
    if (length) {
      stream.node.mtime = stream.node.ctime = Date.now();
    }
    return i;
  } }, default_tty_ops: { get_char(tty) {
    return FS_stdin_getChar();
  }, put_char(tty, val) {
    if (val === null || val === 10) {
      out(UTF8ArrayToString(tty.output));
      tty.output = [];
    } else {
      if (val != 0) tty.output.push(val);
    }
  }, fsync(tty) {
    if (tty.output?.length > 0) {
      out(UTF8ArrayToString(tty.output));
      tty.output = [];
    }
  }, ioctl_tcgets(tty) {
    return { c_iflag: 25856, c_oflag: 5, c_cflag: 191, c_lflag: 35387, c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  }, ioctl_tcsets(tty, optional_actions, data) {
    return 0;
  }, ioctl_tiocgwinsz(tty) {
    return [24, 80];
  } }, default_tty1_ops: { put_char(tty, val) {
    if (val === null || val === 10) {
      err(UTF8ArrayToString(tty.output));
      tty.output = [];
    } else {
      if (val != 0) tty.output.push(val);
    }
  }, fsync(tty) {
    if (tty.output?.length > 0) {
      err(UTF8ArrayToString(tty.output));
      tty.output = [];
    }
  } } };
  var mmapAlloc = (size) => {
    abort();
  };
  var MEMFS = { ops_table: null, mount(mount) {
    return MEMFS.createNode(null, "/", 16895, 0);
  }, createNode(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      throw new FS.ErrnoError(63);
    }
    MEMFS.ops_table ||= { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } };
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      node.usedBytes = 0;
      node.contents = null;
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.atime = node.mtime = node.ctime = Date.now();
    if (parent) {
      parent.contents[name] = node;
      parent.atime = parent.mtime = parent.ctime = node.atime;
    }
    return node;
  }, getFileDataAsTypedArray(node) {
    if (!node.contents) return new Uint8Array(0);
    if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
    return new Uint8Array(node.contents);
  }, expandFileStorage(node, newCapacity) {
    var prevCapacity = node.contents ? node.contents.length : 0;
    if (prevCapacity >= newCapacity) return;
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
    if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
    var oldContents = node.contents;
    node.contents = new Uint8Array(newCapacity);
    if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
  }, resizeFileStorage(node, newSize) {
    if (node.usedBytes == newSize) return;
    if (newSize == 0) {
      node.contents = null;
      node.usedBytes = 0;
    } else {
      var oldContents = node.contents;
      node.contents = new Uint8Array(newSize);
      if (oldContents) {
        node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
      }
      node.usedBytes = newSize;
    }
  }, node_ops: { getattr(node) {
    var attr = {};
    attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
    attr.ino = node.id;
    attr.mode = node.mode;
    attr.nlink = 1;
    attr.uid = 0;
    attr.gid = 0;
    attr.rdev = node.rdev;
    if (FS.isDir(node.mode)) {
      attr.size = 4096;
    } else if (FS.isFile(node.mode)) {
      attr.size = node.usedBytes;
    } else if (FS.isLink(node.mode)) {
      attr.size = node.link.length;
    } else {
      attr.size = 0;
    }
    attr.atime = new Date(node.atime);
    attr.mtime = new Date(node.mtime);
    attr.ctime = new Date(node.ctime);
    attr.blksize = 4096;
    attr.blocks = Math.ceil(attr.size / attr.blksize);
    return attr;
  }, setattr(node, attr) {
    for (const key of ["mode", "atime", "mtime", "ctime"]) {
      if (attr[key] != null) {
        node[key] = attr[key];
      }
    }
    if (attr.size !== void 0) {
      MEMFS.resizeFileStorage(node, attr.size);
    }
  }, lookup(parent, name) {
    if (!MEMFS.doesNotExistError) {
      MEMFS.doesNotExistError = new FS.ErrnoError(44);
      MEMFS.doesNotExistError.stack = "<generic error, no stack>";
    }
    throw MEMFS.doesNotExistError;
  }, mknod(parent, name, mode, dev) {
    return MEMFS.createNode(parent, name, mode, dev);
  }, rename(old_node, new_dir, new_name) {
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {
    }
    if (new_node) {
      if (FS.isDir(old_node.mode)) {
        for (var i in new_node.contents) {
          throw new FS.ErrnoError(55);
        }
      }
      FS.hashRemoveNode(new_node);
    }
    delete old_node.parent.contents[old_node.name];
    new_dir.contents[new_name] = old_node;
    old_node.name = new_name;
    new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
  }, unlink(parent, name) {
    delete parent.contents[name];
    parent.ctime = parent.mtime = Date.now();
  }, rmdir(parent, name) {
    var node = FS.lookupNode(parent, name);
    for (var i in node.contents) {
      throw new FS.ErrnoError(55);
    }
    delete parent.contents[name];
    parent.ctime = parent.mtime = Date.now();
  }, readdir(node) {
    return [".", "..", ...Object.keys(node.contents)];
  }, symlink(parent, newname, oldpath) {
    var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
    node.link = oldpath;
    return node;
  }, readlink(node) {
    if (!FS.isLink(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    return node.link;
  } }, stream_ops: { read(stream, buffer, offset, length, position) {
    var contents = stream.node.contents;
    if (position >= stream.node.usedBytes) return 0;
    var size = Math.min(stream.node.usedBytes - position, length);
    if (size > 8 && contents.subarray) {
      buffer.set(contents.subarray(position, position + size), offset);
    } else {
      for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
    }
    return size;
  }, write(stream, buffer, offset, length, position, canOwn) {
    if (buffer.buffer === HEAP8.buffer) {
      canOwn = false;
    }
    if (!length) return 0;
    var node = stream.node;
    node.mtime = node.ctime = Date.now();
    if (buffer.subarray && (!node.contents || node.contents.subarray)) {
      if (canOwn) {
        node.contents = buffer.subarray(offset, offset + length);
        node.usedBytes = length;
        return length;
      } else if (node.usedBytes === 0 && position === 0) {
        node.contents = buffer.slice(offset, offset + length);
        node.usedBytes = length;
        return length;
      } else if (position + length <= node.usedBytes) {
        node.contents.set(buffer.subarray(offset, offset + length), position);
        return length;
      }
    }
    MEMFS.expandFileStorage(node, position + length);
    if (node.contents.subarray && buffer.subarray) {
      node.contents.set(buffer.subarray(offset, offset + length), position);
    } else {
      for (var i = 0; i < length; i++) {
        node.contents[position + i] = buffer[offset + i];
      }
    }
    node.usedBytes = Math.max(node.usedBytes, position + length);
    return length;
  }, llseek(stream, offset, whence) {
    var position = offset;
    if (whence === 1) {
      position += stream.position;
    } else if (whence === 2) {
      if (FS.isFile(stream.node.mode)) {
        position += stream.node.usedBytes;
      }
    }
    if (position < 0) {
      throw new FS.ErrnoError(28);
    }
    return position;
  }, mmap(stream, length, position, prot, flags) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    var ptr;
    var allocated;
    var contents = stream.node.contents;
    if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
      allocated = false;
      ptr = contents.byteOffset;
    } else {
      allocated = true;
      ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      if (contents) {
        if (position > 0 || position + length < contents.length) {
          if (contents.subarray) {
            contents = contents.subarray(position, position + length);
          } else {
            contents = Array.prototype.slice.call(contents, position, position + length);
          }
        }
        HEAP8.set(contents, ptr >>> 0);
      }
    }
    return { ptr, allocated };
  }, msync(stream, buffer, offset, length, mmapFlags) {
    MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
    return 0;
  } } };
  var FS_modeStringToFlags = (str) => {
    var flagModes = { r: 0, "r+": 2, w: 512 | 64 | 1, "w+": 512 | 64 | 2, a: 1024 | 64 | 1, "a+": 1024 | 64 | 2 };
    var flags = flagModes[str];
    if (typeof flags == "undefined") {
      throw new Error(`Unknown file open mode: ${str}`);
    }
    return flags;
  };
  var FS_getMode = (canRead, canWrite) => {
    var mode = 0;
    if (canRead) mode |= 292 | 73;
    if (canWrite) mode |= 146;
    return mode;
  };
  var asyncLoad = async (url) => {
    var arrayBuffer = await readAsync(url);
    return new Uint8Array(arrayBuffer);
  };
  var FS_createDataFile = (...args) => FS.createDataFile(...args);
  var getUniqueRunDependency = (id) => id;
  var runDependencies = 0;
  var dependenciesFulfilled = null;
  var removeRunDependency = (id) => {
    runDependencies--;
    Module["monitorRunDependencies"]?.(runDependencies);
    if (runDependencies == 0) {
      if (dependenciesFulfilled) {
        var callback = dependenciesFulfilled;
        dependenciesFulfilled = null;
        callback();
      }
    }
  };
  var addRunDependency = (id) => {
    runDependencies++;
    Module["monitorRunDependencies"]?.(runDependencies);
  };
  var preloadPlugins = [];
  var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
    if (typeof Browser != "undefined") Browser.init();
    for (var plugin of preloadPlugins) {
      if (plugin["canHandle"](fullname)) {
        return plugin["handle"](byteArray, fullname);
      }
    }
    return byteArray;
  };
  var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`);
    addRunDependency(dep);
    try {
      var byteArray = url;
      if (typeof url == "string") {
        byteArray = await asyncLoad(url);
      }
      byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
      preFinish?.();
      if (!dontCreateFile) {
        FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
      }
    } finally {
      removeRunDependency(dep);
    }
  };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
    FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
  };
  var FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, filesystems: null, syncFSRequests: 0, readFiles: {}, ErrnoError: class {
    name = "ErrnoError";
    constructor(errno) {
      this.errno = errno;
    }
  }, FSStream: class {
    shared = {};
    get object() {
      return this.node;
    }
    set object(val) {
      this.node = val;
    }
    get isRead() {
      return (this.flags & 2097155) !== 1;
    }
    get isWrite() {
      return (this.flags & 2097155) !== 0;
    }
    get isAppend() {
      return this.flags & 1024;
    }
    get flags() {
      return this.shared.flags;
    }
    set flags(val) {
      this.shared.flags = val;
    }
    get position() {
      return this.shared.position;
    }
    set position(val) {
      this.shared.position = val;
    }
  }, FSNode: class {
    node_ops = {};
    stream_ops = {};
    readMode = 292 | 73;
    writeMode = 146;
    mounted = null;
    constructor(parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.rdev = rdev;
      this.atime = this.mtime = this.ctime = Date.now();
    }
    get read() {
      return (this.mode & this.readMode) === this.readMode;
    }
    set read(val) {
      val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
    }
    get write() {
      return (this.mode & this.writeMode) === this.writeMode;
    }
    set write(val) {
      val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
    }
    get isFolder() {
      return FS.isDir(this.mode);
    }
    get isDevice() {
      return FS.isChrdev(this.mode);
    }
  }, lookupPath(path, opts = {}) {
    if (!path) {
      throw new FS.ErrnoError(44);
    }
    opts.follow_mount ??= true;
    if (!PATH.isAbs(path)) {
      path = FS.cwd() + "/" + path;
    }
    linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
      var parts = path.split("/").filter((p) => !!p);
      var current = FS.root;
      var current_path = "/";
      for (var i = 0; i < parts.length; i++) {
        var islast = i === parts.length - 1;
        if (islast && opts.parent) {
          break;
        }
        if (parts[i] === ".") {
          continue;
        }
        if (parts[i] === "..") {
          current_path = PATH.dirname(current_path);
          if (FS.isRoot(current)) {
            path = current_path + "/" + parts.slice(i + 1).join("/");
            nlinks--;
            continue linkloop;
          } else {
            current = current.parent;
          }
          continue;
        }
        current_path = PATH.join2(current_path, parts[i]);
        try {
          current = FS.lookupNode(current, parts[i]);
        } catch (e) {
          if (e?.errno === 44 && islast && opts.noent_okay) {
            return { path: current_path };
          }
          throw e;
        }
        if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
          current = current.mounted.root;
        }
        if (FS.isLink(current.mode) && (!islast || opts.follow)) {
          if (!current.node_ops.readlink) {
            throw new FS.ErrnoError(52);
          }
          var link = current.node_ops.readlink(current);
          if (!PATH.isAbs(link)) {
            link = PATH.dirname(current_path) + "/" + link;
          }
          path = link + "/" + parts.slice(i + 1).join("/");
          continue linkloop;
        }
      }
      return { path: current_path, node: current };
    }
    throw new FS.ErrnoError(32);
  }, getPath(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
      }
      path = path ? `${node.name}/${path}` : node.name;
      node = node.parent;
    }
  }, hashName(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
    }
    return (parentid + hash >>> 0) % FS.nameTable.length;
  }, hashAddNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  }, hashRemoveNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  }, lookupNode(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    return FS.lookup(parent, name);
  }, createNode(parent, name, mode, rdev) {
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  }, destroyNode(node) {
    FS.hashRemoveNode(node);
  }, isRoot(node) {
    return node === node.parent;
  }, isMountpoint(node) {
    return !!node.mounted;
  }, isFile(mode) {
    return (mode & 61440) === 32768;
  }, isDir(mode) {
    return (mode & 61440) === 16384;
  }, isLink(mode) {
    return (mode & 61440) === 40960;
  }, isChrdev(mode) {
    return (mode & 61440) === 8192;
  }, isBlkdev(mode) {
    return (mode & 61440) === 24576;
  }, isFIFO(mode) {
    return (mode & 61440) === 4096;
  }, isSocket(mode) {
    return (mode & 49152) === 49152;
  }, flagsToPermissionString(flag) {
    var perms = ["r", "w", "rw"][flag & 3];
    if (flag & 512) {
      perms += "w";
    }
    return perms;
  }, nodePermissions(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    } else if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    } else if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  }, mayLookup(dir) {
    if (!FS.isDir(dir.mode)) return 54;
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  }, mayCreate(dir, name) {
    if (!FS.isDir(dir.mode)) {
      return 54;
    }
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {
    }
    return FS.nodePermissions(dir, "wx");
  }, mayDelete(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else {
      if (FS.isDir(node.mode)) {
        return 31;
      }
    }
    return 0;
  }, mayOpen(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    } else if (FS.isDir(node.mode)) {
      if (FS.flagsToPermissionString(flags) !== "r" || flags & (512 | 64)) {
        return 31;
      }
    }
    return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
  }, checkOpExists(op, err2) {
    if (!op) {
      throw new FS.ErrnoError(err2);
    }
    return op;
  }, MAX_OPEN_FDS: 4096, nextfd() {
    for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  }, getStreamChecked(fd) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    return stream;
  }, getStream: (fd) => FS.streams[fd], createStream(stream, fd = -1) {
    stream = Object.assign(new FS.FSStream(), stream);
    if (fd == -1) {
      fd = FS.nextfd();
    }
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  }, closeStream(fd) {
    FS.streams[fd] = null;
  }, dupStream(origStream, fd = -1) {
    var stream = FS.createStream(origStream, fd);
    stream.stream_ops?.dup?.(stream);
    return stream;
  }, doSetAttr(stream, node, attr) {
    var setattr = stream?.stream_ops.setattr;
    var arg = setattr ? stream : node;
    setattr ??= node.node_ops.setattr;
    FS.checkOpExists(setattr, 63);
    setattr(arg, attr);
  }, chrdev_stream_ops: { open(stream) {
    var device = FS.getDevice(stream.node.rdev);
    stream.stream_ops = device.stream_ops;
    stream.stream_ops.open?.(stream);
  }, llseek() {
    throw new FS.ErrnoError(70);
  } }, major: (dev) => dev >> 8, minor: (dev) => dev & 255, makedev: (ma, mi) => ma << 8 | mi, registerDevice(dev, ops) {
    FS.devices[dev] = { stream_ops: ops };
  }, getDevice: (dev) => FS.devices[dev], getMounts(mount) {
    var mounts = [];
    var check = [mount];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push(...m.mounts);
    }
    return mounts;
  }, syncfs(populate, callback) {
    if (typeof populate == "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done(errCode) {
      if (errCode) {
        if (!done.errored) {
          done.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    for (var mount of mounts) {
      if (mount.type.syncfs) {
        mount.type.syncfs(mount, populate, done);
      } else {
        done(null);
      }
    }
  }, mount(type, opts, mountpoint) {
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      mountpoint = lookup.path;
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = { type, opts, mountpoint, mounts: [] };
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      node.mounted = mount;
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  }, unmount(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28);
    }
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    for (var [hash, current] of Object.entries(FS.nameTable)) {
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    }
    node.mounted = null;
    var idx = node.mount.mounts.indexOf(mount);
    node.mount.mounts.splice(idx, 1);
  }, lookup(parent, name) {
    return parent.node_ops.lookup(parent, name);
  }, mknod(path, mode, dev) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name) {
      throw new FS.ErrnoError(28);
    }
    if (name === "." || name === "..") {
      throw new FS.ErrnoError(20);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  }, statfs(path) {
    return FS.statfsNode(FS.lookupPath(path, { follow: true }).node);
  }, statfsStream(stream) {
    return FS.statfsNode(stream.node);
  }, statfsNode(node) {
    var rtn = { bsize: 4096, frsize: 4096, blocks: 1e6, bfree: 5e5, bavail: 5e5, files: FS.nextInode, ffree: FS.nextInode - 1, fsid: 42, flags: 2, namelen: 255 };
    if (node.node_ops.statfs) {
      Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
    }
    return rtn;
  }, create(path, mode = 438) {
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  }, mkdir(path, mode = 511) {
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  }, mkdirTree(path, mode) {
    var dirs = path.split("/");
    var d = "";
    for (var dir of dirs) {
      if (!dir) continue;
      if (d || PATH.isAbs(path)) d += "/";
      d += dir;
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  }, mkdev(path, mode, dev) {
    if (typeof dev == "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  }, symlink(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup = FS.lookupPath(newpath, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  }, rename(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    var lookup, old_dir, new_dir;
    lookup = FS.lookupPath(old_path, { parent: true });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, { parent: true });
    new_dir = lookup.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    var old_node = FS.lookupNode(old_dir, old_name);
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {
    }
    if (old_node === new_node) {
      return;
    }
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
      throw new FS.ErrnoError(10);
    }
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    FS.hashRemoveNode(old_node);
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
      old_node.parent = new_dir;
    } catch (e) {
      throw e;
    } finally {
      FS.hashAddNode(old_node);
    }
  }, rmdir(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
  }, readdir(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
    return readdir(node);
  }, unlink(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
  }, readlink(path) {
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return link.node_ops.readlink(link);
  }, stat(path, dontFollow) {
    var lookup = FS.lookupPath(path, { follow: !dontFollow });
    var node = lookup.node;
    var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
    return getattr(node);
  }, fstat(fd) {
    var stream = FS.getStreamChecked(fd);
    var node = stream.node;
    var getattr = stream.stream_ops.getattr;
    var arg = getattr ? stream : node;
    getattr ??= node.node_ops.getattr;
    FS.checkOpExists(getattr, 63);
    return getattr(arg);
  }, lstat(path) {
    return FS.stat(path, true);
  }, doChmod(stream, node, mode, dontFollow) {
    FS.doSetAttr(stream, node, { mode: mode & 4095 | node.mode & ~4095, ctime: Date.now(), dontFollow });
  }, chmod(path, mode, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChmod(null, node, mode, dontFollow);
  }, lchmod(path, mode) {
    FS.chmod(path, mode, true);
  }, fchmod(fd, mode) {
    var stream = FS.getStreamChecked(fd);
    FS.doChmod(stream, stream.node, mode, false);
  }, doChown(stream, node, dontFollow) {
    FS.doSetAttr(stream, node, { timestamp: Date.now(), dontFollow });
  }, chown(path, uid, gid, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChown(null, node, dontFollow);
  }, lchown(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  }, fchown(fd, uid, gid) {
    var stream = FS.getStreamChecked(fd);
    FS.doChown(stream, stream.node, false);
  }, doTruncate(stream, node, len) {
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.doSetAttr(stream, node, { size: len, timestamp: Date.now() });
  }, truncate(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: true });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doTruncate(null, node, len);
  }, ftruncate(fd, len) {
    var stream = FS.getStreamChecked(fd);
    if (len < 0 || (stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.doTruncate(stream, stream.node, len);
  }, utime(path, atime, mtime) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
    setattr(node, { atime, mtime });
  }, open(path, flags, mode = 438) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
    if (flags & 64) {
      mode = mode & 4095 | 32768;
    } else {
      mode = 0;
    }
    var node;
    var isDirPath;
    if (typeof path == "object") {
      node = path;
    } else {
      isDirPath = path.endsWith("/");
      var lookup = FS.lookupPath(path, { follow: !(flags & 131072), noent_okay: true });
      node = lookup.node;
      path = lookup.path;
    }
    var created = false;
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new FS.ErrnoError(20);
        }
      } else if (isDirPath) {
        throw new FS.ErrnoError(31);
      } else {
        node = FS.mknod(path, mode | 511, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    if (flags & 65536 && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    if (flags & 512 && !created) {
      FS.truncate(node, 0);
    }
    flags &= ~(128 | 512 | 131072);
    var stream = FS.createStream({ node, path: FS.getPath(node), flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false });
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (created) {
      FS.chmod(node, mode & 511);
    }
    if (Module["logReadFiles"] && !(flags & 1)) {
      if (!(path in FS.readFiles)) {
        FS.readFiles[path] = 1;
      }
    }
    return stream;
  }, close(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  }, isClosed(stream) {
    return stream.fd === null;
  }, llseek(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  }, read(stream, buffer, offset, length, position) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  }, write(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  }, mmap(stream, length, position, prot, flags) {
    if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    if (!length) {
      throw new FS.ErrnoError(28);
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags);
  }, msync(stream, buffer, offset, length, mmapFlags) {
    if (!stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  }, ioctl(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  }, readFile(path, opts = {}) {
    opts.flags = opts.flags || 0;
    opts.encoding = opts.encoding || "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      abort(`Invalid encoding type "${opts.encoding}"`);
    }
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      buf = UTF8ArrayToString(buf);
    }
    FS.close(stream);
    return buf;
  }, writeFile(path, data, opts = {}) {
    opts.flags = opts.flags || 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    if (typeof data == "string") {
      data = new Uint8Array(intArrayFromString(data, true));
    }
    if (ArrayBuffer.isView(data)) {
      FS.write(stream, data, 0, data.byteLength, void 0, opts.canOwn);
    } else {
      abort("Unsupported data type");
    }
    FS.close(stream);
  }, cwd: () => FS.currentPath, chdir(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup.path;
  }, createDefaultDirectories() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  }, createDefaultDevices() {
    FS.mkdir("/dev");
    FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (stream, buffer, offset, length, pos) => length, llseek: () => 0 });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    var randomBuffer = new Uint8Array(1024), randomLeft = 0;
    var randomByte = () => {
      if (randomLeft === 0) {
        randomFill(randomBuffer);
        randomLeft = randomBuffer.byteLength;
      }
      return randomBuffer[--randomLeft];
    };
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  }, createSpecialDirectories() {
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount({ mount() {
      var node = FS.createNode(proc_self, "fd", 16895, 73);
      node.stream_ops = { llseek: MEMFS.stream_ops.llseek };
      node.node_ops = { lookup(parent, name) {
        var fd = +name;
        var stream = FS.getStreamChecked(fd);
        var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => stream.path }, id: fd + 1 };
        ret.parent = ret;
        return ret;
      }, readdir() {
        return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
      } };
      return node;
    } }, {}, "/proc/self/fd");
  }, createStandardStreams(input, output, error) {
    if (input) {
      FS.createDevice("/dev", "stdin", input);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (output) {
      FS.createDevice("/dev", "stdout", null, output);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (error) {
      FS.createDevice("/dev", "stderr", null, error);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
  }, staticInit() {
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = { MEMFS };
  }, init(input, output, error) {
    FS.initialized = true;
    input ??= Module["stdin"];
    output ??= Module["stdout"];
    error ??= Module["stderr"];
    FS.createStandardStreams(input, output, error);
  }, quit() {
    FS.initialized = false;
    for (var stream of FS.streams) {
      if (stream) {
        FS.close(stream);
      }
    }
  }, findObject(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (!ret.exists) {
      return null;
    }
    return ret.object;
  }, analyzePath(path, dontResolveLastLink) {
    try {
      var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      path = lookup.path;
    } catch (e) {
    }
    var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
    try {
      var lookup = FS.lookupPath(path, { parent: true });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  }, createPath(parent, path, canRead, canWrite) {
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
      parent = current;
    }
    return current;
  }, createFile(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(canRead, canWrite);
    return FS.create(path, mode);
  }, createDataFile(parent, name, data, canRead, canWrite, canOwn) {
    var path = name;
    if (parent) {
      parent = typeof parent == "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent;
    }
    var mode = FS_getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      if (typeof data == "string") {
        var arr = new Array(data.length);
        for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
        data = arr;
      }
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
  }, createDevice(parent, name, input, output) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(!!input, !!output);
    FS.createDevice.major ??= 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    FS.registerDevice(dev, { open(stream) {
      stream.seekable = false;
    }, close(stream) {
      if (output?.buffer?.length) {
        output(10);
      }
    }, read(stream, buffer, offset, length, pos) {
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = input();
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === void 0 && bytesRead === 0) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === void 0) break;
        bytesRead++;
        buffer[offset + i] = result;
      }
      if (bytesRead) {
        stream.node.atime = Date.now();
      }
      return bytesRead;
    }, write(stream, buffer, offset, length, pos) {
      for (var i = 0; i < length; i++) {
        try {
          output(buffer[offset + i]);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
      }
      if (length) {
        stream.node.mtime = stream.node.ctime = Date.now();
      }
      return i;
    } });
    return FS.mkdev(path, mode, dev);
  }, forceLoadFile(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (globalThis.XMLHttpRequest) {
      abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
    } else {
      try {
        obj.contents = readBinary(obj.url);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
  }, createLazyFile(parent, name, url, canRead, canWrite) {
    class LazyUint8Array {
      lengthKnown = false;
      chunks = [];
      get(idx) {
        if (idx > this.length - 1 || idx < 0) {
          return void 0;
        }
        var chunkOffset = idx % this.chunkSize;
        var chunkNum = idx / this.chunkSize | 0;
        return this.getter(chunkNum)[chunkOffset];
      }
      setDataGetter(getter) {
        this.getter = getter;
      }
      cacheLength() {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
        var chunkSize = 1024 * 1024;
        if (!hasByteServing) chunkSize = datalength;
        var doXHR = (from, to) => {
          if (from > to) abort("invalid range (" + from + ", " + to + ") or no bytes requested!");
          if (to > datalength - 1) abort("only " + datalength + " bytes available! programmer error!");
          var xhr2 = new XMLHttpRequest();
          xhr2.open("GET", url, false);
          if (datalength !== chunkSize) xhr2.setRequestHeader("Range", "bytes=" + from + "-" + to);
          xhr2.responseType = "arraybuffer";
          if (xhr2.overrideMimeType) {
            xhr2.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr2.send(null);
          if (!(xhr2.status >= 200 && xhr2.status < 300 || xhr2.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr2.status);
          if (xhr2.response !== void 0) {
            return new Uint8Array(xhr2.response || []);
          }
          return intArrayFromString(xhr2.responseText || "", true);
        };
        var lazyArray2 = this;
        lazyArray2.setDataGetter((chunkNum) => {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          end = Math.min(end, datalength - 1);
          if (typeof lazyArray2.chunks[chunkNum] == "undefined") {
            lazyArray2.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray2.chunks[chunkNum] == "undefined") abort("doXHR failed!");
          return lazyArray2.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          chunkSize = datalength = 1;
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out("LazyFiles on gzip forces download of the whole file when length is accessed");
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      }
      get length() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._length;
      }
      get chunkSize() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._chunkSize;
      }
    }
    if (globalThis.XMLHttpRequest) {
      if (!ENVIRONMENT_IS_WORKER) abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
      var lazyArray = new LazyUint8Array();
      var properties = { isDevice: false, contents: lazyArray };
    } else {
      var properties = { isDevice: false, url };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    Object.defineProperties(node, { usedBytes: { get: function() {
      return this.contents.length;
    } } });
    var stream_ops = {};
    for (const [key, fn] of Object.entries(node.stream_ops)) {
      stream_ops[key] = (...args) => {
        FS.forceLoadFile(node);
        return fn(...args);
      };
    }
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      if (contents.slice) {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    }
    stream_ops.read = (stream, buffer, offset, length, position) => {
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position);
    };
    stream_ops.mmap = (stream, length, position, prot, flags) => {
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      writeChunks(stream, HEAP8, ptr, length, position);
      return { ptr, allocated: true };
    };
    node.stream_ops = stream_ops;
    return node;
  } };
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
    ptr >>>= 0;
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "";
  };
  var SYSCALLS = { DEFAULT_POLLMASK: 5, calculateAt(dirfd, path, allowEmpty) {
    if (PATH.isAbs(path)) {
      return path;
    }
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return dir + "/" + path;
  }, writeStat(buf, stat) {
    HEAPU32[buf >>> 2 >>> 0] = stat.dev;
    HEAPU32[buf + 4 >>> 2 >>> 0] = stat.mode;
    HEAPU32[buf + 8 >>> 2 >>> 0] = stat.nlink;
    HEAPU32[buf + 12 >>> 2 >>> 0] = stat.uid;
    HEAPU32[buf + 16 >>> 2 >>> 0] = stat.gid;
    HEAPU32[buf + 20 >>> 2 >>> 0] = stat.rdev;
    HEAP64[buf + 24 >>> 3 >>> 0] = BigInt(stat.size);
    HEAP32[buf + 32 >>> 2 >>> 0] = 4096;
    HEAP32[buf + 36 >>> 2 >>> 0] = stat.blocks;
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    HEAP64[buf + 40 >>> 3 >>> 0] = BigInt(Math.floor(atime / 1e3));
    HEAPU32[buf + 48 >>> 2 >>> 0] = atime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 56 >>> 3 >>> 0] = BigInt(Math.floor(mtime / 1e3));
    HEAPU32[buf + 64 >>> 2 >>> 0] = mtime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 72 >>> 3 >>> 0] = BigInt(Math.floor(ctime / 1e3));
    HEAPU32[buf + 80 >>> 2 >>> 0] = ctime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 88 >>> 3 >>> 0] = BigInt(stat.ino);
    return 0;
  }, writeStatFs(buf, stats) {
    HEAPU32[buf + 4 >>> 2 >>> 0] = stats.bsize;
    HEAPU32[buf + 60 >>> 2 >>> 0] = stats.bsize;
    HEAP64[buf + 8 >>> 3 >>> 0] = BigInt(stats.blocks);
    HEAP64[buf + 16 >>> 3 >>> 0] = BigInt(stats.bfree);
    HEAP64[buf + 24 >>> 3 >>> 0] = BigInt(stats.bavail);
    HEAP64[buf + 32 >>> 3 >>> 0] = BigInt(stats.files);
    HEAP64[buf + 40 >>> 3 >>> 0] = BigInt(stats.ffree);
    HEAPU32[buf + 48 >>> 2 >>> 0] = stats.fsid;
    HEAPU32[buf + 64 >>> 2 >>> 0] = stats.flags;
    HEAPU32[buf + 56 >>> 2 >>> 0] = stats.namelen;
  }, doMsync(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (flags & 2) {
      return 0;
    }
    var buffer = HEAPU8.slice(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  }, getStreamFromFD(fd) {
    var stream = FS.getStreamChecked(fd);
    return stream;
  }, varargs: void 0, getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  } };
  var INT53_MAX = 9007199254740992;
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
  function ___syscall_fcntl64(fd, cmd, varargs) {
    varargs >>>= 0;
    SYSCALLS.varargs = varargs;
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          stream.flags |= arg;
          return 0;
        }
        case 12: {
          var arg = syscallGetVarargP();
          var offset = 0;
          HEAP16[arg + offset >>> 1 >>> 0] = 2;
          return 0;
        }
        case 13:
        case 14:
          return 0;
      }
      return -28;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_ioctl(fd, op, varargs) {
    varargs >>>= 0;
    SYSCALLS.varargs = varargs;
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[argp >>> 2 >>> 0] = termios.c_iflag || 0;
            HEAP32[argp + 4 >>> 2 >>> 0] = termios.c_oflag || 0;
            HEAP32[argp + 8 >>> 2 >>> 0] = termios.c_cflag || 0;
            HEAP32[argp + 12 >>> 2 >>> 0] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[argp + i + 17 >>> 0] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[argp >>> 2 >>> 0];
            var c_oflag = HEAP32[argp + 4 >>> 2 >>> 0];
            var c_cflag = HEAP32[argp + 8 >>> 2 >>> 0];
            var c_lflag = HEAP32[argp + 12 >>> 2 >>> 0];
            var c_cc = [];
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[argp + i + 17 >>> 0]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0;
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[argp >>> 2 >>> 0] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28;
        }
        case 21537:
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[argp >>> 1 >>> 0] = winsize[0];
            HEAP16[argp + 2 >>> 1 >>> 0] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default:
          return -28;
      }
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_openat(dirfd, path, flags, varargs) {
    path >>>= 0;
    varargs >>>= 0;
    SYSCALLS.varargs = varargs;
    try {
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      return FS.open(path, flags, mode).fd;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  var __abort_js = () => abort("");
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  var __tzset_js = function(timezone, daylight, std_name, dst_name) {
    timezone >>>= 0;
    daylight >>>= 0;
    std_name >>>= 0;
    dst_name >>>= 0;
    var currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAPU32[timezone >>> 2 >>> 0] = stdTimezoneOffset * 60;
    HEAP32[daylight >>> 2 >>> 0] = Number(winterOffset != summerOffset);
    var extractZone = (timezoneOffset) => {
      var sign = timezoneOffset >= 0 ? "-" : "+";
      var absOffset = Math.abs(timezoneOffset);
      var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
      var minutes = String(absOffset % 60).padStart(2, "0");
      return `UTC${sign}${hours}${minutes}`;
    };
    var winterName = extractZone(winterOffset);
    var summerName = extractZone(summerOffset);
    if (summerOffset < winterOffset) {
      stringToUTF8(winterName, std_name, 17);
      stringToUTF8(summerName, dst_name, 17);
    } else {
      stringToUTF8(winterName, dst_name, 17);
      stringToUTF8(summerName, std_name, 17);
    }
  };
  var _emscripten_get_now = () => performance.now();
  var _emscripten_date_now = () => Date.now();
  var nowIsMonotonic = 1;
  var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3;
  function _clock_time_get(clk_id, ignored_precision, ptime) {
    ignored_precision = bigintToI53Checked(ignored_precision);
    ptime >>>= 0;
    if (!checkWasiClock(clk_id)) {
      return 28;
    }
    var now;
    if (clk_id === 0) {
      now = _emscripten_date_now();
    } else if (nowIsMonotonic) {
      now = _emscripten_get_now();
    } else {
      return 52;
    }
    var nsec = Math.round(now * 1e3 * 1e3);
    HEAP64[ptime >>> 3 >>> 0] = BigInt(nsec);
    return 0;
  }
  var getHeapMax = () => 4294901760;
  function _emscripten_get_heap_max() {
    return getHeapMax();
  }
  var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
  var growMemory = (size) => {
    var oldHeapSize = wasmMemory.buffer.byteLength;
    var pages = (size - oldHeapSize + 65535) / 65536 | 0;
    try {
      wasmMemory.grow(pages);
      updateMemoryViews();
      return 1;
    } catch (e) {
    }
  };
  function _emscripten_resize_heap(requestedSize) {
    requestedSize >>>= 0;
    var oldSize = HEAPU8.length;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
      return false;
    }
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
      var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
      var replacement = growMemory(newSize);
      if (replacement) {
        return true;
      }
    }
    return false;
  }
  var ENV = {};
  var getExecutableName = () => thisProgram || "./this.program";
  var getEnvStrings = () => {
    if (!getEnvStrings.strings) {
      var lang = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
      var env = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: lang, _: getExecutableName() };
      for (var x in ENV) {
        if (ENV[x] === void 0) delete env[x];
        else env[x] = ENV[x];
      }
      var strings = [];
      for (var x in env) {
        strings.push(`${x}=${env[x]}`);
      }
      getEnvStrings.strings = strings;
    }
    return getEnvStrings.strings;
  };
  function _environ_get(__environ, environ_buf) {
    __environ >>>= 0;
    environ_buf >>>= 0;
    var bufSize = 0;
    var envp = 0;
    for (var string of getEnvStrings()) {
      var ptr = environ_buf + bufSize;
      HEAPU32[__environ + envp >>> 2 >>> 0] = ptr;
      bufSize += stringToUTF8(string, ptr, Infinity) + 1;
      envp += 4;
    }
    return 0;
  }
  function _environ_sizes_get(penviron_count, penviron_buf_size) {
    penviron_count >>>= 0;
    penviron_buf_size >>>= 0;
    var strings = getEnvStrings();
    HEAPU32[penviron_count >>> 2 >>> 0] = strings.length;
    var bufSize = 0;
    for (var string of strings) {
      bufSize += lengthBytesUTF8(string) + 1;
    }
    HEAPU32[penviron_buf_size >>> 2 >>> 0] = bufSize;
    return 0;
  }
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  var _proc_exit = (code) => {
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
      Module["onExit"]?.(code);
      ABORT = true;
    }
    quit_(code, new ExitStatus(code));
  };
  var exitJS = (status, implicit) => {
    EXITSTATUS = status;
    _proc_exit(status);
  };
  var _exit = exitJS;
  function _fd_close(fd) {
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var doReadv = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAPU32[iov >>> 2 >>> 0];
      var len = HEAPU32[iov + 4 >>> 2 >>> 0];
      iov += 8;
      var curr = FS.read(stream, HEAP8, ptr, len, offset);
      if (curr < 0) return -1;
      ret += curr;
      if (curr < len) break;
      if (typeof offset != "undefined") {
        offset += curr;
      }
    }
    return ret;
  };
  function _fd_read(fd, iov, iovcnt, pnum) {
    iov >>>= 0;
    iovcnt >>>= 0;
    pnum >>>= 0;
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[pnum >>> 2 >>> 0] = num;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    newOffset >>>= 0;
    try {
      if (isNaN(offset)) return 61;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[newOffset >>> 3 >>> 0] = BigInt(stream.position);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var doWritev = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAPU32[iov >>> 2 >>> 0];
      var len = HEAPU32[iov + 4 >>> 2 >>> 0];
      iov += 8;
      var curr = FS.write(stream, HEAP8, ptr, len, offset);
      if (curr < 0) return -1;
      ret += curr;
      if (curr < len) {
        break;
      }
      if (typeof offset != "undefined") {
        offset += curr;
      }
    }
    return ret;
  };
  function _fd_write(fd, iov, iovcnt, pnum) {
    iov >>>= 0;
    iovcnt >>>= 0;
    pnum >>>= 0;
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[pnum >>> 2 >>> 0] = num;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var getCFunc = (ident) => {
    var func = Module["_" + ident];
    return func;
  };
  var writeArrayToMemory = (array, buffer) => {
    HEAP8.set(array, buffer >>> 0);
  };
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  var stringToUTF8OnStack = (str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret;
  };
  var stackSave = () => _emscripten_stack_get_current();
  var stackRestore = (val) => __emscripten_stack_restore(val);
  var ccall = (ident, returnType, argTypes, args, opts) => {
    var toC = { string: (str) => {
      var ret2 = 0;
      if (str !== null && str !== void 0 && str !== 0) {
        ret2 = stringToUTF8OnStack(str);
      }
      return ret2;
    }, array: (arr) => {
      var ret2 = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret2);
      return ret2;
    } };
    function convertReturnValue(ret2) {
      if (returnType === "string") {
        return UTF8ToString(ret2);
      }
      if (returnType === "pointer") return ret2 >>> 0;
      if (returnType === "boolean") return Boolean(ret2);
      return ret2;
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func(...cArgs);
    function onDone(ret2) {
      if (stack !== 0) stackRestore(stack);
      return convertReturnValue(ret2);
    }
    ret = onDone(ret);
    return ret;
  };
  var getCppExceptionTag = () => ___cpp_exception;
  var getCppExceptionThrownObjectFromWebAssemblyException = (ex) => {
    var unwind_header = ex.getArg(getCppExceptionTag(), 0);
    return ___thrown_object_from_unwind_exception(unwind_header);
  };
  var incrementExceptionRefcount = (ex) => {
    var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
    ___cxa_increment_exception_refcount(ptr);
  };
  var decrementExceptionRefcount = (ex) => {
    var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
    ___cxa_decrement_exception_refcount(ptr);
  };
  var getExceptionMessageCommon = (ptr) => {
    var sp = stackSave();
    var type_addr_addr = stackAlloc(4);
    var message_addr_addr = stackAlloc(4);
    ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
    var type_addr = HEAPU32[type_addr_addr >>> 2 >>> 0];
    var message_addr = HEAPU32[message_addr_addr >>> 2 >>> 0];
    var type = UTF8ToString(type_addr);
    _free(type_addr);
    var message;
    if (message_addr) {
      message = UTF8ToString(message_addr);
      _free(message_addr);
    }
    stackRestore(sp);
    return [type, message];
  };
  var getExceptionMessage = (ex) => {
    var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
    return getExceptionMessageCommon(ptr);
  };
  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.preloadFile = FS_preloadFile;
  FS.staticInit();
  {
    if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
    if (Module["preloadPlugins"]) preloadPlugins = Module["preloadPlugins"];
    if (Module["print"]) out = Module["print"];
    if (Module["printErr"]) err = Module["printErr"];
    if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
    if (Module["arguments"]) arguments_ = Module["arguments"];
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
      while (Module["preInit"].length > 0) {
        Module["preInit"].shift()();
      }
    }
  }
  Module["ccall"] = ccall;
  Module["UTF8ToString"] = UTF8ToString;
  Module["incrementExceptionRefcount"] = incrementExceptionRefcount;
  Module["decrementExceptionRefcount"] = decrementExceptionRefcount;
  Module["getExceptionMessage"] = getExceptionMessage;
  var _set_throwy_error_handler, _Z3_get_error_msg, _set_noop_error_handler, _Z3_mk_array_sort, _Z3_mk_array_sort_n, _Z3_mk_select, _Z3_mk_select_n, _Z3_mk_store, _Z3_mk_store_n, _Z3_mk_map, _Z3_mk_const_array, _Z3_mk_array_default, _Z3_mk_set_sort, _Z3_mk_empty_set, _Z3_mk_full_set, _Z3_mk_set_union, _Z3_mk_set_intersect, _Z3_mk_set_difference, _Z3_mk_set_complement, _Z3_mk_set_subset, _Z3_mk_array_ext, _Z3_mk_as_array, _Z3_mk_set_member, _Z3_mk_set_add, _Z3_mk_set_del, _Z3_get_array_arity, _Z3_get_array_sort_domain, _Z3_get_array_sort_domain_n, _Z3_get_array_sort_range, _Z3_mk_fpa_rounding_mode_sort, _Z3_mk_fpa_round_nearest_ties_to_even, _Z3_mk_fpa_rne, _Z3_mk_fpa_round_nearest_ties_to_away, _Z3_mk_fpa_rna, _Z3_mk_fpa_round_toward_positive, _Z3_mk_fpa_rtp, _Z3_mk_fpa_round_toward_negative, _Z3_mk_fpa_rtn, _Z3_mk_fpa_round_toward_zero, _Z3_mk_fpa_rtz, _Z3_mk_fpa_sort, _Z3_mk_fpa_sort_half, _Z3_mk_fpa_sort_16, _Z3_mk_fpa_sort_single, _Z3_mk_fpa_sort_32, _Z3_mk_fpa_sort_double, _Z3_mk_fpa_sort_64, _Z3_mk_fpa_sort_quadruple, _Z3_mk_fpa_sort_128, _Z3_mk_fpa_nan, _Z3_mk_fpa_inf, _Z3_mk_fpa_zero, _Z3_mk_fpa_fp, _Z3_mk_fpa_numeral_float, _Z3_mk_fpa_numeral_double, _Z3_mk_fpa_numeral_int, _Z3_mk_fpa_numeral_int_uint, _Z3_mk_fpa_numeral_int64_uint64, _Z3_mk_fpa_abs, _Z3_mk_fpa_neg, _Z3_mk_fpa_add, _Z3_mk_fpa_sub, _Z3_mk_fpa_mul, _Z3_mk_fpa_div, _Z3_mk_fpa_fma, _Z3_mk_fpa_sqrt, _Z3_mk_fpa_rem, _Z3_mk_fpa_round_to_integral, _Z3_mk_fpa_min, _Z3_mk_fpa_max, _Z3_mk_fpa_leq, _Z3_mk_fpa_lt, _Z3_mk_fpa_geq, _Z3_mk_fpa_gt, _Z3_mk_fpa_eq, _Z3_mk_fpa_is_normal, _Z3_mk_fpa_is_subnormal, _Z3_mk_fpa_is_zero, _Z3_mk_fpa_is_infinite, _Z3_mk_fpa_is_nan, _Z3_mk_fpa_is_negative, _Z3_mk_fpa_is_positive, _Z3_mk_fpa_to_fp_bv, _Z3_mk_fpa_to_fp_float, _Z3_mk_fpa_to_fp_real, _Z3_mk_fpa_to_fp_signed, _Z3_mk_fpa_to_fp_unsigned, _Z3_mk_fpa_to_ubv, _Z3_mk_fpa_to_sbv, _Z3_mk_fpa_to_real, _Z3_fpa_get_ebits, _Z3_fpa_get_sbits, _Z3_fpa_get_numeral_sign, _Z3_fpa_get_numeral_sign_bv, _Z3_fpa_get_numeral_significand_bv, _Z3_fpa_get_numeral_significand_string, _Z3_fpa_get_numeral_significand_uint64, _Z3_fpa_get_numeral_exponent_string, _Z3_fpa_get_numeral_exponent_int64, _Z3_fpa_get_numeral_exponent_bv, _Z3_mk_fpa_to_ieee_bv, _Z3_mk_fpa_to_fp_int_real, _Z3_fpa_is_numeral, _Z3_fpa_is_numeral_nan, _Z3_fpa_is_numeral_inf, _Z3_fpa_is_numeral_zero, _Z3_fpa_is_numeral_normal, _Z3_fpa_is_numeral_subnormal, _Z3_fpa_is_numeral_positive, _Z3_fpa_is_numeral_negative, _Z3_mk_int_sort, _Z3_mk_real_sort, _Z3_mk_real_int64, _Z3_mk_real, _Z3_mk_add, _Z3_mk_mul, _Z3_mk_power, _Z3_mk_mod, _Z3_mk_rem, _Z3_mk_div, _Z3_mk_lt, _Z3_mk_gt, _Z3_mk_le, _Z3_mk_ge, _Z3_mk_divides, _Z3_mk_abs, _Z3_mk_int2real, _Z3_mk_real2int, _Z3_mk_is_int, _Z3_mk_sub, _Z3_mk_unary_minus, _Z3_is_algebraic_number, _Z3_get_algebraic_number_lower, _Z3_get_algebraic_number_upper, _Z3_get_numerator, _Z3_get_denominator, _Z3_mk_tuple_sort, _Z3_mk_enumeration_sort, _Z3_mk_list_sort, _Z3_mk_constructor, _Z3_constructor_num_fields, _Z3_query_constructor, _Z3_del_constructor, _Z3_mk_datatype, _Z3_mk_polymorphic_datatype, _Z3_mk_constructor_list, _Z3_del_constructor_list, _Z3_mk_datatype_sort, _Z3_mk_datatypes, _Z3_is_recursive_datatype_sort, _Z3_get_datatype_sort_num_constructors, _Z3_get_datatype_sort_constructor, _Z3_get_datatype_sort_recognizer, _Z3_get_datatype_sort_constructor_accessor, _Z3_get_tuple_sort_mk_decl, _Z3_get_tuple_sort_num_fields, _Z3_get_tuple_sort_field_decl, _Z3_datatype_update_field, _Z3_mk_model, _Z3_model_inc_ref, _Z3_model_dec_ref, _Z3_model_get_const_interp, _Z3_model_has_interp, _Z3_model_get_func_interp, _Z3_model_get_num_consts, _Z3_model_get_const_decl, _Z3_model_get_num_funcs, _Z3_model_get_func_decl, _Z3_model_eval, _Z3_model_get_num_sorts, _Z3_model_get_sort, _Z3_model_get_sort_universe, _Z3_model_translate, _Z3_is_as_array, _Z3_get_as_array_func_decl, _Z3_add_func_interp, _Z3_add_const_interp, _Z3_func_interp_inc_ref, _Z3_func_interp_dec_ref, _Z3_func_interp_get_num_entries, _Z3_func_interp_get_entry, _Z3_func_interp_get_else, _Z3_func_interp_set_else, _Z3_func_interp_get_arity, _Z3_func_interp_add_entry, _Z3_func_entry_inc_ref, _Z3_func_entry_dec_ref, _Z3_func_entry_get_value, _Z3_func_entry_get_num_args, _Z3_func_entry_get_arg, _Z3_model_to_string, _Z3_mk_ast_map, _Z3_ast_map_inc_ref, _Z3_ast_map_dec_ref, _Z3_ast_map_contains, _Z3_ast_map_find, _Z3_ast_map_insert, _Z3_ast_map_reset, _Z3_ast_map_erase, _Z3_ast_map_size, _Z3_ast_map_keys, _Z3_ast_map_to_string, _Z3_get_relation_arity, _Z3_get_relation_column, _Z3_mk_finite_domain_sort, _Z3_get_finite_domain_sort_size, _Z3_mk_fixedpoint, _Z3_fixedpoint_inc_ref, _Z3_fixedpoint_dec_ref, _Z3_fixedpoint_assert, _Z3_fixedpoint_add_rule, _Z3_fixedpoint_add_fact, _Z3_fixedpoint_query, _Z3_fixedpoint_query_relations, _Z3_fixedpoint_get_answer, _Z3_fixedpoint_get_reason_unknown, _Z3_fixedpoint_to_string, _Z3_fixedpoint_from_string, _Z3_fixedpoint_from_file, _Z3_fixedpoint_get_statistics, _Z3_fixedpoint_register_relation, _Z3_fixedpoint_set_predicate_representation, _Z3_fixedpoint_get_rules, _Z3_fixedpoint_get_assertions, _Z3_fixedpoint_update_rule, _Z3_fixedpoint_get_num_levels, _Z3_fixedpoint_get_cover_delta, _Z3_fixedpoint_add_cover, _Z3_fixedpoint_get_help, _Z3_fixedpoint_get_param_descrs, _Z3_fixedpoint_set_params, _Z3_fixedpoint_query_from_lvl, _Z3_fixedpoint_get_ground_sat_answer, _Z3_fixedpoint_get_rules_along_trace, _Z3_fixedpoint_get_rule_names_along_trace, _Z3_fixedpoint_add_invariant, _Z3_fixedpoint_get_reachable, _Z3_mk_ast_vector, _Z3_ast_vector_inc_ref, _Z3_ast_vector_dec_ref, _Z3_ast_vector_size, _Z3_ast_vector_get, _Z3_ast_vector_set, _Z3_ast_vector_resize, _Z3_ast_vector_push, _Z3_ast_vector_translate, _Z3_ast_vector_to_string, _Z3_mk_optimize, _Z3_optimize_inc_ref, _Z3_optimize_dec_ref, _Z3_optimize_assert, _Z3_optimize_assert_and_track, _Z3_optimize_assert_soft, _Z3_optimize_maximize, _Z3_optimize_minimize, _Z3_optimize_push, _Z3_optimize_pop, _Z3_optimize_check, _Z3_optimize_get_unsat_core, _Z3_optimize_get_reason_unknown, _Z3_optimize_get_model, _Z3_optimize_set_params, _Z3_optimize_get_param_descrs, _Z3_optimize_get_lower, _Z3_optimize_get_upper, _Z3_optimize_get_lower_as_vector, _Z3_optimize_get_upper_as_vector, _Z3_optimize_to_string, _Z3_optimize_get_help, _Z3_optimize_get_statistics, _Z3_optimize_from_string, _Z3_optimize_from_file, _Z3_optimize_get_assertions, _Z3_optimize_get_objectives, _Z3_optimize_set_initial_value, _Z3_optimize_translate, _Z3_mk_linear_order, _Z3_mk_partial_order, _Z3_mk_piecewise_linear_order, _Z3_mk_tree_order, _Z3_mk_transitive_closure, _Z3_algebraic_is_value, _Z3_algebraic_is_pos, _Z3_algebraic_sign, _Z3_algebraic_is_neg, _Z3_algebraic_is_zero, _Z3_algebraic_add, _Z3_algebraic_sub, _Z3_algebraic_mul, _Z3_algebraic_div, _Z3_algebraic_root, _Z3_algebraic_power, _Z3_algebraic_lt, _Z3_algebraic_gt, _Z3_algebraic_le, _Z3_algebraic_ge, _Z3_algebraic_eq, _Z3_algebraic_neq, _Z3_algebraic_roots, _Z3_algebraic_eval, _Z3_algebraic_get_poly, _Z3_algebraic_get_i, _Z3_mk_tactic, _Z3_tactic_inc_ref, _Z3_tactic_dec_ref, _Z3_mk_probe, _Z3_probe_inc_ref, _Z3_probe_dec_ref, _Z3_tactic_and_then, _Z3_tactic_or_else, _Z3_tactic_par_or, _Z3_tactic_par_and_then, _Z3_tactic_try_for, _Z3_tactic_when, _Z3_tactic_cond, _Z3_tactic_repeat, _Z3_tactic_skip, _Z3_tactic_fail, _Z3_tactic_fail_if, _Z3_tactic_fail_if_not_decided, _Z3_tactic_using_params, _Z3_probe_const, _Z3_probe_lt, _Z3_probe_gt, _Z3_probe_le, _Z3_probe_ge, _Z3_probe_eq, _Z3_probe_and, _Z3_probe_or, _Z3_probe_not, _Z3_get_num_tactics, _Z3_get_tactic_name, _Z3_get_num_probes, _Z3_get_probe_name, _Z3_tactic_get_help, _Z3_tactic_get_param_descrs, _Z3_tactic_get_descr, _Z3_probe_get_descr, _Z3_probe_apply, _Z3_tactic_apply, _Z3_tactic_apply_ex, _Z3_apply_result_inc_ref, _Z3_apply_result_dec_ref, _Z3_apply_result_to_string, _Z3_apply_result_get_num_subgoals, _Z3_apply_result_get_subgoal, _Z3_mk_simplifier, _Z3_simplifier_inc_ref, _Z3_simplifier_dec_ref, _Z3_get_num_simplifiers, _Z3_get_simplifier_name, _Z3_simplifier_and_then, _Z3_simplifier_using_params, _Z3_simplifier_get_help, _Z3_simplifier_get_param_descrs, _Z3_simplifier_get_descr, _Z3_mk_int_symbol, _Z3_mk_string_symbol, _Z3_is_eq_sort, _Z3_mk_uninterpreted_sort, _Z3_mk_type_variable, _Z3_is_eq_ast, _Z3_is_eq_func_decl, _Z3_mk_func_decl, _Z3_mk_rec_func_decl, _Z3_add_rec_def, _Z3_mk_app, _Z3_mk_const, _Z3_mk_fresh_func_decl, _Z3_mk_fresh_const, _Z3_mk_true, _Z3_mk_false, _Z3_mk_not, _Z3_mk_eq, _Z3_mk_distinct, _Z3_mk_iff, _Z3_mk_implies, _Z3_mk_xor, _Z3_mk_and, _Z3_mk_or, _Z3_mk_ite, _Z3_mk_bool_sort, _Z3_app_to_ast, _Z3_sort_to_ast, _Z3_func_decl_to_ast, _Z3_get_ast_id, _Z3_get_func_decl_id, _Z3_get_sort_id, _Z3_is_well_sorted, _Z3_get_symbol_kind, _Z3_get_symbol_int, _Z3_get_symbol_string, _Z3_get_ast_kind, _Z3_get_ast_hash, _Z3_is_app, _Z3_to_app, _Z3_is_ground, _Z3_get_depth, _Z3_to_func_decl, _Z3_get_app_decl, _Z3_get_app_num_args, _Z3_get_app_arg, _Z3_get_decl_name, _Z3_get_decl_num_parameters, _Z3_get_decl_parameter_kind, _Z3_get_decl_int_parameter, _Z3_get_decl_double_parameter, _Z3_get_decl_symbol_parameter, _Z3_get_decl_sort_parameter, _Z3_get_decl_ast_parameter, _Z3_get_decl_func_decl_parameter, _Z3_get_decl_rational_parameter, _Z3_get_sort_name, _Z3_get_sort, _Z3_get_arity, _Z3_get_domain_size, _Z3_get_domain, _Z3_get_range, _Z3_get_sort_kind, _Z3_get_bool_value, _Z3_simplify, _Z3_simplify_ex, _Z3_simplify_get_help, _Z3_simplify_get_param_descrs, _Z3_update_term, _Z3_substitute, _Z3_substitute_funs, _Z3_substitute_vars, _Z3_ast_to_string, _Z3_sort_to_string, _Z3_func_decl_to_string, _Z3_benchmark_to_smtlib_string, _Z3_get_decl_kind, _Z3_get_index_value, _Z3_translate, _Z3_mk_context, _Z3_mk_context_rc, _Z3_del_context, _Z3_interrupt, _Z3_enable_concurrent_dec_ref, _Z3_toggle_warning_messages, _Z3_inc_ref, _Z3_dec_ref, _Z3_get_version, _Z3_get_full_version, _Z3_enable_trace, _Z3_disable_trace, _Z3_reset_memory, _Z3_finalize_memory, _Z3_get_error_code, _Z3_set_error, _Z3_set_ast_print_mode, _Z3_qe_model_project, _Z3_qe_model_project_skolem, _Z3_qe_model_project_with_witness, _Z3_model_extrapolate, _Z3_qe_lite, _Z3_open_log, _Z3_append_log, _Z3_close_log, _Z3_mk_atmost, _Z3_mk_atleast, _Z3_mk_pble, _Z3_mk_pbge, _Z3_mk_pbeq, _Z3_polynomial_subresultants, _Z3_mk_goal, _Z3_goal_inc_ref, _Z3_goal_dec_ref, _Z3_goal_precision, _Z3_goal_assert, _Z3_goal_inconsistent, _Z3_goal_depth, _Z3_goal_reset, _Z3_goal_size, _Z3_goal_formula, _Z3_goal_num_exprs, _Z3_goal_is_decided_sat, _Z3_goal_is_decided_unsat, _Z3_goal_convert_model, _Z3_goal_translate, _Z3_goal_to_string, _Z3_goal_to_dimacs_string, _Z3_rcf_del, _Z3_rcf_mk_rational, _Z3_rcf_mk_small_int, _Z3_rcf_mk_pi, _Z3_rcf_mk_e, _Z3_rcf_mk_infinitesimal, _Z3_rcf_mk_roots, _Z3_rcf_add, _Z3_rcf_sub, _Z3_rcf_mul, _Z3_rcf_div, _Z3_rcf_neg, _Z3_rcf_inv, _Z3_rcf_power, _Z3_rcf_lt, _Z3_rcf_gt, _Z3_rcf_le, _Z3_rcf_ge, _Z3_rcf_eq, _Z3_rcf_neq, _Z3_rcf_num_to_string, _Z3_rcf_num_to_decimal_string, _Z3_rcf_get_numerator_denominator, _Z3_rcf_is_rational, _Z3_rcf_is_algebraic, _Z3_rcf_is_infinitesimal, _Z3_rcf_is_transcendental, _Z3_rcf_extension_index, _Z3_rcf_transcendental_name, _Z3_rcf_infinitesimal_name, _Z3_rcf_num_coefficients, _Z3_rcf_coefficient, _Z3_rcf_interval, _Z3_rcf_num_sign_conditions, _Z3_rcf_sign_condition_sign, _Z3_rcf_num_sign_condition_coefficients, _Z3_rcf_sign_condition_coefficient, _Z3_mk_seq_sort, _Z3_mk_re_sort, _Z3_mk_string, _Z3_mk_lstring, _Z3_mk_u32string, _Z3_mk_char, _Z3_mk_string_sort, _Z3_mk_char_sort, _Z3_is_seq_sort, _Z3_is_re_sort, _Z3_get_seq_sort_basis, _Z3_get_re_sort_basis, _Z3_is_char_sort, _Z3_is_string_sort, _Z3_is_string, _Z3_get_string, _Z3_get_lstring, _Z3_get_string_length, _Z3_get_string_contents, _Z3_mk_seq_empty, _Z3_mk_seq_unit, _Z3_mk_seq_concat, _Z3_mk_seq_prefix, _Z3_mk_seq_suffix, _Z3_mk_seq_contains, _Z3_mk_str_lt, _Z3_mk_str_le, _Z3_mk_string_to_code, _Z3_mk_string_from_code, _Z3_mk_seq_extract, _Z3_mk_seq_replace, _Z3_mk_seq_replace_all, _Z3_mk_seq_replace_re, _Z3_mk_seq_replace_re_all, _Z3_mk_seq_at, _Z3_mk_seq_nth, _Z3_mk_seq_length, _Z3_mk_seq_index, _Z3_mk_seq_last_index, _Z3_mk_seq_to_re, _Z3_mk_seq_in_re, _Z3_mk_int_to_str, _Z3_mk_str_to_int, _Z3_mk_ubv_to_str, _Z3_mk_sbv_to_str, _Z3_mk_re_loop, _Z3_mk_re_power, _Z3_mk_re_plus, _Z3_mk_re_star, _Z3_mk_re_option, _Z3_mk_re_complement, _Z3_mk_re_diff, _Z3_mk_re_union, _Z3_mk_re_intersect, _Z3_mk_re_concat, _Z3_mk_re_range, _Z3_mk_re_allchar, _Z3_mk_re_empty, _Z3_mk_re_full, _Z3_mk_char_le, _Z3_mk_char_to_int, _Z3_mk_char_to_bv, _Z3_mk_char_from_bv, _Z3_mk_char_is_digit, _Z3_mk_seq_map, _Z3_mk_seq_mapi, _Z3_mk_seq_foldl, _Z3_mk_seq_foldli, _Z3_mk_bv_sort, _Z3_mk_bvnot, _Z3_mk_bvredand, _Z3_mk_bvredor, _Z3_mk_bvand, _Z3_mk_bvor, _Z3_mk_bvxor, _Z3_mk_bvnand, _Z3_mk_bvnor, _Z3_mk_bvxnor, _Z3_mk_bvadd, _Z3_mk_bvmul, _Z3_mk_bvudiv, _Z3_mk_bvsdiv, _Z3_mk_bvurem, _Z3_mk_bvsrem, _Z3_mk_bvsmod, _Z3_mk_bvule, _Z3_mk_bvsle, _Z3_mk_bvuge, _Z3_mk_bvsge, _Z3_mk_bvult, _Z3_mk_bvslt, _Z3_mk_bvugt, _Z3_mk_bvsgt, _Z3_mk_concat, _Z3_mk_bvshl, _Z3_mk_bvlshr, _Z3_mk_bvashr, _Z3_mk_ext_rotate_left, _Z3_mk_ext_rotate_right, _Z3_mk_extract, _Z3_mk_sign_ext, _Z3_mk_zero_ext, _Z3_mk_repeat, _Z3_mk_bit2bool, _Z3_mk_rotate_left, _Z3_mk_rotate_right, _Z3_mk_int2bv, _Z3_mk_bv2int, _Z3_get_bv_sort_size, _Z3_mk_bvadd_no_overflow, _Z3_mk_bvadd_no_underflow, _Z3_mk_bvsub_no_overflow, _Z3_mk_bvneg, _Z3_mk_bvsub_no_underflow, _Z3_mk_bvmul_no_overflow, _Z3_mk_bvmul_no_underflow, _Z3_mk_bvneg_no_overflow, _Z3_mk_bvsdiv_no_overflow, _Z3_mk_bvsub, _Z3_stats_to_string, _Z3_stats_inc_ref, _Z3_stats_dec_ref, _Z3_stats_size, _Z3_stats_get_key, _Z3_stats_is_uint, _Z3_stats_is_double, _Z3_stats_get_uint_value, _Z3_stats_get_double_value, _Z3_get_estimated_alloc_size, _Z3_global_param_set, _Z3_global_param_reset_all, _Z3_global_param_get, _Z3_get_global_param_descrs, _Z3_mk_config, _Z3_del_config, _Z3_set_param_value, _Z3_update_param_value, _Z3_mk_simple_solver, _Z3_mk_solver, _Z3_mk_solver_for_logic, _Z3_mk_solver_from_tactic, _Z3_solver_add_simplifier, _Z3_solver_translate, _Z3_solver_import_model_converter, _Z3_solver_from_string, _Z3_solver_from_file, _Z3_solver_get_help, _Z3_solver_get_param_descrs, _Z3_solver_set_params, _Z3_solver_inc_ref, _Z3_solver_dec_ref, _Z3_solver_push, _Z3_solver_interrupt, _Z3_solver_pop, _Z3_solver_reset, _Z3_solver_get_num_scopes, _Z3_solver_assert, _Z3_solver_assert_and_track, _Z3_solver_get_assertions, _Z3_solver_get_units, _Z3_solver_get_non_units, _Z3_solver_get_levels, _Z3_solver_get_trail, _Z3_solver_check, _Z3_solver_check_assumptions, _Z3_solver_get_model, _Z3_solver_get_proof, _Z3_solver_get_unsat_core, _Z3_solver_get_reason_unknown, _Z3_solver_get_statistics, _Z3_solver_to_string, _Z3_solver_to_dimacs_string, _Z3_get_implied_equalities, _Z3_solver_get_consequences, _Z3_solver_cube, _Z3_solver_congruence_root, _Z3_solver_congruence_next, _Z3_solver_congruence_explain, _Z3_solver_solve_for, _Z3_solver_register_on_clause, _Z3_solver_propagate_init, _Z3_solver_propagate_fixed, _Z3_solver_propagate_final, _Z3_solver_propagate_eq, _Z3_solver_propagate_diseq, _Z3_solver_propagate_register, _Z3_solver_propagate_register_cb, _Z3_solver_propagate_consequence, _Z3_solver_propagate_created, _Z3_solver_propagate_decide, _Z3_solver_propagate_on_binding, _Z3_solver_next_split, _Z3_solver_propagate_declare, _Z3_solver_set_initial_value, _Z3_mk_quantifier, _Z3_mk_quantifier_ex, _Z3_mk_forall, _Z3_mk_exists, _Z3_mk_lambda, _Z3_mk_lambda_const, _Z3_mk_quantifier_const_ex, _Z3_mk_quantifier_const, _Z3_mk_forall_const, _Z3_mk_exists_const, _Z3_mk_pattern, _Z3_mk_bound, _Z3_is_quantifier_forall, _Z3_is_quantifier_exists, _Z3_is_lambda, _Z3_get_quantifier_weight, _Z3_get_quantifier_skolem_id, _Z3_get_quantifier_id, _Z3_get_quantifier_num_patterns, _Z3_get_quantifier_pattern_ast, _Z3_get_quantifier_num_no_patterns, _Z3_get_quantifier_no_pattern_ast, _Z3_get_quantifier_bound_name, _Z3_get_quantifier_bound_sort, _Z3_get_quantifier_body, _Z3_get_quantifier_num_bound, _Z3_get_pattern_num_terms, _Z3_get_pattern, _Z3_pattern_to_ast, _Z3_pattern_to_string, _Z3_mk_params, _Z3_params_inc_ref, _Z3_params_dec_ref, _Z3_params_set_bool, _Z3_params_set_uint, _Z3_params_set_double, _Z3_params_set_symbol, _Z3_params_to_string, _Z3_params_validate, _Z3_param_descrs_inc_ref, _Z3_param_descrs_dec_ref, _Z3_param_descrs_get_kind, _Z3_param_descrs_size, _Z3_param_descrs_get_name, _Z3_param_descrs_get_documentation, _Z3_param_descrs_to_string, _Z3_mk_numeral, _Z3_mk_int, _Z3_mk_unsigned_int, _Z3_mk_int64, _Z3_mk_unsigned_int64, _Z3_is_numeral_ast, _Z3_get_numeral_binary_string, _Z3_get_numeral_string, _Z3_get_numeral_double, _Z3_get_numeral_decimal_string, _Z3_get_numeral_small, _Z3_get_numeral_int, _Z3_get_numeral_int64, _Z3_get_numeral_uint, _Z3_get_numeral_uint64, _Z3_get_numeral_rational_int64, _Z3_mk_bv_numeral, _Z3_mk_parser_context, _Z3_parser_context_inc_ref, _Z3_parser_context_dec_ref, _Z3_parser_context_add_sort, _Z3_parser_context_add_decl, _Z3_parser_context_from_string, _Z3_parse_smtlib2_string, _Z3_parse_smtlib2_file, _Z3_eval_smtlib2_string, _free, _malloc, ___trap, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, ___cxa_decrement_exception_refcount, ___cxa_increment_exception_refcount, ___thrown_object_from_unwind_exception, ___get_exception_message, memory, __indirect_function_table, ___cpp_exception, wasmMemory;
  function assignWasmExports(wasmExports2) {
    _set_throwy_error_handler = Module["_set_throwy_error_handler"] = wasmExports2["set_throwy_error_handler"];
    _Z3_get_error_msg = Module["_Z3_get_error_msg"] = wasmExports2["Z3_get_error_msg"];
    _set_noop_error_handler = Module["_set_noop_error_handler"] = wasmExports2["set_noop_error_handler"];
    _Z3_mk_array_sort = Module["_Z3_mk_array_sort"] = wasmExports2["Z3_mk_array_sort"];
    _Z3_mk_array_sort_n = Module["_Z3_mk_array_sort_n"] = wasmExports2["Z3_mk_array_sort_n"];
    _Z3_mk_select = Module["_Z3_mk_select"] = wasmExports2["Z3_mk_select"];
    _Z3_mk_select_n = Module["_Z3_mk_select_n"] = wasmExports2["Z3_mk_select_n"];
    _Z3_mk_store = Module["_Z3_mk_store"] = wasmExports2["Z3_mk_store"];
    _Z3_mk_store_n = Module["_Z3_mk_store_n"] = wasmExports2["Z3_mk_store_n"];
    _Z3_mk_map = Module["_Z3_mk_map"] = wasmExports2["Z3_mk_map"];
    _Z3_mk_const_array = Module["_Z3_mk_const_array"] = wasmExports2["Z3_mk_const_array"];
    _Z3_mk_array_default = Module["_Z3_mk_array_default"] = wasmExports2["Z3_mk_array_default"];
    _Z3_mk_set_sort = Module["_Z3_mk_set_sort"] = wasmExports2["Z3_mk_set_sort"];
    _Z3_mk_empty_set = Module["_Z3_mk_empty_set"] = wasmExports2["Z3_mk_empty_set"];
    _Z3_mk_full_set = Module["_Z3_mk_full_set"] = wasmExports2["Z3_mk_full_set"];
    _Z3_mk_set_union = Module["_Z3_mk_set_union"] = wasmExports2["Z3_mk_set_union"];
    _Z3_mk_set_intersect = Module["_Z3_mk_set_intersect"] = wasmExports2["Z3_mk_set_intersect"];
    _Z3_mk_set_difference = Module["_Z3_mk_set_difference"] = wasmExports2["Z3_mk_set_difference"];
    _Z3_mk_set_complement = Module["_Z3_mk_set_complement"] = wasmExports2["Z3_mk_set_complement"];
    _Z3_mk_set_subset = Module["_Z3_mk_set_subset"] = wasmExports2["Z3_mk_set_subset"];
    _Z3_mk_array_ext = Module["_Z3_mk_array_ext"] = wasmExports2["Z3_mk_array_ext"];
    _Z3_mk_as_array = Module["_Z3_mk_as_array"] = wasmExports2["Z3_mk_as_array"];
    _Z3_mk_set_member = Module["_Z3_mk_set_member"] = wasmExports2["Z3_mk_set_member"];
    _Z3_mk_set_add = Module["_Z3_mk_set_add"] = wasmExports2["Z3_mk_set_add"];
    _Z3_mk_set_del = Module["_Z3_mk_set_del"] = wasmExports2["Z3_mk_set_del"];
    _Z3_get_array_arity = Module["_Z3_get_array_arity"] = wasmExports2["Z3_get_array_arity"];
    _Z3_get_array_sort_domain = Module["_Z3_get_array_sort_domain"] = wasmExports2["Z3_get_array_sort_domain"];
    _Z3_get_array_sort_domain_n = Module["_Z3_get_array_sort_domain_n"] = wasmExports2["Z3_get_array_sort_domain_n"];
    _Z3_get_array_sort_range = Module["_Z3_get_array_sort_range"] = wasmExports2["Z3_get_array_sort_range"];
    _Z3_mk_fpa_rounding_mode_sort = Module["_Z3_mk_fpa_rounding_mode_sort"] = wasmExports2["Z3_mk_fpa_rounding_mode_sort"];
    _Z3_mk_fpa_round_nearest_ties_to_even = Module["_Z3_mk_fpa_round_nearest_ties_to_even"] = wasmExports2["Z3_mk_fpa_round_nearest_ties_to_even"];
    _Z3_mk_fpa_rne = Module["_Z3_mk_fpa_rne"] = wasmExports2["Z3_mk_fpa_rne"];
    _Z3_mk_fpa_round_nearest_ties_to_away = Module["_Z3_mk_fpa_round_nearest_ties_to_away"] = wasmExports2["Z3_mk_fpa_round_nearest_ties_to_away"];
    _Z3_mk_fpa_rna = Module["_Z3_mk_fpa_rna"] = wasmExports2["Z3_mk_fpa_rna"];
    _Z3_mk_fpa_round_toward_positive = Module["_Z3_mk_fpa_round_toward_positive"] = wasmExports2["Z3_mk_fpa_round_toward_positive"];
    _Z3_mk_fpa_rtp = Module["_Z3_mk_fpa_rtp"] = wasmExports2["Z3_mk_fpa_rtp"];
    _Z3_mk_fpa_round_toward_negative = Module["_Z3_mk_fpa_round_toward_negative"] = wasmExports2["Z3_mk_fpa_round_toward_negative"];
    _Z3_mk_fpa_rtn = Module["_Z3_mk_fpa_rtn"] = wasmExports2["Z3_mk_fpa_rtn"];
    _Z3_mk_fpa_round_toward_zero = Module["_Z3_mk_fpa_round_toward_zero"] = wasmExports2["Z3_mk_fpa_round_toward_zero"];
    _Z3_mk_fpa_rtz = Module["_Z3_mk_fpa_rtz"] = wasmExports2["Z3_mk_fpa_rtz"];
    _Z3_mk_fpa_sort = Module["_Z3_mk_fpa_sort"] = wasmExports2["Z3_mk_fpa_sort"];
    _Z3_mk_fpa_sort_half = Module["_Z3_mk_fpa_sort_half"] = wasmExports2["Z3_mk_fpa_sort_half"];
    _Z3_mk_fpa_sort_16 = Module["_Z3_mk_fpa_sort_16"] = wasmExports2["Z3_mk_fpa_sort_16"];
    _Z3_mk_fpa_sort_single = Module["_Z3_mk_fpa_sort_single"] = wasmExports2["Z3_mk_fpa_sort_single"];
    _Z3_mk_fpa_sort_32 = Module["_Z3_mk_fpa_sort_32"] = wasmExports2["Z3_mk_fpa_sort_32"];
    _Z3_mk_fpa_sort_double = Module["_Z3_mk_fpa_sort_double"] = wasmExports2["Z3_mk_fpa_sort_double"];
    _Z3_mk_fpa_sort_64 = Module["_Z3_mk_fpa_sort_64"] = wasmExports2["Z3_mk_fpa_sort_64"];
    _Z3_mk_fpa_sort_quadruple = Module["_Z3_mk_fpa_sort_quadruple"] = wasmExports2["Z3_mk_fpa_sort_quadruple"];
    _Z3_mk_fpa_sort_128 = Module["_Z3_mk_fpa_sort_128"] = wasmExports2["Z3_mk_fpa_sort_128"];
    _Z3_mk_fpa_nan = Module["_Z3_mk_fpa_nan"] = wasmExports2["Z3_mk_fpa_nan"];
    _Z3_mk_fpa_inf = Module["_Z3_mk_fpa_inf"] = wasmExports2["Z3_mk_fpa_inf"];
    _Z3_mk_fpa_zero = Module["_Z3_mk_fpa_zero"] = wasmExports2["Z3_mk_fpa_zero"];
    _Z3_mk_fpa_fp = Module["_Z3_mk_fpa_fp"] = wasmExports2["Z3_mk_fpa_fp"];
    _Z3_mk_fpa_numeral_float = Module["_Z3_mk_fpa_numeral_float"] = wasmExports2["Z3_mk_fpa_numeral_float"];
    _Z3_mk_fpa_numeral_double = Module["_Z3_mk_fpa_numeral_double"] = wasmExports2["Z3_mk_fpa_numeral_double"];
    _Z3_mk_fpa_numeral_int = Module["_Z3_mk_fpa_numeral_int"] = wasmExports2["Z3_mk_fpa_numeral_int"];
    _Z3_mk_fpa_numeral_int_uint = Module["_Z3_mk_fpa_numeral_int_uint"] = wasmExports2["Z3_mk_fpa_numeral_int_uint"];
    _Z3_mk_fpa_numeral_int64_uint64 = Module["_Z3_mk_fpa_numeral_int64_uint64"] = wasmExports2["Z3_mk_fpa_numeral_int64_uint64"];
    _Z3_mk_fpa_abs = Module["_Z3_mk_fpa_abs"] = wasmExports2["Z3_mk_fpa_abs"];
    _Z3_mk_fpa_neg = Module["_Z3_mk_fpa_neg"] = wasmExports2["Z3_mk_fpa_neg"];
    _Z3_mk_fpa_add = Module["_Z3_mk_fpa_add"] = wasmExports2["Z3_mk_fpa_add"];
    _Z3_mk_fpa_sub = Module["_Z3_mk_fpa_sub"] = wasmExports2["Z3_mk_fpa_sub"];
    _Z3_mk_fpa_mul = Module["_Z3_mk_fpa_mul"] = wasmExports2["Z3_mk_fpa_mul"];
    _Z3_mk_fpa_div = Module["_Z3_mk_fpa_div"] = wasmExports2["Z3_mk_fpa_div"];
    _Z3_mk_fpa_fma = Module["_Z3_mk_fpa_fma"] = wasmExports2["Z3_mk_fpa_fma"];
    _Z3_mk_fpa_sqrt = Module["_Z3_mk_fpa_sqrt"] = wasmExports2["Z3_mk_fpa_sqrt"];
    _Z3_mk_fpa_rem = Module["_Z3_mk_fpa_rem"] = wasmExports2["Z3_mk_fpa_rem"];
    _Z3_mk_fpa_round_to_integral = Module["_Z3_mk_fpa_round_to_integral"] = wasmExports2["Z3_mk_fpa_round_to_integral"];
    _Z3_mk_fpa_min = Module["_Z3_mk_fpa_min"] = wasmExports2["Z3_mk_fpa_min"];
    _Z3_mk_fpa_max = Module["_Z3_mk_fpa_max"] = wasmExports2["Z3_mk_fpa_max"];
    _Z3_mk_fpa_leq = Module["_Z3_mk_fpa_leq"] = wasmExports2["Z3_mk_fpa_leq"];
    _Z3_mk_fpa_lt = Module["_Z3_mk_fpa_lt"] = wasmExports2["Z3_mk_fpa_lt"];
    _Z3_mk_fpa_geq = Module["_Z3_mk_fpa_geq"] = wasmExports2["Z3_mk_fpa_geq"];
    _Z3_mk_fpa_gt = Module["_Z3_mk_fpa_gt"] = wasmExports2["Z3_mk_fpa_gt"];
    _Z3_mk_fpa_eq = Module["_Z3_mk_fpa_eq"] = wasmExports2["Z3_mk_fpa_eq"];
    _Z3_mk_fpa_is_normal = Module["_Z3_mk_fpa_is_normal"] = wasmExports2["Z3_mk_fpa_is_normal"];
    _Z3_mk_fpa_is_subnormal = Module["_Z3_mk_fpa_is_subnormal"] = wasmExports2["Z3_mk_fpa_is_subnormal"];
    _Z3_mk_fpa_is_zero = Module["_Z3_mk_fpa_is_zero"] = wasmExports2["Z3_mk_fpa_is_zero"];
    _Z3_mk_fpa_is_infinite = Module["_Z3_mk_fpa_is_infinite"] = wasmExports2["Z3_mk_fpa_is_infinite"];
    _Z3_mk_fpa_is_nan = Module["_Z3_mk_fpa_is_nan"] = wasmExports2["Z3_mk_fpa_is_nan"];
    _Z3_mk_fpa_is_negative = Module["_Z3_mk_fpa_is_negative"] = wasmExports2["Z3_mk_fpa_is_negative"];
    _Z3_mk_fpa_is_positive = Module["_Z3_mk_fpa_is_positive"] = wasmExports2["Z3_mk_fpa_is_positive"];
    _Z3_mk_fpa_to_fp_bv = Module["_Z3_mk_fpa_to_fp_bv"] = wasmExports2["Z3_mk_fpa_to_fp_bv"];
    _Z3_mk_fpa_to_fp_float = Module["_Z3_mk_fpa_to_fp_float"] = wasmExports2["Z3_mk_fpa_to_fp_float"];
    _Z3_mk_fpa_to_fp_real = Module["_Z3_mk_fpa_to_fp_real"] = wasmExports2["Z3_mk_fpa_to_fp_real"];
    _Z3_mk_fpa_to_fp_signed = Module["_Z3_mk_fpa_to_fp_signed"] = wasmExports2["Z3_mk_fpa_to_fp_signed"];
    _Z3_mk_fpa_to_fp_unsigned = Module["_Z3_mk_fpa_to_fp_unsigned"] = wasmExports2["Z3_mk_fpa_to_fp_unsigned"];
    _Z3_mk_fpa_to_ubv = Module["_Z3_mk_fpa_to_ubv"] = wasmExports2["Z3_mk_fpa_to_ubv"];
    _Z3_mk_fpa_to_sbv = Module["_Z3_mk_fpa_to_sbv"] = wasmExports2["Z3_mk_fpa_to_sbv"];
    _Z3_mk_fpa_to_real = Module["_Z3_mk_fpa_to_real"] = wasmExports2["Z3_mk_fpa_to_real"];
    _Z3_fpa_get_ebits = Module["_Z3_fpa_get_ebits"] = wasmExports2["Z3_fpa_get_ebits"];
    _Z3_fpa_get_sbits = Module["_Z3_fpa_get_sbits"] = wasmExports2["Z3_fpa_get_sbits"];
    _Z3_fpa_get_numeral_sign = Module["_Z3_fpa_get_numeral_sign"] = wasmExports2["Z3_fpa_get_numeral_sign"];
    _Z3_fpa_get_numeral_sign_bv = Module["_Z3_fpa_get_numeral_sign_bv"] = wasmExports2["Z3_fpa_get_numeral_sign_bv"];
    _Z3_fpa_get_numeral_significand_bv = Module["_Z3_fpa_get_numeral_significand_bv"] = wasmExports2["Z3_fpa_get_numeral_significand_bv"];
    _Z3_fpa_get_numeral_significand_string = Module["_Z3_fpa_get_numeral_significand_string"] = wasmExports2["Z3_fpa_get_numeral_significand_string"];
    _Z3_fpa_get_numeral_significand_uint64 = Module["_Z3_fpa_get_numeral_significand_uint64"] = wasmExports2["Z3_fpa_get_numeral_significand_uint64"];
    _Z3_fpa_get_numeral_exponent_string = Module["_Z3_fpa_get_numeral_exponent_string"] = wasmExports2["Z3_fpa_get_numeral_exponent_string"];
    _Z3_fpa_get_numeral_exponent_int64 = Module["_Z3_fpa_get_numeral_exponent_int64"] = wasmExports2["Z3_fpa_get_numeral_exponent_int64"];
    _Z3_fpa_get_numeral_exponent_bv = Module["_Z3_fpa_get_numeral_exponent_bv"] = wasmExports2["Z3_fpa_get_numeral_exponent_bv"];
    _Z3_mk_fpa_to_ieee_bv = Module["_Z3_mk_fpa_to_ieee_bv"] = wasmExports2["Z3_mk_fpa_to_ieee_bv"];
    _Z3_mk_fpa_to_fp_int_real = Module["_Z3_mk_fpa_to_fp_int_real"] = wasmExports2["Z3_mk_fpa_to_fp_int_real"];
    _Z3_fpa_is_numeral = Module["_Z3_fpa_is_numeral"] = wasmExports2["Z3_fpa_is_numeral"];
    _Z3_fpa_is_numeral_nan = Module["_Z3_fpa_is_numeral_nan"] = wasmExports2["Z3_fpa_is_numeral_nan"];
    _Z3_fpa_is_numeral_inf = Module["_Z3_fpa_is_numeral_inf"] = wasmExports2["Z3_fpa_is_numeral_inf"];
    _Z3_fpa_is_numeral_zero = Module["_Z3_fpa_is_numeral_zero"] = wasmExports2["Z3_fpa_is_numeral_zero"];
    _Z3_fpa_is_numeral_normal = Module["_Z3_fpa_is_numeral_normal"] = wasmExports2["Z3_fpa_is_numeral_normal"];
    _Z3_fpa_is_numeral_subnormal = Module["_Z3_fpa_is_numeral_subnormal"] = wasmExports2["Z3_fpa_is_numeral_subnormal"];
    _Z3_fpa_is_numeral_positive = Module["_Z3_fpa_is_numeral_positive"] = wasmExports2["Z3_fpa_is_numeral_positive"];
    _Z3_fpa_is_numeral_negative = Module["_Z3_fpa_is_numeral_negative"] = wasmExports2["Z3_fpa_is_numeral_negative"];
    _Z3_mk_int_sort = Module["_Z3_mk_int_sort"] = wasmExports2["Z3_mk_int_sort"];
    _Z3_mk_real_sort = Module["_Z3_mk_real_sort"] = wasmExports2["Z3_mk_real_sort"];
    _Z3_mk_real_int64 = Module["_Z3_mk_real_int64"] = wasmExports2["Z3_mk_real_int64"];
    _Z3_mk_real = Module["_Z3_mk_real"] = wasmExports2["Z3_mk_real"];
    _Z3_mk_add = Module["_Z3_mk_add"] = wasmExports2["Z3_mk_add"];
    _Z3_mk_mul = Module["_Z3_mk_mul"] = wasmExports2["Z3_mk_mul"];
    _Z3_mk_power = Module["_Z3_mk_power"] = wasmExports2["Z3_mk_power"];
    _Z3_mk_mod = Module["_Z3_mk_mod"] = wasmExports2["Z3_mk_mod"];
    _Z3_mk_rem = Module["_Z3_mk_rem"] = wasmExports2["Z3_mk_rem"];
    _Z3_mk_div = Module["_Z3_mk_div"] = wasmExports2["Z3_mk_div"];
    _Z3_mk_lt = Module["_Z3_mk_lt"] = wasmExports2["Z3_mk_lt"];
    _Z3_mk_gt = Module["_Z3_mk_gt"] = wasmExports2["Z3_mk_gt"];
    _Z3_mk_le = Module["_Z3_mk_le"] = wasmExports2["Z3_mk_le"];
    _Z3_mk_ge = Module["_Z3_mk_ge"] = wasmExports2["Z3_mk_ge"];
    _Z3_mk_divides = Module["_Z3_mk_divides"] = wasmExports2["Z3_mk_divides"];
    _Z3_mk_abs = Module["_Z3_mk_abs"] = wasmExports2["Z3_mk_abs"];
    _Z3_mk_int2real = Module["_Z3_mk_int2real"] = wasmExports2["Z3_mk_int2real"];
    _Z3_mk_real2int = Module["_Z3_mk_real2int"] = wasmExports2["Z3_mk_real2int"];
    _Z3_mk_is_int = Module["_Z3_mk_is_int"] = wasmExports2["Z3_mk_is_int"];
    _Z3_mk_sub = Module["_Z3_mk_sub"] = wasmExports2["Z3_mk_sub"];
    _Z3_mk_unary_minus = Module["_Z3_mk_unary_minus"] = wasmExports2["Z3_mk_unary_minus"];
    _Z3_is_algebraic_number = Module["_Z3_is_algebraic_number"] = wasmExports2["Z3_is_algebraic_number"];
    _Z3_get_algebraic_number_lower = Module["_Z3_get_algebraic_number_lower"] = wasmExports2["Z3_get_algebraic_number_lower"];
    _Z3_get_algebraic_number_upper = Module["_Z3_get_algebraic_number_upper"] = wasmExports2["Z3_get_algebraic_number_upper"];
    _Z3_get_numerator = Module["_Z3_get_numerator"] = wasmExports2["Z3_get_numerator"];
    _Z3_get_denominator = Module["_Z3_get_denominator"] = wasmExports2["Z3_get_denominator"];
    _Z3_mk_tuple_sort = Module["_Z3_mk_tuple_sort"] = wasmExports2["Z3_mk_tuple_sort"];
    _Z3_mk_enumeration_sort = Module["_Z3_mk_enumeration_sort"] = wasmExports2["Z3_mk_enumeration_sort"];
    _Z3_mk_list_sort = Module["_Z3_mk_list_sort"] = wasmExports2["Z3_mk_list_sort"];
    _Z3_mk_constructor = Module["_Z3_mk_constructor"] = wasmExports2["Z3_mk_constructor"];
    _Z3_constructor_num_fields = Module["_Z3_constructor_num_fields"] = wasmExports2["Z3_constructor_num_fields"];
    _Z3_query_constructor = Module["_Z3_query_constructor"] = wasmExports2["Z3_query_constructor"];
    _Z3_del_constructor = Module["_Z3_del_constructor"] = wasmExports2["Z3_del_constructor"];
    _Z3_mk_datatype = Module["_Z3_mk_datatype"] = wasmExports2["Z3_mk_datatype"];
    _Z3_mk_polymorphic_datatype = Module["_Z3_mk_polymorphic_datatype"] = wasmExports2["Z3_mk_polymorphic_datatype"];
    _Z3_mk_constructor_list = Module["_Z3_mk_constructor_list"] = wasmExports2["Z3_mk_constructor_list"];
    _Z3_del_constructor_list = Module["_Z3_del_constructor_list"] = wasmExports2["Z3_del_constructor_list"];
    _Z3_mk_datatype_sort = Module["_Z3_mk_datatype_sort"] = wasmExports2["Z3_mk_datatype_sort"];
    _Z3_mk_datatypes = Module["_Z3_mk_datatypes"] = wasmExports2["Z3_mk_datatypes"];
    _Z3_is_recursive_datatype_sort = Module["_Z3_is_recursive_datatype_sort"] = wasmExports2["Z3_is_recursive_datatype_sort"];
    _Z3_get_datatype_sort_num_constructors = Module["_Z3_get_datatype_sort_num_constructors"] = wasmExports2["Z3_get_datatype_sort_num_constructors"];
    _Z3_get_datatype_sort_constructor = Module["_Z3_get_datatype_sort_constructor"] = wasmExports2["Z3_get_datatype_sort_constructor"];
    _Z3_get_datatype_sort_recognizer = Module["_Z3_get_datatype_sort_recognizer"] = wasmExports2["Z3_get_datatype_sort_recognizer"];
    _Z3_get_datatype_sort_constructor_accessor = Module["_Z3_get_datatype_sort_constructor_accessor"] = wasmExports2["Z3_get_datatype_sort_constructor_accessor"];
    _Z3_get_tuple_sort_mk_decl = Module["_Z3_get_tuple_sort_mk_decl"] = wasmExports2["Z3_get_tuple_sort_mk_decl"];
    _Z3_get_tuple_sort_num_fields = Module["_Z3_get_tuple_sort_num_fields"] = wasmExports2["Z3_get_tuple_sort_num_fields"];
    _Z3_get_tuple_sort_field_decl = Module["_Z3_get_tuple_sort_field_decl"] = wasmExports2["Z3_get_tuple_sort_field_decl"];
    _Z3_datatype_update_field = Module["_Z3_datatype_update_field"] = wasmExports2["Z3_datatype_update_field"];
    _Z3_mk_model = Module["_Z3_mk_model"] = wasmExports2["Z3_mk_model"];
    _Z3_model_inc_ref = Module["_Z3_model_inc_ref"] = wasmExports2["Z3_model_inc_ref"];
    _Z3_model_dec_ref = Module["_Z3_model_dec_ref"] = wasmExports2["Z3_model_dec_ref"];
    _Z3_model_get_const_interp = Module["_Z3_model_get_const_interp"] = wasmExports2["Z3_model_get_const_interp"];
    _Z3_model_has_interp = Module["_Z3_model_has_interp"] = wasmExports2["Z3_model_has_interp"];
    _Z3_model_get_func_interp = Module["_Z3_model_get_func_interp"] = wasmExports2["Z3_model_get_func_interp"];
    _Z3_model_get_num_consts = Module["_Z3_model_get_num_consts"] = wasmExports2["Z3_model_get_num_consts"];
    _Z3_model_get_const_decl = Module["_Z3_model_get_const_decl"] = wasmExports2["Z3_model_get_const_decl"];
    _Z3_model_get_num_funcs = Module["_Z3_model_get_num_funcs"] = wasmExports2["Z3_model_get_num_funcs"];
    _Z3_model_get_func_decl = Module["_Z3_model_get_func_decl"] = wasmExports2["Z3_model_get_func_decl"];
    _Z3_model_eval = Module["_Z3_model_eval"] = wasmExports2["Z3_model_eval"];
    _Z3_model_get_num_sorts = Module["_Z3_model_get_num_sorts"] = wasmExports2["Z3_model_get_num_sorts"];
    _Z3_model_get_sort = Module["_Z3_model_get_sort"] = wasmExports2["Z3_model_get_sort"];
    _Z3_model_get_sort_universe = Module["_Z3_model_get_sort_universe"] = wasmExports2["Z3_model_get_sort_universe"];
    _Z3_model_translate = Module["_Z3_model_translate"] = wasmExports2["Z3_model_translate"];
    _Z3_is_as_array = Module["_Z3_is_as_array"] = wasmExports2["Z3_is_as_array"];
    _Z3_get_as_array_func_decl = Module["_Z3_get_as_array_func_decl"] = wasmExports2["Z3_get_as_array_func_decl"];
    _Z3_add_func_interp = Module["_Z3_add_func_interp"] = wasmExports2["Z3_add_func_interp"];
    _Z3_add_const_interp = Module["_Z3_add_const_interp"] = wasmExports2["Z3_add_const_interp"];
    _Z3_func_interp_inc_ref = Module["_Z3_func_interp_inc_ref"] = wasmExports2["Z3_func_interp_inc_ref"];
    _Z3_func_interp_dec_ref = Module["_Z3_func_interp_dec_ref"] = wasmExports2["Z3_func_interp_dec_ref"];
    _Z3_func_interp_get_num_entries = Module["_Z3_func_interp_get_num_entries"] = wasmExports2["Z3_func_interp_get_num_entries"];
    _Z3_func_interp_get_entry = Module["_Z3_func_interp_get_entry"] = wasmExports2["Z3_func_interp_get_entry"];
    _Z3_func_interp_get_else = Module["_Z3_func_interp_get_else"] = wasmExports2["Z3_func_interp_get_else"];
    _Z3_func_interp_set_else = Module["_Z3_func_interp_set_else"] = wasmExports2["Z3_func_interp_set_else"];
    _Z3_func_interp_get_arity = Module["_Z3_func_interp_get_arity"] = wasmExports2["Z3_func_interp_get_arity"];
    _Z3_func_interp_add_entry = Module["_Z3_func_interp_add_entry"] = wasmExports2["Z3_func_interp_add_entry"];
    _Z3_func_entry_inc_ref = Module["_Z3_func_entry_inc_ref"] = wasmExports2["Z3_func_entry_inc_ref"];
    _Z3_func_entry_dec_ref = Module["_Z3_func_entry_dec_ref"] = wasmExports2["Z3_func_entry_dec_ref"];
    _Z3_func_entry_get_value = Module["_Z3_func_entry_get_value"] = wasmExports2["Z3_func_entry_get_value"];
    _Z3_func_entry_get_num_args = Module["_Z3_func_entry_get_num_args"] = wasmExports2["Z3_func_entry_get_num_args"];
    _Z3_func_entry_get_arg = Module["_Z3_func_entry_get_arg"] = wasmExports2["Z3_func_entry_get_arg"];
    _Z3_model_to_string = Module["_Z3_model_to_string"] = wasmExports2["Z3_model_to_string"];
    _Z3_mk_ast_map = Module["_Z3_mk_ast_map"] = wasmExports2["Z3_mk_ast_map"];
    _Z3_ast_map_inc_ref = Module["_Z3_ast_map_inc_ref"] = wasmExports2["Z3_ast_map_inc_ref"];
    _Z3_ast_map_dec_ref = Module["_Z3_ast_map_dec_ref"] = wasmExports2["Z3_ast_map_dec_ref"];
    _Z3_ast_map_contains = Module["_Z3_ast_map_contains"] = wasmExports2["Z3_ast_map_contains"];
    _Z3_ast_map_find = Module["_Z3_ast_map_find"] = wasmExports2["Z3_ast_map_find"];
    _Z3_ast_map_insert = Module["_Z3_ast_map_insert"] = wasmExports2["Z3_ast_map_insert"];
    _Z3_ast_map_reset = Module["_Z3_ast_map_reset"] = wasmExports2["Z3_ast_map_reset"];
    _Z3_ast_map_erase = Module["_Z3_ast_map_erase"] = wasmExports2["Z3_ast_map_erase"];
    _Z3_ast_map_size = Module["_Z3_ast_map_size"] = wasmExports2["Z3_ast_map_size"];
    _Z3_ast_map_keys = Module["_Z3_ast_map_keys"] = wasmExports2["Z3_ast_map_keys"];
    _Z3_ast_map_to_string = Module["_Z3_ast_map_to_string"] = wasmExports2["Z3_ast_map_to_string"];
    _Z3_get_relation_arity = Module["_Z3_get_relation_arity"] = wasmExports2["Z3_get_relation_arity"];
    _Z3_get_relation_column = Module["_Z3_get_relation_column"] = wasmExports2["Z3_get_relation_column"];
    _Z3_mk_finite_domain_sort = Module["_Z3_mk_finite_domain_sort"] = wasmExports2["Z3_mk_finite_domain_sort"];
    _Z3_get_finite_domain_sort_size = Module["_Z3_get_finite_domain_sort_size"] = wasmExports2["Z3_get_finite_domain_sort_size"];
    _Z3_mk_fixedpoint = Module["_Z3_mk_fixedpoint"] = wasmExports2["Z3_mk_fixedpoint"];
    _Z3_fixedpoint_inc_ref = Module["_Z3_fixedpoint_inc_ref"] = wasmExports2["Z3_fixedpoint_inc_ref"];
    _Z3_fixedpoint_dec_ref = Module["_Z3_fixedpoint_dec_ref"] = wasmExports2["Z3_fixedpoint_dec_ref"];
    _Z3_fixedpoint_assert = Module["_Z3_fixedpoint_assert"] = wasmExports2["Z3_fixedpoint_assert"];
    _Z3_fixedpoint_add_rule = Module["_Z3_fixedpoint_add_rule"] = wasmExports2["Z3_fixedpoint_add_rule"];
    _Z3_fixedpoint_add_fact = Module["_Z3_fixedpoint_add_fact"] = wasmExports2["Z3_fixedpoint_add_fact"];
    _Z3_fixedpoint_query = Module["_Z3_fixedpoint_query"] = wasmExports2["Z3_fixedpoint_query"];
    _Z3_fixedpoint_query_relations = Module["_Z3_fixedpoint_query_relations"] = wasmExports2["Z3_fixedpoint_query_relations"];
    _Z3_fixedpoint_get_answer = Module["_Z3_fixedpoint_get_answer"] = wasmExports2["Z3_fixedpoint_get_answer"];
    _Z3_fixedpoint_get_reason_unknown = Module["_Z3_fixedpoint_get_reason_unknown"] = wasmExports2["Z3_fixedpoint_get_reason_unknown"];
    _Z3_fixedpoint_to_string = Module["_Z3_fixedpoint_to_string"] = wasmExports2["Z3_fixedpoint_to_string"];
    _Z3_fixedpoint_from_string = Module["_Z3_fixedpoint_from_string"] = wasmExports2["Z3_fixedpoint_from_string"];
    _Z3_fixedpoint_from_file = Module["_Z3_fixedpoint_from_file"] = wasmExports2["Z3_fixedpoint_from_file"];
    _Z3_fixedpoint_get_statistics = Module["_Z3_fixedpoint_get_statistics"] = wasmExports2["Z3_fixedpoint_get_statistics"];
    _Z3_fixedpoint_register_relation = Module["_Z3_fixedpoint_register_relation"] = wasmExports2["Z3_fixedpoint_register_relation"];
    _Z3_fixedpoint_set_predicate_representation = Module["_Z3_fixedpoint_set_predicate_representation"] = wasmExports2["Z3_fixedpoint_set_predicate_representation"];
    _Z3_fixedpoint_get_rules = Module["_Z3_fixedpoint_get_rules"] = wasmExports2["Z3_fixedpoint_get_rules"];
    _Z3_fixedpoint_get_assertions = Module["_Z3_fixedpoint_get_assertions"] = wasmExports2["Z3_fixedpoint_get_assertions"];
    _Z3_fixedpoint_update_rule = Module["_Z3_fixedpoint_update_rule"] = wasmExports2["Z3_fixedpoint_update_rule"];
    _Z3_fixedpoint_get_num_levels = Module["_Z3_fixedpoint_get_num_levels"] = wasmExports2["Z3_fixedpoint_get_num_levels"];
    _Z3_fixedpoint_get_cover_delta = Module["_Z3_fixedpoint_get_cover_delta"] = wasmExports2["Z3_fixedpoint_get_cover_delta"];
    _Z3_fixedpoint_add_cover = Module["_Z3_fixedpoint_add_cover"] = wasmExports2["Z3_fixedpoint_add_cover"];
    _Z3_fixedpoint_get_help = Module["_Z3_fixedpoint_get_help"] = wasmExports2["Z3_fixedpoint_get_help"];
    _Z3_fixedpoint_get_param_descrs = Module["_Z3_fixedpoint_get_param_descrs"] = wasmExports2["Z3_fixedpoint_get_param_descrs"];
    _Z3_fixedpoint_set_params = Module["_Z3_fixedpoint_set_params"] = wasmExports2["Z3_fixedpoint_set_params"];
    _Z3_fixedpoint_query_from_lvl = Module["_Z3_fixedpoint_query_from_lvl"] = wasmExports2["Z3_fixedpoint_query_from_lvl"];
    _Z3_fixedpoint_get_ground_sat_answer = Module["_Z3_fixedpoint_get_ground_sat_answer"] = wasmExports2["Z3_fixedpoint_get_ground_sat_answer"];
    _Z3_fixedpoint_get_rules_along_trace = Module["_Z3_fixedpoint_get_rules_along_trace"] = wasmExports2["Z3_fixedpoint_get_rules_along_trace"];
    _Z3_fixedpoint_get_rule_names_along_trace = Module["_Z3_fixedpoint_get_rule_names_along_trace"] = wasmExports2["Z3_fixedpoint_get_rule_names_along_trace"];
    _Z3_fixedpoint_add_invariant = Module["_Z3_fixedpoint_add_invariant"] = wasmExports2["Z3_fixedpoint_add_invariant"];
    _Z3_fixedpoint_get_reachable = Module["_Z3_fixedpoint_get_reachable"] = wasmExports2["Z3_fixedpoint_get_reachable"];
    _Z3_mk_ast_vector = Module["_Z3_mk_ast_vector"] = wasmExports2["Z3_mk_ast_vector"];
    _Z3_ast_vector_inc_ref = Module["_Z3_ast_vector_inc_ref"] = wasmExports2["Z3_ast_vector_inc_ref"];
    _Z3_ast_vector_dec_ref = Module["_Z3_ast_vector_dec_ref"] = wasmExports2["Z3_ast_vector_dec_ref"];
    _Z3_ast_vector_size = Module["_Z3_ast_vector_size"] = wasmExports2["Z3_ast_vector_size"];
    _Z3_ast_vector_get = Module["_Z3_ast_vector_get"] = wasmExports2["Z3_ast_vector_get"];
    _Z3_ast_vector_set = Module["_Z3_ast_vector_set"] = wasmExports2["Z3_ast_vector_set"];
    _Z3_ast_vector_resize = Module["_Z3_ast_vector_resize"] = wasmExports2["Z3_ast_vector_resize"];
    _Z3_ast_vector_push = Module["_Z3_ast_vector_push"] = wasmExports2["Z3_ast_vector_push"];
    _Z3_ast_vector_translate = Module["_Z3_ast_vector_translate"] = wasmExports2["Z3_ast_vector_translate"];
    _Z3_ast_vector_to_string = Module["_Z3_ast_vector_to_string"] = wasmExports2["Z3_ast_vector_to_string"];
    _Z3_mk_optimize = Module["_Z3_mk_optimize"] = wasmExports2["Z3_mk_optimize"];
    _Z3_optimize_inc_ref = Module["_Z3_optimize_inc_ref"] = wasmExports2["Z3_optimize_inc_ref"];
    _Z3_optimize_dec_ref = Module["_Z3_optimize_dec_ref"] = wasmExports2["Z3_optimize_dec_ref"];
    _Z3_optimize_assert = Module["_Z3_optimize_assert"] = wasmExports2["Z3_optimize_assert"];
    _Z3_optimize_assert_and_track = Module["_Z3_optimize_assert_and_track"] = wasmExports2["Z3_optimize_assert_and_track"];
    _Z3_optimize_assert_soft = Module["_Z3_optimize_assert_soft"] = wasmExports2["Z3_optimize_assert_soft"];
    _Z3_optimize_maximize = Module["_Z3_optimize_maximize"] = wasmExports2["Z3_optimize_maximize"];
    _Z3_optimize_minimize = Module["_Z3_optimize_minimize"] = wasmExports2["Z3_optimize_minimize"];
    _Z3_optimize_push = Module["_Z3_optimize_push"] = wasmExports2["Z3_optimize_push"];
    _Z3_optimize_pop = Module["_Z3_optimize_pop"] = wasmExports2["Z3_optimize_pop"];
    _Z3_optimize_check = Module["_Z3_optimize_check"] = wasmExports2["Z3_optimize_check"];
    _Z3_optimize_get_unsat_core = Module["_Z3_optimize_get_unsat_core"] = wasmExports2["Z3_optimize_get_unsat_core"];
    _Z3_optimize_get_reason_unknown = Module["_Z3_optimize_get_reason_unknown"] = wasmExports2["Z3_optimize_get_reason_unknown"];
    _Z3_optimize_get_model = Module["_Z3_optimize_get_model"] = wasmExports2["Z3_optimize_get_model"];
    _Z3_optimize_set_params = Module["_Z3_optimize_set_params"] = wasmExports2["Z3_optimize_set_params"];
    _Z3_optimize_get_param_descrs = Module["_Z3_optimize_get_param_descrs"] = wasmExports2["Z3_optimize_get_param_descrs"];
    _Z3_optimize_get_lower = Module["_Z3_optimize_get_lower"] = wasmExports2["Z3_optimize_get_lower"];
    _Z3_optimize_get_upper = Module["_Z3_optimize_get_upper"] = wasmExports2["Z3_optimize_get_upper"];
    _Z3_optimize_get_lower_as_vector = Module["_Z3_optimize_get_lower_as_vector"] = wasmExports2["Z3_optimize_get_lower_as_vector"];
    _Z3_optimize_get_upper_as_vector = Module["_Z3_optimize_get_upper_as_vector"] = wasmExports2["Z3_optimize_get_upper_as_vector"];
    _Z3_optimize_to_string = Module["_Z3_optimize_to_string"] = wasmExports2["Z3_optimize_to_string"];
    _Z3_optimize_get_help = Module["_Z3_optimize_get_help"] = wasmExports2["Z3_optimize_get_help"];
    _Z3_optimize_get_statistics = Module["_Z3_optimize_get_statistics"] = wasmExports2["Z3_optimize_get_statistics"];
    _Z3_optimize_from_string = Module["_Z3_optimize_from_string"] = wasmExports2["Z3_optimize_from_string"];
    _Z3_optimize_from_file = Module["_Z3_optimize_from_file"] = wasmExports2["Z3_optimize_from_file"];
    _Z3_optimize_get_assertions = Module["_Z3_optimize_get_assertions"] = wasmExports2["Z3_optimize_get_assertions"];
    _Z3_optimize_get_objectives = Module["_Z3_optimize_get_objectives"] = wasmExports2["Z3_optimize_get_objectives"];
    _Z3_optimize_set_initial_value = Module["_Z3_optimize_set_initial_value"] = wasmExports2["Z3_optimize_set_initial_value"];
    _Z3_optimize_translate = Module["_Z3_optimize_translate"] = wasmExports2["Z3_optimize_translate"];
    _Z3_mk_linear_order = Module["_Z3_mk_linear_order"] = wasmExports2["Z3_mk_linear_order"];
    _Z3_mk_partial_order = Module["_Z3_mk_partial_order"] = wasmExports2["Z3_mk_partial_order"];
    _Z3_mk_piecewise_linear_order = Module["_Z3_mk_piecewise_linear_order"] = wasmExports2["Z3_mk_piecewise_linear_order"];
    _Z3_mk_tree_order = Module["_Z3_mk_tree_order"] = wasmExports2["Z3_mk_tree_order"];
    _Z3_mk_transitive_closure = Module["_Z3_mk_transitive_closure"] = wasmExports2["Z3_mk_transitive_closure"];
    _Z3_algebraic_is_value = Module["_Z3_algebraic_is_value"] = wasmExports2["Z3_algebraic_is_value"];
    _Z3_algebraic_is_pos = Module["_Z3_algebraic_is_pos"] = wasmExports2["Z3_algebraic_is_pos"];
    _Z3_algebraic_sign = Module["_Z3_algebraic_sign"] = wasmExports2["Z3_algebraic_sign"];
    _Z3_algebraic_is_neg = Module["_Z3_algebraic_is_neg"] = wasmExports2["Z3_algebraic_is_neg"];
    _Z3_algebraic_is_zero = Module["_Z3_algebraic_is_zero"] = wasmExports2["Z3_algebraic_is_zero"];
    _Z3_algebraic_add = Module["_Z3_algebraic_add"] = wasmExports2["Z3_algebraic_add"];
    _Z3_algebraic_sub = Module["_Z3_algebraic_sub"] = wasmExports2["Z3_algebraic_sub"];
    _Z3_algebraic_mul = Module["_Z3_algebraic_mul"] = wasmExports2["Z3_algebraic_mul"];
    _Z3_algebraic_div = Module["_Z3_algebraic_div"] = wasmExports2["Z3_algebraic_div"];
    _Z3_algebraic_root = Module["_Z3_algebraic_root"] = wasmExports2["Z3_algebraic_root"];
    _Z3_algebraic_power = Module["_Z3_algebraic_power"] = wasmExports2["Z3_algebraic_power"];
    _Z3_algebraic_lt = Module["_Z3_algebraic_lt"] = wasmExports2["Z3_algebraic_lt"];
    _Z3_algebraic_gt = Module["_Z3_algebraic_gt"] = wasmExports2["Z3_algebraic_gt"];
    _Z3_algebraic_le = Module["_Z3_algebraic_le"] = wasmExports2["Z3_algebraic_le"];
    _Z3_algebraic_ge = Module["_Z3_algebraic_ge"] = wasmExports2["Z3_algebraic_ge"];
    _Z3_algebraic_eq = Module["_Z3_algebraic_eq"] = wasmExports2["Z3_algebraic_eq"];
    _Z3_algebraic_neq = Module["_Z3_algebraic_neq"] = wasmExports2["Z3_algebraic_neq"];
    _Z3_algebraic_roots = Module["_Z3_algebraic_roots"] = wasmExports2["Z3_algebraic_roots"];
    _Z3_algebraic_eval = Module["_Z3_algebraic_eval"] = wasmExports2["Z3_algebraic_eval"];
    _Z3_algebraic_get_poly = Module["_Z3_algebraic_get_poly"] = wasmExports2["Z3_algebraic_get_poly"];
    _Z3_algebraic_get_i = Module["_Z3_algebraic_get_i"] = wasmExports2["Z3_algebraic_get_i"];
    _Z3_mk_tactic = Module["_Z3_mk_tactic"] = wasmExports2["Z3_mk_tactic"];
    _Z3_tactic_inc_ref = Module["_Z3_tactic_inc_ref"] = wasmExports2["Z3_tactic_inc_ref"];
    _Z3_tactic_dec_ref = Module["_Z3_tactic_dec_ref"] = wasmExports2["Z3_tactic_dec_ref"];
    _Z3_mk_probe = Module["_Z3_mk_probe"] = wasmExports2["Z3_mk_probe"];
    _Z3_probe_inc_ref = Module["_Z3_probe_inc_ref"] = wasmExports2["Z3_probe_inc_ref"];
    _Z3_probe_dec_ref = Module["_Z3_probe_dec_ref"] = wasmExports2["Z3_probe_dec_ref"];
    _Z3_tactic_and_then = Module["_Z3_tactic_and_then"] = wasmExports2["Z3_tactic_and_then"];
    _Z3_tactic_or_else = Module["_Z3_tactic_or_else"] = wasmExports2["Z3_tactic_or_else"];
    _Z3_tactic_par_or = Module["_Z3_tactic_par_or"] = wasmExports2["Z3_tactic_par_or"];
    _Z3_tactic_par_and_then = Module["_Z3_tactic_par_and_then"] = wasmExports2["Z3_tactic_par_and_then"];
    _Z3_tactic_try_for = Module["_Z3_tactic_try_for"] = wasmExports2["Z3_tactic_try_for"];
    _Z3_tactic_when = Module["_Z3_tactic_when"] = wasmExports2["Z3_tactic_when"];
    _Z3_tactic_cond = Module["_Z3_tactic_cond"] = wasmExports2["Z3_tactic_cond"];
    _Z3_tactic_repeat = Module["_Z3_tactic_repeat"] = wasmExports2["Z3_tactic_repeat"];
    _Z3_tactic_skip = Module["_Z3_tactic_skip"] = wasmExports2["Z3_tactic_skip"];
    _Z3_tactic_fail = Module["_Z3_tactic_fail"] = wasmExports2["Z3_tactic_fail"];
    _Z3_tactic_fail_if = Module["_Z3_tactic_fail_if"] = wasmExports2["Z3_tactic_fail_if"];
    _Z3_tactic_fail_if_not_decided = Module["_Z3_tactic_fail_if_not_decided"] = wasmExports2["Z3_tactic_fail_if_not_decided"];
    _Z3_tactic_using_params = Module["_Z3_tactic_using_params"] = wasmExports2["Z3_tactic_using_params"];
    _Z3_probe_const = Module["_Z3_probe_const"] = wasmExports2["Z3_probe_const"];
    _Z3_probe_lt = Module["_Z3_probe_lt"] = wasmExports2["Z3_probe_lt"];
    _Z3_probe_gt = Module["_Z3_probe_gt"] = wasmExports2["Z3_probe_gt"];
    _Z3_probe_le = Module["_Z3_probe_le"] = wasmExports2["Z3_probe_le"];
    _Z3_probe_ge = Module["_Z3_probe_ge"] = wasmExports2["Z3_probe_ge"];
    _Z3_probe_eq = Module["_Z3_probe_eq"] = wasmExports2["Z3_probe_eq"];
    _Z3_probe_and = Module["_Z3_probe_and"] = wasmExports2["Z3_probe_and"];
    _Z3_probe_or = Module["_Z3_probe_or"] = wasmExports2["Z3_probe_or"];
    _Z3_probe_not = Module["_Z3_probe_not"] = wasmExports2["Z3_probe_not"];
    _Z3_get_num_tactics = Module["_Z3_get_num_tactics"] = wasmExports2["Z3_get_num_tactics"];
    _Z3_get_tactic_name = Module["_Z3_get_tactic_name"] = wasmExports2["Z3_get_tactic_name"];
    _Z3_get_num_probes = Module["_Z3_get_num_probes"] = wasmExports2["Z3_get_num_probes"];
    _Z3_get_probe_name = Module["_Z3_get_probe_name"] = wasmExports2["Z3_get_probe_name"];
    _Z3_tactic_get_help = Module["_Z3_tactic_get_help"] = wasmExports2["Z3_tactic_get_help"];
    _Z3_tactic_get_param_descrs = Module["_Z3_tactic_get_param_descrs"] = wasmExports2["Z3_tactic_get_param_descrs"];
    _Z3_tactic_get_descr = Module["_Z3_tactic_get_descr"] = wasmExports2["Z3_tactic_get_descr"];
    _Z3_probe_get_descr = Module["_Z3_probe_get_descr"] = wasmExports2["Z3_probe_get_descr"];
    _Z3_probe_apply = Module["_Z3_probe_apply"] = wasmExports2["Z3_probe_apply"];
    _Z3_tactic_apply = Module["_Z3_tactic_apply"] = wasmExports2["Z3_tactic_apply"];
    _Z3_tactic_apply_ex = Module["_Z3_tactic_apply_ex"] = wasmExports2["Z3_tactic_apply_ex"];
    _Z3_apply_result_inc_ref = Module["_Z3_apply_result_inc_ref"] = wasmExports2["Z3_apply_result_inc_ref"];
    _Z3_apply_result_dec_ref = Module["_Z3_apply_result_dec_ref"] = wasmExports2["Z3_apply_result_dec_ref"];
    _Z3_apply_result_to_string = Module["_Z3_apply_result_to_string"] = wasmExports2["Z3_apply_result_to_string"];
    _Z3_apply_result_get_num_subgoals = Module["_Z3_apply_result_get_num_subgoals"] = wasmExports2["Z3_apply_result_get_num_subgoals"];
    _Z3_apply_result_get_subgoal = Module["_Z3_apply_result_get_subgoal"] = wasmExports2["Z3_apply_result_get_subgoal"];
    _Z3_mk_simplifier = Module["_Z3_mk_simplifier"] = wasmExports2["Z3_mk_simplifier"];
    _Z3_simplifier_inc_ref = Module["_Z3_simplifier_inc_ref"] = wasmExports2["Z3_simplifier_inc_ref"];
    _Z3_simplifier_dec_ref = Module["_Z3_simplifier_dec_ref"] = wasmExports2["Z3_simplifier_dec_ref"];
    _Z3_get_num_simplifiers = Module["_Z3_get_num_simplifiers"] = wasmExports2["Z3_get_num_simplifiers"];
    _Z3_get_simplifier_name = Module["_Z3_get_simplifier_name"] = wasmExports2["Z3_get_simplifier_name"];
    _Z3_simplifier_and_then = Module["_Z3_simplifier_and_then"] = wasmExports2["Z3_simplifier_and_then"];
    _Z3_simplifier_using_params = Module["_Z3_simplifier_using_params"] = wasmExports2["Z3_simplifier_using_params"];
    _Z3_simplifier_get_help = Module["_Z3_simplifier_get_help"] = wasmExports2["Z3_simplifier_get_help"];
    _Z3_simplifier_get_param_descrs = Module["_Z3_simplifier_get_param_descrs"] = wasmExports2["Z3_simplifier_get_param_descrs"];
    _Z3_simplifier_get_descr = Module["_Z3_simplifier_get_descr"] = wasmExports2["Z3_simplifier_get_descr"];
    _Z3_mk_int_symbol = Module["_Z3_mk_int_symbol"] = wasmExports2["Z3_mk_int_symbol"];
    _Z3_mk_string_symbol = Module["_Z3_mk_string_symbol"] = wasmExports2["Z3_mk_string_symbol"];
    _Z3_is_eq_sort = Module["_Z3_is_eq_sort"] = wasmExports2["Z3_is_eq_sort"];
    _Z3_mk_uninterpreted_sort = Module["_Z3_mk_uninterpreted_sort"] = wasmExports2["Z3_mk_uninterpreted_sort"];
    _Z3_mk_type_variable = Module["_Z3_mk_type_variable"] = wasmExports2["Z3_mk_type_variable"];
    _Z3_is_eq_ast = Module["_Z3_is_eq_ast"] = wasmExports2["Z3_is_eq_ast"];
    _Z3_is_eq_func_decl = Module["_Z3_is_eq_func_decl"] = wasmExports2["Z3_is_eq_func_decl"];
    _Z3_mk_func_decl = Module["_Z3_mk_func_decl"] = wasmExports2["Z3_mk_func_decl"];
    _Z3_mk_rec_func_decl = Module["_Z3_mk_rec_func_decl"] = wasmExports2["Z3_mk_rec_func_decl"];
    _Z3_add_rec_def = Module["_Z3_add_rec_def"] = wasmExports2["Z3_add_rec_def"];
    _Z3_mk_app = Module["_Z3_mk_app"] = wasmExports2["Z3_mk_app"];
    _Z3_mk_const = Module["_Z3_mk_const"] = wasmExports2["Z3_mk_const"];
    _Z3_mk_fresh_func_decl = Module["_Z3_mk_fresh_func_decl"] = wasmExports2["Z3_mk_fresh_func_decl"];
    _Z3_mk_fresh_const = Module["_Z3_mk_fresh_const"] = wasmExports2["Z3_mk_fresh_const"];
    _Z3_mk_true = Module["_Z3_mk_true"] = wasmExports2["Z3_mk_true"];
    _Z3_mk_false = Module["_Z3_mk_false"] = wasmExports2["Z3_mk_false"];
    _Z3_mk_not = Module["_Z3_mk_not"] = wasmExports2["Z3_mk_not"];
    _Z3_mk_eq = Module["_Z3_mk_eq"] = wasmExports2["Z3_mk_eq"];
    _Z3_mk_distinct = Module["_Z3_mk_distinct"] = wasmExports2["Z3_mk_distinct"];
    _Z3_mk_iff = Module["_Z3_mk_iff"] = wasmExports2["Z3_mk_iff"];
    _Z3_mk_implies = Module["_Z3_mk_implies"] = wasmExports2["Z3_mk_implies"];
    _Z3_mk_xor = Module["_Z3_mk_xor"] = wasmExports2["Z3_mk_xor"];
    _Z3_mk_and = Module["_Z3_mk_and"] = wasmExports2["Z3_mk_and"];
    _Z3_mk_or = Module["_Z3_mk_or"] = wasmExports2["Z3_mk_or"];
    _Z3_mk_ite = Module["_Z3_mk_ite"] = wasmExports2["Z3_mk_ite"];
    _Z3_mk_bool_sort = Module["_Z3_mk_bool_sort"] = wasmExports2["Z3_mk_bool_sort"];
    _Z3_app_to_ast = Module["_Z3_app_to_ast"] = wasmExports2["Z3_app_to_ast"];
    _Z3_sort_to_ast = Module["_Z3_sort_to_ast"] = wasmExports2["Z3_sort_to_ast"];
    _Z3_func_decl_to_ast = Module["_Z3_func_decl_to_ast"] = wasmExports2["Z3_func_decl_to_ast"];
    _Z3_get_ast_id = Module["_Z3_get_ast_id"] = wasmExports2["Z3_get_ast_id"];
    _Z3_get_func_decl_id = Module["_Z3_get_func_decl_id"] = wasmExports2["Z3_get_func_decl_id"];
    _Z3_get_sort_id = Module["_Z3_get_sort_id"] = wasmExports2["Z3_get_sort_id"];
    _Z3_is_well_sorted = Module["_Z3_is_well_sorted"] = wasmExports2["Z3_is_well_sorted"];
    _Z3_get_symbol_kind = Module["_Z3_get_symbol_kind"] = wasmExports2["Z3_get_symbol_kind"];
    _Z3_get_symbol_int = Module["_Z3_get_symbol_int"] = wasmExports2["Z3_get_symbol_int"];
    _Z3_get_symbol_string = Module["_Z3_get_symbol_string"] = wasmExports2["Z3_get_symbol_string"];
    _Z3_get_ast_kind = Module["_Z3_get_ast_kind"] = wasmExports2["Z3_get_ast_kind"];
    _Z3_get_ast_hash = Module["_Z3_get_ast_hash"] = wasmExports2["Z3_get_ast_hash"];
    _Z3_is_app = Module["_Z3_is_app"] = wasmExports2["Z3_is_app"];
    _Z3_to_app = Module["_Z3_to_app"] = wasmExports2["Z3_to_app"];
    _Z3_is_ground = Module["_Z3_is_ground"] = wasmExports2["Z3_is_ground"];
    _Z3_get_depth = Module["_Z3_get_depth"] = wasmExports2["Z3_get_depth"];
    _Z3_to_func_decl = Module["_Z3_to_func_decl"] = wasmExports2["Z3_to_func_decl"];
    _Z3_get_app_decl = Module["_Z3_get_app_decl"] = wasmExports2["Z3_get_app_decl"];
    _Z3_get_app_num_args = Module["_Z3_get_app_num_args"] = wasmExports2["Z3_get_app_num_args"];
    _Z3_get_app_arg = Module["_Z3_get_app_arg"] = wasmExports2["Z3_get_app_arg"];
    _Z3_get_decl_name = Module["_Z3_get_decl_name"] = wasmExports2["Z3_get_decl_name"];
    _Z3_get_decl_num_parameters = Module["_Z3_get_decl_num_parameters"] = wasmExports2["Z3_get_decl_num_parameters"];
    _Z3_get_decl_parameter_kind = Module["_Z3_get_decl_parameter_kind"] = wasmExports2["Z3_get_decl_parameter_kind"];
    _Z3_get_decl_int_parameter = Module["_Z3_get_decl_int_parameter"] = wasmExports2["Z3_get_decl_int_parameter"];
    _Z3_get_decl_double_parameter = Module["_Z3_get_decl_double_parameter"] = wasmExports2["Z3_get_decl_double_parameter"];
    _Z3_get_decl_symbol_parameter = Module["_Z3_get_decl_symbol_parameter"] = wasmExports2["Z3_get_decl_symbol_parameter"];
    _Z3_get_decl_sort_parameter = Module["_Z3_get_decl_sort_parameter"] = wasmExports2["Z3_get_decl_sort_parameter"];
    _Z3_get_decl_ast_parameter = Module["_Z3_get_decl_ast_parameter"] = wasmExports2["Z3_get_decl_ast_parameter"];
    _Z3_get_decl_func_decl_parameter = Module["_Z3_get_decl_func_decl_parameter"] = wasmExports2["Z3_get_decl_func_decl_parameter"];
    _Z3_get_decl_rational_parameter = Module["_Z3_get_decl_rational_parameter"] = wasmExports2["Z3_get_decl_rational_parameter"];
    _Z3_get_sort_name = Module["_Z3_get_sort_name"] = wasmExports2["Z3_get_sort_name"];
    _Z3_get_sort = Module["_Z3_get_sort"] = wasmExports2["Z3_get_sort"];
    _Z3_get_arity = Module["_Z3_get_arity"] = wasmExports2["Z3_get_arity"];
    _Z3_get_domain_size = Module["_Z3_get_domain_size"] = wasmExports2["Z3_get_domain_size"];
    _Z3_get_domain = Module["_Z3_get_domain"] = wasmExports2["Z3_get_domain"];
    _Z3_get_range = Module["_Z3_get_range"] = wasmExports2["Z3_get_range"];
    _Z3_get_sort_kind = Module["_Z3_get_sort_kind"] = wasmExports2["Z3_get_sort_kind"];
    _Z3_get_bool_value = Module["_Z3_get_bool_value"] = wasmExports2["Z3_get_bool_value"];
    _Z3_simplify = Module["_Z3_simplify"] = wasmExports2["Z3_simplify"];
    _Z3_simplify_ex = Module["_Z3_simplify_ex"] = wasmExports2["Z3_simplify_ex"];
    _Z3_simplify_get_help = Module["_Z3_simplify_get_help"] = wasmExports2["Z3_simplify_get_help"];
    _Z3_simplify_get_param_descrs = Module["_Z3_simplify_get_param_descrs"] = wasmExports2["Z3_simplify_get_param_descrs"];
    _Z3_update_term = Module["_Z3_update_term"] = wasmExports2["Z3_update_term"];
    _Z3_substitute = Module["_Z3_substitute"] = wasmExports2["Z3_substitute"];
    _Z3_substitute_funs = Module["_Z3_substitute_funs"] = wasmExports2["Z3_substitute_funs"];
    _Z3_substitute_vars = Module["_Z3_substitute_vars"] = wasmExports2["Z3_substitute_vars"];
    _Z3_ast_to_string = Module["_Z3_ast_to_string"] = wasmExports2["Z3_ast_to_string"];
    _Z3_sort_to_string = Module["_Z3_sort_to_string"] = wasmExports2["Z3_sort_to_string"];
    _Z3_func_decl_to_string = Module["_Z3_func_decl_to_string"] = wasmExports2["Z3_func_decl_to_string"];
    _Z3_benchmark_to_smtlib_string = Module["_Z3_benchmark_to_smtlib_string"] = wasmExports2["Z3_benchmark_to_smtlib_string"];
    _Z3_get_decl_kind = Module["_Z3_get_decl_kind"] = wasmExports2["Z3_get_decl_kind"];
    _Z3_get_index_value = Module["_Z3_get_index_value"] = wasmExports2["Z3_get_index_value"];
    _Z3_translate = Module["_Z3_translate"] = wasmExports2["Z3_translate"];
    _Z3_mk_context = Module["_Z3_mk_context"] = wasmExports2["Z3_mk_context"];
    _Z3_mk_context_rc = Module["_Z3_mk_context_rc"] = wasmExports2["Z3_mk_context_rc"];
    _Z3_del_context = Module["_Z3_del_context"] = wasmExports2["Z3_del_context"];
    _Z3_interrupt = Module["_Z3_interrupt"] = wasmExports2["Z3_interrupt"];
    _Z3_enable_concurrent_dec_ref = Module["_Z3_enable_concurrent_dec_ref"] = wasmExports2["Z3_enable_concurrent_dec_ref"];
    _Z3_toggle_warning_messages = Module["_Z3_toggle_warning_messages"] = wasmExports2["Z3_toggle_warning_messages"];
    _Z3_inc_ref = Module["_Z3_inc_ref"] = wasmExports2["Z3_inc_ref"];
    _Z3_dec_ref = Module["_Z3_dec_ref"] = wasmExports2["Z3_dec_ref"];
    _Z3_get_version = Module["_Z3_get_version"] = wasmExports2["Z3_get_version"];
    _Z3_get_full_version = Module["_Z3_get_full_version"] = wasmExports2["Z3_get_full_version"];
    _Z3_enable_trace = Module["_Z3_enable_trace"] = wasmExports2["Z3_enable_trace"];
    _Z3_disable_trace = Module["_Z3_disable_trace"] = wasmExports2["Z3_disable_trace"];
    _Z3_reset_memory = Module["_Z3_reset_memory"] = wasmExports2["Z3_reset_memory"];
    _Z3_finalize_memory = Module["_Z3_finalize_memory"] = wasmExports2["Z3_finalize_memory"];
    _Z3_get_error_code = Module["_Z3_get_error_code"] = wasmExports2["Z3_get_error_code"];
    _Z3_set_error = Module["_Z3_set_error"] = wasmExports2["Z3_set_error"];
    _Z3_set_ast_print_mode = Module["_Z3_set_ast_print_mode"] = wasmExports2["Z3_set_ast_print_mode"];
    _Z3_qe_model_project = Module["_Z3_qe_model_project"] = wasmExports2["Z3_qe_model_project"];
    _Z3_qe_model_project_skolem = Module["_Z3_qe_model_project_skolem"] = wasmExports2["Z3_qe_model_project_skolem"];
    _Z3_qe_model_project_with_witness = Module["_Z3_qe_model_project_with_witness"] = wasmExports2["Z3_qe_model_project_with_witness"];
    _Z3_model_extrapolate = Module["_Z3_model_extrapolate"] = wasmExports2["Z3_model_extrapolate"];
    _Z3_qe_lite = Module["_Z3_qe_lite"] = wasmExports2["Z3_qe_lite"];
    _Z3_open_log = Module["_Z3_open_log"] = wasmExports2["Z3_open_log"];
    _Z3_append_log = Module["_Z3_append_log"] = wasmExports2["Z3_append_log"];
    _Z3_close_log = Module["_Z3_close_log"] = wasmExports2["Z3_close_log"];
    _Z3_mk_atmost = Module["_Z3_mk_atmost"] = wasmExports2["Z3_mk_atmost"];
    _Z3_mk_atleast = Module["_Z3_mk_atleast"] = wasmExports2["Z3_mk_atleast"];
    _Z3_mk_pble = Module["_Z3_mk_pble"] = wasmExports2["Z3_mk_pble"];
    _Z3_mk_pbge = Module["_Z3_mk_pbge"] = wasmExports2["Z3_mk_pbge"];
    _Z3_mk_pbeq = Module["_Z3_mk_pbeq"] = wasmExports2["Z3_mk_pbeq"];
    _Z3_polynomial_subresultants = Module["_Z3_polynomial_subresultants"] = wasmExports2["Z3_polynomial_subresultants"];
    _Z3_mk_goal = Module["_Z3_mk_goal"] = wasmExports2["Z3_mk_goal"];
    _Z3_goal_inc_ref = Module["_Z3_goal_inc_ref"] = wasmExports2["Z3_goal_inc_ref"];
    _Z3_goal_dec_ref = Module["_Z3_goal_dec_ref"] = wasmExports2["Z3_goal_dec_ref"];
    _Z3_goal_precision = Module["_Z3_goal_precision"] = wasmExports2["Z3_goal_precision"];
    _Z3_goal_assert = Module["_Z3_goal_assert"] = wasmExports2["Z3_goal_assert"];
    _Z3_goal_inconsistent = Module["_Z3_goal_inconsistent"] = wasmExports2["Z3_goal_inconsistent"];
    _Z3_goal_depth = Module["_Z3_goal_depth"] = wasmExports2["Z3_goal_depth"];
    _Z3_goal_reset = Module["_Z3_goal_reset"] = wasmExports2["Z3_goal_reset"];
    _Z3_goal_size = Module["_Z3_goal_size"] = wasmExports2["Z3_goal_size"];
    _Z3_goal_formula = Module["_Z3_goal_formula"] = wasmExports2["Z3_goal_formula"];
    _Z3_goal_num_exprs = Module["_Z3_goal_num_exprs"] = wasmExports2["Z3_goal_num_exprs"];
    _Z3_goal_is_decided_sat = Module["_Z3_goal_is_decided_sat"] = wasmExports2["Z3_goal_is_decided_sat"];
    _Z3_goal_is_decided_unsat = Module["_Z3_goal_is_decided_unsat"] = wasmExports2["Z3_goal_is_decided_unsat"];
    _Z3_goal_convert_model = Module["_Z3_goal_convert_model"] = wasmExports2["Z3_goal_convert_model"];
    _Z3_goal_translate = Module["_Z3_goal_translate"] = wasmExports2["Z3_goal_translate"];
    _Z3_goal_to_string = Module["_Z3_goal_to_string"] = wasmExports2["Z3_goal_to_string"];
    _Z3_goal_to_dimacs_string = Module["_Z3_goal_to_dimacs_string"] = wasmExports2["Z3_goal_to_dimacs_string"];
    _Z3_rcf_del = Module["_Z3_rcf_del"] = wasmExports2["Z3_rcf_del"];
    _Z3_rcf_mk_rational = Module["_Z3_rcf_mk_rational"] = wasmExports2["Z3_rcf_mk_rational"];
    _Z3_rcf_mk_small_int = Module["_Z3_rcf_mk_small_int"] = wasmExports2["Z3_rcf_mk_small_int"];
    _Z3_rcf_mk_pi = Module["_Z3_rcf_mk_pi"] = wasmExports2["Z3_rcf_mk_pi"];
    _Z3_rcf_mk_e = Module["_Z3_rcf_mk_e"] = wasmExports2["Z3_rcf_mk_e"];
    _Z3_rcf_mk_infinitesimal = Module["_Z3_rcf_mk_infinitesimal"] = wasmExports2["Z3_rcf_mk_infinitesimal"];
    _Z3_rcf_mk_roots = Module["_Z3_rcf_mk_roots"] = wasmExports2["Z3_rcf_mk_roots"];
    _Z3_rcf_add = Module["_Z3_rcf_add"] = wasmExports2["Z3_rcf_add"];
    _Z3_rcf_sub = Module["_Z3_rcf_sub"] = wasmExports2["Z3_rcf_sub"];
    _Z3_rcf_mul = Module["_Z3_rcf_mul"] = wasmExports2["Z3_rcf_mul"];
    _Z3_rcf_div = Module["_Z3_rcf_div"] = wasmExports2["Z3_rcf_div"];
    _Z3_rcf_neg = Module["_Z3_rcf_neg"] = wasmExports2["Z3_rcf_neg"];
    _Z3_rcf_inv = Module["_Z3_rcf_inv"] = wasmExports2["Z3_rcf_inv"];
    _Z3_rcf_power = Module["_Z3_rcf_power"] = wasmExports2["Z3_rcf_power"];
    _Z3_rcf_lt = Module["_Z3_rcf_lt"] = wasmExports2["Z3_rcf_lt"];
    _Z3_rcf_gt = Module["_Z3_rcf_gt"] = wasmExports2["Z3_rcf_gt"];
    _Z3_rcf_le = Module["_Z3_rcf_le"] = wasmExports2["Z3_rcf_le"];
    _Z3_rcf_ge = Module["_Z3_rcf_ge"] = wasmExports2["Z3_rcf_ge"];
    _Z3_rcf_eq = Module["_Z3_rcf_eq"] = wasmExports2["Z3_rcf_eq"];
    _Z3_rcf_neq = Module["_Z3_rcf_neq"] = wasmExports2["Z3_rcf_neq"];
    _Z3_rcf_num_to_string = Module["_Z3_rcf_num_to_string"] = wasmExports2["Z3_rcf_num_to_string"];
    _Z3_rcf_num_to_decimal_string = Module["_Z3_rcf_num_to_decimal_string"] = wasmExports2["Z3_rcf_num_to_decimal_string"];
    _Z3_rcf_get_numerator_denominator = Module["_Z3_rcf_get_numerator_denominator"] = wasmExports2["Z3_rcf_get_numerator_denominator"];
    _Z3_rcf_is_rational = Module["_Z3_rcf_is_rational"] = wasmExports2["Z3_rcf_is_rational"];
    _Z3_rcf_is_algebraic = Module["_Z3_rcf_is_algebraic"] = wasmExports2["Z3_rcf_is_algebraic"];
    _Z3_rcf_is_infinitesimal = Module["_Z3_rcf_is_infinitesimal"] = wasmExports2["Z3_rcf_is_infinitesimal"];
    _Z3_rcf_is_transcendental = Module["_Z3_rcf_is_transcendental"] = wasmExports2["Z3_rcf_is_transcendental"];
    _Z3_rcf_extension_index = Module["_Z3_rcf_extension_index"] = wasmExports2["Z3_rcf_extension_index"];
    _Z3_rcf_transcendental_name = Module["_Z3_rcf_transcendental_name"] = wasmExports2["Z3_rcf_transcendental_name"];
    _Z3_rcf_infinitesimal_name = Module["_Z3_rcf_infinitesimal_name"] = wasmExports2["Z3_rcf_infinitesimal_name"];
    _Z3_rcf_num_coefficients = Module["_Z3_rcf_num_coefficients"] = wasmExports2["Z3_rcf_num_coefficients"];
    _Z3_rcf_coefficient = Module["_Z3_rcf_coefficient"] = wasmExports2["Z3_rcf_coefficient"];
    _Z3_rcf_interval = Module["_Z3_rcf_interval"] = wasmExports2["Z3_rcf_interval"];
    _Z3_rcf_num_sign_conditions = Module["_Z3_rcf_num_sign_conditions"] = wasmExports2["Z3_rcf_num_sign_conditions"];
    _Z3_rcf_sign_condition_sign = Module["_Z3_rcf_sign_condition_sign"] = wasmExports2["Z3_rcf_sign_condition_sign"];
    _Z3_rcf_num_sign_condition_coefficients = Module["_Z3_rcf_num_sign_condition_coefficients"] = wasmExports2["Z3_rcf_num_sign_condition_coefficients"];
    _Z3_rcf_sign_condition_coefficient = Module["_Z3_rcf_sign_condition_coefficient"] = wasmExports2["Z3_rcf_sign_condition_coefficient"];
    _Z3_mk_seq_sort = Module["_Z3_mk_seq_sort"] = wasmExports2["Z3_mk_seq_sort"];
    _Z3_mk_re_sort = Module["_Z3_mk_re_sort"] = wasmExports2["Z3_mk_re_sort"];
    _Z3_mk_string = Module["_Z3_mk_string"] = wasmExports2["Z3_mk_string"];
    _Z3_mk_lstring = Module["_Z3_mk_lstring"] = wasmExports2["Z3_mk_lstring"];
    _Z3_mk_u32string = Module["_Z3_mk_u32string"] = wasmExports2["Z3_mk_u32string"];
    _Z3_mk_char = Module["_Z3_mk_char"] = wasmExports2["Z3_mk_char"];
    _Z3_mk_string_sort = Module["_Z3_mk_string_sort"] = wasmExports2["Z3_mk_string_sort"];
    _Z3_mk_char_sort = Module["_Z3_mk_char_sort"] = wasmExports2["Z3_mk_char_sort"];
    _Z3_is_seq_sort = Module["_Z3_is_seq_sort"] = wasmExports2["Z3_is_seq_sort"];
    _Z3_is_re_sort = Module["_Z3_is_re_sort"] = wasmExports2["Z3_is_re_sort"];
    _Z3_get_seq_sort_basis = Module["_Z3_get_seq_sort_basis"] = wasmExports2["Z3_get_seq_sort_basis"];
    _Z3_get_re_sort_basis = Module["_Z3_get_re_sort_basis"] = wasmExports2["Z3_get_re_sort_basis"];
    _Z3_is_char_sort = Module["_Z3_is_char_sort"] = wasmExports2["Z3_is_char_sort"];
    _Z3_is_string_sort = Module["_Z3_is_string_sort"] = wasmExports2["Z3_is_string_sort"];
    _Z3_is_string = Module["_Z3_is_string"] = wasmExports2["Z3_is_string"];
    _Z3_get_string = Module["_Z3_get_string"] = wasmExports2["Z3_get_string"];
    _Z3_get_lstring = Module["_Z3_get_lstring"] = wasmExports2["Z3_get_lstring"];
    _Z3_get_string_length = Module["_Z3_get_string_length"] = wasmExports2["Z3_get_string_length"];
    _Z3_get_string_contents = Module["_Z3_get_string_contents"] = wasmExports2["Z3_get_string_contents"];
    _Z3_mk_seq_empty = Module["_Z3_mk_seq_empty"] = wasmExports2["Z3_mk_seq_empty"];
    _Z3_mk_seq_unit = Module["_Z3_mk_seq_unit"] = wasmExports2["Z3_mk_seq_unit"];
    _Z3_mk_seq_concat = Module["_Z3_mk_seq_concat"] = wasmExports2["Z3_mk_seq_concat"];
    _Z3_mk_seq_prefix = Module["_Z3_mk_seq_prefix"] = wasmExports2["Z3_mk_seq_prefix"];
    _Z3_mk_seq_suffix = Module["_Z3_mk_seq_suffix"] = wasmExports2["Z3_mk_seq_suffix"];
    _Z3_mk_seq_contains = Module["_Z3_mk_seq_contains"] = wasmExports2["Z3_mk_seq_contains"];
    _Z3_mk_str_lt = Module["_Z3_mk_str_lt"] = wasmExports2["Z3_mk_str_lt"];
    _Z3_mk_str_le = Module["_Z3_mk_str_le"] = wasmExports2["Z3_mk_str_le"];
    _Z3_mk_string_to_code = Module["_Z3_mk_string_to_code"] = wasmExports2["Z3_mk_string_to_code"];
    _Z3_mk_string_from_code = Module["_Z3_mk_string_from_code"] = wasmExports2["Z3_mk_string_from_code"];
    _Z3_mk_seq_extract = Module["_Z3_mk_seq_extract"] = wasmExports2["Z3_mk_seq_extract"];
    _Z3_mk_seq_replace = Module["_Z3_mk_seq_replace"] = wasmExports2["Z3_mk_seq_replace"];
    _Z3_mk_seq_replace_all = Module["_Z3_mk_seq_replace_all"] = wasmExports2["Z3_mk_seq_replace_all"];
    _Z3_mk_seq_replace_re = Module["_Z3_mk_seq_replace_re"] = wasmExports2["Z3_mk_seq_replace_re"];
    _Z3_mk_seq_replace_re_all = Module["_Z3_mk_seq_replace_re_all"] = wasmExports2["Z3_mk_seq_replace_re_all"];
    _Z3_mk_seq_at = Module["_Z3_mk_seq_at"] = wasmExports2["Z3_mk_seq_at"];
    _Z3_mk_seq_nth = Module["_Z3_mk_seq_nth"] = wasmExports2["Z3_mk_seq_nth"];
    _Z3_mk_seq_length = Module["_Z3_mk_seq_length"] = wasmExports2["Z3_mk_seq_length"];
    _Z3_mk_seq_index = Module["_Z3_mk_seq_index"] = wasmExports2["Z3_mk_seq_index"];
    _Z3_mk_seq_last_index = Module["_Z3_mk_seq_last_index"] = wasmExports2["Z3_mk_seq_last_index"];
    _Z3_mk_seq_to_re = Module["_Z3_mk_seq_to_re"] = wasmExports2["Z3_mk_seq_to_re"];
    _Z3_mk_seq_in_re = Module["_Z3_mk_seq_in_re"] = wasmExports2["Z3_mk_seq_in_re"];
    _Z3_mk_int_to_str = Module["_Z3_mk_int_to_str"] = wasmExports2["Z3_mk_int_to_str"];
    _Z3_mk_str_to_int = Module["_Z3_mk_str_to_int"] = wasmExports2["Z3_mk_str_to_int"];
    _Z3_mk_ubv_to_str = Module["_Z3_mk_ubv_to_str"] = wasmExports2["Z3_mk_ubv_to_str"];
    _Z3_mk_sbv_to_str = Module["_Z3_mk_sbv_to_str"] = wasmExports2["Z3_mk_sbv_to_str"];
    _Z3_mk_re_loop = Module["_Z3_mk_re_loop"] = wasmExports2["Z3_mk_re_loop"];
    _Z3_mk_re_power = Module["_Z3_mk_re_power"] = wasmExports2["Z3_mk_re_power"];
    _Z3_mk_re_plus = Module["_Z3_mk_re_plus"] = wasmExports2["Z3_mk_re_plus"];
    _Z3_mk_re_star = Module["_Z3_mk_re_star"] = wasmExports2["Z3_mk_re_star"];
    _Z3_mk_re_option = Module["_Z3_mk_re_option"] = wasmExports2["Z3_mk_re_option"];
    _Z3_mk_re_complement = Module["_Z3_mk_re_complement"] = wasmExports2["Z3_mk_re_complement"];
    _Z3_mk_re_diff = Module["_Z3_mk_re_diff"] = wasmExports2["Z3_mk_re_diff"];
    _Z3_mk_re_union = Module["_Z3_mk_re_union"] = wasmExports2["Z3_mk_re_union"];
    _Z3_mk_re_intersect = Module["_Z3_mk_re_intersect"] = wasmExports2["Z3_mk_re_intersect"];
    _Z3_mk_re_concat = Module["_Z3_mk_re_concat"] = wasmExports2["Z3_mk_re_concat"];
    _Z3_mk_re_range = Module["_Z3_mk_re_range"] = wasmExports2["Z3_mk_re_range"];
    _Z3_mk_re_allchar = Module["_Z3_mk_re_allchar"] = wasmExports2["Z3_mk_re_allchar"];
    _Z3_mk_re_empty = Module["_Z3_mk_re_empty"] = wasmExports2["Z3_mk_re_empty"];
    _Z3_mk_re_full = Module["_Z3_mk_re_full"] = wasmExports2["Z3_mk_re_full"];
    _Z3_mk_char_le = Module["_Z3_mk_char_le"] = wasmExports2["Z3_mk_char_le"];
    _Z3_mk_char_to_int = Module["_Z3_mk_char_to_int"] = wasmExports2["Z3_mk_char_to_int"];
    _Z3_mk_char_to_bv = Module["_Z3_mk_char_to_bv"] = wasmExports2["Z3_mk_char_to_bv"];
    _Z3_mk_char_from_bv = Module["_Z3_mk_char_from_bv"] = wasmExports2["Z3_mk_char_from_bv"];
    _Z3_mk_char_is_digit = Module["_Z3_mk_char_is_digit"] = wasmExports2["Z3_mk_char_is_digit"];
    _Z3_mk_seq_map = Module["_Z3_mk_seq_map"] = wasmExports2["Z3_mk_seq_map"];
    _Z3_mk_seq_mapi = Module["_Z3_mk_seq_mapi"] = wasmExports2["Z3_mk_seq_mapi"];
    _Z3_mk_seq_foldl = Module["_Z3_mk_seq_foldl"] = wasmExports2["Z3_mk_seq_foldl"];
    _Z3_mk_seq_foldli = Module["_Z3_mk_seq_foldli"] = wasmExports2["Z3_mk_seq_foldli"];
    _Z3_mk_bv_sort = Module["_Z3_mk_bv_sort"] = wasmExports2["Z3_mk_bv_sort"];
    _Z3_mk_bvnot = Module["_Z3_mk_bvnot"] = wasmExports2["Z3_mk_bvnot"];
    _Z3_mk_bvredand = Module["_Z3_mk_bvredand"] = wasmExports2["Z3_mk_bvredand"];
    _Z3_mk_bvredor = Module["_Z3_mk_bvredor"] = wasmExports2["Z3_mk_bvredor"];
    _Z3_mk_bvand = Module["_Z3_mk_bvand"] = wasmExports2["Z3_mk_bvand"];
    _Z3_mk_bvor = Module["_Z3_mk_bvor"] = wasmExports2["Z3_mk_bvor"];
    _Z3_mk_bvxor = Module["_Z3_mk_bvxor"] = wasmExports2["Z3_mk_bvxor"];
    _Z3_mk_bvnand = Module["_Z3_mk_bvnand"] = wasmExports2["Z3_mk_bvnand"];
    _Z3_mk_bvnor = Module["_Z3_mk_bvnor"] = wasmExports2["Z3_mk_bvnor"];
    _Z3_mk_bvxnor = Module["_Z3_mk_bvxnor"] = wasmExports2["Z3_mk_bvxnor"];
    _Z3_mk_bvadd = Module["_Z3_mk_bvadd"] = wasmExports2["Z3_mk_bvadd"];
    _Z3_mk_bvmul = Module["_Z3_mk_bvmul"] = wasmExports2["Z3_mk_bvmul"];
    _Z3_mk_bvudiv = Module["_Z3_mk_bvudiv"] = wasmExports2["Z3_mk_bvudiv"];
    _Z3_mk_bvsdiv = Module["_Z3_mk_bvsdiv"] = wasmExports2["Z3_mk_bvsdiv"];
    _Z3_mk_bvurem = Module["_Z3_mk_bvurem"] = wasmExports2["Z3_mk_bvurem"];
    _Z3_mk_bvsrem = Module["_Z3_mk_bvsrem"] = wasmExports2["Z3_mk_bvsrem"];
    _Z3_mk_bvsmod = Module["_Z3_mk_bvsmod"] = wasmExports2["Z3_mk_bvsmod"];
    _Z3_mk_bvule = Module["_Z3_mk_bvule"] = wasmExports2["Z3_mk_bvule"];
    _Z3_mk_bvsle = Module["_Z3_mk_bvsle"] = wasmExports2["Z3_mk_bvsle"];
    _Z3_mk_bvuge = Module["_Z3_mk_bvuge"] = wasmExports2["Z3_mk_bvuge"];
    _Z3_mk_bvsge = Module["_Z3_mk_bvsge"] = wasmExports2["Z3_mk_bvsge"];
    _Z3_mk_bvult = Module["_Z3_mk_bvult"] = wasmExports2["Z3_mk_bvult"];
    _Z3_mk_bvslt = Module["_Z3_mk_bvslt"] = wasmExports2["Z3_mk_bvslt"];
    _Z3_mk_bvugt = Module["_Z3_mk_bvugt"] = wasmExports2["Z3_mk_bvugt"];
    _Z3_mk_bvsgt = Module["_Z3_mk_bvsgt"] = wasmExports2["Z3_mk_bvsgt"];
    _Z3_mk_concat = Module["_Z3_mk_concat"] = wasmExports2["Z3_mk_concat"];
    _Z3_mk_bvshl = Module["_Z3_mk_bvshl"] = wasmExports2["Z3_mk_bvshl"];
    _Z3_mk_bvlshr = Module["_Z3_mk_bvlshr"] = wasmExports2["Z3_mk_bvlshr"];
    _Z3_mk_bvashr = Module["_Z3_mk_bvashr"] = wasmExports2["Z3_mk_bvashr"];
    _Z3_mk_ext_rotate_left = Module["_Z3_mk_ext_rotate_left"] = wasmExports2["Z3_mk_ext_rotate_left"];
    _Z3_mk_ext_rotate_right = Module["_Z3_mk_ext_rotate_right"] = wasmExports2["Z3_mk_ext_rotate_right"];
    _Z3_mk_extract = Module["_Z3_mk_extract"] = wasmExports2["Z3_mk_extract"];
    _Z3_mk_sign_ext = Module["_Z3_mk_sign_ext"] = wasmExports2["Z3_mk_sign_ext"];
    _Z3_mk_zero_ext = Module["_Z3_mk_zero_ext"] = wasmExports2["Z3_mk_zero_ext"];
    _Z3_mk_repeat = Module["_Z3_mk_repeat"] = wasmExports2["Z3_mk_repeat"];
    _Z3_mk_bit2bool = Module["_Z3_mk_bit2bool"] = wasmExports2["Z3_mk_bit2bool"];
    _Z3_mk_rotate_left = Module["_Z3_mk_rotate_left"] = wasmExports2["Z3_mk_rotate_left"];
    _Z3_mk_rotate_right = Module["_Z3_mk_rotate_right"] = wasmExports2["Z3_mk_rotate_right"];
    _Z3_mk_int2bv = Module["_Z3_mk_int2bv"] = wasmExports2["Z3_mk_int2bv"];
    _Z3_mk_bv2int = Module["_Z3_mk_bv2int"] = wasmExports2["Z3_mk_bv2int"];
    _Z3_get_bv_sort_size = Module["_Z3_get_bv_sort_size"] = wasmExports2["Z3_get_bv_sort_size"];
    _Z3_mk_bvadd_no_overflow = Module["_Z3_mk_bvadd_no_overflow"] = wasmExports2["Z3_mk_bvadd_no_overflow"];
    _Z3_mk_bvadd_no_underflow = Module["_Z3_mk_bvadd_no_underflow"] = wasmExports2["Z3_mk_bvadd_no_underflow"];
    _Z3_mk_bvsub_no_overflow = Module["_Z3_mk_bvsub_no_overflow"] = wasmExports2["Z3_mk_bvsub_no_overflow"];
    _Z3_mk_bvneg = Module["_Z3_mk_bvneg"] = wasmExports2["Z3_mk_bvneg"];
    _Z3_mk_bvsub_no_underflow = Module["_Z3_mk_bvsub_no_underflow"] = wasmExports2["Z3_mk_bvsub_no_underflow"];
    _Z3_mk_bvmul_no_overflow = Module["_Z3_mk_bvmul_no_overflow"] = wasmExports2["Z3_mk_bvmul_no_overflow"];
    _Z3_mk_bvmul_no_underflow = Module["_Z3_mk_bvmul_no_underflow"] = wasmExports2["Z3_mk_bvmul_no_underflow"];
    _Z3_mk_bvneg_no_overflow = Module["_Z3_mk_bvneg_no_overflow"] = wasmExports2["Z3_mk_bvneg_no_overflow"];
    _Z3_mk_bvsdiv_no_overflow = Module["_Z3_mk_bvsdiv_no_overflow"] = wasmExports2["Z3_mk_bvsdiv_no_overflow"];
    _Z3_mk_bvsub = Module["_Z3_mk_bvsub"] = wasmExports2["Z3_mk_bvsub"];
    _Z3_stats_to_string = Module["_Z3_stats_to_string"] = wasmExports2["Z3_stats_to_string"];
    _Z3_stats_inc_ref = Module["_Z3_stats_inc_ref"] = wasmExports2["Z3_stats_inc_ref"];
    _Z3_stats_dec_ref = Module["_Z3_stats_dec_ref"] = wasmExports2["Z3_stats_dec_ref"];
    _Z3_stats_size = Module["_Z3_stats_size"] = wasmExports2["Z3_stats_size"];
    _Z3_stats_get_key = Module["_Z3_stats_get_key"] = wasmExports2["Z3_stats_get_key"];
    _Z3_stats_is_uint = Module["_Z3_stats_is_uint"] = wasmExports2["Z3_stats_is_uint"];
    _Z3_stats_is_double = Module["_Z3_stats_is_double"] = wasmExports2["Z3_stats_is_double"];
    _Z3_stats_get_uint_value = Module["_Z3_stats_get_uint_value"] = wasmExports2["Z3_stats_get_uint_value"];
    _Z3_stats_get_double_value = Module["_Z3_stats_get_double_value"] = wasmExports2["Z3_stats_get_double_value"];
    _Z3_get_estimated_alloc_size = Module["_Z3_get_estimated_alloc_size"] = wasmExports2["Z3_get_estimated_alloc_size"];
    _Z3_global_param_set = Module["_Z3_global_param_set"] = wasmExports2["Z3_global_param_set"];
    _Z3_global_param_reset_all = Module["_Z3_global_param_reset_all"] = wasmExports2["Z3_global_param_reset_all"];
    _Z3_global_param_get = Module["_Z3_global_param_get"] = wasmExports2["Z3_global_param_get"];
    _Z3_get_global_param_descrs = Module["_Z3_get_global_param_descrs"] = wasmExports2["Z3_get_global_param_descrs"];
    _Z3_mk_config = Module["_Z3_mk_config"] = wasmExports2["Z3_mk_config"];
    _Z3_del_config = Module["_Z3_del_config"] = wasmExports2["Z3_del_config"];
    _Z3_set_param_value = Module["_Z3_set_param_value"] = wasmExports2["Z3_set_param_value"];
    _Z3_update_param_value = Module["_Z3_update_param_value"] = wasmExports2["Z3_update_param_value"];
    _Z3_mk_simple_solver = Module["_Z3_mk_simple_solver"] = wasmExports2["Z3_mk_simple_solver"];
    _Z3_mk_solver = Module["_Z3_mk_solver"] = wasmExports2["Z3_mk_solver"];
    _Z3_mk_solver_for_logic = Module["_Z3_mk_solver_for_logic"] = wasmExports2["Z3_mk_solver_for_logic"];
    _Z3_mk_solver_from_tactic = Module["_Z3_mk_solver_from_tactic"] = wasmExports2["Z3_mk_solver_from_tactic"];
    _Z3_solver_add_simplifier = Module["_Z3_solver_add_simplifier"] = wasmExports2["Z3_solver_add_simplifier"];
    _Z3_solver_translate = Module["_Z3_solver_translate"] = wasmExports2["Z3_solver_translate"];
    _Z3_solver_import_model_converter = Module["_Z3_solver_import_model_converter"] = wasmExports2["Z3_solver_import_model_converter"];
    _Z3_solver_from_string = Module["_Z3_solver_from_string"] = wasmExports2["Z3_solver_from_string"];
    _Z3_solver_from_file = Module["_Z3_solver_from_file"] = wasmExports2["Z3_solver_from_file"];
    _Z3_solver_get_help = Module["_Z3_solver_get_help"] = wasmExports2["Z3_solver_get_help"];
    _Z3_solver_get_param_descrs = Module["_Z3_solver_get_param_descrs"] = wasmExports2["Z3_solver_get_param_descrs"];
    _Z3_solver_set_params = Module["_Z3_solver_set_params"] = wasmExports2["Z3_solver_set_params"];
    _Z3_solver_inc_ref = Module["_Z3_solver_inc_ref"] = wasmExports2["Z3_solver_inc_ref"];
    _Z3_solver_dec_ref = Module["_Z3_solver_dec_ref"] = wasmExports2["Z3_solver_dec_ref"];
    _Z3_solver_push = Module["_Z3_solver_push"] = wasmExports2["Z3_solver_push"];
    _Z3_solver_interrupt = Module["_Z3_solver_interrupt"] = wasmExports2["Z3_solver_interrupt"];
    _Z3_solver_pop = Module["_Z3_solver_pop"] = wasmExports2["Z3_solver_pop"];
    _Z3_solver_reset = Module["_Z3_solver_reset"] = wasmExports2["Z3_solver_reset"];
    _Z3_solver_get_num_scopes = Module["_Z3_solver_get_num_scopes"] = wasmExports2["Z3_solver_get_num_scopes"];
    _Z3_solver_assert = Module["_Z3_solver_assert"] = wasmExports2["Z3_solver_assert"];
    _Z3_solver_assert_and_track = Module["_Z3_solver_assert_and_track"] = wasmExports2["Z3_solver_assert_and_track"];
    _Z3_solver_get_assertions = Module["_Z3_solver_get_assertions"] = wasmExports2["Z3_solver_get_assertions"];
    _Z3_solver_get_units = Module["_Z3_solver_get_units"] = wasmExports2["Z3_solver_get_units"];
    _Z3_solver_get_non_units = Module["_Z3_solver_get_non_units"] = wasmExports2["Z3_solver_get_non_units"];
    _Z3_solver_get_levels = Module["_Z3_solver_get_levels"] = wasmExports2["Z3_solver_get_levels"];
    _Z3_solver_get_trail = Module["_Z3_solver_get_trail"] = wasmExports2["Z3_solver_get_trail"];
    _Z3_solver_check = Module["_Z3_solver_check"] = wasmExports2["Z3_solver_check"];
    _Z3_solver_check_assumptions = Module["_Z3_solver_check_assumptions"] = wasmExports2["Z3_solver_check_assumptions"];
    _Z3_solver_get_model = Module["_Z3_solver_get_model"] = wasmExports2["Z3_solver_get_model"];
    _Z3_solver_get_proof = Module["_Z3_solver_get_proof"] = wasmExports2["Z3_solver_get_proof"];
    _Z3_solver_get_unsat_core = Module["_Z3_solver_get_unsat_core"] = wasmExports2["Z3_solver_get_unsat_core"];
    _Z3_solver_get_reason_unknown = Module["_Z3_solver_get_reason_unknown"] = wasmExports2["Z3_solver_get_reason_unknown"];
    _Z3_solver_get_statistics = Module["_Z3_solver_get_statistics"] = wasmExports2["Z3_solver_get_statistics"];
    _Z3_solver_to_string = Module["_Z3_solver_to_string"] = wasmExports2["Z3_solver_to_string"];
    _Z3_solver_to_dimacs_string = Module["_Z3_solver_to_dimacs_string"] = wasmExports2["Z3_solver_to_dimacs_string"];
    _Z3_get_implied_equalities = Module["_Z3_get_implied_equalities"] = wasmExports2["Z3_get_implied_equalities"];
    _Z3_solver_get_consequences = Module["_Z3_solver_get_consequences"] = wasmExports2["Z3_solver_get_consequences"];
    _Z3_solver_cube = Module["_Z3_solver_cube"] = wasmExports2["Z3_solver_cube"];
    _Z3_solver_congruence_root = Module["_Z3_solver_congruence_root"] = wasmExports2["Z3_solver_congruence_root"];
    _Z3_solver_congruence_next = Module["_Z3_solver_congruence_next"] = wasmExports2["Z3_solver_congruence_next"];
    _Z3_solver_congruence_explain = Module["_Z3_solver_congruence_explain"] = wasmExports2["Z3_solver_congruence_explain"];
    _Z3_solver_solve_for = Module["_Z3_solver_solve_for"] = wasmExports2["Z3_solver_solve_for"];
    _Z3_solver_register_on_clause = Module["_Z3_solver_register_on_clause"] = wasmExports2["Z3_solver_register_on_clause"];
    _Z3_solver_propagate_init = Module["_Z3_solver_propagate_init"] = wasmExports2["Z3_solver_propagate_init"];
    _Z3_solver_propagate_fixed = Module["_Z3_solver_propagate_fixed"] = wasmExports2["Z3_solver_propagate_fixed"];
    _Z3_solver_propagate_final = Module["_Z3_solver_propagate_final"] = wasmExports2["Z3_solver_propagate_final"];
    _Z3_solver_propagate_eq = Module["_Z3_solver_propagate_eq"] = wasmExports2["Z3_solver_propagate_eq"];
    _Z3_solver_propagate_diseq = Module["_Z3_solver_propagate_diseq"] = wasmExports2["Z3_solver_propagate_diseq"];
    _Z3_solver_propagate_register = Module["_Z3_solver_propagate_register"] = wasmExports2["Z3_solver_propagate_register"];
    _Z3_solver_propagate_register_cb = Module["_Z3_solver_propagate_register_cb"] = wasmExports2["Z3_solver_propagate_register_cb"];
    _Z3_solver_propagate_consequence = Module["_Z3_solver_propagate_consequence"] = wasmExports2["Z3_solver_propagate_consequence"];
    _Z3_solver_propagate_created = Module["_Z3_solver_propagate_created"] = wasmExports2["Z3_solver_propagate_created"];
    _Z3_solver_propagate_decide = Module["_Z3_solver_propagate_decide"] = wasmExports2["Z3_solver_propagate_decide"];
    _Z3_solver_propagate_on_binding = Module["_Z3_solver_propagate_on_binding"] = wasmExports2["Z3_solver_propagate_on_binding"];
    _Z3_solver_next_split = Module["_Z3_solver_next_split"] = wasmExports2["Z3_solver_next_split"];
    _Z3_solver_propagate_declare = Module["_Z3_solver_propagate_declare"] = wasmExports2["Z3_solver_propagate_declare"];
    _Z3_solver_set_initial_value = Module["_Z3_solver_set_initial_value"] = wasmExports2["Z3_solver_set_initial_value"];
    _Z3_mk_quantifier = Module["_Z3_mk_quantifier"] = wasmExports2["Z3_mk_quantifier"];
    _Z3_mk_quantifier_ex = Module["_Z3_mk_quantifier_ex"] = wasmExports2["Z3_mk_quantifier_ex"];
    _Z3_mk_forall = Module["_Z3_mk_forall"] = wasmExports2["Z3_mk_forall"];
    _Z3_mk_exists = Module["_Z3_mk_exists"] = wasmExports2["Z3_mk_exists"];
    _Z3_mk_lambda = Module["_Z3_mk_lambda"] = wasmExports2["Z3_mk_lambda"];
    _Z3_mk_lambda_const = Module["_Z3_mk_lambda_const"] = wasmExports2["Z3_mk_lambda_const"];
    _Z3_mk_quantifier_const_ex = Module["_Z3_mk_quantifier_const_ex"] = wasmExports2["Z3_mk_quantifier_const_ex"];
    _Z3_mk_quantifier_const = Module["_Z3_mk_quantifier_const"] = wasmExports2["Z3_mk_quantifier_const"];
    _Z3_mk_forall_const = Module["_Z3_mk_forall_const"] = wasmExports2["Z3_mk_forall_const"];
    _Z3_mk_exists_const = Module["_Z3_mk_exists_const"] = wasmExports2["Z3_mk_exists_const"];
    _Z3_mk_pattern = Module["_Z3_mk_pattern"] = wasmExports2["Z3_mk_pattern"];
    _Z3_mk_bound = Module["_Z3_mk_bound"] = wasmExports2["Z3_mk_bound"];
    _Z3_is_quantifier_forall = Module["_Z3_is_quantifier_forall"] = wasmExports2["Z3_is_quantifier_forall"];
    _Z3_is_quantifier_exists = Module["_Z3_is_quantifier_exists"] = wasmExports2["Z3_is_quantifier_exists"];
    _Z3_is_lambda = Module["_Z3_is_lambda"] = wasmExports2["Z3_is_lambda"];
    _Z3_get_quantifier_weight = Module["_Z3_get_quantifier_weight"] = wasmExports2["Z3_get_quantifier_weight"];
    _Z3_get_quantifier_skolem_id = Module["_Z3_get_quantifier_skolem_id"] = wasmExports2["Z3_get_quantifier_skolem_id"];
    _Z3_get_quantifier_id = Module["_Z3_get_quantifier_id"] = wasmExports2["Z3_get_quantifier_id"];
    _Z3_get_quantifier_num_patterns = Module["_Z3_get_quantifier_num_patterns"] = wasmExports2["Z3_get_quantifier_num_patterns"];
    _Z3_get_quantifier_pattern_ast = Module["_Z3_get_quantifier_pattern_ast"] = wasmExports2["Z3_get_quantifier_pattern_ast"];
    _Z3_get_quantifier_num_no_patterns = Module["_Z3_get_quantifier_num_no_patterns"] = wasmExports2["Z3_get_quantifier_num_no_patterns"];
    _Z3_get_quantifier_no_pattern_ast = Module["_Z3_get_quantifier_no_pattern_ast"] = wasmExports2["Z3_get_quantifier_no_pattern_ast"];
    _Z3_get_quantifier_bound_name = Module["_Z3_get_quantifier_bound_name"] = wasmExports2["Z3_get_quantifier_bound_name"];
    _Z3_get_quantifier_bound_sort = Module["_Z3_get_quantifier_bound_sort"] = wasmExports2["Z3_get_quantifier_bound_sort"];
    _Z3_get_quantifier_body = Module["_Z3_get_quantifier_body"] = wasmExports2["Z3_get_quantifier_body"];
    _Z3_get_quantifier_num_bound = Module["_Z3_get_quantifier_num_bound"] = wasmExports2["Z3_get_quantifier_num_bound"];
    _Z3_get_pattern_num_terms = Module["_Z3_get_pattern_num_terms"] = wasmExports2["Z3_get_pattern_num_terms"];
    _Z3_get_pattern = Module["_Z3_get_pattern"] = wasmExports2["Z3_get_pattern"];
    _Z3_pattern_to_ast = Module["_Z3_pattern_to_ast"] = wasmExports2["Z3_pattern_to_ast"];
    _Z3_pattern_to_string = Module["_Z3_pattern_to_string"] = wasmExports2["Z3_pattern_to_string"];
    _Z3_mk_params = Module["_Z3_mk_params"] = wasmExports2["Z3_mk_params"];
    _Z3_params_inc_ref = Module["_Z3_params_inc_ref"] = wasmExports2["Z3_params_inc_ref"];
    _Z3_params_dec_ref = Module["_Z3_params_dec_ref"] = wasmExports2["Z3_params_dec_ref"];
    _Z3_params_set_bool = Module["_Z3_params_set_bool"] = wasmExports2["Z3_params_set_bool"];
    _Z3_params_set_uint = Module["_Z3_params_set_uint"] = wasmExports2["Z3_params_set_uint"];
    _Z3_params_set_double = Module["_Z3_params_set_double"] = wasmExports2["Z3_params_set_double"];
    _Z3_params_set_symbol = Module["_Z3_params_set_symbol"] = wasmExports2["Z3_params_set_symbol"];
    _Z3_params_to_string = Module["_Z3_params_to_string"] = wasmExports2["Z3_params_to_string"];
    _Z3_params_validate = Module["_Z3_params_validate"] = wasmExports2["Z3_params_validate"];
    _Z3_param_descrs_inc_ref = Module["_Z3_param_descrs_inc_ref"] = wasmExports2["Z3_param_descrs_inc_ref"];
    _Z3_param_descrs_dec_ref = Module["_Z3_param_descrs_dec_ref"] = wasmExports2["Z3_param_descrs_dec_ref"];
    _Z3_param_descrs_get_kind = Module["_Z3_param_descrs_get_kind"] = wasmExports2["Z3_param_descrs_get_kind"];
    _Z3_param_descrs_size = Module["_Z3_param_descrs_size"] = wasmExports2["Z3_param_descrs_size"];
    _Z3_param_descrs_get_name = Module["_Z3_param_descrs_get_name"] = wasmExports2["Z3_param_descrs_get_name"];
    _Z3_param_descrs_get_documentation = Module["_Z3_param_descrs_get_documentation"] = wasmExports2["Z3_param_descrs_get_documentation"];
    _Z3_param_descrs_to_string = Module["_Z3_param_descrs_to_string"] = wasmExports2["Z3_param_descrs_to_string"];
    _Z3_mk_numeral = Module["_Z3_mk_numeral"] = wasmExports2["Z3_mk_numeral"];
    _Z3_mk_int = Module["_Z3_mk_int"] = wasmExports2["Z3_mk_int"];
    _Z3_mk_unsigned_int = Module["_Z3_mk_unsigned_int"] = wasmExports2["Z3_mk_unsigned_int"];
    _Z3_mk_int64 = Module["_Z3_mk_int64"] = wasmExports2["Z3_mk_int64"];
    _Z3_mk_unsigned_int64 = Module["_Z3_mk_unsigned_int64"] = wasmExports2["Z3_mk_unsigned_int64"];
    _Z3_is_numeral_ast = Module["_Z3_is_numeral_ast"] = wasmExports2["Z3_is_numeral_ast"];
    _Z3_get_numeral_binary_string = Module["_Z3_get_numeral_binary_string"] = wasmExports2["Z3_get_numeral_binary_string"];
    _Z3_get_numeral_string = Module["_Z3_get_numeral_string"] = wasmExports2["Z3_get_numeral_string"];
    _Z3_get_numeral_double = Module["_Z3_get_numeral_double"] = wasmExports2["Z3_get_numeral_double"];
    _Z3_get_numeral_decimal_string = Module["_Z3_get_numeral_decimal_string"] = wasmExports2["Z3_get_numeral_decimal_string"];
    _Z3_get_numeral_small = Module["_Z3_get_numeral_small"] = wasmExports2["Z3_get_numeral_small"];
    _Z3_get_numeral_int = Module["_Z3_get_numeral_int"] = wasmExports2["Z3_get_numeral_int"];
    _Z3_get_numeral_int64 = Module["_Z3_get_numeral_int64"] = wasmExports2["Z3_get_numeral_int64"];
    _Z3_get_numeral_uint = Module["_Z3_get_numeral_uint"] = wasmExports2["Z3_get_numeral_uint"];
    _Z3_get_numeral_uint64 = Module["_Z3_get_numeral_uint64"] = wasmExports2["Z3_get_numeral_uint64"];
    _Z3_get_numeral_rational_int64 = Module["_Z3_get_numeral_rational_int64"] = wasmExports2["Z3_get_numeral_rational_int64"];
    _Z3_mk_bv_numeral = Module["_Z3_mk_bv_numeral"] = wasmExports2["Z3_mk_bv_numeral"];
    _Z3_mk_parser_context = Module["_Z3_mk_parser_context"] = wasmExports2["Z3_mk_parser_context"];
    _Z3_parser_context_inc_ref = Module["_Z3_parser_context_inc_ref"] = wasmExports2["Z3_parser_context_inc_ref"];
    _Z3_parser_context_dec_ref = Module["_Z3_parser_context_dec_ref"] = wasmExports2["Z3_parser_context_dec_ref"];
    _Z3_parser_context_add_sort = Module["_Z3_parser_context_add_sort"] = wasmExports2["Z3_parser_context_add_sort"];
    _Z3_parser_context_add_decl = Module["_Z3_parser_context_add_decl"] = wasmExports2["Z3_parser_context_add_decl"];
    _Z3_parser_context_from_string = Module["_Z3_parser_context_from_string"] = wasmExports2["Z3_parser_context_from_string"];
    _Z3_parse_smtlib2_string = Module["_Z3_parse_smtlib2_string"] = wasmExports2["Z3_parse_smtlib2_string"];
    _Z3_parse_smtlib2_file = Module["_Z3_parse_smtlib2_file"] = wasmExports2["Z3_parse_smtlib2_file"];
    _Z3_eval_smtlib2_string = Module["_Z3_eval_smtlib2_string"] = wasmExports2["Z3_eval_smtlib2_string"];
    _free = Module["_free"] = wasmExports2["free"];
    _malloc = Module["_malloc"] = wasmExports2["malloc"];
    ___trap = wasmExports2["__trap"];
    __emscripten_stack_restore = wasmExports2["_emscripten_stack_restore"];
    __emscripten_stack_alloc = wasmExports2["_emscripten_stack_alloc"];
    _emscripten_stack_get_current = wasmExports2["emscripten_stack_get_current"];
    ___cxa_decrement_exception_refcount = wasmExports2["__cxa_decrement_exception_refcount"];
    ___cxa_increment_exception_refcount = wasmExports2["__cxa_increment_exception_refcount"];
    ___thrown_object_from_unwind_exception = wasmExports2["__thrown_object_from_unwind_exception"];
    ___get_exception_message = wasmExports2["__get_exception_message"];
    memory = wasmMemory = wasmExports2["memory"];
    __indirect_function_table = wasmExports2["__indirect_function_table"];
    ___cpp_exception = wasmExports2["__cpp_exception"];
  }
  var wasmImports = { __syscall_fcntl64: ___syscall_fcntl64, __syscall_ioctl: ___syscall_ioctl, __syscall_openat: ___syscall_openat, _abort_js: __abort_js, _tzset_js: __tzset_js, clock_time_get: _clock_time_get, emscripten_get_heap_max: _emscripten_get_heap_max, emscripten_get_now: _emscripten_get_now, emscripten_resize_heap: _emscripten_resize_heap, environ_get: _environ_get, environ_sizes_get: _environ_sizes_get, exit: _exit, fd_close: _fd_close, fd_read: _fd_read, fd_seek: _fd_seek, fd_write: _fd_write, proc_exit: _proc_exit };
  function applySignatureConversions(wasmExports2) {
    wasmExports2 = Object.assign({}, wasmExports2);
    var makeWrapper_pp = (f) => (a0) => f(a0) >>> 0;
    var makeWrapper_p = (f) => () => f() >>> 0;
    wasmExports2["malloc"] = makeWrapper_pp(wasmExports2["malloc"]);
    wasmExports2["_emscripten_stack_alloc"] = makeWrapper_pp(wasmExports2["_emscripten_stack_alloc"]);
    wasmExports2["emscripten_stack_get_current"] = makeWrapper_p(wasmExports2["emscripten_stack_get_current"]);
    return wasmExports2;
  }
  function run() {
    if (runDependencies > 0) {
      dependenciesFulfilled = run;
      return;
    }
    preRun();
    if (runDependencies > 0) {
      dependenciesFulfilled = run;
      return;
    }
    function doRun() {
      Module["calledRun"] = true;
      if (ABORT) return;
      initRuntime();
      readyPromiseResolve?.(Module);
      Module["onRuntimeInitialized"]?.();
      postRun();
    }
    if (Module["setStatus"]) {
      Module["setStatus"]("Running...");
      setTimeout(() => {
        setTimeout(() => Module["setStatus"](""), 1);
        doRun();
      }, 1);
    } else {
      doRun();
    }
  }
  var wasmExports;
  wasmExports = await createWasm();
  run();
  if (runtimeInitialized) {
    moduleRtn = Module;
  } else {
    moduleRtn = new Promise((resolve, reject) => {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
  }
  ;
  return moduleRtn;
}
var z3_built_default = initZ3;

// src/high-level/smtlib.ts
var sexprText = (s) => typeof s === "string" ? s : s.text;
function readSExprs(input) {
  let pos = 0;
  const n = input.length;
  function skipTrivia() {
    while (pos < n) {
      const c = input[pos];
      if (c === ";") {
        while (pos < n && input[pos] !== "\n") pos++;
      } else if (c === " " || c === "	" || c === "\n" || c === "\r") {
        pos++;
      } else {
        break;
      }
    }
  }
  function readNode() {
    const c = input[pos];
    if (c === "(") {
      const start2 = pos;
      pos++;
      const items = [];
      for (; ; ) {
        skipTrivia();
        if (pos >= n) {
          throw new Error('unbalanced "(" in solver output');
        }
        if (input[pos] === ")") {
          pos++;
          break;
        }
        items.push(readNode());
      }
      return { items, text: input.slice(start2, pos) };
    }
    if (c === "|") {
      const start2 = pos;
      pos++;
      while (pos < n && input[pos] !== "|") pos++;
      if (pos >= n) {
        throw new Error("unterminated |symbol| in solver output");
      }
      pos++;
      return input.slice(start2, pos);
    }
    if (c === '"') {
      const start2 = pos;
      pos++;
      for (; ; ) {
        if (pos >= n) {
          throw new Error("unterminated string in solver output");
        }
        if (input[pos] === '"') {
          if (input[pos + 1] === '"') {
            pos += 2;
          } else {
            pos++;
            break;
          }
        } else {
          pos++;
        }
      }
      return input.slice(start2, pos);
    }
    const start = pos;
    while (pos < n && !' 	\n\r();|"'.includes(input[pos])) pos++;
    if (pos === start) {
      throw new Error(`unexpected character ${JSON.stringify(c)} in solver output`);
    }
    return input.slice(start, pos);
  }
  const out = [];
  for (; ; ) {
    skipTrivia();
    if (pos >= n) {
      break;
    }
    out.push(readNode());
  }
  return out;
}
function extractGetValue(output) {
  const trimmed = output.trim();
  if (trimmed.startsWith("(error")) {
    throw new Error(`solver error: ${trimmed}`);
  }
  const forms = readSExprs(output);
  const first = forms[0];
  if (first === void 0 || typeof first === "string") {
    throw new Error(`unexpected get-value response: ${trimmed}`);
  }
  const pair = first.items[0];
  if (pair === void 0 || typeof pair === "string" || pair.items.length < 2) {
    throw new Error(`unexpected get-value response: ${trimmed}`);
  }
  return sexprText(pair.items[pair.items.length - 1]);
}

// src/low-level/types.__GENERATED__.ts
var Z3_lbool = /* @__PURE__ */ ((Z3_lbool2) => {
  Z3_lbool2[Z3_lbool2["Z3_L_FALSE"] = -1] = "Z3_L_FALSE";
  Z3_lbool2[Z3_lbool2["Z3_L_UNDEF"] = 0] = "Z3_L_UNDEF";
  Z3_lbool2[Z3_lbool2["Z3_L_TRUE"] = 1] = "Z3_L_TRUE";
  return Z3_lbool2;
})(Z3_lbool || {});
var Z3_symbol_kind = /* @__PURE__ */ ((Z3_symbol_kind2) => {
  Z3_symbol_kind2[Z3_symbol_kind2["Z3_INT_SYMBOL"] = 0] = "Z3_INT_SYMBOL";
  Z3_symbol_kind2[Z3_symbol_kind2["Z3_STRING_SYMBOL"] = 1] = "Z3_STRING_SYMBOL";
  return Z3_symbol_kind2;
})(Z3_symbol_kind || {});
var Z3_parameter_kind = /* @__PURE__ */ ((Z3_parameter_kind2) => {
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_INT"] = 0] = "Z3_PARAMETER_INT";
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_DOUBLE"] = 1] = "Z3_PARAMETER_DOUBLE";
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_RATIONAL"] = 2] = "Z3_PARAMETER_RATIONAL";
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_SYMBOL"] = 3] = "Z3_PARAMETER_SYMBOL";
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_SORT"] = 4] = "Z3_PARAMETER_SORT";
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_AST"] = 5] = "Z3_PARAMETER_AST";
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_FUNC_DECL"] = 6] = "Z3_PARAMETER_FUNC_DECL";
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_INTERNAL"] = 7] = "Z3_PARAMETER_INTERNAL";
  Z3_parameter_kind2[Z3_parameter_kind2["Z3_PARAMETER_ZSTRING"] = 8] = "Z3_PARAMETER_ZSTRING";
  return Z3_parameter_kind2;
})(Z3_parameter_kind || {});
var Z3_sort_kind = /* @__PURE__ */ ((Z3_sort_kind2) => {
  Z3_sort_kind2[Z3_sort_kind2["Z3_UNINTERPRETED_SORT"] = 0] = "Z3_UNINTERPRETED_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_BOOL_SORT"] = 1] = "Z3_BOOL_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_INT_SORT"] = 2] = "Z3_INT_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_REAL_SORT"] = 3] = "Z3_REAL_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_BV_SORT"] = 4] = "Z3_BV_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_ARRAY_SORT"] = 5] = "Z3_ARRAY_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_DATATYPE_SORT"] = 6] = "Z3_DATATYPE_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_RELATION_SORT"] = 7] = "Z3_RELATION_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_FINITE_DOMAIN_SORT"] = 8] = "Z3_FINITE_DOMAIN_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_FLOATING_POINT_SORT"] = 9] = "Z3_FLOATING_POINT_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_ROUNDING_MODE_SORT"] = 10] = "Z3_ROUNDING_MODE_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_SEQ_SORT"] = 11] = "Z3_SEQ_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_RE_SORT"] = 12] = "Z3_RE_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_CHAR_SORT"] = 13] = "Z3_CHAR_SORT";
  Z3_sort_kind2[Z3_sort_kind2["Z3_TYPE_VAR"] = 14] = "Z3_TYPE_VAR";
  Z3_sort_kind2[Z3_sort_kind2["Z3_UNKNOWN_SORT"] = 1e3] = "Z3_UNKNOWN_SORT";
  return Z3_sort_kind2;
})(Z3_sort_kind || {});
var Z3_ast_kind = /* @__PURE__ */ ((Z3_ast_kind2) => {
  Z3_ast_kind2[Z3_ast_kind2["Z3_NUMERAL_AST"] = 0] = "Z3_NUMERAL_AST";
  Z3_ast_kind2[Z3_ast_kind2["Z3_APP_AST"] = 1] = "Z3_APP_AST";
  Z3_ast_kind2[Z3_ast_kind2["Z3_VAR_AST"] = 2] = "Z3_VAR_AST";
  Z3_ast_kind2[Z3_ast_kind2["Z3_QUANTIFIER_AST"] = 3] = "Z3_QUANTIFIER_AST";
  Z3_ast_kind2[Z3_ast_kind2["Z3_SORT_AST"] = 4] = "Z3_SORT_AST";
  Z3_ast_kind2[Z3_ast_kind2["Z3_FUNC_DECL_AST"] = 5] = "Z3_FUNC_DECL_AST";
  Z3_ast_kind2[Z3_ast_kind2["Z3_UNKNOWN_AST"] = 1e3] = "Z3_UNKNOWN_AST";
  return Z3_ast_kind2;
})(Z3_ast_kind || {});
var Z3_decl_kind = /* @__PURE__ */ ((Z3_decl_kind2) => {
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_TRUE"] = 256] = "Z3_OP_TRUE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FALSE"] = 257] = "Z3_OP_FALSE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_EQ"] = 258] = "Z3_OP_EQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_DISTINCT"] = 259] = "Z3_OP_DISTINCT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ITE"] = 260] = "Z3_OP_ITE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_AND"] = 261] = "Z3_OP_AND";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_OR"] = 262] = "Z3_OP_OR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_IFF"] = 263] = "Z3_OP_IFF";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_XOR"] = 264] = "Z3_OP_XOR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_NOT"] = 265] = "Z3_OP_NOT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_IMPLIES"] = 266] = "Z3_OP_IMPLIES";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_OEQ"] = 267] = "Z3_OP_OEQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ANUM"] = 512] = "Z3_OP_ANUM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_AGNUM"] = 513] = "Z3_OP_AGNUM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_LE"] = 514] = "Z3_OP_LE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_GE"] = 515] = "Z3_OP_GE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_LT"] = 516] = "Z3_OP_LT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_GT"] = 517] = "Z3_OP_GT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ADD"] = 518] = "Z3_OP_ADD";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SUB"] = 519] = "Z3_OP_SUB";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_UMINUS"] = 520] = "Z3_OP_UMINUS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_MUL"] = 521] = "Z3_OP_MUL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_DIV"] = 522] = "Z3_OP_DIV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_IDIV"] = 523] = "Z3_OP_IDIV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_REM"] = 524] = "Z3_OP_REM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_MOD"] = 525] = "Z3_OP_MOD";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_TO_REAL"] = 526] = "Z3_OP_TO_REAL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_TO_INT"] = 527] = "Z3_OP_TO_INT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_IS_INT"] = 528] = "Z3_OP_IS_INT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_POWER"] = 529] = "Z3_OP_POWER";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ABS"] = 530] = "Z3_OP_ABS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_STORE"] = 768] = "Z3_OP_STORE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SELECT"] = 769] = "Z3_OP_SELECT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CONST_ARRAY"] = 770] = "Z3_OP_CONST_ARRAY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ARRAY_MAP"] = 771] = "Z3_OP_ARRAY_MAP";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ARRAY_DEFAULT"] = 772] = "Z3_OP_ARRAY_DEFAULT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SET_UNION"] = 773] = "Z3_OP_SET_UNION";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SET_INTERSECT"] = 774] = "Z3_OP_SET_INTERSECT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SET_DIFFERENCE"] = 775] = "Z3_OP_SET_DIFFERENCE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SET_COMPLEMENT"] = 776] = "Z3_OP_SET_COMPLEMENT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SET_SUBSET"] = 777] = "Z3_OP_SET_SUBSET";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_AS_ARRAY"] = 778] = "Z3_OP_AS_ARRAY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ARRAY_EXT"] = 779] = "Z3_OP_ARRAY_EXT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BNUM"] = 1024] = "Z3_OP_BNUM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BIT1"] = 1025] = "Z3_OP_BIT1";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BIT0"] = 1026] = "Z3_OP_BIT0";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BNEG"] = 1027] = "Z3_OP_BNEG";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BADD"] = 1028] = "Z3_OP_BADD";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSUB"] = 1029] = "Z3_OP_BSUB";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BMUL"] = 1030] = "Z3_OP_BMUL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSDIV"] = 1031] = "Z3_OP_BSDIV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BUDIV"] = 1032] = "Z3_OP_BUDIV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSREM"] = 1033] = "Z3_OP_BSREM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BUREM"] = 1034] = "Z3_OP_BUREM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSMOD"] = 1035] = "Z3_OP_BSMOD";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSDIV0"] = 1036] = "Z3_OP_BSDIV0";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BUDIV0"] = 1037] = "Z3_OP_BUDIV0";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSREM0"] = 1038] = "Z3_OP_BSREM0";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BUREM0"] = 1039] = "Z3_OP_BUREM0";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSMOD0"] = 1040] = "Z3_OP_BSMOD0";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ULEQ"] = 1041] = "Z3_OP_ULEQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SLEQ"] = 1042] = "Z3_OP_SLEQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_UGEQ"] = 1043] = "Z3_OP_UGEQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SGEQ"] = 1044] = "Z3_OP_SGEQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ULT"] = 1045] = "Z3_OP_ULT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SLT"] = 1046] = "Z3_OP_SLT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_UGT"] = 1047] = "Z3_OP_UGT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SGT"] = 1048] = "Z3_OP_SGT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BAND"] = 1049] = "Z3_OP_BAND";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BOR"] = 1050] = "Z3_OP_BOR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BNOT"] = 1051] = "Z3_OP_BNOT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BXOR"] = 1052] = "Z3_OP_BXOR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BNAND"] = 1053] = "Z3_OP_BNAND";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BNOR"] = 1054] = "Z3_OP_BNOR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BXNOR"] = 1055] = "Z3_OP_BXNOR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CONCAT"] = 1056] = "Z3_OP_CONCAT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SIGN_EXT"] = 1057] = "Z3_OP_SIGN_EXT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ZERO_EXT"] = 1058] = "Z3_OP_ZERO_EXT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_EXTRACT"] = 1059] = "Z3_OP_EXTRACT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_REPEAT"] = 1060] = "Z3_OP_REPEAT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BREDOR"] = 1061] = "Z3_OP_BREDOR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BREDAND"] = 1062] = "Z3_OP_BREDAND";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BCOMP"] = 1063] = "Z3_OP_BCOMP";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSHL"] = 1064] = "Z3_OP_BSHL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BLSHR"] = 1065] = "Z3_OP_BLSHR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BASHR"] = 1066] = "Z3_OP_BASHR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ROTATE_LEFT"] = 1067] = "Z3_OP_ROTATE_LEFT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_ROTATE_RIGHT"] = 1068] = "Z3_OP_ROTATE_RIGHT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_EXT_ROTATE_LEFT"] = 1069] = "Z3_OP_EXT_ROTATE_LEFT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_EXT_ROTATE_RIGHT"] = 1070] = "Z3_OP_EXT_ROTATE_RIGHT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BIT2BOOL"] = 1071] = "Z3_OP_BIT2BOOL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_INT2BV"] = 1072] = "Z3_OP_INT2BV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BV2INT"] = 1073] = "Z3_OP_BV2INT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SBV2INT"] = 1074] = "Z3_OP_SBV2INT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CARRY"] = 1075] = "Z3_OP_CARRY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_XOR3"] = 1076] = "Z3_OP_XOR3";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSMUL_NO_OVFL"] = 1077] = "Z3_OP_BSMUL_NO_OVFL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BUMUL_NO_OVFL"] = 1078] = "Z3_OP_BUMUL_NO_OVFL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSMUL_NO_UDFL"] = 1079] = "Z3_OP_BSMUL_NO_UDFL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSDIV_I"] = 1080] = "Z3_OP_BSDIV_I";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BUDIV_I"] = 1081] = "Z3_OP_BUDIV_I";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSREM_I"] = 1082] = "Z3_OP_BSREM_I";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BUREM_I"] = 1083] = "Z3_OP_BUREM_I";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_BSMOD_I"] = 1084] = "Z3_OP_BSMOD_I";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_UNDEF"] = 1280] = "Z3_OP_PR_UNDEF";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_TRUE"] = 1281] = "Z3_OP_PR_TRUE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_ASSERTED"] = 1282] = "Z3_OP_PR_ASSERTED";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_GOAL"] = 1283] = "Z3_OP_PR_GOAL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_MODUS_PONENS"] = 1284] = "Z3_OP_PR_MODUS_PONENS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_REFLEXIVITY"] = 1285] = "Z3_OP_PR_REFLEXIVITY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_SYMMETRY"] = 1286] = "Z3_OP_PR_SYMMETRY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_TRANSITIVITY"] = 1287] = "Z3_OP_PR_TRANSITIVITY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_TRANSITIVITY_STAR"] = 1288] = "Z3_OP_PR_TRANSITIVITY_STAR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_MONOTONICITY"] = 1289] = "Z3_OP_PR_MONOTONICITY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_QUANT_INTRO"] = 1290] = "Z3_OP_PR_QUANT_INTRO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_BIND"] = 1291] = "Z3_OP_PR_BIND";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_DISTRIBUTIVITY"] = 1292] = "Z3_OP_PR_DISTRIBUTIVITY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_AND_ELIM"] = 1293] = "Z3_OP_PR_AND_ELIM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_NOT_OR_ELIM"] = 1294] = "Z3_OP_PR_NOT_OR_ELIM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_REWRITE"] = 1295] = "Z3_OP_PR_REWRITE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_REWRITE_STAR"] = 1296] = "Z3_OP_PR_REWRITE_STAR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_PULL_QUANT"] = 1297] = "Z3_OP_PR_PULL_QUANT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_PUSH_QUANT"] = 1298] = "Z3_OP_PR_PUSH_QUANT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_ELIM_UNUSED_VARS"] = 1299] = "Z3_OP_PR_ELIM_UNUSED_VARS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_DER"] = 1300] = "Z3_OP_PR_DER";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_QUANT_INST"] = 1301] = "Z3_OP_PR_QUANT_INST";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_HYPOTHESIS"] = 1302] = "Z3_OP_PR_HYPOTHESIS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_LEMMA"] = 1303] = "Z3_OP_PR_LEMMA";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_UNIT_RESOLUTION"] = 1304] = "Z3_OP_PR_UNIT_RESOLUTION";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_IFF_TRUE"] = 1305] = "Z3_OP_PR_IFF_TRUE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_IFF_FALSE"] = 1306] = "Z3_OP_PR_IFF_FALSE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_COMMUTATIVITY"] = 1307] = "Z3_OP_PR_COMMUTATIVITY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_DEF_AXIOM"] = 1308] = "Z3_OP_PR_DEF_AXIOM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_ASSUMPTION_ADD"] = 1309] = "Z3_OP_PR_ASSUMPTION_ADD";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_LEMMA_ADD"] = 1310] = "Z3_OP_PR_LEMMA_ADD";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_REDUNDANT_DEL"] = 1311] = "Z3_OP_PR_REDUNDANT_DEL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_CLAUSE_TRAIL"] = 1312] = "Z3_OP_PR_CLAUSE_TRAIL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_DEF_INTRO"] = 1313] = "Z3_OP_PR_DEF_INTRO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_APPLY_DEF"] = 1314] = "Z3_OP_PR_APPLY_DEF";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_IFF_OEQ"] = 1315] = "Z3_OP_PR_IFF_OEQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_NNF_POS"] = 1316] = "Z3_OP_PR_NNF_POS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_NNF_NEG"] = 1317] = "Z3_OP_PR_NNF_NEG";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_SKOLEMIZE"] = 1318] = "Z3_OP_PR_SKOLEMIZE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_MODUS_PONENS_OEQ"] = 1319] = "Z3_OP_PR_MODUS_PONENS_OEQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_TH_LEMMA"] = 1320] = "Z3_OP_PR_TH_LEMMA";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PR_HYPER_RESOLVE"] = 1321] = "Z3_OP_PR_HYPER_RESOLVE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_STORE"] = 1536] = "Z3_OP_RA_STORE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_EMPTY"] = 1537] = "Z3_OP_RA_EMPTY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_IS_EMPTY"] = 1538] = "Z3_OP_RA_IS_EMPTY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_JOIN"] = 1539] = "Z3_OP_RA_JOIN";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_UNION"] = 1540] = "Z3_OP_RA_UNION";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_WIDEN"] = 1541] = "Z3_OP_RA_WIDEN";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_PROJECT"] = 1542] = "Z3_OP_RA_PROJECT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_FILTER"] = 1543] = "Z3_OP_RA_FILTER";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_NEGATION_FILTER"] = 1544] = "Z3_OP_RA_NEGATION_FILTER";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_RENAME"] = 1545] = "Z3_OP_RA_RENAME";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_COMPLEMENT"] = 1546] = "Z3_OP_RA_COMPLEMENT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_SELECT"] = 1547] = "Z3_OP_RA_SELECT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RA_CLONE"] = 1548] = "Z3_OP_RA_CLONE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FD_CONSTANT"] = 1549] = "Z3_OP_FD_CONSTANT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FD_LT"] = 1550] = "Z3_OP_FD_LT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_UNIT"] = 1551] = "Z3_OP_SEQ_UNIT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_EMPTY"] = 1552] = "Z3_OP_SEQ_EMPTY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_CONCAT"] = 1553] = "Z3_OP_SEQ_CONCAT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_PREFIX"] = 1554] = "Z3_OP_SEQ_PREFIX";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_SUFFIX"] = 1555] = "Z3_OP_SEQ_SUFFIX";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_CONTAINS"] = 1556] = "Z3_OP_SEQ_CONTAINS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_EXTRACT"] = 1557] = "Z3_OP_SEQ_EXTRACT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_REPLACE"] = 1558] = "Z3_OP_SEQ_REPLACE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_REPLACE_RE"] = 1559] = "Z3_OP_SEQ_REPLACE_RE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_REPLACE_RE_ALL"] = 1560] = "Z3_OP_SEQ_REPLACE_RE_ALL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_REPLACE_ALL"] = 1561] = "Z3_OP_SEQ_REPLACE_ALL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_AT"] = 1562] = "Z3_OP_SEQ_AT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_NTH"] = 1563] = "Z3_OP_SEQ_NTH";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_LENGTH"] = 1564] = "Z3_OP_SEQ_LENGTH";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_INDEX"] = 1565] = "Z3_OP_SEQ_INDEX";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_LAST_INDEX"] = 1566] = "Z3_OP_SEQ_LAST_INDEX";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_TO_RE"] = 1567] = "Z3_OP_SEQ_TO_RE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_IN_RE"] = 1568] = "Z3_OP_SEQ_IN_RE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_MAP"] = 1569] = "Z3_OP_SEQ_MAP";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_MAPI"] = 1570] = "Z3_OP_SEQ_MAPI";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_FOLDL"] = 1571] = "Z3_OP_SEQ_FOLDL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SEQ_FOLDLI"] = 1572] = "Z3_OP_SEQ_FOLDLI";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_STR_TO_INT"] = 1573] = "Z3_OP_STR_TO_INT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_INT_TO_STR"] = 1574] = "Z3_OP_INT_TO_STR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_UBV_TO_STR"] = 1575] = "Z3_OP_UBV_TO_STR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SBV_TO_STR"] = 1576] = "Z3_OP_SBV_TO_STR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_STR_TO_CODE"] = 1577] = "Z3_OP_STR_TO_CODE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_STR_FROM_CODE"] = 1578] = "Z3_OP_STR_FROM_CODE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_STRING_LT"] = 1579] = "Z3_OP_STRING_LT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_STRING_LE"] = 1580] = "Z3_OP_STRING_LE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_PLUS"] = 1581] = "Z3_OP_RE_PLUS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_STAR"] = 1582] = "Z3_OP_RE_STAR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_OPTION"] = 1583] = "Z3_OP_RE_OPTION";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_CONCAT"] = 1584] = "Z3_OP_RE_CONCAT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_UNION"] = 1585] = "Z3_OP_RE_UNION";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_RANGE"] = 1586] = "Z3_OP_RE_RANGE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_DIFF"] = 1587] = "Z3_OP_RE_DIFF";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_INTERSECT"] = 1588] = "Z3_OP_RE_INTERSECT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_LOOP"] = 1589] = "Z3_OP_RE_LOOP";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_POWER"] = 1590] = "Z3_OP_RE_POWER";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_COMPLEMENT"] = 1591] = "Z3_OP_RE_COMPLEMENT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_EMPTY_SET"] = 1592] = "Z3_OP_RE_EMPTY_SET";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_FULL_SET"] = 1593] = "Z3_OP_RE_FULL_SET";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_FULL_CHAR_SET"] = 1594] = "Z3_OP_RE_FULL_CHAR_SET";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_OF_PRED"] = 1595] = "Z3_OP_RE_OF_PRED";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_REVERSE"] = 1596] = "Z3_OP_RE_REVERSE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RE_DERIVATIVE"] = 1597] = "Z3_OP_RE_DERIVATIVE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CHAR_CONST"] = 1598] = "Z3_OP_CHAR_CONST";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CHAR_LE"] = 1599] = "Z3_OP_CHAR_LE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CHAR_TO_INT"] = 1600] = "Z3_OP_CHAR_TO_INT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CHAR_TO_BV"] = 1601] = "Z3_OP_CHAR_TO_BV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CHAR_FROM_BV"] = 1602] = "Z3_OP_CHAR_FROM_BV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_CHAR_IS_DIGIT"] = 1603] = "Z3_OP_CHAR_IS_DIGIT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_LABEL"] = 1792] = "Z3_OP_LABEL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_LABEL_LIT"] = 1793] = "Z3_OP_LABEL_LIT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_DT_CONSTRUCTOR"] = 2048] = "Z3_OP_DT_CONSTRUCTOR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_DT_RECOGNISER"] = 2049] = "Z3_OP_DT_RECOGNISER";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_DT_IS"] = 2050] = "Z3_OP_DT_IS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_DT_ACCESSOR"] = 2051] = "Z3_OP_DT_ACCESSOR";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_DT_UPDATE_FIELD"] = 2052] = "Z3_OP_DT_UPDATE_FIELD";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PB_AT_MOST"] = 2304] = "Z3_OP_PB_AT_MOST";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PB_AT_LEAST"] = 2305] = "Z3_OP_PB_AT_LEAST";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PB_LE"] = 2306] = "Z3_OP_PB_LE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PB_GE"] = 2307] = "Z3_OP_PB_GE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_PB_EQ"] = 2308] = "Z3_OP_PB_EQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SPECIAL_RELATION_LO"] = 40960] = "Z3_OP_SPECIAL_RELATION_LO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SPECIAL_RELATION_PO"] = 40961] = "Z3_OP_SPECIAL_RELATION_PO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SPECIAL_RELATION_PLO"] = 40962] = "Z3_OP_SPECIAL_RELATION_PLO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SPECIAL_RELATION_TO"] = 40963] = "Z3_OP_SPECIAL_RELATION_TO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SPECIAL_RELATION_TC"] = 40964] = "Z3_OP_SPECIAL_RELATION_TC";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_SPECIAL_RELATION_TRC"] = 40965] = "Z3_OP_SPECIAL_RELATION_TRC";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_RM_NEAREST_TIES_TO_EVEN"] = 45056] = "Z3_OP_FPA_RM_NEAREST_TIES_TO_EVEN";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_RM_NEAREST_TIES_TO_AWAY"] = 45057] = "Z3_OP_FPA_RM_NEAREST_TIES_TO_AWAY";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_RM_TOWARD_POSITIVE"] = 45058] = "Z3_OP_FPA_RM_TOWARD_POSITIVE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_RM_TOWARD_NEGATIVE"] = 45059] = "Z3_OP_FPA_RM_TOWARD_NEGATIVE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_RM_TOWARD_ZERO"] = 45060] = "Z3_OP_FPA_RM_TOWARD_ZERO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_NUM"] = 45061] = "Z3_OP_FPA_NUM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_PLUS_INF"] = 45062] = "Z3_OP_FPA_PLUS_INF";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_MINUS_INF"] = 45063] = "Z3_OP_FPA_MINUS_INF";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_NAN"] = 45064] = "Z3_OP_FPA_NAN";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_PLUS_ZERO"] = 45065] = "Z3_OP_FPA_PLUS_ZERO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_MINUS_ZERO"] = 45066] = "Z3_OP_FPA_MINUS_ZERO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_ADD"] = 45067] = "Z3_OP_FPA_ADD";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_SUB"] = 45068] = "Z3_OP_FPA_SUB";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_NEG"] = 45069] = "Z3_OP_FPA_NEG";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_MUL"] = 45070] = "Z3_OP_FPA_MUL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_DIV"] = 45071] = "Z3_OP_FPA_DIV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_REM"] = 45072] = "Z3_OP_FPA_REM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_ABS"] = 45073] = "Z3_OP_FPA_ABS";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_MIN"] = 45074] = "Z3_OP_FPA_MIN";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_MAX"] = 45075] = "Z3_OP_FPA_MAX";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_FMA"] = 45076] = "Z3_OP_FPA_FMA";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_SQRT"] = 45077] = "Z3_OP_FPA_SQRT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_ROUND_TO_INTEGRAL"] = 45078] = "Z3_OP_FPA_ROUND_TO_INTEGRAL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_EQ"] = 45079] = "Z3_OP_FPA_EQ";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_LT"] = 45080] = "Z3_OP_FPA_LT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_GT"] = 45081] = "Z3_OP_FPA_GT";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_LE"] = 45082] = "Z3_OP_FPA_LE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_GE"] = 45083] = "Z3_OP_FPA_GE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_IS_NAN"] = 45084] = "Z3_OP_FPA_IS_NAN";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_IS_INF"] = 45085] = "Z3_OP_FPA_IS_INF";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_IS_ZERO"] = 45086] = "Z3_OP_FPA_IS_ZERO";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_IS_NORMAL"] = 45087] = "Z3_OP_FPA_IS_NORMAL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_IS_SUBNORMAL"] = 45088] = "Z3_OP_FPA_IS_SUBNORMAL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_IS_NEGATIVE"] = 45089] = "Z3_OP_FPA_IS_NEGATIVE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_IS_POSITIVE"] = 45090] = "Z3_OP_FPA_IS_POSITIVE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_FP"] = 45091] = "Z3_OP_FPA_FP";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_TO_FP"] = 45092] = "Z3_OP_FPA_TO_FP";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_TO_FP_UNSIGNED"] = 45093] = "Z3_OP_FPA_TO_FP_UNSIGNED";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_TO_UBV"] = 45094] = "Z3_OP_FPA_TO_UBV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_TO_SBV"] = 45095] = "Z3_OP_FPA_TO_SBV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_TO_REAL"] = 45096] = "Z3_OP_FPA_TO_REAL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_TO_IEEE_BV"] = 45097] = "Z3_OP_FPA_TO_IEEE_BV";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_BVWRAP"] = 45098] = "Z3_OP_FPA_BVWRAP";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_FPA_BV2RM"] = 45099] = "Z3_OP_FPA_BV2RM";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_INTERNAL"] = 45100] = "Z3_OP_INTERNAL";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_RECURSIVE"] = 45101] = "Z3_OP_RECURSIVE";
  Z3_decl_kind2[Z3_decl_kind2["Z3_OP_UNINTERPRETED"] = 45102] = "Z3_OP_UNINTERPRETED";
  return Z3_decl_kind2;
})(Z3_decl_kind || {});
var Z3_param_kind = /* @__PURE__ */ ((Z3_param_kind2) => {
  Z3_param_kind2[Z3_param_kind2["Z3_PK_UINT"] = 0] = "Z3_PK_UINT";
  Z3_param_kind2[Z3_param_kind2["Z3_PK_BOOL"] = 1] = "Z3_PK_BOOL";
  Z3_param_kind2[Z3_param_kind2["Z3_PK_DOUBLE"] = 2] = "Z3_PK_DOUBLE";
  Z3_param_kind2[Z3_param_kind2["Z3_PK_SYMBOL"] = 3] = "Z3_PK_SYMBOL";
  Z3_param_kind2[Z3_param_kind2["Z3_PK_STRING"] = 4] = "Z3_PK_STRING";
  Z3_param_kind2[Z3_param_kind2["Z3_PK_OTHER"] = 5] = "Z3_PK_OTHER";
  Z3_param_kind2[Z3_param_kind2["Z3_PK_INVALID"] = 6] = "Z3_PK_INVALID";
  return Z3_param_kind2;
})(Z3_param_kind || {});
var Z3_ast_print_mode = /* @__PURE__ */ ((Z3_ast_print_mode2) => {
  Z3_ast_print_mode2[Z3_ast_print_mode2["Z3_PRINT_SMTLIB_FULL"] = 0] = "Z3_PRINT_SMTLIB_FULL";
  Z3_ast_print_mode2[Z3_ast_print_mode2["Z3_PRINT_LOW_LEVEL"] = 1] = "Z3_PRINT_LOW_LEVEL";
  Z3_ast_print_mode2[Z3_ast_print_mode2["Z3_PRINT_SMTLIB2_COMPLIANT"] = 2] = "Z3_PRINT_SMTLIB2_COMPLIANT";
  return Z3_ast_print_mode2;
})(Z3_ast_print_mode || {});
var Z3_error_code = /* @__PURE__ */ ((Z3_error_code2) => {
  Z3_error_code2[Z3_error_code2["Z3_OK"] = 0] = "Z3_OK";
  Z3_error_code2[Z3_error_code2["Z3_SORT_ERROR"] = 1] = "Z3_SORT_ERROR";
  Z3_error_code2[Z3_error_code2["Z3_IOB"] = 2] = "Z3_IOB";
  Z3_error_code2[Z3_error_code2["Z3_INVALID_ARG"] = 3] = "Z3_INVALID_ARG";
  Z3_error_code2[Z3_error_code2["Z3_PARSER_ERROR"] = 4] = "Z3_PARSER_ERROR";
  Z3_error_code2[Z3_error_code2["Z3_NO_PARSER"] = 5] = "Z3_NO_PARSER";
  Z3_error_code2[Z3_error_code2["Z3_INVALID_PATTERN"] = 6] = "Z3_INVALID_PATTERN";
  Z3_error_code2[Z3_error_code2["Z3_MEMOUT_FAIL"] = 7] = "Z3_MEMOUT_FAIL";
  Z3_error_code2[Z3_error_code2["Z3_FILE_ACCESS_ERROR"] = 8] = "Z3_FILE_ACCESS_ERROR";
  Z3_error_code2[Z3_error_code2["Z3_INTERNAL_FATAL"] = 9] = "Z3_INTERNAL_FATAL";
  Z3_error_code2[Z3_error_code2["Z3_INVALID_USAGE"] = 10] = "Z3_INVALID_USAGE";
  Z3_error_code2[Z3_error_code2["Z3_DEC_REF_ERROR"] = 11] = "Z3_DEC_REF_ERROR";
  Z3_error_code2[Z3_error_code2["Z3_EXCEPTION"] = 12] = "Z3_EXCEPTION";
  return Z3_error_code2;
})(Z3_error_code || {});
var Z3_goal_prec = /* @__PURE__ */ ((Z3_goal_prec3) => {
  Z3_goal_prec3[Z3_goal_prec3["Z3_GOAL_PRECISE"] = 0] = "Z3_GOAL_PRECISE";
  Z3_goal_prec3[Z3_goal_prec3["Z3_GOAL_UNDER"] = 1] = "Z3_GOAL_UNDER";
  Z3_goal_prec3[Z3_goal_prec3["Z3_GOAL_OVER"] = 2] = "Z3_GOAL_OVER";
  Z3_goal_prec3[Z3_goal_prec3["Z3_GOAL_UNDER_OVER"] = 3] = "Z3_GOAL_UNDER_OVER";
  return Z3_goal_prec3;
})(Z3_goal_prec || {});

// src/low-level/wrapper.__GENERATED__.ts
async function init(initModule, moduleOptions) {
  let Mod = await initModule(moduleOptions ?? {});
  function intArrayToByteArr(ints) {
    return new Uint8Array(new Uint32Array(ints).buffer);
  }
  function boolArrayToByteArr(bools) {
    return bools.map((b) => b ? 1 : 0);
  }
  function readUintArray(address, count) {
    return Array.from(
      Mod.HEAPU32.subarray(address >> 2, (address >> 2) + count)
    );
  }
  let outAddress = Mod._malloc(24);
  let getOutUint = (i) => Mod.HEAPU32[(outAddress >> 2) + i];
  let getOutInt = (i) => Mod.HEAP32[(outAddress >> 2) + i];
  let getOutUint64 = (i) => Mod.HEAPU64[(outAddress >> 3) + i];
  let getOutInt64 = (i) => Mod.HEAP64[(outAddress >> 3) + i];
  return {
    em: Mod,
    Z3: {
      mk_context: function(c) {
        let ctx = Mod._Z3_mk_context(c);
        Mod._set_noop_error_handler(ctx);
        return ctx;
      },
      mk_context_rc: function(c) {
        let ctx = Mod._Z3_mk_context_rc(c);
        Mod._set_noop_error_handler(ctx);
        return ctx;
      },
      global_param_set: function(param_id, param_value) {
        return Mod.ccall(
          "Z3_global_param_set",
          "void",
          ["string", "string"],
          [param_id, param_value]
        );
      },
      global_param_reset_all: Mod._Z3_global_param_reset_all,
      global_param_get: function(param_id) {
        let ret = Mod.ccall(
          "Z3_global_param_get",
          "boolean",
          ["string", "number"],
          [param_id, outAddress]
        );
        if (!ret) {
          return null;
        }
        return Mod.UTF8ToString(getOutUint(0));
      },
      mk_config: Mod._Z3_mk_config,
      del_config: Mod._Z3_del_config,
      set_param_value: function(c, param_id, param_value) {
        return Mod.ccall(
          "Z3_set_param_value",
          "void",
          ["number", "string", "string"],
          [c, param_id, param_value]
        );
      },
      del_context: Mod._Z3_del_context,
      inc_ref: Mod._Z3_inc_ref,
      dec_ref: Mod._Z3_dec_ref,
      update_param_value: function(c, param_id, param_value) {
        return Mod.ccall(
          "Z3_update_param_value",
          "void",
          ["number", "string", "string"],
          [c, param_id, param_value]
        );
      },
      get_global_param_descrs: Mod._Z3_get_global_param_descrs,
      interrupt: Mod._Z3_interrupt,
      enable_concurrent_dec_ref: Mod._Z3_enable_concurrent_dec_ref,
      mk_params: Mod._Z3_mk_params,
      params_inc_ref: Mod._Z3_params_inc_ref,
      params_dec_ref: Mod._Z3_params_dec_ref,
      params_set_bool: Mod._Z3_params_set_bool,
      params_set_uint: Mod._Z3_params_set_uint,
      params_set_double: Mod._Z3_params_set_double,
      params_set_symbol: Mod._Z3_params_set_symbol,
      params_to_string: function(c, p) {
        return Mod.ccall(
          "Z3_params_to_string",
          "string",
          ["number", "number"],
          [c, p]
        );
      },
      params_validate: Mod._Z3_params_validate,
      param_descrs_inc_ref: Mod._Z3_param_descrs_inc_ref,
      param_descrs_dec_ref: Mod._Z3_param_descrs_dec_ref,
      param_descrs_get_kind: Mod._Z3_param_descrs_get_kind,
      param_descrs_size: function(c, p) {
        let ret = Mod.ccall(
          "Z3_param_descrs_size",
          "number",
          ["number", "number"],
          [c, p]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      param_descrs_get_name: Mod._Z3_param_descrs_get_name,
      param_descrs_get_documentation: function(c, p, s) {
        return Mod.ccall(
          "Z3_param_descrs_get_documentation",
          "string",
          ["number", "number", "number"],
          [c, p, s]
        );
      },
      param_descrs_to_string: function(c, p) {
        return Mod.ccall(
          "Z3_param_descrs_to_string",
          "string",
          ["number", "number"],
          [c, p]
        );
      },
      mk_int_symbol: Mod._Z3_mk_int_symbol,
      mk_string_symbol: function(c, s) {
        return Mod.ccall(
          "Z3_mk_string_symbol",
          "number",
          ["number", "string"],
          [c, s]
        );
      },
      mk_uninterpreted_sort: Mod._Z3_mk_uninterpreted_sort,
      mk_type_variable: Mod._Z3_mk_type_variable,
      mk_bool_sort: Mod._Z3_mk_bool_sort,
      mk_int_sort: Mod._Z3_mk_int_sort,
      mk_real_sort: Mod._Z3_mk_real_sort,
      mk_bv_sort: Mod._Z3_mk_bv_sort,
      mk_finite_domain_sort: Mod._Z3_mk_finite_domain_sort,
      mk_array_sort: Mod._Z3_mk_array_sort,
      mk_array_sort_n: function(c, domain, range) {
        return Mod.ccall(
          "Z3_mk_array_sort_n",
          "number",
          ["number", "number", "array", "number"],
          [
            c,
            domain.length,
            intArrayToByteArr(domain),
            range
          ]
        );
      },
      mk_tuple_sort: function(c, mk_tuple_name, field_names, field_sorts) {
        if (field_names.length !== field_sorts.length) {
          throw new TypeError(
            `field_names and field_sorts must be the same length (got ${field_names.length} and {field_sorts.length})`
          );
        }
        let outArray_proj_decl = Mod._malloc(4 * field_names.length);
        try {
          let ret = Mod.ccall(
            "Z3_mk_tuple_sort",
            "number",
            [
              "number",
              "number",
              "number",
              "array",
              "array",
              "number",
              "number"
            ],
            [
              c,
              mk_tuple_name,
              field_names.length,
              intArrayToByteArr(field_names),
              intArrayToByteArr(field_sorts),
              outAddress,
              outArray_proj_decl
            ]
          );
          return {
            rv: ret,
            mk_tuple_decl: getOutUint(0),
            proj_decl: readUintArray(
              outArray_proj_decl,
              field_names.length
            )
          };
        } finally {
          Mod._free(outArray_proj_decl);
        }
      },
      mk_enumeration_sort: function(c, name, enum_names) {
        let outArray_enum_consts = Mod._malloc(4 * enum_names.length);
        try {
          let outArray_enum_testers = Mod._malloc(4 * enum_names.length);
          try {
            let ret = Mod.ccall(
              "Z3_mk_enumeration_sort",
              "number",
              ["number", "number", "number", "array", "number", "number"],
              [
                c,
                name,
                enum_names.length,
                intArrayToByteArr(enum_names),
                outArray_enum_consts,
                outArray_enum_testers
              ]
            );
            return {
              rv: ret,
              enum_consts: readUintArray(
                outArray_enum_consts,
                enum_names.length
              ),
              enum_testers: readUintArray(
                outArray_enum_testers,
                enum_names.length
              )
            };
          } finally {
            Mod._free(outArray_enum_testers);
          }
        } finally {
          Mod._free(outArray_enum_consts);
        }
      },
      mk_list_sort: function(c, name, elem_sort) {
        let ret = Mod.ccall(
          "Z3_mk_list_sort",
          "number",
          [
            "number",
            "number",
            "number",
            "number",
            "number",
            "number",
            "number",
            "number",
            "number"
          ],
          [
            c,
            name,
            elem_sort,
            outAddress,
            outAddress + 4,
            outAddress + 8,
            outAddress + 12,
            outAddress + 16,
            outAddress + 20
          ]
        );
        return {
          rv: ret,
          nil_decl: getOutUint(0),
          is_nil_decl: getOutUint(1),
          cons_decl: getOutUint(2),
          is_cons_decl: getOutUint(3),
          head_decl: getOutUint(4),
          tail_decl: getOutUint(5)
        };
      },
      mk_constructor: function(c, name, recognizer, field_names, sorts, sort_refs) {
        if (field_names.length !== sorts.length) {
          throw new TypeError(
            `field_names and sorts must be the same length (got ${field_names.length} and {sorts.length})`
          );
        }
        if (field_names.length !== sort_refs.length) {
          throw new TypeError(
            `field_names and sort_refs must be the same length (got ${field_names.length} and {sort_refs.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_constructor",
          "number",
          ["number", "number", "number", "number", "array", "array", "array"],
          [
            c,
            name,
            recognizer,
            field_names.length,
            intArrayToByteArr(field_names),
            intArrayToByteArr(sorts),
            intArrayToByteArr(sort_refs)
          ]
        );
      },
      constructor_num_fields: function(c, constr) {
        let ret = Mod.ccall(
          "Z3_constructor_num_fields",
          "number",
          ["number", "number"],
          [c, constr]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      del_constructor: Mod._Z3_del_constructor,
      mk_datatype: function(c, name, constructors) {
        return Mod.ccall(
          "Z3_mk_datatype",
          "number",
          ["number", "number", "number", "array"],
          [
            c,
            name,
            constructors.length,
            intArrayToByteArr(constructors)
          ]
        );
      },
      mk_polymorphic_datatype: function(c, name, parameters, constructors) {
        return Mod.ccall(
          "Z3_mk_polymorphic_datatype",
          "number",
          ["number", "number", "number", "array", "number", "array"],
          [
            c,
            name,
            parameters.length,
            intArrayToByteArr(parameters),
            constructors.length,
            intArrayToByteArr(constructors)
          ]
        );
      },
      mk_datatype_sort: function(c, name, params) {
        return Mod.ccall(
          "Z3_mk_datatype_sort",
          "number",
          ["number", "number", "number", "array"],
          [
            c,
            name,
            params.length,
            intArrayToByteArr(params)
          ]
        );
      },
      mk_constructor_list: function(c, constructors) {
        return Mod.ccall(
          "Z3_mk_constructor_list",
          "number",
          ["number", "number", "array"],
          [
            c,
            constructors.length,
            intArrayToByteArr(constructors)
          ]
        );
      },
      del_constructor_list: Mod._Z3_del_constructor_list,
      mk_datatypes: function(c, sort_names, constructor_lists) {
        if (sort_names.length !== constructor_lists.length) {
          throw new TypeError(
            `sort_names and constructor_lists must be the same length (got ${sort_names.length} and {constructor_lists.length})`
          );
        }
        let outArray_sorts = Mod._malloc(4 * sort_names.length);
        try {
          let ret = Mod.ccall(
            "Z3_mk_datatypes",
            "void",
            ["number", "number", "array", "number", "array"],
            [
              c,
              sort_names.length,
              intArrayToByteArr(sort_names),
              outArray_sorts,
              intArrayToByteArr(constructor_lists)
            ]
          );
          return readUintArray(
            outArray_sorts,
            sort_names.length
          );
        } finally {
          Mod._free(outArray_sorts);
        }
      },
      query_constructor: function(c, constr, num_fields) {
        let outArray_accessors = Mod._malloc(4 * num_fields);
        try {
          let ret = Mod.ccall(
            "Z3_query_constructor",
            "void",
            ["number", "number", "number", "number", "number", "number"],
            [
              c,
              constr,
              num_fields,
              outAddress,
              outAddress + 4,
              outArray_accessors
            ]
          );
          return {
            constructor: getOutUint(0),
            tester: getOutUint(1),
            accessors: readUintArray(
              outArray_accessors,
              num_fields
            )
          };
        } finally {
          Mod._free(outArray_accessors);
        }
      },
      mk_func_decl: function(c, s, domain, range) {
        return Mod.ccall(
          "Z3_mk_func_decl",
          "number",
          ["number", "number", "number", "array", "number"],
          [
            c,
            s,
            domain.length,
            intArrayToByteArr(domain),
            range
          ]
        );
      },
      mk_app: function(c, d, args) {
        return Mod.ccall(
          "Z3_mk_app",
          "number",
          ["number", "number", "number", "array"],
          [c, d, args.length, intArrayToByteArr(args)]
        );
      },
      mk_const: Mod._Z3_mk_const,
      mk_fresh_func_decl: function(c, prefix, domain, range) {
        return Mod.ccall(
          "Z3_mk_fresh_func_decl",
          "number",
          ["number", "string", "number", "array", "number"],
          [
            c,
            prefix,
            domain.length,
            intArrayToByteArr(domain),
            range
          ]
        );
      },
      mk_fresh_const: function(c, prefix, ty) {
        return Mod.ccall(
          "Z3_mk_fresh_const",
          "number",
          ["number", "string", "number"],
          [c, prefix, ty]
        );
      },
      mk_rec_func_decl: function(c, s, domain, range) {
        return Mod.ccall(
          "Z3_mk_rec_func_decl",
          "number",
          ["number", "number", "number", "array", "number"],
          [
            c,
            s,
            domain.length,
            intArrayToByteArr(domain),
            range
          ]
        );
      },
      add_rec_def: function(c, f, args, body) {
        return Mod.ccall(
          "Z3_add_rec_def",
          "void",
          ["number", "number", "number", "array", "number"],
          [
            c,
            f,
            args.length,
            intArrayToByteArr(args),
            body
          ]
        );
      },
      mk_true: Mod._Z3_mk_true,
      mk_false: Mod._Z3_mk_false,
      mk_eq: Mod._Z3_mk_eq,
      mk_distinct: function(c, args) {
        return Mod.ccall(
          "Z3_mk_distinct",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_not: Mod._Z3_mk_not,
      mk_ite: Mod._Z3_mk_ite,
      mk_iff: Mod._Z3_mk_iff,
      mk_implies: Mod._Z3_mk_implies,
      mk_xor: Mod._Z3_mk_xor,
      mk_and: function(c, args) {
        return Mod.ccall(
          "Z3_mk_and",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_or: function(c, args) {
        return Mod.ccall(
          "Z3_mk_or",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_add: function(c, args) {
        return Mod.ccall(
          "Z3_mk_add",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_mul: function(c, args) {
        return Mod.ccall(
          "Z3_mk_mul",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_sub: function(c, args) {
        return Mod.ccall(
          "Z3_mk_sub",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_unary_minus: Mod._Z3_mk_unary_minus,
      mk_div: Mod._Z3_mk_div,
      mk_mod: Mod._Z3_mk_mod,
      mk_rem: Mod._Z3_mk_rem,
      mk_power: Mod._Z3_mk_power,
      mk_abs: Mod._Z3_mk_abs,
      mk_lt: Mod._Z3_mk_lt,
      mk_le: Mod._Z3_mk_le,
      mk_gt: Mod._Z3_mk_gt,
      mk_ge: Mod._Z3_mk_ge,
      mk_divides: Mod._Z3_mk_divides,
      mk_int2real: Mod._Z3_mk_int2real,
      mk_real2int: Mod._Z3_mk_real2int,
      mk_is_int: Mod._Z3_mk_is_int,
      mk_bvnot: Mod._Z3_mk_bvnot,
      mk_bvredand: Mod._Z3_mk_bvredand,
      mk_bvredor: Mod._Z3_mk_bvredor,
      mk_bvand: Mod._Z3_mk_bvand,
      mk_bvor: Mod._Z3_mk_bvor,
      mk_bvxor: Mod._Z3_mk_bvxor,
      mk_bvnand: Mod._Z3_mk_bvnand,
      mk_bvnor: Mod._Z3_mk_bvnor,
      mk_bvxnor: Mod._Z3_mk_bvxnor,
      mk_bvneg: Mod._Z3_mk_bvneg,
      mk_bvadd: Mod._Z3_mk_bvadd,
      mk_bvsub: Mod._Z3_mk_bvsub,
      mk_bvmul: Mod._Z3_mk_bvmul,
      mk_bvudiv: Mod._Z3_mk_bvudiv,
      mk_bvsdiv: Mod._Z3_mk_bvsdiv,
      mk_bvurem: Mod._Z3_mk_bvurem,
      mk_bvsrem: Mod._Z3_mk_bvsrem,
      mk_bvsmod: Mod._Z3_mk_bvsmod,
      mk_bvult: Mod._Z3_mk_bvult,
      mk_bvslt: Mod._Z3_mk_bvslt,
      mk_bvule: Mod._Z3_mk_bvule,
      mk_bvsle: Mod._Z3_mk_bvsle,
      mk_bvuge: Mod._Z3_mk_bvuge,
      mk_bvsge: Mod._Z3_mk_bvsge,
      mk_bvugt: Mod._Z3_mk_bvugt,
      mk_bvsgt: Mod._Z3_mk_bvsgt,
      mk_concat: Mod._Z3_mk_concat,
      mk_extract: Mod._Z3_mk_extract,
      mk_sign_ext: Mod._Z3_mk_sign_ext,
      mk_zero_ext: Mod._Z3_mk_zero_ext,
      mk_repeat: Mod._Z3_mk_repeat,
      mk_bit2bool: Mod._Z3_mk_bit2bool,
      mk_bvshl: Mod._Z3_mk_bvshl,
      mk_bvlshr: Mod._Z3_mk_bvlshr,
      mk_bvashr: Mod._Z3_mk_bvashr,
      mk_rotate_left: Mod._Z3_mk_rotate_left,
      mk_rotate_right: Mod._Z3_mk_rotate_right,
      mk_ext_rotate_left: Mod._Z3_mk_ext_rotate_left,
      mk_ext_rotate_right: Mod._Z3_mk_ext_rotate_right,
      mk_int2bv: Mod._Z3_mk_int2bv,
      mk_bv2int: Mod._Z3_mk_bv2int,
      mk_bvadd_no_overflow: Mod._Z3_mk_bvadd_no_overflow,
      mk_bvadd_no_underflow: Mod._Z3_mk_bvadd_no_underflow,
      mk_bvsub_no_overflow: Mod._Z3_mk_bvsub_no_overflow,
      mk_bvsub_no_underflow: Mod._Z3_mk_bvsub_no_underflow,
      mk_bvsdiv_no_overflow: Mod._Z3_mk_bvsdiv_no_overflow,
      mk_bvneg_no_overflow: Mod._Z3_mk_bvneg_no_overflow,
      mk_bvmul_no_overflow: Mod._Z3_mk_bvmul_no_overflow,
      mk_bvmul_no_underflow: Mod._Z3_mk_bvmul_no_underflow,
      mk_select: Mod._Z3_mk_select,
      mk_select_n: function(c, a, idxs) {
        return Mod.ccall(
          "Z3_mk_select_n",
          "number",
          ["number", "number", "number", "array"],
          [c, a, idxs.length, intArrayToByteArr(idxs)]
        );
      },
      mk_store: Mod._Z3_mk_store,
      mk_store_n: function(c, a, idxs, v) {
        return Mod.ccall(
          "Z3_mk_store_n",
          "number",
          ["number", "number", "number", "array", "number"],
          [
            c,
            a,
            idxs.length,
            intArrayToByteArr(idxs),
            v
          ]
        );
      },
      mk_const_array: Mod._Z3_mk_const_array,
      mk_map: function(c, f, args) {
        return Mod.ccall(
          "Z3_mk_map",
          "number",
          ["number", "number", "number", "array"],
          [c, f, args.length, intArrayToByteArr(args)]
        );
      },
      mk_array_default: Mod._Z3_mk_array_default,
      mk_as_array: Mod._Z3_mk_as_array,
      mk_set_sort: Mod._Z3_mk_set_sort,
      mk_empty_set: Mod._Z3_mk_empty_set,
      mk_full_set: Mod._Z3_mk_full_set,
      mk_set_add: Mod._Z3_mk_set_add,
      mk_set_del: Mod._Z3_mk_set_del,
      mk_set_union: function(c, args) {
        return Mod.ccall(
          "Z3_mk_set_union",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_set_intersect: function(c, args) {
        return Mod.ccall(
          "Z3_mk_set_intersect",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_set_difference: Mod._Z3_mk_set_difference,
      mk_set_complement: Mod._Z3_mk_set_complement,
      mk_set_member: Mod._Z3_mk_set_member,
      mk_set_subset: Mod._Z3_mk_set_subset,
      mk_array_ext: Mod._Z3_mk_array_ext,
      mk_numeral: function(c, numeral, ty) {
        return Mod.ccall(
          "Z3_mk_numeral",
          "number",
          ["number", "string", "number"],
          [c, numeral, ty]
        );
      },
      mk_real: Mod._Z3_mk_real,
      mk_real_int64: Mod._Z3_mk_real_int64,
      mk_int: Mod._Z3_mk_int,
      mk_unsigned_int: Mod._Z3_mk_unsigned_int,
      mk_int64: Mod._Z3_mk_int64,
      mk_unsigned_int64: Mod._Z3_mk_unsigned_int64,
      mk_bv_numeral: function(c, bits) {
        return Mod.ccall(
          "Z3_mk_bv_numeral",
          "number",
          ["number", "number", "array"],
          [c, bits.length, boolArrayToByteArr(bits)]
        );
      },
      mk_seq_sort: Mod._Z3_mk_seq_sort,
      is_seq_sort: function(c, s) {
        return Mod.ccall(
          "Z3_is_seq_sort",
          "boolean",
          ["number", "number"],
          [c, s]
        );
      },
      get_seq_sort_basis: Mod._Z3_get_seq_sort_basis,
      mk_re_sort: Mod._Z3_mk_re_sort,
      is_re_sort: function(c, s) {
        return Mod.ccall(
          "Z3_is_re_sort",
          "boolean",
          ["number", "number"],
          [c, s]
        );
      },
      get_re_sort_basis: Mod._Z3_get_re_sort_basis,
      mk_string_sort: Mod._Z3_mk_string_sort,
      mk_char_sort: Mod._Z3_mk_char_sort,
      is_string_sort: function(c, s) {
        return Mod.ccall(
          "Z3_is_string_sort",
          "boolean",
          ["number", "number"],
          [c, s]
        );
      },
      is_char_sort: function(c, s) {
        return Mod.ccall(
          "Z3_is_char_sort",
          "boolean",
          ["number", "number"],
          [c, s]
        );
      },
      mk_string: function(c, s) {
        return Mod.ccall(
          "Z3_mk_string",
          "number",
          ["number", "string"],
          [c, s]
        );
      },
      mk_lstring: function(c, len, s) {
        return Mod.ccall(
          "Z3_mk_lstring",
          "number",
          ["number", "number", "string"],
          [c, len, s]
        );
      },
      mk_u32string: function(c, chars) {
        return Mod.ccall(
          "Z3_mk_u32string",
          "number",
          ["number", "number", "array"],
          [c, chars.length, intArrayToByteArr(chars)]
        );
      },
      is_string: function(c, s) {
        return Mod.ccall(
          "Z3_is_string",
          "boolean",
          ["number", "number"],
          [c, s]
        );
      },
      get_string: function(c, s) {
        return Mod.ccall(
          "Z3_get_string",
          "string",
          ["number", "number"],
          [c, s]
        );
      },
      get_string_length: function(c, s) {
        let ret = Mod.ccall(
          "Z3_get_string_length",
          "number",
          ["number", "number"],
          [c, s]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_string_contents: function(c, s, length) {
        let outArray_contents = Mod._malloc(4 * length);
        try {
          let ret = Mod.ccall(
            "Z3_get_string_contents",
            "void",
            ["number", "number", "number", "number"],
            [c, s, length, outArray_contents]
          );
          return readUintArray(outArray_contents, length);
        } finally {
          Mod._free(outArray_contents);
        }
      },
      mk_seq_empty: Mod._Z3_mk_seq_empty,
      mk_seq_unit: Mod._Z3_mk_seq_unit,
      mk_seq_concat: function(c, args) {
        return Mod.ccall(
          "Z3_mk_seq_concat",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_seq_prefix: Mod._Z3_mk_seq_prefix,
      mk_seq_suffix: Mod._Z3_mk_seq_suffix,
      mk_seq_contains: Mod._Z3_mk_seq_contains,
      mk_str_lt: Mod._Z3_mk_str_lt,
      mk_str_le: Mod._Z3_mk_str_le,
      mk_seq_extract: Mod._Z3_mk_seq_extract,
      mk_seq_replace: Mod._Z3_mk_seq_replace,
      mk_seq_replace_all: Mod._Z3_mk_seq_replace_all,
      mk_seq_replace_re: Mod._Z3_mk_seq_replace_re,
      mk_seq_replace_re_all: Mod._Z3_mk_seq_replace_re_all,
      mk_seq_at: Mod._Z3_mk_seq_at,
      mk_seq_nth: Mod._Z3_mk_seq_nth,
      mk_seq_length: Mod._Z3_mk_seq_length,
      mk_seq_index: Mod._Z3_mk_seq_index,
      mk_seq_last_index: Mod._Z3_mk_seq_last_index,
      mk_seq_map: Mod._Z3_mk_seq_map,
      mk_seq_mapi: Mod._Z3_mk_seq_mapi,
      mk_seq_foldl: Mod._Z3_mk_seq_foldl,
      mk_seq_foldli: Mod._Z3_mk_seq_foldli,
      mk_str_to_int: Mod._Z3_mk_str_to_int,
      mk_int_to_str: Mod._Z3_mk_int_to_str,
      mk_string_to_code: Mod._Z3_mk_string_to_code,
      mk_string_from_code: Mod._Z3_mk_string_from_code,
      mk_ubv_to_str: Mod._Z3_mk_ubv_to_str,
      mk_sbv_to_str: Mod._Z3_mk_sbv_to_str,
      mk_seq_to_re: Mod._Z3_mk_seq_to_re,
      mk_seq_in_re: Mod._Z3_mk_seq_in_re,
      mk_re_plus: Mod._Z3_mk_re_plus,
      mk_re_star: Mod._Z3_mk_re_star,
      mk_re_option: Mod._Z3_mk_re_option,
      mk_re_union: function(c, args) {
        return Mod.ccall(
          "Z3_mk_re_union",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_re_concat: function(c, args) {
        return Mod.ccall(
          "Z3_mk_re_concat",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_re_range: Mod._Z3_mk_re_range,
      mk_re_allchar: Mod._Z3_mk_re_allchar,
      mk_re_loop: Mod._Z3_mk_re_loop,
      mk_re_power: Mod._Z3_mk_re_power,
      mk_re_intersect: function(c, args) {
        return Mod.ccall(
          "Z3_mk_re_intersect",
          "number",
          ["number", "number", "array"],
          [c, args.length, intArrayToByteArr(args)]
        );
      },
      mk_re_complement: Mod._Z3_mk_re_complement,
      mk_re_diff: Mod._Z3_mk_re_diff,
      mk_re_empty: Mod._Z3_mk_re_empty,
      mk_re_full: Mod._Z3_mk_re_full,
      mk_char: Mod._Z3_mk_char,
      mk_char_le: Mod._Z3_mk_char_le,
      mk_char_to_int: Mod._Z3_mk_char_to_int,
      mk_char_to_bv: Mod._Z3_mk_char_to_bv,
      mk_char_from_bv: Mod._Z3_mk_char_from_bv,
      mk_char_is_digit: Mod._Z3_mk_char_is_digit,
      mk_linear_order: Mod._Z3_mk_linear_order,
      mk_partial_order: Mod._Z3_mk_partial_order,
      mk_piecewise_linear_order: Mod._Z3_mk_piecewise_linear_order,
      mk_tree_order: Mod._Z3_mk_tree_order,
      mk_transitive_closure: Mod._Z3_mk_transitive_closure,
      mk_pattern: function(c, terms) {
        return Mod.ccall(
          "Z3_mk_pattern",
          "number",
          ["number", "number", "array"],
          [c, terms.length, intArrayToByteArr(terms)]
        );
      },
      mk_bound: Mod._Z3_mk_bound,
      mk_forall: function(c, weight, patterns, sorts, decl_names, body) {
        if (sorts.length !== decl_names.length) {
          throw new TypeError(
            `sorts and decl_names must be the same length (got ${sorts.length} and {decl_names.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_forall",
          "number",
          [
            "number",
            "number",
            "number",
            "array",
            "number",
            "array",
            "array",
            "number"
          ],
          [
            c,
            weight,
            patterns.length,
            intArrayToByteArr(patterns),
            sorts.length,
            intArrayToByteArr(sorts),
            intArrayToByteArr(decl_names),
            body
          ]
        );
      },
      mk_exists: function(c, weight, patterns, sorts, decl_names, body) {
        if (sorts.length !== decl_names.length) {
          throw new TypeError(
            `sorts and decl_names must be the same length (got ${sorts.length} and {decl_names.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_exists",
          "number",
          [
            "number",
            "number",
            "number",
            "array",
            "number",
            "array",
            "array",
            "number"
          ],
          [
            c,
            weight,
            patterns.length,
            intArrayToByteArr(patterns),
            sorts.length,
            intArrayToByteArr(sorts),
            intArrayToByteArr(decl_names),
            body
          ]
        );
      },
      mk_quantifier: function(c, is_forall, weight, patterns, sorts, decl_names, body) {
        if (sorts.length !== decl_names.length) {
          throw new TypeError(
            `sorts and decl_names must be the same length (got ${sorts.length} and {decl_names.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_quantifier",
          "number",
          [
            "number",
            "boolean",
            "number",
            "number",
            "array",
            "number",
            "array",
            "array",
            "number"
          ],
          [
            c,
            is_forall,
            weight,
            patterns.length,
            intArrayToByteArr(patterns),
            sorts.length,
            intArrayToByteArr(sorts),
            intArrayToByteArr(decl_names),
            body
          ]
        );
      },
      mk_quantifier_ex: function(c, is_forall, weight, quantifier_id, skolem_id, patterns, no_patterns, sorts, decl_names, body) {
        if (sorts.length !== decl_names.length) {
          throw new TypeError(
            `sorts and decl_names must be the same length (got ${sorts.length} and {decl_names.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_quantifier_ex",
          "number",
          [
            "number",
            "boolean",
            "number",
            "number",
            "number",
            "number",
            "array",
            "number",
            "array",
            "number",
            "array",
            "array",
            "number"
          ],
          [
            c,
            is_forall,
            weight,
            quantifier_id,
            skolem_id,
            patterns.length,
            intArrayToByteArr(patterns),
            no_patterns.length,
            intArrayToByteArr(no_patterns),
            sorts.length,
            intArrayToByteArr(sorts),
            intArrayToByteArr(decl_names),
            body
          ]
        );
      },
      mk_forall_const: function(c, weight, bound, patterns, body) {
        return Mod.ccall(
          "Z3_mk_forall_const",
          "number",
          ["number", "number", "number", "array", "number", "array", "number"],
          [
            c,
            weight,
            bound.length,
            intArrayToByteArr(bound),
            patterns.length,
            intArrayToByteArr(patterns),
            body
          ]
        );
      },
      mk_exists_const: function(c, weight, bound, patterns, body) {
        return Mod.ccall(
          "Z3_mk_exists_const",
          "number",
          ["number", "number", "number", "array", "number", "array", "number"],
          [
            c,
            weight,
            bound.length,
            intArrayToByteArr(bound),
            patterns.length,
            intArrayToByteArr(patterns),
            body
          ]
        );
      },
      mk_quantifier_const: function(c, is_forall, weight, bound, patterns, body) {
        return Mod.ccall(
          "Z3_mk_quantifier_const",
          "number",
          [
            "number",
            "boolean",
            "number",
            "number",
            "array",
            "number",
            "array",
            "number"
          ],
          [
            c,
            is_forall,
            weight,
            bound.length,
            intArrayToByteArr(bound),
            patterns.length,
            intArrayToByteArr(patterns),
            body
          ]
        );
      },
      mk_quantifier_const_ex: function(c, is_forall, weight, quantifier_id, skolem_id, bound, patterns, no_patterns, body) {
        return Mod.ccall(
          "Z3_mk_quantifier_const_ex",
          "number",
          [
            "number",
            "boolean",
            "number",
            "number",
            "number",
            "number",
            "array",
            "number",
            "array",
            "number",
            "array",
            "number"
          ],
          [
            c,
            is_forall,
            weight,
            quantifier_id,
            skolem_id,
            bound.length,
            intArrayToByteArr(bound),
            patterns.length,
            intArrayToByteArr(patterns),
            no_patterns.length,
            intArrayToByteArr(no_patterns),
            body
          ]
        );
      },
      mk_lambda: function(c, sorts, decl_names, body) {
        if (sorts.length !== decl_names.length) {
          throw new TypeError(
            `sorts and decl_names must be the same length (got ${sorts.length} and {decl_names.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_lambda",
          "number",
          ["number", "number", "array", "array", "number"],
          [
            c,
            sorts.length,
            intArrayToByteArr(sorts),
            intArrayToByteArr(decl_names),
            body
          ]
        );
      },
      mk_lambda_const: function(c, bound, body) {
        return Mod.ccall(
          "Z3_mk_lambda_const",
          "number",
          ["number", "number", "array", "number"],
          [
            c,
            bound.length,
            intArrayToByteArr(bound),
            body
          ]
        );
      },
      get_symbol_kind: Mod._Z3_get_symbol_kind,
      get_symbol_int: Mod._Z3_get_symbol_int,
      get_symbol_string: function(c, s) {
        return Mod.ccall(
          "Z3_get_symbol_string",
          "string",
          ["number", "number"],
          [c, s]
        );
      },
      get_sort_name: Mod._Z3_get_sort_name,
      get_sort_id: function(c, s) {
        let ret = Mod.ccall(
          "Z3_get_sort_id",
          "number",
          ["number", "number"],
          [c, s]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      sort_to_ast: Mod._Z3_sort_to_ast,
      is_eq_sort: function(c, s1, s2) {
        return Mod.ccall(
          "Z3_is_eq_sort",
          "boolean",
          ["number", "number", "number"],
          [c, s1, s2]
        );
      },
      get_sort_kind: Mod._Z3_get_sort_kind,
      get_bv_sort_size: function(c, t) {
        let ret = Mod.ccall(
          "Z3_get_bv_sort_size",
          "number",
          ["number", "number"],
          [c, t]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_finite_domain_sort_size: function(c, s) {
        let ret = Mod.ccall(
          "Z3_get_finite_domain_sort_size",
          "boolean",
          ["number", "number", "number"],
          [c, s, outAddress]
        );
        if (!ret) {
          return null;
        }
        return getOutUint64(0);
      },
      get_array_arity: function(c, s) {
        let ret = Mod.ccall(
          "Z3_get_array_arity",
          "number",
          ["number", "number"],
          [c, s]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_array_sort_domain: Mod._Z3_get_array_sort_domain,
      get_array_sort_domain_n: Mod._Z3_get_array_sort_domain_n,
      get_array_sort_range: Mod._Z3_get_array_sort_range,
      get_tuple_sort_mk_decl: Mod._Z3_get_tuple_sort_mk_decl,
      get_tuple_sort_num_fields: function(c, t) {
        let ret = Mod.ccall(
          "Z3_get_tuple_sort_num_fields",
          "number",
          ["number", "number"],
          [c, t]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_tuple_sort_field_decl: Mod._Z3_get_tuple_sort_field_decl,
      is_recursive_datatype_sort: function(c, s) {
        return Mod.ccall(
          "Z3_is_recursive_datatype_sort",
          "boolean",
          ["number", "number"],
          [c, s]
        );
      },
      get_datatype_sort_num_constructors: function(c, t) {
        let ret = Mod.ccall(
          "Z3_get_datatype_sort_num_constructors",
          "number",
          ["number", "number"],
          [c, t]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_datatype_sort_constructor: Mod._Z3_get_datatype_sort_constructor,
      get_datatype_sort_recognizer: Mod._Z3_get_datatype_sort_recognizer,
      get_datatype_sort_constructor_accessor: Mod._Z3_get_datatype_sort_constructor_accessor,
      datatype_update_field: Mod._Z3_datatype_update_field,
      get_relation_arity: function(c, s) {
        let ret = Mod.ccall(
          "Z3_get_relation_arity",
          "number",
          ["number", "number"],
          [c, s]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_relation_column: Mod._Z3_get_relation_column,
      mk_atmost: function(c, args, k) {
        return Mod.ccall(
          "Z3_mk_atmost",
          "number",
          ["number", "number", "array", "number"],
          [c, args.length, intArrayToByteArr(args), k]
        );
      },
      mk_atleast: function(c, args, k) {
        return Mod.ccall(
          "Z3_mk_atleast",
          "number",
          ["number", "number", "array", "number"],
          [c, args.length, intArrayToByteArr(args), k]
        );
      },
      mk_pble: function(c, args, coeffs, k) {
        if (args.length !== coeffs.length) {
          throw new TypeError(
            `args and coeffs must be the same length (got ${args.length} and {coeffs.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_pble",
          "number",
          ["number", "number", "array", "array", "number"],
          [
            c,
            args.length,
            intArrayToByteArr(args),
            intArrayToByteArr(coeffs),
            k
          ]
        );
      },
      mk_pbge: function(c, args, coeffs, k) {
        if (args.length !== coeffs.length) {
          throw new TypeError(
            `args and coeffs must be the same length (got ${args.length} and {coeffs.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_pbge",
          "number",
          ["number", "number", "array", "array", "number"],
          [
            c,
            args.length,
            intArrayToByteArr(args),
            intArrayToByteArr(coeffs),
            k
          ]
        );
      },
      mk_pbeq: function(c, args, coeffs, k) {
        if (args.length !== coeffs.length) {
          throw new TypeError(
            `args and coeffs must be the same length (got ${args.length} and {coeffs.length})`
          );
        }
        return Mod.ccall(
          "Z3_mk_pbeq",
          "number",
          ["number", "number", "array", "array", "number"],
          [
            c,
            args.length,
            intArrayToByteArr(args),
            intArrayToByteArr(coeffs),
            k
          ]
        );
      },
      func_decl_to_ast: Mod._Z3_func_decl_to_ast,
      is_eq_func_decl: function(c, f1, f2) {
        return Mod.ccall(
          "Z3_is_eq_func_decl",
          "boolean",
          ["number", "number", "number"],
          [c, f1, f2]
        );
      },
      get_func_decl_id: function(c, f) {
        let ret = Mod.ccall(
          "Z3_get_func_decl_id",
          "number",
          ["number", "number"],
          [c, f]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_decl_name: Mod._Z3_get_decl_name,
      get_decl_kind: Mod._Z3_get_decl_kind,
      get_domain_size: function(c, d) {
        let ret = Mod.ccall(
          "Z3_get_domain_size",
          "number",
          ["number", "number"],
          [c, d]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_arity: function(c, d) {
        let ret = Mod.ccall(
          "Z3_get_arity",
          "number",
          ["number", "number"],
          [c, d]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_domain: Mod._Z3_get_domain,
      get_range: Mod._Z3_get_range,
      get_decl_num_parameters: function(c, d) {
        let ret = Mod.ccall(
          "Z3_get_decl_num_parameters",
          "number",
          ["number", "number"],
          [c, d]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_decl_parameter_kind: Mod._Z3_get_decl_parameter_kind,
      get_decl_int_parameter: Mod._Z3_get_decl_int_parameter,
      get_decl_double_parameter: Mod._Z3_get_decl_double_parameter,
      get_decl_symbol_parameter: Mod._Z3_get_decl_symbol_parameter,
      get_decl_sort_parameter: Mod._Z3_get_decl_sort_parameter,
      get_decl_ast_parameter: Mod._Z3_get_decl_ast_parameter,
      get_decl_func_decl_parameter: Mod._Z3_get_decl_func_decl_parameter,
      get_decl_rational_parameter: function(c, d, idx) {
        return Mod.ccall(
          "Z3_get_decl_rational_parameter",
          "string",
          ["number", "number", "number"],
          [c, d, idx]
        );
      },
      app_to_ast: Mod._Z3_app_to_ast,
      get_app_decl: Mod._Z3_get_app_decl,
      get_app_num_args: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_app_num_args",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_app_arg: Mod._Z3_get_app_arg,
      is_eq_ast: function(c, t1, t2) {
        return Mod.ccall(
          "Z3_is_eq_ast",
          "boolean",
          ["number", "number", "number"],
          [c, t1, t2]
        );
      },
      get_ast_id: function(c, t) {
        let ret = Mod.ccall(
          "Z3_get_ast_id",
          "number",
          ["number", "number"],
          [c, t]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_ast_hash: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_ast_hash",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_sort: Mod._Z3_get_sort,
      is_well_sorted: function(c, t) {
        return Mod.ccall(
          "Z3_is_well_sorted",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      get_bool_value: Mod._Z3_get_bool_value,
      get_ast_kind: Mod._Z3_get_ast_kind,
      is_app: function(c, a) {
        return Mod.ccall("Z3_is_app", "boolean", ["number", "number"], [c, a]);
      },
      is_ground: function(c, a) {
        return Mod.ccall(
          "Z3_is_ground",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      get_depth: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_depth",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      is_numeral_ast: function(c, a) {
        return Mod.ccall(
          "Z3_is_numeral_ast",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      is_algebraic_number: function(c, a) {
        return Mod.ccall(
          "Z3_is_algebraic_number",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      to_app: Mod._Z3_to_app,
      to_func_decl: Mod._Z3_to_func_decl,
      get_numeral_string: function(c, a) {
        return Mod.ccall(
          "Z3_get_numeral_string",
          "string",
          ["number", "number"],
          [c, a]
        );
      },
      get_numeral_binary_string: function(c, a) {
        return Mod.ccall(
          "Z3_get_numeral_binary_string",
          "string",
          ["number", "number"],
          [c, a]
        );
      },
      get_numeral_decimal_string: function(c, a, precision) {
        return Mod.ccall(
          "Z3_get_numeral_decimal_string",
          "string",
          ["number", "number", "number"],
          [c, a, precision]
        );
      },
      get_numeral_double: Mod._Z3_get_numeral_double,
      get_numerator: Mod._Z3_get_numerator,
      get_denominator: Mod._Z3_get_denominator,
      get_numeral_small: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_numeral_small",
          "boolean",
          ["number", "number", "number", "number"],
          [c, a, outAddress, outAddress + 8]
        );
        if (!ret) {
          return null;
        }
        return { num: getOutInt64(0), den: getOutInt64(1) };
      },
      get_numeral_int: function(c, v) {
        let ret = Mod.ccall(
          "Z3_get_numeral_int",
          "boolean",
          ["number", "number", "number"],
          [c, v, outAddress]
        );
        if (!ret) {
          return null;
        }
        return getOutInt(0);
      },
      get_numeral_uint: function(c, v) {
        let ret = Mod.ccall(
          "Z3_get_numeral_uint",
          "boolean",
          ["number", "number", "number"],
          [c, v, outAddress]
        );
        if (!ret) {
          return null;
        }
        return getOutUint(0);
      },
      get_numeral_uint64: function(c, v) {
        let ret = Mod.ccall(
          "Z3_get_numeral_uint64",
          "boolean",
          ["number", "number", "number"],
          [c, v, outAddress]
        );
        if (!ret) {
          return null;
        }
        return getOutUint64(0);
      },
      get_numeral_int64: function(c, v) {
        let ret = Mod.ccall(
          "Z3_get_numeral_int64",
          "boolean",
          ["number", "number", "number"],
          [c, v, outAddress]
        );
        if (!ret) {
          return null;
        }
        return getOutInt64(0);
      },
      get_numeral_rational_int64: function(c, v) {
        let ret = Mod.ccall(
          "Z3_get_numeral_rational_int64",
          "boolean",
          ["number", "number", "number", "number"],
          [c, v, outAddress, outAddress + 8]
        );
        if (!ret) {
          return null;
        }
        return { num: getOutInt64(0), den: getOutInt64(1) };
      },
      get_algebraic_number_lower: Mod._Z3_get_algebraic_number_lower,
      get_algebraic_number_upper: Mod._Z3_get_algebraic_number_upper,
      pattern_to_ast: Mod._Z3_pattern_to_ast,
      get_pattern_num_terms: function(c, p) {
        let ret = Mod.ccall(
          "Z3_get_pattern_num_terms",
          "number",
          ["number", "number"],
          [c, p]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_pattern: Mod._Z3_get_pattern,
      get_index_value: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_index_value",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      is_quantifier_forall: function(c, a) {
        return Mod.ccall(
          "Z3_is_quantifier_forall",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      is_quantifier_exists: function(c, a) {
        return Mod.ccall(
          "Z3_is_quantifier_exists",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      is_lambda: function(c, a) {
        return Mod.ccall(
          "Z3_is_lambda",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      get_quantifier_weight: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_quantifier_weight",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_quantifier_skolem_id: Mod._Z3_get_quantifier_skolem_id,
      get_quantifier_id: Mod._Z3_get_quantifier_id,
      get_quantifier_num_patterns: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_quantifier_num_patterns",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_quantifier_pattern_ast: Mod._Z3_get_quantifier_pattern_ast,
      get_quantifier_num_no_patterns: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_quantifier_num_no_patterns",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_quantifier_no_pattern_ast: Mod._Z3_get_quantifier_no_pattern_ast,
      get_quantifier_num_bound: function(c, a) {
        let ret = Mod.ccall(
          "Z3_get_quantifier_num_bound",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_quantifier_bound_name: Mod._Z3_get_quantifier_bound_name,
      get_quantifier_bound_sort: Mod._Z3_get_quantifier_bound_sort,
      get_quantifier_body: Mod._Z3_get_quantifier_body,
      simplify: Mod._Z3_simplify,
      simplify_ex: Mod._Z3_simplify_ex,
      simplify_get_help: function(c) {
        return Mod.ccall("Z3_simplify_get_help", "string", ["number"], [c]);
      },
      simplify_get_param_descrs: Mod._Z3_simplify_get_param_descrs,
      update_term: function(c, a, args) {
        return Mod.ccall(
          "Z3_update_term",
          "number",
          ["number", "number", "number", "array"],
          [c, a, args.length, intArrayToByteArr(args)]
        );
      },
      substitute: function(c, a, from, to) {
        if (from.length !== to.length) {
          throw new TypeError(
            `from and to must be the same length (got ${from.length} and {to.length})`
          );
        }
        return Mod.ccall(
          "Z3_substitute",
          "number",
          ["number", "number", "number", "array", "array"],
          [
            c,
            a,
            from.length,
            intArrayToByteArr(from),
            intArrayToByteArr(to)
          ]
        );
      },
      substitute_vars: function(c, a, to) {
        return Mod.ccall(
          "Z3_substitute_vars",
          "number",
          ["number", "number", "number", "array"],
          [c, a, to.length, intArrayToByteArr(to)]
        );
      },
      substitute_funs: function(c, a, from, to) {
        if (from.length !== to.length) {
          throw new TypeError(
            `from and to must be the same length (got ${from.length} and {to.length})`
          );
        }
        return Mod.ccall(
          "Z3_substitute_funs",
          "number",
          ["number", "number", "number", "array", "array"],
          [
            c,
            a,
            from.length,
            intArrayToByteArr(from),
            intArrayToByteArr(to)
          ]
        );
      },
      translate: Mod._Z3_translate,
      mk_model: Mod._Z3_mk_model,
      model_inc_ref: Mod._Z3_model_inc_ref,
      model_dec_ref: Mod._Z3_model_dec_ref,
      model_eval: function(c, m, t, model_completion) {
        let ret = Mod.ccall(
          "Z3_model_eval",
          "boolean",
          ["number", "number", "number", "boolean", "number"],
          [c, m, t, model_completion, outAddress]
        );
        if (!ret) {
          return null;
        }
        return getOutUint(0);
      },
      model_get_const_interp: Mod._Z3_model_get_const_interp,
      model_has_interp: function(c, m, a) {
        return Mod.ccall(
          "Z3_model_has_interp",
          "boolean",
          ["number", "number", "number"],
          [c, m, a]
        );
      },
      model_get_func_interp: Mod._Z3_model_get_func_interp,
      model_get_num_consts: function(c, m) {
        let ret = Mod.ccall(
          "Z3_model_get_num_consts",
          "number",
          ["number", "number"],
          [c, m]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      model_get_const_decl: Mod._Z3_model_get_const_decl,
      model_get_num_funcs: function(c, m) {
        let ret = Mod.ccall(
          "Z3_model_get_num_funcs",
          "number",
          ["number", "number"],
          [c, m]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      model_get_func_decl: Mod._Z3_model_get_func_decl,
      model_get_num_sorts: function(c, m) {
        let ret = Mod.ccall(
          "Z3_model_get_num_sorts",
          "number",
          ["number", "number"],
          [c, m]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      model_get_sort: Mod._Z3_model_get_sort,
      model_get_sort_universe: Mod._Z3_model_get_sort_universe,
      model_translate: Mod._Z3_model_translate,
      is_as_array: function(c, a) {
        return Mod.ccall(
          "Z3_is_as_array",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      get_as_array_func_decl: Mod._Z3_get_as_array_func_decl,
      add_func_interp: Mod._Z3_add_func_interp,
      add_const_interp: Mod._Z3_add_const_interp,
      func_interp_inc_ref: Mod._Z3_func_interp_inc_ref,
      func_interp_dec_ref: Mod._Z3_func_interp_dec_ref,
      func_interp_get_num_entries: function(c, f) {
        let ret = Mod.ccall(
          "Z3_func_interp_get_num_entries",
          "number",
          ["number", "number"],
          [c, f]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      func_interp_get_entry: Mod._Z3_func_interp_get_entry,
      func_interp_get_else: Mod._Z3_func_interp_get_else,
      func_interp_set_else: Mod._Z3_func_interp_set_else,
      func_interp_get_arity: function(c, f) {
        let ret = Mod.ccall(
          "Z3_func_interp_get_arity",
          "number",
          ["number", "number"],
          [c, f]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      func_interp_add_entry: Mod._Z3_func_interp_add_entry,
      func_entry_inc_ref: Mod._Z3_func_entry_inc_ref,
      func_entry_dec_ref: Mod._Z3_func_entry_dec_ref,
      func_entry_get_value: Mod._Z3_func_entry_get_value,
      func_entry_get_num_args: function(c, e) {
        let ret = Mod.ccall(
          "Z3_func_entry_get_num_args",
          "number",
          ["number", "number"],
          [c, e]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      func_entry_get_arg: Mod._Z3_func_entry_get_arg,
      open_log: function(filename) {
        return Mod.ccall("Z3_open_log", "boolean", ["string"], [filename]);
      },
      append_log: function(string) {
        return Mod.ccall("Z3_append_log", "void", ["string"], [string]);
      },
      close_log: Mod._Z3_close_log,
      toggle_warning_messages: Mod._Z3_toggle_warning_messages,
      set_ast_print_mode: Mod._Z3_set_ast_print_mode,
      ast_to_string: function(c, a) {
        return Mod.ccall(
          "Z3_ast_to_string",
          "string",
          ["number", "number"],
          [c, a]
        );
      },
      pattern_to_string: function(c, p) {
        return Mod.ccall(
          "Z3_pattern_to_string",
          "string",
          ["number", "number"],
          [c, p]
        );
      },
      sort_to_string: function(c, s) {
        return Mod.ccall(
          "Z3_sort_to_string",
          "string",
          ["number", "number"],
          [c, s]
        );
      },
      func_decl_to_string: function(c, d) {
        return Mod.ccall(
          "Z3_func_decl_to_string",
          "string",
          ["number", "number"],
          [c, d]
        );
      },
      model_to_string: function(c, m) {
        return Mod.ccall(
          "Z3_model_to_string",
          "string",
          ["number", "number"],
          [c, m]
        );
      },
      benchmark_to_smtlib_string: function(c, name, logic, status, attributes, assumptions, formula) {
        return Mod.ccall(
          "Z3_benchmark_to_smtlib_string",
          "string",
          [
            "number",
            "string",
            "string",
            "string",
            "string",
            "number",
            "array",
            "number"
          ],
          [
            c,
            name,
            logic,
            status,
            attributes,
            assumptions.length,
            intArrayToByteArr(assumptions),
            formula
          ]
        );
      },
      parse_smtlib2_string: function(c, str, sort_names, sorts, decl_names, decls) {
        if (sort_names.length !== sorts.length) {
          throw new TypeError(
            `sort_names and sorts must be the same length (got ${sort_names.length} and {sorts.length})`
          );
        }
        if (decl_names.length !== decls.length) {
          throw new TypeError(
            `decl_names and decls must be the same length (got ${decl_names.length} and {decls.length})`
          );
        }
        return Mod.ccall(
          "Z3_parse_smtlib2_string",
          "number",
          [
            "number",
            "string",
            "number",
            "array",
            "array",
            "number",
            "array",
            "array"
          ],
          [
            c,
            str,
            sort_names.length,
            intArrayToByteArr(sort_names),
            intArrayToByteArr(sorts),
            decl_names.length,
            intArrayToByteArr(decl_names),
            intArrayToByteArr(decls)
          ]
        );
      },
      parse_smtlib2_file: function(c, file_name, sort_names, sorts, decl_names, decls) {
        if (sort_names.length !== sorts.length) {
          throw new TypeError(
            `sort_names and sorts must be the same length (got ${sort_names.length} and {sorts.length})`
          );
        }
        if (decl_names.length !== decls.length) {
          throw new TypeError(
            `decl_names and decls must be the same length (got ${decl_names.length} and {decls.length})`
          );
        }
        return Mod.ccall(
          "Z3_parse_smtlib2_file",
          "number",
          [
            "number",
            "string",
            "number",
            "array",
            "array",
            "number",
            "array",
            "array"
          ],
          [
            c,
            file_name,
            sort_names.length,
            intArrayToByteArr(sort_names),
            intArrayToByteArr(sorts),
            decl_names.length,
            intArrayToByteArr(decl_names),
            intArrayToByteArr(decls)
          ]
        );
      },
      eval_smtlib2_string: function(c, str) {
        return Mod.ccall(
          "Z3_eval_smtlib2_string",
          "string",
          ["number", "string"],
          [c, str]
        );
      },
      mk_parser_context: Mod._Z3_mk_parser_context,
      parser_context_inc_ref: Mod._Z3_parser_context_inc_ref,
      parser_context_dec_ref: Mod._Z3_parser_context_dec_ref,
      parser_context_add_sort: Mod._Z3_parser_context_add_sort,
      parser_context_add_decl: Mod._Z3_parser_context_add_decl,
      parser_context_from_string: function(c, pc, s) {
        return Mod.ccall(
          "Z3_parser_context_from_string",
          "number",
          ["number", "number", "string"],
          [c, pc, s]
        );
      },
      get_error_code: Mod._Z3_get_error_code,
      set_error: Mod._Z3_set_error,
      get_error_msg: function(c, err) {
        return Mod.ccall(
          "Z3_get_error_msg",
          "string",
          ["number", "number"],
          [c, err]
        );
      },
      get_version: function() {
        let ret = Mod.ccall(
          "Z3_get_version",
          "void",
          ["number", "number", "number", "number"],
          [outAddress, outAddress + 4, outAddress + 8, outAddress + 12]
        );
        return {
          major: getOutUint(0),
          minor: getOutUint(1),
          build_number: getOutUint(2),
          revision_number: getOutUint(3)
        };
      },
      get_full_version: function() {
        return Mod.ccall("Z3_get_full_version", "string", [], []);
      },
      enable_trace: function(tag) {
        return Mod.ccall("Z3_enable_trace", "void", ["string"], [tag]);
      },
      disable_trace: function(tag) {
        return Mod.ccall("Z3_disable_trace", "void", ["string"], [tag]);
      },
      reset_memory: Mod._Z3_reset_memory,
      finalize_memory: Mod._Z3_finalize_memory,
      mk_goal: Mod._Z3_mk_goal,
      goal_inc_ref: Mod._Z3_goal_inc_ref,
      goal_dec_ref: Mod._Z3_goal_dec_ref,
      goal_precision: Mod._Z3_goal_precision,
      goal_assert: Mod._Z3_goal_assert,
      goal_inconsistent: function(c, g) {
        return Mod.ccall(
          "Z3_goal_inconsistent",
          "boolean",
          ["number", "number"],
          [c, g]
        );
      },
      goal_depth: function(c, g) {
        let ret = Mod.ccall(
          "Z3_goal_depth",
          "number",
          ["number", "number"],
          [c, g]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      goal_reset: Mod._Z3_goal_reset,
      goal_size: function(c, g) {
        let ret = Mod.ccall(
          "Z3_goal_size",
          "number",
          ["number", "number"],
          [c, g]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      goal_formula: Mod._Z3_goal_formula,
      goal_num_exprs: function(c, g) {
        let ret = Mod.ccall(
          "Z3_goal_num_exprs",
          "number",
          ["number", "number"],
          [c, g]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      goal_is_decided_sat: function(c, g) {
        return Mod.ccall(
          "Z3_goal_is_decided_sat",
          "boolean",
          ["number", "number"],
          [c, g]
        );
      },
      goal_is_decided_unsat: function(c, g) {
        return Mod.ccall(
          "Z3_goal_is_decided_unsat",
          "boolean",
          ["number", "number"],
          [c, g]
        );
      },
      goal_translate: Mod._Z3_goal_translate,
      goal_convert_model: Mod._Z3_goal_convert_model,
      goal_to_string: function(c, g) {
        return Mod.ccall(
          "Z3_goal_to_string",
          "string",
          ["number", "number"],
          [c, g]
        );
      },
      goal_to_dimacs_string: function(c, g, include_names) {
        return Mod.ccall(
          "Z3_goal_to_dimacs_string",
          "string",
          ["number", "number", "boolean"],
          [c, g, include_names]
        );
      },
      mk_tactic: function(c, name) {
        return Mod.ccall(
          "Z3_mk_tactic",
          "number",
          ["number", "string"],
          [c, name]
        );
      },
      tactic_inc_ref: Mod._Z3_tactic_inc_ref,
      tactic_dec_ref: Mod._Z3_tactic_dec_ref,
      mk_probe: function(c, name) {
        return Mod.ccall(
          "Z3_mk_probe",
          "number",
          ["number", "string"],
          [c, name]
        );
      },
      probe_inc_ref: Mod._Z3_probe_inc_ref,
      probe_dec_ref: Mod._Z3_probe_dec_ref,
      tactic_and_then: Mod._Z3_tactic_and_then,
      tactic_or_else: Mod._Z3_tactic_or_else,
      tactic_par_or: function(c, ts) {
        return Mod.ccall(
          "Z3_tactic_par_or",
          "number",
          ["number", "number", "array"],
          [c, ts.length, intArrayToByteArr(ts)]
        );
      },
      tactic_par_and_then: Mod._Z3_tactic_par_and_then,
      tactic_try_for: Mod._Z3_tactic_try_for,
      tactic_when: Mod._Z3_tactic_when,
      tactic_cond: Mod._Z3_tactic_cond,
      tactic_repeat: Mod._Z3_tactic_repeat,
      tactic_skip: Mod._Z3_tactic_skip,
      tactic_fail: Mod._Z3_tactic_fail,
      tactic_fail_if: Mod._Z3_tactic_fail_if,
      tactic_fail_if_not_decided: Mod._Z3_tactic_fail_if_not_decided,
      tactic_using_params: Mod._Z3_tactic_using_params,
      mk_simplifier: function(c, name) {
        return Mod.ccall(
          "Z3_mk_simplifier",
          "number",
          ["number", "string"],
          [c, name]
        );
      },
      simplifier_inc_ref: Mod._Z3_simplifier_inc_ref,
      simplifier_dec_ref: Mod._Z3_simplifier_dec_ref,
      solver_add_simplifier: Mod._Z3_solver_add_simplifier,
      simplifier_and_then: Mod._Z3_simplifier_and_then,
      simplifier_using_params: Mod._Z3_simplifier_using_params,
      get_num_simplifiers: function(c) {
        let ret = Mod.ccall(
          "Z3_get_num_simplifiers",
          "number",
          ["number"],
          [c]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_simplifier_name: function(c, i) {
        return Mod.ccall(
          "Z3_get_simplifier_name",
          "string",
          ["number", "number"],
          [c, i]
        );
      },
      simplifier_get_help: function(c, t) {
        return Mod.ccall(
          "Z3_simplifier_get_help",
          "string",
          ["number", "number"],
          [c, t]
        );
      },
      simplifier_get_param_descrs: Mod._Z3_simplifier_get_param_descrs,
      simplifier_get_descr: function(c, name) {
        return Mod.ccall(
          "Z3_simplifier_get_descr",
          "string",
          ["number", "string"],
          [c, name]
        );
      },
      probe_const: Mod._Z3_probe_const,
      probe_lt: Mod._Z3_probe_lt,
      probe_gt: Mod._Z3_probe_gt,
      probe_le: Mod._Z3_probe_le,
      probe_ge: Mod._Z3_probe_ge,
      probe_eq: Mod._Z3_probe_eq,
      probe_and: Mod._Z3_probe_and,
      probe_or: Mod._Z3_probe_or,
      probe_not: Mod._Z3_probe_not,
      get_num_tactics: function(c) {
        let ret = Mod.ccall("Z3_get_num_tactics", "number", ["number"], [c]);
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_tactic_name: function(c, i) {
        return Mod.ccall(
          "Z3_get_tactic_name",
          "string",
          ["number", "number"],
          [c, i]
        );
      },
      get_num_probes: function(c) {
        let ret = Mod.ccall("Z3_get_num_probes", "number", ["number"], [c]);
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      get_probe_name: function(c, i) {
        return Mod.ccall(
          "Z3_get_probe_name",
          "string",
          ["number", "number"],
          [c, i]
        );
      },
      tactic_get_help: function(c, t) {
        return Mod.ccall(
          "Z3_tactic_get_help",
          "string",
          ["number", "number"],
          [c, t]
        );
      },
      tactic_get_param_descrs: Mod._Z3_tactic_get_param_descrs,
      tactic_get_descr: function(c, name) {
        return Mod.ccall(
          "Z3_tactic_get_descr",
          "string",
          ["number", "string"],
          [c, name]
        );
      },
      probe_get_descr: function(c, name) {
        return Mod.ccall(
          "Z3_probe_get_descr",
          "string",
          ["number", "string"],
          [c, name]
        );
      },
      probe_apply: Mod._Z3_probe_apply,
      tactic_apply: Mod._Z3_tactic_apply,
      tactic_apply_ex: Mod._Z3_tactic_apply_ex,
      apply_result_inc_ref: Mod._Z3_apply_result_inc_ref,
      apply_result_dec_ref: Mod._Z3_apply_result_dec_ref,
      apply_result_to_string: function(c, r) {
        return Mod.ccall(
          "Z3_apply_result_to_string",
          "string",
          ["number", "number"],
          [c, r]
        );
      },
      apply_result_get_num_subgoals: function(c, r) {
        let ret = Mod.ccall(
          "Z3_apply_result_get_num_subgoals",
          "number",
          ["number", "number"],
          [c, r]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      apply_result_get_subgoal: Mod._Z3_apply_result_get_subgoal,
      mk_solver: Mod._Z3_mk_solver,
      mk_simple_solver: Mod._Z3_mk_simple_solver,
      mk_solver_for_logic: Mod._Z3_mk_solver_for_logic,
      mk_solver_from_tactic: Mod._Z3_mk_solver_from_tactic,
      solver_translate: Mod._Z3_solver_translate,
      solver_import_model_converter: Mod._Z3_solver_import_model_converter,
      solver_get_help: function(c, s) {
        return Mod.ccall(
          "Z3_solver_get_help",
          "string",
          ["number", "number"],
          [c, s]
        );
      },
      solver_get_param_descrs: Mod._Z3_solver_get_param_descrs,
      solver_set_params: Mod._Z3_solver_set_params,
      solver_inc_ref: Mod._Z3_solver_inc_ref,
      solver_dec_ref: Mod._Z3_solver_dec_ref,
      solver_interrupt: Mod._Z3_solver_interrupt,
      solver_push: Mod._Z3_solver_push,
      solver_pop: Mod._Z3_solver_pop,
      solver_reset: Mod._Z3_solver_reset,
      solver_get_num_scopes: function(c, s) {
        let ret = Mod.ccall(
          "Z3_solver_get_num_scopes",
          "number",
          ["number", "number"],
          [c, s]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      solver_assert: Mod._Z3_solver_assert,
      solver_assert_and_track: Mod._Z3_solver_assert_and_track,
      solver_from_file: function(c, s, file_name) {
        return Mod.ccall(
          "Z3_solver_from_file",
          "void",
          ["number", "number", "string"],
          [c, s, file_name]
        );
      },
      solver_from_string: function(c, s, str) {
        return Mod.ccall(
          "Z3_solver_from_string",
          "void",
          ["number", "number", "string"],
          [c, s, str]
        );
      },
      solver_get_assertions: Mod._Z3_solver_get_assertions,
      solver_get_units: Mod._Z3_solver_get_units,
      solver_get_trail: Mod._Z3_solver_get_trail,
      solver_get_non_units: Mod._Z3_solver_get_non_units,
      solver_get_levels: function(c, s, literals, sz) {
        let outArray_levels = Mod._malloc(4 * sz);
        try {
          let ret = Mod.ccall(
            "Z3_solver_get_levels",
            "void",
            ["number", "number", "number", "number", "number"],
            [c, s, literals, sz, outArray_levels]
          );
          return readUintArray(outArray_levels, sz);
        } finally {
          Mod._free(outArray_levels);
        }
      },
      solver_congruence_root: Mod._Z3_solver_congruence_root,
      solver_congruence_next: Mod._Z3_solver_congruence_next,
      solver_congruence_explain: Mod._Z3_solver_congruence_explain,
      solver_solve_for: Mod._Z3_solver_solve_for,
      solver_next_split: function(c, cb, t, idx, phase) {
        return Mod.ccall(
          "Z3_solver_next_split",
          "boolean",
          ["number", "number", "number", "number", "number"],
          [c, cb, t, idx, phase]
        );
      },
      solver_propagate_declare: function(c, name, domain, range) {
        return Mod.ccall(
          "Z3_solver_propagate_declare",
          "number",
          ["number", "number", "number", "array", "number"],
          [
            c,
            name,
            domain.length,
            intArrayToByteArr(domain),
            range
          ]
        );
      },
      solver_propagate_register: Mod._Z3_solver_propagate_register,
      solver_propagate_register_cb: Mod._Z3_solver_propagate_register_cb,
      solver_propagate_consequence: function(c, cb, fixed, eq_lhs, eq_rhs, conseq) {
        if (eq_lhs.length !== eq_rhs.length) {
          throw new TypeError(
            `eq_lhs and eq_rhs must be the same length (got ${eq_lhs.length} and {eq_rhs.length})`
          );
        }
        return Mod.ccall(
          "Z3_solver_propagate_consequence",
          "boolean",
          [
            "number",
            "number",
            "number",
            "array",
            "number",
            "array",
            "array",
            "number"
          ],
          [
            c,
            cb,
            fixed.length,
            intArrayToByteArr(fixed),
            eq_lhs.length,
            intArrayToByteArr(eq_lhs),
            intArrayToByteArr(eq_rhs),
            conseq
          ]
        );
      },
      solver_set_initial_value: Mod._Z3_solver_set_initial_value,
      solver_check: Mod._Z3_solver_check,
      solver_check_assumptions: function(c, s, assumptions) {
        return Mod.ccall(
          "Z3_solver_check_assumptions",
          "number",
          ["number", "number", "number", "array"],
          [
            c,
            s,
            assumptions.length,
            intArrayToByteArr(assumptions)
          ]
        );
      },
      get_implied_equalities: function(c, s, terms) {
        let outArray_class_ids = Mod._malloc(4 * terms.length);
        try {
          let ret = Mod.ccall(
            "Z3_get_implied_equalities",
            "number",
            ["number", "number", "number", "array", "number"],
            [
              c,
              s,
              terms.length,
              intArrayToByteArr(terms),
              outArray_class_ids
            ]
          );
          return {
            rv: ret,
            class_ids: readUintArray(outArray_class_ids, terms.length)
          };
        } finally {
          Mod._free(outArray_class_ids);
        }
      },
      solver_get_consequences: Mod._Z3_solver_get_consequences,
      solver_cube: Mod._Z3_solver_cube,
      solver_get_model: Mod._Z3_solver_get_model,
      solver_get_proof: Mod._Z3_solver_get_proof,
      solver_get_unsat_core: Mod._Z3_solver_get_unsat_core,
      solver_get_reason_unknown: function(c, s) {
        return Mod.ccall(
          "Z3_solver_get_reason_unknown",
          "string",
          ["number", "number"],
          [c, s]
        );
      },
      solver_get_statistics: Mod._Z3_solver_get_statistics,
      solver_to_string: function(c, s) {
        return Mod.ccall(
          "Z3_solver_to_string",
          "string",
          ["number", "number"],
          [c, s]
        );
      },
      solver_to_dimacs_string: function(c, s, include_names) {
        return Mod.ccall(
          "Z3_solver_to_dimacs_string",
          "string",
          ["number", "number", "boolean"],
          [c, s, include_names]
        );
      },
      stats_to_string: function(c, s) {
        return Mod.ccall(
          "Z3_stats_to_string",
          "string",
          ["number", "number"],
          [c, s]
        );
      },
      stats_inc_ref: Mod._Z3_stats_inc_ref,
      stats_dec_ref: Mod._Z3_stats_dec_ref,
      stats_size: function(c, s) {
        let ret = Mod.ccall(
          "Z3_stats_size",
          "number",
          ["number", "number"],
          [c, s]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      stats_get_key: function(c, s, idx) {
        return Mod.ccall(
          "Z3_stats_get_key",
          "string",
          ["number", "number", "number"],
          [c, s, idx]
        );
      },
      stats_is_uint: function(c, s, idx) {
        return Mod.ccall(
          "Z3_stats_is_uint",
          "boolean",
          ["number", "number", "number"],
          [c, s, idx]
        );
      },
      stats_is_double: function(c, s, idx) {
        return Mod.ccall(
          "Z3_stats_is_double",
          "boolean",
          ["number", "number", "number"],
          [c, s, idx]
        );
      },
      stats_get_uint_value: function(c, s, idx) {
        let ret = Mod.ccall(
          "Z3_stats_get_uint_value",
          "number",
          ["number", "number", "number"],
          [c, s, idx]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      stats_get_double_value: Mod._Z3_stats_get_double_value,
      get_estimated_alloc_size: Mod._Z3_get_estimated_alloc_size,
      algebraic_is_value: function(c, a) {
        return Mod.ccall(
          "Z3_algebraic_is_value",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      algebraic_is_pos: function(c, a) {
        return Mod.ccall(
          "Z3_algebraic_is_pos",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      algebraic_is_neg: function(c, a) {
        return Mod.ccall(
          "Z3_algebraic_is_neg",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      algebraic_is_zero: function(c, a) {
        return Mod.ccall(
          "Z3_algebraic_is_zero",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      algebraic_sign: Mod._Z3_algebraic_sign,
      algebraic_add: Mod._Z3_algebraic_add,
      algebraic_sub: Mod._Z3_algebraic_sub,
      algebraic_mul: Mod._Z3_algebraic_mul,
      algebraic_div: Mod._Z3_algebraic_div,
      algebraic_root: Mod._Z3_algebraic_root,
      algebraic_power: Mod._Z3_algebraic_power,
      algebraic_lt: function(c, a, b) {
        return Mod.ccall(
          "Z3_algebraic_lt",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      algebraic_gt: function(c, a, b) {
        return Mod.ccall(
          "Z3_algebraic_gt",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      algebraic_le: function(c, a, b) {
        return Mod.ccall(
          "Z3_algebraic_le",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      algebraic_ge: function(c, a, b) {
        return Mod.ccall(
          "Z3_algebraic_ge",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      algebraic_eq: function(c, a, b) {
        return Mod.ccall(
          "Z3_algebraic_eq",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      algebraic_neq: function(c, a, b) {
        return Mod.ccall(
          "Z3_algebraic_neq",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      algebraic_roots: function(c, p, a) {
        return Mod.ccall(
          "Z3_algebraic_roots",
          "number",
          ["number", "number", "number", "array"],
          [c, p, a.length, intArrayToByteArr(a)]
        );
      },
      algebraic_eval: function(c, p, a) {
        return Mod.ccall(
          "Z3_algebraic_eval",
          "number",
          ["number", "number", "number", "array"],
          [c, p, a.length, intArrayToByteArr(a)]
        );
      },
      algebraic_get_poly: Mod._Z3_algebraic_get_poly,
      algebraic_get_i: function(c, a) {
        let ret = Mod.ccall(
          "Z3_algebraic_get_i",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      mk_ast_vector: Mod._Z3_mk_ast_vector,
      ast_vector_inc_ref: Mod._Z3_ast_vector_inc_ref,
      ast_vector_dec_ref: Mod._Z3_ast_vector_dec_ref,
      ast_vector_size: function(c, v) {
        let ret = Mod.ccall(
          "Z3_ast_vector_size",
          "number",
          ["number", "number"],
          [c, v]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      ast_vector_get: Mod._Z3_ast_vector_get,
      ast_vector_set: Mod._Z3_ast_vector_set,
      ast_vector_resize: Mod._Z3_ast_vector_resize,
      ast_vector_push: Mod._Z3_ast_vector_push,
      ast_vector_translate: Mod._Z3_ast_vector_translate,
      ast_vector_to_string: function(c, v) {
        return Mod.ccall(
          "Z3_ast_vector_to_string",
          "string",
          ["number", "number"],
          [c, v]
        );
      },
      mk_ast_map: Mod._Z3_mk_ast_map,
      ast_map_inc_ref: Mod._Z3_ast_map_inc_ref,
      ast_map_dec_ref: Mod._Z3_ast_map_dec_ref,
      ast_map_contains: function(c, m, k) {
        return Mod.ccall(
          "Z3_ast_map_contains",
          "boolean",
          ["number", "number", "number"],
          [c, m, k]
        );
      },
      ast_map_find: Mod._Z3_ast_map_find,
      ast_map_insert: Mod._Z3_ast_map_insert,
      ast_map_erase: Mod._Z3_ast_map_erase,
      ast_map_reset: Mod._Z3_ast_map_reset,
      ast_map_size: function(c, m) {
        let ret = Mod.ccall(
          "Z3_ast_map_size",
          "number",
          ["number", "number"],
          [c, m]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      ast_map_keys: Mod._Z3_ast_map_keys,
      ast_map_to_string: function(c, m) {
        return Mod.ccall(
          "Z3_ast_map_to_string",
          "string",
          ["number", "number"],
          [c, m]
        );
      },
      mk_fixedpoint: Mod._Z3_mk_fixedpoint,
      fixedpoint_inc_ref: Mod._Z3_fixedpoint_inc_ref,
      fixedpoint_dec_ref: Mod._Z3_fixedpoint_dec_ref,
      fixedpoint_add_rule: Mod._Z3_fixedpoint_add_rule,
      fixedpoint_add_fact: function(c, d, r, args) {
        return Mod.ccall(
          "Z3_fixedpoint_add_fact",
          "void",
          ["number", "number", "number", "number", "array"],
          [
            c,
            d,
            r,
            args.length,
            intArrayToByteArr(args)
          ]
        );
      },
      fixedpoint_assert: Mod._Z3_fixedpoint_assert,
      fixedpoint_query: Mod._Z3_fixedpoint_query,
      fixedpoint_query_relations: function(c, d, relations) {
        return Mod.ccall(
          "Z3_fixedpoint_query_relations",
          "number",
          ["number", "number", "number", "array"],
          [
            c,
            d,
            relations.length,
            intArrayToByteArr(relations)
          ]
        );
      },
      fixedpoint_get_answer: Mod._Z3_fixedpoint_get_answer,
      fixedpoint_get_reason_unknown: function(c, d) {
        return Mod.ccall(
          "Z3_fixedpoint_get_reason_unknown",
          "string",
          ["number", "number"],
          [c, d]
        );
      },
      fixedpoint_update_rule: Mod._Z3_fixedpoint_update_rule,
      fixedpoint_get_num_levels: function(c, d, pred) {
        let ret = Mod.ccall(
          "Z3_fixedpoint_get_num_levels",
          "number",
          ["number", "number", "number"],
          [c, d, pred]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      fixedpoint_get_cover_delta: Mod._Z3_fixedpoint_get_cover_delta,
      fixedpoint_add_cover: Mod._Z3_fixedpoint_add_cover,
      fixedpoint_get_statistics: Mod._Z3_fixedpoint_get_statistics,
      fixedpoint_register_relation: Mod._Z3_fixedpoint_register_relation,
      fixedpoint_set_predicate_representation: function(c, d, f, relation_kinds) {
        return Mod.ccall(
          "Z3_fixedpoint_set_predicate_representation",
          "void",
          ["number", "number", "number", "number", "array"],
          [
            c,
            d,
            f,
            relation_kinds.length,
            intArrayToByteArr(relation_kinds)
          ]
        );
      },
      fixedpoint_get_rules: Mod._Z3_fixedpoint_get_rules,
      fixedpoint_get_assertions: Mod._Z3_fixedpoint_get_assertions,
      fixedpoint_set_params: Mod._Z3_fixedpoint_set_params,
      fixedpoint_get_help: function(c, f) {
        return Mod.ccall(
          "Z3_fixedpoint_get_help",
          "string",
          ["number", "number"],
          [c, f]
        );
      },
      fixedpoint_get_param_descrs: Mod._Z3_fixedpoint_get_param_descrs,
      fixedpoint_to_string: function(c, f, queries) {
        return Mod.ccall(
          "Z3_fixedpoint_to_string",
          "string",
          ["number", "number", "number", "array"],
          [
            c,
            f,
            queries.length,
            intArrayToByteArr(queries)
          ]
        );
      },
      fixedpoint_from_string: function(c, f, s) {
        return Mod.ccall(
          "Z3_fixedpoint_from_string",
          "number",
          ["number", "number", "string"],
          [c, f, s]
        );
      },
      fixedpoint_from_file: function(c, f, s) {
        return Mod.ccall(
          "Z3_fixedpoint_from_file",
          "number",
          ["number", "number", "string"],
          [c, f, s]
        );
      },
      mk_fpa_rounding_mode_sort: Mod._Z3_mk_fpa_rounding_mode_sort,
      mk_fpa_round_nearest_ties_to_even: Mod._Z3_mk_fpa_round_nearest_ties_to_even,
      mk_fpa_rne: Mod._Z3_mk_fpa_rne,
      mk_fpa_round_nearest_ties_to_away: Mod._Z3_mk_fpa_round_nearest_ties_to_away,
      mk_fpa_rna: Mod._Z3_mk_fpa_rna,
      mk_fpa_round_toward_positive: Mod._Z3_mk_fpa_round_toward_positive,
      mk_fpa_rtp: Mod._Z3_mk_fpa_rtp,
      mk_fpa_round_toward_negative: Mod._Z3_mk_fpa_round_toward_negative,
      mk_fpa_rtn: Mod._Z3_mk_fpa_rtn,
      mk_fpa_round_toward_zero: Mod._Z3_mk_fpa_round_toward_zero,
      mk_fpa_rtz: Mod._Z3_mk_fpa_rtz,
      mk_fpa_sort: Mod._Z3_mk_fpa_sort,
      mk_fpa_sort_half: Mod._Z3_mk_fpa_sort_half,
      mk_fpa_sort_16: Mod._Z3_mk_fpa_sort_16,
      mk_fpa_sort_single: Mod._Z3_mk_fpa_sort_single,
      mk_fpa_sort_32: Mod._Z3_mk_fpa_sort_32,
      mk_fpa_sort_double: Mod._Z3_mk_fpa_sort_double,
      mk_fpa_sort_64: Mod._Z3_mk_fpa_sort_64,
      mk_fpa_sort_quadruple: Mod._Z3_mk_fpa_sort_quadruple,
      mk_fpa_sort_128: Mod._Z3_mk_fpa_sort_128,
      mk_fpa_nan: Mod._Z3_mk_fpa_nan,
      mk_fpa_inf: Mod._Z3_mk_fpa_inf,
      mk_fpa_zero: Mod._Z3_mk_fpa_zero,
      mk_fpa_fp: Mod._Z3_mk_fpa_fp,
      mk_fpa_numeral_float: Mod._Z3_mk_fpa_numeral_float,
      mk_fpa_numeral_double: Mod._Z3_mk_fpa_numeral_double,
      mk_fpa_numeral_int: Mod._Z3_mk_fpa_numeral_int,
      mk_fpa_numeral_int_uint: Mod._Z3_mk_fpa_numeral_int_uint,
      mk_fpa_numeral_int64_uint64: Mod._Z3_mk_fpa_numeral_int64_uint64,
      mk_fpa_abs: Mod._Z3_mk_fpa_abs,
      mk_fpa_neg: Mod._Z3_mk_fpa_neg,
      mk_fpa_add: Mod._Z3_mk_fpa_add,
      mk_fpa_sub: Mod._Z3_mk_fpa_sub,
      mk_fpa_mul: Mod._Z3_mk_fpa_mul,
      mk_fpa_div: Mod._Z3_mk_fpa_div,
      mk_fpa_fma: Mod._Z3_mk_fpa_fma,
      mk_fpa_sqrt: Mod._Z3_mk_fpa_sqrt,
      mk_fpa_rem: Mod._Z3_mk_fpa_rem,
      mk_fpa_round_to_integral: Mod._Z3_mk_fpa_round_to_integral,
      mk_fpa_min: Mod._Z3_mk_fpa_min,
      mk_fpa_max: Mod._Z3_mk_fpa_max,
      mk_fpa_leq: Mod._Z3_mk_fpa_leq,
      mk_fpa_lt: Mod._Z3_mk_fpa_lt,
      mk_fpa_geq: Mod._Z3_mk_fpa_geq,
      mk_fpa_gt: Mod._Z3_mk_fpa_gt,
      mk_fpa_eq: Mod._Z3_mk_fpa_eq,
      mk_fpa_is_normal: Mod._Z3_mk_fpa_is_normal,
      mk_fpa_is_subnormal: Mod._Z3_mk_fpa_is_subnormal,
      mk_fpa_is_zero: Mod._Z3_mk_fpa_is_zero,
      mk_fpa_is_infinite: Mod._Z3_mk_fpa_is_infinite,
      mk_fpa_is_nan: Mod._Z3_mk_fpa_is_nan,
      mk_fpa_is_negative: Mod._Z3_mk_fpa_is_negative,
      mk_fpa_is_positive: Mod._Z3_mk_fpa_is_positive,
      mk_fpa_to_fp_bv: Mod._Z3_mk_fpa_to_fp_bv,
      mk_fpa_to_fp_float: Mod._Z3_mk_fpa_to_fp_float,
      mk_fpa_to_fp_real: Mod._Z3_mk_fpa_to_fp_real,
      mk_fpa_to_fp_signed: Mod._Z3_mk_fpa_to_fp_signed,
      mk_fpa_to_fp_unsigned: Mod._Z3_mk_fpa_to_fp_unsigned,
      mk_fpa_to_ubv: Mod._Z3_mk_fpa_to_ubv,
      mk_fpa_to_sbv: Mod._Z3_mk_fpa_to_sbv,
      mk_fpa_to_real: Mod._Z3_mk_fpa_to_real,
      fpa_get_ebits: function(c, s) {
        let ret = Mod.ccall(
          "Z3_fpa_get_ebits",
          "number",
          ["number", "number"],
          [c, s]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      fpa_get_sbits: function(c, s) {
        let ret = Mod.ccall(
          "Z3_fpa_get_sbits",
          "number",
          ["number", "number"],
          [c, s]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      fpa_is_numeral: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_is_numeral",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_is_numeral_nan: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_is_numeral_nan",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_is_numeral_inf: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_is_numeral_inf",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_is_numeral_zero: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_is_numeral_zero",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_is_numeral_normal: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_is_numeral_normal",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_is_numeral_subnormal: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_is_numeral_subnormal",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_is_numeral_positive: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_is_numeral_positive",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_is_numeral_negative: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_is_numeral_negative",
          "boolean",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_get_numeral_sign_bv: Mod._Z3_fpa_get_numeral_sign_bv,
      fpa_get_numeral_significand_bv: Mod._Z3_fpa_get_numeral_significand_bv,
      fpa_get_numeral_significand_string: function(c, t) {
        return Mod.ccall(
          "Z3_fpa_get_numeral_significand_string",
          "string",
          ["number", "number"],
          [c, t]
        );
      },
      fpa_get_numeral_significand_uint64: function(c, t) {
        let ret = Mod.ccall(
          "Z3_fpa_get_numeral_significand_uint64",
          "boolean",
          ["number", "number", "number"],
          [c, t, outAddress]
        );
        if (!ret) {
          return null;
        }
        return getOutUint64(0);
      },
      fpa_get_numeral_exponent_string: function(c, t, biased) {
        return Mod.ccall(
          "Z3_fpa_get_numeral_exponent_string",
          "string",
          ["number", "number", "boolean"],
          [c, t, biased]
        );
      },
      fpa_get_numeral_exponent_int64: function(c, t, biased) {
        let ret = Mod.ccall(
          "Z3_fpa_get_numeral_exponent_int64",
          "boolean",
          ["number", "number", "number", "boolean"],
          [c, t, outAddress, biased]
        );
        if (!ret) {
          return null;
        }
        return getOutInt64(0);
      },
      fpa_get_numeral_exponent_bv: Mod._Z3_fpa_get_numeral_exponent_bv,
      mk_fpa_to_ieee_bv: Mod._Z3_mk_fpa_to_ieee_bv,
      mk_fpa_to_fp_int_real: Mod._Z3_mk_fpa_to_fp_int_real,
      mk_optimize: Mod._Z3_mk_optimize,
      optimize_inc_ref: Mod._Z3_optimize_inc_ref,
      optimize_dec_ref: Mod._Z3_optimize_dec_ref,
      optimize_assert: Mod._Z3_optimize_assert,
      optimize_assert_and_track: Mod._Z3_optimize_assert_and_track,
      optimize_assert_soft: function(c, o, a, weight, id) {
        let ret = Mod.ccall(
          "Z3_optimize_assert_soft",
          "number",
          ["number", "number", "number", "string", "number"],
          [c, o, a, weight, id]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      optimize_maximize: function(c, o, t) {
        let ret = Mod.ccall(
          "Z3_optimize_maximize",
          "number",
          ["number", "number", "number"],
          [c, o, t]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      optimize_minimize: function(c, o, t) {
        let ret = Mod.ccall(
          "Z3_optimize_minimize",
          "number",
          ["number", "number", "number"],
          [c, o, t]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      optimize_push: Mod._Z3_optimize_push,
      optimize_pop: Mod._Z3_optimize_pop,
      optimize_set_initial_value: Mod._Z3_optimize_set_initial_value,
      optimize_check: function(c, o, assumptions) {
        return Mod.ccall(
          "Z3_optimize_check",
          "number",
          ["number", "number", "number", "array"],
          [
            c,
            o,
            assumptions.length,
            intArrayToByteArr(assumptions)
          ]
        );
      },
      optimize_get_reason_unknown: function(c, d) {
        return Mod.ccall(
          "Z3_optimize_get_reason_unknown",
          "string",
          ["number", "number"],
          [c, d]
        );
      },
      optimize_get_model: Mod._Z3_optimize_get_model,
      optimize_get_unsat_core: Mod._Z3_optimize_get_unsat_core,
      optimize_set_params: Mod._Z3_optimize_set_params,
      optimize_get_param_descrs: Mod._Z3_optimize_get_param_descrs,
      optimize_get_lower: Mod._Z3_optimize_get_lower,
      optimize_get_upper: Mod._Z3_optimize_get_upper,
      optimize_get_lower_as_vector: Mod._Z3_optimize_get_lower_as_vector,
      optimize_get_upper_as_vector: Mod._Z3_optimize_get_upper_as_vector,
      optimize_to_string: function(c, o) {
        return Mod.ccall(
          "Z3_optimize_to_string",
          "string",
          ["number", "number"],
          [c, o]
        );
      },
      optimize_from_string: function(c, o, s) {
        return Mod.ccall(
          "Z3_optimize_from_string",
          "void",
          ["number", "number", "string"],
          [c, o, s]
        );
      },
      optimize_from_file: function(c, o, s) {
        return Mod.ccall(
          "Z3_optimize_from_file",
          "void",
          ["number", "number", "string"],
          [c, o, s]
        );
      },
      optimize_get_help: function(c, t) {
        return Mod.ccall(
          "Z3_optimize_get_help",
          "string",
          ["number", "number"],
          [c, t]
        );
      },
      optimize_get_statistics: Mod._Z3_optimize_get_statistics,
      optimize_get_assertions: Mod._Z3_optimize_get_assertions,
      optimize_get_objectives: Mod._Z3_optimize_get_objectives,
      optimize_translate: Mod._Z3_optimize_translate,
      polynomial_subresultants: Mod._Z3_polynomial_subresultants,
      rcf_del: Mod._Z3_rcf_del,
      rcf_mk_rational: function(c, val) {
        return Mod.ccall(
          "Z3_rcf_mk_rational",
          "number",
          ["number", "string"],
          [c, val]
        );
      },
      rcf_mk_small_int: Mod._Z3_rcf_mk_small_int,
      rcf_mk_pi: Mod._Z3_rcf_mk_pi,
      rcf_mk_e: Mod._Z3_rcf_mk_e,
      rcf_mk_infinitesimal: Mod._Z3_rcf_mk_infinitesimal,
      rcf_mk_roots: function(c, a) {
        let outArray_roots = Mod._malloc(4 * a.length);
        try {
          let ret = Mod.ccall(
            "Z3_rcf_mk_roots",
            "number",
            ["number", "number", "array", "number"],
            [
              c,
              a.length,
              intArrayToByteArr(a),
              outArray_roots
            ]
          );
          ret = new Uint32Array([ret])[0];
          return {
            rv: ret,
            roots: readUintArray(
              outArray_roots,
              a.length
            )
          };
        } finally {
          Mod._free(outArray_roots);
        }
      },
      rcf_add: Mod._Z3_rcf_add,
      rcf_sub: Mod._Z3_rcf_sub,
      rcf_mul: Mod._Z3_rcf_mul,
      rcf_div: Mod._Z3_rcf_div,
      rcf_neg: Mod._Z3_rcf_neg,
      rcf_inv: Mod._Z3_rcf_inv,
      rcf_power: Mod._Z3_rcf_power,
      rcf_lt: function(c, a, b) {
        return Mod.ccall(
          "Z3_rcf_lt",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      rcf_gt: function(c, a, b) {
        return Mod.ccall(
          "Z3_rcf_gt",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      rcf_le: function(c, a, b) {
        return Mod.ccall(
          "Z3_rcf_le",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      rcf_ge: function(c, a, b) {
        return Mod.ccall(
          "Z3_rcf_ge",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      rcf_eq: function(c, a, b) {
        return Mod.ccall(
          "Z3_rcf_eq",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      rcf_neq: function(c, a, b) {
        return Mod.ccall(
          "Z3_rcf_neq",
          "boolean",
          ["number", "number", "number"],
          [c, a, b]
        );
      },
      rcf_num_to_string: function(c, a, compact, html) {
        return Mod.ccall(
          "Z3_rcf_num_to_string",
          "string",
          ["number", "number", "boolean", "boolean"],
          [c, a, compact, html]
        );
      },
      rcf_num_to_decimal_string: function(c, a, prec) {
        return Mod.ccall(
          "Z3_rcf_num_to_decimal_string",
          "string",
          ["number", "number", "number"],
          [c, a, prec]
        );
      },
      rcf_get_numerator_denominator: function(c, a) {
        let ret = Mod.ccall(
          "Z3_rcf_get_numerator_denominator",
          "void",
          ["number", "number", "number", "number"],
          [c, a, outAddress, outAddress + 4]
        );
        return {
          n: getOutUint(0),
          d: getOutUint(1)
        };
      },
      rcf_is_rational: function(c, a) {
        return Mod.ccall(
          "Z3_rcf_is_rational",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      rcf_is_algebraic: function(c, a) {
        return Mod.ccall(
          "Z3_rcf_is_algebraic",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      rcf_is_infinitesimal: function(c, a) {
        return Mod.ccall(
          "Z3_rcf_is_infinitesimal",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      rcf_is_transcendental: function(c, a) {
        return Mod.ccall(
          "Z3_rcf_is_transcendental",
          "boolean",
          ["number", "number"],
          [c, a]
        );
      },
      rcf_extension_index: function(c, a) {
        let ret = Mod.ccall(
          "Z3_rcf_extension_index",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      rcf_transcendental_name: Mod._Z3_rcf_transcendental_name,
      rcf_infinitesimal_name: Mod._Z3_rcf_infinitesimal_name,
      rcf_num_coefficients: function(c, a) {
        let ret = Mod.ccall(
          "Z3_rcf_num_coefficients",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      rcf_coefficient: Mod._Z3_rcf_coefficient,
      rcf_num_sign_conditions: function(c, a) {
        let ret = Mod.ccall(
          "Z3_rcf_num_sign_conditions",
          "number",
          ["number", "number"],
          [c, a]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      rcf_sign_condition_sign: Mod._Z3_rcf_sign_condition_sign,
      rcf_num_sign_condition_coefficients: function(c, a, i) {
        let ret = Mod.ccall(
          "Z3_rcf_num_sign_condition_coefficients",
          "number",
          ["number", "number", "number"],
          [c, a, i]
        );
        ret = new Uint32Array([ret])[0];
        return ret;
      },
      rcf_sign_condition_coefficient: Mod._Z3_rcf_sign_condition_coefficient,
      fixedpoint_query_from_lvl: Mod._Z3_fixedpoint_query_from_lvl,
      fixedpoint_get_ground_sat_answer: Mod._Z3_fixedpoint_get_ground_sat_answer,
      fixedpoint_get_rules_along_trace: Mod._Z3_fixedpoint_get_rules_along_trace,
      fixedpoint_get_rule_names_along_trace: Mod._Z3_fixedpoint_get_rule_names_along_trace,
      fixedpoint_add_invariant: Mod._Z3_fixedpoint_add_invariant,
      fixedpoint_get_reachable: Mod._Z3_fixedpoint_get_reachable,
      qe_model_project: function(c, m, bound, body) {
        return Mod.ccall(
          "Z3_qe_model_project",
          "number",
          ["number", "number", "number", "array", "number"],
          [
            c,
            m,
            bound.length,
            intArrayToByteArr(bound),
            body
          ]
        );
      },
      qe_model_project_skolem: function(c, m, bound, body, map) {
        return Mod.ccall(
          "Z3_qe_model_project_skolem",
          "number",
          ["number", "number", "number", "array", "number", "number"],
          [
            c,
            m,
            bound.length,
            intArrayToByteArr(bound),
            body,
            map
          ]
        );
      },
      qe_model_project_with_witness: function(c, m, bound, body, map) {
        return Mod.ccall(
          "Z3_qe_model_project_with_witness",
          "number",
          ["number", "number", "number", "array", "number", "number"],
          [
            c,
            m,
            bound.length,
            intArrayToByteArr(bound),
            body,
            map
          ]
        );
      },
      model_extrapolate: Mod._Z3_model_extrapolate,
      qe_lite: Mod._Z3_qe_lite
    }
  };
}

// src/high-level/types.ts
var Z3Error = class extends Error {
};
var Z3AssertionError = class extends Z3Error {
};

// src/high-level/utils.ts
function assertExhaustive(x) {
  throw new Error("Unexpected code execution detected, should be caught at compile time");
}
function assert(condition, reason) {
  if (!condition) {
    throw new Z3AssertionError(reason ?? "Assertion failed");
  }
}
var Mutex = class {
  last = Promise.resolve();
  runExclusive(callback) {
    const run = this.last.then(() => callback());
    this.last = run.then(
      () => void 0,
      () => void 0
    );
    return run;
  }
};
function allSatisfy(collection, premise) {
  let hasItems = false;
  for (const arg of collection) {
    hasItems = true;
    if (!premise(arg)) {
      return false;
    }
  }
  return hasItems === true ? true : null;
}

// src/high-level/high-level.ts
var FALLBACK_PRECISION = 17;
var asyncMutex = new Mutex();
function isCoercibleRational(obj) {
  const r = obj !== null && (typeof obj === "object" || typeof obj === "function") && (obj.numerator !== null && (typeof obj.numerator === "number" || typeof obj.numerator === "bigint")) && (obj.denominator !== null && (typeof obj.denominator === "number" || typeof obj.denominator === "bigint"));
  r && assert(
    (typeof obj.numerator !== "number" || Number.isSafeInteger(obj.numerator)) && (typeof obj.denominator !== "number" || Number.isSafeInteger(obj.denominator)),
    "Fraction numerator and denominator must be integers"
  );
  return r;
}
function createApi(Z3, solveService) {
  const cleanup = new FinalizationRegistry((callback) => callback());
  function enableTrace(tag) {
    Z3.enable_trace(tag);
  }
  function disableTrace(tag) {
    Z3.disable_trace(tag);
  }
  function getVersion() {
    return Z3.get_version();
  }
  function getVersionString() {
    const { major, minor, build_number } = Z3.get_version();
    return `${major}.${minor}.${build_number}`;
  }
  function getFullVersion() {
    return Z3.get_full_version();
  }
  function openLog(filename) {
    return Z3.open_log(filename);
  }
  function appendLog(s) {
    Z3.append_log(s);
  }
  function setParam(key, value) {
    if (typeof key === "string") {
      Z3.global_param_set(key, value.toString());
    } else {
      assert(value === void 0, "Can't provide a Record and second parameter to set_param at the same time");
      Object.entries(key).forEach(([key2, value2]) => setParam(key2, value2));
    }
  }
  function resetParams() {
    Z3.global_param_reset_all();
  }
  function getParam(name) {
    return Z3.global_param_get(name);
  }
  function createContext(name, options) {
    const cfg = Z3.mk_config();
    if (options != null) {
      Object.entries(options).forEach(([key, value]) => check(Z3.set_param_value(cfg, key, value.toString())));
    }
    const contextPtr = Z3.mk_context_rc(cfg);
    Z3.set_ast_print_mode(contextPtr, 2 /* Z3_PRINT_SMTLIB2_COMPLIANT */);
    Z3.del_config(cfg);
    function _assertContext(...ctxs) {
      ctxs.forEach((other) => assert("ctx" in other ? ctx === other.ctx : ctx === other, "Context mismatch"));
    }
    function _assertPtr(ptr) {
      if (ptr == null) throw new TypeError("Expected non-null pointer");
    }
    function throwIfError() {
      if (Z3.get_error_code(contextPtr) !== 0 /* Z3_OK */) {
        throw new Error(Z3.get_error_msg(ctx.ptr, Z3.get_error_code(ctx.ptr)));
      }
    }
    function check(val) {
      throwIfError();
      return val;
    }
    function _toSymbol(s) {
      if (typeof s === "number") {
        return check(Z3.mk_int_symbol(contextPtr, s));
      } else {
        return check(Z3.mk_string_symbol(contextPtr, s));
      }
    }
    function _fromSymbol(sym) {
      const kind = check(Z3.get_symbol_kind(contextPtr, sym));
      switch (kind) {
        case 0 /* Z3_INT_SYMBOL */:
          return Z3.get_symbol_int(contextPtr, sym);
        case 1 /* Z3_STRING_SYMBOL */:
          return Z3.get_symbol_string(contextPtr, sym);
        default:
          assertExhaustive(kind);
      }
    }
    function _toParams(key, value) {
      const params = Z3.mk_params(contextPtr);
      Z3.params_inc_ref(contextPtr, params);
      if (typeof value === "boolean") {
        Z3.params_set_bool(contextPtr, params, _toSymbol(key), value);
      } else if (typeof value === "number") {
        if (Number.isInteger(value)) {
          check(Z3.params_set_uint(contextPtr, params, _toSymbol(key), value));
        } else {
          check(Z3.params_set_double(contextPtr, params, _toSymbol(key), value));
        }
      } else if (typeof value === "string") {
        check(Z3.params_set_symbol(contextPtr, params, _toSymbol(key), _toSymbol(value)));
      }
      return params;
    }
    function _toAst(ast) {
      switch (check(Z3.get_ast_kind(contextPtr, ast))) {
        case 4 /* Z3_SORT_AST */:
          return _toSort(ast);
        case 5 /* Z3_FUNC_DECL_AST */:
          return new FuncDeclImpl(ast);
        default:
          return _toExpr(ast);
      }
    }
    function _toSort(ast) {
      switch (check(Z3.get_sort_kind(contextPtr, ast))) {
        case 1 /* Z3_BOOL_SORT */:
          return new BoolSortImpl(ast);
        case 2 /* Z3_INT_SORT */:
        case 3 /* Z3_REAL_SORT */:
          return new ArithSortImpl(ast);
        case 4 /* Z3_BV_SORT */:
          return new BitVecSortImpl(ast);
        case 9 /* Z3_FLOATING_POINT_SORT */:
          return new FPSortImpl(ast);
        case 10 /* Z3_ROUNDING_MODE_SORT */:
          return new FPRMSortImpl(ast);
        case 11 /* Z3_SEQ_SORT */:
          return new SeqSortImpl(ast);
        case 12 /* Z3_RE_SORT */:
          return new ReSortImpl(ast);
        case 5 /* Z3_ARRAY_SORT */:
          return new ArraySortImpl(ast);
        default:
          return new SortImpl(ast);
      }
    }
    function _toExpr(ast) {
      const kind = check(Z3.get_ast_kind(contextPtr, ast));
      if (kind === 3 /* Z3_QUANTIFIER_AST */) {
        if (Z3.is_lambda(contextPtr, ast)) {
          return new LambdaImpl(ast);
        }
        return new NonLambdaQuantifierImpl(ast);
      }
      const sortKind = check(Z3.get_sort_kind(contextPtr, Z3.get_sort(contextPtr, ast)));
      switch (sortKind) {
        case 1 /* Z3_BOOL_SORT */:
          return new BoolImpl(ast);
        case 2 /* Z3_INT_SORT */:
          if (kind === 0 /* Z3_NUMERAL_AST */) {
            return new IntNumImpl(ast);
          }
          return new ArithImpl(ast);
        case 3 /* Z3_REAL_SORT */:
          if (kind === 0 /* Z3_NUMERAL_AST */) {
            return new RatNumImpl(ast);
          }
          return new ArithImpl(ast);
        case 4 /* Z3_BV_SORT */:
          if (kind === 0 /* Z3_NUMERAL_AST */) {
            return new BitVecNumImpl(ast);
          }
          return new BitVecImpl(ast);
        case 9 /* Z3_FLOATING_POINT_SORT */:
          if (kind === 0 /* Z3_NUMERAL_AST */ || kind === 1 /* Z3_APP_AST */) {
            return new FPNumImpl(ast);
          }
          return new FPImpl(ast);
        case 10 /* Z3_ROUNDING_MODE_SORT */:
          return new FPRMImpl(ast);
        case 11 /* Z3_SEQ_SORT */:
          return new SeqImpl(ast);
        case 12 /* Z3_RE_SORT */:
          return new ReImpl(ast);
        case 5 /* Z3_ARRAY_SORT */:
          return new ArrayImpl(ast);
        default:
          return new ExprImpl(ast);
      }
    }
    function _flattenArgs(args) {
      const result = [];
      for (const arg of args) {
        if (isAstVector(arg)) {
          result.push(...arg.values());
        } else {
          result.push(arg);
        }
      }
      return result;
    }
    function _toProbe(p) {
      if (isProbe(p)) {
        return p;
      }
      return new ProbeImpl(p);
    }
    function _probeNary(f, args) {
      assert(args.length > 0, "At least one argument expected");
      let r = _toProbe(args[0]);
      for (let i = 1; i < args.length; i++) {
        r = new ProbeImpl(check(f(contextPtr, r.ptr, _toProbe(args[i]).ptr)));
      }
      return r;
    }
    function interrupt() {
      solveService.interrupt();
      check(Z3.interrupt(contextPtr));
    }
    function setPrintMode(mode) {
      Z3.set_ast_print_mode(contextPtr, mode);
    }
    function isModel(obj) {
      const r = obj instanceof ModelImpl;
      r && _assertContext(obj);
      return r;
    }
    function isAst(obj) {
      const r = obj instanceof AstImpl;
      r && _assertContext(obj);
      return r;
    }
    function isSort(obj) {
      const r = obj instanceof SortImpl;
      r && _assertContext(obj);
      return r;
    }
    function isFuncDecl(obj) {
      const r = obj instanceof FuncDeclImpl;
      r && _assertContext(obj);
      return r;
    }
    function isFuncInterp(obj) {
      const r = obj instanceof FuncInterpImpl;
      r && _assertContext(obj);
      return r;
    }
    function isApp(obj) {
      if (!isExpr(obj)) {
        return false;
      }
      const kind = check(Z3.get_ast_kind(contextPtr, obj.ast));
      return kind === 0 /* Z3_NUMERAL_AST */ || kind === 1 /* Z3_APP_AST */;
    }
    function isConst(obj) {
      return isExpr(obj) && isApp(obj) && obj.numArgs() === 0;
    }
    function isExpr(obj) {
      const r = obj instanceof ExprImpl;
      r && _assertContext(obj);
      return r;
    }
    function isVar(obj) {
      return isExpr(obj) && check(Z3.get_ast_kind(contextPtr, obj.ast)) === 2 /* Z3_VAR_AST */;
    }
    function isAppOf(obj, kind) {
      return isExpr(obj) && isApp(obj) && obj.decl().kind() === kind;
    }
    function isBool(obj) {
      const r = obj instanceof ExprImpl && obj.sort.kind() === 1 /* Z3_BOOL_SORT */;
      r && _assertContext(obj);
      return r;
    }
    function isTrue(obj) {
      return isAppOf(obj, 256 /* Z3_OP_TRUE */);
    }
    function isFalse(obj) {
      return isAppOf(obj, 257 /* Z3_OP_FALSE */);
    }
    function isAnd(obj) {
      return isAppOf(obj, 261 /* Z3_OP_AND */);
    }
    function isOr(obj) {
      return isAppOf(obj, 262 /* Z3_OP_OR */);
    }
    function isImplies(obj) {
      return isAppOf(obj, 266 /* Z3_OP_IMPLIES */);
    }
    function isNot(obj) {
      return isAppOf(obj, 265 /* Z3_OP_NOT */);
    }
    function isEq(obj) {
      return isAppOf(obj, 258 /* Z3_OP_EQ */);
    }
    function isDistinct(obj) {
      return isAppOf(obj, 259 /* Z3_OP_DISTINCT */);
    }
    function isQuantifier(obj) {
      const r = obj instanceof QuantifierImpl;
      r && _assertContext(obj);
      return r;
    }
    function isArith(obj) {
      const r = obj instanceof ArithImpl;
      r && _assertContext(obj);
      return r;
    }
    function isArithSort(obj) {
      const r = obj instanceof ArithSortImpl;
      r && _assertContext(obj);
      return r;
    }
    function isInt(obj) {
      return isArith(obj) && isIntSort(obj.sort);
    }
    function isIntVal(obj) {
      const r = obj instanceof IntNumImpl;
      r && _assertContext(obj);
      return r;
    }
    function isIntSort(obj) {
      return isSort(obj) && obj.kind() === 2 /* Z3_INT_SORT */;
    }
    function isReal(obj) {
      return isArith(obj) && isRealSort(obj.sort);
    }
    function isRealVal(obj) {
      const r = obj instanceof RatNumImpl;
      r && _assertContext(obj);
      return r;
    }
    function isRealSort(obj) {
      return isSort(obj) && obj.kind() === 3 /* Z3_REAL_SORT */;
    }
    function isRCFNum(obj) {
      const r = obj instanceof RCFNumImpl;
      r && _assertContext(obj);
      return r;
    }
    function isBitVecSort(obj) {
      const r = obj instanceof BitVecSortImpl;
      r && _assertContext(obj);
      return r;
    }
    function isBitVec(obj) {
      const r = obj instanceof BitVecImpl;
      r && _assertContext(obj);
      return r;
    }
    function isBitVecVal(obj) {
      const r = obj instanceof BitVecNumImpl;
      r && _assertContext(obj);
      return r;
    }
    function isArraySort(obj) {
      const r = obj instanceof ArraySortImpl;
      r && _assertContext(obj);
      return r;
    }
    function isArray(obj) {
      const r = obj instanceof ArrayImpl;
      r && _assertContext(obj);
      return r;
    }
    function isConstArray(obj) {
      return isAppOf(obj, 770 /* Z3_OP_CONST_ARRAY */);
    }
    function isFPRMSort(obj) {
      const r = obj instanceof FPRMSortImpl;
      r && _assertContext(obj);
      return r;
    }
    function isFPRM(obj) {
      const r = obj instanceof FPRMImpl;
      r && _assertContext(obj);
      return r;
    }
    function isFPSort(obj) {
      const r = obj instanceof FPSortImpl;
      r && _assertContext(obj);
      return r;
    }
    function isFP(obj) {
      const r = obj instanceof FPImpl;
      r && _assertContext(obj);
      return r;
    }
    function isFPVal(obj) {
      const r = obj instanceof FPNumImpl;
      r && _assertContext(obj);
      return r;
    }
    function isSeqSort(obj) {
      const r = obj instanceof SeqSortImpl;
      r && _assertContext(obj);
      return r;
    }
    function isSeq(obj) {
      const r = obj instanceof SeqImpl;
      r && _assertContext(obj);
      return r;
    }
    function isReSort(obj) {
      const r = obj instanceof ReSortImpl;
      r && _assertContext(obj);
      return r;
    }
    function isRe(obj) {
      const r = obj instanceof ReImpl;
      r && _assertContext(obj);
      return r;
    }
    function isStringSort(obj) {
      return isSeqSort(obj) && obj.isString();
    }
    function isString(obj) {
      return isSeq(obj) && obj.isString();
    }
    function isProbe(obj) {
      const r = obj instanceof ProbeImpl;
      r && _assertContext(obj);
      return r;
    }
    function isTactic(obj) {
      const r = obj instanceof TacticImpl;
      r && _assertContext(obj);
      return r;
    }
    function isGoal(obj) {
      const r = obj instanceof GoalImpl;
      r && _assertContext(obj);
      return r;
    }
    function isAstVector(obj) {
      const r = obj instanceof AstVectorImpl;
      r && _assertContext(obj);
      return r;
    }
    function eqIdentity(a, b) {
      return a.eqIdentity(b);
    }
    function getVarIndex(obj) {
      assert(isVar(obj), "Z3 bound variable expected");
      return Z3.get_index_value(contextPtr, obj.ast);
    }
    function from(value) {
      if (typeof value === "boolean") {
        return Bool2.val(value);
      } else if (typeof value === "number") {
        if (!Number.isFinite(value)) {
          throw new Error(`cannot represent infinity/NaN (got ${value})`);
        }
        if (Math.floor(value) === value) {
          return Int.val(value);
        }
        return Real.val(value);
      } else if (isCoercibleRational(value)) {
        return Real.val(value);
      } else if (typeof value === "bigint") {
        return Int.val(value);
      } else if (isExpr(value)) {
        return value;
      }
      assert(false);
    }
    async function solve(...assertions) {
      const solver = new ctx.Solver();
      solver.add(...assertions);
      const result = await solver.check();
      if (result === "sat") {
        return solver.model();
      }
      return result;
    }
    async function simplify(e) {
      const result = await Z3.simplify(contextPtr, e.ast);
      return _toExpr(check(result));
    }
    const Sort2 = {
      declare: (name2) => new SortImpl(Z3.mk_uninterpreted_sort(contextPtr, _toSymbol(name2)))
    };
    const Function = {
      declare: (name2, ...signature) => {
        const arity = signature.length - 1;
        const rng = signature[arity];
        _assertContext(rng);
        const dom = [];
        for (let i = 0; i < arity; i++) {
          _assertContext(signature[i]);
          dom.push(signature[i].ptr);
        }
        return new FuncDeclImpl(Z3.mk_func_decl(contextPtr, _toSymbol(name2), dom, rng.ptr));
      },
      fresh: (...signature) => {
        const arity = signature.length - 1;
        const rng = signature[arity];
        _assertContext(rng);
        const dom = [];
        for (let i = 0; i < arity; i++) {
          _assertContext(signature[i]);
          dom.push(signature[i].ptr);
        }
        return new FuncDeclImpl(Z3.mk_fresh_func_decl(contextPtr, "f", dom, rng.ptr));
      }
    };
    const RecFunc = {
      declare: (name2, ...signature) => {
        const arity = signature.length - 1;
        const rng = signature[arity];
        _assertContext(rng);
        const dom = [];
        for (let i = 0; i < arity; i++) {
          _assertContext(signature[i]);
          dom.push(signature[i].ptr);
        }
        return new FuncDeclImpl(Z3.mk_rec_func_decl(contextPtr, _toSymbol(name2), dom, rng.ptr));
      },
      addDefinition: (f, args, body) => {
        _assertContext(f, ...args, body);
        check(
          Z3.add_rec_def(
            contextPtr,
            f.ptr,
            args.map((arg) => arg.ast),
            body.ast
          )
        );
      }
    };
    const Bool2 = {
      sort: () => new BoolSortImpl(Z3.mk_bool_sort(contextPtr)),
      const: (name2) => new BoolImpl(Z3.mk_const(contextPtr, _toSymbol(name2), Bool2.sort().ptr)),
      consts: (names) => {
        if (typeof names === "string") {
          names = names.split(" ");
        }
        return names.map((name2) => Bool2.const(name2));
      },
      vector: (prefix, count) => {
        const result = [];
        for (let i = 0; i < count; i++) {
          result.push(Bool2.const(`${prefix}__${i}`));
        }
        return result;
      },
      fresh: (prefix = "b") => new BoolImpl(Z3.mk_fresh_const(contextPtr, prefix, Bool2.sort().ptr)),
      val: (value) => {
        if (value) {
          return new BoolImpl(Z3.mk_true(contextPtr));
        }
        return new BoolImpl(Z3.mk_false(contextPtr));
      }
    };
    const Int = {
      sort: () => new ArithSortImpl(Z3.mk_int_sort(contextPtr)),
      const: (name2) => new ArithImpl(Z3.mk_const(contextPtr, _toSymbol(name2), Int.sort().ptr)),
      consts: (names) => {
        if (typeof names === "string") {
          names = names.split(" ");
        }
        return names.map((name2) => Int.const(name2));
      },
      vector: (prefix, count) => {
        const result = [];
        for (let i = 0; i < count; i++) {
          result.push(Int.const(`${prefix}__${i}`));
        }
        return result;
      },
      fresh: (prefix = "x") => new ArithImpl(Z3.mk_fresh_const(contextPtr, prefix, Int.sort().ptr)),
      val: (value) => {
        assert(typeof value === "bigint" || typeof value === "string" || Number.isSafeInteger(value));
        return new IntNumImpl(check(Z3.mk_numeral(contextPtr, value.toString(), Int.sort().ptr)));
      }
    };
    const Real = {
      sort: () => new ArithSortImpl(Z3.mk_real_sort(contextPtr)),
      const: (name2) => new ArithImpl(check(Z3.mk_const(contextPtr, _toSymbol(name2), Real.sort().ptr))),
      consts: (names) => {
        if (typeof names === "string") {
          names = names.split(" ");
        }
        return names.map((name2) => Real.const(name2));
      },
      vector: (prefix, count) => {
        const result = [];
        for (let i = 0; i < count; i++) {
          result.push(Real.const(`${prefix}__${i}`));
        }
        return result;
      },
      fresh: (prefix = "b") => new ArithImpl(Z3.mk_fresh_const(contextPtr, prefix, Real.sort().ptr)),
      val: (value) => {
        if (isCoercibleRational(value)) {
          value = `${value.numerator}/${value.denominator}`;
        }
        return new RatNumImpl(Z3.mk_numeral(contextPtr, value.toString(), Real.sort().ptr));
      }
    };
    const RCFNum2 = Object.assign((value) => new RCFNumImpl(value), {
      pi: () => new RCFNumImpl(check(Z3.rcf_mk_pi(contextPtr))),
      e: () => new RCFNumImpl(check(Z3.rcf_mk_e(contextPtr))),
      infinitesimal: () => new RCFNumImpl(check(Z3.rcf_mk_infinitesimal(contextPtr))),
      roots: (coefficients) => {
        assert(coefficients.length > 0, "Polynomial coefficients cannot be empty");
        const coeffPtrs = coefficients.map((c) => c.ptr);
        const { rv: numRoots, roots: rootPtrs } = Z3.rcf_mk_roots(contextPtr, coeffPtrs);
        const result = [];
        for (let i = 0; i < numRoots; i++) {
          result.push(new RCFNumImpl(rootPtrs[i]));
        }
        return result;
      }
    });
    const BitVec2 = {
      sort(bits) {
        assert(Number.isSafeInteger(bits), "number of bits must be an integer");
        return new BitVecSortImpl(Z3.mk_bv_sort(contextPtr, bits));
      },
      const(name2, bits) {
        return new BitVecImpl(
          check(Z3.mk_const(contextPtr, _toSymbol(name2), isBitVecSort(bits) ? bits.ptr : BitVec2.sort(bits).ptr))
        );
      },
      consts(names, bits) {
        if (typeof names === "string") {
          names = names.split(" ");
        }
        return names.map((name2) => BitVec2.const(name2, bits));
      },
      val(value, bits) {
        if (value === true) {
          return BitVec2.val(1, bits);
        } else if (value === false) {
          return BitVec2.val(0, bits);
        }
        return new BitVecNumImpl(
          check(Z3.mk_numeral(contextPtr, value.toString(), isBitVecSort(bits) ? bits.ptr : BitVec2.sort(bits).ptr))
        );
      }
    };
    const Float = {
      sort(ebits, sbits) {
        assert(Number.isSafeInteger(ebits) && ebits > 0, "ebits must be a positive integer");
        assert(Number.isSafeInteger(sbits) && sbits > 0, "sbits must be a positive integer");
        return new FPSortImpl(Z3.mk_fpa_sort(contextPtr, ebits, sbits));
      },
      sort16() {
        return new FPSortImpl(Z3.mk_fpa_sort_16(contextPtr));
      },
      sort32() {
        return new FPSortImpl(Z3.mk_fpa_sort_32(contextPtr));
      },
      sort64() {
        return new FPSortImpl(Z3.mk_fpa_sort_64(contextPtr));
      },
      sort128() {
        return new FPSortImpl(Z3.mk_fpa_sort_128(contextPtr));
      },
      const(name2, sort) {
        return new FPImpl(check(Z3.mk_const(contextPtr, _toSymbol(name2), sort.ptr)));
      },
      consts(names, sort) {
        if (typeof names === "string") {
          names = names.split(" ");
        }
        return names.map((name2) => Float.const(name2, sort));
      },
      val(value, sort) {
        return new FPNumImpl(check(Z3.mk_fpa_numeral_double(contextPtr, value, sort.ptr)));
      },
      NaN(sort) {
        return new FPNumImpl(check(Z3.mk_fpa_nan(contextPtr, sort.ptr)));
      },
      inf(sort, negative = false) {
        return new FPNumImpl(check(Z3.mk_fpa_inf(contextPtr, sort.ptr, negative)));
      },
      zero(sort, negative = false) {
        return new FPNumImpl(check(Z3.mk_fpa_zero(contextPtr, sort.ptr, negative)));
      }
    };
    const FloatRM = {
      sort() {
        return new FPRMSortImpl(Z3.mk_fpa_rounding_mode_sort(contextPtr));
      },
      RNE() {
        return new FPRMImpl(check(Z3.mk_fpa_rne(contextPtr)));
      },
      RNA() {
        return new FPRMImpl(check(Z3.mk_fpa_rna(contextPtr)));
      },
      RTP() {
        return new FPRMImpl(check(Z3.mk_fpa_rtp(contextPtr)));
      },
      RTN() {
        return new FPRMImpl(check(Z3.mk_fpa_rtn(contextPtr)));
      },
      RTZ() {
        return new FPRMImpl(check(Z3.mk_fpa_rtz(contextPtr)));
      }
    };
    const String2 = {
      sort() {
        return new SeqSortImpl(Z3.mk_string_sort(contextPtr));
      },
      const(name2) {
        return new SeqImpl(check(Z3.mk_const(contextPtr, _toSymbol(name2), String2.sort().ptr)));
      },
      consts(names) {
        if (typeof names === "string") {
          names = names.split(" ");
        }
        return names.map((name2) => String2.const(name2));
      },
      val(value) {
        return new SeqImpl(check(Z3.mk_string(contextPtr, value)));
      }
    };
    const Seq2 = {
      sort(elemSort) {
        return new SeqSortImpl(Z3.mk_seq_sort(contextPtr, elemSort.ptr));
      },
      empty(elemSort) {
        return new SeqImpl(check(Z3.mk_seq_empty(contextPtr, Seq2.sort(elemSort).ptr)));
      },
      unit(elem) {
        return new SeqImpl(check(Z3.mk_seq_unit(contextPtr, elem.ast)));
      }
    };
    const Re2 = {
      sort(seqSort) {
        return new ReSortImpl(Z3.mk_re_sort(contextPtr, seqSort.ptr));
      },
      toRe(seq) {
        const seqExpr = isSeq(seq) ? seq : String2.val(seq);
        return new ReImpl(check(Z3.mk_seq_to_re(contextPtr, seqExpr.ast)));
      }
    };
    const Array2 = {
      sort(...sig) {
        const arity = sig.length - 1;
        const r = sig[arity];
        const d = sig[0];
        if (arity === 1) {
          return new ArraySortImpl(Z3.mk_array_sort(contextPtr, d.ptr, r.ptr));
        }
        const dom = sig.slice(0, arity);
        return new ArraySortImpl(
          Z3.mk_array_sort_n(
            contextPtr,
            dom.map((s) => s.ptr),
            r.ptr
          )
        );
      },
      const(name2, ...sig) {
        return new ArrayImpl(
          check(Z3.mk_const(contextPtr, _toSymbol(name2), Array2.sort(...sig).ptr))
        );
      },
      consts(names, ...sig) {
        if (typeof names === "string") {
          names = names.split(" ");
        }
        return names.map((name2) => Array2.const(name2, ...sig));
      },
      K(domain, value) {
        return new ArrayImpl(check(Z3.mk_const_array(contextPtr, domain.ptr, value.ptr)));
      }
    };
    const Set2 = {
      // reference: https://z3prover.github.io/api/html/namespacez3py.html#a545f894afeb24caa1b88b7f2a324ee7e
      sort(sort) {
        return Array2.sort(sort, Bool2.sort());
      },
      const(name2, sort) {
        return new SetImpl(
          check(Z3.mk_const(contextPtr, _toSymbol(name2), Array2.sort(sort, Bool2.sort()).ptr))
        );
      },
      consts(names, sort) {
        if (typeof names === "string") {
          names = names.split(" ");
        }
        return names.map((name2) => Set2.const(name2, sort));
      },
      empty(sort) {
        return EmptySet(sort);
      },
      val(values, sort) {
        var result = EmptySet(sort);
        for (const value of values) {
          result = SetAdd(result, value);
        }
        return result;
      }
    };
    const Datatype2 = Object.assign(
      (name2) => {
        return new DatatypeImpl(ctx, name2);
      },
      {
        createDatatypes(...datatypes) {
          return createDatatypes(...datatypes);
        }
      }
    );
    function If(condition, onTrue, onFalse) {
      if (isProbe(condition) && isTactic(onTrue) && isTactic(onFalse)) {
        return Cond(condition, onTrue, onFalse);
      }
      assert(!isProbe(condition) && !isTactic(onTrue) && !isTactic(onFalse), "Mixed expressions and goals");
      if (typeof condition === "boolean") {
        condition = Bool2.val(condition);
      }
      onTrue = from(onTrue);
      onFalse = from(onFalse);
      return _toExpr(check(Z3.mk_ite(contextPtr, condition.ptr, onTrue.ast, onFalse.ast)));
    }
    function Distinct(...exprs) {
      assert(exprs.length > 0, "Can't make Distinct ouf of nothing");
      return new BoolImpl(
        check(
          Z3.mk_distinct(
            contextPtr,
            exprs.map((expr) => {
              expr = from(expr);
              _assertContext(expr);
              return expr.ast;
            })
          )
        )
      );
    }
    function Const(name2, sort) {
      _assertContext(sort);
      return _toExpr(check(Z3.mk_const(contextPtr, _toSymbol(name2), sort.ptr)));
    }
    function Consts(names, sort) {
      _assertContext(sort);
      if (typeof names === "string") {
        names = names.split(" ");
      }
      return names.map((name2) => Const(name2, sort));
    }
    function FreshConst(sort, prefix = "c") {
      _assertContext(sort);
      return _toExpr(Z3.mk_fresh_const(sort.ctx.ptr, prefix, sort.ptr));
    }
    function Var(idx, sort) {
      _assertContext(sort);
      return _toExpr(Z3.mk_bound(sort.ctx.ptr, idx, sort.ptr));
    }
    function Implies(a, b) {
      a = from(a);
      b = from(b);
      _assertContext(a, b);
      return new BoolImpl(check(Z3.mk_implies(contextPtr, a.ptr, b.ptr)));
    }
    function Iff(a, b) {
      a = from(a);
      b = from(b);
      _assertContext(a, b);
      return new BoolImpl(check(Z3.mk_iff(contextPtr, a.ptr, b.ptr)));
    }
    function Eq(a, b) {
      a = from(a);
      b = from(b);
      _assertContext(a, b);
      return a.eq(b);
    }
    function Xor(a, b) {
      a = from(a);
      b = from(b);
      _assertContext(a, b);
      return new BoolImpl(check(Z3.mk_xor(contextPtr, a.ptr, b.ptr)));
    }
    function Not(a) {
      if (typeof a === "boolean") {
        a = from(a);
      }
      _assertContext(a);
      if (isProbe(a)) {
        return new ProbeImpl(check(Z3.probe_not(contextPtr, a.ptr)));
      }
      return new BoolImpl(check(Z3.mk_not(contextPtr, a.ptr)));
    }
    function And(...args) {
      if (args.length == 1 && args[0] instanceof ctx.AstVector) {
        args = [...args[0].values()];
        assert(allSatisfy(args, isBool) ?? true, "AstVector containing not bools");
      }
      const allProbes = allSatisfy(args, isProbe) ?? false;
      if (allProbes) {
        return _probeNary(Z3.probe_and, args);
      } else {
        const castArgs = args.map(from);
        _assertContext(...castArgs);
        return new BoolImpl(
          check(
            Z3.mk_and(
              contextPtr,
              castArgs.map((arg) => arg.ptr)
            )
          )
        );
      }
    }
    function Or(...args) {
      if (args.length == 1 && args[0] instanceof ctx.AstVector) {
        args = [...args[0].values()];
        assert(allSatisfy(args, isBool) ?? true, "AstVector containing not bools");
      }
      const allProbes = allSatisfy(args, isProbe) ?? false;
      if (allProbes) {
        return _probeNary(Z3.probe_or, args);
      } else {
        const castArgs = args.map(from);
        _assertContext(...castArgs);
        return new BoolImpl(
          check(
            Z3.mk_or(
              contextPtr,
              castArgs.map((arg) => arg.ptr)
            )
          )
        );
      }
    }
    function PbEq(args, coeffs, k) {
      _assertContext(...args);
      if (args.length !== coeffs.length) {
        throw new Error("Number of arguments and coefficients must match");
      }
      return new BoolImpl(
        check(
          Z3.mk_pbeq(
            contextPtr,
            args.map((arg) => arg.ast),
            coeffs,
            k
          )
        )
      );
    }
    function PbGe(args, coeffs, k) {
      _assertContext(...args);
      if (args.length !== coeffs.length) {
        throw new Error("Number of arguments and coefficients must match");
      }
      return new BoolImpl(
        check(
          Z3.mk_pbge(
            contextPtr,
            args.map((arg) => arg.ast),
            coeffs,
            k
          )
        )
      );
    }
    function PbLe(args, coeffs, k) {
      _assertContext(...args);
      if (args.length !== coeffs.length) {
        throw new Error("Number of arguments and coefficients must match");
      }
      return new BoolImpl(
        check(
          Z3.mk_pble(
            contextPtr,
            args.map((arg) => arg.ast),
            coeffs,
            k
          )
        )
      );
    }
    function AtMost(args, k) {
      _assertContext(...args);
      return new BoolImpl(
        check(
          Z3.mk_atmost(
            contextPtr,
            args.map((arg) => arg.ast),
            k
          )
        )
      );
    }
    function AtLeast(args, k) {
      _assertContext(...args);
      return new BoolImpl(
        check(
          Z3.mk_atleast(
            contextPtr,
            args.map((arg) => arg.ast),
            k
          )
        )
      );
    }
    function ForAll(quantifiers, body, weight = 1) {
      if (!allSatisfy(quantifiers, isConst)) {
        throw new Error("Quantifier variables must be constants");
      }
      return new NonLambdaQuantifierImpl(
        check(
          Z3.mk_quantifier_const_ex(
            contextPtr,
            true,
            weight,
            _toSymbol(""),
            _toSymbol(""),
            quantifiers.map((q) => q.ptr),
            // The earlier check verifies these are all apps
            [],
            [],
            body.ptr
          )
        )
      );
    }
    function Exists(quantifiers, body, weight = 1) {
      if (!allSatisfy(quantifiers, isConst)) {
        throw new Error("Quantifier variables must be constants");
      }
      return new NonLambdaQuantifierImpl(
        check(
          Z3.mk_quantifier_const_ex(
            contextPtr,
            false,
            weight,
            _toSymbol(""),
            _toSymbol(""),
            quantifiers.map((q) => q.ptr),
            // The earlier check verifies these are all apps
            [],
            [],
            body.ptr
          )
        )
      );
    }
    function Lambda(quantifiers, expr) {
      if (!allSatisfy(quantifiers, isConst)) {
        throw new Error("Quantifier variables must be constants");
      }
      return new LambdaImpl(
        check(
          Z3.mk_lambda_const(
            contextPtr,
            quantifiers.map((q) => q.ptr),
            expr.ptr
          )
        )
      );
    }
    function ToReal(expr) {
      expr = from(expr);
      _assertContext(expr);
      assert(isInt(expr), "Int expression expected");
      return new ArithImpl(check(Z3.mk_int2real(contextPtr, expr.ast)));
    }
    function ToInt(expr) {
      if (!isExpr(expr)) {
        expr = Real.val(expr);
      }
      _assertContext(expr);
      assert(isReal(expr), "Real expression expected");
      return new ArithImpl(check(Z3.mk_real2int(contextPtr, expr.ast)));
    }
    function IsInt(expr) {
      if (!isExpr(expr)) {
        expr = Real.val(expr);
      }
      _assertContext(expr);
      assert(isReal(expr), "Real expression expected");
      return new BoolImpl(check(Z3.mk_is_int(contextPtr, expr.ast)));
    }
    function Sqrt(a) {
      if (!isExpr(a)) {
        a = Real.val(a);
      }
      return a.pow("1/2");
    }
    function Cbrt(a) {
      if (!isExpr(a)) {
        a = Real.val(a);
      }
      return a.pow("1/3");
    }
    function BV2Int(a, isSigned) {
      _assertContext(a);
      return new ArithImpl(check(Z3.mk_bv2int(contextPtr, a.ast, isSigned)));
    }
    function Int2BV(a, bits) {
      if (isArith(a)) {
        assert(isInt(a), "parameter must be an integer");
      } else {
        assert(typeof a !== "number" || Number.isSafeInteger(a), "parameter must not have decimal places");
        a = Int.val(a);
      }
      return new BitVecImpl(check(Z3.mk_int2bv(contextPtr, bits, a.ast)));
    }
    function Concat(...bitvecs) {
      _assertContext(...bitvecs);
      return bitvecs.reduce((prev, curr) => new BitVecImpl(check(Z3.mk_concat(contextPtr, prev.ast, curr.ast))));
    }
    function Cond(probe, onTrue, onFalse) {
      _assertContext(probe, onTrue, onFalse);
      return new TacticImpl(check(Z3.tactic_cond(contextPtr, probe.ptr, onTrue.ptr, onFalse.ptr)));
    }
    function _toTactic(t) {
      return typeof t === "string" ? new TacticImpl(t) : t;
    }
    function AndThen(t1, t2, ...ts) {
      let result = _toTactic(t1);
      let current = _toTactic(t2);
      _assertContext(result, current);
      result = new TacticImpl(check(Z3.tactic_and_then(contextPtr, result.ptr, current.ptr)));
      for (const t of ts) {
        current = _toTactic(t);
        _assertContext(result, current);
        result = new TacticImpl(check(Z3.tactic_and_then(contextPtr, result.ptr, current.ptr)));
      }
      return result;
    }
    function OrElse(t1, t2, ...ts) {
      let result = _toTactic(t1);
      let current = _toTactic(t2);
      _assertContext(result, current);
      result = new TacticImpl(check(Z3.tactic_or_else(contextPtr, result.ptr, current.ptr)));
      for (const t of ts) {
        current = _toTactic(t);
        _assertContext(result, current);
        result = new TacticImpl(check(Z3.tactic_or_else(contextPtr, result.ptr, current.ptr)));
      }
      return result;
    }
    const UINT_MAX = 4294967295;
    function Repeat(t, max) {
      const tactic = _toTactic(t);
      _assertContext(tactic);
      const maxVal = max !== void 0 ? max : UINT_MAX;
      return new TacticImpl(check(Z3.tactic_repeat(contextPtr, tactic.ptr, maxVal)));
    }
    function TryFor(t, ms) {
      const tactic = _toTactic(t);
      _assertContext(tactic);
      return new TacticImpl(check(Z3.tactic_try_for(contextPtr, tactic.ptr, ms)));
    }
    function When(p, t) {
      const tactic = _toTactic(t);
      _assertContext(p, tactic);
      return new TacticImpl(check(Z3.tactic_when(contextPtr, p.ptr, tactic.ptr)));
    }
    function Skip() {
      return new TacticImpl(check(Z3.tactic_skip(contextPtr)));
    }
    function Fail() {
      return new TacticImpl(check(Z3.tactic_fail(contextPtr)));
    }
    function FailIf(p) {
      _assertContext(p);
      return new TacticImpl(check(Z3.tactic_fail_if(contextPtr, p.ptr)));
    }
    function ParOr(...tactics) {
      assert(tactics.length > 0, "ParOr requires at least one tactic");
      const tacticImpls = tactics.map((t) => _toTactic(t));
      _assertContext(...tacticImpls);
      const tacticPtrs = tacticImpls.map((t) => t.ptr);
      return new TacticImpl(check(Z3.tactic_par_or(contextPtr, tacticPtrs)));
    }
    function ParAndThen(t1, t2) {
      const tactic1 = _toTactic(t1);
      const tactic2 = _toTactic(t2);
      _assertContext(tactic1, tactic2);
      return new TacticImpl(check(Z3.tactic_par_and_then(contextPtr, tactic1.ptr, tactic2.ptr)));
    }
    function With(t, params) {
      const tactic = _toTactic(t);
      _assertContext(tactic);
      const z3params = check(Z3.mk_params(contextPtr));
      Z3.params_inc_ref(contextPtr, z3params);
      try {
        for (const [key, value] of Object.entries(params)) {
          const sym = _toSymbol(key);
          if (typeof value === "boolean") {
            Z3.params_set_bool(contextPtr, z3params, sym, value);
          } else if (typeof value === "number") {
            if (Number.isInteger(value)) {
              Z3.params_set_uint(contextPtr, z3params, sym, value);
            } else {
              Z3.params_set_double(contextPtr, z3params, sym, value);
            }
          } else if (typeof value === "string") {
            Z3.params_set_symbol(contextPtr, z3params, sym, _toSymbol(value));
          } else {
            throw new Error(`Unsupported parameter type for ${key}`);
          }
        }
        const result = new TacticImpl(check(Z3.tactic_using_params(contextPtr, tactic.ptr, z3params)));
        return result;
      } finally {
        Z3.params_dec_ref(contextPtr, z3params);
      }
    }
    function LT(a, b) {
      return new BoolImpl(check(Z3.mk_lt(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function GT(a, b) {
      return new BoolImpl(check(Z3.mk_gt(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function LE(a, b) {
      return new BoolImpl(check(Z3.mk_le(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function GE(a, b) {
      return new BoolImpl(check(Z3.mk_ge(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function ULT(a, b) {
      return new BoolImpl(check(Z3.mk_bvult(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function UGT(a, b) {
      return new BoolImpl(check(Z3.mk_bvugt(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function ULE(a, b) {
      return new BoolImpl(check(Z3.mk_bvule(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function UGE(a, b) {
      return new BoolImpl(check(Z3.mk_bvuge(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function SLT(a, b) {
      return new BoolImpl(check(Z3.mk_bvslt(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function SGT(a, b) {
      return new BoolImpl(check(Z3.mk_bvsgt(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function SLE(a, b) {
      return new BoolImpl(check(Z3.mk_bvsle(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function SGE(a, b) {
      return new BoolImpl(check(Z3.mk_bvsge(contextPtr, a.ast, a.sort.cast(b).ast)));
    }
    function Extract(hi, lo, val) {
      return new BitVecImpl(check(Z3.mk_extract(contextPtr, hi, lo, val.ast)));
    }
    function Select(array, ...indices) {
      const args = indices.map((arg, i) => array.domain_n(i).cast(arg));
      if (args.length === 1) {
        return _toExpr(check(Z3.mk_select(contextPtr, array.ast, args[0].ast)));
      }
      const _args = args.map((arg) => arg.ast);
      return _toExpr(check(Z3.mk_select_n(contextPtr, array.ast, _args)));
    }
    function Store(array, ...indicesAndValue) {
      const args = indicesAndValue.map((arg, i) => {
        if (i === indicesAndValue.length - 1) {
          return array.range().cast(arg);
        }
        return array.domain_n(i).cast(arg);
      });
      if (args.length <= 1) {
        throw new Error("Array store requires both index and value arguments");
      }
      if (args.length === 2) {
        return _toExpr(check(Z3.mk_store(contextPtr, array.ast, args[0].ast, args[1].ast)));
      }
      const _idxs = args.slice(0, args.length - 1).map((arg) => arg.ast);
      return _toExpr(check(Z3.mk_store_n(contextPtr, array.ast, _idxs, args[args.length - 1].ast)));
    }
    function Ext(a, b) {
      return _toExpr(check(Z3.mk_array_ext(contextPtr, a.ast, b.ast)));
    }
    function SetUnion(...args) {
      return new SetImpl(
        check(
          Z3.mk_set_union(
            contextPtr,
            args.map((arg) => arg.ast)
          )
        )
      );
    }
    function SetIntersect(...args) {
      return new SetImpl(
        check(
          Z3.mk_set_intersect(
            contextPtr,
            args.map((arg) => arg.ast)
          )
        )
      );
    }
    function SetDifference(a, b) {
      return new SetImpl(check(Z3.mk_set_difference(contextPtr, a.ast, b.ast)));
    }
    function SetAdd(set, elem) {
      const arg = set.elemSort().cast(elem);
      return new SetImpl(check(Z3.mk_set_add(contextPtr, set.ast, arg.ast)));
    }
    function SetDel(set, elem) {
      const arg = set.elemSort().cast(elem);
      return new SetImpl(check(Z3.mk_set_del(contextPtr, set.ast, arg.ast)));
    }
    function SetComplement(set) {
      return new SetImpl(check(Z3.mk_set_complement(contextPtr, set.ast)));
    }
    function EmptySet(sort) {
      return new SetImpl(check(Z3.mk_empty_set(contextPtr, sort.ptr)));
    }
    function FullSet(sort) {
      return new SetImpl(check(Z3.mk_full_set(contextPtr, sort.ptr)));
    }
    function isMember(elem, set) {
      const arg = set.elemSort().cast(elem);
      return new BoolImpl(check(Z3.mk_set_member(contextPtr, arg.ast, set.ast)));
    }
    function isSubset(a, b) {
      return new BoolImpl(check(Z3.mk_set_subset(contextPtr, a.ast, b.ast)));
    }
    function InRe(seq, re) {
      const seqExpr = isSeq(seq) ? seq : String2.val(seq);
      return new BoolImpl(check(Z3.mk_seq_in_re(contextPtr, seqExpr.ast, re.ast)));
    }
    function Union(...res) {
      if (res.length === 0) {
        throw new Error("Union requires at least one argument");
      }
      if (res.length === 1) {
        return res[0];
      }
      return new ReImpl(check(Z3.mk_re_union(contextPtr, res.map((r) => r.ast))));
    }
    function Intersect(...res) {
      if (res.length === 0) {
        throw new Error("Intersect requires at least one argument");
      }
      if (res.length === 1) {
        return res[0];
      }
      return new ReImpl(check(Z3.mk_re_intersect(contextPtr, res.map((r) => r.ast))));
    }
    function ReConcat(...res) {
      if (res.length === 0) {
        throw new Error("ReConcat requires at least one argument");
      }
      if (res.length === 1) {
        return res[0];
      }
      return new ReImpl(check(Z3.mk_re_concat(contextPtr, res.map((r) => r.ast))));
    }
    function Plus(re) {
      return new ReImpl(check(Z3.mk_re_plus(contextPtr, re.ast)));
    }
    function Star(re) {
      return new ReImpl(check(Z3.mk_re_star(contextPtr, re.ast)));
    }
    function Option(re) {
      return new ReImpl(check(Z3.mk_re_option(contextPtr, re.ast)));
    }
    function Complement(re) {
      return new ReImpl(check(Z3.mk_re_complement(contextPtr, re.ast)));
    }
    function Diff(a, b) {
      return new ReImpl(check(Z3.mk_re_diff(contextPtr, a.ast, b.ast)));
    }
    function Range(lo, hi) {
      const loSeq = isSeq(lo) ? lo : String2.val(lo);
      const hiSeq = isSeq(hi) ? hi : String2.val(hi);
      return new ReImpl(check(Z3.mk_re_range(contextPtr, loSeq.ast, hiSeq.ast)));
    }
    function Loop(re, lo, hi = 0) {
      return new ReImpl(check(Z3.mk_re_loop(contextPtr, re.ast, lo, hi)));
    }
    function Power(re, n) {
      return new ReImpl(check(Z3.mk_re_power(contextPtr, re.ast, n)));
    }
    function AllChar(reSort) {
      return new ReImpl(check(Z3.mk_re_allchar(contextPtr, reSort.ptr)));
    }
    function Empty(reSort) {
      return new ReImpl(check(Z3.mk_re_empty(contextPtr, reSort.ptr)));
    }
    function Full(reSort) {
      return new ReImpl(check(Z3.mk_re_full(contextPtr, reSort.ptr)));
    }
    function mkPartialOrder(sort, index) {
      return new FuncDeclImpl(check(Z3.mk_partial_order(contextPtr, sort.ptr, index)));
    }
    function mkTransitiveClosure(f) {
      return new FuncDeclImpl(check(Z3.mk_transitive_closure(contextPtr, f.ptr)));
    }
    async function polynomialSubresultants(p, q, x) {
      const result = await Z3.polynomial_subresultants(contextPtr, p.ast, q.ast, x.ast);
      return new AstVectorImpl(check(result));
    }
    class AstImpl {
      constructor(ptr) {
        this.ptr = ptr;
        this.ctx = ctx;
        const myAst = this.ast;
        Z3.inc_ref(contextPtr, myAst);
        cleanup.register(this, () => Z3.dec_ref(contextPtr, myAst), this);
      }
      ctx;
      get ast() {
        return this.ptr;
      }
      id() {
        return Z3.get_ast_id(contextPtr, this.ast);
      }
      eqIdentity(other) {
        _assertContext(other);
        return check(Z3.is_eq_ast(contextPtr, this.ast, other.ast));
      }
      neqIdentity(other) {
        _assertContext(other);
        return !this.eqIdentity(other);
      }
      sexpr() {
        return Z3.ast_to_string(contextPtr, this.ast);
      }
      hash() {
        return Z3.get_ast_hash(contextPtr, this.ast);
      }
      toString() {
        return this.sexpr();
      }
    }
    class SolveModelImpl {
      constructor(epoch, declarations) {
        this.epoch = epoch;
        this.declarations = declarations;
        this.ctx = ctx;
      }
      ctx;
      async text() {
        const out = await solveService.query("(get-model)", this.epoch);
        const trimmed = out.trim();
        if (trimmed.startsWith("(error")) {
          throw new Error(`failed to fetch model: ${trimmed}`);
        }
        return trimmed;
      }
      async evalText(expr) {
        _assertContext(expr);
        const out = await solveService.query(`(get-value (${expr.sexpr()}))`, this.epoch);
        return extractGetValue(out);
      }
      async eval(expr) {
        const valueText = await this.evalText(expr);
        const script = `${this.declarations}
(assert (= ${expr.sexpr()} ${valueText}))`;
        let assertions;
        try {
          assertions = check(Z3.parse_smtlib2_string(contextPtr, script, [], [], [], []));
        } catch (e) {
          throw new Error(
            `could not convert model value \`${valueText}\` back into an expression (use evalText() for the raw SMT-LIB text): ${e instanceof Error ? e.message : e}`
          );
        }
        const count = Z3.ast_vector_size(contextPtr, assertions);
        assert(count > 0, "model value re-parse produced no assertions");
        const equality = Z3.ast_vector_get(contextPtr, assertions, count - 1);
        return _toExpr(check(Z3.get_app_arg(contextPtr, Z3.to_app(contextPtr, equality), 1)));
      }
      async get(expr) {
        return this.eval(expr);
      }
    }
    class SolverImpl {
      ctx;
      _ptr;
      _lastOutcome = null;
      _lastCheckBody = null;
      get ptr() {
        _assertPtr(this._ptr);
        return this._ptr;
      }
      constructor(ptr = Z3.mk_solver(contextPtr)) {
        this.ctx = ctx;
        let myPtr;
        if (typeof ptr === "string") {
          myPtr = check(Z3.mk_solver_for_logic(contextPtr, _toSymbol(ptr)));
        } else {
          myPtr = ptr;
        }
        this._ptr = myPtr;
        Z3.solver_inc_ref(contextPtr, myPtr);
        cleanup.register(this, () => Z3.solver_dec_ref(contextPtr, myPtr), this);
      }
      set(key, value) {
        Z3.solver_set_params(contextPtr, this.ptr, _toParams(key, value));
      }
      push() {
        Z3.solver_push(contextPtr, this.ptr);
      }
      pop(num = 1) {
        Z3.solver_pop(contextPtr, this.ptr, num);
      }
      numScopes() {
        return Z3.solver_get_num_scopes(contextPtr, this.ptr);
      }
      reset() {
        Z3.solver_reset(contextPtr, this.ptr);
      }
      add(...exprs) {
        _flattenArgs(exprs).forEach((expr) => {
          _assertContext(expr);
          check(Z3.solver_assert(contextPtr, this.ptr, expr.ast));
        });
      }
      addAndTrack(expr, constant) {
        if (typeof constant === "string") {
          constant = Bool2.const(constant);
        }
        assert(isConst(constant), "Provided expression that is not a constant to addAndTrack");
        check(Z3.solver_assert_and_track(contextPtr, this.ptr, expr.ast, constant.ast));
      }
      addSimplifier(simplifier) {
        _assertContext(simplifier);
        check(Z3.solver_add_simplifier(contextPtr, this.ptr, simplifier.ptr));
      }
      assertions() {
        return new AstVectorImpl(check(Z3.solver_get_assertions(contextPtr, this.ptr)));
      }
      async check(...exprs) {
        const assumptions = _flattenArgs(exprs).map((expr) => {
          _assertContext(expr);
          return expr;
        });
        let body = check(Z3.solver_to_string(contextPtr, this.ptr));
        for (const assumption of assumptions) {
          body += `(assert ${assumption.sexpr()})
`;
        }
        const outcome = await asyncMutex.runExclusive(() => solveService.check(body + "(check-sat)\n"));
        this._lastOutcome = outcome;
        this._lastCheckBody = body;
        return outcome.status;
      }
      unsatCore() {
        throw new Error(
          "unsatCore is not supported by z3-josh: solving happens in a worker over serialized SMT-LIB2, which does not round-trip cores"
        );
      }
      model() {
        if (this._lastOutcome === null || this._lastOutcome.status !== "sat") {
          throw new Error("model is only available after a check() that returned sat");
        }
        assert(this._lastCheckBody !== null);
        return new SolveModelImpl(this._lastOutcome.epoch, this._lastCheckBody);
      }
      statistics() {
        return new StatisticsImpl(check(Z3.solver_get_statistics(contextPtr, this.ptr)));
      }
      reasonUnknown() {
        if (this._lastOutcome !== null && this._lastOutcome.status === "unknown") {
          return this._lastOutcome.output;
        }
        return check(Z3.solver_get_reason_unknown(contextPtr, this.ptr));
      }
      toString() {
        return check(Z3.solver_to_string(contextPtr, this.ptr));
      }
      toSmtlib2(status = "unknown") {
        const assertionsVec = this.assertions();
        const numAssertions = assertionsVec.length();
        let formula;
        let assumptions;
        if (numAssertions > 0) {
          assumptions = [];
          for (let i = 0; i < numAssertions - 1; i++) {
            assumptions.push(assertionsVec.get(i).ast);
          }
          formula = assertionsVec.get(numAssertions - 1).ast;
        } else {
          assumptions = [];
          formula = ctx.Bool.val(true).ast;
        }
        return check(Z3.benchmark_to_smtlib_string(
          contextPtr,
          "",
          "",
          status,
          "",
          assumptions,
          formula
        ));
      }
      fromString(s) {
        Z3.solver_from_string(contextPtr, this.ptr, s);
        throwIfError();
      }
      units() {
        return new AstVectorImpl(check(Z3.solver_get_units(contextPtr, this.ptr)));
      }
      nonUnits() {
        return new AstVectorImpl(check(Z3.solver_get_non_units(contextPtr, this.ptr)));
      }
      trail() {
        return new AstVectorImpl(check(Z3.solver_get_trail(contextPtr, this.ptr)));
      }
      congruenceRoot(expr) {
        _assertContext(expr);
        return _toExpr(check(Z3.solver_congruence_root(contextPtr, this.ptr, expr.ast)));
      }
      congruenceNext(expr) {
        _assertContext(expr);
        return _toExpr(check(Z3.solver_congruence_next(contextPtr, this.ptr, expr.ast)));
      }
      congruenceExplain(a, b) {
        _assertContext(a);
        _assertContext(b);
        return _toExpr(check(Z3.solver_congruence_explain(contextPtr, this.ptr, a.ast, b.ast)));
      }
      fromFile(filename) {
        Z3.solver_from_file(contextPtr, this.ptr, filename);
        throwIfError();
      }
      release() {
        Z3.solver_dec_ref(contextPtr, this.ptr);
        this._ptr = null;
        cleanup.unregister(this);
      }
    }
    class OptimizeImpl {
      ctx;
      _ptr;
      get ptr() {
        _assertPtr(this._ptr);
        return this._ptr;
      }
      constructor(ptr = Z3.mk_optimize(contextPtr)) {
        this.ctx = ctx;
        let myPtr;
        myPtr = ptr;
        this._ptr = myPtr;
        Z3.optimize_inc_ref(contextPtr, myPtr);
        cleanup.register(this, () => Z3.optimize_dec_ref(contextPtr, myPtr), this);
      }
      set(key, value) {
        Z3.optimize_set_params(contextPtr, this.ptr, _toParams(key, value));
      }
      push() {
        Z3.optimize_push(contextPtr, this.ptr);
      }
      pop() {
        Z3.optimize_pop(contextPtr, this.ptr);
      }
      add(...exprs) {
        _flattenArgs(exprs).forEach((expr) => {
          _assertContext(expr);
          check(Z3.optimize_assert(contextPtr, this.ptr, expr.ast));
        });
      }
      addSoft(expr, weight, id = "") {
        if (isCoercibleRational(weight)) {
          weight = `${weight.numerator}/${weight.denominator}`;
        }
        check(Z3.optimize_assert_soft(contextPtr, this.ptr, expr.ast, weight.toString(), _toSymbol(id)));
      }
      addAndTrack(expr, constant) {
        if (typeof constant === "string") {
          constant = Bool2.const(constant);
        }
        assert(isConst(constant), "Provided expression that is not a constant to addAndTrack");
        check(Z3.optimize_assert_and_track(contextPtr, this.ptr, expr.ast, constant.ast));
      }
      assertions() {
        return new AstVectorImpl(check(Z3.optimize_get_assertions(contextPtr, this.ptr)));
      }
      maximize(expr) {
        check(Z3.optimize_maximize(contextPtr, this.ptr, expr.ast));
      }
      minimize(expr) {
        check(Z3.optimize_minimize(contextPtr, this.ptr, expr.ast));
      }
      async check(...exprs) {
        const assumptions = _flattenArgs(exprs).map((expr) => {
          _assertContext(expr);
          return expr.ast;
        });
        const result = await asyncMutex.runExclusive(() => check(Z3.optimize_check(contextPtr, this.ptr, assumptions)));
        switch (result) {
          case -1 /* Z3_L_FALSE */:
            return "unsat";
          case 1 /* Z3_L_TRUE */:
            return "sat";
          case 0 /* Z3_L_UNDEF */:
            return "unknown";
          default:
            assertExhaustive(result);
        }
      }
      model() {
        return new ModelImpl(check(Z3.optimize_get_model(contextPtr, this.ptr)));
      }
      statistics() {
        return new StatisticsImpl(check(Z3.optimize_get_statistics(contextPtr, this.ptr)));
      }
      toString() {
        return check(Z3.optimize_to_string(contextPtr, this.ptr));
      }
      fromString(s) {
        Z3.optimize_from_string(contextPtr, this.ptr, s);
        throwIfError();
      }
      release() {
        Z3.optimize_dec_ref(contextPtr, this.ptr);
        this._ptr = null;
        cleanup.unregister(this);
      }
    }
    class FixedpointImpl {
      ctx;
      _ptr;
      get ptr() {
        _assertPtr(this._ptr);
        return this._ptr;
      }
      constructor(ptr = Z3.mk_fixedpoint(contextPtr)) {
        this.ctx = ctx;
        let myPtr;
        myPtr = ptr;
        this._ptr = myPtr;
        Z3.fixedpoint_inc_ref(contextPtr, myPtr);
        cleanup.register(this, () => Z3.fixedpoint_dec_ref(contextPtr, myPtr), this);
      }
      set(key, value) {
        Z3.fixedpoint_set_params(contextPtr, this.ptr, _toParams(key, value));
      }
      help() {
        return check(Z3.fixedpoint_get_help(contextPtr, this.ptr));
      }
      add(...constraints) {
        constraints.forEach((constraint) => {
          _assertContext(constraint);
          check(Z3.fixedpoint_assert(contextPtr, this.ptr, constraint.ast));
        });
      }
      registerRelation(pred) {
        _assertContext(pred);
        check(Z3.fixedpoint_register_relation(contextPtr, this.ptr, pred.ptr));
      }
      addRule(rule, name2) {
        _assertContext(rule);
        const symbol = _toSymbol(name2 ?? "");
        check(Z3.fixedpoint_add_rule(contextPtr, this.ptr, rule.ast, symbol));
      }
      addFact(pred, ...args) {
        _assertContext(pred);
        check(Z3.fixedpoint_add_fact(contextPtr, this.ptr, pred.ptr, args));
      }
      updateRule(rule, name2) {
        _assertContext(rule);
        const symbol = _toSymbol(name2);
        check(Z3.fixedpoint_update_rule(contextPtr, this.ptr, rule.ast, symbol));
      }
      async query(query) {
        _assertContext(query);
        const result = await asyncMutex.runExclusive(() => check(Z3.fixedpoint_query(contextPtr, this.ptr, query.ast)));
        switch (result) {
          case -1 /* Z3_L_FALSE */:
            return "unsat";
          case 1 /* Z3_L_TRUE */:
            return "sat";
          case 0 /* Z3_L_UNDEF */:
            return "unknown";
          default:
            assertExhaustive(result);
        }
      }
      async queryRelations(...relations) {
        relations.forEach((rel) => _assertContext(rel));
        const decls = relations.map((rel) => rel.ptr);
        const result = await asyncMutex.runExclusive(
          () => check(Z3.fixedpoint_query_relations(contextPtr, this.ptr, decls))
        );
        switch (result) {
          case -1 /* Z3_L_FALSE */:
            return "unsat";
          case 1 /* Z3_L_TRUE */:
            return "sat";
          case 0 /* Z3_L_UNDEF */:
            return "unknown";
          default:
            assertExhaustive(result);
        }
      }
      getAnswer() {
        const ans = check(Z3.fixedpoint_get_answer(contextPtr, this.ptr));
        return ans ? _toExpr(ans) : null;
      }
      getReasonUnknown() {
        return check(Z3.fixedpoint_get_reason_unknown(contextPtr, this.ptr));
      }
      getNumLevels(pred) {
        _assertContext(pred);
        return check(Z3.fixedpoint_get_num_levels(contextPtr, this.ptr, pred.ptr));
      }
      getCoverDelta(level, pred) {
        _assertContext(pred);
        const res = check(Z3.fixedpoint_get_cover_delta(contextPtr, this.ptr, level, pred.ptr));
        return res ? _toExpr(res) : null;
      }
      addCover(level, pred, property) {
        _assertContext(pred);
        _assertContext(property);
        check(Z3.fixedpoint_add_cover(contextPtr, this.ptr, level, pred.ptr, property.ast));
      }
      getRules() {
        return new AstVectorImpl(check(Z3.fixedpoint_get_rules(contextPtr, this.ptr)));
      }
      getAssertions() {
        return new AstVectorImpl(check(Z3.fixedpoint_get_assertions(contextPtr, this.ptr)));
      }
      setPredicateRepresentation(pred, kinds) {
        _assertContext(pred);
        const symbols = kinds.map((kind) => _toSymbol(kind));
        check(Z3.fixedpoint_set_predicate_representation(contextPtr, this.ptr, pred.ptr, symbols));
      }
      toString() {
        return check(Z3.fixedpoint_to_string(contextPtr, this.ptr, []));
      }
      fromString(s) {
        const av = check(Z3.fixedpoint_from_string(contextPtr, this.ptr, s));
        return new AstVectorImpl(av);
      }
      fromFile(file) {
        const av = check(Z3.fixedpoint_from_file(contextPtr, this.ptr, file));
        return new AstVectorImpl(av);
      }
      statistics() {
        return new StatisticsImpl(check(Z3.fixedpoint_get_statistics(contextPtr, this.ptr)));
      }
      release() {
        Z3.fixedpoint_dec_ref(contextPtr, this.ptr);
        this._ptr = null;
        cleanup.unregister(this);
      }
    }
    class ModelImpl {
      ctx;
      _ptr;
      get ptr() {
        _assertPtr(this._ptr);
        return this._ptr;
      }
      constructor(ptr = Z3.mk_model(contextPtr)) {
        this.ctx = ctx;
        this._ptr = ptr;
        Z3.model_inc_ref(contextPtr, ptr);
        cleanup.register(this, () => Z3.model_dec_ref(contextPtr, ptr), this);
      }
      length() {
        return Z3.model_get_num_consts(contextPtr, this.ptr) + Z3.model_get_num_funcs(contextPtr, this.ptr);
      }
      [Symbol.iterator]() {
        return this.values();
      }
      *entries() {
        const length = this.length();
        for (let i = 0; i < length; i++) {
          yield [i, this.get(i)];
        }
      }
      *keys() {
        for (const [key] of this.entries()) {
          yield key;
        }
      }
      *values() {
        for (const [, value] of this.entries()) {
          yield value;
        }
      }
      decls() {
        return [...this.values()];
      }
      sexpr() {
        return check(Z3.model_to_string(contextPtr, this.ptr));
      }
      toString() {
        return this.sexpr();
      }
      eval(expr, modelCompletion = false) {
        _assertContext(expr);
        const r = check(Z3.model_eval(contextPtr, this.ptr, expr.ast, modelCompletion));
        if (r === null) {
          throw new Z3Error("Failed to evaluate expression in the model");
        }
        return _toExpr(r);
      }
      get(i, to) {
        assert(to === void 0 || typeof i === "number");
        if (typeof i === "number") {
          const length = this.length();
          if (i >= length) {
            throw new RangeError(`expected index ${i} to be less than length ${length}`);
          }
          if (to === void 0) {
            const numConsts = check(Z3.model_get_num_consts(contextPtr, this.ptr));
            if (i < numConsts) {
              return new FuncDeclImpl(check(Z3.model_get_const_decl(contextPtr, this.ptr, i)));
            } else {
              return new FuncDeclImpl(check(Z3.model_get_func_decl(contextPtr, this.ptr, i - numConsts)));
            }
          }
          if (to < 0) {
            to += length;
          }
          if (to >= length) {
            throw new RangeError(`expected index ${to} to be less than length ${length}`);
          }
          const result = [];
          for (let j = i; j < to; j++) {
            result.push(this.get(j));
          }
          return result;
        } else if (isFuncDecl(i) || isExpr(i) && isConst(i)) {
          const result = this.getInterp(i);
          assert(result !== null);
          return result;
        } else if (isSort(i)) {
          return this.getUniverse(i);
        }
        assert(false, "Number, declaration or constant expected");
      }
      updateValue(decl, a) {
        _assertContext(decl);
        _assertContext(a);
        if (isExpr(decl)) {
          decl = decl.decl();
        }
        if (isFuncDecl(decl) && decl.arity() !== 0 && isFuncInterp(a)) {
          const funcInterp = this.addFuncInterp(decl, a.elseValue());
          for (let i = 0; i < a.numEntries(); i++) {
            const e = a.entry(i);
            const n = e.numArgs();
            const args = globalThis.Array.from({ length: n }, (_, i2) => e.argValue(i2));
            funcInterp.addEntry(args, e.value());
          }
          return;
        }
        if (!isFuncDecl(decl) || decl.arity() !== 0) {
          throw new Z3Error("Expecting 0-ary function or constant expression");
        }
        if (!isAst(a)) {
          throw new Z3Error("Only func declarations can be assigned to func interpretations");
        }
        check(Z3.add_const_interp(contextPtr, this.ptr, decl.ptr, a.ast));
      }
      addFuncInterp(decl, defaultValue) {
        const fi = check(
          Z3.add_func_interp(contextPtr, this.ptr, decl.ptr, decl.range().cast(defaultValue).ptr)
        );
        return new FuncInterpImpl(fi);
      }
      getInterp(expr) {
        assert(isFuncDecl(expr) || isConst(expr), "Declaration expected");
        if (isConst(expr)) {
          assert(isExpr(expr));
          expr = expr.decl();
        }
        assert(isFuncDecl(expr));
        if (expr.arity() === 0) {
          const result = check(Z3.model_get_const_interp(contextPtr, this.ptr, expr.ptr));
          if (result === null) {
            return null;
          }
          return _toExpr(result);
        } else {
          const interp = check(Z3.model_get_func_interp(contextPtr, this.ptr, expr.ptr));
          if (interp === null) {
            return null;
          }
          return new FuncInterpImpl(interp);
        }
      }
      getUniverse(sort) {
        _assertContext(sort);
        return new AstVectorImpl(check(Z3.model_get_sort_universe(contextPtr, this.ptr, sort.ptr)));
      }
      numSorts() {
        return check(Z3.model_get_num_sorts(contextPtr, this.ptr));
      }
      getSort(i) {
        return _toSort(check(Z3.model_get_sort(contextPtr, this.ptr, i)));
      }
      getSorts() {
        const n = this.numSorts();
        const result = [];
        for (let i = 0; i < n; i++) {
          result.push(this.getSort(i));
        }
        return result;
      }
      sortUniverse(sort) {
        return this.getUniverse(sort);
      }
      release() {
        Z3.model_dec_ref(contextPtr, this.ptr);
        this._ptr = null;
        cleanup.unregister(this);
      }
    }
    class StatisticsImpl {
      ctx;
      _ptr;
      get ptr() {
        _assertPtr(this._ptr);
        return this._ptr;
      }
      constructor(ptr) {
        this.ctx = ctx;
        this._ptr = ptr;
        Z3.stats_inc_ref(contextPtr, ptr);
        cleanup.register(this, () => Z3.stats_dec_ref(contextPtr, ptr), this);
      }
      size() {
        return Z3.stats_size(contextPtr, this.ptr);
      }
      keys() {
        const result = [];
        const sz = this.size();
        for (let i = 0; i < sz; i++) {
          result.push(Z3.stats_get_key(contextPtr, this.ptr, i));
        }
        return result;
      }
      get(key) {
        const sz = this.size();
        for (let i = 0; i < sz; i++) {
          if (Z3.stats_get_key(contextPtr, this.ptr, i) === key) {
            if (Z3.stats_is_uint(contextPtr, this.ptr, i)) {
              return Z3.stats_get_uint_value(contextPtr, this.ptr, i);
            } else {
              return Z3.stats_get_double_value(contextPtr, this.ptr, i);
            }
          }
        }
        throw new Error(`Statistics key not found: ${key}`);
      }
      entries() {
        const result = [];
        const sz = this.size();
        for (let i = 0; i < sz; i++) {
          const key = Z3.stats_get_key(contextPtr, this.ptr, i);
          const isUint = Z3.stats_is_uint(contextPtr, this.ptr, i);
          const isDouble = Z3.stats_is_double(contextPtr, this.ptr, i);
          const value = isUint ? Z3.stats_get_uint_value(contextPtr, this.ptr, i) : Z3.stats_get_double_value(contextPtr, this.ptr, i);
          result.push({
            __typename: "StatisticsEntry",
            key,
            value,
            isUint,
            isDouble
          });
        }
        return result;
      }
      [Symbol.iterator]() {
        return this.entries()[Symbol.iterator]();
      }
      release() {
        Z3.stats_dec_ref(contextPtr, this.ptr);
        this._ptr = null;
        cleanup.unregister(this);
      }
    }
    class FuncEntryImpl {
      constructor(ptr) {
        this.ptr = ptr;
        this.ctx = ctx;
        Z3.func_entry_inc_ref(contextPtr, ptr);
        cleanup.register(this, () => Z3.func_entry_dec_ref(contextPtr, ptr), this);
      }
      ctx;
      numArgs() {
        return check(Z3.func_entry_get_num_args(contextPtr, this.ptr));
      }
      argValue(i) {
        return _toExpr(check(Z3.func_entry_get_arg(contextPtr, this.ptr, i)));
      }
      value() {
        return _toExpr(check(Z3.func_entry_get_value(contextPtr, this.ptr)));
      }
    }
    class FuncInterpImpl {
      constructor(ptr) {
        this.ptr = ptr;
        this.ctx = ctx;
        Z3.func_interp_inc_ref(contextPtr, ptr);
        cleanup.register(this, () => Z3.func_interp_dec_ref(contextPtr, ptr), this);
      }
      ctx;
      elseValue() {
        return _toExpr(check(Z3.func_interp_get_else(contextPtr, this.ptr)));
      }
      numEntries() {
        return check(Z3.func_interp_get_num_entries(contextPtr, this.ptr));
      }
      arity() {
        return check(Z3.func_interp_get_arity(contextPtr, this.ptr));
      }
      entry(i) {
        return new FuncEntryImpl(check(Z3.func_interp_get_entry(contextPtr, this.ptr, i)));
      }
      addEntry(args, value) {
        const argsVec = new AstVectorImpl();
        for (const arg of args) {
          argsVec.push(arg);
        }
        _assertContext(argsVec);
        _assertContext(value);
        assert(this.arity() === argsVec.length(), "Number of arguments in entry doesn't match function arity");
        check(Z3.func_interp_add_entry(contextPtr, this.ptr, argsVec.ptr, value.ptr));
      }
    }
    class SortImpl extends AstImpl {
      get ast() {
        return Z3.sort_to_ast(contextPtr, this.ptr);
      }
      kind() {
        return Z3.get_sort_kind(contextPtr, this.ptr);
      }
      subsort(other) {
        _assertContext(other);
        return false;
      }
      cast(expr) {
        _assertContext(expr);
        assert(expr.sort.eqIdentity(expr.sort), "Sort mismatch");
        return expr;
      }
      name() {
        return _fromSymbol(Z3.get_sort_name(contextPtr, this.ptr));
      }
      eqIdentity(other) {
        _assertContext(other);
        return check(Z3.is_eq_sort(contextPtr, this.ptr, other.ptr));
      }
      neqIdentity(other) {
        return !this.eqIdentity(other);
      }
    }
    class FuncDeclImpl extends AstImpl {
      get ast() {
        return Z3.func_decl_to_ast(contextPtr, this.ptr);
      }
      name() {
        return _fromSymbol(Z3.get_decl_name(contextPtr, this.ptr));
      }
      arity() {
        return Z3.get_arity(contextPtr, this.ptr);
      }
      domain(i) {
        assert(i < this.arity(), "Index out of bounds");
        return _toSort(Z3.get_domain(contextPtr, this.ptr, i));
      }
      range() {
        return _toSort(Z3.get_range(contextPtr, this.ptr));
      }
      kind() {
        return Z3.get_decl_kind(contextPtr, this.ptr);
      }
      params() {
        const n = Z3.get_decl_num_parameters(contextPtr, this.ptr);
        const result = [];
        for (let i = 0; i < n; i++) {
          const kind = check(Z3.get_decl_parameter_kind(contextPtr, this.ptr, i));
          switch (kind) {
            case 0 /* Z3_PARAMETER_INT */:
              result.push(check(Z3.get_decl_int_parameter(contextPtr, this.ptr, i)));
              break;
            case 1 /* Z3_PARAMETER_DOUBLE */:
              result.push(check(Z3.get_decl_double_parameter(contextPtr, this.ptr, i)));
              break;
            case 2 /* Z3_PARAMETER_RATIONAL */:
              result.push(check(Z3.get_decl_rational_parameter(contextPtr, this.ptr, i)));
              break;
            case 3 /* Z3_PARAMETER_SYMBOL */:
              result.push(_fromSymbol(check(Z3.get_decl_symbol_parameter(contextPtr, this.ptr, i))));
              break;
            case 4 /* Z3_PARAMETER_SORT */:
              result.push(new SortImpl(check(Z3.get_decl_sort_parameter(contextPtr, this.ptr, i))));
              break;
            case 5 /* Z3_PARAMETER_AST */:
              result.push(new ExprImpl(check(Z3.get_decl_ast_parameter(contextPtr, this.ptr, i))));
              break;
            case 6 /* Z3_PARAMETER_FUNC_DECL */:
              result.push(new FuncDeclImpl(check(Z3.get_decl_func_decl_parameter(contextPtr, this.ptr, i))));
              break;
            case 7 /* Z3_PARAMETER_INTERNAL */:
              break;
            case 8 /* Z3_PARAMETER_ZSTRING */:
              break;
            default:
              assertExhaustive(kind);
          }
        }
        return result;
      }
      call(...args) {
        assert(args.length === this.arity(), `Incorrect number of arguments to ${this}`);
        return _toExpr(
          check(
            Z3.mk_app(
              contextPtr,
              this.ptr,
              args.map((arg, i) => {
                return this.domain(i).cast(arg).ast;
              })
            )
          )
        );
      }
    }
    class ExprImpl extends AstImpl {
      get sort() {
        return _toSort(Z3.get_sort(contextPtr, this.ast));
      }
      eq(other) {
        return new BoolImpl(check(Z3.mk_eq(contextPtr, this.ast, from(other).ast)));
      }
      neq(other) {
        return new BoolImpl(
          check(
            Z3.mk_distinct(
              contextPtr,
              [this, other].map((expr) => from(expr).ast)
            )
          )
        );
      }
      name() {
        return this.decl().name();
      }
      params() {
        return this.decl().params();
      }
      decl() {
        assert(isApp(this), "Z3 application expected");
        return new FuncDeclImpl(check(Z3.get_app_decl(contextPtr, check(Z3.to_app(contextPtr, this.ast)))));
      }
      numArgs() {
        assert(isApp(this), "Z3 applicaiton expected");
        return check(Z3.get_app_num_args(contextPtr, check(Z3.to_app(contextPtr, this.ast))));
      }
      arg(i) {
        assert(isApp(this), "Z3 applicaiton expected");
        assert(i < this.numArgs(), `Invalid argument index - expected ${i} to be less than ${this.numArgs()}`);
        return _toExpr(check(Z3.get_app_arg(contextPtr, check(Z3.to_app(contextPtr, this.ast)), i)));
      }
      children() {
        const num_args = this.numArgs();
        if (isApp(this)) {
          const result = [];
          for (let i = 0; i < num_args; i++) {
            result.push(this.arg(i));
          }
          return result;
        }
        return [];
      }
    }
    class PatternImpl {
      constructor(ptr) {
        this.ptr = ptr;
        this.ctx = ctx;
      }
      ctx;
    }
    class BoolSortImpl extends SortImpl {
      cast(other) {
        if (typeof other === "boolean") {
          other = Bool2.val(other);
        }
        assert(isExpr(other), "true, false or Z3 Boolean expression expected.");
        assert(this.eqIdentity(other.sort), "Value cannot be converted into a Z3 Boolean value");
        return other;
      }
      subsort(other) {
        _assertContext(other.ctx);
        return other instanceof ArithSortImpl;
      }
    }
    class BoolImpl extends ExprImpl {
      not() {
        return Not(this);
      }
      and(other) {
        return And(this, other);
      }
      or(other) {
        return Or(this, other);
      }
      xor(other) {
        return Xor(this, other);
      }
      implies(other) {
        return Implies(this, other);
      }
      iff(other) {
        return Iff(this, other);
      }
    }
    class ProbeImpl {
      constructor(ptr) {
        this.ptr = ptr;
        this.ctx = ctx;
      }
      ctx;
      apply(goal) {
        _assertContext(goal);
        return Z3.probe_apply(contextPtr, this.ptr, goal.ptr);
      }
    }
    class GoalImpl {
      ctx;
      ptr;
      constructor(models = true, unsat_cores = false, proofs = false) {
        this.ctx = ctx;
        const myPtr = check(Z3.mk_goal(contextPtr, models, unsat_cores, proofs));
        this.ptr = myPtr;
        Z3.goal_inc_ref(contextPtr, myPtr);
        cleanup.register(this, () => Z3.goal_dec_ref(contextPtr, myPtr), this);
      }
      // Factory method for creating from existing Z3_goal pointer
      static fromPtr(goalPtr) {
        const goal = Object.create(GoalImpl.prototype);
        goal.ctx = ctx;
        goal.ptr = goalPtr;
        Z3.goal_inc_ref(contextPtr, goalPtr);
        cleanup.register(goal, () => Z3.goal_dec_ref(contextPtr, goalPtr), goal);
        return goal;
      }
      add(...constraints) {
        for (const constraint of constraints) {
          const boolConstraint = isBool(constraint) ? constraint : Bool2.val(constraint);
          _assertContext(boolConstraint);
          Z3.goal_assert(contextPtr, this.ptr, boolConstraint.ast);
        }
      }
      size() {
        return Z3.goal_size(contextPtr, this.ptr);
      }
      get(i) {
        assert(i >= 0 && i < this.size(), "Index out of bounds");
        const ast = check(Z3.goal_formula(contextPtr, this.ptr, i));
        return new BoolImpl(ast);
      }
      depth() {
        return Z3.goal_depth(contextPtr, this.ptr);
      }
      inconsistent() {
        return Z3.goal_inconsistent(contextPtr, this.ptr);
      }
      precision() {
        return Z3.goal_precision(contextPtr, this.ptr);
      }
      reset() {
        Z3.goal_reset(contextPtr, this.ptr);
      }
      numExprs() {
        return Z3.goal_num_exprs(contextPtr, this.ptr);
      }
      isDecidedSat() {
        return Z3.goal_is_decided_sat(contextPtr, this.ptr);
      }
      isDecidedUnsat() {
        return Z3.goal_is_decided_unsat(contextPtr, this.ptr);
      }
      convertModel(model) {
        _assertContext(model);
        const convertedModel = check(Z3.goal_convert_model(contextPtr, this.ptr, model.ptr));
        return new ModelImpl(convertedModel);
      }
      asExpr() {
        const sz = this.size();
        if (sz === 0) {
          return Bool2.val(true);
        } else if (sz === 1) {
          return this.get(0);
        } else {
          const constraints = [];
          for (let i = 0; i < sz; i++) {
            constraints.push(this.get(i));
          }
          return And(...constraints);
        }
      }
      toString() {
        return Z3.goal_to_string(contextPtr, this.ptr);
      }
      dimacs(includeNames = true) {
        return Z3.goal_to_dimacs_string(contextPtr, this.ptr, includeNames);
      }
    }
    class ApplyResultImpl {
      ctx;
      ptr;
      constructor(ptr) {
        this.ctx = ctx;
        this.ptr = ptr;
        Z3.apply_result_inc_ref(contextPtr, ptr);
        cleanup.register(this, () => Z3.apply_result_dec_ref(contextPtr, ptr), this);
      }
      length() {
        return Z3.apply_result_get_num_subgoals(contextPtr, this.ptr);
      }
      getSubgoal(i) {
        assert(i >= 0 && i < this.length(), "Index out of bounds");
        const goalPtr = check(Z3.apply_result_get_subgoal(contextPtr, this.ptr, i));
        return GoalImpl.fromPtr(goalPtr);
      }
      toString() {
        return Z3.apply_result_to_string(contextPtr, this.ptr);
      }
    }
    const applyResultHandler = {
      get(target, prop) {
        if (typeof prop === "string") {
          const index = parseInt(prop, 10);
          if (!isNaN(index) && index >= 0 && index < target.length()) {
            return target.getSubgoal(index);
          }
        }
        return target[prop];
      }
    };
    class TacticImpl {
      ptr;
      ctx;
      constructor(tactic) {
        this.ctx = ctx;
        let myPtr;
        if (typeof tactic === "string") {
          myPtr = check(Z3.mk_tactic(contextPtr, tactic));
        } else {
          myPtr = tactic;
        }
        this.ptr = myPtr;
        Z3.tactic_inc_ref(contextPtr, myPtr);
        cleanup.register(this, () => Z3.tactic_dec_ref(contextPtr, myPtr), this);
      }
      async apply(goal) {
        let goalToUse;
        if (isBool(goal)) {
          goalToUse = new GoalImpl();
          goalToUse.add(goal);
        } else {
          goalToUse = goal;
        }
        _assertContext(goalToUse);
        const result = await Z3.tactic_apply(contextPtr, this.ptr, goalToUse.ptr);
        const applyResult = new ApplyResultImpl(check(result));
        return new Proxy(applyResult, applyResultHandler);
      }
      solver() {
        const solverPtr = check(Z3.mk_solver_from_tactic(contextPtr, this.ptr));
        return new SolverImpl(solverPtr);
      }
      help() {
        return Z3.tactic_get_help(contextPtr, this.ptr);
      }
      paramDescrs() {
        const descrs = check(Z3.tactic_get_param_descrs(contextPtr, this.ptr));
        return new ParamDescrsImpl(descrs);
      }
      usingParams(params) {
        _assertContext(params);
        const newTactic = check(Z3.tactic_using_params(contextPtr, this.ptr, params.ptr));
        return new TacticImpl(newTactic);
      }
    }
    class ParamsImpl {
      ptr;
      ctx;
      constructor(params) {
        this.ctx = ctx;
        if (params) {
          this.ptr = params;
        } else {
          this.ptr = Z3.mk_params(contextPtr);
        }
        Z3.params_inc_ref(contextPtr, this.ptr);
        cleanup.register(this, () => Z3.params_dec_ref(contextPtr, this.ptr), this);
      }
      set(name2, value) {
        const sym = _toSymbol(name2);
        if (typeof value === "boolean") {
          Z3.params_set_bool(contextPtr, this.ptr, sym, value);
        } else if (typeof value === "number") {
          if (Number.isInteger(value)) {
            check(Z3.params_set_uint(contextPtr, this.ptr, sym, value));
          } else {
            check(Z3.params_set_double(contextPtr, this.ptr, sym, value));
          }
        } else if (typeof value === "string") {
          check(Z3.params_set_symbol(contextPtr, this.ptr, sym, _toSymbol(value)));
        }
      }
      validate(descrs) {
        _assertContext(descrs);
        Z3.params_validate(contextPtr, this.ptr, descrs.ptr);
      }
      toString() {
        return Z3.params_to_string(contextPtr, this.ptr);
      }
    }
    class ParamDescrsImpl {
      ptr;
      ctx;
      constructor(paramDescrs) {
        this.ctx = ctx;
        this.ptr = paramDescrs;
        Z3.param_descrs_inc_ref(contextPtr, this.ptr);
        cleanup.register(this, () => Z3.param_descrs_dec_ref(contextPtr, this.ptr), this);
      }
      size() {
        return Z3.param_descrs_size(contextPtr, this.ptr);
      }
      getName(i) {
        const sym = Z3.param_descrs_get_name(contextPtr, this.ptr, i);
        const name2 = _fromSymbol(sym);
        return typeof name2 === "string" ? name2 : `${name2}`;
      }
      getKind(name2) {
        return Z3.param_descrs_get_kind(contextPtr, this.ptr, _toSymbol(name2));
      }
      getDocumentation(name2) {
        return Z3.param_descrs_get_documentation(contextPtr, this.ptr, _toSymbol(name2));
      }
      toString() {
        return Z3.param_descrs_to_string(contextPtr, this.ptr);
      }
    }
    class SimplifierImpl {
      ptr;
      ctx;
      constructor(simplifier) {
        this.ctx = ctx;
        let myPtr;
        if (typeof simplifier === "string") {
          myPtr = check(Z3.mk_simplifier(contextPtr, simplifier));
        } else {
          myPtr = simplifier;
        }
        this.ptr = myPtr;
        Z3.simplifier_inc_ref(contextPtr, myPtr);
        cleanup.register(this, () => Z3.simplifier_dec_ref(contextPtr, myPtr), this);
      }
      help() {
        return Z3.simplifier_get_help(contextPtr, this.ptr);
      }
      paramDescrs() {
        const descrs = check(Z3.simplifier_get_param_descrs(contextPtr, this.ptr));
        return new ParamDescrsImpl(descrs);
      }
      usingParams(params) {
        _assertContext(params);
        const newSimplifier = check(Z3.simplifier_using_params(contextPtr, this.ptr, params.ptr));
        return new SimplifierImpl(newSimplifier);
      }
      andThen(other) {
        _assertContext(other);
        const newSimplifier = check(Z3.simplifier_and_then(contextPtr, this.ptr, other.ptr));
        return new SimplifierImpl(newSimplifier);
      }
    }
    class ArithSortImpl extends SortImpl {
      cast(other) {
        const sortTypeStr = isIntSort(this) ? "IntSort" : "RealSort";
        if (isExpr(other)) {
          const otherS = other.sort;
          if (isArith(other)) {
            if (this.eqIdentity(otherS)) {
              return other;
            } else if (isIntSort(otherS) && isRealSort(this)) {
              return ToReal(other);
            }
            assert(false, "Can't cast Real to IntSort without loss");
          } else if (isBool(other)) {
            if (isIntSort(this)) {
              return If(other, 1, 0);
            } else {
              return ToReal(If(other, 1, 0));
            }
          }
          assert(false, `Can't cast expression to ${sortTypeStr}`);
        } else {
          if (typeof other !== "boolean") {
            if (isIntSort(this)) {
              assert(!isCoercibleRational(other), "Can't cast fraction to IntSort");
              return Int.val(other);
            }
            return Real.val(other);
          }
          assert(false, `Can't cast primitive to ${sortTypeStr}`);
        }
      }
    }
    function Sum(arg0, ...args) {
      if (arg0 instanceof BitVecImpl) {
        if (args.length !== 1) {
          throw new Error("BitVec add only supports 2 arguments");
        }
        return new BitVecImpl(
          check(Z3.mk_bvadd(contextPtr, arg0.ast, arg0.sort.cast(args[0]).ast))
        );
      } else {
        assert(arg0 instanceof ArithImpl);
        return new ArithImpl(
          check(Z3.mk_add(contextPtr, [arg0.ast].concat(args.map((arg) => arg0.sort.cast(arg).ast))))
        );
      }
    }
    function Sub(arg0, ...args) {
      if (arg0 instanceof BitVecImpl) {
        if (args.length !== 1) {
          throw new Error("BitVec sub only supports 2 arguments");
        }
        return new BitVecImpl(
          check(Z3.mk_bvsub(contextPtr, arg0.ast, arg0.sort.cast(args[0]).ast))
        );
      } else {
        assert(arg0 instanceof ArithImpl);
        return new ArithImpl(
          check(Z3.mk_sub(contextPtr, [arg0.ast].concat(args.map((arg) => arg0.sort.cast(arg).ast))))
        );
      }
    }
    function Product(arg0, ...args) {
      if (arg0 instanceof BitVecImpl) {
        if (args.length !== 1) {
          throw new Error("BitVec mul only supports 2 arguments");
        }
        return new BitVecImpl(
          check(Z3.mk_bvmul(contextPtr, arg0.ast, arg0.sort.cast(args[0]).ast))
        );
      } else {
        assert(arg0 instanceof ArithImpl);
        return new ArithImpl(
          check(Z3.mk_mul(contextPtr, [arg0.ast].concat(args.map((arg) => arg0.sort.cast(arg).ast))))
        );
      }
    }
    function Div(arg0, arg1) {
      if (arg0 instanceof BitVecImpl) {
        return new BitVecImpl(
          check(Z3.mk_bvsdiv(contextPtr, arg0.ast, arg0.sort.cast(arg1).ast))
        );
      } else {
        assert(arg0 instanceof ArithImpl);
        return new ArithImpl(check(Z3.mk_div(contextPtr, arg0.ast, arg0.sort.cast(arg1).ast)));
      }
    }
    function BUDiv(arg0, arg1) {
      return new BitVecImpl(
        check(Z3.mk_bvudiv(contextPtr, arg0.ast, arg0.sort.cast(arg1).ast))
      );
    }
    function Neg(a) {
      if (a instanceof BitVecImpl) {
        return new BitVecImpl(check(Z3.mk_bvneg(contextPtr, a.ast)));
      } else {
        assert(a instanceof ArithImpl);
        return new ArithImpl(check(Z3.mk_unary_minus(contextPtr, a.ast)));
      }
    }
    function Mod(a, b) {
      if (a instanceof BitVecImpl) {
        return new BitVecImpl(check(Z3.mk_bvsrem(contextPtr, a.ast, a.sort.cast(b).ast)));
      } else {
        assert(a instanceof ArithImpl);
        return new ArithImpl(check(Z3.mk_mod(contextPtr, a.ast, a.sort.cast(b).ast)));
      }
    }
    class ArithImpl extends ExprImpl {
      add(other) {
        return Sum(this, other);
      }
      mul(other) {
        return Product(this, other);
      }
      sub(other) {
        return Sub(this, other);
      }
      pow(exponent) {
        return new ArithImpl(check(Z3.mk_power(contextPtr, this.ast, this.sort.cast(exponent).ast)));
      }
      div(other) {
        return Div(this, other);
      }
      mod(other) {
        return Mod(this, other);
      }
      neg() {
        return Neg(this);
      }
      le(other) {
        return LE(this, other);
      }
      lt(other) {
        return LT(this, other);
      }
      gt(other) {
        return GT(this, other);
      }
      ge(other) {
        return GE(this, other);
      }
    }
    class IntNumImpl extends ArithImpl {
      value() {
        return BigInt(this.asString());
      }
      asString() {
        return Z3.get_numeral_string(contextPtr, this.ast);
      }
      asBinary() {
        return Z3.get_numeral_binary_string(contextPtr, this.ast);
      }
    }
    class RatNumImpl extends ArithImpl {
      value() {
        return { numerator: this.numerator().value(), denominator: this.denominator().value() };
      }
      numerator() {
        return new IntNumImpl(Z3.get_numerator(contextPtr, this.ast));
      }
      denominator() {
        return new IntNumImpl(Z3.get_denominator(contextPtr, this.ast));
      }
      asNumber() {
        const { numerator, denominator } = this.value();
        const div = numerator / denominator;
        return Number(div) + Number(numerator - div * denominator) / Number(denominator);
      }
      asDecimal(prec = Number.parseInt(getParam("precision") ?? FALLBACK_PRECISION.toString())) {
        return Z3.get_numeral_decimal_string(contextPtr, this.ast, prec);
      }
      asString() {
        return Z3.get_numeral_string(contextPtr, this.ast);
      }
    }
    class RCFNumImpl {
      ctx;
      ptr;
      constructor(valueOrPtr) {
        this.ctx = ctx;
        let myPtr;
        if (typeof valueOrPtr === "string") {
          myPtr = check(Z3.rcf_mk_rational(contextPtr, valueOrPtr));
        } else if (typeof valueOrPtr === "number") {
          myPtr = check(Z3.rcf_mk_small_int(contextPtr, valueOrPtr));
        } else {
          myPtr = valueOrPtr;
        }
        this.ptr = myPtr;
        cleanup.register(this, () => Z3.rcf_del(contextPtr, myPtr), this);
      }
      add(other) {
        _assertContext(other);
        return new RCFNumImpl(check(Z3.rcf_add(contextPtr, this.ptr, other.ptr)));
      }
      sub(other) {
        _assertContext(other);
        return new RCFNumImpl(check(Z3.rcf_sub(contextPtr, this.ptr, other.ptr)));
      }
      mul(other) {
        _assertContext(other);
        return new RCFNumImpl(check(Z3.rcf_mul(contextPtr, this.ptr, other.ptr)));
      }
      div(other) {
        _assertContext(other);
        return new RCFNumImpl(check(Z3.rcf_div(contextPtr, this.ptr, other.ptr)));
      }
      neg() {
        return new RCFNumImpl(check(Z3.rcf_neg(contextPtr, this.ptr)));
      }
      inv() {
        return new RCFNumImpl(check(Z3.rcf_inv(contextPtr, this.ptr)));
      }
      power(k) {
        return new RCFNumImpl(check(Z3.rcf_power(contextPtr, this.ptr, k)));
      }
      lt(other) {
        _assertContext(other);
        return check(Z3.rcf_lt(contextPtr, this.ptr, other.ptr));
      }
      gt(other) {
        _assertContext(other);
        return check(Z3.rcf_gt(contextPtr, this.ptr, other.ptr));
      }
      le(other) {
        _assertContext(other);
        return check(Z3.rcf_le(contextPtr, this.ptr, other.ptr));
      }
      ge(other) {
        _assertContext(other);
        return check(Z3.rcf_ge(contextPtr, this.ptr, other.ptr));
      }
      eq(other) {
        _assertContext(other);
        return check(Z3.rcf_eq(contextPtr, this.ptr, other.ptr));
      }
      neq(other) {
        _assertContext(other);
        return check(Z3.rcf_neq(contextPtr, this.ptr, other.ptr));
      }
      isRational() {
        return check(Z3.rcf_is_rational(contextPtr, this.ptr));
      }
      isAlgebraic() {
        return check(Z3.rcf_is_algebraic(contextPtr, this.ptr));
      }
      isInfinitesimal() {
        return check(Z3.rcf_is_infinitesimal(contextPtr, this.ptr));
      }
      isTranscendental() {
        return check(Z3.rcf_is_transcendental(contextPtr, this.ptr));
      }
      toString(compact = false) {
        return check(Z3.rcf_num_to_string(contextPtr, this.ptr, compact, false));
      }
      toDecimal(precision) {
        return check(Z3.rcf_num_to_decimal_string(contextPtr, this.ptr, precision));
      }
    }
    class BitVecSortImpl extends SortImpl {
      size() {
        return Z3.get_bv_sort_size(contextPtr, this.ptr);
      }
      subsort(other) {
        return isBitVecSort(other) && this.size() < other.size();
      }
      cast(other) {
        if (isExpr(other)) {
          _assertContext(other);
          return other;
        }
        assert(!isCoercibleRational(other), "Can't convert rational to BitVec");
        return BitVec2.val(other, this.size());
      }
    }
    class BitVecImpl extends ExprImpl {
      size() {
        return this.sort.size();
      }
      add(other) {
        return Sum(this, other);
      }
      mul(other) {
        return Product(this, other);
      }
      sub(other) {
        return Sub(this, other);
      }
      sdiv(other) {
        return Div(this, other);
      }
      udiv(other) {
        return BUDiv(this, other);
      }
      smod(other) {
        return Mod(this, other);
      }
      urem(other) {
        return new BitVecImpl(check(Z3.mk_bvurem(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      srem(other) {
        return new BitVecImpl(check(Z3.mk_bvsrem(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      neg() {
        return Neg(this);
      }
      or(other) {
        return new BitVecImpl(check(Z3.mk_bvor(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      and(other) {
        return new BitVecImpl(check(Z3.mk_bvand(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      nand(other) {
        return new BitVecImpl(check(Z3.mk_bvnand(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      xor(other) {
        return new BitVecImpl(check(Z3.mk_bvxor(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      xnor(other) {
        return new BitVecImpl(check(Z3.mk_bvxnor(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      shr(count) {
        return new BitVecImpl(check(Z3.mk_bvashr(contextPtr, this.ast, this.sort.cast(count).ast)));
      }
      lshr(count) {
        return new BitVecImpl(check(Z3.mk_bvlshr(contextPtr, this.ast, this.sort.cast(count).ast)));
      }
      shl(count) {
        return new BitVecImpl(check(Z3.mk_bvshl(contextPtr, this.ast, this.sort.cast(count).ast)));
      }
      rotateRight(count) {
        return new BitVecImpl(check(Z3.mk_ext_rotate_right(contextPtr, this.ast, this.sort.cast(count).ast)));
      }
      rotateLeft(count) {
        return new BitVecImpl(check(Z3.mk_ext_rotate_left(contextPtr, this.ast, this.sort.cast(count).ast)));
      }
      not() {
        return new BitVecImpl(check(Z3.mk_bvnot(contextPtr, this.ast)));
      }
      extract(high, low) {
        return Extract(high, low, this);
      }
      signExt(count) {
        return new BitVecImpl(check(Z3.mk_sign_ext(contextPtr, count, this.ast)));
      }
      zeroExt(count) {
        return new BitVecImpl(check(Z3.mk_zero_ext(contextPtr, count, this.ast)));
      }
      repeat(count) {
        return new BitVecImpl(check(Z3.mk_repeat(contextPtr, count, this.ast)));
      }
      sle(other) {
        return SLE(this, other);
      }
      ule(other) {
        return ULE(this, other);
      }
      slt(other) {
        return SLT(this, other);
      }
      ult(other) {
        return ULT(this, other);
      }
      sge(other) {
        return SGE(this, other);
      }
      uge(other) {
        return UGE(this, other);
      }
      sgt(other) {
        return SGT(this, other);
      }
      ugt(other) {
        return UGT(this, other);
      }
      redAnd() {
        return new BitVecImpl(check(Z3.mk_bvredand(contextPtr, this.ast)));
      }
      redOr() {
        return new BitVecImpl(check(Z3.mk_bvredor(contextPtr, this.ast)));
      }
      addNoOverflow(other, isSigned) {
        return new BoolImpl(check(Z3.mk_bvadd_no_overflow(contextPtr, this.ast, this.sort.cast(other).ast, isSigned)));
      }
      addNoUnderflow(other) {
        return new BoolImpl(check(Z3.mk_bvadd_no_underflow(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      subNoOverflow(other) {
        return new BoolImpl(check(Z3.mk_bvsub_no_overflow(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      subNoUnderflow(other, isSigned) {
        return new BoolImpl(check(Z3.mk_bvsub_no_underflow(contextPtr, this.ast, this.sort.cast(other).ast, isSigned)));
      }
      sdivNoOverflow(other) {
        return new BoolImpl(check(Z3.mk_bvsdiv_no_overflow(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      mulNoOverflow(other, isSigned) {
        return new BoolImpl(check(Z3.mk_bvmul_no_overflow(contextPtr, this.ast, this.sort.cast(other).ast, isSigned)));
      }
      mulNoUnderflow(other) {
        return new BoolImpl(check(Z3.mk_bvmul_no_underflow(contextPtr, this.ast, this.sort.cast(other).ast)));
      }
      negNoOverflow() {
        return new BoolImpl(check(Z3.mk_bvneg_no_overflow(contextPtr, this.ast)));
      }
    }
    class BitVecNumImpl extends BitVecImpl {
      value() {
        return BigInt(this.asString());
      }
      asSignedValue() {
        let val = this.value();
        const size = BigInt(this.size());
        if (val >= 2n ** (size - 1n)) {
          val = val - 2n ** size;
        }
        if (val < (-2n) ** (size - 1n)) {
          val = val + 2n ** size;
        }
        return val;
      }
      asString() {
        return Z3.get_numeral_string(contextPtr, this.ast);
      }
      asBinaryString() {
        return Z3.get_numeral_binary_string(contextPtr, this.ast);
      }
    }
    class FPRMSortImpl extends SortImpl {
      cast(other) {
        if (isFPRM(other)) {
          _assertContext(other);
          return other;
        }
        throw new Error("Can't cast to FPRMSort");
      }
    }
    class FPRMImpl extends ExprImpl {
    }
    class FPSortImpl extends SortImpl {
      ebits() {
        return Z3.fpa_get_ebits(contextPtr, this.ptr);
      }
      sbits() {
        return Z3.fpa_get_sbits(contextPtr, this.ptr);
      }
      cast(other) {
        if (isExpr(other)) {
          _assertContext(other);
          return other;
        }
        if (typeof other === "number") {
          return Float.val(other, this);
        }
        throw new Error("Can't cast to FPSort");
      }
    }
    class FPImpl extends ExprImpl {
      add(rm, other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new FPImpl(check(Z3.mk_fpa_add(contextPtr, rm.ast, this.ast, otherFP.ast)));
      }
      sub(rm, other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new FPImpl(check(Z3.mk_fpa_sub(contextPtr, rm.ast, this.ast, otherFP.ast)));
      }
      mul(rm, other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new FPImpl(check(Z3.mk_fpa_mul(contextPtr, rm.ast, this.ast, otherFP.ast)));
      }
      div(rm, other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new FPImpl(check(Z3.mk_fpa_div(contextPtr, rm.ast, this.ast, otherFP.ast)));
      }
      neg() {
        return new FPImpl(check(Z3.mk_fpa_neg(contextPtr, this.ast)));
      }
      abs() {
        return new FPImpl(check(Z3.mk_fpa_abs(contextPtr, this.ast)));
      }
      sqrt(rm) {
        return new FPImpl(check(Z3.mk_fpa_sqrt(contextPtr, rm.ast, this.ast)));
      }
      rem(other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new FPImpl(check(Z3.mk_fpa_rem(contextPtr, this.ast, otherFP.ast)));
      }
      fma(rm, y, z) {
        const yFP = isFP(y) ? y : Float.val(y, this.sort);
        const zFP = isFP(z) ? z : Float.val(z, this.sort);
        return new FPImpl(check(Z3.mk_fpa_fma(contextPtr, rm.ast, this.ast, yFP.ast, zFP.ast)));
      }
      lt(other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new BoolImpl(check(Z3.mk_fpa_lt(contextPtr, this.ast, otherFP.ast)));
      }
      gt(other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new BoolImpl(check(Z3.mk_fpa_gt(contextPtr, this.ast, otherFP.ast)));
      }
      le(other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new BoolImpl(check(Z3.mk_fpa_leq(contextPtr, this.ast, otherFP.ast)));
      }
      ge(other) {
        const otherFP = isFP(other) ? other : Float.val(other, this.sort);
        return new BoolImpl(check(Z3.mk_fpa_geq(contextPtr, this.ast, otherFP.ast)));
      }
      isNaN() {
        return new BoolImpl(check(Z3.mk_fpa_is_nan(contextPtr, this.ast)));
      }
      isInf() {
        return new BoolImpl(check(Z3.mk_fpa_is_infinite(contextPtr, this.ast)));
      }
      isZero() {
        return new BoolImpl(check(Z3.mk_fpa_is_zero(contextPtr, this.ast)));
      }
      isNormal() {
        return new BoolImpl(check(Z3.mk_fpa_is_normal(contextPtr, this.ast)));
      }
      isSubnormal() {
        return new BoolImpl(check(Z3.mk_fpa_is_subnormal(contextPtr, this.ast)));
      }
      isNegative() {
        return new BoolImpl(check(Z3.mk_fpa_is_negative(contextPtr, this.ast)));
      }
      isPositive() {
        return new BoolImpl(check(Z3.mk_fpa_is_positive(contextPtr, this.ast)));
      }
    }
    class FPNumImpl extends FPImpl {
      value() {
        return Z3.get_numeral_double(contextPtr, this.ast);
      }
    }
    class SeqSortImpl extends SortImpl {
      isString() {
        return Z3.is_string_sort(contextPtr, this.ptr);
      }
      basis() {
        return _toSort(check(Z3.get_seq_sort_basis(contextPtr, this.ptr)));
      }
      cast(other) {
        if (isSeq(other)) {
          _assertContext(other);
          return other;
        }
        if (typeof other === "string") {
          return String2.val(other);
        }
        throw new Error("Can't cast to SeqSort");
      }
    }
    class SeqImpl extends ExprImpl {
      isString() {
        return Z3.is_string_sort(contextPtr, Z3.get_sort(contextPtr, this.ast));
      }
      asString() {
        if (!Z3.is_string(contextPtr, this.ast)) {
          throw new Error("Not a string value");
        }
        return Z3.get_string(contextPtr, this.ast);
      }
      concat(other) {
        const otherSeq = isSeq(other) ? other : String2.val(other);
        return new SeqImpl(check(Z3.mk_seq_concat(contextPtr, [this.ast, otherSeq.ast])));
      }
      length() {
        return new ArithImpl(check(Z3.mk_seq_length(contextPtr, this.ast)));
      }
      at(index) {
        const indexExpr = isArith(index) ? index : Int.val(index);
        return new SeqImpl(check(Z3.mk_seq_at(contextPtr, this.ast, indexExpr.ast)));
      }
      nth(index) {
        const indexExpr = isArith(index) ? index : Int.val(index);
        return _toExpr(check(Z3.mk_seq_nth(contextPtr, this.ast, indexExpr.ast)));
      }
      extract(offset, length) {
        const offsetExpr = isArith(offset) ? offset : Int.val(offset);
        const lengthExpr = isArith(length) ? length : Int.val(length);
        return new SeqImpl(check(Z3.mk_seq_extract(contextPtr, this.ast, offsetExpr.ast, lengthExpr.ast)));
      }
      indexOf(substr, offset) {
        const substrSeq = isSeq(substr) ? substr : String2.val(substr);
        const offsetExpr = offset !== void 0 ? isArith(offset) ? offset : Int.val(offset) : Int.val(0);
        return new ArithImpl(check(Z3.mk_seq_index(contextPtr, this.ast, substrSeq.ast, offsetExpr.ast)));
      }
      lastIndexOf(substr) {
        const substrSeq = isSeq(substr) ? substr : String2.val(substr);
        return new ArithImpl(check(Z3.mk_seq_last_index(contextPtr, this.ast, substrSeq.ast)));
      }
      contains(substr) {
        const substrSeq = isSeq(substr) ? substr : String2.val(substr);
        return new BoolImpl(check(Z3.mk_seq_contains(contextPtr, this.ast, substrSeq.ast)));
      }
      prefixOf(s) {
        const sSeq = isSeq(s) ? s : String2.val(s);
        return new BoolImpl(check(Z3.mk_seq_prefix(contextPtr, this.ast, sSeq.ast)));
      }
      suffixOf(s) {
        const sSeq = isSeq(s) ? s : String2.val(s);
        return new BoolImpl(check(Z3.mk_seq_suffix(contextPtr, this.ast, sSeq.ast)));
      }
      replace(src, dst) {
        const srcSeq = isSeq(src) ? src : String2.val(src);
        const dstSeq = isSeq(dst) ? dst : String2.val(dst);
        return new SeqImpl(check(Z3.mk_seq_replace(contextPtr, this.ast, srcSeq.ast, dstSeq.ast)));
      }
      replaceAll(src, dst) {
        const srcSeq = isSeq(src) ? src : String2.val(src);
        const dstSeq = isSeq(dst) ? dst : String2.val(dst);
        return new SeqImpl(check(Z3.mk_seq_replace_all(contextPtr, this.ast, srcSeq.ast, dstSeq.ast)));
      }
    }
    class ReSortImpl extends SortImpl {
      basis() {
        return _toSort(check(Z3.get_re_sort_basis(contextPtr, this.ptr)));
      }
      cast(other) {
        if (isRe(other)) {
          _assertContext(other);
          return other;
        }
        throw new Error("Can't cast to ReSort");
      }
    }
    class ReImpl extends ExprImpl {
      plus() {
        return new ReImpl(check(Z3.mk_re_plus(contextPtr, this.ast)));
      }
      star() {
        return new ReImpl(check(Z3.mk_re_star(contextPtr, this.ast)));
      }
      option() {
        return new ReImpl(check(Z3.mk_re_option(contextPtr, this.ast)));
      }
      complement() {
        return new ReImpl(check(Z3.mk_re_complement(contextPtr, this.ast)));
      }
      union(other) {
        return new ReImpl(check(Z3.mk_re_union(contextPtr, [this.ast, other.ast])));
      }
      intersect(other) {
        return new ReImpl(check(Z3.mk_re_intersect(contextPtr, [this.ast, other.ast])));
      }
      diff(other) {
        return new ReImpl(check(Z3.mk_re_diff(contextPtr, this.ast, other.ast)));
      }
      concat(other) {
        return new ReImpl(check(Z3.mk_re_concat(contextPtr, [this.ast, other.ast])));
      }
      /**
       * Create a bounded repetition of this regex
       * @param lo Minimum number of repetitions
       * @param hi Maximum number of repetitions (0 means unbounded, i.e., at least lo)
       */
      loop(lo, hi = 0) {
        return new ReImpl(check(Z3.mk_re_loop(contextPtr, this.ast, lo, hi)));
      }
      power(n) {
        return new ReImpl(check(Z3.mk_re_power(contextPtr, this.ast, n)));
      }
    }
    class ArraySortImpl extends SortImpl {
      domain() {
        return _toSort(check(Z3.get_array_sort_domain(contextPtr, this.ptr)));
      }
      domain_n(i) {
        return _toSort(check(Z3.get_array_sort_domain_n(contextPtr, this.ptr, i)));
      }
      range() {
        return _toSort(check(Z3.get_array_sort_range(contextPtr, this.ptr)));
      }
    }
    class ArrayImpl extends ExprImpl {
      domain() {
        return this.sort.domain();
      }
      domain_n(i) {
        return this.sort.domain_n(i);
      }
      range() {
        return this.sort.range();
      }
      select(...indices) {
        return Select(this, ...indices);
      }
      store(...indicesAndValue) {
        return Store(this, ...indicesAndValue);
      }
      /**
       * Access the array default value.
       * Produces the default range value, for arrays that can be represented as
       * finite maps with a default range value.
       */
      default() {
        return _toExpr(check(Z3.mk_array_default(contextPtr, this.ast)));
      }
    }
    class SetImpl extends ExprImpl {
      elemSort() {
        return this.sort.domain();
      }
      union(...args) {
        return SetUnion(this, ...args);
      }
      intersect(...args) {
        return SetIntersect(this, ...args);
      }
      diff(b) {
        return SetDifference(this, b);
      }
      add(elem) {
        return SetAdd(this, elem);
      }
      del(elem) {
        return SetDel(this, elem);
      }
      complement() {
        return SetComplement(this);
      }
      contains(elem) {
        return isMember(elem, this);
      }
      subsetOf(b) {
        return isSubset(this, b);
      }
    }
    class DatatypeImpl {
      ctx;
      name;
      constructors = [];
      constructor(ctx2, name2) {
        this.ctx = ctx2;
        this.name = name2;
      }
      declare(name2, ...fields) {
        this.constructors.push([name2, fields]);
        return this;
      }
      create() {
        const datatypes = createDatatypes(this);
        return datatypes[0];
      }
    }
    class DatatypeSortImpl extends SortImpl {
      numConstructors() {
        return Z3.get_datatype_sort_num_constructors(contextPtr, this.ptr);
      }
      constructorDecl(idx) {
        const ptr = Z3.get_datatype_sort_constructor(contextPtr, this.ptr, idx);
        return new FuncDeclImpl(ptr);
      }
      recognizer(idx) {
        const ptr = Z3.get_datatype_sort_recognizer(contextPtr, this.ptr, idx);
        return new FuncDeclImpl(ptr);
      }
      accessor(constructorIdx, accessorIdx) {
        const ptr = Z3.get_datatype_sort_constructor_accessor(contextPtr, this.ptr, constructorIdx, accessorIdx);
        return new FuncDeclImpl(ptr);
      }
      cast(other) {
        if (isExpr(other)) {
          assert(this.eqIdentity(other.sort), "Value cannot be converted to this datatype");
          return other;
        }
        throw new Error("Cannot coerce value to datatype expression");
      }
      subsort(other) {
        _assertContext(other.ctx);
        return this.eqIdentity(other);
      }
    }
    class DatatypeExprImpl extends ExprImpl {
    }
    function createDatatypes(...datatypes) {
      if (datatypes.length === 0) {
        throw new Error("At least one datatype must be provided");
      }
      const dtCtx = datatypes[0].ctx;
      for (const dt of datatypes) {
        if (dt.ctx !== dtCtx) {
          throw new Error("All datatypes must be from the same context");
        }
      }
      const sortNames = datatypes.map((dt) => dt.name);
      const constructorLists = [];
      const scopedConstructors = [];
      try {
        for (const dt of datatypes) {
          const constructors = [];
          for (const [constructorName, fields] of dt.constructors) {
            const fieldNames = [];
            const fieldSorts = [];
            const fieldRefs = [];
            for (const [fieldName, fieldSort] of fields) {
              fieldNames.push(fieldName);
              if (fieldSort instanceof DatatypeImpl) {
                const refIndex = datatypes.indexOf(fieldSort);
                if (refIndex === -1) {
                  throw new Error(`Referenced datatype "${fieldSort.name}" not found in datatypes being created`);
                }
                fieldSorts.push(null);
                fieldRefs.push(refIndex);
              } else {
                fieldSorts.push(fieldSort.ptr);
                fieldRefs.push(0);
              }
            }
            const constructor = Z3.mk_constructor(
              contextPtr,
              Z3.mk_string_symbol(contextPtr, constructorName),
              Z3.mk_string_symbol(contextPtr, `is_${constructorName}`),
              fieldNames.map((name2) => Z3.mk_string_symbol(contextPtr, name2)),
              fieldSorts,
              fieldRefs
            );
            constructors.push(constructor);
            scopedConstructors.push(constructor);
          }
          const constructorList = Z3.mk_constructor_list(contextPtr, constructors);
          constructorLists.push(constructorList);
        }
        const sortSymbols = sortNames.map((name2) => Z3.mk_string_symbol(contextPtr, name2));
        const resultSorts = Z3.mk_datatypes(contextPtr, sortSymbols, constructorLists);
        const results = [];
        for (let i = 0; i < resultSorts.length; i++) {
          const sortImpl = new DatatypeSortImpl(resultSorts[i]);
          const numConstructors = sortImpl.numConstructors();
          for (let j = 0; j < numConstructors; j++) {
            const constructor = sortImpl.constructorDecl(j);
            const recognizer = sortImpl.recognizer(j);
            const constructorName = constructor.name().toString();
            if (constructor.arity() === 0) {
              sortImpl[constructorName] = constructor.call();
            } else {
              sortImpl[constructorName] = constructor;
            }
            sortImpl[`is_${constructorName}`] = recognizer;
            for (let k = 0; k < constructor.arity(); k++) {
              const accessor = sortImpl.accessor(j, k);
              const accessorName = accessor.name().toString();
              sortImpl[accessorName] = accessor;
            }
          }
          results.push(sortImpl);
        }
        return results;
      } finally {
        for (const constructor of scopedConstructors) {
          Z3.del_constructor(contextPtr, constructor);
        }
        for (const constructorList of constructorLists) {
          Z3.del_constructor_list(contextPtr, constructorList);
        }
      }
    }
    class QuantifierImpl extends ExprImpl {
      is_forall() {
        return Z3.is_quantifier_forall(contextPtr, this.ast);
      }
      is_exists() {
        return Z3.is_quantifier_exists(contextPtr, this.ast);
      }
      is_lambda() {
        return Z3.is_lambda(contextPtr, this.ast);
      }
      weight() {
        return Z3.get_quantifier_weight(contextPtr, this.ast);
      }
      num_patterns() {
        return Z3.get_quantifier_num_patterns(contextPtr, this.ast);
      }
      pattern(i) {
        return new PatternImpl(check(Z3.get_quantifier_pattern_ast(contextPtr, this.ast, i)));
      }
      num_no_patterns() {
        return Z3.get_quantifier_num_no_patterns(contextPtr, this.ast);
      }
      no_pattern(i) {
        return _toExpr(check(Z3.get_quantifier_no_pattern_ast(contextPtr, this.ast, i)));
      }
      body() {
        return _toExpr(check(Z3.get_quantifier_body(contextPtr, this.ast)));
      }
      num_vars() {
        return Z3.get_quantifier_num_bound(contextPtr, this.ast);
      }
      var_name(i) {
        return _fromSymbol(Z3.get_quantifier_bound_name(contextPtr, this.ast, i));
      }
      var_sort(i) {
        return _toSort(check(Z3.get_quantifier_bound_sort(contextPtr, this.ast, i)));
      }
      children() {
        return [this.body()];
      }
    }
    class NonLambdaQuantifierImpl extends QuantifierImpl {
      not() {
        return Not(this);
      }
      and(other) {
        return And(this, other);
      }
      or(other) {
        return Or(this, other);
      }
      xor(other) {
        return Xor(this, other);
      }
      implies(other) {
        return Implies(this, other);
      }
      iff(other) {
        return Iff(this, other);
      }
    }
    class LambdaImpl extends QuantifierImpl {
      domain() {
        return this.sort.domain();
      }
      domain_n(i) {
        return this.sort.domain_n(i);
      }
      range() {
        return this.sort.range();
      }
      select(...indices) {
        return Select(this, ...indices);
      }
      store(...indicesAndValue) {
        return Store(this, ...indicesAndValue);
      }
      /**
       * Access the array default value.
       * Produces the default range value, for arrays that can be represented as
       * finite maps with a default range value.
       */
      default() {
        return _toExpr(check(Z3.mk_array_default(contextPtr, this.ast)));
      }
    }
    class AstVectorImpl {
      constructor(ptr = Z3.mk_ast_vector(contextPtr)) {
        this.ptr = ptr;
        this.ctx = ctx;
        Z3.ast_vector_inc_ref(contextPtr, ptr);
        cleanup.register(this, () => Z3.ast_vector_dec_ref(contextPtr, ptr), this);
      }
      ctx;
      length() {
        return Z3.ast_vector_size(contextPtr, this.ptr);
      }
      [Symbol.iterator]() {
        return this.values();
      }
      *entries() {
        const length = this.length();
        for (let i = 0; i < length; i++) {
          yield [i, this.get(i)];
        }
      }
      *keys() {
        for (let [key] of this.entries()) {
          yield key;
        }
      }
      *values() {
        for (let [, value] of this.entries()) {
          yield value;
        }
      }
      get(from2, to) {
        const length = this.length();
        if (from2 < 0) {
          from2 += length;
        }
        if (from2 >= length) {
          throw new RangeError(`expected from index ${from2} to be less than length ${length}`);
        }
        if (to === void 0) {
          return _toAst(check(Z3.ast_vector_get(contextPtr, this.ptr, from2)));
        }
        if (to < 0) {
          to += length;
        }
        if (to >= length) {
          throw new RangeError(`expected to index ${to} to be less than length ${length}`);
        }
        const result = [];
        for (let i = from2; i < to; i++) {
          result.push(_toAst(check(Z3.ast_vector_get(contextPtr, this.ptr, i))));
        }
        return result;
      }
      set(i, v) {
        _assertContext(v);
        if (i >= this.length()) {
          throw new RangeError(`expected index ${i} to be less than length ${this.length()}`);
        }
        check(Z3.ast_vector_set(contextPtr, this.ptr, i, v.ast));
      }
      push(v) {
        _assertContext(v);
        check(Z3.ast_vector_push(contextPtr, this.ptr, v.ast));
      }
      resize(size) {
        check(Z3.ast_vector_resize(contextPtr, this.ptr, size));
      }
      has(v) {
        _assertContext(v);
        for (const item of this.values()) {
          if (item.eqIdentity(v)) {
            return true;
          }
        }
        return false;
      }
      sexpr() {
        return check(Z3.ast_vector_to_string(contextPtr, this.ptr));
      }
    }
    class AstMapImpl {
      constructor(ptr = Z3.mk_ast_map(contextPtr)) {
        this.ptr = ptr;
        this.ctx = ctx;
        Z3.ast_map_inc_ref(contextPtr, ptr);
        cleanup.register(this, () => Z3.ast_map_dec_ref(contextPtr, ptr), this);
      }
      ctx;
      [Symbol.iterator]() {
        return this.entries();
      }
      get size() {
        return Z3.ast_map_size(contextPtr, this.ptr);
      }
      *entries() {
        for (const key of this.keys()) {
          yield [key, this.get(key)];
        }
      }
      keys() {
        return new AstVectorImpl(Z3.ast_map_keys(contextPtr, this.ptr));
      }
      *values() {
        for (const [_, value] of this.entries()) {
          yield value;
        }
      }
      get(key) {
        return _toAst(check(Z3.ast_map_find(contextPtr, this.ptr, key.ast)));
      }
      set(key, value) {
        check(Z3.ast_map_insert(contextPtr, this.ptr, key.ast, value.ast));
      }
      delete(key) {
        check(Z3.ast_map_erase(contextPtr, this.ptr, key.ast));
      }
      clear() {
        check(Z3.ast_map_reset(contextPtr, this.ptr));
      }
      has(key) {
        return check(Z3.ast_map_contains(contextPtr, this.ptr, key.ast));
      }
      sexpr() {
        return check(Z3.ast_map_to_string(contextPtr, this.ptr));
      }
    }
    function substitute(t, ...substitutions) {
      _assertContext(t);
      const from2 = [];
      const to = [];
      for (const [f, t2] of substitutions) {
        _assertContext(f);
        _assertContext(t2);
        from2.push(f.ast);
        to.push(t2.ast);
      }
      return _toExpr(check(Z3.substitute(contextPtr, t.ast, from2, to)));
    }
    function substituteVars(t, ...to) {
      _assertContext(t);
      const toAsts = [];
      for (const expr of to) {
        _assertContext(expr);
        toAsts.push(expr.ast);
      }
      return _toExpr(check(Z3.substitute_vars(contextPtr, t.ast, toAsts)));
    }
    function substituteFuns(t, ...substitutions) {
      _assertContext(t);
      const from2 = [];
      const to = [];
      for (const [f, body] of substitutions) {
        _assertContext(f);
        _assertContext(body);
        from2.push(f.ptr);
        to.push(body.ast);
      }
      return _toExpr(check(Z3.substitute_funs(contextPtr, t.ast, from2, to)));
    }
    function updateField(t, fieldAccessor, newValue) {
      _assertContext(t);
      _assertContext(fieldAccessor);
      _assertContext(newValue);
      return _toExpr(check(Z3.datatype_update_field(contextPtr, fieldAccessor.ptr, t.ast, newValue.ast)));
    }
    function ast_from_string(s) {
      const sort_names = [];
      const sorts = [];
      const decl_names = [];
      const decls = [];
      const v = new AstVectorImpl(check(Z3.parse_smtlib2_string(contextPtr, s, sort_names, sorts, decl_names, decls)));
      if (v.length() !== 1) {
        throw new Error("Expected exactly one AST. Instead got " + v.length() + ": " + v.sexpr());
      }
      return v.get(0);
    }
    const ctx = {
      ptr: contextPtr,
      name,
      /////////////
      // Classes //
      /////////////
      Solver: SolverImpl,
      Optimize: OptimizeImpl,
      Fixedpoint: FixedpointImpl,
      Model: ModelImpl,
      Tactic: TacticImpl,
      Goal: GoalImpl,
      Params: ParamsImpl,
      Simplifier: SimplifierImpl,
      AstVector: AstVectorImpl,
      AstMap: AstMapImpl,
      ///////////////
      // Functions //
      ///////////////
      interrupt,
      setPrintMode,
      isModel,
      isAst,
      isSort,
      isFuncDecl,
      isFuncInterp,
      isApp,
      isConst,
      isExpr,
      isVar,
      isAppOf,
      isBool,
      isTrue,
      isFalse,
      isAnd,
      isOr,
      isImplies,
      isNot,
      isEq,
      isDistinct,
      isQuantifier,
      isArith,
      isArithSort,
      isInt,
      isIntVal,
      isIntSort,
      isReal,
      isRealVal,
      isRealSort,
      isRCFNum,
      isBitVecSort,
      isBitVec,
      isBitVecVal,
      // TODO fix ordering
      isFPRMSort,
      isFPRM,
      isFPSort,
      isFP,
      isFPVal,
      isSeqSort,
      isSeq,
      isStringSort,
      isString,
      isArraySort,
      isArray,
      isConstArray,
      isProbe,
      isTactic,
      isGoal,
      isAstVector,
      eqIdentity,
      getVarIndex,
      from,
      solve,
      /////////////
      // Objects //
      /////////////
      Sort: Sort2,
      Function,
      RecFunc,
      Bool: Bool2,
      Int,
      Real,
      RCFNum: RCFNum2,
      BitVec: BitVec2,
      Float,
      FloatRM,
      String: String2,
      Seq: Seq2,
      Re: Re2,
      Array: Array2,
      Set: Set2,
      Datatype: Datatype2,
      ////////////////
      // Operations //
      ////////////////
      If,
      Distinct,
      Const,
      Consts,
      FreshConst,
      Var,
      Implies,
      Iff,
      Eq,
      Xor,
      Not,
      And,
      Or,
      PbEq,
      PbGe,
      PbLe,
      AtMost,
      AtLeast,
      ForAll,
      Exists,
      Lambda,
      ToReal,
      ToInt,
      IsInt,
      Sqrt,
      Cbrt,
      BV2Int,
      Int2BV,
      Concat,
      Cond,
      AndThen,
      OrElse,
      Repeat,
      TryFor,
      When,
      Skip,
      Fail,
      FailIf,
      ParOr,
      ParAndThen,
      With,
      LT,
      GT,
      LE,
      GE,
      ULT,
      UGT,
      ULE,
      UGE,
      SLT,
      SGT,
      SLE,
      SGE,
      Sum,
      Sub,
      Product,
      Div,
      BUDiv,
      Neg,
      Mod,
      Select,
      Store,
      Ext,
      Extract,
      substitute,
      substituteVars,
      substituteFuns,
      updateField,
      simplify,
      /////////////
      // Loading //
      /////////////
      ast_from_string,
      SetUnion,
      SetIntersect,
      SetDifference,
      SetAdd,
      SetDel,
      SetComplement,
      EmptySet,
      FullSet,
      isMember,
      isSubset,
      InRe,
      Union,
      Intersect,
      ReConcat,
      Plus,
      Star,
      Option,
      Complement,
      Diff,
      Range,
      Loop,
      Power,
      AllChar,
      Empty,
      Full,
      mkPartialOrder,
      mkTransitiveClosure,
      polynomialSubresultants
    };
    cleanup.register(ctx, () => Z3.del_context(contextPtr));
    return ctx;
  }
  return {
    enableTrace,
    disableTrace,
    getVersion,
    getVersionString,
    getFullVersion,
    openLog,
    appendLog,
    getParam,
    setParam,
    resetParams,
    Context: createContext
  };
}

// src/solve/protocol.ts
function parseCheckOutput(output) {
  const lines = output.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === "sat" || line === "unsat" || line === "unknown") {
      return line;
    }
  }
  const detail = output.trim();
  throw new Error(`solver produced no check-sat result${detail ? `:
${detail}` : ""}`);
}

// src/solve/worker-client.ts
var WorkerSolveService = class {
  constructor(makeWorker2, wasmModule) {
    this.makeWorker = makeWorker2;
    this.wasmModule = wasmModule;
  }
  worker = null;
  ready = false;
  queue = [];
  inFlight = null;
  nextId = 1;
  inFlightId = 0;
  epoch = 0;
  terminated = false;
  check(script) {
    return new Promise((resolve, reject) => {
      if (this.terminated) {
        reject(new Error("solve service is terminated"));
        return;
      }
      this.queue.push({ kind: "check", script, resolve, reject });
      this.pump();
    });
  }
  query(script, epoch) {
    return new Promise((resolve, reject) => {
      if (this.terminated) {
        reject(new Error("solve service is terminated"));
        return;
      }
      if (epoch !== this.epoch) {
        reject(staleStateError());
        return;
      }
      this.queue.push({ kind: "query", script, epoch, resolve, reject });
      this.pump();
    });
  }
  interrupt() {
    if (this.terminated) {
      return;
    }
    this.epoch++;
    const [queries, checks] = partition(this.queue, (job) => job.kind === "query");
    this.queue = checks;
    for (const q of queries) {
      q.reject(staleStateError());
    }
    const current = this.inFlight;
    if (current === null) {
      return;
    }
    this.inFlight = null;
    if (current.kind === "check") {
      current.resolve({ status: "unknown", output: "interrupted", epoch: -1 });
    } else {
      current.reject(staleStateError());
    }
    this.respawn();
  }
  terminate() {
    if (this.terminated) {
      return;
    }
    this.terminated = true;
    const pending = [...this.queue];
    this.queue = [];
    const current = this.inFlight;
    this.inFlight = null;
    if (current !== null) {
      pending.unshift(current);
    }
    for (const job of pending) {
      job.reject(new Error("solve service is terminated"));
    }
    if (this.worker !== null) {
      this.worker.terminate();
      this.worker = null;
    }
  }
  respawn() {
    if (this.worker !== null) {
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = false;
    this.pump();
  }
  spawn() {
    const worker = this.makeWorker();
    this.worker = worker;
    worker.onmessage = (event) => this.onResponse(worker, event.data);
    worker.onerror = (event) => {
      const err = new Error(`z3 worker failed: ${event.message ?? "unknown error"}`);
      if (this.worker === worker) {
        this.failAll(err);
      }
    };
    this.post(worker, { kind: "init", wasmModule: this.wasmModule });
  }
  post(worker, msg) {
    worker.postMessage(msg);
  }
  onResponse(worker, msg) {
    if (this.worker !== worker) {
      return;
    }
    if (msg.kind === "ready") {
      this.ready = true;
      this.pump();
      return;
    }
    if (msg.id !== this.inFlightId || this.inFlight === null) {
      return;
    }
    const job = this.inFlight;
    this.inFlight = null;
    if (msg.kind === "error") {
      job.reject(new Error(msg.message));
    } else if (job.kind === "check") {
      let status;
      try {
        status = parseCheckOutput(msg.output);
      } catch (err) {
        job.reject(err);
        this.pump();
        return;
      }
      this.epoch++;
      job.resolve({ status, output: msg.output, epoch: this.epoch });
    } else {
      job.resolve(msg.output);
    }
    this.pump();
  }
  failAll(err) {
    const pending = [...this.queue];
    this.queue = [];
    const current = this.inFlight;
    this.inFlight = null;
    if (current !== null) {
      pending.unshift(current);
    }
    for (const job of pending) {
      job.reject(err);
    }
    this.respawn();
  }
  pump() {
    if (this.terminated || this.inFlight !== null || this.queue.length === 0) {
      return;
    }
    if (this.worker === null) {
      this.spawn();
      return;
    }
    if (!this.ready) {
      return;
    }
    const job = this.queue.shift();
    if (job.kind === "query" && job.epoch !== this.epoch) {
      job.reject(staleStateError());
      this.pump();
      return;
    }
    this.inFlight = job;
    this.inFlightId = this.nextId++;
    this.post(this.worker, { kind: job.kind, id: this.inFlightId, script: job.script });
  }
};
function staleStateError() {
  return new Error("solver state is no longer available (a newer check ran, or the solver was interrupted)");
}
function partition(items, pred) {
  const yes = [];
  const no = [];
  for (const item of items) {
    (pred(item) ? yes : no).push(item);
  }
  return [yes, no];
}

// src/solve/local-service.ts
var LocalSolveService = class {
  constructor(Z3) {
    this.Z3 = Z3;
  }
  ctx = null;
  epoch = 0;
  terminated = false;
  async check(script) {
    this.assertLive();
    const output = this.Z3.eval_smtlib2_string(this.freshContext(), script);
    const status = parseCheckOutput(output);
    this.epoch++;
    return { status, output, epoch: this.epoch };
  }
  async query(script, epoch) {
    this.assertLive();
    if (epoch !== this.epoch || this.ctx === null) {
      throw new Error("solver state is no longer available (a newer check ran, or the solver was interrupted)");
    }
    return this.Z3.eval_smtlib2_string(this.ctx, script);
  }
  interrupt() {
    this.epoch++;
  }
  terminate() {
    if (this.terminated) {
      return;
    }
    this.terminated = true;
    if (this.ctx !== null) {
      this.Z3.del_context(this.ctx);
      this.ctx = null;
    }
  }
  freshContext() {
    if (this.ctx !== null) {
      this.Z3.del_context(this.ctx);
    }
    const cfg = this.Z3.mk_config();
    this.ctx = this.Z3.mk_context(cfg);
    this.Z3.del_config(cfg);
    return this.ctx;
  }
  assertLive() {
    if (this.terminated) {
      throw new Error("solve service is terminated");
    }
  }
};

// src/index.ts
async function compileWasm(url) {
  if (globalThis.Z3_WASM_BYTES) {
    return WebAssembly.compile(globalThis.Z3_WASM_BYTES);
  }
  if (typeof WebAssembly.compileStreaming === "function") {
    try {
      return await WebAssembly.compileStreaming(fetch(url));
    } catch {
    }
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return WebAssembly.compile(await response.arrayBuffer());
}
function makeWorker() {
  const url = new URL("./z3-worker.js", globalThis.Z3_SCRIPT_URL);
  if (typeof location === "undefined" || url.origin === location.origin) {
    return new Worker(new URL("./z3-worker.js", globalThis.Z3_SCRIPT_URL), { type: "module" });
  }
  const blob = new Blob([`import ${JSON.stringify(url.href)};`], { type: "text/javascript" });
  return new Worker(URL.createObjectURL(blob), { type: "module" });
}
async function init2() {
  const wasmModule = await compileWasm(new URL("z3-built.wasm", globalThis.Z3_SCRIPT_URL));
  const lowLevel = await init(z3_built_default, {
    instantiateWasm: (imports, done) => {
      WebAssembly.instantiate(wasmModule, imports).then((instance) => done(instance, wasmModule));
      return {};
    }
  });
  const solveService = new WorkerSolveService(makeWorker, wasmModule);
  const highLevel = createApi(lowLevel.Z3, solveService);
  return { ...lowLevel, ...highLevel, terminate: () => solveService.terminate() };
}
globalThis.Z3Init = init2;

