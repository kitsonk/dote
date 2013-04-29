# dote #

A topic based voting system for open collaboration.

## Requirements ##

**dote** depends on the following projects:

* [express][express] - HTTP Server Framework
* [jade][jade] - HTML Templating
* [Stylus][stylus] - CSS Templating
* [Nib][nib] - CSS3 Enhancements for Stylus
* [Font-Awesome][fontawesome] - Font Based Icons
* [Dojo Toolkit][dojo] - JavaScript Framework
* [setten][setten] - Dojo-style Modules for Node
* [ComposeJS][composejs] - JavaScript Object Composition
* [Persevere][perstore] - Storage Abstraction Layer
* [Moment.js][momentjs] - Date Handling (including humanisation)
* [marked][marked] - markdown Parser
* [Highlight.js][hljs] - Code Block Highlighting
* [emailjs][emailjs] - NodeJS STMP Client
* [node-imap][nodeimap] - NodeJS IMAP Client
* [mailparser][mailparser] - Mail Parsing Library
* [node-mongodb-native][nodemongodb] - Node Native MongoDB Library
* [juice][juice] - Inlining CSS into HTML
* [ldapauth][ldapauth] - LDAP Authorisation
* [colors][colors] - Node Console Colors
* [MongoDB][mongodb] - Persistent Document Store

You will need [git][git] and [NodeJS][nodejs] including ``npm`` to properly install **dote**.  **dote** has been tested 
on NodeJS 0.8.4 - 0.8.15 and 0.10.5.

## Installation ##

* Install [MongoDB][mongodb] and have available.
* Clone the repository recursively with ``git``:

    ```bash
    $ git clone --recursive https://github.com/kitsonk/dote.git
    ```

* Install NodeJS dependencies with ``npm``:

    ```bash
    $ cd dote
    $ npm install
    ```

* Edit the ``config.json`` in the root directory.
* Set the passwords in the environment:

    ```bash
    $ export DOTE_LDAP_PWD="password"
    $ export DOTE_MAIL_PWD="password"
    ```

* Start the server:

    ```bash
    $ node server
    ```

* Start the worker:

    ```bash
    $ node worker
    ```

### Optimised Client Build ###

dote allows you to utilise the Dojo Builder to optimise the client side JavaScript that is used.  In order to utilise 
the optimised build, run the [builder][dojobuilder] (which is not included):

```bash
$ path/to/dtk/util/buildScripts/build.sh --profile dote.profile.js
```

This will output an optimised build to ``./lib/``.  Then you need to point the instance at it by changing the ``base``
parameter in the ``config.json`` file:

```json
{
    "base": "lib"
}
```

And changing the ``_static/css/dote.styl`` to point at the optimised CSS:

```css
@import url("../../lib/dote-client/resources/client.css")
```

### Notes ###

* dote respects the NODE_ENV and maps this appropriately to the configuration file, defaulting to `development`.
* While the LDAP and mail password can be set in the ``config.json`` but they will be overridden by any environment
  variable.  You generally shouldn't store clear text passwords in static files.
* There are 3 types of authentication support (`auth` in the configuration).  There is `default` which simply means all
  passwords are set to "password", there is `internal` which stores passwords as a SHA512 digest with an added salt
  string and there is `ldap` which hands off authentication to the LDAP server configured in the files.
* If using the internal password/authorization instead of LDAP, you should set the `NODE_SALT` environment variable to
  an appropriate salt.  If not provided, the salt for the passwords defaults to the one stored in plain text in the
  code, which isn't advised.  Of course if you change, or lose the salt for your environment, no passwords digest
  properly, which means no one will be able to log in.

[volo]: http://volojs.org/
[cpm]: https://github.com/kriszyp/cpm/
[nodejs]: http://nodejs.org/download/
[dojo]: http://dojotoolkit.org/download/
[express]: http://expressjs.com/
[jade]: http://jade-lang.com/
[git]: http://git-scm.com/
[setten]: https://github.com/kitsonk/setten
[perstore]: https://github.com/persvr/perstore
[fontawesome]: http://fortawesome.github.com/Font-Awesome/
[momentjs]: http://momentjs.com/
[composejs]: https://github.com/kriszyp/compose
[stylus]: http://learnboost.github.com/stylus/
[nib]: http://visionmedia.github.com/nib/
[marked]: https://github.com/chjj/marked
[hljs]: http://softwaremaniacs.org/soft/highlight/en/
[emailjs]: https://github.com/eleith/emailjs
[nodeimap]: https://github.com/mscdex/node-imap
[mailparser]: https://github.com/andris9/mailparser
[juice]: https://github.com/LearnBoost/juice
[mongodb]: http://www.mongodb.org/
[nodemongodb]: https://github.com/mongodb/node-mongodb-native
[colors]: https://github.com/Marak/colors.js
[dojobuilder]: http://dojotoolkit.org/download/
[ldapauth]: https://github.com/trentm/node-ldapauth
