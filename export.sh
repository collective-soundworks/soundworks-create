#!/bin/bash

# export and split the `dev` application to target directories

src="dev/js"
dest="app-templates/js"

echo "# cleaning dev application"
rm -Rf "${src}/node_modules"
rm -Rf "${src}/.build"

# ------------------------------------------------------------

echo "# copy dev into app-templates"

# clean dest
rm -Rf $dest
# copy dev to dest
cp -R $src $dest
# remove .soundworks file
rm -f "${dest}/.soundworks"

# ------------------------------------------------------------

echo "# move clients to client-templates/js"

rm -Rf "client-templates/js"
mkdir -p client-templates/js

templates=(
  "browser-controller"
  "browser-default"
  "node-default"
  "node-max"
)

for template in "${templates[@]}"
do
  echo "  + ${template}"
  mv "${dest}/src/clients/${template}.js" "client-templates/js/${template}.js"
done

# max host and proxy templates
mv "${dest}/src/clients/node-max-proxy.js" "client-templates/js/node-max-proxy.js"
mv "${dest}/src/clients/node-max-host.maxpat" "client-templates/js/node-max-host.maxpat"

# ------------------------------------------------------------
