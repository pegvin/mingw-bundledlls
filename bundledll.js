const fs = require("fs");
const path = require("path");
const process = require("process");
const execSync = require('child_process').execSync;

const HELP_MESSAGE = `Usage: ${path.basename(process.argv[1])} [-h] [--copy] [--upx] [--search-dir SEARCH_DIR] executable

positional arguments:
  executable               EXE or DLL file that you need to bundle dependencies for

options:
  -h, --help               Show this help message and exit
  --copy                   Copy the DLLs next to the executable
  --upx                    Run UPX on all the DLLs and EXE (requires --copy).
  --search-dir SEARCH_DIR  Set the directories to search in, splitted by a colons`;

// This blacklist may need extending
const blacklist = [
	"advapi32.dll", "kernel32.dll", "msvcrt.dll", "ole32.dll", "user32.dll",
	"ws2_32.dll", "comdlg32.dll", "gdi32.dll", "imm32.dll", "oleaut32.dll",
	"shell32.dll", "winmm.dll", "winspool.drv", "wldap32.dll",
	"ntdll.dll", "d3d9.dll", "mpr.dll", "crypt32.dll", "dnsapi.dll",
	"shlwapi.dll", "version.dll", "iphlpapi.dll", "msimg32.dll", "setupapi.dll",
	"opengl32.dll", "dwmapi.dll", "uxtheme.dll", "secur32.dll", "gdiplus.dll",
	"usp10.dll", "comctl32.dll", "wsock32.dll", "netapi32.dll", "userenv.dll",
	"avicap32.dll", "avrt.dll", "psapi.dll", "mswsock.dll", "glu32.dll",
	"bcrypt.dll", "rpcrt4.dll", "hid.dll", "dbghelp.dll",
	"d3d11.dll", "dxgi.dll", "dwrite.dll"
]

var OPTIONS = {
	copy: false,
	upx: false,
	searchDir: [`/${process.env.MSYSTEM ? process.env.MSYSTEM.toLowerCase() : 'mingw64'}/bin/`],
	executable: null
}

{
	let argc = process.argv.length;
	let argv = process.argv;
	if (argc <= 2) {
		console.log(HELP_MESSAGE);
		process.exit(0);
	}
	for (i = 2; i < argc; i++) {
		let arg = argv[i];
		if (arg == "-h" || arg == "--help") {
			console.log(HELP_MESSAGE);
			process.exit(0);
		} else if (arg == "--copy") {
			OPTIONS.copy = true;
		} else if (arg == "--upx") {
			OPTIONS.upx = true;
		} else if (arg == "--search-dir" && argv[i + 1]) {
			OPTIONS.searchDir = argv[i + 1].trim().split(':');
			OPTIONS.searchDir.forEach(function (item, i) {
				OPTIONS.searchDir[i] = path.normalize(item).split(path.sep).join(path.posix.sep);
				OPTIONS.searchDir.forEach(function(dir, i) {
					OPTIONS.searchDir[i] = execSync(`cygpath -m ${dir}`, { stdio: 'pipe' }).toString().trim();
				});
			});
			i++;
		} else {
			OPTIONS.executable = path.normalize(argv[i]);
		}
	}
	if (!OPTIONS.executable) {
		console.log("Executable not specified!\n\n", HELP_MESSAGE);
		process.exit(1);
	} else if (OPTIONS.upx && !OPTIONS.copy) {
		console.log("Cannot use UPX compression if --copy isn't enabled!\n\n", HELP_MESSAGE);
		process.exit(1);
	} else if (OPTIONS.upx) {
		try {
			execSync(`upx --version`, { stdio: 'pipe' });
		} catch (e) {
			console.log("UPX compression disabled, failed to get UPX version!");
			OPTIONS.upx = false;
		}
	}
};

console.log("Copy Enabled:", OPTIONS.copy);
console.log("UPX Compression Enabled:", OPTIONS.upx);
console.log("Target Executable:", OPTIONS.executable);
console.log("Search directories:", OPTIONS.searchDir);

function genTmpFileName(ext) {
    return `tmp.${require("crypto").randomBytes(6).readUIntLE(0,6).toString(36)}.${ext}`;
}

function FindDLLPath(filename, searchDirs) {
	for (let i = 0; i < searchDirs.length; i++) {
		let directory = searchDirs[i];
		let dllPath = path.join(directory, filename);
		let dllPathLower = path.join(directory, filename.toLowerCase());
		if (fs.existsSync(dllPath)) {
			console.log(`Found: ${dllPath}`);
			return dllPath;
		} else if (dllPath != dllPathLower && fs.existsSync(dllPathLower)) {
			console.log(`Found: ${dllPathLower}`);
			return dllPathLower;
		}
	}
	console.log(`Can't find "${filename}"`);
}

function GetExecutableDLLs(executable, searchDirs, foundDLLs = []) {
	if (!executable) { return []; }

	let ret = [executable];
	let tmpFileName = genTmpFileName('txt');
	fs.writeFileSync(tmpFileName, '');
	execSync(`objdump -p ${executable} > ${tmpFileName}`, { stdio: 'pipe' });
	let output = fs.readFileSync(tmpFileName);
	fs.rmSync(tmpFileName, { force: true });
	output = output?.toString()?.split("\n");

	output.forEach(function(line) {
		if (!line.startsWith("\tDLL Name: ")) { return; }

		let dllName = line.split("DLL Name: ")[1].trim();
		let dllNameLower = dllName.toLowerCase();

		if (blacklist.includes(dllNameLower) || foundDLLs.includes(dllNameLower)) { return; }

		let dllPath = FindDLLPath(dllName, searchDirs);
		foundDLLs.push(dllNameLower);
		let subDLLs = GetExecutableDLLs(dllPath, searchDirs, foundDLLs);
		ret = [...ret, ...subDLLs];
	});

	return ret;
}

let foundDLLs = GetExecutableDLLs(OPTIONS.executable, OPTIONS.searchDir, []);
let exeIndex = foundDLLs.indexOf(OPTIONS.executable);
if (exeIndex !== -1) foundDLLs.splice(exeIndex, 1);

if (foundDLLs.length > 0) {
	console.log("Found DLLs:");
	foundDLLs.forEach(function(dll) { console.log(' -', dll); });

	if (OPTIONS.copy) {
		foundDLLs.forEach(function(dll) {
			let destPath = path.resolve(path.basename(dll));
			fs.copyFileSync(dll, destPath);
			if (OPTIONS.upx) {
				try { execSync(`upx ${destPath}`, { stdio: 'pipe' }); } catch (e) {}
			}
		});
	}
}
