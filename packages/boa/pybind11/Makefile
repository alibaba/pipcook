ROOT=$(abspath .)
VERSION=2.4.3

BUILD="$(ROOT)/src"
DOWNLOAD_DIR="$(ROOT)/downloads"
ARCHIVE_DIR="$(ROOT)/downloads/pybind11-$(VERSION)"
TARBALL="$(ROOT)/downloads/pybind11-v$(VERSION).tgz"
URL=https://github.com/pybind/pybind11/archive/v$(VERSION).tar.gz

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	MD5CMD=md5sum --quiet --check checksums
	DOWNLOAD=wget -O $(TARBALL) $(URL)
endif
ifeq ($(UNAME_S), Darwin)
	DOWNLOAD=curl -L -o $(TARBALL) $(URL)
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

clean:
	rm -rf $(BUILD)
	rm -rf $(DOWNLOAD_DIR)
