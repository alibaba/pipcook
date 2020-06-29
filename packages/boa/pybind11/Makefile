ROOT=$(abspath .)
VERSION=2.4.3

BUILD=$(ROOT)/src/
ARCHIVE_DIR=$(BUILD)pybind11-$(VERSION)
TARBALL=$(ROOT)/downloads/pybind11-v$(VERSION).tgz
URL=https://github.com/pybind/pybind11/archive/v$(VERSION).tar.gz
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
MD5CMD=md5sum --quiet --check checksums
endif
ifeq ($(UNAME_S),Darwin)
# MD5CMD=;md5 -q $(ROOT) `cat checksums | awk '{print \$2}'`
endif

all: $(BUILD)

$(BUILD): $(TARBALL)
	[ -d $(BUILD) ] || (mkdir -p $(dir $(BUILD));\
	tar -C $(dir $(BUILD)) -xf $(TARBALL); mv $(ARCHIVE_DIR)/* $(BUILD); rm -r $(ARCHIVE_DIR))

$(TARBALL):
	[ -d $(ROOT)/downloads ] || mkdir $(ROOT)/downloads
	wget -q -O $@ $(URL)
	$(MD5CMD)