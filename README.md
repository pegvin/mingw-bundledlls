# bundledll.js

[bundledll.js](./bundledll.js) is a JS script based on [mingw-bundledlls](https://github.com/mpreisler/mingw-bundledlls) python script used for copying all the DLLs require by a .exe or a .dll file.

## Features
 - find all dependencies of an EXE or DLL file (recursively)
 - copy all dependencies next to the EXE or DLL
 - optionally compress all the copied dependencies using UPX

## Requirements
 - nodejs
 - objdump in $PATH (Provided by [binutils](https://packages.msys2.org/package/binutils) on msys2)
 - (optional) upx in $PATH (Provided by [upx](https://packages.msys2.org/package/upx) on msys2)

## Usage

```
Usage: bundledll.js [-h] [--copy] [--upx] [--search-dir SEARCH_DIR] executable

positional arguments:
  executable               EXE or DLL file that you need to bundle dependencies for

options:
  -h, --help               Show this help message and exit
  --copy                   Copy the DLLs next to the executable
  --upx                    Run UPX on all the DLLs and EXE (requires --copy).
```

## Paths
the scripts searches all the directories in `$PATH` env variable, which can be modified to add more search directories

---
# Thanks

