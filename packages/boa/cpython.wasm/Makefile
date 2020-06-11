CPYTHONWASM_ROOT=$(abspath .)
include Makefile.envs
.PHONY=check

CPYTHONROOT=cpython
CPYTHONLIB=$(CPYTHONROOT)/installs/python-$(PYVERSION)/lib/python$(PYMINOR)

LZ4LIB=lz4/lz4-1.8.3/lib/liblz4.a
CLAPACK=CLAPACK/CLAPACK-WA/lapack_WA.bc

CPYTHONWASM_EMCC=$(CPYTHONWASM_ROOT)/ccache/emcc
CPYTHONWASM_CXX=$(CPYTHONWASM_ROOT)/ccache/em++

SHELL := /bin/bash
CC=emcc
CXX=em++
OPTFLAGS=-O3
CFLAGS=$(OPTFLAGS) -g -I$(PYTHONINCLUDE) -Wno-warn-absolute-paths
CXXFLAGS=$(CFLAGS) -std=c++14


LDFLAGS=\
	-O3 \
	-s MODULARIZE=1 \
	$(CPYTHONROOT)/installs/python-$(PYVERSION)/lib/libpython$(PYMINOR).a \
	$(LZ4LIB) \
	-s "BINARYEN_METHOD='native-wasm'" \
	-s TOTAL_MEMORY=10485760 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s MAIN_MODULE=1 \
	-s EMULATED_FUNCTION_POINTERS=1 \
	-s EMULATE_FUNCTION_POINTER_CASTS=1 \
	-s LINKABLE=1 \
	-s EXPORT_ALL=1 \
	-s EXPORTED_FUNCTIONS='["___cxa_guard_acquire", "__ZNSt3__28ios_base4initEPv"]' \
	-s WASM=1 \
	-s SWAPPABLE_ASM_MODULE=1 \
	-s USE_FREETYPE=1 \
	-s USE_LIBPNG=1 \
	-std=c++14 \
	-L$(wildcard $(CPYTHONROOT)/build/sqlite*/.libs) -lsqlite3 \
	$(wildcard $(CPYTHONROOT)/build/bzip2*/libbz2.a) \
	-lstdc++ \
	--memory-init-file 0 \
	-s "BINARYEN_TRAP_MODE='clamp'" \
	-s TEXTDECODER=0 \
	-s LZ4=1

SIX_ROOT=six/six-1.11.0/build/lib
SIX_LIBS=$(SIX_ROOT)/six.py

JEDI_ROOT=jedi/jedi-0.15.1/jedi
JEDI_LIBS=$(JEDI_ROOT)/__init__.py

PARSO_ROOT=parso/parso-0.5.1/parso
PARSO_LIBS=$(PARSO_ROOT)/__init__.py

SITEPACKAGES=root/lib/python$(PYMINOR)/site-packages

all: check \
	build/cpython.asm.js \
	echo -e "\nSUCCESS!"


build/cpython.asm.js: src/main.bc src/jsimport.bc src/jsproxy.bc src/js2python.bc \
		src/pyimport.bc src/pyproxy.bc src/python2js.bc src/python2js_buffer.bc \
		src/runpython.bc src/hiwire.bc
	[ -d build ] || mkdir build
	$(CXX) -s EXPORT_NAME="'cpython'" -o build/cpython.asm.html $(filter %.bc,$^) \
		$(LDFLAGS) -s FORCE_FILESYSTEM=1
	rm build/cpython.asm.html


env:
	env


clean:
	rm -fr root
	rm -fr build/*
	rm -fr src/*.bc
	make -C packages clean
	make -C six clean
	make -C jedi clean
	make -C parso clean
	make -C lz4 clean
	echo "The Emsdk, CPython and CLAPACK are not cleaned. cd into those directories to do so."


%.bc: %.c $(CPYTHONLIB) $(LZ4LIB)
	$(CC) -o $@ -c $< $(CFLAGS)


$(CPYTHONWASM_EMCC):
	mkdir -p $(CPYTHONWASM_ROOT)/ccache ; \
	if test ! -h $@; then \
		if hash ccache &>/dev/null; then \
			ln -s `which ccache` $@ ; \
		else \
	 		ln -s emsdk/emsdk/emscripten/tag-$(EMSCRIPTEN_VERSION)/emcc $@; \
		fi; \
	fi


$(CPYTHONWASM_CXX):
	mkdir -p $(CPYTHONWASM_ROOT)/ccache ; \
	if test ! -h $@; then \
		if hash ccache &>/dev/null; then \
			ln -s `which ccache` $@ ; \
		else \
			ln -s emsdk/emsdk/emscripten/tag-$(EMSCRIPTEN_VERSION)/em++ $@; \
		fi; \
	fi


$(CPYTHONLIB): emsdk/emsdk/.complete $(PYODIDE_EMCC) $(PYODIDE_CXX)
	make -C $(CPYTHONROOT)


$(LZ4LIB):
	make -C lz4


$(SIX_LIBS): $(CPYTHONLIB)
	make -C six


$(JEDI_LIBS): $(CPYTHONLIB)
	make -C jedi


$(PARSO_LIBS): $(CPYTHONLIB)
	make -C parso


$(CLAPACK): $(CPYTHONLIB)
ifdef CPYTHONWASM_PACKAGES
	echo "Skipping BLAS/LAPACK build due to CPYTHONWASM_PACKAGES being defined."
	echo "Build it manually with make -C CLAPACK if needed."
	mkdir -p CLAPACK/CLAPACK-WA/
	touch $(CLAPACK)
else
	make -C CLAPACK
endif



build/packages.json: $(CLAPACK) FORCE
	make -C packages

emsdk/emsdk/.complete:
	make -C emsdk

FORCE:

check:
	./tools/dependency-check.sh
