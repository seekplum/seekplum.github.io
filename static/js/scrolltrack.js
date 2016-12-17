/*
 * Name: scrollTrack
 *
 * Description: Scroll Navigator Tracking, Monitoring and Fixed
 * Author: Gary Meng
 * Website: http://www.awaimai.com/
 */

(function ($) {
    $.fn.scrollTrack = function (options) {
        return this.each(function () {

            var defaults = {
                contentClass: '.content',	// content to track
                title: 'h2,h3',			// title of <li>
//		vertical: '50%',			// vertical align, can be middle，top，bottom
//		top: 0,				// distance from top when fixed
                zIndex: 0,			// z-index
                end: null,			// stop fixed on this meet end
                extraClass: 'scrolltrack'		// add class after fixed
            };
            var opts = $.extend({}, defaults, options);

            // init valiable
            var obj = $(this),
                base = this,
                objTop = 0,
                endTop = 0,
                docTop = 0,
                docLeft = 0,
                miss = 0,
                position = 0,
                text = '',
                itemTop = 0,
                items = $(opts.contentClass).find('.item'),
                end = $(opts.end);

            // distance between page top and jQuery object
            objTop = obj.offset().top;

            // if obj does't exit, do nothing
            if (obj.length <= 0) {
                return;
            }

            /*
             * Add a sub DOM to obj
             */
            function navigator() {
                var ul = null, li = null;
                ul = $('<ul>').appendTo(base);

                items.each(function (i) {
                    var $this = $(this);

                    // get title from first children element
                    text = $this.children(opts.title).eq(0).text();

                    // insert <li><span>text</span></li> to ul
                    li = $('<li>').appendTo(ul).append($('<span>').text(text));

                    // jump to item on click
                    li.click(function () {
                        position = $this.offset().top;
                        $("html,body").animate({scrollTop: position}, 0);
                    });
                });
            }

            /*
             * Linehight obj element when scroll to relation box
             */
            function track() {
                var current = 0;
                docTop = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
                items.each(function (i) {
                    itemTop = $(this).offset().top;
                    if (docTop > (itemTop - 100)) {
                        current = i;
                    } else {
                        return false;
                    }
                });

                obj.find(".current").removeClass("current");
                obj.find("li").eq(current).addClass("current");
            }

            /*
             * Fix obj in the half of browser when scroll
             */
            function fixed() {
                // distance between page top and browser top
                docTop = Math.max(document.body.scrollTop, document.documentElement.scrollTop);

                // distance between page left and browser left
                docLeft = Math.max(document.body.scrollLeft, document.documentElement.scrollLeft);

                // half height of the obj
                var halfObjHeight = parseInt(base.scrollHeight / 2);

                // half height of the browser
                var halfBrowserHeight = parseInt($(window).height() / 2);

                // if has end element
                if (end.length > 0) {
                    // top between end element and page top
                    endTop = end.offset().top;

                    // difference between end element top and obj bottom
                    miss = docTop + halfBrowserHeight + halfObjHeight - endTop;
                }

                // margin-top of the obj, use when fix scroll
                var marginTop = (miss > 0) ? (halfObjHeight + miss) : halfObjHeight;

                // fixed when obj midline coincide with browser midline
                if ((objTop - docTop) + halfObjHeight < halfBrowserHeight) {
                    obj.addClass(opts.extraClass).css({
                        "position": "fixed",
                        "top": "50%",
                        "margin-top": "-" + marginTop + "px",
                        "margin-left": "-" + docLeft + "px",
                        "z-index": opts.zIndex
                    });
                } else {
                    obj.addClass(opts.extraClass).css({
                        "position": "static",
                        "margin-top": "0",
                        "margin-left": "0"
                    });
                }
            }

            navigator();
            track();
            $(window).on("scroll resize", function () {
                track();
                fixed();
            });

        });
    };
})(jQuery);