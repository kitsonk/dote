#!/bin/sh

node_modules/stylus/bin/stylus --use ./node_modules/nib/lib/nib < src/dote-client/resources/_TopicListItem.styl > src/dote-client/resources/_TopicListItem.css
node_modules/stylus/bin/stylus --use ./node_modules/nib/lib/nib < src/dote-client/resources/TopicList.styl > src/dote-client/resources/TopicList.css
