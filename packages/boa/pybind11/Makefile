ROOT=$(abspath .)
VERSION=2.4.3

BUILD="$(ROOT)/src"
DOWNLOAD_DIR="$(ROOT)/downloads"
ARCHIVE_DIR="$(ROOT)/downloads/pybind11-$(VERSION)"
TARBALL="$(ROOT)/downloads/pybind11-v$(VERSION).tgz"
URL=https://github.com/pybind/pybind11/archive/v$(VERSION).tar.gz

ifeq ($(DISABLE_AUTO_SWITCH),)
	# check the network and switch to corresponding mirror.
  CCODE := $(shell curl https://api.userinfo.io/userinfos | node ../tools/check-network-env.js)
endif
UNAME_S := $(shell uname -s)

ifeq ($(UNAME_S),Linux)
	MD5CMD=md5sum --quiet --check checksums
	DOWNLOAD=wget -O $(TARBALL) $(URL)
endif
ifeq ($(UNAME_S), Darwin)
	DOWNLOAD=curl -L -o $(TARBALL) $(URL)
endif
ifeq ($(CCODE),CN)
	URL=https://pipcook.oss-cn-hangzhou.aliyuncs.com/mirrors/pybind11-$(VERSION).tar.gz
endif

all: pybind11

pybind11: $(BUILD)

$(BUILD):
	rm -rf $(BUILD)
	mkdir -p $(DOWNLOAD_DIR)
	[ -f $(TARBALL) ] || $(DOWNLOAD)
	$(MD5CMD)
	tar -C $(DOWNLOAD_DIR) -xf $(TARBALL)
	mv $(ARCHIVE_DIR) $(BUILD)
	# apply patches
	patch -u -b src/include/pybind11/pytypes.h -i patches/2.4.3-fix-object-destruct.patch

clean:
	rm -rf $(BUILD)
	rm -rf $(DOWNLOAD_DIR)
