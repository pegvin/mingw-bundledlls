# mingw-bundledlls
A convenient Python3 script that copies all dependency DLLs next to the executable. Suitable for creating a ready-to-go application bundle for Windows. The script assumes Fedora 21 mingw32 install paths, but that is easy to change.

## Features
 - find all dependencies of an EXE or DLL file (recursively)
 - copy all dependencies next to the EXE or DLL
 - (optional) run UPX on all the copied dependencies and the EXE

## Requirements
 - python3 or python2
 - objdump in $PATH
 - (optional) upx in $PATH

## Usage

```
usage: mingw-bundledlls [-h] [--copy] [--search-dir SEARCH_DIR] [--upx] executable

positional arguments:
  executable            EXE or DLL file that you need to bundle dependencies for

options:
  -h, --help               show this help message and exit
  --copy                   In addition to printing out the dependencies, also copy them next to the executable
  --search-dir SEARCH_DIR  Set the directories to search in, splitted by a colons
  --upx                    Only valid if --copy is provided. Run UPX on all the DLLs and EXE.
```

---
# Thanks

