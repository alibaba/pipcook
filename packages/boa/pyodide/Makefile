ROOT=$(abspath .)
VERSION = 0.15.0

VERSION_DIR="$(ROOT)/build/$(VERSION)"
BUILD="$(VERSION_DIR)/pyodide-$(VERSION)"
TARBALL="$(ROOT)/downloads/pyodide-$(VERSION).tgz"
URL=https://github.com/iodide-project/pyodide/archive/$(VERSION).tar.gz

all: $(BUILD)

$(BUILD): $(TARBALL)
	[ -d $(BUILD) ] || (mkdir -p $(VERSION_DIR); tar -C $(VERSION_DIR) -xf $(TARBALL))
	( \
		cd $(BUILD) && \
		make \
	)

$(TARBALL):
	[ -d "$(ROOT)/downloads" ] || mkdir "$(ROOT)/downloads"
	wget -q -O $(TARBALL) $(URL)
	md5sum --quiet --check checksums || (rm $(TARBALL); false)
