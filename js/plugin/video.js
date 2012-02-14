Parchment.Plugins['Video'] = {
    'type': 'button',
    'attributes_whitelist': {
        'div': {
            'class': /js-item-cage/,
            'rel': /video/,
            'id': /\d+/
        },
        'object': {
            'width': /\d+/,
            'height': /\d+/
        },
        'param': {
            'name': /\.*/,
            'value': /\.*/,
            'site': /\.*/
        },
        'embed': {
            'src': /\.*/,
            'type': /application\/x-shockwave-flash/,
            'allowscriptaccess': /\.*/,
            'allowfullscreen': /\.*/,
            'width': /\d+/,
            'height': /\d+/,
            'wmode': /transparent/,
            'flashvars': /\.*/
        },
        'iframe': {
            'src': /\.*/,
            'frameborder': /\d+/,
            'width': /\d+/,
            'height': /\d+/
        }
    },
    'empty_node_whitelist': {
        'param': function (node) {
            return true;
        },
        'embed': function (node) {
            return true;
        },
        'iframe': function (node) {
            return true;
        }
    },
    'init': function () {

        // don't let the user type in a video cage
        this.parchment.editor.addEvents({
            'keydown': function (event) {
                var userSelection = this.parchment.getSelectionObject(),
                    range = this.parchment.getRangeObject(userSelection),
                    node = range.commonAncestorContainer;

                while (node != this.parchment.editor && node != document) {
                    if (node.nodeType != Node.TEXT_NODE && node.getProperty('rel') == 'video') {
                        if (node.getNext()) {
                            range.setStart(node.getNext(), 0);
                            range.setEnd(node.getNext(), 0);
                            userSelection.removeAllRanges();
                            userSelection.addRange(range);
                        } else {
                            event.stop();
                        }
                        break;
                    }
                    node = node.parentNode;
                }
            }.bind(this)
        });

        this.buildToolbar();
    },
    'callback': function (event) {

        this.openCodePanel();

    },
    'openCodePanel': function (html) {

        this.edit_mode = html ? true : false;

        if (this.pad) {
            this.pad.show();
        } else {
            var str = '<div class="parchment-2-insert">';
            str += '<img src="' + STATIC_URL + 'vine/img/generic/logo-youtube.png" />';
            str += '<img src="' + STATIC_URL + 'vine/img/generic/logo-gametrailers.png" />';
            str += '<img src="' + STATIC_URL + 'vine/img/generic/logo-google.png" />';
            str += '<span class="description">Insert a URL or embed code from our site or any of these services</span>';
            str +=      '<textarea rows="5" cols="80" class="link"></textarea>';

            //Staff only for now:
            if ( window.VINES_USER_PERMISSION ) {
                str +=      '<span class="force-width">Force width 550px <input class="jsForceWidth" type="checkbox" /></span>';
            }

            str +=      '<a class="jsOk btn">Insert</a>';
            str +=  '</div>';

            this.linkPanel = new Element('div', {'html': str}).inject(document.body);

            this.inputField = this.linkPanel.getElement('.link').addEvent('keydown', function (event) {
                if (event.key == "enter") {
                    this.save(event);
                }
            }.bind(this));

            this.linkPanel.getElement('.jsOk').addEvent('click', this.save.bind(this));

            this.pad = new LaunchPad.Base({
                'titleTextStr': "Add a Video",
                'destroy_on_hide': false
            });
            this.pad.insert(this.linkPanel);

            this.pad.addEvent('hideComplete', function () {
                this.inputField.value = '';
            }.bind(this));
        }

        this.inputField.select();

        this.forceWidth = window.VINES_USER_PERMISSION ? this.linkPanel.getElement('.jsForceWidth') : false;

        if (html) {
            this.inputField.value = html;
        }

    },
    'save': function (event) {

        event.stop();

        var text = this.inputField.value,
            videoStr = "",
            videoLink = "",
            flashVars = "",
            w = false,
            h = false,
            whiskey_param = "",
            site = '',
            id;

        if (!text) {
            alert("Whoa, you need to enter something.");
            return;
        }

        // Is this a whiskey embed?
        if ( text.contains(STATIC_URL) ) {
            // find the video id
            match = text.match(/param name="whiskey-video-id" value="([0-9]+)"/);

            if (!match[1]) {
                alert("Whoops, I don't think that is a valid Whiskey Media video url.");
                return;
            }

            id = match[1];
            w = 550;
            h = 360;

            if ( text.contains('www.giantbomb.com') ) {
                site = 'www.giantbomb.com';
            } else if (text.contains('www.animevice.com')) {
                site = 'www.animevice.com';
            } else if (text.contains('www.comicvine.com')) {
                site = 'www.comicvine.com';
            } else if (text.contains('www.tested.com')) {
                site = 'www.tested.com';
            } else if (text.contains('www.screened.com')) {
                site = 'www.screened.com';
            // a way to test locally
            } else if (text.contains(VINES_BASE_URL)) {
                site = VINES_BASE_URL.replace('http://', '').substring(-1);
                site = 'www.' + site.split(':')[0] + '.com';
            }

            flashVars = 'paramsURI=http%3A//'+ site +'/video/params/'+ id +'/?w=1';

            videoLink = 'http://' + site + '/video/video.swf';
            // super hacky way of including the video url that the backend looks for...
            // backend also looks for whiskey-video-id
            whiskey_param = '<param name="whiskey-video-id" value="' + id + '" site="' + STATIC_URL.replace('/static/', '/video/') + '"></param>';

        }

        // WHISKEY MEDIA URL:
        else if ( text.contains(VINES_BASE_URL) || text.contains('www.giantbomb.com') || text.contains('www.animevice.com') || text.contains('www.comicvine.com') || text.contains('www.tested.com') || text.contains('www.screened.com') ) {
            match = text.match(/([0-9]+)\/?([?#].*)*$/);

            if (!match[1]) {
                alert("Whoops, I don't think that is a valid Whiskey Media video url.");
                return;
            }

            id = match[1];
            w = 550;
            h = 360;

            if ( text.contains('www.giantbomb.com') ) {
                site = 'www.giantbomb.com';
            } else if (text.contains('www.animevice.com')) {
                site = 'www.animevice.com';
            } else if (text.contains('www.comicvine.com')) {
                site = 'www.comicvine.com';
            } else if (text.contains('www.tested.com')) {
                site = 'www.tested.com';
            } else if (text.contains('www.screened.com')) {
                site = 'www.screened.com';
            // a way to test locally
            } else if (text.contains(VINES_BASE_URL)) {
                site = VINES_BASE_URL.replace('http://', '').substring(-1);
                site = 'www.' + site.split(':')[0] + '.com';
            }

            flashVars = 'paramsURI=http%3A//'+ site +'/video/params/'+ id +'/?w=1';

            videoLink = 'http://' + site + '/video/video.swf';
            // super hacky way of including the video url that the backend looks for...
            // backend also looks for whiskey-video-id
            whiskey_param = '<param name="whiskey-video-id" value="' + id + '" site="' + STATIC_URL.replace('/static/', '/video/') + '"></param>';

        }

        // if a person just happened to paste the embed code, then use it.
        else if (text.contains('<object') || text.contains('<embed')) {
            videoStr = text;
        }

        // YOUTUBE LINK:
        else if (text.contains('youtube.com') || text.contains('youtu.be')) {
            var ids = text.match(/[A-Za-z0-9_\-]{11}/);
            this.insertIframe('<iframe width="560" height="315" src="http://www.youtube.com/embed/' + ids[0] + '?wmode=opaque" frameborder="0" allowfullscreen></iframe>');
            return;
        }

        // GOOGLE LINK:
        else if (text.contains('video.google.com')) {
            videoLink = text.replace(/videoplay\?docid=/, "googleplayer.swf?docid=");
            w = 425;
            h = 344;
        }

        // GAMETRAILERS LINK:
        else if (text.contains('www.gametrailers.com') ) {
            match = text.match(/([0-9]+)\/?([?#].*)*$/);
            if (!match[1]) {
                alert("Whoops, I don't think that is a valid video url.");
                return;
            }
            id = match[1];
            videoLink = "http://www.gametrailers.com/remote_wrap.php?mid=" + id;
            w = 480;
            h = 392;
        }

        else {
            alert("Sorry, I don't know this video service.");
            return;
        }

        if (videoStr === "") {
            videoStr += '<object width="' + w + '" height="' + h + '">';
            videoStr += '<param name="movie" value="' + videoLink + '"></param>';
            videoStr += '<param name="allowFullScreen" value="true"></param>';
            videoStr += '<param name="allowscriptaccess" value="always"></param>';
            videoStr += '<param name="wmode" value="transparent"></param>';

            videoStr += whiskey_param;

            if (flashVars) {
                videoStr += '<param name="flashvars" value="' + flashVars + '"></param>';
            }

            videoStr += '<embed src="' + videoLink + '" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="' + w + '" height="' + h + '" wmode="transparent"';

            if (flashVars) {
                videoStr += ' flashvars="' + flashVars + '"';
            }

            videoStr += '></embed>';
            videoStr += '</object>';
        }

        // Remove borders or colors.  Youtube allows colored borders around the video... let's remove these.
        // We'd rather LIMIT editors or people from making design choices for the site.
        // Gonna just render the vars useless.
        videoStr = videoStr.replace( new RegExp( 'color=', "gi" ), 'badVar=' );
        videoStr = videoStr.replace( new RegExp( 'color1=', "gi" ), 'badVar=' );
        videoStr = videoStr.replace( new RegExp( 'color2=', "gi" ), 'badVar=' );
        videoStr = videoStr.replace( new RegExp( 'border=', "gi" ), 'badVar=' );

        this.insertVideo(videoStr);
    },

    'insertIframe': function (text) {

        // pull out source
        src = text.match(/src\s*=\s*['"](.[^'"]*)['"]/i)[1];
        width = (text.match(/width\s*=\s*['"](\d+)['"]/i) || [null, 560])[1];
        height = (text.match(/height\s*=\s*['"](\d+)['"]/i) || [null, 349])[1];

        this.insertVideo('<iframe src="' + src + '" width="' + width + '" height="' + height + '" frameborder="0" allowfullscreen></iframe>');

    },

    'insertVideo': function (videoStr) {

        // Force Width?
        // Was the force width box checked?  If so then the user wants to make sure the width is Whiskey
        // standard of 550px.  This is useful for video embeds from other sites that we want to format
        // in our size ( Makes the news page look nicer )
        if (this.forceWidth && this.forceWidth.checked === true) {
            // get width and height from the videoStr
            if (videoStr.contains('width="')) {
                var w = videoStr.split('width="')[1].split('"')[0].toInt(),
                    h = videoStr.split('height="')[1].split('"')[0].toInt();

                // If width is already 550 then ignore:
                if (w != 550) {
                    var newH = ((550 * h) / w).toInt();

                    if (videoStr.contains('width="' + w + 'px"')) {
                        videoStr = videoStr.replace( new RegExp( 'width="' + w + 'px"', "gi" ), 'width="550px"' );
                        videoStr = videoStr.replace( new RegExp( 'height="' + h + 'px"', "gi" ), 'height="' + newH + 'px"' );
                    }

                    // Without px specified
                    if (videoStr.contains('width="' + w + '"')) {
                        videoStr = videoStr.replace( new RegExp( 'width="' + w + '"', "gi" ), 'width="550px"' );
                        videoStr = videoStr.replace( new RegExp( 'height="' + h + '"', "gi" ), 'height="' + newH + 'px"' );
                    }
                }
            } else {
                alert('The string provided did not contain a width attribute. :(');
            }
        }

        // need P's before and after cage or Chrome with duplicate the embed and add brs for some reason
        videoStr = '<p>&nbsp;</p><div class="js-item-cage" rel="video">' + videoStr + '</div><span></span>';

        this.pad.hide();

        // If you're editing, remove old video before inserting new one
        if (this.edit_mode) {
            var cage = this.toolbar.toolbar.retrieve('cage'),
                userSelection = this.parchment.getSelectionObject(),
                range = this.parchment.getRangeObject(userSelection);

            range.setStartAfter(cage);
            range.setEndAfter(cage);

            userSelection.removeAllRanges();
            userSelection.addRange(range);

            this.parchment.saveSelection();

            cage.destroy();
        }

        this.parchment.insertCage(videoStr);
    },

    'buildToolbar': function () {

        this.toolbar = new Parchment.Utils.Toolbar(this.parchment.editor, {
            'class': 'video',
            'relay': '.js-item-cage[rel="video"]',
            'display': {
                'position': [
                    {'command': 'moveup', 'text': 'U'},
                    {'command': 'movedown', 'text': 'D'}
                ],
                'edit': [
                    {'command': 'edit', 'text': 'change'},
                    {'command': 'delete', 'text': 'delete'}

                ]
            }
        });

        this.toolbar.addEvents({
            'command': this.videoCommand.bind(this)
        });

    },
    'videoCommand': function (command) {
        switch (command) {
            case 'edit':
                this.openCodePanel(this.toolbar.toolbar.retrieve('cage').get('html'));
                break;
            case 'delete':
                this.toolbar.toolbar.retrieve('cage').destroy();
                this.toolbar.toolbar.removeClass('on');
                break;
            case 'moveup':
            case 'movedown':
                this.reposition(this.toolbar.toolbar.retrieve('cage'), command);
                break;
            default:
                break;
        }
    },
    'reposition': function (cage, position) {

        var position_el = cage.getFirst(),
            size_el = position_el.getFirst(),
            target;

        if (position == 'moveup' && cage.getPrevious()) {

            target = cage.getPrevious();

            // move above headers
            while (target.tagName.test(/^h\d$/i) && target.getPrevious()) {
                target = target.getPrevious();
            }

            // if the first element is a header, move back down
            if (target.tagName.test(/^h\d$/i)) {
                while (target.tagName.test(/^h\d$/i) && target.getNext()) {
                    target = target.getNext();
                }
            }

            cage.inject(target, 'before');

        } else if (position == 'movedown' && cage.getNext()) {

            target = cage.getNext();

            // move below headers
            while (target.getNext() && target.getNext().tagName.test(/^h\d$/i)) {
                target = target.getNext();
            }

            cage.inject(target, 'after');

        }
        this.toolbar.setPosition(cage);
    }
};
