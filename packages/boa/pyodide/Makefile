ROOT=$(abspath .)
VERSION = 0.15.0

BUILD=$(ROOT)/build/$(VERSION)/pyodide-$(VERSION)
TARBALL=$(ROOT)/downloads/pyodide-$(VERSION).tgz
URL=https://github.com/iodide-project/pyodide/archive/$(VERSION).tar.gz

all: $(BUILD)

$(BUILD): $(TARBALL)
	[ -d $(BUILD) ] || (mkdir -p $(dir $(BUILD)); tar -C $(dir $(BUILD)) -xf $(TARBALL))
	( \
		cd $(BUILD) && \
		make \
	)

$(TARBALL):
	[ -d $(ROOT)/downloads ] || mkdir $(ROOT)/downloads
	wget -q -O $@ $(URL)
	md5sum --quiet --check checksums || (rm $@; false)
