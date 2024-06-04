#!/bin/bash

# export and split the `dev` application to target directories

src="dev/js"
dest="app-templates/js"

echo "> cleaning dev application"
rm -Rf "${src}/node_modules"
rm -Rf "${src}/.build"

# ------------------------------------------------------------

echo "> copy dev into app-templates"

# clean dest
rm -Rf $dest
# copy dev to dest
cp -R $src $dest
# remove .soundworks file
rm -f "${dest}/.soundworks"

# ------------------------------------------------------------

echo "> move clients to client-templates/js"

rm -Rf "client-templates/js"
mkdir -p client-templates/js

client="browser-controller"
echo "  + ${client}"
mv "${dest}/src/clients/${client}" "client-templates/js/${client}"

client="browser-default"
echo "  + ${client}"
mv "${dest}/src/clients/${client}" "client-templates/js/${client}"

client="node-default"
echo "  + ${client}"
mv "${dest}/src/clients/${client}" "client-templates/js/${client}"

# ------------------------------------------------------------
